<?php

use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\EnsureTenantNetworkAllowed;
use App\Http\Middleware\EnsureWorkspaceMember;
use App\Http\Middleware\EnsureWorkspacePermission;
use App\Http\Middleware\AuthenticateScimProvisioning;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(function (Request $request): ?string {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            return '/auth/login';
        });

        $middleware->alias([
            'platform_admin' => EnsurePlatformAdmin::class,
            'workspace_member' => EnsureWorkspaceMember::class,
            'workspace_permission' => EnsureWorkspacePermission::class,
            'tenant_network' => EnsureTenantNetworkAllowed::class,
            'scim_auth' => AuthenticateScimProvisioning::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $exception, Request $request): ?JsonResponse {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            return null;
        });
    })->create();
