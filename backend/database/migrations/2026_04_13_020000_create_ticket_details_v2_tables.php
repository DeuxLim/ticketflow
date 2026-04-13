<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_watchers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('added_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['workspace_id', 'ticket_id', 'user_id']);
            $table->index(['workspace_id', 'user_id']);
        });

        Schema::create('ticket_related_tickets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('related_ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('relationship_type')->default('related');
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['workspace_id', 'ticket_id', 'related_ticket_id']);
            $table->index(['workspace_id', 'relationship_type']);
        });

        Schema::create('ticket_checklist_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_completed')->default(false);
            $table->foreignId('completed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['workspace_id', 'ticket_id', 'sort_order']);
            $table->index(['workspace_id', 'assigned_to_user_id']);
        });

        Schema::create('ticket_custom_field_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('ticket_custom_field_id')->constrained('ticket_custom_fields')->cascadeOnDelete();
            $table->text('value_json')->nullable();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['ticket_id', 'ticket_custom_field_id']);
            $table->index(['workspace_id', 'ticket_custom_field_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_custom_field_values');
        Schema::dropIfExists('ticket_checklist_items');
        Schema::dropIfExists('ticket_related_tickets');
        Schema::dropIfExists('ticket_watchers');
    }
};
