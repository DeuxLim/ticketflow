# Roadmap

This file is synchronized from `project-state.yaml`. Treat `project-state.yaml` as canonical and update it first.

## Current Focus

- `MAINT-P2`

## MVP Items

### `MAINT-P2` Settings Surface Maintainability Decomposition

- Status: `in_progress`
- Priority: medium
- Scope: Continue decomposing oversized workspace settings surfaces so workflow, ticketing, and forms changes do not accumulate in monolithic route sections.
- Current state: initialized after `MAINT-P1` closed and a follow-up scan showed the main remaining settings hotspots were `WorkflowAutomationSettingsSection.tsx`, `TicketingSettingsSection.tsx`, and `FormsSettingsSection.tsx`. `MAINT-P2-T01` is already complete after extracting the workflow and automation creation dialogs into `WorkflowAutomationDialogs.tsx`.
- Next actions:
  - Decompose `TicketingSettingsSection.tsx`.
  - Continue with forms settings decomposition, then run epic closeout verification.

#### Child Items

- `MAINT-P2-T01` Decompose workflow automation settings creation dialogs - `complete`
- `MAINT-P2-T02` Decompose ticketing settings editors - `planned`
- `MAINT-P2-T03` Decompose forms settings surfaces - `planned`
- `MAINT-P2-T04` Run verification and close out settings maintainability epic - `planned`

### `MAINT-P1` Frontend Maintainability Decomposition

- Status: `complete`
- Priority: high
- Scope: Reduce complexity in oversized, high-churn frontend screens by centralizing duplicated ticket-form logic and splitting monolithic route views into smaller units without changing product behavior.
- Current state: complete after centralizing shared ticket form/details helpers, decomposing `TicketsPage.tsx`, decomposing `TicketDetailsPage.tsx`, splitting the admin workspace editor and dashboard tabs, splitting the governance dialog stack, and passing the full frontend closeout gate (`npm test`, `npm run lint`, `npm run build`) plus tracker validation.
- Next actions: none for this item.

#### Child Items

- `MAINT-P1-T01` Extract shared ticket form contract and helpers - `complete`
- `MAINT-P1-T02` Decompose TicketsPage into focused modules - `complete`
- `MAINT-P1-T03` Decompose TicketDetailsPage edit and mutation surfaces - `complete`
- `MAINT-P1-T04` Decompose oversized admin and governance sections - `complete`
- `MAINT-P1-T05` Run verification and close out maintainability epic - `complete`

### `HARDEN-P1` Existing Feature Hardening and QA Closure

- Status: `complete`
- Priority: high
- Scope: Audit the current product surface, tighten parity and edge-state behavior, and close regression coverage gaps before any new feature scope.
- Current state: complete after the audit, expanded auth/workspace/admin regression coverage, live browser smoke validation for workspace-user and platform-admin paths, disposable onboarding validation with a fresh user and new workspace, and disposable customer/ticket create-delete validation all passed without exposing new defects.
- Next actions: none for this item.

#### Child Items

- `HARDEN-P1-T01` Audit current feature surfaces and capture tracker-backed gaps - `complete`
- `HARDEN-P1-T02` Tighten auth and route-access regression coverage - `complete`
- `HARDEN-P1-T03` Tighten workspace shell and dashboard regression coverage - `complete`
- `HARDEN-P1-T04` Tighten admin access and edge-state regression coverage - `complete`
- `HARDEN-P1-T05` Run browser critical-path QA - `complete`
- `HARDEN-P1-T06` Run verification and close out the hardening epic - `complete`

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

Start `MAINT-P2-T02` by decomposing `TicketingSettingsSection.tsx`.
