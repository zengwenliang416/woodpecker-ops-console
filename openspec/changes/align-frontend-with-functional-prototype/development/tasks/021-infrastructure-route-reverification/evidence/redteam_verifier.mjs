#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const verifier = path.join(evidenceRoot, 'verify_evidence.mjs');
const summaryPath = process.env.TASK021_REDTEAM_SUMMARY ?? path.join(evidenceRoot, 'redteam-verifier-summary.json');

async function runVerifier(root) {
  const child = spawn(process.execPath, [verifier], {
    env: { ...process.env, TASK021_EVIDENCE_ROOT: root },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
}

async function mutateJson(root, file, mutation) {
  const filePath = path.join(root, file);
  const value = JSON.parse(await readFile(filePath, 'utf8'));
  mutation(value);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const positive = await runVerifier(evidenceRoot);
assert.deepEqual(positive, { code: 0, signal: null }, 'positive verifier');

const mutations = [
  ['run-id', 'production-dark-zh-desktop-overview.json', (value) => (value.runId = 'mutated')],
  ['wrong-theme', 'production-dark-zh-desktop-overview.json', (value) => (value.document.dataTheme = 'light')],
  ['wrong-locale', 'production-light-en-desktop-alerts.json', (value) => (value.document.lang = 'zh-Hans')],
  ['tampered-content', 'production-dark-zh-desktop-serverMonitoring.json', (value) => (value.bodyText = '基础设施')],
  ['wrong-role', 'production-dark-zh-desktop-serverSettings-normal-user.json', (value) => (value.role = 'admin')],
  [
    'admin-control',
    'production-dark-zh-desktop-serverSettings-normal-user.json',
    (value) => (value.deleteControlCount = 1),
  ],
  ['wrong-route', 'production-dark-zh-mobile-groups.json', (value) => (value.terminalPath = '/infrastructure')],
  [
    'unhealthy-browser',
    'production-light-en-desktop-services.json',
    (value) => value.health.consoleErrors.push({ message: 'synthetic failure' }),
  ],
  ['raw-i18n', 'production-light-en-desktop-overview.json', (value) => value.rawI18nKeys.push('ops.bad.key')],
  [
    'horizontal-overflow',
    'production-dark-zh-mobile-alerts.json',
    (value) => (value.pageLevelHorizontalOverflow = true),
  ],
  [
    'unexpected-http-error',
    'production-dark-zh-desktop-groups.json',
    (value) => value.health.unexpectedHttpErrors.push({ status: 500 }),
  ],
  ['source-identity', 'manifest.json', (value) => (value.source_identity.production.digest = '0'.repeat(64))],
];

const results = [];
for (const [id, file, mutation] of mutations) {
  const root = await mkdtemp(path.join(tmpdir(), `task021-${id}-`));
  try {
    await cp(evidenceRoot, root, { recursive: true });
    await mutateJson(root, file, mutation);
    const result = await runVerifier(root);
    results.push({ id, rejected: result.code !== 0 || result.signal !== null, ...result });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const pngRoot = await mkdtemp(path.join(tmpdir(), 'task021-png-'));
try {
  await cp(evidenceRoot, pngRoot, { recursive: true });
  const pngPath = path.join(pngRoot, 'prototype-dark-zh-mobile-overview.png');
  const png = await readFile(pngPath);
  png[0] = 0;
  await writeFile(pngPath, png);
  const result = await runVerifier(pngRoot);
  results.push({ id: 'png-signature', rejected: result.code !== 0 || result.signal !== null, ...result });
} finally {
  await rm(pngRoot, { recursive: true, force: true });
}

assert.ok(
  results.every((result) => result.rejected),
  'all mutations must be rejected',
);
const summary = {
  schema: 'woodpecker.infrastructure-verifier-redteam.v1',
  ok: true,
  positiveVerifierExitCode: positive.code,
  mutations: results,
  generatedAt: new Date().toISOString(),
};
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
