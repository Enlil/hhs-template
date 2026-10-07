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

## Why this exists

Four frontend/backend combinations could be four copy-pasted templates. That doubles (then quadruples) every future change. Instead, the source of truth is:

1. **Shared design tokens** (`templates/shared/design-tokens`) — colors, spacing, typography as plain CSS variables + JSON, consumed identically by both frontends.
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
      cli.ts, index.ts     interactive prompts + argument parsing
    tests/                 unit/integration tests + tests/smoke.ts

templates/
  frontend/
    react/template/        React + Vite + TypeScript
    angular/template/       Angular (standalone components) + TypeScript
  backend/
    node/template/          NestJS + TypeScript
    dotnet/template/         ASP.NET Core Web API
    springboot/template/     Spring Boot 3 + Java (Maven + wrapper, YAML config)
  shared/
    design-tokens/          tokens.json, tokens.css, tailwind-theme.css
    assets/                 logo.svg, hhs-logo.png, hhs-seal.png
    contracts/              openapi.yaml
    config/                 templates for the generated project's root README/.gitignore/.env.example
```

## Architecture

### The registry, not if/else

`packages/cli/src/registry/{frontends,backends}.ts` each export a `Record<Id, Template>` describing every option: where its source lives, where it's copied to, its dev port and dev command, whether it's an npm workspace member, and (for backends) an optional `postInstall` hook for anything `npm install` can't cover (e.g. `dotnet restore`).

`generate-project.ts` never branches on `if (frontend === 'react')`. It only ever does `frontendRegistry[id]` and treats every template identically: copy it, copy the other one, copy shared resources, render placeholders, install. This is what makes adding a fifth or sixth option additive rather than invasive — see [Adding a frontend](#adding-a-frontend) / [Adding a backend](#adding-a-backend).

### Generation flow

1. Validate the project name (`core/validate-project-name.ts`) and create the directory.
2. Compute template variables once (`projectName`, `packageName`, `appVersion`, `dotnetNamespace`, `javaPackageName`, ports, URLs, dev commands — see `registry/types.ts`'s `TemplateVariables`).
3. Copy the chosen frontend template → `apps/web`, the chosen backend template → `apps/api`, and `shared/*` → `shared/*` and into the frontend app's own `src/` (see [Design tokens](#changing-shared-design-tokens) for why there are two copies).
4. Generate the root `package.json` (workspaces + scripts computed from the registry, not hardcoded per combination), `.gitignore`, `.env.example`, `README.md`.
5. Render every `{{placeholder}}` across the whole tree in one pass (`core/render-tree.ts`) — including in file and directory *names*, which is how `{{dotnetNamespace}}.Api.csproj` becomes `CustomerPortal.Api.csproj`.
6. Run `npm install` at the project root (covers the frontend always, and the backend too when it's npm-based) and any backend `postInstall` hook.

### Template placeholders

`{{token}}` is replaced with the matching key from `TemplateVariables` — everywhere: `.ts`, `.tsx`, `.html`, `.css`, `.json`, `.cs`, `.csproj`, `README.md`. There's no separate "some files support variables" rule.

**One real gotcha if you're editing templates:** both JSX (`{{x}}` inside children parses as an object-literal expression container) and Angular templates (`{{ }}` is Angular's own interpolation syntax) can collide with this syntax. The fix used throughout the templates: never write `{{token}}` directly inside JSX children or an Angular template — assign it to a plain `const`/class field first (a plain string literal, no special parsing), then reference that identifier normally (`{APP_NAME}` in JSX, `{{ appName }}` in Angular, where `appName` is *not* one of the CLI's own variable names). See `src/components/Header.tsx` and `src/app/shell/header/header.component.ts` for the pattern.

### Options and `#if` markers

Some templates offer optional extras — today, Spring Boot offers **Lombok**. An option is declared on its registry entry (`options: [{ id, label, description, default }]`) and is switched on or off at generation time. The template files react to it with marker lines, written as ordinary comments so the template stays valid XML/Java/YAML before it's rendered:

```
// #if lombok          <!-- #if lombok -->          # #if lombok
// #else
// #endif
```

`#if !lombok` negates. The generator keeps or drops the lines in between, and the marker lines never reach the output. See the Spring template's `pom.xml` and `ExampleController.java` for real use. Rules worth knowing:

- Markers must be a whole line holding a comment in the file's own language (`//`, `#`, or `<!-- -->`). That's also why C#'s real `#if DEBUG` is never mistaken for one.
- An unknown option name or an unbalanced marker **throws**, naming the file and line, so a typo fails in the tests instead of shipping.
- Option ids are global — they become the CLI flags `--<id>` / `--no-<id>` and the marker names — so keep them unique (a test checks this).
- Options compose: two options can both put lines in the same `pom.xml`, which is why this is done with markers rather than overlay folders that replace whole files.

## CLI usage

Interactive:

```bash
npm create my-app@latest
```

Non-interactive (useful for scripts/CI):

```bash
npm create my-app@latest -- customer-portal --frontend react --backend node
```

Flags: `--frontend <react|angular>`, `--backend <node|dotnet|springboot>`, `--skip-install`, and a `--<option>` / `--no-<option>` pair for each option (currently `--lombok` / `--no-lombok`, Spring Boot only). Anything not passed as a flag is prompted for — options are only asked about when the chosen stack offers them. With no terminal (CI, pipes) an unspecified option quietly uses its default instead of waiting for input.

```bash
npm create my-app@latest -- customer-portal --frontend react --backend springboot --lombok
```

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
```

`npm run dev` runs the CLI directly from `src/` via `tsx`, so you don't need to rebuild between changes.

## Testing

```bash
npm test -w packages/cli          # fast, offline: generation logic + placeholder rendering
npm run test:smoke -w packages/cli  # slow: really runs `npm install` + build for every combination
```

`npm test` covers all six frontend/backend combinations, the Lombok on/off variants, and the `#if` marker processor, and asserts: the expected files exist, every *other* backend's distinctive files are absent, no `{{placeholder}}` or `#if` marker is left unrendered, and root `package.json` (workspaces, scripts, version) is correct for that combination. It's fast and hermetic on purpose — no network, no real installs — which is also why it's separate from `test:smoke`.

`test:smoke` generates every combination for real (including Spring Boot with Lombok), runs `npm install` and a production build for each, and runs `dotnet build` / `./mvnw package` for the .NET / Spring Boot combinations *if* that SDK (`dotnet` / `java`) is on `PATH` (skipped with a clear note otherwise, not a failure).

## Publishing the CLI to npm

`npm create my-app@latest` resolves to the npm package `create-my-app`. To publish:

```bash
cd packages/cli
npm run build
npm publish
```

The `prepack` script (`scripts/copy-templates.mjs`) copies the repo-root `templates/` directory into `packages/cli/templates/` before packing — npm can only publish files inside the package directory, but the templates intentionally live at the repo root (see [Architecture](#architecture)) so they're not nested inside the CLI's own source tree. `packages/cli/templates/` is gitignored; it's a build artifact, not a second source of truth. At runtime, `core/paths.ts` checks both the monorepo layout and the published layout and uses whichever exists.

## Template development

A template is just a directory of real files with occasional `{{placeholders}}` — there's no templating DSL, no `.hbs`/`.ejs` extensions, no build step for templates themselves. Edit `templates/frontend/react/template/src/components/Button.tsx` and it's exactly what gets copied (with placeholders rendered).

To try a template's changes without publishing:

```bash
npm run build -w packages/cli
node packages/cli/dist/index.js test-app --frontend react --backend node
cd test-app && npm run dev
```

### Adding a frontend

1. Create `templates/frontend/<id>/template/` with a working, idiomatic app for that framework. Import `../../../shared/design-tokens` conventions the same way the React/Angular templates do (see [Changing shared design tokens](#changing-shared-design-tokens)) — don't invent a new mechanism.
2. Add an entry to `frontendRegistry` in `packages/cli/src/registry/frontends.ts`: `id`, `label`, `description`, `templateDir` (via `resolveTemplatesRoot()`), `targetDir` (almost always `apps/web`), `devPort`, `devCommand`, `workspaceMember`, `envDocLine`.
3. Add `'<id>'` to the `FrontendId` union in `registry/types.ts`.
4. Add the new id to the test matrix in `packages/cli/tests/generate.test.ts`.

Nothing in `core/generate-project.ts` changes.

### Adding a backend

Same shape as above, in `templates/backend/<id>/template/` and `registry/backends.ts`'s `BackendId`/`backendRegistry`. If the framework needs an install step `npm install` won't cover (like `dotnet restore` or fetching Maven dependencies), give its registry entry a `postInstall` hook — see the `dotnet` or `springboot` entries for the pattern (checks the SDK is on `PATH` first, so a missing SDK degrades to a clear message rather than a crash).

The `springboot` template is the most recent addition and a good reference for a backend that isn't npm-based: it uses the Maven Wrapper (`mvnw`/`mvnw.cmd`, committed to the template so no local Maven install is required — only a JDK) and YAML configuration (`application.yml`) rather than `.properties`, matching what most teams actually reach for in a new Spring Boot project. Each backend is free to use whatever config format is idiomatic for it — YAML for Spring, `.env` for Node, `appsettings.json` for .NET — there's no requirement that they match. If a backend needs optional extras (Spring's Lombok is the example), list them in the entry's `options` and wrap the lines that differ in `#if` markers — see [Options and `#if` markers](#options-and-if-markers).

### Changing shared design tokens

Edit `templates/shared/design-tokens/tokens.css` (values) and keep `tokens.json` in sync by hand (it's the same values for any non-CSS consumer — currently just documentation, but this is where a build script or Style Dictionary would plug in later). Both frontends `@import` the same `tokens.css` and `tailwind-theme.css` — there's no per-framework copy of the *values*, only of the *files* (see below).

**Why there are two copies of `tokens.css` per generated project:** the CLI copies it to `shared/design-tokens/` (the canonical, framework-neutral reference named in the brief) *and* into `apps/web/src/styles/` (what the frontend app's bundler actually imports). Both copies come from the same template source at generation time, so they can't drift within one generated project — this trades a small duplication in the *output* for avoiding cross-package relative-path imports that are brittle across Vite/Angular's different build tools.

**One CSS constraint worth knowing if you add tokens:** `--breakpoint-*` is deliberately *not* mapped into Tailwind's `@theme` (see the comment in `tailwind-theme.css`) — Tailwind bakes breakpoints into `@media` conditions at build time, and a CSS custom property cannot be used inside a media query. Colors, radius, and shadows work fine as live `var()` references; breakpoints don't.

### Versioning templates

There's no separate version number per template today — the whole repo (and the `create-my-app` package) is versioned together in `packages/cli/package.json`. If templates start needing independent versioning (e.g. so an old generated project's README can point at the exact template revision it came from), the natural extension is stamping the CLI's own version into the generated `README.md` (a `{{cliVersion}}` variable would be a small addition to `TemplateVariables`) rather than versioning each template directory separately — keep the four templates moving together for as long as they share the CLI's release cadence.

## Known limitations

- **The .NET template has never been compiled.** There was no .NET SDK in the environment where this was built. `dotnet build` is wired into `test:smoke` and runs wherever the SDK exists, so run `npm run test:smoke` on a machine that has it before relying on that template.
- **Spring Boot has been built and run for real** — OpenJDK 23.0.2, Maven 3.9.16 via the wrapper, with and without Lombok: `./mvnw package`, then the jar was started and `/api/health`, `/api/example` (including the 400 validation error), unknown URL (404), wrong method (405), CORS, Swagger docs and an unexpected exception (500, logged with a stack trace) were all checked. Only the 3.5.x line is verified; the newer 4.x is available but untested here, so move to it deliberately, not by accident.
- **`shell-quote` override.** The generated root `package.json` forces `shell-quote` to `^1.12.0` because `concurrently` 10.x pins a version with a critical advisory (GHSA-pqg4-j6r4-53mv), which otherwise makes `npm audit` fail on a brand-new project. Drop the override once `concurrently` ships a release that depends on `shell-quote` 1.11 or newer.
- **NestJS backend intentionally doesn't use `@nestjs/cli`.** It pulls in `@angular-devkit/schematics` transitively, which (as of the versions current when this was built) hit a Node.js `ERR_REQUIRE_CYCLE_MODULE` crash on `nest build` in testing. Separately, `tsx`/esbuild-based dev runners don't reliably emit the `emitDecoratorMetadata` output Nest's constructor injection depends on — a service can end up `undefined` in a controller with no error until it's called. `npm run dev`/`build` use the real TypeScript compiler (`tsc --watch` + `node --watch`) instead. See `templates/backend/node/template/README.md`.
