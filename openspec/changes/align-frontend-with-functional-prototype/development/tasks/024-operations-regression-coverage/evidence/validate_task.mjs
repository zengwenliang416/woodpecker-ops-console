#!/usr/bin/env node

/**
 * Task 024 full validation gate: regression receipt, coverage resolution,
 * Prettier, ESLint, Vue TypeScript, Vite build, JavaScript syntax checks, JSON
 * parsing, and git diff --check. Fails closed on the first failing command.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const webRoot = path.join(projectRoot, 'web');
const taskRoot = path.dirname(evidenceRoot);

function run(command, args, options = {}) {
  const label = options.label ?? `${command} ${args.join(' ')}`;
  process.stdout.write(`\n## ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, `${label} failed with exit status ${String(result.status)}`);
  return result;
}

// 1. Regression receipt and coverage resolution (focused + full Vitest).
run('node', [path.join(evidenceRoot, 'run_regressions.mjs')], {
  label: 'Regression receipt (coverage + focused + full Vitest)',
});

const receipt = JSON.parse(readFileSync(path.join(evidenceRoot, 'regression-receipt.json'), 'utf8'));
assert.equal(receipt.resolved_behaviors, receipt.behavior_count, 'coverage map did not fully resolve');

// 2. Prettier over the task-owned files.
const prettierFiles = [
  'src/regression/operations/*.test.ts',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/024-operations-regression-coverage/*.md',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/024-operations-regression-coverage/*.json',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/024-operations-regression-coverage/evidence/*.mjs',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/024-operations-regression-coverage/evidence/*.json',
];
run(path.join(webRoot, 'node_modules/.bin/prettier'), ['--check', ...prettierFiles], {
  cwd: webRoot,
  label: 'Task 024 Prettier',
});

// 3. ESLint with zero warnings allowed.
run(path.join(webRoot, 'node_modules/.bin/eslint'), ['--max-warnings', '0', '.'], {
  cwd: webRoot,
  label: 'ESLint',
});

// 4. Vue TypeScript.
run(path.join(webRoot, 'node_modules/.bin/vue-tsc'), ['--noEmit'], {
  cwd: webRoot,
  label: 'Vue TypeScript',
});

// 5. Vite build.
run(path.join(webRoot, 'node_modules/.bin/vite'), ['build', '--base=/BASE_PATH'], {
  cwd: webRoot,
  label: 'Vite build',
});

// 6. JavaScript syntax and JSON/JSONL parsing.
for (const file of readdirSync(evidenceRoot).filter((name) => name.endsWith('.mjs'))) {
  run('node', ['--check', path.join(evidenceRoot, file)], { label: `JavaScript syntax: ${file}` });
}
for (const file of [
  path.join(evidenceRoot, 'behavior-coverage.json'),
  path.join(evidenceRoot, 'regression-receipt.json'),
  path.join(taskRoot, 'context.json'),
  path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype/development/task-graph.json'),
  path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype/codegraph/claims-map.json'),
  path.join(
    projectRoot,
    'openspec/changes/align-frontend-with-functional-prototype/codegraph/evidence-query-plan.json',
  ),
]) {
  JSON.parse(readFileSync(file, 'utf8'));
}
for (const file of [
  path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype/development/task-context.jsonl'),
  path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype/development/task-ledger.jsonl'),
  path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype/development/validation-log.jsonl'),
]) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (line.trim()) JSON.parse(line);
  }
}

// 7. git diff --check for whitespace errors in the working tree.
run('git', ['diff', '--check'], { cwd: projectRoot, label: 'git diff --check' });

process.stdout.write('\nTask 024 validation gates all passed.\n');
