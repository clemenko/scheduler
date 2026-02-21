# Todo — WAVFD Scheduler

- [x] Email capability — `sendEmail` util wired to SMTP via nodemailer (falls back to console.log when SMTP not configured)
- [x] Weekly reminder — node-cron job runs Sunday 8 PM, emails users their upcoming week's shifts
