<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketDetailsV2Test extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_detail_payload_includes_enterprise_v2_sections(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->createWorkspace('Ops Hub', 'ops-hub');
        $customer = $this->createCustomer($workspace['slug']);

        $field = $this->postJson("/api/workspaces/{$workspace['slug']}/ticket-custom-fields", [
            'key' => 'asset_tag',
            'label' => 'Asset Tag',
            'field_type' => 'text',
            'is_required' => false,
            'is_active' => true,
        ])->assertCreated()->json('data');

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'VPN outage',
            'description' => 'Users cannot connect to VPN.',
            'priority' => 'urgent',
            'custom_fields' => [
                'asset_tag' => 'VPN-443',
            ],
        ])->assertCreated()->json('data');

        $related = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Identity provider latency',
            'description' => 'SSO callbacks are slow.',
            'priority' => 'high',
        ])->assertCreated()->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/watchers", [
            'user_id' => $owner->id,
        ])->assertCreated();

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/related-tickets", [
            'related_ticket_id' => $related['id'],
            'relationship_type' => 'blocks',
        ])->assertCreated();

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/checklist-items", [
            'title' => 'Confirm tunnel capacity',
            'sort_order' => 1,
        ])->assertCreated();

        $response = $this->getJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}")
            ->assertOk()
            ->json('data');

        $this->assertSame('VPN-443', $response['custom_fields'][0]['value']);
        $this->assertSame($field['id'], $response['custom_fields'][0]['field']['id']);
        $this->assertCount(1, $response['watchers']);
        $this->assertSame($owner->id, $response['watchers'][0]['user']['id']);
        $this->assertCount(1, $response['related_tickets']);
        $this->assertSame($related['id'], $response['related_tickets'][0]['ticket']['id']);
        $this->assertCount(1, $response['checklist_items']);
        $this->assertSame('Confirm tunnel capacity', $response['checklist_items'][0]['title']);
        $this->assertArrayHasKey('sla', $response['state_summary']);
        $this->assertArrayHasKey('approval', $response['state_summary']);
        $this->assertArrayHasKey('workflow', $response['state_summary']);
        $this->assertArrayHasKey('automation', $response['state_summary']);
        $this->assertSame('manual', $response['state_summary']['assignment']['strategy']);
    }

    public function test_member_can_self_follow_but_cannot_add_other_watchers(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->createWorkspace('Ops Hub', 'ops-hub');
        $customer = $this->createCustomer($workspace['slug']);
        $ticket = $this->createTicket($workspace['slug'], $customer['id']);

        $memberRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'member')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$memberRoleId],
        ])->json('data');

        $member = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($member);
        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/watchers")
            ->assertCreated()
            ->assertJsonPath('data.user_id', $member->id);

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/watchers", [
            'user_id' => $owner->id,
        ])->assertForbidden();
    }

    public function test_related_ticket_rejects_cross_workspace_links(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspaceA = $this->createWorkspace('Workspace A', 'workspace-a');
        $workspaceB = $this->createWorkspace('Workspace B', 'workspace-b');
        $customerA = $this->createCustomer($workspaceA['slug']);
        $customerB = $this->createCustomer($workspaceB['slug']);
        $ticketA = $this->createTicket($workspaceA['slug'], $customerA['id']);
        $ticketB = $this->createTicket($workspaceB['slug'], $customerB['id']);

        $this->postJson("/api/workspaces/{$workspaceA['slug']}/tickets/{$ticketA['id']}/related-tickets", [
            'related_ticket_id' => $ticketB['id'],
            'relationship_type' => 'related',
        ])->assertUnprocessable();
    }

    public function test_checklist_items_can_be_reordered_and_completed(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->createWorkspace('Ops Hub', 'ops-hub');
        $customer = $this->createCustomer($workspace['slug']);
        $ticket = $this->createTicket($workspace['slug'], $customer['id']);

        $first = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/checklist-items", [
            'title' => 'Collect logs',
            'sort_order' => 1,
        ])->assertCreated()->json('data');

        $second = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/checklist-items", [
            'title' => 'Restart service',
            'sort_order' => 2,
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/checklist-items/reorder", [
            'items' => [
                ['id' => $second['id'], 'sort_order' => 1],
                ['id' => $first['id'], 'sort_order' => 2],
            ],
        ])->assertOk();

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/checklist-items/{$second['id']}", [
            'is_completed' => true,
        ])->assertOk()->assertJsonPath('data.is_completed', true);

        $items = $this->getJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}")
            ->assertOk()
            ->json('data.checklist_items');

        $this->assertSame([$second['id'], $first['id']], array_column($items, 'id'));
        $this->assertTrue($items[0]['is_completed']);
    }

    private function createWorkspace(string $name, string $slug): array
    {
        return $this->postJson('/api/workspaces', [
            'name' => $name,
            'slug' => $slug,
        ])->assertCreated()->json('data');
    }

    private function createCustomer(string $workspaceSlug): array
    {
        return $this->postJson("/api/workspaces/{$workspaceSlug}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->assertCreated()->json('data');
    }

    private function createTicket(string $workspaceSlug, int $customerId): array
    {
        return $this->postJson("/api/workspaces/{$workspaceSlug}/tickets", [
            'customer_id' => $customerId,
            'title' => 'Service interruption',
            'description' => 'The service is unavailable.',
            'priority' => 'high',
        ])->assertCreated()->json('data');
    }
}
