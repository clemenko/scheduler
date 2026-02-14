# Scheduler

This is a web application for a volunteer fire department to help with scheduling personnel and equipment.

## How to run the application

1.  **Start the backend server:**
    ```bash
    cd backend
    npm install
    npm start
    ```

2.  **Start the frontend server:**
    ```bash
    cd frontend
    npm install
    npm start
    ```

3.  **Open the application in your browser:**
    [http://localhost:3000](http://localhost:3000)

## Admin Credentials

*   **Email:** admin@example.com
*   **Password:** Pa22word

**Note:** You will need to create an admin user in the database manually.

## Sending Reminders

To send email reminders for upcoming events, you can set up a cron job to call the following endpoint:

```
POST /api/schedule/send-reminders
```


ff1@
ff2@
