import { spawnSync } from 'node:child_process';

export interface InstallOutcome {
  ran: boolean;
  succeeded: boolean;
}

/**
 * Runs `npm install` at the generated project root. A single root install
 * covers every npm-based workspace member (the frontend always, plus the
 * backend when it's also npm-based) — see generate-project.ts for how
 * `workspaces` is computed. Failures (offline, registry down) are reported
 * back rather than thrown, since a failed install shouldn't stop the CLI
 * from finishing generation and printing next steps.
 */
export function installRootDependencies(projectDir: string, log: (message: string) => void): InstallOutcome {
  log('Installing dependencies (npm install)...');
  const result = spawnSync('npm', ['install'], { cwd: projectDir, stdio: 'inherit' });

  if (result.error || result.status !== 0) {
    log('Warning: "npm install" did not finish successfully. You can retry it manually in the project directory.');
    return { ran: true, succeeded: false };
  }

  return { ran: true, succeeded: true };
}
