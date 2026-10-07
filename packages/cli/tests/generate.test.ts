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
  { frontend: 'react', backend: 'springboot' },
  { frontend: 'angular', backend: 'node' },
  { frontend: 'angular', backend: 'dotnet' },
  { frontend: 'angular', backend: 'springboot' },
];

// Each backend's distinctive marker file(s) — used both to assert the chosen
// backend's files are present, and that every *other* backend's files are absent.
const BACKEND_MARKERS: Record<BackendId, string[]> = {
  node: ['apps/api/src/app.module.ts', 'apps/api/src/main.ts'],
  dotnet: ['apps/api/Program.cs'],
  springboot: ['apps/api/pom.xml', 'apps/api/mvnw'],
};

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
      'shared/assets/hhs-logo.png',
      'shared/assets/hhs-seal.png',
      'shared/contracts/openapi.yaml',
    ]) {
      expect(files, `expected ${expected} to be generated`).toContain(expected);
    }

    // Correct frontend selected; the other frontend's distinctive files are
    // absent. Both expose a static /health.json regardless of framework.
    if (frontend === 'react') {
      expect(files).toContain('apps/web/vite.config.ts');
      expect(files).toContain('apps/web/src/main.tsx');
      expect(files).toContain('apps/web/public/health.json');
      expect(files.some((f) => f === 'apps/web/angular.json')).toBe(false);
    } else {
      expect(files).toContain('apps/web/angular.json');
      expect(files).toContain('apps/web/src/main.ts');
      expect(files).toContain('apps/web/src/health.json');
      expect(files.some((f) => f === 'apps/web/vite.config.ts')).toBe(false);
    }

    // Correct backend selected; every *other* backend's distinctive files are absent.
    for (const marker of BACKEND_MARKERS[backend]) {
      expect(files, `expected ${marker} for backend "${backend}"`).toContain(marker);
    }
    for (const [otherBackend, markers] of Object.entries(BACKEND_MARKERS) as Array<[BackendId, string[]]>) {
      if (otherBackend === backend) continue;
      for (const marker of markers) {
        expect(files, `did not expect ${marker} (belongs to "${otherBackend}")`).not.toContain(marker);
      }
    }

    // None of *our* placeholders were left unrendered. This checks against the
    // actual registered variable names rather than any `{{...}}` text, because
    // Angular templates legitimately contain their own `{{ expression }}`
    // interpolation syntax (e.g. `{{ appName }}`) for values already
    // substituted one layer up, in the component's .ts source.
    const variableNames = Object.keys(result.variables);
    const leftoverPlaceholder = new RegExp(`\\{\\{\\s*(${variableNames.join('|')})\\s*\\}\\}`);
    const leftoverMarker = /^\s*(?:\/\/|#|<!--)\s*#(?:if|else|endif)\b/m;
    const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp']);
    for (const relPath of files) {
      if (binaryExtensions.has(path.extname(relPath))) continue;
      const content = await fs.readFile(path.join(result.projectDir, relPath), 'utf8');
      expect(content, `${relPath} should not contain an unreplaced {{placeholder}}`).not.toMatch(leftoverPlaceholder);
      expect(content, `${relPath} should not contain a leftover "#if" marker line`).not.toMatch(leftoverMarker);
    }

    // Root configuration is valid and reflects the chosen combination.
    const rootPkg = JSON.parse(await fs.readFile(path.join(result.projectDir, 'package.json'), 'utf8')) as {
      name: string;
      version: string;
      workspaces: string[];
      scripts: Record<string, string>;
      overrides?: Record<string, string>;
    };
    expect(rootPkg.name).toBe(projectName);
    expect(rootPkg.version).toBe(result.variables.appVersion);
    // Security: keeps `npm audit` clean (concurrently pins a vulnerable shell-quote). See generate-project.ts.
    expect(rootPkg.overrides?.['shell-quote']).toBeDefined();
    expect(rootPkg.workspaces).toContain('apps/web');
    expect(rootPkg.workspaces.includes('apps/api')).toBe(backend === 'node');
    expect(rootPkg.scripts.dev).toContain(result.frontend.devCommand);
    expect(rootPkg.scripts.dev).toContain(result.backend.devCommand);

    if (backend === 'dotnet') {
      const namespace = result.variables.dotnetNamespace;
      expect(files).toContain(`apps/api/${namespace}.Api.csproj`);
      const csproj = await fs.readFile(path.join(result.projectDir, 'apps/api', `${namespace}.Api.csproj`), 'utf8');
      expect(csproj).toContain(`<RootNamespace>${namespace}.Api</RootNamespace>`);
      expect(csproj).toContain(`<Version>${result.variables.appVersion}</Version>`);
    }

    if (backend === 'springboot') {
      const javaPackageName = result.variables.javaPackageName;
      expect(files).toContain(`apps/api/src/main/java/com/example/${javaPackageName}/Application.java`);
      const pom = await fs.readFile(path.join(result.projectDir, 'apps/api/pom.xml'), 'utf8');
      expect(pom).toContain(`<version>${result.variables.appVersion}</version>`);
      const mvnwStat = await fs.stat(path.join(result.projectDir, 'apps/api/mvnw'));
      // eslint-disable-next-line no-bitwise -- checking the executable bit is the point of this assertion
      expect(mvnwStat.mode & 0o111, 'mvnw should keep its executable bit through generation').not.toBe(0);
    }

    // Placeholder substitution reached every layer (root config, frontend, backend).
    const reactWebManifest = frontend === 'react' ? 'apps/web/package.json' : null;
    if (reactWebManifest) {
      const webPkg = JSON.parse(await fs.readFile(path.join(result.projectDir, reactWebManifest), 'utf8')) as {
        name: string;
        version: string;
      };
      expect(webPkg.name).toBe(`${projectName}-web`);
      expect(webPkg.version).toBe(result.variables.appVersion);
    }
  });
});

describe('Spring Boot "lombok" option', () => {
  async function generate(options?: Record<string, boolean>) {
    return generateProject({
      // Deliberately not "lombok-something": the project name ends up in the pom, README and package names, and these tests search for "lombok".
      projectName: 'option-check',
      frontend: 'react',
      backend: 'springboot',
      cwd: workDir,
      skipInstall: true,
      options,
    });
  }
  type Generated = Awaited<ReturnType<typeof generate>>;

  const readApiFile = (result: Generated, relPath: string): Promise<string> =>
    fs.readFile(path.join(result.projectDir, 'apps/api', relPath), 'utf8');
  const javaFile = (result: Generated, relPath: string): Promise<string> =>
    readApiFile(result, `src/main/java/com/example/${result.variables.javaPackageName}/${relPath}`);

  it('is off by default: no Lombok anywhere, plain constructor and SLF4J logger', async () => {
    const result = await generate();
    expect(result.options).toEqual([]);

    expect(await readApiFile(result, 'pom.xml')).not.toMatch(/lombok/i);
    expect(await readApiFile(result, 'README.md')).not.toMatch(/lombok/i);

    const controller = await javaFile(result, 'controller/ExampleController.java');
    expect(controller).toContain('public ExampleController(ExampleService exampleService)');
    expect(controller).not.toMatch(/lombok/i);

    const handler = await javaFile(result, 'exception/GlobalExceptionHandler.java');
    expect(handler).toContain('LoggerFactory.getLogger(GlobalExceptionHandler.class)');
    expect(handler).not.toMatch(/lombok/i);
  });

  it('when on: pom gets the dependency, processor path and jar exclusion; the code uses Lombok', async () => {
    const result = await generate({ lombok: true });
    expect(result.options).toEqual(['lombok']);

    const pom = await readApiFile(result, 'pom.xml');
    expect(pom.match(/<groupId>org\.projectlombok<\/groupId>/g)).toHaveLength(3); // dependency + processor path + exclude
    expect(pom).toContain('<annotationProcessorPaths>');
    expect(pom).toContain('<excludes>');

    const controller = await javaFile(result, 'controller/ExampleController.java');
    expect(controller).toContain('@RequiredArgsConstructor');
    expect(controller).not.toContain('public ExampleController(');

    const handler = await javaFile(result, 'exception/GlobalExceptionHandler.java');
    expect(handler).toContain('@Slf4j');
    expect(handler).not.toContain('LoggerFactory');

    expect(await readApiFile(result, 'README.md')).toMatch(/Lombok is switched on/);
  });

  it('can be switched off explicitly', async () => {
    const result = await generate({ lombok: false });
    expect(result.options).toEqual([]);
    expect(await readApiFile(result, 'pom.xml')).not.toMatch(/lombok/i);
  });
});
