# Final Current-Byte Spec Review: 021-infrastructure-route-reverification

## Verdict

approved

## Missing Requirements

- No Task 021 requirement remains missing from the current bytes.
- All twelve infrastructure parity destinations have production and approved
  prototype dark Simplified-Chinese desktop and `390x844` evidence.
- Initial loading, retryable failure, confirmed empty, filtered-empty,
  refresh-failure preservation, role, route-switch, overlap, and
  mutation-pending behavior is covered by focused regression where applicable.
- Lifecycle closure remains intentionally separate from this review. Rows
  `46-57`, baseline task `6.2`, and Task 021 must not be marked complete until
  the signed current-HEAD validation receipt and task acceptance are bound.

## Extra Behavior

- Search and filters use fields already present in current server, group,
  environment, service-summary, and alert contracts.
- Metric-range, metric-export, and service-restart controls are present only as
  disabled explanations of current API boundaries. They do not issue a
  request, introduce a field, or claim a supported capability.
- Task-local Mock API, capture, verifier, red-team, measurements, PNGs, and
  manifest are evidence infrastructure and are not imported by production.

## Misunderstood Requirements

- Prototype visual alignment does not authorize fabricated history, trends,
  service instances, MTTR, success rates, audit exports, alert-rule editors, or
  service restart/log endpoints.
- Infrastructure Overview now renders only API-provided metric samples. Server
  online/activity cards no longer use synthetic trend arrays.
- Services remains a server-level workload summary. Counts and utilization
  aggregate current rows and do not imply per-service-instance telemetry.
- Normal-user server settings intentionally omits administrator deletion while
  retaining supported maintenance and diagnostic behavior.
- Task-scoped acceptance covers only rows `46-57` and baseline task `6.2`. It
  does not complete deployment rows `58-67`, task `6.3+`, blocked row `4`, or
  the complete change.

## Cannot Verify From Diff

- A source diff alone cannot prove the rendered route and tab, theme, locale,
  viewport, role, browser health, containment, raw i18n absence, source/service
  identity, PNG integrity, or exact state inventory.
- The final strict verifier for run
  `84b42687-5a1a-402c-952f-6e5fd1ac338a` accepted exactly `62`
  measurements and `62` screenshots for rows `46-57`, verified checksums, and
  reported zero failed states, page overflow, raw i18n states, or normal-user
  delete controls.
- The persistent red-team proves the verifier rejects all `13` isolated
  wrong-run, wrong-state, unhealthy, overflow, source, and PNG mutations.
- The browser evidence does not exercise live production infrastructure. It
  uses deterministic current-contract data to verify frontend semantics and
  prototype parity; real production deployment behavior remains outside this
  development slice.

## Acceptance Assertions Verified

- `A1` (Task 021 scope only): verified. Rows `46-57` remain present in the
  maintained matrix and have exact current evidence ready for the post-review
  status update.
- `A2` (Task 021 scope only): verified. All twelve rows have equivalent dark
  Simplified-Chinese production/prototype desktop and mobile states, plus
  production light-English and permission/data boundary representatives.
  Current APIs, mutations, permissions, and unsupported-capability boundaries
  remain authoritative.
- `A3` (Task 021 scope only): verified. Focused Vitest `9/39`, full Vitest
  `95/549`, complete task-local Prettier, zero-warning ESLint, Vue TypeScript,
  Vite build, Mock API smoke, strict browser verification `62/62`, persistent
  red-team `13/13`, evidence syntax/data checks, and `git diff --check` pass.
- `A4` (Task 021 scope only): verified. Metrics, server/group/service/alert
  values, counts, relationships, and statuses derive from confirmed API/store
  data or explicit fallbacks; recoverable refreshes retain confirmed content;
  obsolete requests and mutation completions cannot overwrite the current
  owner.

## Required Fixes

No task-local spec fix remains.

Keep the required closure order: bind a signed current-HEAD receipt and Task
021 acceptance, then update only rows `46-57`, baseline task `6.2`, Task 021,
and the incremental handoff. Do not promote parent acceptance or unrelated
route families.

## Validation Performed

- PASS: focused Vitest, `9` files / `39` tests.
- PASS: full frontend Vitest, `95` files / `549` tests.
- PASS: complete ESLint with zero warnings.
- PASS: Vue TypeScript.
- PASS: Vite build with only the two established non-module warnings.
- PASS: task-local Mock API smoke.
- PASS: strict verifier for run
  `84b42687-5a1a-402c-952f-6e5fd1ac338a`, exact `62` measurements and `62`
  screenshots, verified checksums, zero failed states, zero page overflow,
  zero raw i18n states, and zero normal-user delete controls.
- PASS: persistent red-team; positive verifier exit `0` and all `13`
  mutations rejected.
- PASS: task-local Prettier, evidence JavaScript syntax, locale and task
  JSON/JSONL parsing, hardcoded-Chinese scan, and `git diff --check`.
