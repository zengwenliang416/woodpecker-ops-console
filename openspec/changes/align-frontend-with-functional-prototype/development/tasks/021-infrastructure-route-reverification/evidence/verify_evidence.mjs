#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expectedPatterns, states, viewports } from './matrix.mjs';

const defaultEvidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const evidenceRoot = process.env.TASK021_EVIDENCE_ROOT ?? defaultEvidenceRoot;
const projectRoot = path.resolve(defaultEvidenceRoot, '../../../../../../..');
const productionRoot = path.join(projectRoot, 'web');
const prototypeRoot = path.join(
  projectRoot,
  'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact',
);
const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'manifest.json'), 'utf8'));
const summary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));
const stateById = new Map(states.map((state) => [state.id, state]));
const stateIds = [...stateById.keys()].sort();
const rows = [...new Set(states.map((state) => state.destination.row))].sort((left, right) => left - right);
const supportFiles = [
  'browser-replay-summary.json',
  'capture_browser.mjs',
  'manifest.json',
  'matrix.mjs',
  'mock_api.mjs',
  'mock_api_smoke.mjs',
  'redteam-verifier-summary.json',
  'redteam_verifier.mjs',
  'validate_task.mjs',
  'verify_evidence.mjs',
];

assert.equal(states.length, 62, 'state count');
assert.equal(stateById.size, 62, 'unique states');
assert.equal(manifest.task_id, '021-infrastructure-route-reverification', 'manifest task');
assert.deepEqual(manifest.matrix.route_rows, rows, 'manifest rows');
assert.equal(manifest.matrix.expected_states, 62, 'manifest state count');
assert.equal(summary.schema, 'woodpecker.infrastructure-browser-replay.v1', 'summary schema');
assert.equal(summary.ok, true, 'capture summary');
assert.equal(summary.runId, manifest.run_id, 'run id agreement');
assert.equal(summary.states, 62, 'summary states');
assert.equal(summary.productionStates, 38, 'production states');
assert.equal(summary.prototypeStates, 24, 'prototype states');
assert.equal(summary.equivalentStates, 48, 'equivalent states');
assert.equal(summary.representativeStates, 12, 'representative states');
assert.equal(summary.boundaryStates, 2, 'boundary states');
assert.deepEqual(summary.rows, rows, 'summary rows');
assert.deepEqual(summary.stateIds, stateIds, 'summary inventory');
assert.deepEqual(summary.failedStates, [], 'failed states');
assert.deepEqual(manifest.source_identity, summary.sourceIdentity, 'source identity agreement');
assert.deepEqual(manifest.service_identity, summary.serviceIdentity, 'service identity agreement');
assert.equal(manifest.service_identity.fixture, '021-infrastructure-route-reverification', 'fixture identity');
assert.equal(manifest.service_identity.runId, manifest.run_id, 'fixture run id');

const rootEntries = await readdir(evidenceRoot, { withFileTypes: true });
assert.deepEqual(
  rootEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  [],
  'evidence root directories',
);
assert.deepEqual(
  rootEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort(),
  [
    ...supportFiles,
    ...stateIds.map((stateId) => `${stateId}.json`),
    ...stateIds.map((stateId) => `${stateId}.png`),
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

assert.deepEqual(await sourceIdentity(), manifest.source_identity, 'current source identity');

function assertPng(buffer, viewport, stateId) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${stateId} PNG signature`);
  assert.equal(buffer.readUInt32BE(16), viewport.width, `${stateId} PNG width`);
  assert.equal(buffer.readUInt32BE(20), viewport.height, `${stateId} PNG height`);
}

function expectedPath(state) {
  return state.surface === 'production'
    ? state.destination.productionPath
    : state.destination.prototypePath.replace('/#', '');
}

const measurements = [];
for (const stateId of stateIds) {
  const state = stateById.get(stateId);
  const viewport = viewports[state.viewportId];
  const measurement = JSON.parse(await readFile(path.join(evidenceRoot, `${stateId}.json`), 'utf8'));
  const screenshot = await readFile(path.join(evidenceRoot, `${stateId}.png`));
  measurements.push(measurement);

  assert.equal(measurement.runId, manifest.run_id, `${stateId} run id`);
  assert.equal(measurement.stateId, stateId, `${stateId} state id`);
  assert.equal(measurement.row, state.destination.row, `${stateId} row`);
  assert.equal(measurement.destination, state.destinationId, `${stateId} destination`);
  assert.equal(measurement.surface, state.surface, `${stateId} surface`);
  assert.equal(measurement.stateClass, state.class, `${stateId} class`);
  assert.equal(measurement.role, state.role, `${stateId} role`);
  assert.equal(measurement.dataState, state.dataState, `${stateId} data state`);
  assert.equal(measurement.viewportId, state.viewportId, `${stateId} viewport id`);
  assert.deepEqual(measurement.viewport, { devicePixelRatio: 1, ...viewport }, `${stateId} viewport`);
  assert.deepEqual(measurement.screenshotDimensions, viewport, `${stateId} screenshot dimensions`);
  assert.equal(measurement.document.dataTheme, state.theme, `${stateId} theme`);
  assert.equal(measurement.document.lang, state.locale, `${stateId} locale`);
  assert.equal(measurement.document.clientHeight, viewport.height, `${stateId} document height`);
  assert.ok(measurement.document.clientWidth >= viewport.width - 20, `${stateId} document width`);
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${stateId} page overflow`);
  assert.deepEqual(measurement.rawI18nKeys, [], `${stateId} raw i18n keys`);
  assert.deepEqual(measurement.health.consoleErrors, [], `${stateId} console errors`);
  assert.deepEqual(measurement.health.runtimeExceptions, [], `${stateId} runtime exceptions`);
  assert.deepEqual(measurement.health.networkFailures, [], `${stateId} network failures`);
  assert.deepEqual(measurement.health.unexpectedHttpErrors, [], `${stateId} unexpected HTTP errors`);
  assert.deepEqual(measurement.health.missingExpectedHttpErrors, [], `${stateId} missing HTTP errors`);
  assertPng(screenshot, viewport, stateId);

  const patterns = expectedPatterns(state);
  assert.deepEqual(
    measurement.contentAssertions.map((assertion) => assertion.pattern),
    patterns.map((pattern) => pattern.toString()),
    `${stateId} assertion inventory`,
  );
  assert.ok(
    patterns.every((pattern) => pattern.test(measurement.bodyText)),
    `${stateId} content`,
  );
  assert.ok(
    measurement.contentAssertions.every((assertion) => assertion.passed),
    `${stateId} recorded content`,
  );
  assert.equal(measurement.terminalPath, expectedPath(state), `${stateId} terminal path`);
  if (state.surface === 'production') {
    assert.equal(measurement.terminalRouteName, state.destination.productionRoute, `${stateId} route`);
    assert.ok(measurement.apiRequests.length > 0, `${stateId} API request inventory`);
  } else {
    assert.equal(measurement.terminalRouteName, null, `${stateId} prototype route`);
    assert.deepEqual(measurement.apiRequests, [], `${stateId} prototype requests`);
  }
  if (state.viewportId === 'mobile') {
    const overflowContainers = measurement.denseContainers.filter(
      (container) => container.scrollWidth > container.clientWidth,
    );
    assert.ok(
      overflowContainers.every((container) => container.locallyScrollable || ['table', 'pre'].includes(container.tag)),
      `${stateId} dense containment`,
    );
  }
  if (stateId.endsWith('serverSettings-normal-user')) {
    assert.equal(measurement.deleteControlCount, 0, `${stateId} delete control`);
    assert.doesNotMatch(measurement.bodyText, /移除服务器/, `${stateId} administrator copy`);
  }
  if (stateId.endsWith('services-empty')) {
    assert.match(measurement.bodyText, /未找到服务/, `${stateId} empty services`);
    assert.doesNotMatch(measurement.bodyText, /prod-api-01/, `${stateId} stale services`);
  }
}

async function aggregateChecksum(files) {
  const records = [];
  for (const file of [...files].sort()) {
    records.push(`${sha256(await readFile(path.join(evidenceRoot, file)))}  ./${file}\n`);
  }
  return sha256(records.join(''));
}

const pngFiles = stateIds.map((stateId) => `${stateId}.png`);
const measurementFiles = stateIds.map((stateId) => `${stateId}.json`);
assert.equal(manifest.checksums.matrix_mjs, sha256(await readFile(path.join(evidenceRoot, 'matrix.mjs'))));
assert.equal(manifest.checksums.mock_api_mjs, sha256(await readFile(path.join(evidenceRoot, 'mock_api.mjs'))));
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
  manifest.checksums.validate_task_mjs,
  sha256(await readFile(path.join(evidenceRoot, 'validate_task.mjs'))),
);
assert.equal(
  manifest.checksums.browser_replay_summary_json,
  sha256(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'))),
);
assert.equal(manifest.checksums.all_png_files, await aggregateChecksum(pngFiles));
assert.equal(manifest.checksums.all_measurement_files, await aggregateChecksum(measurementFiles));
assert.deepEqual(manifest.actual.page_overflow_states, []);
assert.deepEqual(manifest.actual.raw_i18n_states, []);
assert.deepEqual(manifest.actual.browser_error_states, []);

console.log(
  JSON.stringify({
    ok: true,
    runId: manifest.run_id,
    measurements: measurements.length,
    screenshots: pngFiles.length,
    rows,
    normalUserDeleteControls: measurements
      .filter((measurement) => measurement.stateId.endsWith('serverSettings-normal-user'))
      .reduce((total, measurement) => total + measurement.deleteControlCount, 0),
    pageOverflowStates: manifest.actual.page_overflow_states,
    rawI18nStates: manifest.actual.raw_i18n_states,
    checksumsVerified: true,
  }),
);
