#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const summary = JSON.parse(await readFile(path.join(root, 'browser-replay-summary.json'), 'utf8'));
const regularLinks = [
  '/',
  '/overview',
  '/repos',
  '/deployments',
  '/deployments/apps',
  '/deployments/environments',
  '/deployments/releases',
  '/deployments/approvals',
  '/infrastructure',
  '/infrastructure/servers',
  '/infrastructure/groups',
  '/infrastructure/services',
  '/infrastructure/alerts',
  '/user/secrets',
  '/user',
];
const adminLinks = [
  ...regularLinks.slice(0, 13),
  '/admin/agents',
  '/admin/queue',
  '/user/secrets',
  '/admin',
  '/admin/users',
  '/admin/forges',
  '/user',
];
const expected = new Map(
  [
    ['guest-public', 'org', []],
    ['guest-public-repo', 'repo', []],
    ['guest-admin', 'login', []],
    ['regular-admin', 'overview', regularLinks],
    ['admin-admin', 'admin-settings-users', adminLinks],
  ].flatMap(([id, routeName, protectedLinks]) =>
    [
      ['desktop', 1600, 1000],
      ['mobile', 390, 844],
    ].map(([viewport, width, height]) => [`${id}-${viewport}`, { routeName, protectedLinks, width, height }]),
  ),
);
const files = await readdir(root);
const measurements = files.filter((file) => /^(?:guest|regular|admin)-.+\.json$/.test(file)).toSorted();
const screenshots = files.filter((file) => /^(?:guest|regular|admin)-.+\.png$/.test(file)).toSorted();

assert.equal(summary.ok, true);
assert.equal(summary.states, 10);
assert.deepEqual(summary.failedStates, []);
assert.equal(measurements.length, 10);
assert.equal(screenshots.length, 10);

for (const file of measurements) {
  const stateId = file.replace(/\.json$/, '');
  const contract = expected.get(stateId);
  assert.ok(contract, `${stateId}: expected state`);
  const measurement = JSON.parse(await readFile(path.join(root, file), 'utf8'));
  assert.equal(measurement.runId, summary.runId, `${stateId}: run ID`);
  assert.equal(measurement.terminalRouteName, contract.routeName, `${stateId}: route`);
  assert.deepEqual(measurement.protectedLinks, contract.protectedLinks, `${stateId}: protected links`);
  assert.equal(new Set(measurement.protectedLinks).size, measurement.protectedLinks.length, `${stateId}: unique links`);
  if (measurement.actor !== 'admin') {
    assert.ok(
      measurement.protectedLinks.every((href) => !href.startsWith('/admin')),
      `${stateId}: no administration links`,
    );
  }
  assert.equal(measurement.pageLevelHorizontalOverflow, false, `${stateId}: overflow`);
  assert.ok(
    Object.values(measurement.health).every((entries) => entries.length === 0),
    `${stateId}: health`,
  );
  const screenshotPath = path.join(root, `${stateId}.png`);
  assert.ok((await stat(screenshotPath)).size > 10_000, `${stateId}: screenshot size`);
  const screenshot = await readFile(screenshotPath);
  assert.equal(screenshot.toString('ascii', 1, 4), 'PNG', `${stateId}: PNG`);
  assert.equal(screenshot.readUInt32BE(16), contract.width, `${stateId}: width`);
  assert.equal(screenshot.readUInt32BE(20), contract.height, `${stateId}: height`);
}

console.log(JSON.stringify({ ok: true, runId: summary.runId, states: 10 }));
