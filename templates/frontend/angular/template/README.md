# {{projectName}} — web (Angular)

Angular (standalone components) + TypeScript, styled with Tailwind CSS v4 against the shared design tokens in `src/styles/tokens.css`.

## Commands

```bash
npm run dev        # start the dev server on port {{frontendPort}}
npm run build       # production build
npm run typecheck   # type-check only
```

## Structure

- `src/app/shared` — reusable primitives (`ButtonComponent`, `InputComponent`, `CardComponent`, `ModalComponent`)
- `src/app/shell` — layout pieces (`AppShellComponent`, `HeaderComponent`, `TopNavigationComponent`, `SidebarComponent`, `PageContainerComponent`)
- `src/app/pages` — `LoginComponent` (visual only, no auth) and `DashboardComponent` (calls the API)
- `src/app/core` — `ApiService`, matching `shared/contracts/openapi.yaml`
- `src/styles` — the copied `tokens.css` / `tailwind-theme.css`, imported from `src/styles.css`

## Environment

The API base URL is set in `src/environments/environment.ts` (`apiUrl`) — it's not a secret, so unlike the React app there's no `.env` file to copy.
