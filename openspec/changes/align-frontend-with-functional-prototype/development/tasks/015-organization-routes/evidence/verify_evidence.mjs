#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const summary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));
const destinations = [
  { id: 'org-overview', row: 24, terminalRouteName: 'org' },
  { id: 'org-secrets', row: 25, terminalRouteName: 'org-settings-secrets' },
  { id: 'org-registries', row: 26, terminalRouteName: 'org-settings-registries' },
  { id: 'org-agents', row: 27, terminalRouteName: 'org-settings-agents' },
];
const viewports = [
  { id: 'desktop', width: 1600, height: 1000 },
  { id: 'mobile', width: 390, height: 844 },
];
const expectedStates = destinations.flatMap((destination) =>
  viewports.flatMap((viewport) =>
    ['production', 'prototype'].map((surface) => ({
      stateId: `${surface}-dark-zh-${viewport.id}-${destination.id}`,
      row: destination.row,
      surface,
      terminalRouteName: surface === 'production' ? destination.terminalRouteName : null,
      viewport,
    })),
  ),
);
const expectedStateIds = expectedStates.map((state) => state.stateId).toSorted();
const expectedByStateId = new Map(expectedStates.map((state) => [state.stateId, state]));

assert.equal(summary.ok, true);
assert.equal(summary.states, 16);
assert.equal(summary.productionStates, 8);
assert.equal(summary.prototypeStates, 8);
assert.deepEqual(summary.rows, [24, 25, 26, 27]);
assert.deepEqual(summary.stateIds, expectedStateIds);
assert.deepEqual(summary.failedStates, []);

const files = await readdir(evidenceRoot);
const measurements = files.filter((file) => /^(?:production|prototype)-.+\.json$/.test(file)).toSorted();
const screenshots = files.filter((file) => /^(?:production|prototype)-.+\.png$/.test(file)).toSorted();
const measurementStateIds = measurements.map((file) => path.basename(file, '.json'));
const screenshotStateIds = screenshots.map((file) => path.basename(file, '.png'));
assert.deepEqual(measurementStateIds, expectedStateIds);
assert.deepEqual(screenshotStateIds, expectedStateIds);
assert.deepEqual(measurementStateIds, screenshotStateIds);

for (const file of measurements) {
  const measurement = JSON.parse(await readFile(path.join(evidenceRoot, file), 'utf8'));
  const stateId = path.basename(file, '.json');
  const expected = expectedByStateId.get(stateId);
  assert.ok(expected, `${file}: expected state`);
  assert.equal(measurement.runId, summary.runId);
  assert.equal(measurement.stateId, expected.stateId, `${file}: state id`);
  assert.equal(measurement.row, expected.row, `${file}: row`);
  assert.equal(measurement.surface, expected.surface, `${file}: surface`);
  assert.deepEqual(measurement.viewport, expected.viewport, `${file}: viewport`);
  assert.equal(measurement.terminalRouteName, expected.terminalRouteName, `${file}: terminal route`);
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${file}: page overflow`);
  assert.deepEqual(measurement.rawI18nKeys, [], `${file}: raw i18n keys`);
  assert.equal(
    measurement.contentAssertions.every((assertion) => assertion.passed),
    true,
    `${file}: content assertion`,
  );
  for (const [category, entries] of Object.entries(measurement.health)) {
    assert.deepEqual(entries, [], `${file}: ${category}`);
  }
}

console.log(
  JSON.stringify({
    ok: true,
    runId: summary.runId,
    states: summary.states,
    measurements: measurements.length,
    screenshots: screenshots.length,
  }),
);
