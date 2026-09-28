import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface CopyDirOptions {
  /** Return true to skip an entry (matched by its own file/directory name, not full path). */
  skip?: (entryName: string) => boolean;
}

/**
 * Recursively copies `src` into `dest` (byte-for-byte, no placeholder
 * rendering — see render-tree.ts for that). Used both for template ->
 * generated-project copies and for tests asserting which files a given
 * combination does/doesn't produce.
 */
export async function copyDir(src: string, dest: string, options: CopyDirOptions = {}): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (options.skip?.(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, options);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
