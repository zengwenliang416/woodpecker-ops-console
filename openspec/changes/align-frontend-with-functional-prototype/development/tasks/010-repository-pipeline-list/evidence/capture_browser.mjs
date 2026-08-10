import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const route = 'http://127.0.0.1:8010/repos/101';
const port = 19_000 + Math.floor(Math.random() * 1_000);
const profileDir = `/tmp/woodpecker-task-010-chrome-${process.pid}`;
const screenshots = {
  desktopPopulated: 'repository-pipelines-desktop-populated.png',
  desktopFiltered: 'repository-pipelines-desktop-filtered-empty.png',
  mobilePopulated: 'repository-pipelines-mobile-populated.png',
  mobileFiltered: 'repository-pipelines-mobile-filtered-empty.png',
};

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
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
  let sequence = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
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
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
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

const measurementExpression = `(() => {
  const documentElement = document.documentElement;
  const page = document.querySelector('.repo-pipelines-page');
  const tableContainer = document.querySelector('.pipeline-table-scroll');
  const table = document.querySelector('.pipeline-table');
  const metrics = document.querySelector('.pipeline-metrics');
  const feedback = document.querySelector('[data-feedback-state="empty"]');
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
    table_container: size(tableContainer),
    table: size(table),
    metric_columns: metrics ? getComputedStyle(metrics).gridTemplateColumns : null,
    pipeline_rows: document.querySelectorAll('[data-testid="pipeline-row"]').length,
    feedback_text: feedback?.innerText ?? null,
    raw_locale_keys: document.body.innerText.match(/(?:repo|feedback)\\.[a-z0-9_.]+/gi) ?? [],
  };
})()`;

async function captureScreenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(path.join(evidenceDir, filename), Buffer.from(result.data, 'base64'));
}

async function captureViewport(cdp, name, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send('Page.navigate', {
    url: `${route}?task010=${name}-${Date.now()}`,
  });
  await waitFor(cdp, `document.readyState === 'complete' && Boolean(document.querySelector('.repo-pipelines-page'))`);
  await waitFor(cdp, `document.querySelectorAll('[data-testid="pipeline-row"]').length > 0`);
  await delay(250);

  const populated = await evaluate(cdp, measurementExpression);
  await captureScreenshot(cdp, screenshots[`${name}Populated`]);

  await evaluate(
    cdp,
    `(() => {
      const input = document.querySelector('[data-testid="pipeline-search"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'does-not-exist');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`,
  );
  await waitFor(cdp, `Boolean(document.querySelector('[data-feedback-state="empty"]'))`);
  await delay(100);

  const filteredEmpty = await evaluate(cdp, measurementExpression);
  await captureScreenshot(cdp, screenshots[`${name}Filtered`]);

  return {
    populated,
    filtered_empty: filteredEmpty,
  };
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

let cdp;
try {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find((target) => target.type === 'page');
  if (!pageTarget?.webSocketDebuggerUrl) throw new Error('Chrome page target is unavailable');

  cdp = await connectCdp(pageTarget.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const desktop = await captureViewport(cdp, 'desktop', 1280, 720);
  const mobile = await captureViewport(cdp, 'mobile', 390, 844);

  const manifest = {
    schema_version: 2,
    task_id: '010-repository-pipeline-list',
    captured_at: new Date().toISOString(),
    route,
    runtime: {
      frontend: 'Vite development server at 127.0.0.1:8010',
      api: 'task-009 deterministic Mock API at 127.0.0.1:8123',
      repository_id: 101,
      pipeline_number: 842,
    },
    screenshots: {
      desktop_populated: await screenshotEvidence(screenshots.desktopPopulated),
      desktop_filtered_empty: await screenshotEvidence(screenshots.desktopFiltered),
      mobile_populated: await screenshotEvidence(screenshots.mobilePopulated),
      mobile_filtered_empty: await screenshotEvidence(screenshots.mobileFiltered),
    },
    measurements: {
      desktop,
      mobile,
    },
    browser_stderr: {
      contains_page_console_output: false,
      note: 'Chrome process stderr is not used as page-console evidence.',
      line_count: stderr.trim() ? stderr.trim().split(/\n/).length : 0,
    },
    scope_note:
      'Task 4.1 records populated and filtered-empty layout evidence. Task 4.5 remains responsible for full repository parity, permission, theme, locale, and browser-health closure.',
  };

  await writeFile(path.join(evidenceDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    JSON.stringify({
      ok: true,
      desktop,
      mobile,
      screenshots: manifest.screenshots,
    }),
  );
} finally {
  cdp?.close();
  chrome.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => chrome.once('exit', resolve)),
    delay(3_000).then(() => chrome.kill('SIGKILL')),
  ]);
  await rm(profileDir, { recursive: true, force: true });
}
