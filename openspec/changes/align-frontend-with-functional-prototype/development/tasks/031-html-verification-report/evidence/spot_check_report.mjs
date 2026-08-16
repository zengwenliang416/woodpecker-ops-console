#!/usr/bin/env node

/**
 * Task 031 report spot check: headless browser renders the three HTML pages
 * and verifies structure (title, 67 matrix rows, blocked row 4 banner, no
 * console errors, no network requests).
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
const changeDir = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');
const chromeBinary = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const runId = randomUUID();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
  }
}

let chrome;
let profile;
const checks = [];
try {
  const remotePort = await getFreePort();
  profile = await mkdtemp(path.join(tmpdir(), 'task031-chrome-'));
  chrome = spawn(
    chromeBinary,
    [
      '--headless=new',
      `--remote-debugging-port=${remotePort}`,
      `--user-data-dir=${profile}`,
      '--disable-extensions',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);
  const targets = await fetch(`http://127.0.0.1:${remotePort}/json/list`).then((r) => r.json());
  const client = await CdpClient.connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  const consoleErrors = [];
  const networkRequests = [];
  client.on('Runtime.consoleAPICalled', (event) => {
    if (event.type === 'error')
      consoleErrors.push((event.args ?? []).map((a) => a.value ?? a.description ?? '').join(' '));
  });
  client.on('Network.requestWillBeSent', (event) => {
    if (!event.request.url.startsWith('data:') && !event.request.url.startsWith('file://'))
      networkRequests.push(event.request.url);
  });
  await Promise.all([client.send('Page.enable'), client.send('Runtime.enable'), client.send('Network.enable')]);
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const pages = ['overview.html', 'test-case-catalog.html', 'test-case-results.html'];
  for (const page of pages) {
    const load = client.once('Page.loadEventFired');
    await client.send('Page.navigate', { url: `file://${changeDir}/verify/reports/${page}` });
    await load;
    await sleep(400);
    const result = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText || '';
        const rowCount = document.querySelectorAll('table tbody tr').length;
        return { title: document.title, text: text.slice(0, 400), rowCount };
      })()`,
      returnByValue: true,
    });
    checks.push({ page, ...result.result.value });
  }

  const overview = checks.find((c) => c.page === 'overview.html');
  assert.ok(overview.title.includes('总览'), 'overview title missing');
  assert.ok(overview.text.includes('Blocked row 4'), 'overview blocked banner missing');
  assert.ok(overview.text.includes('verified'), 'overview verified count missing');
  assert.ok(!overview.text.includes('undefined'), 'overview renders undefined content');
  assert.ok(overview.text.includes('平价矩阵'), 'overview missing A1 statement text');
  const catalog = checks.find((c) => c.page === 'test-case-catalog.html');
  assert.equal(catalog.rowCount, 67, `catalog must have 67 rows, found ${catalog.rowCount}`);
  assert.ok(catalog.text.includes('Blocked row 4'), 'catalog blocked banner missing');
  const results = checks.find((c) => c.page === 'test-case-results.html');
  assert.ok(results.rowCount >= 30, `results must show >= 30 slice acceptances, found ${results.rowCount}`);
  assert.equal(consoleErrors.length, 0, `console errors: ${JSON.stringify(consoleErrors)}`);
  assert.equal(networkRequests.length, 0, `unexpected network requests: ${JSON.stringify(networkRequests)}`);

  const summary = {
    schema: 'woodpecker.task031-report-spot-check.v1',
    ok: true,
    runId,
    pages: pages.length,
    catalog_rows: catalog.rowCount,
    console_errors: consoleErrors.length,
    network_requests: networkRequests.length,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(path.join(evidenceRoot, 'report-spot-check-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary));
} finally {
  if (chrome) {
    chrome.kill('SIGKILL');
    for (let i = 0; i < 40 && chrome.exitCode == null && chrome.signalCode == null; i += 1) await sleep(50);
  }
  if (profile) await rm(profile, { recursive: true, force: true }).catch(() => {});
}
