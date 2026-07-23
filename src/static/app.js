document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const userMenuButton = document.getElementById("user-menu-button");
  const authMenu = document.getElementById("auth-menu");
  const authStatus = document.getElementById("auth-status");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const cancelLoginButton = document.getElementById("cancel-login");
  const signupHint = document.getElementById("signup-hint");

  let authToken = localStorage.getItem("teacherAuthToken") || "";
  let teacherUsername = localStorage.getItem("teacherUsername") || "";
  let isTeacherAuthenticated = false;

  function setMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function getAuthHeaders() {
    return authToken ? { "X-Auth-Token": authToken } : {};
  }

  function updateAuthUi() {
    if (isTeacherAuthenticated) {
      authStatus.textContent = `Logged in as ${teacherUsername}`;
      loginButton.classList.add("hidden");
      logoutButton.classList.remove("hidden");
      signupHint.textContent = "Teacher mode enabled. You can register or unregister students.";
      signupForm.querySelectorAll("input, select, button").forEach((el) => {
        el.disabled = false;
      });
    } else {
      authStatus.textContent = "Student view";
      loginButton.classList.remove("hidden");
      logoutButton.classList.add("hidden");
      signupHint.textContent = "Please log in as a teacher to register or unregister students.";
      signupForm.querySelectorAll("input, select, button").forEach((el) => {
        el.disabled = true;
      });
    }
  }

  function closeAuthMenu() {
    authMenu.classList.add("hidden");
  }

  function showLoginModal() {
    loginModal.classList.remove("hidden");
  }

  function closeLoginModal() {
    loginModal.classList.add("hidden");
    loginForm.reset();
  }

  async function fetchAuthStatus() {
    if (!authToken) {
      isTeacherAuthenticated = false;
      teacherUsername = "";
      updateAuthUi();
      return;
    }

    try {
      const response = await fetch("/auth/status", {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (result.authenticated) {
        isTeacherAuthenticated = true;
        teacherUsername = result.username;
        localStorage.setItem("teacherAuthToken", authToken);
        localStorage.setItem("teacherUsername", teacherUsername);
      } else {
        authToken = "";
        teacherUsername = "";
        isTeacherAuthenticated = false;
        localStorage.removeItem("teacherAuthToken");
        localStorage.removeItem("teacherUsername");
      }
    } catch (error) {
      authToken = "";
      teacherUsername = "";
      isTeacherAuthenticated = false;
      localStorage.removeItem("teacherAuthToken");
      localStorage.removeItem("teacherUsername");
    }

    updateAuthUi();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML =
        '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isTeacherAuthenticated
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!isTeacherAuthenticated) {
      setMessage("Teacher login required to unregister students.", "error");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred", "error");

        if (response.status === 401) {
          authToken = "";
          teacherUsername = "";
          isTeacherAuthenticated = false;
          localStorage.removeItem("teacherAuthToken");
          localStorage.removeItem("teacherUsername");
          updateAuthUi();
          fetchActivities();
        }
      }
    } catch (error) {
      setMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isTeacherAuthenticated) {
      setMessage("Teacher login required to register students.", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred", "error");

        if (response.status === 401) {
          authToken = "";
          teacherUsername = "";
          isTeacherAuthenticated = false;
          localStorage.removeItem("teacherAuthToken");
          localStorage.removeItem("teacherUsername");
          updateAuthUi();
          fetchActivities();
        }
      }
    } catch (error) {
      setMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  userMenuButton.addEventListener("click", () => {
    authMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!document.getElementById("auth-controls").contains(event.target)) {
      closeAuthMenu();
    }
  });

  loginButton.addEventListener("click", () => {
    closeAuthMenu();
    showLoginModal();
  });

  cancelLoginButton.addEventListener("click", closeLoginModal);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.detail || "Login failed", "error");
        return;
      }

      authToken = result.token;
      teacherUsername = result.username;
      isTeacherAuthenticated = true;
      localStorage.setItem("teacherAuthToken", authToken);
      localStorage.setItem("teacherUsername", teacherUsername);

      updateAuthUi();
      closeLoginModal();
      setMessage(`Welcome, ${teacherUsername}.`, "success");
      fetchActivities();
    } catch (error) {
      setMessage("Login failed. Please try again.", "error");
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      // Ignore logout network failures and clear local state.
    }

    authToken = "";
    teacherUsername = "";
    isTeacherAuthenticated = false;
    localStorage.removeItem("teacherAuthToken");
    localStorage.removeItem("teacherUsername");
    updateAuthUi();
    closeAuthMenu();
    setMessage("Logged out.", "info");
    fetchActivities();
  });

  // Initialize app
  fetchAuthStatus().then(fetchActivities);
});
