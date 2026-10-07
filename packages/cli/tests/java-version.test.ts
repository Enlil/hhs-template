import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateProject } from '../src/core/generate-project.js';
import { parseJavaMajor } from '../src/core/java.js';
import { backendRegistry } from '../src/registry/index.js';
import type { OptionValue, TemplateVariables } from '../src/registry/types.js';

const originalPath = process.env.PATH;
let workDir: string;

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-java-'));
});

afterEach(async () => {
  process.env.PATH = originalPath;
  await fs.rm(workDir, { recursive: true, force: true });
});

describe('parseJavaMajor', () => {
  it.each([
    ['openjdk version "23.0.2" 2025-01-21\nOpenJDK Runtime Environment Homebrew (build 23.0.2)', 23],
    ['openjdk version "21.0.4" 2024-07-16 LTS', 21],
    ['openjdk version "17.0.14" 2025-01-21 LTS', 17],
    ['java version "22.0.1" 2024-04-16', 22],
    ['openjdk version "25" 2025-09-16 LTS', 25],
    ['openjdk version "25-ea" 2025-09-16', 25],
    // Java 8 and older call themselves 1.8, 1.7, ...
    ['java version "1.8.0_391"', 8],
  ])('reads %j as Java %i', (output, major) => {
    expect(parseJavaMajor(output)).toBe(major);
  });

  it.each([
    [''],
    ['command not found: java'],
    ['The operation couldn’t be completed. Unable to locate a Java Runtime.'],
    ['openjdk version "one"'],
  ])('gives up on %j', (output) => {
    expect(parseJavaMajor(output)).toBeUndefined();
  });
});

describe('Spring Boot "java-version" option, in a generated project', () => {
  async function generate(options?: Record<string, OptionValue>) {
    return generateProject({
      projectName: 'version-check',
      frontend: 'react',
      backend: 'springboot',
      cwd: workDir,
      skipInstall: true,
      options,
    });
  }
  type Generated = Awaited<ReturnType<typeof generate>>;

  const read = (result: Generated, relPath: string): Promise<string> =>
    fs.readFile(path.join(result.projectDir, relPath), 'utf8');

  it('builds for Java 25 unless told otherwise', async () => {
    const result = await generate();

    expect(result.variables.javaVersion).toBe('25');
    expect(await read(result, 'apps/api/pom.xml')).toContain('<java.version>25</java.version>');
  });

  it.each(['17', '21', '25'])('Java %s reaches the pom, both READMEs and the prerequisites', async (version) => {
    const result = await generate({ 'java-version': version });

    expect(result.variables.javaVersion).toBe(version);
    expect(await read(result, 'apps/api/pom.xml')).toContain(`<java.version>${version}</java.version>`);
    expect(await read(result, 'apps/api/README.md')).toContain(`Spring Boot 3 (Java ${version})`);
    expect(await read(result, 'apps/api/README.md')).toContain(`**JDK ${version}+**`);
    // The root README's prerequisites come from the registry text, filled in with the picked version.
    expect(await read(result, 'README.md')).toContain(`- JDK ${version}+ (https://adoptium.net)`);
    expect(result.variables.backendPrerequisiteLine).toContain(`JDK ${version}+`);
  });

  it('mentions only the picked version, never another one', async () => {
    const result = await generate({ 'java-version': '17' });

    for (const file of ['apps/api/pom.xml', 'apps/api/README.md', 'README.md']) {
      const text = await read(result, file);
      expect(text, file).not.toMatch(/JDK (21|25)|Java (21|25)|<java\.version>(21|25)</);
      expect(text, file).not.toContain('{{');
    }
  });

  it('works together with Lombok', async () => {
    const result = await generate({ 'java-version': '21', lombok: true });

    expect(result.options).toEqual(['lombok']);
    const pom = await read(result, 'apps/api/pom.xml');
    expect(pom).toContain('<java.version>21</java.version>');
    expect(pom).toContain('org.projectlombok');
  });

  it('is not a template variable for stacks that have no Java', async () => {
    const result = await generateProject({
      projectName: 'node-check',
      frontend: 'react',
      backend: 'node',
      cwd: workDir,
      skipInstall: true,
    });

    expect(result.variables).not.toHaveProperty('javaVersion');
    expect(await fs.readFile(path.join(result.projectDir, 'README.md'), 'utf8')).not.toMatch(/JDK/);
  });

  it('rejects a version that is not offered, before creating anything', async () => {
    await expect(generate({ 'java-version': '99' })).rejects.toThrow(/must be one of: 25, 21, 17/);
    expect(await fs.readdir(workDir)).toEqual([]);
  });
});

describe.skipIf(process.platform === 'win32')('Spring Boot setup step: checking the JDK on PATH', () => {
  const springboot = backendRegistry.springboot;

  /**
   * Puts a stand-in `java` ahead of everything on PATH (or nothing at all), and
   * a stand-in `mvnw` in a fake project, so the step can run without a real JDK
   * or any download. `mvnwRan()` says whether the step went on to call Maven.
   */
  async function arrange(java: { output: string; exitCode?: number } | null) {
    const binDir = path.join(workDir, 'bin');
    await fs.mkdir(binDir);
    if (java) {
      await fs.writeFile(path.join(binDir, 'java'), `#!/bin/sh\necho '${java.output}' 1>&2\nexit ${java.exitCode ?? 0}\n`, { mode: 0o755 });
    }
    // With no stand-in `java`, PATH holds only the empty folder, so no real java (or macOS's /usr/bin/java stub) can be found.
    process.env.PATH = java ? `${binDir}${path.delimiter}${originalPath ?? ''}` : binDir;

    const projectDir = path.join(workDir, 'project');
    await fs.mkdir(path.join(projectDir, 'apps/api'), { recursive: true });
    await fs.writeFile(path.join(projectDir, 'apps/api/mvnw'), '#!/bin/sh\ntouch ran.txt\n', { mode: 0o755 });

    return {
      projectDir,
      mvnwRan: async () => fs.access(path.join(projectDir, 'apps/api/ran.txt')).then(() => true, () => false),
    };
  }

  async function runStep(projectDir: string, javaVersion: string): Promise<string[]> {
    const logs: string[] = [];
    await springboot.postInstall?.({
      projectDir,
      variables: { javaVersion } as unknown as TemplateVariables,
      log: (message) => logs.push(message),
    });
    return logs;
  }

  it('warns when the JDK is older than the Java version the project is set up for, and carries on', async () => {
    const { projectDir, mvnwRan } = await arrange({ output: 'openjdk version "21.0.4" 2024-07-16 LTS' });

    const logs = await runStep(projectDir, '25');

    const warning = logs.find((line) => line.startsWith('Warning:'));
    expect(warning).toContain('set up for Java 25');
    expect(warning).toContain('is Java 21');
    expect(warning).toContain('--java-version');
    // Maven runs fine on an older JDK, so the dependency prefetch still happens.
    expect(await mvnwRan()).toBe(true);
  });

  it('reads the old "1.8" style of version too', async () => {
    const { projectDir } = await arrange({ output: 'java version "1.8.0_391"' });

    expect(await runStep(projectDir, '17')).toContainEqual(expect.stringContaining('is Java 8'));
  });

  it.each([
    ['exactly the right JDK', 'openjdk version "25" 2025-09-16 LTS', '25'],
    ['a newer JDK than needed', 'openjdk version "23.0.2" 2025-01-21', '21'],
  ])('stays quiet with %s', async (_label, output, wanted) => {
    const { projectDir, mvnwRan } = await arrange({ output });

    const logs = await runStep(projectDir, wanted);

    expect(logs.some((line) => /warning|skipped/i.test(line))).toBe(false);
    expect(await mvnwRan()).toBe(true);
  });

  it('stays quiet when it cannot tell which version the JDK is', async () => {
    const { projectDir, mvnwRan } = await arrange({ output: 'some unusual vendor banner' });

    expect(await runStep(projectDir, '25')).not.toContainEqual(expect.stringMatching(/warning/i));
    expect(await mvnwRan()).toBe(true);
  });

  it.each([
    ['no java on PATH', null],
    ['a java that fails to run', { output: 'Unable to locate a Java Runtime.', exitCode: 1 }],
  ])('skips the prefetch and says what to install when there is %s', async (_label, java) => {
    const { projectDir, mvnwRan } = await arrange(java);

    const logs = await runStep(projectDir, '25');

    expect(logs[0]).toMatch(/^Skipped Maven dependency prefetch/);
    expect(logs[1]).toContain('Install JDK 25 or newer');
    expect(await mvnwRan()).toBe(false);
  });
});
