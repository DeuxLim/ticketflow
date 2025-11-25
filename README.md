# Ticketing

Ticketing is a medium-level internal helpdesk app for teams that need to track customers, tickets, assignments, comments, notifications, and basic workspace administration.

The goal is a practical internal support tool, not a large enterprise identity platform.

## Scope

In scope:

- Internal workspace ticket creation and management.
- Ticket lifecycle: `open`, `in_progress`, `pending`, `resolved`, `closed`.
- Customer records for support context.
- Assignment and reassignment to workspace members.
- Comments, attachments, activity history, and ticket detail tools.
- In-app notifications for assignment, comments, status changes, and important ticket updates.
- Search, filters, saved views, and bulk ticket updates.
- Workspace roles: Admin, Agent, Viewer.
- Demo data that shows the full support flow.

Out of scope:

- Customer-facing portal or public customer ticket creation.
- Email notifications.
- SCIM provisioning.
- SSO login through SAML or OIDC.

Remaining enterprise-style features such as SLA policy UI, break-glass, exports, retention, automation, webhooks, and platform isolation are kept for now and should be reviewed separately before more scope is added.

## Stack

- Backend: Laravel 12, Sanctum, SQL database.
- Frontend: React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query.
- Root dev runner: one command starts the API, queue worker, logs, and frontend.

## Project Structure

- `backend/`: Laravel API, migrations, seeders, routes, controllers, models, and feature tests.
- `frontend/`: React app, workspace UI, API clients, types, and frontend tests.
- `SEED_CREDENTIALS.md`: demo accounts and role summary.
- `project-state.yaml`: canonical roadmap and project state.
- `roadmap.md`: readable roadmap projection.
- `changelog/progress-log.md`: implementation history.

## Local Setup

Install dependencies:

```bash
npm run setup
```

Prepare the backend environment:

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Start the full local app from the repo root:

```bash
npm run dev
```

Local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`

## Demo Accounts

The seeded demo workspace is `demo-workspace`.

| Role | Email | Password |
| --- | --- | --- |
| Platform admin and workspace admin | `admin@ticketing.local` | `Admin@12345` |
| Workspace admin | `user@ticketing.local` | `User@12345` |
| Workspace agent | `member@ticketing.local` | `Member@12345` |
| Workspace viewer | `viewer@ticketing.local` | `Viewer@12345` |

Full account details live in `SEED_CREDENTIALS.md`.

## Roles

- Admin: full workspace access, including settings, members, invitations, and ticket management.
- Agent: manages customers and tickets, can comment, and can view reports.
- Viewer: read-only access to customers, tickets, and reports.
- Platform admin: separate system-level access for platform administration.

## Main Flows

1. Log in with a seeded account.
2. Open `demo-workspace`.
3. Review customers and existing seeded tickets.
4. Create or edit internal tickets.
5. Assign or reassign tickets to workspace members.
6. Move tickets through the lifecycle.
7. Add comments and attachments.
8. Review activity history and in-app notifications.
9. Use search, filters, saved views, and bulk updates to manage the queue.

The seeded data includes customers, tickets in every lifecycle status, assigned and unassigned tickets, comments, and activity history.

## Verification

Backend:

```bash
cd backend
composer test
./vendor/bin/pint --dirty --test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm run test
```

Docs/tracker:

```bash
ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml OK"'
```

## Roadmap Source Of Truth

Use `project-state.yaml` as the canonical tracker. Update `roadmap.md` and `changelog/progress-log.md` whenever scope, feature status, or next steps change.
