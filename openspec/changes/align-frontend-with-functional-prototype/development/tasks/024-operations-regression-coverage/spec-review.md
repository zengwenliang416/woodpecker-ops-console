# Spec Review: 024-operations-regression-coverage

## Verdict

approved

All required fixes from the first review round were applied and independently
re-verified. The task's own full validation gate `evidence/validate_task.mjs` now
exits `0` end-to-end in my re-run: coverage resolves 35/35 behaviors to 95 test
references, focused Vitest passes 25 files / 104 tests, full frontend Vitest
passes 106 files / 588 tests, Prettier `--check` passes on all task-owned files,
ESLint passes with zero warnings, `vue-tsc --noEmit` passes, Vite build passes,
JavaScript syntax and JSON/JSONL parsing pass, and `git diff --check` passes. The
receipt stores numeric counts and fails closed when a count cannot be parsed; the
coverage map documents the 023-01 audit-script references; `report.md`
Verification Commands now reflect the executed reality, including the documented
`route-parity.md` Prettier exclusion. No production web file changed, and the
route-parity matrix rows 2-3 and 46-67 carry the Task 024 receipt reference with
no status downgrade.

## Missing Requirements

- None. The behavior-to-test coverage map (35 behaviors / 95 references across
  Tasks 020-023), the task-local regression runner, the fail-closed receipt, the
  three new regression files under `web/src/regression/operations/`, and the
  matrix evidence updates all exist, are internally consistent, and behave as the
  brief requires.

## Extra Behavior

- None material. No production frontend, API, store, locale, or route byte
  changed; the only new source files are the three regression tests.
- Minor, non-blocking observations retained from the first review round:
  - `development/task-graph.json` was reformatted wholesale (pure whitespace;
    verified by deep-equal of the working tree minus the added 024 slice against
    HEAD). Cosmetic churn within an allowed file.
  - Unrelated uncommitted edits to tasks 017/018 context/brief files, codegraph/*,
    and change-registry.json are pre-existing working-tree dirt; none is
    attributable to this task.

## Misunderstood Requirements

- None found. The coverage map's 35 behaviors match the Task 020-023 report
  inventories (020-01..020-11, 021-01..021-13, 022-01..022-10, 023-01), and the
  three new regression tests exercise real production behavior (`Repos.vue`
  cache/force-refresh/generation logic, the four wizard preflight checks in
  `DeploymentNew.vue`, and a CJK template scan of the infrastructure/deployments
  view directories).

## Cannot Verify From Diff

- Behavior `023-01`'s two references are the Task 023 `.mjs` audit scripts
  (`audit_residuals.mjs`, `redteam_audit.mjs`), validated by the runner for
  existence rather than executed at the 024 HEAD. The coverage map now documents
  this explicitly: their execution stays bound to the Task 023 closure HEAD
  because later legitimate shared-file edits (route-parity.md re-owned by Task
  024) advance the newest-owner boundary, which is the known change-level
  historical-drift item. This is a documented, deliberate mapping, not a silent
  gap; whether those scripts still pass at their own closure HEAD was verified by
  Task 023's signed acceptance, which is outside this task's scope.
- A2 (sensory browser parity) is intentionally NOT claimed by this task and was
  not re-verified; the Task 020-022 strict browser bundles remain the sensory
  evidence for rows 2-3 and 46-67.

## Acceptance Assertions Verified

- A1 (maintained parity matrix with explicit verification status): VERIFIED. All
  67 matrix rows remain present; rows 2-3 and 46-67 carry the Task 024
  regression-evidence reference pointing at the existing receipt; every touched
  row keeps status `verified`, row 4 stays `blocked`, and no status was
  downgraded.
- A3 (formatting, lint, TypeScript, Vitest, Vite build, git diff checks):
  VERIFIED. My independent re-run of `node .../evidence/validate_task.mjs` exits
  `0`: Prettier `--check` passes on all task-owned files (the gate's Prettier
  list is scoped to task-controlled files; `route-parity.md` is excluded with
  documented justification since its padded table fails `--check` at HEAD too),
  ESLint passes with zero warnings (`interface WizardVm`, uppercase
  `[\u3400-\u9FFF]`), `vue-tsc --noEmit` passes, Vite build passes, focused
  Vitest 25/104 and full Vitest 106/588 pass, JavaScript syntax and JSON/JSONL
  parsing pass, and `git diff --check` passes.
- A4 (operational data/dates/durations/counts/statuses render confirmed values or
  explicit fallbacks without stale overwrite): VERIFIED via executed evidence.
  The 35 repaired behaviors covering confirmed-data preservation, newest-request
  ownership, fallback rendering, and stale-response rejection resolve to direct
  regression tests, and the focused and full Vitest runs pass with the mapped
  tests asserting the real production logic.

## Required Fixes

- None remaining. The first-round fixes were verified as applied: Prettier on the
  three regression tests, `context.json`, `validate_task.mjs`, and the task
  Markdown; the `route-parity.md` gate exclusion documented in the runner and
  `report.md`; the two ESLint errors fixed (`type` -> `interface WizardVm`;
  uppercase CJK escape range); the receipt's numeric counts with a fail-closed
  parse guard; the 023-01 audit-script note in the coverage map; and the
  corrected `report.md` Verification Commands. The final gate run is recorded at
  `development/evidence/037-024-operations-regression-coverage.log` and
  independently reproduced (exit 0).
