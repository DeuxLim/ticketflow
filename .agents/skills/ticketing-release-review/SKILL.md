---
name: ticketing-release-review
description: Use before merging, committing, opening a PR, or finalizing larger Ticketing repo changes that span backend, frontend, database, permissions, or API contracts.
---

# Ticketing Release Review

Use this skill as a final review checklist for larger changes.

## Review Checklist

- Confirm changed files match the requested scope.
- Check for unrelated refactors, formatting churn, generated files, dependency output, and accidental edits to non-primary root `app/` or `src/`.
- Confirm backend API routes, request validation, resources, and frontend TypeScript types still agree.
- Confirm workspace, tenant, platform admin, SCIM, SSO, security policy, audit, SLA, automation, and webhook boundaries were not weakened.
- Confirm migrations are present only when schema changes are intended.
- Confirm UI changes handle loading, empty, error, forbidden, and pending states.
- Confirm shadcn/ui usage follows the local shadcn skill and existing aliases.

## Verification Matrix

- Backend-only: run the targeted backend test or `composer test` from `backend/`.
- Frontend-only: run `npm run lint` and `npm run build` from `frontend/`.
- Full-stack/API-contract: run relevant backend feature tests plus frontend lint/build.
- Docs/tooling-only: read changed docs and verify paths/commands are accurate.

## Final Response

- Report changed areas, not every file.
- Report exact verification commands and results.
- Call out any skipped verification and why.
