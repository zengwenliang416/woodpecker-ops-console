#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '../../../../..');
const changeDir = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');
const developmentBaseline = 'd49d7f4';
const repositoryEvidenceCommit = 'c416ce346110b4b2315c995e2302797ea5ee9f0c';
const taskEvidenceRoot = path.join(changeDir, 'development/tasks');

function run(command, args, options = {}) {
  process.stdout.write(`\n## ${options.label ?? `${command} ${args.join(' ')}`}\n`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, `${options.label ?? command} failed with exit status ${String(result.status)}`);
}

function git(args, cwd = projectRoot) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function changedFrontendFiles() {
  return git(['diff', '--name-only', `${developmentBaseline}..HEAD`, '--', 'web'])
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => /\.(?:vue|ts|js|json|css|html|md|ya?ml)$/.test(file))
    .map((file) => file.replace(/^web\//, ''));
}

function verifyRouteMatrix() {
  const matrix = readFileSync(path.join(changeDir, 'route-parity.md'), 'utf8');
  const rows = [...matrix.matchAll(/^\|\s*(\d+)\s*\|.*\|\s*(not-started|in-progress|verified|blocked)\s*\|$/gm)].map(
    (match) => ({ row: Number(match[1]), status: match[2] }),
  );
  assert.deepEqual(
    rows.map(({ row }) => row),
    Array.from({ length: 67 }, (_, index) => index + 1),
    'route parity matrix must retain all 67 ordered rows',
  );
  const counts = Object.fromEntries(
    ['not-started', 'in-progress', 'verified', 'blocked'].map((status) => [
      status,
      rows.filter((row) => row.status === status).length,
    ]),
  );
  assert.deepEqual(counts, {
    'not-started': 0,
    'in-progress': 23,
    verified: 43,
    blocked: 1,
  });
  process.stdout.write(`\n## route matrix\n${JSON.stringify({ ok: true, rows: rows.length, counts })}\n`);
}

function verifyRepositorySensoryEvidence() {
  assert.equal(
    git(['merge-base', '--is-ancestor', repositoryEvidenceCommit, 'HEAD']) || '',
    '',
    'repository evidence commit must remain an ancestor of HEAD',
  );
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'woodpecker-task-014-'));
  const worktree = path.join(temporaryRoot, 'worktree');
  const sourceEvidence = path.join(taskEvidenceRoot, '014-repository-validation-evidence/evidence');
  const targetEvidence = path.join(
    worktree,
    'openspec/changes/align-frontend-with-functional-prototype/development/tasks/014-repository-validation-evidence/evidence',
  );
  try {
    run('git', ['worktree', 'add', '--detach', worktree, repositoryEvidenceCommit], {
      label: 'prepare task 014 evidence worktree',
    });
    mkdirSync(path.dirname(targetEvidence), { recursive: true });
    cpSync(sourceEvidence, targetEvidence, { recursive: true });
    run('node', [path.join(targetEvidence, 'verify_evidence.mjs')], {
      cwd: worktree,
      label: 'task 014 commit-bound sensory evidence',
    });
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', worktree], {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const reviewedHead = git(['rev-parse', 'HEAD']);
const reviewedTree = git(['rev-parse', 'HEAD^{tree}']);
process.stdout.write(
  `# Historical task acceptance validation\n# reviewed_head: ${reviewedHead}\n# reviewed_tree: ${reviewedTree}\n`,
);

const prettierFiles = changedFrontendFiles();
assert.ok(prettierFiles.length > 0, 'development baseline must contain frontend changes');
run('pnpm', ['exec', 'prettier', '--check', ...prettierFiles], {
  cwd: path.join(projectRoot, 'web'),
  label: `Prettier for ${prettierFiles.length} change-owned frontend files`,
});
run('pnpm', ['lint'], { cwd: path.join(projectRoot, 'web'), label: 'ESLint' });
run('pnpm', ['typecheck'], {
  cwd: path.join(projectRoot, 'web'),
  label: 'Vue TypeScript',
});
run('pnpm', ['exec', 'vitest', 'run'], {
  cwd: path.join(projectRoot, 'web'),
  label: 'full Vitest',
});
run('pnpm', ['build'], { cwd: path.join(projectRoot, 'web'), label: 'Vite build' });

for (const taskId of [
  '009-pipeline-validation-evidence',
  '010-repository-pipeline-list',
  '011-repository-branches-pull-requests',
  '012-repository-manual-run-settings',
  '015-organization-routes',
  '016-administration-routes',
  '017-user-auth-routes',
  '018-authorization-boundaries',
  '019-route-family-parity-closure',
]) {
  run('node', [path.join(taskEvidenceRoot, taskId, 'evidence/verify_evidence.mjs')], {
    label: `${taskId} stored evidence`,
  });
}

verifyRepositorySensoryEvidence();
verifyRouteMatrix();

run('node', [path.join(taskEvidenceRoot, '019-route-family-parity-closure/evidence/redteam_verifier.mjs')], {
  label: 'route-family evidence red-team',
});
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
    reviewedHead,
    reviewedTree,
    prettierFiles: prettierFiles.length,
    fallbackUsed: false,
  })}\n`,
);
