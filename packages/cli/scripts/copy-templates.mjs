// Runs on `npm pack`/`npm publish` (see the "prepack" script in package.json).
// npm only publishes files inside this package directory, but the template
// sources live at the repo root (`../../templates`) so they can be shared
// with docs and kept out of the CLI's own build. This copies them in as a
// plain build artifact — packages/cli/templates is gitignored, not source.
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../../../templates');
const dest = path.resolve(here, '../templates');

if (!existsSync(src)) {
  throw new Error(`Cannot find templates directory to bundle at ${src}`);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });

console.log(`Copied templates from ${src} to ${dest}`);
