// The whole page. Plain JavaScript: no framework and no build step. It asks the
// local server what the template registry offers, builds the form from that,
// and shows the generator's output while it runs.

const TOKEN_KEY = 'create-my-app-token';
// eslint-disable-next-line no-control-regex -- matching terminal escape codes is the point
const ANSI_CODES = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
const URL_PATTERN = /https?:\/\/[^\s)]+/g;

const $ = (id) => document.getElementById(id);

const state = {
  registry: null,
  frontend: null, // selected template ids
  backend: null,
  options: {}, // option id -> on/off; remembered even while the current choice doesn't offer it
  busy: false,
};

/* ---------- helpers ---------- */

/** Builds an element. Text always goes in as text, never as HTML. */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (value === false || value == null) continue;
    if (name === 'class') node.className = value;
    else if (name === 'text') node.textContent = value;
    else node.setAttribute(name, value === true ? '' : value);
  }
  node.append(...children);
  return node;
}

/** Plain text, with any http(s) link turned into a real link. */
function withLinks(text) {
  const nodes = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    nodes.push(text.slice(last, match.index));
    nodes.push(el('a', { href: match[0], target: '_blank', rel: 'noopener noreferrer', text: match[0] }));
    last = match.index + match[0].length;
  }
  nodes.push(text.slice(last));
  return nodes;
}

function joinPath(directory, name) {
  const separator = directory.includes('\\') && !directory.includes('/') ? '\\' : '/';
  return `${directory.replace(/[\\/]+$/, '')}${separator}${name}`;
}

function fieldWrapper(field) {
  return [...document.querySelectorAll('[data-field]')].find((node) => node.dataset.field === field);
}

/* ---------- talking to the local server ---------- */

// The server's link carries a one-time key. Keep it for reloads of this tab, but take it out of the address bar.
function readToken() {
  const fromUrl = new URLSearchParams(location.search).get('token');
  if (fromUrl) {
    try {
      sessionStorage.setItem(TOKEN_KEY, fromUrl);
    } catch {
      // Storage blocked: the key still works until this tab is reloaded.
    }
    history.replaceState(null, '', location.pathname);
    return fromUrl;
  }
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

const token = readToken();

function api(path, init = {}) {
  return fetch(path, { ...init, headers: { 'X-CMA-Token': token ?? '', ...init.headers } });
}

async function readError(response) {
  try {
    const data = await response.json();
    return { message: data.error ?? `The generator answered with an error (${response.status}).`, field: data.field };
  } catch {
    return { message: `The generator answered with an error (${response.status}).` };
  }
}

/* ---------- the form ---------- */

function showFatal(message) {
  $('form').hidden = true;
  $('run').hidden = true;
  $('fatal').textContent = message;
  $('fatal').hidden = false;
}

function selectedTemplates() {
  const { registry } = state;
  return [
    registry.frontends.find((template) => template.id === state.frontend),
    registry.backends.find((template) => template.id === state.backend),
  ].filter(Boolean);
}

function offeredOptions() {
  return selectedTemplates().flatMap((template) => template.options);
}

function allOptions() {
  return [...state.registry.frontends, ...state.registry.backends].flatMap((template) => template.options);
}

/** What an option is set to right now: what the user picked, else its default. */
function optionValue(option) {
  return state.options[option.id] ?? option.default;
}

function renderChoices(container, group, templates) {
  container.replaceChildren(
    ...templates.map((template) => {
      const input = el('input', { type: 'radio', name: group, value: template.id, checked: template.id === state[group] });
      input.addEventListener('change', () => {
        state[group] = template.id;
        renderOptions();
      });

      const body = el(
        'span',
        { class: 'choice__body' },
        el('span', { class: 'choice__label', text: template.label }),
        el('span', { class: 'choice__desc', text: template.description }),
      );
      if (template.prerequisite) {
        // The text is filled in by fillNotes(), because it can mention an option's value ("JDK {{javaVersion}}+").
        body.append(el('span', { class: 'choice__note', 'data-template': template.prerequisite }));
      }
      return el('label', { class: 'choice' }, input, body);
    }),
  );
}

/**
 * Writes each "Needs: ..." note, replacing {{placeholders}} with the option values picked right now.
 * It uses every option, not just the offered ones, so the Spring Boot card stays right while another backend is selected.
 */
function fillNotes() {
  const values = Object.fromEntries(allOptions().map((option) => [option.key, String(optionValue(option))]));
  for (const note of document.querySelectorAll('[data-template]')) {
    const text = note.dataset.template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => values[key] ?? match);
    note.replaceChildren('Needs: ', ...withLinks(text));
  }
}

function toggleOption(option) {
  const input = el('input', { type: 'checkbox', checked: optionValue(option) });
  input.addEventListener('change', () => {
    state.options[option.id] = input.checked;
  });
  return el(
    'label',
    { class: 'check' },
    input,
    el('span', {}, el('strong', { text: option.label }), ' ', el('span', { class: 'muted', text: `— ${option.description}` })),
  );
}

function choiceOption(option) {
  const pills = option.choices.map((choice) => {
    const input = el('input', { type: 'radio', name: `option-${option.id}`, value: choice.value, checked: choice.value === optionValue(option) });
    input.addEventListener('change', () => {
      state.options[option.id] = choice.value;
      fillNotes();
    });
    return el('label', { class: 'pill' }, input, el('span', { class: 'pill__text', text: choice.label }));
  });

  return el(
    'fieldset',
    { class: 'option' },
    el('legend', {}, el('strong', { text: option.label }), ' ', el('span', { class: 'muted', text: `— ${option.description}` })),
    el('div', { class: 'pills' }, ...pills),
  );
}

/** The options depend on the chosen frontend and backend, so this runs again whenever either changes. */
function renderOptions() {
  const offered = offeredOptions();
  $('options').hidden = offered.length === 0;
  $('optionsList').replaceChildren(...offered.map((option) => (option.kind === 'choice' ? choiceOption(option) : toggleOption(option))));
  fillNotes();
}

function updateTarget() {
  const name = $('projectName').value.trim();
  const directory = $('directory').value.trim();
  $('target').textContent = name && directory ? joinPath(directory, name) : '…';
}

function clearFieldErrors() {
  for (const node of document.querySelectorAll('.field--invalid')) node.classList.remove('field--invalid');
  for (const input of document.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
  $('formError').hidden = true;
}

function showFormError(message, field) {
  clearFieldErrors();

  // The message goes right under the field it is about (that's where focus lands), or above the button when it isn't about one field.
  const wrapper = field ? fieldWrapper(field) : undefined;
  if (wrapper) wrapper.append($('formError'));
  else $('formActions').before($('formError'));
  $('formError').textContent = message;
  $('formError').hidden = false;

  if (!wrapper) return;
  wrapper.classList.add('field--invalid');
  const input = wrapper.querySelector('input');
  if (input) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }
}

function setBusy(busy) {
  state.busy = busy;
  $('generate').disabled = busy;
  $('generate').textContent = busy ? 'Working…' : 'Generate';
}

function readForm() {
  return {
    projectName: $('projectName').value.trim(),
    directory: $('directory').value.trim(),
    frontend: state.frontend,
    backend: state.backend,
    options: Object.fromEntries(offeredOptions().map((option) => [option.id, state.options[option.id] ?? option.default])),
    install: $('install').checked,
  };
}

function buildForm() {
  const { registry } = state;
  $('version').textContent = `v${registry.version}`;
  $('directory').value = registry.defaultDirectory;
  state.frontend = registry.frontends[0]?.id ?? null;
  state.backend = registry.backends[0]?.id ?? null;

  renderChoices($('frontends'), 'frontend', registry.frontends);
  renderChoices($('backends'), 'backend', registry.backends);
  renderOptions();
  updateTarget();

  $('form').hidden = false;
  $('projectName').focus();
}

/* ---------- running the generator ---------- */

const logParts = { done: document.createTextNode(''), line: document.createTextNode('') };
let logLine = '';
let logRewind = false; // saw a bare "\r": the next text replaces the line instead of extending it
$('log').append(logParts.done, logParts.line);

function resetLog() {
  logParts.done.data = '';
  logParts.line.data = '';
  logLine = '';
  logRewind = false;
}

/** Adds output to the log box. Finished lines are kept; a line being redrawn with "\r" (progress output) is replaced. */
function appendLog(raw) {
  const box = $('log');
  const followOutput = box.scrollHeight - box.scrollTop - box.clientHeight < 24;

  for (const piece of raw.replace(ANSI_CODES, '').split(/(\r\n|\n|\r)/)) {
    if (piece === '\n' || piece === '\r\n') {
      logParts.done.appendData(`${logLine}\n`);
      logLine = '';
      logRewind = false;
    } else if (piece === '\r') {
      logRewind = true;
    } else if (piece) {
      if (logRewind) {
        logLine = '';
        logRewind = false;
      }
      logLine += piece;
    }
  }

  logParts.line.data = logLine;
  if (followOutput) box.scrollTop = box.scrollHeight;
}

let runTimer = null;

/** Installing packages can print nothing for a minute or two, so show that the page is still waiting. */
function startTimer() {
  const started = Date.now();
  const tick = () => {
    const seconds = Math.floor((Date.now() - started) / 1000);
    $('runElapsed').textContent = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };
  tick();
  $('runStatus').hidden = false;
  runTimer = setInterval(tick, 1000);
}

function stopTimer() {
  clearInterval(runTimer);
  $('runStatus').hidden = true;
}

function openRunPanel(body) {
  startTimer();
  $('form').hidden = true;
  $('run').hidden = false;
  $('runTitle').textContent = 'Creating your project…';
  $('runIntro').textContent = `Same as running this in ${body.directory}:`;
  $('runCommand').textContent = '';
  $('runDone').hidden = true;
  $('resultWarnings').hidden = true;
  $('runError').hidden = true;
  $('runActions').hidden = true;
  resetLog();
  $('runTitle').focus();
}

/** Reads the server's one-JSON-object-per-line stream. Returns the final done/error event, or null if the stream broke off. */
async function readEvents(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let outcome = null;

  const handleLine = (line) => {
    if (!line.trim()) return;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      return;
    }
    if (event.type === 'start') $('runCommand').textContent = event.command;
    else if (event.type === 'log') appendLog(event.text);
    else if (event.type === 'done' || event.type === 'error') outcome = event;
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      for (let newline = buffer.indexOf('\n'); newline >= 0; newline = buffer.indexOf('\n')) {
        handleLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
      }
    }
    handleLine(buffer + decoder.decode());
  } catch {
    // The connection dropped; the caller reports that when there is no final event.
  }
  return outcome;
}

function finishRun(outcome) {
  stopTimer();
  setBusy(false);
  $('runActions').hidden = false;

  if (outcome?.type === 'done') {
    $('runTitle').textContent = 'Your project is ready';
    $('resultPath').textContent = outcome.projectDir;
    $('resultSteps').textContent = outcome.nextSteps.join('\n');
    $('resultWarnings').replaceChildren(...outcome.warnings.map((warning) => el('li', { text: warning })));
    $('resultWarnings').hidden = outcome.warnings.length === 0;
    $('runDone').hidden = false;
    $('another').hidden = false;
    $('back').hidden = true;
    $('another').focus();
    return;
  }

  $('runTitle').textContent = 'Something went wrong';
  $('runError').textContent =
    outcome?.type === 'error'
      ? outcome.message
      : 'The connection to the generator was lost. Check the terminal; the project may be only partly created.';
  $('runError').hidden = false;
  $('another').hidden = true;
  $('back').hidden = false;
  $('back').focus();
}

async function generate() {
  if (state.busy) return;
  clearFieldErrors();
  const body = readForm();
  setBusy(true);

  let response;
  try {
    response = await api('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    setBusy(false);
    showFormError("Can't reach the generator. Is it still running in your terminal?");
    return;
  }

  if (!response.ok) {
    setBusy(false);
    const { message, field } = await readError(response);
    showFormError(message, field);
    return;
  }

  openRunPanel(body);
  finishRun(await readEvents(response));
}

function backToForm({ newProject }) {
  $('run').hidden = true;
  $('form').hidden = false;
  clearFieldErrors();
  if (newProject) {
    $('projectName').value = '';
    updateTarget();
  }
  $('projectName').focus();
}

async function stopGenerator() {
  $('stop').disabled = true;
  try {
    const response = await api('/api/shutdown', { method: 'POST' });
    if (!response.ok) {
      $('runError').textContent = (await readError(response)).message;
      $('runError').hidden = false;
      $('stop').disabled = false;
      return;
    }
  } catch {
    // The server closes the connection as it stops, which can surface as a network error.
  }
  $('run').hidden = true;
  $('form').hidden = true;
  $('stopped').hidden = false;
  $('stoppedTitle').focus();
}

async function copyFrom(button) {
  const original = button.dataset.label ?? button.textContent;
  button.dataset.label = original;
  try {
    await navigator.clipboard.writeText($(button.dataset.copy).textContent);
    button.textContent = 'Copied';
  } catch {
    button.textContent = "Couldn't copy";
  }
  setTimeout(() => {
    button.textContent = original;
  }, 1500);
}

/* ---------- start ---------- */

$('form').addEventListener('submit', (event) => {
  event.preventDefault();
  void generate();
});
$('projectName').addEventListener('input', () => {
  fieldWrapper('projectName')?.classList.remove('field--invalid');
  updateTarget();
});
$('directory').addEventListener('input', () => {
  fieldWrapper('directory')?.classList.remove('field--invalid');
  updateTarget();
});
$('another').addEventListener('click', () => backToForm({ newProject: true }));
$('back').addEventListener('click', () => backToForm({ newProject: false }));
$('stop').addEventListener('click', () => void stopGenerator());
document.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-copy]') : null;
  if (button) void copyFrom(button);
});

async function init() {
  if (!token) {
    showFatal('This page needs the link from your terminal — it holds a one-time key. Run create-my-app --ui again and use that link.');
    return;
  }

  let response;
  try {
    response = await api('/api/registry');
  } catch {
    showFatal("Can't reach the generator. Is it still running in your terminal?");
    return;
  }
  if (!response.ok) {
    showFatal((await readError(response)).message);
    return;
  }

  state.registry = await response.json();
  buildForm();
}

void init();
