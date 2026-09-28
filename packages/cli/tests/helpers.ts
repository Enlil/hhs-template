import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Returns every file under `dir`, as POSIX-style paths relative to `dir`, sorted. */
export async function listFilesRecursive(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        results.push(path.relative(dir, full).split(path.sep).join('/'));
      }
    }
  }

  await walk(dir);
  return results.sort();
}
