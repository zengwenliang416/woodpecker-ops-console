#!/usr/bin/env node

/**
 * Task 027 full validation gate: responsive capture, strict verifier,
 * persistent red-team, full Vitest, Prettier, ESLint, Vue TypeScript, Vite
 * build, syntax/JSON checks, and git diff --check. Fails closed on the first
 * failing command.
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

// 1. Browser audit (39 states x 3 viewports).
run('node', [path.join(evidenceRoot, 'capture_responsive.mjs')], { label: 'Responsive capture (39 states)' });

// 1.5. Normalize the capture-generated summary/manifest to the project
// Prettier style (short arrays collapsed) so the check below is deterministic.
run(
  path.join(webRoot, 'node_modules/.bin/prettier'),
  ['--write', 'browser-replay-summary.json', 'evidence-manifest.json'],
  { cwd: evidenceRoot, label: 'Normalize generated evidence JSON' },
);

// 2. Strict verifier.
run('node', [path.join(evidenceRoot, 'verify_responsive.mjs')], { label: 'Strict responsive verifier' });

// 3. Persistent red-team.
run('node', [path.join(evidenceRoot, 'redteam_verifier.mjs')], { label: 'Responsive red-team' });

// 4. Full frontend Vitest (the regression suite runs inside the full suite).
const vitestEntry = path.join(webRoot, 'node_modules/vitest/vitest.mjs');
run('node', [vitestEntry, 'run', '--reporter=dot'], { cwd: webRoot, label: 'Full frontend Vitest' });

// 5. Prettier over task-owned files.
const prettierFiles = [
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/*.md',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/*.json',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/evidence/*.mjs',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/evidence/*.json',
  'src/views/Repos.vue',
  'src/components/agent/AgentList.vue',
];
run(path.join(webRoot, 'node_modules/.bin/prettier'), ['--check', ...prettierFiles], {
  cwd: webRoot,
  label: 'Task 027 Prettier',
});

// 6. ESLint with zero warnings.
run(path.join(webRoot, 'node_modules/.bin/eslint'), ['--max-warnings', '0', '.'], {
  cwd: webRoot,
  label: 'ESLint',
});

// 7. Vue TypeScript.
run(path.join(webRoot, 'node_modules/.bin/vue-tsc'), ['--noEmit'], { cwd: webRoot, label: 'Vue TypeScript' });

// 8. Vite build.
run(path.join(webRoot, 'node_modules/.bin/vite'), ['build', '--base=/BASE_PATH'], {
  cwd: webRoot,
  label: 'Vite build',
});

// 9. JavaScript syntax and JSON/JSONL parsing.
for (const file of readdirSync(evidenceRoot).filter((name) => name.endsWith('.mjs'))) {
  run('node', ['--check', path.join(evidenceRoot, file)], { label: `JavaScript syntax: ${file}` });
}
for (const file of [
  path.join(evidenceRoot, 'browser-replay-summary.json'),
  path.join(evidenceRoot, 'evidence-manifest.json'),
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

// 10. git diff --check.
run('git', ['diff', '--check'], { cwd: projectRoot, label: 'git diff --check' });

process.stdout.write('\nTask 027 validation gates all passed.\n');
