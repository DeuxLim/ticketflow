<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_users_for_each_workspace_role(): void
    {
        $this->seed(DatabaseSeeder::class);

        $workspaceId = DB::table('workspaces')
            ->where('slug', 'demo-workspace')
            ->value('id');

        $roleEmails = [
            'admin' => 'admin@ticketing.local',
            'agent' => 'member@ticketing.local',
            'viewer' => 'viewer@ticketing.local',
        ];

        foreach ($roleEmails as $roleSlug => $email) {
            $roleId = DB::table('workspace_roles')
                ->where('workspace_id', $workspaceId)
                ->where('slug', $roleSlug)
                ->value('id');

            $this->assertNotNull($roleId);

            if ($email) {
                $userId = User::query()->where('email', $email)->value('id');
                $membershipId = DB::table('workspace_memberships')
                    ->where('workspace_id', $workspaceId)
                    ->where('user_id', $userId)
                    ->value('id');

                $this->assertDatabaseHas('workspace_membership_roles', [
                    'workspace_membership_id' => $membershipId,
                    'workspace_role_id' => $roleId,
                ]);
            }
        }
    }

    public function test_database_seeder_creates_demo_tickets_for_full_lifecycle(): void
    {
        $this->seed(DatabaseSeeder::class);

        $workspaceId = DB::table('workspaces')
            ->where('slug', 'demo-workspace')
            ->value('id');

        foreach (['open', 'in_progress', 'pending', 'resolved', 'closed'] as $status) {
            $this->assertDatabaseHas('tickets', [
                'workspace_id' => $workspaceId,
                'status' => $status,
            ]);
        }

        $this->assertDatabaseHas('tickets', [
            'workspace_id' => $workspaceId,
            'assigned_to_user_id' => null,
        ]);
        $this->assertDatabaseHas('ticket_comments', [
            'workspace_id' => $workspaceId,
        ]);
        $this->assertDatabaseHas('activity_logs', [
            'workspace_id' => $workspaceId,
            'action' => 'ticket.status_changed',
        ]);
    }
}
