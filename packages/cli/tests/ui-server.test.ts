import { spawn, spawnSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync, promises as fs, readFileSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { networkInterfaces, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { backendChoices, frontendChoices } from '../src/registry/index.js';
import { startUiServer } from '../src/ui/server.js';
import type { RunningUiServer } from '../src/ui/server.js';
import { CLI_ENTRY, TSX_CLI, waitFor } from './helpers.js';

const FAKE_CLI = fileURLToPath(new URL('./fixtures/fake-cli.mjs', import.meta.url));
const REAL_CLI = { command: process.execPath, args: [TSX_CLI, CLI_ENTRY] };

interface UiEvent {
  type: string;
  [key: string]: unknown;
}

let workDir: string;
let server: RunningUiServer | undefined;
const children: ChildProcess[] = [];

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-ui-'));
});

afterEach(async () => {
  for (const child of children.splice(0)) child.kill();
  await server?.close();
  server = undefined;
  await fs.rm(workDir, { recursive: true, force: true });
});

async function startServer(cliCommand: { command: string; args: string[] }): Promise<void> {
  server = await startUiServer({ defaultDirectory: workDir, version: '9.9.9', cliCommand });
}

function running(): RunningUiServer {
  if (!server) throw new Error('The server was not started.');
  return server;
}

function request(
  pathname: string,
  init: { method?: string; body?: string; headers?: Record<string, string>; token?: string | null } = {},
): Promise<Response> {
  const { method = 'GET', body, headers = {}, token = running().token } = init;
  return fetch(new URL(pathname, running().url), {
    method,
    body,
    headers: { ...(token ? { 'X-CMA-Token': token } : {}), ...headers },
  });
}

function postJson(pathname: string, body: unknown, token?: string | null): Promise<Response> {
  return request(pathname, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    token,
  });
}

/** A plain request, for the things `fetch` won't let us do (a foreign Host header, an un-normalised path). */
function rawGet(urlPath: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  const { port } = new URL(running().url);
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, headers: { host: `127.0.0.1:${port}`, ...headers } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function canConnect(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

async function readEvents(response: Response): Promise<UiEvent[]> {
  return (await response.text())
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as UiEvent);
}

const logText = (events: UiEvent[]): string =>
  events
    .filter((event) => event.type === 'log')
    .map((event) => String(event.text))
    .join('');

const validBody = (overrides: Record<string, unknown> = {}) => ({
  projectName: 'demo-app',
  directory: workDir,
  frontend: 'react',
  backend: 'node',
  options: {},
  install: false,
  ...overrides,
});

describe('local UI server', () => {
  beforeEach(() => startServer({ command: process.execPath, args: [FAKE_CLI] }));

  describe('page and files', () => {
    it('serves the page and its files, with locked-down headers', async () => {
      const page = await request('/', { token: null });
      expect(page.status).toBe(200);
      expect(page.headers.get('content-type')).toContain('text/html');
      expect(page.headers.get('content-security-policy')).toContain("default-src 'none'");
      expect(page.headers.get('x-content-type-options')).toBe('nosniff');
      expect(page.headers.get('cache-control')).toBe('no-store');

      const html = await page.text();
      expect(html).toContain('<title>create-my-app</title>');
      // The policy blocks inline scripts and style attributes, so the page must not rely on either.
      expect(html).not.toMatch(/<script(?![^>]*\bsrc=)/);
      expect(html).not.toMatch(/\sstyle=/);

      // Everything the page loads is something the server actually serves.
      const referenced = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((match) => match[1] ?? '');
      expect(referenced).toEqual(expect.arrayContaining(['/app.js', '/styles.css', '/tokens.css', '/hhs-seal.png']));
      for (const url of referenced) {
        expect((await request(url, { token: null })).status, url).toBe(200);
      }
    });

    it('serves each file with the right type', async () => {
      for (const [url, type] of [
        ['/app.js', 'text/javascript'],
        ['/styles.css', 'text/css'],
        ['/tokens.css', 'text/css'],
        ['/hhs-seal.png', 'image/png'],
      ] as const) {
        const response = await request(url, { token: null });
        expect(response.headers.get('content-type'), url).toContain(type);
      }

      const seal = Buffer.from(await (await request('/hhs-seal.png', { token: null })).arrayBuffer());
      expect(seal.subarray(1, 4).toString()).toBe('PNG');
      expect(await (await request('/tokens.css', { token: null })).text()).toContain('--color-primary');
    });

    it('serves only the files on its list, however the path is written', async () => {
      for (const urlPath of ['/package.json', '/../../package.json', '/%2e%2e/%2e%2e/package.json', '/app.js/../../package.json', '/src/ui/server.ts']) {
        const { status, body } = await rawGet(urlPath);
        expect(status, urlPath).toBe(404);
        expect(body, urlPath).not.toContain('"name": "create-my-app"');
      }
    });
  });

  describe('keeping other websites out', () => {
    it('rejects a Host header that is not this server (DNS rebinding)', async () => {
      const { port } = new URL(running().url);

      expect((await rawGet('/', { host: 'evil.example' })).status).toBe(403);
      expect((await rawGet('/', { host: `evil.example:${port}` })).status).toBe(403);
      expect((await rawGet('/api/registry', { host: 'evil.example', 'x-cma-token': running().token })).status).toBe(403);

      // Both ways of writing this machine are fine.
      expect((await rawGet('/', { host: `localhost:${port}` })).status).toBe(200);
      expect((await rawGet('/', { host: `127.0.0.1:${port}` })).status).toBe(200);
    });

    it('needs the one-time key for every API call', async () => {
      const wrongOfSameLength = 'x'.repeat(running().token.length);

      for (const token of [null, '', 'wrong', wrongOfSameLength]) {
        expect((await request('/api/registry', { token })).status, `GET with key ${JSON.stringify(token)}`).toBe(403);
        expect((await postJson('/api/generate', validBody(), token)).status, `generate with key ${JSON.stringify(token)}`).toBe(403);
        expect((await postJson('/api/shutdown', {}, token)).status, `shutdown with key ${JSON.stringify(token)}`).toBe(403);
      }

      // Nothing above got far enough to create a project or stop the server.
      expect(await fs.readdir(workDir)).toEqual([]);
      expect((await request('/api/registry')).status).toBe(200);
    });

    it('only listens on the loopback address, not on the network', async () => {
      expect(running().url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/\?token=[\w-]{20,}$/);

      const port = Number(new URL(running().url).port);
      expect(await canConnect('127.0.0.1', port)).toBe(true);

      // This machine's own address on the network must be refused (skipped on a machine with no network).
      const networkAddress = Object.values(networkInterfaces())
        .flat()
        .find((entry) => entry?.family === 'IPv4' && !entry.internal)?.address;
      if (networkAddress) {
        expect(await canConnect(networkAddress, port), `reachable on ${networkAddress}`).toBe(false);
      }
    });
  });

  describe('GET /api/registry', () => {
    it('describes what the registry offers, without leaking paths or hooks', async () => {
      const data = (await (await request('/api/registry')).json()) as {
        version: string;
        defaultDirectory: string;
        frontends: Array<{ id: string; options: Array<Record<string, unknown>> }>;
        backends: Array<{ id: string; prerequisite?: string; options: Array<Record<string, unknown>> }>;
      };

      expect(data.version).toBe('9.9.9');
      expect(data.defaultDirectory).toBe(workDir);
      expect(data.frontends.map((entry) => entry.id)).toEqual(frontendChoices.map((entry) => entry.id));
      expect(data.backends.map((entry) => entry.id)).toEqual(backendChoices.map((entry) => entry.id));

      // Both frontends offer the same CSS framework choice.
      for (const frontend of data.frontends) {
        expect(frontend.options, frontend.id).toEqual([
          {
            id: 'css-framework',
            key: 'cssFramework',
            kind: 'choice',
            label: 'CSS framework',
            description: expect.any(String),
            default: 'tailwind',
            choices: [
              { value: 'tailwind', label: 'Tailwind CSS' },
              { value: 'material', label: 'Material Design' },
            ],
          },
        ]);
      }

      const springboot = data.backends.find((entry) => entry.id === 'springboot');
      expect(springboot?.options).toEqual([
        {
          id: 'java-version',
          key: 'javaVersion',
          kind: 'choice',
          label: 'Java version',
          description: expect.any(String),
          default: '25',
          choices: [
            { value: '25', label: '25 (LTS)' },
            { value: '21', label: '21 (LTS)' },
            { value: '17', label: '17 (LTS)' },
          ],
        },
        { id: 'lombok', key: 'lombok', kind: 'toggle', label: 'Lombok', description: expect.any(String), default: false },
      ]);
      // The card's text keeps its placeholder: the page fills it in with whichever Java version is picked.
      expect(springboot?.prerequisite).toContain('{{javaVersion}}');
      expect(data.backends.find((entry) => entry.id === 'node')?.options).toEqual([]);
      expect(data.backends.find((entry) => entry.id === 'dotnet')?.prerequisite).toContain('.NET SDK');

      const raw = JSON.stringify(data);
      expect(raw).not.toContain('templateDir');
      expect(raw).not.toContain('postInstall');
    });
  });

  describe('POST /api/generate: bad requests', () => {
    const WORKDIR = '$WORKDIR';
    const fill = <T>(value: T): T =>
      JSON.parse(JSON.stringify(value).replaceAll(WORKDIR, JSON.stringify(workDir).slice(1, -1))) as T;

    it.each<[string, Record<string, unknown>, string, RegExp]>([
      ['an empty name', { projectName: '' }, 'projectName', /empty/],
      ['a name with capitals and spaces', { projectName: 'Bad Name' }, 'projectName', /lowercase/],
      ['a name that looks like a flag', { projectName: '--help' }, 'projectName', /lowercase/],
      ['a name that is not text', { projectName: 42 }, 'projectName', /empty/],
      ['an unknown frontend', { frontend: 'vue' }, 'frontend', /Unknown frontend "vue"/],
      ['an unknown backend', { backend: 'rails' }, 'backend', /Unknown backend "rails"/],
      ['an option the backend does not have', { options: { lombok: true } }, 'options', /lombok/],
      ['an option that does not exist', { options: { nope: true } }, 'options', /nope/],
      ['text for an on/off option', { backend: 'springboot', options: { lombok: 'yes' } }, 'options', /must be true or false/],
      ['a Java version that is not offered', { backend: 'springboot', options: { 'java-version': '99' } }, 'options', /must be one of: 25, 21, 17/],
      ['a Java version that is a number', { backend: 'springboot', options: { 'java-version': 21 } }, 'options', /true\/false or text/],
      ['a Java version for a backend without Java', { options: { 'java-version': '21' } }, 'options', /java-version.*Spring Boot/],
      ['a CSS framework that is not offered', { options: { 'css-framework': 'bootstrap' } }, 'options', /must be one of: tailwind, material/],
      ['options that are not an object', { options: ['lombok'] }, 'options', /true\/false or text/],
      ['install that is not true/false', { install: 'no' }, 'install', /true or false/],
      ['no folder', { directory: '' }, 'directory', /Choose a folder/],
      ['a folder that does not exist', { directory: `${WORKDIR}/nope` }, 'directory', /doesn't exist/],
    ])('rejects %s and says which field it is about', async (_label, overrides, field, message) => {
      const response = await postJson('/api/generate', fill(validBody(overrides)));

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string; field?: string };
      expect(data.field).toBe(field);
      expect(data.error).toMatch(message);
      expect(await fs.readdir(workDir)).toEqual([]);
    });

    it('rejects a folder that is really a file', async () => {
      const file = path.join(workDir, 'a-file');
      await fs.writeFile(file, 'x');

      const response = await postJson('/api/generate', validBody({ directory: file }));
      expect(response.status).toBe(400);
      expect(((await response.json()) as { field: string }).field).toBe('directory');
    });

    it('rejects a project folder that already has files in it, and leaves them alone', async () => {
      await fs.mkdir(path.join(workDir, 'demo-app'));
      await fs.writeFile(path.join(workDir, 'demo-app', 'mine.txt'), 'keep me');

      const response = await postJson('/api/generate', validBody());
      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string; field: string };
      expect(data.field).toBe('projectName');
      expect(data.error).toMatch(/already exists/);
      expect(await fs.readdir(path.join(workDir, 'demo-app'))).toEqual(['mine.txt']);
    });

    it('accepts an empty project folder that already exists', async () => {
      await fs.mkdir(path.join(workDir, 'demo-app'));

      const response = await postJson('/api/generate', validBody());
      expect(response.status).toBe(200);
      expect((await readEvents(response)).at(-1)?.type).toBe('done');
    });

    it('rejects anything that is not JSON, or is too big', async () => {
      const wrongType = await request('/api/generate', { method: 'POST', body: '{}', headers: { 'Content-Type': 'text/plain' } });
      expect(wrongType.status).toBe(415);

      const notJson = await request('/api/generate', { method: 'POST', body: 'not json', headers: { 'Content-Type': 'application/json' } });
      expect(notJson.status).toBe(400);

      const notAnObject = await postJson('/api/generate', ['demo-app']);
      expect(notAnObject.status).toBe(400);

      const tooBig = await postJson('/api/generate', { padding: 'x'.repeat(100_000) });
      expect(tooBig.status).toBe(413);
    });

    it('also refuses a too-big body that arrives in chunks, with no size announced up front', async () => {
      const { port } = new URL(running().url);
      const status = await new Promise<number>((resolve, reject) => {
        const req = http.request(
          {
            host: '127.0.0.1',
            port,
            method: 'POST',
            path: '/api/generate',
            headers: { host: `127.0.0.1:${port}`, 'content-type': 'application/json', 'x-cma-token': running().token },
          },
          (res) => {
            res.resume();
            resolve(res.statusCode ?? 0);
          },
        );
        req.on('error', reject);
        for (let i = 0; i < 100; i++) req.write('x'.repeat(1024)); // 100 KB, written without a Content-Length, so sent chunked
        req.end();
      });

      expect(status).toBe(413);
    });

    it('answers unknown API paths with 404', async () => {
      expect((await request('/api/nope')).status).toBe(404);
      expect((await postJson('/api/registry', {})).status).toBe(404);
    });
  });

  describe('POST /api/generate: running the CLI', () => {
    it('runs it in the chosen folder with the right arguments, streaming its output', async () => {
      const response = await postJson(
        '/api/generate',
        validBody({
          frontend: 'react',
          backend: 'springboot',
          options: { 'java-version': '21', lombok: true },
          install: false,
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/x-ndjson');
      const events = await readEvents(response);
      const projectDir = path.join(workDir, 'demo-app');

      expect(events[0]).toEqual({
        type: 'start',
        command:
          'npx create-my-app demo-app --frontend react --backend springboot --css-framework tailwind --java-version 21 --lombok --skip-install',
      });

      const log = logText(events);
      // The temp folder may be reached through a symlink (macOS), so compare real paths.
      expect(log).toContain(`cwd=${await fs.realpath(workDir)}`);
      // A choice goes over as two arguments (flag, then value), not one; the frontend's options come before the backend's.
      expect(log).toContain(
        `args=${JSON.stringify([
          'demo-app',
          '--frontend',
          'react',
          '--backend',
          'springboot',
          '--css-framework',
          'tailwind',
          '--java-version',
          '21',
          '--lombok',
          '--skip-install',
        ])}`,
      );

      const done = events.at(-1);
      expect(done).toMatchObject({ type: 'done', projectDir, warnings: [] });
      const nextSteps = (done?.nextSteps ?? []) as string[];
      expect(nextSteps[0]).toMatch(/^cd /);
      expect(nextSteps[0]).toContain(projectDir);
      expect(nextSteps.slice(1)).toEqual(['npm install', 'npm run dev']);
    });

    it.each([
      {
        name: 'react + node with install on',
        body: { install: true },
        command: 'npx create-my-app demo-app --frontend react --backend node --css-framework tailwind',
        steps: ['npm run dev'],
      },
      {
        name: 'Material Design picked for Angular',
        body: { frontend: 'angular', options: { 'css-framework': 'material' }, install: false },
        command: 'npx create-my-app demo-app --frontend angular --backend node --css-framework material --skip-install',
        steps: ['npm install', 'npm run dev'],
      },
      {
        name: 'angular + spring boot with Lombok left off',
        body: { frontend: 'angular', backend: 'springboot', options: {}, install: true },
        command: 'npx create-my-app demo-app --frontend angular --backend springboot --css-framework tailwind --java-version 25 --no-lombok',
        steps: ['npm run dev'],
      },
      {
        name: 'a Lombok choice sent as off',
        body: { backend: 'springboot', options: { lombok: false }, install: false },
        command: 'npx create-my-app demo-app --frontend react --backend springboot --css-framework tailwind --java-version 25 --no-lombok --skip-install',
        steps: ['npm install', 'npm run dev'],
      },
      {
        name: 'Java 17 picked',
        body: { backend: 'springboot', options: { 'java-version': '17' }, install: false },
        command: 'npx create-my-app demo-app --frontend react --backend springboot --css-framework tailwind --java-version 17 --no-lombok --skip-install',
        steps: ['npm install', 'npm run dev'],
      },
    ])('passes the right flags for $name', async ({ body, command, steps }) => {
      const events = await readEvents(await postJson('/api/generate', validBody(body)));

      expect(events[0]).toEqual({ type: 'start', command });
      const done = events.at(-1);
      expect(done?.type).toBe('done');
      expect(((done?.nextSteps ?? []) as string[]).slice(1)).toEqual(steps);
    });

    it('trims the name and folder', async () => {
      const events = await readEvents(await postJson('/api/generate', validBody({ projectName: '  demo-app  ', directory: `  ${workDir}  ` })));

      expect(events[0]).toMatchObject({ command: expect.stringContaining('create-my-app demo-app --frontend') });
      expect(events.at(-1)?.type).toBe('done');
    });

    it('reports the message the CLI printed when it fails', async () => {
      const response = await postJson('/api/generate', validBody({ projectName: 'fail-me' }));

      // The stream had already started, so this is a normal 200 whose last event is the error.
      expect(response.status).toBe(200);
      const events = await readEvents(response);
      expect(events.at(-1)).toEqual({ type: 'error', message: 'Something broke: reason A\nsecond line' });
      expect(logText(events)).toContain('✖ Something broke');
    });

    it('reports a CLI it cannot start', async () => {
      await server?.close();
      await startServer({ command: path.join(workDir, 'no-such-program'), args: [] });

      const events = await readEvents(await postJson('/api/generate', validBody()));
      expect(events.at(-1)).toMatchObject({ type: 'error', message: expect.stringContaining("Couldn't start the generator") });
    });

    it('passes along warnings, and asks for npm install when the install did not finish', async () => {
      const events = await readEvents(await postJson('/api/generate', validBody({ projectName: 'warn-me', install: true })));

      const done = events.at(-1);
      expect(done?.type).toBe('done');
      expect(done?.warnings).toEqual([
        'Warning: "npm install" did not finish successfully. You can retry it manually in the project directory.',
        'Skipped Maven dependency prefetch — no JDK was found on your PATH.',
      ]);
      // Install was asked for, but the warning says it failed, so the steps still include it.
      expect(((done?.nextSteps ?? []) as string[]).slice(1)).toEqual(['npm install', 'npm run dev']);
    });

    it('quotes a folder with spaces in the cd command', async () => {
      const spaced = path.join(workDir, 'my folder');
      await fs.mkdir(spaced);

      const events = await readEvents(await postJson('/api/generate', validBody({ directory: spaced })));
      const cd = ((events.at(-1)?.nextSteps ?? []) as string[])[0];

      expect(cd).toBe(process.platform === 'win32' ? `cd "${path.join(spaced, 'demo-app')}"` : `cd '${path.join(spaced, 'demo-app')}'`);
    });

    it('does one project at a time, and will not stop in the middle of one', async () => {
      const first = await postJson('/api/generate', validBody({ projectName: 'slow-app' }));
      const reader = (first.body as ReadableStream<Uint8Array>).getReader();
      await reader.read(); // the first chunk is the "start" event: the generator is now running

      const second = await postJson('/api/generate', validBody({ projectName: 'other-app' }));
      expect(second.status).toBe(409);
      expect(((await second.json()) as { error: string }).error).toMatch(/still being created/);

      const stop = await postJson('/api/shutdown', {});
      expect(stop.status).toBe(409);

      await fs.writeFile(path.join(workDir, 'go'), ''); // lets the fake CLI finish
      let rest = '';
      const decoder = new TextDecoder();
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        rest += decoder.decode(chunk.value);
      }
      expect(rest).toContain('"type":"done"');

      // Free again afterwards.
      const third = await postJson('/api/generate', validBody({ projectName: 'third-app' }));
      expect(third.status).toBe(200);
      expect((await readEvents(third)).at(-1)?.type).toBe('done');
    });
  });

  describe('POST /api/shutdown', () => {
    it('stops the server', async () => {
      const response = await postJson('/api/shutdown', {});
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });

      await running().closed;
      await expect(request('/api/registry')).rejects.toThrow();
    });
  });
});

describe('local UI server with the real CLI', () => {
  beforeEach(() => startServer(REAL_CLI));

  it('writes a Spring Boot project with the picked Java version and Lombok, straight into the chosen folder', async () => {
    const events = await readEvents(
      await postJson(
        '/api/generate',
        validBody({ projectName: 'real-app', backend: 'springboot', options: { 'java-version': '21', lombok: true } }),
      ),
    );

    const done = events.at(-1);
    expect(done?.type, JSON.stringify(events.slice(-3))).toBe('done');
    expect(done?.projectDir).toBe(path.join(workDir, 'real-app'));
    expect(logText(events)).toContain('real-app is ready.');

    const project = path.join(workDir, 'real-app');
    const pom = await fs.readFile(path.join(project, 'apps/api/pom.xml'), 'utf8');
    expect(pom).toContain('org.projectlombok');
    expect(pom).toContain('<java.version>21</java.version>');
    expect(await fs.readFile(path.join(project, 'apps/web/package.json'), 'utf8')).toContain('"name": "real-app-web"');
    // Install was off, so nothing was downloaded.
    await expect(fs.stat(path.join(project, 'node_modules'))).rejects.toThrow();
  });

  it('writes a React project with the Material Design look, with Material UI added to its dependencies', async () => {
    const events = await readEvents(
      await postJson('/api/generate', validBody({ projectName: 'real-mui', options: { 'css-framework': 'material' } })),
    );

    expect(events.at(-1)?.type, JSON.stringify(events.slice(-3))).toBe('done');
    const web = path.join(workDir, 'real-mui', 'apps/web');
    const packageJson = JSON.parse(await fs.readFile(path.join(web, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(packageJson.dependencies)).toEqual(
      expect.arrayContaining(['@mui/material', '@emotion/react', 'react', 'react-router-dom']),
    );
    await expect(fs.stat(path.join(web, 'src/theme.ts'))).resolves.toBeDefined();
  });

  it('writes an Angular + Node.js project with no extras', async () => {
    const events = await readEvents(
      await postJson('/api/generate', validBody({ projectName: 'real-ng', frontend: 'angular', backend: 'node' })),
    );

    expect(events.at(-1)?.type, JSON.stringify(events.slice(-3))).toBe('done');
    const project = path.join(workDir, 'real-ng');
    await expect(fs.stat(path.join(project, 'apps/web/angular.json'))).resolves.toBeDefined();
    // The default CSS framework is Tailwind.
    await expect(fs.stat(path.join(project, 'apps/web/.postcssrc.json'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(project, 'apps/api/src/main.ts'))).resolves.toBeDefined();
    await expect(fs.stat(path.join(project, 'apps/api/pom.xml'))).rejects.toThrow();
  });

  // Read-only folders don't stop root (and work differently on Windows), so this one can't run everywhere.
  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    'reports the real CLI error when it cannot write into the project folder',
    async () => {
      // The server's own checks pass (an empty folder is fine); the CLI then fails when it tries to write.
      const target = path.join(workDir, 'real-broken');
      await fs.mkdir(target);
      await fs.chmod(target, 0o555);
      try {
        const events = await readEvents(await postJson('/api/generate', validBody({ projectName: 'real-broken' })));

        expect(events.at(-1)).toMatchObject({ type: 'error', message: expect.stringMatching(/EACCES|permission denied/i) });
      } finally {
        await fs.chmod(target, 0o755);
      }
    },
  );
});

describe('create-my-app --ui', () => {
  const spawnCli = (args: string[], env: Record<string, string> = {}): ChildProcess => {
    const child = spawn(process.execPath, [TSX_CLI, CLI_ENTRY, ...args], {
      cwd: workDir,
      // NO_COLOR keeps the printed link free of colour codes, which a CI environment would otherwise switch on.
      env: { ...process.env, NO_COLOR: '1', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    return child;
  };

  /** Starts `create-my-app --ui ...`, waits for it to print its link, and returns what the tests need to talk to it. */
  async function startUiCommand(args: string[], env: Record<string, string> = {}) {
    const child = spawnCli(args, env);
    let output = '';
    child.stdout?.setEncoding('utf8').on('data', (text: string) => (output += text));
    const closed = new Promise<number | null>((resolve) => child.once('close', resolve));

    const link = await waitFor(() => /http:\/\/127\.0\.0\.1:\d+\/\?token=\S+/.exec(output)?.[0]);
    const headers = { 'X-CMA-Token': new URL(link).searchParams.get('token') ?? '' };
    return {
      link,
      headers,
      closed,
      output: () => output,
      stop: () => fetch(new URL('/api/shutdown', link), { method: 'POST', headers }),
    };
  }

  /** A stand-in for the system's browser opener: it records the link it is given instead of opening anything. */
  async function fakeOpener() {
    const binDir = await fs.mkdtemp(path.join(tmpdir(), 'create-my-app-open-'));
    const record = path.join(binDir, 'link.txt');
    const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
    await fs.writeFile(
      path.join(binDir, opener),
      `#!/bin/sh\nprintf '%s' "$1" > '${record}.tmp' && mv '${record}.tmp' '${record}'\n`,
      { mode: 0o755 },
    );
    return {
      env: { PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ''}` },
      opened: (): string | undefined => (existsSync(record) ? readFileSync(record, 'utf8') : undefined),
      cleanup: () => fs.rm(binDir, { recursive: true, force: true }),
    };
  }

  it('refuses to be mixed with answers given as flags', () => {
    const result = spawnSync(process.execPath, [TSX_CLI, CLI_ENTRY, '--ui', 'my-app', '--frontend', 'react', '--lombok'], {
      cwd: workDir,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--ui opens a form');
    expect(result.stderr).toContain('a project name');
    expect(result.stderr).toContain('--frontend');
    expect(result.stderr).toContain('--[no-]lombok');
  });

  it('refuses --no-open without --ui', () => {
    const result = spawnSync(process.execPath, [TSX_CLI, CLI_ENTRY, '--no-open'], { cwd: workDir, encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--no-open only works together with --ui');
  });

  it(
    'prints a link, serves the form, creates a project by running itself, and exits when stopped',
    async () => {
      const ui = await startUiCommand(['--ui', '--no-open']);

      const registry = (await (await fetch(new URL('/api/registry', ui.link), { headers: ui.headers })).json()) as {
        defaultDirectory: string;
      };
      // The form's folder box starts where the command was run.
      expect(registry.defaultDirectory).toBe(await fs.realpath(workDir));

      // No custom CLI command here: the server re-runs the very command that started it.
      const generated = await fetch(new URL('/api/generate', ui.link), {
        method: 'POST',
        headers: { ...ui.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody({ projectName: 'self-run' })),
      });
      const events = await readEvents(generated);
      expect(events.at(-1)?.type, JSON.stringify(events.slice(-3))).toBe('done');
      await expect(fs.stat(path.join(workDir, 'self-run', 'apps/web/package.json'))).resolves.toBeDefined();

      expect((await ui.stop()).status).toBe(200);
      expect(await ui.closed).toBe(0);
      expect(ui.output()).toContain('Stopped.');
    },
    60_000,
  );

  // `open` / `xdg-open` are found on PATH, so a stand-in ahead of them shows what they'd be given. (Windows uses rundll32.)
  describe.skipIf(process.platform === 'win32')('opening the browser', () => {
    it('hands the printed link to the system opener', async () => {
      const opener = await fakeOpener();
      try {
        const ui = await startUiCommand(['--ui'], opener.env);

        expect(await waitFor(opener.opened)).toBe(ui.link);

        await ui.stop();
        expect(await ui.closed).toBe(0);
      } finally {
        await opener.cleanup();
      }
    });

    it('does not open anything with --no-open', async () => {
      const opener = await fakeOpener();
      try {
        const ui = await startUiCommand(['--ui', '--no-open'], opener.env);
        // The opener (when asked) runs within moments of the link being printed.
        await new Promise((resolve) => setTimeout(resolve, 400));

        expect(opener.opened()).toBeUndefined();

        await ui.stop();
        await ui.closed;
      } finally {
        await opener.cleanup();
      }
    });

    it('carries on, and says so, when no browser can be opened', async () => {
      const ui = await startUiCommand(['--ui'], { PATH: path.join(workDir, 'no-such-bin') });
      await waitFor(() => (ui.output().includes("Couldn't open a browser by itself") ? true : undefined));

      // Still serving.
      expect((await fetch(new URL('/api/registry', ui.link), { headers: ui.headers })).status).toBe(200);

      await ui.stop();
      expect(await ui.closed).toBe(0);
    });
  });
});
