<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceInvitationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_owner_can_invite_and_invitee_can_accept_with_roles(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $memberRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'member')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$memberRoleId],
            'expires_in_days' => 7,
        ])->assertCreated()->json('data');

        $invitee = User::factory()->create([
            'email' => 'agent@example.com',
        ]);

        Sanctum::actingAs($invitee);

        $this->postJson('/api/invitations/accept', [
            'token' => $invite['token'],
        ])->assertOk();

        $this->assertDatabaseHas('workspace_memberships', [
            'workspace_id' => $workspace['id'],
            'user_id' => $invitee->id,
        ]);

        $membershipId = \DB::table('workspace_memberships')
            ->where('workspace_id', $workspace['id'])
            ->where('user_id', $invitee->id)
            ->value('id');

        $this->assertDatabaseHas('workspace_membership_roles', [
            'workspace_membership_id' => $membershipId,
            'workspace_role_id' => $memberRoleId,
        ]);

        $this->assertDatabaseHas('workspace_invitations', [
            'id' => $invite['id'],
            'status' => 'accepted',
            'accepted_by_user_id' => $invitee->id,
        ]);
    }

    public function test_invitation_rejects_roles_from_other_workspace(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspaceA = $this->postJson('/api/workspaces', [
            'name' => 'Workspace A',
            'slug' => 'workspace-a',
        ])->json('data');

        $workspaceB = $this->postJson('/api/workspaces', [
            'name' => 'Workspace B',
            'slug' => 'workspace-b',
        ])->json('data');

        $roleFromOtherWorkspace = \DB::table('workspace_roles')
            ->where('workspace_id', $workspaceB['id'])
            ->where('slug', 'member')
            ->value('id');

        $this->postJson("/api/workspaces/{$workspaceA['slug']}/invitations", [
            'email' => 'x@example.com',
            'role_ids' => [$roleFromOtherWorkspace],
        ])->assertUnprocessable();
    }

    public function test_non_member_cannot_invite_in_workspace(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $outsider = User::factory()->create();
        Sanctum::actingAs($outsider);

        $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'outside@example.com',
            'role_ids' => [],
        ])->assertForbidden();
    }

    public function test_invitation_acceptance_rejects_email_mismatch(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $memberRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'member')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'expected@example.com',
            'role_ids' => [$memberRoleId],
        ])->assertCreated()->json('data');

        $differentUser = User::factory()->create([
            'email' => 'different@example.com',
        ]);

        Sanctum::actingAs($differentUser);

        $this->postJson('/api/invitations/accept', [
            'token' => $invite['token'],
        ])->assertForbidden();
    }
}
