<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->string('job_title')->nullable()->after('company');
            $table->string('website')->nullable()->after('job_title');
            $table->string('timezone')->nullable()->after('website');
            $table->string('preferred_contact_method', 40)->nullable()->after('timezone');
            $table->string('preferred_language', 80)->nullable()->after('preferred_contact_method');
            $table->text('address')->nullable()->after('preferred_language');
            $table->string('external_reference')->nullable()->after('address');
            $table->string('support_tier', 80)->nullable()->after('external_reference');
            $table->string('status', 80)->nullable()->after('support_tier');
            $table->text('internal_notes')->nullable()->after('status');

            $table->index('external_reference');
            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'support_tier']);
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->dropIndex(['external_reference']);
            $table->dropIndex(['workspace_id', 'status']);
            $table->dropIndex(['workspace_id', 'support_tier']);
            $table->dropColumn([
                'job_title',
                'website',
                'timezone',
                'preferred_contact_method',
                'preferred_language',
                'address',
                'external_reference',
                'support_tier',
                'status',
                'internal_notes',
            ]);
        });
    }
};
