# Quality Review: 010-repository-pipeline-list

## Verdict

approved

## Separation Of Concerns

- The route delegates repository loading and permissions to `RepoWrapper`,
  list fetching and cache population to `usePipelineStore`, metric integrity to
  `calculatePipelineStats`, and deployment submission/navigation to the
  existing popup.
- Pagination never infers an API page from pipeline collection size.
  Repository page cursors advance only from successful
  `loadRepoPipelines(repoId, page)` actions and remain keyed by repository.
- The user-approved store adjustment at `store/pipelines.ts:88-97` returns the
  request-local boolean that the action already computes. It adds no endpoint,
  state container, persistence, fallback path, or store architecture; the
  legacy global `hasMore` assignment remains intact for existing consumers.
- `RepoWrapper` continues to await the action and ignore its result, so its
  control flow and error semantics are unchanged.

## Component Cohesion / Coupling

- `recordRepoPagination` remains a small route-local boundary: it rejects an
  older page, records the result under the action's repository id, and updates
  visible state only when that repository is active.
- The Pinia action hook uses the action arguments for repository/page identity
  and the action's returned boolean for `hasMore`
  (`RepoPipelines.vue:456-463`). It no longer reads a shared global value at
  action-completion time.
- `goNext` consumes the same request-local return directly at
  `RepoPipelines.vue:482-485`, then applies repository-generation checks before
  changing the active client page.
- The non-detached action subscription is component-scoped by Pinia and its
  explicit unsubscribe function is registered with `onUnmounted`; no listener
  remains available for future actions after route teardown.

## Test Quality

- Independent current-byte execution passed the exact focused command at
  `3/3` files and `13/13` tests and the complete frontend suite at `30/30`
  files and `185/185` tests.
- The real Pinia regression at `store/pipelines.test.ts:45-71` starts two
  repository actions, resolves both in the same turn, and proves their direct
  promises and action hooks independently receive repository 101 `false` and
  repository 202 `true`. This closes the v3 shared-global action-locality gap.
- Component coverage continues to verify local/API pagination, confirmed
  cursor remounts, same-length page-one completion, stale repository
  fulfillment followed by an active live insertion, stale rejection,
  loading/empty/no-match states, filters, navigation, deployment eligibility,
  permission gating, and repository reset.
- The focused mocks now return explicit booleans from load-more calls and pass
  explicit booleans to simulated action callbacks, matching the production
  v4 contract rather than relying on `pipelineStore.hasMore`.
- Targeted Prettier, complete ESLint, Vue TypeScript, Vite build, evidence
  script syntax, and `git diff --check` all pass independently.

## Error Handling

- A successful initial action records pagination even when it replaces the
  cached collection with the same number of pipelines, because identity and
  `hasMore` travel through the action completion rather than a length watcher.
- A stale fulfilled action records only its own repository result. A later
  live, detail, or `last_pipeline` insertion has no pagination side effect.
- A stale rejected load-more request is discarded after its repository or
  generation changes. A rejection belonging to the active repository is
  rethrown to the existing route/API error boundary.
- The generation-aware `finally` clears only the matching repository's
  load-more state. No secondary error cache, fabricated total, or fallback
  result was introduced.

## Reuse / Duplication

- Existing metric cards, feedback states, buttons, icons, pipeline status
  rendering, date utilities, title handling, injections, store action, and
  deployment popup remain correctly reused.
- Returning the computed boolean reuses the action's existing result
  calculation rather than duplicating pagination logic in the component or
  adding a second store.
- Status/event label mapping remains appropriate as route-local code for one
  typed consumer.
- English and Simplified-Chinese route copy remains locale-backed and passes
  formatting, lint, and type validation.

## Complexity Delta

- The store delta is two local statements and a return of the already computed
  boolean. It is proportionate to making concurrent action results
  request-local and does not expand store architecture.
- The two keyed route caches and one Pinia action subscription are justified
  by same-length initial loads, remount continuation, and repository-switch
  isolation without fabricating a server total.
- The action hook and direct `goNext` path both call
  `recordRepoPagination` for a successful load-more action. The same
  repository/page operation is idempotent, so this remains LOW non-blocking
  redundancy rather than a behavioral risk.
- The four populated/filtered-empty desktop/mobile PNGs and manifest pass the
  independent verifier. It confirms exact dimensions and checksums,
  `1280/1280` and `390/390` document widths, local dense-table overflow, no raw
  locale keys, and explicit no-match feedback.
- The capture timeout path still sends `SIGKILL` without waiting again for
  confirmed process exit before profile deletion. This is a MEDIUM task-local
  harness robustness concern, but it does not invalidate the existing
  checksum-verified artifacts.

## Required Fixes

- None for task `010` / baseline task `4.1`.
- Keep task `4.5` responsible for full repository-family sensory parity,
  permissions, themes, locales, and browser console/network health; this
  approval does not close those broader assertions.
