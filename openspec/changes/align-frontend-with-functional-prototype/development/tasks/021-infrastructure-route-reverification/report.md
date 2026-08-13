# Task Report: 021-infrastructure-route-reverification

## Status

DONE

## Files Changed

- Updated the seven infrastructure route views:
  `InfrastructureOverview.vue`, `InfrastructureServers.vue`,
  `InfrastructureServer.vue`, `InfrastructureGroups.vue`,
  `InfrastructureGroup.vue`, `InfrastructureServices.vue`, and
  `InfrastructureAlerts.vue`.
- Updated `web/src/store/ops.ts` and its focused tests for newest-request
  ownership of server, group, and alert collections.
- Added eight focused view/navigation test files and extended
  `web/src/store/ops.test.ts`.
- Added English and Simplified-Chinese infrastructure state, filter, mutation,
  unsupported-capability, and responsive copy.
- Added task-local deterministic Mock API, smoke runner, browser capture,
  independent strict verifier, persistent red-team, exact `62` measurement
  JSON files, exact `62` PNG screenshots, checksummed manifest, and replay
  summary under `evidence/`.
- Added the Task 021 packet, CodeGraph claim/query plan, final report, reviews,
  and implementation lifecycle records.

## What Changed

- Every infrastructure route now distinguishes initial loading, retryable
  initial failure, confirmed empty data, filtered-empty data, refresh failure
  with retained confirmed content, and successful refresh.
- Infrastructure Overview keeps the current API overview authoritative,
  separates optional deployment/environment failures from core failure, and
  removes fabricated online/activity trend arrays. Trend panels render only
  when the API supplies metric samples.
- Servers supports current-contract search over name, private IP, labels,
  group, environment, region, zone, status, and health. Group, region, health,
  and status filters operate on confirmed store data.
- Server registration prevents duplicate submission, reports a stable
  localized failure, keeps the form available for retry, and publishes only an
  API-confirmed server.
- Server detail owns route changes, refreshes, polling, maintenance, restart,
  and deletion with lifecycle and request generations. Obsolete success or
  failure cannot update a new route, and polling cannot compete with an active
  mutation.
- Server detail renders a terminal missing state rather than an endless
  spinner. Recoverable supplemental or mutation failures retain the confirmed
  server and expose a stable retry path.
- Workload rows no longer present a service restart that calls the node restart
  endpoint. Service restart is explicitly disabled as unsupported by the
  current API. Monitoring range selection and metric export are likewise
  visibly disabled instead of pretending to work.
- Destructive server deletion remains visible only to system administrators
  and still requires confirmation. Normal-user evidence contains zero delete
  controls.
- Groups and group detail use only current group, server, environment, health
  endpoint, strategy, and batch-size fields; both preserve confirmed data
  through refresh failure and handle missing or empty group membership.
- Services retains the server-level workload-summary contract. Aggregate
  counts are derived from current rows, while service instances, instance KPIs,
  logs, and restart controls are not invented.
- Alerts supports status and severity filters, current server/deployment
  relationships, API-confirmed acknowledge/resolve results, per-alert
  duplicate-mutation protection, and confirmed-data preservation after load or
  mutation failure.
- All visible infrastructure copy is owned by the English and
  Simplified-Chinese locale dictionaries. The final production infrastructure
  SFC scan contains no hardcoded Chinese user-facing string.

## TDD Evidence

- Focused regressions cover initial loading, initial failure and retry,
  populated/empty/filtered-empty states, confirmed-data preservation, optional
  failure, route switching, overlapping refreshes, polling suppression,
  mutation duplicate protection, role visibility, filters, unsupported
  controls, and newest store ownership.
- Focused Vitest passes `9` files and `39` tests:
  seven infrastructure views, `InfrastructureNav.test.ts`, and
  `store/ops.test.ts`.
- Full frontend Vitest passes `95` files and `549` tests.
- The strict verifier accepts exactly `62` measurements and `62` PNGs from one
  current-byte run. The persistent red-team rejects all `13` isolated
  mutations.

## Browser Evidence

- Final run: `84b42687-5a1a-402c-952f-6e5fd1ac338a`.
- Rows: `46-57`.
- Exact inventory: `38` production states and `24` approved-prototype states.
- Equivalent comparison: `48` dark Simplified-Chinese production/prototype
  states, covering all `12` rows at `1600x1000` and `390x844`.
- Representative capability: `12` production light-English desktop states.
- Boundary evidence: normal-user server settings and empty services.
- Strict verification reports zero failed states, zero page-level horizontal
  overflow, zero raw i18n states, zero normal-user delete controls, healthy
  browsers, exact routes/tabs, valid PNG signatures, current source/service
  identity, and verified aggregate checksums.
- Representative manual inspection covered Overview desktop, Monitoring
  mobile, English Settings desktop, normal-user Settings, Alerts mobile, and
  empty Services on production plus the corresponding approved-prototype
  surfaces where applicable.

## Persistent Red-Team

The verifier rejects all `13/13` isolated mutations:

- run ID;
- theme;
- locale;
- rendered content;
- role;
- administrator control;
- route/tab;
- browser health;
- raw i18n;
- horizontal overflow;
- unexpected HTTP error;
- source identity;
- PNG signature.

## Verification Commands

- PASS: focused Vitest, `9` files / `39` tests.
- PASS: full Vitest, `95` files / `549` tests.
- PASS: complete task-local Prettier.
- PASS: complete ESLint with zero warnings.
- PASS: Vue TypeScript.
- PASS: Vite build; only the established `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: task-local Mock API smoke.
- PASS: final browser capture, `62/62` states with zero failed states.
- PASS: strict verifier, exact `62` measurements and `62` PNGs for rows
  `46-57`.
- PASS: persistent verifier red-team, positive exit `0` and all `13`
  mutations rejected.
- PASS: evidence JavaScript syntax, JSON/JSONL parsing, locale JSON parsing,
  source/checksum verification, hardcoded-Chinese scan, and
  `git diff --check`.
- PASS: SpecNav development entry contract.

## Concerns

- Server detail currently uses one route-level orchestrator for six tabs.
  Request and mutation ownership is explicit and tested, but any future
  tab-specific API expansion should remain inside the owning tab rather than
  enlarging the shared lifecycle further.
- The approved prototype exposes controls for metric ranges, export, and
  service-level actions that the current API does not support. Production
  communicates those boundaries explicitly instead of copying non-functional
  behavior.
- Services are server-level workload summaries, not service-instance records.
  The UI deliberately avoids instance success rate, MTTR, log, and restart
  claims that cannot be sourced from current contracts.

## Scope Deviations

- No route, backend API, typed payload, persistence, permission algorithm,
  dependency, migration, production fixture, or approved-prototype byte
  changed.
- No task outside baseline `6.2` and no parity row outside `46-57` is included
  in this slice.

## Follow-up Needed

- Bind the approved current bytes to a system-executed validation receipt and
  Task 021 `acceptance.json`.
- Then update only parity rows `46-57`, baseline task `6.2`, Task 021 graph and
  lifecycle status, and the incremental development handoff.
- Keep task `6.3+`, deployment rows `58-67`, blocked repository row `4`, and
  complete change-level acceptance open.

## Adjudication

The implementation and current-byte evidence support task-scoped `A1`, `A2`,
`A3`, and `A4` for infrastructure rows `46-57` only. Parent
`acceptance.json` remains incomplete until the remaining route families and
cross-cutting tasks are finished.
