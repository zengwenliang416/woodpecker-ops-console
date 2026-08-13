#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const projectRoot = path.resolve(process.env.TASK023_PROJECT_ROOT ?? defaultProjectRoot);
const changeRoot = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');
const mutation = process.env.TASK023_AUDIT_MUTATION ? JSON.parse(process.env.TASK023_AUDIT_MUTATION) : null;

const taskIds = [
  '020-overview-repositories-reverification',
  '021-infrastructure-route-reverification',
  '022-deployment-route-reverification',
];
const expectedRows = [2, 3, ...Array.from({ length: 22 }, (_, index) => index + 46)];
const expectedRuns = new Map([
  ['020-overview-repositories-reverification', '1eae7bc3-e742-4aac-bce0-ec61105eebb8'],
  ['021-infrastructure-route-reverification', '84b42687-5a1a-402c-952f-6e5fd1ac338a'],
  ['022-deployment-route-reverification', '0051a9bc-3312-4bf4-a850-6e4d4a205920'],
]);
const expectedMutationCounts = new Map([
  ['020-overview-repositories-reverification', 15],
  ['021-infrastructure-route-reverification', 13],
  ['022-deployment-route-reverification', 15],
]);

function readText(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  assert.ok(existsSync(absolutePath), `missing required artifact: ${relativePath}`);
  return readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function aggregateChecksum(root, files) {
  const records = [...files].sort().map((file) => `${sha256(readFileSync(path.join(root, file)))}  ./${file}\n`);
  return sha256(records.join(''));
}

function verifyEvidenceBundle(taskId, taskRelativeRoot, manifest) {
  const root = path.join(projectRoot, taskRelativeRoot, 'evidence');
  const entries = readdirSync(root, { withFileTypes: true });
  assert.deepEqual(
    entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    [],
    `${taskId} evidence directories`,
  );

  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const pngFiles = files.filter((file) => file.endsWith('.png'));
  const measurementFiles = pngFiles.map((file) => file.replace(/\.png$/, '.json'));
  const expectedStates = manifest.matrix.expected_states;
  assert.equal(pngFiles.length, expectedStates, `${taskId} PNG count`);
  assert.ok(
    measurementFiles.every((file) => files.includes(file)),
    `${taskId} measurement inventory`,
  );

  for (const file of pngFiles) {
    const png = readFileSync(path.join(root, file));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${taskId} ${file} PNG signature`);
  }
  for (const file of measurementFiles) {
    const measurement = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    assert.equal(measurement.runId, manifest.run_id, `${taskId} ${file} run id`);
    assert.equal(measurement.pageLevelHorizontalOverflow, false, `${taskId} ${file} page overflow`);
    assert.deepEqual(measurement.rawI18nKeys, [], `${taskId} ${file} raw i18n`);
    assert.deepEqual(measurement.health.consoleErrors, [], `${taskId} ${file} console`);
    assert.deepEqual(measurement.health.runtimeExceptions, [], `${taskId} ${file} runtime`);
    assert.deepEqual(measurement.health.networkFailures, [], `${taskId} ${file} network`);
    assert.deepEqual(measurement.health.unexpectedHttpErrors, [], `${taskId} ${file} HTTP`);
  }

  const summary = JSON.parse(readFileSync(path.join(root, 'browser-replay-summary.json'), 'utf8'));
  assert.equal(summary.ok, true, `${taskId} browser summary`);
  assert.equal(summary.runId, manifest.run_id, `${taskId} summary run id`);
  assert.equal(summary.states, expectedStates, `${taskId} summary state count`);
  assert.deepEqual(summary.failedStates, [], `${taskId} failed browser states`);
  assert.deepEqual(summary.sourceIdentity, manifest.source_identity, `${taskId} captured source identity`);
  assert.deepEqual(summary.serviceIdentity, manifest.service_identity, `${taskId} service identity`);

  const checksumFiles = {
    matrix_mjs: 'matrix.mjs',
    mock_api_py: 'mock_api.py',
    mock_api_mjs: 'mock_api.mjs',
    mock_api_smoke_mjs: 'mock_api_smoke.mjs',
    capture_browser_mjs: 'capture_browser.mjs',
    verify_evidence_mjs: 'verify_evidence.mjs',
    redteam_verifier_mjs: 'redteam_verifier.mjs',
    validate_task_mjs: 'validate_task.mjs',
    browser_replay_summary_json: 'browser-replay-summary.json',
  };
  for (const [key, file] of Object.entries(checksumFiles)) {
    if (!(key in manifest.checksums)) continue;
    assert.equal(manifest.checksums[key], sha256(readFileSync(path.join(root, file))), `${taskId} ${file} checksum`);
  }
  assert.equal(manifest.checksums.all_png_files, aggregateChecksum(root, pngFiles), `${taskId} aggregate PNG checksum`);
  assert.equal(
    manifest.checksums.all_measurement_files,
    aggregateChecksum(root, measurementFiles),
    `${taskId} aggregate measurement checksum`,
  );

  return {
    states: expectedStates,
    screenshots: pngFiles.length,
    checksums: 'verified',
  };
}

function gitObject(relativePath) {
  return execFileSync('git', ['rev-parse', `HEAD:${relativePath}`], {
    cwd: projectRoot,
    encoding: 'utf8',
  }).trim();
}

function markdownValue(markdown, heading) {
  const pattern = new RegExp(`^## ${heading}\\s*\\n\\s*([^\\n]+)`, 'm');
  const match = markdown.match(pattern);
  assert.ok(match, `missing markdown heading value: ${heading}`);
  return match[1].trim().toLowerCase();
}

function routeStatuses(markdown) {
  const statuses = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(\d+)\s*\|.*\|\s*(verified|blocked|planned)\s*\|$/);
    if (match) statuses.set(Number(match[1]), match[2]);
  }
  return statuses;
}

const latestOwners = new Map();
const taskSummaries = [];

for (const taskId of taskIds) {
  const taskRelativeRoot = `openspec/changes/align-frontend-with-functional-prototype/development/tasks/${taskId}`;
  const acceptance = readJson(`${taskRelativeRoot}/acceptance.json`);
  const report = readText(`${taskRelativeRoot}/report.md`);
  const specReview = readText(`${taskRelativeRoot}/spec-review.md`);
  const qualityReview = readText(`${taskRelativeRoot}/quality-review.md`);
  const manifest = readJson(`${taskRelativeRoot}/evidence/manifest.json`);
  const redTeam = readJson(`${taskRelativeRoot}/evidence/redteam-verifier-summary.json`);

  if (mutation?.type === 'acceptance-status' && mutation.taskId === taskId) {
    acceptance.status = mutation.value;
  }
  if (mutation?.type === 'missing-artifact' && mutation.taskId === taskId) {
    assert.fail(`missing required artifact: ${mutation.path}`);
  }

  assert.equal(acceptance.task_id, taskId, `${taskId} acceptance task id`);
  assert.equal(acceptance.status, 'approved', `${taskId} acceptance status`);
  assert.match(acceptance.reviewed_git_head, /^[0-9a-f]{40}$/, `${taskId} reviewed head`);
  assert.match(acceptance.reviewed_git_tree, /^[0-9a-f]{40}$/, `${taskId} reviewed tree`);
  assert.equal(markdownValue(report, 'Status'), 'done', `${taskId} report status`);
  assert.equal(markdownValue(specReview, 'Verdict'), 'approved', `${taskId} spec verdict`);
  assert.equal(markdownValue(qualityReview, 'Verdict'), 'approved', `${taskId} quality verdict`);
  assert.equal(manifest.task_id, taskId, `${taskId} manifest task id`);
  assert.equal(manifest.run_id, expectedRuns.get(taskId), `${taskId} browser run`);
  assert.equal(redTeam.ok, true, `${taskId} red-team status`);
  assert.equal(redTeam.positiveVerifierExitCode, 0, `${taskId} positive verifier`);
  assert.equal(redTeam.mutations.length, expectedMutationCounts.get(taskId), `${taskId} mutation count`);
  assert.ok(
    redTeam.mutations.every((entry) => entry.rejected === true),
    `${taskId} must reject every verifier mutation`,
  );
  assert.ok(
    existsSync(path.join(projectRoot, `${taskRelativeRoot}/evidence/verify_evidence.mjs`)),
    `${taskId} strict verifier missing`,
  );
  const evidenceBundle = verifyEvidenceBundle(taskId, taskRelativeRoot, manifest);

  for (const entry of acceptance.implementation_scope.entries) {
    latestOwners.set(entry.path, {
      taskId,
      expectedObject: entry.object_id,
    });
  }

  taskSummaries.push({
    task_id: taskId,
    acceptance: 'approved',
    run_id: manifest.run_id,
    red_team: `${redTeam.mutations.length}/${redTeam.mutations.length}`,
    evidence_bundle: evidenceBundle,
  });
}

if (mutation?.type === 'object-drift') {
  const owner = latestOwners.get(mutation.path);
  assert.ok(owner, `mutation path is not accepted: ${mutation.path}`);
  owner.expectedObject = '0'.repeat(40);
}

const objectChecks = [];
for (const [relativePath, owner] of [...latestOwners.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const actualObject = gitObject(relativePath);
  assert.equal(actualObject, owner.expectedObject, `${relativePath} drifted from newest signed owner ${owner.taskId}`);
  objectChecks.push({
    path: relativePath,
    owner: owner.taskId,
    object_id: actualObject,
  });
}

const parity = routeStatuses(readText('openspec/changes/align-frontend-with-functional-prototype/route-parity.md'));
if (mutation?.type === 'route-status') parity.set(mutation.row, mutation.value);
for (const row of expectedRows) {
  assert.equal(parity.get(row), 'verified', `route-parity row ${row}`);
}
assert.equal(parity.get(4), 'blocked', 'blocked repository-add row 4 must remain open');

const result = {
  schema: 'woodpecker.operations-residual-audit.v1',
  ok: true,
  task_id: '023-operations-residual-delta-closure',
  reviewed_head: execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: projectRoot,
    encoding: 'utf8',
  }).trim(),
  accepted_tasks: taskSummaries,
  verified_rows: expectedRows,
  preserved_blocked_rows: [4],
  newest_owned_objects: objectChecks.length,
  production_repairs_required: false,
  object_checks: objectChecks,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
