---
name: ticketing-backend-boundaries
description: Use when changing Laravel workspace, tenant, permission, admin, SSO, SCIM, audit, SLA, automation, webhook, or security-sensitive backend behavior in this Ticketing repo.
---

# Ticketing Backend Boundaries

Use this skill for backend changes where tenant isolation, permissions, or enterprise security behavior can regress.

## Boundary Checklist

- Start in `backend/routes/api.php`; identify the route group, middleware, and permission string before editing controllers or services.
- Preserve workspace route middleware: `auth:sanctum`, `workspace_member`, `tenant_network`, `throttle:tenant-api`, and the nearest `workspace_permission:*` rule.
- Preserve platform admin separation for `/api/admin/*`; non-admin users must remain forbidden.
- Preserve SCIM isolation under `/api/scim/v2` with `scim_auth` and `throttle:scim`.
- For nested resources, verify the child record belongs to the route workspace before returning or mutating it.
- For SSO, SCIM, security policy, audit, SLA, automation, webhook, and break-glass flows, inspect existing request classes, services, and feature tests before changing behavior.

## Implementation Rules

- Put validation in `backend/app/Http/Requests/` when a request class pattern exists.
- Keep business logic in existing `Actions/` or `Services/` when the nearby code already uses them.
- Return API responses through existing resources or envelope patterns.
- Do not broaden permissions to make a test pass; adjust setup or add the correct permission instead.
- Do not bypass tenant/workspace checks in controllers, services, or model queries.

## Verification

- Add or update focused feature tests in `backend/tests/Feature/` for cross-workspace access, permission denial, and allowed access.
- Prefer a targeted test command first, then `composer test` from `backend/` when the change spans multiple backend domains.
- Check for `assertForbidden`, `assertUnauthorized`, or `assertNotFound` coverage when changing access-control behavior.
