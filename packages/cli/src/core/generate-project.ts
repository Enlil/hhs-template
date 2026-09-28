import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { copyDir } from './copy-dir.js';
import { installRootDependencies } from './install.js';
import { toDotnetNamespace, toPackageName } from './naming.js';
import { renderTree } from './render-tree.js';
import { resolveTemplatesRoot } from './paths.js';
import { validateProjectName } from './validate-project-name.js';
import { backendRegistry } from '../registry/backends.js';
import { frontendRegistry } from '../registry/frontends.js';
import type { BackendId, BackendTemplate, FrontendId, FrontendTemplate, TemplateVariables } from '../registry/types.js';

export interface GenerateProjectOptions {
  projectName: string;
  frontend: FrontendId;
  backend: BackendId;
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
  installed: boolean;
}

const COPY_SKIP_NAMES = new Set(['node_modules', '.git', 'dist', 'bin', 'obj', '.DS_Store']);
const skipOption = { skip: (name: string) => COPY_SKIP_NAMES.has(name) };

function buildVariables(projectName: string, frontend: FrontendTemplate, backend: BackendTemplate): TemplateVariables {
  return {
    projectName,
    packageName: toPackageName(projectName),
    dotnetNamespace: toDotnetNamespace(projectName),
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
    version: '0.1.0',
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
  await renderTree(projectDir, variables);

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

  return { projectDir, frontend, backend, variables, installed };
}
