# {{projectName}} — api (.NET)

ASP.NET Core Web API (controller-based), targeting `net10.0`.

## Commands

```bash
dotnet restore
dotnet run       # listens on http://localhost:{{backendPort}} (see Properties/launchSettings.json)
dotnet build
```

From the generated project root, `npm run dev` / `npm run dev:api` run this via `dotnet run --project apps/api` — see the root README.

## Endpoints

| Method | Path            | Response                                    |
| ------ | --------------- | -------------------------------------------- |
| GET    | `/api/health`   | `{ "status": "ok" }`                          |
| GET    | `/api/example`  | `{ "message": string, "receivedAt": string }` |

Interactive docs (Swagger UI, generated from the same controllers): `http://localhost:{{backendPort}}/swagger` (Development only).

These match [`shared/contracts/openapi.yaml`](../../shared/contracts/openapi.yaml) — the Node backend implements the same contract, including the `{statusCode, message, error}` shape for validation and unhandled errors (see `Program.cs`'s `InvalidModelStateResponseFactory` and `Middleware/ExceptionHandlingMiddleware.cs`).

## Structure

- `Controllers/`, `Services/`, `Models/` — one pair of controller/service per route, DI-registered in `Program.cs`
- `Middleware/ExceptionHandlingMiddleware.cs` — global exception handling for unhandled errors
- `appsettings.json` / `appsettings.Development.json` — configuration (`Cors:FrontendUrl`); `Properties/launchSettings.json` sets the dev port

## Environment

Unlike the Node backend, this project doesn't use a `.env` file — `appsettings.json` already has the values this project was generated with, which is the idiomatic .NET way to check in non-secret configuration.
