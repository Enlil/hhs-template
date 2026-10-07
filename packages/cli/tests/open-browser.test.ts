import { existsSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openBrowser } from '../src/ui/open-browser.js';
import { waitFor } from './helpers.js';

// `open` (macOS) and `xdg-open` (Linux) are plain commands found on PATH, so a
// stand-in ahead of them shows what they would be given without opening a real
// browser. Windows uses rundll32, which isn't covered here.
const OPENER = process.platform === 'darwin' ? 'open' : 'xdg-open';
const originalPath = process.env.PATH;

let binDir: string;

beforeEach(async () => {
  binDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-open-'));
});

afterEach(async () => {
  process.env.PATH = originalPath;
  await fs.rm(binDir, { recursive: true, force: true });
});

describe.skipIf(process.platform === 'win32')('openBrowser', () => {
  it('hands the link to the system opener', async () => {
    const record = path.join(binDir, 'link.txt');
    await fs.writeFile(
      path.join(binDir, OPENER),
      // Written to a temp name first, so the test never sees a half-written file.
      `#!/bin/sh\nprintf '%s' "$1" > '${record}.tmp' && mv '${record}.tmp' '${record}'\n`,
      { mode: 0o755 },
    );
    process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ''}`;

    expect(await openBrowser('http://127.0.0.1:1234/?token=abc')).toBe(true);

    // The opener runs on its own (detached), so give it a moment to write.
    await waitFor(() => (existsSync(record) ? true : undefined));
    expect(await fs.readFile(record, 'utf8')).toBe('http://127.0.0.1:1234/?token=abc');
  });

  it('says so when there is no opener to run', async () => {
    process.env.PATH = path.join(binDir, 'no-such-bin');

    expect(await openBrowser('http://127.0.0.1:1234/')).toBe(false);
  });
});
