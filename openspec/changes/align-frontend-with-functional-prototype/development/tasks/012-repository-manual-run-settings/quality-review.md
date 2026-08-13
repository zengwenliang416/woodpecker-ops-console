# Quality Review: 012-repository-manual-run-settings

## Verdict

approved

## Separation Of Concerns

- The route/component split is sound. Repository routes own API calls,
  editable state, permission and repository lifecycles, and mutation
  completion; the four shared settings components remain presentation-only;
  `repoBadge.ts` remains a typed pure formatter.
- Manual, General, Secrets, Registries, Crons, Actions, and Extensions now
  maintain an independent monotonic `repoLifecycleGeneration`. Each mutation
  or run captures both the repository ID and lifecycle generation, and every
  success-side effect requires both owners to remain current
  (`RepoManualPipeline.vue:140,175-201,213-243`;
  `General.vue:236,257-292`; `Secrets.vue:146,233-275`;
  `Registries.vue:152,240-283`; `Crons.vue:232,315-378`;
  `Actions.vue:100-153`; `Extensions.vue:132,173-193`).
- Resource GET error ownership remains separately bound to
  `reloadGeneration`, which is appropriate because collection reloads and
  route mutation lifetimes have different invalidation boundaries.

## Component Cohesion / Coupling

- `RepoSettingsNav`, `RepoSettingsSection`, `RepoSettingsTable`, and
  `RepoSettingsActionRow` have small visual contracts with real multiple
  consumers. Secret/registry precedence, Cron editing, General settings, and
  action semantics remain local to their owning routes.
- Secrets, Registries, and Crons use the same confirmed-snapshot lifecycle:
  capture current rows, invoke the authoritative pagination reset, wait for
  the watcher-owned replacement request to become idle, and release the
  snapshot only after the active successful load
  (`Secrets.vue:207-231`; `Registries.vue:214-238`;
  `Crons.vue:289-313`).
- Cron edits remain detached through `deepClone`, and repository switches
  deliberately discard old resource snapshots and editor state. No unrelated
  store, API, router, or permission responsibilities were pulled into the
  shared components.

## Test Quality

- Independent execution passed the exact task command at `14/14` files and
  `75/75` tests. `src/compositions/usePaginate.test.ts` independently passed
  `9/9`. The system-executed v5 full receipt records `49/49` files and
  `286/286` tests.
- The lifecycle regressions genuinely exercise `A -> B -> A`, not only
  one-way repository switching. Manual suppresses navigation and close events;
  General preserves current fields without reload/notification; Secrets and
  Registries retain the new editor and suppress reload/notification; Cron
  covers run, save, and delete; Actions suppresses delete navigation and
  notification; Extensions preserves current fields and suppresses
  notification.
- Resource mutation coverage includes both save and delete for Secrets and
  Registries, and save/delete/run for Crons. The production guards for repair,
  activate, and deactivate use the same lifecycle pattern as the covered
  destructive Action path.
- The page-two resource tests are behaviorally exact for the previously
  missing boundary. Their `resetPage` clears pagination data and returns, then
  starts the page-one replacement on the next tick with `loading = true`.
  They assert confirmed rows remain visible during the deferred request and
  after its rejection (`Secrets.test.ts:224-255`;
  `Registries.test.ts:205-236`; `Crons.test.ts:252-277`).

## Error Handling

- Active GET failures are explicit and retryable. Confirmed rows remain
  visible through page-one and page-greater-than-one replacement failures.
  Obsolete fulfilled or rejected loads cannot replace current data or error
  state, including same-ID `A -> B -> A` revisits.
- `waitForPaginationIdle()` first yields through `nextTick()` so the real
  page watcher can start an asynchronous page-one request after a page-two
  reset. If loading is active, it observes the transition back to idle before
  allowing the route to release its confirmed snapshot. This closes the
  early-release path without changing the shared pagination contract.
- Mutation and run success effects are server-confirmed and owner-checked
  before notification, navigation, editor close, reload, or field replacement.
  Rejections remain handled by the existing `useAsyncAction` seam and do not
  emit optimistic success.
- **MEDIUM, non-blocking:** `useAsyncAction` pending state remains scoped to
  the reused component instance, so an old repository request can temporarily
  keep the corresponding new-repository action loading until the old promise
  settles. Completion side effects are now fully invalidated, so this is a
  bounded interaction delay rather than a correctness or data-loss blocker.

## Reuse / Duplication

- Existing API clients, editors, notifications, route names,
  `useAsyncAction`, `usePaginate`, `usePagination`, `useDate`, and injection
  seams remain reused. No backend contract, permission calculation,
  compatibility layer, dependency, or prototype-only operation was added.
- The lifecycle generation is repeated as a small route-local primitive rather
  than introducing a speculative global request-owner service. The identical
  confirmed-snapshot wait pattern is limited to the three routes that share
  the real pagination timing requirement.
- Secret and registry precedence loops remain justified by their distinct
  entity/editor contracts. Shared visual duplication is extracted without
  coupling organization, administrator, or personal settings to this slice.

## Complexity Delta

- The implementation remains linear despite its breadth: four focused visual
  components, one pure formatter, and route-local orchestration over
  established APIs. The lifecycle and pagination fixes add explicit temporal
  ownership without introducing a new abstraction layer.
- System-executed v5 receipts record targeted Prettier, complete ESLint, Vue
  TypeScript, Vite build, Python/Node syntax, JSONL parsing, and
  `git diff --check` as passed. Independent targeted Prettier and task-scope
  diff checks also passed.
- The current v5 evidence verifier passed ten checksum-valid desktop/mobile
  captures, exact routes and real text, seven settings destinations, no raw
  locale keys, no page console errors, no unexpected HTTP errors, and mobile
  Secrets document `390/390` with local table `821/345` and
  `scrollLeft 0 -> 120`.

## Acceptance Assertions Verified

- `A3`: verified through current formatting, lint, type checking, focused and
  full frontend tests, build, syntax, parsing, evidence, and diff checks.
- `A4`: verified through real branch/resource/cron values, explicit
  fallbacks, lifecycle-owned operations, confirmed pagination continuity, and
  obsolete response isolation.

## Required Fixes

- No blocking fixes remain. Retain the non-blocking `useAsyncAction`
  pending-state interaction delay as a documented future regression concern.
