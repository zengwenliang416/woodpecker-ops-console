# Quality Review: 022-deployment-route-reverification

## Verdict

approved

This supersedes the earlier `needs-fix` quality review. Current source, focused
and full tests, strict current-byte evidence, and persistent red-team results
close the repeated request-lifecycle, raw enum presentation, mutation
confirmation ownership, and incomplete target-phase findings. No task-local
critical, high, or blocking medium-severity quality issue remains.

## Separation Of Concerns

- All ten route views use the typed, headless `useConfirmedRequest`
  composition for initial loading, refresh, error, confirmed-data ownership,
  newest-request completion, route reset, and unmount invalidation.
- Route-specific filtering, partial-data, missing-resource, wizard submission,
  and mutation semantics remain in their owning views rather than being forced
  into a visual or behavioral mega-component.
- `useDeploymentPresentation` is the single visible boundary for deployment
  status, release status, strategy, target status, target phase, and system
  actor vocabulary. Production templates no longer interpolate those API
  enums directly.
- Pinia stores own paginated collections and per-deployment newest-result
  synchronization. Task-local Mock API, capture, verifier, and red-team code
  remain outside production imports.

## Component Cohesion / Coupling

- Collection and simple detail views remain cohesive orchestrators over the
  existing API client, stores, `FeedbackState`, `DeploymentNav`, `useDate`,
  i18n, and router.
- `DeploymentDetail.vue` remains the largest route because polling, controls,
  target retries, logs, approvals, and route reuse belong to one deployment
  control surface. Its concurrency boundaries are now explicit: one
  route-lifecycle generation, the shared request generation, and one active
  mutation owner.
- `pendingMutation` remains active through the post-action confirming reload.
  While active it disables controls and blocks refresh, polling, and every
  second mutation. Route changes and unmount invalidate late action/reload
  completion without clearing state owned by a newer route.
- `DeploymentNew.vue` retains wizard-specific draft reconciliation,
  preflight, query initialization, validation, and submission ownership while
  delegating the repeated request lifecycle to the shared composition.

## Test Quality

- Independent focused execution passes `9/9` files and `39/39` tests.
- Shared request tests prove latest-only completion, refresh failure with
  retained confirmation, route reset/invalidation, and unmount rejection.
- Store tests use deferred requests to prove older application, environment,
  release, deployment collection, and deployment-detail results cannot replace
  newer state.
- Deployment detail tests prove route-switch ownership, duplicate mutation
  rejection, disabled controls and polling suppression through a deferred
  confirming reload, confirmation-failure recovery, and retained confirmed
  data.
- Presentation tests cover English and Simplified Chinese, including the
  server-emitted `failed` target phase. `DeploymentTargetPhase` is a closed
  union and its label map uses
  `satisfies Record<DeploymentTargetPhase, string>`, so an added phase cannot
  silently omit a typed mapping.
- Independent full frontend Vitest passes `103/103` files and `582/582`
  tests. ESLint, Vue TypeScript, and Vite build also pass; the build reports
  only the established non-module script warnings.

## Error Handling

- Initial failures terminate in retryable localized states; confirmed empty
  collections and missing details are distinct from request failure.
- Recoverable refresh failure retains the last confirmed usable content and
  exposes stable feedback instead of replacing it with empty or stale state.
- Mutation rejection retains confirmed deployment data and releases the lock
  for retry. A confirmation reload failure is reported separately while still
  preserving the confirmed deployment.
- Obsolete route, collection, detail, refresh, poll, submission, and mutation
  completions are ignored through request and lifecycle ownership checks.
- Unsupported prototype metrics, policies, controls, and backend contracts are
  omitted rather than fabricated.

## Reuse / Duplication

- The previous repeated loading/refresh/error/latest-request state machine is
  consolidated in `useConfirmedRequest` without moving screen-specific
  semantics out of the route views.
- Typed operational vocabulary is consolidated in
  `useDeploymentPresentation`; list rows, filter options, detail panels,
  releases, application detail, and wizard summaries reuse it.
- Existing typed API/store boundaries, atomic components, navigation, date
  formatting, locale dictionaries, and notifications are reused. No new
  dependency, backend behavior, persistence path, permission algorithm, or
  prototype fixture enters production.

## Complexity Delta

- The route-family diff is substantial, and `DeploymentDetail.vue` and
  `DeploymentNew.vue` remain large. The remaining complexity corresponds to
  explicit route states, a five-step wizard, polling, existing mutations, and
  target-level deployment presentation rather than duplicated infrastructure.
- The two highest-risk cross-route concerns are now compact shared
  compositions with focused tests. Store generation counters and mutation
  lifecycle guards directly address demonstrated stale-result and duplicate
  action hazards.
- Evidence complexity is isolated under Task 022 and fail-closed: the strict
  verifier binds current production/prototype source identity, exact inventory,
  routes, viewport, locale, content, browser health, PNG integrity, writes,
  and raw enum detection.

## Sensory And Responsive Quality

- Final run `0051a9bc-3312-4bf4-a850-6e4d4a205920` strictly verifies exactly
  `54` measurements and `54` PNGs for rows `58-67`, with no failed, browser
  error, raw i18n, raw enum, or page-level overflow states.
- Production deployment-detail evidence explicitly renders the server-emitted
  `phase="failed"` as `部署失败` in dark Simplified-Chinese desktop and
  `390x844` mobile states, and as `Deployment failed` in light English
  desktop. All three measurements record `rawEnumTokens: []`.
- The strict verifier recomputes raw enum tokens from captured localized text,
  verifies current source checksums, and permits only the expected rejected
  pause request. Independent red-team execution rejects all `15/15` mutations.

## Acceptance Assertions Verified

- A1
- A2
- A3
- A4

These ids are verified only for Task 022 and deployment parity rows `58-67`;
they do not assert complete change-level acceptance.

## Required Fixes

No task-local quality fix remains.

Task acceptance generation, signed validation receipt binding, parity/task
status updates, and lifecycle closure remain handoff governance work rather
than implementation quality defects.
