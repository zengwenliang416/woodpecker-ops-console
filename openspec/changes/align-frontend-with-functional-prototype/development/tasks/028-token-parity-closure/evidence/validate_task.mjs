#!/usr/bin/env node

/**
 * Task 028 full validation gate: token-parity regressions, light/dark spot
 * check, full Vitest, Prettier, ESLint, Vue TypeScript, Vite build, syntax
 * checks, and git diff --check. Fails closed on the first failing command.
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

// 1. Focused token-parity regressions.
const vitestEntry = path.join(webRoot, 'node_modules/vitest/vitest.mjs');
run('node', [vitestEntry, 'run', 'src/regression/tokens/'], { cwd: webRoot, label: 'Token-parity Vitest' });

// 2. Light/dark browser spot check.
run('node', [path.join(evidenceRoot, 'spot_check.mjs')], { label: 'Light/dark spot check' });

// 2.5. Normalize the generated spot-check JSON to the project Prettier style.
run(
  path.join(webRoot, 'node_modules/.bin/prettier'),
  ['--write', 'light-dark-spot-summary.json', 'light-dark-spot-measurements.json'],
  { cwd: evidenceRoot, label: 'Normalize spot-check JSON' },
);

// 3. Full frontend Vitest.
run('node', [vitestEntry, 'run', '--reporter=dot'], { cwd: webRoot, label: 'Full frontend Vitest' });

// 4. Prettier over task-owned files.
const prettierFiles = [
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/028-token-parity-closure/*.md',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/028-token-parity-closure/*.json',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/028-token-parity-closure/evidence/*.mjs',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/028-token-parity-closure/evidence/*.json',
  'src/regression/tokens/*.ts',
  'src/style.css',
  'src/style/console.css',
  'src/style/prism.css',
  'src/views/deployments/DeploymentDetail.vue',
  'src/views/Login.vue',
  'src/components/atomic/Button.vue',
  'src/components/layout/header/ActivePipelines.vue',
  'src/views/infrastructure/InfrastructureOverview.vue',
  'src/compositions/useTheme.ts',
];
run(path.join(webRoot, 'node_modules/.bin/prettier'), ['--check', ...prettierFiles], {
  cwd: webRoot,
  label: 'Task 028 Prettier',
});

// 5. ESLint with zero warnings.
run(path.join(webRoot, 'node_modules/.bin/eslint'), ['--max-warnings', '0', '.'], {
  cwd: webRoot,
  label: 'ESLint',
});

// 6. Vue TypeScript.
run(path.join(webRoot, 'node_modules/.bin/vue-tsc'), ['--noEmit'], { cwd: webRoot, label: 'Vue TypeScript' });

// 7. Vite build.
run(path.join(webRoot, 'node_modules/.bin/vite'), ['build', '--base=/BASE_PATH'], {
  cwd: webRoot,
  label: 'Vite build',
});

// 8. JavaScript syntax and JSON parsing.
for (const file of readdirSync(evidenceRoot).filter((name) => name.endsWith('.mjs'))) {
  run('node', ['--check', path.join(evidenceRoot, file)], { label: `JavaScript syntax: ${file}` });
}
for (const file of [
  path.join(evidenceRoot, 'light-dark-spot-summary.json'),
  path.join(taskRoot, 'context.json'),
  path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype/development/task-graph.json'),
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

// 9. git diff --check.
run('git', ['diff', '--check'], { cwd: projectRoot, label: 'git diff --check' });

process.stdout.write('\nTask 028 validation gates all passed.\n');
