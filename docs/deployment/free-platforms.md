# Free-Platform Deployment Plan

This runbook is the current lowest-cost deployment shape for Ticketing:

- Frontend: Vercel Hobby
- Backend API: Render free web service
- Database: Neon free Postgres

This setup is acceptable for demos, portfolio use, and low-traffic personal testing. It is not a strong production setup for a real team because free services can sleep, throttle, or change limits.

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

Recommended settings:

- Root directory: `backend`
- Environment: `PHP`
- Build command:

```bash
composer install --no-dev --optimize-autoloader && php artisan config:clear && php artisan route:clear && php artisan view:clear && php artisan migrate --force
```

- Start command:

```bash
php artisan serve --host=0.0.0.0 --port=$PORT
```

- Health check path:

```text
/api/health
```

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

## Free-Tier Caveats

- Render free services are not recommended for production workloads.
- Neon free is good for hobby/demo usage, not guaranteed team-grade production.
- `QUEUE_CONNECTION=sync` is chosen here to stay within free-platform limits. If background jobs become important later, move to a paid worker-capable host and restore a real queue worker.
