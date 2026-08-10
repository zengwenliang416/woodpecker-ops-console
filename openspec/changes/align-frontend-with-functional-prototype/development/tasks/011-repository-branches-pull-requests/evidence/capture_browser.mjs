import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 20_000 + Math.floor(Math.random() * 1_000);
const profileDir = `/tmp/woodpecker-task-011-chrome-${process.pid}`;
const routeDefinitions = [
  {
    name: 'branches',
    path: '/repos/101/branches',
    ready: `document.querySelectorAll('[data-testid="branch-row"]').length === 4`,
    selector: '[data-testid="branch-row"]',
    expectedText: 'main',
  },
  {
    name: 'branch-detail',
    path: '/repos/101/branches/main',
    ready: `Boolean(document.querySelector('.reference-header'))`,
    selector: '.reference-header',
    expectedText: 'main',
  },
  {
    name: 'pull-requests',
    path: '/repos/101/pull-requests',
    ready: `document.querySelectorAll('[data-testid="pull-request-row"]').length === 3`,
    selector: '[data-testid="pull-request-row"]',
    expectedText: 'Improve pipeline diagnostics',
  },
  {
    name: 'pull-request-detail',
    path: '/repos/101/pull-requests/42',
    ready: `Boolean(document.querySelector('.reference-header'))`,
    selector: '.reference-header',
    expectedText: 'Improve pipeline diagnostics',
  },
];
const viewports = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 },
};

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--lang=en-US',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-sync',
    '--metrics-recording-only',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ],
  {
    stdio: ['ignore', 'ignore', 'pipe'],
  },
);

let stderr = '';
chrome.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJson(url, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError ?? 'no response'}`);
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const listeners = new Set();
  let sequence = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) {
      listeners.forEach((listener) => listener(message));
      return;
    }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  function send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  return {
    send,
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() {
      socket.close();
    },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(cdp, expression, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for browser condition: ${expression}`);
}

async function captureScreenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(path.join(evidenceDir, filename), Buffer.from(result.data, 'base64'));
}

function measurementExpression(routeDefinition) {
  return `(() => {
    const documentElement = document.documentElement;
    const target = document.querySelector(${JSON.stringify(routeDefinition.selector)});
    const page = document.getElementById('scroll-component');
    const size = (element) => element ? {
      client_width: element.clientWidth,
      scroll_width: element.scrollWidth,
      overflow_x: getComputedStyle(element).overflowX,
    } : null;
    return {
      href: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      document: {
        client_width: documentElement.clientWidth,
        scroll_width: documentElement.scrollWidth,
        page_level_horizontal_overflow: documentElement.scrollWidth > documentElement.clientWidth,
      },
      page: size(page),
      target: size(target),
      target_count: document.querySelectorAll(${JSON.stringify(routeDefinition.selector)}).length,
      target_text: target?.innerText ?? null,
      summary_cards: document.querySelectorAll('.summary-card').length,
      raw_locale_keys: document.body.innerText.match(/(?:repo|feedback)\\.[a-z0-9_.]+/gi) ?? [],
    };
  })()`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function screenshotEvidence(filename) {
  const buffer = await readFile(path.join(evidenceDir, filename));
  return {
    file: filename,
    sha256: sha256(buffer),
  };
}

async function stopChrome() {
  if (chrome.exitCode === null) {
    const exited = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill('SIGTERM');
    await Promise.race([exited, delay(3_000)]);
  }
  if (chrome.exitCode === null) {
    const killed = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill('SIGKILL');
    await Promise.race([killed, delay(3_000)]);
  }
  chrome.stderr.destroy();
  chrome.unref();
}

let cdp;
try {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find((target) => target.type === 'page');
  if (!pageTarget?.webSocketDebuggerUrl) throw new Error('Chrome page target is unavailable');

  cdp = await connectCdp(pageTarget.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setLocaleOverride', { locale: 'en-US' });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('woodpecker:locale', 'en');`,
  });
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8010/?task011-locale-seed=1' });
  await waitFor(cdp, `document.readyState === 'complete'`);
  await evaluate(cdp, `localStorage.setItem('woodpecker:locale', 'en')`);

  let consoleErrors = [];
  let networkErrors = [];
  let knownNetworkErrors = [];
  cdp.onEvent((message) => {
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(message.params.exceptionDetails.text);
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
    }
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
      const error = {
        status: message.params.response.status,
        url: message.params.response.url,
      };
      if (error.url.endsWith('/assets/custom.js')) knownNetworkErrors.push(error);
      else networkErrors.push(error);
    }
  });

  const measurements = {};
  const screenshots = {};
  for (const [viewportName, viewport] of Object.entries(viewports)) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      ...viewport,
      deviceScaleFactor: 1,
      mobile: false,
    });
    measurements[viewportName] = {};

    for (const routeDefinition of routeDefinitions) {
      consoleErrors = [];
      networkErrors = [];
      knownNetworkErrors = [];
      const url = `http://127.0.0.1:8010${routeDefinition.path}?task011=${viewportName}-${Date.now()}`;
      await cdp.send('Page.navigate', { url });
      await waitFor(cdp, `document.readyState === 'complete' && ${routeDefinition.ready}`);
      await waitFor(
        cdp,
        `document.documentElement.lang.startsWith('en') && !/(?:repo|feedback)\\.[a-z0-9_.]+/i.test(document.body.innerText)`,
      );
      await delay(250);

      const measurement = await evaluate(cdp, measurementExpression(routeDefinition));
      measurement.console_errors = [...consoleErrors];
      measurement.network_errors = [...networkErrors];
      measurement.known_network_errors = [...knownNetworkErrors];
      measurements[viewportName][routeDefinition.name] = measurement;

      const key = `${viewportName}_${routeDefinition.name.replaceAll('-', '_')}`;
      const filename = `repository-refs-${viewportName}-${routeDefinition.name}.png`;
      await captureScreenshot(cdp, filename);
      screenshots[key] = await screenshotEvidence(filename);
    }
  }

  const manifest = {
    schema_version: 1,
    task_id: '011-repository-branches-pull-requests',
    captured_at: new Date().toISOString(),
    runtime: {
      frontend: 'Vite development server at 127.0.0.1:8010',
      api: 'task-011 deterministic Mock API at 127.0.0.1:8123',
      repository_id: 101,
    },
    routes: routeDefinitions,
    screenshots,
    measurements,
    browser_stderr: {
      contains_page_console_output: false,
      line_count: stderr.trim() ? stderr.trim().split(/\n/).length : 0,
    },
    scope_note:
      'Task 4.2 records current branch/PR list and detail layout evidence. Task 4.5 remains responsible for the full repository parity, theme, locale, permission, and health matrix.',
  };

  await writeFile(path.join(evidenceDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, screenshots: Object.keys(screenshots).length, measurements }));
} finally {
  cdp?.close();
  await stopChrome();
  await rm(profileDir, { recursive: true, force: true });
}
