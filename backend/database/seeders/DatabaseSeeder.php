<?php

namespace Database\Seeders;

use App\Actions\Workspaces\CreateWorkspaceAction;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Models\WorkspacePermission;
use App\Models\WorkspaceRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $platformAdmin = User::query()->updateOrCreate(
            ['email' => 'admin@ticketing.local'],
            [
                'first_name' => 'Platform',
                'last_name' => 'Admin',
                'username' => 'platformadmin',
                'password' => Hash::make('Admin@12345'),
                'is_platform_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        $demoUser = User::query()->updateOrCreate(
            ['email' => 'user@ticketing.local'],
            [
                'first_name' => 'Demo',
                'last_name' => 'User',
                'username' => 'demouser',
                'password' => Hash::make('User@12345'),
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        $memberUser = User::query()->updateOrCreate(
            ['email' => 'member@ticketing.local'],
            [
                'first_name' => 'Demo',
                'last_name' => 'Member',
                'username' => 'demomember',
                'password' => Hash::make('Member@12345'),
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            WorkspacePermissionSeeder::class,
        ]);

        $workspace = Workspace::query()->where('slug', 'demo-workspace')->first();

        if (! $workspace) {
            $workspace = app(CreateWorkspaceAction::class)->execute(
                owner: $demoUser,
                name: 'Demo Workspace',
                slug: 'demo-workspace'
            );
        }

        $ownerPermissionIds = WorkspacePermission::query()->pluck('id')->all();
        $adminPermissionIds = WorkspacePermission::query()
            ->where('slug', '!=', 'workspace.manage')
            ->pluck('id')
            ->all();
        $memberPermissionIds = WorkspacePermission::query()
            ->whereIn('slug', ['customers.view', 'tickets.view', 'tickets.comment'])
            ->pluck('id')
            ->all();

        $ownerRole = WorkspaceRole::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'slug' => 'owner'],
            [
                'name' => 'Owner',
                'description' => 'Workspace owner with full access',
                'is_system' => true,
            ]
        );
        $adminRole = WorkspaceRole::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'slug' => 'admin'],
            [
                'name' => 'Admin',
                'description' => 'Workspace admin with broad access',
                'is_system' => true,
            ]
        );
        $memberRole = WorkspaceRole::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'slug' => 'member'],
            [
                'name' => 'Member',
                'description' => 'Standard member access',
                'is_system' => true,
            ]
        );

        $ownerRole->permissions()->sync($ownerPermissionIds);
        $adminRole->permissions()->sync($adminPermissionIds);
        $memberRole->permissions()->sync($memberPermissionIds);

        $demoMembership = WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $demoUser->id],
            ['joined_at' => now()]
        );
        $demoMembership->roles()->syncWithoutDetaching([$ownerRole->id]);

        $adminMembership = WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $platformAdmin->id],
            ['joined_at' => now()]
        );
        $adminMembership->roles()->syncWithoutDetaching([$adminRole->id]);

        $memberMembership = WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $memberUser->id],
            ['joined_at' => now()]
        );
        $memberMembership->roles()->syncWithoutDetaching([$memberRole->id]);
    }
}
