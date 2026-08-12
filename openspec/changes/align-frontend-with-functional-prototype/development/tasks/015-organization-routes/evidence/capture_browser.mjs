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
const productionUrl = 'http://127.0.0.1:8150';
const prototypeUrl = 'http://127.0.0.1:8151';
const mockApiUrl = 'http://127.0.0.1:8152';
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const runId = randomUUID();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const destinations = [
  {
    id: 'org-overview',
    row: 24,
    productionRouteName: 'org',
    productionPath: '/orgs/1',
    prototypePath: '/#/orgs/1',
    productionPatterns: [/acme/i, /backend-api/i],
    prototypePatterns: [/acme/i],
  },
  {
    id: 'org-secrets',
    row: 25,
    productionRouteName: 'org-settings-secrets',
    productionPath: '/orgs/1/settings/secrets',
    prototypePath: '/#/orgs/1/settings/secrets',
    productionPatterns: [/ORG_SIGNING_KEY/i, /Secret|密钥/i],
    prototypePatterns: [/Secret|密钥/i],
  },
  {
    id: 'org-registries',
    row: 26,
    productionRouteName: 'org-settings-registries',
    productionPath: '/orgs/1/settings/registries',
    prototypePath: '/#/orgs/1/settings/registries',
    productionPatterns: [/ghcr\.io\/acme/i, /Registry|注册表|镜像仓库/i],
    prototypePatterns: [/Registry|注册表|镜像仓库/i],
  },
  {
    id: 'org-agents',
    row: 27,
    productionRouteName: 'org-settings-agents',
    productionPath: '/orgs/1/settings/agents',
    prototypePath: '/#/orgs/1/settings/agents',
    productionPatterns: [/agent-17/i, /Agent/i],
    prototypePatterns: [/Agent/i],
  },
];

const viewports = [
  { id: 'desktop', width: 1600, height: 1000 },
  { id: 'mobile', width: 390, height: 844 },
];

const states = destinations.flatMap((destination) =>
  viewports.flatMap((viewport) =>
    ['production', 'prototype'].map((surface) => ({
      id: `${surface}-dark-zh-${viewport.id}-${destination.id}`,
      destination,
      surface,
      viewport,
    })),
  ),
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
      if (response.ok) return response;
    } catch {
      // Service startup is expected to race this probe.
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
  child.once('exit', () => undefined);
  await waitForUrl(url);
  return child;
}

async function stopChild(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill('SIGTERM');
  let deadline = Date.now() + 3_000;
  while (child.exitCode == null && child.signalCode == null && Date.now() < deadline) await sleep(50);
  if (child.exitCode != null || child.signalCode != null) return;

  child.kill('SIGKILL');
  deadline = Date.now() + 3_000;
  while (child.exitCode == null && child.signalCode == null && Date.now() < deadline) await sleep(50);
  if (child.exitCode == null && child.signalCode == null) {
    throw new Error(`Child process ${child.pid ?? 'unknown'} did not exit after SIGKILL`);
  }
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

async function waitForDocument(client) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const result = await client.send('Runtime.evaluate', {
      expression:
        "document.readyState === 'complete' && document.body && (document.body.innerText || '').trim().length > 20",
      returnByValue: true,
    });
    if (result.result.value === true) {
      await sleep(700);
      return;
    }
    await sleep(150);
  }
  throw new Error('Timed out waiting for rendered document');
}

async function waitForState(client, state) {
  const deadline = Date.now() + 20_000;
  const patterns =
    state.surface === 'production' ? state.destination.productionPatterns : state.destination.prototypePatterns;
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
    const routeReady = state.surface !== 'production' || routeName === state.destination.productionRouteName;
    if (routeReady && patterns.every((pattern) => pattern.test(text))) {
      await sleep(250);
      return;
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${state.id}`);
}

async function captureState(state, remotePort) {
  const target = await fetch(`http://127.0.0.1:${remotePort}/json/new?about:blank`, {
    method: 'PUT',
  }).then((response) => response.json());
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  const consoleErrors = [];
  const runtimeExceptions = [];
  const networkFailures = [];
  const httpErrors = [];

  client.on('Runtime.consoleAPICalled', (event) => {
    if (event.type === 'error') {
      consoleErrors.push(event.args.map((argument) => argument.value ?? argument.description ?? '').join(' '));
    }
  });
  client.on('Runtime.exceptionThrown', (event) => {
    runtimeExceptions.push(event.exceptionDetails?.exception?.description ?? event.exceptionDetails?.text);
  });
  client.on('Network.loadingFailed', (event) => {
    if (!event.canceled) networkFailures.push(event.errorText);
  });
  client.on('Network.responseReceived', (event) => {
    if (event.response.status >= 400) httpErrors.push({ status: event.response.status, url: event.response.url });
  });
  client.on('Fetch.requestPaused', (event) => {
    const url = event.request.url;
    const optionalAsset = url === `${productionUrl}/assets/custom.js` || url === `${prototypeUrl}/favicon.ico`;
    if (!optionalAsset) {
      void client.send('Fetch.continueRequest', { requestId: event.requestId });
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

  const storageScript =
    state.surface === 'production'
      ? "localStorage.setItem('woodpecker:theme','dark'); localStorage.setItem('woodpecker:locale','zh-Hans');"
      : "localStorage.setItem('wp-prototype-theme','dark');";
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: storageScript });

  const baseUrl = state.surface === 'production' ? productionUrl : prototypeUrl;
  const routePath = state.surface === 'production' ? state.destination.productionPath : state.destination.prototypePath;
  const loaded = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: `${baseUrl}${routePath}` });
  await loaded;
  await waitForDocument(client);
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
          theme: document.documentElement.getAttribute('data-theme'),
        },
        localScrollContainers: [...document.querySelectorAll('.settings-table-scroll, .org-settings-nav, .overflow-x-auto')]
          .map((node) => ({
            className: node.className,
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            overflowX: getComputedStyle(node).overflowX,
          })),
        rawI18nKeys: [...new Set(text.match(/(?:org|repo|secrets|registries|admin)\\.[a-z0-9_.]+/gi) || [])],
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  const screenshotResult = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const bodyText = evaluated.result.value.bodyText;
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
      passed: pattern.test(bodyText),
    })),
    health: { consoleErrors, runtimeExceptions, networkFailures, httpErrors },
  };

  await Promise.all([
    writeFile(path.join(evidenceRoot, `${state.id}.png`), Buffer.from(screenshotResult.data, 'base64')),
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
      env: { TASK015_RUN_ID: runId },
    }),
  );
  services.push(
    await startService({
      url: productionUrl,
      command: 'pnpm',
      args: ['start', '--host', '127.0.0.1', '--port', '8150'],
      cwd: productionRoot,
      env: { VITE_DEV_PROXY: mockApiUrl },
    }),
  );
  services.push(
    await startService({
      url: prototypeUrl,
      command: 'python3',
      args: ['-m', 'http.server', '8151', '--bind', '127.0.0.1'],
      cwd: prototypeRoot,
    }),
  );

  const identity = await (await fetch(mockApiUrl)).json();
  assert.equal(identity.fixture, '015-organization-routes');
  assert.equal(identity.run_id, runId);

  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task015-chrome-'));
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
    states: measurements.length,
    productionStates: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototypeStates: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    rows: destinations.map((destination) => destination.row),
    stateIds: measurements.map((measurement) => measurement.stateId).toSorted(),
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
