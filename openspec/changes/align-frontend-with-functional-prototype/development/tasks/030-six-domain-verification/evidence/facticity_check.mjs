#!/usr/bin/env node

/**
 * Task 030 facticity check: re-derives the parity matrix contract from the
 * current source of truth (router source, prototype artifact, acceptance
 * statuses) and verifies the matrix text's evidence references. Includes a
 * tamper self-test: a mutated matrix must fail the checker.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceRoot, '../../../../../../..');
const changeDir = path.join(projectRoot, 'openspec/changes/align-frontend-with-functional-prototype');
const webRoot = path.join(projectRoot, 'web');

function checkMatrix(matrixText) {
  const findings = [];
  const ok = (message) => findings.push({ ok: true, message });
  const fail = (message) => findings.push({ ok: false, message });

  // 1. Matrix shape: 67 ordered rows with valid status vocabulary.
  const rows = [...matrixText.matchAll(/^\|\s*(\d+)\s*\|.*\|\s*(not-started|in-progress|verified|blocked)\s*\|$/gm)].map(
    (m) => ({ row: Number(m[1]), status: m[2] }),
  );
  if (rows.length !== 67) fail(`matrix must have 67 rows, found ${rows.length}`);
  else ok('matrix shape: 67 ordered rows');
  const numbers = rows.map((r) => r.row);
  if (JSON.stringify(numbers) !== JSON.stringify(Array.from({ length: 67 }, (_, i) => i + 1))) {
    fail('rows must be 1..67');
  }
  const statusCounts = {};
  for (const r of rows) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  ok(`status counts: ${JSON.stringify(statusCounts)}`);

  const row4 = rows.find((r) => r.row === 4);
  if (!row4 || row4.status !== 'blocked') fail('row 4 must stay blocked');
  else ok('row 4 remains blocked');

  // 2. Route-name drift: every production path cell must resolve to a
  // top-level route registered in the router source, and concrete single-
  // segment paths must appear verbatim.
  const routerSource = readFileSync(path.join(webRoot, 'src/router.ts'), 'utf8');
  const registeredPaths = [...routerSource.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
  const routeCells = [...matrixText.matchAll(/^\|\s*\d+\s*\|[^|]*\|([^|]*)\|/gm)].map((m) => m[1]);
  const topLevelSegments = new Set();
  const concreteMissing = [];
  for (const cell of routeCells) {
    const cleaned = cell.trim().replace(/^`|`$/g, '');
    if (!cleaned.startsWith('/')) continue; // descriptive cells are not route paths
    const pathOnly = cleaned.split('?')[0];
    const segments = pathOnly.split('/').filter(Boolean);
    if (segments.length === 0 || segments[0].startsWith(':')) continue; // no usable path
    const topLevel = `/${segments[0]}`;
    topLevelSegments.add(topLevel);
    const registeredTopLevel = registeredPaths.some(
      (registered) => registered.startsWith(topLevel) || registered === topLevel.replace(/^\//, ''),
    );
    if (!registeredTopLevel) fail(`route '${pathOnly}': top-level '${topLevel}' not registered in router.ts`);
    if (segments.length === 1 && /^[a-z-]+$/.test(segments[0])) {
      const registered = registeredPaths.some((registered) => registered === segments[0] || registered === topLevel);
      if (!registered) concreteMissing.push(`'/${segments[0]}'`);
    }
  }
  if (concreteMissing.length > 0) fail(`concrete single-segment routes not registered in router.ts: ${concreteMissing.join(', ')}`);
  else ok('concrete single-segment routes registered in router.ts');
  if (topLevelSegments.size === 0) fail('no production route cells produced a top-level segment');
  else ok(`route top-level segments resolve to the router (${topLevelSegments.size} segments)`);

  // 3. Evidence references: every "Verified by task `NNN`" resolves to an
  // approved acceptance.
  const taskRefs = [...matrixText.matchAll(/Verified by task `(\d{3})`/g)].map((m) => m[1]);
  const uniqueTaskRefs = [...new Set(taskRefs)];
  for (const num of uniqueTaskRefs) {
    const dirs = readdirSync(path.join(changeDir, 'development/tasks')).filter((d) => d.startsWith(num));
    if (dirs.length === 0) {
      fail(`task ${num} referenced by matrix but no task directory exists`);
      continue;
    }
    const accepted = dirs.filter((d) => {
      const p = path.join(changeDir, 'development/tasks', d, 'acceptance.json');
      if (!existsSync(p)) return false;
      try {
        return JSON.parse(readFileSync(p, 'utf8')).status === 'approved';
      } catch {
        return false;
      }
    });
    if (accepted.length === 0) fail(`task ${num} referenced by matrix but no approved acceptance`);
    else ok(`task ${num}: approved acceptance`);
  }

  // 4. Acceptance assertions declared.
  const acceptance = JSON.parse(readFileSync(path.join(changeDir, 'acceptance.json'), 'utf8'));
  if (acceptance.assertions.length !== 4) fail('acceptance.json must declare A1-A4');
  else ok('acceptance.json declares A1-A4');

  return { findings, ok: findings.every((f) => f.ok), rows: rows.length, status_counts: statusCounts };
}

const matrixText = readFileSync(path.join(changeDir, 'route-parity.md'), 'utf8');
const report = checkMatrix(matrixText);

// Tamper self-test: mutated matrices must fail the checker.
const tamperStatus = matrixText.replace(/blocked\s*\|\s*$/m, 'verified   |', 1);
const tamperStatusResult = checkMatrix(tamperStatus);
assert.equal(tamperStatusResult.ok, false, 'tampered row-4 status must fail the checker');
const tamperRoute = matrixText.replace("| `/login`", "| `/not-a-real-route`", 1);
const tamperMulti = matrixText.replace("/repos/:repoId/branches", "/repositories/:repoId/branches");
const tamperMultiResult = checkMatrix(tamperMulti);
assert.equal(tamperMultiResult.ok, false, 'renamed multi-segment route must fail the checker');
const tamperRouteResult = checkMatrix(tamperRoute);
assert.equal(tamperRouteResult.ok, false, 'tampered route cell must fail the checker (via top-level segment or verbatim check)');

report.schema = 'woodpecker.task030-facticity-report.v1';
report.generated_at = new Date().toISOString();
report.tamper_self_test = { row4_status: 'rejected', route_cell: 'rejected', multi_segment_route: 'rejected' };
writeFileSync(path.join(evidenceRoot, 'facticity-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
