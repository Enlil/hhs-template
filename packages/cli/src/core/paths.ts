import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function moduleDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * Locates the `templates/` directory this CLI reads from. The same compiled
 * code runs in two different layouts:
 *  - in this monorepo (dev via tsx, or built to packages/cli/dist), where
 *    templates live at the repo root, four levels above this file; and
 *  - once published, where templates ship *inside* the package (copied to
 *    packages/cli/templates by scripts/copy-templates.mjs's "prepack" step,
 *    since npm can't publish files from outside the package directory).
 * Both are checked so the CLI works identically in either context.
 */
export function resolveTemplatesRoot(): string {
  const here = moduleDir();
  const candidates = [
    path.resolve(here, '../../../../templates'), // monorepo: src|dist/core -> repo root/templates
    path.resolve(here, '../../templates'), // published: dist/core -> package root/templates
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'frontend', 'react', 'template'))) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate the templates directory. Looked in:\n${candidates
      .map((candidate) => `  - ${candidate}`)
      .join('\n')}`,
  );
}
