---
name: ticketing-tests
description: Use when adding, updating, debugging, or reviewing Laravel feature tests, frontend checks, test data setup, workspace fixtures, auth setup, or regression coverage in this Ticketing repo.
---

# Ticketing Tests

Use this skill for test work in this repository.

## Backend Tests

- Put Laravel behavior coverage in `backend/tests/Feature/` unless the code is isolated enough for a true unit test.
- Use `RefreshDatabase` for database-backed feature tests.
- Use `Sanctum::actingAs($user)` for authenticated API tests.
- Prefer exercising HTTP endpoints over calling controllers directly.
- For workspace behavior, create workspaces through the API when the bootstrap behavior matters.
- Assert tenant boundaries explicitly with `assertForbidden`, `assertUnauthorized`, or `assertNotFound`.
- Verify database side effects with `assertDatabaseHas` or `assertDatabaseMissing` when persistence is part of the behavior.

## Frontend Checks

- Use `npm run lint` for style/static errors.
- Use `npm run build` for TypeScript and production build validation.
- If browser behavior matters, run the dev server and verify the actual route.

## Failure Triage

- Reproduce the failing command first.
- Identify whether failure is test data, authorization, validation, route, API type, or UI state.
- Fix the root cause, not just the assertion.
- Re-run the smallest failing command before broader checks.

## Verification

- Backend: run the targeted PHPUnit/Laravel test first, then `composer test` when the touched surface is broad.
- Frontend: run `npm run lint` and `npm run build` for TSX/type changes.
