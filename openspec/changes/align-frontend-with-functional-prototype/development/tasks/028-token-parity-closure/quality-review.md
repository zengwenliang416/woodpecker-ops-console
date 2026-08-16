# Quality Review: 028-token-parity-closure

## Verdict

approved

## Separation Of Concerns

- The token migration is well separated: `web/src/style.css` is the single
  definition site for the new `--wp-log-*`, `--wp-login-*`,
  `--wp-primary-hover-100`, `--wp-primary-glow-rgb`, `--wp-spinner-arc-100`,
  `--wp-ansi-*` (32 colors) and `--wp-syntax-*` (36 colors) tokens in both
  `:root[data-theme='light']` and `:root[data-theme='dark']` blocks;
  `web/src/style/console.css` and `web/src/style/prism.css` are now pure token
  consumers (64 and 72 `var(--wp-*)` references respectively, zero raw hex);
  the Vue components/views reference only tokens. The regression scan lives in
  its own `web/src/regression/tokens/` directory and the browser spot check in
  the task's `evidence/`, which is the right layering.
- `web/src/views/infrastructure/InfrastructureOverview.vue` was modified
  (status-dot glow → `var(--wp-primary-glow-rgb)`) even though it is not in
  the task's `allowed_files`; the change was necessary because the raw
  `rgba(37,194,103,0.08)` would have failed the task's own raw-color scan.
  This is now correctly recorded in `report.md` under Scope Deviations (see
  below), so the deviation is documented rather than denied.

## Component Cohesion / Coupling

- Coupling to page-local color systems is removed: DeploymentDetail log
  console, Login gradients, primary Button hover/glow, ActivePipelines spinner
  arc, and InfrastructureOverview status-dot all resolve through shared tokens.
  Components now depend on the token contract rather than duplicated hex
  values — a genuine decoupling improvement.
- `--wp-spinner-arc-100: #ffffff` is declared in BOTH theme blocks and
  preserves the original `#fff` spinner arc in dark mode (the earlier
  `--wp-control-neutral-100` substitution with dark `#12202b` was reverted).
- `--wp-log-muted-200: #708492` is declared in both blocks with the same value;
  acceptable (theme-independent token declared symmetrically).

## Test Quality

- `web/src/regression/tokens/token-parity.test.ts` (5 tests) is a real,
  red-capable regression: raw-color scan with explicit allowlist
  (`tailwind.css`, `style.css`, `useTheme.ts`, `*.test.ts`), ANSI/syntax
  palette hygiene, `--wp-*` resolution, light/dark block structure, AND a new
  `preserves the exact ANSI and syntax palette values in both themes` test
  that pins all 32 ANSI + 36 syntax token light AND dark values from the
  pre-tokenization originals (`EXPECTED_PALETTE`, 68 entries). A light/dark
  value swap or drift now fails the suite.
- I independently re-verified the pinned palette: every `EXPECTED_PALETTE`
  entry matches BOTH the original HEAD `console.css`/`prism.css` hex (via a
  comment-stripped parse) AND the current `style.css` declarations in the
  corresponding theme block — `ALL COLORS MATCH`, zero drift. The earlier
  light-block `--wp-syntax-atrule` defect (`#c792ea` instead of `#7c4dff`) is
  corrected at style.css line 132 and is now machine-locked by the test.
- Focused Vitest re-run: 5/5 pass. The light/dark spot check
  (`spot_check.mjs`, fresh gate runId f26131f6-cec3-4014-a360-98ae0d446f83,
  6/6 states) genuinely verifies `data-theme` application, light-vs-dark body
  backgrounds differing per route, zero page overflow, and zero
  console/runtime/network/HTTP failures.

## Error Handling

- The raw-color scan collects offenders with file:line context and asserts an
  empty list; the palette test asserts per-token equality with a descriptive
  `${token} light|dark` message; the spot check fails closed (exit 1 +
  `failures[]`) on data-theme mismatch, identical light/dark backgrounds,
  overflow, or any browser health failure; `validate_task.mjs` gates the whole
  chain. No silent pass-through.
- Known scope note: the RAW_COLOR regex covers hex/rgb/rgba only; named
  colors such as `black` in Login.vue's `mask-image` (line 203) are not
  scanned. That value is pre-existing, functional (an alpha mask, not a
  user-visible surface), and outside the brief's declared "hex/rgb/rgba"
  scan scope — a note, not a blocker.

## Reuse / Duplication

- Strong reuse: the Task 027 consolidated Mock API and CDP capture/verifier
  machinery are reused for the light/dark matrix (additive fixture changes
  only: `approvals: []` and `/api/deployments/142/logs`); the existing
  `--wp-*` token system absorbs all migrated palettes; `.dark .ansi-*` /
  `.dark .token.*` duplication collapses into token values.
- No parallel color abstraction was introduced; the task brief's "extract into
  the shared token system" rule was followed.

## Complexity Delta

- Low, mechanical complexity: ~178 added token lines in style.css (mostly
  alphabetized one-line declarations), 128→128 and 292→288 line rewrites in
  console.css/prism.css (color → var substitution), 1-2 line changes in four
  components, one 192-line regression test, and one 365-line evidence script
  reusing existing machinery. No new state, no new behavior, no control-flow
  complexity added.

## Required Fixes

- None. All four fixes from the prior review round are applied and verified by
  direct re-execution:
  1. Light-block `--wp-syntax-atrule` corrected to `#7c4dff` (style.css line
     132; dark block line 293 correctly keeps `#c792ea`); comment-stripped
     parity comparison of all 32×2 ANSI + 36×2 syntax values against HEAD
     originals reports `ALL COLORS MATCH`.
  2. `token-parity.test.ts` now machine-checks value parity via
     `EXPECTED_PALETTE` (68 pinned tokens, light + dark); re-run 5/5 green;
     pinned values independently confirmed identical to the originals.
  3. `report.md` Scope Deviations now records both out-of-list changes
     (mock_api.py fixture extension AND the InfrastructureOverview.vue
     migration).
  4. Gate re-run end-to-end exits 0: token-parity 5/5, light/dark spot check
     6/6 (runId f26131f6), full frontend Vitest 110 files / 610 tests,
     Prettier, ESLint zero warnings, `vue-tsc --noEmit`, Vite build, and
     `git diff --check`; gate log
     `development/evidence/039-028-token-parity-closure.log` ends with
     "Task 028 validation gates all passed."
- Non-blocking documentation tidy-up (no gate/assertion impact): `report.md`
  Verification Commands still cites the pre-fix counts ("Focused token-parity
  Vitest 4/4" and "110 files / 609 tests") while the authoritative gate log
  records 5/5 and 110 files / 610 tests (the new value-parity test added one).
  Update the two count lines when next touching the report.

## Acceptance Assertions Verified

- A2 (theme-parity dimension): verified by executed evidence — light/dark spot
  check in the fresh gate run (runId f26131f6, `ok: true`, 6/6 states:
  overview, deployment detail with log console, login × light/dark), correct
  `data-theme` application per state, light/dark body backgrounds differing
  per route (`rgb(244,247,248)` vs `rgb(8,16,23)`), zero page overflow, zero
  console/runtime/network/HTTP failures; on-disk
  `light-dark-spot-summary.json` / `light-dark-spot-measurements.json` match
  that run. Parent assertion stays `failing` in acceptance.json until phase 8
  aggregates all slices; this task contributes its theme-parity slice.
- A3 (static + browser dimension): verified by executed evidence — focused
  token-parity Vitest 5/5 (re-run), full frontend Vitest 110 files / 610
  tests (gate log 039), ESLint `--max-warnings 0` on `src/regression/tokens/`
  (re-run clean), Prettier, `vue-tsc --noEmit`, Vite build, JS syntax, and
  `git diff --check` all pass (re-runs clean); independent raw-color and
  value-parity scans confirm zero raw hex outside the allowlist and exact
  light/dark palette preservation.
