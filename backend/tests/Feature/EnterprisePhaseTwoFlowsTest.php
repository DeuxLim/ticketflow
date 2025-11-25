<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EnterprisePhaseTwoFlowsTest extends TestCase
{
    use RefreshDatabase;

    public function test_automation_rule_is_applied_on_ticket_created_event(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Ops Hub',
            'slug' => 'ops-hub',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/automation-rules", [
            'name' => 'Urgent goes P1 queue',
            'event_type' => 'ticket.created',
            'conditions' => ['priority' => 'urgent'],
            'actions' => ['queue_key' => 'p1', 'category' => 'incident'],
            'is_active' => true,
        ])->assertCreated();

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Critical outage',
            'description' => 'Everything is down',
            'priority' => 'urgent',
        ])->assertCreated()->json('data');

        $this->assertSame('p1', $ticket['queue_key']);
        $this->assertSame('incident', $ticket['category']);
    }

    public function test_reporting_endpoint_returns_overview_metrics(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Ops Hub',
            'slug' => 'ops-hub',
        ])->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Issue A',
            'description' => 'A',
            'priority' => 'high',
        ])->assertCreated();

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Issue B',
            'description' => 'B',
            'priority' => 'low',
        ])->assertCreated();

        $response = $this->getJson("/api/workspaces/{$workspace['slug']}/reports/overview")
            ->assertOk()
            ->json('data');

        $this->assertSame(2, $response['totals']['tickets']);
        $this->assertArrayHasKey('agent_workload', $response);
        $this->assertArrayHasKey('backlog_by_priority', $response);
    }

    public function test_saved_views_can_be_created_and_listed(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Ops Hub',
            'slug' => 'ops-hub',
        ])->json('data');

        $view = $this->postJson("/api/workspaces/{$workspace['slug']}/saved-views", [
            'name' => 'Open P1',
            'filters' => ['status' => ['open', 'in_progress'], 'priority' => ['urgent']],
            'is_shared' => true,
        ])->assertCreated()->json('data');

        $list = $this->getJson("/api/workspaces/{$workspace['slug']}/saved-views")
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $list);
        $this->assertSame($view['id'], $list[0]['id']);
        $this->assertSame('Open P1', $list[0]['name']);
    }

    public function test_workflow_transition_simulation_reports_allowed_and_disallowed_paths(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Ops Hub',
            'slug' => 'ops-hub',
        ])->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Simulate workflow',
            'description' => 'Check transition simulation',
            'priority' => 'high',
        ])->assertCreated()->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/workflow/simulate", [
            'to_status' => 'in_progress',
        ])->assertOk()
            ->assertJsonPath('data.allowed', true)
            ->assertJsonPath('data.requires_approval', false);

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/workflow/simulate", [
            'to_status' => 'closed',
        ])->assertOk()
            ->assertJsonPath('data.allowed', false)
            ->assertJsonPath('data.reason', 'Transition is not defined in the active workflow.');
    }

    public function test_automation_rule_dry_run_returns_rule_decision_payload(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Ops Hub',
            'slug' => 'ops-hub',
        ])->json('data');

        $rule = $this->postJson("/api/workspaces/{$workspace['slug']}/automation-rules", [
            'name' => 'Escalate urgent',
            'event_type' => 'ticket.updated',
            'conditions' => ['priority' => 'urgent'],
            'actions' => ['status' => 'in_progress'],
            'is_active' => true,
        ])->assertCreated()->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Dry run target',
            'description' => 'Validate dry-run payload',
            'priority' => 'urgent',
        ])->assertCreated()->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/automation-rules/{$rule['id']}/test", [
            'ticket_id' => $ticket['id'],
        ])->assertOk()
            ->assertJsonPath('data.rule_id', $rule['id'])
            ->assertJsonPath('data.rule_name', 'Escalate urgent')
            ->assertJsonPath('data.matched', true)
            ->assertJsonPath('data.updates.status', 'in_progress');
    }
}
