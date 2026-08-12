#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const summary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));
const destinations = [
  ['login', 1, 'login', '/login'],
  ['user-general', 39, 'user', '/user'],
  ['user-secrets', 40, 'user-secrets', '/user/secrets'],
  ['user-registries', 41, 'user-registries', '/user/registries'],
  ['user-cli-api', 42, 'user-cli-and-api', '/user/cli-and-api'],
  ['user-agents', 43, 'user-agents', '/user/agents'],
  ['cli-auth', 44, null, '/cli/auth?port=49152'],
  ['not-found', 45, 'not-found', '/definitely-not-a-route'],
];
const viewports = [
  ['desktop', 1600, 1000],
  ['mobile', 390, 844],
];
const expectedStates = new Map(
  destinations.flatMap(([destination, row, routeName, routePath]) =>
    viewports.flatMap(([viewport, width, height]) =>
      ['production', 'prototype'].map((surface) => [
        `${surface}-dark-zh-${viewport}-${destination}`,
        { surface, destination, row, routeName, routePath, viewport, width, height },
      ]),
    ),
  ),
);
const expectedStateIds = [...expectedStates.keys()].toSorted();
const rows = destinations.map(([, row]) => row);
const files = await readdir(evidenceRoot);
const measurements = files.filter((file) => /^(?:production|prototype)-.+\.json$/.test(file)).toSorted();
const screenshots = files.filter((file) => /^(?:production|prototype)-.+\.png$/.test(file)).toSorted();

assert.equal(summary.ok, true);
assert.equal(summary.states, 32);
assert.equal(summary.productionStates, 16);
assert.equal(summary.prototypeStates, 16);
assert.deepEqual(summary.rows, rows);
assert.deepEqual(summary.failedStates, []);
assert.deepEqual(summary.stateIds.toSorted(), expectedStateIds);
assert.equal(measurements.length, 32);
assert.equal(screenshots.length, 32);
assert.deepEqual(measurements.map((file) => file.replace(/\.json$/, '')).toSorted(), expectedStateIds);
assert.deepEqual(screenshots.map((file) => file.replace(/\.png$/, '')).toSorted(), expectedStateIds);

for (const file of measurements) {
  const stateId = file.replace(/\.json$/, '');
  const expected = expectedStates.get(stateId);
  assert.ok(expected, `${file}: expected state`);
  const measurement = JSON.parse(await readFile(path.join(evidenceRoot, file), 'utf8'));
  assert.equal(measurement.stateId, stateId, `${file}: state ID`);
  assert.equal(measurement.runId, summary.runId, `${file}: run ID`);
  assert.equal(measurement.row, expected.row, `${file}: row`);
  assert.equal(measurement.surface, expected.surface, `${file}: surface`);
  assert.deepEqual(
    measurement.viewport,
    { id: expected.viewport, width: expected.width, height: expected.height },
    `${file}: viewport`,
  );
  if (measurement.surface === 'production') {
    assert.equal(measurement.document.width, expected.width, `${file}: document width`);
    assert.equal(measurement.terminalRouteName, expected.routeName, `${file}: terminal route`);
    assert.equal(measurement.terminalPath, expected.routePath, `${file}: terminal path`);
  } else {
    assert.ok(
      measurement.document.width <= expected.width && measurement.document.width >= expected.width - 10,
      `${file}: prototype document width`,
    );
    assert.equal(measurement.terminalRouteName, null, `${file}: prototype route`);
  }
  assert.equal(measurement.document.height, expected.height, `${file}: document height`);
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${file}: overflow`);
  assert.deepEqual(measurement.rawI18nKeys, [], `${file}: raw i18n keys`);
  assert.ok(
    measurement.contentAssertions.every((assertion) => assertion.passed),
    `${file}: content`,
  );
  assert.ok(
    Object.values(measurement.health).every((entries) => entries.length === 0),
    `${file}: health`,
  );
  const screenshotPath = path.join(evidenceRoot, file.replace(/\.json$/, '.png'));
  const screenshotStat = await stat(screenshotPath);
  assert.ok(screenshotStat.size > 10_000, `${file}: screenshot size`);
  const screenshot = await readFile(screenshotPath);
  assert.equal(screenshot.toString('ascii', 1, 4), 'PNG', `${file}: PNG signature`);
  assert.equal(screenshot.readUInt32BE(16), expected.width, `${file}: screenshot width`);
  assert.equal(screenshot.readUInt32BE(20), expected.height, `${file}: screenshot height`);
}

console.log(JSON.stringify({ ok: true, runId: summary.runId, measurements: 32, screenshots: 32, rows }));
