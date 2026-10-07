import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { TemplateVariables } from '../registry/types.js';
import { applyConditionals, type ConditionalContext } from './conditionals.js';

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

// Binary assets (logos, etc.) are copied byte-for-byte and never have their
// contents read as text: decoding one as UTF-8 and writing it back would
// corrupt it the moment any byte sequence in it happened to look like a
// placeholder. File *names* are still rendered normally.
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.woff', '.woff2', '.ttf']);

function isBinaryFile(fileName: string): boolean {
  return BINARY_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

/** Replaces each `{{token}}` with its variable. A token with no variable is left exactly as written. */
export function renderPlaceholders(text: string, variables: TemplateVariables): string {
  return text.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const value = variables[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * Walks an already-copied project tree in place. For every text file it
 * first resolves `#if <option>` marker blocks (see conditionals.ts), then
 * replaces `{{token}}` placeholders — in file contents and in file/directory
 * names (e.g. `{{dotnetNamespace}}.csproj`).
 *
 * Renames happen after processing each entry so a directory's own name is
 * only ever renamed by its parent, once its full subtree has already been
 * handled under the original path.
 */
export async function renderTree(
  rootDir: string,
  variables: TemplateVariables,
  conditionals: ConditionalContext,
): Promise<void> {
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const originalPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(originalPath);
      } else if (entry.isFile() && !isBinaryFile(entry.name)) {
        const content = await fs.readFile(originalPath, 'utf8');
        const relativePath = path.relative(rootDir, originalPath).split(path.sep).join('/');
        const rendered = renderPlaceholders(applyConditionals(content, conditionals, relativePath), variables);
        if (rendered !== content) {
          await fs.writeFile(originalPath, rendered, 'utf8');
        }
      }

      const renderedName = renderPlaceholders(entry.name, variables);
      if (renderedName !== entry.name) {
        await fs.rename(originalPath, path.join(dir, renderedName));
      }
    }
  }

  await walk(rootDir);
}
