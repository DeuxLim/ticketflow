<?php

namespace App\Actions\Workspaces;

use App\Models\BusinessCalendar;
use App\Models\SlaPolicy;
use App\Models\TenantSecurityPolicy;
use App\Models\TicketCategory;
use App\Models\TicketFormTemplate;
use App\Models\TicketQueue;
use App\Models\TicketTag;
use App\Models\TicketType;
use App\Models\TicketWorkflow;
use App\Models\User;
use App\Models\WorkflowTransition;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Models\WorkspacePermission;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

class CreateWorkspaceAction
{
    private const DEFAULT_PERMISSIONS = [
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

    public function execute(User $owner, string $name, string $slug): Workspace
    {
        return DB::transaction(function () use ($owner, $name, $slug): Workspace {
            $workspace = Workspace::query()->create([
                'name' => $name,
                'slug' => $slug,
                'owner_user_id' => $owner->id,
            ]);

            $permissions = collect(self::DEFAULT_PERMISSIONS)->map(function (array $permission) {
                return WorkspacePermission::query()->firstOrCreate(
                    ['slug' => $permission['slug']],
                    [
                        'name' => $permission['name'],
                        'description' => null,
                    ]
                );
            });

            $ownerRole = $workspace->roles()->create([
                'name' => 'Owner',
                'slug' => 'owner',
                'description' => 'Workspace owner with full access',
                'is_system' => true,
            ]);

            $adminRole = $workspace->roles()->create([
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Workspace admin with broad access',
                'is_system' => true,
            ]);

            $memberRole = $workspace->roles()->create([
                'name' => 'Member',
                'slug' => 'member',
                'description' => 'Standard member access',
                'is_system' => true,
            ]);

            $ownerRole->permissions()->sync($permissions->pluck('id')->all());
            $adminRole->permissions()->sync($permissions->where('slug', '!=', 'workspace.manage')->pluck('id')->all());
            $memberRole->permissions()->sync(
                $permissions->whereIn('slug', ['customers.view', 'tickets.view', 'tickets.comment'])->pluck('id')->all()
            );

            TenantSecurityPolicy::query()->create([
                'workspace_id' => $workspace->id,
                'require_sso' => false,
                'require_mfa' => false,
                'session_ttl_minutes' => 720,
                'ip_allowlist' => null,
            ]);

            $calendar = BusinessCalendar::query()->create([
                'workspace_id' => $workspace->id,
                'name' => 'Default Business Hours',
                'timezone' => 'UTC',
                'working_days' => '1,2,3,4,5',
                'start_time' => '09:00',
                'end_time' => '18:00',
                'is_default' => true,
            ]);

            SlaPolicy::query()->create([
                'workspace_id' => $workspace->id,
                'business_calendar_id' => $calendar->id,
                'name' => 'Default SLA',
                'priority' => null,
                'first_response_minutes' => 60,
                'resolution_minutes' => 480,
                'is_active' => true,
            ]);

            $workspace->setting()->create([
                'timezone' => 'UTC',
                'branding_json' => [],
                'business_profile_json' => [],
                'ticket_number_format' => 'TKT-{seq:6}',
                'assignment_strategy' => 'manual',
                'ticketing_json' => [
                    'statuses' => ['open', 'in_progress', 'resolved', 'closed'],
                    'priorities' => ['low', 'medium', 'high', 'urgent'],
                ],
            ]);

            TicketQueue::query()->create([
                'workspace_id' => $workspace->id,
                'key' => 'general',
                'name' => 'General Support',
                'description' => 'Default queue for incoming support requests.',
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 0,
            ]);

            TicketCategory::query()->create([
                'workspace_id' => $workspace->id,
                'key' => 'general',
                'name' => 'General',
                'description' => 'Default category for uncategorized tickets.',
                'is_active' => true,
                'sort_order' => 0,
            ]);

            TicketTag::query()->create([
                'workspace_id' => $workspace->id,
                'name' => 'needs-triage',
                'color' => 'slate',
                'description' => 'Default tag for tickets that need review.',
                'is_active' => true,
            ]);

            $ticketType = TicketType::query()->create([
                'workspace_id' => $workspace->id,
                'key' => 'incident',
                'name' => 'Incident',
                'description' => 'Default type for user-impacting issues.',
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 0,
            ]);

            TicketFormTemplate::query()->create([
                'workspace_id' => $workspace->id,
                'ticket_type_id' => $ticketType->id,
                'name' => 'Default Incident Form',
                'field_schema_json' => [
                    ['key' => 'title', 'label' => 'Title', 'field_type' => 'text', 'required' => true],
                    ['key' => 'description', 'label' => 'Description', 'field_type' => 'textarea', 'required' => true],
                    ['key' => 'priority', 'label' => 'Priority', 'field_type' => 'select', 'required' => true],
                ],
                'visibility_rules_json' => [],
                'required_rules_json' => [],
                'is_default' => true,
                'is_active' => true,
            ]);

            $workflow = TicketWorkflow::query()->create([
                'workspace_id' => $workspace->id,
                'name' => 'Default Workflow',
                'is_default' => true,
                'is_active' => true,
            ]);

            foreach ([['open', 'in_progress'], ['in_progress', 'resolved'], ['resolved', 'closed']] as [$from, $to]) {
                WorkflowTransition::query()->create([
                    'ticket_workflow_id' => $workflow->id,
                    'from_status' => $from,
                    'to_status' => $to,
                    'required_permission' => 'tickets.manage',
                    'requires_approval' => false,
                ]);
            }

            $membership = WorkspaceMembership::query()->create([
                'workspace_id' => $workspace->id,
                'user_id' => $owner->id,
                'joined_at' => now(),
            ]);

            $membership->roles()->sync([$ownerRole->id]);

            ActivityLogger::log($workspace->id, $owner->id, 'workspace.created', $workspace);

            return $workspace;
        });
    }
}
