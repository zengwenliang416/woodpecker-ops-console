# Task Report: 022-deployment-route-reverification

## Status

DONE

## Files Changed

- Updated all ten deployment route views:
  `Deployments.vue`, `DeploymentNew.vue`, `DeploymentDetail.vue`,
  `DeploymentApprovals.vue`, `Applications.vue`, `ApplicationDetail.vue`,
  `Environments.vue`, `EnvironmentDetail.vue`, `Releases.vue`, and
  `DeploymentPolicies.vue`.
- Updated `web/src/store/ops.ts`, `web/src/lib/api/index.ts`, and
  `web/src/lib/api/types/ops.ts` for current collection/detail ownership and
  the typed default-policy response.
- Added six focused deployment view/navigation test files, two shared
  composition test files, and extended `web/src/store/ops.test.ts`.
- Added typed `useConfirmedRequest` and `useDeploymentPresentation`
  compositions so request ownership and API-enum presentation are not
  duplicated across deployment routes.
- Added English and Simplified-Chinese deployment state, filter, wizard,
  mutation, timestamp, and API-boundary copy.
- Added Task 022 deterministic Mock API, browser capture, independent strict
  verifier, persistent red-team, exact `54` measurement JSON files, exact `54`
  PNG screenshots, checksummed manifest, and replay summary under `evidence/`.
- Added the Task 022 packet, task graph/context and CodeGraph claim/query-plan
  records.

## What Changed

- Every deployment route distinguishes initial loading, retryable first-load
  failure, confirmed empty or missing data, filtered-empty data, refresh
  failure with retained confirmed content, and successful refresh where
  applicable.
- Deployment, application, and environment detail views own route changes and
  overlapping requests. Obsolete success or failure cannot replace the
  current route's confirmed resource.
- Ten deployment routes share one headless confirmed-request lifecycle for
  initial loading, refresh, error, confirmed data, newest-request ownership,
  route reset, and unmount invalidation while retaining route-specific
  missing, partial, filter, and empty-state semantics.
- Deployment list, approvals, applications, environments, and releases use
  current API/store fields for search and filters. No success-rate, duration,
  release-size, environment-membership, or audit-history value is fabricated.
- Deployment detail owns a mutation through both the action request and its
  confirming detail reload. Refresh, polling, and every second mutation remain
  locked until confirmation succeeds or fails; confirmation failure retains
  the last confirmed deployment, exposes stable refresh feedback, and unlocks
  actions for retry.
- The five-step wizard preserves its confirmed option set and draft through
  refresh or submission failure, prevents duplicate submission, initializes
  from `applicationId`, `releaseId`, `environmentId`, and `serverId` query
  values, and submits only the existing deployment payload.
- Wizard preflight reports only client-confirmable release, target capacity,
  disk, and environment approval inputs. The unsupported deployment-lock
  assertion was removed rather than copied from the prototype.
- Deployment timestamps and durations use `useDate`; absent or invalid values
  render explicit fallbacks.
- The policies page renders the one current default-policy object returned by
  `/api/ops/policies`. It does not invent an environment policy collection,
  editor, activation state, concurrency, approval history, or mutation.
- Typed deployment status, release status, strategy, target status, phase, and
  system actor values pass through one localized presentation boundary. The
  phase contract includes every current server-emitted value, including the
  failed deployment and health-check phase. All visible deployment copy is
  owned by the English and Simplified-Chinese locale dictionaries, and the
  final deployment SFC scan contains no hardcoded Chinese user-facing string.

## TDD Evidence

- Focused regressions cover initial loading, first-load failure and retry,
  populated/empty/filtered-empty states, confirmed-data preservation, missing
  resources, route switching, overlapping requests, query initialization,
  duplicate submission, submission failure, polling/mutation exclusion,
  duplicate mutation protection through a deferred confirming reload,
  confirmation failure recovery, typed bilingual enum presentation, shared
  request lifecycle ownership, timestamp fallbacks, default-policy scope, and
  newest store ownership.
- Focused Vitest passes `9` files and `39` tests.
- Full frontend Vitest passes `103` files and `582` tests.
- The strict verifier accepts exactly `54` measurements and `54` PNGs from
  one current-byte run. The persistent red-team rejects all `15` isolated
  mutations.

## Browser Evidence

- Final run: `0051a9bc-3312-4bf4-a850-6e4d4a205920`.
- Rows: `58-67`.
- Exact inventory: `34` production states and `20` approved-prototype states.
- Equivalent comparison: `40` dark Simplified-Chinese production/prototype
  states, covering all ten routes at `1600x1000` and `390x844`.
- Representative capability: ten production light-English desktop states.
- Boundary evidence: empty deployments, missing application detail,
  application first-load `500`, and a rejected deployment pause mutation.
- Deployment detail evidence includes a current server-contract target with
  `status=failed` and `phase=failed`; production renders `Deployment failed`
  or `部署失败` rather than the raw enum or unknown-phase fallback.
- Strict verification reports zero failed states, zero page-level horizontal
  overflow, zero raw i18n states, zero visible raw deployment enum states,
  healthy browsers, exact routes, valid PNG signatures, current source/service
  identity, verified aggregate checksums, and exactly one write request:
  `POST /api/deployments/142/pause` to the task-owned Mock API.
- The rejected mutation returns `409`, renders localized stable feedback, and
  retains the confirmed DEP-142 content. No capture state issues another
  `POST`, `PATCH`, `PUT`, or `DELETE`.

## Persistent Red-Team

The verifier rejects all `15/15` isolated mutations:

- run ID;
- theme;
- locale;
- rendered content;
- data state;
- unauthorized write request;
- missing expected mutation;
- wrong expected HTTP error;
- route;
- browser health;
- raw i18n;
- raw deployment enum;
- horizontal overflow;
- source identity;
- PNG signature.

## Verification Commands

- PASS: focused Vitest, `9` files / `39` tests.
- PASS: full Vitest, `103` files / `582` tests.
- PASS: complete Task 022 Prettier.
- PASS: complete ESLint with zero warnings.
- PASS: Vue TypeScript.
- PASS: Vite build; only the established `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: task-local Mock API smoke.
- PASS: final browser capture, `54/54` states with zero failed states.
- PASS: strict verifier, exact `54` measurements and `54` PNGs for rows
  `58-67`.
- PASS: persistent verifier red-team, positive exit `0` and all `15`
  mutations rejected.
- PASS: evidence JavaScript syntax, JSON parsing, locale JSON parsing,
  source/checksum verification, hardcoded-Chinese scan, cleanup, and
  `git diff --check`.

## Concerns

- Deployment detail remains the most stateful route because polling, controls,
  target retries, logs, approvals, and route reuse share one view. Shared
  request ownership removes repeated lifecycle state, while its explicit
  active mutation owner corresponds directly to the tested confirmation
  concurrency hazard.
- The approved prototype exposes deployment success-rate, mean-duration,
  signature, lock, approval-history, environment-membership, release-size, and
  policy-editor concepts that the current API does not supply. Production
  deliberately omits those claims.
- The policies endpoint exposes one default object only. Future backend
  support for collections or editing must introduce its own contract rather
  than reinterpret this screen.

## Scope Deviations

- No route, backend API, payload field, persistence, permission algorithm,
  dependency, migration, production fixture, or approved-prototype byte
  changed.
- No task outside baseline `6.3` and no parity row outside `58-67` is included
  in this slice.

## Follow-up Needed

- Bind the approved implementation bytes to a system-executed validation
  receipt and Task 022 `acceptance.json`.
- Then update only parity rows `58-67`, baseline task `6.3`, Task 022 graph and
  lifecycle status, and the incremental development handoff.
- Keep task `6.4+`, blocked repository row `4`, rows outside `58-67`, and
  complete change-level acceptance open.

## Adjudication

The implementation and current-byte evidence support task-scoped `A1`, `A2`,
`A3`, and `A4` for deployment rows `58-67` only. Parent `acceptance.json`
remains incomplete until the remaining route families and cross-cutting tasks
are finished.
