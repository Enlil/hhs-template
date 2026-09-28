import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateProject } from '../src/core/generate-project.js';
import type { BackendId, FrontendId } from '../src/registry/types.js';

let workDir: string;

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-test-'));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

describe('generateProject error handling', () => {
  it('rejects an invalid project name before touching the filesystem', async () => {
    await expect(
      generateProject({ projectName: 'Not Valid', frontend: 'react', backend: 'node', cwd: workDir, skipInstall: true }),
    ).rejects.toThrow(/lowercase/);

    expect(await fs.readdir(workDir)).toEqual([]);
  });

  it('rejects an unknown frontend id', async () => {
    await expect(
      generateProject({
        projectName: 'valid-name',
        frontend: 'vue' as FrontendId,
        backend: 'node',
        cwd: workDir,
        skipInstall: true,
      }),
    ).rejects.toThrow(/Unknown frontend/);
  });

  it('rejects an unknown backend id', async () => {
    await expect(
      generateProject({
        projectName: 'valid-name',
        frontend: 'react',
        backend: 'python' as BackendId,
        cwd: workDir,
        skipInstall: true,
      }),
    ).rejects.toThrow(/Unknown backend/);
  });

  it('refuses to generate into a non-empty existing directory', async () => {
    const target = path.join(workDir, 'existing-app');
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, 'placeholder.txt'), 'hi');

    await expect(
      generateProject({
        projectName: 'existing-app',
        frontend: 'react',
        backend: 'node',
        cwd: workDir,
        skipInstall: true,
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('allows generating into an existing but empty directory', async () => {
    const target = path.join(workDir, 'empty-app');
    await fs.mkdir(target, { recursive: true });

    await expect(
      generateProject({ projectName: 'empty-app', frontend: 'react', backend: 'node', cwd: workDir, skipInstall: true }),
    ).resolves.toBeDefined();
  });
});
