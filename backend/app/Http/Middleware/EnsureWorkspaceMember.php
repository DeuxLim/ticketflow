<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $workspace = $request->route('workspace');
        $user = $request->user();

        if (! $workspace instanceof Workspace || ! $user) {
            abort(Response::HTTP_FORBIDDEN, 'Invalid workspace context.');
        }

        $isMember = $user->memberships()->where('workspace_id', $workspace->id)->exists();

        if (! $isMember) {
            abort(Response::HTTP_FORBIDDEN, 'Not a member of this workspace.');
        }

        return $next($request);
    }
}
