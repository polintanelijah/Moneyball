#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const apiUrl = 'http://127.0.0.1:8000';
const uiUrl = 'http://127.0.0.1:5173';
const modelUrl = 'http://127.0.0.1:11434';
const chromeBinary = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
  assert(response.ok, `${url} returned HTTP ${response.status}`);
  return response.json();
}

async function waitFor(check, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch {
      // A service may not be listening yet.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function requireFreePort(port) {
  await new Promise((done, fail) => {
    const server = createServer();
    server.once('error', () => fail(new Error(`Port ${port} is already in use; refusing to drive another instance.`)));
    server.listen(port, '127.0.0.1', () => server.close(done));
  });
}

function startProcess(command, args, cwd, logPath, env = process.env) {
  const logFd = openSync(logPath, 'w');
  try {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', logFd, logFd] });
    child.once('error', (error) => appendFileSync(logPath, `spawn error: ${error.message}\n`));
    return { child };
  } finally {
    closeSync(logFd);
  }
}

async function stopProcess(entry) {
  if (!entry) return;
  const { child } = entry;
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await Promise.race([
      new Promise((done) => child.once('exit', done)),
      sleep(3000).then(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }),
    ]);
  }
}

async function doctor(state) {
  const tags = await fetchJson(`${modelUrl}/api/tags`);
  assert(tags.models?.some((model) => model.name === 'llama3.2:1b'), 'Ollama model llama3.2:1b is not installed.');
  const api = await fetchJson(`${apiUrl}/`);
  assert(api.message === 'NFL GM Simulator backend is running', 'The API on port 8000 is not this app.');
  const ui = await fetch(uiUrl, { signal: AbortSignal.timeout(2000) });
  assert(ui.ok && (await ui.text()).includes('/src/main.jsx'), 'The UI on port 5173 is not this app.');
  if (state) {
    assert(state.backend.child.exitCode === null, 'The managed backend exited.');
    assert(state.vite.child.exitCode === null, 'The managed frontend exited.');
  }
  return { api: apiUrl, ui: uiUrl, ollamaModel: 'llama3.2:1b', managedPids: state ? [state.backend.child.pid, state.vite.child.pid] : [] };
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (message) => {
      const data = JSON.parse(message.data);
      if (data.id) {
        const pending = this.pending.get(data.id);
        if (!pending) return;
        this.pending.delete(data.id);
        if (data.error) pending.reject(new Error(data.error.message));
        else pending.resolve(data.result);
      } else if (data.method) {
        for (const listener of this.listeners.get(data.method) ?? []) listener(data.params);
      }
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((done, fail) => {
      socket.addEventListener('open', done, { once: true });
      socket.addEventListener('error', fail, { once: true });
    });
    return new Cdp(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  async text(selector) {
    return this.evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? null`);
  }

  async click(selector) {
    const point = await this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })()`);
    assert(point, `Missing clickable control ${selector}`);
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  }

  async choose(selector, index, expectedValue) {
    const selected = await this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element || !element.options[${index}]) throw new Error('Missing dropdown option');
      const value = element.options[${index}].value;
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return value;
    })()`);
    if (expectedValue) {
      assert(selected === expectedValue, `Dropdown option ${index} did not match ${expectedValue}`);
      await waitFor(() => this.evaluate(`document.querySelector(${JSON.stringify(selector)})?.value === ${JSON.stringify(expectedValue)}`), `selection ${expectedValue}`);
    }
  }

  async screenshot(path) {
    const result = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(path, Buffer.from(result.data, 'base64'));
  }

  close() {
    this.socket.close();
  }
}

async function startChrome(runDir, profileDir) {
  const chrome = startProcess(chromeBinary, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${profileDir}`,
    '--window-size=1440,1000', 'about:blank',
  ], root, join(runDir, 'chrome.log'));
  try {
    const port = await waitFor(() => {
      const path = join(profileDir, 'DevToolsActivePort');
      return existsSync(path) ? Number(readFileSync(path, 'utf8').split('\n')[0]) : null;
    }, 'Chrome DevTools port');
    const targets = await waitFor(() => fetchJson(`http://127.0.0.1:${port}/json/list`), 'Chrome page');
    const page = targets.find((target) => target.type === 'page');
    assert(page, 'Chrome did not open a page target.');
    return { chrome, cdp: await Cdp.connect(page.webSocketDebuggerUrl) };
  } catch (error) {
    await stopProcess(chrome);
    throw error;
  }
}

async function run() {
  assert(existsSync(chromeBinary), 'Google Chrome is required at the standard macOS application path.');
  assert(existsSync(join(root, 'node_modules', 'vite', 'bin', 'vite.js')), 'Run npm install first.');
  assert(existsSync(join(root, 'backend', '.venv', 'bin', 'uvicorn')), 'Install backend requirements in backend/.venv first.');
  await requireFreePort(8000);
  await requireFreePort(5173);
  const tags = await fetchJson(`${modelUrl}/api/tags`);
  assert(tags.models?.some((model) => model.name === 'llama3.2:1b'), 'Start Ollama with llama3.2:1b installed.');

  const runDir = join(root, 'artifacts', 'verify', new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-'));
  mkdirSync(runDir, { recursive: true });
  const profileDir = mkdtempSync(join(tmpdir(), 'moneyball-verify-chrome-'));
  const state = {};
  const report = { result: 'incomplete', runDir, checks: [], screenshots: [], browserErrors: [], tradeResponses: [] };
  let browser;

  const check = (condition, name) => {
    assert(condition, name);
    report.checks.push(name);
  };
  const screenshot = async (name) => {
    const path = join(runDir, name);
    await browser.screenshot(path);
    report.screenshots.push(path);
  };
  const panelText = (team) => browser.evaluate(`document.querySelector('#team-${team}-heading')?.closest('div.bg-slate-800')?.innerText ?? null`);

  try {
    state.backend = startProcess(join(root, 'backend', '.venv', 'bin', 'uvicorn'), ['main:app', '--host', '127.0.0.1', '--port', '8000'], join(root, 'backend'), join(runDir, 'backend.log'));
    state.vite = startProcess(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', '5173', '--strictPort'], root, join(runDir, 'vite.log'));
    await waitFor(() => doctor(state), 'usable app and Ollama', 20000);
    report.doctor = await doctor(state);

    const started = await startChrome(runDir, profileDir);
    state.chrome = started.chrome;
    browser = started.cdp;
    await browser.send('Page.enable');
    await browser.send('Runtime.enable');
    await browser.send('Network.enable');
    await browser.send('Log.enable');
    browser.on('Runtime.exceptionThrown', (event) => report.browserErrors.push(event.exceptionDetails.text));
    browser.on('Log.entryAdded', (event) => {
      if (event.entry.level === 'error') report.browserErrors.push(event.entry.text);
    });
    browser.on('Network.responseReceived', (event) => {
      if (event.response.url.includes('/api/trade')) report.tradeResponses.push({ status: event.response.status, url: event.response.url });
    });
    await browser.send('Page.navigate', { url: uiUrl });
    await waitFor(() => browser.evaluate("!!document.querySelector('#team-a-team')"), 'rendered trade form');
    check((await browser.text('h1')).includes('NFL GM Simulator'), 'App heading rendered');
    check(await browser.evaluate("document.querySelector('#analyze-trade').disabled"), 'Analyze disabled before assets are selected');
    await screenshot('01-empty.png');

    await browser.choose('#team-a-team', 1, 'DET');
    await browser.choose('#team-b-team', 2, 'DEN');
    check(await browser.evaluate("!!document.querySelector('#team-a-player') && !!document.querySelector('#team-b-player')"), 'Both roster selectors open');
    check(await browser.evaluate("document.querySelector('#analyze-trade').disabled"), 'Analyze disabled without a player');
    await screenshot('02-teams.png');

    await browser.choose('#team-a-player', 1, '');
    check((await panelText('a')).includes('Amon-Ra St. Brown'), 'Detroit player appears in outgoing assets');
    check((await panelText('a')).includes('$23.26M'), 'Detroit projected cap updates when sending Amon-Ra');
    check((await panelText('b')).includes('$0.34M'), 'Denver projected cap updates when receiving Amon-Ra');
    check(!(await browser.evaluate("document.querySelector('#analyze-trade').disabled")), 'Analyze enabled with a player');
    await screenshot('03-player-a.png');

    await browser.choose('#team-b-player', 1, '');
    check((await panelText('b')).includes('Patrick Surtain II'), 'Denver player appears in outgoing assets');
    check((await panelText('a')).includes('$16.55M'), 'Detroit projected cap includes both sides');
    check((await panelText('b')).includes('$7.05M'), 'Denver projected cap includes both sides');
    await screenshot('04-two-sided-trade.png');

    await browser.click('button[aria-label="Remove Amon-Ra St. Brown from Team A"]');
    check(!(await browser.evaluate('!!document.querySelector(\'button[aria-label="Remove Amon-Ra St. Brown from Team A"]\')')), 'Removing Detroit player removes the asset');
    check((await panelText('a')).includes('$11.69M'), 'Detroit cap recalculates after removal');
    check((await panelText('b')).includes('$11.91M'), 'Denver cap recalculates after removal');
    await screenshot('05-removed-player.png');
    await browser.choose('#team-a-player', 1, '');

    await browser.click('#analyze-trade');
    await waitFor(() => browser.text('#verdict-status').then((status) => status === 'Streaming'), 'streaming status', 10000);
    await screenshot('06-streaming.png');
    await waitFor(() => browser.text('#verdict-status').then((status) => status === 'Complete' || status === 'Error'), 'completed analysis', 180000);
    const verdictStatus = await browser.text('#verdict-status');
    const analysis = await browser.text('#verdict-analysis');
console.log("Verdict status:", verdictStatus);
console.log("Analysis length:", analysis?.length ?? 0);
console.log("Actual analysis:", JSON.stringify(analysis));
    check(verdictStatus === 'Complete', `Live Ollama analysis completed (got ${verdictStatus}: ${analysis?.slice(0, 200)})`);
    check(analysis && analysis.length > 100, 'Live analysis contains a substantial verdict');
    check(report.tradeResponses.some((response) => response.status === 200), 'Browser received successful trade stream');
    report.verdict = analysis;
    await screenshot('07-complete.png');

    await stopProcess(state.backend);
    state.backend = startProcess(join(root, 'backend', '.venv', 'bin', 'uvicorn'), ['main:app', '--host', '127.0.0.1', '--port', '8000'], join(root, 'backend'), join(runDir, 'backend-error-case.log'), { ...process.env, OLLAMA_URL: 'http://127.0.0.1:1' });
    await waitFor(() => fetchJson(`${apiUrl}/`), 'backend error case');
    await browser.click('#analyze-trade');
    await waitFor(() => browser.text('#verdict-status').then((status) => status === 'Error'), 'visible error state', 15000);
    check((await browser.text('#verdict-analysis')).includes('Could not reach Ollama'), 'Backend connection failure is explained in the UI');
    await screenshot('08-error.png');
    check(report.browserErrors.length === 0, `No browser exceptions or console errors: ${report.browserErrors.join('; ')}`);

    report.result = 'pass';
  } catch (error) {
    report.error = error.stack || error.message;
    if (browser) {
      try { await screenshot('failure.png'); } catch { /* Browser may have exited. */ }
    }
    process.exitCode = 1;
  } finally {
    writeFileSync(join(runDir, 'report.json'), JSON.stringify(report, null, 2));
    if (browser) browser.close();
    await stopProcess(state.chrome);
    await stopProcess(state.backend);
    await stopProcess(state.vite);
    rmSync(profileDir, { recursive: true, force: true });
    console.log(`${report.result.toUpperCase()}: ${runDir}`);
    if (report.error) console.error(report.error);
  }
}

if (process.argv[2] === 'doctor') {
  doctor().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
} else if (!process.argv[2] || process.argv[2] === 'all') {
  run().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
} else {
  console.error('Usage: node .codex/skills/verify/scripts/verify.mjs [all|doctor]');
  process.exitCode = 2;
}
