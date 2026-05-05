# Roadmap

This file is synchronized from `docs/project-state.yaml`. Treat `docs/project-state.yaml` as canonical and update it first.

## Current Focus

`RELEASE-P1` is active. Continue with `RELEASE-P1-T03`, the approved cleanup implementation for dormant tenant export, retention policy, and webhook surfaces.

## MVP Items

### `SCOPE-P1` Remove SCIM and SSO from product scope

- Status: `complete`
- Priority: high
- Scope: Fully remove SCIM provisioning and SSO identity-provider flows so the project returns toward a medium-level internal ticketing app.
- Current state: complete after removing SCIM/SSO routes, controllers, middleware, models, request classes, route bindings, rate limiting, frontend settings UI, frontend API helpers/types/tests, local-login SSO blocking, and fresh-install SCIM/SSO schema creation. A cleanup migration drops the old SCIM/SSO tables and fields for existing local databases.
- Next actions: none for this item. Remaining enterprise features are reviewed under `SCOPE-D01`.

### `MEDIUM-P1` Medium Ticketing Completion

- Status: `complete`
- Priority: high
- Scope: Finish the product as a medium-level internal ticketing app focused on practical support workflows instead of enterprise identity scope.
- Current state: complete after adding the final ticket lifecycle pass for open, in progress, pending, resolved, and closed; completing assignee clarity, in-app notifications, search/filter quality, readable activity labels, simple roles, full-flow demo data, and a clean root README.
- Next actions: none for this item. Remaining enterprise-scope decisions continue under `SCOPE-D01`.

#### Child Items

- `MEDIUM-P1-T01` Ticket lifecycle cleanup - `complete`
- `MEDIUM-P1-T02` Assignee workflow clarity - `complete`
- `MEDIUM-P1-T03` In-app notifications - `complete`
- `MEDIUM-P1-T04` Search and filtering quality - `complete`
- `MEDIUM-P1-T05` Ticket activity readability - `complete`
- `MEDIUM-P1-T06` Simple role set - `complete`
- `MEDIUM-P1-T07` Demo data for full flow - `complete`
- `MEDIUM-P1-T08` Clean project README - `complete`

### `SCOPE-D01` Review remaining enterprise features

- Status: `complete`
- Priority: medium
- Scope: Decide whether to keep, simplify, defer, or remove remaining enterprise features after SCIM/SSO removal.
- Current state: complete after classifying the remaining enterprise features in `docs/scope/enterprise-feature-review.md`.
- Next actions: implement the decisions under `SCOPE-P2`.

### `SCOPE-P2` Simplify remaining enterprise features

- Status: `complete`
- Priority: medium
- Scope: Implement the `SCOPE-D01` decisions so the app presents a simpler medium-level ticketing surface while avoiding new enterprise scope.
- Current state: complete. SLA is now presented as optional ticket timing targets, break-glass has been removed, tenant exports plus retention editing are hidden from the main UI, automation creation uses simple ticket-focused controls, webhooks are hidden from the main UI, and platform isolation wording now uses workspace mode/admin label language.
- Next actions: none.

#### Child Items

- `SCOPE-P2-T01` Simplify SLA language and placement - `complete`
- `SCOPE-P2-T02` Remove break-glass feature - `complete`
- `SCOPE-P2-T03` Defer or hide tenant exports - `complete`
- `SCOPE-P2-T04` Defer or hide retention policy UI - `complete`
- `SCOPE-P2-T05` Simplify automation rule builder - `complete`
- `SCOPE-P2-T06` Defer or hide webhooks - `complete`
- `SCOPE-P2-T07` Simplify platform isolation language - `complete`

### `RELEASE-P1` Release readiness and dormant backend cleanup

- Status: `in_progress`
- Priority: high
- Scope: Prepare the simplified medium ticketing app for a cleaner release by auditing and resolving dormant backend surfaces left after enterprise-scope UI removal.
- Current state: `RELEASE-P1-T01` and `RELEASE-P1-T02` are complete. The decision in `docs/release/dormant-backend-surface-decisions.md` is to remove dormant tenant export, retention policy, and webhook API/backend surfaces for the medium release.
- Next actions: implement `RELEASE-P1-T03` by removing the approved dormant surfaces without reintroducing enterprise UI scope.

#### Child Items

- `RELEASE-P1-T01` Audit dormant enterprise backend surfaces - `complete`
- `RELEASE-P1-T02` Decide cleanup scope for dormant surfaces - `complete`
- `RELEASE-P1-T03` Implement approved dormant-surface cleanup - `in_progress`
- `RELEASE-P1-T04` Verify release readiness and sync docs - `planned`

### `REFACTOR-P1` Laravel and React Standards Alignment

- Status: `complete`
- Priority: high
- Scope: Align the active Laravel backend and React frontend with project-specific conventions, framework standards, and maintainability best practices without changing product behavior.
- Current state: complete after replacing starter metadata/docs, moving workspace API modules/tests into `frontend/src/features/workspace/api/`, centralizing repeated ticket-detail invalidation, extracting ticket-detail presentation cards, comments, header/actions, mutation hooks, support dialogs, and query-derived page state, then re-ranking remaining app-owned oversized files.
- Next actions: none for this item. Remaining large surfaces continue under `REFACTOR-P2`.

### `REFACTOR-P2` High-Churn Workspace Surface Decomposition

- Status: `complete`
- Priority: high
- Scope: Continue behavior-preserving decomposition on the largest app-owned workspace surfaces after the standards-alignment pass, prioritizing files with high change risk and practical extraction value.
- Current state: complete after extracting customer form helpers, form fields, profile details, and table rendering from `CustomersPage.tsx`; extracting create/edit ticket dialog rendering into `TicketFormDialogs.tsx`; moving ticket queue config option derivation into `useTicketQueueConfigOptions.ts`; extracting governance retention/security policy dialogs into `GovernancePolicyDialogs.tsx`; and extracting the remaining governance operational dialogs that are still in scope.
- Next actions: none for this item. Larger API/backend contract surfaces are deferred to a separate future item only when there is a concrete behavior-safe extraction plan.

#### Child Items

- `REFACTOR-P2-T01` Decompose customer directory route - `complete`
- `REFACTOR-P2-T02` Extract ticket form dialogs - `complete`
- `REFACTOR-P2-T03` Extract ticket queue config derivation - `complete`
- `REFACTOR-P2-T04` Extract governance policy dialogs - `complete`
- `REFACTOR-P2-T06` Extract governance operational dialogs - `complete`

### `CLEAN-P1` Repository Cleanup Pass

- Status: `complete`
- Priority: medium
- Scope: Remove stale scaffold files, ignored local leftovers, duplicate root tooling, and backend starter web assets so the repository reflects the active Laravel backend and React frontend structure.
- Current state: complete after removing ignored/generated leftovers, stale root duplicate scaffolding, unused Vite starter frontend files, Laravel starter web assets, duplicate root npm tooling, and Laravel skeleton example tests. Backend composer/package scripts were trimmed around the removed Vite starter workflow.
- Next actions: none for this item.

### `MAINT-P2` Settings Surface Maintainability Decomposition

- Status: `complete`
- Priority: medium
- Scope: Continue decomposing oversized workspace settings surfaces so workflow, ticketing, and forms changes do not accumulate in monolithic route sections.
- Current state: complete after extracting workflow/automation creation dialogs, ticketing dictionary overview and management dialogs, and forms custom-field/template overview and management dialogs. Closeout verification passed.
- Next actions: none for this item.

#### Child Items

- `MAINT-P2-T01` Decompose workflow automation settings creation dialogs - `complete`
- `MAINT-P2-T02` Decompose ticketing settings editors - `complete`
- `MAINT-P2-T03` Decompose forms settings surfaces - `complete`
- `MAINT-P2-T04` Run verification and close out settings maintainability epic - `complete`

### `CUST-P1` Customer Profile Enrichment

- Status: `complete`
- Priority: high
- Scope: Expand customer records beyond basic contact info so support teams can keep the account context they actually need inside the workspace.
- Current state: complete after locking the profile scope, expanding backend persistence/validation/resources/search, updating frontend API typing, adding grouped customer create/edit fields, surfacing compact customer table indicators, adding a focused profile details dialog, preserving lightweight ticket customer touchpoints, and passing backend/frontend closeout verification.
- Next actions: none for this item.

#### Child Items

- `CUST-P1-T01` Define enriched customer profile schema and boundaries - `complete`
- `CUST-P1-T02` Extend backend customer model and API contract - `complete`
- `CUST-P1-T03` Expand customer workspace UI and ticket touchpoints - `complete`
- `CUST-P1-T04` Verify customer profile enrichment and close out epic - `complete`

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

Continue `RELEASE-P1-T03`: remove approved dormant tenant export, retention policy, and webhook API/backend surfaces.
