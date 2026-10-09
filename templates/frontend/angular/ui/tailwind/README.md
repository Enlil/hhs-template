# {{projectName}} — web (Angular)

Angular (standalone components) + TypeScript, styled with Tailwind CSS v4 against the HHS-approved design guide, whose values are the shared design tokens in `src/styles/tokens.css`.

## Commands

```bash
npm run dev        # start the dev server on port {{frontendPort}}
npm run build       # production build
npm run typecheck   # type-check only
```

## Structure

- `src/app/shared` — the guide's building blocks (`ButtonComponent`, `InputComponent`, `TextareaComponent`, `SelectComponent`, `SearchFieldComponent`, `CheckboxComponent`, `RadioComponent`, `TagComponent`, `BreadcrumbComponent`, `SnackbarComponent`, `StepComponent`, `AvatarComponent`, `SegmentedToggleComponent`, `TabsComponent`, `MenuItemComponent`, `CardComponent`, `ModalComponent`)
- `src/app/shell` — layout pieces (`AppShellComponent`, `HeaderComponent`, `TopNavigationComponent`, `SidebarComponent`, `PageContainerComponent`, `FooterComponent`)
- `src/app/pages` — `LoginComponent` (visual only, no auth), `DashboardComponent` (calls the API), `DesignGuideComponent` (a sample of the style guide) and `PlaceholderComponent`
- `src/app/core` — `ApiService` (matching `shared/contracts/openapi.yaml`), `navigation.ts` (the one list the top navigation, sidebar and routes read from), `ExampleLoader` (loads the API example for the dashboard), `icons.ts` (the Heroicons the app uses) and `design-guide.ts` (the data behind the sample page)
- `src/styles` — the copied `tokens.css` (the values), `tailwind-theme.css` (turns them into Tailwind classes) and `base.css` (the fonts, and the type scale on plain `h1`–`h4`), all imported from `src/styles.css`

## The design guide

The look comes from the HHS-approved TEDS UX / UI style guide: its colors, fonts, type scale, shapes and components. The **Design guide** link in the sidebar opens a sample page that shows them, built with this app's own components, so it is also a reference for what you can use.

It is a sample: to remove it, delete `src/app/pages/design-guide` and `src/app/core/design-guide.ts`, take its route out of `src/app/app.routes.ts` and its entry out of `src/app/core/navigation.ts`.

## Styling with the tokens

The tokens become Tailwind classes, so use the guide's names:

- colors: `bg-primary`, `text-primary-foreground`, `bg-primary-lighter`, `text-text` / `text-muted` / `text-subtle` (the guide's content high / medium / low), `border-success` / `border-alert` / `border-warning`, and the whole palette (`bg-base-darker`, `bg-gold-30v`...)
- type: `text-h1` ... `text-h4` and `text-content-1` ... `text-content-4` set size, line height and weight together; `font-title` is Roboto (h1 and h2 use it), everything else is Fira Sans
- shapes: `rounded-pill` (buttons), `rounded-xl` (fields), `rounded-md` (cards), `rounded-sm` (tags), `shadow-raised`, and `glass` for a translucent white panel

To change the design everywhere, change the value in `src/styles/tokens.css`.

One thing to know: a component's own styles outrank Tailwind's classes (Tailwind's sit in a CSS layer), so a Tailwind color class on a third-party element such as `<ng-icon>` can lose. Use the element's own input instead, as `SnackbarComponent` does with `[color]`.

## Fonts and icons

Roboto and Fira Sans come from the `@fontsource/roboto` and `@fontsource/fira-sans` packages, so nothing is loaded from Google at run time. `src/styles/base.css` loads the Latin alphabet; for others, add the matching file (for example `@fontsource/roboto/latin-ext-400.css`).

Icons are [Heroicons](https://heroicons.com), shown with `<ng-icon name="heroCheckSolid" />`. Register each one you use in `src/app/core/icons.ts` (import it from `@ng-icons/heroicons/solid`, or `/outline`, `/mini`, `/micro`).

## Environment

The API base URL is set in `src/environments/environment.ts` (`apiUrl`) — it's not a secret, so unlike the React app there's no `.env` file to copy.
