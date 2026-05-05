# Dormant Backend Surface Audit

Date: 2026-05-05

Tracker item: `RELEASE-P1-T01`

## Purpose

This audit inventories the backend and frontend remnants for tenant exports, retention policies, and webhooks after the medium-ticketing scope hid those features from the main UI.

No cleanup decisions or code removals are made in this audit.

## Summary

| Surface | Visible UI state | Backend state | Frontend API state | Release risk |
| --- | --- | --- | --- | --- |
| Tenant exports | Hidden from Governance settings | Active routes, controller, model, migration table, and backend tests remain | Type and API helpers remain | Medium: hidden UI, but active API still creates export records and download tokens |
| Retention policies | Hidden from Governance settings | Active routes, controller, model, migration table, and backend tests remain | Type and API helpers remain | Medium: hidden UI, but active API still edits policy values |
| Webhooks | Hidden from Integrations settings | Active routes, controller, request, models, service delivery path, migration tables, and backend tests remain | Types, API helpers, and API tests remain | High: active delivery system can still create outbound HTTP calls if endpoints are created through API |

## Tenant Exports

Backend remnants:

- `backend/routes/api.php`: exposes `GET /exports`, `POST /exports`, and `GET /exports/{export}/download`.
- `backend/app/Http/Controllers/Api/Workspaces/TenantExportController.php`: lists exports, creates completed export records, creates download tokens, logs audit events, and returns JSON download payloads.
- `backend/app/Models/TenantExport.php`: stores export metadata, filters, tokens, expiry, and result JSON.
- `backend/app/Models/Workspace.php`: keeps the `tenantExports()` relationship.
- `backend/database/migrations/2026_04_13_010000_create_phase_two_to_six_foundation_tables.php`: creates `tenant_exports`.
- `backend/tests/Feature/EnterpriseRemainingFoundationTest.php`: covers create and download behavior.

Frontend remnants:

- `frontend/src/types/api.ts`: keeps `TenantExportRecord`.
- `frontend/src/features/workspace/api/settings-api.ts`: keeps `listExports`, `createExport`, and `downloadExport`.
- `frontend/src/features/workspace/api/settings-api.test.ts`: still covers export download API wiring.

Docs:

- `docs/developer/routes.md`: documents exports as backend-only and deferred.
- `docs/developer/README.md`: lists `TenantExport` as backend-only while exports are deferred.

## Retention Policies

Backend remnants:

- `backend/routes/api.php`: exposes `GET /retention-policies` and `PATCH /retention-policies`.
- `backend/app/Http/Controllers/Api/Workspaces/RetentionPolicyController.php`: creates default retention rows, updates policy values, and logs audit events.
- `backend/app/Models/RetentionPolicy.php`: stores ticket, comment, attachment, and audit retention windows plus `purge_enabled`.
- `backend/app/Models/Workspace.php`: keeps the `retentionPolicy()` relationship.
- `backend/database/migrations/2026_04_13_010000_create_phase_two_to_six_foundation_tables.php`: creates `retention_policies`.
- `backend/tests/Feature/EnterpriseRemainingFoundationTest.php`: covers retention update behavior.

Frontend remnants:

- `frontend/src/types/api.ts`: keeps `RetentionPolicyConfig`.
- `frontend/src/features/workspace/api/settings-api.ts`: keeps `getRetentionPolicy` and `updateRetentionPolicy`.
- `frontend/src/features/workspace/settings/GovernanceSettingsSection.test.tsx`: verifies the UI hides retention controls.

Docs:

- `docs/developer/routes.md`: documents retention as backend-only and deferred.
- `docs/developer/README.md`: lists `RetentionPolicy` as backend-only while retention UI is deferred.

## Webhooks

Backend remnants:

- `backend/routes/api.php`: exposes `GET /webhooks`, `POST /webhooks`, `GET /webhook-deliveries`, and `POST /webhook-deliveries/{delivery}/retry`.
- `backend/app/Http/Controllers/Api/Workspaces/WebhookEndpointController.php`: lists endpoints, creates endpoints, lists deliveries, and retries deliveries.
- `backend/app/Http/Requests/Workspaces/StoreWebhookEndpointRequest.php`: validates webhook creation.
- `backend/app/Models/WebhookEndpoint.php` and `backend/app/Models/WebhookDelivery.php`: store endpoint and delivery state.
- `backend/app/Models/Workspace.php`: keeps the `webhookEndpoints()` relationship.
- `backend/app/Models/IntegrationEvent.php`: keeps the delivery relationship.
- `backend/app/Services/Webhooks/IntegrationEventPublisher.php`: creates delivery records for matching active endpoints.
- `backend/app/Services/Webhooks/WebhookDeliveryProcessor.php`: sends signed outbound HTTP requests.
- `backend/app/Services/Webhooks/AutomationEngine.php`: remains in use for ticket automation and is not itself dormant.
- `backend/database/migrations/2026_04_12_190000_create_enterprise_foundation_tables.php`: creates `webhook_endpoints`, `integration_events`, and `webhook_deliveries`.
- `backend/tests/Feature/EnterpriseFoundationTest.php`: covers endpoint creation, delivery listing, signed retry, and response contracts.

Frontend remnants:

- `frontend/src/types/api.ts`: keeps `WebhookEndpointRecord` and `WebhookDeliveryRecord`.
- `frontend/src/features/workspace/api/settings-api.ts`: keeps `listWebhookEndpoints`, `createWebhookEndpoint`, `listWebhookDeliveries`, and `retryWebhookDelivery`.
- `frontend/src/features/workspace/api/settings-api.test.ts`: covers webhook API wiring.
- `frontend/src/features/workspace/settings/IntegrationsSettingsSection.tsx`: intentionally shows integrations as deferred and does not expose webhook controls.
- `frontend/src/features/workspace/settings/IntegrationsSettingsSection.test.tsx`: verifies webhook controls stay hidden.

Docs:

- `docs/developer/routes.md`: documents webhooks as backend-only and deferred.
- `docs/developer/README.md`: lists webhook models and states webhooks are deferred and hidden from the main UI.

## Audit Conclusion

All three surfaces are hidden from the main UI but still active at the API layer.

The next task should decide cleanup scope before implementation:

- Tenant exports: remove unless a near-term data export requirement exists.
- Retention policies: remove editable API surface unless basic fixed defaults are needed internally.
- Webhooks: remove public workspace webhook management and delivery retry APIs for this medium release; keep only integration event publishing if needed by automation internals.
