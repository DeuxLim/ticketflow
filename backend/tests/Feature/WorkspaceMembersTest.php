<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceMembersTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_owner_can_view_members_with_roles(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $viewerRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'viewer')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$viewerRoleId],
        ])->json('data');

        $agent = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($agent);

        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        Sanctum::actingAs($owner);

        $response = $this->getJson("/api/workspaces/{$workspace['slug']}/members")
            ->assertOk()
            ->json('data');

        $this->assertCount(2, $response);
        $this->assertSame('admin', $response[0]['roles'][0]['slug']);
    }

    public function test_workspace_owner_can_view_role_options_for_member_management(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();

        $response = $this->getJson("/api/workspaces/{$workspace['slug']}/members/role-options")
            ->assertOk()
            ->json('data');

        $this->assertCount(3, $response);
        $this->assertSame('admin', $response[0]['slug']);
    }

    public function test_member_without_permission_cannot_view_members_list(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $member = $this->inviteMemberIntoWorkspace($workspace, 'agent@example.com', 'viewer');

        Sanctum::actingAs($member);

        $this->getJson("/api/workspaces/{$workspace['slug']}/members")
            ->assertForbidden();
    }

    public function test_member_without_permission_cannot_view_role_options_update_or_delete_members(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $member = $this->inviteMemberIntoWorkspace($workspace, 'agent@example.com', 'viewer');
        $otherMember = $this->inviteMemberIntoWorkspace($workspace, 'viewer@example.com', 'viewer');
        $membershipId = $this->workspaceMembershipId($workspace['id'], $otherMember->id);
        $agentRoleId = $this->workspaceRoleId($workspace['id'], 'agent');

        Sanctum::actingAs($member);

        $this->getJson("/api/workspaces/{$workspace['slug']}/members/role-options")
            ->assertForbidden();

        $this->patchJson("/api/workspaces/{$workspace['slug']}/members/{$membershipId}", [
            'role_ids' => [$agentRoleId],
        ])->assertForbidden();

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/members/{$membershipId}")
            ->assertForbidden();
    }

    public function test_member_without_tickets_manage_cannot_view_assignable_members(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $viewerRoleId = DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'viewer')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$viewerRoleId],
        ])->json('data');

        $agent = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($agent);

        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        $this->getJson("/api/workspaces/{$workspace['slug']}/members/assignable")
            ->assertForbidden();
    }

    public function test_member_with_tickets_manage_can_view_assignable_members_without_members_manage(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $viewerRoleId = DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'viewer')
            ->value('id');

        $ticketsManagePermissionId = DB::table('workspace_permissions')
            ->where('slug', 'tickets.manage')
            ->value('id');

        DB::table('workspace_role_permissions')->insert([
            'workspace_role_id' => $viewerRoleId,
            'workspace_permission_id' => $ticketsManagePermissionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$viewerRoleId],
        ])->json('data');

        $agent = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($agent);

        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        $this->getJson("/api/workspaces/{$workspace['slug']}/members")
            ->assertForbidden();

        $this->getJson("/api/workspaces/{$workspace['slug']}/members/assignable")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_workspace_owner_can_update_another_members_role(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $member = $this->inviteMemberIntoWorkspace($workspace, 'agent@example.com', 'viewer');
        $membershipId = $this->workspaceMembershipId($workspace['id'], $member->id);
        $agentRoleId = $this->workspaceRoleId($workspace['id'], 'agent');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/members/{$membershipId}", [
            'role_ids' => [$agentRoleId],
        ])->assertOk()
            ->assertJsonPath('data.roles.0.slug', 'agent');

        $this->assertDatabaseHas('workspace_membership_roles', [
            'workspace_membership_id' => $membershipId,
            'workspace_role_id' => $agentRoleId,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'workspace_id' => $workspace['id'],
            'action' => 'member.roles_updated',
            'subject_id' => $membershipId,
        ]);
    }

    public function test_workspace_owner_can_remove_another_member(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $member = $this->inviteMemberIntoWorkspace($workspace, 'agent@example.com', 'viewer');
        $membershipId = $this->workspaceMembershipId($workspace['id'], $member->id);

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/members/{$membershipId}")
            ->assertOk()
            ->assertJsonPath('message', 'Member removed.');

        $this->assertDatabaseMissing('workspace_memberships', [
            'id' => $membershipId,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'workspace_id' => $workspace['id'],
            'action' => 'member.removed',
            'subject_id' => $membershipId,
        ]);
    }

    public function test_member_update_rejects_roles_from_other_workspace(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $member = $this->inviteMemberIntoWorkspace($workspace, 'agent@example.com', 'viewer');
        $membershipId = $this->workspaceMembershipId($workspace['id'], $member->id);

        $otherWorkspace = $this->postJson('/api/workspaces', [
            'name' => 'Other Support',
            'slug' => 'other-support',
        ])->json('data');

        $otherRoleId = $this->workspaceRoleId($otherWorkspace['id'], 'agent');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/members/{$membershipId}", [
            'role_ids' => [$otherRoleId],
        ])->assertUnprocessable();
    }

    public function test_workspace_owner_cannot_change_their_own_role(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $ownerMembershipId = $this->workspaceMembershipId($workspace['id'], auth()->id());
        $agentRoleId = $this->workspaceRoleId($workspace['id'], 'agent');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/members/{$ownerMembershipId}", [
            'role_ids' => [$agentRoleId],
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'You cannot change your own workspace access from this screen.');
    }

    public function test_workspace_owner_cannot_remove_themselves(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $ownerMembershipId = $this->workspaceMembershipId($workspace['id'], auth()->id());

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/members/{$ownerMembershipId}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You cannot remove yourself from the workspace from this screen.');
    }

    public function test_last_admin_cannot_be_changed_to_a_non_admin_role(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $viewerRoleId = $this->workspaceRoleId($workspace['id'], 'viewer');
        $ownerMembershipId = $this->workspaceMembershipId($workspace['id'], auth()->id());

        $otherAdmin = $this->inviteMemberIntoWorkspace($workspace, 'other-admin@example.com', 'admin');
        $otherAdminMembershipId = $this->workspaceMembershipId($workspace['id'], $otherAdmin->id);

        $this->patchJson("/api/workspaces/{$workspace['slug']}/members/{$otherAdminMembershipId}", [
            'role_ids' => [$viewerRoleId],
        ])->assertOk();

        $this->patchJson("/api/workspaces/{$workspace['slug']}/members/{$ownerMembershipId}", [
            'role_ids' => [$viewerRoleId],
        ])->assertUnprocessable();
    }

    public function test_last_admin_cannot_be_removed(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();
        $ownerMembershipId = $this->workspaceMembershipId($workspace['id'], auth()->id());

        $otherAdmin = $this->inviteMemberIntoWorkspace($workspace, 'other-admin@example.com', 'admin');
        $otherAdminMembershipId = $this->workspaceMembershipId($workspace['id'], $otherAdmin->id);

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/members/{$otherAdminMembershipId}")
            ->assertOk();

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/members/{$ownerMembershipId}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You cannot remove yourself from the workspace from this screen.');
    }

    public function test_cross_workspace_membership_target_returns_not_found(): void
    {
        $workspace = $this->createWorkspaceForMemberTests();

        $otherWorkspace = $this->postJson('/api/workspaces', [
            'name' => 'Other Support',
            'slug' => 'other-support',
        ])->json('data');

        $member = $this->inviteMemberIntoWorkspace($otherWorkspace, 'agent@example.com', 'viewer');
        $membershipId = $this->workspaceMembershipId($otherWorkspace['id'], $member->id);
        $agentRoleId = $this->workspaceRoleId($workspace['id'], 'agent');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/members/{$membershipId}", [
            'role_ids' => [$agentRoleId],
        ])->assertNotFound();

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/members/{$membershipId}")
            ->assertNotFound();
    }

    private function createWorkspaceForMemberTests(): array
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        return $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');
    }

    private function inviteMemberIntoWorkspace(array $workspace, string $email, string $roleSlug): User
    {
        $roleId = $this->workspaceRoleId($workspace['id'], $roleSlug);

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => $email,
            'role_ids' => [$roleId],
        ])->json('data');

        $member = User::factory()->create(['email' => $email]);
        Sanctum::actingAs($member);
        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        Sanctum::actingAs(User::query()->findOrFail($workspace['owner_user_id']));

        return $member;
    }

    private function workspaceRoleId(int $workspaceId, string $roleSlug): int
    {
        return (int) DB::table('workspace_roles')
            ->where('workspace_id', $workspaceId)
            ->where('slug', $roleSlug)
            ->value('id');
    }

    private function workspaceMembershipId(int $workspaceId, int $userId): int
    {
        return (int) DB::table('workspace_memberships')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->value('id');
    }
}
