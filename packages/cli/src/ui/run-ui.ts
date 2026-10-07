import pc from 'picocolors';
import { openBrowser } from './open-browser.js';
import { startUiServer } from './server.js';

export interface RunUiOptions {
  /** The folder the command was run from; the form's "folder" box starts here. */
  directory: string;
  version: string;
  /** Open the default browser. When false, only the link is printed. */
  open: boolean;
}

/** Starts the local form and keeps running until the page's "Stop" button or Ctrl+C. */
export async function runUi(options: RunUiOptions): Promise<void> {
  const server = await startUiServer({ defaultDirectory: options.directory, version: options.version });

  console.log(`${pc.bold('\ncreate-my-app')}${pc.dim('  browser form')}\n`);
  console.log(`  Open this link in your browser:\n  ${pc.cyan(server.url)}\n`);
  console.log(pc.dim("  The link holds a one-time key, so other websites and programs can't use the form."));
  console.log(pc.dim('  Projects are written straight into the folder you choose. Press Ctrl+C here to stop.\n'));

  const stop = (): void => void server.close();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  if (options.open && !(await openBrowser(server.url))) {
    console.log(pc.yellow("  Couldn't open a browser by itself. Use the link above.\n"));
  }

  await server.closed;
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
  console.log(pc.dim('\n  Stopped.\n'));
}
