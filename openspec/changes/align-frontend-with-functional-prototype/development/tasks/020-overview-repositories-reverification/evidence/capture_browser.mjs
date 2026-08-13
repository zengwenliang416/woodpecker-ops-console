#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
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
const productionUrl = process.env.TASK020_PRODUCTION_URL ?? 'http://127.0.0.1:8200';
const prototypeUrl = process.env.TASK020_PROTOTYPE_URL ?? 'http://127.0.0.1:8201';
const mockApiUrl = process.env.TASK020_MOCK_API ?? 'http://127.0.0.1:8202';
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const runId = randomUUID();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const destinations = {
  overview: {
    row: 2,
    productionPath: '/overview',
    prototypePath: '/#/overview',
    productionRoute: 'overview',
    productionZh: [/概览/, /活跃流水线/],
    productionEn: [/Overview/, /Active pipelines/],
    prototypeZh: [/概览/, /活跃流水线/],
  },
  repos: {
    row: 3,
    productionPath: '/repos',
    prototypePath: '/#/repos',
    productionRoute: 'repos',
    productionZh: [/仓库/, /acme\/backend-api/],
    productionEn: [/Repositories/, /acme\/backend-api/],
    prototypeZh: [/仓库/, /acme\/backend-api/],
  },
};
const viewports = {
  desktop: { width: 1600, height: 1000 },
  mobile: { width: 390, height: 844 },
};

const states = [
  ...Object.entries(viewports).flatMap(([viewportId, viewport]) =>
    Object.entries(destinations).flatMap(([destinationId, destination]) => [
      {
        id: `production-dark-zh-${viewportId}-${destinationId}`,
        surface: 'production',
        destinationId,
        destination,
        viewportId,
        viewport,
        theme: 'dark',
        locale: 'zh-Hans',
        role: 'admin',
        dataState: 'populated',
        class: 'equivalent',
      },
      {
        id: `prototype-dark-zh-${viewportId}-${destinationId}`,
        surface: 'prototype',
        destinationId,
        destination,
        viewportId,
        viewport,
        theme: 'dark',
        locale: 'zh-CN',
        role: 'prototype-administrator',
        dataState: 'populated',
        class: 'equivalent',
      },
    ]),
  ),
  ...Object.entries(viewports).flatMap(([viewportId, viewport]) =>
    Object.entries(destinations).flatMap(([destinationId, destination]) => [
      {
        id: `production-light-en-${viewportId}-${destinationId}`,
        surface: 'production',
        destinationId,
        destination,
        viewportId,
        viewport,
        theme: 'light',
        locale: 'en',
        role: 'admin',
        dataState: 'populated',
        class: 'representative',
      },
      {
        id: `prototype-light-zh-${viewportId}-${destinationId}`,
        surface: 'prototype',
        destinationId,
        destination,
        viewportId,
        viewport,
        theme: 'light',
        locale: 'zh-CN',
        role: 'prototype-administrator',
        dataState: 'populated',
        class: 'representative',
      },
    ]),
  ),
  {
    id: 'production-dark-zh-desktop-overview-normal-user',
    surface: 'production',
    destinationId: 'overview',
    destination: destinations.overview,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'normal',
    dataState: 'populated',
    class: 'boundary',
  },
  {
    id: 'production-dark-zh-desktop-overview-partial',
    surface: 'production',
    destinationId: 'overview',
    destination: destinations.overview,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'partial',
    class: 'boundary',
  },
  {
    id: 'production-dark-zh-desktop-repos-empty',
    surface: 'production',
    destinationId: 'repos',
    destination: destinations.repos,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'empty',
    class: 'boundary',
  },
  {
    id: 'production-dark-zh-desktop-repos-partial',
    surface: 'production',
    destinationId: 'repos',
    destination: destinations.repos,
    viewportId: 'desktop',
    viewport: viewports.desktop,
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'partial',
    class: 'boundary',
  },
];

assert.equal(states.length, 20);
assert.equal(new Set(states.map((state) => state.id)).size, 20);

async function listFiles(root, relativeRoot = '') {
  const entries = await readdir(path.join(root, relativeRoot), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('._') || ['node_modules', 'dist', 'coverage'].includes(entry.name)) continue;
    const relativePath = path.join(relativeRoot, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, relativePath)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
}

async function digestTree(root, includedFiles) {
  const hash = createHash('sha256');
  const files = includedFiles ?? (await listFiles(root));
  for (const relativePath of [...files].sort()) {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(await readFile(path.join(root, relativePath)));
    hash.update('\0');
  }
  return { algorithm: 'sha256', digest: hash.digest('hex'), files: files.length };
}

async function sourceIdentity() {
  const productionFiles = (await listFiles(productionRoot)).filter(
    (file) =>
      file.startsWith('src/') ||
      ['index.html', 'package.json', 'pnpm-lock.yaml', 'vite.config.ts', 'tsconfig.json'].includes(file),
  );
  return {
    production: await digestTree(productionRoot, productionFiles),
    prototype: await digestTree(prototypeRoot),
  };
}

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
      if (response.ok || response.status === 204) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function startOwnedService({ name, url, command, args, cwd, env = {} }) {
  let occupied = false;
  try {
    await waitForUrl(url, 700);
    occupied = true;
  } catch {
    // Final evidence owns all three service ports.
  }
  assert.equal(occupied, false, `${name} URL already occupied: ${url}`);
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (process.env.TASK020_SERVICE_LOG === '1') {
    child.stdout.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
    child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  }
  await waitForUrl(url);
  assert.equal(child.exitCode, null, `${name} exited before capture`);
  return child;
}

async function stopChild(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill('SIGTERM');
  for (let index = 0; index < 60 && child.exitCode == null && child.signalCode == null; index += 1) {
    await sleep(50);
  }
  if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL');
  for (let index = 0; index < 60 && child.exitCode == null && child.signalCode == null; index += 1) {
    await sleep(50);
  }
  assert.ok(child.exitCode != null || child.signalCode != null, `child ${child.pid ?? 'unknown'} did not exit`);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function writeAtomic(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, value);
  await rename(temporaryPath, filePath);
}

async function writeJsonAtomic(filePath, value) {
  await writeAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function clearPreviousEvidence() {
  for (const file of await readdir(evidenceRoot)) {
    if (/^(?:production|prototype)-.+\.(?:json|png)$/.test(file) || file === 'browser-replay-summary.json') {
      await rm(path.join(evidenceRoot, file), { force: true });
    }
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

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
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

function expectedPatterns(state) {
  if (state.id.endsWith('overview-normal-user')) return [/概览/, /仓库数量/, /最近活动/];
  if (state.id.endsWith('overview-partial')) return [/部分概览数据暂不可用/, /活跃流水线/];
  if (state.id.endsWith('repos-empty')) return [/暂无仓库/, /添加或激活仓库/];
  if (state.id.endsWith('repos-partial')) return [/部分仓库数据暂不可用/, /acme\/backend-api/];
  if (state.surface === 'prototype') return state.destination.prototypeZh;
  return state.locale === 'en' ? state.destination.productionEn : state.destination.productionZh;
}

function expectedHttpErrors(state) {
  if (state.id.endsWith('overview-partial')) return [{ path: '/api/agents', status: 503 }];
  if (state.id.endsWith('repos-partial')) return [{ path: '/api/forges', status: 503 }];
  return [];
}

async function waitForDocument(client, patterns) {
  const serialized = patterns.map((pattern) => [pattern.source, pattern.flags]);
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const result = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body?.innerText || '';
        return document.readyState === 'complete' &&
          ${JSON.stringify(serialized)}.every(([source, flags]) => new RegExp(source, flags).test(text));
      })()`,
      returnByValue: true,
    });
    if (result.result.value === true) {
      await sleep(500);
      return;
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for content: ${patterns.join(', ')}`);
}

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function captureState(state, remotePort) {
  if (state.surface === 'production') {
    await waitForUrl(`${mockApiUrl}/api/evidence/state?role=${state.role}&data=${state.dataState}`);
  }
  const target = await fetch(`http://127.0.0.1:${remotePort}/json/new?about:blank`, { method: 'PUT' }).then(
    (response) => response.json(),
  );
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  const startedAt = new Date().toISOString();
  const consoleMessages = [];
  const runtimeExceptions = [];
  const networkFailures = [];
  const httpErrors = [];
  const requestUrls = [];

  client.on('Runtime.consoleAPICalled', (event) => {
    consoleMessages.push({ level: event.type, message: consoleText(event.args) });
  });
  client.on('Runtime.exceptionThrown', (event) => {
    runtimeExceptions.push({
      message: event.exceptionDetails?.text ?? 'Runtime exception',
      description: event.exceptionDetails?.exception?.description ?? null,
    });
  });
  client.on('Network.requestWillBeSent', (event) => {
    if (/^https?:/.test(event.request.url)) requestUrls.push(event.request.url);
  });
  client.on('Network.loadingFailed', (event) => {
    if (!event.canceled)
      networkFailures.push({ errorText: event.errorText, blockedReason: event.blockedReason ?? null });
  });
  client.on('Network.responseReceived', (event) => {
    if (event.response.status >= 400) {
      httpErrors.push({
        url: event.response.url,
        status: event.response.status,
        statusText: event.response.statusText,
      });
    }
  });
  client.on('Fetch.requestPaused', (event) => {
    const isOptional =
      event.request.url === `${productionUrl}/assets/custom.js` || event.request.url === `${prototypeUrl}/favicon.ico`;
    if (!isOptional) {
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
    client.send('Network.setCacheDisabled', { cacheDisabled: true }),
    client.send('Fetch.enable', {
      patterns: [
        { urlPattern: `${productionUrl}/assets/custom.js`, requestStage: 'Request' },
        { urlPattern: `${prototypeUrl}/favicon.ico`, requestStage: 'Request' },
      ],
    }),
    client.send('Emulation.setDeviceMetricsOverride', {
      width: state.viewport.width,
      height: state.viewport.height,
      deviceScaleFactor: 1,
      mobile: state.viewportId === 'mobile',
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
  const patterns = expectedPatterns(state);
  await waitForDocument(client, patterns);

  const measurementResult = await client.send('Runtime.evaluate', {
    expression: `(async () => {
      const router = ${state.surface === 'production' ? "(await import('/src/router.ts')).default" : 'null'};
      const text = document.body?.innerText || '';
      const denseContainers = [...document.querySelectorAll('.wp-table-scroll, .table-scroll, table, pre')].map((node) => {
        const style = getComputedStyle(node);
        return {
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === 'string' ? node.className : '',
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          overflowX: style.overflowX,
          locallyScrollable: node.scrollWidth > node.clientWidth && ['auto', 'scroll'].includes(style.overflowX),
        };
      });
      return {
        bodyText: text.trim().replace(/\\s+/g, ' '),
        bodyTextSample: text.trim().replace(/\\s+/g, ' ').slice(0, 2400),
        document: {
          clientWidth: document.documentElement.clientWidth,
          clientHeight: document.documentElement.clientHeight,
          scrollWidth: document.documentElement.scrollWidth,
          dataTheme: document.documentElement.getAttribute('data-theme'),
          lang: document.documentElement.lang,
        },
        body: {
          clientWidth: document.body.clientWidth,
          scrollWidth: document.body.scrollWidth,
        },
        pageLevelHorizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth ||
          document.body.scrollWidth > document.body.clientWidth,
        rawI18nKeys: [...new Set(text.match(/(?<![\\\\/\\w.-])(?:overview|repositories|feedback)\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)*(?![\\w.-])/gi) || [])],
        denseContainers,
        terminalRouteName: router?.currentRoute.value.name ?? null,
        terminalPath: router?.currentRoute.value.fullPath ?? location.hash.slice(1),
        url: location.href,
        title: document.title,
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
  const expectedErrors = expectedHttpErrors(state);
  const unexpectedHttpErrors = httpErrors.filter(
    (error) =>
      !expectedErrors.some(
        (expected) => new URL(error.url).pathname === expected.path && error.status === expected.status,
      ),
  );
  const missingExpectedHttpErrors = expectedErrors.filter(
    (expected) =>
      !httpErrors.some((error) => new URL(error.url).pathname === expected.path && error.status === expected.status),
  );
  const apiRequests =
    state.surface === 'production'
      ? await fetch(`${mockApiUrl}/api/evidence/requests`).then((response) => response.json())
      : { requests: [] };
  const endedAt = new Date().toISOString();
  const measurement = {
    ...measurementResult.result.value,
    runId,
    stateId: state.id,
    row: state.destination.row,
    destination: state.destinationId,
    surface: state.surface,
    stateClass: state.class,
    role: state.role,
    dataState: state.dataState,
    viewportId: state.viewportId,
    viewport: { devicePixelRatio: 1, ...state.viewport },
    screenshotDimensions: pngDimensions(screenshot),
    contentAssertions: patterns.map((pattern) => ({
      pattern: pattern.toString(),
      passed: pattern.test(measurementResult.result.value.bodyText),
    })),
    apiRequests: apiRequests.requests,
    capturedAt: endedAt,
    health: {
      startedAt,
      endedAt,
      consoleErrors: consoleMessages.filter((entry) => entry.level === 'error'),
      consoleWarnings: consoleMessages.filter((entry) => entry.level === 'warning'),
      runtimeExceptions,
      networkFailures,
      httpErrors,
      unexpectedHttpErrors,
      missingExpectedHttpErrors,
      requestUrls,
    },
  };
  await Promise.all([
    writeAtomic(path.join(evidenceRoot, `${state.id}.png`), screenshot),
    writeJsonAtomic(path.join(evidenceRoot, `${state.id}.json`), measurement),
  ]);
  await fetch(`http://127.0.0.1:${remotePort}/json/close/${target.id}`);
  client.close();
  return measurement;
}

async function aggregateChecksum(files) {
  const records = [];
  for (const file of [...files].sort()) {
    records.push(`${sha256(await readFile(path.join(evidenceRoot, file)))}  ./${file}\n`);
  }
  return sha256(records.join(''));
}

async function updateManifest(measurements, source, serviceIdentity) {
  const manifestPath = path.join(evidenceRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const files = await readdir(evidenceRoot);
  const pngFiles = files.filter((file) => /^(?:production|prototype)-.+\.png$/.test(file));
  const measurementFiles = files.filter((file) => /^(?:production|prototype)-.+\.json$/.test(file));
  manifest.run_id = runId;
  manifest.captured_from = measurements.map((measurement) => measurement.health.startedAt).sort()[0];
  manifest.captured_through = measurements
    .map((measurement) => measurement.health.endedAt)
    .sort()
    .at(-1);
  manifest.source_identity = source;
  manifest.service_identity = serviceIdentity;
  manifest.actual = {
    states: measurements.length,
    production_states: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototype_states: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    equivalent_states: measurements.filter((measurement) => measurement.stateClass === 'equivalent').length,
    representative_states: measurements.filter((measurement) => measurement.stateClass === 'representative').length,
    boundary_states: measurements.filter((measurement) => measurement.stateClass === 'boundary').length,
    page_overflow_states: measurements
      .filter((measurement) => measurement.pageLevelHorizontalOverflow)
      .map((m) => m.stateId),
    raw_i18n_states: measurements.filter((measurement) => measurement.rawI18nKeys.length > 0).map((m) => m.stateId),
    browser_error_states: measurements
      .filter(
        (measurement) =>
          measurement.health.consoleErrors.length > 0 ||
          measurement.health.runtimeExceptions.length > 0 ||
          measurement.health.networkFailures.length > 0 ||
          measurement.health.unexpectedHttpErrors.length > 0 ||
          measurement.health.missingExpectedHttpErrors.length > 0,
      )
      .map((measurement) => measurement.stateId),
  };
  manifest.checksums = {
    mock_api_py: sha256(await readFile(path.join(evidenceRoot, 'mock_api.py'))),
    mock_api_smoke_mjs: sha256(await readFile(path.join(evidenceRoot, 'mock_api_smoke.mjs'))),
    capture_browser_mjs: sha256(await readFile(path.join(evidenceRoot, 'capture_browser.mjs'))),
    verify_evidence_mjs: sha256(await readFile(path.join(evidenceRoot, 'verify_evidence.mjs'))),
    browser_replay_summary_json: sha256(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'))),
    all_png_files: await aggregateChecksum(pngFiles),
    all_measurement_files: await aggregateChecksum(measurementFiles),
  };
  await writeJsonAtomic(manifestPath, manifest);
}

await clearPreviousEvidence();
const identityBefore = await sourceIdentity();
const services = [];
let chrome;
let chromeProfile;

try {
  services.push(
    await startOwnedService({
      name: 'mock-api',
      url: mockApiUrl,
      command: 'python3',
      args: [path.join(evidenceRoot, 'mock_api.py')],
      cwd: projectRoot,
      env: { TASK020_RUN_ID: runId },
    }),
  );
  services.push(
    await startOwnedService({
      name: 'production',
      url: productionUrl,
      command: 'pnpm',
      args: ['start', '--host', '127.0.0.1', '--port', '8200'],
      cwd: productionRoot,
      env: { VITE_DEV_PROXY: mockApiUrl },
    }),
  );
  services.push(
    await startOwnedService({
      name: 'prototype',
      url: prototypeUrl,
      command: 'python3',
      args: ['-m', 'http.server', '8201', '--bind', '127.0.0.1'],
      cwd: prototypeRoot,
    }),
  );

  const [fixtureIdentity, productionHtml, productionView, prototypeHtml] = await Promise.all([
    fetch(mockApiUrl).then((response) => response.json()),
    fetch(productionUrl).then((response) => response.text()),
    fetch(`${productionUrl}/src/views/Overview.vue`).then((response) => response.text()),
    fetch(prototypeUrl).then((response) => response.text()),
  ]);
  assert.equal(fixtureIdentity.fixture, '020-overview-repositories-reverification');
  assert.equal(fixtureIdentity.run_id, runId);
  assert.match(productionHtml, /src="\/src\/main\.ts/);
  assert.match(productionView, /partial_error_title/);
  assert.match(prototypeHtml, /data-specnav-variant="approved-user-design"/);
  assert.equal(prototypeHtml, await readFile(path.join(prototypeRoot, 'index.html'), 'utf8'));

  const serviceIdentity = {
    fixture: fixtureIdentity.fixture,
    runId,
    serviceOwnership: 'task-started-exclusive-ports',
    productionEntrypoint: '/src/main.ts',
    productionMarker: 'partial_error_title',
    prototypeMarker: 'approved-user-design',
  };

  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task020-chrome-'));
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
    if (process.env.TASK020_CHROME_LOG === '1') process.stderr.write(chunk);
  });
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);

  const measurements = [];
  for (const [index, state] of states.entries()) {
    process.stderr.write(`[capture ${index + 1}/${states.length}] ${state.id}\n`);
    measurements.push(await captureState(state, remotePort));
  }

  const identityAfter = await sourceIdentity();
  assert.deepEqual(identityAfter, identityBefore, 'production or prototype bytes changed during capture');
  const failedStates = measurements
    .filter(
      (measurement) =>
        measurement.pageLevelHorizontalOverflow ||
        measurement.rawI18nKeys.length > 0 ||
        measurement.contentAssertions.some((assertion) => !assertion.passed) ||
        measurement.health.consoleErrors.length > 0 ||
        measurement.health.runtimeExceptions.length > 0 ||
        measurement.health.networkFailures.length > 0 ||
        measurement.health.unexpectedHttpErrors.length > 0 ||
        measurement.health.missingExpectedHttpErrors.length > 0,
    )
    .map((measurement) => measurement.stateId);
  const summary = {
    schema: 'woodpecker.overview-repositories-browser-replay.v1',
    ok: failedStates.length === 0,
    runId,
    states: measurements.length,
    productionStates: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototypeStates: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    equivalentStates: measurements.filter((measurement) => measurement.stateClass === 'equivalent').length,
    representativeStates: measurements.filter((measurement) => measurement.stateClass === 'representative').length,
    boundaryStates: measurements.filter((measurement) => measurement.stateClass === 'boundary').length,
    rows: [2, 3],
    stateIds: measurements.map((measurement) => measurement.stateId).sort(),
    failedStates,
    sourceIdentity: identityBefore,
    serviceIdentity,
    generatedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(path.join(evidenceRoot, 'browser-replay-summary.json'), summary);
  await updateManifest(measurements, identityBefore, serviceIdentity);
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await stopChild(chrome);
  for (let index = services.length - 1; index >= 0; index -= 1) await stopChild(services[index]);
  if (chromeProfile) await rm(chromeProfile, { recursive: true, force: true });
}
