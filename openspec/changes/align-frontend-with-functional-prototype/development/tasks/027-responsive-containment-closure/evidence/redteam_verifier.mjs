#!/usr/bin/env node

/**
 * Task 027 persistent red-team: applies isolated mutations to the captured
 * evidence and proves the strict verifier rejects every one. Mutations are
 * applied to temporary copies and restored afterwards.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { states } from './matrix.mjs';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const verifierPath = path.join(evidenceRoot, 'verify_responsive.mjs');
const stateIds = states.map((state) => state.id);
const firstState = stateIds[0];
const jsonPath = path.join(evidenceRoot, `production-${firstState}.json`);
const pngPath = path.join(evidenceRoot, `production-${firstState}.png`);
const summaryPath = path.join(evidenceRoot, 'browser-replay-summary.json');

function runVerifier(cwd) {
  const result = spawnSync(process.execPath, [path.join(cwd, 'verify_responsive.mjs')], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0 && process.env.TASK027_REDTEAM_DEBUG === '1') {
    process.stderr.write(`[redteam verifier stderr] ${result.stderr.slice(0, 2000)}\n`);
  }
  return result.status;
}

async function withEvidenceCopy(fn) {
  const copy = await mkdtemp(path.join(tmpdir(), 'task027-redteam-'));
  try {
    for (const file of await readdir(evidenceRoot)) {
      if (/^(?:production-|browser-replay-summary\.|evidence-manifest\.)/.test(file)) {
        await cp(path.join(evidenceRoot, file), path.join(copy, file));
      }
    }
    // The verifier resolves its evidence root from its own script location, so
    // the script and its matrix must live inside the tampered copy.
    await cp(verifierPath, path.join(copy, 'verify_responsive.mjs'));
    await cp(path.join(evidenceRoot, 'matrix.mjs'), path.join(copy, 'matrix.mjs'));
    return await fn(copy);
  } finally {
    await rm(copy, { recursive: true, force: true });
  }
}

const mutations = [];

mutations.push({
  name: 'run-id-tamper',
  apply: async (cwd) => {
    const summary = JSON.parse(await readFile(path.join(cwd, 'browser-replay-summary.json'), 'utf8'));
    summary.runId = 'tampered-run-id';
    await writeFile(path.join(cwd, 'browser-replay-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  },
});

mutations.push({
  name: 'overflow-injected',
  apply: async (cwd) => {
    const json = JSON.parse(await readFile(path.join(cwd, path.basename(jsonPath)), 'utf8'));
    json.pageLevelHorizontalOverflow = true;
    json.overflowContributors = [{ tag: 'div', className: 'forged-overflow', id: '', right: 5000, width: 999 }];
    await writeFile(path.join(cwd, path.basename(jsonPath)), `${JSON.stringify(json, null, 2)}\n`);
  },
});

mutations.push({
  name: 'uncontained-dense-injected',
  apply: async (cwd) => {
    const json = JSON.parse(await readFile(path.join(cwd, path.basename(jsonPath)), 'utf8'));
    json.denseContainers = [
      ...(json.denseContainers ?? []),
      {
        tag: 'table',
        className: 'forged-table',
        clientWidth: 100,
        scrollWidth: 900,
        overflowX: 'visible',
        locallyScrollable: false,
      },
    ];
    await writeFile(path.join(cwd, path.basename(jsonPath)), `${JSON.stringify(json, null, 2)}\n`);
  },
});

mutations.push({
  name: 'raw-i18n-injected',
  apply: async (cwd) => {
    const json = JSON.parse(await readFile(path.join(cwd, path.basename(jsonPath)), 'utf8'));
    json.rawI18nKeys = ['ops.forged.untranslated'];
    await writeFile(path.join(cwd, path.basename(jsonPath)), `${JSON.stringify(json, null, 2)}\n`);
  },
});

mutations.push({
  name: 'health-injected',
  apply: async (cwd) => {
    const json = JSON.parse(await readFile(path.join(cwd, path.basename(jsonPath)), 'utf8'));
    json.health = {
      consoleMessages: [{ level: 'error', message: 'forged console error' }],
      runtimeExceptions: [],
      networkFailures: [],
      httpErrors: [],
    };
    await writeFile(path.join(cwd, path.basename(jsonPath)), `${JSON.stringify(json, null, 2)}\n`);
  },
});

mutations.push({
  name: 'png-corrupted',
  apply: async (cwd) => {
    const png = await readFile(path.join(cwd, path.basename(pngPath)));
    png[0] = 0;
    await writeFile(path.join(cwd, path.basename(pngPath)), png);
  },
});

mutations.push({
  name: 'viewport-tamper',
  apply: async (cwd) => {
    const json = JSON.parse(await readFile(path.join(cwd, path.basename(jsonPath)), 'utf8'));
    json.viewportId = 'mobile';
    await writeFile(path.join(cwd, path.basename(jsonPath)), `${JSON.stringify(json, null, 2)}\n`);
  },
});

mutations.push({
  name: 'state-count-tamper',
  apply: async (cwd) => {
    const summary = JSON.parse(await readFile(path.join(cwd, 'browser-replay-summary.json'), 'utf8'));
    summary.states = summary.states - 1;
    await writeFile(path.join(cwd, 'browser-replay-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  },
});

mutations.push({
  name: 'evidence-file-removed',
  apply: async (cwd) => {
    await rm(path.join(cwd, `production-${stateIds[stateIds.length - 1]}.json`), { force: true });
  },
});

// Baseline: the unmodified copy must PASS.
await withEvidenceCopy(async (cwd) => {
  assert.equal(runVerifier(cwd), 0, 'baseline verifier should pass');
});

const results = [];
for (const mutation of mutations) {
  const status = await withEvidenceCopy(async (cwd) => {
    await mutation.apply(cwd);
    return runVerifier(cwd);
  });
  results.push({ name: mutation.name, rejected: status !== 0 });
  assert.notEqual(status, 0, `mutation "${mutation.name}" was NOT rejected by the verifier`);
}

const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
console.log(`Red-team: baseline passed; ${results.length}/${results.length} mutations rejected.`);
console.log(
  JSON.stringify(
    { schema: 'woodpecker.task027-redteam.v1', runId: summary.runId, rejected: results.length, results },
    null,
    2,
  ),
);
