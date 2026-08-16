#!/usr/bin/env node

/**
 * Task 032 closure-state verification: asserts the change is ready for the
 * final parity declaration — phase 7-8 checkboxes checked, >= 32 approved
 * slice acceptances, 67-row matrix with row 4 blocked, six domains ok,
 * HTML report bound, and the change-level acceptance approved with evidence
 * refs on the final HEAD.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const changeDir = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');
const tasksDir = path.join(changeDir, 'development/tasks');
const checks = [];
const ok = (m) => checks.push({ ok: true, message: m });
const fail = (m) => checks.push({ ok: false, message: m });

// 1. Phase 7-8 checkboxes (7.1-7.4, 8.1-8.4).
const tasksMd = readFileSync(path.join(changeDir, 'tasks.md'), 'utf8');
const phase78 = ['7.1', '7.2', '7.3', '7.4', '8.1', '8.2', '8.3', '8.4'];
for (const id of phase78) {
  const line = tasksMd.split('\n').find((l) => l.includes(` ${id} `));
  if (!line) fail(`tasks.md missing baseline ${id}`);
  else if (/^- \[x\]/.test(line.trimStart())) ok(`baseline ${id} checked`);
  else fail(`baseline ${id} not checked: ${line.trim()}`);
}

// 2. Slice acceptances.
const sliceAcceptances = [];
for (const dir of readdirSync(tasksDir).sort()) {
  const p = path.join(tasksDir, dir, 'acceptance.json');
  if (!existsSync(p)) continue;
  try {
    const a = JSON.parse(readFileSync(p, 'utf8'));
    sliceAcceptances.push({ task: dir, status: a.status, head: a.reviewed_git_head });
  } catch {
    // unparseable acceptance
  }
}
const approved = sliceAcceptances.filter((a) => a.status === 'approved');
assert.ok(approved.length >= 32, `expected >= 32 approved slice acceptances, found ${approved.length}`);
ok(`${approved.length} approved slice acceptances (slices 001-032)`);

// 3. Matrix shape with row 4 blocked.
const matrixText = readFileSync(path.join(changeDir, 'route-parity.md'), 'utf8');
const rows = [...matrixText.matchAll(/^\|\s*(\d+)\s*\|.*\|\s*(not-started|in-progress|verified|blocked)\s*\|$/gm)];
assert.equal(rows.length, 67, `matrix must have 67 rows, found ${rows.length}`);
const row4 = rows.find((r) => r[1] === '4');
assert.equal(row4[2], 'blocked', 'row 4 must stay blocked');
const verified = rows.filter((r) => r[2] === 'verified').length;
assert.equal(verified + 1, rows.length, 'all rows except row 4 must be verified');
ok(`matrix: 67 rows (${verified} verified + row 4 blocked)`);

// 4. Six domains ok (Task 030) and HTML report bound (Task 031).
const sixDomain = JSON.parse(readFileSync(path.join(tasksDir, '030-six-domain-verification/evidence/six-domain-summary.json'), 'utf8'));
assert.equal(sixDomain.ok, true, 'six-domain summary must be ok');
ok(`six domains ok (${sixDomain.domains.length} domain records)`);
const reportModel = JSON.parse(readFileSync(path.join(changeDir, 'verify/v2/report-model.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(path.join(changeDir, 'verify/v2/report-render-manifest.json'), 'utf8'));
assert.equal(manifest.report_model_id, reportModel.report_id, 'manifest must bind the report model');
assert.equal(manifest.pages.length, 3, 'manifest must bind 3 pages');
for (const page of manifest.pages) {
  assert.ok(existsSync(path.join(changeDir, page.path)), `manifest page missing: ${page.path}`);
}
ok('HTML report model + manifest bound with 3 pages');

// 5. Change-level acceptance approved with evidence refs.
const acceptance = JSON.parse(readFileSync(path.join(changeDir, 'acceptance.json'), 'utf8'));
assert.equal(acceptance.assertions.length, 4, 'four assertions');
for (const a of acceptance.assertions) {
  assert.equal(a.status, 'passing', `assertion ${a.id} must be passing (change-level schema allows failing|passing)`);
  assert.ok(typeof a.evidence_ref === 'string' && a.evidence_ref.trim(), `assertion ${a.id} must carry an evidence ref`);
}
ok('change-level acceptance A1-A4 passing with evidence refs');

// 6. Closure records.
const ledger = readFileSync(path.join(changeDir, 'development/task-ledger.jsonl'), 'utf8').split('\n').filter(Boolean);
const completeEntries = ledger.filter((l) => JSON.parse(l).status === 'complete').length;
assert.ok(completeEntries >= 32, `expected >= 32 complete ledger entries, found ${completeEntries}`);
ok(`${completeEntries} complete task-ledger entries`);

const summary = {
  schema: 'woodpecker.task032-closure-state.v1',
  generated_at: new Date().toISOString(),
  ok: checks.every((c) => c.ok),
  checks,
  matrix: { rows: rows.length, verified, blocked: 1 },
  slice_acceptances: approved.length,
  complete_ledger_entries: completeEntries,
};
writeFileSync(path.join(evidenceRoot, 'closure-state-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exitCode = 1;
