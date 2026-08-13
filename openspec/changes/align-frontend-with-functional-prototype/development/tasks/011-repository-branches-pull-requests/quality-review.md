# Quality Review: 011-repository-branches-pull-requests

## Verdict

approved

## Separation Of Concerns

- Repository loading, permissions, and the injected recent pipeline collection
  remain owned by `RepoWrapper`. The routes add no API, store, permission
  calculation, mutation, fallback fixture, or fabricated Forge metadata.
- Branch and pull-request records continue to come from their existing Forge
  APIs, while row/detail enrichment reads only the injected `Pipeline[]`.
  Branch history excludes PR events and PR history requires an exact normalized
  index.
- Refresh continuity is now route-local presentation state rather than a second
  data source. `refreshSnapshot` retains only the last confirmed rows while the
  authoritative `resetPage()` replaces page one
  (`RepoBranches.vue:142-145`; `RepoPullRequests.vue:149-152`).
- Each route owns an independent `refreshGeneration`. Refresh completion or
  rejection may alter the snapshot/error surface only while it still owns that
  generation, and a repository change invalidates the owner before resetting
  data (`RepoBranches.vue:175-191`; `RepoPullRequests.vue:178-194`).

## Component Cohesion / Coupling

- `pipelineRefs.ts` remains a cohesive pure-data seam for the three supported PR
  ref prefixes, supported suffixes, PR event recognition, and exact pipeline
  matching. `usePipeline`, the PR list, and the PR detail route reuse it instead
  of retaining divergent parsing.
- `RepoPipelineReference.vue` appropriately owns the repeated branch/PR detail
  header, three real summary cards, ordering, and `PipelineList` history. The
  route components retain only typed filtering, identifier/title selection, and
  document-title behavior.
- Keeping branch and PR lists separate remains correct because their API records
  and row semantics differ. The small typed snapshot/generation blocks are
  symmetric, but extracting a generic list abstraction would create more
  coupling than it removes.
- Snapshot ownership is independent of `usePagination`'s internal request
  generation. The composable remains authoritative for pagination data and
  stale response state, while the route generation protects only route-local
  confirmed-row presentation and obsolete error propagation.

## Test Quality

- Independent final current-byte execution passed the exact focused command at
  `6/6` files and `27/27` tests and the complete frontend suite at `35/35`
  files and `211/211` tests.
- The list harnesses now reproduce the real composable's synchronous data clear
  and pending loading state. Both routes prove confirmed rows remain visible,
  initial loading feedback stays hidden, refresh/load-more actions are disabled,
  and the successful page-one response replaces the snapshot atomically
  (`RepoBranches.test.ts:208-237`; `RepoPullRequests.test.ts:216-245`).
- Repository-race coverage starts an old refresh, changes repository, completes
  the new repository reset, starts another refresh, and then resolves the old
  request last. The new snapshot remains visible until its own confirmed result
  arrives (`RepoBranches.test.ts:239-281`;
  `RepoPullRequests.test.ts:247-299`).
- Separate regressions prove an obsolete old refresh rejection is suppressed
  without clearing the active new snapshot, while an active refresh rejection
  preserves the last confirmed rows and still propagates to the existing error
  boundary (`RepoBranches.test.ts:283-344`;
  `RepoPullRequests.test.ts:301-372`).
- Pure-function and detail tests continue to cover supported/unsupported PR
  refs, PR events, exact branch/PR filtering, newest-pipeline selection,
  default/fallback titles, real summary values, history ordering, and empty
  history.
- Targeted Prettier, complete ESLint, Vue TypeScript, Vite build, evidence
  verification, Node/Python syntax checks, PNG checksum recomputation, and
  `git diff --check` pass independently. Vite retains only the existing
  non-module warnings for `/web-config.js` and `/assets/custom.js`.

## Error Handling

- Active refresh rejection keeps the route-owned confirmed snapshot because
  cleanup occurs only after a successful authoritative reset. The error is
  rethrown unchanged, preserving the existing API/error boundary contract.
- Obsolete refresh fulfillment cannot clear a newer repository's pending
  snapshot. Obsolete rejection is also suppressed after repository or refresh
  ownership changes, so it cannot surface an error against the new route.
- Repository changes increment the route generation, clear search and the old
  repository snapshot immediately, then use the existing reset path. Old
  repository rows are therefore never retained as fallback data for a new
  repository.
- Unsupported PR ref shapes remain visible as their original ref in
  `usePipeline`, rather than being partially rewritten into a misleading PR
  identifier. No parallel error cache or fabricated successful response was
  introduced.

## Reuse / Duplication

- Existing `Button`, `Badge`, `FeedbackState`, `PipelineStatusIcon`,
  `PipelineList`, `PrototypeIcon`, `useDate`, `usePagination`, `useWPTitle`, and
  injection seams remain reused.
- PR parsing and branch/PR detail presentation are extracted at the two
  duplication points required by the task. List-specific templates, typed
  snapshots, and computed maps remain local to their distinct contracts.
- English and Simplified-Chinese copy is locale-backed. The four removed legacy
  keys have no remaining production consumer in the current source tree.
- The fix does not change `usePagination`, create another collection cache, or
  expand a shared public contract solely for these two routes.

## Complexity Delta

- The production delta remains proportionate: one pure helper module, one
  shared detail component, thin detail routes, and route-local list
  presentation. The refresh fix adds one snapshot ref and one integer owner per
  list, with direct success, active-error, stale-error, and repository-reset
  semantics.
- The final v3 receipts supersede the earlier review-fix evidence: focused
  `27/27`, full `211/211`, static/build checks, and regenerated browser evidence
  all correspond to the owner-safe production bytes.
- The task-local verifier passes eight checksum-matched PNGs and confirms exact
  dimensions, populated route text, three detail summary cards, no raw locale
  keys, no unexpected console/network errors, and no document or main-route
  horizontal overflow at desktop and `390px`.
- **MEDIUM, non-blocking:** `capture_browser.mjs:164-190` measures the document,
  main page, and route target, but not `.pipeline-history-scroll`; the mobile
  detail screenshots stop before a pipeline row is visible. The production
  containment class at `RepoPipelineReference.vue:154-156` is statically
  correct, but the evidence does not demonstrate an actually overflowing
  `PipelineItem` inside that local scroll region.
- **MEDIUM, non-blocking:** known HTTP-error classification accepts any
  status/origin whose URL ends in `/assets/custom.js`
  (`capture_browser.mjs:248-255`; `verify_evidence.mjs:55-59`), and Chrome
  cleanup can continue after a timed-out `SIGKILL` without confirming exit
  (`capture_browser.mjs:205-218`). The final manifest records exactly one local
  `404` per state and all artifacts match their checksums, so neither robustness
  gap invalidates this task's current evidence.

## Acceptance Assertions Verified

- `A3`: verified through targeted formatting, lint, type checking, focused and
  full frontend tests, build, diff checks, and checksum-valid desktop/mobile
  browser evidence.
- `A4`: verified through real branch/PR correlation, newest loaded-pipeline
  selection, explicit missing-value fallbacks, refresh continuity, and
  repository-generation-owned fulfillment and rejection handling.

## Required Fixes

- None for task `011` / baseline task `4.2`.
- Keep baseline task `4.5` responsible for full repository-family sensory
  parity, themes, locales, permissions, browser-health breadth, and designated
  local-overflow proof. Those broader surfaces are not closed by this approval.
