# Roadmap

This file is synchronized from `project-state.yaml`. Treat `project-state.yaml` as canonical and update it first.

## Current Focus

- `WSSET-P1` Workspace Settings Phase 1 - `incomplete`

## MVP Items

### `WSSET-P1` Workspace Settings Phase 1

- Status: `incomplete`
- Priority: high
- Scope: Backend APIs and Settings UI for workspace general settings plus ticketing and form configuration.
- Incomplete reason: Full verification and cleanup remains: enterprise regression tests and backend formatting check from Task 6 have not been run in this session.
- Next actions:
  - Run EnterpriseFoundationTest and EnterprisePhaseTwoFlowsTest filters.
  - Run backend Pint dirty formatting check if available.
  - Update this item to complete only after Task 6 verification is satisfied or explicitly waived.

#### Child Items

- `WSSET-P1-T01` Backend settings schema and models - `complete`
- `WSSET-P1-T02` Backend general and ticketing settings APIs - `complete`
- `WSSET-P1-T03` Backend ticket config CRUD APIs - `complete`
- `WSSET-P1-T04` Frontend settings route and types - `complete`
- `WSSET-P1-T05` Frontend settings sections - `complete`
- `WSSET-P1-T06` Full verification and cleanup - `incomplete`

## Resume From Here

Continue with `WSSET-P1-T06`. Run the remaining enterprise regression tests and backend Pint dirty formatting check, then update `project-state.yaml`, regenerate this roadmap view, and append the result to `changelog/progress-log.md`.
