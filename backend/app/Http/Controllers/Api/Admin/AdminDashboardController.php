<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AutomationExecution;
use App\Models\BreakGlassRequest;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMembership;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'users_count' => User::query()->count(),
                'workspaces_count' => Workspace::query()->count(),
                'memberships_count' => WorkspaceMembership::query()->count(),
                'tickets_count' => Ticket::query()->count(),
                'suspended_workspaces_count' => Workspace::query()->where('lifecycle_status', 'suspended')->count(),
                'maintenance_workspaces_count' => Workspace::query()->where('maintenance_mode', true)->count(),
                'dedicated_workspaces_count' => Workspace::query()->where('tenant_mode', 'dedicated')->count(),
                'failed_automation_executions_count' => AutomationExecution::query()->where('status', 'failed')->count(),
                'pending_break_glass_count' => BreakGlassRequest::query()->where('status', 'pending')->count(),
            ],
        ]);
    }
}
