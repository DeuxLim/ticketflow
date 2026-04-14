# Roadmap

This file is synchronized from `project-state.yaml`. Treat `project-state.yaml` as canonical and update it first.

## Current Focus

- `ALIGN-P1` Backend-Frontend Alignment Hardening - `in_progress`

## MVP Items

### `ALIGN-P1` Backend-Frontend Alignment Hardening

- Status: `in_progress`
- Priority: high
- Scope: Close backend/frontend contract and behavior gaps before adding new features.
- Current state: gap inventory complete; integrations/security/workflow/ticketing-forms/pagination/assignment hardening is complete with regression coverage, frontend baseline includes selector contracts + permission + interaction/error paths, API typing hardening is complete, and T09 regression depth now covers transition fallback, transition success messaging, edit-form server field-error mapping, plus view-only ticket-details action disabling.
- Next actions:
  - Continue optional regression-depth expansion under `ALIGN-P1-T09` for watcher/checklist/related-ticket failure states and additional permission edge cases.

#### Child Items

- `ALIGN-P1-T01` Deep-dive API and UI gap inventory - `complete`
- `ALIGN-P1-T02` Integrations settings parity for webhook operations - `complete`
- `ALIGN-P1-T03` Security governance parity for policy and identity controls - `complete`
- `ALIGN-P1-T04` Workflow and automation management parity - `complete`
- `ALIGN-P1-T05` Ticket dictionary and form CRUD parity - `complete`
- `ALIGN-P1-T06` Pagination and dataset contract alignment - `complete`
- `ALIGN-P1-T07` Ticket assignment permission boundary alignment - `complete`
- `ALIGN-P1-T08` Frontend API typing and client consistency hardening - `complete`
- `ALIGN-P1-T09` Add frontend regression test baseline for workspace flows - `incomplete`

### `WSSET-P1` Workspace Settings Phase 1

- Status: `complete`
- Priority: high
- Scope: Backend APIs and Settings UI for workspace general settings plus ticketing and form configuration.
- Verification: targeted workspace settings tests, enterprise regression tests, frontend build, and backend Pint dirty formatting check passed.
- Next actions: none for this item.

#### Child Items

- `WSSET-P1-T01` Backend settings schema and models - `complete`
- `WSSET-P1-T02` Backend general and ticketing settings APIs - `complete`
- `WSSET-P1-T03` Backend ticket config CRUD APIs - `complete`
- `WSSET-P1-T04` Frontend settings route and types - `complete`
- `WSSET-P1-T05` Frontend settings sections - `complete`
- `WSSET-P1-T06` Full verification and cleanup - `complete`

## Resume From Here

Critical-path alignment hardening is complete. Continue `ALIGN-P1-T09` as optional regression-depth expansion (watcher/checklist/related-ticket failure paths and advanced permission-state UX).
