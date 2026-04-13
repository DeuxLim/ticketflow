---
name: project-source-of-truth-manager
description: Use when initializing, updating, validating, summarizing, or resuming canonical roadmap and project-state tracking for this Ticketing repo across sessions, feature work, refactors, roadmap discussions, or handoffs.
---

# Project Source of Truth Manager

Use this skill to keep one trusted project-state system current across sessions. Treat the roadmap as live operational state, not notes.

## Canonical Files

Default to these root-level files unless the user gives another location:

- `project-state.yaml`: canonical structured source of truth.
- `roadmap.md`: required human-readable projection generated from canonical state.
- `changelog/progress-log.md`: required append-only history of meaningful session updates.

If `project-state.yaml` and `project-state.json` both exist, ask which is canonical before editing. If neither exists, initialize `project-state.yaml` from `roadmap.md`. If `roadmap.md` does not exist, use existing plans/specs only as bootstrap input and record that assumption in notes.

## Synchronization Contract

- `project-state.yaml` is the canonical source.
- `roadmap.md` is a synchronized human-readable view. Regenerate or patch it after every meaningful canonical state change.
- `changelog/progress-log.md` is append-only history for meaningful session updates.
- Every major update must end with a `Resume From Here` section in the progress log and summary output.
- Preserve stable item IDs. Do not rename or renumber existing IDs unless the user explicitly requests an ID migration.
- Never silently overwrite implementation notes, blockers, incomplete reasons, or definitions of done. Append notes or explicitly state the replacement.
- Prefer updating an existing roadmap item over creating a duplicate. Search IDs, titles, tags, parents, and notes before adding a new item.
- If `roadmap.md` and `project-state.yaml` disagree, trust `project-state.yaml` after initialization and record the discrepancy in the progress log.

## Required First Step

Before creating, updating, or summarizing state:

1. Read the existing canonical state file.
2. Read `roadmap.md` and `changelog/progress-log.md` when initializing, synchronizing, summarizing, or resolving gaps.
3. Understand existing IDs, parent-child structure, statuses, and next actions.
4. Update the canonical state file instead of creating disconnected notes.

Never infer final completion from conversation alone. Check the item definition of done and, when practical, inspect relevant implementation or verification output.

## Status Rules

Allowed statuses:

- `planned`: not started.
- `in_progress`: currently being worked on.
- `blocked`: cannot proceed because of a dependency, missing decision, bug, or external issue.
- `incomplete`: partially implemented but not done.
- `complete`: meets its definition of done.
- `deferred`: intentionally postponed.

Strict rules:

- Do not mark `complete` unless `definition_of_done` is satisfied or the state update clearly records the verification basis.
- `incomplete` must include `incomplete_reason` and `next_actions`.
- `blocked` must include `blocked_reason` and the blocking dependency or decision when known.
- `deferred` must include a reason in notes or `deferred_reason`.
- Clear `blocked_reason` when an item is no longer blocked.
- A parent cannot be `complete` while any child is `planned`, `in_progress`, `blocked`, or `incomplete`; either update the parent or flag it.
- An item cannot be `complete` with an active blocker.
- An item marked `planned` cannot contain notes showing partial implementation; change it to `incomplete` or flag the mismatch.
- New tasks discovered during work must attach to the most specific existing parent when possible.
- Preserve stable IDs and do not renumber existing items.

## Canonical Data Model

Keep the model simple and consistent:

```yaml
schema_version: 1
project: Ticketing
updated_at: "2026-04-13T00:00:00+08:00"
updated_by: codex
current_focus:
  - FEAT-001
items:
  - id: FEAT-001
    title: Workspace invitations
    type: feature
    parent_id: null
    status: planned
    priority: high
    mvp: true
    description: Invite users to a workspace and track invite acceptance.
    definition_of_done:
      - Backend invitation lifecycle is covered by tests.
      - Frontend invitation flow handles loading, errors, and success.
      - Workspace authorization boundaries are preserved.
    dependencies: []
    notes: []
    incomplete_reason: null
    blocked_reason: null
    deferred_reason: null
    discovered_during_implementation: false
    next_actions:
      - Inspect existing workspace membership routes and UI.
    tags:
      - workspace
    created_at: "2026-04-13T00:00:00+08:00"
    updated_at: "2026-04-13T00:00:00+08:00"
    changed_at: "2026-04-13T00:00:00+08:00"
    changed_source: codex
```

Recommended `type` values: `epic`, `feature`, `task`, `bug`, `refactor`, `test`, `doc`, `decision`.

Use ISO-8601 timestamps with timezone. Use the project timezone when known.

## Workflows

### Initialize Project Roadmap

Use when no canonical state exists or the user asks to bootstrap it.

1. Inspect `backend/`, `frontend/`, README/docs, routes, tests, and visible feature areas.
2. Create `project-state.yaml` with stable IDs, current assumptions, and conservative statuses.
3. Mark uncertain items as `planned` or `incomplete`, not `complete`.
4. Record assumptions in `notes`.
5. Generate or update `roadmap.md` as a projection from the YAML.
6. Append a progress-log entry with a `Resume From Here` section.

### Update Item After Work

Use when feature work, refactoring, testing, or roadmap discussion changes state.

1. Find the relevant item by ID or title.
2. Compare the change against `definition_of_done`.
3. Update status, notes, incomplete details, blockers, and next actions.
4. Add discovered subtasks under the right parent with new stable IDs.
5. Check parent-child consistency.
6. Synchronize `roadmap.md` from the canonical state.
7. Append a concise progress-log entry for major updates, including `Resume From Here`.

### Mark Item Complete

Only mark `complete` when the item meets its definition of done. Add a note with verification evidence, such as tests run, files inspected, or explicit user confirmation.

Example:

```yaml
status: complete
blocked_reason: null
incomplete_reason: null
notes:
  - "2026-04-13: Completed API and UI work; verified with backend feature test and frontend build."
next_actions: []
```

### Mark Item Incomplete

Use when some implementation exists but the item is not done.

```yaml
status: incomplete
incomplete_reason: "Backend endpoint exists, but frontend error state and feature test coverage are missing."
next_actions:
  - Add backend regression test.
  - Implement frontend error state.
```

### Mark Item Blocked

```yaml
status: blocked
blocked_reason: "Waiting for product decision on invite expiration window."
next_actions:
  - Confirm expiration policy.
```

### Mark Item Deferred

```yaml
status: deferred
deferred_reason: "Post-MVP; lower priority than workspace onboarding."
mvp: false
next_actions: []
```

### Add Discovered Subtask

Before adding, search existing item titles, tags, notes, and children for duplicates. Merge if it already exists; otherwise add a child item.

```yaml
- id: FEAT-001-T03
  title: Add invitation resend audit event
  type: task
  parent_id: FEAT-001
  status: planned
  priority: medium
  mvp: true
  discovered_during_implementation: true
  definition_of_done:
    - Resend action records an audit event.
    - Test covers the audit payload.
```

## Validation Checklist

Run these checks before finalizing any state update:

- IDs are stable and unique.
- Every item has `id`, `title`, `type`, `status`, `priority`, `mvp`, `definition_of_done`, `created_at`, and `updated_at`.
- Status is one of the allowed values.
- Completed items have no active blockers or incomplete reason.
- Incomplete items explain what remains.
- Blocked items explain the blocker.
- Deferred items explain why they are postponed.
- Parent status does not contradict child status.
- New tasks are attached to the closest parent or explicitly marked parentless.
- Duplicate or overlapping tasks are merged or flagged.
- Next actions match the current status.
- Major changes are reflected in progress history when history exists.
- `roadmap.md` reflects the current canonical status after any major update.
- `changelog/progress-log.md` includes a meaningful session update and `Resume From Here` for major updates.

## Required End-of-Work State Update

At the end of any feature planning, feature implementation, refactor, or roadmap discussion, generate a state update that can be applied to `project-state.yaml`.

Use this format:

```markdown
## State Update

- Items changed:
  - `FEAT-001`: `in_progress` -> `incomplete`
- Notes added:
  - `FEAT-001`: Backend route implemented; frontend integration still missing.
- Incomplete details:
  - `FEAT-001`: Missing frontend loading/error states and regression tests.
- Blockers added or removed:
  - None.
- Newly discovered tasks:
  - `FEAT-001-T03`: Add invitation resend audit event.
- Updated next recommended steps:
  - Implement frontend integration for `FEAT-001`.
  - Add backend regression coverage for resend audit event.
- Roadmap synchronized:
  - `roadmap.md` updated from `project-state.yaml`.
- Progress log appended:
  - `changelog/progress-log.md` updated with session notes and `Resume From Here`.
```

If the update was applied to the file, say so. If it is only a proposed update, label it `Proposed State Update`.

## Summary Output

When asked for current progress, MVP status, incomplete items, blocked items, next tasks, handoff, or resume context, use this exact shape:

```markdown
# Project Status Summary

## Current Focus
## Recently Updated Items
## Completed Items
## Incomplete Items
## Blocked Items
## Next Recommended Tasks
## Risks / Open Questions
## Resume From Here
```

Keep summaries short. Prefer item IDs plus titles. Include assumptions when uncertain.

## Session Handoff

A handoff must include:

- Current focus.
- What changed this session.
- Current item statuses.
- Verification performed, if any.
- Blockers and open questions.
- Exact next recommended actions.
- A short `Resume From Here` paragraph.

Example:

```markdown
# Project Status Summary

## Current Focus
`FEAT-001` Workspace invitations.

## Recently Updated Items
`FEAT-001`: moved from `in_progress` to `incomplete`; backend endpoint exists, frontend integration remains.

## Completed Items
None in this session.

## Incomplete Items
`FEAT-001`: missing frontend loading/error states and regression tests.

## Blocked Items
None.

## Next Recommended Tasks
1. Add frontend integration for invitation creation.
2. Add backend regression test for authorization failure.

## Risks / Open Questions
Invite expiration policy is still an assumption.

## Resume From Here
Continue with `FEAT-001` by inspecting the invitation API contract, then wire the frontend form and add targeted regression coverage.
```

## Command Intent Mapping

Interpret user requests this way:

- "Initialize project roadmap": create or rebuild the canonical state from repo context.
- "Show current progress": summarize all active state.
- "Show MVP status": filter to `mvp: true`.
- "Show incomplete items": list `incomplete` items with missing work.
- "Show blocked items": list `blocked` items with reasons.
- "Mark item complete/incomplete/blocked/deferred": update the item and validate required fields.
- "Add note to item": append a timestamped note to that item.
- "Add discovered subtask": create a child item unless it duplicates existing work.
- "Update definition of done": update `definition_of_done` and re-check status consistency.
- "Recommend next tasks": rank by blockers, priority, MVP value, dependencies, and current focus.
- "Generate session handoff summary": use the required summary output.
- "Generate resume-from-here summary": produce only the current focus, immediate next actions, and blockers.

## Conservative Defaults

- Prefer `incomplete` over `complete` when evidence is missing.
- Prefer adding a note over rewriting history.
- Prefer merging duplicates over creating new near-identical tasks.
- Prefer parent-child task updates over vague top-level tasks.
- Preserve human readability: short titles, actionable next actions, and clear reasons.
