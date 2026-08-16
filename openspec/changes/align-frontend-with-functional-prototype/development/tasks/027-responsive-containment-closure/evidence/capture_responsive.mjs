#!/usr/bin/env node

/**
 * Task 027 cross-family responsive containment capture.
 * Boots the consolidated Mock API and the Vite dev server, drives headless
 * Chrome over CDP at desktop/tablet/mobile viewports, measures page-level
 * horizontal overflow and dense-container containment per state, and writes
 * measurement JSON + PNG evidence plus a replay summary.
 */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expectedPatterns, states } from './matrix.mjs';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const webRoot = path.join(projectRoot, 'web');
const mockApiUrl = process.env.TASK027_MOCK_URL ?? 'http://127.0.0.1:8272';
const productionUrl = process.env.TASK027_PRODUCTION_URL ?? 'http://127.0.0.1:8270';
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viteEntry = path.join(webRoot, 'node_modules/vite/bin/vite.js');
const runId = randomUUID();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
assert.equal(states.length, 39);

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
  for (let index = 0; index < 60 && child.exitCode == null && child.signalCode == null; index += 1) await sleep(50);
  if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL');
  for (let index = 0; index < 60 && child.exitCode == null && child.signalCode == null; index += 1) await sleep(50);
  assert.ok(child.exitCode != null || child.signalCode != null, 'child did not exit');
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
    if (/^(?:production)-.+\.(?:json|png)$/.test(file) || file === 'browser-replay-summary.json') {
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
    if (patterns.every((pattern) => pattern.test(text))) return text;
    if (process.env.TASK027_DEBUG === '1') {
      process.stderr.write(`[debug] body sample: ${text.replace(/\s+/g, ' ').slice(0, 600)}\n`);
    }
    await sleep(300);
  }
  throw new Error(`readiness patterns not matched: ${patterns.map((pattern) => pattern.source).join(', ')}`);
}

async function captureState(state, remotePort) {
  let chromeTargets = [];
  for (let attempt = 0; attempt < 20 && chromeTargets.length === 0; attempt += 1) {
    chromeTargets = await fetch(`http://127.0.0.1:${remotePort}/json/list`).then((response) => response.json());
    if (chromeTargets.length === 0) await sleep(250);
  }
  const target = chromeTargets.find((entry) => entry.type === 'page');
  assert.ok(target, `no page target for ${state.id}`);
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  const consoleMessages = [];
  const runtimeExceptions = [];
  const networkFailures = [];
  const httpErrors = [];
  const requestUrls = [];
  client.on('Runtime.consoleAPICalled', (event) => {
    consoleMessages.push({
      level: event.type,
      text: (event.args ?? [])
        .map((arg) => (arg.value !== undefined ? String(arg.value) : (arg.description ?? '')))
        .join(' '),
    });
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
  const failedRequestUrls = new Map();
  client.on('Network.requestWillBeSent', (event) => {
    failedRequestUrls.set(event.requestId, event.request.url);
  });
  client.on('Network.loadingFailed', (event) => {
    if (!event.canceled)
      networkFailures.push({
        errorText: event.errorText,
        blockedReason: event.blockedReason ?? null,
        url: failedRequestUrls.get(event.requestId) ?? null,
      });
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
  const OPTIONAL_URLS = new Set([
    `${productionUrl}/assets/custom.js`,
    'https://forge.example/favicon.ico',
    'https://forge.example/avatar.png',
  ]);
  client.on('Fetch.requestPaused', (event) => {
    if (!OPTIONAL_URLS.has(event.request.url)) {
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
        { urlPattern: 'https://forge.example/*', requestStage: 'Request' },
      ],
    }),
    client.send('Emulation.setDeviceMetricsOverride', {
      width: state.viewport.width,
      height: state.viewport.height,
      deviceScaleFactor: 1,
      mobile: state.viewport.mobile,
      screenWidth: state.viewport.width,
      screenHeight: state.viewport.height,
    }),
  ]);

  const storageScript = `if (location.href.startsWith(${JSON.stringify(productionUrl)})) { localStorage.setItem('woodpecker:theme', ${JSON.stringify(state.theme)}); localStorage.setItem('woodpecker:locale', ${JSON.stringify(state.locale)}); }`;
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: storageScript });

  // Reset the fixture identity every state (guest for login, admin otherwise)
  // and hard-reboot the app for guest states so web-config.js is re-fetched
  // without the authenticated SPA bootstrap being reused.
  await fetch(`${mockApiUrl}/api/evidence/state?role=${state.guest ? 'guest' : 'admin'}`).then((response) =>
    response.json(),
  );
  if (state.guest) {
    const blankLoad = client.once('Page.loadEventFired');
    await client.send('Page.navigate', { url: 'about:blank' });
    await blankLoad;
  }

  const loadEvent = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: `${productionUrl}${state.destination.productionPath}` });
  await loadEvent;
  await waitForDocument(client, expectedPatterns(state));

  const measurementResult = await client.send('Runtime.evaluate', {
    expression: `(async () => {
      const text = document.body?.innerText || '';
      const viewportWidth = document.documentElement.clientWidth;
      const denseContainers = [...document.querySelectorAll('.wp-table-scroll, .table-scroll, .log-console, table, pre')].map((node) => {
        const style = getComputedStyle(node);
        return {
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === 'string' ? node.className : '',
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          overflowX: style.overflowX,
          locallyScrollable: node.scrollWidth > node.clientWidth + 1 && ['auto', 'scroll'].includes(style.overflowX),
        };
      });
      const overflowContributors = [...document.querySelectorAll('body *')]
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.width === 0 || rect.right <= viewportWidth + 1) return false;
          let parent = node.parentElement;
          while (parent) {
            const pStyle = getComputedStyle(parent);
            if (parent.scrollWidth > parent.clientWidth + 1 && ['auto', 'scroll'].includes(pStyle.overflowX)) return false;
            parent = parent.parentElement;
          }
          return true;
        })
        .slice(0, 12)
        .map((node) => ({
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === 'string' ? node.className : '',
          id: node.id || '',
          right: Math.round(node.getBoundingClientRect().right),
          width: Math.round(node.getBoundingClientRect().width),
        }));
      return {
        bodyTextSample: text.trim().replace(/\\s+/g, ' ').slice(0, 1600),
        document: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          dataTheme: document.documentElement.getAttribute('data-theme'),
          lang: document.documentElement.lang,
        },
        body: {
          clientWidth: document.body.clientWidth,
          scrollWidth: document.body.scrollWidth,
        },
        pageLevelHorizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 ||
          document.body.scrollWidth > document.body.clientWidth + 1,
        overflowContributors,
        denseContainers,
        rawI18nKeys: [...new Set(text.match(/(?<![\\\\/\\w.-])(?:ops|feedback|settings|not_found|file_tree)\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)*(?![\\w.-])/gi) || [])],
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

  const measurement = {
    schema: 'woodpecker.task027-responsive-measurement.v1',
    stateId: state.id,
    runId,
    row: state.row,
    theme: state.theme,
    locale: state.locale,
    viewportId: state.viewportId,
    viewport: state.viewport,
    destination: state.destination,
    health: {
      consoleMessages: consoleMessages.filter((entry) => entry.level === 'error').slice(0, 10),
      runtimeExceptions: runtimeExceptions.slice(0, 10),
      networkFailures: networkFailures.slice(0, 10),
      httpErrors: httpErrors.slice(0, 10),
    },
    ...measurementResult.result.value,
  };
  await writeJsonAtomic(path.join(evidenceRoot, `production-${state.id}.json`), measurement);
  await writeAtomic(path.join(evidenceRoot, `production-${state.id}.png`), screenshot);
  return measurement;
}

await clearPreviousEvidence();
const services = [];
let chrome;
let chromeProfile;

try {
  services.push(
    await (async () => {
      const child = spawn('python3', [path.join(evidenceRoot, 'mock_api.py'), '--port', '8272'], {
        cwd: projectRoot,
        env: { ...process.env, TASK027_RUN_ID: runId },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      child.stderr.on('data', (chunk) => process.stderr.write(`[mock-api] ${chunk}`));
      await waitForUrl(mockApiUrl);
      return child;
    })(),
  );
  services.push(
    await (async () => {
      const child = spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', '8270', '--strictPort'], {
        cwd: webRoot,
        env: { ...process.env, VITE_DEV_PROXY: mockApiUrl },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      await waitForUrl(productionUrl);
      return child;
    })(),
  );

  const fixtureIdentity = await fetch(mockApiUrl).then((response) => response.json());
  assert.equal(fixtureIdentity.fixture, '027-responsive-containment-closure');
  assert.equal(fixtureIdentity.run_id, runId);
  const productionHtml = await fetch(productionUrl).then((response) => response.text());
  assert.match(productionHtml, /src="\/src\/main\.ts/);

  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task027-chrome-'));
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
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);

  const measurements = [];
  for (const [index, state] of states.entries()) {
    process.stderr.write(`[capture ${index + 1}/${states.length}] ${state.id}\n`);
    measurements.push(await captureState(state, remotePort));
  }

  // Environment-artifact failures: the Vite HMR websocket and the fixture SSE
  // stream close when a hard navigation (about:blank) tears the previous
  // document down. They are recorded per state but excluded from the fail
  // set, mirroring the optional-asset treatment in the Task 021/022 capture.
  const ALLOWED_FAILURE_PATTERNS = [/^ws:\/\/127\.0\.0\.1:8270\//, /\/api\/stream\/events$/];
  const failedStates = measurements
    .filter((measurement) => {
      const artifactFailures = (measurement.health.networkFailures ?? []).filter((failure) =>
        ALLOWED_FAILURE_PATTERNS.some((pattern) => pattern.test(failure.url ?? '')),
      );
      measurement.health.allowedArtifactFailures = artifactFailures;
      return (
        measurement.pageLevelHorizontalOverflow ||
        measurement.rawI18nKeys.length > 0 ||
        measurement.health.consoleMessages.length > 0 ||
        measurement.health.runtimeExceptions.length > 0 ||
        measurement.health.networkFailures.length > artifactFailures.length ||
        measurement.health.httpErrors.length > 0
      );
    })
    .map((measurement) => measurement.stateId);

  const summary = {
    schema: 'woodpecker.task027-responsive-replay.v1',
    ok: failedStates.length === 0,
    runId,
    states: measurements.length,
    viewports: Object.keys({ desktop: 1, tablet: 1, mobile: 1 }),
    families: [...new Set(measurements.map((measurement) => measurement.stateId.split('-')[0]))],
    rows: [...new Set(measurements.map((measurement) => measurement.row))].sort((left, right) => left - right),
    failedStates,
    generatedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(path.join(evidenceRoot, 'browser-replay-summary.json'), summary);

  // Checksummed evidence manifest: PNG and JSON digests pinned at capture time
  // so the strict verifier can detect any later tampering.
  const manifestEntries = {};
  for (const measurement of measurements) {
    manifestEntries[`production-${measurement.stateId}.json`] = createHash('sha256')
      .update(await readFile(path.join(evidenceRoot, `production-${measurement.stateId}.json`)))
      .digest('hex');
    manifestEntries[`production-${measurement.stateId}.png`] = createHash('sha256')
      .update(await readFile(path.join(evidenceRoot, `production-${measurement.stateId}.png`)))
      .digest('hex');
  }
  await writeJsonAtomic(path.join(evidenceRoot, 'evidence-manifest.json'), {
    schema: 'woodpecker.task027-evidence-manifest.v1',
    runId,
    states: measurements.length,
    files: manifestEntries,
  });
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await stopChild(chrome);
  for (let index = services.length - 1; index >= 0; index -= 1) await stopChild(services[index]);
  if (chromeProfile) await rm(chromeProfile, { recursive: true, force: true });
}
