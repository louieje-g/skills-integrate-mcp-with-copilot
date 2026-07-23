# Mergington High School Activities API

A super simple FastAPI application that allows students to view extracurricular activities and teachers to manage registrations.

## Features

- View all available extracurricular activities
- Teacher login/logout for admin mode
- Register students for activities (teacher only)
- Unregister students from activities (teacher only)

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/login`                                                     | Teacher login (returns auth token)                                 |
| POST   | `/auth/logout`                                                    | Teacher logout                                                      |
| GET    | `/auth/status`                                                    | Check if current token is authenticated                             |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student for an activity (teacher only)                  |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student from an activity (teacher only)           |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

## Teacher Credentials

Teacher usernames and passwords are stored in `teachers.json`.

Example format:

```json
{
   "teacher1": "mergington123",
   "coach.smith": "soccer2026"
}
```

All activity and auth session data is stored in memory, which means it will be reset when the server restarts.
