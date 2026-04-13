<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspacePermission
{
    public function handle(Request $request, Closure $next, string $permissionSlug): Response
    {
        $workspace = $request->route('workspace');
        $user = $request->user();

        if (! $workspace instanceof Workspace || ! $user) {
            abort(Response::HTTP_FORBIDDEN, 'Invalid workspace context.');
        }

        if (! $user->hasWorkspacePermission($workspace->id, $permissionSlug)) {
            abort(Response::HTTP_FORBIDDEN, 'Missing workspace permission.');
        }

        return $next($request);
    }
}
