# Roadmap

This file is synchronized from `project-state.yaml`. Treat `project-state.yaml` as canonical and update it first.

## Current Focus

- None

## MVP Items

### `UX-OVERHAUL-P1` App-Wide UX Overhaul

- Status: `complete`
- Priority: high
- Scope: Rework the app into a modal-first, lower-clutter operator experience with clearer labels, calmer information density, and more focused task flows across workspace, settings, admin, and auth surfaces.
- Current state: complete after workspace CRUD hardening, ticket detail/settings/admin/auth cleanup, workflow automation dialogs, governance identity/SLA/break-glass dialogs, integrations endpoint dialogs, and final governance retention/security policy dialog cleanup.
- Next actions: none for this item.

#### Child Items

- `UX-OVERHAUL-P1-W1` Workspace CRUD UX Hardening - `complete`
- `UX-OVERHAUL-P1-W2` Ticket Detail and Settings IA Refinement - `complete`
- `UX-OVERHAUL-P1-W1-T01` Harden Invitations page action clarity - `complete`
- `UX-OVERHAUL-P1-W1-T02` Harden Customers page action clarity - `complete`
- `UX-OVERHAUL-P1-W1-T03` Reduce Tickets page inline control noise - `complete`
- `UX-OVERHAUL-P1-W1-T04` Tighten Members page orientation - `complete`

### `PERF-P1` Frontend Performance and Asset Reliability Hardening

- Status: `complete`
- Priority: high
- Scope: Remove recurring frontend build warnings and reduce initial payload pressure by hardening font asset resolution and route-level code splitting.
- Current state: baseline confirmed no unresolved font warnings, then settings-surface chunking was hardened by lazy-loading sections and mounting only the active tab. Verification is complete.
- Next actions: none for this item.

#### Child Items

- `PERF-P1-T01` Baseline frontend build warnings and bundle hotspots - `complete`
- `PERF-P1-T02` Resolve frontend font asset warnings - `complete`
- `PERF-P1-T03` Introduce route-level code splitting for heavy workspace surfaces - `complete`
- `PERF-P1-T04` Run verification and closeout for performance hardening epic - `complete`

### `ADMIN-UX-P1` Admin Workspace Controls UX Refinement

- Status: `complete`
- Priority: high
- Scope: Replace admin limits and feature-flags raw JSON editors with structured forms while preserving existing backend API contracts.
- Current state: structured controls were already in place; added mutation error visibility for limits/feature-flags updates and completed regression + verification coverage.
- Next actions: none for this item.

#### Child Items

- `ADMIN-UX-P1-T01` Define structured admin form schemas - `complete`
- `ADMIN-UX-P1-T02` Implement workspace limits structured form - `complete`
- `ADMIN-UX-P1-T03` Implement feature flags structured form - `complete`
- `ADMIN-UX-P1-T04` Add admin controls regression coverage - `complete`
- `ADMIN-UX-P1-T05` Run verification and closeout for admin controls epic - `complete`

### `ALIGN-P1` Backend-Frontend Alignment Hardening

- Status: `complete`
- Priority: high
- Scope: Close backend/frontend contract and behavior gaps before adding new features.
- Current state: gap inventory complete; integrations/security/workflow/ticketing-forms/pagination/assignment hardening is complete with regression coverage, API typing hardening is complete, and T09 regression depth now also covers watcher/checklist/related-ticket mutation failure states plus corresponding error visibility.
- Next actions: none for this item.

#### Child Items

- `ALIGN-P1-T01` Deep-dive API and UI gap inventory - `complete`
- `ALIGN-P1-T02` Integrations settings parity for webhook operations - `complete`
- `ALIGN-P1-T03` Security governance parity for policy and identity controls - `complete`
- `ALIGN-P1-T04` Workflow and automation management parity - `complete`
- `ALIGN-P1-T05` Ticket dictionary and form CRUD parity - `complete`
- `ALIGN-P1-T06` Pagination and dataset contract alignment - `complete`
- `ALIGN-P1-T07` Ticket assignment permission boundary alignment - `complete`
- `ALIGN-P1-T08` Frontend API typing and client consistency hardening - `complete`
- `ALIGN-P1-T09` Add frontend regression test baseline for workspace flows - `complete`

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

`UX-OVERHAUL-P1` is complete. Choose the next product or technical roadmap item before starting new implementation work.
