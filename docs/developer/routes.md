# Route Reference

This file summarizes the current backend API routes and frontend browser routes.

## Backend API Base

Local API base:

```text
http://127.0.0.1:8000/api
```

Frontend default API base:

```text
http://localhost:8000/api
```

The frontend can override this with:

```text
VITE_API_URL
```

## Public Auth Routes

```text
POST /auth/register
POST /auth/login
```

## Authenticated User Routes

Require `auth:sanctum`.

```text
GET  /auth/me
POST /auth/logout
GET  /workspaces
POST /workspaces
POST /invitations/accept
```

## Workspace Route Rules

Most workspace routes follow this pattern:

```text
/workspaces/{workspace}/...
```

`{workspace}` is the workspace slug.

Workspace routes generally require:

- authenticated user
- workspace membership
- tenant network policy check
- route-specific workspace permission

## Workspace Access and Notifications

```text
GET  /workspaces/{workspace}/access
GET  /workspaces/{workspace}/notifications
POST /workspaces/{workspace}/notifications/read-all
POST /workspaces/{workspace}/notifications/{notification}/read
```

## Workspace Settings

```text
GET   /workspaces/{workspace}/settings/general
PATCH /workspaces/{workspace}/settings/general
GET   /workspaces/{workspace}/settings/ticketing
PATCH /workspaces/{workspace}/settings/ticketing
```

## Ticket Configuration

Queues:

```text
GET   /workspaces/{workspace}/ticket-queues
POST  /workspaces/{workspace}/ticket-queues
PATCH /workspaces/{workspace}/ticket-queues/{queue}
```

Categories:

```text
GET   /workspaces/{workspace}/ticket-categories
POST  /workspaces/{workspace}/ticket-categories
PATCH /workspaces/{workspace}/ticket-categories/{category}
```

Tags:

```text
GET   /workspaces/{workspace}/ticket-tags
POST  /workspaces/{workspace}/ticket-tags
PATCH /workspaces/{workspace}/ticket-tags/{tag}
```

Types:

```text
GET   /workspaces/{workspace}/ticket-types
POST  /workspaces/{workspace}/ticket-types
PATCH /workspaces/{workspace}/ticket-types/{type}
```

Custom fields:

```text
GET   /workspaces/{workspace}/ticket-custom-fields
POST  /workspaces/{workspace}/ticket-custom-fields
PATCH /workspaces/{workspace}/ticket-custom-fields/{field}
```

Form templates:

```text
GET   /workspaces/{workspace}/ticket-form-templates
POST  /workspaces/{workspace}/ticket-form-templates
PATCH /workspaces/{workspace}/ticket-form-templates/{template}
```

## Customers

```text
GET    /workspaces/{workspace}/customers
POST   /workspaces/{workspace}/customers
GET    /workspaces/{workspace}/customers/{customer}
PATCH  /workspaces/{workspace}/customers/{customer}
DELETE /workspaces/{workspace}/customers/{customer}
```

## Tickets

```text
GET    /workspaces/{workspace}/tickets
POST   /workspaces/{workspace}/tickets
PATCH  /workspaces/{workspace}/tickets/bulk
GET    /workspaces/{workspace}/tickets/{ticket}
PATCH  /workspaces/{workspace}/tickets/{ticket}
DELETE /workspaces/{workspace}/tickets/{ticket}
GET    /workspaces/{workspace}/tickets/{ticket}/activity
```

Common ticket query filters:

```text
search
status
priority
customer_id
queue_key
category
assignee_id
page
per_page
```

## Ticket Watchers

```text
GET    /workspaces/{workspace}/tickets/{ticket}/watchers
POST   /workspaces/{workspace}/tickets/{ticket}/watchers
DELETE /workspaces/{workspace}/tickets/{ticket}/watchers/{watcher}
```

## Related Tickets

```text
GET    /workspaces/{workspace}/tickets/{ticket}/related-tickets
POST   /workspaces/{workspace}/tickets/{ticket}/related-tickets
DELETE /workspaces/{workspace}/tickets/{ticket}/related-tickets/{relatedTicket}
```

## Checklist Items

```text
GET    /workspaces/{workspace}/tickets/{ticket}/checklist-items
POST   /workspaces/{workspace}/tickets/{ticket}/checklist-items
PATCH  /workspaces/{workspace}/tickets/{ticket}/checklist-items/reorder
PATCH  /workspaces/{workspace}/tickets/{ticket}/checklist-items/{checklistItem}
DELETE /workspaces/{workspace}/tickets/{ticket}/checklist-items/{checklistItem}
```

## Comments

```text
GET    /workspaces/{workspace}/tickets/{ticket}/comments
POST   /workspaces/{workspace}/tickets/{ticket}/comments
PATCH  /workspaces/{workspace}/tickets/{ticket}/comments/{comment}
DELETE /workspaces/{workspace}/tickets/{ticket}/comments/{comment}
```

## Attachments

```text
GET    /workspaces/{workspace}/tickets/{ticket}/attachments
POST   /workspaces/{workspace}/tickets/{ticket}/attachments
GET    /workspaces/{workspace}/tickets/{ticket}/attachments/{attachment}/download
DELETE /workspaces/{workspace}/tickets/{ticket}/attachments/{attachment}
```

## Invitations, Members, and Roles

```text
POST /workspaces/{workspace}/invitations
GET  /workspaces/{workspace}/invitations
POST /workspaces/{workspace}/invitations/{invitation}/cancel
GET  /workspaces/{workspace}/members
GET  /workspaces/{workspace}/members/assignable
GET  /workspaces/{workspace}/roles
```

## Security and Governance

```text
GET   /workspaces/{workspace}/security-policy
PATCH /workspaces/{workspace}/security-policy
GET   /workspaces/{workspace}/audit-events
GET   /workspaces/{workspace}/retention-policies
PATCH /workspaces/{workspace}/retention-policies
GET   /workspaces/{workspace}/exports
POST  /workspaces/{workspace}/exports
GET   /workspaces/{workspace}/exports/{export}/download
```

These export endpoints are backend-only for now. The main workspace UI hides tenant exports because compliance export workflows are deferred from the medium-ticketing scope.

Retention endpoints are also backend-only for now. The main workspace UI hides retention policy editing because purge and compliance retention workflows are deferred from the medium-ticketing scope.

## SLA, Workflow, Approvals, and Automation

SLA:

```text
GET  /workspaces/{workspace}/sla-policies
POST /workspaces/{workspace}/sla-policies
```

Workflow:

```text
GET   /workspaces/{workspace}/workflows
POST  /workspaces/{workspace}/workflows
PATCH /workspaces/{workspace}/workflows/{workflow}
POST  /workspaces/{workspace}/workflows/{workflow}/activate
POST  /workspaces/{workspace}/tickets/{ticket}/transition
POST  /workspaces/{workspace}/tickets/{ticket}/workflow/simulate
```

Approvals:

```text
GET  /workspaces/{workspace}/approvals
POST /workspaces/{workspace}/approvals/{approval}/approve
POST /workspaces/{workspace}/approvals/{approval}/reject
```

Automation:

```text
GET   /workspaces/{workspace}/automation-rules
POST  /workspaces/{workspace}/automation-rules
PATCH /workspaces/{workspace}/automation-rules/{rule}
POST  /workspaces/{workspace}/automation-rules/{rule}/test
POST  /workspaces/{workspace}/automation-rules/{rule}/toggle
GET   /workspaces/{workspace}/automation-executions
```

## Reporting and Saved Views

Reporting:

```text
GET /workspaces/{workspace}/reports/overview
```

Saved views:

```text
GET    /workspaces/{workspace}/saved-views
POST   /workspaces/{workspace}/saved-views
DELETE /workspaces/{workspace}/saved-views/{view}
```

## Webhooks

```text
GET  /workspaces/{workspace}/webhooks
POST /workspaces/{workspace}/webhooks
GET  /workspaces/{workspace}/webhook-deliveries
POST /workspaces/{workspace}/webhook-deliveries/{delivery}/retry
```

These endpoints are backend-only for now. The main workspace UI hides webhook setup and delivery retry because integrations are deferred from the medium-ticketing scope.

## Platform Admin API

Requires platform admin.

```text
GET   /admin/dashboard
GET   /admin/users
GET   /admin/workspaces
POST  /admin/workspaces/{workspace}/suspend
POST  /admin/workspaces/{workspace}/reactivate
PATCH /admin/workspaces/{workspace}/limits
PATCH /admin/workspaces/{workspace}/feature-flags
PATCH /admin/workspaces/{workspace}/isolation
```

## Frontend Browser Routes

```text
/                                Landing page
/auth/login                       Login
/workspaces/new                   Workspace onboarding
/workspaces/:workspaceSlug        Workspace dashboard
/workspaces/:workspaceSlug/customers
/workspaces/:workspaceSlug/tickets
/workspaces/:workspaceSlug/tickets/:ticketId
/workspaces/:workspaceSlug/members
/workspaces/:workspaceSlug/invitations
/workspaces/:workspaceSlug/settings
/admin                            Platform admin dashboard
```
