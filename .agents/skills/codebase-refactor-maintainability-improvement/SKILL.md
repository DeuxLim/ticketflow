---
name: codebase-refactor-maintainability-improvement
description: Use when auditing, planning, or safely implementing practical refactors for maintainability, architecture clarity, code quality, consistency, scalability, or developer experience in an active product codebase.
---

# Codebase Refactor & Maintainability Improvement

Use this skill to analyze an existing codebase like a senior engineer, software architect, and refactoring specialist. Optimize for long-term product development without breaking current behavior.

## Inputs

Accept optional project context from the user:

- app name
- stack
- architecture notes
- known pain points
- coding conventions
- team size
- project stage
- areas in or out of scope

If context is missing, inspect the repository first and state assumptions explicitly.

Example input:

```md
App name: Ticketing
Stack: Laravel, React, Tailwind, SQL
Known pain points: frontend API types drift from backend resources; workspace permissions are easy to break
Project stage: active product development
Scope: audit and safely refactor high-value issues only
```

## Core Rules

- Preserve behavior unless a change is clearly justified and documented.
- Prefer incremental refactors over rewrites.
- Do not introduce abstraction without practical value.
- Prefer simple, maintainable solutions over clever ones.
- Tie every recommendation or code change to maintainability, readability, scalability, testability, reliability, security, or developer experience.
- Keep the codebase practical for real product development, not academically clean.
- Distinguish between `must fix now`, `should improve soon`, and `okay for now`.
- If the codebase is small, do not force enterprise patterns.
- If the codebase is growing, improve structure before it becomes painful.

## What To Inspect

Inspect the actual repository before recommending changes:

- project structure and architecture boundaries
- naming consistency
- component, module, controller, service, and action responsibilities
- duplicated logic and dead code
- large or overly complex files/functions
- inconsistent patterns
- state management and API/data access patterns
- validation, error handling, and logging patterns
- type safety and explicit contracts
- configuration and environment handling
- security basics and secure defaults
- performance hotspots caused by poor structure
- testability and test coverage
- documentation and onboarding clarity

For this Ticketing repo, also use relevant project skills:

- `ticketing-backend-boundaries` for Laravel tenant, workspace, permission, admin, SCIM, SSO, audit, SLA, automation, webhook, or security-sensitive areas.
- `ticketing-frontend-api` for frontend API, TypeScript resource types, React Query, auth/session, and workspace access.
- `ticketing-ui-patterns` for route views, layouts, shadcn UI, and UI states.
- `ticketing-tests` for test strategy and failing checks.
- `ticketing-release-review` before finalizing larger cross-cutting refactors.

## Analysis Workflow

1. Understand the current codebase and identify active app directories.
2. Identify architectural patterns already in use.
3. Detect code smells, architectural smells, naming smells, risky coupling, hidden complexity, premature abstraction, and maintainability problems.
4. Categorize issues by severity, impact, effort, and risk.
5. Score major recommendations.
6. Propose practical improvements in phases.
7. Prefer high long-term value with controlled risk.
8. Explain tradeoffs where relevant.
9. Implement only the safest valuable refactors directly when the user asked for implementation or the change is clearly in scope.
10. Document what changed, why it changed, and how behavior was preserved.

## Scoring Model

For each major recommendation, score:

- Maintainability Gain: 1-5
- Developer Experience Gain: 1-5
- Risk: 1-5
- Effort: 1-5
- Architectural Value: 1-5

Compute:

```text
Priority Score = (Maintainability Gain + Developer Experience Gain + Architectural Value) - (Risk + Effort)
```

Sort major recommendations by Priority Score, highest first.

## Direct Code Change Rules

When refactoring directly:

- Keep changes small and reviewable.
- Prefer pure extraction, naming cleanup, duplication removal, and local responsibility cleanup before moving files or changing architecture.
- Add or adjust tests when behavior risk exists.
- Do not rewrite the whole app.
- Do not replace working code with a trendy pattern unless the practical value is clear.
- Do not create new shared utilities until at least two real call sites justify them, unless the current duplication is actively harmful.
- Do not make broad folder moves without a migration plan and verification.
- Verify with the smallest relevant checks, then broader checks when the refactor is cross-cutting.

## Required Report Format

Return this structure for audits and refactor plans:

```md
# Codebase Refactor Report

## 1. Current Codebase Understanding
- Summary of architecture:
- Main technologies used:
- Existing patterns:
- Strengths of the current codebase:
- Assumptions / missing context:

## 2. Key Maintainability Problems
- Title:
- Area affected:
- Why it is a problem:
- Risk level: Low / Medium / High
- Long-term impact:
- Recommended fix:
- Estimated effort:
- Priority: Now / Next / Later
- Score: Maintainability Gain X, Developer Experience Gain X, Risk X, Effort X, Architectural Value X, Priority Score X

## 3. Refactor Opportunities
### Quick wins
### Medium refactors
### Structural improvements
### Long-term architectural improvements

For each opportunity:
- Problem:
- Proposed refactor:
- Why this improves long-term development:
- Risk level:
- Effort level:
- Backward compatibility / migration concerns:

## 4. Code Standards to Enforce
- Naming:
- File/folder structure:
- Component/module size:
- Shared utilities:
- Validation:
- API/service layers:
- Error handling:
- State management:
- Testing:
- Configuration:
- Comments/documentation:

## 5. Proposed Target Structure
- Only include if structure changes are justified.

## 6. Safe Refactor Plan
- Phase 1: safest highest-value improvements
- Phase 2: medium structural cleanup
- Phase 3: deeper improvements if still justified

## 7. Direct Code Changes
- What changed:
- Why it changed:
- Long-term problem solved:
- Verification:

## 8. Risks / Anti-Patterns to Avoid
- Avoid:

## 9. Recommended Next Steps
- Top 3 to 7 actions:
```

## Example Output

```md
# Codebase Refactor Report

## 1. Current Codebase Understanding
- Summary of architecture: Laravel API in `backend/`; React SPA in `frontend/`; API calls flow through a shared client.
- Main technologies used: Laravel, Sanctum, React, TypeScript, Tailwind, shadcn/ui.
- Existing patterns: request classes for validation, resources for API output, React Query for server state.
- Strengths of the current codebase: clear backend/frontend split and explicit permission middleware.
- Assumptions / missing context: team size not provided; assuming active product development.

## 2. Key Maintainability Problems
- Title: API resource/type drift risk
- Area affected: backend resources and `frontend/src/types/api.ts`
- Why it is a problem: frontend types can become stale when Laravel resources change.
- Risk level: Medium
- Long-term impact: UI bugs and slower feature work.
- Recommended fix: document API contract checks and update types with resource changes.
- Estimated effort: Small
- Priority: Now
- Score: Maintainability Gain 4, Developer Experience Gain 4, Risk 1, Effort 2, Architectural Value 3, Priority Score 8

## 9. Recommended Next Steps
- Add a lightweight API contract checklist to the feature workflow.
- Refactor only one repeated API pattern first.
- Run backend feature tests plus frontend build after contract changes.
```

## Verification

For analysis-only work, verify by reading the relevant files and citing the areas inspected.

For implemented refactors:

- backend-only: run relevant backend tests from `backend/`
- frontend-only: run `npm run lint` and `npm run build` from `frontend/`
- full-stack/API contract: run relevant backend tests plus frontend lint/build
- docs/tooling-only: read changed files and verify paths/commands are accurate
