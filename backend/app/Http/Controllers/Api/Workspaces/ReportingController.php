<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\Sla\ReportingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportingController extends Controller
{
    public function overview(Request $request, Workspace $workspace, ReportingService $reportingService): JsonResponse
    {
        $from = $request->string('from')->toString();
        $to = $request->string('to')->toString();

        $data = $reportingService->overview(
            workspace: $workspace,
            from: $from ? Carbon::parse($from) : null,
            to: $to ? Carbon::parse($to) : null,
        );

        return response()->json(['data' => $data]);
    }
}
