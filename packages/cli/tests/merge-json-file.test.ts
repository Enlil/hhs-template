import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mergeJson, mergeJsonFile } from '../src/core/merge-json-file.js';

describe('mergeJson', () => {
  it('merges objects key by key, at every depth', () => {
    expect(mergeJson({ a: { b: 1, c: 2 }, d: 3 }, { a: { c: 9, e: 4 }, f: 5 })).toEqual({
      a: { b: 1, c: 9, e: 4 },
      d: 3,
      f: 5,
    });
  });

  it('takes lists and plain values from the patch whole', () => {
    expect(mergeJson({ list: [1, 2, 3], text: 'old', n: 1 }, { list: [9], text: 'new' })).toEqual({
      list: [9],
      text: 'new',
      n: 1,
    });
  });

  it('lets the patch replace an object with a plain value, or the other way round', () => {
    expect(mergeJson({ a: { b: 1 } }, { a: 'flat' })).toEqual({ a: 'flat' });
    expect(mergeJson({ a: 'flat' }, { a: { b: 1 } })).toEqual({ a: { b: 1 } });
  });

  it('does not change what it was given', () => {
    const base = { a: { b: 1 } };
    mergeJson(base, { a: { c: 2 } });
    expect(base).toEqual({ a: { b: 1 } });
  });
});

describe('mergeJsonFile', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-merge-'));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  async function merge(base: unknown, patch: unknown): Promise<string> {
    const basePath = path.join(dir, 'base.json');
    const patchPath = path.join(dir, 'patch.json');
    await fs.writeFile(basePath, JSON.stringify(base));
    await fs.writeFile(patchPath, JSON.stringify(patch));
    await mergeJsonFile(basePath, patchPath);
    return fs.readFile(basePath, 'utf8');
  }

  it('writes the result the way npm does: two-space indent, one trailing newline', async () => {
    const text = await merge({ name: 'x' }, { version: '1.0.0' });

    expect(text).toBe('{\n  "name": "x",\n  "version": "1.0.0"\n}\n');
  });

  it('adds a layer\'s packages and keeps each dependency list in alphabetical order', async () => {
    const text = await merge(
      { name: 'web', dependencies: { react: '^19', 'react-dom': '^19' }, devDependencies: { vite: '^8' } },
      { dependencies: { '@mui/material': '^9', '@emotion/react': '^11' }, devDependencies: { tailwindcss: '^4' } },
    );
    const merged = JSON.parse(text) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };

    expect(Object.keys(merged.dependencies)).toEqual(['@emotion/react', '@mui/material', 'react', 'react-dom']);
    expect(Object.keys(merged.devDependencies)).toEqual(['tailwindcss', 'vite']);
  });

  it('can change one setting deep inside without repeating the rest of the file', async () => {
    const text = await merge(
      { build: { options: { styles: ['a.css'], outputPath: 'dist' }, configurations: { production: { hashing: 'all' } } } },
      { build: { configurations: { production: { budgets: [{ type: 'initial' }] } } } },
    );

    expect(JSON.parse(text)).toEqual({
      build: {
        options: { styles: ['a.css'], outputPath: 'dist' },
        configurations: { production: { hashing: 'all', budgets: [{ type: 'initial' }] } },
      },
    });
  });

  it('says which file it could not read', async () => {
    const basePath = path.join(dir, 'base.json');
    const patchPath = path.join(dir, 'patch.json');
    await fs.writeFile(basePath, '{ not json');
    await fs.writeFile(patchPath, '{}');

    await expect(mergeJsonFile(basePath, patchPath)).rejects.toThrow(/Can't merge .*base\.json/);
  });
});
