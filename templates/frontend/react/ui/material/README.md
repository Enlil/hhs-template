# {{projectName}} — web (React, Material Design)

React + TypeScript + Vite, built with [Material UI](https://mui.com/material-ui/) (MUI) and themed with the HHS-approved design guide, whose values are the shared design tokens in `src/styles/tokens.json`.

## Commands

```bash
npm run dev        # start the dev server on port {{frontendPort}}
npm run build       # type-check and build for production
npm run preview     # preview the production build locally
npm run typecheck   # type-check only
```

## Structure

- `src/components` — layout pieces (`AppShell`, `Header`, `TopNavigation`, `Sidebar`, `PageContainer`, `Footer`) and the few guide components MUI does not have or draws differently (`Field`, `SelectField`, `SearchField`, `Checkbox`, `Radio`, `Snackbar`, `Step`, `SegmentedToggle`, `PillMenuItem`)
- `src/pages` — `LoginPage` (visual only, no auth), `DashboardPage` (calls the API, and opens a MUI dialog), `DesignGuidePage` (a sample of the style guide) and `PlaceholderPage`
- `src/lib` — `config.ts` (reads `VITE_API_URL`), `api.ts` (typed fetch helpers matching `shared/contracts/openapi.yaml`), `navigation.ts` (the one list the top navigation, sidebar and routes read from), `useExample.ts` (loads the API example for the dashboard) and `design-guide.ts` (the data behind the sample page)
- `src/theme.ts` — the MUI theme, built from `src/styles/tokens.json`: palette, type scale, and how buttons, fields, tabs, tags and the rest look
- `src/styles` — `index.css`, plus the copied `tokens.css`, `tokens.json` and `base.css` (the fonts, and the type scale on plain `h1`–`h4`)

## The design guide

The look comes from the HHS-approved TEDS UX / UI style guide ([in Figma](https://www.figma.com/design/TB0ZJMtSJpwxUxLMaubaT9/B?node-id=805-26)): its colors, fonts, type scale, shapes and components. The **Design guide** link in the sidebar opens a sample page that shows them, built with MUI and this app's own components, so it is also a reference for what you can use.

It is a sample: to remove it, delete `src/pages/DesignGuidePage.tsx` and `src/lib/design-guide.ts`, take its route out of `src/App.tsx` and its entry out of `src/lib/navigation.ts`.

## Using MUI components

Buttons, cards, text fields, tabs, chips and dialogs are MUI's own: import them where you need them (for example `import Button from '@mui/material/Button'`) and use them as the [component docs](https://mui.com/material-ui/all-components/) show. They pick up the theme automatically: `variant="contained"` is the guide's primary button, `variant="contained" color="secondary"` its secondary (light blue) one and `variant="outlined"` its tertiary one. The typography variants are the guide's type scale: `h1` and `h2` (Roboto), `h3`, `h4`, then `body1`, `subtitle2`, `body2` and `caption` for content 1 to 4.

## Changing the look

The colors, corner radii, breakpoints and fonts come from `src/styles/tokens.json` through `src/theme.ts`; keep `tokens.css` in step (a test checks the two agree). Component-wide changes (all buttons, all cards) go in the `components` section of `theme.ts`.

## Fonts and icons

Roboto and Fira Sans come from the `@fontsource/roboto` and `@fontsource/fira-sans` packages, so nothing is loaded from Google at run time. `src/styles/base.css` loads the Latin alphabet; for others, add the matching file (for example `@fontsource/roboto/latin-ext-400.css`).

Icons are [Heroicons](https://heroicons.com): `import { CheckIcon } from '@heroicons/react/24/solid'`.

## Environment

Copy `.env.example` to `.env` to override the API URL; it otherwise falls back to the value this project was generated with.
