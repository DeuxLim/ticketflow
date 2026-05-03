<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('break_glass_requests');
    }

    public function down(): void
    {
        // Break-glass is intentionally out of scope for this project.
    }
};
