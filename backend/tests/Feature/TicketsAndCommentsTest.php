<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketsAndCommentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_update_and_comment_on_ticket_with_activity_logs(): void
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
        ])->json('data');

        $agentRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'agent')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'agent@example.com',
            'role_ids' => [$agentRoleId],
        ])->json('data');

        $agent = User::factory()->create(['email' => 'agent@example.com']);
        Sanctum::actingAs($agent);
        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        Sanctum::actingAs($owner);

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Cannot login',
            'description' => 'Customer cannot log in to dashboard.',
            'priority' => 'high',
            'assigned_to_user_id' => $agent->id,
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}", [
            'status' => 'in_progress',
            'priority' => 'urgent',
        ])->assertOk();

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments", [
            'body' => 'Investigating this now.',
            'is_internal' => true,
        ])->assertCreated();

        $this->getJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/activity")
            ->assertOk()
            ->assertJsonPath('meta.total', 5);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket['id'],
            'status' => 'in_progress',
            'priority' => 'urgent',
            'assigned_to_user_id' => $agent->id,
        ]);

        $this->assertDatabaseHas('ticket_comments', [
            'ticket_id' => $ticket['id'],
            'is_internal' => true,
        ]);
    }

    public function test_member_without_manage_permission_cannot_create_ticket(): void
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
        ])->json('data');

        $viewerRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'viewer')
            ->value('id');

        $invite = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'member@example.com',
            'role_ids' => [$viewerRoleId],
        ])->json('data');

        $member = User::factory()->create(['email' => 'member@example.com']);
        Sanctum::actingAs($member);
        $this->postJson('/api/invitations/accept', ['token' => $invite['token']])->assertOk();

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Should fail',
            'description' => 'No permission',
            'priority' => 'low',
        ])->assertForbidden();
    }

    public function test_reassigning_ticket_records_assignment_activity(): void
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
        ])->json('data');

        $firstAgent = User::factory()->create();
        $secondAgent = User::factory()->create();

        foreach ([$firstAgent, $secondAgent] as $agent) {
            \DB::table('workspace_memberships')->insert([
                'workspace_id' => $workspace['id'],
                'user_id' => $agent->id,
                'joined_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Assignment check',
            'description' => 'Confirm reassignment logging.',
            'priority' => 'medium',
            'assigned_to_user_id' => $firstAgent->id,
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}", [
            'assigned_to_user_id' => $secondAgent->id,
        ])->assertOk()
            ->assertJsonPath('data.assigned_to_user_id', $secondAgent->id);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket['id'],
            'assigned_to_user_id' => $secondAgent->id,
        ]);

        $meta = \DB::table('activity_logs')
            ->where('workspace_id', $workspace['id'])
            ->where('action', 'ticket.assignee_changed')
            ->latest('id')
            ->value('meta');

        $this->assertSame([
            'from' => $firstAgent->id,
            'to' => $secondAgent->id,
        ], json_decode((string) $meta, true));

        $this->assertDatabaseHas('workspace_notifications', [
            'workspace_id' => $workspace['id'],
            'user_id' => $secondAgent->id,
            'ticket_id' => $ticket['id'],
            'type' => 'ticket.assigned',
            'read_at' => null,
        ]);
    }

    public function test_user_can_list_and_read_workspace_notifications(): void
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
        ])->json('data');

        $agent = User::factory()->create();
        \DB::table('workspace_memberships')->insert([
            'workspace_id' => $workspace['id'],
            'user_id' => $agent->id,
            'joined_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Notification check',
            'description' => 'Confirm unread state.',
            'priority' => 'medium',
            'assigned_to_user_id' => $agent->id,
        ])->assertCreated()->json('data');

        Sanctum::actingAs($agent);
        $notification = $this->getJson("/api/workspaces/{$workspace['slug']}/notifications")
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonPath('data.0.ticket_id', $ticket['id'])
            ->json('data.0');

        $this->postJson("/api/workspaces/{$workspace['slug']}/notifications/{$notification['id']}/read")
            ->assertOk()
            ->assertJsonPath('data.read_at', fn ($value) => $value !== null);

        $this->getJson("/api/workspaces/{$workspace['slug']}/notifications")
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 0);
    }

    public function test_ticket_creation_rejects_customer_from_other_workspace(): void
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
            'name' => 'Tenant A Customer',
            'email' => 'tenant-a@example.com',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspaceB['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Cross tenant',
            'description' => 'Must fail',
            'priority' => 'medium',
        ])->assertUnprocessable();
    }

    public function test_author_can_update_and_delete_public_comment_but_other_member_cannot(): void
    {
        Storage::fake('local');

        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Acme',
            'slug' => 'acme',
        ])->json('data');

        $customer = $this->postJson("/api/workspaces/{$workspace['slug']}/customers", [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ])->json('data');

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Need help',
            'description' => 'Support request',
            'priority' => 'medium',
        ])->json('data');

        $agentRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'agent')
            ->value('id');
        $viewerRoleId = \DB::table('workspace_roles')
            ->where('workspace_id', $workspace['id'])
            ->where('slug', 'viewer')
            ->value('id');

        $inviteA = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'author@example.com',
            'role_ids' => [$agentRoleId],
        ])->json('data');

        $inviteB = $this->postJson("/api/workspaces/{$workspace['slug']}/invitations", [
            'email' => 'other@example.com',
            'role_ids' => [$viewerRoleId],
        ])->json('data');

        $author = User::factory()->create(['email' => 'author@example.com']);
        Sanctum::actingAs($author);
        $this->postJson('/api/invitations/accept', ['token' => $inviteA['token']])->assertOk();

        $other = User::factory()->create(['email' => 'other@example.com']);
        Sanctum::actingAs($other);
        $this->postJson('/api/invitations/accept', ['token' => $inviteB['token']])->assertOk();

        Sanctum::actingAs($author);
        $comment = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments", [
            'body' => 'Initial note',
            'is_internal' => false,
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments/{$comment['id']}", [
            'body' => 'Updated by author',
        ])->assertOk()->assertJsonPath('data.body', 'Updated by author');

        $this->post(
            "/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/attachments",
            [
                'file' => UploadedFile::fake()->create('comment-note.txt', 2, 'text/plain'),
                'comment_id' => $comment['id'],
            ],
            ['Accept' => 'application/json']
        )->assertCreated();

        Sanctum::actingAs($other);
        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments/{$comment['id']}", [
            'body' => 'Edited by other',
        ])->assertForbidden();

        Sanctum::actingAs($author);
        $this->deleteJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments/{$comment['id']}")
            ->assertOk();

        $this->assertDatabaseMissing('ticket_comments', [
            'id' => $comment['id'],
        ]);

        $this->assertDatabaseMissing('ticket_attachments', [
            'comment_id' => $comment['id'],
        ]);
    }
}
