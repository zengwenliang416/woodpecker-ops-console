#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const verifier = path.join(evidenceRoot, 'verify_evidence.mjs');

async function runVerifier(root) {
  const child = spawn(process.execPath, [verifier], {
    env: { ...process.env, TASK020_EVIDENCE_ROOT: root },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
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
  {
    id: 'run-id',
    apply: (root) => mutateJson(root, 'production-dark-zh-desktop-overview.json', (value) => (value.runId = 'mutated')),
  },
  {
    id: 'wrong-theme',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-desktop-overview.json', (value) => (value.document.dataTheme = 'light')),
  },
  {
    id: 'wrong-locale',
    apply: (root) =>
      mutateJson(root, 'production-light-en-desktop-repos.json', (value) => (value.document.lang = 'zh-Hans')),
  },
  {
    id: 'tampered-content',
    apply: (root) => mutateJson(root, 'production-dark-zh-desktop-overview.json', (value) => (value.bodyText = '概览')),
  },
  {
    id: 'missing-state',
    apply: (root) => rm(path.join(root, 'production-dark-zh-mobile-overview.json')),
  },
  {
    id: 'wrong-role',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-desktop-overview-normal-user.json', (value) => (value.role = 'admin')),
  },
  {
    id: 'wrong-route',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-desktop-repos.json', (value) => (value.terminalPath = '/overview')),
  },
  {
    id: 'unhealthy-browser',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-desktop-overview.json', (value) =>
        value.health.consoleErrors.push('synthetic browser failure'),
      ),
  },
  {
    id: 'raw-i18n',
    apply: (root) =>
      mutateJson(root, 'production-light-en-desktop-overview.json', (value) =>
        value.rawI18nKeys.push('overview.partial_error_title'),
      ),
  },
  {
    id: 'raw-server-toast',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-desktop-overview-partial.json', (value) => {
        value.bodyText += '\nService Unavailable: {"error":"agents unavailable"}';
      }),
  },
  {
    id: 'normal-user-admin-request',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-desktop-overview-normal-user.json', (value) =>
        value.apiRequests.push('/api/agents?page=1'),
      ),
  },
  {
    id: 'unexpected-http-error',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-desktop-repos-partial.json', (value) =>
        value.health.unexpectedHttpErrors.push({ url: 'http://127.0.0.1:8200/api/user/repos', status: 500 }),
      ),
  },
  {
    id: 'horizontal-overflow',
    apply: (root) =>
      mutateJson(root, 'production-dark-zh-mobile-repos.json', (value) => (value.pageLevelHorizontalOverflow = true)),
  },
  {
    id: 'source-identity',
    apply: (root) =>
      mutateJson(root, 'manifest.json', (value) => (value.source_identity.production.digest = '0'.repeat(64))),
  },
  {
    id: 'png-signature',
    apply: async (root) => {
      const filePath = path.join(root, 'prototype-dark-zh-mobile-overview.png');
      const value = await readFile(filePath);
      value[0] = 0;
      await writeFile(filePath, value);
    },
  },
];

const results = [];
for (const mutation of mutations) {
  const root = await mkdtemp(path.join(tmpdir(), `task020-${mutation.id}-`));
  try {
    await cp(evidenceRoot, root, { recursive: true });
    await mutation.apply(root);
    const result = await runVerifier(root);
    results.push({ id: mutation.id, rejected: result.code !== 0 || result.signal !== null, ...result });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
assert.ok(
  results.every((result) => result.rejected),
  'all negative mutations must be rejected',
);

const summary = {
  schema: 'woodpecker.overview-repositories-verifier-redteam.v1',
  ok: true,
  positiveVerifierExitCode: positive.code,
  mutations: results,
  generatedAt: new Date().toISOString(),
};
await writeFile(path.join(evidenceRoot, 'redteam-verifier-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
