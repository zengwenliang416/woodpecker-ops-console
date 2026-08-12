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
const productionUrl = 'http://127.0.0.1:8170';
const prototypeUrl = 'http://127.0.0.1:8171';
const mockApiUrl = 'http://127.0.0.1:8172';
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const runId = randomUUID();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const destinations = [
  {
    id: 'login',
    row: 1,
    productionRouteName: 'login',
    path: '/login',
    guest: true,
    productionPatterns: [/欢迎回来|Welcome back/i, /forge\.example/i],
    prototypePatterns: [/欢迎回来/i, /使用 GitHub 登录/i],
  },
  {
    id: 'user-general',
    row: 39,
    productionRouteName: 'user',
    path: '/user',
    productionPatterns: [/账户设置|Account/i, /alice@example\.test/i],
    prototypePatterns: [/个人设置/i, /个人资料/i],
  },
  {
    id: 'user-secrets',
    row: 40,
    productionRouteName: 'user-secrets',
    path: '/user/secrets',
    productionPatterns: [/ORG_SIGNING_KEY/i, /密钥|Secret/i],
    prototypePatterns: [/个人 Secrets/i],
  },
  {
    id: 'user-registries',
    row: 41,
    productionRouteName: 'user-registries',
    path: '/user/registries',
    productionPatterns: [/ghcr\.io\/acme/i, /注册表|Registry/i],
    prototypePatterns: [/个人镜像仓库/i],
  },
  {
    id: 'user-cli-api',
    row: 42,
    productionRouteName: 'user-cli-and-api',
    path: '/user/cli-and-api',
    productionPatterns: [/task017-personal-token/i, /CLI.*API/i],
    prototypePatterns: [/CLI 与 API/i],
  },
  {
    id: 'user-agents',
    row: 43,
    productionRouteName: 'user-agents',
    path: '/user/agents',
    productionPatterns: [/agent-17/i, /Agent/i],
    prototypePatterns: [/个人 Agents/i],
  },
  {
    id: 'cli-auth',
    row: 44,
    productionRouteName: null,
    path: '/cli/auth?port=49152',
    productionPatterns: [/登录到 CLI|Sign in to CLI/i, /Woodpecker CLI/i],
    prototypePatterns: [/授权命令行访问/i],
  },
  {
    id: 'not-found',
    row: 45,
    productionRouteName: 'not-found',
    path: '/definitely-not-a-route',
    productionPatterns: [/页面不存在|Page not found/i, /404/i],
    prototypePatterns: [/页面不存在/i, /404/i],
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
const stateFilter = process.env.TASK017_STATE_FILTER;
const states = stateFilter ? allStates.filter((state) => state.id === stateFilter) : allStates;
assert.ok(states.length > 0, `No evidence state matched ${stateFilter}`);

const authenticatedConfig = `
window.WOODPECKER_USER = {
  id: 1, forge_id: 1, forge_remote_id: 'user-1', login: 'alice',
  email: 'alice@example.test', avatar_url: '', admin: true,
  admin_env: false, active: true, org_id: 1
};
window.WOODPECKER_VERSION = '3.9.0-task017';
window.WOODPECKER_SKIP_VERSION_CHECK = true;
window.WOODPECKER_CSRF = 'task017-csrf';
window.WOODPECKER_ROOT_PATH = '';
window.WOODPECKER_ENABLE_SWAGGER = false;
window.WOODPECKER_USER_REGISTERED_AGENTS = true;
window.WOODPECKER_MAX_PIPELINE_LOG_LINE_COUNT = 5000;
window.WOODPECKER_DEFAULT_CONFIG_PATHS = ['.woodpecker.yml'];
`;
const guestConfig = authenticatedConfig.replace(
  /window\.WOODPECKER_USER = \{[\s\S]*?\};/,
  'window.WOODPECKER_USER = undefined;',
);

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
      if (response.ok) return;
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
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  await Promise.race([
    waitForUrl(url),
    new Promise((_, reject) => {
      child.once('exit', (code, signal) => {
        reject(
          new Error(`${command} exited before ${url} was ready (code=${code}, signal=${signal})\n${output.trim()}`),
        );
      });
    }),
  ]);
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
    const routeReady =
      state.surface !== 'production' ||
      routeName === state.destination.productionRouteName ||
      (state.destination.id === 'cli-auth' && new URL(state.destination.path, productionUrl).pathname === '/cli/auth');
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
    const url = event.request.url;
    if (url === `${productionUrl}/web-config.js`) {
      const body = Buffer.from(state.destination.guest ? guestConfig : authenticatedConfig).toString('base64');
      void client.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/javascript; charset=utf-8' }],
        body,
      });
      return;
    }
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
        { urlPattern: `${productionUrl}/web-config.js`, requestStage: 'Request' },
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
        terminalRouteName: router?.currentRoute.value.name ?? null,
        terminalPath: router?.currentRoute.value.fullPath ?? location.hash.slice(1),
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
        rawI18nKeys: [...new Set(text.match(/(?:user|login_surface|cli_auth|not_found|secrets|registries)\\.[a-z0-9_.]+/gi) || [])]
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
      env: { TASK017_RUN_ID: runId },
    }),
  );
  services.push(
    await startService({
      url: productionUrl,
      command: 'pnpm',
      args: ['start', '--host', '127.0.0.1', '--port', '8170'],
      cwd: productionRoot,
      env: { VITE_DEV_PROXY: mockApiUrl },
    }),
  );
  services.push(
    await startService({
      url: prototypeUrl,
      command: 'python3',
      args: ['-m', 'http.server', '8171', '--bind', '127.0.0.1'],
      cwd: prototypeRoot,
    }),
  );
  const identity = await (await fetch(mockApiUrl)).json();
  assert.equal(identity.fixture, '017-user-auth-routes');
  assert.equal(identity.run_id, runId);
  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task017-chrome-'));
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
