<?php

namespace Database\Seeders;

use App\Actions\Workspaces\CreateWorkspaceAction;
use App\Models\Customer;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Models\WorkspacePermission;
use App\Models\WorkspaceRole;
use App\Support\ActivityLogger;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
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

        $agentUser = User::query()->updateOrCreate(
            ['email' => 'member@ticketing.local'],
            [
                'first_name' => 'Demo',
                'last_name' => 'Agent',
                'username' => 'demoagent',
                'password' => Hash::make('Member@12345'),
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        $viewerUser = User::query()->updateOrCreate(
            ['email' => 'viewer@ticketing.local'],
            [
                'first_name' => 'Demo',
                'last_name' => 'Viewer',
                'username' => 'demoviewer',
                'password' => Hash::make('Viewer@12345'),
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

        $adminPermissionIds = WorkspacePermission::query()->pluck('id')->all();
        $agentPermissionIds = WorkspacePermission::query()
            ->whereIn('slug', ['customers.view', 'customers.manage', 'tickets.view', 'tickets.manage', 'tickets.comment', 'reporting.view'])
            ->pluck('id')
            ->all();
        $viewerPermissionIds = WorkspacePermission::query()
            ->whereIn('slug', ['customers.view', 'tickets.view', 'reporting.view'])
            ->pluck('id')
            ->all();

        $adminRole = WorkspaceRole::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'slug' => 'admin'],
            [
                'name' => 'Admin',
                'description' => 'Workspace admin with full access',
                'is_system' => true,
            ]
        );
        $agentRole = WorkspaceRole::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'slug' => 'agent'],
            [
                'name' => 'Agent',
                'description' => 'Support agent who can manage customers and tickets',
                'is_system' => true,
            ]
        );
        $viewerRole = WorkspaceRole::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'slug' => 'viewer'],
            [
                'name' => 'Viewer',
                'description' => 'Read-only support workspace access',
                'is_system' => true,
            ]
        );
        WorkspaceRole::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('slug', ['owner', 'member'])
            ->delete();

        $adminRole->permissions()->sync($adminPermissionIds);
        $agentRole->permissions()->sync($agentPermissionIds);
        $viewerRole->permissions()->sync($viewerPermissionIds);

        $demoMembership = WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $demoUser->id],
            ['joined_at' => now()]
        );
        $demoMembership->roles()->sync([$adminRole->id]);

        $adminMembership = WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $platformAdmin->id],
            ['joined_at' => now()]
        );
        $adminMembership->roles()->sync([$adminRole->id]);

        $agentMembership = WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $agentUser->id],
            ['joined_at' => now()]
        );
        $agentMembership->roles()->sync([$agentRole->id]);

        $viewerMembership = WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $viewerUser->id],
            ['joined_at' => now()]
        );
        $viewerMembership->roles()->sync([$viewerRole->id]);

        $customers = [
            'northwind' => Customer::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'email' => 'it@northwind.test'],
                [
                    'name' => 'Northwind IT',
                    'phone' => '+1 555 0101',
                    'company' => 'Northwind',
                    'job_title' => 'IT Helpdesk',
                    'support_tier' => 'business',
                    'status' => 'active',
                    'preferred_contact_method' => 'email',
                    'timezone' => 'America/New_York',
                    'internal_notes' => 'Priority customer for network incidents.',
                ]
            ),
            'contoso' => Customer::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'email' => 'ops@contoso.test'],
                [
                    'name' => 'Contoso Operations',
                    'phone' => '+1 555 0102',
                    'company' => 'Contoso',
                    'job_title' => 'Operations Desk',
                    'support_tier' => 'standard',
                    'status' => 'active',
                    'preferred_contact_method' => 'phone',
                    'timezone' => 'America/Chicago',
                    'internal_notes' => 'Prefers phone follow-up for outages.',
                ]
            ),
        ];

        $demoTickets = [
            [
                'ticket_number' => 'TKT-000001',
                'customer' => 'northwind',
                'title' => 'VPN access request',
                'description' => 'New analyst needs VPN access for the Manila support queue.',
                'status' => 'open',
                'priority' => 'medium',
                'assigned_to_user_id' => null,
                'category' => 'access',
                'queue_key' => 'general',
                'tags' => 'vpn,access',
            ],
            [
                'ticket_number' => 'TKT-000002',
                'customer' => 'northwind',
                'title' => 'Branch router outage',
                'description' => 'North branch router is offline and users cannot reach internal tools.',
                'status' => 'in_progress',
                'priority' => 'urgent',
                'assigned_to_user_id' => $agentUser->id,
                'category' => 'network',
                'queue_key' => 'general',
                'tags' => 'network,urgent',
            ],
            [
                'ticket_number' => 'TKT-000003',
                'customer' => 'contoso',
                'title' => 'Waiting for asset approval',
                'description' => 'Laptop replacement is ready but needs manager approval before purchase.',
                'status' => 'pending',
                'priority' => 'high',
                'assigned_to_user_id' => $agentUser->id,
                'category' => 'hardware',
                'queue_key' => 'general',
                'tags' => 'hardware,pending',
            ],
            [
                'ticket_number' => 'TKT-000004',
                'customer' => 'contoso',
                'title' => 'Printer driver fixed',
                'description' => 'Finance printer driver was reinstalled and confirmed working.',
                'status' => 'resolved',
                'priority' => 'low',
                'assigned_to_user_id' => $agentUser->id,
                'category' => 'hardware',
                'queue_key' => 'general',
                'tags' => 'printer',
            ],
            [
                'ticket_number' => 'TKT-000005',
                'customer' => 'northwind',
                'title' => 'Mailbox archive completed',
                'description' => 'Archive mailbox export finished and was accepted by the requester.',
                'status' => 'closed',
                'priority' => 'medium',
                'assigned_to_user_id' => null,
                'category' => 'email',
                'queue_key' => 'general',
                'tags' => 'email,archive',
            ],
        ];

        $demoTicketNumbers = collect($demoTickets)->pluck('ticket_number')->all();
        $existingDemoTicketIds = Ticket::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('ticket_number', $demoTicketNumbers)
            ->pluck('id');

        TicketComment::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('ticket_id', $existingDemoTicketIds)
            ->delete();
        DB::table('activity_logs')
            ->where('workspace_id', $workspace->id)
            ->delete();

        foreach ($demoTickets as $ticketData) {
            $ticket = Ticket::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'ticket_number' => $ticketData['ticket_number']],
                [
                    'customer_id' => $customers[$ticketData['customer']]->id,
                    'created_by_user_id' => $demoUser->id,
                    'assigned_to_user_id' => $ticketData['assigned_to_user_id'],
                    'title' => $ticketData['title'],
                    'description' => $ticketData['description'],
                    'status' => $ticketData['status'],
                    'priority' => $ticketData['priority'],
                    'category' => $ticketData['category'],
                    'queue_key' => $ticketData['queue_key'],
                    'tags' => $ticketData['tags'],
                ]
            );

            ActivityLogger::log($workspace->id, $demoUser->id, 'ticket.created', $ticket);

            if ($ticket->assigned_to_user_id !== null) {
                ActivityLogger::log($workspace->id, $demoUser->id, 'ticket.assignee_changed', $ticket, [
                    'from' => null,
                    'to' => $ticket->assigned_to_user_id,
                ]);
            }

            if ($ticket->status !== 'open') {
                ActivityLogger::log($workspace->id, $agentUser->id, 'ticket.status_changed', $ticket, [
                    'from' => 'open',
                    'to' => $ticket->status,
                ]);
            }

            TicketComment::query()->updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'ticket_id' => $ticket->id,
                    'body' => 'Demo note: this ticket shows the '.$ticket->status.' lifecycle state.',
                ],
                [
                    'user_id' => $ticket->assigned_to_user_id ?? $demoUser->id,
                    'customer_id' => null,
                    'is_internal' => false,
                ]
            );
        }
    }
}
