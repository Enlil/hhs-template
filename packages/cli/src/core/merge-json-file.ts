import { promises as fs } from 'node:fs';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges `patch` into `base`: objects are merged key by key; anything else
 * (text, numbers, lists) is taken from the patch whole.
 */
export function mergeJson(base: Json, patch: Json): Json {
  if (!isObject(base) || !isObject(patch)) return patch;

  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const existing = merged[key];
    merged[key] = existing === undefined ? value : mergeJson(existing, value);
  }
  return merged;
}

// package.json's dependency lists, which npm keeps in alphabetical order.
const DEPENDENCY_KEYS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/**
 * Adds a template layer's JSON file (just the bits it changes, e.g. its
 * dependencies in package.json) to the template's file of the same name. The
 * result is written the way npm writes JSON: two-space indent, and the
 * dependency lists of a package.json in alphabetical order.
 */
export async function mergeJsonFile(basePath: string, patchPath: string): Promise<void> {
  const read = async (filePath: string): Promise<Json> => {
    try {
      return JSON.parse(await fs.readFile(filePath, 'utf8')) as Json;
    } catch (error) {
      throw new Error(`Can't merge ${filePath}: ${(error as Error).message}`);
    }
  };

  const merged = mergeJson(await read(basePath), await read(patchPath));

  if (isObject(merged)) {
    for (const key of DEPENDENCY_KEYS) {
      const list = merged[key];
      if (isObject(list)) {
        merged[key] = Object.fromEntries(Object.entries(list).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
      }
    }
  }

  await fs.writeFile(basePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
}
