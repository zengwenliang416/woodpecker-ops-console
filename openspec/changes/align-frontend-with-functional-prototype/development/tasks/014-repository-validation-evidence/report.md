# Task Report: 014-repository-validation-evidence

## Status

DONE_WITH_CONCERNS

## Files Changed

- `route-parity.md` repository rows `3` through `23`.
- Task-local deterministic Mock API, smoke runner, CDP capture runner, strict
  evidence verifier, `100` JSON measurements, `100` matching PNGs, browser
  replay summary, and checksum manifest.
- Task brief/context and append-only development lifecycle, validation, and
  drift records.
- No production `web/`, router runtime, API/store, locale, permission,
  dependency, backend, or approved-prototype file changed.

## What Changed

- Replayed all `21` repository parity destinations against the current
  production commit and the immutable approved prototype in dark Simplified
  Chinese at `1600x1000` and `390x844`.
- Added `16` representative production states for light English, push,
  read-only, and administrator permissions, producing `100` total states:
  `58` production and `42` prototype.
- Recorded exact URL, production terminal route, viewport, PNG dimensions,
  theme, locale, content assertions, controls, page and local-container
  overflow, raw i18n keys, semantic markers, and browser health per state.
- Verified rows `3` and `5-23`. Row `4` is evidence-bearing `blocked` because
  production `/repos/add` renders the current Forge activation list with `0`
  wizard steps while the approved prototype renders a `4`-step configuration
  wizard at both viewports.
- Verified read-only behavior directly: repository activity remains readable,
  manual run and general settings redirect to `/overview` with permission
  feedback, and Debug preserves `repo-pipeline-debug` plus pipeline `842` while
  denying access.
- Added a strict verifier for the exact state matrix, URL and route identity,
  theme/locale/permission, content assertions, page and local overflow,
  browser health, row `4` semantic delta, service/Git identity, production
  byte stability, dependency fixtures, and aggregate checksums.
- Removed evidence resume entirely. Final capture always starts and owns fresh
  Mock API, production, and prototype processes on exclusive ports and
  recaptures all `100` states.
- Bound every measurement, the replay summary, service identity, and manifest
  to run `1082fba7-576e-4c0f-8f72-fb8beca08df0`. Summary and manifest writes
  use temporary files plus atomic rename; the verifier rejects mixed run IDs,
  unexpected files/directories, protected-tree drift, and unknown warning
  categories.

## TDD Evidence

- This is an evidence-only slice. No production behavior was implemented, so
  no new product red/green test was required.
- The Mock API smoke covers repository lists and activation candidates,
  repository detail/permissions, pipelines, branches, pull requests, Secrets,
  Registries, Crons, and read-only/administrator switching.
- The capture verifier rejects missing or extra states, incorrect routes,
  dimensions, themes, locales, permissions, failed content assertions, raw
  locale keys, page overflow, unhealthy browser records, permission leakage,
  service drift, mixed capture runs, unexpected evidence inventory, unknown
  warning classes, and checksum drift.
- The current repository-focused suite passes `32` files and `214` tests. The
  complete frontend suite passes `50` files and `314` tests.

## Verification Commands

- PASS: repository-focused Vitest, `32/32` files and `214/214` tests.
- PASS: `pnpm test -- --run`, `50/50` files and `314/314` tests.
- PASS: targeted Prettier for all existing task production/test paths plus the
  task packet, parity matrix, and evidence scripts.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the two existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: task-local Mock API smoke.
- PASS: final no-resume browser replay and strict evidence verification for
  exactly `100` JSON plus `100` PNG states.
- PASS: `115` changed/untracked JSON and JSONL files parsed.
- PASS: `git diff --quiet HEAD -- web` and `git diff --check`.
- The first Prettier invocation used `pnpm --dir web` with repository-root
  paths and failed path resolution. The corrected pre-format run then
  accurately reported the three edited Markdown/MJS files needing formatting.
  Both receipts are superseded by the final passing root-binary check.

## Concerns

- Repository row `4` remains intentionally `blocked`. Closing that parity gap
  requires a future product/implementation slice for the approved four-step
  repository configuration wizard; this evidence task does not authorize that
  production change.
- The production captures preserve `8984` classified warning records:
  `8900` vue-i18n fallback-chain diagnostics, `24` Vue extraneous-prop
  warnings, and `60` Vue Router deprecation warnings, with `other: 0`. They
  contain no error-level console entries and render `0` raw i18n keys, but
  warning cleanup remains appropriate for baseline task `7.1`.

## Scope Deviations

- No implementation scope deviation occurred.
- The task packet initially named nonexistent `web/src/views/Repos.test.ts`.
  The invalid path was removed from the verification command and `test_paths`;
  no test or production scope was removed because the file does not exist at
  the current commit.

## Follow-up Needed

- Keep route-parity row `4` blocked until the approved four-step repository
  wizard is implemented and replayed at both viewports.
- Continue with baseline task `5.1`; organization, administration, user,
  operations, accessibility/i18n, responsive closure, and full-change
  verification remain open.

## Adjudication

Baseline task `4.5` is complete as a verification task: every repository row
has current same-state evidence and an honest terminal status. The repository
family is not globally parity-complete because row `4` is blocked. This task
may verify repository-row coverage and current validation quality without
claiming all-route `A1`, full repository-family `A2`, or full-change
completion.
