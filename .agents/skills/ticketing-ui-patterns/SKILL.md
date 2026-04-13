---
name: ticketing-ui-patterns
description: Use when adding or editing React screens, layouts, route views, shadcn UI composition, workspace/admin/auth UI, loading states, empty states, or error states in this Ticketing repo.
---

# Ticketing UI Patterns

Use this skill for app screens and UI behavior in `frontend/`.

## Structure

- Inspect the nearest route file in `frontend/src/routes/` before adding a screen.
- Use existing layouts: `AdminLayout`, `AuthLayout`, and `WorkspaceLayout`.
- Keep workspace screens under the workspace route shape and admin screens under admin routes.
- Use `frontend/src/components/route-guards.tsx` and `frontend/src/hooks/use-workspace-access.ts` for guarded access patterns.

## Components

- Use existing shadcn/ui components from `frontend/src/components/ui/` first.
- Follow `frontend/components.json` aliases: `@/components`, `@/components/ui`, `@/lib`, and `@/hooks`.
- Use the local shadcn skill for component-specific rules.
- Prefer existing app components such as forbidden states before creating new one-off markup.
- Do not rewrite installed shadcn components unless the task explicitly targets the component itself.

## UX States

- Handle loading, empty, forbidden, error, and success states in the owning route/component.
- Keep buttons disabled during pending mutations.
- Keep layouts stable when content changes.
- Use semantic Tailwind tokens and component variants; avoid raw color overrides.

## Verification

- Run `npm run lint` and `npm run build` from `frontend/` for UI changes.
- Use `npm run dev` only when browser verification is needed.
