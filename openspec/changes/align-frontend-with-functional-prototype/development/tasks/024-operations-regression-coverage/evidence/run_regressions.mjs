#!/usr/bin/env node

/**
 * Task 024 regression runner: resolves the behavior-to-test coverage map,
 * re-runs the complete operations-focused Vitest surface plus the consolidated
 * regression suite, runs the full frontend Vitest suite, and writes a JSON
 * receipt. Fails closed when a mapped test file is missing, a mapped behavior
 * has no resolvable test reference, or any command fails.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const webRoot = path.join(projectRoot, 'web');
const taskRoot = path.dirname(evidenceRoot);
const receiptPath = path.join(evidenceRoot, 'regression-receipt.json');

const coveragePath = path.join(evidenceRoot, 'behavior-coverage.json');
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));

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

function vitestArgs(files) {
  return ['run', '--reporter=dot', ...files];
}

// 1. Coverage resolution: every behavior maps to at least one test reference,
//    every referenced file exists, and every referenced test title is present.
const resolved = [];
const failures = [];
for (const behavior of coverage.behaviors) {
  const refs = behavior.test_refs || [];
  if (refs.length === 0) {
    failures.push(`behavior ${behavior.id} has no test reference`);
    continue;
  }
  const resolvedRefs = [];
  for (const ref of refs) {
    const file = path.join(projectRoot, ref.file);
    if (!existsSync(file)) {
      failures.push(`behavior ${behavior.id}: missing test file ${ref.file}`);
      continue;
    }
    if (ref.test && !/\.mjs$/.test(file)) {
      const source = readFileSync(file, 'utf8').replace(/\s+/g, ' ');
      const title = ref.test.replace(/\s+/g, ' ');
      if (!source.includes(title)) {
        failures.push(`behavior ${behavior.id}: test title not found in ${ref.file}: ${ref.test}`);
        continue;
      }
    }
    resolvedRefs.push(ref);
  }
  if (resolvedRefs.length === 0) {
    failures.push(`behavior ${behavior.id} resolved no usable test reference`);
  } else {
    resolved.push({ id: behavior.id, source_task: behavior.source_task, refs: resolvedRefs });
  }
}
assert.equal(failures.length, 0, `Coverage resolution failed:\n- ${failures.join('\n- ')}`);

// 2. Focused operations Vitest: the repaired surface plus the regression suite.
const focusedTests = [
  'src/App.test.ts',
  'src/views/Overview.test.ts',
  'src/views/Repos.test.ts',
  'src/lib/repoMetrics.test.ts',
  'src/store/repos.test.ts',
  'src/views/infrastructure/InfrastructureOverview.test.ts',
  'src/views/infrastructure/InfrastructureServers.test.ts',
  'src/views/infrastructure/InfrastructureServer.test.ts',
  'src/views/infrastructure/InfrastructureGroups.test.ts',
  'src/views/infrastructure/InfrastructureGroup.test.ts',
  'src/views/infrastructure/InfrastructureServices.test.ts',
  'src/views/infrastructure/InfrastructureAlerts.test.ts',
  'src/components/ops/InfrastructureNav.test.ts',
  'src/views/deployments/Deployments.test.ts',
  'src/views/deployments/DeploymentCollections.test.ts',
  'src/views/deployments/DeploymentDetails.test.ts',
  'src/views/deployments/DeploymentNew.test.ts',
  'src/views/deployments/DeploymentDetail.test.ts',
  'src/components/ops/DeploymentNav.test.ts',
  'src/store/ops.test.ts',
  'src/compositions/useConfirmedRequest.test.ts',
  'src/compositions/useDeploymentPresentation.test.ts',
  'src/regression/operations/repos-metrics-cache.test.ts',
  'src/regression/operations/infrastructure-locale-copy.test.ts',
  'src/regression/operations/deployment-wizard-preflight.test.ts',
];

const vitestEntry = path.join(webRoot, 'node_modules/vitest/vitest.mjs');
const focused = run('node', [vitestEntry, ...vitestArgs(focusedTests)], {
  cwd: webRoot,
  label: 'Focused operations Vitest (repaired surface + regression suite)',
});
function parsedTestCount(result, label) {
  const count = (result.stdout.match(/^\s*Tests\s+(\d+)/m) ?? [])[1];
  assert.ok(count, `${label} summary did not report a test count`);
  return Number(count);
}
const focusedCount = parsedTestCount(focused, 'Focused operations Vitest');

const full = run('node', [vitestEntry, ...vitestArgs([])], {
  cwd: webRoot,
  label: 'Full frontend Vitest',
});
const fullCount = parsedTestCount(full, 'Full frontend Vitest');

// 3. Receipt: coverage resolution plus test counts.
const receipt = {
  schema: 'specnav.task-024-regression-receipt.v1',
  task_id: '024-operations-regression-coverage',
  baseline_task_id: '6.5',
  generated_at: new Date().toISOString(),
  behavior_count: coverage.behavior_count,
  resolved_behaviors: resolved.length,
  test_reference_count: resolved.reduce((sum, item) => sum + item.refs.length, 0),
  focused: { files: focusedTests.length, tests: focusedCount },
  full: { tests: fullCount },
  coverage_file: 'evidence/behavior-coverage.json',
};
writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`\nRegression receipt written: ${path.relative(projectRoot, receiptPath)}\n`);
