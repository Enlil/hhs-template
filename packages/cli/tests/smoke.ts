// Real end-to-end smoke test: generates every framework combination into a
// temp directory, then actually runs `npm install` and a production build
// for each (plus `dotnet build` / `./mvnw package` when that SDK is
// available). Slower and network-dependent, so it's a separate
// `npm run test:smoke` rather than part of the default `npm test` — see
// README.md "Testing" for why.
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateProject } from '../src/core/generate-project.js';
import type { BackendId, FrontendId } from '../src/registry/types.js';

interface Combo {
  frontend: FrontendId;
  backend: BackendId;
  options?: Record<string, boolean>;
}

const COMBINATIONS: Combo[] = [
  { frontend: 'react', backend: 'node' },
  { frontend: 'react', backend: 'dotnet' },
  { frontend: 'react', backend: 'springboot' },
  // Lombok only compiles if its annotation processor really runs, so this doubles as a check on that setup.
  { frontend: 'react', backend: 'springboot', options: { lombok: true } },
  { frontend: 'angular', backend: 'node' },
  { frontend: 'angular', backend: 'dotnet' },
  { frontend: 'angular', backend: 'springboot' },
];

function comboName(combo: Combo): string {
  const enabled = Object.entries(combo.options ?? {})
    .filter(([, on]) => on)
    .map(([id]) => id);
  return [combo.frontend, combo.backend, ...enabled].join('-');
}

function run(command: string, args: string[], cwd: string): boolean {
  console.log(`  $ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  return result.status === 0;
}

function isOnPath(command: string, versionFlag = '--version'): boolean {
  const result = spawnSync(command, [versionFlag], { stdio: 'ignore' });
  return result.error === undefined && result.status === 0;
}

async function main(): Promise<void> {
  const workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-smoke-'));
  console.log(`Smoke-testing into ${workDir}\n`);

  const dotnetAvailable = isOnPath('dotnet');
  if (!dotnetAvailable) {
    console.log('Note: "dotnet" was not found on PATH — .NET combinations will be generated but not built.');
  }
  const javaAvailable = isOnPath('java', '-version');
  if (!javaAvailable) {
    console.log('Note: "java" was not found on PATH — Spring Boot combinations will be generated but not built.');
  }
  console.log('');

  const results: Array<{ combo: Combo; ok: boolean; note?: string }> = [];

  for (const combo of COMBINATIONS) {
    const projectName = `smoke-${comboName(combo)}`;
    console.log(`=== ${comboName(combo)} ===`);

    const { projectDir } = await generateProject({
      projectName,
      frontend: combo.frontend,
      backend: combo.backend,
      options: combo.options,
      cwd: workDir,
      skipInstall: true,
    });

    let ok = run('npm', ['install'], projectDir);

    if (ok) {
      ok = run('npm', ['run', 'build', '-w', 'apps/web'], projectDir);
    }
    if (ok && combo.backend === 'node') {
      ok = run('npm', ['run', 'build', '-w', 'apps/api'], projectDir);
    }

    let note: string | undefined;
    if (combo.backend === 'dotnet') {
      if (dotnetAvailable) {
        ok = ok && run('dotnet', ['build'], path.join(projectDir, 'apps/api'));
      } else {
        note = 'dotnet build skipped (SDK not installed)';
      }
    }
    if (combo.backend === 'springboot') {
      if (javaAvailable) {
        ok = ok && run('./mvnw', ['-q', 'clean', 'package'], path.join(projectDir, 'apps/api'));
      } else {
        note = 'mvnw package skipped (JDK not installed)';
      }
    }

    results.push({ combo, ok, note });
    console.log(ok ? '  ✔ passed\n' : '  ✖ failed\n');
  }

  console.log('Summary:');
  let anyFailed = false;
  for (const { combo, ok, note } of results) {
    console.log(`  ${ok ? '✔' : '✖'} ${comboName(combo)}${note ? ` (${note})` : ''}`);
    if (!ok) anyFailed = true;
  }

  await fs.rm(workDir, { recursive: true, force: true });

  if (anyFailed) {
    process.exitCode = 1;
  }
}

void main();
