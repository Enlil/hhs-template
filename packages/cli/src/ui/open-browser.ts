import { spawn } from 'node:child_process';

function launcherFor(url: string): [command: string, args: string[]] {
  switch (process.platform) {
    case 'darwin':
      return ['open', [url]];
    case 'win32':
      // rundll32 avoids cmd.exe's quoting rules for `start`.
      return ['rundll32', ['url.dll,FileProtocolHandler', url]];
    default:
      return ['xdg-open', [url]];
  }
}

/**
 * Opens a link in the default browser. Resolves to false when that isn't
 * possible (no desktop, no `xdg-open`), so the caller can fall back to just
 * showing the link.
 */
export function openBrowser(url: string): Promise<boolean> {
  const [command, args] = launcherFor(url);

  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { stdio: 'ignore', detached: true });
      child.once('error', () => resolve(false));
      child.once('spawn', () => {
        // Don't let the browser launcher keep this process alive or tie it to our terminal.
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}
