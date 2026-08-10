# Task Brief: 010-repository-pipeline-list

## Goal

Users can scan, filter, paginate, open, and deploy eligible pipelines from a
repository activity page that matches the approved prototype's information
density while preserving current repository APIs and permissions.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`

## Vertical Slice

Enter `/repos/:repoId`, derive current repository metrics from the pipelines
already loaded through `usePipelineStore`, filter and page the real collection,
open a pipeline detail route, and expose the existing deployment popup only for
successful pipelines when repository push permission and deployment settings
allow it.

## In Scope

- Replace the legacy stacked pipeline cards on the repository root route with
  three data-derived metric cards and a dense, horizontally contained table.
- Add status, branch, event, and text filters with reset behavior.
- Add local pagination over loaded pipelines and load the next real API page
  through the existing store when the user advances past the loaded boundary.
- Render explicit loading, no-pipeline, and no-filter-match states.
- Keep pipeline detail navigation and the existing manual-run header action.
- Reuse the existing deployment popup for eligible successful pipelines.
- Add focused component tests for metrics, filters, pagination, empty states,
  deployment visibility, and read-only behavior.
- Add English and Simplified-Chinese copy for the new route-local controls.

## Out Of Scope

- Branch and pull-request list/detail routes owned by task `4.2`.
- Manual-run and repository settings routes owned by task `4.3`.
- Repository-wide route regression and sensory closure owned by tasks `4.4`
  and `4.5`.
- New backend endpoints, server-side filtering, total-count headers, release
  mapping, store architecture beyond the approved request-local pagination
  result, route names, permission calculation, or approved-prototype edits.
- Cancel, restart, approve, or decline mutations from the list; those remain on
  pipeline detail surfaces.

## Files Allowed

- `web/src/views/repo/RepoPipelines.vue`
- `web/src/views/repo/RepoPipelines.test.ts`
- `web/src/store/pipelines.ts`
- `web/src/store/pipelines.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- This task packet, task ledger/context/validation/drift artifacts, task graph,
  handoff document, `tasks.md`, and generated CodeGraph/SpecNav status files.

## Interfaces / Seams

- `RepoWrapper.vue` remains authoritative for repository loading, pull access,
  push/admin permissions, initial pipeline loading, and injected `repo`,
  `repo-permissions`, and `pipelines` refs.
- `usePipelineStore.loadRepoPipelines(repoId, page)` remains the only list data
  fetch seam and keeps the current `50`-record server page contract. It may
  return the request-local `hasMore` boolean so concurrent repository actions
  do not have to read the legacy store-global field.
- `DeployPipelinePopup.vue` remains authoritative for deployment input,
  mutation, and post-create navigation.
- `calculatePipelineStats` remains the data-integrity boundary for terminal
  success rate and average duration.

## Components To Create

- No shared production component. The route-specific table and filters remain
  in `RepoPipelines.vue` because no second equivalent consumer exists.
- Create `RepoPipelines.test.ts` as the focused route-component regression.

## Components To Reuse

- `OpsMetricCard`, `FeedbackState`, `Button`, `IconButton`,
  `PipelineStatusIcon`, `DeployPipelinePopup`, `PrototypeIcon`, `useDate`,
  `useWPTitle`, `requiredInject`, `usePipelineStore`, and
  `calculatePipelineStats`.

## Components To Extract

- None. Do not add a generic table/filter abstraction until a second route
  demonstrates the same typed contract.

## API / Data Flow Contracts

- The initial pipeline collection comes from `RepoWrapper` and
  `GET /api/repos/:repoId/pipelines`.
- Advancing beyond loaded results calls the existing store with the next
  one-based page; no fabricated total count is shown.
- Metrics and filters operate only on currently loaded real pipeline objects.
- Deploy is visible only when `repoPermissions.push`, `repo.allow_deploy`, and
  `pipeline.status === "success"` are all true; submitting remains owned by
  `DeployPipelinePopup`.

## State / Error / Empty / Loading Behavior

- Loading: show the shared loading state while the initial collection is empty;
  keep existing rows visible while an additional page loads.
- Empty: distinguish no repository pipelines from no results matching active
  filters, and provide a filter reset action for the latter.
- Error: do not invent a second error cache; current route/API error handling
  remains authoritative and this slice must not hide thrown load failures.
- Disabled: previous/next controls reflect the loaded boundary and store
  `hasMore` state; deploy never renders for ineligible pipeline states.
- Permission: pull access remains enforced by `RepoWrapper`; push permission
  gates deploy entry, while read-only users retain list/detail navigation.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/views/repo/RepoPipelines.test.ts src/lib/repoMetrics.test.ts`
- `pnpm exec vitest run src/store/pipelines.test.ts`
- `pnpm exec prettier --check src/views/repo/RepoPipelines.vue src/views/repo/RepoPipelines.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`
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
- The implementation needs a new pipeline-list API, server total, release
  mapping, permission rule, production route, shared store rewrite beyond the
  approved request-local return value, or approved-prototype change.
- Equivalent loaded-client pagination cannot be implemented without presenting
  a fabricated total count.

## Unsafe Assumptions

- The existing API does not expose a confirmed total count; `hasMore` is the
  only authoritative indication that another server page may exist.
- Prototype metric values, authors, branches, events, release mappings, and
  deployment targets are illustrative and must not be copied into production.
- A successful pipeline is deployable only when current repository settings and
  push permission also allow deployment.
- Branch/PR pipeline consumers of `PipelineList.vue` are not evidence that they
  should receive this repository-root table layout.
