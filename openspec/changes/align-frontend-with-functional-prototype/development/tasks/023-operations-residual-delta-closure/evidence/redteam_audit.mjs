#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const audit = path.join(evidenceRoot, 'audit_residuals.mjs');

function run(mutation) {
  const result = spawnSync(process.execPath, [audit], {
    encoding: 'utf8',
    env: {
      ...process.env,
      TASK023_AUDIT_MUTATION: JSON.stringify(mutation),
    },
  });
  return {
    id: mutation.id,
    rejected: result.status !== 0 || result.signal !== null,
    code: result.status,
    signal: result.signal,
  };
}

const positive = spawnSync(process.execPath, [audit], {
  encoding: 'utf8',
  env: process.env,
});
assert.equal(positive.status, 0, 'positive audit must pass');

const mutations = [
  {
    id: 'unapproved-acceptance',
    type: 'acceptance-status',
    taskId: '020-overview-repositories-reverification',
    value: 'blocked',
  },
  {
    id: 'missing-evidence-artifact',
    type: 'missing-artifact',
    taskId: '021-infrastructure-route-reverification',
    path: 'evidence/manifest.json',
  },
  {
    id: 'verified-row-regression',
    type: 'route-status',
    row: 58,
    value: 'planned',
  },
  {
    id: 'blocked-row-incorrectly-closed',
    type: 'route-status',
    row: 4,
    value: 'verified',
  },
  {
    id: 'accepted-object-drift',
    type: 'object-drift',
    path: 'web/src/views/Overview.vue',
  },
];

const results = mutations.map(run);
assert.ok(
  results.every((entry) => entry.rejected),
  'all audit mutations must be rejected',
);

process.stdout.write(
  `${JSON.stringify(
    {
      schema: 'woodpecker.operations-residual-audit-redteam.v1',
      ok: true,
      positiveAuditExitCode: positive.status,
      mutations: results,
    },
    null,
    2,
  )}\n`,
);
