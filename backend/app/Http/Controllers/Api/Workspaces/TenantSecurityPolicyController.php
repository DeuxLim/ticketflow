<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\UpdateTenantSecurityPolicyRequest;
use App\Models\TenantSecurityPolicy;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;

class TenantSecurityPolicyController extends Controller
{
    public function show(Workspace $workspace): JsonResponse
    {
        $policy = TenantSecurityPolicy::query()->firstOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'require_sso' => false,
                'require_mfa' => false,
                'session_ttl_minutes' => 720,
            ]
        );

        return response()->json([
            'data' => [
                'id' => $policy->id,
                'workspace_id' => $workspace->id,
                'require_sso' => $policy->require_sso,
                'require_mfa' => $policy->require_mfa,
                'session_ttl_minutes' => $policy->session_ttl_minutes,
                'ip_allowlist' => $policy->allowlist(),
                'tenant_mode' => $workspace->tenant_mode,
                'dedicated_data_plane_key' => $workspace->dedicated_data_plane_key,
                'feature_flags' => is_array($workspace->feature_flags)
                    ? $workspace->feature_flags
                    : ($workspace->feature_flags ? json_decode((string) $workspace->feature_flags, true, 512, JSON_THROW_ON_ERROR) : []),
            ],
        ]);
    }

    public function update(UpdateTenantSecurityPolicyRequest $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $policy = TenantSecurityPolicy::query()->firstOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'require_sso' => false,
                'require_mfa' => false,
                'session_ttl_minutes' => 720,
            ]
        );

        $validated = $request->validated();

        if (array_key_exists('ip_allowlist', $validated)) {
            $validated['ip_allowlist'] = collect($validated['ip_allowlist'] ?? [])->implode(',');
        }

        $policy->fill($validated);
        $policy->save();

        $workspace->fill([
            'tenant_mode' => $validated['tenant_mode'] ?? $workspace->tenant_mode,
            'dedicated_data_plane_key' => $validated['dedicated_data_plane_key'] ?? $workspace->dedicated_data_plane_key,
            'feature_flags' => array_key_exists('feature_flags', $validated)
                ? ($validated['feature_flags'] ?? [])
                : $workspace->feature_flags,
        ])->save();

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'tenant.security_policy.updated',
            resourceType: TenantSecurityPolicy::class,
            resourceId: (string) $policy->id,
            meta: ['changes' => $validated],
            request: $request
        );

        return $this->show($workspace);
    }
}
