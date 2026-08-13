# Task Report: 013-repository-regression-coverage

## Status

DONE

## Files Changed

- Repository router, wrapper, activity-table, pull-request route, shared
  pagination, pipeline-store, and settings-table production/tests within the
  expanded red-proven task scope.
- English and Simplified-Chinese copy for disabled pull-request routes.
- Task packet, append-only task ledger/context/validation/drift records, task
  graph, and generated CodeGraph/status artifacts.

## What Changed

- Router coverage now resolves `/repos`, `/repos/add`, activity, branch
  list/detail, pull-request list/detail, manual-run, and all seven repository
  settings destinations from both named routes and inbound paths under the
  configured root path, including params and route metadata.
- `RepoWrapper` now captures a repository ID plus monotonic load generation.
  Repository changes clear old permissions and forge state, and obsolete
  permission, repository, pipeline, or forge fulfillment/rejection cannot
  redirect, notify, start a mismatched downstream load, publish forge state, or
  update last access. `A -> B -> A` no longer makes the first A lifecycle
  current again.
- `RepoWrapper` returns its asynchronous load promise from both Vue lifecycle
  boundaries. Active permission, repository, pipeline, and forge failures clear
  partial shell state and reach the established Vue error handler exactly once
  instead of becoming detached unhandled rejections.
- Wrapper tests protect guest/authenticated pull denial, pull/push/admin/PR
  capability gates, manual and settings route actions, light/dark structural
  control invariance, and every asynchronous load boundary.
- Direct access to disabled pull-request list/detail routes now renders the
  shared localized disabled state instead of throwing. The disabled list does
  not issue a pull-request API request.
- Shared pagination and the pipeline store release loading state through
  `finally` while preserving rejection propagation. Pipeline store loading is
  request-counted so one obsolete or failed overlapping load cannot mark a
  still-pending request idle.
- Structural regressions lock the repository activity table to its local
  `1080px` horizontal scroll region and mobile single-column filters. The
  settings table shell now includes `min-w-0` while preserving its existing
  `overflow-hidden`, local horizontal scroll, and layout/paint containment.

## TDD Evidence

- The initial focused run failed three regressions: obsolete permission
  completion started the wrong repository flow, `A -> B -> A` exposed stale
  shell state, and the settings table lacked `min-w-0`.
- Four redteam probes then failed exactly on rejected pagination loading,
  rejected pipeline-store loading, and disabled PR list/detail direct-route
  throws. A fifth concurrency regression proved overlapping pipeline requests
  could clear loading early.
- The first independent quality review then reproduced detached active-owner
  errors and identified false-positive/no-coverage seams for active failures,
  disabled PR loading, and downstream `A -> B -> A` completions. Four new
  active-rejection tests failed with zero Vue error-handler calls and four
  unhandled rejections before the lifecycle repair.
- The final focused regression command passes `9` files and `63` tests.
- The supporting repository-family command passes `22` files and `118` tests,
  covering existing activity, branch/PR, manual-run, settings, pagination,
  explicit state, permission, action, mutation, and stale-response behavior.
- The complete frontend suite passes `50` files and `314` tests.

## Verification Commands

- PASS: focused router/wrapper/pagination/store/PR/containment Vitest
  (`9` files, `63` tests).
- PASS: supporting repository-family Vitest (`22` files, `118` tests).
- PASS: `pnpm test -- --run` (`50` files, `314` tests) without concurrent build
  load. A prior concurrent run timed out one already-passing repository
  pipeline test; that file passed `10/10` independently before the clean full
  rerun.
- PASS: targeted Prettier for all task production, tests, and locales.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: task JSON/JSONL and CodeGraph JSON parsing.
- PASS: `git diff --check`.
- PASS: SpecNav development entry after each scope expansion.

## Concerns

- These are structural/unit regressions, not rendered sensory evidence.
  Baseline task `4.5` still owns real dark/light, locale, desktop/390px
  production-versus-prototype screenshots and complete repository parity-matrix
  closure.
- Active current-owner request failures propagate through Vue's established
  global error boundary; this task fixes stuck loading, detached promises, and
  obsolete rejection ownership without introducing a parallel page-local error
  cache.

## Scope Deviations

- None. The task scope was explicitly expanded twice only after focused red
  evidence, CodeGraph planning was regenerated, and the development entry
  contract returned `ok:true` before each additional production edit.

## Follow-up Needed

- Complete baseline task `4.5` with equivalent-state repository screenshots,
  theme/locale/permission/data-state comparison, rendered 390px overflow
  measurements, and parity-matrix status updates.

## Adjudication

Implementation and current-byte validation are complete for baseline task
`4.4`. The first spec review approved while the first quality review required
the lifecycle/error-boundary and regression repairs recorded above.
Superseding current-byte spec and quality reviews both approve the final diff;
the spec review verifies `A4` only because task `4.5` still owns current-byte
desktop/390px sensory evidence required for full `A3`. Baseline task `4.5`
remains open.
