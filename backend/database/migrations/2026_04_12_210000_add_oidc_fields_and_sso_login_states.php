<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_identity_providers', function (Blueprint $table): void {
            $table->string('authorization_url')->nullable()->after('sso_url');
            $table->string('token_url')->nullable()->after('authorization_url');
            $table->string('userinfo_url')->nullable()->after('token_url');
            $table->string('redirect_uri')->nullable()->after('userinfo_url');
        });

        Schema::create('sso_login_states', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('tenant_identity_provider_id')->constrained('tenant_identity_providers')->cascadeOnDelete();
            $table->string('state')->unique();
            $table->string('nonce');
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sso_login_states');

        Schema::table('tenant_identity_providers', function (Blueprint $table): void {
            $table->dropColumn(['authorization_url', 'token_url', 'userinfo_url', 'redirect_uri']);
        });
    }
};
