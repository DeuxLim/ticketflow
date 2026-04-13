<?php

namespace App\Http\Middleware;

use App\Models\ProvisioningDirectory;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateScimProvisioning
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            abort(Response::HTTP_UNAUTHORIZED, 'Missing SCIM bearer token.');
        }

        $hash = hash('sha256', $token);

        $directory = ProvisioningDirectory::query()
            ->where('token_hash', $hash)
            ->where('status', 'active')
            ->first();

        if (! $directory) {
            abort(Response::HTTP_UNAUTHORIZED, 'Invalid SCIM token.');
        }

        $request->attributes->set('provisioning_directory', $directory);
        $request->attributes->set('workspace', $directory->workspace);

        return $next($request);
    }
}
