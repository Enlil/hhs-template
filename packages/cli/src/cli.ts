import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { input, select } from '@inquirer/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { generateProject } from './core/generate-project.js';
import { printNextSteps } from './core/next-steps.js';
import { validateProjectName } from './core/validate-project-name.js';
import { backendChoices, frontendChoices } from './registry/index.js';
import type { BackendId, FrontendId } from './registry/types.js';

interface CliOptions {
  frontend?: string;
  backend?: string;
  skipInstall?: boolean;
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

  program.parse(argv);
  const options = program.opts<CliOptions>();

  console.log(pc.bold('\ncreate-my-app\n'));

  try {
    const projectName = await resolveProjectName(program.args[0]);
    const frontend = await resolveFrontend(options.frontend);
    const backend = await resolveBackend(options.backend);

    const result = await generateProject({
      projectName,
      frontend,
      backend,
      skipInstall: options.skipInstall ?? false,
      log: (message) => console.log(pc.dim(`  ${message}`)),
    });

    printNextSteps(result);
  } catch (error) {
    console.error(pc.red(`\n✖ ${(error as Error).message}`));
    process.exitCode = 1;
  }
}
