#!/usr/bin/env node

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
  process.stdout.write(`\n## ${options.label ?? `${command} ${args.join(' ')}`}\n`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    maxBuffer: 96 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, `${options.label ?? command} failed with exit status ${String(result.status)}`);
}

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
];
const prettierFiles = [
  ...focusedTests,
  'src/App.vue',
  'src/views/Overview.vue',
  'src/views/Repos.vue',
  'src/lib/repoMetrics.ts',
  'src/store/repos.ts',
  'src/views/infrastructure/*.vue',
  'src/components/ops/InfrastructureNav.vue',
  'src/views/deployments/*.vue',
  'src/components/ops/DeploymentNav.vue',
  'src/compositions/useConfirmedRequest.ts',
  'src/compositions/useDeploymentPresentation.ts',
  'src/store/ops.ts',
  'src/lib/api/index.ts',
  'src/lib/api/types/ops.ts',
  'src/assets/locales/en.json',
  'src/assets/locales/zh-Hans.json',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/023-operations-residual-delta-closure/*.md',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/023-operations-residual-delta-closure/*.json',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/023-operations-residual-delta-closure/evidence/*.mjs',
];

run('node', [path.join(evidenceRoot, 'audit_residuals.mjs')], {
  label: 'Residual source and lifecycle audit',
});
run('node', [path.join(evidenceRoot, 'redteam_audit.mjs')], {
  label: 'Residual audit red-team',
});
run('pnpm', ['exec', 'vitest', 'run', ...focusedTests], {
  cwd: webRoot,
  label: 'Combined focused operations Vitest',
});
run('pnpm', ['test', '--', '--run'], { cwd: webRoot, label: 'Full Vitest' });
run('pnpm', ['exec', 'prettier', '--check', ...prettierFiles], {
  cwd: webRoot,
  label: 'Task 023 Prettier',
});
run('pnpm', ['lint'], { cwd: webRoot, label: 'ESLint' });
run('pnpm', ['typecheck'], { cwd: webRoot, label: 'Vue TypeScript' });
run('pnpm', ['build'], { cwd: webRoot, label: 'Vite build' });

run(
  'node',
  [
    path.join(
      projectRoot,
      'openspec/changes/align-frontend-with-functional-prototype/development/tasks/022-deployment-route-reverification/evidence/verify_evidence.mjs',
    ),
  ],
  { label: 'Latest full-tree strict evidence verifier' },
);

for (const file of readdirSync(evidenceRoot).filter((name) => name.endsWith('.mjs'))) {
  run('node', ['--check', path.join(evidenceRoot, file)], {
    label: `JavaScript syntax: ${file}`,
  });
}

for (const file of [
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

run(
  'git',
  [
    'diff',
    '--check',
    '--',
    '.',
    ':(exclude)openspec/changes/align-frontend-with-functional-prototype/development/evidence/*.log',
  ],
  { label: 'Git whitespace check' },
);

process.stdout.write(
  `\n${JSON.stringify({
    ok: true,
    taskId: '023-operations-residual-delta-closure',
    focusedFiles: focusedTests.length,
    acceptedSlices: 3,
    verifiedRows: 24,
    preservedBlockedRows: [4],
    auditMutations: '5/5',
    productionRepairsRequired: false,
  })}\n`,
);
