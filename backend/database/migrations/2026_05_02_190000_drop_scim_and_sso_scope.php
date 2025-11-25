<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('sso_login_states');
        Schema::dropIfExists('provisioned_directory_users');
        Schema::dropIfExists('provisioning_directories');
        Schema::dropIfExists('tenant_identity_providers');

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'last_sso_at')) {
                $table->dropColumn('last_sso_at');
            }
        });

        Schema::table('tenant_security_policies', function (Blueprint $table): void {
            if (Schema::hasColumn('tenant_security_policies', 'require_sso')) {
                $table->dropColumn('require_sso');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'last_sso_at')) {
                $table->timestamp('last_sso_at')->nullable()->after('is_mfa_enrolled');
            }
        });

        Schema::table('tenant_security_policies', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenant_security_policies', 'require_sso')) {
                $table->boolean('require_sso')->default(false)->after('workspace_id');
            }
        });
    }
};
