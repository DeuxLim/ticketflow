# Workspace Settings Phase 1 Design

## Goal
Ship the first production-ready vertical slice for owner/admin workspace configuration: real backend APIs plus a Settings UI for general workspace settings and ticketing configuration.

## Scope
Include:
- Workspace Settings navigation and page in the React workspace app.
- General settings API for workspace name, branding metadata, timezone, and business profile.
- Ticketing settings API for status, priority, assignment, ticket numbering, and legacy compatibility metadata.
- Tenant-scoped configuration CRUD for queues, categories, ticket types, custom fields, and form templates.
- Permission checks by section.
- Audit events for every settings/config mutation.
- Feature tests for permissions, tenant scoping, validation, and audit logging.

Exclude from Phase 1:
- Workflow editor internals beyond linking/listing existing workflow and automation areas.
- Dynamic ticket form rendering from custom fields.
- Platform admin control plane changes.
- Governance, retention, exports, and break-glass workflows.

## Backend Design
Add a migration for:
- `workspace_settings`: one row per workspace, stores timezone, branding metadata, business profile metadata, ticket numbering format, assignment strategy, and ticketing metadata JSON.
- `ticket_queues`: workspace-scoped queue dictionary with `key`, `name`, `description`, `is_default`, `is_active`, and `sort_order`.
- `ticket_categories`: workspace-scoped category dictionary with `key`, `name`, `description`, `is_active`, and `sort_order`.
- `ticket_tags`: workspace-scoped tag dictionary with `name`, `color`, `description`, and `is_active`.
- `ticket_types`: workspace-scoped ticket type dictionary with `key`, `name`, `description`, `is_default`, `is_active`, and `sort_order`.
- `ticket_custom_fields`: workspace-scoped custom fields with `key`, `label`, `field_type`, `options_json`, `validation_json`, `is_required`, `is_active`, and `sort_order`.
- `ticket_form_templates`: workspace-scoped templates with `ticket_type_id`, `name`, `field_schema_json`, `visibility_rules_json`, `required_rules_json`, `is_default`, and `is_active`.

Add models and relationships on `Workspace` for each new entity.

Add controllers:
- `WorkspaceSettingsController` for `GET/PATCH /settings/general` and `GET/PATCH /settings/ticketing`.
- `TicketQueueController`.
- `TicketCategoryController`.
- `TicketTagController`.
- `TicketTypeController`.
- `TicketCustomFieldController`.
- `TicketFormTemplateController`.

Use the existing `workspace_member`, `tenant_network`, and `workspace_permission` middleware.

Permission mapping:
- General settings: `workspace.manage`.
- Ticketing settings and all ticket config dictionaries: `tickets.manage`.
- Forms settings: `tickets.manage` for Phase 1.
- Security tab links: existing `security.manage` APIs.
- Integrations tab links: existing `integrations.manage` APIs.
- Workflow/automation tab links: existing `automation.manage` plus `tickets.manage` for workflows.

Validation rules:
- Keys are lowercase slugs: letters, numbers, underscores, and hyphens.
- Keys are unique per workspace and config table.
- Only one default queue/type/template per workspace scope.
- Assignment strategy is one of `manual`, `round_robin`, or `least_open_load`.
- Ticket numbering format must contain `{seq}` to keep generated ticket numbers deterministic.
- Destructive changes are limited in Phase 1: deactivate instead of hard-delete for config used by existing tickets.

Audit:
- Use existing `AuditLogger` for all create/update/deactivate settings actions.
- Use action names like `workspace.settings.general.updated`, `ticket.queue.created`, and `ticket.custom_field.updated`.

Backward compatibility:
- Do not change current `tickets.queue_key`, `tickets.category`, or `tickets.tags` columns in Phase 1.
- New config APIs provide dictionaries that existing ticket screens can consume later.
- Existing ticket creation and update requests remain valid.

## Frontend Design
Visual thesis: restrained enterprise operations surface, dense and calm, with one blue-accented configuration rail and minimal card chrome.

Content plan:
- Header: “Workspace Settings”, section description, current workspace context.
- Settings tabs: General, Ticketing, Forms, Workflow & Automation, Security & Access, Integrations.
- General: workspace identity, timezone, branding fields, business profile summary.
- Ticketing: ticket numbering, assignment strategy, queues, categories, ticket types, tags.
- Forms: custom fields and form templates.
- Workflow & Automation: links/status summaries for existing workflow and automation endpoints.
- Security & Access: links/status summaries for existing security policy, IdP, and SCIM APIs.
- Integrations: links/status summaries for existing webhook endpoints and delivery logs.

Interaction thesis:
- Tab changes should preserve page context and feel immediate through React state, not route reloads.
- Mutations should use optimistic-feeling button states and query invalidation after success.
- Dense config lists should use inline edit/deactivate actions before introducing modal-heavy flows.

UI implementation:
- Add `Settings` sidebar item gated by any of: `workspace.manage`, `tickets.manage`, `security.manage`, `integrations.manage`, `automation.manage`.
- Add route `/workspaces/:workspaceSlug/settings`.
- Create `WorkspaceSettingsPage.tsx` as a page-level coordinator.
- Extract focused settings components under `frontend/src/features/workspace/settings/` to avoid another 700+ line page file.
- Use existing shadcn components: `Tabs`, `Card`, `Field`, `Input`, `Textarea`, `Select`, `Button`, `Badge`, `Table`, `Skeleton`, and `Separator`.
- Follow project imports from `@/components/ui/*` and existing `apiRequest` patterns.

## Testing Design
Backend tests:
- Owner can read and patch general settings; unauthorized member cannot.
- Ticket manager can manage queues/categories/types/custom fields/templates; customer-only member cannot.
- Duplicate config keys fail within the same workspace and succeed across different workspaces.
- Updating settings writes audit events.
- Default queue/type/template switching is atomic.

Frontend verification:
- `npm run build` in `frontend`.
- Manual browser check after dev server starts: Settings route loads, tabs render, general and ticketing forms submit.

## Rollout Notes
This phase creates the configuration foundation. Later phases should consume these config dictionaries in ticket creation/editing, workflow conditions, automation actions, SLA policy selection, and platform admin compliance summaries.
