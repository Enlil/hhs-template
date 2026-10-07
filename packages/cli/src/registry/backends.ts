import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { resolveTemplatesRoot } from '../core/paths.js';
import type { BackendId, BackendTemplate } from './types.js';

const templatesRoot = resolveTemplatesRoot();

function isOnPath(command: string, versionFlag = '--version'): boolean {
  const result = spawnSync(command, [versionFlag], { stdio: 'ignore' });
  return result.error === undefined && result.status === 0;
}

/**
 * The backend template registry. To add a new backend (e.g. Python/FastAPI),
 * add an entry here pointing at a new `templates/backend/<id>/template`
 * directory — nothing in the CLI's generation engine needs to change. See
 * docs/adding-a-backend.md.
 */
export const backendRegistry: Record<BackendId, BackendTemplate> = {
  node: {
    id: 'node',
    label: 'Node.js',
    description: 'NestJS + TypeScript',
    templateDir: path.join(templatesRoot, 'backend', 'node', 'template'),
    targetDir: 'apps/api',
    devPort: 5000,
    devCommand: 'npm run dev -w apps/api',
    workspaceMember: true,
    healthPath: '/api/health',
    envDocLine: '`apps/api/.env.example` — the backend\'s port and allowed CORS origin',
  },
  dotnet: {
    id: 'dotnet',
    label: '.NET',
    description: 'ASP.NET Core Web API',
    templateDir: path.join(templatesRoot, 'backend', 'dotnet', 'template'),
    targetDir: 'apps/api',
    devPort: 5000,
    devCommand: 'dotnet run --project apps/api',
    // Not an npm package, so it stays out of the generated project's
    // workspaces array and gets its own restore step below.
    workspaceMember: false,
    healthPath: '/api/health',
    envDocLine: '`apps/api/appsettings.Development.json` — the backend\'s port and allowed CORS origin',
    extraPrerequisite: '.NET SDK 10.0+ (https://dotnet.microsoft.com/download)',
    extraBuildNote:
      '\n`npm run build` only builds npm workspace members, so it skips the .NET API. Build it separately:\n\n```bash\ncd apps/api\ndotnet build\n```',
    postInstall: ({ projectDir, log }) => {
      if (!isOnPath('dotnet')) {
        log('Skipped "dotnet restore" — the .NET SDK was not found on your PATH.');
        log('Install it from https://dotnet.microsoft.com/download, then run "dotnet restore" inside apps/api.');
        return;
      }

      log('Restoring .NET packages (dotnet restore)...');
      const apiDir = path.join(projectDir, 'apps/api');
      const result = spawnSync('dotnet', ['restore'], { cwd: apiDir, stdio: 'inherit' });
      if (result.status !== 0) {
        log('Warning: "dotnet restore" did not finish successfully. Retry it manually inside apps/api.');
      }
    },
  },
  springboot: {
    id: 'springboot',
    label: 'Spring Boot (Java)',
    description: 'Spring Boot 3 + Java, configured with YAML',
    templateDir: path.join(templatesRoot, 'backend', 'springboot', 'template'),
    targetDir: 'apps/api',
    devPort: 5000,
    devCommand: './apps/api/mvnw -f apps/api spring-boot:run',
    // Not an npm package, so it stays out of the generated project's
    // workspaces array and gets its own dependency-fetch step below.
    workspaceMember: false,
    healthPath: '/api/health',
    envDocLine: '`apps/api/src/main/resources/application.yml` — the backend\'s port and allowed CORS origin',
    options: [
      {
        id: 'lombok',
        label: 'Lombok',
        description: 'cuts Java boilerplate, e.g. @Slf4j and @RequiredArgsConstructor',
        default: false,
      },
    ],
    extraPrerequisite: 'JDK 21+ (https://adoptium.net) — no local Maven install needed, the bundled Maven Wrapper downloads it',
    extraBuildNote:
      '\n`npm run build` only builds npm workspace members, so it skips the Spring Boot API. Build it separately:\n\n```bash\ncd apps/api\n./mvnw clean package\n```',
    postInstall: ({ projectDir, log }) => {
      if (!isOnPath('java', '-version')) {
        log('Skipped Maven dependency prefetch — no JDK was found on your PATH.');
        log('Install a JDK from https://adoptium.net, then run "./mvnw dependency:go-offline" inside apps/api.');
        return;
      }

      log('Fetching Maven dependencies (this also downloads Maven itself on first run)...');
      const apiDir = path.join(projectDir, 'apps/api');
      const result = spawnSync('./mvnw', ['-q', 'dependency:go-offline'], { cwd: apiDir, stdio: 'inherit' });
      if (result.status !== 0) {
        log('Warning: fetching Maven dependencies did not finish successfully. Retry it manually inside apps/api.');
      }
    },
  },
};

export const backendChoices: BackendTemplate[] = Object.values(backendRegistry);
