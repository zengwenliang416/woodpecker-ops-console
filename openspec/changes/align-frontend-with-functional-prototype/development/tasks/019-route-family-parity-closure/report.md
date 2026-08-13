# Task Report: 019-route-family-parity-closure

## Status

DONE

## Files Changed

- Added `web/src/route-family-parity.test.ts`, a concentrated contract for
  parity rows `1` and `24-45`.
- Added the task-local `019` Mock API, aggregate browser capture runner, strict
  evidence verifier, `92` current-byte measurement JSON files, and `92` PNG
  screenshots.
- Added task packet, task graph, CodeGraph claim/query, and append-only
  implementation validation and drift records.
- No production route, component, API, store, backend, locale, dependency, or
  approved-prototype file changed.

## What Changed

- The concentrated route contract owns exactly rows `1` and `24-45`, resolves
  all `23` production destinations from inbound paths and named routes, and
  checks route names, dynamic parameters, authentication metadata,
  system-administrator inheritance, guest-only blank login, CLI callback query,
  organization header metadata, and catch-all not-found ordering.
- The same test verifies that all `32` existing organization,
  administration, user, login, CLI authorization, and not-found focused
  component suites remain present. Their behavior stays in the route-specific
  suites rather than being duplicated.
- The aggregate evidence producer replays the existing task `015`, `016`, and
  `017` destination definitions against current production and approved
  prototype bytes. All outputs are redirected into task `019`, use one task
  `019` fixture, and share one run ID.
- Every runtime source transformation now requires exactly one matching anchor
  and explicit postconditions for the evidence root, run ID, fixture, Mock API
  port, terminal path, bounded cleanup, and browser-compatible reverse loop.
- The final post-review-fix evidence run
  `93ce89f7-0d51-40ba-827e-3731aeea2f96` captured exactly `92` states:
  `46` production and `46` prototype states across desktop `1600x1000` and
  mobile `390x844` in dark Simplified Chinese.
- The evidence runner records stable source identities before capture and
  rejects changes during replay. The final production SHA-256 is
  `bc0b7774bdba36ef2849d60a10abbaf289077b6c4ddfb6f4f9fd01efaec46512`;
  the approved prototype SHA-256 is
  `59662a4cd925a321a10b584bb9eec0897fc84f99d459cdd3eeb6b519ee12e5e2`.
- The strict verifier independently checks exact rows and state IDs, one run
  ID, service identity, source identity, production terminal route and full
  path, prototype path, viewports, exact dark theme, production `zh-Hans`,
  prototype `zh-CN`, page overflow, raw localization keys, destination/surface
  content patterns recomputed against persisted body text, exact non-empty
  assertion inventories, exact console/runtime/network/HTTP health schemas,
  PNG signatures, and PNG dimensions.
- The persistent red-team runner copies the complete evidence set into isolated
  temporary roots and proves the verifier rejects `14` mutations: wrong theme,
  wrong locale, tampered body text, empty and missing content assertions,
  empty health, a missing health key, wrong terminal path, wrong terminal
  route, overflow, source-identity drift, PNG signature corruption, PNG
  dimension corruption, and run-ID drift.
- Cleanup no longer treats signal delivery as process exit. The task-local
  transformed producers wait after SIGTERM, send SIGKILL when necessary, wait
  again, fail if the child remains alive, and verify every group port becomes
  free.

## TDD Evidence

- The initial concentrated contract passed `2` files and `39` tests with the
  existing router suite.
- The complete route-family focused command passed `34` files and `173` tests.
- The final complete frontend suite passed `85` files and `496` tests.
- The strict verifier initially found a verifier-only filename-order defect:
  extension-aware sorting ordered `admin-forge-create.json` before
  `admin-forge.json`. Sorting normalized state IDs after removing extensions
  repaired the verifier without changing any browser evidence.
- Initial independent spec and quality reviews reproduced fail-open behavior:
  wrong theme/locale, tampered body text, empty content assertions, and empty
  health were incorrectly accepted. The verifier and capture adapter were
  repaired before the final capture.
- All `14` persistent red-team mutations now exit `1`, while the positive
  verifier passes the restored current-byte evidence.

## Verification Commands

- PASS: concentrated router contract plus existing router tests, `2` files /
  `39` tests.
- PASS: all organization, administration, user, login, CLI auth, and not-found
  focused suites, `34` files / `173` tests.
- PASS: `pnpm test -- --run`, `85` files / `496` tests.
- PASS: targeted Prettier for the new test, task packet, evidence scripts,
  task graph, and CodeGraph plans.
- PASS: `pnpm lint` with zero warnings.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the existing `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: evidence JavaScript and Python syntax.
- PASS: final aggregate capture run
  `93ce89f7-0d51-40ba-827e-3731aeea2f96`, exact `92/92` states with zero failed
  states.
- PASS: strict evidence verifier, exact `92` measurements and `92` screenshots
  for rows `1` and `24-45`.
- PASS: persistent verifier red-team, all `14` theme/locale/content/schema/
  route/overflow/source/PNG/run-ID mutations rejected; positive verifier exit
  `0`.
- PASS: task JSON, lifecycle JSONL, CodeGraph plan generation, bounded service
  cleanup, and `git diff --check`.
- PASS: installed SpecNav development entry contract, `19` formal tasks,
  `19` owned items, `19` context rows, zero blockers.

## Concerns

- The installed SpecNav development contract was locally repaired before this
  slice to support the established `phases/vertical_slices` plus append-only
  context model while keeping new packets strict. A future plugin refresh can
  overwrite that local cache repair; task `019` itself does not modify or
  commit the plugin.
- The aggregate runner intentionally adapts the already reviewed `015-017`
  capture scripts at runtime rather than duplicating roughly 1,400 lines of
  CDP logic. Exact-one transformation anchors and postconditions now make the
  adapter fail closed before generated code executes, and the `019` verifier
  independently validates every resulting file, route, path, source hash,
  content oracle, locale/theme field, and browser-health field.
- Browser evidence covers one equivalent populated dark Simplified-Chinese
  state at both required viewports. Existing focused suites remain responsible
  for loading, empty, error, retry, mutation, permission, disabled, and
  obsolete-completion variants.

## Scope Deviations

- The planned slice permitted focused test-only corrections if current-byte red
  evidence required them, but no existing focused suite needed modification.
  The only frontend change is the new concentrated route contract; all other
  additions are task-local evidence and lifecycle artifacts.
- No current product behavior, route, API, store, locale, backend, dependency,
  permission rule, or approved prototype byte changed. Rows `2-23` and `46+`,
  phases `6-8`, and complete change-level acceptance remain outside this
  closure.

## Follow-up Needed

- The superseding independent spec and quality reviews approve the current
  task bytes. Closure records must bind those approvals and the signed
  current-HEAD validation receipt before rows `1` and `24-45`, baseline task
  `5.5`, task `019`, and phase 5 are marked complete.
- Operations rows `46+`, phases 6-8, and complete change-level acceptance
  remain open.

## Adjudication

The implementation evidence supports task-scoped `A2` for the organization,
administration, user, authentication, and error route families, and
task-scoped `A3` for the current frontend checks and browser review. It does
not change `acceptance.json`, which truthfully remains failing until all later
route families and cross-cutting work are complete.
