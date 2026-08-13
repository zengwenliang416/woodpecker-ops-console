# Task Brief: 022-deployment-route-reverification

## Goal

Operators can browse deployment history, create and control deployments, review
approvals, applications, environments, releases, and policies with truthful
current API data, explicit boundary states, and prototype-aligned responsive
presentation.

## Vertical Slice

Re-verify parity rows `58-67` from current production and approved prototype
bytes. Add focused regressions for populated, empty, filtered-empty,
initial-failure, refresh-failure, missing-detail, route-switch, overlapping
request, and mutation-pending states. Repair only defects supported by current
API, data, permission, and component contracts.

## In Scope

- Test all ten deployment route views and shared deployment navigation.
- Repair explicit loading, retryable error, empty, filtered-empty, refresh,
  missing-resource, and partial-data behavior.
- Add current-contract deployment, application, and release filters.
- Protect route changes, refreshes, polls, form submission, and deployment
  mutations from obsolete results or duplicate submission.
- Normalize deployment timestamps and durations through valid confirmed epoch
  values or explicit fallbacks.
- Remove hardcoded Chinese visible copy and localize all deployment surfaces.
- Add deterministic current-byte browser evidence for rows `58-67`.
- Close only rows `58-67` and baseline task `6.3` after validation and reviews.

## Out Of Scope

- Infrastructure routes and baseline task `6.2` or `6.4+`.
- New APIs, payload fields, backend behavior, persistence, authorization
  algorithms, dependencies, migrations, or prototype fixtures.
- Invented success rates, average deployment duration, deployment-lock
  confirmation, artifact signatures, policy collections/editors, audit
  history, release sizes, environment membership, or unsupported controls.
- Changing application, environment, or policy backend mutation semantics.

## Files Allowed

- `web/src/views/deployments/*.vue`
- `web/src/views/deployments/*.test.ts`
- `web/src/components/ops/DeploymentNav.vue`
- `web/src/components/ops/DeploymentNav.test.ts`
- `web/src/compositions/useConfirmedRequest.ts`
- `web/src/compositions/useConfirmedRequest.test.ts`
- `web/src/compositions/useDeploymentPresentation.ts`
- `web/src/compositions/useDeploymentPresentation.test.ts`
- `web/src/store/ops.ts`
- `web/src/store/ops.test.ts`
- `web/src/lib/api/index.ts`
- `web/src/lib/api/types/ops.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/022-deployment-route-reverification/**`
- Existing Task 022 task graph, CodeGraph plan, handoff, ledger, validation,
  drift, and acceptance files.

## Interfaces / Components

- Reuse `useApplicationStore()`, `useDeploymentStore()`, `useServerStore()`,
  `useApiClient()`, `Scaffold`, `DeploymentNav`, `FeedbackState`, buttons,
  tables, badges, i18n, router, notifications, and existing date formatting.
- Create no new production component initially. Extract only if focused red
  evidence proves duplicated request-state behavior has identical ownership.
- Keep task-local Mock API, capture, verifier, and red-team scripts outside
  production imports.

## API / Data Flow Contracts

- Production values come only from typed API/store data or explicit fallback.
- Newest active collection and detail requests own state; obsolete success or
  failure is ignored.
- Recoverable refresh failure preserves the last confirmed usable data.
- Existing create, approve, reject, pause, resume, advance, cancel, retry, and
  rollback endpoints are the only deployment mutations.
- The policies endpoint is a current default-policy object, not a policy list;
  production must not fabricate per-environment policy records.

## State / Error / Empty / Loading Behavior

- Loading: initial requests expose stable localized progress.
- Empty: confirmed empty collections and missing detail resources are explicit.
- Error: initial failure is retryable; refresh failure retains confirmed data.
- Disabled: unsupported prototype controls are omitted or explicitly disabled.
- Permission: existing authenticated-route and backend authorization contracts
  remain authoritative; this task adds no permission rule.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/views/deployments/*.test.ts src/components/ops/DeploymentNav.test.ts src/store/ops.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Task-local Mock API smoke, browser capture, strict verifier, persistent
  red-team, syntax, JSON/JSONL, source identity, cleanup, hardcoded-Chinese,
  and `git diff --check`.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- A repair needs files outside scope, a new product/backend contract,
  unsupported prototype data, or a new authorization rule.
- Equivalent states cannot be reproduced from current source and deterministic
  current-contract data.
- Closure would change rows outside `58-67`, complete task `6.4+`, close
  blocked row `4`, or claim complete change-level acceptance.

## Unsafe Assumptions

- Prior screenshots are not current-byte evidence.
- Populated content does not prove loading, error, empty, refresh, mutation, or
  stale-response behavior.
- Prototype metrics, policy records, preflight claims, and controls never
  authorize invented production contracts.
- Pixel identity is not required when hierarchy, density, statuses, controls,
  containment, and truthful data are equivalent.
