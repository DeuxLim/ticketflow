# Enterprise Feature Scope Review

Date: 2026-05-03

Tracker item: `SCOPE-D01`

## Purpose

This review classifies the remaining enterprise-style features after SCIM and SSO were removed.

The goal is to keep the project aligned with a medium-level internal ticketing app.

No implementation changes are made in this review. This document only records decisions and recommended follow-up work.

## Decision Summary

| Area | Decision | Reason |
| --- | --- | --- |
| SLA policy UI | Simplify | Useful for ticketing, but should stay basic and understandable. |
| Break-glass | Remove | Too enterprise/security-heavy for a medium internal ticketing app. |
| Tenant exports | Defer | Compliance-style export is not core to the current support workflow. |
| Retention | Defer | Retention policy exists, but actual purge/compliance workflow is not needed now. |
| Advanced automation | Simplify | Useful if constrained to simple ticket rules; current JSON rule editing is too advanced. |
| Webhooks | Defer | Useful integration feature, but not needed for the current medium scope. |
| Platform isolation | Simplify | Keep platform admin controls minimal; avoid selling this as true infrastructure isolation. |

## Area Details

### SLA Policy UI

Decision: simplify.

Current state:

- Backend routes exist for listing and creating SLA policies.
- Frontend governance settings can create SLA policies.
- Reporting uses SLA-related data.

Keep only:

- priority-based first response and resolution targets
- clear labels in the UI
- simple reporting indicators

Do not add now:

- complex business calendars
- escalation chains
- contract tiers
- customer-specific SLA packages

Recommended follow-up:

- Keep the current basic SLA concept.
- Move it closer to ticketing/reporting language if the Governance tab feels too enterprise-heavy.
- Make sure the UI explains SLA simply as "target response and resolution times."
- 2026-05-03 update: user-facing SLA wording now uses "ticket timing targets" and explains them as optional internal first-reply and resolution goals.

### Break-Glass

Decision: remove.

Current state:

- Removed from backend routes, frontend settings, admin metrics, API types, and current migrations.
- Existing local databases are cleaned by `2026_05_03_165500_drop_break_glass_requests_table.php`.

Why remove:

- Break-glass is an enterprise privileged-access concept.
- It does not fit a beginner-friendly medium ticketing app.
- It adds mental overhead without improving the core ticket workflow.

Recommended follow-up:

- Keep normal Admin/Agent/Viewer permissions instead.

### Tenant Exports

Decision: defer.

Current state:

- Backend can create a tenant export record and a temporary download token.
- Export result currently returns counts and metadata, not a full portable data archive.
- Frontend governance settings no longer show tenant export controls.

Why defer:

- Compliance exports are not required for the current medium ticketing scope.
- The current implementation is a lightweight placeholder, not a full export system.

Recommended follow-up:

- Hide or remove export UI from the main product until there is a real export requirement.
- Do not extend export formats or download behavior now.
- 2026-05-03 update: export controls were hidden from the main Governance settings UI; backend endpoints remain dormant for a later cleanup decision.

### Retention

Decision: defer.

Current state:

- Backend stores retention windows for tickets, comments, attachments, and audit records.
- Frontend governance settings no longer show retention policy editing.
- There is no complete purge lifecycle in the medium scope.

Why defer:

- Retention is compliance-oriented.
- It is not needed for the current internal support workflow.

Recommended follow-up:

- Keep the data model only if it is harmless.
- Hide or de-emphasize the UI unless retention becomes a product requirement.
- Do not build purge jobs yet.
- 2026-05-03 update: retention controls were hidden from the main Governance settings UI; backend policy endpoints remain dormant for a later cleanup decision.

### Advanced Automation

Decision: simplify.

Current state:

- Backend supports automation rules, dry-runs, toggles, executions, and workflow interaction.
- Frontend exposes simple ticket-focused controls for one optional condition and one action.
- This is powerful but too technical for the intended user level.

Keep only:

- simple ticket rules
- clear event choices
- clear action choices
- safe test/dry-run behavior

Do not add now:

- raw JSON rule builders in the main flow
- chained automations
- advanced condition syntax
- multi-step automation builder

Recommended follow-up:

- Replace JSON inputs with beginner-friendly controls.
- Limit supported actions to simple ticket updates and in-app notifications.
- Keep automation optional and low priority.
- 2026-05-03 update: automation rule creation no longer exposes raw JSON in the main UI.

### Webhooks

Decision: defer.

Current state:

- Backend can create webhook endpoints.
- Backend records deliveries and supports retry.
- Frontend integrations settings can manage endpoints and inspect deliveries.

Why defer:

- Webhooks are integration/enterprise scope.
- They are not necessary for a medium internal ticketing app.

Recommended follow-up:

- Keep code untouched for now.
- Do not expand webhook events or delivery features.
- Consider hiding the Integrations tab unless integrations become part of the product goal.

### Platform Isolation

Decision: simplify.

Current state:

- Platform admin can switch workspace `tenant_mode` between `shared` and `dedicated`.
- Platform admin can set a `dedicated_data_plane_key`.
- Admin dashboard shows dedicated workspace counts.

Why simplify:

- The current app does not implement actual separate infrastructure per tenant.
- Calling it dedicated isolation can overstate what the system does.

Recommended follow-up:

- Rename UI language to avoid implying real infrastructure isolation.
- Keep only simple workspace status/admin controls unless true isolation is implemented.
- Do not expand platform isolation features now.

## Recommended Follow-Up Roadmap

Create an implementation epic after this decision review:

`SCOPE-P2 Simplify remaining enterprise features`

Suggested child items:

- `SCOPE-P2-T01 Simplify SLA language and placement`
- `SCOPE-P2-T02 Remove break-glass feature`
- `SCOPE-P2-T03 Defer or hide tenant exports`
- `SCOPE-P2-T04 Defer or hide retention policy UI`
- `SCOPE-P2-T05 Simplify automation rule builder`
- `SCOPE-P2-T06 Defer or hide webhooks`
- `SCOPE-P2-T07 Simplify platform isolation language`

Implementation should be done in separate changes, not in this decision pass.
