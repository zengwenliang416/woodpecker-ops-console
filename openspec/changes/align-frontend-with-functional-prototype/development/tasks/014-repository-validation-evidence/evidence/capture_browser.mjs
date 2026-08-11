#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
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
const productionUrl = process.env.TASK014_PRODUCTION_URL ?? 'http://127.0.0.1:8140';
const prototypeUrl = process.env.TASK014_PROTOTYPE_URL ?? 'http://127.0.0.1:8141';
const mockApiUrl = process.env.TASK014_MOCK_API ?? 'http://127.0.0.1:8142';
const execFile = promisify(execFileCallback);
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const runId = randomUUID();

const destinations = [
  {
    id: 'repos',
    row: 3,
    productionPath: '/repos',
    prototypePath: '/#/repos',
    route: 'repos',
    parityStatus: 'verified',
    productionPatterns: [/acme\/backend-api/i, /仓库|Repositories/i],
    prototypePatterns: [/acme\/backend-api/i, /仓库/],
  },
  {
    id: 'repo-add',
    row: 4,
    productionPath: '/repos/add',
    prototypePath: '/#/repos/add',
    route: 'repo-add',
    parityStatus: 'blocked',
    productionPatterns: [/acme\/frontend-console/i, /添加仓库|Add repository/i],
    prototypePatterns: [/选择代码平台/, /连接 Forge/, /添加仓库/],
  },
  {
    id: 'activity',
    row: 5,
    productionPath: '/repos/101',
    prototypePath: '/#/repos/101',
    route: 'repo',
    parityStatus: 'verified',
    productionPatterns: [/backend-api/i, /842/, /流水线|Pipeline/i],
    prototypePatterns: [/acme\/backend-api/i, /842/, /流水线/],
  },
  {
    id: 'branches',
    row: 6,
    productionPath: '/repos/101/branches',
    prototypePath: '/#/repos/101/branches',
    route: 'repo-branches',
    parityStatus: 'verified',
    productionPatterns: [/main/, /release\/2026\.08/],
    prototypePatterns: [/main/, /分支/],
  },
  {
    id: 'branch-detail',
    row: 7,
    productionPath: '/repos/101/branches/main',
    prototypePath: '/#/repos/101/branches/main',
    route: 'repo-branch',
    parityStatus: 'verified',
    productionPatterns: [/main/, /流水线历史|Pipeline history/i],
    prototypePatterns: [/main/, /分支/],
  },
  {
    id: 'pull-requests',
    row: 8,
    productionPath: '/repos/101/pull-requests',
    prototypePath: '/#/repos/101/pull-requests',
    route: 'repo-pull-requests',
    parityStatus: 'verified',
    productionPatterns: [/Harden repository validation evidence/, /92/],
    prototypePatterns: [/Pull Requests/, /92/],
  },
  {
    id: 'pull-request-detail',
    row: 9,
    productionPath: '/repos/101/pull-requests/92',
    prototypePath: '/#/repos/101/pull-requests/92',
    route: 'repo-pull-request',
    parityStatus: 'verified',
    productionPatterns: [/合并请求 #92|Pull Request #92/i, /841|92/],
    prototypePatterns: [/92/, /Pull Request/],
  },
  {
    id: 'manual',
    row: 10,
    productionPath: '/repos/101/manual',
    prototypePath: '/#/repos/101/manual',
    route: 'repo-manual',
    parityStatus: 'verified',
    productionPatterns: [/main/, /运行流水线|Run pipeline/i],
    prototypePatterns: [/运行流水线/, /执行预览/],
  },
  {
    id: 'pipeline-overview',
    row: 11,
    productionPath: '/repos/101/pipeline/842',
    prototypePath: '/#/repos/101/pipeline/842',
    route: 'repo-pipeline',
    parityStatus: 'verified',
    productionPatterns: [/842/, /Pipeline execution overview|流水线执行概览/],
    prototypePatterns: [/842/, /流水线执行概览/],
  },
  {
    id: 'pipeline-log',
    row: 12,
    productionPath: '/repos/101/pipeline/842/2030',
    prototypePath: '/#/repos/101/pipeline/842?tab=logs',
    route: 'repo-pipeline',
    parityStatus: 'verified',
    productionPatterns: [/pnpm typecheck/, /Command exited with status 1/],
    prototypePatterns: [/Build application/, /Found 1 error/],
  },
  {
    id: 'pipeline-changed-files',
    row: 13,
    productionPath: '/repos/101/pipeline/842/changed-files',
    prototypePath: '/#/repos/101/pipeline/842/changed-files',
    route: 'repo-pipeline-changed-files',
    parityStatus: 'verified',
    productionPatterns: [/src\/routes\/user\.ts/, /Changed file paths|变更文件路径/],
    prototypePatterns: [/src\/routes\/user\.ts/, /6 个文件/],
  },
  {
    id: 'pipeline-config',
    row: 14,
    productionPath: '/repos/101/pipeline/842/config',
    prototypePath: '/#/repos/101/pipeline/842/config',
    route: 'repo-pipeline-config',
    parityStatus: 'verified',
    productionPatterns: [/\.woodpecker\.yml/, /pnpm typecheck/],
    prototypePatterns: [/\.woodpecker\.yml/, /配置分析/],
  },
  {
    id: 'pipeline-errors',
    row: 15,
    productionPath: '/repos/101/pipeline/842/errors',
    prototypePath: '/#/repos/101/pipeline/842/errors',
    route: 'repo-pipeline-errors',
    parityStatus: 'verified',
    productionPatterns: [/Cleanup failed/, /debug variable/],
    prototypePatterns: [/TS2345/, /TypeScript/],
  },
  {
    id: 'pipeline-debug',
    row: 16,
    productionPath: '/repos/101/pipeline/842/debug',
    prototypePath: '/#/repos/101/pipeline/842/debug',
    route: 'repo-pipeline-debug',
    parityStatus: 'verified',
    productionPatterns: [/Download metadata|下载元数据/, /842/],
    prototypePatterns: [/交互式 Debug 会话/, /node:22-alpine/],
  },
  {
    id: 'settings-general',
    row: 17,
    productionPath: '/repos/101/settings',
    prototypePath: '/#/repos/101/settings',
    route: 'repo-settings',
    parityStatus: 'verified',
    productionPatterns: [/Pipeline behavior|流水线行为/i, /项目设置|Project settings/i],
    prototypePatterns: [/流水线行为/, /仓库信息/],
  },
  {
    id: 'settings-secrets',
    row: 18,
    productionPath: '/repos/101/settings/secrets',
    prototypePath: '/#/repos/101/settings/secrets',
    route: 'repo-settings-secrets',
    parityStatus: 'verified',
    productionPatterns: [/DEPLOY_TOKEN/, /ORG_SIGNING_KEY/],
    prototypePatterns: [/Secret/, /仓库/],
  },
  {
    id: 'settings-registries',
    row: 19,
    productionPath: '/repos/101/settings/registries',
    prototypePath: '/#/repos/101/settings/registries',
    route: 'repo-settings-registries',
    parityStatus: 'verified',
    productionPatterns: [/registry\.example\/acme/, /ghcr\.io\/acme/],
    prototypePatterns: [/Registry|镜像仓库/i, /仓库/],
  },
  {
    id: 'settings-crons',
    row: 20,
    productionPath: '/repos/101/settings/crons',
    prototypePath: '/#/repos/101/settings/crons',
    route: 'repo-settings-crons',
    parityStatus: 'verified',
    productionPatterns: [/nightly-main/, /release-audit/],
    prototypePatterns: [/Cron|定时/i, /仓库/],
  },
  {
    id: 'settings-badge',
    row: 21,
    productionPath: '/repos/101/settings/badge',
    prototypePath: '/#/repos/101/settings/badge',
    route: 'repo-settings-badge',
    parityStatus: 'verified',
    productionPatterns: [/Badge/i, /main/],
    prototypePatterns: [/Badge/i, /仓库/],
  },
  {
    id: 'settings-actions',
    row: 22,
    productionPath: '/repos/101/settings/actions',
    prototypePath: '/#/repos/101/settings/actions',
    route: 'repo-settings-actions',
    parityStatus: 'verified',
    productionPatterns: [/Danger zone|危险区域/i, /Repair|修复/i],
    prototypePatterns: [/危险/, /仓库/],
  },
  {
    id: 'settings-extensions',
    row: 23,
    productionPath: '/repos/101/settings/extensions',
    prototypePath: '/#/repos/101/settings/extensions',
    route: 'repo-settings-extensions',
    parityStatus: 'verified',
    productionPatterns: [/Task014EvidenceKey/, /Extension|扩展/i],
    prototypePatterns: [/扩展|Extension/i, /仓库/],
  },
];

const viewports = [
  { id: 'desktop', width: 1600, height: 1000 },
  { id: 'mobile', width: 390, height: 844 },
];

const primaryStates = [
  ...viewports.flatMap((viewport) =>
    destinations.map((destination) => ({
      id: `production-dark-zh-${viewport.id}-${destination.id}`,
      surface: 'production',
      destination,
      viewport,
      theme: 'dark',
      locale: 'zh-Hans',
      permission: 'admin',
    })),
  ),
  ...viewports.flatMap((viewport) =>
    destinations.map((destination) => ({
      id: `prototype-dark-zh-${viewport.id}-${destination.id}`,
      surface: 'prototype',
      destination,
      viewport,
      theme: 'dark',
      locale: 'zh-CN',
      permission: 'prototype-administrator',
    })),
  ),
];

const lightDestinations = new Set(['repos', 'activity', 'branches', 'pull-requests', 'manual', 'settings-secrets']);
const secondaryStates = [
  ...viewports.flatMap((viewport) =>
    destinations
      .filter((destination) => lightDestinations.has(destination.id))
      .map((destination) => ({
        id: `production-light-en-${viewport.id}-${destination.id}`,
        surface: 'production',
        destination,
        viewport,
        theme: 'light',
        locale: 'en',
        permission: destination.id === 'settings-secrets' ? 'admin' : 'push',
      })),
  ),
  ...['activity', 'manual', 'settings-general', 'pipeline-debug'].map((destinationId) => ({
    id: `production-dark-zh-readonly-desktop-${destinationId}`,
    surface: 'production',
    destination: destinations.find((destination) => destination.id === destinationId),
    viewport: viewports[0],
    theme: 'dark',
    locale: 'zh-Hans',
    permission: 'readonly',
  })),
];
const states = [...primaryStates, ...secondaryStates];

assert.equal(destinations.length, 21);
assert.equal(primaryStates.length, 84);
assert.equal(secondaryStates.length, 16);
assert.equal(states.length, 100);

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
    await waitForUrl(url, 800);
    occupied = true;
  } catch {
    // The task must own every service process used for final evidence.
  }
  assert.equal(occupied, false, `${name} URL is already occupied: ${url}`);

  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (process.env.TASK014_SERVICE_LOG === '1') {
    child.stdout.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
    child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  }
  await waitForUrl(url);
  await sleep(100);
  assert.equal(child.exitCode, null, `${name} exited before evidence capture`);
  return child;
}

async function responseText(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
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

async function assertServiceIdentity() {
  const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'manifest.json'), 'utf8'));
  const { stdout: gitHeadOutput } = await execFile('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
  const gitHead = gitHeadOutput.trim();
  const prototypeRelativePath = 'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact';
  await execFile('git', ['merge-base', '--is-ancestor', manifest.commit, gitHead], { cwd: projectRoot });
  await execFile('git', ['diff', '--quiet', manifest.commit, '--', 'web', prototypeRelativePath], {
    cwd: projectRoot,
  });
  const { stdout: protectedStatus } = await execFile(
    'git',
    ['status', '--porcelain', '--', 'web', prototypeRelativePath],
    { cwd: projectRoot },
  );
  assert.equal(protectedStatus.trim(), '', 'production or approved-prototype worktree drift');

  const [identityResponse, directRepoResponse, proxiedRepoResponse, productionHtml, routerSource, prototypeHtml] =
    await Promise.all([
      fetch(mockApiUrl),
      fetch(`${mockApiUrl}/api/repos/101`),
      fetch(`${productionUrl}/api/repos/101`),
      responseText(productionUrl),
      responseText(`${productionUrl}/src/router.ts`),
      responseText(prototypeUrl),
    ]);
  assert.equal(identityResponse.ok, true);
  const identity = await identityResponse.json();
  assert.equal(identity.fixture, '014-repository-validation-evidence');
  assert.equal(identity.run_id, runId);
  assert.equal(directRepoResponse.ok, true);
  assert.equal(proxiedRepoResponse.ok, true);
  const directRepo = await directRepoResponse.json();
  const proxiedRepo = await proxiedRepoResponse.json();
  assert.deepEqual(proxiedRepo, directRepo);
  assert.equal(directRepo.full_name, 'acme/backend-api');
  assert.match(productionHtml, /src="\/src\/main\.ts/);
  assert.match(routerSource, /name:\s*['"]repo-settings-extensions['"]/);
  assert.match(prototypeHtml, /data-specnav-variant="approved-user-design"/);
  const localPrototypeHtml = await readFile(path.join(prototypeRoot, 'index.html'), 'utf8');
  assert.equal(prototypeHtml, localPrototypeHtml, 'served prototype does not match the approved artifact');

  const [{ stdout: productionTreeOutput }, { stdout: prototypeTreeOutput }] = await Promise.all([
    execFile('git', ['rev-parse', `${gitHead}:web`], { cwd: projectRoot }),
    execFile('git', ['rev-parse', `${gitHead}:${prototypeRelativePath}`], { cwd: projectRoot }),
  ]);

  const dependencyFiles = Object.values(manifest.dependencies).map((relativePath) =>
    path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype', relativePath),
  );
  const dependencyChecksums = {};
  for (const dependencyPath of dependencyFiles) {
    dependencyChecksums[path.relative(projectRoot, dependencyPath)] = sha256(await readFile(dependencyPath));
  }

  return {
    sourceBaseCommit: manifest.commit,
    gitHead,
    productionRuntimeUnchangedFromBase: true,
    serviceOwnership: 'task-started-exclusive-ports',
    runId,
    mockFixture: identity.fixture,
    proxiedRepository: directRepo.full_name,
    productionEntrypoint: '/src/main.ts',
    productionRouterMarker: 'repo-settings-extensions',
    productionTree: productionTreeOutput.trim(),
    prototypeMarker: 'approved-user-design',
    prototypeTree: prototypeTreeOutput.trim(),
    prototypeIndexSha256: sha256(localPrototypeHtml),
    dependencyChecksums,
  };
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
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function expectedPatternsForState(state) {
  if (state.surface === 'production' && state.permission === 'readonly') {
    if (state.destination.id === 'manual' || state.destination.id === 'settings-general') {
      return [/没有权限|not have permission|permission/i];
    }
    if (state.destination.id === 'pipeline-debug') {
      return [/无权访问调试信息|not allowed|permissions do not allow/i, /842/];
    }
  }
  return state.surface === 'production' ? state.destination.productionPatterns : state.destination.prototypePatterns;
}

function classifyWarnings(consoleMessages) {
  const categories = {
    vue_i18n: 0,
    vue_extraneous_props: 0,
    vue_router_deprecation: 0,
    other: 0,
  };
  for (const entry of consoleMessages.filter((candidate) => candidate.level === 'warning')) {
    if (entry.message.startsWith('[intlify]')) categories.vue_i18n += 1;
    else if (entry.message.startsWith('[Vue warn]: Extraneous non-props attributes')) {
      categories.vue_extraneous_props += 1;
    } else if (entry.message.startsWith('[VUE_ROUTER_')) categories.vue_router_deprecation += 1;
    else categories.other += 1;
  }
  return categories;
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
      await sleep(650);
      return;
    }
    await sleep(150);
  }
  throw new Error('Timed out waiting for rendered document content');
}

async function captureState(state, remotePort) {
  if (state.surface === 'production') {
    await waitForUrl(`${mockApiUrl}/api/evidence/permissions?role=${state.permission}`);
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
    if (!/^https?:/.test(event.request.url)) return;
    inflightRequests.add(event.requestId);
    requestUrls.set(event.requestId, event.request.url);
  });
  client.on('Network.loadingFinished', (event) => {
    inflightRequests.delete(event.requestId);
    requestUrls.delete(event.requestId);
  });
  client.on('Network.loadingFailed', (event) => {
    inflightRequests.delete(event.requestId);
    if (!event.canceled) {
      networkFailures.push({
        url: requestUrls.get(event.requestId) ?? null,
        errorText: event.errorText,
        blockedReason: event.blockedReason ?? null,
        timestamp: new Date().toISOString(),
      });
    }
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
      reason: isCustomScript ? 'optional local custom script' : 'prototype favicon is not part of the artifact',
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

  const networkDeadline = Date.now() + 4_000;
  while (inflightRequests.size > 0 && Date.now() < networkDeadline) await sleep(75);
  for (const requestId of inflightRequests) {
    const url = requestUrls.get(requestId);
    if (url?.includes('/api/stream/events')) continue;
    networkFailures.push({
      url: url ?? null,
      errorText: 'Request remained pending after the network-settle deadline',
      blockedReason: null,
      timestamp: new Date().toISOString(),
    });
  }

  const measurementResult = await client.send('Runtime.evaluate', {
    expression: `(async () => {
      const runtimeRouter = ${state.surface === 'production' ? "(await import('/src/router.ts')).default" : 'null'};
      const controls = [...document.querySelectorAll('a,button,input,select')].slice(0, 160).map((node) => ({
        tag: node.tagName.toLowerCase(),
        text: (node.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 180),
        href: node.getAttribute('href'),
        title: node.getAttribute('title'),
        ariaLabel: node.getAttribute('aria-label'),
        disabled: Boolean(node.disabled),
      }));
      const denseContainers = [...document.querySelectorAll(
        '[data-testid="log-console"], .wp-table-scroll, .repo-settings-table-scroll, .overflow-x-auto, .table-scroll, table, pre'
      )].slice(0, 40).map((node, index) => {
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
          locallyScrollable: node.scrollWidth > node.clientWidth && ['auto', 'scroll'].includes(style.overflowX),
        };
      });
      const text = document.body?.innerText || '';
      const rawI18nKeys = [...new Set(
        text.match(/(?<![\\\\/\\w.-])(?:feedback|ops|pipeline|repo|repositories|secrets|registries|user)\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)*(?![\\w.-])/gi) || []
      )];
      const bodyStyle = getComputedStyle(document.body);
      return {
        body: {
          clientWidth: document.body.clientWidth,
          scrollWidth: document.body.scrollWidth,
          scrollHeight: document.body.scrollHeight,
        },
        bodyText: text.trim().replace(/\\s+/g, ' '),
        bodyTextSample: text.trim().replace(/\\s+/g, ' ').slice(0, 2400),
        colors: { background: bodyStyle.backgroundColor, text: bodyStyle.color },
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
        semanticMarkers: {
          wizardStepCount: document.querySelectorAll('.wizard-step').length,
          repoSettingsNavCount: document.querySelectorAll('.repo-settings-nav-item, .settings-nav a').length,
          visibleTableCount: [...document.querySelectorAll('table')].filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }).length,
        },
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
  const expectedPatterns = expectedPatternsForState(state);
  const bodyText = measurementResult.result.value.bodyText;
  const errorCount =
    consoleMessages.filter((entry) => entry.level === 'error').length +
    runtimeExceptions.length +
    networkFailures.length +
    httpErrors.length;
  const measurement = {
    ...measurementResult.result.value,
    runId,
    stateId: state.id,
    row: state.destination.row,
    destination: state.destination.id,
    surface: state.surface,
    parityStatus: state.destination.parityStatus,
    contentAssertions: expectedPatterns.map((pattern) => ({
      pattern: pattern.toString(),
      passed: pattern.test(bodyText),
    })),
    permission: state.permission,
    viewport: { devicePixelRatio: 1, width: state.viewport.width, height: state.viewport.height },
    screenshotDimensions: dimensions,
    capturedAt: endedAt,
    health: {
      startedAt,
      endedAt,
      errorCount,
      warningCount: consoleMessages.filter((entry) => entry.level === 'warning').length,
      warningCategories: classifyWarnings(consoleMessages),
      console: consoleMessages,
      runtimeExceptions,
      networkFailures,
      httpErrors,
      interceptedOptionalAssets,
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
  for (const file of files.toSorted()) {
    records.push(`${sha256(await readFile(path.join(evidenceRoot, file)))}  ./${file}\n`);
  }
  return sha256(records.join(''));
}

async function updateManifest(measurements, serviceIdentity, warningCategories) {
  const manifestPath = path.join(evidenceRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const rootFiles = (await readdir(evidenceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name !== 'manifest.json');
  const pngFiles = rootFiles.filter((name) => name.endsWith('.png'));
  const measurementFiles = rootFiles.filter((name) => /^(?:production|prototype)-.+\.json$/.test(name));
  manifest.run_id = runId;
  manifest.captured_from = measurements.map((measurement) => measurement.health.startedAt).toSorted()[0];
  manifest.captured_through = measurements
    .map((measurement) => measurement.health.endedAt)
    .toSorted()
    .at(-1);
  manifest.service_identity = serviceIdentity;
  manifest.actual = {
    states: measurements.length,
    production_states: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototype_states: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    error_states: measurements
      .filter((measurement) => measurement.health.errorCount > 0)
      .map((measurement) => measurement.stateId),
    warning_count: measurements.reduce((total, measurement) => total + measurement.health.warningCount, 0),
    warning_categories: warningCategories,
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

const startedServices = [];
let chrome;
let chromeProfile;

try {
  const mock = await startOwnedService({
    name: 'mock-api',
    url: mockApiUrl,
    command: 'python3',
    args: [path.join(evidenceRoot, 'mock_api.py')],
    cwd: projectRoot,
    env: { TASK014_RUN_ID: runId },
  });
  startedServices.push(mock);

  const production = await startOwnedService({
    name: 'production',
    url: productionUrl,
    command: 'pnpm',
    args: ['start', '--host', '127.0.0.1', '--port', '8140'],
    cwd: productionRoot,
    env: { VITE_DEV_PROXY: mockApiUrl },
  });
  startedServices.push(production);

  const prototype = await startOwnedService({
    name: 'prototype',
    url: prototypeUrl,
    command: 'python3',
    args: ['-m', 'http.server', '8141', '--bind', '127.0.0.1'],
    cwd: prototypeRoot,
  });
  startedServices.push(prototype);

  const serviceIdentity = await assertServiceIdentity();
  const remotePort = await getFreePort();
  chromeProfile = await mkdtemp(path.join(tmpdir(), 'task014-chrome-'));
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
    if (process.env.TASK014_CHROME_LOG === '1') process.stderr.write(chunk);
  });
  await waitForUrl(`http://127.0.0.1:${remotePort}/json/version`);

  const measurements = [];
  for (const [index, state] of states.entries()) {
    process.stderr.write(`[capture ${index + 1}/${states.length}] ${state.id}\n`);
    measurements.push(await captureState(state, remotePort));
  }

  await waitForUrl(`${mockApiUrl}/api/evidence/permissions?role=admin`);
  const errorStates = measurements
    .filter((measurement) => measurement.health.errorCount > 0)
    .map((measurement) => measurement.stateId);
  const warningCategories = measurements.reduce(
    (aggregate, measurement) => {
      for (const [category, count] of Object.entries(measurement.health.warningCategories)) {
        aggregate[category] += count;
      }
      return aggregate;
    },
    { vue_i18n: 0, vue_extraneous_props: 0, vue_router_deprecation: 0, other: 0 },
  );
  const summary = {
    ok: errorStates.length === 0,
    runId,
    states: measurements.length,
    primaryStates: primaryStates.length,
    secondaryStates: secondaryStates.length,
    productionStates: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototypeStates: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    verifiedRows: destinations
      .filter((destination) => destination.parityStatus === 'verified')
      .map((destination) => destination.row),
    blockedRows: destinations
      .filter((destination) => destination.parityStatus === 'blocked')
      .map((destination) => destination.row),
    errorStates,
    warningCategories,
    serviceIdentity,
    generatedAt: new Date().toISOString(),
  };
  await writeJsonAtomic(path.join(evidenceRoot, 'browser-replay-summary.json'), summary);
  await updateManifest(measurements, serviceIdentity, warningCategories);
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await stopChild(chrome);
  for (const child of startedServices.toReversed()) await stopChild(child);
  if (chromeProfile) await rm(chromeProfile, { recursive: true, force: true });
}
