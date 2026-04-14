<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceSettingsPhaseOneTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_owner_can_read_and_update_general_settings(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();

        $this->getJson("/api/workspaces/{$workspace['slug']}/settings/general")
            ->assertOk()
            ->assertJsonPath('data.name', 'Acme Support')
            ->assertJsonPath('data.timezone', 'UTC');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/settings/general", [
            'name' => 'Acme Enterprise Support',
            'timezone' => 'Asia/Manila',
            'branding' => ['display_name' => 'Acme Desk'],
            'business_profile' => ['summary' => 'Internal ITSM support desk'],
        ])->assertOk()
            ->assertJsonPath('data.name', 'Acme Enterprise Support')
            ->assertJsonPath('data.timezone', 'Asia/Manila')
            ->assertJsonPath('data.branding.display_name', 'Acme Desk')
            ->assertJsonPath('data.business_profile.summary', 'Internal ITSM support desk');

        $this->assertDatabaseHas('workspaces', [
            'id' => $workspace['id'],
            'name' => 'Acme Enterprise Support',
        ]);

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace['id'],
            'action' => 'workspace.settings.general.updated',
        ]);
    }

    public function test_member_without_workspace_manage_cannot_update_general_settings(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();
        $member = $this->createMemberForRole($workspace['id'], 'member');
        Sanctum::actingAs($member);

        $this->patchJson("/api/workspaces/{$workspace['slug']}/settings/general", [
            'name' => 'Unauthorized Rename',
        ])->assertForbidden();
    }

    public function test_ticket_manager_can_update_ticketing_settings(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();
        $admin = $this->createMemberForRole($workspace['id'], 'admin');
        Sanctum::actingAs($admin);

        $this->patchJson("/api/workspaces/{$workspace['slug']}/settings/ticketing", [
            'ticket_number_format' => 'INC-{seq:5}',
            'assignment_strategy' => 'round_robin',
            'ticketing' => ['statuses' => ['open', 'waiting', 'closed']],
        ])->assertOk()
            ->assertJsonPath('data.ticket_number_format', 'INC-{seq:5}')
            ->assertJsonPath('data.assignment_strategy', 'round_robin')
            ->assertJsonPath('data.ticketing.statuses.1', 'waiting');

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace['id'],
            'action' => 'workspace.settings.ticketing.updated',
        ]);
    }

    public function test_ticketing_settings_requires_sequence_placeholder(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();

        $this->patchJson("/api/workspaces/{$workspace['slug']}/settings/ticketing", [
            'ticket_number_format' => 'INC',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('ticket_number_format');
    }

    public function test_ticket_manager_can_create_update_and_deactivate_ticket_queue(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();
        $admin = $this->createMemberForRole($workspace['id'], 'admin');
        Sanctum::actingAs($admin);

        $queue = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-queues", [
            'key' => 'p1',
            'name' => 'Priority One',
            'description' => 'Critical incidents',
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 10,
        ])->assertCreated()
            ->assertJsonPath('data.key', 'p1')
            ->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/ticket-queues/{$queue['id']}", [
            'name' => 'P1 Response',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'P1 Response')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace['id'],
            'action' => 'ticket.queue.created',
        ]);

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace['id'],
            'action' => 'ticket.queue.updated',
        ]);
    }

    public function test_duplicate_config_keys_are_scoped_to_workspace(): void
    {
        [$firstWorkspace, $firstOwner] = $this->createWorkspaceAsOwner();
        [$secondWorkspace, $secondOwner] = $this->createWorkspaceAsOwner();

        Sanctum::actingAs($firstOwner);
        $this->postJson("/api/workspaces/{$firstWorkspace['slug']}/ticket-queues", [
            'key' => 'billing',
            'name' => 'Billing',
        ])->assertCreated();

        $this->postJson("/api/workspaces/{$firstWorkspace['slug']}/ticket-queues", [
            'key' => 'billing',
            'name' => 'Billing Duplicate',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('key');

        Sanctum::actingAs($secondOwner);
        $this->postJson("/api/workspaces/{$secondWorkspace['slug']}/ticket-queues", [
            'key' => 'billing',
            'name' => 'Billing',
        ])->assertCreated();
    }

    public function test_ticket_custom_field_and_form_template_can_be_created(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();

        $field = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-custom-fields", [
            'key' => 'asset_id',
            'label' => 'Asset ID',
            'field_type' => 'text',
            'is_required' => true,
            'is_active' => true,
            'sort_order' => 20,
        ])->assertCreated()
            ->assertJsonPath('data.key', 'asset_id')
            ->json('data');

        $ticketTypeId = DB::table('ticket_types')
            ->where('workspace_id', $workspace['id'])
            ->where('key', 'incident')
            ->value('id');

        $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-form-templates", [
            'ticket_type_id' => $ticketTypeId,
            'name' => 'Incident With Asset',
            'field_schema' => [
                ['key' => $field['key'], 'required' => true],
            ],
            'is_default' => true,
            'is_active' => true,
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Incident With Asset')
            ->assertJsonPath('data.field_schema.0.key', 'asset_id');
    }

    public function test_ticket_dictionary_and_form_resources_support_updates_with_nullable_template_type(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();

        $category = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-categories", [
            'key' => 'billing',
            'name' => 'Billing',
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/ticket-categories/{$category['id']}", [
            'name' => 'Billing and Finance',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Billing and Finance')
            ->assertJsonPath('data.is_active', false);

        $tag = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-tags", [
            'name' => 'vip',
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/ticket-tags/{$tag['id']}", [
            'name' => 'vip-priority',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'vip-priority')
            ->assertJsonPath('data.is_active', false);

        $type = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-types", [
            'key' => 'problem',
            'name' => 'Problem',
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/ticket-types/{$type['id']}", [
            'name' => 'Problem Management',
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Problem Management')
            ->assertJsonPath('data.is_active', false);

        $field = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-custom-fields", [
            'key' => 'asset_id',
            'label' => 'Asset ID',
            'field_type' => 'text',
            'is_required' => true,
            'is_active' => true,
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/ticket-custom-fields/{$field['id']}", [
            'label' => 'Asset Number',
            'is_required' => false,
        ])->assertOk()
            ->assertJsonPath('data.label', 'Asset Number')
            ->assertJsonPath('data.is_required', false);

        $ticketTypeId = DB::table('ticket_types')
            ->where('workspace_id', $workspace['id'])
            ->where('key', 'incident')
            ->value('id');

        $template = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-form-templates", [
            'ticket_type_id' => $ticketTypeId,
            'name' => 'Incident Intake',
            'field_schema' => [
                ['key' => 'asset_id', 'required' => true],
            ],
            'is_default' => false,
            'is_active' => true,
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/ticket-form-templates/{$template['id']}", [
            'name' => 'Universal Intake',
            'ticket_type_id' => null,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Universal Intake')
            ->assertJsonPath('data.ticket_type_id', null)
            ->assertJsonPath('data.is_active', false);
    }

    public function test_member_without_tickets_manage_cannot_manage_ticket_config(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();
        $member = $this->createMemberForRole($workspace['id'], 'member');
        Sanctum::actingAs($member);

        $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-queues", [
            'key' => 'blocked',
            'name' => 'Blocked',
        ])->assertForbidden();
    }

    public function test_default_queue_switch_is_atomic(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();

        $queue = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-queues", [
            'key' => 'vip',
            'name' => 'VIP',
            'is_default' => true,
        ])->assertCreated()
            ->assertJsonPath('data.is_default', true)
            ->json('data');

        $this->assertDatabaseHas('ticket_queues', [
            'id' => $queue['id'],
            'is_default' => true,
        ]);

        $this->assertDatabaseHas('ticket_queues', [
            'workspace_id' => $workspace['id'],
            'key' => 'general',
            'is_default' => false,
        ]);
    }

    public function test_settings_endpoints_backfill_missing_foundation_for_existing_workspace(): void
    {
        [$workspace] = $this->createWorkspaceAsOwner();

        DB::table('ticket_form_templates')->where('workspace_id', $workspace['id'])->delete();
        DB::table('ticket_types')->where('workspace_id', $workspace['id'])->delete();
        DB::table('ticket_tags')->where('workspace_id', $workspace['id'])->delete();
        DB::table('ticket_categories')->where('workspace_id', $workspace['id'])->delete();
        DB::table('ticket_queues')->where('workspace_id', $workspace['id'])->delete();
        DB::table('workspace_settings')->where('workspace_id', $workspace['id'])->delete();
        DB::table('workflow_transitions')->whereIn('ticket_workflow_id', function ($query) use ($workspace): void {
            $query->select('id')->from('ticket_workflows')->where('workspace_id', $workspace['id']);
        })->delete();
        DB::table('ticket_workflows')->where('workspace_id', $workspace['id'])->delete();

        $this->getJson("/api/workspaces/{$workspace['slug']}/settings/ticketing")
            ->assertOk()
            ->assertJsonPath('data.ticket_number_format', 'TKT-{seq:6}');

        $this->getJson("/api/workspaces/{$workspace['slug']}/ticket-queues")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.key', 'general');

        $this->getJson("/api/workspaces/{$workspace['slug']}/workflows")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_default', true);
    }

    private function createWorkspaceAsOwner(): array
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support-'.strtolower(fake()->bothify('????')),
        ])->assertCreated()->json('data');

        return [$workspace, $owner];
    }

    private function createMemberForRole(int $workspaceId, string $roleSlug): User
    {
        $member = User::factory()->create();

        $membershipId = DB::table('workspace_memberships')->insertGetId([
            'workspace_id' => $workspaceId,
            'user_id' => $member->id,
            'joined_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $roleId = DB::table('workspace_roles')
            ->where('workspace_id', $workspaceId)
            ->where('slug', $roleSlug)
            ->value('id');

        DB::table('workspace_membership_roles')->insert([
            'workspace_membership_id' => $membershipId,
            'workspace_role_id' => $roleId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $member;
    }
}
