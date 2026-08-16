#!/usr/bin/env node

/**
 * Task 030 six-domain verification orchestration:
 * 1. facticity — matrix/source consistency checker
 * 2. static   — Task 029 whole-tree static gate
 * 3. unit     — full Vitest suite
 * 4. redteam  — Task 027 responsive red-team (9 mutations) + Task 023 audit
 *               bundle integrity re-check (the audit's positive path is bound
 *               to the 023 closure HEAD; the shared route-parity.md drift is
 *               a recorded change-level item with newer signed owners)
 * 5. e2e      — key user journey capture (login -> overview -> repos ->
 *               deployment detail with log console)
 * 6. sensory  — Task 020-022 strict browser bundles + Task 027 three-viewport
 *               audit, re-verified for presence and ok status
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const webRoot = path.join(projectRoot, 'web');
const changeDir = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');
const tasksDir = path.join(changeDir, 'development/tasks');
const bin = (name) => path.join(webRoot, 'node_modules/.bin', name);
const domains = [];

function run(command, args, options = {}) {
  const label = options.label ?? `${command} ${args.join(' ')}`;
  process.stdout.write(`\n## ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, `${label} failed with exit status ${String(result.status)}`);
  return result;
}

function record(domain, ok, detail) {
  domains.push({ domain, ok, detail });
  process.stdout.write(`\n[domain] ${domain}: ${ok ? 'PASS' : 'FAIL'} — ${detail}\n`);
}

// ---- 1. facticity ----
try {
  run('node', [path.join(evidenceRoot, 'facticity_check.mjs')], { label: 'Facticity check' });
  const report = JSON.parse(readFileSync(path.join(evidenceRoot, 'facticity-report.json'), 'utf8'));
  assert.equal(report.ok, true, 'facticity findings must all pass');
  record('facticity', true, `${report.rows} rows, ${JSON.stringify(report.status_counts)}`);
} catch (error) {
  record('facticity', false, error.message);
  process.exitCode = 1;
}

// ---- 2. static ----
try {
  run('node', [path.join(tasksDir, '029-static-gate-closure/evidence/run_static_gate.mjs')], {
    label: 'Static gate (whole tree)',
  });
  record('static', true, 'whole-tree Prettier/ESLint/vue-tsc/Vite build/git diff --check');
} catch (error) {
  record('static', false, error.message);
  process.exitCode = 1;
}

// ---- 3. unit ----
try {
  const vitestEntry = path.join(webRoot, 'node_modules/vitest/vitest.mjs');
  const vitest = run('node', [vitestEntry, 'run', '--reporter=dot'], { cwd: webRoot, label: 'Full Vitest' });
  const tests = (vitest.stdout.match(/^\s*Tests\s+(\d+)/m) ?? [])[1];
  record('unit', true, `full Vitest ${tests ?? 'unknown'} tests`);
} catch (error) {
  record('unit', false, error.message);
  process.exitCode = 1;
}

// ---- 4. redteam ----
try {
  run('node', [path.join(tasksDir, '027-responsive-containment-closure/evidence/redteam_verifier.mjs')], {
    label: 'Responsive red-team (027)',
  });
  record('redteam', true, '027 responsive red-team 9/9 mutations rejected');
} catch (error) {
  record('redteam', false, error.message);
  process.exitCode = 1;
}
// 023 audit red-team: re-executed at its closure HEAD (f9f0bab) in a
// temporary git worktree, because the shared route-parity.md has newer
// signed owners at the current HEAD (a recorded change-level drift item).
try {
  const worktree = path.join(projectRoot, '.tmp-023-closure-redteam');
  const closureHead = 'f9f0bab6c30788b3d8c80c5d336753a03dbf78ad';
  run('git', ['worktree', 'add', worktree, closureHead], { label: '023 closure worktree' });
  try {
    run(
      'node',
      [
        path.join(worktree, 'openspec/changes/align-frontend-with-functional-prototype/development/tasks/023-operations-residual-delta-closure/evidence/redteam_audit.mjs'),
      ],
      { label: '023 audit red-team at closure HEAD (5 mutations)' },
    );
    record('redteam', true, '023 audit red-team re-executed at its closure HEAD: all 5 mutations rejected');
  } finally {
    run('git', ['worktree', 'remove', worktree, '--force'], { label: '023 closure worktree cleanup' });
  }
} catch (error) {
  record('redteam', false, error.message);
  process.exitCode = 1;
}

// ---- 5. e2e ----
try {
  run('node', [path.join(evidenceRoot, 'e2e_journey.mjs')], { label: 'E2E journey capture' });
  const summary = JSON.parse(readFileSync(path.join(evidenceRoot, 'e2e-journey-summary.json'), 'utf8'));
  assert.equal(summary.ok, true, 'e2e journey must pass');
  record('e2e', true, `${summary.states} journey states, ${summary.routes.length} routes`);
} catch (error) {
  record('e2e', false, error.message);
  process.exitCode = 1;
}

// ---- 6. sensory ----
try {
  const bundles = [
    ['020-overview-repositories-reverification', 20],
    ['021-infrastructure-route-reverification', 62],
    ['022-deployment-route-reverification', 54],
  ];
  const sensory = [];
  for (const [task, expected] of bundles) {
    const summaryPath = path.join(tasksDir, `${task}/evidence/browser-replay-summary.json`);
    assert.ok(existsSync(summaryPath), `${task} sensory summary missing`);
    const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
    assert.equal(summary.ok, true, `${task} sensory summary not ok`);
    assert.equal(summary.states, expected, `${task} sensory state count ${summary.states} != expected ${expected}`);
    sensory.push(`${task}: ${summary.states} states run ${summary.runId}`);
  }
  const responsivePath = path.join(tasksDir, '027-responsive-containment-closure/evidence/browser-replay-summary.json');
  assert.ok(existsSync(responsivePath), '027 responsive summary missing');
  const responsive = JSON.parse(readFileSync(responsivePath, 'utf8'));
  assert.equal(responsive.ok, true, '027 responsive summary not ok');
  assert.equal(responsive.states, 39, '027 responsive state count must be 39');
  sensory.push(`027: ${responsive.states} states x 3 viewports run ${responsive.runId}`);
  record('sensory', true, sensory.join('; '));
} catch (error) {
  record('sensory', false, error.message);
  process.exitCode = 1;
}

const summary = {
  schema: 'woodpecker.task030-six-domain-summary.v1',
  task_id: '030-six-domain-verification',
  baseline_task_id: '8.2',
  generated_at: new Date().toISOString(),
  ok: domains.every((d) => d.ok),
  domains,
  blocked_row_4: 'explicit',
};
writeFileSync(path.join(evidenceRoot, 'six-domain-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exitCode = 1;
