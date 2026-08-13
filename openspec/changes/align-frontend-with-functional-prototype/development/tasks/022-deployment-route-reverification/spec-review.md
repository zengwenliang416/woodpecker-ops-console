# Superseding Independent Current-Byte Spec Review: 022-deployment-route-reverification

## Verdict

approved

## Missing Requirements

- None found. All ten deployment routes and rows `58-67` have current-byte
  implementation, focused regression, and deterministic browser evidence for
  the required populated, boundary, responsive, locale, request-ownership, and
  mutation states.
- The previously missing deployment vocabulary is now routed through
  `useDeploymentPresentation` across list, detail, wizard, application,
  environment, approval, and release surfaces.
- The current server phase set is covered. `server/ops/engine.go` initializes
  `waiting` at lines `123`, `285`, and `346`, then emits `pulling`,
  `health_check`, `failed`, and `healthy` at lines `465`, `513`, `522`, `528`,
  and `537`. `DeploymentTargetPhase` includes those values plus the existing
  API/presentation value `starting`, and
  `useDeploymentPresentation.ts:58-65` provides a compile-time exhaustive
  localized label map for every member.

## Extra Behavior

- No unsupported production API, payload field, backend mutation, permission
  rule, dependency, persistence behavior, policy collection, or policy editor
  was added.
- The policies route truthfully renders the one typed default-policy object
  returned by `/api/ops/policies`; it does not fabricate prototype-only
  environment policy records or editing behavior.
- Task-local Mock API, capture, verifier, red-team, measurements, and
  screenshots remain evidence-only and are not imported by production.

## Misunderstood Requirements

- None found.
- The generic unknown-phase fallback remains appropriate for genuinely unknown
  future input. It is no longer used for the current server-produced `failed`
  phase, which has explicit English and Simplified-Chinese labels.
- Retaining `starting` in the typed presentation contract is correct even
  though the current engine does not assign it. It is an existing allowed
  API/presentation value, is localized in both dictionaries, and participates
  in the exhaustive phase map.
- Prototype-only success rates, duration aggregates, signatures, locks, audit
  history, release sizes, environment membership, policy collections, and
  editors remain correctly omitted because current APIs do not authorize them.

## Cannot Verify From Diff

- Source inspection alone cannot prove rendered route, theme, locale,
  viewport, browser health, containment, source/service identity, request
  inventory, PNG integrity, or same-state prototype presentation. I verified
  those properties through the executed Task 022 validator and persisted
  current-byte evidence instead.
- The deterministic Mock API proves frontend behavior against current typed
  contracts; it does not claim live production deployment-service execution.
  This limitation is explicit and does not conflict with the task's required
  deterministic browser evidence.

## Acceptance Assertions Verified

- `A1` (Task 022 scope): verified. The maintained parity matrix contains all
  `67` rows exactly once, and deployment rows `58-67` each retain an explicit
  `in-progress` lifecycle status until post-review closure. The evidence matrix
  covers exactly rows `58-67`.
- `A2` (Task 022 scope): verified. Run
  `0051a9bc-3312-4bf4-a850-6e4d4a205920` contains `40` equivalent dark
  Simplified-Chinese production/prototype states at desktop and `390px`, plus
  `10` light-English production states and `4` boundary states. Current APIs
  and the existing mutation endpoints remain authoritative.
- `A3` (Task 022 scope): verified. I executed the single Task 022 validator on
  the final bytes: focused Vitest `9/39`, full frontend Vitest `103/582`,
  Prettier, zero-warning ESLint, Vue TypeScript, Vite build, Mock API smoke,
  strict browser verification `54/54`, persistent red-team `15/15`, evidence
  syntax and JSON checks, hardcoded-Chinese scan, and `git diff --check` all
  passed.
- `A4` (Task 022 scope): verified. Latest-request ownership, route reset,
  unmount invalidation, refresh preservation, timestamp fallbacks, and store
  ownership are covered by focused tests. Deployment mutation ownership now
  remains active through its confirming reload, suppresses polling and second
  mutations, preserves confirmed data on reload failure, and ignores obsolete
  route-lifecycle completions.
- `A4` phase/status presentation is also verified. Focused English and
  Simplified-Chinese tests assert `Deployment failed` and `部署失败`.
  Production dark-Chinese desktop and mobile measurements and light-English
  desktop evidence contain the corresponding label for a
  `status=failed, phase=failed` target, with `rawEnumTokens: []`; the desktop
  screenshots visibly confirm the rendered labels.

## Required Fixes

- No task-local implementation or evidence fix remains. The slice may proceed
  to quality review and the post-review acceptance, ledger, parity-row, and
  baseline-task closure gates.

## Validation Performed

- PASS: `node
openspec/changes/align-frontend-with-functional-prototype/development/tasks/022-deployment-route-reverification/evidence/validate_task.mjs`.
- PASS: focused Vitest, `9` files / `39` tests.
- PASS: full frontend Vitest, `103` files / `582` tests.
- PASS: Task 022 Prettier, zero-warning ESLint, Vue TypeScript, Vite build, and
  `git diff --check`; Vite emitted only the two established non-module script
  warnings.
- PASS: Mock API smoke and strict verifier for current run
  `0051a9bc-3312-4bf4-a850-6e4d4a205920`, exact `54` measurements and `54`
  screenshots, production digest
  `3502e5ded94660203833e96fc2706658c946c8cced63f4a9c6e22cfbb93b4d75`,
  verified checksums, zero failed states, zero browser errors, zero page
  overflow, zero unresolved i18n states, and zero raw enum states.
- PASS: persistent red-team; positive verifier exit `0` and all `15` isolated
  mutations rejected.
- PASS: direct source review of the backend phase assignments, typed phase
  contract, exhaustive bilingual mapping, focused failed-phase assertions,
  mutation ownership, route lifecycle protection, and deployment evidence
  content oracles.
