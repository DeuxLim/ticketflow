<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SsoFlowsTest extends TestCase
{
    use RefreshDatabase;

    public function test_oidc_start_and_callback_authenticates_user_and_joins_workspace(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Enterprise',
            'slug' => 'enterprise',
        ])->json('data');

        $provider = $this->postJson("/api/workspaces/{$workspace['slug']}/identity-providers", [
            'provider_type' => 'oidc',
            'name' => 'Okta OIDC',
            'issuer' => 'https://idp.example.com',
            'authorization_url' => 'https://idp.example.com/oauth2/v1/authorize',
            'token_url' => 'https://idp.example.com/oauth2/v1/token',
            'redirect_uri' => 'https://app.example.com/api/auth/sso/oidc/callback',
            'client_id' => 'client-123',
            'client_secret' => 'secret-abc',
        ])->assertCreated()->json('data');

        $start = $this->postJson("/api/workspaces/{$workspace['slug']}/auth/sso/oidc/start", [
            'provider_id' => $provider['id'],
        ])->assertOk()->json('data');

        $state = $start['state'];

        Http::fake([
            'https://idp.example.com/oauth2/v1/token' => Http::response([
                'id_token' => $this->signHs256Jwt([
                    'iss' => 'https://idp.example.com',
                    'aud' => 'client-123',
                    'exp' => now()->addMinutes(5)->timestamp,
                    'nonce' => \App\Models\SsoLoginState::query()->where('state', $state)->value('nonce'),
                    'email' => 'sso.user@example.com',
                    'given_name' => 'SSO',
                    'family_name' => 'User',
                    'sub' => 'oidc-sub-1',
                ], 'secret-abc'),
            ], 200),
        ]);

        $response = $this->getJson('/api/auth/sso/oidc/callback?state='.urlencode($state).'&code=abc123')
            ->assertOk()
            ->json('data');

        $this->assertNotEmpty($response['token']);
        $this->assertSame($workspace['slug'], $response['workspace_slug']);

        $this->assertDatabaseHas('users', [
            'email' => 'sso.user@example.com',
        ]);

        $userId = \DB::table('users')->where('email', 'sso.user@example.com')->value('id');

        $this->assertDatabaseHas('workspace_memberships', [
            'workspace_id' => $workspace['id'],
            'user_id' => $userId,
        ]);

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace['id'],
            'action' => 'auth.sso.oidc.success',
            'actor_user_id' => $userId,
        ]);
    }

    public function test_saml_acs_authenticates_user_and_joins_workspace(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $workspace = $this->postJson('/api/workspaces', [
            'name' => 'Enterprise',
            'slug' => 'enterprise',
        ])->json('data');

        $this->postJson("/api/workspaces/{$workspace['slug']}/identity-providers", [
            'provider_type' => 'saml',
            'name' => 'Okta SAML',
            'issuer' => 'https://idp.example.com/saml',
            'sso_url' => 'https://idp.example.com/saml/sso',
        ])->assertCreated();

        $xml = <<<XML
<saml2p:Response xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml2:Issuer>https://idp.example.com/saml</saml2:Issuer>
  <saml2:Assertion>
    <saml2:Subject>
      <saml2:NameID>saml.user@example.com</saml2:NameID>
    </saml2:Subject>
    <saml2:AttributeStatement>
      <saml2:Attribute Name="email">
        <saml2:AttributeValue>saml.user@example.com</saml2:AttributeValue>
      </saml2:Attribute>
    </saml2:AttributeStatement>
  </saml2:Assertion>
</saml2p:Response>
XML;

        $response = $this->postJson("/api/workspaces/{$workspace['slug']}/auth/sso/saml/acs", [
            'SAMLResponse' => base64_encode($xml),
        ])->assertOk()->json('data');

        $this->assertNotEmpty($response['token']);
        $this->assertSame($workspace['slug'], $response['workspace_slug']);

        $this->assertDatabaseHas('users', [
            'email' => 'saml.user@example.com',
        ]);

        $userId = \DB::table('users')->where('email', 'saml.user@example.com')->value('id');

        $this->assertDatabaseHas('workspace_memberships', [
            'workspace_id' => $workspace['id'],
            'user_id' => $userId,
        ]);

        $this->assertDatabaseHas('audit_events', [
            'workspace_id' => $workspace['id'],
            'action' => 'auth.sso.saml.success',
            'actor_user_id' => $userId,
        ]);
    }

    private function signHs256Jwt(array $claims, string $secret): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];

        $headerB64 = $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $payloadB64 = $this->base64UrlEncode(json_encode($claims, JSON_THROW_ON_ERROR));

        $signature = hash_hmac('sha256', $headerB64.'.'.$payloadB64, $secret, true);
        $signatureB64 = $this->base64UrlEncode($signature);

        return $headerB64.'.'.$payloadB64.'.'.$signatureB64;
    }

    private function base64UrlEncode(string $input): string
    {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }
}
