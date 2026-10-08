# create-my-app

A scaffolding system for full-stack apps — not a React app, not an Angular app, not a Node or .NET app. It's a CLI plus a set of independent, mix-and-match templates:

```
npm create my-app@latest
```

```
? Project name: customer-portal
? Frontend framework: React | Angular
? Backend framework: Node.js | .NET | Spring Boot (Java)
```

...generates a new project with the chosen frontend and backend, already wired to talk to each other, sharing one design language and one API contract.

Prefer a form to terminal questions? `npm create my-app@latest -- --ui` opens one in your browser, running on your own computer — see [Browser form](#browser-form---ui).

## Why this exists

Four frontend/backend combinations could be four copy-pasted templates. That doubles (then quadruples) every future change. Instead, the source of truth is:

1. **Shared design tokens** (`templates/shared/design-tokens`) — the HHS-approved design guide (colors, fonts, type scale, shapes) as plain CSS variables + JSON, consumed identically by both frontends. See [The HHS design guide](#the-hhs-design-guide).
2. **Shared API contract** (`templates/shared/contracts/openapi.yaml`) — both backends implement the same routes and response shapes.
3. **Independent framework templates** — React and Angular each get an idiomatic, native implementation of the same UI. Node, .NET, and Spring Boot each get an idiomatic, native implementation of the same API. None of them pretends to be another.
4. **A composition engine** (`packages/cli`) — copies whichever frontend + backend the user picked, plus the shared resources, into one new project, then renders `{{placeholders}}`.

Adding Vue or Python later means adding a template and a registry entry — not touching the other five combinations.

## Repository structure

```
packages/
  cli/                     the create-my-app CLI (TypeScript)
    src/
      registry/            frontend & backend template registry (the "config model")
      core/                copy/render engine, validation, install, next-steps
      ui/                  local server behind `--ui`, and the browser opener
      cli.ts, index.ts     interactive prompts + argument parsing
    ui/                    the form page for `--ui` (plain HTML/CSS/JS, no build step)
    tests/                 unit/integration tests + tests/smoke.ts

templates/
  frontend/
    react/
      template/            what every look shares: routes, API client, config, health check
      ui/tailwind/         the Tailwind CSS look: components, pages, styles
      ui/material/         the Material Design look, with MUI
    angular/
      template/            what every look shares: routes, API service, environment, health check
      ui/tailwind/         the Tailwind CSS look: shell, components, pages, styles
      ui/material/         the Material Design look, with Angular Material
  backend/
    node/template/          NestJS + TypeScript
    dotnet/template/         ASP.NET Core Web API
    springboot/template/     Spring Boot 3 + Java (Maven + wrapper, YAML config)
  shared/
    design-tokens/          tokens.css, tokens.json, tailwind-theme.css, base.css
    assets/                 logo.svg, hhs-logo.png, hhs-seal.png
    contracts/              openapi.yaml
    config/                 templates for the generated project's root README/.gitignore/.env.example
```

## Architecture

### The registry, not if/else

`packages/cli/src/registry/{frontends,backends}.ts` each export a `Record<Id, Template>` describing every option: where its source lives, where it's copied to, its dev port and dev command, whether it's an npm workspace member, and (for backends) an optional `postInstall` hook for anything `npm install` can't cover (e.g. `dotnet restore`).

`generate-project.ts` never branches on `if (frontend === 'react')`. It only ever does `frontendRegistry[id]` and treats every template identically: copy it, copy the other one, copy shared resources, render placeholders, install. This is what makes adding a fifth or sixth option additive rather than invasive — see [Adding a frontend](#adding-a-frontend) / [Adding a backend](#adding-a-backend).

### CSS frameworks: a shared template plus one folder each

A frontend is built from two things: `template/`, everything that doesn't depend on how the app looks (routes, the API client, config, the health check, the one list of nav links, and the code that loads the dashboard's data), and one folder per CSS framework under `ui/` (`tailwind`, `material`). The generator copies `template/`, then copies the chosen `ui/<framework>` folder **over** it:

- a file with the same path replaces the template's;
- a `.json` file that the template also has is **merged** into it instead (objects merge key by key; lists and values are replaced) — that is how a folder adds its packages to `package.json`, or changes one budget in `angular.json`, without repeating the whole file.

So the Tailwind look and the Material Design look sit side by side without duplicating the shared parts, and a third look (say Bootstrap) is one more `ui/<name>` folder. The shared files import a few things by path, so every folder has to provide them (a test checks this):

| Frontend | Every `ui/<framework>` folder provides |
| -------- | ---------------------------------------- |
| React    | `src/main.tsx`, `src/components/AppShell.tsx`, `src/pages/{Login,Dashboard,DesignGuide,Placeholder}Page.tsx`, `README.md` |
| Angular  | `src/styles.css`, `src/app/shell/app-shell/app-shell.component.ts`, `src/app/pages/{login,dashboard,design-guide,placeholder}/*.component.ts`, `README.md` |

The registry says which folder a choice uses, and which of the shared design-token files it reads (`layers` in `registry/frontends.ts`), so `generate-project.ts` still never mentions a CSS framework. A test also checks that nothing in `template/` mentions one, so the shared parts stay shared.

The two Material Design looks are different libraries — **MUI** for React, **Angular Material** for Angular — and don't look identical. Both are themed with the HHS design guide (they are built from the shared tokens): MUI gets its theme from `tokens.json`, Angular Material has its `--mat-*` variables pointed at `tokens.css`. But the components themselves are each library's own (buttons, fields and dialogs behave and animate the way MUI or Angular Material do), and MUI keeps its classic Material Design look while Angular Material uses Material Design 3.

### The HHS design guide

Every generated app looks like the HHS-approved TEDS UX / UI style guide by default, in all four looks (React and Angular, each with Tailwind CSS or Material Design). The guide is a Figma file: [TEDS UX / UI Style Guide](https://www.figma.com/design/TB0ZJMtSJpwxUxLMaubaT9/B?node-id=805-26). What is taken from it:

- **Colors** — the whole color system, under its USWDS names (`base-darkest` ... `primary`, `primary-vivid`, `secondary-vivid`, `gold-30v` ...), plus the roles from its "Colors" page: content high / medium / low (`text`, `muted`, `subtle`), the accent colors and the status colors (`success`, `alert`, `warning`).
- **Type** — Roboto for titles (h1, h2) and Fira Sans for everything else, with the guide's scale (h1–h4, content 1–4). Both fonts are installed from the `@fontsource` packages and served by the app itself: nothing is fetched from Google at run time. Only the Latin alphabet is loaded.
- **Shapes and components** — pill buttons (filled, light blue, outlined), white pill fields with the label above, cards with a 16px corner, small square tags, the snackbar with a colored edge, tabs, steps, menu items, breadcrumbs, avatar and toggle. The page itself is a soft blue gradient with translucent white panels on it, as in the guide's app screen.
- **Icons** — [Heroicons](https://heroicons.com), from `@heroicons/react` (React) and `@ng-icons/heroicons` (Angular).

The sidebar has a **Design guide** link: a sample page (`/design-guide`) that shows the guide's type scale, colors (with their tokens and uses), gradients, icons and every component, built with that look's own components, so it doubles as a reference. It is easy to remove (each look's README says how). Its data lives in one file per frontend (`src/lib/design-guide.ts`, `src/app/core/design-guide.ts`); tests check the two copies are identical and that every color and type size in it is the one in `tokens.css`.

**Where the guide disagrees with itself**, and what was chosen (each is one line to change):

- Its written rules approve slab-serif fonts (Arvo, Roboto Slab) for titles, but its Figma components use plain Roboto. The components won: `--font-title` and `--font-body` in `tokens.css` are the two places to change.
- It shows three greens for success: `#00A398` in the color swatch, `#00BC7D` in the label under it and `#21C834` on the snackbar. `#00A398` (the swatch, and `mint-cool-40v` in its color table) is used everywhere.
- Its primary blue is `#005EA2` in the color table but `#005FA3` on the components; `#005EA2` is used. The guide's `secondary-darker` row lists the grey `#A9AEB1` by mistake: the swatch is a dark red, so `#8B0A03` (USWDS `secondary-darker`) is used. Labels under some swatches (Low, Primary - Light) repeat `#1B1B1B`; the swatches themselves are right.
- Where the exact guide color would fail the contrast it asks developers to check (WCAG 2.0 AA), a darker content color is used: the breadcrumb text is "medium", not "low", on the translucent panels.
- The guide's icons come from Heroicons plus a few from Material Design Icons (the select chevron, the sun and moon of the toggle); Heroicons' own `chevron-down`, `sun` and `moon` stand in for those.

Not covered: a dark theme (the guide's toggle is shown as a sample component only), photographs (the avatar shows initials), and the search, notifications and settings icons of its app screen (the header has a search field and an avatar; neither does anything until you wire it up).

### Generation flow

1. Validate the project name (`core/validate-project-name.ts`) and create the directory.
2. Compute template variables once (`projectName`, `packageName`, `appVersion`, `dotnetNamespace`, `javaPackageName`, ports, URLs, dev commands — see `registry/types.ts`'s `TemplateVariables` — plus one per pick-one option, like `javaVersion` and `cssFramework`).
3. Copy the chosen frontend template → `apps/web` and lay the chosen CSS framework's folder over it, copy the chosen backend template → `apps/api`, and `shared/*` → `shared/*` and into the frontend app's own `src/` (see [Design tokens](#changing-shared-design-tokens) for why there are two copies).
4. Generate the root `package.json` (workspaces + scripts computed from the registry, not hardcoded per combination), `.gitignore`, `.env.example`, `README.md`.
5. Render every `{{placeholder}}` across the whole tree in one pass (`core/render-tree.ts`) — including in file and directory *names*, which is how `{{dotnetNamespace}}.Api.csproj` becomes `CustomerPortal.Api.csproj`.
6. Run `npm install` at the project root (covers the frontend always, and the backend too when it's npm-based) and any backend `postInstall` hook.

### Template placeholders

`{{token}}` is replaced with the matching key from `TemplateVariables` — everywhere: `.ts`, `.tsx`, `.html`, `.css`, `.json`, `.cs`, `.csproj`, `README.md`. There's no separate "some files support variables" rule.

**One real gotcha if you're editing templates:** both JSX (`{{x}}` inside children parses as an object-literal expression container) and Angular templates (`{{ }}` is Angular's own interpolation syntax) can collide with this syntax. The fix used throughout the templates: never write `{{token}}` directly inside JSX children or an Angular template — assign it to a plain `const`/class field first (a plain string literal, no special parsing), then reference that identifier normally (`{APP_NAME}` in JSX, `{{ appName }}` in Angular, where `appName` is *not* one of the CLI's own variable names). See `src/components/Header.tsx` and `src/app/shell/header/header.component.ts` for the pattern.

### Options and `#if` markers

Some templates offer settings. They're declared on the template's registry entry (`options: [...]`), come in two kinds, and are decided at generation time. Today: the CSS framework (both frontends), and the Java version and Lombok (Spring Boot):

- **On/off extras** — **Lombok** (`{ kind: 'toggle', id, label, description, default }`). The template files react to it with marker lines, written as ordinary comments so the template stays valid XML/Java/YAML before it's rendered:

  ```
  // #if lombok          <!-- #if lombok -->          # #if lombok
  // #else
  // #endif
  ```

  `#if !lombok` negates. The generator keeps or drops the lines in between, and the marker lines never reach the output. See the Spring template's `pom.xml` and `ExampleController.java` for real use.
- **Pick-one choices** — the **Java version** (`{ kind: 'choice', id, label, description, choices: [{ value, label }, ...], default }`): 25, 21 or 17, with 25 the default. The picked value reaches the template files as a placeholder named after the option — `java-version` becomes `{{javaVersion}}` (see `<java.version>` in the Spring template's `pom.xml`). A registry text such as `extraPrerequisite` can use it too (`JDK {{javaVersion}}+`), and is filled in when the README is written.
- **A choice can also pick a folder of files** — the **CSS framework** (`css-framework`: `tailwind` or `material`, Tailwind the default) is a choice whose values each have a folder to copy over the template, listed in the entry's `layers` (see [CSS frameworks](#css-frameworks-a-shared-template-plus-one-folder-each)). It is still a `{{cssFramework}}` placeholder too.

Rules worth knowing:

- Markers must be a whole line holding a comment in the file's own language (`//`, `#`, or `<!-- -->`). That's also why C#'s real `#if DEBUG` is never mistaken for one.
- `#if` only works with on/off options. A choice is read as a `{{placeholder}}`, so `#if java-version` throws like any unknown name.
- An unknown option name or an unbalanced marker **throws**, naming the file and line, so a typo fails in the tests instead of shipping.
- Option ids are global — they become the CLI flags (`--<id>` / `--no-<id>`, or `--<id> <value>` for a choice) and the marker or placeholder names. The same id on two templates is **one** option: both frontends offer `css-framework` by sharing a single definition (`registry/shared-options.ts`), so there is one `--css-framework` flag and one form control. A test checks that two templates never define the same id differently. A choice's placeholder can't reuse a built-in variable name; generation throws if it would.
- Options compose: two options can both put lines in the same `pom.xml`, which is why this is done with markers rather than overlay folders that replace whole files.
- To add a choice, give the entry a `kind: 'choice'` option and use `{{camelCaseId}}` in the template files — nothing in `generate-project.ts`, the CLI or the browser form needs to change.

## CLI usage

Interactive:

```bash
npm create my-app@latest
```

Non-interactive (useful for scripts/CI):

```bash
npm create my-app@latest -- customer-portal --frontend react --backend node
```

Flags: `--frontend <react|angular>`, `--backend <node|dotnet|springboot>`, `--skip-install`, and one per option: a `--<option>` / `--no-<option>` pair for each on/off extra (currently `--lombok` / `--no-lombok`, Spring Boot only) and `--<option> <value>` for each pick-one choice (currently `--css-framework <tailwind|material>` for either frontend, and `--java-version <25|21|17>` for Spring Boot). Anything not passed as a flag is prompted for — options are only asked about when the chosen stack offers them. With no terminal (CI, pipes) an unspecified option quietly uses its default instead of waiting for input.

```bash
npm create my-app@latest -- customer-portal --frontend react --backend springboot --java-version 21 --lombok
npm create my-app@latest -- customer-portal --frontend angular --backend node --css-framework material
```

**The default Java version is 25, which needs a JDK 25 or newer to build.** On an older JDK, Maven stops with `release version 25 not supported`. So when `npm install` is run (not with `--skip-install`), the CLI checks the JDK on your `PATH` and prints a warning if it is older than the Java version you picked. Fix it by installing a newer JDK (the generated README says which), or generate again with a lower `--java-version`, or edit `<java.version>` in `apps/api/pom.xml` — Spring Boot 3.5 supports Java 17 up to 25.

## Browser form (`--ui`)

Prefer a form to terminal questions? This opens one in your browser:

```bash
npm create my-app@latest -- --ui      # or: npx create-my-app --ui
```

It starts a small server on your own computer (`127.0.0.1`, any free port) and opens the page. The form has the project name, a folder (it starts at the folder you ran the command from), the frontend and backend, any options the chosen stack offers (the CSS framework, the Java version, Lombok), and an "Install dependencies" checkbox. **Generate** writes the project straight into that folder — there's no zip to download — and shows what the generator prints while it runs. When it's done the page shows where the project is and the commands to start it. **Stop the generator** (or Ctrl+C in the terminal) ends it. If no browser opens by itself (no desktop, an SSH session), add `--no-open` and open the printed link yourself.

How it stays in step with the CLI:

- The form is built from the registry, so a new frontend, backend or option shows up in it without anyone touching `packages/cli/ui/`.
- Generate has no code path of its own. The server runs the CLI itself, with the flags that match the form (the page shows the exact command), so the form and the terminal can't drift apart.

Keeping it safe — it can write files, so it isn't a web page you host:

- It listens on `127.0.0.1` only, never on the network. It's meant for a developer's own machine; don't expose it.
- The link holds a random one-time key that every request must carry, and a request with an unexpected `Host` header is refused. That keeps other websites open in your browser from driving it.
- It serves a fixed list of five files, sends a strict Content-Security-Policy (no inline scripts), and creates one project at a time.

`--ui` can't be combined with a project name or the other flags; the form is where you answer those. The page is plain HTML, CSS and JS in `packages/cli/ui/`, the server is in `packages/cli/src/ui/`.

## Generated project

```
customer-portal/
  apps/
    web/            chosen frontend, already calling apps/api
    api/            chosen backend, CORS-configured for apps/web
  shared/
    design-tokens/  canonical copy (framework-neutral reference)
    contracts/      openapi.yaml
  .env.example
  README.md         written for the SPECIFIC combination chosen
```

```bash
cd customer-portal
npm install   # already run by the CLI unless --skip-install
npm run dev   # starts frontend + backend together
```

Both apps default to the ports the brief specified — frontend on 3000 (React) or 4200 (Angular's own default), backend on 5000. **On macOS, port 5000 is often already held by the AirPlay Receiver service** (Control Center → AirDrop & Handoff); if the backend fails with `EADDRINUSE`, either disable that or set `PORT` in `apps/api/.env.example`/`.env` (Node), `Properties/launchSettings.json` (.NET), or `application.yml` (Spring Boot) to something else.

### Health checks and the footer

Every generated app exposes a liveness check, the same shape everywhere (`{"status": "ok"}`): the backend at `GET /api/health` regardless of which one was chosen, and the frontend at `GET /health.json` — a **static file**, not a client-side route, deliberately. A load balancer or container orchestrator probing a single-page app gets `index.html` back for literally any path (that's the SPA fallback), so a JS route tells it nothing about whether the app actually works; a static JSON file answers before any JavaScript runs.

The shell also has a footer showing the app name and version (`apps/web/src/components/Footer.tsx` / `.../shell/footer/footer.component.ts`), sourced from the single `appVersion` template variable so it always matches whatever's in the generated `package.json`/`.csproj`/`pom.xml`.

## Local development (this repo)

```bash
npm install                       # from the repo root; installs the CLI's own deps
npm run build -w packages/cli
npm run dev -w packages/cli -- my-test-app --frontend react --backend node
npm run dev -w packages/cli -- --ui   # try the browser form from source
```

`npm run dev` runs the CLI directly from `src/` via `tsx`, so you don't need to rebuild between changes. (The form page, `packages/cli/ui/`, is read from disk on every request, so a browser refresh shows your edits.)

## Testing

```bash
npm test -w packages/cli          # fast, offline: generation logic + placeholder rendering
npm run test:smoke -w packages/cli  # slow: really runs `npm install` + build for every combination
```

`npm test` covers all twelve frontend / backend / CSS framework combinations, the design tokens (the files that hold them agree) and the design guide's data (it matches the tokens), the Lombok on/off variants, every Java version choice (and the warning for a JDK that is too old, using a stand-in `java`), the folder layering and `package.json` merging, and the `#if` marker processor, and asserts: the expected files exist, every *other* backend's distinctive files are absent, the CSS framework picked has its packages and files while the other one's don't appear anywhere in the app, no `{{placeholder}}` or `#if` marker is left unrendered, and root `package.json` (workspaces, scripts, version) is correct for that combination. It's fast and hermetic on purpose — no network, no real installs — which is also why it's separate from `test:smoke`.

It also covers the browser form (`--ui`): the server's safety rules (one-time key, `Host` check, only its fixed files, loopback only), request validation, one-project-at-a-time, streaming and shutdown, against a stand-in CLI. A few tests run the real CLI through the form's server, and `create-my-app --ui` itself, straight from the TypeScript source via `tsx` — so no build is needed, and the form is checked against the real generator rather than a copy of it.

`test:smoke` generates every combination for real (including Spring Boot with Lombok, and the Material Design look of each frontend), runs `npm install` and a production build for each, and runs `dotnet build` / `./mvnw package` for the .NET / Spring Boot combinations *if* that SDK (`dotnet` / `java`) is on `PATH` (skipped with a clear note otherwise, not a failure). Spring Boot is built for the newest Java version the JDK on `PATH` can handle — the default, 25, needs a JDK 25 — and for each older version too (Java side only), so a JDK 25 machine checks all three.

## Publishing the CLI to npm

`npm create my-app@latest` resolves to the npm package `create-my-app`. To publish:

```bash
cd packages/cli
npm run build
npm publish
```

The `prepack` script (`scripts/copy-templates.mjs`) copies the repo-root `templates/` directory into `packages/cli/templates/` before packing — npm can only publish files inside the package directory, but the templates intentionally live at the repo root (see [Architecture](#architecture)) so they're not nested inside the CLI's own source tree. `packages/cli/templates/` is gitignored; it's a build artifact, not a second source of truth. At runtime, `core/paths.ts` checks both the monorepo layout and the published layout and uses whichever exists.

## Template development

A template is just a directory of real files with occasional `{{placeholders}}` — there's no templating DSL, no `.hbs`/`.ejs` extensions, no build step for templates themselves. Edit `templates/frontend/react/ui/tailwind/src/components/Button.tsx` and it's exactly what gets copied (with placeholders rendered).

To try a template's changes without publishing:

```bash
npm run build -w packages/cli
node packages/cli/dist/index.js test-app --frontend react --backend node
cd test-app && npm run dev
```

### Adding a frontend

1. Create `templates/frontend/<id>/template/` with what every look of that framework shares (routes, API client, config, health check), and one `templates/frontend/<id>/ui/<css-framework>/` folder per CSS framework (`tailwind`, `material`) with the rest: layout, components, pages, styles, and a `package.json` that only adds that framework's packages. Follow the React/Angular templates for the files each folder must provide (see [CSS frameworks](#css-frameworks-a-shared-template-plus-one-folder-each)) and for the design-token conventions ([Changing shared design tokens](#changing-shared-design-tokens)) — don't invent a new mechanism.
2. Add an entry to `frontendRegistry` in `packages/cli/src/registry/frontends.ts`: `id`, `label`, `description`, `templateDir` (via `resolveTemplatesRoot()`), `targetDir` (almost always `apps/web`), `devPort`, `devCommand`, `workspaceMember`, `envDocLine`, plus `options: [cssFrameworkOption]` and a `layers` entry saying which folder each choice uses and which token files it reads.
3. Add `'<id>'` to the `FrontendId` union in `registry/types.ts`.
4. Add the new id to the test matrix in `packages/cli/tests/generate.test.ts`, and its must-provide files to `LAYER_CONTRACT` in `tests/registry.test.ts`.

Nothing in `core/generate-project.ts` changes. (A frontend with only one look can skip the `ui/` folders, `options` and `layers`, and keep everything in `template/`.)

### Adding a backend

Same shape as above, in `templates/backend/<id>/template/` and `registry/backends.ts`'s `BackendId`/`backendRegistry`. If the framework needs an install step `npm install` won't cover (like `dotnet restore` or fetching Maven dependencies), give its registry entry a `postInstall` hook — see the `dotnet` or `springboot` entries for the pattern (checks the SDK is on `PATH` first, so a missing SDK degrades to a clear message rather than a crash).

The `springboot` template is the most recent addition and a good reference for a backend that isn't npm-based: it uses the Maven Wrapper (`mvnw`/`mvnw.cmd`, committed to the template so no local Maven install is required — only a JDK) and YAML configuration (`application.yml`) rather than `.properties`, matching what most teams actually reach for in a new Spring Boot project. Each backend is free to use whatever config format is idiomatic for it — YAML for Spring, `.env` for Node, `appsettings.json` for .NET — there's no requirement that they match. If a backend needs optional extras (Spring's Lombok is the example), list them in the entry's `options` and wrap the lines that differ in `#if` markers; for a pick-one setting (Spring's Java version) use a `choice` option and a `{{placeholder}}` — see [Options and `#if` markers](#options-and-if-markers).

### Changing shared design tokens

The values are in `templates/shared/design-tokens/tokens.css`. Four files live next to it, and each look reads the ones it needs (`tokenFiles` in `registry/frontends.ts`):

- `tokens.css` — the values, as plain CSS variables (the source). Every look gets it.
- `tokens.json` — the same values for code that reads JSON; the MUI theme is built from it.
- `tailwind-theme.css` — maps the variables into Tailwind (`bg-primary`, `text-h1`, `rounded-pill`, a `glass` class...).
- `base.css` — loads the two fonts and puts the guide's type scale on plain `h1`–`h4`, the page background and the focus ring. It sits in a CSS layer, so a CSS framework's own classes still win. Every look gets it.

Nothing generates one file from another, so a change is made in `tokens.css` **and** `tokens.json` (and, for a new color, radius, shadow or type step, `tailwind-theme.css`). A test (`tests/design-tokens.test.ts`) fails if the three disagree: same names, same values, every Tailwind mapping pointing at a real token. This is where a build script or Style Dictionary would plug in later. The looks use them like this:

- **Tailwind** `@import`s `tokens.css`, `tailwind-theme.css` and `base.css`, which turn the variables into utility classes.
- **Angular Material** reads `tokens.css` and `base.css`: its `src/styles.css` points Material's colour, type and shape variables (`--mat-sys-*`, `--mat-button-*`, `--mat-form-field-*` ...) at the token variables.
- **MUI** reads `tokens.css`, `base.css` and **`tokens.json`**: `src/theme.ts` builds the MUI theme from the JSON values. So `tokens.json` is more than documentation — a color changed only in `tokens.css` would not reach the React Material look.

**Why there are two copies of `tokens.css` per generated project:** the CLI copies it to `shared/design-tokens/` (the canonical, framework-neutral reference named in the brief) *and* into `apps/web/src/styles/` (what the frontend app's bundler actually imports). Both copies come from the same template source at generation time, so they can't drift within one generated project — this trades a small duplication in the *output* for avoiding cross-package relative-path imports that are brittle across Vite/Angular's different build tools.

**One CSS constraint worth knowing if you add tokens:** `--breakpoint-*` is deliberately *not* mapped into Tailwind's `@theme` (see the comment in `tailwind-theme.css`) — Tailwind bakes breakpoints into `@media` conditions at build time, and a CSS custom property cannot be used inside a media query. Colors, radius, and shadows work fine as live `var()` references; breakpoints don't.

**A second one, for Angular:** Tailwind's classes live in a CSS layer, and a component's own styles are not in a layer, so they win. A Tailwind color class on a third-party element such as `<ng-icon>` can lose to that element's own styles; use the element's own input (`[color]`) instead.

### Versioning templates

There's no separate version number per template today — the whole repo (and the `create-my-app` package) is versioned together in `packages/cli/package.json`. If templates start needing independent versioning (e.g. so an old generated project's README can point at the exact template revision it came from), the natural extension is stamping the CLI's own version into the generated `README.md` (a `{{cliVersion}}` variable would be a small addition to `TemplateVariables`) rather than versioning each template directory separately — keep the four templates moving together for as long as they share the CLI's release cadence.

## Known limitations

- **The .NET template has never been compiled.** There was no .NET SDK in the environment where this was built. `dotnet build` is wired into `test:smoke` and runs wherever the SDK exists, so run `npm run test:smoke` on a machine that has it before relying on that template.
- **Spring Boot has been built and run for real**, with and without Lombok, on JDK 17 (Zulu 17.0.14), JDK 21 (Temurin 21.0.4) and JDK 23 (OpenJDK 23.0.2, building for Java 21), Maven 3.9.16 via the wrapper: `./mvnw package`, then the jar was started and `/api/health` and `/api/example` answered. On JDK 23 the fuller set was checked too — the 400 validation error, unknown URL (404), wrong method (405), CORS, Swagger docs and an unexpected exception (500, logged with a stack trace). **Java 25, the default, has not been built here: no JDK 25 was available.** Spring Boot's documentation says 3.5.16 supports Java 17 up to 25, and the Lombok (1.18.46) and compiler plugin (3.14.1) versions it manages are recent enough, but run `npm run test:smoke` on a machine with a JDK 25 before relying on it. Only the 3.5.x line is verified; the newer 4.x is available but untested here, so move to it deliberately, not by accident.
- **The two Material Design looks are different libraries, and look different.** React uses MUI (Material UI 9), which keeps the classic Material Design look; its announcement for version 9 doesn't mention Material Design 3 or give a date for it. Angular uses Angular Material, which implements Material Design 3. Both are themed with the HHS design guide (same colors, fonts, type scale and shapes), but buttons, fields, selects and dialogs follow each library: for example the select's arrow is Material's own. Neither loads fonts or icons from the internet (Roboto and Fira Sans come from the `@fontsource` packages, icons are Heroicons). They were checked in a browser (login, dashboard with the live API call, dialog, navigation, the design guide page, the API-down state, a phone-sized screen) and build cleanly; keyboard use and screen-reader behaviour were not tested beyond what the libraries provide. Their bundles are larger (Angular about 870 kB, React about 590 kB, both with the sample design guide page), so their `angular.json` budget and Vite warning limit are raised.
- **The browser form (`--ui`) is a local developer tool, not a hosted site.** It has no login, because it only ever listens on your own machine. Opening the browser by itself uses `open` (macOS), `xdg-open` (Linux) or `rundll32` (Windows); the tests check the first two with a stand-in command, and the Windows launcher has never been run. If it doesn't open for you, `--no-open` prints the link.
- **`shell-quote` override.** The generated root `package.json` forces `shell-quote` to `^1.12.0` because `concurrently` 10.x pins a version with a critical advisory (GHSA-pqg4-j6r4-53mv), which otherwise makes `npm audit` fail on a brand-new project. Drop the override once `concurrently` ships a release that depends on `shell-quote` 1.11 or newer.
- **NestJS backend intentionally doesn't use `@nestjs/cli`.** It pulls in `@angular-devkit/schematics` transitively, which (as of the versions current when this was built) hit a Node.js `ERR_REQUIRE_CYCLE_MODULE` crash on `nest build` in testing. Separately, `tsx`/esbuild-based dev runners don't reliably emit the `emitDecoratorMetadata` output Nest's constructor injection depends on — a service can end up `undefined` in a controller with no error until it's called. `npm run dev`/`build` use the real TypeScript compiler (`tsc --watch` + `node --watch`) instead. See `templates/backend/node/template/README.md`.
