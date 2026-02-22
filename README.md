# Scheduler

A web application for volunteer fire departments to schedule personnel and equipment.

## Quick Start

```bash
docker compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Default Admin Credentials

- **Email:** `admin@wavfd.org`
- **Password:** `Pa22word`

These are set via environment variables and should be changed for production.

## Configuration

All configuration is done through environment variables in `docker-compose.yml` or a `.env` file.

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://wavfd_sched_mongo:27017/scheduler` | MongoDB connection string |
| `ADMIN_EMAIL` | `admin@wavfd.org` | Admin account email (created/updated on startup) |
| `ADMIN_PASSWORD` | `Pa22word` | Admin account password |
| `CALENDAR_TITLE` | `Demo WAVFD Scheduler` | Title displayed in the app header |
| `JWT_SECRET` | `your_super_secret_jwt_secret_change_me` | Secret used to sign JWT tokens. **Change this in production.** |

### Email (SMTP)

Configure either generic SMTP or Gmail. If `GMAIL_USER` is set, Gmail takes precedence.

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | *(empty)* | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | *(empty)* | SMTP username |
| `SMTP_PASS` | *(empty)* | SMTP password |
| `SMTP_FROM` | `noreply@wavfd.org` | From address for outgoing emails |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `true` | Set to `false` to allow self-signed TLS certs |
| `GMAIL_USER` | *(empty)* | Gmail address (uses Gmail SMTP when set) |
| `GMAIL_APP_PASSWORD` | *(empty)* | Gmail app password |

### Traefik Labels

The compose file includes Traefik reverse proxy labels for HTTPS. Update or remove these for your environment:

- `traefik.http.routers.wavfdshed.rule` — routing rule (default: `Host(\`sched.wavfd.org\`)`)
- `traefik.http.routers.wavfdshed.entrypoints` — entrypoint (default: `https`)
- `traefik.http.routers.wavfdshed.tls.certresolver` — TLS cert resolver
- `traefik.http.routers.wavfdshed.middlewares` — middleware chain

## Health Checks

Both services include health checks:

- **App:** `GET /api/health` returns `{ "status": "ok" }` (200) or `{ "status": "error" }` (503)
- **MongoDB:** `mongosh --eval "db.runCommand('ping')"`

The app container waits for MongoDB to be healthy before starting.

## Architecture

- **Next.js** app with API routes (standalone output for minimal Docker image)
- **MongoDB 8** for data storage
- **Background worker** for scheduled email reminders (daily at 6 AM, weekly on Sundays at 8 PM)
