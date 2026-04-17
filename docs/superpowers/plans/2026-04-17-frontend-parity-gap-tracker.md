# Frontend Parity Gap Tracker

Last updated: 2026-04-17

## Purpose
Track workspace/admin frontend parity gaps against existing backend endpoints before any new feature enhancements.

## Gap Register

| Gap ID | Backend endpoint(s) | Frontend API helper status | UI status | Test status | Owner | Priority | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| PARITY-001 | `GET/POST/DELETE /workspaces/{workspace}/saved-views` | Complete | Complete | Complete | Codex | High | complete | Added saved-view API/type + Tickets save/apply/delete flow with filter replay. |
| PARITY-002 | `GET/POST /workspaces/{workspace}/sla-policies` | Complete | Complete | Complete | Codex | High | complete | Added SLA policy API/type + Governance create/list UI. |
| PARITY-003 | `GET /workspaces/{workspace}/exports/{export}/download` | Complete | Complete | Complete | Codex | High | complete | Added Governance export download action using tokenized endpoint. |
| PARITY-004 | `POST /workspaces/{workspace}/break-glass/requests/{breakGlass}/approve` | Complete | Complete | Complete | Codex | High | complete | Added break-glass approve API + Governance pending-request approve action. |
| PARITY-005 | `PATCH /workspaces/{workspace}/tickets/{ticket}/checklist-items/reorder` | Complete | Complete | Complete | Codex | Medium | complete | Added checklist reorder API + Ticket Details up/down controls. |
| PARITY-006 | `PATCH /admin/workspaces/{workspace}/limits` | Complete | Complete | Complete | Codex | High | complete | Added admin workspace limits JSON editor + save mutation. |
| PARITY-007 | `PATCH /admin/workspaces/{workspace}/feature-flags` | Complete | Complete | Complete | Codex | High | complete | Added admin feature flags JSON editor + save mutation. |

## Execution Log

- 2026-04-17: Tracker initialized with seven confirmed parity gaps.
- 2026-04-17: Implemented API/type/UI/test coverage for PARITY-001 to PARITY-007 in frontend workspace/admin surfaces.

## Verification Log

- `cd frontend && npm run test` passed (65 tests).
- `cd frontend && npm run lint` passed.
- `cd frontend && npm run build` passed (existing font/chunk warnings remain).
- `cd backend && php artisan test --filter=EnterprisePhaseTwoFlowsTest` passed (6 tests, 34 assertions).

## Resume From Here

1. Decide whether to keep current admin JSON editors as-is or refine with structured forms.
2. Address existing frontend build warnings (font resolution + large bundle chunking) as a separate optimization pass.
3. Begin net-new feature enhancements now that parity baseline is complete.
