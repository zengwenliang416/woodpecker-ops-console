# Spec Review: 029-static-gate-closure

## Verdict

approved

## Missing Requirements

- None. Baseline task `8.1` (whole-frontend static gate chain: Prettier, ESLint,
  TypeScript, all Vitest tests, Vite build, `git diff --check`) is implemented
  as specified:
  - `web/.prettierignore` gained `**/._*` (verified in the diff; 211 AppleDouble
    `._*` files exist under `web/`, matching the brief).
  - The three real format violations (`ListItem.vue`, `Warning.vue`,
    `containment.test.ts`) are reformatted to Prettier style (verified in the
    diff).
  - `evidence/run_static_gate.mjs` runs all six gates from `web/` with the
    project binaries, fails closed on the first non-zero exit, and writes a
    JSON receipt (verified by reading the script).
  - `evidence/static-gate-receipt.json` records `ok: true` with all six gates
    `exitStatus: 0` and full Vitest `110` files / `610` tests.
  - Executed output is recorded in
    `development/evidence/040-029-static-gate-closure.log`; it contains all six
    gate sections, the Vitest summary (`Test Files 110 passed`, `Tests 610
    passed`), and ends with `Static gate receipt written`.
  - `tasks.md` marks baseline task `8.1` as `[x]` and leaves `8.2`-`8.4` open,
    matching the stop condition.

## Extra Behavior

- `web/src/components/layout/Popup.vue` gained `role="presentation"` on the
  click-away overlay — a one-line DOM attribute addition beyond the
  "formatting and configuration only" scope. It is disclosed in `report.md`
  and is a benign accessibility improvement: the overlay is a non-semantic
  click target with no focusable content, so `role="presentation"` is the
  appropriate ARIA treatment and does not change visual or functional
  behavior. All gates and tests pass with it. Not a blocker, but it is the
  only production-code delta in the slice.

## Misunderstood Requirements

- The brief states "four real formatting violations in `ListItem.vue`,
  `Warning.vue`, `Popup.vue`, and the 027 containment suite are reformatted",
  but the diff shows only three files reformatted: `ListItem.vue`,
  `Warning.vue`, and `containment.test.ts`. `Popup.vue`'s only change is the
  `role="presentation"` attribute line — no Prettier reformat was needed or
  applied there. The full-tree Prettier check now passes either way, so the
  closure itself is unaffected; the "four violations" wording is a spec/report
  inaccuracy.
- `report.md` claims the Popup role was forced by the Task 026 semantic-click
  scanner after a "formatting collapse exposed the missing role". This is not
  supported by the evidence: the scanner
  (`web/src/accessibilityInteraction.test.ts`, line 56-63) flags a
  non-semantic tag only when `@click` appears on the same line as the opening
  tag; in the (unchanged, multi-line) Popup template the `@click` line never
  starts with `<div`, so the overlay was never flagged with or without the
  role. The role is a reasonable, disclosed improvement, but it was added
  proactively, not to satisfy a failing gate.

## Cannot Verify From Diff

- Full Vitest `110/610` was not re-run end-to-end by this reviewer; it is
  attested by the recorded receipt and the executed gate log (dot-matrix
  output plus `Test Files 110 passed (110)` / `Tests 610 passed (610)`). The
  reviewer independently re-ran the Task 026 accessibility suite (6/6 pass).
- The gate script's `vite build --base=/BASE_PATH` reproduces the two
  established non-module script warnings (`/web-config.js`, `/assets/custom.js`)
  with exit 0; these are pre-existing build notices, not failures.
- The `040-029-static-gate-closure.log` corresponds to a run before the final
  `report.md` write (file mtimes), but `git diff --check` passes at the review
  HEAD, so the recorded receipt remains current for the checked-in state.

## Acceptance Assertions Verified

- A3 (static components): formatting (whole-tree Prettier `-c .` — recorded
  pass and independent re-run exit 0), lint (ESLint `--max-warnings 0 .` —
  recorded pass and independent re-run exit 0), TypeScript (`vue-tsc --noEmit`
  — recorded pass and independent re-run exit 0), Vitest (full suite recorded
  110 files / 610 tests pass; accessibility subset re-run 6/6), Vite build
  (recorded pass and independent re-run exit 0), git diff checks
  (`git diff --check` — recorded pass and independent re-run exit 0).
  The "targeted browser review at desktop and 390px" clause of A3 is the
  six-domain verification (task `8.2`), explicitly out of scope for task `8.1`
  and still open; it is not closed by this task.

## Required Fixes

- None. No gate failure, no hidden violation, and no scope-lock mismatch.
  Optional follow-ups (not blocking): correct the report/spec wording about
  "four reformatted files" (`Popup.vue` was not reformatted) and the scanner
  rationale for the Popup role; the role itself may stay.
