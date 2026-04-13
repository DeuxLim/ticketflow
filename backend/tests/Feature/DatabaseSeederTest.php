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
            'owner' => 'user@ticketing.local',
            'admin' => 'admin@ticketing.local',
            'member' => 'member@ticketing.local',
        ];

        foreach ($roleEmails as $roleSlug => $email) {
            $userId = User::query()->where('email', $email)->value('id');
            $roleId = DB::table('workspace_roles')
                ->where('workspace_id', $workspaceId)
                ->where('slug', $roleSlug)
                ->value('id');
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
