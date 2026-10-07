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
import { detectJava } from '../src/core/java.js';
import { backendRegistry } from '../src/registry/backends.js';
import type { BackendId, FrontendId, OptionValue } from '../src/registry/types.js';

interface Combo {
  frontend: FrontendId;
  backend: BackendId;
  options?: Record<string, OptionValue>;
  /** Only check the Java build: skip `npm install` and the web build. For trying more Java versions quickly. */
  javaOnly?: boolean;
}

function comboName(combo: Combo): string {
  const picked = Object.entries(combo.options ?? {}).flatMap(([id, value]) => {
    if (value === true) return [id]; // lombok
    if (typeof value === 'string') return [`${id}-${value}`]; // java-version-21
    return [];
  });
  return [combo.frontend, combo.backend, ...picked, ...(combo.javaOnly ? ['java-only'] : [])].join('-');
}

function run(command: string, args: string[], cwd: string): boolean {
  console.log(`  $ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  return result.status === 0;
}

function isOnPath(command: string): boolean {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.error === undefined && result.status === 0;
}

/** The Java versions the Spring Boot template offers, newest first. */
function offeredJavaVersions(): number[] {
  const option = (backendRegistry.springboot.options ?? []).find((candidate) => candidate.id === 'java-version');
  if (option?.kind !== 'choice') throw new Error('Expected the Spring Boot template to offer a "java-version" choice.');
  return option.choices.map((choice) => Number(choice.value)).sort((a, b) => b - a);
}

async function main(): Promise<void> {
  const workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-smoke-'));
  console.log(`Smoke-testing into ${workDir}\n`);

  const dotnetAvailable = isOnPath('dotnet');
  if (!dotnetAvailable) {
    console.log('Note: "dotnet" was not found on PATH — .NET combinations will be generated but not built.');
  }

  // Spring Boot is built for a Java version this machine's JDK can handle. The default (the newest) needs a
  // JDK that new: on an older one, Maven stops with "release version N not supported".
  const java = detectJava();
  const buildableJava = offeredJavaVersions().filter((version) => java?.major !== undefined && version <= java.major);
  const newestJava = buildableJava[0];
  if (!java) {
    console.log('Note: "java" was not found on PATH — Spring Boot combinations will be generated but not built.');
  } else if (newestJava === undefined) {
    console.log(`Note: the JDK on PATH (${java.major ?? 'unknown version'}) is older than every Java version offered — Spring Boot combinations will be generated but not built.`);
  } else {
    console.log(`Java: JDK ${String(java.major)} on PATH, so Spring Boot is built for ${buildableJava.join(', ')}.`);
  }
  console.log('');

  const springOptions = (extra: Record<string, OptionValue> = {}): Record<string, OptionValue> =>
    newestJava === undefined ? extra : { 'java-version': String(newestJava), ...extra };

  const combinations: Combo[] = [
    { frontend: 'react', backend: 'node' },
    { frontend: 'react', backend: 'dotnet' },
    { frontend: 'react', backend: 'springboot', options: springOptions() },
    // Lombok only compiles if its annotation processor really runs, so this doubles as a check on that setup.
    { frontend: 'react', backend: 'springboot', options: springOptions({ lombok: true }) },
    { frontend: 'angular', backend: 'node' },
    { frontend: 'angular', backend: 'dotnet' },
    { frontend: 'angular', backend: 'springboot', options: springOptions() },
    // Every other Java version this JDK can build for: only the Java side is checked.
    ...buildableJava.slice(1).map(
      (version): Combo => ({
        frontend: 'react',
        backend: 'springboot',
        options: { 'java-version': String(version) },
        javaOnly: true,
      }),
    ),
  ];

  const results: Array<{ combo: Combo; ok: boolean; note?: string }> = [];

  for (const combo of combinations) {
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

    let ok = true;
    if (!combo.javaOnly) {
      ok = run('npm', ['install'], projectDir);

      if (ok) {
        ok = run('npm', ['run', 'build', '-w', 'apps/web'], projectDir);
      }
      if (ok && combo.backend === 'node') {
        ok = run('npm', ['run', 'build', '-w', 'apps/api'], projectDir);
      }
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
      if (newestJava !== undefined) {
        ok = ok && run('./mvnw', ['-q', 'clean', 'package'], path.join(projectDir, 'apps/api'));
      } else {
        note = java ? 'mvnw package skipped (the JDK is older than every Java version offered)' : 'mvnw package skipped (JDK not installed)';
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
