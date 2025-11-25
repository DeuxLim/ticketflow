<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkspaceRolesTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_owner_can_list_workspace_roles(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ])->json('data');

        $response = $this->getJson("/api/workspaces/{$workspace['slug']}/roles")
            ->assertOk()
            ->json('data');

        $this->assertCount(3, $response);
        $this->assertSame('admin', $response[0]['slug']);
    }

    public function test_member_without_roles_manage_cannot_list_roles(): void
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

        $invitation = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$viewerRoleId],
        ])->json('data');

        $member = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($member);

        $this->postJson('/api/invitations/accept', ['token' => $invitation['token']])->assertOk();

        $this->getJson("/api/workspaces/{$workspace['slug']}/roles")
            ->assertForbidden();
    }
}
