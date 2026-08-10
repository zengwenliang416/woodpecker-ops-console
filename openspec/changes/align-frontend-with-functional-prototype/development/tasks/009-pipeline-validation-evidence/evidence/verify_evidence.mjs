#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(evidenceRoot, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const entries = await readdir(evidenceRoot, { withFileTypes: true });
const rootFiles = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();

const destinations = new Map([
  ['overview', 'repo-pipeline'],
  ['log', 'repo-pipeline'],
  ['changed-files', 'repo-pipeline-changed-files'],
  ['config', 'repo-pipeline-config'],
  ['errors', 'repo-pipeline-errors'],
  ['debug', 'repo-pipeline-debug'],
]);
const destinationPaths = new Map([
  [
    'overview',
    {
      production: '/repos/101/pipeline/842',
      prototype: '/#/repos/101/pipeline/842',
    },
  ],
  [
    'log',
    {
      production: '/repos/101/pipeline/842/2030',
      prototype: '/#/repos/101/pipeline/842?tab=logs',
    },
  ],
  [
    'changed-files',
    {
      production: '/repos/101/pipeline/842/changed-files',
      prototype: '/#/repos/101/pipeline/842/changed-files',
    },
  ],
  [
    'config',
    {
      production: '/repos/101/pipeline/842/config',
      prototype: '/#/repos/101/pipeline/842/config',
    },
  ],
  [
    'errors',
    {
      production: '/repos/101/pipeline/842/errors',
      prototype: '/#/repos/101/pipeline/842/errors',
    },
  ],
  [
    'debug',
    {
      production: '/repos/101/pipeline/842/debug',
      prototype: '/#/repos/101/pipeline/842/debug',
    },
  ],
]);

const expectedStates = [
  ...['desktop', 'mobile'].flatMap((viewport) =>
    [...destinations.keys()].flatMap((destination) => [
      `production-dark-zh-${viewport}-${destination}`,
      `prototype-dark-zh-${viewport}-${destination}`,
    ]),
  ),
  ...['desktop', 'mobile'].flatMap((viewport) =>
    ['overview', 'log'].map((destination) => `production-light-en-${viewport}-${destination}`),
  ),
  'production-light-en-readonly-desktop-overview',
  'production-light-en-readonly-desktop-debug',
].sort();

const measurementFiles = rootFiles.filter((name) => /^(?:production|prototype)-.+\.json$/.test(name)).sort();
const screenshotFiles = rootFiles.filter((name) => /^(?:production|prototype)-.+\.png$/.test(name)).sort();
assert.deepEqual(
  measurementFiles,
  expectedStates.map((stateId) => `${stateId}.json`),
  'measurement state matrix must contain exactly 30 expected JSON files',
);
assert.deepEqual(
  screenshotFiles,
  expectedStates.map((stateId) => `${stateId}.png`),
  'screenshot state matrix must contain exactly 30 expected PNG files',
);

function expectedState(stateId) {
  const surface = stateId.startsWith('prototype-') ? 'prototype' : 'production';
  const viewport = stateId.includes('-mobile-') ? { width: 390, height: 844 } : { width: 1600, height: 1000 };
  const theme = stateId.includes('-dark-zh-') ? 'dark' : 'light';
  const locale = theme === 'light' ? 'en' : surface === 'prototype' ? 'zh-CN' : 'zh-Hans';
  const permission = stateId.includes('-readonly-')
    ? 'read-only'
    : surface === 'prototype'
      ? 'prototype-administrator'
      : 'push';
  const destination = [...destinations.keys()].find((candidate) => stateId.endsWith(`-${candidate}`));
  assert.ok(destination, `unknown destination in ${stateId}`);
  return { destination, locale, permission, surface, theme, viewport };
}

function hasControl(measurement, predicate) {
  return measurement.controls.some((control) =>
    predicate([control.text, control.href, control.title, control.ariaLabel].filter(Boolean).join(' ')),
  );
}

function assertPng(buffer, expected, stateId) {
  assert.equal(
    buffer.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    `${stateId} screenshot must contain PNG data`,
  );
  assert.equal(buffer.readUInt32BE(16), expected.width, `${stateId} PNG width`);
  assert.equal(buffer.readUInt32BE(20), expected.height, `${stateId} PNG height`);
}

function expectedContentPatterns(expected) {
  if (expected.surface === 'prototype') {
    return {
      overview: [/流水线执行概览/, /5 个步骤/, /128 tests passed/],
      log: [/Step 4: Build application/, /Found 1 error/, /src\/routes\/user\.ts:42/],
      'changed-files': [
        /6 个文件/,
        /src\/routes\/user\.ts/,
        /src\/services\/user-service\.ts/,
        /src\/utils\/email\.ts/,
        /tests\/user\.test\.ts/,
        /docs\/api\/users\.md/,
        /\.woodpecker\.yml/,
      ],
      config: [/\.woodpecker\.yml/, /配置分析/, /配置可执行/],
      errors: [/TypeScript 类型错误/, /TS2345/, /未使用的变量/, /TS6133/],
      debug: [/交互式 Debug 会话/, /Build application/, /node:22-alpine/],
    }[expected.destination];
  }
  if (expected.destination === 'debug' && expected.permission === 'read-only') {
    return [/not allowed|permissions do not allow/i];
  }
  return {
    overview: [/Pipeline execution overview|流水线执行概览/, /WORKFLOWS 2|工作流 2/, /STEPS 4|步骤 4/],
    log: [/Typecheck application/, /pnpm typecheck/, /Command exited with status 1/],
    'changed-files': [
      /Changed file paths|变更文件路径/,
      /src\/routes\/user\.ts/,
      /src\/services\/user-service\.ts/,
      /src\/utils\/email\.ts/,
      /tests\/routes\/user\.test\.ts/,
      /package\.json/,
      /pnpm-lock\.yaml/,
    ],
    config: [/\.woodpecker\.yml/, /when: event: \[push, pull_request\]/, /pnpm typecheck/],
    errors: [/Pipeline diagnostics|流水线诊断/, /Cleanup failed/, /debug variable/],
    debug: [/Download metadata|下载元数据/, /acme-backend-api-pipeline-842-metadata\.json/, /3\.9\.0-task009/],
  }[expected.destination];
}

const measurements = [];
for (const stateId of expectedStates) {
  const expected = expectedState(stateId);
  const measurement = JSON.parse(await readFile(path.join(evidenceRoot, `${stateId}.json`), 'utf8'));
  const screenshot = await readFile(path.join(evidenceRoot, `${stateId}.png`));
  measurements.push(measurement);

  assert.equal(measurement.stateId, stateId, `${stateId} state id`);
  assert.deepEqual(measurement.viewport, { devicePixelRatio: 1, ...expected.viewport }, `${stateId} viewport`);
  assert.deepEqual(measurement.screenshotDimensions, expected.viewport, `${stateId} screenshot dimensions`);
  assert.ok(
    measurement.document.clientWidth <= expected.viewport.width &&
      measurement.document.clientWidth >= expected.viewport.width - 20,
    `${stateId} document width must differ from the configured viewport only by browser scrollbar space`,
  );
  assert.equal(measurement.document.clientHeight, expected.viewport.height, `${stateId} document height`);
  assert.equal(measurement.document.dataTheme, expected.theme, `${stateId} theme`);
  assert.equal(measurement.document.lang, expected.locale, `${stateId} locale`);
  assert.equal(measurement.permission, expected.permission, `${stateId} permission`);
  assert.equal(
    measurement.url,
    `${
      expected.surface === 'production' ? manifest.mock_api.production_url : manifest.mock_api.prototype_url
    }${destinationPaths.get(expected.destination)[expected.surface]}`,
    `${stateId} URL`,
  );
  assert.equal(typeof measurement.bodyText, 'string', `${stateId} full body text`);
  for (const pattern of expectedContentPatterns(expected)) {
    assert.match(measurement.bodyText, pattern, `${stateId} destination content`);
  }
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${stateId} page overflow`);
  assert.deepEqual(measurement.rawI18nKeys, [], `${stateId} raw i18n keys`);
  assert.equal(measurement.health.errorCount, 0, `${stateId} aggregate browser errors`);
  assert.deepEqual(measurement.health.runtimeExceptions, [], `${stateId} runtime exceptions`);
  assert.deepEqual(measurement.health.networkFailures, [], `${stateId} network failures`);
  assert.deepEqual(measurement.health.httpErrors, [], `${stateId} HTTP errors`);
  assert.equal(
    measurement.terminalRouteName,
    expected.surface === 'production' ? destinations.get(expected.destination) : null,
    `${stateId} terminal route`,
  );
  assertPng(screenshot, expected.viewport, stateId);
}

const productionPushOverview = measurements.filter(
  (measurement) =>
    measurement.stateId.startsWith('production-') &&
    measurement.permission === 'push' &&
    measurement.stateId.endsWith('-overview'),
);
assert.ok(productionPushOverview.length > 0, 'push overview evidence must exist');
for (const measurement of productionPushOverview) {
  assert.ok(
    hasControl(measurement, (text) => /\bRetry\b|重试/.test(text)),
    `${measurement.stateId} Retry`,
  );
}

const productionPushDesktopOverview = productionPushOverview.filter((measurement) =>
  measurement.stateId.includes('-desktop-'),
);
for (const measurement of productionPushDesktopOverview) {
  assert.ok(
    hasControl(measurement, (text) => /(?:^|\s)Debug(?:\s|$)|调试/.test(text)),
    `${measurement.stateId} Debug tab`,
  );
}

const readOnlyOverview = measurements.find(
  (measurement) => measurement.stateId === 'production-light-en-readonly-desktop-overview',
);
assert.ok(readOnlyOverview, 'read-only overview evidence must exist');
assert.equal(
  hasControl(readOnlyOverview, (text) => /\bRetry\b|重试/.test(text)),
  false,
  'read-only Retry',
);
assert.equal(
  hasControl(readOnlyOverview, (text) => /(?:^|\s)Debug(?:\s|$)|调试/.test(text)),
  false,
  'read-only Debug tab',
);

const readOnlyDebug = measurements.find(
  (measurement) => measurement.stateId === 'production-light-en-readonly-desktop-debug',
);
assert.ok(readOnlyDebug, 'read-only direct Debug evidence must exist');
assert.match(readOnlyDebug.bodyText, /not allowed|permissions do not allow/i);
assert.doesNotMatch(readOnlyDebug.bodyText, /download metadata/i);

for (const stateId of ['production-dark-zh-mobile-overview', 'production-dark-zh-mobile-log']) {
  const measurement = measurements.find((candidate) => candidate.stateId === stateId);
  assert.ok(measurement, `${stateId} evidence must exist`);
  assert.ok(
    measurement.denseContainers.some(
      (container) =>
        ['auto', 'scroll'].includes(container.overflowX) &&
        (container.scrollWidth > container.clientWidth || container.testId === 'log-console'),
    ),
    `${stateId} dense content must own horizontal scrolling`,
  );
}

const summary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));
assert.equal(summary.ok, true, 'browser replay summary');
assert.equal(summary.states, 30, 'browser replay state count');
assert.equal(summary.productionStates, 18, 'production state count');
assert.equal(summary.prototypeStates, 12, 'prototype state count');
assert.deepEqual(summary.errorStates, [], 'browser replay error states');
assert.equal(summary.manifestUpdated, true, 'capture manifest transaction');
assert.equal(summary.serviceIdentity.sourceBaseCommit, manifest.commit, 'source base commit');
assert.equal(summary.serviceIdentity.productionRuntimeUnchangedFromBase, true, 'production runtime drift');
assert.equal(summary.serviceIdentity.viteProxyRepository, 'acme/backend-api', 'Vite proxy identity');
assert.equal(summary.serviceIdentity.productionEntrypoint, '/src/main.ts', 'production service identity');
assert.equal(summary.serviceIdentity.productionRouterMarker, 'repo-pipeline-debug', 'router source identity');
assert.equal(summary.serviceIdentity.prototypeMarker, 'approved-user-design', 'prototype service identity');

const consoleStatesById = new Map();
for (const [name, expectedCount] of [
  ['browser-console-production.json', 18],
  ['browser-console-prototype.json', 12],
]) {
  const consoleStates = JSON.parse(await readFile(path.join(evidenceRoot, name), 'utf8'));
  assert.equal(consoleStates.length, expectedCount, `${name} state count`);
  assert.ok(
    consoleStates.every((state) => state.errorCount === 0),
    `${name} browser health`,
  );
  for (const state of consoleStates) {
    assert.equal(consoleStatesById.has(state.stateId), false, `${state.stateId} duplicate console state`);
    consoleStatesById.set(state.stateId, state);
  }
}
assert.deepEqual([...consoleStatesById.keys()].sort(), expectedStates, 'console state matrix');
for (const measurement of measurements) {
  assert.deepEqual(
    consoleStatesById.get(measurement.stateId),
    { stateId: measurement.stateId, ...measurement.health },
    `${measurement.stateId} console artifact correspondence`,
  );
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

const filesExcludingManifest = rootFiles.filter((name) => name !== 'manifest.json');
const pngFiles = rootFiles.filter((name) => name.endsWith('.png'));
const jsonFilesExcludingManifest = rootFiles.filter((name) => name.endsWith('.json') && name !== 'manifest.json');
assert.equal(
  manifest.artifact_convention.total_files_excluding_manifest,
  filesExcludingManifest.length,
  'manifest file count',
);
assert.equal(
  manifest.checksums.all_files_excluding_manifest,
  await aggregateChecksum(filesExcludingManifest),
  'all evidence checksum',
);
assert.equal(manifest.checksums.all_png_files, await aggregateChecksum(pngFiles), 'PNG checksum');
assert.equal(
  manifest.checksums.all_json_files_excluding_manifest,
  await aggregateChecksum(jsonFilesExcludingManifest),
  'JSON checksum',
);

for (const [manifestKey, fileName] of [
  ['mock_api_py', 'mock_api.py'],
  ['capture_browser_mjs', 'capture_browser.mjs'],
  ['mock_api_smoke_mjs', 'mock_api_smoke.mjs'],
  ['verify_evidence_mjs', 'verify_evidence.mjs'],
  ['browser_replay_summary_json', 'browser-replay-summary.json'],
]) {
  assert.equal(
    manifest.checksums[manifestKey],
    sha256(await readFile(path.join(evidenceRoot, fileName))),
    `${fileName} checksum`,
  );
}

console.log(
  JSON.stringify({
    ok: true,
    pairedStates: expectedStates.length,
    productionStates: measurements.filter((measurement) => measurement.stateId.startsWith('production-')).length,
    prototypeStates: measurements.filter((measurement) => measurement.stateId.startsWith('prototype-')).length,
    totalWarnings: measurements.reduce((total, measurement) => total + measurement.health.warningCount, 0),
    checksumsVerified: true,
  }),
);
