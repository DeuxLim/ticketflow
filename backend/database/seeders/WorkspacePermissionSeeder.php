<?php

namespace Database\Seeders;

use App\Models\WorkspacePermission;
use Illuminate\Database\Seeder;

class WorkspacePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'Manage Workspace', 'slug' => 'workspace.manage'],
            ['name' => 'Manage Members', 'slug' => 'members.manage'],
            ['name' => 'Manage Invitations', 'slug' => 'invitations.manage'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage'],
            ['name' => 'View Customers', 'slug' => 'customers.view'],
            ['name' => 'Manage Customers', 'slug' => 'customers.manage'],
            ['name' => 'View Tickets', 'slug' => 'tickets.view'],
            ['name' => 'Manage Tickets', 'slug' => 'tickets.manage'],
            ['name' => 'Comment Tickets', 'slug' => 'tickets.comment'],
            ['name' => 'View Reporting', 'slug' => 'reporting.view'],
            ['name' => 'Manage Automation', 'slug' => 'automation.manage'],
            ['name' => 'Manage Security', 'slug' => 'security.manage'],
            ['name' => 'Manage Integrations', 'slug' => 'integrations.manage'],
        ];

        foreach ($permissions as $permission) {
            WorkspacePermission::query()->firstOrCreate(
                ['slug' => $permission['slug']],
                [
                    'name' => $permission['name'],
                    'description' => null,
                ]
            );
        }
    }
}
