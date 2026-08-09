# Task Brief: 005-pipeline-detail-header

## Goal

Users can identify a pipeline's current status and execution context, reach the
existing detail routes, and invoke only the primary actions allowed by the real
pipeline state and repository push permission.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/specs/ui-design/design.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Open a real repository pipeline and receive a prototype-aligned detail header
with translated status metadata, responsive primary actions, and navigation to
the existing overview, changed-files, config, errors, and permission-gated
debug routes. Cancel, retry, and deploy intents continue through their current
API/router seams and remain gated by current state and repository permission.

## In Scope

- Recompose `PipelineWrapper.vue` into an approved detail-page hierarchy:
  repository/pipeline eyebrow, pipeline number, translated status badge,
  commit message, branch/ref, trigger event, author, commit identifier, created
  time, and duration.
- Keep cancel visible only for pending/running pipelines with push permission.
- Keep retry visible for non-blocked pipelines with push permission and route
  successful retries to the returned pipeline number.
- Keep deploy visible only for successful deploy-enabled pipelines with push
  permission, preserving both the existing release-backed deployment route and
  existing legacy deploy popup fallback.
- Align the existing real route tabs to overview, changed files, config, errors,
  and debug; keep debug behind repository push permission.
- Keep changed-files and errors routes reachable even when their count is zero;
  counts remain derived from current pipeline data.
- Add focused component tests for metadata, status variants, action state,
  permissions, API/router intent, deployment target, and tab registration.
- Add matching English and Simplified-Chinese visible copy.

## Out Of Scope

- Pipeline step summary, graph/table overview, environment/image context,
  execution metrics, release outcome panel, or log presentation from task `3.2`.
- A separate log tab/query-state implementation and changed-files, config,
  error-analysis, or debug page redesign from task `3.3`.
- Approval/decline panel redesign; the existing blocked-pipeline flow in
  `Pipeline.vue` remains authoritative.
- Router, API client, Pinia store, authentication, repository permission
  calculation, backend, persistence, migration, dependency, or prototype edits.
- Adding a non-functional "more" menu or copying prototype data/runtime code.

## Files Allowed

- `web/src/views/repo/pipeline/PipelineWrapper.vue`
- `web/src/views/repo/pipeline/PipelineWrapper.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## Interfaces / Seams

- `RepoWrapper.vue` continues to provide `repo` and `repo-permissions`.
- `usePipelineStore` continues to own pipeline loading and cached server state.
- `useApplicationStore` continues to own release/application discovery.
- `usePipeline` remains the shared source for message, ref, created time, and
  duration presentation.
- `useAsyncAction`, `useApiClient`, notifications, and Vue Router continue to
  own cancel/retry intent, feedback, and redirect behavior.
- `Scaffold`, `Tab`, `Button`, `PipelineStatusIcon`, `RenderMarkdown`, and
  existing semantic Tailwind tokens remain the presentation building blocks.

## Components To Create

- None. The pipeline detail header is a domain-specific route composition and
  does not yet have a second equivalent consumer.

## Components To Reuse

- Existing `Scaffold`, `Tab`, `Button`, `Icon`, `PipelineStatusIcon`,
  `RenderMarkdown`, `DeployPipelinePopup`, `usePipeline`, `useDate`,
  `useAsyncAction`, repository injection, pipeline/application stores, Vue
  i18n, and Vue Router.

## Components To Extract

- None in this slice. Do not extract a generic page header until a second real
  route family proves an equivalent prop and action contract.

## API / Data Flow Contracts

- Initial state continues through `usePipelineStore.loadPipeline` and
  `ApiClient.getPipelineConfig`.
- Cancel continues through `ApiClient.cancelPipeline(repo.id, pipeline.number)`.
- Retry continues through `ApiClient.restartPipeline(repo.id, pipelineId,
  { fork: true })`, then routes to the returned pipeline number.
- Release-backed deploy continues to `/deployments/new` with real
  `applicationId` and `releaseId`; otherwise the existing
  `DeployPipelinePopup` remains the fallback.
- No optimistic mutation, simulated success, new endpoint, payload, store, or
  permission rule is introduced.

## State / Error / Empty / Loading Behavior

- Loading: retain the current wrapper gate until both pipeline and repository
  data exist; do not render fake metadata.
- Empty: zero changed files or errors still leaves the real destination tab
  reachable without a misleading positive count.
- Error: existing API and `useAsyncAction` error behavior remains unchanged;
  no success state is fabricated.
- Disabled: busy cancel/retry controls use the shared native disabled and
  `aria-busy` behavior.
- Permission: cancel, retry, deploy, and debug remain hidden without repository
  push permission; the overview and read-only route tabs remain available.

## TDD Requirement

- Add focused component tests before production markup changes. The initial red
  run must cover the missing prototype-aligned metadata hierarchy, action
  semantics, always-reachable read-only tabs, and permission gating.

## Verification Commands

- `pnpm exec vitest run src/views/repo/pipeline/PipelineWrapper.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/views/repo/pipeline/PipelineWrapper.vue src/views/repo/pipeline/PipelineWrapper.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- Targeted browser review of a populated pipeline detail header at desktop and
  `390x844`, with push and read-only repository permissions.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- A required change touches router, API client, store, permission calculation,
  backend, dependency, or approved prototype files.
- A new tab would require inventing a route or query-state contract owned by
  tasks `3.2` or `3.3`.
- The implementation duplicates a proven shared header/action component rather
  than extending an existing component or keeping unique composition local.

## Unsafe Assumptions

- Do not assume prototype action availability overrides real pipeline state or
  repository push permission.
- Do not assume a successful pipeline always has a deployment release mapping;
  preserve the legacy popup fallback.
- Do not assume the prototype's log query tab already exists in production.
- Do not use status color without translated text and an icon.
- Do not hide real changed-files or errors routes merely because the current
  count is zero.
