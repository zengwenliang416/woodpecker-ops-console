#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultEvidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const evidenceRoot = process.env.TASK020_EVIDENCE_ROOT ?? defaultEvidenceRoot;
const projectRoot = path.resolve(defaultEvidenceRoot, '../../../../../../..');
const productionRoot = path.join(projectRoot, 'web');
const prototypeRoot = path.join(
  projectRoot,
  'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact',
);
const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'manifest.json'), 'utf8'));
const summary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));

const destinations = {
  overview: {
    row: 2,
    productionPath: '/overview',
    prototypePath: '/overview',
    productionRoute: 'overview',
    productionZh: [/概览/, /活跃流水线/],
    productionEn: [/Overview/, /Active pipelines/],
    prototypeZh: [/概览/, /活跃流水线/],
  },
  repos: {
    row: 3,
    productionPath: '/repos',
    prototypePath: '/repos',
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
const expectedStates = [
  ...Object.entries(viewports).flatMap(([viewportId]) =>
    Object.entries(destinations).flatMap(([destinationId, destination]) => [
      {
        id: `production-dark-zh-${viewportId}-${destinationId}`,
        surface: 'production',
        destinationId,
        destination,
        viewportId,
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
        theme: 'dark',
        locale: 'zh-CN',
        role: 'prototype-administrator',
        dataState: 'populated',
        class: 'equivalent',
      },
    ]),
  ),
  ...Object.entries(viewports).flatMap(([viewportId]) =>
    Object.entries(destinations).flatMap(([destinationId, destination]) => [
      {
        id: `production-light-en-${viewportId}-${destinationId}`,
        surface: 'production',
        destinationId,
        destination,
        viewportId,
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
    theme: 'dark',
    locale: 'zh-Hans',
    role: 'admin',
    dataState: 'partial',
    class: 'boundary',
  },
];
const expectedStateById = new Map(expectedStates.map((state) => [state.id, state]));
const expectedStateIds = [...expectedStateById.keys()].sort();
const supportFiles = [
  'browser-replay-summary.json',
  'capture_browser.mjs',
  'manifest.json',
  'mock_api.py',
  'mock_api_smoke.mjs',
  'redteam-verifier-summary.json',
  'redteam_verifier.mjs',
  'verify_evidence.mjs',
];

assert.equal(expectedStates.length, 20, 'state count');
assert.equal(expectedStateById.size, 20, 'unique state ids');
assert.equal(manifest.task_id, '020-overview-repositories-reverification', 'manifest task');
assert.deepEqual(manifest.matrix.route_rows, [2, 3], 'manifest rows');
assert.equal(manifest.matrix.expected_states, 20, 'manifest expected states');
assert.equal(summary.schema, 'woodpecker.overview-repositories-browser-replay.v1', 'summary schema');
assert.equal(summary.ok, true, 'capture summary');
assert.equal(summary.runId, manifest.run_id, 'summary run id');
assert.equal(summary.states, 20, 'summary states');
assert.equal(summary.productionStates, 12, 'production state count');
assert.equal(summary.prototypeStates, 8, 'prototype state count');
assert.equal(summary.equivalentStates, 8, 'equivalent state count');
assert.equal(summary.representativeStates, 8, 'representative state count');
assert.equal(summary.boundaryStates, 4, 'boundary state count');
assert.deepEqual(summary.rows, [2, 3], 'summary rows');
assert.deepEqual(summary.stateIds, expectedStateIds, 'summary state ids');
assert.deepEqual(summary.failedStates, [], 'capture failed states');
assert.deepEqual(manifest.source_identity, summary.sourceIdentity, 'source identity agreement');
assert.deepEqual(manifest.service_identity, summary.serviceIdentity, 'service identity agreement');
assert.equal(manifest.service_identity.fixture, '020-overview-repositories-reverification', 'fixture identity');
assert.equal(manifest.service_identity.runId, manifest.run_id, 'service run id');

const evidenceEntries = await readdir(evidenceRoot, { withFileTypes: true });
assert.deepEqual(
  evidenceEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  [],
  'evidence root must not contain directories',
);
const rootFiles = evidenceEntries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(
  rootFiles,
  [
    ...supportFiles,
    ...expectedStateIds.map((stateId) => `${stateId}.json`),
    ...expectedStateIds.map((stateId) => `${stateId}.png`),
  ].sort(),
  'exact evidence inventory',
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

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

async function currentSourceIdentity() {
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

assert.deepEqual(await currentSourceIdentity(), manifest.source_identity, 'current source identity');

function patternsForState(state) {
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

function forbiddenVisiblePatterns(state) {
  const patterns = [/Service Unavailable:\s*\{/i, /\{"error"\s*:/i];
  if (state.locale.startsWith('zh')) patterns.push(/An unknown error occurred/i);
  return patterns;
}

function assertPng(buffer, viewport, stateId) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${stateId} PNG signature`);
  assert.equal(buffer.readUInt32BE(16), viewport.width, `${stateId} PNG width`);
  assert.equal(buffer.readUInt32BE(20), viewport.height, `${stateId} PNG height`);
}

const measurements = [];
for (const stateId of expectedStateIds) {
  const expected = expectedStateById.get(stateId);
  const viewport = viewports[expected.viewportId];
  const measurement = JSON.parse(await readFile(path.join(evidenceRoot, `${stateId}.json`), 'utf8'));
  const screenshot = await readFile(path.join(evidenceRoot, `${stateId}.png`));
  measurements.push(measurement);

  assert.equal(measurement.runId, manifest.run_id, `${stateId} run id`);
  assert.equal(measurement.stateId, stateId, `${stateId} state id`);
  assert.equal(measurement.row, expected.destination.row, `${stateId} row`);
  assert.equal(measurement.destination, expected.destinationId, `${stateId} destination`);
  assert.equal(measurement.surface, expected.surface, `${stateId} surface`);
  assert.equal(measurement.stateClass, expected.class, `${stateId} class`);
  assert.equal(measurement.role, expected.role, `${stateId} role`);
  assert.equal(measurement.dataState, expected.dataState, `${stateId} data state`);
  assert.equal(measurement.viewportId, expected.viewportId, `${stateId} viewport id`);
  assert.deepEqual(measurement.viewport, { devicePixelRatio: 1, ...viewport }, `${stateId} viewport`);
  assert.deepEqual(measurement.screenshotDimensions, viewport, `${stateId} screenshot dimensions`);
  assert.equal(measurement.document.dataTheme, expected.theme, `${stateId} theme`);
  assert.equal(measurement.document.lang, expected.locale, `${stateId} locale`);
  assert.equal(measurement.document.clientHeight, viewport.height, `${stateId} document height`);
  assert.ok(
    measurement.document.clientWidth <= viewport.width && measurement.document.clientWidth >= viewport.width - 20,
    `${stateId} document width`,
  );
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${stateId} page overflow`);
  assert.deepEqual(measurement.rawI18nKeys, [], `${stateId} raw i18n keys`);
  assertPng(screenshot, viewport, stateId);

  const patterns = patternsForState(expected);
  assert.deepEqual(
    measurement.contentAssertions.map((assertion) => assertion.pattern),
    patterns.map((pattern) => pattern.toString()),
    `${stateId} content assertion inventory`,
  );
  assert.ok(
    patterns.every((pattern) => pattern.test(measurement.bodyText)),
    `${stateId} current content assertions`,
  );
  assert.ok(
    measurement.contentAssertions.every((assertion) => assertion.passed === true),
    `${stateId} recorded content assertions`,
  );
  for (const pattern of forbiddenVisiblePatterns(expected)) {
    assert.doesNotMatch(measurement.bodyText, pattern, `${stateId} raw server payload`);
  }

  const expectedPath =
    expected.surface === 'production' ? expected.destination.productionPath : expected.destination.prototypePath;
  assert.equal(measurement.terminalPath, expectedPath, `${stateId} terminal path`);
  assert.equal(
    measurement.terminalRouteName,
    expected.surface === 'production' ? expected.destination.productionRoute : null,
    `${stateId} terminal route`,
  );

  const expectedErrors = expectedHttpErrors(expected);
  assert.deepEqual(measurement.health.consoleErrors, [], `${stateId} console errors`);
  assert.deepEqual(measurement.health.runtimeExceptions, [], `${stateId} runtime exceptions`);
  assert.deepEqual(measurement.health.networkFailures, [], `${stateId} network failures`);
  assert.deepEqual(measurement.health.unexpectedHttpErrors, [], `${stateId} unexpected HTTP errors`);
  assert.deepEqual(measurement.health.missingExpectedHttpErrors, [], `${stateId} missing expected HTTP errors`);
  assert.deepEqual(
    measurement.health.httpErrors.map((error) => ({ path: new URL(error.url).pathname, status: error.status })),
    expectedErrors,
    `${stateId} exact HTTP error inventory`,
  );

  if (stateId.endsWith('overview-normal-user')) {
    assert.equal(
      measurement.apiRequests.some((request) => request.startsWith('/api/agents')),
      false,
      `${stateId} must not request agents`,
    );
    assert.equal(
      measurement.apiRequests.some((request) => request.startsWith('/api/queue/info')),
      false,
      `${stateId} must not request queue`,
    );
    assert.doesNotMatch(measurement.bodyText, /Agent 容量|队列健康度/, `${stateId} must not render admin metrics`);
  }

  if (stateId === 'production-dark-zh-mobile-repos') {
    assert.ok(
      measurement.denseContainers.some(
        (container) => container.className.includes('repo-table-scroll') && container.locallyScrollable,
      ),
      `${stateId} local repository table scrolling`,
    );
  }
}

assert.deepEqual(manifest.actual.page_overflow_states, [], 'manifest page overflow');
assert.deepEqual(manifest.actual.raw_i18n_states, [], 'manifest raw i18n');
assert.deepEqual(manifest.actual.browser_error_states, [], 'manifest browser errors');

async function aggregateChecksum(files) {
  const records = [];
  for (const file of [...files].sort()) {
    records.push(`${sha256(await readFile(path.join(evidenceRoot, file)))}  ./${file}\n`);
  }
  return sha256(records.join(''));
}

const pngFiles = expectedStateIds.map((stateId) => `${stateId}.png`);
const measurementFiles = expectedStateIds.map((stateId) => `${stateId}.json`);
assert.equal(manifest.checksums.mock_api_py, sha256(await readFile(path.join(evidenceRoot, 'mock_api.py'))));
assert.equal(
  manifest.checksums.mock_api_smoke_mjs,
  sha256(await readFile(path.join(evidenceRoot, 'mock_api_smoke.mjs'))),
);
assert.equal(
  manifest.checksums.capture_browser_mjs,
  sha256(await readFile(path.join(evidenceRoot, 'capture_browser.mjs'))),
);
assert.equal(
  manifest.checksums.verify_evidence_mjs,
  sha256(await readFile(path.join(evidenceRoot, 'verify_evidence.mjs'))),
);
assert.equal(
  manifest.checksums.browser_replay_summary_json,
  sha256(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'))),
);
assert.equal(manifest.checksums.all_png_files, await aggregateChecksum(pngFiles));
assert.equal(manifest.checksums.all_measurement_files, await aggregateChecksum(measurementFiles));

console.log(
  JSON.stringify({
    ok: true,
    runId: manifest.run_id,
    measurements: measurements.length,
    screenshots: pngFiles.length,
    rows: [2, 3],
    normalUserAdminRequests: 0,
    expectedPartialHttpErrors: 2,
    pageOverflowStates: [],
    rawI18nStates: [],
    checksumsVerified: true,
  }),
);
