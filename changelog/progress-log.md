# Progress Log

## 2026-04-13 22:32 +08:00 - Initialized Source of Truth

- Created `project-state.yaml` as the canonical source of truth.
- Created `roadmap.md` as the human-readable projection from `project-state.yaml`.
- Initialized state from `docs/superpowers/plans/2026-04-13-workspace-settings-phase-1.md` because no `roadmap.md` existed yet.
- Preserved stable IDs using the `WSSET-P1` prefix for Workspace Settings Phase 1.
- Marked `WSSET-P1-T01` through `WSSET-P1-T05` complete based on existing files plus verification.
- Marked `WSSET-P1` and `WSSET-P1-T06` incomplete because enterprise regression tests and backend Pint dirty formatting check have not been run in this session.

Verification:
- `backend`: `php artisan test --filter=WorkspaceSettingsPhaseOneTest` passed: 11 tests, 64 assertions.
- `frontend`: `npm run build` passed. Vite reported existing large chunk/font resolution warnings.

## Resume From Here

Continue with `WSSET-P1-T06`: run `php artisan test --filter=EnterpriseFoundationTest`, `php artisan test --filter=EnterprisePhaseTwoFlowsTest`, and `./vendor/bin/pint --dirty --test` from `backend/`. If those pass, update `project-state.yaml` to mark `WSSET-P1-T06` and `WSSET-P1` complete, regenerate `roadmap.md`, and append a new progress-log entry.

## 2026-04-13 22:32 +08:00 - Completed Workspace Settings Phase 1 Verification

- Marked `WSSET-P1-T06` complete after remaining verification passed.
- Marked `WSSET-P1` complete because all child items now meet their definition of done.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `backend`: `php artisan test --filter=EnterpriseFoundationTest` passed: 5 tests, 24 assertions.
- `backend`: `php artisan test --filter=EnterprisePhaseTwoFlowsTest` passed: 4 tests, 20 assertions.
- `backend`: `./vendor/bin/pint --dirty --test` passed.

## Resume From Here

Workspace Settings Phase 1 is complete. Resume by selecting the next highest-priority MVP item and initializing it in `project-state.yaml` before implementation.

## 2026-04-14 07:01 +08:00 - Added Alignment Hardening Backlog From Deep-Dive Audit

- Added new epic `ALIGN-P1` (Backend-Frontend Alignment Hardening) and set it as current focus.
- Completed discovery task `ALIGN-P1-T01` to capture concrete alignment gaps across backend routes/controllers/tests and frontend route/page/settings usage.
- Added hardening tasks `ALIGN-P1-T02` through `ALIGN-P1-T09` covering:
  - integrations settings parity (webhooks/deliveries),
  - security and identity management parity,
  - workflow/automation parity,
  - ticket dictionary/forms CRUD parity,
  - pagination contract alignment,
  - assignment permission boundary alignment,
  - frontend API typing/client consistency,
  - frontend regression-test baseline.
- Synchronized `roadmap.md` from `project-state.yaml` with the new current focus and next sequence.

Verification:
- Repository audit commands executed with `rg`/`sed` against:
  - `backend/routes/api.php`
  - `backend/app/Http/Controllers/Api/Workspaces/*`
  - `backend/tests/Feature/*`
  - `frontend/src/features/workspace/**/*`
  - `frontend/src/types/api.ts`
- Confirmed no frontend tests currently exist under `frontend/src` (`rg --files frontend/src | rg "(test|spec)\\.(ts|tsx|js|jsx)$"` returned no matches).

## Resume From Here

Start implementation with `ALIGN-P1-T02` (integrations settings parity) and `ALIGN-P1-T03` (security governance parity). After those land, execute `ALIGN-P1-T06` and `ALIGN-P1-T07` to remove dataset and permission drift that currently affects ticket workflows.

## 2026-04-14 07:06 +08:00 - Implemented Integrations Settings Parity (Phase 1)

- Implemented integrations settings UI parity for existing backend webhook APIs.
- Replaced static integrations summary with live management in Workspace Settings:
  - list and create webhook endpoints (`/webhooks`)
  - list webhook deliveries (`/webhook-deliveries`)
  - retry delivery action (`/webhook-deliveries/{delivery}/retry`)
- Added typed frontend API models for webhook endpoints and webhook deliveries.
- Added integrations API helper functions in `settings-api.ts`.
- Updated tracker state:
  - `ALIGN-P1-T02` moved from `planned` to `incomplete` (feature implemented, regression tests still pending).

Verification:
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed.
- Build emitted existing Vite warnings for unresolved Geist font files and large JS chunks.

## Resume From Here

Add regression coverage for integrations flows (`ALIGN-P1-T02`), then proceed with `ALIGN-P1-T03` to align security policy, identity providers, and provisioning directory management in the frontend settings UI.

## 2026-04-14 07:10 +08:00 - Implemented Security Settings Parity (Phase 1)

- Implemented security settings parity in the frontend using existing backend enterprise endpoints.
- Extended Security tab with live controls for:
  - tenant security policy (`/security-policy`)
  - identity provider create/delete (`/identity-providers`)
  - OIDC start URL generation (`/auth/sso/oidc/start`)
  - SCIM provisioning directory create/list (`/provisioning-directories`)
- Added typed frontend API models and settings API helpers for security policy, identity providers, and provisioning directories.
- Updated tracker state:
  - `ALIGN-P1-T03` moved from `planned` to `incomplete` (feature implemented, regression tests still pending).

Verification:
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed.
- Build emitted existing Vite warnings for unresolved Geist font files and large JS chunks.

## Resume From Here

Add regression coverage for `ALIGN-P1-T02` and `ALIGN-P1-T03`, then implement `ALIGN-P1-T06` and `ALIGN-P1-T07` to remove pagination and permission-boundary drift in ticket and selector workflows.

## 2026-04-14 07:14 +08:00 - Implemented Pagination and Assignment Boundary Alignment (Phase 1)

- Implemented `ALIGN-P1-T06` pagination contract hardening:
  - Added `per_page` support (bounded) to backend `/customers` and `/tickets` index endpoints.
  - Updated dashboard to avoid implicit full-dataset assumptions and use explicit pagination/reporting contracts.
  - Updated ticket selectors to request bounded datasets and display partial-list hints when totals exceed loaded options.
- Implemented `ALIGN-P1-T07` permission-boundary hardening:
  - Added backend endpoint `/workspaces/{workspace}/members/assignable` guarded by `tickets.manage`.
  - Updated tickets and ticket-details assignee queries to use assignable members instead of members-management endpoint.
- Updated tracker state:
  - `ALIGN-P1-T06` moved from `planned` to `incomplete` (implementation done; regression tests pending).
  - `ALIGN-P1-T07` moved from `planned` to `incomplete` (implementation done; regression tests pending).

Verification:
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed.
- `backend`: `php artisan test --filter=WorkspaceMembersTest` passed (2 tests, 6 assertions).
- `backend`: `php artisan test --filter=TicketingBaseFunctionsTest` passed (6 tests, 45 assertions).
- Build emitted existing Vite warnings for unresolved Geist font files and large JS chunks.

## Resume From Here

Add regression coverage for `ALIGN-P1-T02`, `ALIGN-P1-T03`, `ALIGN-P1-T06`, and `ALIGN-P1-T07`, then implement `ALIGN-P1-T04` workflow/automation lifecycle parity.

## 2026-04-14 07:19 +08:00 - Added Regression Coverage for Pagination and Assignment Permissions

- Added backend regression coverage for `ALIGN-P1-T06` pagination bounds:
  - `/tickets?per_page=0` clamps to 1 and returns one item.
  - `/tickets?per_page=999` clamps to 200.
  - `/customers?per_page=0` clamps to 1 and returns one item.
  - `/customers?per_page=999` clamps to 200.
- Added backend regression coverage for `ALIGN-P1-T07` permission boundaries:
  - Member without `tickets.manage` is forbidden on `/members/assignable`.
  - Member with `tickets.manage` but without `members.manage` can access `/members/assignable` but remains forbidden on `/members`.
- Updated tracker state:
  - `ALIGN-P1-T07` moved from `incomplete` to `complete`.
  - `ALIGN-P1-T06` remains `incomplete` with remaining filtering and large-dataset selector coverage gaps.
  - Updated epic `ALIGN-P1` next actions to prioritize `T02`, `T03`, remaining `T06`, and `T04`.

Verification:
- `backend`: `php artisan test --filter=WorkspaceMembersTest` passed (4 tests, 12 assertions).
- `backend`: `php artisan test --filter=TicketingBaseFunctionsTest` passed (8 tests, 63 assertions).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Add regression coverage for `ALIGN-P1-T02` and `ALIGN-P1-T03`, close remaining filtering/large-dataset regression gaps in `ALIGN-P1-T06`, then implement `ALIGN-P1-T04` workflow/automation lifecycle parity.

## 2026-04-14 07:51 +08:00 - Added Backend Contract Regression Coverage for Integrations and Security Settings

- Extended enterprise regression suite with backend contract checks for `ALIGN-P1-T02` and `ALIGN-P1-T03`.
- Added integrations contract assertions:
  - webhook create success response fields (`name`, `events`, `is_active`)
  - webhook create validation errors (`name`, `url`, `secret`, `events`)
  - webhook endpoint list and delivery list response shapes (`meta`, `endpoint`, `event`)
- Added security-governance contract assertions:
  - `/security-policy` fields (`require_sso`, `require_mfa`, `session_ttl_minutes`, `ip_allowlist`, `tenant_mode`, `feature_flags`)
  - `/identity-providers` create/list shape
  - `/auth/sso/oidc/start` response (`authorization_url`, `state`)
  - `/provisioning-directories` create/list shape including one-time `meta.token`
- Updated tracker state:
  - `ALIGN-P1-T02` remains `incomplete` but backend contract assertions are now covered; remaining gap is frontend regression checks.
  - `ALIGN-P1-T03` remains `incomplete` but backend contract assertions are now covered; remaining gap is frontend regression checks.

Verification:
- `backend`: `php artisan test --filter=EnterpriseFoundationTest` passed (7 tests, 67 assertions).

## Resume From Here

Add frontend regression coverage for `ALIGN-P1-T02` and `ALIGN-P1-T03`, close remaining filtering/large-dataset regression gaps in `ALIGN-P1-T06`, then implement `ALIGN-P1-T04` workflow/automation lifecycle parity.

## 2026-04-14 07:53 +08:00 - Added Frontend Regression Baseline and Settings API Contract Tests

- Added frontend regression baseline tooling:
  - installed `vitest` in `frontend`
  - added `npm run test` script
  - added `frontend/vitest.config.ts`
- Added targeted frontend regression tests for settings API contract usage:
  - `frontend/src/features/workspace/settings/settings-api.test.ts`
  - verifies integrations calls (`/webhooks`, `/webhook-deliveries`, retry)
  - verifies security-governance calls (`/security-policy`, `/identity-providers`, OIDC start, `/provisioning-directories`)
- Updated tracker state:
  - `ALIGN-P1-T02` and `ALIGN-P1-T03` remain `incomplete`; backend + frontend API contract coverage is in place, UI-level success/error regression checks remain.
  - `ALIGN-P1-T09` moved from `planned` to `incomplete` to reflect baseline completion with remaining UI/ticket-flow coverage work.

Verification:
- `frontend`: `npm run test` passed (1 file, 2 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Add UI-level frontend regression tests for `ALIGN-P1-T02` and `ALIGN-P1-T03`, then cover remaining `ALIGN-P1-T06` ticket selector/pagination behavior in frontend tests before implementing `ALIGN-P1-T04`.

## 2026-04-14 07:57 +08:00 - Added UI-Level Frontend Regression Coverage for Integrations and Security

- Added UI-focused tests for integrations settings:
  - `frontend/src/features/workspace/settings/IntegrationsSettingsSection.test.tsx`
  - covers webhook endpoint create success/error
  - covers webhook delivery retry success/error
- Added UI-focused tests for governance/security settings:
  - `frontend/src/features/workspace/settings/GovernanceSettingsSection.test.tsx`
  - covers provisioning directory creation success (token display)
  - covers security policy save error handling
- Expanded frontend test tooling:
  - added `@testing-library/react`, `@testing-library/user-event`, and `jsdom`
  - updated Vitest include pattern for `.test.tsx`
- Updated tracker state:
  - `ALIGN-P1-T02` moved from `incomplete` to `complete`.
  - `ALIGN-P1-T03` moved from `incomplete` to `complete`.
  - `ALIGN-P1` focus now shifts to remaining `T06` regression gaps and `T04` workflow/automation parity.

Verification:
- `frontend`: `npm run test` passed (3 files, 8 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Close remaining `ALIGN-P1-T06` regression gaps for filtering and large-dataset selector behavior, then implement `ALIGN-P1-T04` workflow/automation lifecycle parity.

## 2026-04-14 07:58 +08:00 - Expanded T06 Backend Regression Coverage for Filtering

- Added backend filtering regression assertions in `TicketingBaseFunctionsTest`:
  - ticket list supports combined `status` + `customer_id` filtering
  - customer list supports `search` filtering
- Updated tracker state:
  - `ALIGN-P1-T06` remains `incomplete`, but backend filtering coverage is now in place.
  - Remaining `T06` gap is frontend selector behavior when total records exceed loaded options.

Verification:
- `backend`: `php artisan test --filter=TicketingBaseFunctionsTest` passed (10 tests, 73 assertions).

## Resume From Here

Add frontend regression tests for `ALIGN-P1-T06` large-dataset selector behavior, then implement `ALIGN-P1-T04` workflow/automation lifecycle parity.

## 2026-04-14 08:16 +08:00 - Completed T06 Frontend Selector Coverage and Closed Pagination Alignment Task

- Added shared selector coverage utility:
  - `frontend/src/features/workspace/utils/selectorCoverage.ts`
  - centralizes partial-list hint behavior when loaded options are a subset of total records.
- Wired ticket pages to use shared coverage helper:
  - `frontend/src/features/workspace/pages/TicketsPage.tsx`
  - `frontend/src/features/workspace/pages/TicketDetailsPage.tsx`
- Added regression tests for selector coverage behavior:
  - `frontend/src/features/workspace/utils/selectorCoverage.test.ts`
  - verifies no hint when totals are absent/fully loaded and correct hint when totals exceed loaded options.
- Updated tracker state:
  - `ALIGN-P1-T06` moved from `incomplete` to `complete`.
  - `ALIGN-P1` next focus narrowed to `ALIGN-P1-T04` workflow/automation parity and continued test-depth expansion in `ALIGN-P1-T09`.

Verification:
- `frontend`: `npm run test` passed (4 files, 11 tests).
- `frontend`: `npm run lint` passed.

## 2026-04-20 22:28 +08:00 - Completed UX Overhaul Wave 1 Workspace CRUD Hardening

- Updated the workspace CRUD surfaces to follow a calmer modal-first pattern:
  - `frontend/src/features/workspace/pages/InvitationsPage.tsx`
  - `frontend/src/features/workspace/pages/CustomersPage.tsx`
  - `frontend/src/features/workspace/pages/MembersPage.tsx`
  - `frontend/src/features/workspace/pages/TicketsPage.tsx`
- Invitations now explain invite intent and role selection more clearly with explicit field labels, helper text, and calmer queue wording.
- Customers now use labeled search, clearer CRUD dialog framing, and fully labeled customer form inputs.
- Members now have stronger page orientation and an explicit empty state.
- Tickets now keep search inline while moving saved views, advanced filters, and bulk actions into a dedicated sheet to reduce default viewport clutter.
- Updated regression coverage in `frontend/src/features/workspace/pages/TicketsPageInteractions.test.tsx` for the new ticket controls flow.
- Updated `project-state.yaml` and `roadmap.md` to mark `UX-OVERHAUL-P1-W1` complete and queue `UX-OVERHAUL-P1-W2` as the next UX wave.

Verification:
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run` passed (19 files, 69 tests).
- `frontend`: `npm run build` passed.

## Resume From Here

Start `UX-OVERHAUL-P1-W2` by auditing ticket detail and workspace settings surfaces for always-on controls, unlabeled fields, and opportunities to move secondary actions into dialogs or sheets.

## 2026-04-20 23:32 +08:00 - Started UX Overhaul Wave 2 with Ticket Details Decluttering

- Reworked `frontend/src/features/workspace/pages/TicketDetailsPage.tsx` so the route defaults to a calmer reading surface:
  - ticket summary remains visible
  - conversation remains visible
  - activity timeline remains visible
  - ticket editing now opens in a right-side sheet
  - checklist, attachments, watchers, and related tickets now open in focused dialogs instead of living inline on the page
- Added a compact "Ticket Tools" rail so secondary work is discoverable without dominating the viewport.
- Preserved SLA and custom field visibility in the side rail for quick operational context.
- Updated `frontend/src/features/workspace/pages/TicketDetailsMutations.test.tsx` to match the new overlay-first flows.
- Fixed related-ticket delete error visibility after moving that surface into a dialog.
- Updated `project-state.yaml` and `roadmap.md` to move `UX-OVERHAUL-P1-W2` from `planned` to `in_progress`.

Verification:
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run src/features/workspace/pages/TicketDetailsMutations.test.tsx src/features/workspace/pages/TicketRoutePermissions.test.tsx` passed.
- `frontend`: `npm run test -- --run` passed (19 files, 69 tests).
- `frontend`: `npm run build` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1-W2` with the workspace settings tabs, prioritizing sections that still expose dense always-on forms and secondary controls inline.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Implement `ALIGN-P1-T04` workflow/automation lifecycle parity, then continue expanding `ALIGN-P1-T09` ticket-flow and permission-driven frontend regression depth.

## 2026-04-14 08:21 +08:00 - Implemented T04 Workflow/Automation Lifecycle Parity (Phase 1)

- Expanded settings API client for workflow and automation lifecycle endpoints:
  - workflow create/update/simulate
  - automation rule create/update/test
- Expanded Workflow/Automation settings UI to expose backend-supported operations:
  - create workflow with initial transition
  - update workflow name/active state
  - simulate workflow transition for a ticket
  - create automation rule
  - update automation rule name/priority
  - dry-run automation rule against a ticket
- Added regression checks for newly added settings API client calls in:
  - `frontend/src/features/workspace/settings/settings-api.test.ts`
- Updated tracker state:
  - `ALIGN-P1-T04` moved from `planned` to `incomplete` (implementation complete; deeper UI/backend regression coverage still pending).
  - `ALIGN-P1-T06` is now complete and no longer on critical path.

Verification:
- `frontend`: `npm run test` passed (4 files, 12 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Add deeper regression coverage for `ALIGN-P1-T04` workflow/automation success/error paths, then continue expanding `ALIGN-P1-T09` ticket-flow and permission-driven frontend regression depth.

## 2026-04-14 08:25 +08:00 - Completed T04 Regression Coverage and Synced Tracker State

- Completed deeper regression coverage for workflow/automation parity:
  - backend workflow simulation and automation dry-run assertions in enterprise feature tests
  - frontend workflow simulation rendering and workflow-create interaction tests
- Updated tracker state:
  - `ALIGN-P1-T04` moved from `incomplete` to `complete`.
  - `ALIGN-P1` next focus is now `ALIGN-P1-T05`, `ALIGN-P1-T09`, and `ALIGN-P1-T08`.
- Synchronized roadmap/project-state messaging so child-item status and next actions match.

Verification:
- `backend`: `php artisan test --filter=EnterprisePhaseTwoFlowsTest` passed (6 tests, 34 assertions).
- `backend`: `php artisan test --filter=EnterpriseFoundationTest` passed.
- `frontend`: `npm run test` passed (5 files, 14 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Implement `ALIGN-P1-T05` ticket dictionary/forms CRUD parity, then expand `ALIGN-P1-T09` ticket-page and permission-driven regression depth.

## 2026-04-14 08:33 +08:00 - Completed T05 Ticket Dictionary and Form CRUD Parity

- Implemented frontend update parity for ticket dictionaries and forms:
  - added update API helpers for ticket categories, tags, types, custom fields, and form templates
  - added edit/toggle flows in ticketing settings for categories, ticket types, and tags
  - added edit/toggle flows in forms settings for custom fields and templates
- Fixed template contract drift:
  - template creation now supports nullable `ticket_type_id` through an `Any type` option, matching backend validation.
- Added regression coverage for T05:
  - backend feature test now covers dictionary/template update paths and nullable template type updates
  - frontend settings API contract tests now cover all create/update calls for dictionaries/forms
  - frontend component regression test verifies nullable template create behavior.
- Updated tracker state:
  - `ALIGN-P1-T05` moved from `planned` to `complete`.
  - `ALIGN-P1` focus narrowed to `ALIGN-P1-T09` and `ALIGN-P1-T08`.

Verification:
- `backend`: `php artisan test --filter=WorkspaceSettingsPhaseOneTest` passed (12 tests, 86 assertions).
- `frontend`: `npm run test` passed (7 files, 17 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Expand `ALIGN-P1-T09` with ticket-page interaction and permission-driven UI regression tests, then execute `ALIGN-P1-T08` frontend API typing/client consistency hardening.

## 2026-04-14 08:35 +08:00 - Expanded T09 with Ticket Selector API Contract Regression

- Added shared ticket-page API module:
  - `frontend/src/features/workspace/pages/ticketPageApi.ts`
  - centralizes customers/tickets bounded selector calls and assignable-members endpoint usage.
- Refactored ticket pages to consume shared selector API helpers:
  - `TicketsPage.tsx`
  - `TicketDetailsPage.tsx`
- Added regression tests:
  - `frontend/src/features/workspace/pages/ticketPageApi.test.ts`
  - verifies `/customers?per_page=200`, `/tickets?per_page=200`, and `/members/assignable` contracts.
- Updated tracker state:
  - `ALIGN-P1-T09` remains `incomplete`, with selector API coverage added and broader ticket interaction/permission UI tests still pending.

Verification:
- `frontend`: `npm run test` passed (8 files, 20 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Continue `ALIGN-P1-T09` with ticket-page interaction and permission-driven UI regression tests, then execute `ALIGN-P1-T08` API typing/client consistency hardening.

## 2026-04-14 15:23 +08:00 - Expanded T09 with Ticket Route Permission Regression

- Added permission-driven frontend regression tests:
  - `frontend/src/features/workspace/pages/TicketRoutePermissions.test.tsx`
  - covers tickets-list forbidden state when `tickets.view` is missing
  - covers disabled create action when role can view but cannot manage tickets
  - covers ticket-details forbidden state when `tickets.view` is missing
- Stabilized ticketing settings regression checks:
  - updated `TicketingSettingsSection.test.tsx` to validate quick-create category path
  - kept update-path parity validated by API contract tests and backend feature tests.
- Updated tracker state:
  - `ALIGN-P1-T09` remains `incomplete`, now with selector-contract and permission-state coverage in place; remaining gap is broader ticket interaction coverage.

Verification:
- `frontend`: `npm run test` passed (9 files, 23 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Continue `ALIGN-P1-T09` with broader ticket-page interaction tests (filters, modal forms, mutation error paths), then execute `ALIGN-P1-T08` API typing/client consistency hardening.

## 2026-04-14 16:40 +08:00 - Expanded T09 with Ticket Interaction and Mutation-Error Regression

- Added tickets-page interaction regression tests:
  - `frontend/src/features/workspace/pages/TicketsPageInteractions.test.tsx`
  - covers search-filter request behavior (`search` + `page` query)
  - covers list-query error rendering in tickets table state
- Added ticket-details mutation error regression tests:
  - `frontend/src/features/workspace/pages/TicketDetailsMutations.test.tsx`
  - covers attachment upload failure path and error rendering
- Updated tracker state:
  - `ALIGN-P1-T09` remains `incomplete`, but now includes selector contracts, permission states, and key ticket interaction/mutation-error paths.
  - Critical path focus shifts to `ALIGN-P1-T08` API typing/client consistency hardening.

Verification:
- `frontend`: `npm run test` passed (11 files, 26 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Execute `ALIGN-P1-T08` by normalizing frontend API envelope and error typing on tickets and ticket-details pages, then keep `ALIGN-P1-T09` as incremental optional expansion.

## 2026-04-14 16:43 +08:00 - Started T08 API Typing and Client Consistency Hardening

- Extended shared API client error typing:
  - `frontend/src/services/api/client.ts`
  - `ApiError` now carries structured `fieldErrors` from backend `errors` payloads
  - `ApiError` now keeps parsed response `payload` for consistent downstream handling
- Applied typed field-error handling in high-risk ticket forms:
  - `TicketsPage.tsx` create/update mutations now map backend field errors into React Hook Form `setError`
  - `TicketDetailsPage.tsx` update mutation now maps backend field errors into form field messages
- Added client regression tests:
  - `frontend/src/services/api/client.test.ts`
  - validates structured validation-error parsing and auth-token clear behavior on `401`
- Continued T09 depth while on critical path:
  - `TicketsPageInteractions.test.tsx` for search-query behavior and list-query error rendering
  - `TicketDetailsMutations.test.tsx` for attachment upload failure error rendering

Verification:
- `frontend`: `npm run test` passed (12 files, 28 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Continue `ALIGN-P1-T08` by introducing typed envelope/pagination wrappers in ticket pages and aligning remaining ad hoc API call sites to shared typed client helpers.

## 2026-04-14 16:44 +08:00 - Continued T08 with Shared Ticket List API Helper

- Added shared typed ticket list helper:
  - `frontend/src/features/workspace/pages/ticketPageApi.ts`
  - new `listWorkspaceTickets` consolidates filter/pagination query-string construction.
- Updated tickets page to consume shared list helper:
  - `frontend/src/features/workspace/pages/TicketsPage.tsx`
  - removes ad hoc in-component list-path assembly.
- Expanded regression coverage:
  - `frontend/src/features/workspace/pages/ticketPageApi.test.ts` now verifies ticket-list helper query composition.

Verification:
- `frontend`: `npm run test` passed (12 files, 29 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Continue `ALIGN-P1-T08` with shared typed envelope/pagination wrappers for remaining high-risk API call sites in ticket details and settings.

## 2026-04-14 16:46 +08:00 - Continued T08 with Shared Ticket Details API Helpers

- Added shared typed ticket-details API module:
  - `frontend/src/features/workspace/pages/ticketDetailsApi.ts`
  - covers ticket get/update, transition action, and attachment upload calls
- Migrated high-risk ticket-details page calls to shared helpers:
  - `frontend/src/features/workspace/pages/TicketDetailsPage.tsx`
  - replaced ad hoc endpoint wiring for get/update/transition/upload paths
- Added helper contract regression tests:
  - `frontend/src/features/workspace/pages/ticketDetailsApi.test.ts`

Verification:
- `frontend`: `npm run test` passed (13 files, 33 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Continue `ALIGN-P1-T08` with typed envelope/pagination wrapper normalization in settings/customer modules and align remaining ad hoc `apiRequest` call sites.

## 2026-04-14 16:50 +08:00 - Continued T08 with Shared Customer and Dashboard API Helpers

- Added shared typed customer API module:
  - `frontend/src/features/workspace/pages/customerApi.ts`
  - migrated `CustomersPage.tsx` list/create/update/delete calls to shared helpers
  - added customer form server-field-error mapping using structured `ApiError.fieldErrors`
- Added shared typed dashboard API module:
  - `frontend/src/features/workspace/pages/workspaceDashboardApi.ts`
  - migrated `WorkspaceDashboardPage.tsx` customers/tickets/reporting queries to shared helpers
- Added helper contract regression tests:
  - `frontend/src/features/workspace/pages/customerApi.test.ts`
  - `frontend/src/features/workspace/pages/workspaceDashboardApi.test.ts`

Verification:
- `frontend`: `npm run test` passed (15 files, 41 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Continue `ALIGN-P1-T08` by normalizing typed envelope/meta wrappers across remaining settings and invitation/member ad hoc call sites, then keep `ALIGN-P1-T09` as optional incremental expansion.

## 2026-04-14 16:54 +08:00 - Continued T08 with Invitations, Members, and Onboarding API Extraction

- Added shared typed API modules:
  - `frontend/src/features/workspace/pages/invitationsApi.ts`
  - `frontend/src/features/workspace/pages/membersApi.ts`
  - `frontend/src/features/workspace/pages/workspaceOnboardingApi.ts`
- Migrated page-level ad hoc calls to shared helpers:
  - `InvitationsPage.tsx`
  - `MembersPage.tsx`
  - `WorkspaceOnboardingPage.tsx`
- Added structured server field-error mapping:
  - invitation form (`email`, `role_id`)
  - onboarding form (`name`, `slug`)
- Added contract regression tests:
  - `invitationsApi.test.ts`
  - `membersApi.test.ts`
  - `workspaceOnboardingApi.test.ts`

Verification:
- `frontend`: `npm run test` passed (18 files, 48 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Continue `ALIGN-P1-T08` with a final envelope/meta normalization pass (common response wrappers and residual ad hoc call sites), then decide whether to close `T08` and run a final `T09` optional expansion sweep.

## 2026-04-14 16:56 +08:00 - Continued T08 with Ticket Details Comment/Activity/Attachment Helper Extraction

- Expanded `ticketDetailsApi.ts` coverage:
  - added typed helpers for comments list, activity list, attachments list
  - added typed helpers for comment create/update/delete
- Migrated `TicketDetailsPage.tsx` to consume new helpers for these paths.
- Expanded contract tests:
  - `ticketDetailsApi.test.ts` now verifies comment/activity/attachment + comment CRUD endpoints.

Verification:
- `frontend`: `npm run test` passed (18 files, 50 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font/chunk warnings only).

## Resume From Here

Complete `ALIGN-P1-T08` with a final sweep of residual ad hoc `apiRequest` usage and typed envelope/meta normalization, then run close-out verification and decide whether to mark `T08` complete.

## 2026-04-14 17:22 +08:00 - Completed T08 Final Sweep and Closed Critical-Path API Hardening

- Completed final `ALIGN-P1-T08` API consistency sweep:
  - extracted remaining tickets-page mutation calls (create/update/bulk/delete) into shared typed helpers
  - extracted remaining ticket-details list/mutation call sites (comments/activity/attachments, watchers, checklist, related tickets, delete) into shared typed helpers
  - removed residual ad hoc page-level `apiRequest(...)` usage from `frontend/src/features/workspace/pages` (shared API modules/tests remain the only direct call sites)
- Synced tracker state:
  - `ALIGN-P1-T08` moved from `incomplete` to `complete`
  - `ALIGN-P1` next actions now point to optional incremental `ALIGN-P1-T09` regression-depth expansion

Verification:
- `frontend`: `npm run test` passed (18 files, 52 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font resolution/chunk-size warnings only).

## Resume From Here

Critical-path alignment work is complete. Continue with optional `ALIGN-P1-T09` regression-depth expansion focused on deeper ticket lifecycle edge cases and additional permission/mutation failure paths.

## 2026-04-14 20:14 +08:00 - Expanded T09 Ticket Lifecycle Regression Depth

- Added deeper ticket lifecycle frontend regression coverage in:
  - `frontend/src/features/workspace/pages/TicketDetailsMutations.test.tsx`
- New covered paths:
  - transition fallback behavior: when `/transition` returns `422`, page falls back to direct ticket PATCH status update
  - transition success messaging: backend `message` is rendered after quick transition
  - edit dialog validation mapping: backend field-level errors are surfaced inline in form fields
- Updated tracker state:
  - `ALIGN-P1-T09` remains `incomplete` (optional incremental expansion), now with added lifecycle mutation-depth coverage.

Verification:
- `frontend`: `npm run test` passed (18 files, 55 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font resolution/chunk-size warnings only).

## Resume From Here

Continue optional `ALIGN-P1-T09` expansion with watcher/checklist/related-ticket failure-state regression tests, then reassess whether to close `ALIGN-P1`.

## 2026-04-17 15:49 +08:00 - Completed T09 Failure-State Expansion and Closed ALIGN-P1

- Added watcher/checklist/related-ticket frontend mutation failure-state regression tests in:
  - `frontend/src/features/workspace/pages/TicketDetailsMutations.test.tsx`
- Added Ticket Details UI error visibility for mutation failures so failure states are surfaced to operators:
  - watcher follow/unfollow mutation errors
  - checklist add/update/delete mutation errors
  - related-ticket link/remove mutation errors
- Updated tracker state:
  - `ALIGN-P1-T09` moved from `incomplete` to `complete`
  - `ALIGN-P1` moved from `in_progress` to `complete`
  - `current_focus` cleared pending next MVP selection

Verification:
- `frontend`: `npm run test -- src/features/workspace/pages/TicketDetailsMutations.test.tsx` passed (1 file, 7 tests).
- `frontend`: `npm run test` passed (18 files, 59 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed (existing Vite font resolution/chunk-size warnings only).

## Resume From Here

Alignment hardening is complete. Pick the next MVP epic and initialize it in `project-state.yaml` before implementation.

## 2026-04-19 17:24 +08:00 - Initialized Next MVP Epic for Admin Controls UX

- Selected and initialized new epic `ADMIN-UX-P1` (Admin Workspace Controls UX Refinement) as current focus.
- Added child tasks `ADMIN-UX-P1-T01` through `ADMIN-UX-P1-T05` for schema definition, structured form implementation, regression coverage, and verification closeout.
- Synchronized `roadmap.md` from `project-state.yaml` with the new active focus and execution sequence.

Verification:
- State sync only (tracker initialization). No backend/frontend code or test commands were run in this step.

## Resume From Here

Start `ADMIN-UX-P1-T01` by mapping admin limits and feature-flags payloads to explicit form schemas, then implement structured forms in `T02` and `T03`.

## 2026-04-19 21:32 +08:00 - Completed ADMIN-UX-P1 Admin Controls Refinement

- Verified existing structured admin controls for workspace limits and feature flags already replaced raw JSON editors.
- Added mutation error mapping so backend save failures are surfaced in both editors:
  - `frontend/src/features/admin/pages/AdminDashboardPage.tsx`
- Added/expanded admin regression coverage:
  - duplicate-key parse validation for limits
  - limits mutation failure visibility
  - feature-flags mutation failure visibility
  - `frontend/src/features/admin/pages/AdminDashboardPage.test.tsx`
- Updated tracker state:
  - `ADMIN-UX-P1` moved from `in_progress` to `complete`
  - `ADMIN-UX-P1-T01` through `ADMIN-UX-P1-T05` moved to `complete`
  - `current_focus` cleared pending next MVP selection
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run test -- --run` passed (19 files, 69 tests).
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed.

## Resume From Here

Admin controls refinement is complete. Pick the next MVP epic and initialize it in `project-state.yaml` before implementation.

## 2026-04-19 22:08 +08:00 - Initialized Next MVP Epic for Frontend Performance and Asset Reliability

- Selected and initialized new epic `PERF-P1` (Frontend Performance and Asset Reliability Hardening) as current focus.
- Added child tasks `PERF-P1-T01` through `PERF-P1-T04` for baseline diagnostics, font warning resolution, route-level code splitting, and verification closeout.
- Set canonical next sequence:
  - baseline unresolved font warnings and bundle hotspots
  - implement deterministic font asset resolution
  - implement route-level splitting on heavy workspace surfaces
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- State sync only (tracker initialization). No backend/frontend code or test commands were run in this step.

## Resume From Here

Start `PERF-P1-T01` by running `frontend` `npm run build` and capturing exact unresolved font warning sources plus largest chunk outputs. Then implement `PERF-P1-T02` and `PERF-P1-T03`.

## 2026-04-19 22:18 +08:00 - Completed PERF-P1-T01 Baseline and Reframed Remaining Performance Work

- Ran baseline frontend build diagnostics for `PERF-P1-T01` and captured current warning/chunk state.
- Baseline findings:
  - unresolved font warning lines: none
  - font assets emitted successfully: `dist/assets/geist-*.woff2`
  - largest emitted JS chunks:
    - `index-DYdwSLtK.js` (229.09 kB)
    - `chunk-QFMPRPBF-BG4vWqpa.js` (92.54 kB)
    - `schemas-4JstJCYp.js` (88.46 kB)
    - `WorkspaceSettingsPage-CY8psWcw.js` (53.40 kB)
    - `select-B5KuyYx9.js` (41.01 kB)
- Confirmed route-level lazy loading already exists in:
  - `frontend/src/app/router.tsx`
  - `frontend/src/routes/workspace-routes.tsx`
  - `frontend/src/routes/auth-routes.tsx`
  - `frontend/src/routes/admin-routes.tsx`
- Updated tracker state:
  - `PERF-P1-T01` moved from `planned` to `complete`
  - `PERF-P1-T02` moved from `planned` to `incomplete` (warning issue not reproducible; pending visual font sanity check)
  - `PERF-P1-T03` moved from `planned` to `incomplete` (route splitting exists; pending shared chunk-pressure optimization)
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run build` passed (no unresolved font warning lines in output).

## Resume From Here

Perform quick typography sanity checks for `PERF-P1-T02`, then optimize large shared bundles for `PERF-P1-T03` (`index`, `chunk-QFMPRPBF-*`, `schemas`) before running `PERF-P1-T04` closeout verification.

## 2026-04-19 22:27 +08:00 - Closed T02 and Reverted Non-Beneficial T03 Chunking Attempt

- Completed `PERF-P1-T02` using current-state verification evidence:
  - unresolved font warnings remain non-reproducible in frontend build output
  - `@fontsource-variable/geist/index.css` is loaded from `src/main.tsx`
  - `src/index.css` maps `--font-sans` to `Geist Variable` and applies `font-sans` globally
- Ran a `PERF-P1-T03` implementation experiment:
  - added broad manual chunking strategy in `frontend/vite.config.ts`
  - compared build output and observed an unfavorable large vendor chunk profile (`vendor-react` surfaced at 317.83 kB)
  - reverted the chunking change to avoid locking in a risky optimization without clear payload-pressure improvement
- Updated tracker state:
  - `PERF-P1-T02` moved from `incomplete` to `complete`
  - `PERF-P1-T03` remains `incomplete` with targeted optimization still pending
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run build` passed after experiment and passed again after revert.

## Resume From Here

Implement a narrower `PERF-P1-T03` optimization strategy for shared heavy bundles (`index`, `chunk-QFMPRPBF-*`, `schemas`) with before/after build evidence, then run `PERF-P1-T04` closeout verification.

## 2026-04-19 22:34 +08:00 - Completed PERF-P1 with Settings Surface Code-Splitting and Full Verification

- Implemented targeted `PERF-P1-T03` optimization in:
  - `frontend/src/features/workspace/pages/WorkspaceSettingsPage.tsx`
- Changes made:
  - lazy-loaded settings sections (`General`, `Ticketing`, `Forms`, `Workflow`, `Security`, `Integrations`)
  - rendered only the active tab content to avoid mounting/fetching all settings sections up front
  - preserved permission-based tab visibility and guarded fallback behavior
- Build-impact evidence versus `PERF-P1-T01` baseline:
  - `WorkspaceSettingsPage` chunk reduced from `53.40 kB` to `7.17 kB`
  - section chunks are now split into dedicated route-level assets (for example `GeneralSettingsSection`, `FormsSettingsSection`, `GovernanceSettingsSection`)
- Completed `PERF-P1-T04` closeout verification:
  - `frontend` `npm run test -- --run` passed (19 files, 69 tests)
  - `frontend` `npm run lint` passed
  - `frontend` `npm run build` passed
- Updated tracker state:
  - `PERF-P1-T03` moved from `incomplete` to `complete`
  - `PERF-P1-T04` moved from `planned` to `complete`
  - `PERF-P1` moved from `in_progress` to `complete`
  - `current_focus` cleared pending next MVP selection
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run test -- --run` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run build` passed.

## Resume From Here

Performance hardening is complete. Pick the next MVP epic and initialize it in `project-state.yaml` before implementation.

## 2026-04-20 10:05 +08:00 - Initialized App-Wide UX Overhaul Tracking

- Created new umbrella epic `UX-OVERHAUL-P1` for the full-application experience redesign.
- Created first implementation wave `UX-OVERHAUL-P1-W1` for workspace CRUD surfaces.
- Added first-wave tasks for:
  - invitations action clarity
  - customers action clarity
  - tickets list clutter reduction
  - members orientation cleanup
- Recorded selected UX defaults in tracker notes:
  - modal-first interaction model
  - phased progress tracking
  - balanced-team audience
  - broader frontend workflow rethink within existing backend/API contracts
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- State sync only (tracker initialization). No frontend code or verification commands were run in this step.

## Resume From Here

Start `UX-OVERHAUL-P1-W1` with invitations and customers, then reduce tickets-page inline control noise before continuing to the next UX wave.

## 2026-04-21 21:27 +08:00 - Continued UX Overhaul Wave 2 with Settings Dialog Managers

- Reworked dense workspace settings sections so users review current configuration before editing:
  - `frontend/src/features/workspace/settings/TicketingSettingsSection.tsx`
  - `frontend/src/features/workspace/settings/FormsSettingsSection.tsx`
- Ticketing settings now keeps behavior settings and dictionary counts visible, while category/type/tag create-edit controls open in focused dialogs.
- Forms settings now keeps custom-field and template tables visible, while field/template creation and editing open in focused dialogs.
- Updated focused regression tests for the new dialog-first paths:
  - `frontend/src/features/workspace/settings/TicketingSettingsSection.test.tsx`
  - `frontend/src/features/workspace/settings/FormsSettingsSection.test.tsx`
- Updated `project-state.yaml` and `roadmap.md` so Wave 2 progress reflects ticket details plus ticketing/forms settings cleanup.

Verification:
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run src/features/workspace/settings/TicketingSettingsSection.test.tsx src/features/workspace/settings/FormsSettingsSection.test.tsx` passed.
- `frontend`: `npm run test -- --run` passed (19 files, 69 tests).
- `frontend`: `npm run build` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1-W2` by sweeping auth and admin surfaces for inline editing, missing labels, and overexposed controls.

## 2026-04-21 22:20 +08:00 - Continued UX Overhaul Wave 2 with Admin Workspace Dialog Editors

- Reworked admin workspace configuration so dense editors no longer live inline in every table row:
  - `frontend/src/features/admin/pages/AdminDashboardPage.tsx`
- Workspace rows now stay scannable with compact counts plus focused actions for usage limits and feature flags.
- Usage limit and feature-flag editing now opens in shadcn dialogs with explicit titles, descriptions, reset/save controls, and preserved server-side validation feedback.
- Updated admin regression coverage for dialog-first limits and feature-flag save/error flows:
  - `frontend/src/features/admin/pages/AdminDashboardPage.test.tsx`
- Updated `project-state.yaml` and `roadmap.md` so Wave 2 progress reflects the admin workspace cleanup.

Verification:
- `frontend`: `npm run test -- --run src/features/admin/pages/AdminDashboardPage.test.tsx` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run` passed (19 files, 69 tests).
- `frontend`: `npm run build` passed.
- Root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'` passed.
- Root: `git diff --check` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1-W2` by sweeping auth surfaces for missing labels, onboarding clarity, and overexposed controls, then run Wave 2 closeout verification.

## 2026-04-21 22:35 +08:00 - Completed UX Overhaul Wave 2 with Auth and Onboarding Cleanup

- Tightened auth/onboarding UX in:
  - `frontend/src/layouts/AuthLayout.tsx`
  - `frontend/src/features/workspace/pages/WorkspaceOnboardingPage.tsx`
- Auth layout now shows seeded local demo credentials in development instead of relying on unclear form placeholders, while production builds keep generic workspace sign-in copy.
- First-workspace onboarding now uses shared shadcn `Field` components, explicit helper text, accessible invalid states, and clearer submit/footer copy.
- Added regression coverage for the onboarding field explanations, generated slug behavior, create request, and post-create navigation:
  - `frontend/src/features/workspace/pages/WorkspaceOnboardingPage.test.tsx`
- Closed `UX-OVERHAUL-P1-W2` in `project-state.yaml` and synchronized `roadmap.md` after full frontend verification.

Verification:
- `frontend`: `npm run test -- --run src/features/workspace/pages/WorkspaceOnboardingPage.test.tsx` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run` passed (20 files, 70 tests).
- `frontend`: `npm run build` passed.
- Root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'` passed.
- Root: `git diff --check` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1` with an app-wide UX QA pass in the browser, then apply any final polish fixes and close the epic after verification.

## 2026-04-21 22:57 +08:00 - Continued UX QA with Workflow Automation Dialogs

- App-wide UX QA found workflow automation settings still had always-visible create controls that relied on placeholders instead of visible field labels.
- Reworked workflow automation settings in:
  - `frontend/src/features/workspace/settings/WorkflowAutomationSettingsSection.tsx`
- Workflow creation now opens in a focused dialog with labeled workflow, transition, permission, approval, and default-workflow fields.
- Automation rule creation now opens in a focused dialog with labeled event, priority, conditions, and actions fields.
- Transition simulation now uses visible field labels and helper text instead of placeholder-only inputs.
- Updated regression coverage for the dialog-first workflow/rule creation paths and labeled simulation flow:
  - `frontend/src/features/workspace/settings/WorkflowAutomationSettingsSection.test.tsx`
- Updated `project-state.yaml` and `roadmap.md` so the remaining UX-overhaul work points to final app-wide QA surfaces.

Verification:
- `frontend`: `npm run test -- --run src/features/workspace/settings/WorkflowAutomationSettingsSection.test.tsx` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run` passed (20 files, 71 tests).
- `frontend`: `npm run build` passed.
- Root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'` passed.
- Root: `git diff --check` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1` with app-wide UX QA on remaining settings surfaces such as governance/security and integrations edge states, then apply final polish and close the epic after verification.

## 2026-04-22 16:47 +08:00 - Continued UX QA with Governance Identity Dialogs

- App-wide UX QA found governance/security identity setup still exposed dense SSO and SCIM creation controls inline.
- Reworked governance settings in:
  - `frontend/src/features/workspace/settings/GovernanceSettingsSection.tsx`
- Identity provider creation now opens in a focused dialog with labeled OIDC/SAML fields and secret guidance.
- SCIM directory creation now opens in a focused dialog that warns the provisioning token is shown once.
- Existing provider and directory lists stay visible for review without permanently exposing create forms.
- Updated regression coverage for dialog-first identity provider and SCIM directory creation:
  - `frontend/src/features/workspace/settings/GovernanceSettingsSection.test.tsx`
- Updated `project-state.yaml` and `roadmap.md` so remaining UX QA points to governance controls, SLA/break-glass forms, and integrations edge states.

Verification:
- `frontend`: `npm run test -- --run src/features/workspace/settings/GovernanceSettingsSection.test.tsx` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run` passed (20 files, 73 tests).
- `frontend`: `npm run build` passed.
- Root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'` passed.
- Root: `git diff --check` passed.
- `frontend`: `npm run test -- --run` passed (20 files, 72 tests).
- `frontend`: `npm run build` passed.
- Root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'` passed.
- Root: `git diff --check` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1` with app-wide UX QA on remaining governance controls, SLA/break-glass forms, and integrations edge states, then apply final polish and close the epic after verification.

## 2026-04-22 16:50 +08:00 - Continued UX QA with Governance SLA and Break-Glass Dialogs

- App-wide UX QA found SLA creation and break-glass requests still exposed edit controls inline.
- Reworked governance settings in:
  - `frontend/src/features/workspace/settings/GovernanceSettingsSection.tsx`
- SLA policy creation now opens in a focused dialog with visible labels for policy name, priority, first response, and resolution targets.
- Break-glass access requests now open in a focused dialog with a labeled reason field and audit-review helper copy.
- Existing SLA policies and break-glass requests stay visible for review without permanently exposing create/request forms.
- Updated regression coverage for dialog-first SLA creation and break-glass request flows:
  - `frontend/src/features/workspace/settings/GovernanceSettingsSection.test.tsx`
- Updated `project-state.yaml` and `roadmap.md` so remaining UX QA points to integrations edge states and any residual governance review-only states.

Verification:
- `frontend`: `npm run test -- --run src/features/workspace/settings/GovernanceSettingsSection.test.tsx` passed.
- `frontend`: `npm run lint` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1` with app-wide UX QA on integrations edge states and any remaining governance review-only states, then apply final polish and close the epic after verification.

## 2026-04-22 17:26 +08:00 - Continued UX QA with Integrations Endpoint Dialog

- App-wide UX QA found integrations settings still exposed webhook endpoint creation inline on the default settings surface.
- Reworked integrations settings in:
  - `frontend/src/features/workspace/settings/IntegrationsSettingsSection.tsx`
- Webhook endpoint creation now opens in a focused dialog with visible labels and helper text for endpoint name, URL, signing secret, and subscribed events.
- The default integrations surface now stays focused on reviewing configured endpoints and delivery logs.
- Updated regression coverage for dialog-first webhook endpoint creation:
  - `frontend/src/features/workspace/settings/IntegrationsSettingsSection.test.tsx`
- Updated `project-state.yaml` and `roadmap.md` so remaining UX QA points to final governance review-only states and epic closeout.

Verification:
- `frontend`: `npm run test -- --run src/features/workspace/settings/IntegrationsSettingsSection.test.tsx` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run` passed (20 files, 73 tests).
- `frontend`: `npm run build` passed.
- Root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'` passed.
- Root: `git diff --check` passed.

## Resume From Here

Continue `UX-OVERHAUL-P1` with final app-wide UX QA on any remaining governance review-only states, then apply final polish and close the epic after verification.

## 2026-04-22 17:39 +08:00 - Closed App-Wide UX Overhaul

- Final governance UX QA found retention policy and tenant security policy editors still exposed dense always-on controls.
- Reworked governance settings in:
  - `frontend/src/features/workspace/settings/GovernanceSettingsSection.tsx`
- Retention policy editing now opens in a focused dialog while the default card shows reviewable retention windows.
- Tenant security policy editing now opens in a focused dialog while the default card shows SSO, MFA, session, tenant mode, and allowlist status.
- Added calmer empty states for exports, SLA policies, break-glass requests, audit events, identity providers, and SCIM directories.
- Updated regression coverage for retention and security policy dialog-first flows:
  - `frontend/src/features/workspace/settings/GovernanceSettingsSection.test.tsx`
- Marked `UX-OVERHAUL-P1` complete in `project-state.yaml` and synchronized `roadmap.md`.

Verification:
- `frontend`: `npm run test -- --run src/features/workspace/settings/GovernanceSettingsSection.test.tsx` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm run test -- --run` passed (20 files, 74 tests).
- `frontend`: `npm run build` passed.

## Resume From Here

`UX-OVERHAUL-P1` is complete. Choose the next product or technical roadmap item before starting new implementation work.

## 2026-04-23 21:05 +08:00 - Initialized Existing Feature Hardening Program and Closed First Coverage Gaps

- Started new epic `HARDEN-P1` in `project-state.yaml` because all previously tracked epics were complete and `current_focus` was empty.
- Audited the current product surface against:
  - `backend/routes/api.php`
  - frontend routes, layouts, pages, and settings sections
  - existing backend/frontend regression coverage
- Confirmed the current baseline was green before changes:
  - `frontend`: `npm run lint`
  - `frontend`: `npm test`
  - `frontend`: `npm run build`
  - `backend`: `composer test`
- The highest-value immediate gap was sparse regression depth outside tickets/settings, especially around:
  - login routing and return-path behavior
  - shared route guards and admin entry conditions
  - workspace shell navigation/logout resilience
  - dashboard permission and degraded-access states
- Added new regression coverage in:
  - `frontend/src/features/auth/pages/LoginPage.test.tsx`
  - `frontend/src/components/route-guards.test.tsx`
  - `frontend/src/layouts/WorkspaceLayout.test.tsx`
  - `frontend/src/features/workspace/pages/WorkspaceDashboardPage.test.tsx`
- Marked the audit and first regression-depth wave complete under `HARDEN-P1-T01` through `HARDEN-P1-T04`.
- Left browser critical-path QA and hardening closeout open as the remaining work under `HARDEN-P1-T05` and `HARDEN-P1-T06`.

Verification:
- `frontend`: `npm test -- --run src/features/auth/pages/LoginPage.test.tsx src/components/route-guards.test.tsx src/layouts/WorkspaceLayout.test.tsx src/features/workspace/pages/WorkspaceDashboardPage.test.tsx` passed.
- `frontend`: `npm run lint` passed.
- `frontend`: `npm test` passed (24 files, 88 tests).
- `frontend`: `npm run build` passed.
- `backend`: `composer test` passed.
- Root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'` passed.
- Root: `git diff --check` passed.

## Resume From Here

Continue `HARDEN-P1` by running the expanded frontend test suite, lint/build, backend tests, and then execute browser critical-path QA to catch any remaining end-to-end gaps.

## 2026-04-24 07:15 +08:00 - Ran Live Browser QA Smoke Pass for Hardening Epic

- Started the Ticketing app from this repo for live validation:
  - `backend`: `php artisan serve --host=127.0.0.1 --port=8000`
  - `frontend`: `npm run dev -- --host localhost --port 5173`
- Used seeded credentials from `SEED_CREDENTIALS.md` to exercise the running app in the browser.
- Browser QA paths successfully exercised:
  - workspace-user login with `user@ticketing.local`
  - workspace overview/dashboard load
  - customers directory load
  - ticket queue load
  - ticket details load
  - settings route load including Security & Access tab
  - workspace logout
  - platform-admin login with `admin@ticketing.local`
  - admin dashboard/control-plane load
  - admin logout
- No new browser-only defects were observed in the exercised paths.
- Remaining browser QA scope is now narrower:
  - onboarding with a fresh user / disposable tenant setup
  - create/delete mutation paths that should be exercised against disposable data before epic closeout
- Updated `project-state.yaml` and `roadmap.md` so `HARDEN-P1-T05` reflects partial completion with the remaining browser gaps called out explicitly.

Verification:
- Live browser smoke pass completed against `http://localhost:5173` with the local `backend` server on `http://127.0.0.1:8000`.

## Resume From Here

Continue `HARDEN-P1` by validating onboarding and disposable create/delete mutation flows in the browser, then run the final verification/closeout pass.

## 2026-04-24 07:20 +08:00 - Closed Remaining Hardening QA and Completed Epic Closeout

- Finished the remaining `HARDEN-P1-T05` QA gap with disposable data instead of touching seeded demo records.
- Validated onboarding coverage with a fresh disposable user by:
  - registering the user,
  - confirming `/api/workspaces` returned zero workspaces,
  - creating a new workspace,
  - confirming owner/bootstrap access via `/access`,
  - confirming the new owner appeared in `/members/assignable`.
- Validated disposable mutation coverage by:
  - creating a disposable customer,
  - creating a disposable ticket against that customer,
  - deleting the disposable ticket,
  - deleting the disposable customer,
  - confirming both list endpoints returned empty results afterward.
- Marked `HARDEN-P1-T05` complete because critical onboarding and create/delete flows are now exercised with runtime evidence.
- Marked `HARDEN-P1-T06` complete after final verification passed.
- Marked `HARDEN-P1` complete and cleared `current_focus` because all child tasks now meet their definition of done.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run lint`
- `frontend`: `npm test`
- `frontend`: `npm run build`
- `backend`: `composer test`
- root: `ruby -e 'require "yaml"; YAML.load_file("project-state.yaml"); puts "project-state.yaml: OK"'`
- root: `git diff --check`

## Resume From Here

All tracked hardening work is complete. Resume by selecting the next highest-priority MVP item only when new scope is intentionally opened.

## 2026-04-24 07:25 +08:00 - Initialized Frontend Maintainability Epic and Completed First Shared Ticket Form Extraction

- Started new epic `MAINT-P1` after the tracker returned to an all-complete state and a codebase scan showed the main remaining engineering risk had shifted to oversized frontend screens.
- Used the current codebase, not stale roadmap notes, to pick scope:
  - `TicketDetailsPage.tsx` at 1727 lines,
  - `TicketsPage.tsx` at 1421 lines,
  - `AdminDashboardPage.tsx` at 832 lines,
  - `GovernanceSettingsSection.tsx` at 830 lines.
- Completed `MAINT-P1-T01` by extracting duplicated ticket-form logic into `frontend/src/features/workspace/pages/ticketForm.ts`.
- Centralized:
  - shared ticket-form schema,
  - default values,
  - server-side field error mapping,
  - tag parsing,
  - custom-field payload building,
  - template-based custom-field filtering.
- Updated `TicketsPage.tsx` and `TicketDetailsPage.tsx` to consume the shared module instead of carrying duplicated helper logic inline.
- Added `frontend/src/features/workspace/pages/ticketForm.test.ts` to lock down the extracted helper behavior.
- Fixed roadmap drift introduced during the prior closeout by removing the duplicate `HARDEN-P1` status line and setting the next active focus explicitly.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/pages/ticketForm.test.ts`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Continue `MAINT-P1` with `MAINT-P1-T02` by decomposing `TicketsPage.tsx` around the new shared ticket-form module, then move to `MAINT-P1-T03` for `TicketDetailsPage.tsx`.

## 2026-04-24 07:35 +08:00 - Started TicketsPage Decomposition Under Maintainability Epic

- Advanced `MAINT-P1-T02` from `planned` to `incomplete`.
- Extracted ticket dialog form rendering from `frontend/src/features/workspace/pages/TicketsPage.tsx` into `frontend/src/features/workspace/pages/TicketFormFields.tsx`.
- Kept the extracted form on top of the shared `ticketForm.ts` contract added earlier in the session.
- Reduced `TicketsPage.tsx` by removing one large local rendering block without changing route behavior or ticket mutation flow.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/pages/ticketForm.test.ts`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Continue `MAINT-P1-T02` by extracting `TicketsPage.tsx` filter, saved-view, table, and bulk-control concerns into focused modules, then move to `MAINT-P1-T03` for `TicketDetailsPage.tsx`.

## 2026-04-24 08:10 +08:00 - Extracted TicketsPage Controls Sheet During Maintainability Pass

- Continued `MAINT-P1-T02` by extracting the saved-view, filter, and bulk-action controls sheet from `frontend/src/features/workspace/pages/TicketsPage.tsx`.
- Added `frontend/src/features/workspace/pages/TicketQueueControlsSheet.tsx` and moved the controls-panel rendering there.
- Kept `TicketsPage.tsx` responsible for state and mutations while reducing render-surface size and coupling.
- Updated canonical tracker notes so `MAINT-P1-T02` now reflects two landed extractions:
  - `TicketFormFields.tsx`
  - `TicketQueueControlsSheet.tsx`
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/pages/ticketForm.test.ts`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Continue `MAINT-P1-T02` by extracting the `TicketsPage.tsx` queue table and row-action surface into a focused module, then move to `MAINT-P1-T03` for `TicketDetailsPage.tsx`.

## 2026-04-25 20:55 +08:00 - Extracted TicketsPage Queue Table Surface

- Continued `MAINT-P1-T02` by extracting the queue list rendering from `frontend/src/features/workspace/pages/TicketsPage.tsx`.
- Added `frontend/src/features/workspace/pages/TicketQueueTable.tsx` and moved:
  - loading, error, and empty states,
  - table markup,
  - row action buttons,
  - selection UI,
  - pagination rendering.
- Kept `TicketsPage.tsx` responsible for mutation wiring and edit/delete handler orchestration while reducing another large render block.
- Updated canonical tracker notes so `MAINT-P1-T02` now reflects three landed `TicketsPage` extractions:
  - `TicketFormFields.tsx`
  - `TicketQueueControlsSheet.tsx`
  - `TicketQueueTable.tsx`
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/pages/ticketForm.test.ts`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Continue `MAINT-P1-T02` by reducing the remaining `TicketsPage.tsx` orchestration and inline action helpers, then move to `MAINT-P1-T03` for `TicketDetailsPage.tsx`.

## 2026-04-25 21:35 +08:00 - Closed TicketsPage Decomposition Task

- Completed the remaining `MAINT-P1-T02` cleanup after the earlier form, controls-sheet, and queue-table extractions.
- Added `frontend/src/features/workspace/pages/TicketQueueSearchBar.tsx` to own the search and active-summary strip above the queue.
- Added `frontend/src/features/workspace/pages/ticketQueueHelpers.ts` to centralize:
  - create-form defaults,
  - edit-form value seeding from a ticket record,
  - active-filter counting,
  - selected saved-view label lookup.
- Updated `TicketsPage.tsx` to consume the new helper module and search component.
- Marked `MAINT-P1-T02` complete because the page now delegates its major render surfaces and no longer carries the original monolithic structure.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/pages/ticketForm.test.ts`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Continue `MAINT-P1-T03` by extracting `TicketDetailsPage.tsx` edit and mutation sections into focused modules, then move to the oversized governance/admin surfaces in `MAINT-P1-T04`.

## 2026-04-25 22:12 +08:00 - Closed TicketDetailsPage Decomposition Task

- Completed `MAINT-P1-T03` by extracting the remaining ticket-details mutation surfaces out of `frontend/src/features/workspace/pages/TicketDetailsPage.tsx`.
- Added `frontend/src/features/workspace/pages/TicketDetailsEditSheet.tsx` for the shared ticket edit sheet UI and kept it on top of the centralized `ticketForm.ts` contract.
- Added `frontend/src/features/workspace/pages/TicketDetailsSupportDialogs.tsx` to own:
  - add-comment,
  - checklist,
  - attachments,
  - watchers,
  - related-ticket dialogs.
- Expanded `frontend/src/features/workspace/pages/ticketDetailsHelpers.ts` so the details route no longer keeps dialog schemas, local helper types, and formatting utilities inline.
- Reduced `TicketDetailsPage.tsx` from 1322 lines to 1013 lines while preserving route behavior and keeping the main page focused on query and mutation orchestration.
- Marked `MAINT-P1-T03` complete and updated the epic next actions to move on to `MAINT-P1-T04`.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Start `MAINT-P1-T04` by extracting the highest-churn admin and governance editor sections into focused modules, then run `MAINT-P1-T05` closeout verification.

## 2026-04-25 22:28 +08:00 - Started Admin and Governance Decomposition Task

- Advanced `MAINT-P1-T04` from `planned` to `incomplete`.
- Added `frontend/src/features/admin/pages/AdminWorkspaceEditorDialog.tsx` to own the shared workspace limits and feature-flags dialog/editor surface.
- Added `frontend/src/features/admin/pages/adminWorkspaceEditorHelpers.ts` to centralize:
  - draft-row typing,
  - draft-row creation and parsing,
  - admin mutation error message shaping.
- Updated `frontend/src/features/admin/pages/AdminDashboardPage.tsx` to delegate both workspace editor dialogs to the new module, reducing the page from 832 lines to 595 lines.
- Left `MAINT-P1-T04` open because additional oversized governance or admin sections still need extraction before the task can close.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Continue `MAINT-P1-T04` by extracting the next highest-churn governance or admin editor section into a focused module, then run `MAINT-P1-T05` closeout verification.

## 2026-04-26 00:05 +08:00 - Closed Admin and Governance Decomposition Task

- Completed `MAINT-P1-T04` by extracting the remaining admin tab rendering from `frontend/src/features/admin/pages/AdminDashboardPage.tsx`.
- Added `frontend/src/features/admin/pages/AdminDashboardTabs.tsx` to own:
  - workspace tab search and table rendering,
  - user tab search and table rendering,
  - workspace action button layout.
- Reduced `AdminDashboardPage.tsx` from 595 lines to 375 lines while keeping platform metrics, queries, and mutation orchestration in the route component.
- Marked `MAINT-P1-T04` complete because both targeted oversized surfaces now delegate focused child modules:
  - `AdminDashboardPage.tsx`
  - `GovernanceSettingsSection.tsx`
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Run `MAINT-P1-T05` closeout verification for the maintainability epic.

## 2026-04-26 00:22 +08:00 - Closed Maintainability Epic

- Completed `MAINT-P1-T05` and closed `MAINT-P1`.
- A targeted governance regression surfaced during closeout:
  - `GovernanceSettingsSection.test.tsx` failed because the extracted dialog changed visible label text from `Client secret` to `Client Secret`.
- Restored the original label text in `frontend/src/features/workspace/settings/GovernanceSettingsDialogs.tsx` to preserve existing UI wording and keep the test contract intact.
- Re-ran the full closeout verification set successfully:
  - `frontend`: `npm test`
  - `frontend`: `npm run lint`
  - `frontend`: `npm run build`
  - root: YAML validation for `project-state.yaml`
  - root: `git diff --check`
- Cleared `current_focus` because all tracked maintainability work is complete.
- Synchronized `roadmap.md` from `project-state.yaml`.

## Resume From Here

Select the next intentional epic before doing more implementation work.

## 2026-04-27 07:27 +08:00 - Started Settings Maintainability Epic

- Initialized new epic `MAINT-P2` after `MAINT-P1` closed and the tracker returned to no active items.
- Selected the next maintainability target from the remaining oversized settings surfaces:
  - `WorkflowAutomationSettingsSection.tsx`
  - `TicketingSettingsSection.tsx`
  - `FormsSettingsSection.tsx`
- Completed `MAINT-P2-T01` by extracting the workflow and automation creation dialogs from `frontend/src/features/workspace/settings/WorkflowAutomationSettingsSection.tsx`.
- Added `frontend/src/features/workspace/settings/WorkflowAutomationDialogs.tsx` and reduced `WorkflowAutomationSettingsSection.tsx` from 564 lines to 457 lines while preserving visible dialog wording and flow behavior.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/settings/WorkflowAutomationSettingsSection.test.tsx`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Start `MAINT-P2-T02` by decomposing `TicketingSettingsSection.tsx`.

## 2026-04-27 20:13 +08:00 - Added Customer Profile Enrichment Roadmap Epic

- Reviewed the current customer contract before adding roadmap scope:
  - backend persistence stores only `name`, `email`, `phone`, and `company`
  - the customer API resource returns only those fields plus timestamps
  - the workspace customer UI only creates, edits, lists, and searches against that minimal record
- Added new planned epic `CUST-P1` to capture the missing customer-context work without disrupting the active `MAINT-P2` refactor.
- Scoped the new epic around helpdesk-relevant customer enrichment instead of CRM sprawl.
- Recorded the recommended first-pass customer fields in canonical state:
  - `job_title`
  - `website`
  - `timezone`
  - `preferred_contact_method`
  - `preferred_language`
  - `address`
  - `external_reference`
  - `support_tier`
  - `status`
  - `internal_notes`
- Added child tasks for:
  - schema and boundary definition
  - backend model and API expansion
  - customer UI and ticket touchpoint expansion
  - verification and epic closeout
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- root: YAML validation for `project-state.yaml`

## Resume From Here

Start `MAINT-P2-T02` by decomposing `TicketingSettingsSection.tsx`. After `MAINT-P2`, begin `CUST-P1-T01`.

## 2026-04-28 18:38 +08:00 - Completed Ticketing Settings Decomposition

- Completed `MAINT-P2-T02` by extracting the ticketing dictionary UI from `frontend/src/features/workspace/settings/TicketingSettingsSection.tsx`.
- Added `frontend/src/features/workspace/settings/TicketingDictionaryDialogs.tsx` to own:
  - dictionary counts and summary cards,
  - category/type/tag management dialogs,
  - inline create forms,
  - the reusable dictionary editor.
- Kept query, mutation, and draft-state orchestration in `TicketingSettingsSection.tsx` to preserve existing behavior.
- Reduced `TicketingSettingsSection.tsx` from 522 lines to 312 lines.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/settings/TicketingSettingsSection.test.tsx`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Start `MAINT-P2-T03` by decomposing `FormsSettingsSection.tsx`. After that, run `MAINT-P2-T04` closeout verification, then begin `CUST-P1-T01`.

## 2026-04-28 18:59 +08:00 - Closed Settings Maintainability Epic

- Completed `MAINT-P2-T03` by extracting forms settings UI from `frontend/src/features/workspace/settings/FormsSettingsSection.tsx`.
- Added `frontend/src/features/workspace/settings/FormsSettingsDialogs.tsx` to own:
  - custom-field and form-template summaries,
  - overview tables,
  - management dialogs,
  - create forms and edit controls.
- Kept query, mutation, and draft-state orchestration in `FormsSettingsSection.tsx` to preserve existing behavior.
- Reduced `FormsSettingsSection.tsx` from 450 lines to 272 lines.
- Completed `MAINT-P2-T04` and closed `MAINT-P2`.
- Moved `current_focus` to `CUST-P1`.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/settings/FormsSettingsSection.test.tsx`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm test`
- root: YAML validation for `project-state.yaml`
- root: `git diff --check`

## Resume From Here

Start `CUST-P1-T01` by locking the exact customer-profile field set and UI boundaries.

## 2026-04-28 20:19 +08:00 - Completed Customer Profile Scope Definition

- Completed `CUST-P1-T01` after validating the current customer surface:
  - backend `Customer` model, request validation, resource, controller, and route permissions,
  - frontend `Customer` type, customer API helper, customer directory page, and ticket selector usage.
- Locked the first-pass customer profile fields:
  - `job_title`
  - `website`
  - `timezone`
  - `preferred_contact_method`
  - `preferred_language`
  - `address`
  - `external_reference`
  - `support_tier`
  - `status`
  - `internal_notes`
- Set `internal_notes` as the only internal-only field for this pass.
- Kept ticket selectors and embedded ticket customer summaries lightweight at `id`, `name`, and `email`.
- Defined search expansion for `phone`, `job_title`, `website`, `external_reference`, `support_tier`, and `status`; excluded `address` and `internal_notes` from default search.
- Moved `CUST-P1` to `in_progress` and synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- root: YAML validation for `project-state.yaml`
- root: `git diff --check`

## Resume From Here

Start `CUST-P1-T02` by extending backend customer persistence, validation, resources, and search behavior for the locked field set.

## 2026-04-28 20:33 +08:00 - Completed Customer Backend Profile Contract

- Completed `CUST-P1-T02`.
- Added `backend/database/migrations/2026_04_28_201913_add_profile_fields_to_customers_table.php` for:
  - `job_title`
  - `website`
  - `timezone`
  - `preferred_contact_method`
  - `preferred_language`
  - `address`
  - `external_reference`
  - `support_tier`
  - `status`
  - `internal_notes`
- Updated backend customer fillable fields, store/update validation, and `CustomerResource` output.
- Expanded customer search to include approved operational fields:
  - `phone`
  - `job_title`
  - `website`
  - `external_reference`
  - `support_tier`
  - `status`
- Kept `address` and `internal_notes` out of default customer search.
- Updated frontend `Customer` API typing for the expanded resource contract.
- Added backend regression coverage for:
  - create/update profile output,
  - invalid website/timezone validation,
  - searchable enriched fields,
  - excluded address/internal-notes search behavior.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `backend`: `php artisan test --filter=CustomersCrudTest`
- `backend`: `php artisan test --filter='customer_list_supports_search_filter'`
- `backend`: `./vendor/bin/pint --dirty --test`
- `backend`: `composer test`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Start `CUST-P1-T03` by expanding customer create/edit/list/detail UI for the locked profile fields while keeping ticket touchpoints lightweight.

## 2026-04-28 21:21 +08:00 - Closed Customer Profile Enrichment Epic

- Completed `CUST-P1-T03`.
- Expanded `frontend/src/features/workspace/pages/CustomersPage.tsx` with grouped profile fields:
  - Identity
  - Account
  - Preferences
  - Support
- Updated customer create/edit payload mapping for all approved profile fields.
- Updated the customer table with compact support and account indicators instead of adding every profile field as a column.
- Added a focused customer profile details dialog for full profile review, including address and internal notes.
- Kept ticket selectors and ticket embedded customer summaries lightweight.
- Updated `frontend/src/features/workspace/pages/customerApi.ts` and `customerApi.test.ts` for the expanded payload contract.
- Added `frontend/src/features/workspace/pages/CustomersPage.test.tsx` for enriched profile display, details, and create payload coverage.
- Completed `CUST-P1-T04` and closed `CUST-P1`.
- Cleared `current_focus` because all tracked customer profile work is complete.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm test -- --run src/features/workspace/pages/CustomersPage.test.tsx`
- `frontend`: `npm test -- --run src/features/workspace/pages/customerApi.test.ts`
- `frontend`: `npm test -- --run src/features/workspace/pages/CustomersPage.test.tsx src/features/workspace/pages/customerApi.test.ts`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm test`
- `backend`: `./vendor/bin/pint --dirty --test`
- `backend`: `composer test`
- root: YAML validation for `project-state.yaml`
- root: `git diff --check`

## Resume From Here

Select the next intentional epic before doing more implementation work.

## 2026-04-25 22:41 +08:00 - Continued Governance Decomposition

- Continued `MAINT-P1-T04` by extracting the stacked governance dialog surfaces out of `frontend/src/features/workspace/settings/GovernanceSettingsSection.tsx`.
- Added `frontend/src/features/workspace/settings/GovernanceSettingsDialogs.tsx` to own:
  - retention policy,
  - security policy,
  - SLA policy,
  - break-glass,
  - identity provider,
  - SCIM directory dialogs.
- Updated `GovernanceSettingsSection.tsx` to delegate those dialogs and keep the route focused on summary cards, list rendering, and mutation wiring.
- Reduced `GovernanceSettingsSection.tsx` from 830 lines to 565 lines.
- Kept `MAINT-P1-T04` open because there is still room to extract another focused admin or governance subsection before closeout.
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

## Resume From Here

Continue `MAINT-P1-T04` by extracting the next highest-churn governance or admin editor section into a focused module, then run `MAINT-P1-T05` closeout verification.

## 2026-04-29 18:13 +08:00 - Completed Repository Cleanup Pass

- Added and completed `CLEAN-P1` in `project-state.yaml`.
- Removed ignored/generated local leftovers:
  - root `.DS_Store`
  - root `node_modules/`
  - `frontend/dist/`
  - `backend/storage/framework/testing/`
  - stale root `app/`, `src/`, and `test/` scaffolding
- Removed unused Vite starter frontend files and assets.
- Removed Laravel starter welcome-view assets, zero-byte backend favicon, backend Vite config, and Laravel skeleton example tests.
- Removed duplicate root npm package files.
- Updated `backend/routes/web.php` so `/` returns a minimal backend status response.
- Trimmed backend composer/package scripts around the removed backend Vite starter workflow.
- Removed ignored Playwright/browser output folders from the repo root:
  - `.playwright-cli/`
  - `output/`
- Synchronized `roadmap.md` from `project-state.yaml`.

Verification:
- `backend`: `composer test`
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`

## Resume From Here

Start the separate refactor audit only when requested; cleanup-only scope is complete.

## 2026-04-29 18:24 +08:00 - Started Standards Alignment Refactor

- Added `REFACTOR-P1` as the active tracker item.
- Replaced Laravel starter backend README content with project-specific backend setup, development, and verification notes.
- Replaced Vite starter frontend README content with project-specific frontend setup, development, and verification notes.
- Updated backend Composer metadata from Laravel skeleton defaults to Ticketing backend metadata.
- Removed the stale Laravel asset publish hook from Composer scripts because backend Vite starter assets were removed during cleanup.
- Refreshed `backend/composer.lock` content hash with `composer update --lock`; package versions did not change.
- Restored the Laravel-standard `backend/tests/Unit/` suite directory with `.gitkeep` so PHPUnit can run without bringing back fake example tests.
- Recorded next audit targets:
  - app-owned oversized frontend screens and backend controllers,
  - frontend API modules currently colocated under page folders,
  - backend route/controller grouping pressure.

Verification:
- `backend`: `composer validate --no-check-publish`
- `backend`: `composer test`

## Resume From Here

Continue `REFACTOR-P1` by ranking the remaining code-structure targets, then choose one safe extraction with focused tests.

## 2026-04-29 18:28 +08:00 - Aligned Workspace Frontend API Boundary

- Moved workspace API modules and their tests into `frontend/src/features/workspace/api/`.
- Removed API modules from UI-focused folders:
  - `frontend/src/features/workspace/pages/`
  - `frontend/src/features/workspace/settings/`
- Updated page and settings imports to use `@/features/workspace/api/...`.
- Updated Vitest mocks so component tests mock the same API module paths used by production imports.
- Kept function names and request behavior unchanged.

Verification:
- `frontend`: focused API/settings/page test run passed, 14 files / 49 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by ranking oversized app-owned screens/controllers. Avoid shadcn primitives and broad test files unless a specific defect requires it.

## 2026-04-29 18:35 +08:00 - Reduced Ticket Details Mutation Duplication

- Scanned oversized app-owned files and repeated function blocks.
- Picked `frontend/src/features/workspace/pages/TicketDetailsPage.tsx` as the safest next target because it is large, app-owned, and covered by focused tests.
- Centralized repeated ticket query invalidation blocks into local helpers:
  - ticket record invalidation
  - ticket activity invalidation
  - ticket comments invalidation
  - ticket attachments invalidation
  - ticket list invalidation
  - common combined invalidation flows
- Kept mutation functions, API requests, query keys, and UI behavior unchanged.
- Noted that a new `Add root dev runner` commit re-added root package files; those were restored to avoid mixing unrelated changes into this refactor.

Verification:
- `frontend`: focused ticket-details test run passed, 3 files / 20 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting one read-only `TicketDetailsPage.tsx` presentation section or one mutation group into a focused module.

## 2026-04-29 18:40 +08:00 - Extracted Ticket Details Overview Cards

- Added `frontend/src/features/workspace/pages/TicketDetailsOverviewCards.tsx`.
- Moved read-only ticket-details presentation rendering out of `TicketDetailsPage.tsx`:
  - ticket summary card
  - activity timeline card
  - SLA card
  - ticket tools card
  - custom fields card
- Moved presentation-only helpers with the new components:
  - full-name formatting
  - activity action humanization
  - custom-field value formatting
  - detail item rendering
- Kept mutation orchestration, comments editing, and dialog wiring in `TicketDetailsPage.tsx` for a later, separate slice.

Verification:
- `frontend`: focused ticket-details page tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting comments rendering/editing or one mutation group from `TicketDetailsPage.tsx`.

## 2026-04-30 22:21 +08:00 - Extracted Ticket Details Comments Card

- Added `frontend/src/features/workspace/pages/TicketDetailsCommentsCard.tsx`.
- Moved comments rendering/editing out of `TicketDetailsPage.tsx`:
  - public/internal comment badges
  - author and edited metadata
  - edit/save/cancel controls
  - delete action callback
  - comment attachment display and download callback
- Kept data fetching, mutation orchestration, confirmation prompts, and query invalidation in `TicketDetailsPage.tsx`.
- Reduced `TicketDetailsPage.tsx` to 828 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting one mutation group or dialog wiring group from `TicketDetailsPage.tsx`.

## 2026-04-30 22:24 +08:00 - Extracted Ticket Details Header

- Added `frontend/src/features/workspace/pages/TicketDetailsHeader.tsx`.
- Moved ticket header rendering and action button state rules out of `TicketDetailsPage.tsx`:
  - ticket number, status, and priority badges
  - title and description display
  - quick transition buttons
  - add-comment, follow/unfollow, edit, and delete action buttons
- Kept confirmation prompts, mutations, route navigation, and query invalidation in `TicketDetailsPage.tsx`.
- Reduced `TicketDetailsPage.tsx` to 767 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting one mutation group or support dialog wiring group from `TicketDetailsPage.tsx`.

## 2026-04-30 22:26 +08:00 - Extracted Ticket Watcher Mutations

- Added `frontend/src/features/workspace/pages/useTicketDetailsWatcherMutations.ts`.
- Moved follow/unfollow watcher mutations out of `TicketDetailsPage.tsx`.
- Kept route-owned query invalidation as an injected callback so the hook owns only the watcher mutation group.
- Reduced `TicketDetailsPage.tsx` to 758 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting another small mutation group or support dialog wiring group from `TicketDetailsPage.tsx`.

## 2026-05-02 17:44 +08:00 - Re-ranked Refactor Targets

- Re-ranked remaining app-owned oversized files after the ticket-details extraction pass.
- Closed `REFACTOR-P1` because its definition of done is now satisfied:
  - starter metadata/docs were replaced
  - frontend API boundaries were aligned under `frontend/src/features/workspace/api/`
  - safe behavior-preserving ticket-details extractions were landed and verified incrementally
  - remaining oversized targets were re-ranked by risk and value
- Created `REFACTOR-P2` for the next decomposition pass instead of stretching the completed standards-alignment item.
- Current priority order:
  - `CustomersPage.tsx` (678 lines)
  - `TicketsPage.tsx` (608 lines)
  - `GovernanceSettingsSection.tsx` / `GovernanceSettingsDialogs.tsx` (565/520 lines)
  - `frontend/src/types/api.ts` (529 lines)
  - `TicketController.php` (511 lines)
  - `settings-api.ts` (477 lines)
  - `WorkflowAutomationSettingsSection.tsx` (457 lines)

Verification:
- `project-state.yaml` parsed successfully with Ruby YAML.
- `git diff --check` passed.

Progress:
- `REFACTOR-P1`: 100% complete.
- `REFACTOR-P2`: 0% complete.

## Resume From Here

Start `REFACTOR-P2` with `CustomersPage.tsx`. Prefer a behavior-preserving extraction of customer table rendering, profile/details dialog rendering, or customer form sections, then run focused frontend tests plus lint/build before committing and pushing.

## 2026-05-02 18:27 +08:00 - Decomposed Customer Directory Route

- Added `frontend/src/features/workspace/pages/customerForm.ts` for customer form schema, defaults, payload mapping, and API field-error mapping.
- Added `CustomerFormFields.tsx`, `CustomerProfileDetails.tsx`, and `CustomersTable.tsx`.
- Kept `CustomersPage.tsx` responsible for workspace access checks, query state, dialogs, and mutations.
- Reduced `CustomersPage.tsx` from 678 to 312 lines.
- Removed generated `frontend/dist/` output after the production build.

Verification:
- `frontend`: `npm run test -- CustomersPage.test.tsx`, 1 file / 2 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

Progress:
- Overall tracker progress: 61 of 62 work items complete, 98.4% overall.
- `REFACTOR-P2`: in progress.

## Resume From Here

Continue `REFACTOR-P2` with `TicketsPage.tsx`. Choose one narrow ticket queue extraction, keep behavior unchanged, then run focused tests, lint, and build before committing and pushing.

## 2026-05-02 18:32 +08:00 - Extracted Ticket Form Dialogs

- Added `frontend/src/features/workspace/pages/TicketFormDialogs.tsx`.
- Moved create/edit ticket dialog rendering out of `TicketsPage.tsx`.
- Kept route-owned form state, selected template state, and create/update mutations in `TicketsPage.tsx`.
- Exported the existing `MemberOption` type from `TicketFormFields.tsx` so the dialog props stay typed.
- Reduced `TicketsPage.tsx` from 608 to 579 lines.
- Removed generated `frontend/dist/` output after the production build.

Verification:
- `frontend`: `npm run test -- TicketsPageInteractions.test.tsx TicketRoutePermissions.test.tsx`, 2 files / 8 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

Progress:
- Overall tracker progress: 62 of 63 work items complete, 98.4% overall.
- `REFACTOR-P2`: in progress.

## Resume From Here

Continue `REFACTOR-P2` with another narrow `TicketsPage.tsx` slice if one is clearly safe; otherwise move to governance/settings dialogs, which remain the next high-value oversized frontend surface.

## 2026-05-02 18:35 +08:00 - Extracted Ticket Queue Config Options

- Added `frontend/src/features/workspace/pages/useTicketQueueConfigOptions.ts`.
- Moved active queue/category/tag/custom-field/template sorting out of `TicketsPage.tsx`.
- Moved create/edit selected template field derivation out of `TicketsPage.tsx`.
- Kept route-owned query state, selected template ids, mutations, and dialog state in `TicketsPage.tsx`.
- Reduced `TicketsPage.tsx` from 579 to 551 lines.
- Removed generated `frontend/dist/` output after the production build.

Verification:
- `frontend`: `npm run test -- TicketsPageInteractions.test.tsx TicketRoutePermissions.test.tsx`, 2 files / 8 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

Progress:
- Overall tracker progress: 63 of 64 work items complete, 98.4% overall.
- `REFACTOR-P2`: in progress.

## Resume From Here

Continue `REFACTOR-P2` with governance/settings dialogs unless another clearly safer `TicketsPage.tsx` slice is identified.

## 2026-05-02 18:38 +08:00 - Extracted Governance Policy Dialogs

- Added `frontend/src/features/workspace/settings/GovernancePolicyDialogs.tsx`.
- Moved retention policy and tenant security policy dialog rendering out of `GovernanceSettingsDialogs.tsx`.
- Kept all governance state and mutation ownership in `GovernanceSettingsSection.tsx`.
- Reduced `GovernanceSettingsDialogs.tsx` from 520 to 437 lines.
- Removed generated `frontend/dist/` output after the production build.

Verification:
- `frontend`: `npm run test -- GovernanceSettingsSection.test.tsx`, 1 file / 7 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

Progress:
- Overall tracker progress: 64 of 65 work items complete, 98.5% overall.
- `REFACTOR-P2`: in progress.

## Resume From Here

Continue `REFACTOR-P2` by extracting another governance dialog group, preferably identity provider or SLA/break-glass/SCIM dialogs, then run focused governance tests, lint, and build.

## 2026-05-02 18:41 +08:00 - Extracted Governance Identity Provider Dialog

- Added `frontend/src/features/workspace/settings/GovernanceIdentityProviderDialog.tsx`.
- Moved OIDC/SAML identity provider creation rendering out of `GovernanceSettingsDialogs.tsx`.
- Kept provider state and mutation ownership in `GovernanceSettingsSection.tsx`.
- Reduced `GovernanceSettingsDialogs.tsx` from 437 to 381 lines.
- Removed generated `frontend/dist/` output after the production build.

Verification:
- `frontend`: `npm run test -- GovernanceSettingsSection.test.tsx`, 1 file / 7 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

Progress:
- Overall tracker progress: 65 of 66 work items complete, 98.5% overall.
- `REFACTOR-P2`: in progress.

## Resume From Here

Continue `REFACTOR-P2` by extracting SLA, break-glass, or SCIM directory dialogs from `GovernanceSettingsDialogs.tsx`, then run focused governance tests, lint, and build.

## 2026-05-02 18:44 +08:00 - Extracted Governance Operational Dialogs and Closed REFACTOR-P2

- Added `frontend/src/features/workspace/settings/GovernanceOperationalDialogs.tsx`.
- Moved SLA policy, break-glass request, and SCIM directory creation dialog rendering out of `GovernanceSettingsDialogs.tsx`.
- Kept governance state and mutation ownership in `GovernanceSettingsSection.tsx`.
- Reduced `GovernanceSettingsDialogs.tsx` from 381 to 268 lines.
- Closed `REFACTOR-P2` as complete.
- Deferred larger API/backend contract surfaces (`frontend/src/types/api.ts`, `settings-api.ts`, `TicketController.php`, and workflow automation settings) to a separate future item only when there is a concrete behavior-safe extraction plan.
- Removed generated `frontend/dist/` output after the production build.

Verification:
- `frontend`: `npm run test -- GovernanceSettingsSection.test.tsx`, 1 file / 7 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`

Progress:
- Overall tracker progress: 67 of 67 work items complete, 100% overall.
- `REFACTOR-P2`: complete.

## Resume From Here

All current tracked cleanup/refactor work items are complete. Start a new tracker item before doing any additional refactor, API-contract, backend-controller, or feature work.

## 2026-05-01 08:54 +08:00 - Extracted Add Comment Dialog

- Added `frontend/src/features/workspace/pages/TicketDetailsCommentDialog.tsx`.
- Moved add-comment dialog rendering out of `TicketDetailsSupportDialogs.tsx`.
- Kept route-owned form state, selected files, submission callback, and close/reset behavior unchanged.
- Reduced `TicketDetailsSupportDialogs.tsx` to 389 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue support dialog decomposition by extracting checklist, watchers, attachments, and related-ticket dialogs.

## 2026-05-01 08:57 +08:00 - Extracted Checklist Dialog

- Added `frontend/src/features/workspace/pages/TicketDetailsChecklistDialog.tsx`.
- Moved checklist dialog rendering out of `TicketDetailsSupportDialogs.tsx`.
- Kept checklist form state, mutation callbacks, move/delete/toggle handlers, and close/reset behavior unchanged.
- Reduced `TicketDetailsSupportDialogs.tsx` to 339 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue support dialog decomposition by extracting watchers, attachments, and related-ticket dialogs.

## 2026-05-01 08:59 +08:00 - Extracted Watchers Dialog

- Added `frontend/src/features/workspace/pages/TicketDetailsWatchersDialog.tsx`.
- Moved watchers dialog rendering out of `TicketDetailsSupportDialogs.tsx`.
- Kept open-state wiring and watcher mutation error display unchanged.
- Reduced `TicketDetailsSupportDialogs.tsx` to 324 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue support dialog decomposition by extracting attachments and related-ticket dialogs.

## 2026-05-01 09:01 +08:00 - Extracted Attachments Dialog

- Added `frontend/src/features/workspace/pages/TicketDetailsAttachmentsDialog.tsx`.
- Moved ticket-level attachments dialog rendering out of `TicketDetailsSupportDialogs.tsx`.
- Kept upload, download, delete, selected-file state, and error wiring unchanged.
- Reduced `TicketDetailsSupportDialogs.tsx` to 277 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue support dialog decomposition by extracting the related-ticket dialog.

## 2026-05-01 09:04 +08:00 - Extracted Related Tickets Dialog

- Added `frontend/src/features/workspace/pages/TicketDetailsRelatedTicketsDialog.tsx`.
- Moved related-ticket dialog rendering out of `TicketDetailsSupportDialogs.tsx`.
- Kept related-ticket form, selection values, option coverage hint, remove/link callbacks, and mutation error display unchanged.
- Reduced `TicketDetailsSupportDialogs.tsx` to 181 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting derived page orchestration from `TicketDetailsPage.tsx`, then re-rank remaining app-owned oversized files.

## 2026-05-01 13:38 +08:00 - Extracted Ticket Details Derived State

- Added `frontend/src/features/workspace/pages/useTicketDetailsDerivedState.ts`.
- Moved query-derived page values and form watch values out of `TicketDetailsPage.tsx`:
  - active queue/category/tag/custom-field/template config sorting
  - effective edit template and scoped custom-field config derivation
  - related-ticket/customer selector coverage hints
  - attachment grouping by comment
  - SLA signal derivation
  - edit and related-ticket watched form values
- Reduced `TicketDetailsPage.tsx` to 615 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

Progress:
- `REFACTOR-P1`: 90% complete.

## Resume From Here

Re-rank remaining app-owned oversized files by risk and value, then decide whether `REFACTOR-P1` should close or continue with the next highest-value refactor target.

## 2026-05-01 08:24 +08:00 - Extracted Ticket Checklist Mutations

- Added `frontend/src/features/workspace/pages/useTicketDetailsChecklistMutations.ts`.
- Moved checklist add/update/delete/reorder mutations out of `TicketDetailsPage.tsx`.
- Kept checklist form reset and query invalidation in the route through injected callbacks.
- Reduced `TicketDetailsPage.tsx` to 730 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting related-ticket mutations or another small support dialog wiring group from `TicketDetailsPage.tsx`.

## 2026-05-01 08:26 +08:00 - Extracted Related Ticket Mutations

- Added `frontend/src/features/workspace/pages/useTicketDetailsRelatedTicketMutations.ts`.
- Moved related-ticket add/delete mutations out of `TicketDetailsPage.tsx`.
- Kept related-ticket form reset, panel close, and query invalidation in the route through injected callbacks.
- Reduced `TicketDetailsPage.tsx` to 720 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting comment mutations, ticket action mutations, or support dialog wiring from `TicketDetailsPage.tsx`.

## 2026-05-01 08:28 +08:00 - Extracted Ticket Comment Mutations

- Added `frontend/src/features/workspace/pages/useTicketDetailsCommentMutations.ts`.
- Moved comment add/update/delete mutations out of `TicketDetailsPage.tsx`, including comment attachment upload handling.
- Kept comment form reset, editing state reset, panel close, and query invalidation in the route through injected callbacks.
- Reduced `TicketDetailsPage.tsx` to 695 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting ticket action mutations or support dialog wiring from `TicketDetailsPage.tsx`.

## 2026-05-01 08:31 +08:00 - Extracted Ticket Action Mutations

- Added `frontend/src/features/workspace/pages/useTicketDetailsTicketMutations.ts`.
- Moved ticket edit, quick-transition, and delete mutations out of `TicketDetailsPage.tsx`.
- Kept route-owned UI effects in injected callbacks:
  - edit dialog close and field-error mapping
  - quick action message state
  - query invalidation
  - post-delete navigation
- Fixed the extracted hook call placement so scoped custom-field configs are computed before use.
- Reduced `TicketDetailsPage.tsx` to 661 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting support dialog wiring or derived page orchestration from `TicketDetailsPage.tsx`.

## 2026-05-01 08:22 +08:00 - Extracted Ticket Attachment Mutations

- Added `frontend/src/features/workspace/pages/useTicketDetailsAttachmentMutations.ts`.
- Moved ticket-level attachment upload/delete mutations out of `TicketDetailsPage.tsx`.
- Kept selected attachment file state and query invalidation in the route through injected success callbacks.
- Reduced `TicketDetailsPage.tsx` to 750 lines.

Verification:
- `frontend`: focused ticket-details tests passed, 2 files / 13 tests
- `frontend`: `npm run lint`
- `frontend`: `npm run build`
- `frontend`: `npm run test`, 26 files / 93 tests

## Resume From Here

Continue `REFACTOR-P1` by extracting another small mutation group or support dialog wiring group from `TicketDetailsPage.tsx`.
