import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { resolveTemplatesRoot } from '../core/paths.js';
import type { BackendId, BackendTemplate } from './types.js';

const templatesRoot = resolveTemplatesRoot();

function isOnPath(command: string): boolean {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
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
};

export const backendChoices: BackendTemplate[] = Object.values(backendRegistry);
