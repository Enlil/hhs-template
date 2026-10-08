# {{projectName}} — web (React)

React + TypeScript + Vite, styled with Tailwind CSS v4 against the HHS-approved design guide, whose values are the shared design tokens in `src/styles/tokens.css`.

## Commands

```bash
npm run dev        # start the dev server on port {{frontendPort}}
npm run build       # type-check and build for production
npm run preview     # preview the production build locally
npm run typecheck   # type-check only
```

## Structure

- `src/components` — the guide's building blocks (`Button`, `Input`, `Textarea`, `Select`, `SearchField`, `Checkbox`, `Radio`, `Tag`, `Breadcrumb`, `Snackbar`, `Step`, `Avatar`, `SegmentedToggle`, `Tabs`, `MenuItem`, `Card`, `Modal`) and layout pieces (`AppShell`, `Header`, `TopNavigation`, `Sidebar`, `PageContainer`, `Footer`)
- `src/pages` — `LoginPage` (visual only, no auth), `DashboardPage` (calls the API), `DesignGuidePage` (a sample of the style guide) and `PlaceholderPage`
- `src/lib` — `config.ts` (reads `VITE_API_URL`), `api.ts` (typed fetch helpers matching `shared/contracts/openapi.yaml`), `navigation.ts` (the one list the top navigation, sidebar and routes read from), `useExample.ts` (loads the API example for the dashboard) and `design-guide.ts` (the data behind the sample page)
- `src/styles` — `index.css`, plus the copied `tokens.css` (the values), `tailwind-theme.css` (turns them into Tailwind classes) and `base.css` (the fonts, and the type scale on plain `h1`–`h4`)

## The design guide

The look comes from the HHS-approved TEDS UX / UI style guide ([in Figma](https://www.figma.com/design/TB0ZJMtSJpwxUxLMaubaT9/B?node-id=805-26)): its colors, fonts, type scale, shapes and components. The **Design guide** link in the sidebar opens a sample page that shows them, built with this app's own components, so it is also a reference for what you can use.

It is a sample: to remove it, delete `src/pages/DesignGuidePage.tsx` and `src/lib/design-guide.ts`, take its route out of `src/App.tsx` and its entry out of `src/lib/navigation.ts`.

## Styling with the tokens

The tokens become Tailwind classes, so use the guide's names:

- colors: `bg-primary`, `text-primary-foreground`, `bg-primary-lighter`, `text-text` / `text-muted` / `text-subtle` (the guide's content high / medium / low), `border-success` / `border-alert` / `border-warning`, and the whole palette (`bg-base-darker`, `bg-gold-30v`...)
- type: `text-h1` ... `text-h4` and `text-content-1` ... `text-content-4` set size, line height and weight together; `font-title` is Roboto (h1 and h2 use it), everything else is Fira Sans
- shapes: `rounded-pill` (buttons), `rounded-xl` (fields), `rounded-md` (cards), `rounded-sm` (tags), `shadow-raised`, and `glass` for a translucent white panel

To change the design everywhere, change the value in `src/styles/tokens.css`.

## Fonts and icons

Roboto and Fira Sans come from the `@fontsource/roboto` and `@fontsource/fira-sans` packages, so nothing is loaded from Google at run time. `src/styles/base.css` loads the Latin alphabet; for others, add the matching file (for example `@fontsource/roboto/latin-ext-400.css`).

Icons are [Heroicons](https://heroicons.com): `import { CheckIcon } from '@heroicons/react/24/solid'`.

## Environment

Copy `.env.example` to `.env` to override the API URL; it otherwise falls back to the value this project was generated with.
