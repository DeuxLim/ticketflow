<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomersCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_workspace_user_can_update_and_delete_customer(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme',
            'slug' => 'acme',
        ])->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'company' => 'Acme Corp',
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/customers/{$customer['id']}", [
            'name' => 'Jane Smith',
            'email' => 'jane.smith@example.com',
            'phone' => '+6399999999',
            'company' => 'Acme Labs',
        ])->assertOk()->assertJsonPath('data.name', 'Jane Smith');

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/customers/{$customer['id']}")
            ->assertOk();

        $this->assertDatabaseMissing('customers', [
            'id' => $customer['id'],
        ]);
    }

    public function test_customer_from_other_workspace_is_not_accessible(): void
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

        $customer = $this->postJson("/api/workspaces/{$workspaceA['slug']}/customers", [
            'name' => 'Cross Tenant',
            'email' => 'cross@example.com',
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspaceB['slug']}/customers/{$customer['id']}", [
            'name' => 'Should Fail',
        ])->assertNotFound();

        $this->deleteJson("/api/workspaces/{$workspaceB['slug']}/customers/{$customer['id']}")
            ->assertNotFound();
    }

    public function test_customer_with_related_tickets_cannot_be_deleted(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme',
            'slug' => 'acme',
        ])->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->assertCreated()->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Customer cannot login',
            'description' => 'Unable to login after password reset',
            'priority' => 'high',
        ])->assertCreated();

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/customers/{$customer['id']}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Customer cannot be deleted while related tickets exist.');
    }
}
