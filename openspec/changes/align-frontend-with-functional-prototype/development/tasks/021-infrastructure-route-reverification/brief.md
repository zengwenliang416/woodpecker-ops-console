# Task Brief: 021-infrastructure-route-reverification

## Goal

Operators can use infrastructure overview, servers and all server tabs,
groups, services, and alerts with truthful current API data, explicit
operational states, safe mutations, and prototype-aligned responsive UI.

## Vertical Slice

Re-verify parity rows `46-57` from current production and approved prototype
bytes. Add focused regressions for populated, empty, filtered-empty,
initial-failure, refresh-failure, route-switch, overlapping request, and
mutation-pending states. Repair only defects proven within current API and
permission contracts.

## In Scope

- Test all seven infrastructure views and shared infrastructure navigation.
- Repair explicit loading/error/empty/filtered-empty/refresh behavior.
- Add supported server, group, region, service, and alert filters.
- Protect route changes, refreshes, polls, and mutations from obsolete results
  or duplicate submission.
- Remove fabricated trends and misleading service-level actions.
- Add bilingual visible copy and current-byte browser evidence.
- Close only rows `46-57` and baseline task `6.2` after validation and reviews.

## Out Of Scope

- Deployment control-plane routes and baseline tasks `6.3+`.
- New APIs, payload fields, backend behavior, persistence, authorization
  algorithms, dependencies, migrations, or prototype fixtures.
- Alert-rule editors, node auto-upgrade, metric sampling, certificate
  revocation, service restart/log APIs, audit export, or invented historical
  success-rate and MTTR values.

## Files Allowed

- `web/src/views/infrastructure/*.vue`
- `web/src/views/infrastructure/*.test.ts`
- `web/src/components/ops/InfrastructureNav.vue`
- `web/src/components/ops/InfrastructureNav.test.ts`
- `web/src/store/ops.ts`
- `web/src/store/ops.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/021-infrastructure-route-reverification/**`
- Existing task graph, CodeGraph plan, handoff, ledger, validation, and drift
  files for task `021`.

## Interfaces / Components

- Reuse `useServerStore()`, `useApiClient()`, production route query state,
  `Scaffold`, `InfrastructureNav`, `OpsMetricCard`, `FeedbackState`, buttons,
  tables, badges, i18n, authentication, and date formatting.
- Create no new production component initially. Extend the store or an existing
  primitive if red evidence exposes genuinely shared behavior.
- Existing server/group delete authorization remains server-authoritative;
  admin-only dangerous UI must not be offered to normal users.

## Data And State Contracts

- Production values come only from typed API/store data or explicit fallback.
- Optional failures cannot erase independently confirmed content.
- Newest active requests own state; obsolete success or failure is ignored.
- Refresh preserves last confirmed usable data on recoverable failure.
- Existing acknowledge, resolve, maintenance, restart, register, and delete
  endpoints are the only supported mutations.

## Verification Commands

- `pnpm exec vitest run src/views/infrastructure/*.test.ts src/components/ops/InfrastructureNav.test.ts src/store/ops.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Task-local Mock API smoke, browser capture, strict verifier, red-team,
  syntax, JSON/JSONL, source identity, cleanup, and `git diff --check`.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- A repair needs files outside scope, a new product/backend contract,
  unsupported prototype data, or a new authorization rule.
- Equivalent states cannot be reproduced from current source and deterministic
  current-contract data.
- Closure would change rows outside `46-57`, complete task `6.3+`, or claim
  complete change-level acceptance.

## Unsafe Assumptions

- Prior screenshots are not current-byte evidence.
- Populated content does not prove loading, error, empty, refresh, mutation, or
  stale-response behavior.
- Prototype controls never authorize invented production contracts.
- Pixel identity is not required when hierarchy, density, statuses, controls,
  containment, and truthful data are equivalent.
