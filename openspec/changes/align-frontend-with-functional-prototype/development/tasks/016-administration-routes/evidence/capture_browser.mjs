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
const prototypeRoot = path.join(
  projectRoot,
  'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact',
);
const productionUrl = 'http://127.0.0.1:8160';
const prototypeUrl = 'http://127.0.0.1:8161';
const mockApiUrl = 'http://127.0.0.1:8162';
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const runId = randomUUID();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const destinations = [
  {
    id: 'admin-info',
    row: 28,
    productionRouteName: 'admin-settings',
    path: '/admin',
    productionPatterns: [/3\.9\.0-task016/i, /管理入口|Administration destinations/i],
    prototypePatterns: [/系统管理/i],
  },
  {
    id: 'admin-secrets',
    row: 29,
    productionRouteName: 'admin-settings-secrets',
    path: '/admin/secrets',
    productionPatterns: [/GLOBAL_MIRROR/i, /密钥|Secret/i],
    prototypePatterns: [/全局 Secrets/i],
  },
  {
    id: 'admin-registries',
    row: 30,
    productionRouteName: 'admin-settings-registries',
    path: '/admin/registries',
    productionPatterns: [/docker\.io/i, /注册表|镜像仓库|Registry/i],
    prototypePatterns: [/全局镜像仓库/i],
  },
  {
    id: 'admin-repos',
    row: 31,
    productionRouteName: 'admin-settings-repos',
    path: '/admin/repos',
    productionPatterns: [/acme\/backend-api/i, /仓库|Repositor/i],
    prototypePatterns: [/仓库管理/i],
  },
  {
    id: 'admin-users',
    row: 32,
    productionRouteName: 'admin-settings-users',
    path: '/admin/users',
    productionPatterns: [/alice/i, /用户|Users/i],
    prototypePatterns: [/用户管理/i],
  },
  {
    id: 'admin-orgs',
    row: 33,
    productionRouteName: 'admin-settings-orgs',
    path: '/admin/orgs',
    productionPatterns: [/acme/i, /组织|Organizations/i],
    prototypePatterns: [/组织管理/i],
  },
  {
    id: 'admin-agents',
    row: 34,
    productionRouteName: 'admin-settings-agents',
    path: '/admin/agents',
    productionPatterns: [/agent-admin-1/i, /Agent/i],
    prototypePatterns: [/Agent 集群/i],
  },
  {
    id: 'admin-queue',
    row: 35,
    productionRouteName: 'admin-settings-queue',
    path: '/admin/queue',
    productionPatterns: [/backend-build/i, /队列|Queue/i],
    prototypePatterns: [/任务队列/i],
  },
  {
    id: 'admin-forges',
    row: 36,
    productionRouteName: 'admin-settings-forges',
    path: '/admin/forges',
    productionPatterns: [/forge\.example/i, /Forge/i],
    prototypePatterns: [/Forge 连接/i],
  },
  {
    id: 'admin-forge',
    row: 37,
    productionRouteName: 'admin-settings-forge',
    path: '/admin/forges/1',
    productionPatterns: [/编辑代码托管平台|Edit forge/i, /URL/i],
    prototypePatterns: [/连接设置/i],
  },
  {
    id: 'admin-forge-create',
    row: 38,
    productionRouteName: 'admin-settings-forge-create',
    path: '/admin/forges/create',
    productionPatterns: [/添加代码托管平台|Add forge/i, /URL/i],
    prototypePatterns: [/新建 Forge/i],
  },
];
const viewports = [
  { id: 'desktop', width: 1600, height: 1000 },
  { id: 'mobile', width: 390, height: 844 },
];
const allStates = destinations.flatMap((destination) =>
  viewports.flatMap((viewport) =>
    ['production', 'prototype'].map((surface) => ({
      id: `${surface}-dark-zh-${viewport.id}-${destination.id}`,
      destination,
      surface,
      viewport,
    })),
  ),
);
const stateFilter = process.env.TASK016_STATE_FILTER;
const states = stateFilter ? allStates.filter((state) => state.id === stateFilter) : allStates;
assert.ok(states.length > 0, `No evidence state matched ${stateFilter}`);

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
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // Startup races are expected.
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function ensurePortFree(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${port} is already occupied`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}

async function startService({ url, command, args, cwd, env = {} }) {
  await ensurePortFree(Number(new URL(url).port));
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'ignore',
  });
  await waitForUrl(url);
  return child;
}

async function stopChild(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill('SIGTERM');
  for (let index = 0; index < 60 && child.exitCode == null && child.signalCode == null; index += 1) {
    await sleep(50);
  }
  if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL');
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
      const listener = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) ?? []).filter((candidate) => candidate !== listener),
        );
        resolve(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
    });
  }

  on(method, listener) {
    this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
  }

  close() {
    this.socket.close();
  }
}

async function waitForState(client, state) {
  const deadline = Date.now() + 20_000;
  const patterns =
    state.surface === 'production' ? state.destination.productionPatterns : state.destination.prototypePatterns;
  let lastState = { routeName: null, text: '' };
  while (Date.now() < deadline) {
    const evaluated = await client.send('Runtime.evaluate', {
      expression: `(async () => ({
        text: document.body?.innerText || '',
        routeName: ${state.surface === 'production' ? "(await import('/src/router.ts')).default.currentRoute.value.name ?? null" : 'null'}
      }))()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const { routeName, text } = evaluated.result.value;
    lastState = { routeName, text };
    const routeReady = state.surface !== 'production' || routeName === state.destination.productionRouteName;
    if (routeReady && patterns.every((pattern) => pattern.test(text))) {
      await sleep(250);
      return;
    }
    await sleep(150);
  }
  throw new Error(
    `Timed out waiting for ${state.id}; route=${String(lastState.routeName)}; text=${lastState.text
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 1200)}`,
  );
}

async function captureState(state, remotePort) {
  const target = await fetch(`http://127.0.0.1:${remotePort}/json/new?about:blank`, { method: 'PUT' }).then(
    (response) => response.json(),
  );
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  const health = { consoleErrors: [], runtimeExceptions: [], networkFailures: [], httpErrors: [] };

  client.on('Runtime.consoleAPICalled', (event) => {
    if (event.type === 'error')
      health.consoleErrors.push(event.args.map((arg) => arg.value ?? arg.description).join(' '));
  });
  client.on('Runtime.exceptionThrown', (event) => {
    health.runtimeExceptions.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text);
  });
  client.on('Network.loadingFailed', (event) => {
    if (!event.canceled) health.networkFailures.push(event.errorText);
  });
  client.on('Network.responseReceived', (event) => {
    if (event.response.status >= 400)
      health.httpErrors.push({ status: event.response.status, url: event.response.url });
  });
  client.on('Fetch.requestPaused', (event) => {
    void client.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/octet-stream' }],
      body: '',
    });
  });

  await Promise.all([
    client.send('Page.enable'),
    client.send('Runtime.enable'),
    client.send('Network.enable'),
    client.send('Fetch.enable', {
      patterns: [
        { urlPattern: `${productionUrl}/assets/custom.js`, requestStage: 'Request' },
        { urlPattern: `${prototypeUrl}/favicon.ico`, requestStage: 'Request' },
      ],
    }),
    client.send('Network.setCacheDisabled', { cacheDisabled: true }),
    client.send('Emulation.setDeviceMetricsOverride', {
      width: state.viewport.width,
      height: state.viewport.height,
      deviceScaleFactor: 1,
      mobile: state.viewport.id === 'mobile',
      screenWidth: state.viewport.width,
      screenHeight: state.viewport.height,
    }),
  ]);
  await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source:
      state.surface === 'production'
        ? "localStorage.setItem('woodpecker:theme','dark'); localStorage.setItem('woodpecker:locale','zh-Hans');"
        : "localStorage.setItem('wp-prototype-theme','dark');",
  });

  const baseUrl = state.surface === 'production' ? productionUrl : prototypeUrl;
  const routePath = state.surface === 'production' ? state.destination.path : `/#${state.destination.path}`;
  const loaded = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: `${baseUrl}${routePath}` });
  await loaded;
  await waitForState(client, state);

  const evaluated = await client.send('Runtime.evaluate', {
    expression: `(async () => {
      const router = ${state.surface === 'production' ? "(await import('/src/router.ts')).default" : 'null'};
      const text = document.body?.innerText || '';
      return {
        bodyText: text.trim().replace(/\\s+/g, ' '),
        bodyTextSample: text.trim().replace(/\\s+/g, ' ').slice(0, 2200),
        terminalRouteName: router?.currentRoute.value.name ?? null,
        pageLevelHorizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth ||
          document.body.scrollWidth > document.body.clientWidth,
        document: {
          width: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          height: document.documentElement.clientHeight,
          lang: document.documentElement.lang,
          theme: document.documentElement.getAttribute('data-theme')
        },
        localScrollContainers: [...document.querySelectorAll('.settings-table-scroll, .admin-settings-nav, .overflow-x-auto')]
          .map((node) => ({
            className: node.className,
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            overflowX: getComputedStyle(node).overflowX
          })),
        rawI18nKeys: [...new Set(text.match(/(?:admin|repo|secrets|registries)\\.[a-z0-9_.]+/gi) || [])]
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const patterns =
    state.surface === 'production' ? state.destination.productionPatterns : state.destination.prototypePatterns;
  const measurement = {
    ...evaluated.result.value,
    runId,
    stateId: state.id,
    row: state.destination.row,
    surface: state.surface,
    viewport: state.viewport,
    contentAssertions: patterns.map((pattern) => ({
      pattern: pattern.toString(),
      passed: pattern.test(evaluated.result.value.bodyText),
    })),
    health,
  };
  await Promise.all([
    writeFile(path.join(evidenceRoot, `${state.id}.png`), Buffer.from(screenshot.data, 'base64')),
    writeFile(path.join(evidenceRoot, `${state.id}.json`), `${JSON.stringify(measurement, null, 2)}\n`),
  ]);
  await fetch(`http://127.0.0.1:${remotePort}/json/close/${target.id}`);
  client.close();
  return measurement;
}

const services = [];
let chrome;
let chromeProfile;

try {
  services.push(
    await startService({
      url: mockApiUrl,
      command: 'python3',
      args: [path.join(evidenceRoot, 'mock_api.py')],
      cwd: projectRoot,
      env: { TASK016_RUN_ID: runId },
    }),
  );
  services.push(
    await startService({
      url: productionUrl,
      command: 'pnpm',
      args: ['start', '--host', '127.0.0.1', '--port', '8160'],
      cwd: productionRoot,
      env: { VITE_DEV_PROXY: mockApiUrl },
    }),
  );
  services.push(
    await startService({
      url: prototypeUrl,
      command: 'python3',
      args: ['-m', 'http.server', '8161', '--bind', '127.0.0.1'],
      cwd: prototypeRoot,
    }),
  );

  const identity = await (await fetch(mockApiUrl)).json();
  assert.equal(identity.fixture, '016-administration-routes');
  assert.equal(identity.run_id, runId);

  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task016-chrome-'));
  chrome = spawn(
    chromeBinary,
    [
      '--headless=new',
      `--remote-debugging-port=${remotePort}`,
      `--user-data-dir=${chromeProfile}`,
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);

  const measurements = [];
  for (const [index, state] of states.entries()) {
    process.stderr.write(`[capture ${index + 1}/${states.length}] ${state.id}\n`);
    measurements.push(await captureState(state, remotePort));
  }

  const failedStates = measurements
    .filter(
      (measurement) =>
        measurement.pageLevelHorizontalOverflow ||
        measurement.rawI18nKeys.length > 0 ||
        measurement.contentAssertions.some((assertion) => !assertion.passed) ||
        Object.values(measurement.health).some((entries) => entries.length > 0),
    )
    .map((measurement) => measurement.stateId);
  const summary = {
    ok: failedStates.length === 0,
    runId,
    states: allStates.length,
    productionStates: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototypeStates: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    rows: destinations.map((destination) => destination.row),
    stateIds: allStates.map((state) => state.id).toSorted(),
    failedStates,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(path.join(evidenceRoot, 'browser-replay-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await stopChild(chrome);
  for (const service of services.toReversed()) await stopChild(service);
  if (chromeProfile) await rm(chromeProfile, { recursive: true, force: true });
}
