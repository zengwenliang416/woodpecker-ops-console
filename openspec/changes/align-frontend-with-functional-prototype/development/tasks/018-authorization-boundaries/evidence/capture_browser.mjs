#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const productionRoot = path.join(projectRoot, 'web');
const mockApi = path.join(
  projectRoot,
  'openspec/changes/align-frontend-with-functional-prototype/development/tasks/016-administration-routes/evidence/mock_api.py',
);
const productionUrl = 'http://127.0.0.1:8180';
const mockApiUrl = 'http://127.0.0.1:8182';
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const runId = randomUUID();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const users = {
  guest: 'undefined',
  regular:
    "{ id: 2, forge_id: 1, forge_remote_id: 'user-2', login: 'member', email: 'member@example.test', avatar_url: '', admin: false, admin_env: false, active: true, org_id: 1 }",
  admin:
    "{ id: 1, forge_id: 1, forge_remote_id: 'user-1', login: 'alice', email: 'alice@example.test', avatar_url: '', admin: true, admin_env: false, active: true, org_id: 1 }",
};
const regularLinks = [
  '/',
  '/overview',
  '/repos',
  '/deployments',
  '/deployments/apps',
  '/deployments/environments',
  '/deployments/releases',
  '/deployments/approvals',
  '/infrastructure',
  '/infrastructure/servers',
  '/infrastructure/groups',
  '/infrastructure/services',
  '/infrastructure/alerts',
  '/user/secrets',
  '/user',
];
const adminLinks = [
  ...regularLinks.slice(0, 13),
  '/admin/agents',
  '/admin/queue',
  '/user/secrets',
  '/admin',
  '/admin/users',
  '/admin/forges',
  '/user',
];
const states = [
  { id: 'guest-public', user: 'guest', path: '/orgs/1', routeName: 'org', protectedLinks: [] },
  { id: 'guest-public-repo', user: 'guest', path: '/repos/101', routeName: 'repo', protectedLinks: [] },
  { id: 'guest-admin', user: 'guest', path: '/admin/users', routeName: 'login', protectedLinks: [] },
  { id: 'regular-admin', user: 'regular', path: '/admin/users', routeName: 'overview', protectedLinks: regularLinks },
  {
    id: 'admin-admin',
    user: 'admin',
    path: '/admin/users',
    routeName: 'admin-settings-users',
    protectedLinks: adminLinks,
  },
].flatMap((state) =>
  [
    { id: 'desktop', width: 1600, height: 1000 },
    { id: 'mobile', width: 390, height: 844 },
  ].map((viewport) => ({ ...state, stateId: `${state.id}-${viewport.id}`, viewport })),
);

function configSource(user) {
  return `
window.WOODPECKER_USER = ${users[user]};
window.WOODPECKER_VERSION = '3.9.0-task018';
window.WOODPECKER_SKIP_VERSION_CHECK = true;
window.WOODPECKER_CSRF = 'task018-csrf';
window.WOODPECKER_ROOT_PATH = '';
window.WOODPECKER_ENABLE_SWAGGER = false;
window.WOODPECKER_USER_REGISTERED_AGENTS = true;
window.WOODPECKER_MAX_PIPELINE_LOG_LINE_COUNT = 5000;
window.WOODPECKER_DEFAULT_CONFIG_PATHS = ['.woodpecker.yml'];
`;
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForUrl(url, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Startup races are expected.
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startService(url, command, args, cwd, env = {}) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  await Promise.race([
    waitForUrl(url),
    new Promise((_, reject) =>
      child.once('exit', (code, signal) =>
        reject(new Error(`${command} exited before ${url} was ready (${code}/${signal})\n${output}`)),
      ),
    ),
  ]);
  return child;
}

async function stopChild(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill('SIGTERM');
  for (let index = 0; index < 50 && child.exitCode == null; index += 1) await sleep(50);
  if (child.exitCode == null) child.kill('SIGKILL');
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
  on(method, listener) {
    this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
  }
  close() {
    this.socket.close();
  }
}

async function capture(state, remotePort) {
  const target = await fetch(`http://127.0.0.1:${remotePort}/json/new?about:blank`, { method: 'PUT' }).then((r) =>
    r.json(),
  );
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  const health = { consoleErrors: [], runtimeExceptions: [] };
  client.on('Runtime.consoleAPICalled', (event) => {
    if (event.type === 'error')
      health.consoleErrors.push(event.args.map((arg) => arg.value ?? arg.description).join(' '));
  });
  client.on('Runtime.exceptionThrown', (event) =>
    health.runtimeExceptions.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text),
  );
  client.on('Fetch.requestPaused', (event) => {
    if (event.request.url === `${productionUrl}/web-config.js`) {
      void client.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/javascript' }],
        body: Buffer.from(configSource(state.user)).toString('base64'),
      });
      return;
    }
    void client.send('Fetch.continueRequest', { requestId: event.requestId });
  });
  await Promise.all([
    client.send('Page.enable'),
    client.send('Runtime.enable'),
    client.send('Fetch.enable', { patterns: [{ urlPattern: `${productionUrl}/web-config.js` }] }),
    client.send('Emulation.setDeviceMetricsOverride', {
      width: state.viewport.width,
      height: state.viewport.height,
      deviceScaleFactor: 1,
      mobile: state.viewport.id === 'mobile',
    }),
  ]);
  await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: "localStorage.setItem('woodpecker:theme','dark'); localStorage.setItem('woodpecker:locale','zh-Hans');",
  });
  await client.send('Page.navigate', { url: `${productionUrl}${state.path}` });

  const deadline = Date.now() + 20_000;
  let measurement;
  while (Date.now() < deadline) {
    const evaluated = await client.send('Runtime.evaluate', {
      expression: `(async () => {
        const router = (await import('/src/router.ts')).default;
        const sidebarLinks = [...document.querySelectorAll('#app-sidebar a[href]')].map((link) => link.getAttribute('href'));
        const protectedLinks = sidebarLinks.filter((href) => href && !href.startsWith('http') && href !== '/login');
        return {
          terminalRouteName: router.currentRoute.value.name ?? null,
          terminalPath: router.currentRoute.value.fullPath,
          protectedLinks,
          bodyText: document.body?.innerText || '',
          pageLevelHorizontalOverflow:
            document.documentElement.scrollWidth > document.documentElement.clientWidth ||
            document.body.scrollWidth > document.body.clientWidth
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    measurement = evaluated.result.value;
    if (measurement.terminalRouteName === state.routeName) break;
    await sleep(150);
  }
  assert.equal(measurement?.terminalRouteName, state.routeName, state.stateId);
  await sleep(300);
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const result = {
    ...measurement,
    runId,
    stateId: state.stateId,
    actor: state.user,
    requestedPath: state.path,
    expectedRouteName: state.routeName,
    expectedProtectedLinks: state.protectedLinks,
    viewport: state.viewport,
    health,
  };
  await Promise.all([
    writeFile(path.join(evidenceRoot, `${state.stateId}.json`), `${JSON.stringify(result, null, 2)}\n`),
    writeFile(path.join(evidenceRoot, `${state.stateId}.png`), Buffer.from(screenshot.data, 'base64')),
  ]);
  await fetch(`http://127.0.0.1:${remotePort}/json/close/${target.id}`);
  client.close();
  return result;
}

const services = [];
let chrome;
let profile;
try {
  services.push(
    await startService(mockApiUrl, 'python3', [mockApi, '--port', '8182'], projectRoot, { TASK016_RUN_ID: runId }),
  );
  services.push(
    await startService(productionUrl, 'pnpm', ['start', '--host', '127.0.0.1', '--port', '8180'], productionRoot, {
      VITE_DEV_PROXY: mockApiUrl,
    }),
  );
  const remotePort = await getFreePort();
  profile = await mkdtemp(path.join(tmpdir(), 'task018-chrome-'));
  chrome = spawn(
    chromeBinary,
    [
      '--headless=new',
      `--remote-debugging-port=${remotePort}`,
      `--user-data-dir=${profile}`,
      '--disable-background-networking',
      '--disable-extensions',
      '--no-first-run',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);
  const measurements = [];
  for (const [index, state] of states.entries()) {
    process.stderr.write(`[capture ${index + 1}/${states.length}] ${state.stateId}\n`);
    measurements.push(await capture(state, remotePort));
  }
  const failedStates = measurements
    .filter(
      (measurement) =>
        measurement.terminalRouteName !== measurement.expectedRouteName ||
        JSON.stringify(measurement.protectedLinks) !== JSON.stringify(measurement.expectedProtectedLinks) ||
        new Set(measurement.protectedLinks).size !== measurement.protectedLinks.length ||
        (measurement.actor !== 'admin' && measurement.protectedLinks.some((href) => href.startsWith('/admin'))) ||
        measurement.pageLevelHorizontalOverflow ||
        Object.values(measurement.health).some((entries) => entries.length > 0),
    )
    .map((measurement) => measurement.stateId);
  const summary = {
    ok: failedStates.length === 0,
    runId,
    states: measurements.length,
    stateIds: measurements.map((measurement) => measurement.stateId),
    failedStates,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(path.join(evidenceRoot, 'browser-replay-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await stopChild(chrome);
  for (const service of services.toReversed()) await stopChild(service);
  if (profile) await rm(profile, { recursive: true, force: true });
}
