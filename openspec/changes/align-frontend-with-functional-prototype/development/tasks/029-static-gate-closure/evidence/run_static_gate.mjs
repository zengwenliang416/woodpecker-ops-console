#!/usr/bin/env node

/**
 * Task 029 consolidated static gate: whole-tree Prettier, ESLint with zero
 * warnings, Vue TypeScript, full Vitest, Vite build, and git diff --check.
 * Fails closed on the first non-zero exit and writes a gate receipt.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const webRoot = path.join(projectRoot, 'web');
const taskRoot = path.dirname(evidenceRoot);
const bin = (name) => path.join(webRoot, 'node_modules/.bin', name);

const results = [];
function run(command, args, options = {}) {
  const label = options.label ?? `${command} ${args.join(' ')}`;
  process.stdout.write(`\n## ${label}\n`);
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    maxBuffer: 256 * 1024 * 1024,
  });
  const durationMs = Date.now() - started;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  results.push({ label, ok: result.status === 0, durationMs, exitStatus: result.status });
  assert.equal(result.status, 0, `${label} failed with exit status ${String(result.status)}`);
  return result;
}

// 1. Whole-tree Prettier check.
run(bin('prettier'), ['-c', '.'], { cwd: webRoot, label: 'Prettier (whole web tree)' });

// 2. ESLint with zero warnings.
run(bin('eslint'), ['--max-warnings', '0', '.'], { cwd: webRoot, label: 'ESLint (whole web tree)' });

// 3. Vue TypeScript.
run(bin('vue-tsc'), ['--noEmit'], { cwd: webRoot, label: 'Vue TypeScript' });

// 4. Full Vitest.
const vitestEntry = path.join(webRoot, 'node_modules/vitest/vitest.mjs');
const vitest = run('node', [vitestEntry, 'run', '--reporter=dot'], { cwd: webRoot, label: 'Full Vitest' });
const tests = (vitest.stdout.match(/^\s*Tests\s+(\d+)/m) ?? [])[1];
const files = (vitest.stdout.match(/^\s*Test Files\s+(\d+)/m) ?? [])[1];
assert.ok(tests, 'vitest summary did not report a test count');

// 5. Vite production build.
run(bin('vite'), ['build', '--base=/BASE_PATH'], { cwd: webRoot, label: 'Vite build' });

// 6. git diff --check.
run('git', ['diff', '--check'], { cwd: projectRoot, label: 'git diff --check' });

const receipt = {
  schema: 'specnav.task029-static-gate-receipt.v1',
  task_id: '029-static-gate-closure',
  baseline_task_id: '8.1',
  generated_at: new Date().toISOString(),
  ok: true,
  full_vitest: { files, tests },
  gates: results,
};
const receiptPath = path.join(evidenceRoot, 'static-gate-receipt.json');
writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`\nStatic gate receipt written: ${receiptPath}\n`);
