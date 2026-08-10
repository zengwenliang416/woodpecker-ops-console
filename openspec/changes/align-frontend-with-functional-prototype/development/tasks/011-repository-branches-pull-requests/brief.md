# Task Brief: 011-repository-branches-pull-requests

## Goal

Users can search, page, refresh, and open repository branches and pull
requests, then inspect their real pipeline history in information-dense detail
views aligned with the approved prototype without presenting unsupported Forge
metadata or mutations.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`

## Vertical Slice

Enter the repository Branches or Pull Requests tab, load the existing paginated
Forge collection, search the loaded records, open one record, correlate it with
the pipelines already loaded by `RepoWrapper`, and navigate to a real pipeline
detail when history exists.

## In Scope

- Align the branch list with a responsive filter toolbar, default-branch
  prominence, loaded-result count, explicit loading/empty/no-match states,
  refresh, and existing API pagination.
- Enrich each branch row only with the newest matching non-PR pipeline already
  available in the injected repository pipeline collection.
- Align the branch detail route with a branch header, real latest-pipeline
  summary, and the matching pipeline history.
- Align the pull-request list with text search over real index/title fields,
  loaded-result count, explicit loading/empty/no-match states, refresh, and
  existing API pagination.
- Enrich each pull-request row only with the newest matching PR pipeline already
  available in the injected repository pipeline collection.
- Align the pull-request detail route with a PR identifier/title when available,
  real latest-pipeline summary, and the matching pipeline history.
- Extract and test the existing PR-ref parsing rule so list, detail, and
  pipeline-item presentation use one authoritative normalization.
- Add focused component and pure-function tests plus English and
  Simplified-Chinese copy for the new route-local controls.

## Out Of Scope

- Prototype-only branch protection, ahead/behind counts, commit metadata not
  present on a loaded pipeline, branch comparison, branch deletion, or PR
  creation.
- Prototype-only PR author, source/target branch, approval, comment, merge,
  close, changed-file, discussion, or review state.
- Forge mutations, backend endpoints, API type expansion, route changes,
  repository loading changes, pipeline-store changes, or permission rules.
- Manual-run preselection, repository settings, full repository regression, and
  parity-matrix closure owned by baseline tasks `4.3`, `4.4`, and `4.5`.

## Files Allowed

- `web/src/views/repo/RepoBranches.vue`
- `web/src/views/repo/RepoBranches.test.ts`
- `web/src/views/repo/RepoBranch.vue`
- `web/src/views/repo/RepoBranch.test.ts`
- `web/src/views/repo/RepoPullRequests.vue`
- `web/src/views/repo/RepoPullRequests.test.ts`
- `web/src/views/repo/RepoPullRequest.vue`
- `web/src/views/repo/RepoPullRequest.test.ts`
- `web/src/components/repo/RepoPipelineReference.vue`
- `web/src/components/repo/RepoPipelineReference.test.ts`
- `web/src/lib/pipelineRefs.ts`
- `web/src/lib/pipelineRefs.test.ts`
- `web/src/compositions/usePipeline.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- This task packet, task ledger/context/validation/drift artifacts, task graph,
  extraction map, handoff document, `tasks.md`, and generated CodeGraph/SpecNav
  status files.

## Interfaces / Seams

- `RepoWrapper.vue` remains authoritative for repository loading, pull access,
  PR-tab visibility, and injected `repo`, `repo-permissions`, and `pipelines`
  refs.
- `getRepoBranches(repoId, { page })` remains the only branch-list API and
  returns `string[]`.
- `getRepoPullRequests(repoId, { page })` remains the only pull-request-list API
  and returns only `{ index, title }`.
- `usePagination` remains authoritative for one-based service pagination,
  refresh/reset, loading, and `hasMore`.
- `PipelineList.vue` remains the shared pipeline-history renderer and existing
  pipeline-detail navigation seam.

## Components To Create

- Create `RepoPipelineReference.vue` as the narrow shared detail surface for a
  repository branch or PR identifier, real latest-pipeline summary, and
  `PipelineList` history.
- Branch and PR row layouts remain in their owning routes because their
  confirmed list data contracts differ.
- Create `pipelineRefs.ts` as a small shared pure-data seam for PR event and ref
  normalization.

## Components To Reuse

- `Button`, `Badge`, `FeedbackState`, `PipelineStatusIcon`, `PipelineList`,
  `PrototypeIcon`, `useDate`, `usePagination`, `useWPTitle`, and
  `requiredInject`.

## Components To Extract

- Extract PR-event recognition and PR-index parsing from the duplicated
  `usePipeline.ts` / `RepoPullRequest.vue` logic into `pipelineRefs.ts`.
- Extract the repeated branch/PR detail header, summary, and history layout into
  `RepoPipelineReference.vue`; route views retain only typed filtering and
  title selection.
- Do not extract a generic branch/PR list abstraction: the branch API is
  `string[]`, the PR API is `{ index, title }[]`, and their row semantics are
  not the same typed contract.

## API / Data Flow Contracts

- Branch and PR list records come only from their existing Forge-backed APIs.
- Row/detail enrichment comes only from the current repository's injected,
  already-loaded `Pipeline[]`; missing pipeline history renders as unavailable
  rather than triggering or fabricating a second API.
- Branch history excludes PR events and matches exact `pipeline.branch`.
- PR history includes only PR events whose normalized ref index exactly equals
  the route/API index.
- Search is client-side over loaded records. Counts are explicitly loaded
  counts, never server totals.
- Refresh calls `resetPage`; loading another service page calls `nextPage`.

## State / Error / Empty / Loading Behavior

- Loading: show the shared loading state when the list has no records; preserve
  existing rows while refresh or pagination is active.
- Empty: distinguish an empty Forge collection from no loaded records matching
  the current text search.
- Error: preserve current API error propagation; do not add a parallel error
  cache or fallback fixture.
- Disabled: disable refresh/load-more while loading and hide the load-more
  control when `hasMore` is false.
- Permission: `RepoWrapper` keeps pull-access enforcement and PR-tab
  availability; this task adds no permission calculation or write action.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/lib/pipelineRefs.test.ts src/components/repo/RepoPipelineReference.test.ts src/views/repo/RepoBranches.test.ts src/views/repo/RepoBranch.test.ts src/views/repo/RepoPullRequests.test.ts src/views/repo/RepoPullRequest.test.ts`
- `pnpm exec prettier --check src/lib/pipelineRefs.ts src/lib/pipelineRefs.test.ts src/compositions/usePipeline.ts src/components/repo/RepoPipelineReference.vue src/components/repo/RepoPipelineReference.test.ts src/views/repo/RepoBranches.vue src/views/repo/RepoBranches.test.ts src/views/repo/RepoBranch.vue src/views/repo/RepoBranch.test.ts src/views/repo/RepoPullRequests.vue src/views/repo/RepoPullRequests.test.ts src/views/repo/RepoPullRequest.vue src/views/repo/RepoPullRequest.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test -- --run`
- `pnpm build`
- `git diff --check`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode handoff --json`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- The implementation needs richer branch/PR API fields, a new request,
  mutation, route, repository/store change, manual-run preselection, new
  permission rule, approved-prototype edit, or fabricated metadata.
- A loaded pipeline cannot be correlated to a branch or PR without guessing
  beyond the existing exact branch and normalized ref contracts.

## Unsafe Assumptions

- Prototype branch protection, comparison counts, commit rows, PR review
  metadata, checks, discussions, and actions are illustrative because the
  current APIs do not expose them.
- The injected repository pipeline collection is a real but potentially
  partial recent history; the UI must describe loaded results and must not
  claim a complete server total.
- A pull request may have no loaded pipeline, and a pipeline may reference a PR
  that is not present in the loaded Forge page.
- PR ref formats remain limited to the three formats already recognized by
  current production code: `refs/pull/`, `refs/merge-requests/`, and
  `refs/pull-requests/`, with `/merge`, `/head`, or `/from` suffixes.
