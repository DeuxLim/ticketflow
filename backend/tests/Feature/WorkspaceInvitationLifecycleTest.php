<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceInvitationLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_owner_can_cancel_pending_invitation(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $agentRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'agent')
            ->value('id');

        $invitation = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$agentRoleId],
        ])->assertCreated()->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/invitations/{$invitation['id']}/cancel")
            ->assertOk();

        $this->assertDatabaseHas('workspace_invitations', [
            'id' => $invitation['id'],
            'status' => 'cancelled',
        ]);
    }

    public function test_cancelled_invitation_cannot_be_accepted(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $agentRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'agent')
            ->value('id');

        $invitation = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$agentRoleId],
        ])->assertCreated()->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/invitations/{$invitation['id']}/cancel")
            ->assertOk();

        $invitee = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($invitee);

        $this->postJson('/api/invitations/accept', [
            'token' => $invitation['token'],
        ])->assertStatus(422);
    }
}
