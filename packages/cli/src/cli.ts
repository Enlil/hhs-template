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
  backendChoices,
  backendRegistry,
  frontendChoices,
  frontendRegistry,
  optionFlagKey,
  optionGroups,
} from './registry/index.js';
import type {
  BackendId,
  BackendTemplate,
  FrontendId,
  FrontendTemplate,
  OptionValue,
} from './registry/types.js';
import { runUi } from './ui/run-ui.js';

interface CliOptions {
  frontend?: string;
  backend?: string;
  skipInstall?: boolean;
  ui?: boolean;
  /** Defaults to true; only `--no-open` makes it false. */
  open?: boolean;
  // Plus one entry per template option, registered from the registry in run(): a boolean for an
  // on/off option (e.g. `lombok`), text for a choice (e.g. `javaVersion`).
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
 * mentions Lombok or the Java version. (A value an option doesn't allow, like
 * `--java-version 99`, is rejected by generateProject before it touches disk.)
 */
async function askForOptions(
  frontend: FrontendTemplate,
  backend: BackendTemplate,
  flags: CliOptions,
): Promise<Record<string, OptionValue>> {
  const offered = [...(frontend.options ?? []), ...(backend.options ?? [])];
  const offeredIds = new Set(offered.map((option) => option.id));

  // A flag for an option this combination doesn't have is a mistake: say so instead of ignoring it.
  for (const { option, owners } of optionGroups()) {
    if (flags[optionFlagKey(option.id)] !== undefined && !offeredIds.has(option.id)) {
      throw new Error(`--${option.id} only works with ${owners.map((owner) => owner.label).join(' or ')}.`);
    }
  }

  const chosen: Record<string, OptionValue> = {};
  for (const option of offered) {
    const fromFlag = flags[optionFlagKey(option.id)];
    if (typeof fromFlag === 'boolean' || typeof fromFlag === 'string') {
      chosen[option.id] = fromFlag;
    } else if (process.stdin.isTTY) {
      chosen[option.id] =
        option.kind === 'toggle'
          ? await confirm({ message: `Include ${option.label}? (${option.description})`, default: option.default })
          : await select({
              message: `${option.label}:`,
              choices: option.choices.map((choice) => ({ name: choice.label, value: choice.value })),
              default: option.default,
            });
    }
    // No terminal (CI, pipes): leave it out, so the option's default applies instead of hanging on a prompt.
  }
  return chosen;
}

/**
 * --ui is the "fill in a form" way of answering, so answers also given as
 * flags would be silently ignored. Say so instead.
 */
function rejectAnswerFlags(args: string[], flags: CliOptions): void {
  const given = [
    ...(args.length > 0 ? ['a project name'] : []),
    ...(flags.frontend !== undefined ? ['--frontend'] : []),
    ...(flags.backend !== undefined ? ['--backend'] : []),
    ...(flags.skipInstall ? ['--skip-install'] : []),
    ...optionGroups()
      .filter(({ option }) => flags[optionFlagKey(option.id)] !== undefined)
      .map(({ option }) => (option.kind === 'toggle' ? `--[no-]${option.id}` : `--${option.id}`)),
  ];

  if (given.length > 0) {
    throw new Error(`--ui opens a form where you answer these yourself, so don't combine it with ${given.join(', ')}.`);
  }
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
    .option('--ui', 'fill in a form in your browser (runs on your computer only) instead of answering in the terminal')
    .option('--no-open', 'with --ui: print the link instead of opening the browser')
    .version(readVersion());

  // One --<id> / --no-<id> pair per on/off option in the registry, and one --<id> <value> per
  // choice. Defining --<id> first keeps the default "unset", so we know when to ask instead of assuming.
  for (const { option, owners } of optionGroups()) {
    const offeredBy = owners.map((owner) => owner.label).join(', ');
    if (option.kind === 'toggle') {
      program.option(`--${option.id}`, `${offeredBy}: include ${option.label} (${option.description})`);
      program.option(`--no-${option.id}`, `${offeredBy}: leave out ${option.label}`);
    } else {
      const values = option.choices.map((choice) => choice.value).join('|');
      program.option(
        `--${option.id} <value>`,
        `${offeredBy}: ${option.label}, ${option.description} (${values}; default ${option.default})`,
      );
    }
  }

  program.parse(argv);
  const flags = program.opts<CliOptions>();

  try {
    if (flags.ui) {
      rejectAnswerFlags(program.args, flags);
      await runUi({ directory: process.cwd(), version: readVersion(), open: flags.open !== false });
      return;
    }
    if (flags.open === false) {
      throw new Error('--no-open only works together with --ui.');
    }

    console.log(pc.bold('\ncreate-my-app\n'));

    const projectName = await resolveProjectName(program.args[0]);
    const frontendId = await resolveFrontend(flags.frontend);
    const backendId = await resolveBackend(flags.backend);
    const options = await askForOptions(frontendRegistry[frontendId], backendRegistry[backendId], flags);

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
