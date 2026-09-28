# {{projectName}} — api (Node.js / NestJS)

NestJS + TypeScript. Global prefix `api`, so all routes below are served under `/api`.

## Commands

```bash
npm run dev        # start with --watch on port {{backendPort}}
npm run build       # compile to dist/
npm start           # run the compiled build
npm run typecheck   # type-check only
```

## Endpoints

| Method | Path            | Response                                    |
| ------ | --------------- | -------------------------------------------- |
| GET    | `/api/health`   | `{ "status": "ok" }`                          |
| GET    | `/api/example`  | `{ "message": string, "receivedAt": string }` |

Interactive docs (Swagger UI, generated from the same decorators): `http://localhost:{{backendPort}}/api/docs`.

These match [`shared/contracts/openapi.yaml`](../../shared/contracts/openapi.yaml) — the .NET backend implements the same contract.

## Structure

- `src/health`, `src/example` — one module per route, each with its own controller/service/DTO
- `src/common/filters` — a global exception filter normalizing all error responses to one JSON shape
- `src/config` — environment variables (`PORT`, `CORS_ORIGIN`), loaded via `@nestjs/config`

There's no `@nestjs/cli` here on purpose: this app is generated fully-formed rather than scaffolded incrementally with `nest generate`, and `npm run dev` runs `tsc --watch` (the real TypeScript compiler) alongside `node --watch`. `esbuild`-based runners like `tsx`/`ts-node-dev` don't reliably emit the `emitDecoratorMetadata` output NestJS's dependency injection relies on — a service can end up `undefined` in a controller's constructor with no error until you call it.

## Environment

Copy `.env.example` to `.env` to override the port or CORS origin; both otherwise fall back to the values this project was generated with.
