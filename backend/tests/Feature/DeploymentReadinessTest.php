<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeploymentReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_health_endpoint_returns_ok_payload(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('name', config('app.name'));
    }

    public function test_cors_allows_a_configured_frontend_origin(): void
    {
        config()->set('cors.allowed_origins', ['https://ticketing-ui.example.com']);

        $this->withHeaders([
            'Origin' => 'https://ticketing-ui.example.com',
        ])->getJson('/api/health')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'https://ticketing-ui.example.com');
    }

    public function test_cors_does_not_reflect_unknown_origin(): void
    {
        config()->set('cors.allowed_origins', ['https://ticketing-ui.example.com']);

        $response = $this->withHeaders([
            'Origin' => 'https://unexpected-origin.example.com',
        ])->getJson('/api/health')
            ->assertOk();

        $this->assertNotSame(
            'https://unexpected-origin.example.com',
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    public function test_public_registration_is_disabled_by_default(): void
    {
        $this->postJson('/api/auth/register', [
            'first_name' => 'Solo',
            'last_name' => 'Owner',
            'username' => 'solo-owner',
            'email' => 'solo@example.com',
            'password' => 'Password123',
        ])->assertNotFound();

        $this->assertDatabaseCount('users', 0);
    }

    public function test_public_registration_can_be_enabled_explicitly(): void
    {
        config()->set('auth.allow_public_registration', true);

        $this->postJson('/api/auth/register', [
            'first_name' => 'Solo',
            'last_name' => 'Owner',
            'username' => 'solo-owner',
            'email' => 'solo@example.com',
            'password' => 'Password123',
        ])->assertCreated()
            ->assertJsonPath('data.email', 'solo@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'solo@example.com',
        ]);
    }

    public function test_login_is_rate_limited_after_repeated_failures(): void
    {
        User::factory()->create([
            'email' => 'owner@example.com',
            'password' => 'Password123',
        ]);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/auth/login', [
                'email' => 'owner@example.com',
                'password' => 'WrongPassword123',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', [
            'email' => 'owner@example.com',
            'password' => 'WrongPassword123',
        ])->assertStatus(429);
    }
}
