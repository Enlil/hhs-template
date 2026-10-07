import { spawn } from 'node:child_process';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { constants as fsConstants, promises as fs } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTemplatesRoot } from '../core/paths.js';
import { resolveOptions } from '../core/resolve-options.js';
import { validateProjectName } from '../core/validate-project-name.js';
import { backendChoices, frontendChoices, optionFlagKey } from '../registry/index.js';
import type { BackendTemplate, FrontendTemplate, OptionValue } from '../registry/types.js';

export interface UiServerOptions {
  /** What the "folder" box starts with: where the command was run. */
  defaultDirectory: string;
  version: string;
  /** 0 (the default) picks any free port. */
  port?: number;
  /** How to run the CLI for one generation. Defaults to re-running this very process's entry file. */
  cliCommand?: { command: string; args: string[] };
}

export interface RunningUiServer {
  /** The link to open. It carries the one-time token. */
  url: string;
  token: string;
  /** Resolves once the server has stopped. */
  closed: Promise<void>;
  close(): Promise<void>;
}

const TOKEN_HEADER = 'x-cma-token';
const MAX_BODY_BYTES = 64 * 1024;
// The page only ever loads its own files, so nothing else is allowed. form-action
// 'none' means a form can never post anywhere even if the page's script failed.
const CONTENT_SECURITY_POLICY =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

const uiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../ui');
const sharedAsset = (...segments: string[]) => (): string => path.join(resolveTemplatesRoot(), 'shared', ...segments);

// The only files ever served, looked up by exact URL — there's no path to traverse.
const STATIC_FILES = new Map<string, { file: () => string; type: string }>([
  ['/', { file: () => path.join(uiDir, 'index.html'), type: 'text/html; charset=utf-8' }],
  ['/app.js', { file: () => path.join(uiDir, 'app.js'), type: 'text/javascript; charset=utf-8' }],
  ['/styles.css', { file: () => path.join(uiDir, 'styles.css'), type: 'text/css; charset=utf-8' }],
  ['/tokens.css', { file: sharedAsset('design-tokens', 'tokens.css'), type: 'text/css; charset=utf-8' }],
  ['/hhs-seal.png', { file: sharedAsset('assets', 'hhs-seal.png'), type: 'image/png' }],
]);

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Which form field the message is about, so the page can point at it. */
    readonly field?: string,
  ) {
    super(message);
  }
}

interface GenerateRequest {
  projectName: string;
  frontend: FrontendTemplate;
  backend: BackendTemplate;
  /** The final value of every option this frontend + backend offers (what was asked for, else the default). */
  options: Record<string, OptionValue>;
  /** Absolute path of an existing, writable folder; the project is created inside it. */
  directory: string;
  install: boolean;
}

export async function startUiServer(options: UiServerOptions): Promise<RunningUiServer> {
  const token = randomBytes(24).toString('base64url');
  const cli = options.cliCommand ?? { command: process.execPath, args: [...process.execArgv, process.argv[1] ?? ''] };
  let generating = false;

  const server = http.createServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      console.error(error);
      if (res.headersSent) {
        res.end();
      } else {
        sendJson(res, 500, { error: 'Something went wrong inside the generator. See the terminal for details.' });
      }
    });
  });

  async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);

    // A website on another domain can be pointed at 127.0.0.1 (DNS rebinding); its requests still carry its own Host.
    const { port } = server.address() as AddressInfo;
    if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) {
      return sendJson(res, 403, { error: 'Unexpected Host header.' });
    }

    let pathname: string;
    try {
      pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    } catch {
      return sendJson(res, 400, { error: 'Bad request.' });
    }

    const asset = STATIC_FILES.get(pathname);
    if (req.method === 'GET' && asset) {
      let data: Buffer;
      try {
        data = await fs.readFile(asset.file());
      } catch {
        return sendJson(res, 404, { error: 'Not found.' });
      }
      res.writeHead(200, { 'Content-Type': asset.type, 'Content-Length': data.length });
      res.end(data);
      return;
    }

    if (!pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'Not found.' });
    if (!tokenMatches(req.headers[TOKEN_HEADER])) {
      return sendJson(res, 403, { error: 'Missing or wrong key. Use the link the terminal printed.' });
    }

    try {
      switch (`${req.method} ${pathname}`) {
        case 'GET /api/registry':
          return sendJson(res, 200, describeRegistry(options));
        case 'POST /api/generate':
          return await generate(req, res);
        case 'POST /api/shutdown':
          return shutdown(res);
        default:
          return sendJson(res, 404, { error: 'Not found.' });
      }
    } catch (error) {
      if (error instanceof HttpError) return sendJson(res, error.status, { error: error.message, field: error.field });
      throw error;
    }
  }

  function tokenMatches(provided: string | string[] | undefined): boolean {
    if (typeof provided !== 'string') return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  async function generate(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (generating) throw new HttpError(409, 'Another project is still being created. Wait for it to finish.');
    generating = true;
    try {
      const request = await parseGenerateRequest(await readJson(req));
      await streamGeneration(res, request, cli);
    } finally {
      generating = false;
    }
  }

  function shutdown(res: http.ServerResponse): void {
    // Stopping now would cut the generator's output pipe in the middle of an install.
    if (generating) throw new HttpError(409, 'A project is still being created. Wait for it to finish.');
    res.setHeader('Connection', 'close');
    sendJson(res, 200, { ok: true });
    res.once('finish', () => void close());
  }

  let closing: Promise<void> | undefined;
  function close(): Promise<void> {
    closing ??= new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeIdleConnections();
      // Anything still open a moment later (a stalled browser tab, say) is cut off so the process can exit.
      setTimeout(() => server.closeAllConnections(), 1000).unref();
    });
    return closing;
  }

  const closed = new Promise<void>((resolve) => server.once('close', resolve));

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}/?token=${token}`, token, closed, close };
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

/**
 * Reads the whole body but keeps at most MAX_BODY_BYTES of it; anything beyond
 * that is read and thrown away. That way the "too large" reply always reaches
 * the client, instead of depending on how this Node version treats a request
 * abandoned halfway through its upload.
 */
function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size <= MAX_BODY_BYTES) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY_BYTES) reject(new HttpError(413, 'Request is too large.'));
      else resolve(Buffer.concat(chunks));
    });
    // A closed connection that never reached 'end' must not leave this promise (and the "busy" flag behind it) hanging.
    req.on('error', () => reject(new HttpError(400, 'The request was cut off.')));
    req.on('close', () => reject(new HttpError(400, 'The request was cut off.')));
  });
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  // Requiring JSON also keeps other websites out: they can't send it cross-origin without a preflight we never answer.
  if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Send JSON (Content-Type: application/json).');
  }
  // When the size is announced up front, refuse before reading anything; Node discards the unread body itself.
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request is too large.');
  }

  const body = await readBody(req);
  try {
    return JSON.parse(body.toString('utf8')) as unknown;
  } catch {
    throw new HttpError(400, 'The request body is not valid JSON.');
  }
}

/** What the page needs to build its form. Paths and install hooks stay on the server. */
function describeRegistry(options: UiServerOptions) {
  const describe = (template: FrontendTemplate | BackendTemplate) => ({
    id: template.id,
    label: template.label,
    description: template.description,
    prerequisite: 'extraPrerequisite' in template ? template.extraPrerequisite : undefined,
    options: (template.options ?? []).map((option) => ({
      id: option.id,
      // The placeholder name templates (and `prerequisite` below) use for this option's value.
      key: optionFlagKey(option.id),
      kind: option.kind,
      label: option.label,
      description: option.description,
      default: option.default,
      ...(option.kind === 'choice' ? { choices: option.choices } : {}),
    })),
  });

  return {
    version: options.version,
    defaultDirectory: options.defaultDirectory,
    frontends: frontendChoices.map(describe),
    backends: backendChoices.map(describe),
  };
}

function expandHome(value: string): string {
  if (value === '~') return os.homedir();
  if (value.startsWith('~/') || value.startsWith('~\\')) return path.join(os.homedir(), value.slice(2));
  return value;
}

async function parseGenerateRequest(body: unknown): Promise<GenerateRequest> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Expected a JSON object.');
  }
  const input = body as Record<string, unknown>;

  const projectName = typeof input.projectName === 'string' ? input.projectName.trim() : '';
  const nameCheck = validateProjectName(projectName);
  if (!nameCheck.valid) throw new HttpError(400, nameCheck.error ?? 'Invalid project name.', 'projectName');

  const frontend = frontendChoices.find((template) => template.id === input.frontend);
  if (!frontend) throw new HttpError(400, `Unknown frontend "${String(input.frontend)}".`, 'frontend');
  const backend = backendChoices.find((template) => template.id === input.backend);
  if (!backend) throw new HttpError(400, `Unknown backend "${String(input.backend)}".`, 'backend');

  const rawOptions = input.options ?? {};
  if (
    typeof rawOptions !== 'object' ||
    rawOptions === null ||
    Array.isArray(rawOptions) ||
    !Object.values(rawOptions).every((value) => typeof value === 'boolean' || typeof value === 'string')
  ) {
    throw new HttpError(400, '"options" must be an object whose values are true/false or text.', 'options');
  }
  let options: Record<string, OptionValue>;
  try {
    options = resolveOptions(frontend, backend, rawOptions as Record<string, OptionValue>).values;
  } catch (error) {
    throw new HttpError(400, (error as Error).message, 'options');
  }

  if (input.install !== undefined && typeof input.install !== 'boolean') {
    throw new HttpError(400, '"install" must be true or false.', 'install');
  }

  const rawDirectory = typeof input.directory === 'string' ? input.directory.trim() : '';
  if (!rawDirectory) throw new HttpError(400, 'Choose a folder to create the project in.', 'directory');
  const directory = path.resolve(expandHome(rawDirectory));
  const directoryStat = await fs.stat(directory).catch(() => undefined);
  if (!directoryStat?.isDirectory()) {
    throw new HttpError(400, `The folder "${directory}" doesn't exist. Create it first, or pick another one.`, 'directory');
  }
  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    throw new HttpError(400, `You can't write to "${directory}".`, 'directory');
  }

  const target = path.join(directory, projectName);
  const targetStat = await fs.stat(target).catch(() => undefined);
  if (targetStat && (!targetStat.isDirectory() || (await fs.readdir(target)).length > 0)) {
    throw new HttpError(400, `"${target}" already exists and isn't empty. Pick another name or folder.`, 'projectName');
  }

  return { projectName, frontend, backend, options, directory, install: input.install !== false };
}

function cliArguments(request: GenerateRequest): string[] {
  const offered = [...(request.frontend.options ?? []), ...(request.backend.options ?? [])];

  return [
    request.projectName,
    '--frontend',
    request.frontend.id,
    '--backend',
    request.backend.id,
    // Spell out every option, so the CLI never has to ask or guess.
    ...offered.flatMap((option) => {
      const value = request.options[option.id];
      if (option.kind === 'choice') return [`--${option.id}`, String(value)];
      return [value === true ? `--${option.id}` : `--no-${option.id}`];
    }),
    ...(request.install ? [] : ['--skip-install']),
  ];
}

/** Quotes a path for pasting into a terminal, but only when it needs it (spaces and the like). */
function shellQuote(value: string): string {
  if (/^[\w@%+=:,./-]+$/.test(value)) return value;
  return process.platform === 'win32' ? `"${value}"` : `'${value.replaceAll("'", `'\\''`)}'`;
}

// eslint-disable-next-line no-control-regex -- matching terminal escape codes is the point
const ANSI_CODES = /\u001B\[[0-9;?]*[ -/]*[@-~]/g;
const stripAnsi = (text: string): string => text.replace(ANSI_CODES, '');

/**
 * Runs the real CLI in the chosen folder and streams what it prints to the
 * page, one JSON object per line: start, log (many), then done or error.
 * Running the CLI itself (rather than calling the engine in-process) means the
 * page and the terminal can't drift apart, and a long `npm install` can't
 * freeze this server.
 */
async function streamGeneration(
  res: http.ServerResponse,
  request: GenerateRequest,
  cli: { command: string; args: string[] },
): Promise<void> {
  const args = cliArguments(request);
  res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8' });
  const send = (event: Record<string, unknown>): void => void res.write(`${JSON.stringify(event)}\n`);

  send({ type: 'start', command: `npx create-my-app ${args.join(' ')}` });

  const child = spawn(cli.command, [...cli.args, ...args], {
    cwd: request.directory,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  const onData = (text: string): void => {
    output += text;
    send({ type: 'log', text });
  };
  // setEncoding keeps a character that arrives split across two chunks (like ✔) in one piece.
  // (The pipes can be missing when the program couldn't be started; the 'error' handler below reports that.)
  child.stdout?.setEncoding('utf8').on('data', onData);
  child.stderr?.setEncoding('utf8').on('data', onData);

  await new Promise<void>((resolve) => {
    let finished = false;
    const finish = (event: Record<string, unknown>): void => {
      if (finished) return;
      finished = true;
      send(event);
      resolve();
    };

    child.on('error', (error) => finish({ type: 'error', message: `Couldn't start the generator: ${error.message}` }));
    child.on('close', (code, signal) => {
      const clean = stripAnsi(output);

      if (code === 0) {
        const warnings = [...clean.matchAll(/^\s*((?:Warning|Skipped)\b.*)$/gm)].map((match) => (match[1] ?? '').trim());
        const projectDir = path.join(request.directory, request.projectName);
        const installFailed = warnings.some((warning) => warning.includes('"npm install"'));
        const nextSteps = [
          `cd ${shellQuote(projectDir)}`,
          ...(request.install && !installFailed ? [] : ['npm install']),
          'npm run dev',
        ];
        finish({ type: 'done', projectDir, warnings, nextSteps });
        return;
      }

      // The CLI prints failures as "✖ <message>" (everything after the last marker is the message).
      const marker = clean.lastIndexOf('✖');
      const message = marker >= 0 ? clean.slice(marker + 1).trim() : '';
      finish({
        type: 'error',
        message:
          message ||
          (code === null
            ? `The generator was stopped (${String(signal)}).`
            : `The generator stopped with exit code ${String(code)}.`),
      });
    });
  });

  res.end();
}
