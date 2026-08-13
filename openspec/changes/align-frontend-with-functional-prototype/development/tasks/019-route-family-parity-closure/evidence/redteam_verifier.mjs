#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const verifierPath = path.join(evidenceRoot, 'verify_evidence.mjs');
const targetName = 'production-dark-zh-desktop-login.json';

async function runVerifier(root) {
  const child = spawn(process.execPath, [verifierPath], {
    cwd: path.resolve(evidenceRoot, '../../../../../../..'),
    env: { ...process.env, TASK019_EVIDENCE_ROOT: root },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const result = await new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  return { ...result, stdout, stderr };
}

async function mutateJson(root, fileName, mutate) {
  const filePath = path.join(root, fileName);
  const value = JSON.parse(await readFile(filePath, 'utf8'));
  mutate(value);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const mutations = [
  {
    id: 'wrong-theme',
    apply: (root) => mutateJson(root, targetName, (value) => (value.document.theme = 'light')),
  },
  {
    id: 'wrong-locale',
    apply: (root) => mutateJson(root, targetName, (value) => (value.document.lang = 'en')),
  },
  {
    id: 'tampered-body-text',
    apply: (root) =>
      mutateJson(root, targetName, (value) => {
        value.bodyText = 'tampered content';
        value.bodyTextSample = value.bodyText;
      }),
  },
  {
    id: 'empty-content-assertions',
    apply: (root) => mutateJson(root, targetName, (value) => (value.contentAssertions = [])),
  },
  {
    id: 'missing-content-assertions',
    apply: (root) =>
      mutateJson(root, targetName, (value) => {
        delete value.contentAssertions;
      }),
  },
  {
    id: 'empty-health',
    apply: (root) => mutateJson(root, targetName, (value) => (value.health = {})),
  },
  {
    id: 'missing-health-key',
    apply: (root) =>
      mutateJson(root, targetName, (value) => {
        delete value.health.httpErrors;
      }),
  },
  {
    id: 'wrong-terminal-path',
    apply: (root) => mutateJson(root, targetName, (value) => (value.terminalPath = '/wrong')),
  },
  {
    id: 'wrong-terminal-route',
    apply: (root) => mutateJson(root, targetName, (value) => (value.terminalRouteName = 'wrong')),
  },
  {
    id: 'horizontal-overflow',
    apply: (root) => mutateJson(root, targetName, (value) => (value.pageLevelHorizontalOverflow = true)),
  },
  {
    id: 'source-identity',
    apply: (root) =>
      mutateJson(root, 'browser-replay-summary.json', (value) => {
        value.sourceIdentity.production.digest = '0'.repeat(64);
      }),
  },
  {
    id: 'png-signature',
    apply: async (root) => {
      const filePath = path.join(root, targetName.replace(/\.json$/, '.png'));
      const value = await readFile(filePath);
      value[1] = 0;
      await writeFile(filePath, value);
    },
  },
  {
    id: 'png-dimension',
    apply: async (root) => {
      const filePath = path.join(root, targetName.replace(/\.json$/, '.png'));
      const value = await readFile(filePath);
      value.writeUInt32BE(1599, 16);
      await writeFile(filePath, value);
    },
  },
  {
    id: 'run-id',
    apply: (root) => mutateJson(root, targetName, (value) => (value.runId = 'mutated-run-id')),
  },
];

const positive = await runVerifier(evidenceRoot);
assert.deepEqual(
  { code: positive.code, signal: positive.signal },
  { code: 0, signal: null },
  `positive verifier failed\n${positive.stdout}\n${positive.stderr}`,
);

const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'task019-redteam-'));
const results = [];

try {
  for (const mutation of mutations) {
    const caseRoot = path.join(temporaryRoot, mutation.id);
    try {
      await cp(evidenceRoot, caseRoot, {
        recursive: true,
        filter: (source) => !source.endsWith('redteam-verifier-summary.json'),
      });
      await mutation.apply(caseRoot);
      const result = await runVerifier(caseRoot);
      assert.notEqual(
        result.code,
        0,
        `${mutation.id}: verifier accepted mutated evidence\n${result.stdout}\n${result.stderr}`,
      );
      results.push({ id: mutation.id, rejected: true, exitCode: result.code, signal: result.signal });
    } finally {
      await rm(caseRoot, { recursive: true, force: true });
    }
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

const summary = {
  schema: 'woodpecker.route-family-verifier-redteam.v1',
  ok: true,
  positiveVerifierExitCode: positive.code,
  mutations: results,
  generatedAt: new Date().toISOString(),
};
await writeFile(path.join(evidenceRoot, 'redteam-verifier-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
