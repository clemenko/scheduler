# Todo — WAVFD Scheduler

## Features (from original todo)
- [ ] Splash/landing page — public-facing landing page before login
- [ ] Recurring events UI — backend is implemented; verify frontend ShiftFormModal covers all recurrence options (daysOfWeek, dayOfMonth, never/on_date/after_occurrences)
- [ ] Signup log — audit trail of who signed up/cancelled and when
- [ ] Monthly report — exportable report of shifts, signups, and vehicle usage per month
- [ ] Mobile responsiveness — review and fix layout on small screens (AppBar menu, Calendar, modals)
- [ ] Email capability — `sendEmail` util and `/send-reminders` route exist; query fixed, still needs SMTP config wired up

## Security
- [ ] Hardcoded secrets in docker-compose — `ADMIN_PASSWORD` and `JWT_SECRET` should use an env file or secrets
- [ ] Open registration — anyone can create an account; add admin approval workflow or invite-only registration
- [ ] No rate limiting on `/api/auth` routes — add rate limiting to prevent brute force
- [ ] No user self-service password change — users can only have passwords reset by admin; add a self-change-password endpoint

## UX / Feature Gaps
- [ ] Calendar past-shift view — `validRange` restricts to future 12 months only; add option to view historical shifts
- [ ] Recurring shift edit flow — editing a recurring shift returns an error; UI should detect this and offer "Edit Series" automatically
- [ ] Admin: delete admin user restriction — backend blocks deleting admins; make sure UI surfaces a clear error message
- [ ] User role options — only `admin` / `viewer` roles exist; consider adding a `member` role for regular volunteers

## Testing
- [ ] Backend tests — `backend/tests/` directory exists but coverage is unknown; write tests for auth, shifts, schedule, and users routes
- [ ] Frontend tests — only `Calendar.test.js` exists; add tests for ShiftModal, UserManagement, Admin, and ShiftFormModal
- [ ] CI pipeline — no CI config found; add GitHub Actions or similar to run tests on push

## Infrastructure / Ops
- [ ] Mongo volume — `docker-compose.yml` has a commented-out host-mount volume; decide on volume strategy for production
- [ ] Environment variable documentation — document all required env vars (`JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CALENDAR_TITLE`, SMTP config)
- [ ] Production build — verify frontend Dockerfile uses `npm run build` (not dev server)
