<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_mfa_enrolled')->default(false)->after('is_platform_admin');
        });

        Schema::table('workspaces', function (Blueprint $table): void {
            $table->string('tenant_mode')->default('shared')->after('owner_user_id');
            $table->string('dedicated_data_plane_key')->nullable()->after('tenant_mode');
            $table->string('feature_flags')->nullable()->after('dedicated_data_plane_key');

            $table->index('tenant_mode');
        });

        Schema::create('tenant_security_policies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->boolean('require_mfa')->default(false);
            $table->integer('session_ttl_minutes')->default(720);
            $table->string('ip_allowlist')->nullable();
            $table->timestamps();

            $table->unique('workspace_id');
        });

        Schema::create('business_calendars', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('timezone')->default('UTC');
            $table->string('working_days')->default('1,2,3,4,5');
            $table->string('start_time')->default('09:00');
            $table->string('end_time')->default('18:00');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['workspace_id', 'is_default']);
        });

        Schema::create('sla_policies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('business_calendar_id')->nullable()->constrained('business_calendars')->nullOnDelete();
            $table->string('name');
            $table->string('priority')->nullable();
            $table->unsignedInteger('first_response_minutes');
            $table->unsignedInteger('resolution_minutes');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['workspace_id', 'is_active']);
            $table->index(['workspace_id', 'priority']);
        });

        Schema::table('tickets', function (Blueprint $table): void {
            $table->timestamp('first_response_due_at')->nullable()->after('priority');
            $table->timestamp('resolution_due_at')->nullable()->after('first_response_due_at');
            $table->timestamp('first_responded_at')->nullable()->after('resolution_due_at');
            $table->timestamp('resolved_at')->nullable()->after('first_responded_at');
            $table->string('queue_key')->nullable()->after('resolved_at');
            $table->string('category')->nullable()->after('queue_key');
            $table->string('tags')->nullable()->after('category');

            $table->index(['workspace_id', 'queue_key']);
            $table->index(['workspace_id', 'first_response_due_at']);
            $table->index(['workspace_id', 'resolution_due_at']);
        });

        Schema::create('sla_breach_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('metric_type'); // first_response | resolution
            $table->timestamp('breached_at');
            $table->timestamps();

            $table->index(['workspace_id', 'metric_type']);
            $table->unique(['ticket_id', 'metric_type']);
        });

        Schema::create('ticket_workflows', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['workspace_id', 'is_default']);
        });

        Schema::create('workflow_transitions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_workflow_id')->constrained('ticket_workflows')->cascadeOnDelete();
            $table->string('from_status');
            $table->string('to_status');
            $table->string('required_permission')->nullable();
            $table->boolean('requires_approval')->default(false);
            $table->timestamps();

            $table->index(['ticket_workflow_id', 'from_status']);
        });

        Schema::create('approval_steps', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approver_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'status']);
        });

        Schema::create('automation_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('event_type');
            $table->string('condition_json')->nullable();
            $table->string('action_json');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['workspace_id', 'event_type', 'is_active']);
        });

        Schema::create('audit_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained('workspaces')->nullOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('resource_type');
            $table->string('resource_id')->nullable();
            $table->string('request_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->text('meta')->nullable();
            $table->string('previous_hash')->nullable();
            $table->string('event_hash');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['workspace_id', 'created_at']);
            $table->index(['actor_user_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->unique('event_hash');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('audit_events');
        Schema::dropIfExists('automation_rules');
        Schema::dropIfExists('approval_steps');
        Schema::dropIfExists('workflow_transitions');
        Schema::dropIfExists('ticket_workflows');
        Schema::dropIfExists('sla_breach_events');

        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropColumn([
                'first_response_due_at',
                'resolution_due_at',
                'first_responded_at',
                'resolved_at',
                'queue_key',
                'category',
                'tags',
            ]);
        });

        Schema::dropIfExists('sla_policies');
        Schema::dropIfExists('business_calendars');
        Schema::dropIfExists('provisioned_directory_users');
        Schema::dropIfExists('provisioning_directories');
        Schema::dropIfExists('tenant_identity_providers');
        Schema::dropIfExists('tenant_security_policies');

        Schema::table('workspaces', function (Blueprint $table): void {
            $table->dropColumn(['tenant_mode', 'dedicated_data_plane_key', 'feature_flags']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['is_mfa_enrolled']);
        });
    }
};
