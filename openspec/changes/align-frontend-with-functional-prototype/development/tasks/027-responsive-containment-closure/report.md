# Task Report: 027-responsive-containment-closure

## Status

DONE

## Files Changed

- Added the Task `027` scope packet, task graph node, task context record, and
  CodeGraph claim/query-plan records.
- Added `evidence/mock_api.py`: the consolidated cross-family fixture extending
  the `009/014/015/016` chain with overview, user-token, infrastructure, and
  deployment endpoints.
- Added `evidence/matrix.mjs`: 13 representative production routes x 3
  viewports (desktop `1280x1000`, tablet `768x1024`, mobile `390x844`) in dark
  Simplified Chinese.
- Added `evidence/capture_responsive.mjs`: CDP capture measuring page-level
  horizontal overflow, dense-container containment, overflow contributors,
  raw i18n keys, and browser health per state; writes 39 measurement JSONs,
  39 PNGs, the replay summary, and the checksummed evidence manifest.
- Added `evidence/verify_responsive.mjs`: strict verifier failing closed on
  overflow, uncontained dense content, contributors, raw i18n, health
  failures, inventory drift, and PNG/JSON digest drift against the pinned
  manifest.
- Added `evidence/redteam_verifier.mjs`: persistent red-team proving the
  verifier rejects all 9 isolated mutations (baseline passes).
- Added `evidence/validate_task.mjs`: the full gate chain.
- Added `web/src/regression/responsive/containment.test.ts`: the source-level
  responsive containment regression suite locking the shared scroll-wrapper
  contract (every `<table>` under a scroll containment context, the
  `wp-table-scroll` primitive horizontally scrollable, the app shell full
  width with a contained vertical scroll region, dense fixed-min-width tables
  paired with the shared wrapper, and the pipeline log surface inside its own
  scroll region).
- Fixed `web/src/views/Repos.vue`: the filter grid now uses
  `md:grid-cols-[minmax(0,1fr)_140px_140px]` with the original four-column
  layout preserved at `xl`, so the fixed `260+140+140` columns no longer
  overflow the narrow tablet content area (768px minus the 248px sidebar).
- Fixed `web/src/components/agent/AgentList.vue`: the agent row wraps
  (`flex-wrap`) and the badge group wraps internally (`flex-wrap justify-end`),
  so the six-badge metadata row is contained at tablet and mobile widths.
- Updated `route-parity.md` rows `1, 2, 3, 11, 24, 28, 32, 34, 39, 45, 47, 57,
58` with the Task `027` cross-viewport containment evidence reference
  without downgrading any status.

## What Changed

- Baseline task `7.3` is implemented as a replayable cross-family responsive
  containment audit: every completed route family is sampled at desktop,
  tablet, and mobile widths and must pass the strict verifier.
- The audit found and the slice repaired two genuine tablet/mobile
  containment defects that the per-family desktop/390px evidence had missed:
  - The repositories filter grid overflowed the card at `768` because the
    `md` breakpoint forced `260+140+140` fixed columns into a ~520px content
    area; the second select was clipped by the card's `overflow-hidden`.
  - The agent list metadata row (up to six nowrap badges plus actions) was a
    single non-wrapping flex item wider than the row at tablet and mobile.
- The repairs are minimal presentation changes; no route, API, permission,
  store, or data-flow behavior changed.
- The capture, verifier, and red-team are the red-capable regressions: the
  audit failed on both defects before the repairs and passes 39/39 after;
  the strict verifier fails closed on any future page-level overflow,
  uncontained dense content, or evidence tampering.
- `web/src/regression/responsive/containment.test.ts` (5 tests) locks the
  source-level containment contract so a future table without a scroll
  wrapper or a non-scrollable dense table fails the Vitest suite.

## TDD Evidence

- `capture_responsive.mjs` fails closed when a state cannot reach its
  readiness pattern or any command fails; before the two repairs it measured
  and flagged the overflowing contributors in the evidence.
- `verify_responsive.mjs` rejects any state with page-level horizontal
  overflow, overflow contributors, uncontained dense containers
  (`scrollWidth > clientWidth + 1` without `overflow-x: auto/scroll`), raw
  i18n keys, console/runtime/network/HTTP failures, inventory drift, or
  manifest digest drift.
- `redteam_verifier.mjs`: baseline copy passes; all `9/9` isolated mutations
  (run-id tamper, overflow injection, uncontained-dense injection, raw-i18n
  injection, health injection, PNG corruption, viewport tamper, state-count
  tamper, evidence-file removal) are rejected.
- Full frontend Vitest passes `109` files / `605` tests at the closure HEAD (the three focused suites of slices `025/026/027` run inside the full suite).

## Verification Commands

- PASS: `node .../evidence/capture_responsive.mjs` — `39/39` states measured,
  `ok: true`, zero failed states.
- PASS: `node .../evidence/verify_responsive.mjs` — strict verification passed
  for 39 states (overflow, containment, i18n, health, inventory, digests).
- PASS: `node .../evidence/redteam_verifier.mjs` — baseline passed; `9/9`
  mutations rejected.
- PASS: `node .../evidence/validate_task.mjs` — full gate chain exits `0`.
- PASS: Full frontend Vitest (`109` files / `605` tests), Prettier, ESLint with zero warnings,
  `vue-tsc --noEmit`, Vite build, JavaScript syntax, JSON/JSONL parsing, and
  `git diff --check`.

## Concerns

- The matrix samples 13 representative routes (one per family) rather than
  re-measuring all 67 parity rows at three viewports; the per-family
  desktop/390px bundles from Tasks `014/020-022` remain the per-route parity
  evidence, and this slice adds the consolidated three-viewport containment
  dimension.
- The Vite HMR websocket and fixture SSE stream may record
  `ERR_CONNECTION_CLOSED` during hard navigations; these environment-artifact
  failures are recorded per state under `health.allowedArtifactFailures` and
  excluded from the fail set, mirroring the optional-asset treatment of the
  Task `021/022` capture.

## Scope Deviations

- None. The two production repairs are confined to the responsive/containment
  surface and are the only production changes of the slice.

## Follow-up Needed

- Baseline task `7.4` (light/dark semantic token parity), phases `8.1-8.4`
  (static, six-domain verification, HTML report, final parity declaration),
  blocked repository-add row `4`, and the parent acceptance remain open.
