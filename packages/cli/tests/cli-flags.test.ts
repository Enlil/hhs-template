import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CLI_ENTRY, TSX_CLI } from './helpers.js';

let workDir: string;

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-flags-'));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

/** Runs the real command (from source) in the work folder. NO_COLOR keeps the output free of colour codes. */
function cli(...args: string[]) {
  return spawnSync(process.execPath, [TSX_CLI, CLI_ENTRY, ...args], {
    cwd: workDir,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

describe('create-my-app flags', () => {
  it('--help lists every option once, saying which templates offer it', () => {
    const { stdout, status } = cli('--help');

    expect(status).toBe(0);
    expect(stdout).toMatch(/--css-framework <value>\s+React, Angular: CSS framework/);
    expect(stdout).toMatch(/--java-version <value>\s+Spring Boot \(Java\): Java version/);
    expect(stdout).toMatch(/--lombok\s+Spring Boot \(Java\): include Lombok/);
    // Shared by two frontends, but still a single flag.
    expect(stdout.match(/--css-framework/g)).toHaveLength(1);
    expect(stdout).toContain('tailwind|material; default tailwind');
  });

  it.each([
    ['react', 'src/theme.ts'],
    ['angular', 'src/styles.css'],
  ])('--css-framework material builds the %s project with the Material Design files', async (frontend, marker) => {
    const { status, stderr } = cli('app', '--frontend', frontend, '--backend', 'node', '--skip-install', '--css-framework', 'material');

    expect(status, stderr).toBe(0);
    const packageJson = await fs.readFile(path.join(workDir, 'app/apps/web/package.json'), 'utf8');
    expect(packageJson).toMatch(frontend === 'react' ? /@mui\/material/ : /@angular\/material/);
    expect(packageJson).not.toMatch(/tailwindcss/);
    await expect(fs.stat(path.join(workDir, 'app/apps/web', marker))).resolves.toBeDefined();
  });

  it('uses Tailwind when --css-framework is left out', async () => {
    const { status } = cli('app', '--frontend', 'react', '--backend', 'node', '--skip-install');

    expect(status).toBe(0);
    expect(await fs.readFile(path.join(workDir, 'app/apps/web/package.json'), 'utf8')).toMatch(/tailwindcss/);
  });

  it('rejects a CSS framework that is not offered, and creates nothing', async () => {
    const { status, stderr } = cli('app', '--frontend', 'react', '--backend', 'node', '--skip-install', '--css-framework', 'bootstrap');

    expect(status).toBe(1);
    expect(stderr).toContain('"css-framework" must be one of: tailwind, material (got "bootstrap")');
    expect(await fs.readdir(workDir)).toEqual([]);
  });

  it('rejects an option the chosen backend does not have, naming who does', () => {
    const lombok = cli('app', '--frontend', 'react', '--backend', 'node', '--skip-install', '--lombok');
    expect(lombok.status).toBe(1);
    expect(lombok.stderr).toContain('--lombok only works with Spring Boot (Java).');

    const java = cli('app', '--frontend', 'react', '--backend', 'node', '--skip-install', '--java-version', '21');
    expect(java.status).toBe(1);
    expect(java.stderr).toContain('--java-version only works with Spring Boot (Java).');
  });

  it('rejects a flag that is missing its value', () => {
    const { status, stderr } = cli('app', '--frontend', 'react', '--backend', 'node', '--skip-install', '--css-framework');

    expect(status).toBe(1);
    expect(stderr).toContain("option '--css-framework <value>' argument missing");
  });
});
