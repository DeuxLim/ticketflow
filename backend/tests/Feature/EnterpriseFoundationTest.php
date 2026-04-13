<?php

namespace Tests\Feature;

use App\Models\IntegrationEvent;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WebhookDelivery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EnterpriseFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_sso_policy_can_block_local_login_for_workspace_context(): void
    {
        $owner = User::factory()->create(['password' => 'password']);
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/identity-providers", [
            'provider_type' => 'saml',
            'name' => 'Okta',
            'issuer' => 'https://acme.okta.com',
            'sso_url' => 'https://acme.okta.com/app/sso',
        ])->assertCreated();

        $this->patchJson("/api/workspaces/{$workspace['slug']}/security-policy", [
            'require_sso' => true,
        ])->assertOk();

        $this->postJson('/api/auth/login', [
            'email' => $owner->email,
            'password' => 'password',
            'workspace_slug' => $workspace['slug'],
        ])->assertForbidden();
    }

    public function test_scim_provisioning_directory_can_create_and_deactivate_user(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $directory = $this->postJson("/api/workspaces/{$workspace['slug']}/provisioning-directories", [
            'name' => 'Azure AD',
        ])->assertCreated()->json();

        $token = $directory['meta']['token'];

        $this->withToken($token)->postJson('/api/scim/v2/Users', [
            'userName' => 'scim.user@example.com',
            'name' => ['givenName' => 'Scim', 'familyName' => 'User'],
            'active' => true,
            'externalId' => 'ext-123',
        ])->assertCreated();

        $this->withToken($token)->patchJson('/api/scim/v2/Users/ext-123', [
            'Operations' => [
                ['op' => 'Replace', 'value' => ['active' => false]],
            ],
        ])->assertOk()->assertJsonPath('active', false);

        $this->assertDatabaseHas('provisioned_directory_users', [
            'external_id' => 'ext-123',
            'active' => false,
        ]);
    }

    public function test_ticket_lifecycle_applies_sla_writes_audit_and_supports_workflow_transition(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Cannot access VPN',
            'description' => 'User cannot connect to VPN.',
            'priority' => 'high',
        ])->assertCreated()->json('data');

        $this->assertNotNull($ticket['first_response_due_at']);
        $this->assertNotNull($ticket['resolution_due_at']);

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments", [
            'body' => 'We are investigating this issue.',
            'is_internal' => false,
        ])->assertCreated();

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/transition", [
            'to_status' => 'in_progress',
        ])->assertOk()->assertJsonPath('data.status', 'in_progress');

        $freshTicket = Ticket::query()->findOrFail($ticket['id']);
        $this->assertNotNull($freshTicket->first_responded_at);
        $this->assertSame('in_progress', $freshTicket->status);

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace['id'],
            'action' => 'ticket.created',
        ]);
    }

    public function test_webhook_delivery_retry_signs_payload_and_marks_delivery_success(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $secret = 'supersecret123';

        $this->postJson("/api/workspaces/{$workspace['slug']}/webhooks", [
            'name' => 'Events',
            'url' => 'https://example.test/webhooks',
            'secret' => $secret,
            'events' => ['ticket.created'],
        ])->assertCreated();

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Webhook test',
            'description' => 'Testing signed deliveries',
            'priority' => 'high',
        ])->assertCreated();

        $delivery = WebhookDelivery::query()->firstOrFail();
        $event = IntegrationEvent::query()->findOrFail($delivery->integration_event_id);
        $expectedSignature = hash_hmac('sha256', $event->payload_json, $secret);

        Http::fake(function (HttpRequest $request) use ($expectedSignature) {
            $this->assertSame($expectedSignature, $request->header('X-Ticketing-Signature')[0] ?? null);
            return Http::response(['ok' => true], 200);
        });

        $this->postJson("/api/workspaces/{$workspace['slug']}/webhook-deliveries/{$delivery->id}/retry")
            ->assertOk();

        $this->assertDatabaseHas('webhook_deliveries', [
            'id' => $delivery->id,
            'status' => 'delivered',
            'response_status' => 200,
        ]);
    }

    public function test_ip_allowlist_policy_blocks_workspace_requests_from_non_allowlisted_ip(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/security-policy", [
            'ip_allowlist' => ['10.10.10.10'],
        ])->assertOk();

        $this->getJson("/api/workspaces/{$workspace['slug']}/access")
            ->assertForbidden();
    }
}
