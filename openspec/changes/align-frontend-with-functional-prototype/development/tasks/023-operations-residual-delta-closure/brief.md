# Task Brief: 023-operations-residual-delta-closure

## Goal

Operators can use Overview, Repositories, Infrastructure, and Deployments
without any remaining reproducible structural, content, status, action,
data-integrity, or 390px responsive delta from the approved prototype and
current production contracts.

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
- Tasks `020`, `021`, and `022`, including their signed acceptance, reports,
  reviews, browser manifests, strict verifiers, and persistent red-team results.

## Vertical Slice

Audit the current production bytes across parity rows `2-3` and `46-67`
against the approved prototype and the signed Task `020-022` closures. Prove
that task-owned production files have not drifted, that later changes to shared
files are covered by the newest owning acceptance, and that the combined
operations regression surface still passes. Repair production code only when
the audit produces a reproducible current-byte failure, beginning with a
focused red test.

## In Scope

- Verify Task `020` ownership for Overview and Repositories, Task `021`
  ownership for Infrastructure, and Task `022` ownership for Deployments.
- Verify current route-parity rows `2-3` and `46-67` remain `verified`, while
  blocked row `4` remains excluded.
- Verify each signed acceptance is approved and each task report, spec review,
  quality review, manifest, strict verifier, and red-team summary remains
  present and internally consistent.
- Compare current Git objects with the accepted task-owned objects. Files later
  shared with Task `022` use Task `022` as the newest ownership boundary.
- Run the combined focused operations suite, full frontend suite, formatting,
  lint, type checking, build, strict evidence verification, and whitespace
  checks.
- Add task-local, repeatable audit tooling and evidence that fails closed on
  missing artifacts, unapproved acceptance, route-status drift, source drift,
  malformed evidence, or a failed command.
- If direct evidence finds a real current defect, add a focused red regression
  and make the smallest contract-supported production repair.
- Close only baseline task `6.4` after implementation evidence and both reviews
  pass.

## Out Of Scope

- Adding the cross-route regression matrix required by task `6.5`.
- Reopening or closing blocked repository-add row `4`.
- Reworking route families outside Overview, Repositories, Infrastructure, and
  Deployments.
- New routes, APIs, payload fields, backend behavior, persistence,
  authorization rules, dependencies, or prototype fixtures in production.
- Cosmetic churn where current structure, hierarchy, density, statuses,
  actions, responsive containment, and truthful data behavior already satisfy
  the approved contract.
- Phase `6` completion, parent acceptance, release readiness, or complete-change
  handoff.

## Files Allowed

- `web/src/App.vue`
- `web/src/App.test.ts`
- `web/src/views/Overview.vue`
- `web/src/views/Overview.test.ts`
- `web/src/views/Repos.vue`
- `web/src/views/Repos.test.ts`
- `web/src/lib/repoMetrics.ts`
- `web/src/lib/repoMetrics.test.ts`
- `web/src/store/repos.ts`
- `web/src/store/repos.test.ts`
- `web/src/views/infrastructure/*.vue`
- `web/src/views/infrastructure/*.test.ts`
- `web/src/components/ops/InfrastructureNav.vue`
- `web/src/components/ops/InfrastructureNav.test.ts`
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
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/023-operations-residual-delta-closure/**`
- Existing task graph, CodeGraph plan, handoff, task ledger/context,
  validation, drift, and acceptance files for task `023`.

## Interfaces / Seams

- Existing component, store, API, router, authentication, i18n, date,
  confirmed-request, and presentation boundaries remain authoritative.
- Signed Task `020-022` acceptances provide exact Git object identities for
  task-owned production files; the newest task that legitimately edits a
  shared file owns its current comparison boundary.
- Existing task-local strict verifiers remain authoritative for their captured
  browser artifacts. Task `023` adds a cross-slice source and lifecycle audit,
  not replacement screenshots or invented evidence.

## Components To Create

- No production component is planned.
- Create only task-local audit and validation tooling.

## Components To Reuse

- Reuse all production components and compositions already approved by Tasks
  `020-022`.
- Reuse the signed acceptance object lists, route-parity matrix, strict
  verifier outputs, and persistent red-team summaries as direct inputs.

## Components To Extract

- None initially. If a proven repair repeats existing behavior, extend the
  established shared boundary instead of adding a parallel abstraction.

## API / Data Flow Contracts

- Production values continue to come only from typed APIs/stores or explicit
  fallbacks.
- Later shared-file additions must not invalidate the earlier route families
  that consume those files.
- Newest active requests remain authoritative; obsolete results and failures
  must not overwrite current confirmed state.
- Prototype-only values or controls never authorize production fixtures,
  fabricated metrics, or unsupported mutations.

## State / Error / Empty / Loading Behavior

- Loading: previously approved initial and refresh behavior must remain
  unchanged across all audited routes.
- Empty: confirmed empty and filtered-empty states must remain distinguishable.
- Error: initial, partial, refresh, missing-resource, and mutation failures must
  remain explicit and localized while preserving confirmed data when safe.
- Disabled: duplicate refreshes, submissions, and mutations remain prevented;
  unsupported prototype controls remain absent or explicitly unavailable.
- Permission: administrator-only data and dangerous controls remain hidden from
  normal users without changing backend-authoritative authorization.

## TDD Requirement

- The audit validator must fail before closure when any accepted file, route
  status, review, evidence artifact, or verification command drifts.
- If the audit finds a production defect, add a focused failing behavior test
  before changing production code.

## Verification Commands

- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/023-operations-residual-delta-closure/evidence/audit_residuals.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/023-operations-residual-delta-closure/evidence/validate_task.mjs`
- Combined focused Vitest for Task `020-022` route, component, composition, and
  store tests.
- Full frontend Vitest, Prettier, ESLint, Vue TypeScript, and Vite build.
- Task `020-022` strict evidence verifiers and persistent red-team summaries.
- Task-local JavaScript syntax, JSON parsing, audit negative mutations, and
  `git diff --check` excluding signed evidence logs.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- An accepted production object has drifted without a later signed owner.
- A real defect requires a new API, backend contract, unsupported prototype
  data, new permission rule, or files outside the allowed scope.
- A strict verifier, review, acceptance, focused regression, full regression,
  static check, build, or audit mutation fails.
- Closure would complete task `6.5`, row `4`, phase `6`, or parent acceptance.

## Unsafe Assumptions

- Previous task completion alone does not prove the current combined surface.
- A whole-tree source digest mismatch in an older slice is not automatically a
  regression when later signed slices added unrelated files or shared keys;
  exact task-owned Git objects and newest shared ownership must be checked.
- Passing tests alone does not prove accepted browser artifacts, reviews, and
  route statuses remain intact.
- The absence of a production diff is acceptable only when repeatable direct
  evidence proves zero remaining task-scoped delta.
