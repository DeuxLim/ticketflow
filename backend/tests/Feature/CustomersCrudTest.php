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

    public function test_workspace_user_can_create_and_update_enriched_customer_profile(): void
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
            'phone' => '+639171234567',
            'company' => 'Acme Corp',
            'job_title' => 'Operations Lead',
            'website' => 'https://acme.example',
            'timezone' => 'Asia/Manila',
            'preferred_contact_method' => 'email',
            'preferred_language' => 'English',
            'address' => '123 Support Street, Makati',
            'external_reference' => 'CRM-1001',
            'support_tier' => 'enterprise',
            'status' => 'active',
            'internal_notes' => 'Escalate renewal questions to account owner.',
        ])->assertCreated()
            ->assertJsonPath('data.job_title', 'Operations Lead')
            ->assertJsonPath('data.website', 'https://acme.example')
            ->assertJsonPath('data.timezone', 'Asia/Manila')
            ->assertJsonPath('data.preferred_contact_method', 'email')
            ->assertJsonPath('data.preferred_language', 'English')
            ->assertJsonPath('data.address', '123 Support Street, Makati')
            ->assertJsonPath('data.external_reference', 'CRM-1001')
            ->assertJsonPath('data.support_tier', 'enterprise')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.internal_notes', 'Escalate renewal questions to account owner.')
            ->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/customers/{$customer['id']}", [
            'job_title' => 'Support Director',
            'support_tier' => 'strategic',
            'status' => 'onboarding',
            'internal_notes' => 'Needs weekly check-in during onboarding.',
        ])->assertOk()
            ->assertJsonPath('data.job_title', 'Support Director')
            ->assertJsonPath('data.support_tier', 'strategic')
            ->assertJsonPath('data.status', 'onboarding')
            ->assertJsonPath('data.internal_notes', 'Needs weekly check-in during onboarding.');

        $this->assertDatabaseHas('customers', [
            'id' => $customer['id'],
            'job_title' => 'Support Director',
            'support_tier' => 'strategic',
            'status' => 'onboarding',
        ]);
    }

    public function test_enriched_customer_profile_validation_rejects_invalid_values(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme',
            'slug' => 'acme',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'website' => 'not-a-url',
            'timezone' => 'Mars/Base',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['website', 'timezone']);
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
