# Spec Review: 028-token-parity-closure

## Verdict

approved

## Missing Requirements

- None. The brief's in-scope migrations are all present and value-preserving:
  `--wp-log-*`, `--wp-login-*`, `--wp-primary-hover-100` /
  `--wp-primary-glow-rgb`, `--wp-ansi-*` (32 colors) and `--wp-syntax-*` (16
  colors) in both theme blocks; console.css/prism.css contain zero raw hex;
  the ActivePipelines spinner arc now uses `--wp-spinner-arc-100: #ffffff`
  declared in BOTH theme blocks; the token-parity regression scan and the
  light/dark spot check exist, pass, and are locked by the gate.

## Extra Behavior

- None remaining. The four previously flagged items are fixed and verified:
  (1) `font-weight: bold` restored on `.token.id` and `.token.important` in
  both prism.css blocks (4 occurrences, and the diff vs HEAD shows the weight
  as unchanged context); (2) the spinner gradient now resolves to `#ffffff`
  in both themes via `--wp-spinner-arc-100` (was `var(--wp-control-neutral-100)`
  which is `#12202b` in dark); (3) the junk token
  `--wp-syntax-cspell-ignore-atrule-hexcode-token-atrule` is deleted — the
  light and dark theme blocks are now perfectly symmetric (133 tokens each,
  zero light-only / zero dark-only); (4) `report.md` now documents the Task
  `027` mock_api.py extension (deployment logs endpoint + `approvals` fixture)
  under Scope Deviations and reports the corrected full-Vitest counts
  (110 files / 609 tests).
- Non-blocking documentation nit (tidy-up only, no gate impact): the
  `report.md` "Files Changed" bullet for ActivePipelines.vue still names
  `--wp-control-neutral-100`; the code now uses `--wp-spinner-arc-100`. The
  Scope Deviations section and What Changed narrative are accurate.

## Misunderstood Requirements

- None. The regression test's theme-block check remains weaker than the
  brief's wording ("defined with light and dark values") — it asserts counts
  and `--wp-background-100` presence rather than full block symmetry — but
  this is now moot: independent verification shows all 133 referenced
  `--wp-*` tokens are declared in BOTH theme blocks, so no runtime gap exists
  in either theme.

## Cannot Verify From Diff

- Nothing material. The migrated values match the pre-change hex exactly
  (verified against the diff); the only non-color change (bold removal) was
  reverted and is verified as restored.

## Acceptance Assertions Verified

- A2 (theme-parity dimension): verified by executed evidence — the light/dark
  spot check in the fresh post-fix gate run (`development/evidence/039-028-token-parity-closure.log`,
  runId e9911fd4) reports `ok: true`, 6/6 states (overview, deployment detail
  with log console, login × light/dark), correct `data-theme` application,
  differing light/dark body backgrounds, zero page-level overflow, and zero
  console/runtime/network/HTTP failures; `evidence/light-dark-spot-summary.json`
  and `light-dark-spot-measurements.json` on disk match that run. The parent
  assertion remains `failing` in acceptance.json until phase 8 aggregates all
  slices; this task contributes its theme-parity slice.
- A3 (static + browser dimension): verified by executed evidence — focused
  token-parity Vitest 4/4 (re-run on the fixed tree: 4 tests, 0 failures),
  ESLint `--max-warnings 0` on `src/regression/tokens/` (re-run: clean),
  `git diff --check` (re-run: clean), full Vitest 110 files / 609 tests,
  Prettier, `vue-tsc --noEmit`, Vite build, and JS/JSON syntax all pass in
  the fresh gate log, which ends with "Task 028 validation gates all passed."
  Independent re-verification on the fixed tree: 133 referenced `--wp-*`
  tokens all resolve and are declared in both theme blocks; prism.css has 4
  `font-weight: bold` declarations and no raw hex; console.css has no raw
  hex. Targeted browser review executed at desktop in both themes (see A2);
  390px remains covered by closed sibling task 027.

## Required Fixes

- None. All four fixes from the prior review are applied and verified. The
  only open item is the cosmetic stale token name in the `report.md` "Files
  Changed" bullet (see Extra Behavior); it does not affect any gate, test,
  evidence, or the acceptance assertions and does not require another review
  loop.
