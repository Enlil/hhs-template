# {{projectName}} — web (React)

React + TypeScript + Vite, styled with Tailwind CSS v4 against the shared design tokens in `src/styles/tokens.css`.

## Commands

```bash
npm run dev        # start the dev server on port {{frontendPort}}
npm run build       # type-check and build for production
npm run preview     # preview the production build locally
npm run typecheck   # type-check only
```

## Structure

- `src/components` — reusable primitives (`Button`, `Input`, `Card`, `Modal`) and layout pieces (`AppShell`, `Header`, `TopNavigation`, `Sidebar`, `PageContainer`)
- `src/pages` — `LoginPage` (visual only, no auth) and `DashboardPage` (calls the API)
- `src/lib` — `config.ts` (reads `VITE_API_URL`) and `api.ts` (typed fetch helpers matching `shared/contracts/openapi.yaml`)
- `src/styles` — global stylesheet plus the copied `tokens.css` / `tailwind-theme.css`

## Environment

Copy `.env.example` to `.env` to override the API URL; it otherwise falls back to the value this project was generated with.
