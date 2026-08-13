# Quality Review: 021-infrastructure-route-reverification

## Verdict

approved

No task-local quality blocker remains. The inconsistent page states,
fabricated Overview trends, node-restart-as-service-action defect, obsolete
route/request completion risks, duplicate mutations, normal-user dangerous
control exposure, and untranslated visible infrastructure copy are closed by
the implementation, focused regressions, final browser run, strict verifier,
and persistent red-team.

## Separation Of Concerns

- The seven route views remain orchestrators over the existing typed API
  client, Pinia stores, authentication, i18n, notifications, date formatting,
  router, and shared presentation primitives.
- `useServerStore()` owns paginated server, group, and alert collections.
  Latest-request-wins synchronization is implemented once at that shared
  boundary instead of being duplicated by every consumer.
- Route views own screen-specific confirmation, filter, refresh, and mutation
  state. Task-local evidence tooling remains outside production imports.
- No prototype fixture, backend contract, permission algorithm, persistence
  path, migration, or new dependency enters production.

## Component Cohesion And Coupling

- Overview separates the core overview request from optional deployment and
  environment hydration. A core failure controls page availability; optional
  failure produces scoped partial feedback without erasing confirmed overview
  data.
- Servers owns list filters and registration because both are specific to that
  screen. The underlying collection remains store-owned and paginated.
- Server detail uses one lifecycle generation for route ownership, one load
  generation for overlapping refresh ownership, and one active mutation owner.
  Polling observes that owner and cannot race a maintenance, restart, or delete
  operation.
- Group list/detail, Services, and Alerts use compact route-local confirmation
  state rather than adding a generic global state machine whose semantics would
  differ by screen.
- `InfrastructureNav` remains the shared five-destination navigation boundary
  and receives only current server/alert counts.

## Test Quality

- Focused execution passes `9/9` files and `39/39` tests.
- Overview tests cover first load, retry, optional failure, refresh
  preservation, and absence of fabricated metric panels.
- Servers tests cover supported search/filter fields, loading/error/empty and
  filtered-empty distinctions, confirmed-row preservation, and registration
  duplicate/error handling.
- Server detail tests cover missing data, `A -> B` route ownership, overlapping
  refresh, maintenance/restart ownership, polling suppression, rejected
  mutations, unsupported workload/monitor controls, and normal-user deletion
  visibility.
- Group, Services, and Alerts tests cover missing/empty/filter states, current
  field derivation, refresh preservation, route changes, current relationships,
  per-record mutations, and error recovery.
- Store tests use deferred promises to prove older server, group, and alert
  requests cannot replace newer results and that `loaded=true` belongs only to
  the newest successful server request.
- Full frontend Vitest independently passes `95/95` files and `549/549` tests.

## Error Handling

- First-load failure never presents unconfirmed data as current. It renders a
  stable localized error and safe retry.
- Recoverable refresh or optional failure retains previously confirmed content
  and renders compact scoped feedback.
- Missing server/group responses terminate in explicit empty/not-found states
  instead of indefinite loading.
- Mutation failures keep confirmed content, release the pending lock for retry,
  and do not adopt an unconfirmed optimistic result.
- Obsolete route, refresh, poll, and mutation completions are ignored after
  lifecycle ownership changes.
- Unsupported controls are disabled with explanations and produce no request.

## Reuse And Duplication

- Existing `Scaffold`, `FeedbackState`, `InfrastructureNav`, `OpsMetricCard`,
  `OpsMetricPanel`, `Button`, `IconButton`, table containment, i18n,
  authentication, notifications, API client, and stores are reused.
- Shared paginated synchronization and newest-request collection ownership stay
  in `ops.ts`; route views do not reimplement pagination.
- Page-specific filters and confirmation state are intentionally not extracted.
  Their fields, partial-failure contracts, and empty semantics differ enough
  that a generic loader would increase coupling and obscure ownership.

## Complexity Delta

- Production complexity increased primarily in server detail because six tabs,
  polling, three mutations, and route reuse share one view. The generations and
  active-mutation guard directly correspond to proven concurrency hazards and
  are covered by focused tests.
- The remaining routes add small explicit state machines for initial load,
  refresh, confirmed data, and filtering. These replace implicit spinner or
  stale-store behavior and are proportional to the user-visible contracts.
- Evidence complexity is isolated under Task 021 and is justified by twelve
  parity rows, desktop/mobile production/prototype comparison, role/data
  boundaries, exact source identity, and a fail-closed verifier.

## Sensory And Responsive Quality

- Final evidence contains production and approved-prototype dark
  Simplified-Chinese desktop and `390x844` states for all twelve rows.
- Production light-English desktop evidence validates locale capability
  without fabricating prototype-English support.
- Dense tables remain inside local scrolling containers and the strict
  verifier reports no page-level horizontal overflow.
- Manual representative inspection confirms hierarchy, density, status
  vocabulary, disabled unsupported controls, tab behavior, and mobile
  containment are equivalent without copying unsupported prototype behavior.

## Required Fixes

No task-local quality fix remains.

The signed current-HEAD validation receipt and scoped lifecycle closure are
governance steps, not implementation quality defects. Keep task `6.3+`,
deployment rows `58-67`, blocked row `4`, and parent acceptance open.
