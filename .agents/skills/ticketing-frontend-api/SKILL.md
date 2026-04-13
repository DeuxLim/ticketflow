---
name: ticketing-frontend-api
description: Use when changing frontend API calls, API types, React Query usage, auth/session handling, workspace access checks, or backend resource consumption in this Ticketing repo.
---

# Ticketing Frontend API

Use this skill when frontend changes depend on Laravel API behavior.

## API Contract Workflow

- Inspect `frontend/src/services/api/client.ts` before changing request behavior.
- Keep `apiRequest<T>()` and `apiDownload()` as the central API entry points unless the task requires a new transport path.
- Keep `frontend/src/types/api.ts` aligned with Laravel resources and API envelopes.
- Confirm backend response shapes in relevant Laravel resources before changing TypeScript types.
- Use `ApiEnvelope<T>` and `ApiPaginationMeta` where existing endpoints use wrapped responses.
- Preserve auth token behavior: attach bearer tokens, clear auth on `401`, and keep JSON/FormData header handling intact.

## React Query Rules

- Use object syntax for `useQuery` and `useMutation`.
- Use stable array query keys that include workspace slug or resource identifiers when data is workspace-specific.
- Invalidate or refetch related query keys after mutations.
- Preserve loading, empty, forbidden, and error states near the route/component that owns the UX.

## Workspace Access

- Check `frontend/src/hooks/use-workspace-access.ts`, route guards, and layouts before changing permission-gated UI.
- Do not rely on hidden buttons as authorization; backend permissions must remain authoritative.
- Keep frontend permission strings aligned with backend `workspace_permission:*` middleware.

## Verification

- For frontend API/type changes, run `npm run lint` and `npm run build` from `frontend/`.
- For API contract changes, run the relevant backend feature test from `backend/` as well.
