# Development Handoff To Verify: align-frontend-with-functional-prototype

## Implemented Slices

- `001-date-duration-integrity` / baseline task `2.1`: shared date and elapsed
  time boundaries now render invalid, missing, negative, non-finite, unsafe, and
  overflow values as explicit neutral fallbacks.
- `002-shared-shell-alignment` / baseline task `2.2`: approved desktop/mobile
  shell geometry, preference behavior, permission-aware navigation, truthful
  unavailable search feedback, locale discovery filtering, and accessible
  drawer lifecycle are implemented.
- `003-shared-feedback-primitives` / baseline task `2.3`: accessible shared
  loading, empty, error, disabled, permission, and stale feedback plus safe
  busy/disabled navigation behavior are implemented in representative
  repository and pipeline consumers.
- `004-shell-theme-evidence` / baseline task `2.4`: current production and
  approved-prototype shared shells passed equivalent dark/light desktop and
  attested 390px mobile review without requiring a production change.
- `005-pipeline-detail-header` / baseline task `3.1`: the real pipeline detail
  header now exposes the approved repository/pipeline hierarchy, translated
  status and execution metadata, real cancel/retry/deploy behavior, and
  permission-aware navigation to existing overview, changed-files, config,
  errors, and debug routes.
- `006-pipeline-overview` / baseline task `3.2`: the real pipeline route now
  defaults to a responsive execution overview derived from current workflows
  and steps, with workflow/step counts, terminal progress, translated status,
  duration, environment, explicit image unavailability, and current step-log
  routing while preserving error, approval, decline, and permission behavior.
- `007-pipeline-log-diagnostics` / baseline task `3.3`: the current log,
  changed-files, config, errors, and Debug surfaces now expose real searchable
  diagnostics, explicit empty/permission states, responsive containment, and
  latest-request-wins step-log loading while preserving current routes, APIs,
  streaming, downloads, deletion, and permissions.
- `008-pipeline-regression-coverage` / baseline task `3.4`: the completed
  pipeline route family is protected by focused named/inbound router and
  component regressions for statuses, cancellation context, permissions,
  actions, tabs, empty/error/stale states, and responsive containment.
- `009-pipeline-validation-evidence` / baseline task `3.5`: the complete
  pipeline route family passed current focused/full validation and replayable
  production-versus-approved-prototype browser evidence across desktop/mobile,
  dark Simplified Chinese, representative light English, and push/read-only
  states.
- `010-repository-pipeline-list` / baseline task `4.1`: the repository activity
  route now uses real pipeline-derived metrics, filters, dense local-scroll
  presentation, authoritative request-local pagination state, current
  navigation/deploy permissions, and concurrent repository isolation.
- `011-repository-branches-pull-requests` / baseline task `4.2`: branch and
  pull-request list/detail routes now use real Forge records plus exact loaded
  pipeline correlation, searchable/paginated responsive presentation, shared
  reference detail hierarchy, and owner-safe confirmed-row refresh behavior.
- `012-repository-manual-run-settings` / baseline task `4.3`: manual-run and
  seven repository settings routes now use current APIs and permissions with
  responsive shared settings boundaries, repository lifecycle-owned mutations
  and runs, confirmed-row pagination recovery, and current responsive evidence.
- `013-repository-regression-coverage` / baseline task `4.4`: all current
  non-pipeline repository destinations are protected by named/inbound router,
  permission/action/theme, active-error, same-ID lifecycle, disabled-route,
  loading-recovery, and structural responsive regressions.
- `014-repository-validation-evidence` / baseline task `4.5`: repository rows
  `3` and `5-23` passed current production-versus-approved-prototype replay
  across required desktop/mobile states; row `4` is explicitly blocked by the
  measured production activation list versus prototype four-step add wizard.
- `015-organization-routes` / baseline task `5.1`: organization members now
  browse real organization repositories with explicit states, while
  administrators manage real Secrets, Registries, and feature-gated Agents
  through a responsive shared settings hierarchy with active organization
  lifecycle ownership and representative rows `24-27` desktop/390px evidence.
- `016-administration-routes` / baseline task `5.2`: system administrators now
  use a responsive administration hierarchy for the truthful version overview,
  global Secrets and Registries, repositories, users, organizations, Agents,
  Queue, and Forge list/detail/create routes with current typed APIs, explicit
  states, confirmed-data continuity, and lifecycle-owned mutations.
- `017-user-auth-routes` / baseline task `5.3`: authenticated users now use a
  responsive personal settings hierarchy for real identity/preferences,
  organization-backed Secrets, Registries, and optional Agents, plus current
  token APIs; guests and CLI clients receive Forge-only login, safe OAuth error
  links, query-owned localhost authorization, and a truthful catch-all 404.
- `018-authorization-boundaries` / baseline task `5.4`: guests now receive a
  login-only application Sidebar while retaining public repository and
  organization routes; regular users are rejected from direct or saved
  `/admin/**` destinations before administration content mounts; system
  administrators retain direct access; repository and organization decisions
  remain server-backed.
- `019-route-family-parity-closure` / baseline task `5.5`: one concentrated
  route contract and the existing focused suites protect all `23` organization,
  administration, user, authentication, and not-found destinations. Current
  run `93ce89f7-0d51-40ba-827e-3731aeea2f96` strictly verifies `92`
  production/prototype dark Simplified-Chinese desktop/390px states for rows
  `1` and `24-45`; all `14` persisted verifier mutations are rejected.
- `020-overview-repositories-reverification` / baseline task `6.1`: Overview
  and Repositories now expose truthful initial, empty, partial-failure,
  refresh, permission, pagination, metric, and newest-request states. Current
  run `1eae7bc3-e742-4aac-bce0-ec61105eebb8` strictly verifies `20`
  production/prototype desktop/390px states for rows `2-3`; all `15` persisted
  verifier mutations are rejected.
- `021-infrastructure-route-reverification` / baseline task `6.2`: the
  Infrastructure overview, server list/detail tabs, groups, services, and
  alerts now expose truthful initial, error, empty, filtered-empty, refresh,
  permission, mutation, and unsupported-capability states. Current run
  `84b42687-5a1a-402c-952f-6e5fd1ac338a` strictly verifies `62`
  production/prototype states for rows `46-57`; all `13` persisted verifier
  mutations are rejected.
- Phase 5 is complete. This remains an incremental development snapshot rather
  than the final six-domain verification handoff: the `11` baseline tasks in
  phases `6-8`, deployment rows `58-67`, blocked repository row `4`, and
  complete change-level acceptance remain open.

## Files Changed

- Shared formatting: `web/src/compositions/useDate.ts`,
  `web/src/compositions/useElapsedTime.ts`, and focused tests.
- Shared shell: `web/src/App.vue`, `web/src/components/layout/header/Sidebar.vue`,
  `web/src/components/layout/header/Navbar.vue`, English/Simplified-Chinese
  locales, Vite locale discovery, and focused tests.
- Shared feedback: `web/src/components/atomic/FeedbackState.vue`,
  `Button.vue`, `IconButton.vue`, `Error.vue`, representative repository and
  pipeline consumers, English/Simplified-Chinese locales, and focused tests.
- Slice `004` changed no file under `web/`; its diff is limited to SpecNav and
  CodeGraph evidence/lifecycle artifacts.
- Pipeline detail header: `web/src/views/repo/pipeline/PipelineWrapper.vue`,
  its focused component test, and English/Simplified-Chinese locales.
- Pipeline execution overview: `web/src/views/repo/pipeline/Pipeline.vue`, its
  focused component test, and English/Simplified-Chinese locales.
- Pipeline diagnostics: `web/src/components/repo/pipeline/PipelineLog.vue`,
  `web/src/views/repo/pipeline/PipelineChangedFiles.vue`,
  `PipelineConfig.vue`, `PipelineErrors.vue`, `PipelineDebug.vue`, five focused
  tests, and English/Simplified-Chinese locales.
- Pipeline regression coverage: `web/src/router.test.ts`, focused tests for the
  pipeline wrapper, overview, log, changed-files, config, errors, and Debug,
  plus the regression-proven `PipelineWrapper.vue` cancellation-context fix.
- Pipeline validation evidence: one test-only router timeout stabilization and
  task-local Mock API, smoke, bounded CDP capture, independent verifier,
  thirty measurement/PNG pairs, per-state console artifacts, replay summary,
  checksummed manifest, report, and independent reviews.
- Repository pipeline list: `web/src/views/repo/RepoPipelines.vue`, focused
  route/metric tests, the request-local `hasMore` return from
  `web/src/store/pipelines.ts`, its real concurrent Pinia regression, locales,
  and four responsive browser states.
- Repository references: branch/PR list and detail routes, shared
  `RepoPipelineReference.vue`, shared `pipelineRefs.ts`, focused lifecycle and
  correlation tests, locales, task-local Mock API/capture/verifier, and eight
  responsive browser states.
- Repository manual-run/settings: `RepoManualPipeline.vue`, the settings
  wrapper and seven settings routes, four shared presentation components,
  `repoBadge.ts`, focused lifecycle/permission/state tests, locales, task-local
  Mock API/capture/verifier, and ten responsive browser states.
- Repository regression coverage: `web/src/router.test.ts`,
  `RepoWrapper.vue` and its new shell/lifecycle suite, shared pagination and
  pipeline-store loading repairs/tests, disabled PR route states/tests,
  repository activity/settings containment tests, and bilingual disabled copy.
- Repository validation evidence: task-local deterministic Mock API, smoke
  runner, exclusive-service no-resume CDP capture, independent strict verifier,
  `100` measurement/PNG pairs, replay summary, checksummed manifest, report,
  and superseding independent reviews. No production or approved-prototype
  file changed in slice `014`.
- Administration routes: administrator router coverage, responsive
  `AdminSettingsNav`, overview, global resource/repository/user/organization/
  Agent/Queue/Forge pages, queue statistics, shared Agent lifecycle repair,
  English/Simplified-Chinese copy, focused regressions, task-local Mock API,
  CDP capture, strict verifier, `44` measurement/PNG pairs, report, and
  superseding independent reviews.
- User/auth routes: catch-all router coverage, responsive `UserSettingsNav`,
  real account preferences and identity, organization-backed personal
  Secret/Registry/Agent routes, current token get/reset, Forge-only login,
  query-owned localhost CLI authorization, safe OAuth error links, truthful
  not-found actions, bilingual copy, focused regressions, task-local Mock API,
  CDP capture, strict verifier, `32` measurement/PNG pairs, report, and
  superseding independent reviews.
- Authorization boundaries: inherited `system-admin` route metadata,
  browser-compatible ancestor lookup, failure-tolerant translated denial,
  direct/saved administration guards, guest Sidebar visibility, focused
  repository/organization permission regressions, ten desktop/mobile browser
  states, exact link-inventory verifier, report, and final independent reviews.
- Route-family parity closure: test-only
  `web/src/route-family-parity.test.ts`, task-local aggregate capture, strict
  independent verifier, persistent 14-mutation red-team, `92` measurement/PNG
  pairs, approved task acceptance for `A2/A3`, and closure lifecycle records.
- Overview and Repositories re-verification: `App`, `Overview`, and
  `Repositories` localized error/state ownership, focused page regressions,
  task-local Mock API/capture/verifier, persistent 15-mutation red-team, `20`
  measurement/PNG pairs, approved task acceptance for `A1-A4`, and closure
  lifecycle records.
- Infrastructure re-verification: seven infrastructure route views, shared
  infrastructure navigation, server/group/alert store ownership, bilingual
  state copy, focused regressions, task-local Mock API/capture/verifier,
  persistent 13-mutation red-team, `62` measurement/PNG pairs, approved task
  acceptance for `A1-A4`, and closure lifecycle records.
- Exact task-owned file lists are recorded in
  `development/tasks/001-date-duration-integrity/report.md`,
  `development/tasks/002-shared-shell-alignment/report.md`,
  `development/tasks/003-shared-feedback-primitives/report.md`, and
  `development/tasks/004-shell-theme-evidence/report.md`, and
  `development/tasks/005-pipeline-detail-header/report.md`, and
  `development/tasks/006-pipeline-overview/report.md`, and
  `development/tasks/007-pipeline-log-diagnostics/report.md`,
  `development/tasks/008-pipeline-regression-coverage/report.md`, and
  `development/tasks/009-pipeline-validation-evidence/report.md`,
  `development/tasks/010-repository-pipeline-list/report.md`, and
  `development/tasks/011-repository-branches-pull-requests/report.md`, and
  `development/tasks/012-repository-manual-run-settings/report.md`, and
  `development/tasks/013-repository-regression-coverage/report.md`, and
  `development/tasks/014-repository-validation-evidence/report.md`,
  `development/tasks/015-organization-routes/report.md`, and
  `development/tasks/016-administration-routes/report.md`, and
  `development/tasks/017-user-auth-routes/report.md`, and
  `development/tasks/018-authorization-boundaries/report.md`, and
  `development/tasks/019-route-family-parity-closure/report.md`, and
  `development/tasks/020-overview-repositories-reverification/report.md`, and
  `development/tasks/021-infrastructure-route-reverification/report.md`.

## Requirements Covered

- `A4` is covered for shared date/duration formatting by slice `001`.
- `A2` and `A3` were independently verified for the implemented shared-shell
  behavior in slice `002`.
- `A3` was independently verified for shared feedback slice `003` and the
  evidence-only shell/theme gate in slice `004`.
- Slice `004` records only the shared-shell prerequisite for future `A2`
  route-family verification. It does not mark any route family complete.
- `A2` and `A3` were independently verified for the completed pipeline detail
  header slice `005`; that review did not cover the pipeline overview body,
  logs, or detailed tab bodies assigned to the following pipeline tasks.
- `A2`, `A3`, and `A4` were independently verified for the completed pipeline
  execution overview slice `006`; this covers only real workflow/step summary,
  unavailable-data fallbacks, current step-log entry, and responsive
  containment, not task `3.3` log controls or remaining route bodies.
- `A2`, `A3`, and `A4` were independently verified for the completed pipeline
  diagnostics slice `007`; this covers only current step logs, changed-file
  paths, historical config, runtime/parse errors, metadata Debug, responsive
  containment, and stale-log response protection, not tasks `3.4` or `3.5`.
- `A3` and `A4` were independently verified for slice `008` within the
  pipeline regression scope: current route precedence, status/cancellation
  variants, permissions/actions, explicit states, stale responses, and local
  responsive containment.
- `A2`, `A3`, and `A4` were independently verified for slice `009` within the
  completed pipeline route family using current `66` focused tests, `175` full
  tests, exact-dimension desktop/mobile PNG evidence, live route and
  destination semantics, service/proxy/prototype identity, and push/read-only
  browser states.
- `A3` and `A4` were independently verified for repository pipeline-list slice
  `010`, including real metrics/filters/actions, request-local concurrent
  pagination state, focused/full regressions, and responsive containment.
- `A3` and `A4` were independently verified for repository reference slice
  `011`, including exact branch/PR correlation, explicit fallbacks, confirmed
  refresh continuity, active and obsolete request ownership, focused/full
  regressions, and desktop/390px populated-route evidence.
- `A3` and `A4` were independently verified for repository manual-run/settings
  slice `012`, including current branch/resource data, permission and mutation
  boundaries, same-ID route lifecycle ownership, confirmed-row replacement
  timing, focused/full regressions, and desktop/390px evidence.
- `A4` was independently verified for repository regression slice `013`,
  including named/inbound routes, permission/action boundaries, Vue-owned
  active failures, complete `A -> B -> A` load ownership, disabled direct
  access, shared loading recovery, and structural containment. Full `A3`
  remains open because task `4.5` owns current-byte desktop/390px browser
  evidence.
- `A1` and task-scoped `A3` were independently verified for repository
  evidence slice `014`: all `67` inventory rows retain an allowed status and
  repository rows `3-23` have current same-state evidence. Full repository
  `A2` remains open because row `4` is blocked; full-change `A3`/`A4` remain
  open until the remaining development and parity-matrix work is complete.
- Task-scoped `A3` and `A4` were independently verified for administration
  slice `016`: the eleven existing destinations pass focused/full/static/build
  checks and exact dark Simplified-Chinese desktop/390px evidence, while active
  lifecycle ownership preserves confirmed rows/editors and rejects obsolete or
  post-unmount completions. Full `A2` remains open under task `5.5`, and rows
  `28-38` remain `in-progress`.
- Task-scoped `A3` and `A4` were independently verified for user/auth slice
  `017`: the eight existing destinations pass focused/full/static/build checks
  and exact dark Simplified-Chinese desktop/390px evidence; confirmed resources,
  editors, tokens, Forge loads, and CLI callbacks reject obsolete owner
  completions. Full `A2` remains open under task `5.5`, and rows `1` and
  `39-45` remain `in-progress`.
- Task-scoped `A3` was independently verified for authorization slice `018`:
  guest public repository/organization entry, guest login continuation,
  regular-user direct/saved administration denial, system-administrator entry,
  exact role-specific navigation inventories, locale readiness/failure, and
  repository/organization server-backed permission boundaries pass focused,
  full, static/build, and exact desktop/390px evidence.
- Task-scoped `A2` and `A3` are approved for route-family closure slice `019`.
  Rows `1` and `24-45` pass one strict current-byte `92`-state
  production/prototype replay at desktop and 390px, the concentrated router
  command passes `2` files / `39` tests, the complete focused route-family
  command passes `34` files / `173` tests, and every one of the `14` isolated
  evidence mutations is rejected. This approval does not cover rows `2-23`,
  rows `46+`, phases `6-8`, or complete change-level acceptance.
- Task-scoped `A1`, `A2`, `A3`, and `A4` are approved for slice `020`.
  Rows `2-3` pass exact current-byte production/prototype dark
  Simplified-Chinese desktop/390px comparison plus representative light and
  role/data boundary states. Focused `5/26`, full `87/513`, strict `20/20`,
  and all `15` isolated verifier mutations pass. This approval does not cover
  task `6.2+`, row `4`, rows `46+`, or complete change-level acceptance.
- Task-scoped `A1`, `A2`, `A3`, and `A4` are approved for slice `021`.
  Rows `46-57` pass exact current-byte production/prototype dark
  Simplified-Chinese desktop/390px comparison plus production light-English,
  normal-user, and empty-data states. Focused `9/39`, full `95/549`, strict
  `62/62`, and all `13` isolated verifier mutations pass. This approval does
  not cover task `6.3+`, row `4`, rows `58-67`, or complete change-level
  acceptance.

## Prototype Decisions Implemented

- The approved prototype remains a product-state reference only; production
  continues to use real APIs, stores, permissions, routing, and mutations.
- The shared shell uses the approved `248px` sidebar, `64px` topbar, `17px`
  brand label, `40px` navigation rows, dark/light themes, desktop/mobile
  hierarchy, and accessible mobile drawer behavior.
- Shared feedback states use compact/full presentation and semantic status
  behavior without introducing a generic application state machine.
- Pipeline detail uses the approved `repository / Pipeline` eyebrow, translated
  icon-plus-text status, real commit context, responsive actions, and existing
  production route destinations without copying prototype fixtures.
- Pipeline overview uses current workflows, steps, status, duration, and
  environment data; unsupported executor image, queue, resource, agent,
  release, annotation, artifact, graph, and start-clock fixtures are not
  invented.
- Pipeline diagnostics use current log types, changed-file strings, base64
  config snapshots, typed errors, repository permissions, and metadata
  endpoint data. Prototype-only diff statistics, config analysis, remediation,
  previous-success comparison, and interactive Debug sessions are not
  invented.
- Pipeline regression coverage preserves existing route/API/store/permission
  contracts and fixes only the regression-proven killed-step cancellation
  interpolation. The final evidence slice changes no production runtime.
- Pipeline browser evidence compares the live production route family with the
  immutable approved prototype, records exact URLs and rendered semantics, and
  blocks on console/runtime/network/HTTP failures, pending requests, raw i18n
  keys, page overflow, permission leakage, or checksum drift.
- Desktop/mobile comparisons normalize theme, locale, viewport, administrator
  permission, and populated-data state instead of copying prototype fixtures.
- Repository lists use only current API/store data and loaded pipeline history.
  Unsupported server totals, branch protection/comparison, PR review/diff
  metadata, and Forge mutations are not invented.
- Repository manual-run/settings use current repository fields, branch and
  resource APIs, permissions, mutations, and route outcomes. Prototype-only
  audit, history, cache, export, archive, verification, marketplace, or
  inferred metadata is not invented.
- Repository regression coverage preserves all current route, API, store,
  authentication, and permission contracts while repairing only
  regression-proven lifecycle/error, loading, disabled-route, and containment
  behavior.
- Repository evidence uses current production APIs and a task-local deterministic
  fixture only for replay. It does not disguise the `/repos/add` mismatch:
  production has `0` wizard steps and the approved prototype has `4`.
- Administration routes use only current version/configuration data, typed
  Secret/Registry/repository/user/organization/Agent/Queue/Forge APIs, existing
  permissions, and supported mutations. Prototype-only health, capacity,
  telemetry, audit, invitation, quota, priority, promote/cancel, connection
  test/status/count, and usage metrics are not invented.
- User/auth routes use only authenticated `User` fields, browser-owned
  preferences, current organization resource APIs, existing token endpoints,
  Forge providers, and the localhost CLI callback protocol. Password/SSO,
  profile mutation, authorized applications, device/location approval, Agent
  telemetry, and unsafe OAuth error links are not invented or exposed.
- Authorization boundaries use existing bootstrap authentication,
  administrator flags, inherited route metadata, saved destinations,
  notifications, i18n, and server-returned `RepoPermissions`/`OrgPermissions`.
  Hidden navigation is not treated as enforcement, and no resource permission
  is inferred statically.

## Components Created / Reused / Extracted

- Created: display-only `FeedbackState` with loading, empty, error, disabled,
  permission, and stale variants.
- Reused and repaired: `App`, `Sidebar`, `Navbar`, `Button`, `IconButton`,
  `Error`, `PrototypeIcon`, `useTheme`, `useDate`, `useElapsedTime`, Vue i18n,
  Vue Router, pagination, authentication, permission, repository, and
  configuration seams.
- Reused for pipeline detail: `Scaffold`, `Tab`, `PipelineStatusIcon`,
  `RenderMarkdown`, `DeployPipelinePopup`, `usePipeline`, `useAsyncAction`,
  pipeline/application stores, repository injection, and current API/router
  actions.
- Reused for the execution overview: `PipelineStepList`, `PipelineLog`,
  `PipelineStatusIcon`, `PipelineStepDuration`, `Badge`, `Panel`, `Button`,
  `usePipeline`, pipeline/config injection, Vue i18n, and current step routing.
- Reused for diagnostics: `Button`, `IconButton`, `FeedbackState`, `Panel`,
  `SyntaxHighlight`, `DocsLink`, `RenderMarkdown`, current API and injection
  seams, notifications, i18n, router, clipboard, and browser download APIs.
- Reused for regression/evidence closure: current Vitest configuration, Vue
  Router, Vite proxy, production API/store seams, Chrome CDP, Node/Python
  standard libraries, and the immutable standalone prototype.
- Created/extracted for repository references:
  `web/src/components/repo/RepoPipelineReference.vue` centralizes the shared
  branch/PR detail hierarchy, while `web/src/lib/pipelineRefs.ts` centralizes
  production PR event/ref normalization.
- Created/extracted for repository settings: presentation-only
  `RepoSettingsNav`, `RepoSettingsSection`, `RepoSettingsTable`, and
  `RepoSettingsActionRow`, plus the pure typed `repoBadge.ts` formatter.
- Created for administration navigation: presentation-only
  `AdminSettingsNav`; reused `SettingsSection`, `SettingsTable`,
  `SettingsActionRow`, `FeedbackState`, `AgentManager`, `AdminQueueStats`,
  `AdminForgeForm`, pagination, interval scheduling, notifications, i18n,
  router, and current API clients.
- No additional generic list abstraction was added: branch `string[]` and PR
  `{ index, title }[]` remain distinct typed route contracts.

## API / Data Flow Changes

- No backend, API payload, store, router runtime, authentication, permission
  calculation, persistence, migration, or dependency contract changed in
  slices `001` through `009`.
- Slice `010` only returns its already-computed request-local `hasMore` value
  from the existing pipeline-store action; no backend/API payload, router,
  permission, persistence, migration, or dependency contract changed.
- Slice `011` adds no API, store, router, permission, backend, mutation,
  persistence, migration, or dependency contract.
- Slice `012` adds no API, store, router, permission, backend, persistence,
  migration, dependency, or approved-prototype contract.
- Slice `013` adds no API, store, router, permission, backend, persistence,
  migration, dependency, or approved-prototype contract.
- Slice `014` adds no production or approved-prototype change. Its Mock API,
  capture, verifier, measurements, screenshots, summary, and manifest are
  task-local evidence artifacts.
- Slice `016` adds no backend, API payload, store, router runtime,
  authentication, permission calculation, persistence, migration, dependency,
  or approved-prototype contract. It repairs component-owned request/editor
  lifecycle behavior around existing administration APIs.
- Slice `018` adds no role, route, API, store, backend permission, persistence,
  migration, dependency, or static repository/organization authorization. It
  centralizes existing route entry, preserves resource permission owners, and
  changes only authenticated navigation visibility.
- Slice `019` adds no production route, component, API, store, locale, backend,
  permission, persistence, migration, dependency, or approved-prototype
  change. Its frontend delta is test-only; capture, verifier, red-team, and
  browser artifacts remain task-local evidence.
- Slice `020` changes only existing frontend state/error presentation and
  focused tests. It adds no route, API request, payload, backend, permission,
  persistence, migration, dependency, or approved-prototype contract.
- Slice `021` changes only existing infrastructure presentation, request and
  mutation ownership, localized feedback, and focused tests. It adds no route,
  API request, payload, backend, permission algorithm, persistence, migration,
  dependency, production fixture, or approved-prototype contract.
- Existing theme and locale preference flows, repository/API truth, pagination,
  injected permissions, and repository identity-conflict data remain the
  authoritative state sources.

## Tests Added

- Focused date/duration boundary tests cover invalid, missing, zero-epoch,
  negative, non-finite, unsafe, and overflow values.
- Shared-shell tests cover geometry contracts, drawer ARIA/backdrop/inert/focus/
  scroll lifecycle, permission visibility, localized search feedback, theme and
  locale behavior, and safe locale discovery.
- Shared-feedback tests cover all variants, live-region semantics, busy and
  disabled route/HTTP/external controls, submit-type preservation, repository
  branch states, pipeline permission state, and repository stale conflicts.
- Pipeline-header tests cover the approved eyebrow, all 11 pipeline statuses,
  all 9 webhook events, pending and terminal action boundaries, retry busy
  semantics, both deploy paths, deploy-disabled state, permissions, and tabs.
- Pipeline-overview tests cover default overview state, real summary/context,
  explicit image availability and config entry, selected-step routing, empty
  workflows, error precedence, blocked approval/decline APIs, and read-only
  permission.
- Pipeline-diagnostics tests cover local log search/stderr filtering without
  refetch, no-match/reset, wrapping, push-gated deletion, stale old-request
  rejection, changed-file search/empty states, config decode/copy/empty
  behavior, real error/empty behavior, and Debug permission/download cleanup.
- Pipeline regression tests cover named and inbound destination precedence,
  all current status/cancellation branches, permission-aware actions and tabs,
  selected-step routing, explicit empty/error states, stale logs, metadata
  behavior, and structural mobile containment.
- Repository pipeline tests cover request-local concurrent pagination results,
  filters, metrics, actions, permissions, empty/loading states, and responsive
  local scrolling.
- Repository reference tests cover exact ref/event correlation, shared detail
  summaries, loaded search/pagination, synchronous-clear refresh continuity,
  disabled actions, active success/rejection, repository reset, and obsolete
  fulfill/reject ownership.
- Repository manual-run/settings tests cover branch paging and variables,
  permission changes, loading/error/empty states, inherited-resource
  precedence, same-ID lifecycle races, mutation/run side effects, confirmed-row
  refresh recovery, page-two replacement timing, badge formatting, actions,
  extensions, and local mobile table containment.
- Repository regression tests cover all non-pipeline named/inbound
  destinations, pull/push/admin/PR gates, active error propagation, every
  downstream `A -> B -> A` completion, disabled PR no-request behavior,
  rejected/overlapping loading, theme-invariant controls, and activity/settings
  structural containment.
- Repository validation reuses the current `32`-file/`214`-test repository
  suite and adds task-local Mock API smoke plus strict verification for exact
  inventory, run identity, protected trees, routes, content, permissions,
  browser health, warning classification, overflow, and checksums.
- Organization route tests cover current named/inbound destinations,
  organization and permission ownership, repository filtering/search and
  explicit states, responsive settings navigation, Agent feature disablement,
  Registry precedence, create/update/delete lifecycle ownership, active
  mutation failures, obsolete fulfilled/rejected completions, confirmed-row
  recovery, shared repository-store overlap, shared component containment, and
  current-organization back behavior.
- Administration tests cover all eleven named/inbound destinations,
  administrator denial, responsive navigation, explicit states, confirmed-row
  continuity, pagination, current mutations, Queue overlap/unmount, Forge
  `A -> B -> A` and same-route refresh preservation, and deferred same-owner
  Agent/Secret/Registry/User editor replacement without stale publication or
  successor locking.
- Route-family closure adds one concentrated table-driven contract for the
  exact `23` owned destinations, named/inbound resolution, route metadata,
  dynamic parameters, catch-all ordering, and the exact focused-suite
  inventory.
- Overview and Repositories tests cover initial loading, core and optional
  failures, safe retry, confirmed-data preservation, administrator versus
  normal-user requests, overlapping refreshes, empty/filter-empty results,
  pagination, selection, cached/forced metrics, and obsolete completions.
- Infrastructure tests cover initial loading, retry, confirmed-data
  preservation, empty/filter-empty states, route switching, overlapping
  refreshes, polling exclusion, mutation ownership, role visibility,
  unsupported controls, filters, and newest store ownership.
- The current full frontend regression baseline is `95` test files and `549`
  tests.

## Local Validation

- PASS: final pipeline-focused suite, 8 files and 66 tests; the exact command
  also passed three sequential stability runs after the router test timeout
  stabilization.
- PASS: pipeline-phase complete frontend baseline, 28 files and 175 tests.
- PASS: repository pipeline-list focused suite, 3 files and 13 tests.
- PASS: repository reference focused suite, 6 files and 27 tests.
- PASS: repository manual-run/settings focused suite, 14 files and 75 tests.
- PASS: repository regression focused suite, 9 files and 63 tests.
- PASS: repository regression supporting suite, 22 files and 118 tests.
- PASS: repository validation focused suite, 32 files and 214 tests.
- PASS: organization route focused suite, 13 files and 44 tests.
- PASS: supporting repository settings suite after shared component promotion,
  8 files and 62 tests.
- PASS: administration route focused suite, 17 files and 84 tests.
- PASS: isolated supersession for the two unrelated tests that failed only
  under prior concurrent resource pressure, 2 files and 23 tests.
- PASS: current complete frontend suite, 74 files and 422 tests.
- PASS: ESLint, TypeScript, Vite build, and `git diff --check`.
- PASS: slice-owned targeted Prettier checks. For slice `004`, all 11
  non-baseline allowed shell files pass and `web/` has zero diff.
- PASS: targeted desktop and 390px browser evidence for completed slices,
  including theme, locale, responsive overflow, drawer lifecycle, feedback
  states, long copy, busy/disabled controls, pipeline metadata, action/tab
  permission boundaries, execution overview and selected log states, explicit
  unavailable-data fallbacks, local log/path filters, config copy, error/empty
  states, push/read-only Debug, internal dense-content scrolling, and
  equivalent dark Simplified-Chinese production/prototype comparison.
- PASS: task-local Mock API smoke across 14 endpoint/status assertions.
- PASS: bounded 30-state CDP replay with verified Git/runtime/Vite
  proxy/Mock/prototype identity, live route names, complete destination
  semantics, per-state console/runtime/network/HTTP health, exact PNG
  dimensions, permission boundaries, no page overflow/raw keys, clean exit,
  and same-run manifest refresh.
- PASS: independent evidence verifier for all thirty state/PNG pairs, exact
  console correspondence, service/route/content assertions, and all manifest
  SHA-256 values.
- PASS: repository pipeline-list four-state and repository reference eight-state
  desktop/mobile capture plus independent checksum/route/content/overflow
  verification.
- PASS: repository manual-run/settings ten-state desktop/mobile capture plus
  independent checksum/route/content/permission/overflow verification,
  including mobile Secrets `390/390` document containment and `821/345` local
  scrolling.
- PASS: repository no-resume replay for exactly `100` current-run states
  (`58` production and `42` prototype), with exclusive task-owned services,
  one shared run ID, exact inventory, protected-tree identity, atomic summary
  and manifest replacement, zero page-overflow/raw-key/browser-error states,
  and verified checksums.
- PASS: organization task replay for exactly `16` final-run states
  (`8` production and `8` approved prototype) under run
  `f5452fe5-ef9d-4b00-9126-20404e946858`, covering rows `24-27` in dark
  Simplified Chinese at `1600x1000` and `390x844`, exact terminal routes,
  expected content, exact JSON/PNG state inventory and row/surface/viewport
  mapping, zero page overflow/raw locale keys/browser errors, and local mobile
  settings-table containment.
- PASS: administration task replay for exactly `44` final current-byte states
  (`22` production and `22` approved prototype) under run
  `09279f46-4db9-4a6a-b00f-8340ef3c1fc0`, covering rows `28-38` in dark
  Simplified Chinese at `1600x1000` and `390x844`, exact state/file/row/
  surface/viewport/terminal-route bindings, expected content, exact PNG
  dimensions, zero page overflow/raw locale keys/browser errors, and strict
  JSON/PNG inventory.
- PASS: authorization task replay for exactly `10` final current-byte states
  under run `35884fa1-a6ba-4077-bf2e-c80d409f3c86`, covering guest public
  organization/repository entry, guest administration login, regular-user
  denial, and administrator entry at `1600x1000` and `390x844`, with exact
  unique link inventories, non-admin `/admin` exclusion, zero overflow/browser
  errors, exact PNG dimensions, and an equal-count malicious-link negative
  replay rejected with exit `1`.
- PASS: route-family closure concentrated router command, `2` files / `39`
  tests; complete family-focused suite, `34` files / `173` tests; and full
  frontend suite, `85` files / `496` tests.
- PASS: route-family closure run
  `93ce89f7-0d51-40ba-827e-3731aeea2f96` contains exactly `92` measurements
  and `92` PNGs for rows `1` and `24-45`, split into `46` production
  `zh-Hans` states and `46` approved-prototype `zh-CN` states at `1600x1000`
  and `390x844`.
- PASS: the strict route-family verifier checks exact source identity,
  destination/path, theme, locale, viewport, content assertions, four-key
  browser health, overflow, PNG signature/dimensions, and shared run ID. Its
  persistent red-team rejects all `14` isolated corruptions while the restored
  evidence passes.
- PASS: Overview and Repositories focused suite, `5` files / `26` tests, and
  complete frontend suite, `87` files / `513` tests.
- PASS: run `1eae7bc3-e742-4aac-bce0-ec61105eebb8` contains exactly `20`
  measurements and `20` PNGs for rows `2-3`, including dark equivalent states,
  light representatives, normal-user, empty, and partial-failure boundaries.
- PASS: the strict task `020` verifier checks exact inventory, source/service
  identity, route, viewport, theme, locale, role, data state, content,
  administrator-only requests, browser health, overflow, raw i18n, raw server
  payloads, PNG integrity, checksums, and shared run ID. Its persistent
  red-team rejects all `15` isolated corruptions.
- PASS: Infrastructure focused suite, `9` files / `39` tests, and complete
  frontend suite, `95` files / `549` tests.
- PASS: run `84b42687-5a1a-402c-952f-6e5fd1ac338a` contains exactly `62`
  measurements and `62` PNGs for rows `46-57`, split into `38` production and
  `24` approved-prototype states with desktop/mobile, theme, locale, role, and
  empty-data coverage.
- PASS: the strict task `021` verifier checks exact inventory, source/service
  identity, route/tab, viewport, theme, locale, role, content, browser health,
  overflow, raw i18n, unexpected HTTP failures, administrator controls, PNG
  integrity, checksums, and shared run ID. Its persistent red-team rejects all
  `13` isolated corruptions.
- PASS: Verification 2.0 runtime `2.0.0-alpha.2` is installed and ready with
  `fallback_used:false`; task `019` has an approved task-local acceptance bound
  to signed receipt
  `receipt-546372f64d11faaef51b40ee9c40b261bc2f060ab6e7388873a428d712d4536c`
  on closure commit `7a9acca2de54994be66beed233c096b321fed1e7`.
- PASS: task `020` has approved task-local acceptance for `A1-A4` bound to
  signed receipt
  `receipt-64219d16b284e2cf02b77081e8ce8c29a827d485c815b1d543a14966f9ef3c29`
  on closure commit `622e858be7d6f5f74f37e7ad1cfccbb094771454`.
- PASS: task `021` has approved task-local acceptance for `A1-A4` bound to
  signed receipt
  `receipt-27410e1f409b7a06f63f7d5f25ab293802be76785a6bb14b6aa274dc60d48f96`
  on closure commit `c939d9a9677c2258d447387df0fb4d7d0de0d5b4`.
- Detailed replayable receipts are in `development/validation-log.jsonl`.

## Known Risks

- Eleven baseline tasks remain incomplete across operations,
  accessibility/i18n/responsive, and full six-domain verification work.
  Global prototype parity must not be claimed.
- Repository row `4` remains blocked: production `/repos/add` renders the
  Forge activation list while the approved prototype renders a four-step
  configuration wizard. Baseline task `4.5` is complete as an evidence task,
  not as a claim that every repository route matches.
- The unchanged `web/src/style.css` has a pre-existing Prettier mismatch.
  Slice `004` records the original failure plus a contract-accepted,
  task-scoped zero-diff adjudication; this is not evidence that the file is
  formatted.
- Vite build retains the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.
- Verification 2.0 runtime status is present and ready, and the historical
  `016-018` failed/blocked validation receipts have valid signed current-HEAD
  successors plus append-only adjudications. The installed development handoff
  contract still cannot return `ok:true` while phases `6-8` contain unchecked
  tasks, and it also reports missing task-local `acceptance.json` artifacts for
  historical tasks `001-018`. Those historical files must not be fabricated
  without valid task assertions and signed current-HEAD receipts.
- Slice `004` prototype mobile rendering used an attested `390x844` viewport,
  while the standalone screenshot API cropped temporary PNG content to
  `380x822`. The crop is disclosed and the PNG alone is not treated as viewport
  proof.
- Temporary browser screenshots are not durable change artifacts; replayable
  system-executed receipts and future six-domain evidence must carry the final
  verification burden.
- The standalone prototype screenshot API cropped the attested `1600x1000` and
  `390x844` viewports to `1590x994` and `380x822`; production screenshots retain
  the requested dimensions and the viewport receipt discloses the prototype
  crop.
- The current persisted/API step contract does not expose executor image data.
  Slice `006` reports this explicitly and does not parse arbitrary YAML or
  infer prototype fixture values.
- Browser automation did not expose a capture event for the programmatic Debug
  Blob download. The focused test directly verifies the metadata endpoint,
  success feedback, and object-URL cleanup; final E2E verification must retain
  that distinction.

## Items Requiring Six-Domain Verification

- Do not begin final six-domain verification yet; phase 5 is complete, but
  phases `6-8` remain open.
- After the remaining phase `6-8` tasks are complete, verify all 67 parity-matrix
  route/tab rows across equivalent theme, locale, viewport, permission, and
  data states.
- Re-run facticity, static, unit, redteam, E2E, and sensory verification for
  every assertion and completed route family.
- Confirm real APIs and mutations, permission boundaries, data integrity,
  accessibility, internationalization, responsive containment, and dark/light
  semantic token behavior.
- Produce the final HTML report only after remaining incomplete or blocked
  routes are explicitly resolved or retained as open findings.
