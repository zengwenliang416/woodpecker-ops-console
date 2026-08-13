# Quality Review: 013-repository-regression-coverage

## Verdict

approved

## Separation Of Concerns

- Repository lifecycle orchestration remains in `RepoWrapper`; reusable
  pagination loading remains in `usePagination`; cross-route pipeline cache and
  shared loading state remain in the Pinia pipeline store. Pull-request routes
  reuse `FeedbackState` and i18n rather than introducing a parallel error
  component.
- `RepoWrapper` captures the repository ID and a monotonic generation before
  starting permission, repository, pipeline, and forge work
  (`web/src/views/repo/RepoWrapper.vue:109-156`). Only the current lifecycle may
  publish permissions, redirects, forge state, or last access.
- Both Vue boundaries preserve the asynchronous contract:
  `onMounted(loadRepo)` and the watch callback return the `loadRepo()` promise
  (`RepoWrapper.vue:167-169`). Active failures therefore remain owned by Vue's
  established error handler instead of a new page-local error channel.

## Component Cohesion / Coupling

- `RepoWrapper` remains the cohesive owner of injected repository,
  permissions, pipelines, forge selection, redirects, and last-access effects.
  Active failures clear partial permission and forge state before propagating;
  obsolete failures cannot clear the newer lifecycle
  (`RepoWrapper.vue:158-164`).
- `startLoading()` / `finishLoading()` centralize the pipeline store's loading
  counter, and all three load actions use the same `try/finally` contract
  (`web/src/store/pipelines.ts:38-48,99-153`). This avoids coupling individual
  pages to counter maintenance.
- Pull-request availability remains a route-local computed condition derived
  from the injected repository. No API, authentication, permission
  calculation, backend contract, or compatibility path was added.

## Test Quality

- Independent execution passed the exact focused command at `9/9` files and
  `63/63` tests. The current system-executed receipts also record the supporting
  repository family at `22/22` files and `118/118` tests and the clean full
  frontend suite at `50/50` files and `314/314` tests.
- The four-stage active-rejection matrix supplies a Vue error handler and
  rejects permission, repository, pipeline, and forge loading independently
  (`web/src/views/repo/RepoWrapper.test.ts:378-403`). Each case asserts one
  error-handler delivery, hidden shell state, no last-access update, and no
  later downstream action. The passing Vitest run reports no unhandled
  rejection.
- Same-ID `A -> B -> A` coverage now includes the first A permission,
  repository, pipeline, and forge completion after the newest A lifecycle
  becomes authoritative (`RepoWrapper.test.ts:485-584`). The downstream tests
  assert stable call counts, current forge state, and no stale last-access
  publication.
- The disabled pull-request list mock now captures and executes the loader
  supplied to `usePagination` (`web/src/views/repo/RepoPullRequests.test.ts:29-47`).
  Its disabled-route assertion therefore fails if the production availability
  guard is removed and an API request is made.
- Router coverage is table-driven, and activity/settings CSS assertions are
  correctly limited to structural containment. They do not overclaim rendered
  mobile or sensory parity.

## Error Handling

- Active wrapper failures clear partial shell state and rethrow through the
  returned lifecycle promise. Obsolete fulfillment and rejection are ignored
  only after generation and repository ownership have changed.
- `usePagination` releases only the active generation's loading flag in
  `finally` (`web/src/compositions/usePaginate.ts:50-77`), so an obsolete
  request cannot mark its replacement idle. The rejection regression verifies
  both propagation and loading release.
- The pipeline store counter keeps `loading` true until all overlapping loads
  settle and releases it on success or rejection
  (`web/src/store/pipelines.test.ts:76-100`). Counter increments and decrements
  are symmetric in every reviewed store action; no counter underflow or state
  leak was found.
- Disabled pull-request list/detail routes render localized feedback rather
  than throwing, and the list guard performs no PR API request while disabled.

## Reuse / Duplication

- Existing router names, stores, typed API client, pagination composition,
  repository injections, `FeedbackState`, and i18n are reused. The two disabled
  PR routes share locale keys and semantics without adding an unnecessary
  wrapper abstraction.
- The pipeline loading helpers remove repeated boolean cleanup from three
  actions. The deferred-promise and mount helpers remain local to the single
  repository-shell integration suite, where extraction would add coupling
  without a second consumer.
- No repeated production lifecycle implementation, new dependency, or
  prototype-only fixture was introduced.

## Complexity Delta

- The allowed production/test diff is `387` insertions and `88` deletions.
  Production complexity remains linear: one wrapper generation, one shared
  loading counter, two PR availability guards, and one containment utility.
- `RepoWrapper.vue` is `172` lines. Its permission -> repository -> pipelines ->
  forge sequence has explicit ownership checks at each asynchronous boundary
  and no nesting deeper than the error/permission branches.
- `RepoWrapper.test.ts` is `585` lines but remains a cohesive shell integration
  suite. The added stage matrix and deferred same-ID cases reuse existing
  helpers rather than duplicating setup.
- Current system-executed receipts record targeted Prettier, complete ESLint,
  Vue TypeScript, Vite build, JSON/JSONL parsing, `git diff --check`, and the
  development entry contract as passed. Independent task-scope Prettier and
  diff checks also passed.

## Acceptance Assertions Verified

- `A4`: verified through real repository-family fixtures, explicit fallback
  and disabled states, request-counted loading, preserved rejection
  propagation, active-failure clearing, and lifecycle generation regressions.

## Required Fixes

- No blocking quality fixes remain for task
  `013-repository-regression-coverage`.
- Baseline task `4.5` still owns real dark/light, locale, desktop/390px
  screenshots, rendered overflow measurement, and full repository sensory
  parity. This quality approval does not close or verify those surfaces.
