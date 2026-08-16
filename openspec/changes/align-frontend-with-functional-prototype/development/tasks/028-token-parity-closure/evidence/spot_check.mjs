#!/usr/bin/env node

/**
 * Task 028 light/dark spot check. Captures representative routes at desktop
 * in both themes and verifies: data-theme application, body background
 * parity (light and dark backgrounds differ), zero page-level horizontal
 * overflow, and zero console/runtime/network/HTTP failures.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const webRoot = path.join(projectRoot, 'web');
const mockApiUrl = process.env.TASK028_MOCK_URL ?? 'http://127.0.0.1:8282';
const productionUrl = process.env.TASK028_PRODUCTION_URL ?? 'http://127.0.0.1:8280';
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viteEntry = path.join(webRoot, 'node_modules/vite/bin/vite.js');
const runId = randomUUID();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const states = [
  { id: 'overview-light', theme: 'light', locale: 'zh-Hans', path: '/overview', patterns: [/backend-api/, /概览/] },
  { id: 'overview-dark', theme: 'dark', locale: 'zh-Hans', path: '/overview', patterns: [/backend-api/, /概览/] },
  {
    id: 'deployment-log-light',
    theme: 'light',
    locale: 'zh-Hans',
    path: '/deployments/142',
    patterns: [/DEP-142|142/, /失败|failed/],
  },
  {
    id: 'deployment-log-dark',
    theme: 'dark',
    locale: 'zh-Hans',
    path: '/deployments/142',
    patterns: [/DEP-142|142/, /失败|failed/],
  },
  { id: 'login-light', theme: 'light', locale: 'zh-Hans', path: '/login', patterns: [/登录/], guest: true },
  { id: 'login-dark', theme: 'dark', locale: 'zh-Hans', path: '/login', patterns: [/登录/], guest: true },
];

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForUrl(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  throw new Error(`URL did not become ready: ${url}`);
}

async function stopChild(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill('SIGTERM');
  for (let i = 0; i < 60 && child.exitCode == null && child.signalCode == null; i += 1) await sleep(50);
  if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL');
  for (let i = 0; i < 60 && child.exitCode == null && child.signalCode == null; i += 1) await sleep(50);
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id != null) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) listener(message.params ?? {});
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new CdpClient(socket);
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listeners = this.listeners.get(method) ?? [];
      const listener = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) ?? []).filter((entry) => entry !== listener),
        );
        resolve(params);
      };
      listeners.push(listener);
      this.listeners.set(method, listeners);
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }
}

async function waitForDocument(client, patterns, timeoutMs = 40_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await client.send('Runtime.evaluate', {
      expression: 'document.body && document.body.innerText ? document.body.innerText : ""',
      returnByValue: true,
    });
    const text = result.result?.value ?? '';
    if (patterns.every((pattern) => pattern.test(text))) return;
    if (process.env.TASK028_DEBUG === '1') {
      process.stderr.write(`[spot-debug] ${text.replace(/\s+/g, ' ').slice(0, 500)}\n`);
    }
    await sleep(300);
  }
  throw new Error(`readiness patterns not matched: ${patterns.map((p) => p.source).join(', ')}`);
}

async function capture(state, remotePort) {
  let targets = [];
  for (let attempt = 0; attempt < 20 && targets.length === 0; attempt += 1) {
    targets = await fetch(`http://127.0.0.1:${remotePort}/json/list`).then((response) => response.json());
    if (targets.length === 0) await sleep(250);
  }
  const target = targets.find((entry) => entry.type === 'page');
  assert.ok(target, `no page target for ${state.id}`);
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  const consoleMessages = [];
  const runtimeExceptions = [];
  const networkFailures = [];
  const httpErrors = [];
  client.on('Runtime.consoleAPICalled', (event) => {
    if (event.type === 'error') {
      consoleMessages.push((event.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' '));
    }
  });
  client.on('Runtime.exceptionThrown', (event) => {
    runtimeExceptions.push(event.exceptionDetails?.text ?? 'exception');
  });
  client.on('Network.loadingFailed', (event) => {
    if (!event.canceled) networkFailures.push(event.errorText);
  });
  client.on('Network.responseReceived', (event) => {
    if (event.response.status >= 400) httpErrors.push(`${event.response.status} ${event.response.url}`);
  });
  client.on('Fetch.requestPaused', (event) => {
    if (['https://forge.example/favicon.ico', `${productionUrl}/assets/custom.js`].includes(event.request.url)) {
      void client.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/octet-stream' }],
        body: '',
      });
      return;
    }
    void client.send('Fetch.continueRequest', { requestId: event.requestId });
  });

  await Promise.all([
    client.send('Page.enable'),
    client.send('Runtime.enable'),
    client.send('Network.enable'),
    client.send('Fetch.enable', {
      patterns: [
        { urlPattern: `${productionUrl}/assets/custom.js`, requestStage: 'Request' },
        { urlPattern: 'https://forge.example/*', requestStage: 'Request' },
      ],
    }),
    client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: 1280,
      screenHeight: 1000,
    }),
  ]);
  const storageScript = `if (location.href.startsWith(${JSON.stringify(productionUrl)})) { localStorage.setItem('woodpecker:theme', ${JSON.stringify(state.theme)}); localStorage.setItem('woodpecker:locale', ${JSON.stringify(state.locale)}); }`;
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: storageScript });

  if (state.guest) {
    await fetch(`${mockApiUrl}/api/evidence/state?role=guest`).then((response) => response.json());
    const blankLoad = client.once('Page.loadEventFired');
    await client.send('Page.navigate', { url: 'about:blank' });
    await blankLoad;
  } else {
    await fetch(`${mockApiUrl}/api/evidence/state?role=admin`).then((response) => response.json());
  }

  const loadEvent = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: `${productionUrl}${state.path}` });
  await loadEvent;
  await waitForDocument(client, state.patterns);

  const result = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const style = getComputedStyle(document.body);
      return {
        dataTheme: document.documentElement.getAttribute('data-theme'),
        className: document.documentElement.className,
        bodyBackground: style.backgroundColor,
        bodyColor: style.color,
        pageOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 ||
          document.body.scrollWidth > document.body.clientWidth + 1,
        url: location.href,
      };
    })()`,
    returnByValue: true,
  });
  return {
    schema: 'woodpecker.task028-light-dark-spot.v1',
    stateId: state.id,
    runId,
    theme: state.theme,
    locale: state.locale,
    route: state.path,
    health: {
      consoleMessages: consoleMessages.slice(0, 5),
      runtimeExceptions: runtimeExceptions.slice(0, 5),
      networkFailures: networkFailures.slice(0, 5),
      httpErrors: httpErrors.slice(0, 5),
    },
    ...result.result.value,
  };
}

const services = [];
let chrome;
let chromeProfile;
const measurements = [];
try {
  // The 027 consolidated mock lives in the sibling task evidence dir.
  const mockChild = spawn(
    'python3',
    [
      path.join(
        projectRoot,
        'openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/evidence/mock_api.py',
      ),
      '--port',
      '8282',
    ],
    { cwd: projectRoot, env: { ...process.env }, stdio: 'ignore' },
  );
  services.push(mockChild);
  await waitForUrl(mockApiUrl);

  const vite = spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', '8280', '--strictPort'], {
    cwd: webRoot,
    env: { ...process.env, VITE_DEV_PROXY: mockApiUrl },
    stdio: 'ignore',
  });
  services.push(vite);
  await waitForUrl(productionUrl);

  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task028-chrome-'));
  chrome = spawn(
    chromeBinary,
    [
      '--headless=new',
      `--remote-debugging-port=${remotePort}`,
      `--user-data-dir=${chromeProfile}`,
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);

  for (const state of states) {
    process.stderr.write(`[spot ${state.id}]\n`);
    measurements.push(await capture(state, remotePort));
  }

  // Theme parity: body backgrounds must differ between light and dark for the
  // same route, proving the theme system applies both palettes.
  const byRoute = new Map();
  for (const m of measurements) {
    const route = m.route;
    if (!byRoute.has(route)) byRoute.set(route, {});
    byRoute.get(route)[m.theme] = m;
  }
  const failures = [];
  for (const [route, themes] of byRoute) {
    if (themes.light.bodyBackground === themes.dark.bodyBackground) {
      failures.push(`${route}: light and dark body backgrounds identical (${themes.light.bodyBackground})`);
    }
  }
  for (const m of measurements) {
    if (m.dataTheme !== m.theme) failures.push(`${m.stateId}: data-theme=${m.dataTheme} expected ${m.theme}`);
    if (m.pageOverflow) failures.push(`${m.stateId}: page-level horizontal overflow`);
    if (m.health.consoleMessages.length > 0)
      failures.push(`${m.stateId}: console errors ${JSON.stringify(m.health.consoleMessages)}`);
    if (m.health.runtimeExceptions.length > 0) failures.push(`${m.stateId}: runtime exceptions`);
    if (m.health.networkFailures.length > 0)
      failures.push(`${m.stateId}: network failures ${JSON.stringify(m.health.networkFailures)}`);
    if (m.health.httpErrors.length > 0)
      failures.push(`${m.stateId}: http errors ${JSON.stringify(m.health.httpErrors)}`);
  }

  const summary = {
    schema: 'woodpecker.task028-light-dark-spot.v1',
    ok: failures.length === 0,
    runId,
    states: measurements.length,
    themes: ['light', 'dark'],
    routes: [...byRoute.keys()],
    failures,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(path.join(evidenceRoot, 'light-dark-spot-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(
    path.join(evidenceRoot, 'light-dark-spot-measurements.json'),
    `${JSON.stringify(measurements, null, 2)}\n`,
  );
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await stopChild(chrome);
  for (const child of services) await stopChild(child);
  if (chromeProfile) await rm(chromeProfile, { recursive: true, force: true });
}
