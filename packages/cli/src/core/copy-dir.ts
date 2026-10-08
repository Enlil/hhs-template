import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface CopyDirOptions {
  /** Return true to skip an entry (matched by its own file/directory name, not full path). */
  skip?: (entryName: string) => boolean;
  /**
   * Called for each file before it is copied, with the file's path relative to
   * the top folder being copied (always with "/"). Return true when you have
   * dealt with the file yourself, so it isn't copied as well.
   */
  handleFile?: (srcPath: string, destPath: string, relativePath: string) => Promise<boolean>;
}

/**
 * Recursively copies `src` into `dest` (byte-for-byte, no placeholder
 * rendering — see render-tree.ts for that). Used both for template ->
 * generated-project copies and for tests asserting which files a given
 * combination does/doesn't produce. A file that already exists at the
 * destination is replaced, which is how a template layer overrides the
 * template's own files.
 */
export async function copyDir(src: string, dest: string, options: CopyDirOptions = {}): Promise<void> {
  await copyEntries(src, dest, '', options);
}

async function copyEntries(src: string, dest: string, relativeDir: string, options: CopyDirOptions): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (options.skip?.(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      await copyEntries(srcPath, destPath, relativePath, options);
    } else if (entry.isFile()) {
      if (await options.handleFile?.(srcPath, destPath, relativePath)) continue;
      await fs.copyFile(srcPath, destPath);
    }
  }
}
