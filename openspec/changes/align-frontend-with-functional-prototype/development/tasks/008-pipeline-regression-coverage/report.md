# Task Report: 008-pipeline-regression-coverage

## Status

DONE_WITH_CONCERNS

## Files Changed

- `web/src/router.test.ts`
- `web/src/views/repo/pipeline/PipelineWrapper.vue`
- `web/src/views/repo/pipeline/PipelineWrapper.test.ts`
- `web/src/views/repo/pipeline/Pipeline.test.ts`
- `web/src/components/repo/pipeline/PipelineLog.test.ts`
- `web/src/views/repo/pipeline/PipelineChangedFiles.test.ts`
- `web/src/views/repo/pipeline/PipelineConfig.test.ts`
- `web/src/views/repo/pipeline/PipelineErrors.test.ts`
- `web/src/views/repo/pipeline/PipelineDebug.test.ts`

## What Changed

- Added direct named-route resolution coverage for pipeline overview, selected
  step, changed files, config, errors, and Debug under the configured
  Woodpecker root path. Each generated destination is also resolved from its
  inbound `/repos/...` path so static diagnostic routes are directly asserted
  not to fall through the optional `stepId` route.
- Added direct tab target/count coverage for the current overview,
  changed-files, config, errors, and push-gated Debug tabs.
- Added all three killed-pipeline cancellation branches: superseded pipeline
  navigation, canceling user, and canceling step.
- The canceled-step regression failed because `PipelineWrapper.vue` passed the
  value as `user` while the existing locale contract requires `step`. The
  production fix changes only that interpolation key.
- Added workflow PID, valid step PID, invalid step fallback, and mobile
  log-close route parameter coverage.
- Preserved and consolidated existing status, action, busy, read-only,
  approval/decline, empty workflow, pipeline error, stale-log, diagnostic empty
  state, and metadata download coverage.
- Added local responsive containment regressions for header/action wrapping,
  overview/table width ownership, log toolbar/console scrolling, long changed
  file paths, read-only config, long runtime errors, and Debug CLI/version code.
- No route, API, store, backend, permission, status, locale text, dependency,
  prototype, or task `3.5` sensory behavior changed.

## TDD Evidence

- The first combined focused run produced 69 passing assertions, one real
  killed-step cancellation failure, and one unrelated 5-second router dynamic
  import timeout under concurrent file transformation.
- The real failure rendered `Canceled due to` instead of
  `Canceled due to build`, proving the existing locale interpolation mismatch
  before the production fix.
- After the scope update and one-line production correction, the isolated
  router suite passed 1 file / 2 tests, the component suite passed 7 files / 64
  tests, and the consolidated focused suite passed 8 files / 66 tests.
- The router matrix intentionally performs one dynamic router import instead
  of six repeated imports; the final consolidated run no longer times out.
- Independent quality review rejected the original matched-name assertion as
  tautological because it resolved routes only by name. The corrected test now
  resolves every inbound path, verifies its terminal route name and repository/
  pipeline parameters, requires the selected-step parameter only for the step
  route, and forbids it on static diagnostic routes.
- The final complete frontend suite passed 28 files / 175 tests.

## Verification Commands

- PASS: `pnpm exec vitest run src/router.test.ts`
  (1 file, 2 tests).
- PASS: `pnpm exec vitest run src/views/repo/pipeline/PipelineWrapper.test.ts src/views/repo/pipeline/Pipeline.test.ts src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.test.ts`
  (7 files, 64 tests).
- PASS: consolidated focused Vitest command from `brief.md`
  (8 files, 66 tests).
- PASS: final isolated `pnpm test -- --run`
  (28 files, 175 tests).
- PASS: post-review isolated router rerun (1 file, 2 tests), consolidated
  focused rerun (8 files, 66 tests), and complete rerun
  (28 files, 175 tests).
- PASS: targeted Prettier for the production correction and all eight test
  files.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the two pre-existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: `git diff --check`.

## Concerns

- The first combined focused run included a router import timeout while the
  other files transformed. Isolated router and final consolidated reruns passed
  after the route matrix was reduced to one import, so the timeout is not an
  unresolved product failure.
- The first quality review correctly identified that resolving only by route
  name could not prove inbound URL precedence. The final path-based regression
  removes that gap without changing router production code.
- Responsive assertions in this slice protect structural `min-w-0`,
  `flex-wrap`, and local `overflow-*` contracts. They are not a substitute for
  rendered desktop/`390px`, theme, locale, permission, and screenshot evidence.
- Vite retains the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.

## Scope Deviations

- The initial task was test-only. A new regression proved that
  `PipelineWrapper.vue` used the wrong existing i18n parameter for
  `canceled_by_step`. The task packet, graph, and context were updated to add
  that single production file, and the development entry contract returned
  `ok:true` before the one-line fix.

## Follow-up Needed

- Baseline task `3.5` remains responsible for consolidated pipeline
  desktop/mobile dark-mode and representative light-mode browser evidence.
- The full pipeline route-family/global `A2` and `A3` assertions remain open
  until task `3.5` records equivalent production/prototype sensory evidence.

## Adjudication

Baseline task `3.4` may close after independent spec and quality review. This
slice provides replayable unit/static evidence for current pipeline
route/action/data/containment contracts and repairs one regression-proven
translation parameter defect. It does not complete task `3.5`, sensory parity,
or the entire pipeline route family.
