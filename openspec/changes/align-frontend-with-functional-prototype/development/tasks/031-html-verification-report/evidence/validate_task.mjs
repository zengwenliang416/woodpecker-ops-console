#!/usr/bin/env node

/** Task 031 full gate: generator, self-check, browser spot check, Prettier,
 *  JSON validation, git diff --check. Fails closed. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const webRoot = path.join(projectRoot, 'web');
const changeDir = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');

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

// 1. Generate the report.
run('node', [path.join(evidenceRoot, 'build_html_report.mjs')], { label: 'Generate HTML report' });

// 2. Browser spot check.
run('node', [path.join(evidenceRoot, 'spot_check_report.mjs')], { label: 'Report browser spot check' });

// 3. JSON validity of model + manifest + summaries.
for (const file of [
  path.join(changeDir, 'verify/v2/report-model.json'),
  path.join(changeDir, 'verify/v2/report-render-manifest.json'),
  path.join(evidenceRoot, 'report-spot-check-summary.json'),
]) {
  JSON.parse(readFileSync(file, 'utf8'));
}
run('node', ['--check', path.join(evidenceRoot, 'build_html_report.mjs')], {
  label: 'JS syntax: build_html_report.mjs',
});
run('node', ['--check', path.join(evidenceRoot, 'spot_check_report.mjs')], {
  label: 'JS syntax: spot_check_report.mjs',
});

// 4. Prettier over task-owned files.
run(
  path.join(webRoot, 'node_modules/.bin/prettier'),
  [
    '--check',
    '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/031-html-verification-report/*.md',
    '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/031-html-verification-report/*.json',
    '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/031-html-verification-report/evidence/*.mjs',
    '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/031-html-verification-report/evidence/*.json',
  ],
  { cwd: webRoot, label: 'Task 031 Prettier' },
);

// 5. git diff --check.
run('git', ['diff', '--check'], { cwd: projectRoot, label: 'git diff --check' });

process.stdout.write('\nTask 031 validation gates all passed.\n');
