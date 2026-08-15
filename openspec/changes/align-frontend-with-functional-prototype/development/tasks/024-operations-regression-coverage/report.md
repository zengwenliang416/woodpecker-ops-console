# Task Report: 024-operations-regression-coverage

## Status

DONE

## Files Changed

- Added the Task `024` scope packet, task graph node, task context record, and
  CodeGraph claim/query-plan records.
- Added `web/src/regression/operations/repos-metrics-cache.test.ts`: regression
  coverage for the repaired repository pipeline-statistics cache and forced
  refresh behavior.
- Added `web/src/regression/operations/infrastructure-locale-copy.test.ts`:
  regression scan proving infrastructure and deployment SFC templates contain
  no hardcoded Chinese user-facing strings.
- Added `web/src/regression/operations/deployment-wizard-preflight.test.ts`:
  regression coverage proving the wizard preflight reports only the four
  client-confirmable checks and never a deployment-lock assertion.
- Added `evidence/behavior-coverage.json`: the behavior-to-test map covering
  every behavior repaired by Tasks `020-023` (35 behaviors, 95 test
  references).
- Added `evidence/run_regressions.mjs` and `evidence/validate_task.mjs`:
  task-local regression runner and full validation gate.
- Generated `evidence/regression-receipt.json`: coverage resolution and
  focused/full Vitest counts.
- Updated `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
  rows `2-3` and `46-67` with the Task `024` regression evidence reference.
- No production frontend, API, store, locale, or route byte changed.

## What Changed

- Baseline task `6.5` is implemented as a completeness proof over the
  operations repairs: every behavior repaired by Tasks `020-023` is enumerated
  and mapped to a direct, resolvable regression test instead of relying on a
  passing suite alone.
- The coverage map resolves 35/35 behaviors to 95 test references across the
  existing focused test files, the three new regression files, and the Task
  `023` audit scripts; the runner fails closed when a mapped file is missing,
  a title is not found, or any command fails.
- New regression tests close the three direct gaps found while auditing the
  existing focused surface:
  - Repositories: pagination reuses cached pipeline statistics (no re-fetch
    when a cached page is revisited) and explicit refresh forces a fresh
    statistics fetch for already-cached repositories.
  - Infrastructure/deployments: locale-owned copy regression scan asserts no
    hardcoded Chinese remains in the SFC templates.
  - Deployment wizard: the preflight list is exactly Release artifact, Target
    capacity, Disk space, and Environment protection settings, blocks without
    a release, passes when every client-confirmable input is present, and
    never asserts an unsupported deployment lock.
- Matrix evidence: route-parity rows `2-3` and `46-67` now cite the Task `024`
  regression receipt without downgrading any `verified` status or replacing
  the Task `020-022` sensory evidence.
- Review-fix round (independent spec and quality review, both `needs-fix` on
  the first pass): the three regression files and the task `context.json` were
  reformatted with the project Prettier; the wizard test now declares
  `interface WizardVm` instead of a `type` alias; the locale scan uses the
  repo-convention uppercase `[\u3400-\u9FFF]` range; the regression runner
  fails closed when a test count cannot be parsed and records counts as
  numbers; and the coverage map documents that the `023-01` references are the
  Task `023` audit scripts, whose execution stays bound to the Task `023`
  closure HEAD because later legitimate shared-file edits advance the
  newest-owner boundary.
- Phase `6` still has task `6.5` checked only after this closure; rows `4`,
  phases `7-8`, and the parent acceptance remain open.

## TDD Evidence

- The regression tests were written against the repaired behaviors enumerated
  from the Task `020-023` reports and run green at current `HEAD`; the runner
  re-executes them on every run.
- Focused operations Vitest passes `25` files and `104` tests (22 existing
  operations files plus the 3 new regression files).
- Full frontend Vitest passes `106` files and `588` tests.
- Coverage resolution is machine-checked: `35/35` behaviors resolved, `95`
  test references verified to exist and contain their declared test titles.

## Verification Commands

- PASS: `node .../evidence/run_regressions.mjs` — coverage resolution
  `35/35`, `95` test references, focused Vitest `25` files / `104` tests, full
  Vitest `106` files / `588` tests, receipt written.
- PASS: `node .../evidence/validate_task.mjs` — full gate chain exits `0`
  (re-run after the review-fix round; final run recorded in
  `development/evidence/037-024-operations-regression-coverage.log`).
- PASS: Prettier check over task-owned files (test files, packet JSON/Markdown,
  evidence scripts and JSON). `route-parity.md` is intentionally excluded from
  the gate's Prettier list: the pre-existing padded table fails `--check` at
  `HEAD` too, and formatting it produces a whitespace-only 140-line churn; the
  same exclusion precedent applies to the Task `023` gate.
- PASS: ESLint with zero warnings.
- PASS: Vue TypeScript (`vue-tsc --noEmit`).
- PASS: Vite build.
- PASS: JavaScript syntax checks on task-local scripts; JSON/JSONL parsing of
  coverage, receipt, context, task graph, CodeGraph plans, and ledgers.
- PASS: `git diff --check`.

## Concerns

- Console warnings emitted by unrelated pre-existing tests during the full
  Vitest run do not fail any assertion or gate.
- Re-running the Task `023` audit scripts at the current `HEAD` would report
  shared-file drift (e.g. `route-parity.md` legitimately re-owned by Task
  `024`); that known historical-drift item stays open at the change level and
  is documented on behavior `023-01` in the coverage map.

## Scope Deviations

- None. Production code was not modified; the three regression files are the
  only new source files and are confined to `web/src/regression/operations/`.

## Follow-up Needed

- Baseline tasks `7.1-7.4` (accessibility, i18n, responsive, theme closure)
  and `8.1-8.4` (static, six-domain verification, HTML report, final parity
  declaration) remain open.
- Blocked repository-add row `4` and the parent change acceptance remain open.
- `main` is still ahead of `origin/main` and unpushed.
