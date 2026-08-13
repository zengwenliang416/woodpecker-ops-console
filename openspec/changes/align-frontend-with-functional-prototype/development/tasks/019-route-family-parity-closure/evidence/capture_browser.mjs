#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const tasksRoot = path.dirname(path.dirname(evidenceRoot));
const productionRoot = path.join(projectRoot, 'web');
const prototypeRoot = path.join(
  projectRoot,
  'openspec/changes/align-frontend-with-functional-prototype/prototype/artifact',
);
const runId = randomUUID();
const fixture = '019-route-family-parity-closure';
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const groups = [
  {
    id: 'organization',
    source: path.join(tasksRoot, '015-organization-routes/evidence/capture_browser.mjs'),
    legacyTask: '015',
    legacyFixture: '015-organization-routes',
    ports: [8150, 8151, 8152],
  },
  {
    id: 'administration',
    source: path.join(tasksRoot, '016-administration-routes/evidence/capture_browser.mjs'),
    legacyTask: '016',
    legacyFixture: '016-administration-routes',
    ports: [8160, 8161, 8162],
  },
  {
    id: 'user-auth',
    source: path.join(tasksRoot, '017-user-auth-routes/evidence/capture_browser.mjs'),
    legacyTask: '017',
    legacyFixture: '017-user-auth-routes',
    ports: [8170, 8171, 8172],
  },
];

async function listFiles(root, relativeRoot = '') {
  const entries = await readdir(path.join(root, relativeRoot), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeRoot, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
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
      (file.startsWith('src/') ||
        file === 'index.html' ||
        file === 'package.json' ||
        file === 'pnpm-lock.yaml' ||
        file === 'vite.config.ts' ||
        file === 'tsconfig.json') &&
      !file.includes('/__snapshots__/'),
  );
  return {
    production: await digestTree(productionRoot, productionFiles),
    prototype: await digestTree(prototypeRoot),
  };
}

async function probePortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}

async function waitForPortFree(port) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (await probePortFree(port)) return;
    await sleep(50);
  }
  throw new Error(`Port ${port} remains occupied after capture cleanup`);
}

async function runNode(scriptPath, env) {
  const child = spawn(process.execPath, [scriptPath], {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  const result = await new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  assert.deepEqual(result, { code: 0, signal: null }, `${scriptPath} failed`);
}

function replaceExactly(source, search, replacement, label) {
  const matches =
    typeof search === 'string'
      ? source.split(search).length - 1
      : [...source.matchAll(new RegExp(search.source, search.flags.includes('g') ? search.flags : `${search.flags}g`))]
          .length;
  assert.equal(matches, 1, `${label}: expected one transformation anchor, found ${matches}`);
  return source.replace(search, replacement);
}

function transformCapture(source, group) {
  const legacyRunId = `TASK${group.legacyTask}_RUN_ID`;
  assert.ok(source.includes(legacyRunId), `${group.id}: missing legacy run ID anchor`);
  assert.ok(source.includes(group.legacyFixture), `${group.id}: missing legacy fixture anchor`);

  let transformed = replaceExactly(
    source,
    'const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));',
    "const evidenceRoot = process.env.TASK019_EVIDENCE_ROOT;\nassert.ok(evidenceRoot, 'TASK019_EVIDENCE_ROOT');",
    `${group.id}: evidence root`,
  );
  transformed = replaceExactly(
    transformed,
    'const runId = randomUUID();',
    "const runId = process.env.TASK019_RUN_ID;\nassert.ok(runId, 'TASK019_RUN_ID');",
    `${group.id}: run ID`,
  )
    .replaceAll(legacyRunId, 'TASK019_RUN_ID')
    .replaceAll(group.legacyFixture, fixture);

  transformed = replaceExactly(
    transformed,
    /async function stopChild\(child\) \{[\s\S]*?\n\}\n\nclass CdpClient/,
    `async function stopChild(child) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  child.kill('SIGTERM');
  for (let index = 0; index < 60 && child.exitCode == null && child.signalCode == null; index += 1) {
    await sleep(50);
  }
  if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL');
  for (let index = 0; index < 60 && child.exitCode == null && child.signalCode == null; index += 1) {
    await sleep(50);
  }
  if (child.exitCode == null && child.signalCode == null) {
    throw new Error(\`Child process \${child.pid ?? 'unknown'} did not exit after SIGKILL\`);
  }
}

class CdpClient`,
    `${group.id}: bounded cleanup`,
  );
  transformed = replaceExactly(
    transformed,
    "args: [path.join(evidenceRoot, 'mock_api.py')],",
    `args: [path.join(evidenceRoot, 'mock_api.py'), '--port', '${group.ports[2]}'],`,
    `${group.id}: mock API port`,
  );
  if (group.id === 'administration') {
    transformed = replaceExactly(
      transformed,
      '/3\\.9\\.0-task016/i',
      '/3\\.9\\.0-task019/i',
      `${group.id}: version assertion`,
    );
  }
  if (!transformed.includes('terminalPath:')) {
    transformed = replaceExactly(
      transformed,
      'terminalRouteName: router?.currentRoute.value.name ?? null,',
      'terminalRouteName: router?.currentRoute.value.name ?? null,\n        terminalPath: router?.currentRoute.value.fullPath ?? location.hash.slice(1),',
      `${group.id}: terminal path`,
    );
  }
  transformed = replaceExactly(
    transformed,
    'for (const service of services.toReversed()) await stopChild(service);',
    'for (let index = services.length - 1; index >= 0; index -= 1) await stopChild(services[index]);',
    `${group.id}: reverse cleanup`,
  );
  assert.ok(transformed.includes('TASK019_EVIDENCE_ROOT'), `${group.id}: evidence-root postcondition`);
  assert.ok(transformed.includes('TASK019_RUN_ID'), `${group.id}: run-ID postcondition`);
  assert.ok(!transformed.includes(legacyRunId), `${group.id}: legacy run ID remained`);
  assert.ok(!transformed.includes(group.legacyFixture), `${group.id}: legacy fixture remained`);
  assert.ok(transformed.includes(`'--port', '${group.ports[2]}'`), `${group.id}: mock API port postcondition`);
  assert.ok(transformed.includes('did not exit after SIGKILL'), `${group.id}: cleanup postcondition`);
  assert.ok(transformed.includes('terminalPath:'), `${group.id}: terminal-path postcondition`);
  assert.ok(!transformed.includes('.toReversed()'), `${group.id}: unsupported reverse remained`);
  return transformed;
}

async function clearPreviousEvidence() {
  for (const file of await readdir(evidenceRoot)) {
    if (
      /^(?:production|prototype)-.+\.(?:json|png)$/.test(file) ||
      /^group-.+-summary\.json$/.test(file) ||
      file === 'browser-replay-summary.json'
    ) {
      await unlink(path.join(evidenceRoot, file));
    }
  }
}

await clearPreviousEvidence();
const identityBefore = await sourceIdentity();
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'task019-capture-'));
const groupSummaries = [];

try {
  for (const group of groups) {
    const source = await readFile(group.source, 'utf8');
    const temporaryScript = path.join(temporaryRoot, `${group.id}.mjs`);
    await writeFile(temporaryScript, transformCapture(source, group));
    await runNode(temporaryScript, {
      TASK019_EVIDENCE_ROOT: evidenceRoot,
      TASK019_RUN_ID: runId,
    });

    const groupSummary = JSON.parse(await readFile(path.join(evidenceRoot, 'browser-replay-summary.json'), 'utf8'));
    assert.equal(groupSummary.ok, true, `${group.id}: summary`);
    assert.equal(groupSummary.runId, runId, `${group.id}: run ID`);
    groupSummaries.push({ id: group.id, ...groupSummary });
    await writeFile(
      path.join(evidenceRoot, `group-${group.id}-summary.json`),
      `${JSON.stringify(groupSummary, null, 2)}\n`,
    );
    for (const port of group.ports) await waitForPortFree(port);
  }

  const identityAfter = await sourceIdentity();
  assert.deepEqual(identityAfter, identityBefore, 'Production or prototype bytes changed during capture');

  const files = await readdir(evidenceRoot);
  const measurementFiles = files.filter((file) => /^(?:production|prototype)-.+\.json$/.test(file)).sort();
  const screenshotFiles = files.filter((file) => /^(?:production|prototype)-.+\.png$/.test(file)).sort();
  assert.equal(measurementFiles.length, 92);
  assert.equal(screenshotFiles.length, 92);

  const measurements = await Promise.all(
    measurementFiles.map(async (file) => JSON.parse(await readFile(path.join(evidenceRoot, file), 'utf8'))),
  );
  const failedStates = measurements
    .filter(
      (measurement) =>
        measurement.runId !== runId ||
        measurement.pageLevelHorizontalOverflow ||
        measurement.rawI18nKeys.length > 0 ||
        measurement.contentAssertions.some((assertion) => !assertion.passed) ||
        Object.values(measurement.health).some((entries) => entries.length > 0),
    )
    .map((measurement) => measurement.stateId)
    .sort();

  const summary = {
    schema: 'woodpecker.route-family-browser-replay.v1',
    ok: failedStates.length === 0,
    runId,
    serviceIdentity: { fixture, runId },
    sourceIdentity: identityBefore,
    states: measurements.length,
    productionStates: measurements.filter((measurement) => measurement.surface === 'production').length,
    prototypeStates: measurements.filter((measurement) => measurement.surface === 'prototype').length,
    rows: [...new Set(measurements.map((measurement) => measurement.row))].sort((left, right) => left - right),
    stateIds: measurements.map((measurement) => measurement.stateId).sort(),
    failedStates,
    groupSummaries: groupSummaries.map(({ id, states, productionStates, prototypeStates, rows }) => ({
      id,
      states,
      productionStates,
      prototypeStates,
      rows,
    })),
    generatedAt: new Date().toISOString(),
  };
  await writeFile(path.join(evidenceRoot, 'browser-replay-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary));
  if (!summary.ok) process.exitCode = 1;
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
