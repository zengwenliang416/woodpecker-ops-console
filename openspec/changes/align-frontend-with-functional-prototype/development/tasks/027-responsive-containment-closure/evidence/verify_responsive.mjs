#!/usr/bin/env node

/**
 * Task 027 strict responsive verifier. Fails closed when any measured state
 * has page-level horizontal overflow, an uncontained dense container, a raw
 * i18n key, a browser health failure, an unexpected HTTP error, a missing
 * evidence artifact, or an inventory mismatch against the replay summary.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { states } from './matrix.mjs';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const summaryPath = path.join(evidenceRoot, 'browser-replay-summary.json');
const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
const stateIds = states.map((state) => state.id);
const failures = [];

assert.equal(summary.schema, 'woodpecker.task027-responsive-replay.v1', 'summary schema');
assert.equal(summary.states, stateIds.length, 'summary state count');
assert.deepEqual([...summary.failedStates].sort(), [], 'summary failed states');

const expectedInventory = stateIds.flatMap((id) => [`production-${id}.json`, `production-${id}.png`]);
const inventory = (await readdir(evidenceRoot)).filter((name) => /^production-.+\.(?:json|png)$/.test(name)).sort();
const extra = inventory.filter((name) => !expectedInventory.includes(name));
const missing = expectedInventory.filter((name) => !inventory.includes(name));
if (extra.length > 0) failures.push(`unexpected evidence files: ${extra.join(', ')}`);
if (missing.length > 0) failures.push(`missing evidence files: ${missing.join(', ')}`);

const manifest = JSON.parse(await readFile(path.join(evidenceRoot, 'evidence-manifest.json'), 'utf8'));
assert.equal(manifest.schema, 'woodpecker.task027-evidence-manifest.v1', 'manifest schema');
assert.equal(manifest.runId, summary.runId, 'manifest runId');
assert.equal(manifest.states, stateIds.length, 'manifest state count');

for (const stateId of stateIds) {
  const jsonPath = path.join(evidenceRoot, `production-${stateId}.json`);
  const pngPath = path.join(evidenceRoot, `production-${stateId}.png`);
  const json = JSON.parse(await readFile(jsonPath, 'utf8'));
  const png = await readFile(pngPath);
  const jsonDigest = createHash('sha256')
    .update(await readFile(jsonPath))
    .digest('hex');
  const pngDigest = createHash('sha256').update(png).digest('hex');
  if (manifest.files[`production-${stateId}.json`] !== jsonDigest) failures.push(`${stateId}: JSON digest drift`);
  if (manifest.files[`production-${stateId}.png`] !== pngDigest) failures.push(`${stateId}: PNG digest drift`);

  if (json.stateId !== stateId) failures.push(`${stateId}: stateId mismatch`);
  if (json.runId !== summary.runId) failures.push(`${stateId}: runId mismatch`);
  if (json.pageLevelHorizontalOverflow) failures.push(`${stateId}: page-level horizontal overflow`);
  for (const contributor of json.overflowContributors ?? []) {
    failures.push(
      `${stateId}: overflow contributor <${contributor.tag} class="${contributor.className}" right=${contributor.right}px>`,
    );
  }
  for (const container of json.denseContainers ?? []) {
    if (container.scrollWidth > container.clientWidth + 1 && !container.locallyScrollable) {
      failures.push(
        `${stateId}: uncontained dense <${container.tag} class="${container.className}"> (scroll ${container.scrollWidth} > client ${container.clientWidth}, overflowX=${container.overflowX})`,
      );
    }
  }
  if ((json.rawI18nKeys ?? []).length > 0)
    failures.push(`${stateId}: raw i18n keys ${JSON.stringify(json.rawI18nKeys)}`);
  for (const entry of json.health?.consoleMessages ?? []) failures.push(`${stateId}: console error ${entry.message}`);
  for (const entry of json.health?.runtimeExceptions ?? [])
    failures.push(`${stateId}: runtime exception ${entry.message}`);
  for (const entry of json.health?.networkFailures ?? [])
    failures.push(`${stateId}: network failure ${entry.errorText}`);
  for (const entry of json.health?.httpErrors ?? []) failures.push(`${stateId}: http ${entry.status} ${entry.url}`);
  if (png.length < 1_000) failures.push(`${stateId}: PNG suspiciously small (${png.length} bytes)`);
  if (json.viewportId !== stateId.split('-').slice(-1)[0]) failures.push(`${stateId}: viewport mismatch`);
}

if (failures.length > 0) {
  process.stderr.write(`Strict responsive verification FAILED:\n- ${failures.join('\n- ')}\n`);
  process.exit(1);
}
process.stdout.write(`Strict responsive verification passed for ${stateIds.length} states.\n`);
