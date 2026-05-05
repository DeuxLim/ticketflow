# Dormant Backend Surface Decisions

Date: 2026-05-05

Tracker item: `RELEASE-P1-T02`

## Purpose

This decision record converts the `RELEASE-P1-T01` audit into implementation scope for release cleanup.

The goal is to keep the app focused on a medium-level internal ticketing workflow and avoid shipping hidden enterprise API surfaces.

## Decisions

| Surface | Decision | Reason | Implementation scope |
| --- | --- | --- | --- |
| Tenant exports | Remove | Compliance-style export is not part of the current product scope, and the current API only creates lightweight metadata/download-token records instead of a real portable export system. | Remove workspace export routes, controller, model relationship, frontend API helpers/types/tests, docs references, and add a cleanup migration for existing local databases. |
| Retention policies | Remove | Retention editing implies compliance retention behavior, but the app has no purge lifecycle and the UI is intentionally hidden. | Remove workspace retention routes, controller, model relationship, frontend API helpers/types, docs references, and add a cleanup migration for existing local databases. |
| Webhooks | Remove | Webhooks are deferred integration scope, and keeping active endpoint creation plus retry APIs can still create outbound HTTP behavior through API access. | Remove webhook routes, controller, request, endpoint/delivery models, delivery processor, event publisher delivery fanout, frontend API helpers/types/tests, docs references, and add a cleanup migration for existing local databases. |

## Implementation Boundaries

Remove now:

- workspace tenant export APIs
- workspace retention policy APIs
- workspace webhook endpoint and delivery APIs
- frontend API helpers and types that only support those hidden surfaces
- backend tests that assert those APIs still exist
- developer docs that document those APIs as available backend-only surfaces
- existing local database tables for tenant exports, retention policies, webhook endpoints, webhook deliveries, and integration events

Keep now:

- simple in-app notifications
- ticket automation rules and automation executions
- audit events
- ticket timing targets
- tenant security policy controls that are still visible and in scope
- the deferred Integrations UI message that says webhooks are outside the current scope
- tests that assert the hidden UI remains hidden

Do not add now:

- export file generation
- retention purge jobs
- webhook event expansion
- replacement integration features
- new enterprise admin controls

## Release Acceptance

After implementation:

- removed API routes should return 404
- the visible settings UI should still hide tenant export, retention, and webhook controls
- ticket creation, comments, attachments, automation, notifications, and audit behavior should still pass their existing tests
- docs should describe those features as out of scope or removed, not backend-only
