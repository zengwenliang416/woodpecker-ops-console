# Task Brief: 013-repository-regression-coverage

## Goal

Protect the completed repository route family with focused router, wrapper,
theme-invariant control, and responsive-containment regressions for the current
production routes, permissions, actions, filters, pagination, explicit states,
and repository lifecycle ownership.

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

Resolve every current non-pipeline repository destination through its production
named route, enter the shared repository wrapper, load the current repository
and permission owner, and exercise the completed activity, branch/pull-request,
manual-run, and settings surfaces across their supported filters, pagination,
actions, empty/error states, semantic theme tokens, and narrow-layout
containment. Returning through an `A -> B -> A` repository sequence must not
allow the first A permission or load completion to become current again.

## In Scope

- Add inbound-path and named-route resolution coverage for `/repos`,
  `/repos/add`, activity, branch list/detail, pull-request list/detail,
  manual-run, and all seven settings destinations under a configured root path.
- Add focused `RepoWrapper` coverage for pull-denied authenticated and guest
  redirects, push/manual action visibility, admin settings visibility,
  pull-request tab gating, settings routes without the repository tab shell,
  repository reload, permission rejection, and `A -> B -> A` obsolete
  permission/load completion.
- Add focused redteam probes for direct access to disabled pull-request routes
  and rejection recovery in the shared pagination and repository pipeline
  loading seams before allowing any additional production repair.
- Repair the proven redteam failures by releasing shared loading state in
  `finally`, preserving error propagation, and replacing disabled pull-request
  route throws with a localized shared disabled state that performs no PR API
  request.
- Repair `RepoWrapper` only as required by those regressions so repository,
  permission, forge, pipeline, redirect, and last-access side effects belong to
  the active repository load generation.
- Run the existing filter, pagination, empty/error, mutation/action,
  permission, and stale-response suites from slices `010` through `012` as
  supporting coverage without rewriting already-proven scenarios.
- Prove repository controls remain structurally identical under light and dark
  root theme state without repeating the global theme-toggle implementation
  tests or task `4.5` sensory comparison.
- Add direct structural regressions for the repository activity table and
  repository settings table: local horizontal scrolling, mobile filter
  collapse, `min-w-0`, `overflow-hidden`, and `contain: layout paint`.

## Out Of Scope

- New routes, query parameters, permissions, actions, repository fields, API
  payloads, stores, backend behavior, persistence, dependencies,
  authentication rules, prototype fixtures, or compatibility behavior.
- Reimplementing filters, pagination, states, mutations, or responsive layouts
  already completed by tasks `4.1` through `4.3` without a failing regression.
- Pipeline detail routes already protected by baseline task `3.4`.
- Real dark/light rendering, locale comparison, desktop/390px screenshots, and
  complete repository parity-matrix closure owned by baseline task `4.5`.
- Treating source/class assertions as proof of rendered no-overflow or sensory
  parity.

## Files Allowed

- `web/src/router.test.ts`
- `web/src/views/repo/RepoWrapper.vue`
- `web/src/views/repo/RepoWrapper.test.ts`
- `web/src/views/repo/RepoPipelines.test.ts`
- `web/src/views/repo/RepoPullRequests.vue`
- `web/src/views/repo/RepoPullRequests.test.ts`
- `web/src/views/repo/RepoPullRequest.vue`
- `web/src/views/repo/RepoPullRequest.test.ts`
- `web/src/compositions/usePaginate.ts`
- `web/src/compositions/usePaginate.test.ts`
- `web/src/store/pipelines.ts`
- `web/src/store/pipelines.test.ts`
- `web/src/components/repo/settings/RepoSettingsTable.vue`
- `web/src/components/repo/settings/RepoSettingsTable.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- Existing SpecNav task packet, task ledger/context/validation/drift, task
  graph, extraction map, handoff, `tasks.md`, and generated CodeGraph/status
  files for task `013`.

## Interfaces / Seams

- Vue Router's existing route names, paths, parameters, route metadata, and
  `WOODPECKER_ROOT_PATH` remain authoritative.
- `RepoWrapper` remains the only owner of repository permission loading,
  repository/store hydration, initial pipeline loading, forge selection,
  redirects, injected `repo` / `repo-permissions` / `pipelines`, and
  last-access updates.
- Existing route tests remain authoritative for filter values, pagination
  boundaries, confirmed-row behavior, mutations, and explicit feedback states.
- The global light/dark theme attribute remains authoritative; wrapper tests
  prove it does not alter repository permission/action structure but do not
  claim computed visual parity.

## Components To Create

- Create `RepoWrapper.test.ts` for the previously untested repository shell,
  theme-invariant controls, and asynchronous permission/load ownership.

## Components To Reuse

- Existing Vue Test Utils/Vitest mounts, Pinia stubs, Vue Router, `vue-i18n`,
  deferred-promise helpers, typed repository/pipeline fixtures, and current
  route/component tests from tasks `010` through `012`.

## Components To Extract

- None. Reuse local test helpers within their owning modules. Extract a shared
  helper only if the new regressions prove identical mutable setup across at
  least two test files.

## API / Data Flow Contracts

- Permission and repository requests use the repository ID captured at request
  start; only the active load generation may publish permissions, redirect,
  request repository/pipeline/forge follow-up work, or update last access.
- Named-route and inbound-path assertions use only the current production route
  table and parameter shapes.
- Filter, pagination, empty/error, action, and mutation assertions continue to
  use current injected APIs/stores and do not simulate new production success.
- Theme coverage asserts that the global root theme state does not alter
  repository route controls rather than adding a page-local theme state
  machine.

## State / Error / Empty / Loading Behavior

- Loading: the wrapper must not expose an old repository's permission or shell
  state while a newer repository load owns the route.
- Empty: preserve explicit activity, branch, pull-request, manual branch,
  resource, cron, and badge empty states already covered by focused tests.
- Error: preserve retryable branch/resource errors and active-owner rejection;
  obsolete wrapper completions must not redirect or publish stale state.
- Disabled: preserve pending pagination, manual-run, settings mutation, and
  destructive-action duplicate-submit boundaries.
- Permission: pull controls route access, push controls manual/deploy actions,
  admin controls settings, and PR availability controls the PR tab without
  inventing a new permission calculation.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/views/repo/RepoWrapper.test.ts src/views/repo/RepoPipelines.test.ts src/components/repo/settings/RepoSettingsTable.test.ts src/components/layout/header/Navbar.test.ts`
- `pnpm exec vitest run src/store/pipelines.test.ts src/views/repo/RepoPipelines.test.ts src/lib/pipelineRefs.test.ts src/components/repo/RepoPipelineReference.test.ts src/views/repo/RepoBranches.test.ts src/views/repo/RepoBranch.test.ts src/views/repo/RepoPullRequests.test.ts src/views/repo/RepoPullRequest.test.ts src/lib/repoBadge.test.ts src/components/repo/settings/RepoSettingsNav.test.ts src/components/repo/settings/RepoSettingsSection.test.ts src/components/repo/settings/RepoSettingsTable.test.ts src/components/repo/settings/RepoSettingsActionRow.test.ts src/views/repo/RepoManualPipeline.test.ts src/views/repo/settings/RepoSettings.test.ts src/views/repo/settings/General.test.ts src/views/repo/settings/Secrets.test.ts src/views/repo/settings/Registries.test.ts src/views/repo/settings/Crons.test.ts src/views/repo/settings/Badge.test.ts src/views/repo/settings/Actions.test.ts src/views/repo/settings/Extensions.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task production/test files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode handoff --json`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- A required production fix touches a file outside this expanded, red-proven
  owner set.
- A test requires a new route, API/store/backend/dependency/authentication/
  permission contract, prototype-only value, or task `4.5` sensory evidence.
- The regression suite repeats existing task `4.1` through `4.3` assertions
  without closing a documented family-level gap.

## Unsafe Assumptions

- Existing page-level green tests do not prove named-route precedence,
  repository-shell permissions, or cross-route `A -> B -> A` ownership.
- A route tab rendering does not prove the inbound path resolves to the intended
  terminal route or parameter shape.
- Semantic theme utilities and responsive classes protect source structure but
  do not prove rendered dark/light or 390px parity.
- Pipeline route coverage from task `3.4` does not cover activity,
  branch/pull-request, manual-run, or settings route contracts.
