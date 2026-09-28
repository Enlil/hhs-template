import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateProject } from '../src/core/generate-project.js';
import type { BackendId, FrontendId } from '../src/registry/types.js';
import { listFilesRecursive } from './helpers.js';

const COMBINATIONS: Array<{ frontend: FrontendId; backend: BackendId }> = [
  { frontend: 'react', backend: 'node' },
  { frontend: 'react', backend: 'dotnet' },
  { frontend: 'angular', backend: 'node' },
  { frontend: 'angular', backend: 'dotnet' },
];

let workDir: string;

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-test-'));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

describe.each(COMBINATIONS)('generateProject($frontend + $backend)', ({ frontend, backend }) => {
  it('produces the expected structure, with the right templates and no leftover placeholders', async () => {
    const projectName = `test-${frontend}-${backend}`;

    const result = await generateProject({
      projectName,
      frontend,
      backend,
      cwd: workDir,
      skipInstall: true,
    });

    expect(result.projectDir).toBe(path.join(workDir, projectName));
    const files = await listFilesRecursive(result.projectDir);

    // Shared structure present regardless of combination.
    for (const expected of [
      'package.json',
      '.gitignore',
      '.env.example',
      'README.md',
      'shared/design-tokens/tokens.css',
      'shared/design-tokens/tokens.json',
      'shared/design-tokens/tailwind-theme.css',
      'shared/assets/logo.svg',
      'shared/contracts/openapi.yaml',
    ]) {
      expect(files, `expected ${expected} to be generated`).toContain(expected);
    }

    // Correct frontend selected; the other frontend's distinctive files are absent.
    if (frontend === 'react') {
      expect(files).toContain('apps/web/vite.config.ts');
      expect(files).toContain('apps/web/src/main.tsx');
      expect(files.some((f) => f === 'apps/web/angular.json')).toBe(false);
    } else {
      expect(files).toContain('apps/web/angular.json');
      expect(files).toContain('apps/web/src/main.ts');
      expect(files.some((f) => f === 'apps/web/vite.config.ts')).toBe(false);
    }

    // Correct backend selected; the other backend's distinctive files are absent.
    if (backend === 'node') {
      expect(files).toContain('apps/api/src/app.module.ts');
      expect(files).toContain('apps/api/src/main.ts');
      expect(files.some((f) => f.endsWith('.csproj'))).toBe(false);
    } else {
      expect(files).toContain('apps/api/Program.cs');
      expect(files.some((f) => f.endsWith('.csproj'))).toBe(true);
      expect(files.some((f) => f === 'apps/api/src/app.module.ts')).toBe(false);
    }

    // None of *our* placeholders were left unrendered. This checks against the
    // actual registered variable names rather than any `{{...}}` text, because
    // Angular templates legitimately contain their own `{{ expression }}`
    // interpolation syntax (e.g. `{{ appName }}`) for values already
    // substituted one layer up, in the component's .ts source.
    const variableNames = Object.keys(result.variables);
    const leftoverPlaceholder = new RegExp(`\\{\\{\\s*(${variableNames.join('|')})\\s*\\}\\}`);
    for (const relPath of files) {
      const content = await fs.readFile(path.join(result.projectDir, relPath), 'utf8');
      expect(content, `${relPath} should not contain an unreplaced {{placeholder}}`).not.toMatch(leftoverPlaceholder);
    }

    // Root configuration is valid and reflects the chosen combination.
    const rootPkg = JSON.parse(await fs.readFile(path.join(result.projectDir, 'package.json'), 'utf8')) as {
      name: string;
      workspaces: string[];
      scripts: Record<string, string>;
    };
    expect(rootPkg.name).toBe(projectName);
    expect(rootPkg.workspaces).toContain('apps/web');
    expect(rootPkg.workspaces.includes('apps/api')).toBe(backend === 'node');
    expect(rootPkg.scripts.dev).toContain(result.frontend.devCommand);
    expect(rootPkg.scripts.dev).toContain(result.backend.devCommand);

    if (backend === 'dotnet') {
      const namespace = result.variables.dotnetNamespace;
      expect(files).toContain(`apps/api/${namespace}.Api.csproj`);
      const csproj = await fs.readFile(path.join(result.projectDir, 'apps/api', `${namespace}.Api.csproj`), 'utf8');
      expect(csproj).toContain(`<RootNamespace>${namespace}.Api</RootNamespace>`);
    }

    // Placeholder substitution reached every layer (root config, frontend, backend).
    const reactWebManifest = frontend === 'react' ? 'apps/web/package.json' : null;
    if (reactWebManifest) {
      const webPkg = JSON.parse(await fs.readFile(path.join(result.projectDir, reactWebManifest), 'utf8')) as {
        name: string;
      };
      expect(webPkg.name).toBe(`${projectName}-web`);
    }
  });
});
