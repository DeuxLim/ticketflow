<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\TenantIdentityProvider;
use App\Models\TenantSecurityPolicy;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create($request->validated());

        return response()->json([
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'email' => $user->email,
                'is_platform_admin' => $user->is_platform_admin,
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 422);
        }

        $workspaceSlug = $request->string('workspace_slug')->toString();
        $workspace = null;
        $expiresAt = null;

        if ($workspaceSlug !== '') {
            $workspace = Workspace::query()->where('slug', $workspaceSlug)->first();
        }

        if ($workspace) {
            $hasMembership = $user->memberships()->where('workspace_id', $workspace->id)->exists();

            if ($hasMembership) {
                $policy = TenantSecurityPolicy::query()->where('workspace_id', $workspace->id)->first();
                $hasIdentityProvider = TenantIdentityProvider::query()
                    ->where('workspace_id', $workspace->id)
                    ->where('is_active', true)
                    ->exists();

                if ($policy?->require_sso && $hasIdentityProvider) {
                    return response()->json([
                        'message' => 'Local login is disabled for this workspace. Use SSO.',
                    ], 403);
                }

                if ($policy && $policy->session_ttl_minutes > 0) {
                    $expiresAt = now()->addMinutes($policy->session_ttl_minutes);
                }
            }
        }

        $token = $user->createToken($request->input('device_name', 'web'), ['*'], $expiresAt)->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'is_platform_admin' => $user->is_platform_admin,
                ],
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
