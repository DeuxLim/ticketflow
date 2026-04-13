<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StartOidcSsoRequest;
use App\Models\SsoLoginState;
use App\Models\TenantIdentityProvider;
use App\Models\TenantSecurityPolicy;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SsoController extends Controller
{
    public function startOidc(StartOidcSsoRequest $request, Workspace $workspace): JsonResponse
    {
        $provider = TenantIdentityProvider::query()
            ->where('workspace_id', $workspace->id)
            ->where('provider_type', 'oidc')
            ->where('is_active', true)
            ->whereKey((int) $request->input('provider_id'))
            ->firstOrFail();

        abort_if(! $provider->authorization_url || ! $provider->client_id || ! $provider->redirect_uri, 422, 'Provider is missing OIDC configuration.');

        $state = Str::random(48);
        $nonce = Str::random(48);

        SsoLoginState::query()->create([
            'workspace_id' => $workspace->id,
            'tenant_identity_provider_id' => $provider->id,
            'state' => $state,
            'nonce' => $nonce,
            'expires_at' => now()->addMinutes(10),
        ]);

        $query = http_build_query([
            'response_type' => 'code',
            'client_id' => $provider->client_id,
            'redirect_uri' => $provider->redirect_uri,
            'scope' => 'openid profile email',
            'state' => $state,
            'nonce' => $nonce,
        ]);

        return response()->json([
            'data' => [
                'authorization_url' => rtrim($provider->authorization_url, '?').'?' . $query,
                'state' => $state,
            ],
        ]);
    }

    public function oidcCallback(Request $request, AuditLogger $auditLogger): JsonResponse
    {
        $payload = $request->validate([
            'state' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        $state = SsoLoginState::query()
            ->where('state', $payload['state'])
            ->whereNull('consumed_at')
            ->firstOrFail();

        abort_if($state->expires_at->isPast(), 422, 'SSO state has expired.');

        $provider = $state->provider()->firstOrFail();
        $workspace = $state->workspace()->firstOrFail();

        abort_if(! $provider->token_url, 422, 'Provider token endpoint is not configured.');

        $tokenResponse = Http::asForm()->post($provider->token_url, [
            'grant_type' => 'authorization_code',
            'code' => $payload['code'],
            'redirect_uri' => $provider->redirect_uri,
            'client_id' => $provider->client_id,
            'client_secret' => $provider->client_secret_encrypted,
        ]);

        abort_if(! $tokenResponse->successful(), 422, 'OIDC token exchange failed.');

        $idToken = (string) $tokenResponse->json('id_token');
        abort_if($idToken === '', 422, 'OIDC provider did not return id_token.');

        $claims = $this->decodeAndVerifyOidcIdToken($idToken, $provider->client_secret_encrypted);

        if ($provider->issuer) {
            abort_if(($claims['iss'] ?? null) !== $provider->issuer, 422, 'OIDC issuer mismatch.');
        }

        $aud = $claims['aud'] ?? null;
        if (is_array($aud)) {
            abort_if(! in_array($provider->client_id, $aud, true), 422, 'OIDC audience mismatch.');
        } else {
            abort_if($aud !== $provider->client_id, 422, 'OIDC audience mismatch.');
        }

        abort_if((int) ($claims['exp'] ?? 0) < now()->timestamp, 422, 'OIDC token expired.');
        abort_if(($claims['nonce'] ?? null) !== $state->nonce, 422, 'OIDC nonce mismatch.');

        $email = (string) ($claims['email'] ?? $claims['preferred_username'] ?? $claims['sub'] ?? '');
        abort_if($email === '', 422, 'OIDC token missing email/sub claim.');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'first_name' => (string) ($claims['given_name'] ?? 'SSO'),
                'last_name' => (string) ($claims['family_name'] ?? 'User'),
                'username' => Str::lower(Str::slug(strtok($email, '@').'-'.Str::random(6))),
                'password' => Hash::make(Str::random(24)),
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $user->id],
            ['joined_at' => now()]
        );

        $policy = TenantSecurityPolicy::query()->where('workspace_id', $workspace->id)->first();
        $expiresAt = $policy?->session_ttl_minutes ? now()->addMinutes((int) $policy->session_ttl_minutes) : null;

        $user->forceFill(['last_sso_at' => now()])->save();
        $state->forceFill(['consumed_at' => now()])->save();

        $token = $user->createToken('sso-web', ['*'], $expiresAt)->plainTextToken;

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $user->id,
            action: 'auth.sso.oidc.success',
            resourceType: User::class,
            resourceId: (string) $user->id,
            meta: ['provider_id' => $provider->id],
            request: $request
        );

        return response()->json([
            'data' => [
                'token' => $token,
                'workspace_slug' => $workspace->slug,
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

    public function samlAcs(Request $request, Workspace $workspace, AuditLogger $auditLogger): JsonResponse
    {
        $payload = $request->validate([
            'SAMLResponse' => ['required', 'string'],
        ]);

        $decoded = base64_decode($payload['SAMLResponse'], true);
        abort_if($decoded === false, 422, 'Invalid SAML response encoding.');

        $document = new \DOMDocument();
        $ok = @$document->loadXML($decoded);
        abort_if(! $ok, 422, 'Invalid SAML XML.');

        $xpath = new \DOMXPath($document);
        $xpath->registerNamespace('saml2p', 'urn:oasis:names:tc:SAML:2.0:protocol');
        $xpath->registerNamespace('saml2', 'urn:oasis:names:tc:SAML:2.0:assertion');

        $issuer = trim((string) $xpath->evaluate('string(/saml2p:Response/saml2:Issuer)'));
        $nameId = trim((string) $xpath->evaluate('string(//saml2:Subject/saml2:NameID)'));
        $emailAttr = trim((string) $xpath->evaluate('string(//saml2:Attribute[@Name="email"]/saml2:AttributeValue)'));
        $email = $emailAttr !== '' ? $emailAttr : $nameId;

        abort_if($email === '', 422, 'SAML assertion missing email/NameID.');

        $provider = TenantIdentityProvider::query()
            ->where('workspace_id', $workspace->id)
            ->where('provider_type', 'saml')
            ->where('is_active', true)
            ->get()
            ->first(function (TenantIdentityProvider $candidate) use ($issuer): bool {
                if (! $candidate->issuer) {
                    return true;
                }

                return $candidate->issuer === $issuer;
            });

        abort_if(! $provider, 422, 'No matching SAML provider found.');

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'first_name' => 'SSO',
                'last_name' => 'User',
                'username' => Str::lower(Str::slug(strtok($email, '@').'-'.Str::random(6))),
                'password' => Hash::make(Str::random(24)),
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        WorkspaceMembership::query()->firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $user->id],
            ['joined_at' => now()]
        );

        $policy = TenantSecurityPolicy::query()->where('workspace_id', $workspace->id)->first();
        $expiresAt = $policy?->session_ttl_minutes ? now()->addMinutes((int) $policy->session_ttl_minutes) : null;

        $user->forceFill(['last_sso_at' => now()])->save();

        $token = $user->createToken('sso-web', ['*'], $expiresAt)->plainTextToken;

        $auditLogger->log(
            workspaceId: $workspace->id,
            actorUserId: $user->id,
            action: 'auth.sso.saml.success',
            resourceType: User::class,
            resourceId: (string) $user->id,
            meta: ['provider_id' => $provider->id, 'issuer' => $issuer],
            request: $request
        );

        return response()->json([
            'data' => [
                'token' => $token,
                'workspace_slug' => $workspace->slug,
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

    private function decodeAndVerifyOidcIdToken(string $jwt, ?string $secret): array
    {
        $parts = explode('.', $jwt);
        abort_if(count($parts) !== 3, 422, 'Invalid OIDC id_token format.');

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $header = json_decode($this->base64UrlDecode($headerB64), true, 512, JSON_THROW_ON_ERROR);
        $payload = json_decode($this->base64UrlDecode($payloadB64), true, 512, JSON_THROW_ON_ERROR);

        $alg = $header['alg'] ?? null;
        abort_if(! in_array($alg, ['HS256'], true), 422, 'Unsupported OIDC token algorithm.');
        abort_if(! $secret, 422, 'Provider secret missing for token validation.');

        $expectedSig = hash_hmac('sha256', $headerB64.'.'.$payloadB64, $secret, true);
        $sig = $this->base64UrlDecode($signatureB64);

        abort_if(! hash_equals($expectedSig, $sig), 422, 'OIDC token signature mismatch.');

        return $payload;
    }

    private function base64UrlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder > 0) {
            $input .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($input, '-_', '+/')) ?: '';
    }
}
