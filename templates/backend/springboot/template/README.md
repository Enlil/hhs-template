# {{projectName}} — api (Spring Boot / Java)

Spring Boot 3 (Java 21), configured with YAML (`application.yml`) rather than `.properties`.

<!-- #if lombok -->
Lombok is switched on: the starter code uses `@Slf4j` and `@RequiredArgsConstructor`. If your IDE shows red errors on them, turn on annotation processing (IntelliJ: Settings → Build, Execution, Deployment → Compiler → Annotation Processors). `pom.xml` names Lombok as an annotation processor explicitly (as start.spring.io does too): javac still finds it on its own today, but warns that a future release may stop doing that.
<!-- #endif -->

## Commands

```bash
./mvnw spring-boot:run   # start on port {{backendPort}}
./mvnw clean package     # build a runnable jar into target/
java -jar target/*.jar   # run the built jar
```

No local Maven install is required — `mvnw`/`mvnw.cmd` (the Maven Wrapper) download the pinned Maven version on first run. You do need a **JDK 21+** on `PATH`.

From the generated project root, `npm run dev` / `npm run dev:api` run this via `./apps/api/mvnw spring-boot:run` — see the root README.

## Endpoints

| Method | Path            | Response                                    |
| ------ | --------------- | -------------------------------------------- |
| GET    | `/api/health`   | `{ "status": "ok" }`                          |
| GET    | `/api/example`  | `{ "message": string, "receivedAt": string }` |

Interactive docs (Swagger UI, generated from the same controllers): `http://localhost:{{backendPort}}/api/docs`.

These match [`shared/contracts/openapi.yaml`](../../shared/contracts/openapi.yaml) — the Node and .NET backends implement the same contract, including the `{statusCode, message, error}` shape for validation and unhandled errors (see `exception/GlobalExceptionHandler.java`).

## Structure

- `controller/`, `service/`, `dto/` — one pair of controller/service per route, constructor-injected
- `exception/GlobalExceptionHandler.java` — `@RestControllerAdvice` that turns every error into one JSON shape (keeping Spring's own 404/405/400 statuses) and logs unexpected ones
- `config/CorsConfig.java` — CORS, reading `cors.frontend-url` from `application.yml`
- `src/main/resources/application.yml` — configuration (port, CORS origin); already has the values this project was generated with, which is the idiomatic Spring way to check in non-secret configuration (no `.env` file here, same reasoning as the .NET backend)
