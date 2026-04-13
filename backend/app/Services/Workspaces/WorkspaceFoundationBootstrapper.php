<?php

namespace App\Services\Workspaces;

use App\Models\TicketCategory;
use App\Models\TicketFormTemplate;
use App\Models\TicketQueue;
use App\Models\TicketTag;
use App\Models\TicketType;
use App\Models\TicketWorkflow;
use App\Models\WorkflowTransition;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class WorkspaceFoundationBootstrapper
{
    public function ensureSettingsFoundation(Workspace $workspace): void
    {
        DB::transaction(function () use ($workspace): void {
            $setting = $workspace->setting()->firstOrCreate(
                ['workspace_id' => $workspace->id],
                [
                    'timezone' => 'UTC',
                    'branding_json' => [],
                    'business_profile_json' => [],
                    'ticket_number_format' => 'TKT-{seq:6}',
                    'assignment_strategy' => 'manual',
                    'ticketing_json' => [
                        'statuses' => ['open', 'in_progress', 'resolved', 'closed'],
                        'priorities' => ['low', 'medium', 'high', 'urgent'],
                    ],
                ]
            );

            if (! is_array($setting->ticketing_json) || $setting->ticketing_json === []) {
                $setting->ticketing_json = [
                    'statuses' => ['open', 'in_progress', 'resolved', 'closed'],
                    'priorities' => ['low', 'medium', 'high', 'urgent'],
                ];
                $setting->save();
            }

            if (! TicketQueue::query()->where('workspace_id', $workspace->id)->exists()) {
                TicketQueue::query()->create([
                    'workspace_id' => $workspace->id,
                    'key' => 'general',
                    'name' => 'General Support',
                    'description' => 'Default queue for incoming support requests.',
                    'is_default' => true,
                    'is_active' => true,
                    'sort_order' => 0,
                ]);
            } elseif (! TicketQueue::query()->where('workspace_id', $workspace->id)->where('is_default', true)->exists()) {
                TicketQueue::query()
                    ->where('workspace_id', $workspace->id)
                    ->orderBy('id')
                    ->limit(1)
                    ->update(['is_default' => true]);
            }

            if (! TicketCategory::query()->where('workspace_id', $workspace->id)->exists()) {
                TicketCategory::query()->create([
                    'workspace_id' => $workspace->id,
                    'key' => 'general',
                    'name' => 'General',
                    'description' => 'Default category for uncategorized tickets.',
                    'is_active' => true,
                    'sort_order' => 0,
                ]);
            }

            if (! TicketTag::query()->where('workspace_id', $workspace->id)->exists()) {
                TicketTag::query()->create([
                    'workspace_id' => $workspace->id,
                    'name' => 'needs-triage',
                    'color' => 'slate',
                    'description' => 'Default tag for tickets that need review.',
                    'is_active' => true,
                ]);
            }

            $defaultType = TicketType::query()
                ->where('workspace_id', $workspace->id)
                ->where('is_default', true)
                ->first();

            if (! $defaultType) {
                if (! TicketType::query()->where('workspace_id', $workspace->id)->exists()) {
                    $defaultType = TicketType::query()->create([
                        'workspace_id' => $workspace->id,
                        'key' => 'incident',
                        'name' => 'Incident',
                        'description' => 'Default type for user-impacting issues.',
                        'is_default' => true,
                        'is_active' => true,
                        'sort_order' => 0,
                    ]);
                } else {
                    TicketType::query()
                        ->where('workspace_id', $workspace->id)
                        ->orderBy('id')
                        ->limit(1)
                        ->update(['is_default' => true]);

                    $defaultType = TicketType::query()
                        ->where('workspace_id', $workspace->id)
                        ->where('is_default', true)
                        ->first();
                }
            }

            if ($defaultType && ! TicketFormTemplate::query()->where('workspace_id', $workspace->id)->exists()) {
                TicketFormTemplate::query()->create([
                    'workspace_id' => $workspace->id,
                    'ticket_type_id' => $defaultType->id,
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
            }

            $defaultWorkflow = TicketWorkflow::query()
                ->where('workspace_id', $workspace->id)
                ->where('is_default', true)
                ->first();

            if (! $defaultWorkflow) {
                if (! TicketWorkflow::query()->where('workspace_id', $workspace->id)->exists()) {
                    $defaultWorkflow = TicketWorkflow::query()->create([
                        'workspace_id' => $workspace->id,
                        'name' => 'Default Workflow',
                        'is_default' => true,
                        'is_active' => true,
                    ]);

                    foreach ([['open', 'in_progress'], ['in_progress', 'resolved'], ['resolved', 'closed']] as $i => [$from, $to]) {
                        WorkflowTransition::query()->create([
                            'ticket_workflow_id' => $defaultWorkflow->id,
                            'from_status' => $from,
                            'to_status' => $to,
                            'required_permission' => 'tickets.manage',
                            'requires_approval' => false,
                            'sort_order' => $i,
                        ]);
                    }
                } else {
                    TicketWorkflow::query()
                        ->where('workspace_id', $workspace->id)
                        ->orderBy('id')
                        ->limit(1)
                        ->update(['is_default' => true]);
                }
            }
        });
    }
}
