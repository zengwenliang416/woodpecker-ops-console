# Task Brief: 020-overview-repositories-reverification

## Goal

Authenticated users can use Overview and Repositories with truthful current
data, explicit operational states, preserved authorization boundaries, and
prototype-aligned desktop/mobile presentation in dark/light and Simplified
Chinese/English.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/artifact/index.html`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/artifact/assets/views.js`

## Vertical Slice

Re-verify parity rows `2` and `3` from current production and approved
prototype bytes. Protect the two production routes with focused component,
metric, and store regressions for real populated, empty, filtered-empty,
partial-failure, active-failure, permission-role, refresh, and overlapping
request states. Capture equivalent production/prototype theme, locale,
viewport, role, and data states with strict service/source/browser evidence.
Repair production behavior only when a focused red regression proves a
task-scoped defect.

## In Scope

- Add page-level behavior tests for `Overview.vue` and `Repos.vue`.
- Verify administrators receive queue and Agent information while normal users
  neither request nor render administrator-only data.
- Verify repository metrics, unknown fallbacks, filters, pagination,
  selection, local dense-table scrolling, refresh, empty states, and partial
  API failures from current typed API/store data.
- Extend repository metric or repository-store tests only when a page-level
  red regression requires the shared boundary to change.
- Add bilingual visible feedback only for proven loading, error, stale, empty,
  or permission gaps; do not add raw user-visible strings.
- Add a task-local Mock API, current-byte browser capture, strict verifier,
  evidence manifest, report, reviews, and lifecycle records.
- Update only route-parity rows `2` and `3` and baseline task `6.1` after all
  task-local evidence and reviews pass.

## Out Of Scope

- Infrastructure, server, deployment, application, environment, release, and
  policy routes; baseline tasks `6.2` through `8.4`.
- New routes, APIs, payload fields, backend behavior, persistence, permission
  algorithms, dependencies, migrations, or prototype fixtures in production.
- The blocked repository-add wizard at parity row `4` or any repository detail
  row already owned by task `014`.
- Global accessibility, localization, responsive, release, or complete-change
  acceptance claims.

## Files Allowed

- `web/src/views/Overview.vue`
- `web/src/views/Overview.test.ts`
- `web/src/views/Repos.vue`
- `web/src/views/Repos.test.ts`
- `web/src/App.vue`
- `web/src/App.test.ts`
- `web/src/lib/repoMetrics.ts`
- `web/src/lib/repoMetrics.test.ts`
- `web/src/store/repos.ts`
- `web/src/store/repos.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/020-overview-repositories-reverification/**`
- Existing task graph, CodeGraph plan, handoff, task ledger/context,
  validation, and drift files for task `020`.

The user approved the `App.vue` and `App.test.ts` scope expansion on
2026-08-13 after independent review proved that the existing global API error
handler exposed raw English/JSON server payloads in Task 020 partial-failure
states. The approved change is limited to replacing non-404 raw error messages
with the existing localized generic error and adding its focused regression.

## Interfaces / Seams

- `useRepoStore()` remains authoritative for owned repository identity and
  latest-request-wins hydration.
- `useApiClient()` remains authoritative for pipeline feed/detail, Forge,
  Agent, queue, and repository pipeline history.
- `useAuthentication()` remains authoritative for the system-administrator
  role; repository detail routes retain their existing server-backed
  repository permission guards.
- `calculatePipelineStats()`, `pipelineDurationSeconds()`, and
  `repoPipelineStatus()` remain the shared metric/status boundary.
- `Scaffold`, `OpsMetricCard`, `FeedbackState`, `Button`, `IconButton`, and
  `.wp-table-scroll` remain the shared presentation primitives.

## Components To Create

- No new production component is planned.
- Create only focused page tests and task-local evidence tooling.

## Components To Reuse

- Existing Scaffold, metric-card, feedback, button, icon, table, i18n, API,
  store, repository, authentication, notification, and title behaviors.
- Task `014` service lifecycle, Mock API, CDP capture, PNG/checksum, source
  identity, and fail-closed verifier patterns without reusing old screenshots
  as current evidence.

## Components To Extract

- None initially. If red evidence exposes duplicated state behavior shared by
  both routes, extend an existing shared boundary instead of adding a new
  one-off abstraction.

## API / Data Flow Contracts

- No prototype fixture enters production. All values come from current
  API/store contracts or render an explicit fallback.
- A failed optional administrator or per-repository metric request must not
  erase independently confirmed core repository/feed data.
- Active request failures must be visible and retryable where safe; obsolete
  fulfilled or rejected requests must not overwrite or error the current page.
- Refresh adopts only the newest confirmed result and preserves the last
  confirmed usable state while a recoverable refresh is pending or fails.

## State / Error / Empty / Loading Behavior

- Loading: initial core data shows a truthful loading state instead of
  presenting fake zero health; refresh keeps confirmed content visible.
- Empty: distinguish no repositories/activity from a filter with no matches.
- Error: distinguish core failure from optional partial failure, preserve
  confirmed content, and provide a safe retry.
- Disabled: pending refresh and scope changes disable duplicate actions.
- Permission: normal users do not request or render administrator-only Agent
  and queue data; existing repository route guards remain authoritative for
  manual-run and settings access.

## TDD Requirement

- Add failing page-level tests for every proven current-byte defect before
  production repair.
- Extend metric/store tests for unknown values and overlapping/error behavior
  only when the page regression crosses those shared boundaries.
- Verify the evidence checker rejects missing, mixed-run, stale-source,
  unhealthy-browser, overflow, raw-i18n, wrong-role, wrong-theme, wrong-locale,
  wrong-route, or corrupt-PNG evidence.

## Verification Commands

- `pnpm exec vitest run src/views/Overview.test.ts src/views/Repos.test.ts src/lib/repoMetrics.test.ts src/store/repos.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task production, test, evidence, and governance files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/020-overview-repositories-reverification/evidence/mock_api_smoke.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/020-overview-repositories-reverification/evidence/capture_browser.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/020-overview-repositories-reverification/evidence/verify_evidence.mjs`
- Evidence script syntax, JSON/JSONL parsing, negative verifier mutations,
  source/service identity, bounded cleanup, and `git diff --check`.
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode handoff --json`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- A repair needs a new API, typed field, backend contract, persistence,
  dependency, migration, permission rule, or unsupported prototype capability.
- Equivalent production/prototype states cannot be reproduced from current
  source bytes and deterministic current-contract data.
- Closure would require changing parity rows outside `2-3`, completing task
  `6.2+`, or claiming complete change-level acceptance.

## Unsafe Assumptions

- Task `014` evidence proves neither current Overview bytes nor current
  Repositories bytes.
- A visually populated page does not prove loading, empty, error, partial
  failure, refresh, permission, or stale-response behavior.
- Repository list actions do not authorize bypassing the existing
  repository-wrapper permission gates.
- Pixel identity is not required when equivalent hierarchy, density, status
  vocabulary, controls, responsive containment, and truthful data behavior
  satisfy the approved contract.
