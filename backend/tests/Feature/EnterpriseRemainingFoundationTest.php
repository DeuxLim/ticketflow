<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EnterpriseRemainingFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_workflow_approval_lifecycle_can_transition_ticket_after_dual_step(): void
    {
        [$workspace, $owner] = $this->createWorkspaceAsOwner();
        Sanctum::actingAs($owner);

        $workflow = $this->postJson("/api/workspaces/{$workspace['slug']}/workflows", [
            'name' => 'Approval Workflow',
            'is_default' => true,
            'transitions' => [
                [
                    'from_status' => 'open',
                    'to_status' => 'resolved',
                    'required_permission' => 'tickets.manage',
                    'requires_approval' => true,
                    'approver_mode' => 'users',
                    'approver_user_ids' => [$owner->id],
                ],
            ],
        ])->assertCreated()->json('data');

        $customerId = DB::table('customers')->insertGetId([
            'workspace_id' => $workspace['id'],
            'name' => 'Customer A',
            'email' => 'customer@example.com',
            'phone' => null,
            'company' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customerId,
            'title' => 'Server down',
            'description' => 'Needs escalation',
            'status' => 'open',
            'priority' => 'high',
        ])->assertCreated()->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/transition", [
            'to_status' => 'resolved',
            'reason' => 'Change requires approval',
        ])->assertStatus(202);

        $approval = $this->getJson("/api/workspaces/{$workspace['slug']}/approvals?status=pending")
            ->assertOk()
            ->assertJsonPath('data.0.status', 'pending')
            ->json('data.0');

        $this->postJson("/api/workspaces/{$workspace['slug']}/approvals/{$approval['id']}/approve", [
            'reason' => 'Approved by owner',
        ])->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->getJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}")
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved');
    }

    public function test_automation_rule_execution_logs_and_toggle_endpoint_work(): void
    {
        [$workspace, $owner] = $this->createWorkspaceAsOwner();
        Sanctum::actingAs($owner);

        $customerId = DB::table('customers')->insertGetId([
            'workspace_id' => $workspace['id'],
            'name' => 'Customer B',
            'email' => 'customer-b@example.com',
            'phone' => null,
            'company' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $rule = $this->postJson("/api/workspaces/{$workspace['slug']}/automation-rules", [
            'name' => 'Escalate open ticket updates',
            'event_type' => 'ticket.updated',
            'priority' => 10,
            'conditions' => [
                ['field' => 'status', 'operator' => 'eq', 'value' => 'open'],
            ],
            'actions' => [
                ['type' => 'set_field', 'field' => 'priority', 'value' => 'urgent'],
            ],
            'is_active' => true,
        ])->assertCreated()->json('data');

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customerId,
            'title' => 'VPN issue',
            'description' => 'Intermittent connection',
            'status' => 'open',
            'priority' => 'medium',
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}", [
            'title' => 'VPN issue updated',
        ])->assertOk();

        $this->getJson("/api/workspaces/{$workspace['slug']}/automation-executions")
            ->assertOk()
            ->assertJsonPath('data.0.status', 'applied');

        $this->postJson("/api/workspaces/{$workspace['slug']}/automation-rules/{$rule['id']}/toggle", [
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_platform_admin_can_suspend_workspace_and_member_is_blocked(): void
    {
        [$workspace, $owner] = $this->createWorkspaceAsOwner();
        $platformAdmin = User::factory()->create(['is_platform_admin' => true]);

        Sanctum::actingAs($platformAdmin);
        $this->postJson("/api/admin/workspaces/{$workspace['slug']}/suspend", [
            'reason' => 'Compliance hold',
            'confirmed' => true,
        ])->assertOk()
            ->assertJsonPath('data.lifecycle_status', 'suspended');

        Sanctum::actingAs($owner);
        $this->getJson("/api/workspaces/{$workspace['slug']}/tickets")
            ->assertForbidden();
    }

    public function test_governance_endpoints_cover_retention_export_and_removed_break_glass(): void
    {
        [$workspace, $owner] = $this->createWorkspaceAsOwner();

        Sanctum::actingAs($owner);
        $this->patchJson("/api/workspaces/{$workspace['slug']}/retention-policies", [
            'tickets_days' => 400,
            'comments_days' => 300,
            'attachments_days' => 200,
            'audit_days' => 900,
        ])->assertOk()
            ->assertJsonPath('data.tickets_days', 400);

        $exportResponse = $this->postJson("/api/workspaces/{$workspace['slug']}/exports", [
            'include' => ['tickets', 'audit'],
        ])->assertCreated();

        $downloadUrl = $exportResponse->json('meta.download_url');
        $token = (string) parse_url($downloadUrl, PHP_URL_QUERY);
        $token = str_replace('token=', '', $token);
        $exportId = $exportResponse->json('data.id');

        $this->getJson("/api/workspaces/{$workspace['slug']}/exports/{$exportId}/download?token={$token}")
            ->assertOk();

        $this->getJson("/api/workspaces/{$workspace['slug']}/break-glass/requests")
            ->assertNotFound();
        $this->postJson("/api/workspaces/{$workspace['slug']}/break-glass/requests", [
            'reason' => 'Critical production access required for incident response.',
            'duration_minutes' => 60,
        ])->assertNotFound();
    }

    private function createWorkspaceAsOwner(): array
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Enterprise Workspace',
            'slug' => 'enterprise-'.strtolower(fake()->bothify('??????')),
        ])->assertCreated()->json('data');

        return [$workspace, $owner];
    }

    private function createAdminMember(int $workspaceId): User
    {
        $user = User::factory()->create();

        $membershipId = DB::table('workspace_memberships')->insertGetId([
            'workspace_id' => $workspaceId,
            'user_id' => $user->id,
            'joined_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $roleId = DB::table('workspace_roles')
            ->where('workspace_id', $workspaceId)
            ->where('slug', 'admin')
            ->value('id');

        DB::table('workspace_membership_roles')->insert([
            'workspace_membership_id' => $membershipId,
            'workspace_role_id' => $roleId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $user;
    }
}
