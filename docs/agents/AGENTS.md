# Project Agent Instructions

## Project Overview

- Backend: Laravel 12 application in `backend/`.
- Frontend: React 19, Vite, Tailwind CSS, and shadcn/ui application in `frontend/`.
- Keep this file as the single project guidance file under `docs/agents/` for now. Do not add nested `backend/AGENTS.md` or `frontend/AGENTS.md` unless the instructions become too large to manage here.

## Important Paths

- Use `backend/` for Laravel application code, routes, migrations, seeders, and tests.
- Use `frontend/` for React application code, shadcn components, Tailwind styling, and frontend tests/checks.
- Treat root-level `app/` and `src/` as non-primary unless a task explicitly targets them.
- Do not edit generated or dependency output such as `node_modules/`, `backend/vendor/`, `frontend/node_modules/`, `frontend/dist/`, or build/cache directories unless explicitly requested.

## Communication Style

- Be direct, concise, and structured.
- Focus on the root cause first when debugging.
- Explain technical terms simply the first time they matter.
- For multi-step guidance, give a short overview, then only the next actionable step unless implementation has already been requested.

## Development Rules

- Keep changes scoped to the requested behavior.
- Preserve existing project patterns before introducing new abstractions.
- Avoid unrelated refactors, formatting churn, and speculative cleanup.
- Prefer clear naming, small functions, and separation of concerns.
- Do not change public API shapes, routes, database schema, or UI behavior unless the task requires it.

## Backend Commands

Run backend commands from `backend/`.

- Install dependencies: `composer install`
- Run tests: `composer test`
- Format PHP when needed: `./vendor/bin/pint`
- Run migrations only when the task includes database changes: `php artisan migrate`
- Start the Laravel dev workflow when needed: `composer run dev`

## Frontend Commands

Run frontend commands from `frontend/`.

- Install dependencies: `npm install`
- Run lint: `npm run lint`
- Run build/type check: `npm run build`
- Start Vite only for browser or UI verification: `npm run dev`

## Frontend Standards

- Use existing shadcn/ui components before writing custom UI primitives.
- Follow `frontend/components.json` aliases: `@/components`, `@/components/ui`, `@/lib`, and `@/hooks`.
- Use semantic Tailwind tokens and existing component variants instead of raw color overrides.
- Prefer `cn()` from `@/lib/utils` for conditional class names.
- Keep layout stable across loading, empty, and error states.
- Avoid rewriting existing shadcn components unless the task explicitly requires component-level changes.

## Skills

- Use the local `ticketing-feature` skill for full-stack Laravel/React feature work or API contract changes.
- Use `ticketing-backend-boundaries` when changing workspace, tenant, permission, admin, SSO, SCIM, audit, SLA, automation, webhook, or security-sensitive backend behavior.
- Use `ticketing-frontend-api` when changing frontend API calls, API types, React Query usage, auth/session handling, workspace access, or backend resource consumption.
- Use `ticketing-ui-patterns` when adding or editing React screens, layouts, route views, workspace/admin/auth UI, or UI states.
- Use `ticketing-tests` when adding, updating, debugging, or reviewing backend feature tests or frontend checks.
- Use `ticketing-release-review` before merging, committing, opening a PR, or finalizing larger cross-cutting changes.
- Use `ticketing-self-improvement` when capturing repeated mistakes, user corrections, failed commands, missing repo knowledge, workflow gaps, or proposed updates to project instructions and skills.
- Use `project-source-of-truth-manager` when initializing, updating, validating, summarizing, or resuming the canonical roadmap/project-state source of truth.
- Use `codebase-refactor-maintainability-improvement` when auditing, planning, or safely implementing maintainability, architecture, consistency, scalability, or developer-experience refactors.
- Use the local shadcn skill for shadcn/ui work or any task involving `frontend/components.json`.
- Use debugging workflows for bugs: reproduce first, identify the cause, then patch.
- Use test-driven or regression-test workflows for behavior changes when practical.
- Use review and verification workflows before reporting implementation work as complete.

## Subagents

- Use subagents only when explicitly requested.
- Prefer subagents for parallel codebase exploration, review, test-gap analysis, or independent research.
- Avoid parallel file edits unless each subagent has clearly separated file ownership.
- Consolidate subagent findings before making implementation decisions.

## Git Workflow

- After making code or documentation changes, commit and push them unless the user explicitly says not to.
- Before committing, run the relevant checks when practical and mention any checks that were skipped.
- Do not commit temporary debug edits, generated clutter, or unrelated local changes.

## Definition of Done

- Run the smallest relevant verification commands for the files changed.
- For backend changes, prefer `composer test`; add targeted PHPUnit commands when narrower checks are enough.
- For frontend changes, prefer `npm run lint` and `npm run build`.
- For docs-only changes, read the changed file and confirm paths and commands match the repo.
- Report the exact commands run and whether they passed or failed.
