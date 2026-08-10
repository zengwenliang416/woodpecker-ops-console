#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const productionRoot = path.join(projectRoot, 'web');
const prototypeRoot = path.join(
  projectRoot,
  'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact',
);
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const productionUrl = process.env.TASK009_PRODUCTION_URL ?? 'http://127.0.0.1:8010';
const prototypeUrl = process.env.TASK009_PROTOTYPE_URL ?? 'http://127.0.0.1:4173';
const mockApiUrl = process.env.TASK009_MOCK_API ?? 'http://127.0.0.1:8123';
const execFile = promisify(execFileCallback);

const destinations = [
  {
    id: 'overview',
    productionPath: '/repos/101/pipeline/842',
    prototypePath: '/#/repos/101/pipeline/842',
    route: 'repo-pipeline',
  },
  {
    id: 'log',
    productionPath: '/repos/101/pipeline/842/2030',
    prototypePath: '/#/repos/101/pipeline/842?tab=logs',
    route: 'repo-pipeline',
  },
  {
    id: 'changed-files',
    productionPath: '/repos/101/pipeline/842/changed-files',
    prototypePath: '/#/repos/101/pipeline/842/changed-files',
    route: 'repo-pipeline-changed-files',
  },
  {
    id: 'config',
    productionPath: '/repos/101/pipeline/842/config',
    prototypePath: '/#/repos/101/pipeline/842/config',
    route: 'repo-pipeline-config',
  },
  {
    id: 'errors',
    productionPath: '/repos/101/pipeline/842/errors',
    prototypePath: '/#/repos/101/pipeline/842/errors',
    route: 'repo-pipeline-errors',
  },
  {
    id: 'debug',
    productionPath: '/repos/101/pipeline/842/debug',
    prototypePath: '/#/repos/101/pipeline/842/debug',
    route: 'repo-pipeline-debug',
  },
];

const viewports = [
  { id: 'desktop', width: 1600, height: 1000 },
  { id: 'mobile', width: 390, height: 844 },
];

const states = [
  ...viewports.flatMap((viewport) =>
    destinations.map((destination) => ({
      id: `production-dark-zh-${viewport.id}-${destination.id}`,
      surface: 'production',
      label: `production ${destination.id}`,
      destination,
      viewport,
      theme: 'dark',
      locale: 'zh-Hans',
      permission: 'push',
    })),
  ),
  ...viewports.flatMap((viewport) =>
    destinations.map((destination) => ({
      id: `prototype-dark-zh-${viewport.id}-${destination.id}`,
      surface: 'prototype',
      label: `approved prototype ${destination.id}`,
      destination,
      viewport,
      theme: 'dark',
      locale: 'zh-CN',
      permission: 'prototype-administrator',
    })),
  ),
  ...viewports.flatMap((viewport) =>
    destinations
      .filter((destination) => ['overview', 'log'].includes(destination.id))
      .map((destination) => ({
        id: `production-light-en-${viewport.id}-${destination.id}`,
        surface: 'production',
        label: `production light English ${destination.id}`,
        destination,
        viewport,
        theme: 'light',
        locale: 'en',
        permission: 'push',
      })),
  ),
  ...destinations
    .filter((destination) => ['overview', 'debug'].includes(destination.id))
    .map((destination) => ({
      id: `production-light-en-readonly-desktop-${destination.id}`,
      surface: 'production',
      label: `production read-only ${destination.id}`,
      destination,
      viewport: viewports[0],
      theme: 'light',
      locale: 'en',
      permission: 'read-only',
    })),
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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

async function waitForUrl(url, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 204) return;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function ensureService({ name, url, command, args, cwd, env = {} }) {
  try {
    await waitForUrl(url, 1_000);
    return null;
  } catch {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
    child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
    await waitForUrl(url);
    return child;
  }
}

async function responseBody(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
}

async function assertServiceIdentity() {
  const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'manifest.json'), 'utf8'));
  const { stdout: gitHeadOutput } = await execFile('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
  const gitHead = gitHeadOutput.trim();
  await execFile('git', ['merge-base', '--is-ancestor', manifest.commit, gitHead], {
    cwd: projectRoot,
  });
  await execFile('git', ['diff', '--quiet', manifest.commit, '--', 'web', ':(exclude)web/src/router.test.ts'], {
    cwd: projectRoot,
  });

  const [directRepoResponse, proxiedRepoResponse, productionHtml, productionRouter, prototypeHtml] = await Promise.all([
    fetch(`${mockApiUrl}/api/repos/101`),
    fetch(`${productionUrl}/api/repos/101`),
    responseBody(productionUrl),
    responseBody(`${productionUrl}/src/router.ts`),
    responseBody(prototypeUrl),
  ]);
  assert.equal(directRepoResponse.ok, true, 'direct Mock API repository probe');
  assert.equal(proxiedRepoResponse.ok, true, 'Vite proxy repository probe');
  const directRepo = await directRepoResponse.json();
  const proxiedRepo = await proxiedRepoResponse.json();
  assert.deepEqual(proxiedRepo, directRepo, 'Vite /api proxy must resolve to the task Mock API');
  assert.equal(directRepo.id, 101, 'Mock API repository id');
  assert.equal(directRepo.full_name, 'acme/backend-api', 'Mock API repository identity');
  assert.match(productionHtml, /<script type="module" src="\/src\/main\.ts(?:\?[^"]*)?"><\/script>/);
  assert.match(productionRouter, /name:\s*["']repo-pipeline-debug["']/);
  assert.match(prototypeHtml, /Woodpecker CI · Infrastructure & Deployment Prototype/);
  assert.match(prototypeHtml, /data-specnav-variant="approved-user-design"/);

  return {
    sourceBaseCommit: manifest.commit,
    gitHead,
    productionRuntimeUnchangedFromBase: true,
    viteProxyRepository: directRepo.full_name,
    productionEntrypoint: '/src/main.ts',
    productionRouterMarker: 'repo-pipeline-debug',
    prototypeMarker: 'approved-user-design',
  };
}

async function stopChild(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill('SIGTERM');
  let deadline = Date.now() + 3_000;
  while (child.exitCode == null && child.signalCode == null && Date.now() < deadline) {
    await sleep(50);
  }
  if (child.exitCode != null || child.signalCode != null) return;

  child.kill('SIGKILL');
  deadline = Date.now() + 3_000;
  while (child.exitCode == null && child.signalCode == null && Date.now() < deadline) {
    await sleep(50);
  }
  if (child.exitCode == null && child.signalCode == null) {
    throw new Error(`Child process ${child.pid ?? 'unknown'} did not exit after SIGKILL`);
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function aggregateChecksum(files) {
  const lines = [];
  for (const name of files.sort()) {
    const digest = sha256(await readFile(path.join(evidenceRoot, name)));
    lines.push(`${digest}  ./${name}\n`);
  }
  return sha256(lines.join(''));
}

async function updateManifest(measurements) {
  const manifestPath = path.join(evidenceRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const rootFiles = (await readdir(evidenceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const filesExcludingManifest = rootFiles.filter((name) => name !== 'manifest.json');
  const pngFiles = rootFiles.filter((name) => name.endsWith('.png'));
  const jsonFilesExcludingManifest = rootFiles.filter((name) => name.endsWith('.json') && name !== 'manifest.json');
  const productionWarnings = measurements
    .filter((measurement) => measurement.stateId.startsWith('production-'))
    .flatMap((measurement) =>
      measurement.health.console.filter((entry) => entry.level === 'warning').map((entry) => entry.message),
    );

  manifest.captured_from = measurements.map((measurement) => measurement.health.startedAt).sort()[0];
  manifest.captured_through = measurements
    .map((measurement) => measurement.health.endedAt)
    .sort()
    .at(-1);
  manifest.artifact_convention.total_files_excluding_manifest = filesExcludingManifest.length;
  manifest.console_adjudication.production_warning_count = productionWarnings.length;
  manifest.console_adjudication.prototype_warning_count = measurements
    .filter((measurement) => measurement.stateId.startsWith('prototype-'))
    .reduce((total, measurement) => total + measurement.health.warningCount, 0);
  manifest.console_adjudication.warning_breakdown = {
    vue_i18n_startup_or_fallback: productionWarnings.filter((message) => message.startsWith('[intlify]')).length,
    pipeline_wrapper_step_id: productionWarnings.filter((message) => /stepId/.test(message)).length,
    router_deprecated_next_callback: productionWarnings.filter((message) =>
      /next callback|navigation guard|deprecated/i.test(message),
    ).length,
    other: productionWarnings.filter(
      (message) =>
        !message.startsWith('[intlify]') &&
        !/stepId/.test(message) &&
        !/next callback|navigation guard|deprecated/i.test(message),
    ).length,
  };
  manifest.checksums.all_files_excluding_manifest = await aggregateChecksum(filesExcludingManifest);
  manifest.checksums.all_png_files = await aggregateChecksum(pngFiles);
  manifest.checksums.all_json_files_excluding_manifest = await aggregateChecksum(jsonFilesExcludingManifest);
  for (const [manifestKey, fileName] of [
    ['mock_api_py', 'mock_api.py'],
    ['capture_browser_mjs', 'capture_browser.mjs'],
    ['mock_api_smoke_mjs', 'mock_api_smoke.mjs'],
    ['verify_evidence_mjs', 'verify_evidence.mjs'],
    ['browser_replay_summary_json', 'browser-replay-summary.json'],
  ]) {
    manifest.checksums[manifestKey] = sha256(await readFile(path.join(evidenceRoot, fileName)));
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
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
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params ?? {});
      }
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
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        const listeners = this.listeners.get(method) ?? [];
        this.listeners.set(
          method,
          listeners.filter((candidate) => candidate !== listener),
        );
        resolve(params);
      };
      this.on(method, listener);
    });
  }

  close() {
    this.socket.close();
  }
}

function consoleText(args) {
  return args.map((argument) => argument.value ?? argument.description ?? argument.unserializableValue ?? '').join(' ');
}

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`Screenshot is not PNG data: ${signature}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function waitForDocument(client) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const result = await client.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && document.body && document.body.innerText.trim().length > 120",
      returnByValue: true,
    });
    if (result.result.value === true) {
      await sleep(900);
      return;
    }
    await sleep(200);
  }
  throw new Error('Timed out waiting for rendered document content');
}

async function captureState(state, remotePort) {
  if (state.surface === 'production') {
    const push = state.permission === 'read-only' ? 0 : 1;
    await waitForUrl(`${mockApiUrl}/api/evidence/permissions?push=${push}`);
  }

  const target = await fetch(`http://127.0.0.1:${remotePort}/json/new?about:blank`, {
    method: 'PUT',
  }).then((response) => response.json());
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  const startedAt = new Date().toISOString();
  const consoleMessages = [];
  const runtimeExceptions = [];
  const networkFailures = [];
  const httpErrors = [];
  const interceptedOptionalAssets = [];
  const inflightRequests = new Set();
  const requestUrls = new Map();

  client.on('Runtime.consoleAPICalled', (event) => {
    consoleMessages.push({
      level: event.type,
      message: consoleText(event.args),
      timestamp: new Date(event.timestamp).toISOString(),
    });
  });
  client.on('Runtime.exceptionThrown', (event) => {
    runtimeExceptions.push({
      message: event.exceptionDetails?.text ?? 'Runtime exception',
      description: event.exceptionDetails?.exception?.description ?? null,
      timestamp: new Date().toISOString(),
    });
  });
  client.on('Network.requestWillBeSent', (event) => {
    if (/^https?:/.test(event.request.url)) {
      inflightRequests.add(event.requestId);
      requestUrls.set(event.requestId, event.request.url);
    }
  });
  client.on('Network.loadingFinished', (event) => {
    inflightRequests.delete(event.requestId);
    requestUrls.delete(event.requestId);
  });
  client.on('Network.loadingFailed', (event) => {
    inflightRequests.delete(event.requestId);
    if (event.canceled) return;
    networkFailures.push({
      url: requestUrls.get(event.requestId) ?? null,
      errorText: event.errorText,
      blockedReason: event.blockedReason ?? null,
      timestamp: new Date().toISOString(),
    });
    requestUrls.delete(event.requestId);
  });
  client.on('Network.responseReceived', (event) => {
    if (event.response.status >= 400) {
      httpErrors.push({
        url: event.response.url,
        status: event.response.status,
        statusText: event.response.statusText,
        timestamp: new Date().toISOString(),
      });
    }
  });
  client.on('Fetch.requestPaused', (event) => {
    const url = event.request.url;
    const isCustomScript = url === `${productionUrl}/assets/custom.js`;
    const isPrototypeFavicon = url === `${prototypeUrl}/favicon.ico`;
    if (!isCustomScript && !isPrototypeFavicon) {
      void client.send('Fetch.continueRequest', { requestId: event.requestId });
      return;
    }
    interceptedOptionalAssets.push({
      url,
      reason: isCustomScript
        ? 'optional Woodpecker custom JavaScript hook is absent from the local Vite evidence host'
        : 'standalone approved prototype does not ship a favicon',
      timestamp: new Date().toISOString(),
    });
    void client.send('Fetch.fulfillRequest', {
      requestId: event.requestId,
      responseCode: 200,
      responseHeaders: [
        {
          name: 'Content-Type',
          value: isCustomScript ? 'application/javascript; charset=utf-8' : 'image/x-icon',
        },
        { name: 'Cache-Control', value: 'no-store' },
      ],
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
      ? `localStorage.setItem('woodpecker:theme', ${JSON.stringify(state.theme)}); localStorage.setItem('woodpecker:locale', ${JSON.stringify(state.locale)});`
      : `localStorage.setItem('wp-prototype-theme', ${JSON.stringify(state.theme)});`;
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: storageScript });

  const baseUrl = state.surface === 'production' ? productionUrl : prototypeUrl;
  const routePath = state.surface === 'production' ? state.destination.productionPath : state.destination.prototypePath;
  const loadEvent = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: `${baseUrl}${routePath}` });
  await loadEvent;
  await waitForDocument(client);

  const networkDeadline = Date.now() + 5_000;
  while (inflightRequests.size > 0 && Date.now() < networkDeadline) await sleep(100);
  for (const requestId of inflightRequests) {
    networkFailures.push({
      url: requestUrls.get(requestId) ?? null,
      errorText: 'Request remained pending after the 5-second network-settle deadline',
      blockedReason: null,
      timestamp: new Date().toISOString(),
    });
  }
  inflightRequests.clear();

  const measurementResult = await client.send('Runtime.evaluate', {
    expression: `(async () => {
      const runtimeRouter = ${state.surface === 'production' ? "(await import('/src/router.ts')).default" : 'null'};
      const controls = [...document.querySelectorAll('a,button')].map((node) => ({
        tag: node.tagName.toLowerCase(),
        text: (node.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 180),
        href: node.getAttribute('href'),
        title: node.getAttribute('title'),
        ariaLabel: node.getAttribute('aria-label'),
      }));
      const denseContainers = [...document.querySelectorAll('[data-testid="log-console"], .overflow-x-auto, table, pre')]
        .slice(0, 24)
        .map((node, index) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return {
            index,
            tag: node.tagName.toLowerCase(),
            className: typeof node.className === 'string' ? node.className : '',
            testId: node.getAttribute('data-testid'),
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            rectWidth: Number(rect.width.toFixed(2)),
            overflowX: style.overflowX,
          };
        });
      const text = document.body?.innerText || '';
      const rawI18nKeys = [
        ...new Set(
          text.match(
            /(?<![\\\\/\\w.-])(?:ops|pipeline|repo|user)\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)*(?![\\w.-])/gi,
          ) || [],
        ),
      ];
      const bodyStyle = getComputedStyle(document.body);
      return {
        body: {
          clientWidth: document.body.clientWidth,
          scrollWidth: document.body.scrollWidth,
          scrollHeight: document.body.scrollHeight,
        },
        bodyText: text.trim().replace(/\\s+/g, ' '),
        bodyTextSample: text.trim().replace(/\\s+/g, ' ').slice(0, 1600),
        colors: {
          background: bodyStyle.backgroundColor,
          text: bodyStyle.color,
        },
        controls,
        denseContainers,
        document: {
          className: document.documentElement.className,
          clientHeight: document.documentElement.clientHeight,
          clientWidth: document.documentElement.clientWidth,
          dataTheme: document.documentElement.getAttribute('data-theme'),
          lang: document.documentElement.lang,
          scrollHeight: document.documentElement.scrollHeight,
          scrollWidth: document.documentElement.scrollWidth,
        },
        pageLevelHorizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth ||
          document.body.scrollWidth > document.body.clientWidth,
        rawI18nKeys,
        terminalRouteName: runtimeRouter?.currentRoute.value.name ?? null,
        title: document.title,
        url: location.href,
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
  const screenshot = Buffer.from(screenshotResult.data, 'base64');
  const dimensions = pngDimensions(screenshot);
  const endedAt = new Date().toISOString();
  const errorCount =
    consoleMessages.filter((entry) => entry.level === 'error').length +
    runtimeExceptions.length +
    networkFailures.length +
    httpErrors.length;
  const warningCount = consoleMessages.filter((entry) => entry.level === 'warning').length;
  const measurement = {
    ...measurementResult.result.value,
    stateId: state.id,
    surface: state.label,
    permission: state.permission,
    viewport: {
      devicePixelRatio: 1,
      width: state.viewport.width,
      height: state.viewport.height,
    },
    screenshotDimensions: dimensions,
    capturedAt: endedAt,
    health: {
      startedAt,
      endedAt,
      errorCount,
      warningCount,
      console: consoleMessages,
      runtimeExceptions,
      networkFailures,
      httpErrors,
      interceptedOptionalAssets,
    },
  };

  await Promise.all([
    writeFile(path.join(evidenceRoot, `${state.id}.png`), screenshot),
    writeFile(path.join(evidenceRoot, `${state.id}.json`), `${JSON.stringify(measurement, null, 2)}\n`),
  ]);
  await fetch(`http://127.0.0.1:${remotePort}/json/close/${target.id}`);
  client.close();
  return measurement;
}

const startedServices = [];
let chrome;
let chromeProfile;

try {
  const mock = await ensureService({
    name: 'mock-api',
    url: `${mockApiUrl}/api/evidence/permissions`,
    command: 'python3',
    args: [path.join(evidenceRoot, 'mock_api.py')],
    cwd: projectRoot,
  });
  if (mock) startedServices.push(mock);

  const production = await ensureService({
    name: 'production',
    url: productionUrl,
    command: 'pnpm',
    args: ['start', '--host', '127.0.0.1', '--port', '8010'],
    cwd: productionRoot,
    env: { VITE_DEV_PROXY: mockApiUrl },
  });
  if (production) startedServices.push(production);

  const prototype = await ensureService({
    name: 'prototype',
    url: prototypeUrl,
    command: 'python3',
    args: ['-m', 'http.server', '4173', '--bind', '127.0.0.1'],
    cwd: prototypeRoot,
  });
  if (prototype) startedServices.push(prototype);

  const serviceIdentity = await assertServiceIdentity();
  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task009-chrome-'));
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
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  chrome.stderr.on('data', (chunk) => {
    if (process.env.TASK009_CHROME_LOG === '1') process.stderr.write(chunk);
  });
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);

  const measurements = [];
  for (const state of states) {
    process.stderr.write(`[capture] ${state.id}\n`);
    measurements.push(await captureState(state, remotePort));
  }

  await fetch(`${mockApiUrl}/api/evidence/permissions?push=1`);
  const bySurface = {
    production: measurements
      .filter((measurement) => measurement.stateId.startsWith('production-'))
      .map((measurement) => ({ stateId: measurement.stateId, ...measurement.health })),
    prototype: measurements
      .filter((measurement) => measurement.stateId.startsWith('prototype-'))
      .map((measurement) => ({ stateId: measurement.stateId, ...measurement.health })),
  };
  await Promise.all([
    writeFile(
      path.join(evidenceRoot, 'browser-console-production.json'),
      `${JSON.stringify(bySurface.production, null, 2)}\n`,
    ),
    writeFile(
      path.join(evidenceRoot, 'browser-console-prototype.json'),
      `${JSON.stringify(bySurface.prototype, null, 2)}\n`,
    ),
  ]);

  const errorStates = measurements
    .filter((measurement) => measurement.health.errorCount > 0)
    .map((measurement) => measurement.stateId);
  const summary = {
    ok: errorStates.length === 0,
    states: measurements.length,
    productionStates: bySurface.production.length,
    prototypeStates: bySurface.prototype.length,
    errorStates,
    totalWarnings: measurements.reduce((total, measurement) => total + measurement.health.warningCount, 0),
    serviceIdentity,
    manifestUpdated: true,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(path.join(evidenceRoot, 'browser-replay-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await updateManifest(measurements);
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await stopChild(chrome);
  for (const service of startedServices.reverse()) await stopChild(service);
  if (chromeProfile) await rm(chromeProfile, { force: true, recursive: true });
}
