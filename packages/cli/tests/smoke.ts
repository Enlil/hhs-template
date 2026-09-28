// Real end-to-end smoke test: generates all four framework combinations into
// a temp directory, then actually runs `npm install` and a production build
// for each (plus `dotnet build` when the .NET SDK is available). Slower and
// network-dependent, so it's a separate `npm run test:smoke` rather than part
// of the default `npm test` — see README.md "Testing" for why.
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateProject } from '../src/core/generate-project.js';
import type { BackendId, FrontendId } from '../src/registry/types.js';

interface Combo {
  frontend: FrontendId;
  backend: BackendId;
}

const COMBINATIONS: Combo[] = [
  { frontend: 'react', backend: 'node' },
  { frontend: 'react', backend: 'dotnet' },
  { frontend: 'angular', backend: 'node' },
  { frontend: 'angular', backend: 'dotnet' },
];

function run(command: string, args: string[], cwd: string): boolean {
  console.log(`  $ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  return result.status === 0;
}

function isOnPath(command: string): boolean {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.error === undefined && result.status === 0;
}

async function main(): Promise<void> {
  const workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-smoke-'));
  console.log(`Smoke-testing into ${workDir}\n`);

  const dotnetAvailable = isOnPath('dotnet');
  if (!dotnetAvailable) {
    console.log('Note: "dotnet" was not found on PATH — .NET combinations will be generated but not built.\n');
  }

  const results: Array<{ combo: Combo; ok: boolean; note?: string }> = [];

  for (const combo of COMBINATIONS) {
    const projectName = `smoke-${combo.frontend}-${combo.backend}`;
    console.log(`=== ${combo.frontend} + ${combo.backend} ===`);

    const { projectDir } = await generateProject({
      projectName,
      frontend: combo.frontend,
      backend: combo.backend,
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

    results.push({ combo, ok, note });
    console.log(ok ? '  ✔ passed\n' : '  ✖ failed\n');
  }

  console.log('Summary:');
  let anyFailed = false;
  for (const { combo, ok, note } of results) {
    console.log(`  ${ok ? '✔' : '✖'} ${combo.frontend} + ${combo.backend}${note ? ` (${note})` : ''}`);
    if (!ok) anyFailed = true;
  }

  await fs.rm(workDir, { recursive: true, force: true });

  if (anyFailed) {
    process.exitCode = 1;
  }
}

void main();
