# create-my-app

A scaffolding system for full-stack apps — not a React app, not an Angular app, not a Node or .NET app. It's a CLI plus a set of independent, mix-and-match templates:

```
npm create my-app@latest
```

```
? Project name: customer-portal
? Frontend framework: React | Angular
? Backend framework: Node.js | .NET
```

...generates a new project with the chosen frontend and backend, already wired to talk to each other, sharing one design language and one API contract.

## Why this exists

Four frontend/backend combinations could be four copy-pasted templates. That doubles (then quadruples) every future change. Instead, the source of truth is:

1. **Shared design tokens** (`templates/shared/design-tokens`) — colors, spacing, typography as plain CSS variables + JSON, consumed identically by both frontends.
2. **Shared API contract** (`templates/shared/contracts/openapi.yaml`) — both backends implement the same routes and response shapes.
3. **Independent framework templates** — React and Angular each get an idiomatic, native implementation of the same UI. Node and .NET each get an idiomatic, native implementation of the same API. Neither pretends to be the other.
4. **A composition engine** (`packages/cli`) — copies whichever frontend + backend the user picked, plus the shared resources, into one new project, then renders `{{placeholders}}`.

Adding Vue or Python later means adding a template and a registry entry — not touching the other three combinations.

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
  shared/
    design-tokens/          tokens.json, tokens.css, tailwind-theme.css
    assets/                 logo.svg
    contracts/              openapi.yaml
    config/                 templates for the generated project's root README/.gitignore/.env.example
```

## Architecture

### The registry, not if/else

`packages/cli/src/registry/{frontends,backends}.ts` each export a `Record<Id, Template>` describing every option: where its source lives, where it's copied to, its dev port and dev command, whether it's an npm workspace member, and (for backends) an optional `postInstall` hook for anything `npm install` can't cover (e.g. `dotnet restore`).

`generate-project.ts` never branches on `if (frontend === 'react')`. It only ever does `frontendRegistry[id]` and treats every template identically: copy it, copy the other one, copy shared resources, render placeholders, install. This is what makes adding a fifth or sixth option additive rather than invasive — see [Adding a frontend](#adding-a-frontend) / [Adding a backend](#adding-a-backend).

### Generation flow

1. Validate the project name (`core/validate-project-name.ts`) and create the directory.
2. Compute template variables once (`projectName`, `packageName`, `dotnetNamespace`, ports, URLs, dev commands — see `registry/types.ts`'s `TemplateVariables`).
3. Copy the chosen frontend template → `apps/web`, the chosen backend template → `apps/api`, and `shared/*` → `shared/*` and into the frontend app's own `src/` (see [Design tokens](#changing-shared-design-tokens) for why there are two copies).
4. Generate the root `package.json` (workspaces + scripts computed from the registry, not hardcoded per combination), `.gitignore`, `.env.example`, `README.md`.
5. Render every `{{placeholder}}` across the whole tree in one pass (`core/render-tree.ts`) — including in file and directory *names*, which is how `{{dotnetNamespace}}.Api.csproj` becomes `CustomerPortal.Api.csproj`.
6. Run `npm install` at the project root (covers the frontend always, and the backend too when it's npm-based) and any backend `postInstall` hook.

### Template placeholders

`{{token}}` is replaced with the matching key from `TemplateVariables` — everywhere: `.ts`, `.tsx`, `.html`, `.css`, `.json`, `.cs`, `.csproj`, `README.md`. There's no separate "some files support variables" rule.

**One real gotcha if you're editing templates:** both JSX (`{{x}}` inside children parses as an object-literal expression container) and Angular templates (`{{ }}` is Angular's own interpolation syntax) can collide with this syntax. The fix used throughout the templates: never write `{{token}}` directly inside JSX children or an Angular template — assign it to a plain `const`/class field first (a plain string literal, no special parsing), then reference that identifier normally (`{APP_NAME}` in JSX, `{{ appName }}` in Angular, where `appName` is *not* one of the CLI's own variable names). See `src/components/Header.tsx` and `src/app/shell/header/header.component.ts` for the pattern.

## CLI usage

Interactive:

```bash
npm create my-app@latest
```

Non-interactive (useful for scripts/CI):

```bash
npm create my-app@latest -- customer-portal --frontend react --backend node
```

Flags: `--frontend <react|angular>`, `--backend <node|dotnet>`, `--skip-install`. Anything not passed as a flag is prompted for.

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

Both apps default to the ports the brief specified — frontend on 3000 (React) or 4200 (Angular's own default), backend on 5000. **On macOS, port 5000 is often already held by the AirPlay Receiver service** (Control Center → AirDrop & Handoff); if the backend fails with `EADDRINUSE`, either disable that or set `PORT` in `apps/api/.env.example`/`.env` (Node) or `Properties/launchSettings.json` (.NET) to something else.

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
npm run test:smoke -w packages/cli  # slow: really runs `npm install` + build for all 4 combinations
```

`npm test` covers all four frontend/backend combinations and asserts: the expected files exist, the *other* frontend/backend's files are absent, no `{{placeholder}}` is left unrendered, and root `package.json` (workspaces, scripts) is correct for that combination. It's fast and hermetic on purpose — no network, no real installs — which is also why it's separate from `test:smoke`.

`test:smoke` generates all four combinations for real, runs `npm install` and a production build for each, and runs `dotnet build` for the .NET combinations *if* the .NET SDK is on `PATH` (skipped with a clear note otherwise, not a failure).

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

Same shape as above, in `templates/backend/<id>/template/` and `registry/backends.ts`'s `BackendId`/`backendRegistry`. If the framework needs an install step `npm install` won't cover (like `dotnet restore`), give its registry entry a `postInstall` hook — see the `dotnet` entry for the pattern (checks the SDK is on `PATH` first, so a missing SDK degrades to a clear message rather than a crash).

### Changing shared design tokens

Edit `templates/shared/design-tokens/tokens.css` (values) and keep `tokens.json` in sync by hand (it's the same values for any non-CSS consumer — currently just documentation, but this is where a build script or Style Dictionary would plug in later). Both frontends `@import` the same `tokens.css` and `tailwind-theme.css` — there's no per-framework copy of the *values*, only of the *files* (see below).

**Why there are two copies of `tokens.css` per generated project:** the CLI copies it to `shared/design-tokens/` (the canonical, framework-neutral reference named in the brief) *and* into `apps/web/src/styles/` (what the frontend app's bundler actually imports). Both copies come from the same template source at generation time, so they can't drift within one generated project — this trades a small duplication in the *output* for avoiding cross-package relative-path imports that are brittle across Vite/Angular's different build tools.

**One CSS constraint worth knowing if you add tokens:** `--breakpoint-*` is deliberately *not* mapped into Tailwind's `@theme` (see the comment in `tailwind-theme.css`) — Tailwind bakes breakpoints into `@media` conditions at build time, and a CSS custom property cannot be used inside a media query. Colors, radius, and shadows work fine as live `var()` references; breakpoints don't.

### Versioning templates

There's no separate version number per template today — the whole repo (and the `create-my-app` package) is versioned together in `packages/cli/package.json`. If templates start needing independent versioning (e.g. so an old generated project's README can point at the exact template revision it came from), the natural extension is stamping the CLI's own version into the generated `README.md` (a `{{cliVersion}}` variable would be a small addition to `TemplateVariables`) rather than versioning each template directory separately — keep the four templates moving together for as long as they share the CLI's release cadence.

## Known limitations

- **No .NET SDK in this environment when this was built** — the `.NET` templates were written carefully and match ASP.NET Core conventions, and `dotnet build` is wired into `test:smoke`, but it has not actually been compiled here. Run `npm run test:smoke` on a machine with the .NET SDK installed to verify before relying on it.
- **NestJS backend intentionally doesn't use `@nestjs/cli`.** It pulls in `@angular-devkit/schematics` transitively, which (as of the versions current when this was built) hit a Node.js `ERR_REQUIRE_CYCLE_MODULE` crash on `nest build` in testing. Separately, `tsx`/esbuild-based dev runners don't reliably emit the `emitDecoratorMetadata` output Nest's constructor injection depends on — a service can end up `undefined` in a controller with no error until it's called. `npm run dev`/`build` use the real TypeScript compiler (`tsc --watch` + `node --watch`) instead. See `templates/backend/node/template/README.md`.
