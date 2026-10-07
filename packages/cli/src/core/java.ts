import { spawnSync } from 'node:child_process';

/**
 * Reads the major version out of what `java -version` prints:
 * "23.0.2" -> 23, "25-ea" -> 25, and the old "1.8.0_391" -> 8.
 * Returns undefined when there's no version in the text.
 */
export function parseJavaMajor(versionOutput: string): number | undefined {
  const match = /version "(\d+)(?:\.(\d+))?/.exec(versionOutput);
  if (!match) return undefined;

  const first = Number(match[1]);
  const major = first === 1 ? Number(match[2] ?? Number.NaN) : first;
  return Number.isNaN(major) ? undefined : major;
}

/**
 * Looks for the `java` on PATH. Returns undefined when there isn't one that
 * runs; otherwise its major version (itself undefined if the output wasn't
 * something we understand).
 */
export function detectJava(): { major: number | undefined } | undefined {
  // `java -version` writes to stderr, so both streams are read.
  const result = spawnSync('java', ['-version'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) return undefined;

  return { major: parseJavaMajor(`${result.stdout}\n${result.stderr}`) };
}
