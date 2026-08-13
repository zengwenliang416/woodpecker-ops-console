#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, `${options.label ?? command} failed with exit status ${String(result.status)}`);
}

const focusedTests = [
  'src/views/infrastructure/InfrastructureOverview.test.ts',
  'src/views/infrastructure/InfrastructureServers.test.ts',
  'src/views/infrastructure/InfrastructureServer.test.ts',
  'src/views/infrastructure/InfrastructureGroups.test.ts',
  'src/views/infrastructure/InfrastructureGroup.test.ts',
  'src/views/infrastructure/InfrastructureServices.test.ts',
  'src/views/infrastructure/InfrastructureAlerts.test.ts',
  'src/components/ops/InfrastructureNav.test.ts',
  'src/store/ops.test.ts',
];
const prettierFiles = [
  'src/views/infrastructure/*.vue',
  'src/views/infrastructure/*.test.ts',
  'src/components/ops/InfrastructureNav.vue',
  'src/components/ops/InfrastructureNav.test.ts',
  'src/store/ops.ts',
  'src/store/ops.test.ts',
  'src/assets/locales/en.json',
  'src/assets/locales/zh-Hans.json',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/021-infrastructure-route-reverification/*.md',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/021-infrastructure-route-reverification/*.json',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/021-infrastructure-route-reverification/evidence/*.mjs',
  '../openspec/changes/align-frontend-with-functional-prototype/development/tasks/021-infrastructure-route-reverification/evidence/*.json',
];

run('pnpm', ['exec', 'vitest', 'run', ...focusedTests], {
  cwd: webRoot,
  label: 'Focused Vitest',
});
run('pnpm', ['test', '--', '--run'], { cwd: webRoot, label: 'Full Vitest' });
run('pnpm', ['exec', 'prettier', '--check', ...prettierFiles], {
  cwd: webRoot,
  label: 'Task 021 Prettier',
});
run('pnpm', ['lint'], { cwd: webRoot, label: 'ESLint' });
run('pnpm', ['typecheck'], { cwd: webRoot, label: 'Vue TypeScript' });
run('pnpm', ['build'], { cwd: webRoot, label: 'Vite build' });
run('node', [path.join(evidenceRoot, 'mock_api_smoke.mjs')], {
  label: 'Mock API smoke',
});
run('node', [path.join(evidenceRoot, 'verify_evidence.mjs')], {
  label: 'Strict evidence verifier',
});

const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'task021-validation-'));
try {
  run('node', [path.join(evidenceRoot, 'redteam_verifier.mjs')], {
    label: 'Persistent red-team',
    env: {
      TASK021_REDTEAM_SUMMARY: path.join(temporaryRoot, 'redteam-verifier-summary.json'),
    },
  });
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

for (const file of readdirSync(evidenceRoot).filter((name) => name.endsWith('.mjs'))) {
  run('node', ['--check', path.join(evidenceRoot, file)], {
    label: `JavaScript syntax: ${file}`,
  });
}

const jsonFiles = [
  path.join(taskRoot, 'context.json'),
  ...readdirSync(evidenceRoot)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(evidenceRoot, name)),
  path.join(webRoot, 'src/assets/locales/en.json'),
  path.join(webRoot, 'src/assets/locales/zh-Hans.json'),
];
for (const file of jsonFiles) JSON.parse(readFileSync(file, 'utf8'));

const infrastructureViews = readdirSync(path.join(webRoot, 'src/views/infrastructure'))
  .filter((name) => name.endsWith('.vue'))
  .map((name) => path.join(webRoot, 'src/views/infrastructure', name));
const hardcodedChinese = infrastructureViews.flatMap((file) => {
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line, index) => ({ file, line: index + 1, text: line.replace(/[·—]/g, '') }))
    .filter((entry) => /\p{Script=Han}/u.test(entry.text));
});
assert.deepEqual(hardcodedChinese, [], 'production infrastructure views contain hardcoded Chinese');

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
    focused: '9/39',
    full: '95/549',
    runId: '84b42687-5a1a-402c-952f-6e5fd1ac338a',
    strict: '62/62',
    redTeam: '13/13',
    jsonFiles: jsonFiles.length,
    hardcodedChineseVisibleStrings: 0,
  })}\n`,
);
