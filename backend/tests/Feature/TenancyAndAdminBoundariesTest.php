<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenancyAndAdminBoundariesTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_bootstrap_assigns_owner_membership_and_owner_role(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/workspaces', [
            'name' => 'Acme Support',
            'slug' => 'acme-support',
        ]);

        $response->assertCreated();

        $workspaceId = $response->json('data.id');

        $this->assertDatabaseHas('workspaces', [
            'id' => $workspaceId,
            'owner_user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('workspace_memberships', [
            'workspace_id' => $workspaceId,
            'user_id' => $user->id,
        ]);

        $membershipId = \DB::table('workspace_memberships')
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->value('id');

        $ownerRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspaceId)
            ->where('slug', 'owner')
            ->value('id');

        $this->assertDatabaseHas('workspace_membership_roles', [
            'workspace_membership_id' => $membershipId,
            'workspace_role_id' => $ownerRoleId,
        ]);
    }

    public function test_member_cannot_access_customer_from_other_workspace(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $workspaceA = $this->postJson('/api/workspaces', [
            'name' => 'Workspace A',
            'slug' => 'workspace-a',
        ])->json('data');

        $workspaceB = $this->postJson('/api/workspaces', [
            'name' => 'Workspace B',
            'slug' => 'workspace-b',
        ])->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspaceA['slug']}/customers", [
            'name' => 'Jane Customer',
            'email' => 'jane@example.com',
        ])->json('data');

        $this->getJson("/api/workspaces/{$workspaceB['slug']}/customers/{$customer['id']}")
            ->assertNotFound();
    }

    public function test_non_platform_admin_cannot_access_platform_admin_dashboard(): void
    {
        $normalUser = User::factory()->create(['is_platform_admin' => false]);
        Sanctum::actingAs($normalUser);

        $this->getJson('/api/admin/dashboard')
            ->assertForbidden();
        $this->getJson('/api/admin/users')
            ->assertForbidden();
        $this->getJson('/api/admin/workspaces')
            ->assertForbidden();

        $admin = User::factory()->create(['is_platform_admin' => true]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'users_count',
                    'workspaces_count',
                    'memberships_count',
                    'tickets_count',
                ],
            ]);

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'first_name',
                        'last_name',
                        'username',
                        'email',
                        'is_platform_admin',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);

        $this->getJson('/api/admin/workspaces')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
    }
}
