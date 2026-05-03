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

    public function test_member_without_permission_cannot_view_members_list(): void
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

        $this->getJson("/api/workspaces/{$workspace['slug']}/members")
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
}
