<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table): void {
            $table->string('lifecycle_status')->default('active')->after('feature_flags');
            $table->boolean('maintenance_mode')->default(false)->after('lifecycle_status');
            $table->text('usage_limits_json')->nullable()->after('maintenance_mode');
            $table->text('ops_notes_json')->nullable()->after('usage_limits_json');

            $table->index('lifecycle_status');
            $table->index('maintenance_mode');
        });

        Schema::table('workflow_transitions', function (Blueprint $table): void {
            $table->unsignedInteger('sort_order')->default(0)->after('requires_approval');
            $table->string('approver_mode')->nullable()->after('sort_order');
            $table->string('approver_role_slug')->nullable()->after('approver_mode');
            $table->text('approver_user_ids_json')->nullable()->after('approver_role_slug');
            $table->unsignedInteger('approval_timeout_minutes')->nullable()->after('approver_user_ids_json');
        });

        Schema::table('approval_steps', function (Blueprint $table): void {
            $table->foreignId('workflow_transition_id')->nullable()->after('ticket_id')->constrained('workflow_transitions')->nullOnDelete();
            $table->string('requested_transition_to_status')->nullable()->after('workflow_transition_id');
            $table->text('request_reason')->nullable()->after('requested_transition_to_status');
            $table->text('decision_reason')->nullable()->after('request_reason');
            $table->foreignId('decisioned_by_user_id')->nullable()->after('approver_user_id')->constrained('users')->nullOnDelete();
            $table->timestamp('decisioned_at')->nullable()->after('rejected_at');
        });

        Schema::table('automation_rules', function (Blueprint $table): void {
            $table->unsignedInteger('priority')->default(100)->after('event_type');
            $table->unsignedSmallInteger('schema_version')->default(1)->after('priority');
            $table->unsignedInteger('max_chain_depth')->default(3)->after('schema_version');
            $table->string('idempotency_scope')->default('rule_event_ticket')->after('max_chain_depth');
        });

        Schema::create('automation_executions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('automation_rule_id')->constrained('automation_rules')->cascadeOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->string('event_type');
            $table->string('idempotency_key')->nullable();
            $table->string('status')->default('applied'); // applied | skipped | failed
            $table->text('decision_json')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('chain_depth')->default(0);
            $table->timestamp('executed_at')->useCurrent();
            $table->timestamps();

            $table->index(['workspace_id', 'executed_at']);
            $table->index(['workspace_id', 'status']);
            $table->unique(['automation_rule_id', 'idempotency_key']);
        });

        Schema::create('retention_policies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->unsignedInteger('tickets_days')->default(365);
            $table->unsignedInteger('comments_days')->default(365);
            $table->unsignedInteger('attachments_days')->default(365);
            $table->unsignedInteger('audit_days')->default(730);
            $table->boolean('purge_enabled')->default(false);
            $table->timestamps();

            $table->unique('workspace_id');
        });

        Schema::create('legal_holds', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('scope')->default('workspace'); // workspace | tickets | attachments | audit
            $table->boolean('is_active')->default(true);
            $table->text('reason')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'is_active']);
        });

        Schema::create('tenant_exports', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('completed'); // queued | processing | completed | failed
            $table->text('filters_json')->nullable();
            $table->string('download_token')->nullable();
            $table->timestamp('download_expires_at')->nullable();
            $table->text('result_json')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index('download_token');
        });

        Schema::create('break_glass_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending'); // pending | approved | rejected | expired
            $table->text('reason');
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->foreignId('approver_one_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approver_two_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('break_glass_requests');
        Schema::dropIfExists('tenant_exports');
        Schema::dropIfExists('legal_holds');
        Schema::dropIfExists('retention_policies');
        Schema::dropIfExists('automation_executions');

        Schema::table('automation_rules', function (Blueprint $table): void {
            $table->dropColumn(['priority', 'schema_version', 'max_chain_depth', 'idempotency_scope']);
        });

        Schema::table('approval_steps', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('workflow_transition_id');
            $table->dropConstrainedForeignId('decisioned_by_user_id');
            $table->dropColumn(['requested_transition_to_status', 'request_reason', 'decision_reason', 'decisioned_at']);
        });

        Schema::table('workflow_transitions', function (Blueprint $table): void {
            $table->dropColumn(['sort_order', 'approver_mode', 'approver_role_slug', 'approver_user_ids_json', 'approval_timeout_minutes']);
        });

        Schema::table('workspaces', function (Blueprint $table): void {
            $table->dropColumn(['lifecycle_status', 'maintenance_mode', 'usage_limits_json', 'ops_notes_json']);
        });
    }
};
