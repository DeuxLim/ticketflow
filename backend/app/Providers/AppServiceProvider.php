<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\SavedView;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\WebhookDelivery;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('tenant-api', function (Request $request): Limit {
            $workspace = $request->route('workspace');
            $workspaceKey = $workspace instanceof Workspace ? $workspace->id : 'none';
            $tokenKey = $request->bearerToken() ?: $request->ip();

            return Limit::perMinute(600)->by("tenant:{$workspaceKey}:{$tokenKey}");
        });

        Route::bind('workspace', function (string $value): Workspace {
            return Workspace::query()->where('slug', $value)->firstOrFail();
        });

        Route::bind('customer', function (string $value, $route): Customer {
            /** @var Workspace|null $workspace */
            $workspace = $route->parameter('workspace');

            $query = Customer::query()->whereKey($value);

            if ($workspace) {
                $query->where('workspace_id', $workspace->id);
            }

            return $query->firstOrFail();
        });

        Route::bind('invitation', function (string $value, $route): WorkspaceInvitation {
            /** @var Workspace|null $workspace */
            $workspace = $route->parameter('workspace');

            $query = WorkspaceInvitation::query()->whereKey($value);

            if ($workspace) {
                $query->where('workspace_id', $workspace->id);
            }

            return $query->firstOrFail();
        });

        Route::bind('ticket', function (string $value, $route): Ticket {
            /** @var Workspace|null $workspace */
            $workspace = $route->parameter('workspace');

            $query = Ticket::query()->whereKey($value);

            if ($workspace) {
                $query->where('workspace_id', $workspace->id);
            }

            return $query->firstOrFail();
        });

        Route::bind('delivery', function (string $value, $route): WebhookDelivery {
            /** @var Workspace|null $workspace */
            $workspace = $route->parameter('workspace');

            $query = WebhookDelivery::query()->whereKey($value)->with('endpoint');

            if ($workspace) {
                $query->whereHas('endpoint', fn ($endpointQuery) => $endpointQuery->where('workspace_id', $workspace->id));
            }

            return $query->firstOrFail();
        });

        Route::bind('view', function (string $value, $route): SavedView {
            /** @var Workspace|null $workspace */
            $workspace = $route->parameter('workspace');

            $query = SavedView::query()->whereKey($value);

            if ($workspace) {
                $query->where('workspace_id', $workspace->id);
            }

            return $query->firstOrFail();
        });

        Route::bind('attachment', function (string $value, $route): TicketAttachment {
            /** @var Workspace|null $workspace */
            $workspace = $route->parameter('workspace');
            /** @var Ticket|null $ticket */
            $ticket = $route->parameter('ticket');

            $query = TicketAttachment::query()->whereKey($value);

            if ($workspace) {
                $query->where('workspace_id', $workspace->id);
            }

            if ($ticket) {
                $query->where('ticket_id', $ticket->id);
            }

            return $query->firstOrFail();
        });
    }
}
