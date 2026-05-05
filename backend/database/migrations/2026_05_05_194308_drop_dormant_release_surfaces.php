<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('webhook_deliveries');
        Schema::dropIfExists('webhook_endpoints');
        Schema::dropIfExists('integration_events');
        Schema::dropIfExists('tenant_exports');
        Schema::dropIfExists('retention_policies');
    }

    public function down(): void
    {
        //
    }
};
