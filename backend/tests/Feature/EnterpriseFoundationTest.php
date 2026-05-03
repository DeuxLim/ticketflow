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

    public function test_local_login_remains_available_for_workspace_context(): void
    {
        $owner = User::factory()->create(['password' => 'password']);
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $this->postJson('/api/auth/login', [
            'email' => $owner->email,
            'password' => 'password',
            'workspace_slug' => $workspace['slug'],
        ])->assertOk()
            ->assertJsonPath('data.user.email', $owner->email);
    }

    public function test_scim_and_sso_routes_are_removed_from_product_scope(): void
    {
        $this->postJson('/api/scim/v2/Users')->assertNotFound();
        $this->getJson('/api/auth/sso/oidc/callback')->assertNotFound();
        $this->postJson('/api/workspaces/acme/auth/sso/saml/acs')->assertNotFound();
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

    public function test_integrations_endpoints_return_contracts_used_by_settings_ui(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/webhooks", [
            'name' => 'Ticket Events',
            'url' => 'https://example.test/hooks',
            'secret' => 'supersecret123',
            'events' => ['ticket.created'],
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Ticket Events')
            ->assertJsonPath('data.events', 'ticket.created');

        $this->postJson("/api/workspaces/{$workspace['slug']}/webhooks", [
            'name' => '',
            'url' => 'invalid-url',
            'secret' => '123',
            'events' => [],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'url', 'secret', 'events']);

        $this->getJson("/api/workspaces/{$workspace['slug']}/webhooks")
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Ticket Events')
            ->assertJsonPath('data.0.is_active', true);

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Webhook Contract Test',
            'description' => 'Generate integration event and delivery.',
            'priority' => 'high',
        ])->assertCreated();

        $this->getJson("/api/workspaces/{$workspace['slug']}/webhook-deliveries")
            ->assertOk()
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.endpoint.name', 'Ticket Events')
            ->assertJsonPath('data.0.event.event_type', 'ticket.created');
    }

    public function test_security_governance_endpoints_return_contracts_used_by_settings_ui(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme Enterprise',
            'slug' => 'acme-enterprise',
        ])->json('data');

        $this->getJson("/api/workspaces/{$workspace['slug']}/security-policy")
            ->assertOk()
            ->assertJsonPath('data.require_mfa', false)
            ->assertJsonPath('data.session_ttl_minutes', 720)
            ->assertJsonPath('data.ip_allowlist', [])
            ->assertJsonPath('data.tenant_mode', 'shared')
            ->assertJsonPath('data.feature_flags', []);

        $this->postJson("/api/workspaces/{$workspace['slug']}/identity-providers")->assertNotFound();
        $this->postJson("/api/workspaces/{$workspace['slug']}/provisioning-directories")->assertNotFound();
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
