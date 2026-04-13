<?php

use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminWorkspaceOperationsController;
use App\Http\Controllers\Api\Admin\AdminUserIndexController;
use App\Http\Controllers\Api\Admin\AdminWorkspaceIndexController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\SsoController;
use App\Http\Controllers\Api\Scim\ScimGroupController;
use App\Http\Controllers\Api\Scim\ScimUserController;
use App\Http\Controllers\Api\Workspaces\ApprovalController;
use App\Http\Controllers\Api\Workspaces\AutomationRuleController;
use App\Http\Controllers\Api\Workspaces\AuditEventController;
use App\Http\Controllers\Api\Workspaces\BreakGlassController;
use App\Http\Controllers\Api\Workspaces\CustomerController;
use App\Http\Controllers\Api\Workspaces\InvitationAcceptanceController;
use App\Http\Controllers\Api\Workspaces\ProvisioningDirectoryController;
use App\Http\Controllers\Api\Workspaces\ReportingController;
use App\Http\Controllers\Api\Workspaces\RetentionPolicyController;
use App\Http\Controllers\Api\Workspaces\SavedViewController;
use App\Http\Controllers\Api\Workspaces\SlaPolicyController;
use App\Http\Controllers\Api\Workspaces\TenantExportController;
use App\Http\Controllers\Api\Workspaces\TenantIdentityProviderController;
use App\Http\Controllers\Api\Workspaces\TenantSecurityPolicyController;
use App\Http\Controllers\Api\Workspaces\TicketAttachmentController;
use App\Http\Controllers\Api\Workspaces\TicketCategoryController;
use App\Http\Controllers\Api\Workspaces\TicketChecklistItemController;
use App\Http\Controllers\Api\Workspaces\TicketCommentController;
use App\Http\Controllers\Api\Workspaces\TicketController;
use App\Http\Controllers\Api\Workspaces\TicketCustomFieldController;
use App\Http\Controllers\Api\Workspaces\TicketFormTemplateController;
use App\Http\Controllers\Api\Workspaces\TicketQueueController;
use App\Http\Controllers\Api\Workspaces\TicketRelatedTicketController;
use App\Http\Controllers\Api\Workspaces\TicketTagController;
use App\Http\Controllers\Api\Workspaces\TicketTypeController;
use App\Http\Controllers\Api\Workspaces\TicketWatcherController;
use App\Http\Controllers\Api\Workspaces\WebhookEndpointController;
use App\Http\Controllers\Api\Workspaces\WorkflowController;
use App\Http\Controllers\Api\Workspaces\WorkspaceAccessController;
use App\Http\Controllers\Api\Workspaces\WorkspaceController;
use App\Http\Controllers\Api\Workspaces\WorkspaceInvitationController;
use App\Http\Controllers\Api\Workspaces\WorkspaceMemberController;
use App\Http\Controllers\Api\Workspaces\WorkspaceRoleController;
use App\Http\Controllers\Api\Workspaces\WorkspaceSettingsController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/sso/oidc/callback', [SsoController::class, 'oidcCallback']);
Route::post('/workspaces/{workspace}/auth/sso/saml/acs', [SsoController::class, 'samlAcs']);
Route::middleware(['scim_auth', 'throttle:scim'])->prefix('/scim/v2')->group(function (): void {
    Route::get('/Users', [ScimUserController::class, 'index']);
    Route::post('/Users', [ScimUserController::class, 'store']);
    Route::patch('/Users/{id}', [ScimUserController::class, 'patch']);
    Route::get('/Groups', [ScimGroupController::class, 'index']);
    Route::post('/Groups', [ScimGroupController::class, 'store']);
    Route::patch('/Groups/{id}', [ScimGroupController::class, 'patch']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/workspaces', [WorkspaceController::class, 'index']);
    Route::post('/workspaces', [WorkspaceController::class, 'store']);
    Route::post('/invitations/accept', [InvitationAcceptanceController::class, 'store']);

    Route::prefix('/workspaces/{workspace}')
        ->middleware(['workspace_member', 'tenant_network', 'throttle:tenant-api'])
        ->group(function (): void {
            Route::get('/access', [WorkspaceAccessController::class, 'show']);

            Route::get('/settings/general', [WorkspaceSettingsController::class, 'general'])
                ->middleware('workspace_permission:workspace.manage');
            Route::patch('/settings/general', [WorkspaceSettingsController::class, 'updateGeneral'])
                ->middleware('workspace_permission:workspace.manage');
            Route::get('/settings/ticketing', [WorkspaceSettingsController::class, 'ticketing'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/settings/ticketing', [WorkspaceSettingsController::class, 'updateTicketing'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/ticket-queues', [TicketQueueController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/ticket-queues', [TicketQueueController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/ticket-queues/{queue}', [TicketQueueController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/ticket-categories', [TicketCategoryController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/ticket-categories', [TicketCategoryController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/ticket-categories/{category}', [TicketCategoryController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/ticket-tags', [TicketTagController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/ticket-tags', [TicketTagController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/ticket-tags/{tag}', [TicketTagController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/ticket-types', [TicketTypeController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/ticket-types', [TicketTypeController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/ticket-types/{type}', [TicketTypeController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/ticket-custom-fields', [TicketCustomFieldController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/ticket-custom-fields', [TicketCustomFieldController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/ticket-custom-fields/{field}', [TicketCustomFieldController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/ticket-form-templates', [TicketFormTemplateController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/ticket-form-templates', [TicketFormTemplateController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/ticket-form-templates/{template}', [TicketFormTemplateController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/customers', [CustomerController::class, 'index'])
                ->middleware('workspace_permission:customers.view');
            Route::post('/customers', [CustomerController::class, 'store'])
                ->middleware('workspace_permission:customers.manage');
            Route::get('/customers/{customer}', [CustomerController::class, 'show'])
                ->middleware('workspace_permission:customers.view');
            Route::patch('/customers/{customer}', [CustomerController::class, 'update'])
                ->middleware('workspace_permission:customers.manage');
            Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])
                ->middleware('workspace_permission:customers.manage');

            Route::get('/tickets', [TicketController::class, 'index'])
                ->middleware('workspace_permission:tickets.view');
            Route::post('/tickets', [TicketController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/tickets/bulk', [TicketController::class, 'bulkUpdate'])
                ->middleware('workspace_permission:tickets.manage');
            Route::get('/tickets/{ticket}', [TicketController::class, 'show'])
                ->middleware('workspace_permission:tickets.view');
            Route::patch('/tickets/{ticket}', [TicketController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');
            Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy'])
                ->middleware('workspace_permission:tickets.manage');
            Route::get('/tickets/{ticket}/activity', [TicketController::class, 'activity'])
                ->middleware('workspace_permission:tickets.view');
            Route::get('/tickets/{ticket}/watchers', [TicketWatcherController::class, 'index'])
                ->middleware('workspace_permission:tickets.view');
            Route::post('/tickets/{ticket}/watchers', [TicketWatcherController::class, 'store'])
                ->middleware('workspace_permission:tickets.comment');
            Route::delete('/tickets/{ticket}/watchers/{watcher}', [TicketWatcherController::class, 'destroy'])
                ->middleware('workspace_permission:tickets.comment');
            Route::get('/tickets/{ticket}/related-tickets', [TicketRelatedTicketController::class, 'index'])
                ->middleware('workspace_permission:tickets.view');
            Route::post('/tickets/{ticket}/related-tickets', [TicketRelatedTicketController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::delete('/tickets/{ticket}/related-tickets/{relatedTicket}', [TicketRelatedTicketController::class, 'destroy'])
                ->middleware('workspace_permission:tickets.manage');
            Route::get('/tickets/{ticket}/checklist-items', [TicketChecklistItemController::class, 'index'])
                ->middleware('workspace_permission:tickets.view');
            Route::post('/tickets/{ticket}/checklist-items', [TicketChecklistItemController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/tickets/{ticket}/checklist-items/reorder', [TicketChecklistItemController::class, 'reorder'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/tickets/{ticket}/checklist-items/{checklistItem}', [TicketChecklistItemController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');
            Route::delete('/tickets/{ticket}/checklist-items/{checklistItem}', [TicketChecklistItemController::class, 'destroy'])
                ->middleware('workspace_permission:tickets.manage');
            Route::get('/tickets/{ticket}/comments', [TicketCommentController::class, 'index'])
                ->middleware('workspace_permission:tickets.view');
            Route::post('/tickets/{ticket}/comments', [TicketCommentController::class, 'store'])
                ->middleware('workspace_permission:tickets.comment');
            Route::patch('/tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'update'])
                ->middleware('workspace_permission:tickets.comment');
            Route::delete('/tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'destroy'])
                ->middleware('workspace_permission:tickets.comment');
            Route::get('/tickets/{ticket}/attachments', [TicketAttachmentController::class, 'index'])
                ->middleware('workspace_permission:tickets.view');
            Route::post('/tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store'])
                ->middleware('workspace_permission:tickets.comment');
            Route::get('/tickets/{ticket}/attachments/{attachment}/download', [TicketAttachmentController::class, 'download'])
                ->middleware('workspace_permission:tickets.view');
            Route::delete('/tickets/{ticket}/attachments/{attachment}', [TicketAttachmentController::class, 'destroy'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/invitations', [WorkspaceInvitationController::class, 'store'])
                ->middleware('workspace_permission:invitations.manage');
            Route::get('/invitations', [WorkspaceInvitationController::class, 'index'])
                ->middleware('workspace_permission:invitations.manage');
            Route::post('/invitations/{invitation}/cancel', [WorkspaceInvitationController::class, 'cancel'])
                ->middleware('workspace_permission:invitations.manage');
            Route::get('/members', [WorkspaceMemberController::class, 'index'])
                ->middleware('workspace_permission:members.manage');
            Route::get('/roles', [WorkspaceRoleController::class, 'index'])
                ->middleware('workspace_permission:roles.manage');

            Route::get('/security-policy', [TenantSecurityPolicyController::class, 'show'])
                ->middleware('workspace_permission:security.manage');
            Route::patch('/security-policy', [TenantSecurityPolicyController::class, 'update'])
                ->middleware('workspace_permission:security.manage');

            Route::get('/identity-providers', [TenantIdentityProviderController::class, 'index'])
                ->middleware('workspace_permission:security.manage');
            Route::post('/identity-providers', [TenantIdentityProviderController::class, 'store'])
                ->middleware('workspace_permission:security.manage');
            Route::delete('/identity-providers/{provider}', [TenantIdentityProviderController::class, 'destroy'])
                ->middleware('workspace_permission:security.manage');
            Route::post('/auth/sso/oidc/start', [SsoController::class, 'startOidc'])
                ->middleware('workspace_permission:security.manage');

            Route::get('/provisioning-directories', [ProvisioningDirectoryController::class, 'index'])
                ->middleware('workspace_permission:security.manage');
            Route::post('/provisioning-directories', [ProvisioningDirectoryController::class, 'store'])
                ->middleware('workspace_permission:security.manage');

            Route::get('/sla-policies', [SlaPolicyController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/sla-policies', [SlaPolicyController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/workflows', [WorkflowController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/workflows', [WorkflowController::class, 'store'])
                ->middleware('workspace_permission:tickets.manage');
            Route::patch('/workflows/{workflow}', [WorkflowController::class, 'update'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/workflows/{workflow}/activate', [WorkflowController::class, 'activate'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/tickets/{ticket}/transition', [WorkflowController::class, 'transition'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/tickets/{ticket}/workflow/simulate', [WorkflowController::class, 'simulate'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/approvals', [ApprovalController::class, 'index'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/approvals/{approval}/approve', [ApprovalController::class, 'approve'])
                ->middleware('workspace_permission:tickets.manage');
            Route::post('/approvals/{approval}/reject', [ApprovalController::class, 'reject'])
                ->middleware('workspace_permission:tickets.manage');

            Route::get('/automation-rules', [AutomationRuleController::class, 'index'])
                ->middleware('workspace_permission:automation.manage');
            Route::post('/automation-rules', [AutomationRuleController::class, 'store'])
                ->middleware('workspace_permission:automation.manage');
            Route::patch('/automation-rules/{rule}', [AutomationRuleController::class, 'update'])
                ->middleware('workspace_permission:automation.manage');
            Route::post('/automation-rules/{rule}/test', [AutomationRuleController::class, 'test'])
                ->middleware('workspace_permission:automation.manage');
            Route::post('/automation-rules/{rule}/toggle', [AutomationRuleController::class, 'toggle'])
                ->middleware('workspace_permission:automation.manage');
            Route::get('/automation-executions', [AutomationRuleController::class, 'executions'])
                ->middleware('workspace_permission:automation.manage');

            Route::get('/reports/overview', [ReportingController::class, 'overview'])
                ->middleware('workspace_permission:reporting.view');

            Route::get('/saved-views', [SavedViewController::class, 'index'])
                ->middleware('workspace_permission:tickets.view');
            Route::post('/saved-views', [SavedViewController::class, 'store'])
                ->middleware('workspace_permission:tickets.view');
            Route::delete('/saved-views/{view}', [SavedViewController::class, 'destroy'])
                ->middleware('workspace_permission:tickets.view');

            Route::get('/webhooks', [WebhookEndpointController::class, 'index'])
                ->middleware('workspace_permission:integrations.manage');
            Route::post('/webhooks', [WebhookEndpointController::class, 'store'])
                ->middleware('workspace_permission:integrations.manage');
            Route::get('/webhook-deliveries', [WebhookEndpointController::class, 'deliveries'])
                ->middleware('workspace_permission:integrations.manage');
            Route::post('/webhook-deliveries/{delivery}/retry', [WebhookEndpointController::class, 'retry'])
                ->middleware('workspace_permission:integrations.manage');

            Route::get('/audit-events', [AuditEventController::class, 'index'])
                ->middleware('workspace_permission:security.manage');
            Route::get('/retention-policies', [RetentionPolicyController::class, 'show'])
                ->middleware('workspace_permission:security.manage');
            Route::patch('/retention-policies', [RetentionPolicyController::class, 'update'])
                ->middleware('workspace_permission:security.manage');
            Route::get('/exports', [TenantExportController::class, 'index'])
                ->middleware('workspace_permission:security.manage');
            Route::post('/exports', [TenantExportController::class, 'store'])
                ->middleware('workspace_permission:security.manage');
            Route::get('/exports/{export}/download', [TenantExportController::class, 'download'])
                ->middleware('workspace_permission:security.manage');
            Route::get('/break-glass/requests', [BreakGlassController::class, 'index'])
                ->middleware('workspace_permission:security.manage');
            Route::post('/break-glass/requests', [BreakGlassController::class, 'store'])
                ->middleware('workspace_permission:security.manage');
            Route::post('/break-glass/requests/{breakGlass}/approve', [BreakGlassController::class, 'approve'])
                ->middleware('workspace_permission:security.manage');
        });

    Route::prefix('/admin')
        ->middleware('platform_admin')
        ->group(function (): void {
            Route::get('/dashboard', AdminDashboardController::class);
            Route::get('/users', AdminUserIndexController::class);
            Route::get('/workspaces', AdminWorkspaceIndexController::class);
            Route::post('/workspaces/{workspace}/suspend', [AdminWorkspaceOperationsController::class, 'suspend']);
            Route::post('/workspaces/{workspace}/reactivate', [AdminWorkspaceOperationsController::class, 'reactivate']);
            Route::patch('/workspaces/{workspace}/limits', [AdminWorkspaceOperationsController::class, 'updateLimits']);
            Route::patch('/workspaces/{workspace}/feature-flags', [AdminWorkspaceOperationsController::class, 'updateFeatureFlags']);
            Route::patch('/workspaces/{workspace}/isolation', [AdminWorkspaceOperationsController::class, 'updateIsolation']);
        });
});
