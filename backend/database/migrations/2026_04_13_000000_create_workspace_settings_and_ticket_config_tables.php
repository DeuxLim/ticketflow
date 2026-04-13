<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('timezone')->default('UTC');
            $table->text('branding_json')->nullable();
            $table->text('business_profile_json')->nullable();
            $table->string('ticket_number_format')->default('TKT-{seq:6}');
            $table->string('assignment_strategy')->default('manual');
            $table->text('ticketing_json')->nullable();
            $table->timestamps();

            $table->unique('workspace_id');
        });

        Schema::create('ticket_queues', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('key');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
            $table->index(['workspace_id', 'is_active']);
            $table->index(['workspace_id', 'is_default']);
        });

        Schema::create('ticket_categories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('key');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
            $table->index(['workspace_id', 'is_active']);
        });

        Schema::create('ticket_tags', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('color')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['workspace_id', 'name']);
            $table->index(['workspace_id', 'is_active']);
        });

        Schema::create('ticket_types', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('key');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
            $table->index(['workspace_id', 'is_active']);
            $table->index(['workspace_id', 'is_default']);
        });

        Schema::create('ticket_custom_fields', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('key');
            $table->string('label');
            $table->string('field_type');
            $table->text('options_json')->nullable();
            $table->text('validation_json')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
            $table->index(['workspace_id', 'is_active']);
        });

        Schema::create('ticket_form_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('ticket_type_id')->nullable()->constrained('ticket_types')->nullOnDelete();
            $table->string('name');
            $table->text('field_schema_json')->nullable();
            $table->text('visibility_rules_json')->nullable();
            $table->text('required_rules_json')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['workspace_id', 'ticket_type_id']);
            $table->index(['workspace_id', 'is_active']);
            $table->index(['workspace_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_form_templates');
        Schema::dropIfExists('ticket_custom_fields');
        Schema::dropIfExists('ticket_types');
        Schema::dropIfExists('ticket_tags');
        Schema::dropIfExists('ticket_categories');
        Schema::dropIfExists('ticket_queues');
        Schema::dropIfExists('workspace_settings');
    }
};
