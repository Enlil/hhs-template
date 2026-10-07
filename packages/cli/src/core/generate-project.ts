import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { copyDir } from './copy-dir.js';
import { installRootDependencies } from './install.js';
import { toDotnetNamespace, toJavaPackageName, toPackageName } from './naming.js';
import { renderTree } from './render-tree.js';
import { resolveTemplatesRoot } from './paths.js';
import { validateProjectName } from './validate-project-name.js';
import { backendRegistry } from '../registry/backends.js';
import { frontendRegistry } from '../registry/frontends.js';
import { allOptions } from '../registry/options.js';
import type { BackendId, BackendTemplate, FrontendId, FrontendTemplate, TemplateVariables } from '../registry/types.js';

export interface GenerateProjectOptions {
  projectName: string;
  frontend: FrontendId;
  backend: BackendId;
  /** Extras to turn on or off, by option id (e.g. `{ lombok: true }`). Anything not listed uses the option's default. */
  options?: Record<string, boolean>;
  /** Directory the project folder is created inside. Defaults to process.cwd(). */
  cwd?: string;
  /** Skip `npm install` / `dotnet restore` — used by tests and power users (--skip-install). */
  skipInstall?: boolean;
  log?: (message: string) => void;
}

export interface GenerateProjectResult {
  projectDir: string;
  frontend: FrontendTemplate;
  backend: BackendTemplate;
  variables: TemplateVariables;
  /** Ids of the options that ended up switched on. */
  options: string[];
  installed: boolean;
}

const COPY_SKIP_NAMES = new Set(['node_modules', '.git', 'dist', 'bin', 'obj', 'target', '.DS_Store']);
const skipOption = { skip: (name: string) => COPY_SKIP_NAMES.has(name) };

// Bumped by hand for now — see README.md "Versioning templates" for why this
// isn't derived from anything more automatic yet.
const APP_VERSION = '0.1.0';

function buildVariables(projectName: string, frontend: FrontendTemplate, backend: BackendTemplate): TemplateVariables {
  return {
    projectName,
    packageName: toPackageName(projectName),
    appVersion: APP_VERSION,
    dotnetNamespace: toDotnetNamespace(projectName),
    javaPackageName: toJavaPackageName(projectName),
    frontendLabel: frontend.label,
    backendLabel: backend.label,
    frontendPort: frontend.devPort,
    backendPort: backend.devPort,
    apiUrl: `http://localhost:${backend.devPort}/api`,
    frontendUrl: `http://localhost:${frontend.devPort}`,
    frontendDevCommand: frontend.devCommand,
    backendDevCommand: backend.devCommand,
    frontendEnvLine: frontend.envDocLine,
    backendEnvLine: backend.envDocLine,
    backendPrerequisiteLine: backend.extraPrerequisite ? `\n- ${backend.extraPrerequisite}` : '',
    backendBuildNote: backend.extraBuildNote ?? '',
  };
}

/** Works out which options are on, and rejects any the chosen frontend/backend doesn't offer. */
function resolveEnabledOptions(
  frontend: FrontendTemplate,
  backend: BackendTemplate,
  requested: Record<string, boolean> = {},
): Set<string> {
  const available = [...(frontend.options ?? []), ...(backend.options ?? [])];
  const availableIds = new Set(available.map((option) => option.id));

  for (const id of Object.keys(requested)) {
    if (!availableIds.has(id)) {
      const offeredBy = allOptions().find((entry) => entry.option.id === id)?.owner.label;
      throw new Error(
        `Option "${id}" isn't available for ${frontend.label} + ${backend.label}.` +
          (offeredBy ? ` It only applies to ${offeredBy}.` : ' There is no such option.'),
      );
    }
  }

  return new Set(available.filter((option) => requested[option.id] ?? option.default).map((option) => option.id));
}

async function writeRootPackageJson(
  projectDir: string,
  variables: TemplateVariables,
  frontend: FrontendTemplate,
  backend: BackendTemplate,
): Promise<void> {
  const workspaces = [frontend, backend].filter((template) => template.workspaceMember).map((template) => template.targetDir);

  const rootPackageJson = {
    name: variables.packageName,
    private: true,
    version: variables.appVersion,
    workspaces,
    scripts: {
      // -k (kill-others): if one side dies (e.g. a port conflict), the other
      // is killed too, instead of lingering and holding its port for the next
      // "npm run dev" attempt.
      dev: `concurrently -k -n web,api -c "blue,green" "${frontend.devCommand}" "${backend.devCommand}"`,
      'dev:web': frontend.devCommand,
      'dev:api': backend.devCommand,
      // Only touches npm workspace members, so a .NET backend is skipped here — see extraBuildNote in the generated README.
      build: 'npm run build --workspaces --if-present',
    },
    devDependencies: {
      concurrently: '^10.0.5',
    },
    // concurrently 10.x pins shell-quote 1.9.0, which has a critical advisory
    // (GHSA-pqg4-j6r4-53mv, fixed in 1.11.0). Forcing a patched version keeps
    // fresh projects clean under `npm audit`. Drop this once concurrently
    // ships a release that depends on shell-quote >= 1.11.
    overrides: {
      'shell-quote': '^1.12.0',
    },
  };

  await fs.writeFile(path.join(projectDir, 'package.json'), `${JSON.stringify(rootPackageJson, null, 2)}\n`, 'utf8');
}

async function writeRootConfigFiles(projectDir: string, sharedConfigDir: string): Promise<void> {
  await fs.copyFile(path.join(sharedConfigDir, 'gitignore'), path.join(projectDir, '.gitignore'));
  await fs.copyFile(path.join(sharedConfigDir, 'env.example'), path.join(projectDir, '.env.example'));
  await fs.copyFile(path.join(sharedConfigDir, 'README.md.tmpl'), path.join(projectDir, 'README.md'));
}

export async function generateProject(options: GenerateProjectOptions): Promise<GenerateProjectResult> {
  const log = options.log ?? (() => {});

  const nameCheck = validateProjectName(options.projectName);
  if (!nameCheck.valid) {
    throw new Error(nameCheck.error);
  }

  const frontend = frontendRegistry[options.frontend];
  const backend = backendRegistry[options.backend];
  if (!frontend) {
    throw new Error(`Unknown frontend "${options.frontend}". Available: ${Object.keys(frontendRegistry).join(', ')}`);
  }
  if (!backend) {
    throw new Error(`Unknown backend "${options.backend}". Available: ${Object.keys(backendRegistry).join(', ')}`);
  }
  const enabledOptions = resolveEnabledOptions(frontend, backend, options.options);

  const cwd = options.cwd ?? process.cwd();
  const projectDir = path.resolve(cwd, options.projectName);

  if (existsSync(projectDir)) {
    const existingEntries = await fs.readdir(projectDir);
    if (existingEntries.length > 0) {
      throw new Error(`Directory "${options.projectName}" already exists and is not empty.`);
    }
  }
  await fs.mkdir(projectDir, { recursive: true });

  const variables = buildVariables(options.projectName, frontend, backend);
  const sharedRoot = path.join(resolveTemplatesRoot(), 'shared');

  log(`Creating ${frontend.label} frontend in ${frontend.targetDir}...`);
  await copyDir(frontend.templateDir, path.join(projectDir, frontend.targetDir), skipOption);

  log(`Creating ${backend.label} backend in ${backend.targetDir}...`);
  await copyDir(backend.templateDir, path.join(projectDir, backend.targetDir), skipOption);

  log('Copying shared design tokens, assets, and API contract...');
  await copyDir(path.join(sharedRoot, 'design-tokens'), path.join(projectDir, 'shared/design-tokens'), skipOption);
  await copyDir(path.join(sharedRoot, 'assets'), path.join(projectDir, 'shared/assets'), skipOption);
  await copyDir(path.join(sharedRoot, 'contracts'), path.join(projectDir, 'shared/contracts'), skipOption);

  // Also drop a working copy of the tokens/assets the frontend app actually
  // imports inside its own src/, so its bundler resolves them as ordinary
  // local files instead of reaching outside its project root. shared/ above
  // remains the canonical, framework-neutral copy per the generated layout.
  await copyDir(path.join(sharedRoot, 'design-tokens'), path.join(projectDir, frontend.targetDir, 'src/styles'), {
    skip: (name) => COPY_SKIP_NAMES.has(name) || name === 'tokens.json',
  });
  await copyDir(path.join(sharedRoot, 'assets'), path.join(projectDir, frontend.targetDir, 'src/assets'), skipOption);

  log('Generating project configuration...');
  await writeRootPackageJson(projectDir, variables, frontend, backend);
  await writeRootConfigFiles(projectDir, path.join(sharedRoot, 'config'));

  log('Applying template variables...');
  await renderTree(projectDir, variables, {
    enabled: enabledOptions,
    known: new Set(allOptions().map((entry) => entry.option.id)),
  });

  let installed = false;
  if (!options.skipInstall) {
    const hasNpmWorkspace = frontend.workspaceMember || backend.workspaceMember;
    if (hasNpmWorkspace) {
      const outcome = installRootDependencies(projectDir, log);
      installed = outcome.succeeded;
    }
    if (backend.postInstall) {
      await backend.postInstall({ projectDir, variables, log });
    }
  }

  return { projectDir, frontend, backend, variables, options: [...enabledOptions], installed };
}
