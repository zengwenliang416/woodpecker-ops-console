# Task Brief: 019-route-family-parity-closure

## Goal

Organization, administration, user, authentication, and not-found route
families have one concentrated regression contract and one current-byte
production-versus-approved-prototype evidence run that can close parity rows
`1` and `24` through `45` without changing supported product behavior.

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
- `openspec/specs/ui-design/design.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Resolve every production destination represented by parity rows `1` and `24`
through `45`, verify its named route, parameters, authentication and
system-administrator metadata, and prove that the focused component suites for
each route family remain present. Then replay all 23 destinations from the
current production and approved prototype bytes in dark Simplified Chinese at
`1600x1000` and `390x844`. The 92 measurements share one run identity and fail
closed on route, path, viewport, content, overflow, raw localization keys,
browser health, screenshot integrity, service identity, or source-byte drift.

## In Scope

- Add one concentrated route-family parity test for route rows `1` and `24-45`.
- Verify named and inbound route resolution, dynamic parameters, login
  guest-only behavior, authenticated organization/user/CLI settings, inherited
  system-administrator metadata, and catch-all not-found ordering.
- Verify the focused organization, administration, user, login, CLI auth, and
  not-found component-test inventory used by baseline task `5.5`.
- Add a task-local deterministic Mock API and browser capture/verifier for
  exactly 92 production/prototype desktop/mobile states.
- Require one run ID, exact row/state inventory, exact terminal production
  paths and route names, exact viewport and PNG dimensions, current production
  and prototype source hashes, service identity, zero page-level horizontal
  overflow, zero raw localization keys, and zero unexpected browser failures.
- Mark only parity rows `1` and `24-45`, baseline task `5.5`, and phase 5
  complete after current-byte tests, evidence, static checks, and independent
  reviews pass.

## Out Of Scope

- Production route, component, API, store, backend, localization, persistence,
  dependency, migration, or feature changes unless current-byte red evidence
  first proves a task-scoped defect.
- Repeating component behavior already covered by tasks `015`, `016`, `017`,
  and `018`.
- Verifying parity rows `2-23` or `46+`, claiming 67-route global parity,
  closing phases 6-8, or marking complete change-level `A2` without its full
  contract.
- Replacing current server-backed data with prototype fixtures or inventing
  unsupported fields, states, or actions.

## Files Allowed

- `web/src/route-family-parity.test.ts`
- Existing focused test files under `web/src/views/org/**`,
  `web/src/components/org/settings/**`, `web/src/views/admin/**`,
  `web/src/components/admin/settings/**`, `web/src/views/user/**`,
  `web/src/components/user/settings/**`, `web/src/views/Login.test.ts`,
  `web/src/views/cli/Auth.test.ts`, and `web/src/views/NotFound.test.ts` if red
  evidence requires a test-only correction.
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/019-route-family-parity-closure/**`
- Existing SpecNav task graph, ledger/context/validation/drift, handoff,
  `tasks.md`, route parity, and generated CodeGraph/status files for task `019`.

## Interfaces / Seams

- Vue Router remains authoritative for route names, paths, parameters, nested
  metadata, login behavior, CLI authorization, and catch-all ordering.
- Existing component suites remain authoritative for request, empty, error,
  retry, mutation, lifecycle, feature-gate, and responsive behavior.
- The task-local Mock API provides deterministic current-contract data only; it
  does not become production code or redefine API behavior.
- The approved prototype artifact is served byte-for-byte from its existing
  directory and compared with the production source identity captured before
  replay.

## Components To Create

- None. This slice creates only a concentrated test contract and evidence
  tooling.

## Components To Reuse

- Existing router, organization, administration, user, login, CLI auth,
  not-found, settings, and Agent test suites.
- Existing task `015`, `016`, and `017` evidence destination assertions as
  reference inputs without overwriting their artifacts.

## Components To Extract

- No UI or production extraction is required. The repeated evidence mechanics
  are consolidated in one task-local runner and verifier rather than copied
  into product components.

## State / Error / Empty / Loading Behavior

- Existing focused component tests remain the source of truth for loading,
  empty, error, retry, confirmed-data, mutation-failure, feature-disabled, and
  obsolete-completion states.
- Browser replay captures one stable representative state for every parity row
  on both surfaces and viewports; it does not replace focused state tests.
- Any unexpected console error, runtime exception, network failure, HTTP error,
  missing assertion, route mismatch, overflow, raw key, or byte drift fails the
  evidence run.

## TDD Requirement

- Add and run the concentrated route-family contract before changing parity
  status.
- Run all existing focused component suites for the five route families.
- Validate the evidence verifier against missing or mutated evidence before
  accepting the 92-state replay.

## Verification Commands

- `pnpm exec vitest run src/route-family-parity.test.ts <organization administration user authentication error focused tests>`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task test/evidence/governance files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/019-route-family-parity-closure/evidence/capture_browser.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/019-route-family-parity-closure/evidence/verify_evidence.mjs`
- Evidence JavaScript/Python syntax, JSON/JSONL parsing, negative verifier
  mutation, source identity, bounded cleanup, and `git diff --check`.
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode handoff --json`

## Stop Conditions

- A red result requires a new route, API, type, store, backend contract,
  persistence, dependency, migration, authentication mechanism, or unsupported
  prototype capability.
- Any of the exact 92 current-byte states cannot be reproduced from the
  approved prototype and deterministic current API contracts.
- Route or component behavior needs production changes outside the locked
  scope before evidence is recorded and the task packet is explicitly
  repaired.
- A parity status would need to claim rows outside `1` and `24-45`, global
  route parity, later phases, or complete change-level `A2`.

## Unsafe Assumptions

- Prior task screenshots do not prove the current production or prototype
  bytes.
- A route resolving does not prove its component states, and a component test
  does not prove browser routing or responsive containment.
- Representative browser content does not authorize unsupported prototype
  data or actions.
- Phase 5 closure does not close operations routes, cross-cutting validation,
  release readiness, or the full change.
