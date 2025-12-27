# Ticketing Frontend

React 19 + Vite frontend for the Ticketing workspace helpdesk application.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router
- TanStack Query

## Local Setup

```bash
npm install
cp .env.example .env
```

## Development

```bash
npm run dev
```

The Laravel API runs separately from `backend/`.

## Verification

```bash
npm run lint
npm run build
npm run test
```

Use existing components from `src/components/ui/` before adding new UI primitives. Keep API types in `src/types/api.ts` aligned with Laravel resources.
