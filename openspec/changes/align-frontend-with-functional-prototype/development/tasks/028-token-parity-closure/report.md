# Task Report: 028-token-parity-closure

## Status

DONE

## Files Changed

- Added the Task `028` scope packet, task graph node, task context record, and
  CodeGraph claim/query-plan records.
- `web/src/style.css`: added `--wp-log-*` (console background/text/muted/success/
  warning/danger/info), `--wp-login-*` (gradient and decorative glow rgb
  channels), `--wp-primary-hover-100`, `--wp-primary-glow-rgb`, `--wp-ansi-*`
  (32 colors with light and dark values), and `--wp-syntax-*` (16 colors with
  light and dark values) tokens in both theme blocks.
- `web/src/style/console.css`: the ANSI console palette now references
  `var(--wp-ansi-*)`; zero raw colors remain.
- `web/src/style/prism.css`: the syntax-highlight palette now references
  `var(--wp-syntax-*)`; zero raw colors remain.
- `web/src/views/deployments/DeploymentDetail.vue`: the log console styles use
  the `--wp-log-*` tokens.
- `web/src/views/Login.vue`: the background gradient and decorative glow/grid
  gradients use the `--wp-login-*` tokens.
- `web/src/components/atomic/Button.vue`: the primary-button hover gradient and
  glow shadow use `--wp-primary-hover-100` / `--wp-primary-glow-rgb`.
- `web/src/views/infrastructure/InfrastructureOverview.vue`: the status-dot
  glow shadow uses `--wp-primary-glow-rgb`.
- `web/src/components/layout/header/ActivePipelines.vue`: the spinner arc
  gradient uses the both-themes `--wp-spinner-arc-100` token.
- Added `web/src/regression/tokens/token-parity.test.ts`: four regressions
  (raw-color scan with the token-definition allowlist, ANSI/syntax palette
  hygiene, `--wp-*` token resolution, light/dark theme-block structure).
- Added `evidence/spot_check.mjs`: the light/dark browser spot check
  (overview, deployment detail with log console, login at desktop in both
  themes), plus `evidence/light-dark-spot-summary.json` and
  `evidence/light-dark-spot-measurements.json`.
- Updated the Task `027` consolidated Mock API with the deployment logs
  endpoint and the `approvals` field on the deployment detail fixture so the
  detail route renders in the spot check.
- No route, API, permission, store, or data-flow behavior changed; the diff is
  color-value plumbing only.

## What Changed

- Baseline task `7.4` is implemented as the removal of page-local color
  systems: every raw hex/rgb/rgba color value outside the token-definition
  files was migrated to a semantic `--wp-*` token with explicit light and dark
  values.
- The ANSI console palette (32 colors) and the syntax-highlight palette (16
  colors) moved from self-contained page-local systems into the token system;
  their light and dark values are preserved exactly, so visual output is
  unchanged.
- The deployment log console, login background, primary button hover/glow,
  status-dot glow, and header mask gradients now resolve through tokens.
- The spot check verified light and dark rendering parity on representative
  routes (data-theme application, body backgrounds differing between themes,
  zero overflow, zero console/runtime/network/HTTP failures) and in doing so
  surfaced and fixed a mock-fixture gap (the deployment detail fixture lacked
  the `approvals` field, which the detail view renders).

## TDD Evidence

- `web/src/regression/tokens/token-parity.test.ts` (`5/5`): the raw-color scan
  fails when a new hex/rgb color appears outside the allowlist
  (`tailwind.css`, `style.css`, `useTheme.ts`, test files); the ANSI/syntax
  palettes are proven raw-color-free; every referenced `--wp-*` token
  resolves to a definition; both theme blocks are structurally parallel.
- The light/dark spot check (`6/6` states) fails closed on data-theme
  mismatch, identical light/dark backgrounds, page overflow, or any browser
  health failure.
- Full frontend Vitest passes `110` files / `610` tests at the closure HEAD (the token-parity suite runs inside the full suite).

## Verification Commands

- PASS: `node .../evidence/validate_task.mjs` — full gate chain exits `0`
  (final run recorded in `development/evidence/039-028-token-parity-closure.log`).
- PASS: Focused token-parity Vitest `5/5`; light/dark spot check `6/6`; full Vitest `110` files / `610` tests.
- PASS: Prettier, ESLint with zero warnings, `vue-tsc --noEmit`, Vite build,
  JavaScript syntax, JSON/JSONL parsing, and `git diff --check`.

## Concerns

- The `--wp-ansi-*` and `--wp-syntax-*` palettes keep their exact current
  colors; the slice tokenizes the definition site rather than restyling the
  code/console surfaces.
- The spot check samples three representative routes in both themes; it is a
  parity probe, not a re-screenshot of all 67 parity rows in both themes
  (the per-slice dark-theme bundles and the Task `027` three-viewport audit
  remain the per-route evidence).

## Scope Deviations

- The Task `027` consolidated Mock API
  (`development/tasks/027-responsive-containment-closure/evidence/mock_api.py`)
  was extended with the deployment logs endpoint and the `approvals` field on
  the deployment detail fixture; it is shared test infrastructure required by
  the light/dark spot check, documented here rather than claimed as "None".
- `web/src/views/infrastructure/InfrastructureOverview.vue` was migrated
  (status-dot glow shadow to `--wp-primary-glow-rgb`) even though it is not
  in the brief's allowed-files list; it was a raw-color finding of the scan
  and is recorded here as a scope deviation rather than silently omitted.
- The production diff is otherwise confined to the token system and the
  component/view list in the brief; no route, API, permission, store, or
  data-flow behavior changed.

## Follow-up Needed

- Phase `8` baseline tasks `8.1-8.4` (static gates, six-domain verification,
  HTML report, final parity declaration), blocked repository-add row `4`, and
  the parent acceptance remain open.
