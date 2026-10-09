# {{projectName}} — web (Angular, Material Design)

Angular (standalone components) + TypeScript, built with [Angular Material](https://material.angular.dev) (Material Design 3) and themed with the HHS-approved design guide, whose values are the shared design tokens in `src/styles/tokens.css`.

## Commands

```bash
npm run dev        # start the dev server on port {{frontendPort}}
npm run build       # production build
npm run typecheck   # type-check only
```

## Structure

- `src/app/shell` — layout pieces (`AppShellComponent`, `HeaderComponent`, `TopNavigationComponent`, `SidebarComponent`, `PageContainerComponent`, `FooterComponent`), made from Material's toolbar and buttons
- `src/app/shared` — the few guide components Angular Material does not have: `AvatarComponent`, `BreadcrumbComponent`, `SnackbarComponent` (shown in the page; for a message that pops up, use Material's `MatSnackBar`), `StepComponent` and `SearchFieldComponent`
- `src/app/pages` — `LoginComponent` (visual only, no auth), `DashboardComponent` (calls the API, and opens a Material dialog), `DesignGuideComponent` (a sample of the style guide) and `PlaceholderComponent`
- `src/app/core` — `ApiService` (matching `shared/contracts/openapi.yaml`), `navigation.ts` (the one list the top navigation, sidebar and routes read from), `ExampleLoader` (loads the API example for the dashboard), `icons.ts` (the Heroicons the app uses) and `design-guide.ts` (the data behind the sample page)
- `src/styles.css` — imports Angular Material's `azure-blue` theme, the copied `tokens.css` and `base.css` (the fonts, and the type scale on plain `h1`–`h4`), then points Material's colour, type and shape variables at those tokens

## The design guide

The look comes from the HHS-approved TEDS UX / UI style guide: its colors, fonts, type scale, shapes and components. The **Design guide** link in the sidebar opens a sample page that shows them, built with Angular Material and this app's own components, so it is also a reference for what you can use.

It is a sample: to remove it, delete `src/app/pages/design-guide` and `src/app/core/design-guide.ts`, take its route out of `src/app/app.routes.ts` and its entry out of `src/app/core/navigation.ts`.

## Using Material components

Buttons, cards, form fields, selects, tabs, chips and dialogs are Angular Material's own: import the module you need (for example `MatButtonModule` from `@angular/material/button`) into a standalone component and use it as the [component docs](https://material.angular.dev/components/categories) show. They pick up the theme automatically: `matButton="filled"` is the guide's primary button, `matButton="tonal"` its secondary (light blue) one and `matButton="outlined"` its tertiary one. A text field is a `mat-form-field appearance="fill"`, with the label written above it (see the login page). The type scale is also available as classes for text that is not a heading: `text-h1` ... `text-content-4`.

## Changing the look

The colors, fonts, type scale and shapes come from `src/styles/tokens.css`. The long `html { ... }` block in `src/styles.css` says which token feeds which Material variable (`--mat-sys-*` for the whole theme, `--mat-button-*`, `--mat-form-field-*` and so on for single components). Anything it does not list comes from the `azure-blue` theme; to use another prebuilt theme, change the first `@import` there.

## Fonts and icons

Roboto and Fira Sans come from the `@fontsource/roboto` and `@fontsource/fira-sans` packages, so nothing is loaded from Google at run time. `src/styles/base.css` loads the Latin alphabet; for others, add the matching file (for example `@fontsource/roboto/latin-ext-400.css`).

Icons are [Heroicons](https://heroicons.com), shown with `<ng-icon name="heroCheckSolid" />`. Register each one you use in `src/app/core/icons.ts` (import it from `@ng-icons/heroicons/solid`, or `/outline`, `/mini`, `/micro`).

## Environment

The API base URL is set in `src/environments/environment.ts` (`apiUrl`) — it's not a secret, so unlike the React app there's no `.env` file to copy.
