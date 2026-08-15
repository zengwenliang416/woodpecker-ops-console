# Task Brief: 024-operations-regression-coverage

## Goal

Every behavior repaired by Tasks `020` (Overview/Repositories), `021`
(Infrastructure), `022` (Deployments), and `023` (residual audit) has a direct,
repeatable regression test that fails if the behavior regresses, and the route
parity matrix rows `2-3` and `46-67` carry the updated regression evidence
reference.

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
- Tasks `020-023`, including their signed acceptance, reports, reviews, strict
  verifiers, and persistent red-team results.

## Vertical Slice

Build a behavior-to-test coverage map that enumerates every repaired operations
behavior from Tasks `020-023`, point each behavior at an existing or newly
added Vitest regression that exercises it directly, close every coverage gap
with a focused red-capable test, and update the route parity matrix evidence
for rows `2-3` and `46-67` to reference the Task `024` regression receipt.
Close only baseline task `6.5` after both reviews pass.

## In Scope

- Enumerate the repaired behaviors from the Task `020-023` reports into
  `evidence/behavior-coverage.json`: Overview and Repositories data-state,
  refresh, and ownership behaviors; the shared localized error policy; all
  seven Infrastructure route families; the shared confirmed-request and
  deployment-presentation compositions; all ten Deployment route families; and
  the residual audit contract.
- Verify each behavior maps to at least one direct regression test. Reuse the
  existing focused test files where they already exercise the behavior; add
  new focused tests only for behaviors without direct coverage.
- Add a task-local regression runner that resolves the coverage map, runs the
  complete operations-focused Vitest surface, runs the full frontend Vitest
  suite, and writes a JSON receipt that fails closed when a mapped test file
  is missing, a mapped behavior has no test, or any command fails.
- Update `route-parity.md` rows `2-3` and `46-67` assessment text to cite the
  Task `024` regression evidence without downgrading any `verified` status.
- Run formatting, lint, type checking, build, JSON/JSONL parsing, JavaScript
  syntax checks, and `git diff --check`.
- Close baseline task `6.5` only after implementation evidence and both
  independent reviews pass.

## Out Of Scope

- New browser capture runs, prototype fixture changes, or sensory parity
  re-verification; the existing strict evidence bundles from Tasks `020-022`
  remain the sensory evidence for rows `2-3` and `46-67`.
- Reopening or closing blocked repository-add row `4`.
- New routes, APIs, payload fields, backend behavior, persistence,
  authorization rules, dependencies, or production prototype fixtures.
- Cosmetic production churn: production code changes only when a direct
  regression test reproduces a real defect, and then only within the
  operations surface already owned by Tasks `020-022`.
- Phase `6` completion, parent acceptance, release readiness, or complete-change
  handoff; tasks `7.1-8.4` and the remaining 8 baseline tasks stay open.

## Files Allowed

- `web/src/App.test.ts`
- `web/src/views/Overview.test.ts`
- `web/src/views/Repos.test.ts`
- `web/src/lib/repoMetrics.test.ts`
- `web/src/store/repos.test.ts`
- `web/src/views/infrastructure/*.test.ts`
- `web/src/components/ops/InfrastructureNav.test.ts`
- `web/src/views/deployments/*.test.ts`
- `web/src/components/ops/DeploymentNav.test.ts`
- `web/src/store/ops.test.ts`
- `web/src/compositions/useConfirmedRequest.test.ts`
- `web/src/compositions/useDeploymentPresentation.test.ts`
- `web/src/regression/operations/**` (new consolidated regression suite)
- `web/src/App.vue` (repair only, when a regression test reproduces a defect)
- `web/src/views/Overview.vue`, `web/src/views/Repos.vue` (repair only)
- `web/src/views/infrastructure/*.vue` (repair only)
- `web/src/views/deployments/*.vue` (repair only)
- `web/src/components/ops/InfrastructureNav.vue`, `web/src/components/ops/DeploymentNav.vue` (repair only)
- `web/src/compositions/useConfirmedRequest.ts`, `web/src/compositions/useDeploymentPresentation.ts` (repair only)
- `web/src/store/ops.ts`, `web/src/store/repos.ts` (repair only)
- `web/src/lib/repoMetrics.ts` (repair only)
- `web/src/lib/api/index.ts`, `web/src/lib/api/types/ops.ts` (repair only)
- `web/src/assets/locales/en.json`, `web/src/assets/locales/zh-Hans.json` (repair only)
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/024-operations-regression-coverage/**`
- Existing task graph, CodeGraph plan, handoff, task ledger/context,
  validation, drift, and acceptance files for task `024`.

## Interfaces / Seams

- Component, store, API, router, authentication, i18n, date,
  confirmed-request, and presentation boundaries remain authoritative.
- The signed Task `020-022` acceptances remain the ownership boundary for
  production files; Task `024` only adds tests, coverage tooling, and matrix
  evidence references.
- The existing focused test files and the task `023` audit remain valid
  regression surfaces; the coverage map references them instead of replacing
  them.

## Components To Create

- No production component is planned.
- Create the consolidated regression suite under `web/src/regression/operations/`
  only for repaired behaviors that lack direct coverage in the existing
  focused test files.
- Create task-local coverage and validation tooling under
  `development/tasks/024-operations-regression-coverage/evidence/`.

## Components To Reuse

- Reuse the existing operations focused test files, the Task `023` audit
  tooling, the Task `022` strict evidence verifier, and the Mock API and
  fixture conventions already established by Tasks `020-022`.

## Components To Extract

- None initially. If a repaired behavior is repeated across test files, extend
  the established shared test helper or composition boundary instead of adding
  a parallel abstraction.

## API / Data Flow Contracts

- Regression tests exercise production code through the real stores,
  compositions, router, and typed API client with the established Mock API or
  direct fixture injection; no new production contract is introduced.
- Assertions must not depend on prototype-only values, fabricated metrics, or
  unsupported mutations.

## State / Error / Empty / Loading Behavior

- The regression suite must cover, per repaired behavior: initial loading,
  retryable failure, confirmed empty, filtered empty, refresh failure with
  preserved confirmed content, optional/partial failure, newest-request
  ownership, duplicate-mutation prevention, permission visibility, and
  unsupported-control boundaries where Tasks `020-022` repaired them.
- Localized feedback assertions use the locale dictionaries; raw
  `Error.message` and raw enum leakage remain prohibited.

## TDD Requirement

- Write or update the focused regression tests before or alongside any
  production repair; the coverage runner must fail closed when a mapped
  behavior has no resolvable test.

## Verification Commands

- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/024-operations-regression-coverage/evidence/run_regressions.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/024-operations-regression-coverage/evidence/validate_task.mjs`
- Focused Vitest for the operations test surface plus the new regression
  suite; full frontend Vitest; Prettier; ESLint; Vue TypeScript; Vite build;
  JSON/JSONL parsing; JavaScript syntax checks; `git diff --check`.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- A repaired behavior cannot be mapped to any direct regression test.
- A regression test reproduces a defect that requires a new API, backend
  contract, prototype fixture, new permission rule, or files outside the
  allowed scope.
- A mapped test, focused run, full run, static check, build, or coverage
  receipt fails without a direct fix inside the allowed scope.
- Closure would complete row `4`, phase `6`, parent acceptance, or the
  remaining `7.x`/`8.x` baseline tasks.

## Unsafe Assumptions

- A passing full suite alone does not prove every repaired behavior has a
  direct regression test; only the coverage map plus resolvable test
  references prove completeness.
- Existing focused tests written during Tasks `020-022` remain current only
  when they still run green at the current `HEAD`; the receipt must re-run
  them.
- Updating the matrix assessment text must not be mistaken for new sensory
  evidence; the Task `020-022` strict browser bundles remain the parity proof.
