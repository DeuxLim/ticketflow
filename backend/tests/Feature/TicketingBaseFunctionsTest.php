<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketingBaseFunctionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_list_is_paginated_with_meta(): void
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

        for ($i = 1; $i <= 18; $i++) {
            $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
                'customer_id' => $customer['id'],
                'title' => "Issue {$i}",
                'description' => 'Needs support',
                'priority' => 'medium',
            ])->assertCreated();
        }

        $this->getJson("/api/workspaces/{$workspace['slug']}/tickets")
            ->assertOk()
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.total', 18);
    }

    public function test_owner_can_bulk_update_tickets(): void
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

        $ticketA = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Issue A',
            'description' => 'Needs support',
            'priority' => 'low',
        ])->json('data');

        $ticketB = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Issue B',
            'description' => 'Needs support',
            'priority' => 'low',
        ])->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/bulk", [
            'ticket_ids' => [$ticketA['id'], $ticketB['id']],
            'status' => 'in_progress',
            'priority' => 'high',
        ])->assertOk()->assertJsonPath('meta.updated_count', 2);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticketA['id'],
            'status' => 'in_progress',
            'priority' => 'high',
        ]);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticketB['id'],
            'status' => 'in_progress',
            'priority' => 'high',
        ]);
    }

    public function test_owner_can_delete_ticket(): void
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

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Issue A',
            'description' => 'Needs support',
            'priority' => 'low',
        ])->json('data');

        $this->deleteJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}")
            ->assertOk();

        $this->assertDatabaseMissing('tickets', [
            'id' => $ticket['id'],
        ]);
    }

    public function test_ticket_details_fields_and_comment_author_are_returned(): void
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

        $ticket = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets", [
            'customer_id' => $customer['id'],
            'title' => 'Issue A',
            'description' => 'Needs support',
            'priority' => 'low',
            'queue_key' => 'ops',
            'category' => 'incident',
            'tags' => ['vpn', 'network'],
        ])->assertCreated()->json('data');

        $this->patchJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}", [
            'category' => 'problem',
            'queue_key' => 'p1',
            'tags' => ['vpn', 'critical'],
        ])->assertOk()
            ->assertJsonPath('data.category', 'problem')
            ->assertJsonPath('data.queue_key', 'p1')
            ->assertJsonPath('data.tags.0', 'vpn')
            ->assertJsonPath('data.tags.1', 'critical');

        $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments", [
            'body' => 'Working on this now.',
            'is_internal' => false,
        ])->assertCreated();

        $this->getJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments")
            ->assertOk()
            ->assertJsonPath('data.0.user.email', $owner->email);
    }

    public function test_ticket_attachment_can_be_uploaded_listed_and_downloaded(): void
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
            'title' => 'Issue A',
            'description' => 'Needs support',
            'priority' => 'low',
        ])->json('data');

        $upload = $this->post(
            "/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/attachments",
            [
                'file' => UploadedFile::fake()->create('diagnostic.log', 20, 'text/plain'),
            ],
            [
                'Accept' => 'application/json',
            ]
        );

        $upload->assertCreated()->assertJsonPath('data.original_name', 'diagnostic.log');
        $attachmentId = $upload->json('data.id');

        $this->getJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/attachments")
            ->assertOk()
            ->assertJsonPath('data.0.id', $attachmentId);

        $this->get("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/attachments/{$attachmentId}/download")
            ->assertOk();
    }

    public function test_attachment_can_be_linked_to_comment(): void
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
            'title' => 'Issue A',
            'description' => 'Needs support',
            'priority' => 'low',
        ])->json('data');

        $comment = $this->postJson("/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/comments", [
            'body' => 'Has evidence',
            'is_internal' => false,
        ])->json('data');

        $this->post(
            "/api/workspaces/{$workspace['slug']}/tickets/{$ticket['id']}/attachments",
            [
                'file' => UploadedFile::fake()->create('evidence.txt', 4, 'text/plain'),
                'comment_id' => $comment['id'],
            ],
            ['Accept' => 'application/json']
        )->assertCreated()->assertJsonPath('data.comment_id', $comment['id']);

        $this->assertDatabaseHas('ticket_attachments', [
            'ticket_id' => $ticket['id'],
            'comment_id' => $comment['id'],
        ]);
    }
}
