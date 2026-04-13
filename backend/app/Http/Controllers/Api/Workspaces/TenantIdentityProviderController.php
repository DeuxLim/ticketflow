<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreTenantIdentityProviderRequest;
use App\Models\TenantIdentityProvider;
use App\Models\Workspace;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;

class TenantIdentityProviderController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        return response()->json([
            'data' => TenantIdentityProvider::query()
                ->where('workspace_id', $workspace->id)
                ->latest('id')
                ->get(),
        ]);
    }

    public function store(StoreTenantIdentityProviderRequest $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $provider = TenantIdentityProvider::query()->create([
            'workspace_id' => $workspace->id,
            'provider_type' => $request->string('provider_type')->toString(),
            'name' => $request->string('name')->toString(),
            'issuer' => $request->input('issuer'),
            'sso_url' => $request->input('sso_url'),
            'authorization_url' => $request->input('authorization_url'),
            'token_url' => $request->input('token_url'),
            'userinfo_url' => $request->input('userinfo_url'),
            'redirect_uri' => $request->input('redirect_uri'),
            'metadata_url' => $request->input('metadata_url'),
            'x509_certificate' => $request->input('x509_certificate'),
            'client_id' => $request->input('client_id'),
            'client_secret_encrypted' => $request->input('client_secret'),
            'is_active' => $request->boolean('is_active', true),
            'certificate_expires_at' => $request->input('certificate_expires_at'),
        ]);

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $request->user()?->id,
            action: 'tenant.identity_provider.created',
            resourceType: TenantIdentityProvider::class,
            resourceId: (string) $provider->id,
            meta: ['provider_type' => $provider->provider_type, 'name' => $provider->name],
            request: $request
        );

        return response()->json(['data' => $provider], 201);
    }

    public function destroy(Workspace $workspace, TenantIdentityProvider $provider, AuditLogger $auditLogger): JsonResponse
    {
        abort_if($provider->workspace_id !== $workspace->id, 404);

        $providerId = $provider->id;
        $provider->delete();

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: request()->user()?->id,
            action: 'tenant.identity_provider.deleted',
            resourceType: TenantIdentityProvider::class,
            resourceId: (string) $providerId,
            request: request()
        );

        return response()->json(['message' => 'Identity provider deleted.']);
    }
}
