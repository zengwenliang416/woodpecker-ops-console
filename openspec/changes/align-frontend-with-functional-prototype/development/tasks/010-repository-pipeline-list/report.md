# Task Report: 010-repository-pipeline-list

## Status

DONE_WITH_CONCERNS

## Files Changed

- `web/src/views/repo/RepoPipelines.vue`
- `web/src/views/repo/RepoPipelines.test.ts`
- `web/src/store/pipelines.ts`
- `web/src/store/pipelines.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `development/tasks/010-repository-pipeline-list/evidence/capture_browser.mjs`
- `development/tasks/010-repository-pipeline-list/evidence/verify_evidence.mjs`
- `development/tasks/010-repository-pipeline-list/evidence/manifest.json`
- Four populated/filtered-empty desktop/mobile PNG files under the task-local
  `evidence/` directory.
- This report and the independent review files.

## What Changed

- Replaced the repository root's legacy stacked pipeline cards with three
  data-derived metric cards and a dense table over the real injected pipeline
  collection.
- Added text, status, branch, and event filters with translated accessible
  names, explicit reset behavior, and separate no-pipeline and no-match states.
- Added ten-row local pagination. Advancing beyond the loaded boundary calls
  only `usePipelineStore.loadRepoPipelines(repoId, nextPage)` and relies on the
  existing `hasMore` signal without presenting a fabricated server total.
- Successful additional-page cursors are retained per repository at module
  scope, so a remounted repository continues after its last confirmed API page
  without inferring pages from a shared pipeline-map entry count.
- The component observes successful `loadRepoPipelines(repoId, page)` actions
  and records `hasMore` only for the repository and confirmed API page carried
  by that action. The store returns the request-local boolean, so concurrent
  action completions cannot substitute another repository's global value.
  Same-length page refreshes are captured, while unrelated
  live/detail/last-pipeline inserts never sample the store-global field.
- Preserved pipeline detail navigation, the existing manual-run action owned
  by `RepoWrapper.vue`, and the existing deployment popup.
- Deployment entry is visible only for successful pipelines when both
  repository push permission and `allow_deploy` are true. Read-only users
  retain list and detail navigation.
- Repository changes reset local filters, pagination, and an open deployment
  popup so state from the previous repository cannot leak into the next route.
- Additional-page completion is guarded by repository id and a local
  generation token. An obsolete request finishing after a route switch cannot
  update the new repository's client page, server page, or loading state.
- An obsolete response can still update the legacy store-global field, but its
  request-local action result records only the obsolete repository's snapshot
  and cannot alter the active route's pagination decision.
- Obsolete request rejection is discarded after a repository switch; a
  rejection for the still-active repository continues to propagate to the
  existing route/API error boundary.
- Initial loading hides all data-derived metric cards and presents only the
  shared loading feedback, so unconfirmed `0/0` and zero-sample values are not
  shown as real data.
- The route uses the existing `calculatePipelineStats`, `useDate`,
  `OpsMetricCard`, `FeedbackState`, `PipelineStatusIcon`, buttons, icons, store,
  permission injection, and deployment popup rather than adding a parallel
  table/store/API abstraction.

## TDD Evidence

- Added nine focused component cases before closure. They verify real-data
  metric derivation, all four filters, translated accessible names, local and
  authoritative next-page pagination, remount continuation from a confirmed
  API cursor, same-length page-one completion, obsolete action/global-`hasMore`
  isolation after a live insertion, obsolete rejection isolation, initial
  loading without metric zeroes, empty and no-match states, filter reset,
  detail route input, successful-only deployment visibility, push/read-only
  gating, repository deployment settings, and repository-change reset
  behavior.
- The existing `repoMetrics` suite remains the calculation boundary for
  terminal success rate and valid completed duration samples.
- Added one real Pinia store regression that resolves two repository list
  requests in the same turn and proves their action hooks receive distinct
  request-local `false` and `true` results.
- The exact focused command passes `3` files and `13` tests.
- The complete frontend suite passes `30` files and `185` tests.

## Verification Commands

- PASS: `pnpm exec vitest run src/store/pipelines.test.ts src/views/repo/RepoPipelines.test.ts src/lib/repoMetrics.test.ts`
  (`3` files, `13` tests).
- PASS: targeted Prettier check for the component, focused test, and both
  locale files.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm test -- --run` (`30` files, `185` tests).
- PASS: `pnpm build`; only the two existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: `git diff --check`.
- PASS: SpecNav development entry contract (`ok:true`); only existing
  CodeGraph indexing/claim warnings remain.
- PASS: `node evidence/capture_browser.mjs` records populated and
  filtered-empty states at `1280x720` and `390x844`, including document, page,
  table-container, and table width/overflow measurements plus four PNG files.
- PASS: `node evidence/verify_evidence.mjs` verifies all four screenshot
  checksums and dimensions, exact state matrix, no raw locale keys, no
  page-level horizontal overflow, local dense-table scroll ownership, and
  explicit no-match feedback.
- Desktop populated evidence records document `1280/1280`, page `992/992`, and
  a `990px` `overflow-x:auto` container around the `1080px` table.
- Mobile populated evidence records document `390/390`, page `358/358`, and a
  `356px` `overflow-x:auto` container around the `1080px` table.

## Concerns

- This task proves populated and filtered-empty repository pipeline-list
  states. Baseline task `4.5` still owns the complete repository parity-matrix
  replay across all repository routes, permissions, themes, and locales.
- The browser screenshots are sensory/layout evidence, not a browser-console
  health contract. Full repository-family browser health and same-state
  prototype comparison remain in task `4.5`.
- Vite build still emits the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`; this slice does not change either
  hook.

## Scope Deviations

- The user approved one minimal scope expansion on `2026-08-10` after a real
  Pinia concurrency probe proved the component could not recover request-local
  `hasMore` from a `void` store action. `web/src/store/pipelines.ts` now returns
  the already-computed boolean, and `web/src/store/pipelines.test.ts` protects
  that result. No API, backend, route, permission, dependency, or store
  architecture changed.

## Follow-up Needed

- Continue with task `4.2` for branch and pull-request list/detail routes after
  both independent reviews approve this slice.
- Keep tasks `4.4` and `4.5` open for repository-family regression and full
  sensory closure.

## Adjudication

Baseline task `4.1` may close when current-byte independent spec and quality
reviews approve the implementation and the task artifacts pass SpecNav
contract parsing. The concerns above are assigned to existing baseline tasks
and do not reduce this slice's implementation scope.
