<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index('owner_user_id');
        });

        Schema::create('workspace_memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'user_id']);
            $table->index('workspace_id');
            $table->index('user_id');
        });

        Schema::create('workspace_roles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();

            $table->unique(['workspace_id', 'slug']);
            $table->index('workspace_id');
        });

        Schema::create('workspace_permissions', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('workspace_role_permissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_role_id')->constrained('workspace_roles')->cascadeOnDelete();
            $table->foreignId('workspace_permission_id')->constrained('workspace_permissions')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['workspace_role_id', 'workspace_permission_id']);
            $table->index('workspace_role_id');
            $table->index('workspace_permission_id');
        });

        Schema::create('workspace_membership_roles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_membership_id')->constrained('workspace_memberships')->cascadeOnDelete();
            $table->foreignId('workspace_role_id')->constrained('workspace_roles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['workspace_membership_id', 'workspace_role_id']);
            $table->index('workspace_membership_id');
            $table->index('workspace_role_id');
        });

        Schema::create('workspace_invitations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('email');
            $table->foreignId('invited_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('token_hash')->unique();
            $table->string('status');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->foreignId('accepted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('workspace_id');
            $table->index('email');
            $table->index('status');
        });

        Schema::create('workspace_invitation_roles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_invitation_id')->constrained('workspace_invitations')->cascadeOnDelete();
            $table->foreignId('workspace_role_id')->constrained('workspace_roles')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['workspace_invitation_id', 'workspace_role_id']);
            $table->index('workspace_invitation_id');
            $table->index('workspace_role_id');
        });

        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->timestamps();

            $table->index('workspace_id');
            $table->index('email');
            $table->index(['workspace_id', 'email']);
            $table->unique(['id', 'workspace_id']);
        });

        Schema::create('tickets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('ticket_number');
            $table->string('title');
            $table->text('description');
            $table->string('status');
            $table->string('priority');
            $table->timestamps();

            $table->index('workspace_id');
            $table->index('customer_id');
            $table->index('created_by_user_id');
            $table->index('assigned_to_user_id');
            $table->index('status');
            $table->index('priority');
            $table->unique(['workspace_id', 'ticket_number']);
            $table->unique(['id', 'workspace_id']);
        });

        Schema::create('ticket_comments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->text('body');
            $table->boolean('is_internal')->default(false);
            $table->timestamps();

            $table->index('workspace_id');
            $table->index('ticket_id');
            $table->index('user_id');
            $table->index('customer_id');
        });

        Schema::create('activity_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained('workspaces')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->text('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('workspace_id');
            $table->index('user_id');
            $table->index(['subject_type', 'subject_id']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('ticket_comments');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('workspace_invitation_roles');
        Schema::dropIfExists('workspace_invitations');
        Schema::dropIfExists('workspace_membership_roles');
        Schema::dropIfExists('workspace_role_permissions');
        Schema::dropIfExists('workspace_permissions');
        Schema::dropIfExists('workspace_roles');
        Schema::dropIfExists('workspace_memberships');
        Schema::dropIfExists('workspaces');
    }
};
