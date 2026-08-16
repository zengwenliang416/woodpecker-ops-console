# Task Report: 029-static-gate-closure

## Status

DONE

## Files Changed

- Added the Task `029` scope packet, task graph node, task context record, and
  CodeGraph claim/query-plan records.
- `web/.prettierignore`: added `**/._*` so the whole-tree Prettier check is
  not blocked by 211 macOS AppleDouble metadata files.
- `web/src/components/atomic/ListItem.vue`, `web/src/components/atomic/Warning.vue`,
  `web/src/components/layout/Popup.vue`, and
  `web/src/regression/responsive/containment.test.ts`: reformatted to the
  project Prettier style (whitespace/line-wrap only).
- `web/src/components/layout/Popup.vue`: the click-away overlay div now
  carries `role="presentation"`. This is a real accessibility fix surfaced by
  the full-tree gate: the Task `026` semantic-click scanner could not see the
  overlay while its attributes were multi-line, and the formatting collapse
  exposed the missing role.
- Added `evidence/run_static_gate.mjs` and
  `evidence/static-gate-receipt.json`; recorded the executed gate as
  `development/evidence/040-029-static-gate-closure.log`.

## What Changed

- Baseline task `8.1` is implemented as the complete static gate chain over
  the whole frontend: Prettier `-c .` (whole `web/` tree), ESLint
  `--max-warnings 0 .`, `vue-tsc --noEmit`, full Vitest, Vite build, and
  `git diff --check`, executed by one replayable gate script.
- The whole-tree Prettier check surfaced 58 AppleDouble `._*` files (excluded
  via `.prettierignore`) and four genuine format violations (three legacy
  components and the 027 containment suite), all fixed.
- The Popup overlay role fix closes the accessibility gap the full-tree gate
  exposed; no other production behavior changed.

## TDD Evidence

- The gate script fails closed on the first non-zero exit and the receipt
  records per-gate exit statuses and durations.
- Full Vitest: `110` files / `610` tests passing at the closure HEAD.
- The Task `026` accessibility suite (`6/6`) now scans the reformatted
  Popup.vue and passes with the explicit `role="presentation"`.

## Verification Commands

- PASS: `node .../evidence/run_static_gate.mjs` — full gate chain exits `0`
  (recorded in `development/evidence/040-029-static-gate-closure.log`).
- PASS: whole-tree Prettier, ESLint with zero warnings, `vue-tsc --noEmit`,
  full Vitest `110/610`, Vite build, `git diff --check`.

## Concerns

- The `**/._*` Prettier exclusion covers only AppleDouble metadata files; the
  four real format violations fixed in this slice prove real source is still
  checked.
- The gate does not include the six-domain verification (task `8.2`), which
  remains open.

## Scope Deviations

- None. The Popup.vue role addition is a direct consequence of the gate's
  format fixes and is documented in What Changed.

## Follow-up Needed

- Tasks `8.2` (six-domain verification), `8.3` (HTML report), `8.4` (final
  parity declaration), blocked repository-add row `4`, and the parent
  acceptance remain open.
