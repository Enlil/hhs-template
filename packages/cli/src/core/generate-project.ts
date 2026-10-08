import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { copyDir } from './copy-dir.js';
import { installRootDependencies } from './install.js';
import { mergeJsonFile } from './merge-json-file.js';
import { toDotnetNamespace, toJavaPackageName, toPackageName } from './naming.js';
import { renderPlaceholders, renderTree } from './render-tree.js';
import { resolveOptions } from './resolve-options.js';
import { resolveTemplatesRoot } from './paths.js';
import { validateProjectName } from './validate-project-name.js';
import { backendRegistry } from '../registry/backends.js';
import { frontendRegistry } from '../registry/frontends.js';
import { optionFlagKey, optionGroups } from '../registry/options.js';
import type {
  BackendId,
  BackendTemplate,
  FrontendId,
  FrontendTemplate,
  OptionValue,
  TemplateLayer,
  TemplateVariables,
} from '../registry/types.js';

export interface GenerateProjectOptions {
  projectName: string;
  frontend: FrontendId;
  backend: BackendId;
  /**
   * Options to set, by option id: true/false for an on/off extra (`{ lombok: true }`), the picked
   * value for a choice (`{ 'java-version': '21' }`). Anything not listed uses the option's default.
   */
  options?: Record<string, OptionValue>;
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
  /** Ids of the on/off options that ended up switched on. (Choices, like the Java version, are in `variables`.) */
  options: string[];
  installed: boolean;
}

const COPY_SKIP_NAMES = new Set(['node_modules', '.git', 'dist', 'bin', 'obj', 'target', '.DS_Store']);
const skipOption = { skip: (name: string) => COPY_SKIP_NAMES.has(name) };

// Bumped by hand for now — see README.md "Versioning templates" for why this
// isn't derived from anything more automatic yet.
const APP_VERSION = '0.1.0';

function buildVariables(
  projectName: string,
  frontend: FrontendTemplate,
  backend: BackendTemplate,
  optionValues: Record<string, OptionValue>,
): TemplateVariables {
  const variables: TemplateVariables = {
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
    backendPrerequisiteLine: '', // filled in below, once the choices exist
    backendBuildNote: backend.extraBuildNote ?? '',
  };

  // Each choice option the stack offers becomes a placeholder named after it (java-version -> {{javaVersion}}).
  for (const option of [...(frontend.options ?? []), ...(backend.options ?? [])]) {
    if (option.kind !== 'choice') continue;

    const name = optionFlagKey(option.id);
    if (name in variables) {
      throw new Error(`Option "${option.id}" would replace the built-in template variable "${name}". Give the option another id.`);
    }
    variables[name] = String(optionValues[option.id]);
  }

  // Last, because the line itself can use one of those placeholders ("JDK {{javaVersion}}+").
  if (backend.extraPrerequisite) {
    variables.backendPrerequisiteLine = `\n- ${renderPlaceholders(backend.extraPrerequisite, variables)}`;
  }

  return variables;
}

/** The layer each of the template's layered options picked, e.g. the Material Design files for `css-framework=material`. */
function pickedLayers(template: FrontendTemplate | BackendTemplate, values: Record<string, OptionValue>): TemplateLayer[] {
  return Object.entries(template.layers ?? {}).map(([optionId, layerByChoice]) => {
    const choice = String(values[optionId]);
    const layer = layerByChoice[choice];
    if (!layer) {
      throw new Error(`${template.label} has no files for "${choice}" in its "${optionId}" option.`);
    }
    return layer;
  });
}

/**
 * Copies a layer over what the template already put in place: a file with the
 * same path is replaced, except a .json file, which is merged into the
 * template's (so a layer can add dependencies or change one setting without
 * repeating the whole file).
 */
async function applyLayer(layer: TemplateLayer, targetDir: string): Promise<void> {
  await copyDir(layer.dir, targetDir, {
    ...skipOption,
    handleFile: async (srcPath, destPath) => {
      if (path.extname(srcPath) !== '.json' || !existsSync(destPath)) return false;
      await mergeJsonFile(destPath, srcPath);
      return true;
    },
  });
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
  const resolvedOptions = resolveOptions(frontend, backend, options.options);
  const frontendLayers = pickedLayers(frontend, resolvedOptions.values);
  const backendLayers = pickedLayers(backend, resolvedOptions.values);

  const cwd = options.cwd ?? process.cwd();
  const projectDir = path.resolve(cwd, options.projectName);

  if (existsSync(projectDir)) {
    const existingEntries = await fs.readdir(projectDir);
    if (existingEntries.length > 0) {
      throw new Error(`Directory "${options.projectName}" already exists and is not empty.`);
    }
  }
  await fs.mkdir(projectDir, { recursive: true });

  const variables = buildVariables(options.projectName, frontend, backend, resolvedOptions.values);
  const sharedRoot = path.join(resolveTemplatesRoot(), 'shared');

  const frontendDir = path.join(projectDir, frontend.targetDir);
  const backendDir = path.join(projectDir, backend.targetDir);

  log(`Creating ${frontend.label} frontend in ${frontend.targetDir}...`);
  await copyDir(frontend.templateDir, frontendDir, skipOption);
  for (const layer of frontendLayers) await applyLayer(layer, frontendDir);

  log(`Creating ${backend.label} backend in ${backend.targetDir}...`);
  await copyDir(backend.templateDir, backendDir, skipOption);
  for (const layer of backendLayers) await applyLayer(layer, backendDir);

  log('Copying shared design tokens, assets, and API contract...');
  await copyDir(path.join(sharedRoot, 'design-tokens'), path.join(projectDir, 'shared/design-tokens'), skipOption);
  await copyDir(path.join(sharedRoot, 'assets'), path.join(projectDir, 'shared/assets'), skipOption);
  await copyDir(path.join(sharedRoot, 'contracts'), path.join(projectDir, 'shared/contracts'), skipOption);

  // Also drop a working copy of the tokens/assets the frontend app actually
  // imports inside its own src/, so its bundler resolves them as ordinary
  // local files instead of reaching outside its project root. shared/ above
  // remains the canonical, framework-neutral copy per the generated layout.
  // Which token files that is depends on the frontend's CSS framework: each
  // layer lists the ones it reads. Without layers, everything but tokens.json.
  const wantedTokenFiles = new Set(frontendLayers.flatMap((layer) => layer.tokenFiles));
  const wantsTokenFile = (name: string): boolean => (wantedTokenFiles.size > 0 ? wantedTokenFiles.has(name) : name !== 'tokens.json');
  await copyDir(path.join(sharedRoot, 'design-tokens'), path.join(frontendDir, 'src/styles'), {
    skip: (name) => COPY_SKIP_NAMES.has(name) || !wantsTokenFile(name),
  });
  await copyDir(path.join(sharedRoot, 'assets'), path.join(frontendDir, 'src/assets'), skipOption);

  log('Generating project configuration...');
  await writeRootPackageJson(projectDir, variables, frontend, backend);
  await writeRootConfigFiles(projectDir, path.join(sharedRoot, 'config'));

  log('Applying template variables...');
  await renderTree(projectDir, variables, {
    enabled: resolvedOptions.enabled,
    // Only on/off options can be used in `#if` markers; a choice is read as a {{placeholder}} instead.
    known: new Set(optionGroups().filter(({ option }) => option.kind === 'toggle').map(({ option }) => option.id)),
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

  return { projectDir, frontend, backend, variables, options: [...resolvedOptions.enabled], installed };
}
