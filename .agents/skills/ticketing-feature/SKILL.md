---
name: ticketing-feature
description: Use when implementing or modifying features in this Ticketing repo that touch Laravel backend code, React frontend code, or the API contract between them.
---

# Ticketing Feature Workflow

Use this skill for feature work in this repository. Keep the work grounded in the active app directories: `backend/` for Laravel and `frontend/` for React.

## Workflow

1. **Define the behavior**
   - Identify the user-visible behavior and the smallest backend/frontend surface needed.
   - If the task is ambiguous, inspect existing routes, models, services, and UI flows before asking.

2. **Inspect backend first**
   - Check `backend/routes/api.php` and relevant controllers, actions, services, resources, models, migrations, factories, and feature tests.
   - Preserve existing authorization, tenancy, workspace, audit, SLA, webhook, and security boundary patterns.
   - Prefer adding or updating focused feature tests in `backend/tests/Feature/`.

3. **Inspect frontend second**
   - Check `frontend/src/services/api/`, `frontend/src/types/`, `frontend/src/routes/`, layouts, route guards, and the nearest existing screen/component.
   - Keep API response types aligned with Laravel resources.
   - Reuse existing shadcn/ui components from `frontend/src/components/ui/` before creating new primitives.

4. **Implement in sync**
   - Update backend API behavior and frontend consumption together when the contract changes.
   - Do not change API shapes, routes, or database schema unless the feature requires it.
   - Keep changes scoped; avoid unrelated refactors and formatting churn.

5. **Verify**
   - Backend: run the smallest relevant Laravel test, or `composer test` from `backend/` when broader coverage is needed.
   - Frontend: run `npm run lint` and `npm run build` from `frontend/` for UI/type changes.
   - For UI behavior, start `npm run dev` from `frontend/` only when browser verification is needed.
   - Report exact commands run and results.

## Common Checks

- Tenant/workspace access is enforced where existing code expects it.
- Laravel resources and frontend TypeScript types agree.
- Loading, empty, error, and forbidden states remain handled.
- Forms use existing validation and field patterns.
- New UI follows the local shadcn skill and `frontend/components.json` aliases.
