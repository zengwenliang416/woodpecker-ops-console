# Superseding Spec Review: 016-administration-routes

## Verdict

approved

## Missing Requirements

- None found for task `016` / baseline task `5.2` in the current allowed-file
  implementation.
- The existing administration route names, paths, Forge nesting, parameters,
  and inherited authentication metadata remain intact. Focused router coverage
  resolves all eleven destinations from both names and inbound paths.
- The legacy tab wrapper is replaced by a responsive nine-destination
  administration hierarchy with administrator denial/redirect behavior,
  active Forge-child grouping, `minmax(0, 1fr)` content ownership, and local
  scrolling for dense mobile surfaces.
- Overview, global Secrets and Registries, repositories, users, organizations,
  shared global Agents, Queue, and Forge list/detail/create use only current
  typed fields and APIs. Their loading, empty, error, retry, confirmed-state,
  mutation rejection, duplicate-action, pagination, and unmount/obsolete
  completion behavior is covered by current focused tests.
- The prior Forge detail blocker is repaired. Route identity changes clear the
  previous Forge before loading the new one, while same-route retry and
  post-save reload retain the confirmed editor. The new regression proves a
  successful update followed by a rejected reload keeps the edited Forge
  visible together with retryable error feedback.
- Queue polling and mutations use current `QueueInfo`, task labels, pipeline
  navigation, pause/resume APIs, latest-request ownership, mutation locking,
  confirmed-state preservation, and post-unmount suppression. Agent mutations
  use the stable `admin` owner plus unmount invalidation.

## Extra Behavior

- None found. No new administrator route, endpoint, payload field, store,
  backend behavior, persistence, authentication rule, dependency, or migration
  was introduced.
- No unsupported prototype health/capacity/activity metrics, Secret plaintext
  reveal/usage/audit data, Registry connection verification, repository
  activity/storage/export metrics, user invitations/activity, organization
  creation/quotas, Agent telemetry, Queue priority/promote/cancel/throughput, or
  Forge connection tests/status/counts were copied into production.
- The task-local capture and verification files remain evidence infrastructure
  and are not imported into the production frontend.

## Misunderstood Requirements

- None remain in the current bytes.
- Recoverable same-route Forge refresh is now correctly distinguished from a
  route-identity change: the former preserves confirmed data; the latter clears
  the old Forge so stale detail is not shown for the new route.
- The strengthened evidence verifier now treats exact artifact identity as a
  contract. It requires all 44 expected state IDs; binds filename, measurement
  state ID, surface, row, viewport, and production route; validates content,
  health, overflow, and raw-key results; and checks PNG signature and IHDR
  dimensions.
- Task-local representative dark Simplified-Chinese evidence is not treated as
  complete family-wide sensory parity. Rows `28-38` remain `in-progress`, and
  baseline task `5.5` still owns complete `A2`.

## Cannot Verify From Diff

- Final bytes cannot establish whether every test was written before or
  alongside implementation.
- This reviewer independently ran the final focused command: `17` files and
  `84` tests passed. The complete frontend suite passed `74` files and `422`
  tests.
- An initial highly parallel review run caused fixed five-second timeouts in
  `AdminForges`, `RepoPipelines`, and `Crons`, without assertion failures.
  After competing lint/typecheck/build processes ended, isolated reruns passed
  `AdminForges` at `1` file / `4` tests and the two prior-failure files at `2`
  files / `23` tests. Sequential focused and full commands then passed at the
  final counts above, so those timeouts are superseded as resource contention.
- The reviewer independently passed task-scoped Prettier, complete ESLint,
  TypeScript, Vite build, evidence JavaScript/Python syntax, task evidence and
  locale JSON parsing, and `git diff --check`. The build emitted only the two
  existing non-module script warnings for `/web-config.js` and
  `/assets/custom.js`.
- The strict evidence verifier independently passed run
  `09279f46-4db9-4a6a-b00f-8340ef3c1fc0`: exactly `44` paired measurements and
  screenshots for rows `28-38`, with the expected state/file/row/surface/
  viewport/route bindings, passing content assertions, zero page-level
  overflow, zero raw visible locale keys, zero browser-health failures, and
  exact `1600x1000` or `390x844` PNG dimensions.
- The installed SpecNav `0.3.0` entry/handoff contract still rejects the
  repository's established task graph/context model and missing verification
  runtime. The current system-executed record classifies this as global
  lifecycle/tooling drift rather than a task-local production, test, evidence,
  review-format, `A3`, or `A4` failure. This review did not modify those shared
  generated artifacts.

## Acceptance Assertions Verified

- `A3`: verified for task `016` only. Current bytes pass task-scoped
  formatting, complete ESLint, TypeScript, focused/full Vitest, Vite build,
  strict desktop/`390x844` browser evidence verification, syntax, JSON, and
  diff checks. This reviewer independently reproduced the focused/full counts
  and the strict final-run verifier.
- `A4`: verified for task `016` only. The implementation and focused
  regressions establish confirmed-value presentation, explicit fallbacks and
  request states, latest-request-wins loads, active lifecycle-owned mutations,
  inert obsolete/post-unmount completions, and confirmed-row/editor
  preservation after active failures, including the repaired Forge
  post-save-refresh path.
- Full theme, locale, permission, and data-state equivalence remains assigned
  to baseline task `5.5`; parity rows `28-38` remain `in-progress`.

## Required Fixes

- None for task `016-administration-routes`.
- Continue baseline tasks `5.3-5.5`; do not promote rows `28-38` to `verified`
  or close complete `A2` from this task-scoped approval.
