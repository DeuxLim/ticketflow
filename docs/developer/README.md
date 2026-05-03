# Ticketing Developer Guide

This guide explains the project from a developer point of view. It is written for junior to mid-level developers who need to run, understand, maintain, and extend the app.

## 1. Project Summary

Ticketing is a medium-level internal helpdesk app.

It helps a team:

- manage workspaces
- manage customers
- create and update internal support tickets
- assign tickets to agents
- move tickets through a simple lifecycle
- comment on tickets
- upload attachments
- track ticket activity
- receive in-app notifications
- manage basic workspace settings

This is not meant to be a large enterprise identity product.

Out of scope:

- customer-facing ticket portal
- public customer ticket creation
- email notifications
- SCIM provisioning
- SSO through SAML or OIDC
- break-glass emergency access

Some enterprise-style features still exist and were reviewed in `docs/scope/enterprise-feature-review.md`:

- ticket timing target UI, still stored as SLA internally
- tenant exports, deferred and hidden from the main UI
- retention policies, deferred and hidden from the main UI
- advanced automation
- webhooks
- platform isolation

The implementation follow-up is tracked under `SCOPE-P2`.

## 2. Tech Stack

Backend:

- Laravel 12
- PHP 8.2+
- Laravel Sanctum for API tokens
- SQL database
- PHPUnit feature tests
- Laravel Pint for formatting

Frontend:

- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Base UI primitives
- TanStack Query for server state
- React Router
- React Hook Form
- Zod validation
- Vitest and Testing Library

Root tooling:

- `package.json` at the repo root exists only for convenience.
- `npm run dev` starts backend API, queue worker, backend logs, and frontend together.
- `npm run setup` installs backend and frontend dependencies.

## 3. Repository Structure

Important root folders:

```text
backend/
frontend/
docs/
.agents/
```

`backend/` contains the Laravel API.

`frontend/` contains the React app.

`docs/` contains project documentation, tracker files, changelog, and developer docs.

`.agents/` contains local project-specific Codex skills. Keep it at the repo root unless you intentionally update the Codex skill configuration.

Important docs:

```text
docs/README.md
docs/SEED_CREDENTIALS.md
docs/project-state.yaml
docs/roadmap.md
docs/changelog/progress-log.md
docs/developer/README.md
docs/developer/routes.md
```

`docs/project-state.yaml` is the canonical tracker. If roadmap and tracker disagree, trust `docs/project-state.yaml`.

## 4. Local Setup

From the repo root:

```bash
npm run setup
```

Prepare the backend:

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Start everything from the repo root:

```bash
npm run dev
```

Local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000/api`

If you prefer separate terminals:

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

```bash
cd backend
php artisan queue:listen --tries=1 --timeout=0
```

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

## 5. Demo Accounts

Seeded workspace slug:

```text
demo-workspace
```

Accounts:

| Role | Email | Password |
| --- | --- | --- |
| Platform admin and workspace admin | `admin@ticketing.local` | `Admin@12345` |
| Workspace admin | `user@ticketing.local` | `User@12345` |
| Workspace agent | `member@ticketing.local` | `Member@12345` |
| Workspace viewer | `viewer@ticketing.local` | `Viewer@12345` |

More details are in `docs/SEED_CREDENTIALS.md`.

## 6. Product Scope

Current intended role set:

- Admin
- Agent
- Viewer

Platform admin is separate from workspace roles.

Ticket lifecycle:

```text
open -> in_progress -> pending -> resolved -> closed
```

Supported ticket statuses:

- `open`
- `in_progress`
- `pending`
- `resolved`
- `closed`

Supported priorities:

- `low`
- `medium`
- `high`
- `urgent`

Notification scope:

- in-app notifications exist
- email notifications are deferred

Customer scope:

- customer records are managed internally
- customers do not log in
- customers do not create public tickets

## 7. Backend Architecture

The backend is a Laravel API-only application.

Main folders:

```text
backend/app/Http/Controllers/Api/
backend/app/Http/Requests/
backend/app/Http/Resources/
backend/app/Models/
backend/app/Services/
backend/app/Actions/
backend/database/migrations/
backend/database/seeders/
backend/tests/Feature/
```

Controller responsibility:

- receive the HTTP request
- authorize through middleware
- validate using request classes or inline validation
- call models/services/actions
- return JSON resources

Model responsibility:

- represent database tables
- define relationships
- keep simple model helpers

Service responsibility:

- hold reusable domain logic
- keep controllers smaller
- centralize workflows like notifications, SLA reporting, webhooks, assignment, workspace setup

Action responsibility:

- perform a focused write workflow
- example: workspace creation and invitation acceptance

Request classes:

- validate input payloads
- keep controller methods easier to read

Resources:

- shape API responses
- prevent frontend from depending directly on raw database columns

## 8. Backend Domains

Authentication:

- `AuthController`
- login/register/logout/me
- Sanctum token auth

Workspace:

- workspaces
- memberships
- roles
- permissions
- invitations
- workspace settings

Customers:

- customer directory
- enriched customer profile fields
- internal support context

Tickets:

- ticket queue
- create/edit/delete tickets
- bulk updates
- ticket detail
- comments
- attachments
- watchers
- checklist items
- related tickets
- activity history
- optional first-reply and resolution timing targets

Notifications:

- stored in `workspace_notifications`
- produced by assignment, comments, status changes, and important ticket updates
- read/unread state

Settings:

- general workspace settings
- ticketing dictionaries
- custom fields
- form templates
- workflow automation
- security/governance settings
- integrations

Admin:

- platform admin dashboard
- users
- workspaces
- suspend/reactivate workspace
- update workspace limits, feature flags, isolation

Enterprise-style features pending simplification or removal:

- ticket timing targets, still stored as SLA policies internally
- approvals
- automation, simplified to basic ticket rule controls
- webhooks
- audit events
- retention, deferred and hidden from the main UI
- exports, deferred and hidden from the main UI

## 9. Frontend Architecture

The frontend is a React app organized by feature.

Main folders:

```text
frontend/src/app/
frontend/src/routes/
frontend/src/layouts/
frontend/src/features/
frontend/src/components/ui/
frontend/src/services/api/
frontend/src/types/
frontend/src/hooks/
frontend/src/lib/
```

`frontend/src/app/`:

- app router
- shared providers
- TanStack Query provider
- tooltip/toast providers

`frontend/src/routes/`:

- route definitions grouped by area
- auth routes
- workspace routes
- admin routes

`frontend/src/layouts/`:

- shared page shells
- workspace navigation
- admin layout
- auth layout

`frontend/src/features/`:

- actual product screens
- feature API modules
- feature-specific helpers
- feature tests

`frontend/src/components/ui/`:

- shared UI primitives
- prefer these before creating new components

`frontend/src/services/api/client.ts`:

- shared fetch wrapper
- applies auth token
- parses API errors
- clears token on `401`

`frontend/src/types/api.ts`:

- TypeScript types for backend responses
- keep these aligned with Laravel resources

## 10. Frontend Routes

Main browser routes:

```text
/                                Landing page
/auth/login                       Login
/workspaces/new                   Workspace onboarding
/workspaces/:workspaceSlug        Workspace dashboard
/workspaces/:workspaceSlug/customers
/workspaces/:workspaceSlug/tickets
/workspaces/:workspaceSlug/tickets/:ticketId
/workspaces/:workspaceSlug/members
/workspaces/:workspaceSlug/invitations
/workspaces/:workspaceSlug/settings
/admin                            Platform admin dashboard
```

Auth guards:

- `RequireAuth` protects workspace routes.
- `RequirePlatformAdmin` protects admin routes.

## 11. API Design

API base URL in frontend:

```ts
import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
```

Most protected API routes require:

- `auth:sanctum`
- workspace membership for workspace routes
- workspace permission for sensitive operations

Main route groups:

- auth
- workspaces
- workspace settings
- customers
- tickets
- ticket detail sub-resources
- members and invitations
- security/governance
- workflow and automation
- reporting
- saved views
- webhooks
- admin

See `docs/developer/routes.md` for a route reference.

## 12. Authorization Model

There are two permission layers.

Platform admin:

- controlled by `users.is_platform_admin`
- required for `/api/admin/*`
- separate from workspace roles

Workspace roles:

- Admin
- Agent
- Viewer

Workspace permissions are checked by middleware:

```text
workspace_member
workspace_permission:{permission}
tenant_network
```

Common permission examples:

- `tickets.view`
- `tickets.manage`
- `tickets.comment`
- `customers.view`
- `customers.manage`
- `members.manage`
- `invitations.manage`
- `roles.manage`
- `security.manage`
- `automation.manage`
- `integrations.manage`
- `reporting.view`

The backend is the source of truth for permissions. The frontend can hide buttons, but backend middleware must still enforce access.

## 13. Data Model Overview

Core tables/models:

- `User`
- `Workspace`
- `WorkspaceMembership`
- `WorkspaceRole`
- `WorkspacePermission`
- `WorkspaceInvitation`
- `Customer`
- `Ticket`
- `TicketComment`
- `TicketAttachment`
- `ActivityLog`
- `SavedView`
- `WorkspaceNotification`

Ticket detail models:

- `TicketWatcher`
- `TicketChecklistItem`
- `TicketRelatedTicket`
- `TicketQueue`
- `TicketCategory`
- `TicketTag`
- `TicketType`
- `TicketCustomField`
- `TicketCustomFieldValue`
- `TicketFormTemplate`

Workflow and enterprise-style models:

- `TicketWorkflow`
- `WorkflowTransition`
- `ApprovalStep`
- `SlaPolicy`
- `SlaBreachEvent`
- `AutomationRule`
- `AutomationExecution`
- `WebhookEndpoint`
- `WebhookDelivery`
- `AuditEvent`
- `RetentionPolicy`, backend-only while retention UI is deferred
- `TenantExport`, backend-only while exports are deferred
- `TenantSecurityPolicy`

## 14. Seeding and Demo Data

Seeder:

```text
backend/database/seeders/DatabaseSeeder.php
```

The seeder creates:

- platform admin
- workspace admin
- agent
- viewer
- demo workspace
- simple workspace roles
- role permissions
- customers
- demo tickets in every lifecycle status
- comments
- activity entries

Workspace foundation setup:

```text
backend/app/Services/Workspaces/WorkspaceFoundationBootstrapper.php
```

This ensures new workspaces have:

- default settings
- ticket statuses
- priorities
- default queue
- default category
- default tag
- default ticket type
- default form template
- default workflow transitions

## 15. Important Architecture Decisions

### Keep Backend and Frontend Separate

Laravel owns the API and database.

React owns the UI.

They communicate through JSON API calls.

### Use Sanctum Token Auth

The frontend stores and sends an API token.

Backend routes use `auth:sanctum`.

### Keep Workspace Boundaries Strict

Workspace routes always include the workspace slug:

```text
/api/workspaces/{workspace}/...
```

Middleware checks:

- user is authenticated
- user belongs to the workspace
- user has the needed permission
- workspace is not blocked by tenant security rules

### Keep Platform Admin Separate

Platform admin is not the same as workspace Admin.

Platform admin can manage system-level workspace settings.

Workspace Admin manages one workspace.

### Keep Ticket Statuses Simple

Final intended lifecycle:

```text
open, in_progress, pending, resolved, closed
```

Do not add new statuses unless product scope changes.

### Prefer In-App Notifications First

Email is intentionally deferred.

Current notification work is stored and shown inside the app.

### SCIM and SSO Are Removed

Do not add back:

- SAML SSO
- OIDC SSO
- SCIM users/groups
- identity providers
- provisioning directories

## 16. Common Development Workflows

Add a backend API feature:

1. Add or update migration/model if data changes.
2. Add request validation if input changes.
3. Add controller action.
4. Add resource response if output changes.
5. Add route in `backend/routes/api.php`.
6. Add feature test in `backend/tests/Feature/`.
7. Run focused backend tests.

Add a frontend API feature:

1. Add or update types in `frontend/src/types/api.ts`.
2. Add API function in the nearest feature API module.
3. Use TanStack Query or mutation in the page/component.
4. Handle loading, empty, error, and forbidden states.
5. Add or update frontend tests.
6. Run focused frontend tests, lint, and build.

Add a UI screen:

1. Add the route in `frontend/src/routes/`.
2. Add the page under `frontend/src/features/.../pages/`.
3. Reuse existing layout and UI components.
4. Keep API calls in feature API modules.
5. Add permission-aware states.

Update tracker/docs:

1. Edit `docs/project-state.yaml`.
2. Sync `docs/roadmap.md`.
3. Append `docs/changelog/progress-log.md`.

## 17. Testing

Backend:

```bash
cd backend
composer test
```

Focused backend test:

```bash
cd backend
php artisan test --filter=TicketingBaseFunctionsTest
```

Frontend:

```bash
cd frontend
npm run test
npm run lint
npm run build
```

Focused frontend test:

```bash
cd frontend
npm run test -- --run src/features/workspace/pages/TicketsPageInteractions.test.tsx
```

Docs/tracker:

```bash
ruby -e 'require "yaml"; YAML.load_file("docs/project-state.yaml"); puts "docs/project-state.yaml OK"'
```

Whitespace check:

```bash
git diff --check
```

## 18. Where To Change Common Things

Ticket status labels:

```text
frontend/src/features/workspace/pages/ticketForm.ts
```

Ticket validation:

```text
backend/app/Http/Requests/Workspaces/StoreTicketRequest.php
backend/app/Http/Requests/Workspaces/UpdateTicketRequest.php
backend/app/Http/Requests/Workspaces/BulkUpdateTicketsRequest.php
```

Ticket API:

```text
backend/app/Http/Controllers/Api/Workspaces/TicketController.php
frontend/src/features/workspace/api/ticketPageApi.ts
frontend/src/features/workspace/api/ticketDetailsApi.ts
```

Ticket queue UI:

```text
frontend/src/features/workspace/pages/TicketsPage.tsx
frontend/src/features/workspace/pages/TicketQueueTable.tsx
frontend/src/features/workspace/pages/TicketQueueControlsSheet.tsx
```

Ticket detail UI:

```text
frontend/src/features/workspace/pages/TicketDetailsPage.tsx
frontend/src/features/workspace/pages/TicketDetailsHeader.tsx
frontend/src/features/workspace/pages/TicketDetailsOverviewCards.tsx
frontend/src/features/workspace/pages/TicketDetailsCommentsCard.tsx
```

Workspace settings UI:

```text
frontend/src/features/workspace/pages/WorkspaceSettingsPage.tsx
frontend/src/features/workspace/settings/
```

Roles and permissions:

```text
backend/database/seeders/WorkspacePermissionSeeder.php
backend/app/Services/Workspaces/WorkspaceFoundationBootstrapper.php
backend/app/Actions/Workspaces/CreateWorkspaceAction.php
```

Demo data:

```text
backend/database/seeders/DatabaseSeeder.php
docs/SEED_CREDENTIALS.md
```

In-app notifications:

```text
backend/app/Models/WorkspaceNotification.php
backend/app/Services/Notifications/WorkspaceNotificationService.php
backend/app/Http/Controllers/Api/Workspaces/WorkspaceNotificationController.php
frontend/src/features/workspace/components/WorkspaceNotificationsMenu.tsx
frontend/src/features/workspace/api/notificationsApi.ts
```

## 19. Known Scope Warning

The current app has more than the medium-ticketing core because earlier enterprise-style features still exist.

Before extending these areas, follow the `SCOPE-D01` decisions and implement the cleanup under `SCOPE-P2`:

- ticket timing targets, still stored as SLA internally
- exports, deferred and hidden from the main UI
- retention, deferred and hidden from the main UI
- automation
- webhooks
- platform isolation

The decision should be one of:

- keep
- simplify
- defer
- remove

Do not add more enterprise scope until that review is done.

## 20. Quick Mental Model

Use this simple model when working on the app:

```text
User logs in
  -> chooses or enters a workspace
  -> workspace middleware checks membership
  -> permission middleware checks role permissions
  -> user manages customers and tickets
  -> ticket changes create activity and notifications
  -> settings configure workspace behavior
  -> platform admin manages system-level workspace controls
```

If a change touches both backend and frontend, update both sides in the same work item.

If a change touches permissions, always add or update tests.

If a change adds a new feature, update the tracker under `docs/project-state.yaml`.
