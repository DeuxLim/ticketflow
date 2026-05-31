# Free-Platform Deployment Plan

This runbook is the current lowest-cost deployment shape for Ticketing:

- Frontend: Vercel Hobby
- Backend API: Render free web service
- Database: Neon free Postgres

This setup is acceptable for demos, portfolio use, and low-traffic personal testing. It is not a strong production setup for a real team because free services can sleep, throttle, or change limits.

## Current Live Deployment

- Frontend: `https://ticketflow-frontend-flax.vercel.app`
- Backend health: `https://ticketflow-api-rut0.onrender.com/api/health`
- Backend base URL: `https://ticketflow-api-rut0.onrender.com/api`

The current live environment uses a manually bootstrapped initial platform-admin account instead of demo seed data. Rotate the temporary bootstrap password before sharing the deployment widely.

## Architecture

- The frontend is a static Vite build deployed from `frontend/`.
- The backend is the Laravel API in `backend/`.
- The frontend talks to the backend with bearer tokens through `VITE_API_URL`.
- The backend uses Postgres in hosted environments. Do not deploy production-like environments on SQLite.
- For free hosting, set `QUEUE_CONNECTION=sync` to avoid needing a separate always-on worker service.

## Production Prep Already Added

- Public self-registration is disabled by default.
- Login and registration endpoints are rate-limited.
- Backend CORS is origin-scoped through `CORS_ALLOWED_ORIGINS`.
- The frontend has a Vercel SPA rewrite so deep links do not 404.
- Backend health is available at `/api/health`.

## Environment Files

- Backend template: `backend/.env.production.example`
- Frontend template: `frontend/.env.production.example`

## Backend on Render

Create a free Render web service connected to this repository.

Because this repo is a monorepo with the Vite frontend at the root and Laravel in `backend/`, the most reliable free-host setup is to deploy the backend as a Docker web service from `backend/`.

Recommended settings:

- Root directory: `backend`
- Environment: `Docker`
- Dockerfile path: `./Dockerfile`

- Health check path:

```text
/api/health
```

The Docker image already:

- installs PHP 8.2 with `pdo_pgsql`, `mbstring`, and `bcmath`
- runs `composer install --no-dev --optimize-autoloader`
- clears Laravel cached config/routes/views
- runs `php artisan migrate --force` before starting the app
- starts Laravel on `0.0.0.0:$PORT`

Minimum backend environment values:

```text
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-render-service.onrender.com
DB_CONNECTION=pgsql
DB_HOST=...
DB_PORT=5432
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
DB_SSLMODE=require
QUEUE_CONNECTION=sync
SESSION_SECURE_COOKIE=true
SANCTUM_TOKEN_PREFIX=tkt_
CORS_ALLOWED_ORIGINS=https://your-vercel-project.vercel.app
AUTH_ALLOW_PUBLIC_REGISTRATION=false
AUTH_LOGIN_RATE_LIMIT_PER_MINUTE=5
AUTH_REGISTER_RATE_LIMIT_PER_MINUTE=3
```

## Database on Neon

Create a free Neon Postgres project and copy the connection details into the backend Render service.

Use SSL:

```text
DB_SSLMODE=require
```

## Frontend on Vercel

Create a Vercel project from the `frontend/` directory.

Recommended settings:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command:

```bash
npm run build
```

- Output directory:

```text
dist
```

Frontend environment:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

`frontend/vercel.json` is already configured to:

- rewrite all routes to `index.html`
- add basic browser security headers

## Release Checklist

Before deployment:

```bash
cd backend && composer test
cd frontend && npm run lint && npm run build && npm run test
ruby -e 'require "yaml"; YAML.load_file("docs/project-state.yaml"); puts "project-state.yaml OK"'
```

After deployment:

1. Open the Vercel frontend URL.
2. Confirm login works.
3. Confirm the app loads the workspace list.
4. Confirm workspace overview, customers, tickets, members, invitations, settings, and admin all load.
5. Confirm direct deep links like `/auth/login` and `/workspaces/demo-workspace/tickets/1` do not 404.
6. Confirm the backend health endpoint returns `{"status":"ok"}`.

## Hosted Smoke Check (Repeatable)

Run this checklist after deploys and during incident triage.

Preferred command from repo root:

```bash
./scripts/hosted-smoke-check.sh
```

Optional overrides for unstable networks:

```bash
CURL_CONNECT_TIMEOUT=12 CURL_MAX_TIME=30 CURL_RETRY=2 ./scripts/hosted-smoke-check.sh
```

1. Frontend reachability:

```bash
curl -sS -i https://ticketflow-frontend-flax.vercel.app/auth/login
```

Expected: `HTTP 200`, HTML payload, and Vercel security headers (`x-frame-options`, `x-content-type-options`).

2. Backend health:

```bash
curl -sS -i https://ticketflow-api-rut0.onrender.com/api/health
```

Expected: `HTTP 200` and JSON containing `"status":"ok"`.

3. Auth endpoint behavior:

```bash
curl -sS -i -X POST https://ticketflow-api-rut0.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"nobody@example.com","password":"wrongpass"}'
```

Expected: non-5xx response (typically `401` or `422`) proving the auth endpoint is reachable and responding predictably.

4. Authenticated UI path:

- Sign in with a valid admin account.
- Confirm `/admin` and one workspace route load successfully.

## Rollback-First Incident Triage

Use this order to restore service quickly before deeper debugging.

1. Classify the failure quickly:
- Frontend-only regression: API health is OK, but UI path is broken.
- Backend/API regression: `/api/health` fails or auth endpoints fail unexpectedly.
- Data/DB regression: API is up but key reads/writes fail due to schema/data issues.

2. Frontend rollback path (Vercel):
- Revert to the last known-good deployment in Vercel.
- Re-run the hosted smoke check.
- Keep backend unchanged unless backend checks also fail.

3. Backend rollback path (Render):
- Roll back to last known-good Render deploy if the health or auth checks regress.
- Confirm DB connectivity with `/api/health` after rollback.
- Re-run auth behavior check.

4. Database safety:
- Do not apply additional migrations during active outage response unless rollback cannot restore service.
- If a migration caused failure, roll back app code first, then evaluate targeted migration remediation.

5. Recovery verification:
- Re-run the full hosted smoke checklist.
- Confirm admin login and core workspace pages.
- Log incident summary, root cause, and permanent fix tasks in tracker/docs.

## Admin Credential Rotation Workflow

Use this workflow for the hosted initial platform-admin account. Never commit passwords, tokens, or one-time reset links into git-tracked files.

Ownership and cadence:

- Owner: workspace/project owner (current operator for this repo/deployment).
- Backup owner: one designated maintainer with platform access.
- Cadence: rotate immediately after initial bootstrap, then every 30 days, and immediately after any suspected credential exposure.

Rotation procedure:

1. Generate a strong replacement password using a password manager.
2. Update the credential through the app/admin flow or direct admin tooling.
3. Ensure the old credential no longer works.
4. Store the new credential only in approved secret storage (password manager, secure vault, or equivalent).
5. Do not paste raw credential values in terminal history, tracker docs, commits, or PR text.

Verification evidence (non-sensitive):

- Record rotation timestamp (`YYYY-MM-DD HH:MM +TZ`).
- Record operator identity (who performed the rotation).
- Record login verification result (`success`/`failed`) using the rotated credential.
- Record that old credential access was invalidated.
- Add this evidence to `docs/changelog/progress-log.md` without secret values.

Blocked-rotation escalation protocol:

1. If the designated owner cannot access the hosted admin account, open a reliability incident entry in `docs/changelog/progress-log.md`.
2. Assign the backup owner and set a resolution target within 24 hours.
3. Run hosted smoke checks while blocked to confirm service remains healthy.
4. Once access is restored, execute rotation immediately and log non-sensitive verification evidence.

Rotation evidence template:

```text
Credential Rotation Evidence
- Rotation timestamp: YYYY-MM-DD HH:MM +TZ
- Operator: <name or handle>
- Environment: production
- Verification login using rotated credential: success|failed
- Old credential invalidated: yes|no
- Notes: <optional non-sensitive context>
```

Incident recovery evidence template:

```text
Incident Recovery Evidence
- Incident timestamp: YYYY-MM-DD HH:MM +TZ
- Incident class: frontend|backend|database|mixed
- Initial symptom: <short description>
- Recovery action: rollback|config-fix|service-restart|other
- Smoke check result after recovery: pass|fail
- Follow-up task ID: <tracker id>
```

## Free-Tier Caveats

- Render free services are not recommended for production workloads.
- Neon free is good for hobby/demo usage, not guaranteed team-grade production.
- `QUEUE_CONNECTION=sync` is chosen here to stay within free-platform limits. If background jobs become important later, move to a paid worker-capable host and restore a real queue worker.
