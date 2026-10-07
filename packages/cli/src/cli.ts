import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { confirm, input, select } from '@inquirer/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { generateProject } from './core/generate-project.js';
import { printNextSteps } from './core/next-steps.js';
import { validateProjectName } from './core/validate-project-name.js';
import {
  allOptions,
  backendChoices,
  backendRegistry,
  frontendChoices,
  frontendRegistry,
  optionFlagKey,
} from './registry/index.js';
import type { BackendId, BackendTemplate, FrontendId, FrontendTemplate } from './registry/types.js';

interface CliOptions {
  frontend?: string;
  backend?: string;
  skipInstall?: boolean;
  // Plus one boolean per template option (e.g. `lombok`), registered from the registry in run().
  [option: string]: unknown;
}

function readVersion(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(path.join(here, '../package.json'), 'utf8')) as { version: string };
  return pkg.version;
}

function isFrontendId(value: string | undefined): value is FrontendId {
  return frontendChoices.some((choice) => choice.id === value);
}

function isBackendId(value: string | undefined): value is BackendId {
  return backendChoices.some((choice) => choice.id === value);
}

async function resolveProjectName(argFromCli: string | undefined): Promise<string> {
  if (argFromCli === undefined) {
    return input({
      message: 'Project name:',
      default: 'my-app',
      validate: (value) => {
        const result = validateProjectName(value);
        return result.valid ? true : (result.error ?? 'Invalid project name.');
      },
    });
  }

  const result = validateProjectName(argFromCli);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return argFromCli;
}

async function resolveFrontend(fromFlag: string | undefined): Promise<FrontendId> {
  if (isFrontendId(fromFlag)) return fromFlag;
  if (fromFlag !== undefined) {
    throw new Error(`Unknown frontend "${fromFlag}". Available: ${frontendChoices.map((c) => c.id).join(', ')}`);
  }
  return select<FrontendId>({
    message: 'Frontend framework:',
    choices: frontendChoices.map((choice) => ({
      name: choice.label,
      value: choice.id,
      description: choice.description,
    })),
  });
}

async function resolveBackend(fromFlag: string | undefined): Promise<BackendId> {
  if (isBackendId(fromFlag)) return fromFlag;
  if (fromFlag !== undefined) {
    throw new Error(`Unknown backend "${fromFlag}". Available: ${backendChoices.map((c) => c.id).join(', ')}`);
  }
  return select<BackendId>({
    message: 'Backend framework:',
    choices: backendChoices.map((choice) => ({
      name: choice.label,
      value: choice.id,
      description: choice.description,
    })),
  });
}

/**
 * Settles each option the chosen frontend/backend offers: a flag wins,
 * otherwise ask. Only offered options are asked about, so picking Node never
 * mentions Lombok.
 */
async function resolveOptions(
  frontend: FrontendTemplate,
  backend: BackendTemplate,
  flags: CliOptions,
): Promise<Record<string, boolean>> {
  const offered = [...(frontend.options ?? []), ...(backend.options ?? [])];
  const offeredIds = new Set(offered.map((option) => option.id));

  // A flag for an option this combination doesn't have is a mistake: say so instead of ignoring it.
  for (const { option, owner } of allOptions()) {
    if (flags[optionFlagKey(option.id)] !== undefined && !offeredIds.has(option.id)) {
      throw new Error(`--${option.id} only works with ${owner.label}.`);
    }
  }

  const chosen: Record<string, boolean> = {};
  for (const option of offered) {
    const fromFlag = flags[optionFlagKey(option.id)];
    if (typeof fromFlag === 'boolean') {
      chosen[option.id] = fromFlag;
    } else if (process.stdin.isTTY) {
      chosen[option.id] = await confirm({
        message: `Include ${option.label}? (${option.description})`,
        default: option.default,
      });
    }
    // No terminal (CI, pipes): leave it out, so the option's default applies instead of hanging on a prompt.
  }
  return chosen;
}

export async function run(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name('create-my-app')
    .description('Scaffold a full-stack app from modular frontend/backend templates.')
    .argument('[project-name]', 'name of the project / destination directory')
    .option('--frontend <id>', `frontend template (${frontendChoices.map((c) => c.id).join('|')})`)
    .option('--backend <id>', `backend template (${backendChoices.map((c) => c.id).join('|')})`)
    .option('--skip-install', 'skip installing dependencies after generation')
    .version(readVersion());

  // One --<id> / --no-<id> pair per option in the registry. Defining --<id> first
  // keeps the default "unset", so we know when to ask instead of assuming.
  for (const { option, owner } of allOptions()) {
    program.option(`--${option.id}`, `${owner.label}: include ${option.label} (${option.description})`);
    program.option(`--no-${option.id}`, `${owner.label}: leave out ${option.label}`);
  }

  program.parse(argv);
  const flags = program.opts<CliOptions>();

  console.log(pc.bold('\ncreate-my-app\n'));

  try {
    const projectName = await resolveProjectName(program.args[0]);
    const frontendId = await resolveFrontend(flags.frontend);
    const backendId = await resolveBackend(flags.backend);
    const options = await resolveOptions(frontendRegistry[frontendId], backendRegistry[backendId], flags);

    const result = await generateProject({
      projectName,
      frontend: frontendId,
      backend: backendId,
      options,
      skipInstall: flags.skipInstall ?? false,
      log: (message) => console.log(pc.dim(`  ${message}`)),
    });

    printNextSteps(result);
  } catch (error) {
    console.error(pc.red(`\n✖ ${(error as Error).message}`));
    process.exitCode = 1;
  }
}
