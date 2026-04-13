<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\UpdateWorkspaceGeneralSettingsRequest;
use App\Http\Requests\Workspaces\UpdateWorkspaceTicketingSettingsRequest;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use App\Services\Workspaces\WorkspaceFoundationBootstrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class WorkspaceSettingsController extends Controller
{
    public function __construct(private readonly WorkspaceFoundationBootstrapper $bootstrapper)
    {
    }

    public function general(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        return response()->json([
            'data' => $this->generalPayload($workspace),
        ]);
    }

    public function updateGeneral(
        UpdateWorkspaceGeneralSettingsRequest $request,
        Workspace $workspace,
        AuditLogger $auditLogger
    ): JsonResponse {
        DB::transaction(function () use ($request, $workspace): void {
            if ($request->filled('name')) {
                $workspace->update([
                    'name' => $request->string('name')->toString(),
                ]);
            }

            $setting = $this->settingsFor($workspace);
            $setting->fill([
                'timezone' => $request->input('timezone', $setting->timezone),
                'branding_json' => $request->input('branding', $setting->branding_json ?? []),
                'business_profile_json' => $request->input('business_profile', $setting->business_profile_json ?? []),
            ]);
            $setting->save();
        });

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'workspace.settings.general.updated',
            resourceType: Workspace::class,
            resourceId: (string) $workspace->id,
            meta: ['fields' => array_keys($request->validated())],
            request: $request
        );

        return response()->json([
            'data' => $this->generalPayload($workspace->fresh()),
        ]);
    }

    public function ticketing(Workspace $workspace): JsonResponse
    {
        $this->bootstrapper->ensureSettingsFoundation($workspace);

        return response()->json([
            'data' => $this->ticketingPayload($workspace),
        ]);
    }

    public function updateTicketing(
        UpdateWorkspaceTicketingSettingsRequest $request,
        Workspace $workspace,
        AuditLogger $auditLogger
    ): JsonResponse {
        $setting = $this->settingsFor($workspace);
        $setting->fill([
            'ticket_number_format' => $request->input('ticket_number_format', $setting->ticket_number_format),
            'assignment_strategy' => $request->input('assignment_strategy', $setting->assignment_strategy),
            'ticketing_json' => $request->input('ticketing', $setting->ticketing_json ?? []),
        ]);
        $setting->save();

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'workspace.settings.ticketing.updated',
            resourceType: Workspace::class,
            resourceId: (string) $workspace->id,
            meta: ['fields' => array_keys($request->validated())],
            request: $request
        );

        return response()->json([
            'data' => $this->ticketingPayload($workspace->fresh()),
        ]);
    }

    private function settingsFor(Workspace $workspace)
    {
        return $workspace->setting()->firstOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'timezone' => 'UTC',
                'branding_json' => [],
                'business_profile_json' => [],
                'ticket_number_format' => 'TKT-{seq:6}',
                'assignment_strategy' => 'manual',
                'ticketing_json' => [],
            ]
        );
    }

    private function generalPayload(Workspace $workspace): array
    {
        $setting = $this->settingsFor($workspace);

        return [
            'workspace_id' => $workspace->id,
            'name' => $workspace->name,
            'slug' => $workspace->slug,
            'timezone' => $setting->timezone,
            'branding' => $setting->branding_json ?? [],
            'business_profile' => $setting->business_profile_json ?? [],
            'updated_at' => $setting->updated_at,
        ];
    }

    private function ticketingPayload(Workspace $workspace): array
    {
        $setting = $this->settingsFor($workspace);

        return [
            'workspace_id' => $workspace->id,
            'ticket_number_format' => $setting->ticket_number_format,
            'assignment_strategy' => $setting->assignment_strategy,
            'ticketing' => $setting->ticketing_json ?? [],
            'updated_at' => $setting->updated_at,
        ];
    }
}
