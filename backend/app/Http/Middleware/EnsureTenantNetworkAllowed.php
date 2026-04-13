<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantNetworkAllowed
{
    public function handle(Request $request, Closure $next): Response
    {
        $workspace = $request->route('workspace');

        if (! $workspace instanceof Workspace) {
            return $next($request);
        }

        if ($workspace->lifecycle_status === 'suspended') {
            abort(Response::HTTP_FORBIDDEN, 'Workspace is suspended by platform administration.');
        }

        if ((bool) $workspace->maintenance_mode) {
            abort(Response::HTTP_SERVICE_UNAVAILABLE, 'Workspace is currently in maintenance mode.');
        }

        $policy = $workspace->securityPolicy;

        if (! $policy) {
            return $next($request);
        }

        $allowlist = $policy->allowlist();

        if ($allowlist === []) {
            return $next($request);
        }

        $ip = $request->ip();

        if (! in_array($ip, $allowlist, true)) {
            abort(Response::HTTP_FORBIDDEN, 'IP address is not allowed for this tenant policy.');
        }

        return $next($request);
    }
}
