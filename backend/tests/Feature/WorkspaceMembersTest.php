<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $memberRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'member')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$memberRoleId],
        ])->json('data');

        $agent = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($agent);

        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        Sanctum::actingAs($owner);

        $response = $this->getJson("/api/workspaces/{$workspace['slug']}/members")
            ->assertOk()
            ->json('data');

        $this->assertCount(2, $response);
        $this->assertSame('owner', $response[0]['roles'][0]['slug']);
    }

    public function test_member_without_permission_cannot_view_members_list(): void
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
        ])->json('data');

        $agent = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($agent);

        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        $this->getJson("/api/workspaces/{$workspace['slug']}/members")
            ->assertForbidden();
    }
}
