#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expectedPatterns, states, viewports } from './matrix.mjs';

const defaultEvidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const evidenceRoot = process.env.TASK022_EVIDENCE_ROOT ?? defaultEvidenceRoot;
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
const rawEnumPattern =
  /(?<![A-Za-z0-9_])(?:draft|pending_approval|rejected|approved|running|paused|success|failed|cancelled|single|all-at-once|rolling|ready|deployed|superseded|rolled_back|queued|deploying|health_check|healthy|skipped|waiting|pulling|starting|system)(?![A-Za-z0-9_])/gi;

assert.equal(states.length, 54, 'state count');
assert.equal(stateById.size, 54, 'unique states');
assert.equal(manifest.task_id, '022-deployment-route-reverification', 'manifest task');
assert.deepEqual(manifest.matrix.route_rows, rows, 'manifest rows');
assert.equal(manifest.matrix.expected_states, 54, 'manifest state count');
assert.equal(summary.schema, 'woodpecker.deployment-browser-replay.v1', 'summary schema');
assert.equal(summary.ok, true, 'capture summary');
assert.equal(summary.runId, manifest.run_id, 'run id agreement');
assert.equal(summary.states, 54, 'summary states');
assert.equal(summary.productionStates, 34, 'production states');
assert.equal(summary.prototypeStates, 20, 'prototype states');
assert.equal(summary.equivalentStates, 40, 'equivalent states');
assert.equal(summary.representativeStates, 10, 'representative states');
assert.equal(summary.boundaryStates, 4, 'boundary states');
assert.deepEqual(summary.rows, rows, 'summary rows');
assert.deepEqual(summary.stateIds, stateIds, 'summary inventory');
assert.deepEqual(summary.failedStates, [], 'failed states');
assert.deepEqual(manifest.source_identity, summary.sourceIdentity, 'source identity agreement');
assert.deepEqual(manifest.service_identity, summary.serviceIdentity, 'service identity agreement');
assert.equal(manifest.service_identity.fixture, '022-deployment-route-reverification', 'fixture identity');
assert.equal(manifest.service_identity.runId, manifest.run_id, 'fixture run id');
assert.equal(manifest.service_identity.productionMarker, 'mutationPending', 'production marker');

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

function expectedHttpErrors(state) {
  return state.expectedHttpErrors ?? [];
}

function parseRequest(request) {
  const match = /^(GET|POST|PATCH|PUT|DELETE) (\S+)$/.exec(request);
  assert.ok(match, `invalid request record: ${request}`);
  return { method: match[1], path: match[2] };
}

function rawEnumTokens(state, text) {
  if (state.surface !== 'production' || state.locale !== 'zh-Hans') return [];
  return [...new Set(text.match(rawEnumPattern) ?? [])].map((token) => token.toLowerCase()).sort();
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
  assert.equal(typeof measurement.localizationText, 'string', `${stateId} localization text`);
  assert.deepEqual(
    [...measurement.rawEnumTokens].map((token) => token.toLowerCase()).sort(),
    rawEnumTokens(state, measurement.localizationText),
    `${stateId} raw enum inventory`,
  );
  assert.deepEqual(measurement.rawEnumTokens, [], `${stateId} raw enum tokens`);
  assert.deepEqual(measurement.health.consoleErrors, [], `${stateId} console errors`);
  assert.deepEqual(measurement.health.runtimeExceptions, [], `${stateId} runtime exceptions`);
  assert.deepEqual(measurement.health.networkFailures, [], `${stateId} network failures`);
  assert.deepEqual(measurement.health.unexpectedHttpErrors, [], `${stateId} unexpected HTTP errors`);
  assert.deepEqual(measurement.health.missingExpectedHttpErrors, [], `${stateId} missing HTTP errors`);
  assert.deepEqual(
    measurement.health.httpErrors.map((error) => ({
      path: new URL(error.url).pathname,
      status: error.status,
    })),
    expectedHttpErrors(state),
    `${stateId} expected HTTP errors`,
  );
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
    const writes = measurement.apiRequests.map(parseRequest).filter((request) => request.method !== 'GET');
    if (state.id.endsWith('deployment-mutation-error')) {
      assert.deepEqual(writes, [{ method: 'POST', path: '/api/deployments/142/pause' }], `${stateId} writes`);
      assert.match(measurement.bodyText, /部署操作失败/, `${stateId} mutation feedback`);
      assert.match(measurement.bodyText, /DEP-142/, `${stateId} confirmed detail retained`);
    } else {
      assert.deepEqual(writes, [], `${stateId} unauthorized writes`);
    }
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
  if (stateId.endsWith('deployments-empty')) {
    assert.match(measurement.bodyText, /暂无部署/, `${stateId} empty feedback`);
    assert.doesNotMatch(measurement.bodyText, /DEP-142/, `${stateId} stale deployment`);
  }
  if (stateId.endsWith('application-missing')) {
    assert.match(measurement.bodyText, /未找到应用/, `${stateId} missing application`);
    assert.doesNotMatch(measurement.bodyText, /Backend API service/, `${stateId} stale application`);
  }
  if (stateId.endsWith('applications-error')) {
    assert.match(measurement.bodyText, /无法加载应用/, `${stateId} error application`);
    assert.doesNotMatch(measurement.bodyText, /Backend API service/, `${stateId} unconfirmed application`);
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
const checksummedSupport = [
  ['matrix_mjs', 'matrix.mjs'],
  ['mock_api_mjs', 'mock_api.mjs'],
  ['mock_api_smoke_mjs', 'mock_api_smoke.mjs'],
  ['capture_browser_mjs', 'capture_browser.mjs'],
  ['verify_evidence_mjs', 'verify_evidence.mjs'],
  ['redteam_verifier_mjs', 'redteam_verifier.mjs'],
  ['validate_task_mjs', 'validate_task.mjs'],
  ['browser_replay_summary_json', 'browser-replay-summary.json'],
];
for (const [key, file] of checksummedSupport) {
  assert.equal(manifest.checksums[key], sha256(await readFile(path.join(evidenceRoot, file))), `${file} checksum`);
}
assert.equal(manifest.checksums.all_png_files, await aggregateChecksum(pngFiles));
assert.equal(manifest.checksums.all_measurement_files, await aggregateChecksum(measurementFiles));
assert.deepEqual(manifest.actual.page_overflow_states, []);
assert.deepEqual(manifest.actual.raw_i18n_states, []);
assert.deepEqual(manifest.actual.raw_enum_states, []);
assert.deepEqual(manifest.actual.browser_error_states, []);

console.log(
  JSON.stringify({
    ok: true,
    runId: manifest.run_id,
    measurements: measurements.length,
    screenshots: pngFiles.length,
    rows,
    mutationWrites: measurements
      .flatMap((measurement) => measurement.apiRequests)
      .map(parseRequest)
      .filter((request) => request.method !== 'GET'),
    pageOverflowStates: manifest.actual.page_overflow_states,
    rawI18nStates: manifest.actual.raw_i18n_states,
    rawEnumStates: manifest.actual.raw_enum_states,
    checksumsVerified: true,
  }),
);
