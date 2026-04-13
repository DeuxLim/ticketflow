# Workspace Settings Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend APIs and a real Settings UI for workspace general settings plus ticketing/form configuration.

**Architecture:** Add tenant-scoped settings/config tables behind Laravel API controllers, protected by existing workspace permission middleware and audited through the existing `AuditLogger`. Add a React settings route that composes focused settings components using existing shadcn/base-nova UI primitives and React Query.

**Tech Stack:** Laravel 12, Sanctum, PHPUnit feature tests, React 19, Vite, React Router, React Query, react-hook-form, zod, shadcn/ui base-nova, Tailwind CSS v4.

---

### Task 1: Backend Settings Schema And Models

**Files:**
- Create: `backend/database/migrations/2026_04_13_000000_create_workspace_settings_and_ticket_config_tables.php`
- Create: `backend/app/Models/WorkspaceSetting.php`
- Create: `backend/app/Models/TicketQueue.php`
- Create: `backend/app/Models/TicketCategory.php`
- Create: `backend/app/Models/TicketTag.php`
- Create: `backend/app/Models/TicketType.php`
- Create: `backend/app/Models/TicketCustomField.php`
- Create: `backend/app/Models/TicketFormTemplate.php`
- Modify: `backend/app/Models/Workspace.php`
- Modify: `backend/app/Actions/Workspaces/CreateWorkspaceAction.php`
- Test: `backend/tests/Feature/WorkspaceSettingsPhaseOneTest.php`

- [ ] **Step 1: Write failing schema/model test**

Create `backend/tests/Feature/WorkspaceSettingsPhaseOneTest.php` with a test named `test_workspace_creation_provisions_default_settings_and_ticket_config`:

```php
public function test_workspace_creation_provisions_default_settings_and_ticket_config(): void
{
    $owner = User::factory()->create();
    Sanctum::actingAs($owner);

    $workspace = $this->postJson('/api/workspaces', [
        'name' => 'Acme Support',
        'slug' => 'acme-support',
    ])->assertCreated()->json('data');

    $this->assertDatabaseHas('workspace_settings', [
        'workspace_id' => $workspace['id'],
        'timezone' => 'UTC',
        'ticket_number_format' => 'TKT-{seq:6}',
        'assignment_strategy' => 'manual',
    ]);

    $this->assertDatabaseHas('ticket_queues', [
        'workspace_id' => $workspace['id'],
        'key' => 'general',
        'is_default' => true,
    ]);

    $this->assertDatabaseHas('ticket_types', [
        'workspace_id' => $workspace['id'],
        'key' => 'incident',
        'is_default' => true,
    ]);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && php artisan test --filter=WorkspaceSettingsPhaseOneTest`

Expected: FAIL because `workspace_settings` does not exist.

- [ ] **Step 3: Add migration**

Create the migration with:
- `workspace_settings`: JSON text columns stored as nullable `text` because existing project stores JSON strings in text/string columns.
- config tables with `workspace_id` indexes and per-workspace unique keys.
- `is_default`, `is_active`, and `sort_order` where defined in the design.

Important constraints:
- `workspace_settings.workspace_id` unique.
- `ticket_queues`: unique `workspace_id,key`.
- `ticket_categories`: unique `workspace_id,key`.
- `ticket_tags`: unique `workspace_id,name`.
- `ticket_types`: unique `workspace_id,key`.
- `ticket_custom_fields`: unique `workspace_id,key`.

- [ ] **Step 4: Add models**

Each model should set `protected $fillable` and JSON/boolean casts where useful.

Example pattern:

```php
class WorkspaceSetting extends Model
{
    protected $fillable = [
        'workspace_id',
        'timezone',
        'branding_json',
        'business_profile_json',
        'ticket_number_format',
        'assignment_strategy',
        'ticketing_json',
    ];

    protected function casts(): array
    {
        return [
            'branding_json' => 'array',
            'business_profile_json' => 'array',
            'ticketing_json' => 'array',
        ];
    }
}
```

- [ ] **Step 5: Add Workspace relationships**

Add `setting()`, `ticketQueues()`, `ticketCategories()`, `ticketTags()`, `ticketTypes()`, `ticketCustomFields()`, and `ticketFormTemplates()` to `Workspace`.

- [ ] **Step 6: Provision defaults when creating a workspace**

In `CreateWorkspaceAction`, create default settings, queue, category, tag, ticket type, and basic form template after the existing workflow/SLA defaults.

Defaults:
- settings: timezone `UTC`, ticket format `TKT-{seq:6}`, assignment strategy `manual`.
- queue: `general` / `General Support` / default active.
- category: `general` / `General` / active.
- tag: `needs-triage` / active.
- ticket type: `incident` / `Incident` / default active.
- form template: `Default Incident Form` for the incident type with `title`, `description`, and `priority` fields.

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && php artisan test --filter=WorkspaceSettingsPhaseOneTest`

Expected: PASS.

---

### Task 2: Backend General And Ticketing Settings APIs

**Files:**
- Create: `backend/app/Http/Controllers/Api/Workspaces/WorkspaceSettingsController.php`
- Create: `backend/app/Http/Requests/Workspaces/UpdateWorkspaceGeneralSettingsRequest.php`
- Create: `backend/app/Http/Requests/Workspaces/UpdateWorkspaceTicketingSettingsRequest.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/WorkspaceSettingsPhaseOneTest.php`

- [ ] **Step 1: Write failing settings API tests**

Add tests:
- `test_owner_can_read_and_update_general_settings`
- `test_member_without_workspace_manage_cannot_update_general_settings`
- `test_ticket_manager_can_update_ticketing_settings`
- `test_ticketing_settings_requires_sequence_placeholder`

Expected assertions:
- `GET /api/workspaces/{slug}/settings/general` returns workspace name, timezone, branding, and business profile.
- `PATCH /api/workspaces/{slug}/settings/general` updates `workspaces.name` and `workspace_settings.timezone`.
- unauthorized member gets `403`.
- `PATCH /api/workspaces/{slug}/settings/ticketing` accepts `ticket_number_format: INC-{seq:5}` and `assignment_strategy: round_robin`.
- invalid `ticket_number_format: INC` returns `422`.
- audit table contains `workspace.settings.general.updated` and `workspace.settings.ticketing.updated`.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd backend && php artisan test --filter=WorkspaceSettingsPhaseOneTest`

Expected: FAIL because routes/controllers do not exist.

- [ ] **Step 3: Implement request validation**

General request rules:
- `name`: sometimes required string max 255.
- `timezone`: sometimes required string max 80.
- `branding`: nullable array.
- `business_profile`: nullable array.

Ticketing request rules:
- `ticket_number_format`: sometimes required string max 80, custom after-hook requiring `{seq`.
- `assignment_strategy`: sometimes required in `manual,round_robin,least_open_load`.
- `ticketing`: nullable array.

- [ ] **Step 4: Implement controller**

Controller methods:
- `general(Workspace $workspace)`.
- `updateGeneral(UpdateWorkspaceGeneralSettingsRequest $request, Workspace $workspace, AuditLogger $auditLogger)`.
- `ticketing(Workspace $workspace)`.
- `updateTicketing(UpdateWorkspaceTicketingSettingsRequest $request, Workspace $workspace, AuditLogger $auditLogger)`.

Use `$workspace->setting()->firstOrCreate(...)` to tolerate older workspaces.

- [ ] **Step 5: Add routes**

Under `/workspaces/{workspace}`:
- `GET /settings/general` with `workspace_permission:workspace.manage`.
- `PATCH /settings/general` with `workspace_permission:workspace.manage`.
- `GET /settings/ticketing` with `workspace_permission:tickets.manage`.
- `PATCH /settings/ticketing` with `workspace_permission:tickets.manage`.

- [ ] **Step 6: Run tests to verify pass**

Run: `cd backend && php artisan test --filter=WorkspaceSettingsPhaseOneTest`

Expected: PASS.

---

### Task 3: Backend Ticket Config CRUD APIs

**Files:**
- Create: `backend/app/Http/Controllers/Api/Workspaces/TicketQueueController.php`
- Create: `backend/app/Http/Controllers/Api/Workspaces/TicketCategoryController.php`
- Create: `backend/app/Http/Controllers/Api/Workspaces/TicketTagController.php`
- Create: `backend/app/Http/Controllers/Api/Workspaces/TicketTypeController.php`
- Create: `backend/app/Http/Controllers/Api/Workspaces/TicketCustomFieldController.php`
- Create: `backend/app/Http/Controllers/Api/Workspaces/TicketFormTemplateController.php`
- Create: `backend/app/Http/Requests/Workspaces/StoreTicketQueueRequest.php`
- Create: `backend/app/Http/Requests/Workspaces/UpdateTicketQueueRequest.php`
- Create matching request classes for category, tag, type, custom field, and form template.
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/WorkspaceSettingsPhaseOneTest.php`

- [ ] **Step 1: Write failing config API tests**

Add tests:
- `test_ticket_manager_can_create_update_and_deactivate_ticket_queue`
- `test_duplicate_config_keys_are_scoped_to_workspace`
- `test_ticket_custom_field_and_form_template_can_be_created`
- `test_member_without_tickets_manage_cannot_manage_ticket_config`
- `test_default_queue_switch_is_atomic`

Expected assertions:
- Create queue returns `201`.
- Patch queue name returns `200`.
- Patch `is_active: false` deactivates instead of deleting.
- Same queue key in a second workspace succeeds.
- Same queue key in the same workspace returns `422`.
- Creating an `is_default` queue clears the previous default.
- Audit table contains `ticket.queue.created` and `ticket.queue.updated`.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd backend && php artisan test --filter=WorkspaceSettingsPhaseOneTest`

Expected: FAIL because routes/controllers do not exist.

- [ ] **Step 3: Implement request validation**

Shared slug key rule: `regex:/^[a-z0-9_-]+$/`.

Queue/category/type fields:
- `key`, `name`, `description`, `is_default`, `is_active`, `sort_order`.

Tag fields:
- `name`, `color`, `description`, `is_active`.

Custom field fields:
- `key`, `label`, `field_type` in `text,textarea,number,select,multiselect,checkbox,date`.
- `options`, `validation`, `is_required`, `is_active`, `sort_order`.

Form template fields:
- `ticket_type_id`, `name`, `field_schema`, `visibility_rules`, `required_rules`, `is_default`, `is_active`.
- after-hook verifies `ticket_type_id` belongs to the active workspace.

- [ ] **Step 4: Implement controllers**

Each controller supports:
- `index` returns active/inactive rows ordered by `sort_order`, then `id`.
- `store` creates row, clears prior default in a DB transaction when `is_default` is true.
- `update` patches row, clears prior default in a DB transaction when `is_default` is true.

Use explicit workspace scoping in every query: `where('workspace_id', $workspace->id)`.

- [ ] **Step 5: Add routes**

Add route groups with `workspace_permission:tickets.manage`:
- `/ticket-queues`
- `/ticket-categories`
- `/ticket-tags`
- `/ticket-types`
- `/ticket-custom-fields`
- `/ticket-form-templates`

For each: `GET`, `POST`, `PATCH /{id}`.

- [ ] **Step 6: Run tests to verify pass**

Run: `cd backend && php artisan test --filter=WorkspaceSettingsPhaseOneTest`

Expected: PASS.

---

### Task 4: Frontend Settings Route And Types

**Files:**
- Modify: `frontend/src/types/api.ts`
- Modify: `frontend/src/layouts/WorkspaceLayout.tsx`
- Modify: `frontend/src/routes/workspace-routes.tsx`
- Create: `frontend/src/features/workspace/pages/WorkspaceSettingsPage.tsx`
- Create: `frontend/src/features/workspace/settings/types.ts`
- Create: `frontend/src/features/workspace/settings/settings-api.ts`

- [ ] **Step 1: Add API types**

Add exported types for:
- `WorkspaceGeneralSettings`
- `WorkspaceTicketingSettings`
- `TicketQueueConfig`
- `TicketCategoryConfig`
- `TicketTagConfig`
- `TicketTypeConfig`
- `TicketCustomFieldConfig`
- `TicketFormTemplateConfig`

- [ ] **Step 2: Add settings API helpers**

Create functions that wrap `apiRequest`, for example:

```ts
export function getGeneralSettings(workspaceSlug: string) {
  return apiRequest<ApiEnvelope<WorkspaceGeneralSettings>>(`/workspaces/${workspaceSlug}/settings/general`);
}
```

Use simple named functions instead of a class.

- [ ] **Step 3: Add Settings navigation**

Add `Settings` to `WorkspaceLayout` with a `Settings` icon from `lucide-react`. Show it when the user has any of these permissions:
- `workspace.manage`
- `tickets.manage`
- `security.manage`
- `integrations.manage`
- `automation.manage`

Implement with an optional `permissionsAny` property so existing single-permission links stay simple.

- [ ] **Step 4: Add route**

Add `{ path: 'settings', element: <WorkspaceSettingsPage /> }` to workspace routes.

- [ ] **Step 5: Add page coordinator**

Create `WorkspaceSettingsPage.tsx` with:
- permission loading state.
- forbidden state when no settings permission exists.
- `Tabs` with six tab values.
- child components imported from upcoming settings files.

- [ ] **Step 6: Run frontend build to catch type failures**

Run: `cd frontend && npm run build`

Expected: likely FAIL until child components exist in Task 5.

---

### Task 5: Frontend Settings Sections

**Files:**
- Create: `frontend/src/features/workspace/settings/GeneralSettingsSection.tsx`
- Create: `frontend/src/features/workspace/settings/TicketingSettingsSection.tsx`
- Create: `frontend/src/features/workspace/settings/FormsSettingsSection.tsx`
- Create: `frontend/src/features/workspace/settings/OperationsSettingsSection.tsx`
- Modify: `frontend/src/features/workspace/pages/WorkspaceSettingsPage.tsx`

- [ ] **Step 1: Implement General section**

Use:
- `useQuery` for general settings.
- `useForm` with zod schema.
- `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `Input`, `Textarea`, `Button`.
- `useMutation` to patch settings and invalidate the query.

Fields:
- name
- timezone
- branding display name
- support email
- business profile summary

- [ ] **Step 2: Implement Ticketing section**

Use:
- ticketing settings query/mutation.
- config queries for queues, categories, types, tags.
- inline create forms for queue/category/type/tag.
- compact tables for existing dictionaries.

Keep interactions simple:
- create rows.
- toggle active status through PATCH.
- do not add modals in Phase 1.

- [ ] **Step 3: Implement Forms section**

Use:
- custom field query.
- form template query.
- create form for custom field.
- create form for template name and selected ticket type.

Keep field schema advanced JSON editing out of Phase 1 UI; send a default schema from selected active fields.

- [ ] **Step 4: Implement Operations sections**

Create one shared operations component that renders utility summaries for:
- Workflow & Automation
- Security & Access
- Integrations

These should be summary panels linked to existing operational APIs, not fake editors.

- [ ] **Step 5: Run frontend build**

Run: `cd frontend && npm run build`

Expected: PASS.

---

### Task 6: Full Verification And Cleanup

**Files:**
- All changed files from Tasks 1-5.

- [ ] **Step 1: Run targeted backend tests**

Run: `cd backend && php artisan test --filter=WorkspaceSettingsPhaseOneTest`

Expected: PASS.

- [ ] **Step 2: Run existing enterprise tests**

Run: `cd backend && php artisan test --filter=EnterpriseFoundationTest --filter=EnterprisePhaseTwoFlowsTest`

If the command syntax does not run both filters, run each filter separately.

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run: `cd frontend && npm run build`

Expected: PASS.

- [ ] **Step 4: Check formatting manually**

Run: `cd backend && ./vendor/bin/pint --dirty --test` if available.

Expected: PASS or no dirty formatting issues.

- [ ] **Step 5: Final status**

Because `/Users/deuxlim/WebDevelopment/VibeCoding/Ticketing` is not a Git repository root, do not claim commits. Report changed files and verification outputs.
