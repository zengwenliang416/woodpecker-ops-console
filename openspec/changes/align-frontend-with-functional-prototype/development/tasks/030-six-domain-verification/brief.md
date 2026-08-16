# Task Brief: 030-six-domain-verification

## Goal

Run the six verification domains — facticity, static, unit, redteam, E2E,
and sensory — against the change requirements and the full 67-row parity
matrix on the current HEAD, with a replayable orchestration script, per-domain
evidence, and a consolidated verification summary that states exactly what is
verified and what remains blocked.

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
- The per-slice evidence of slices `001-029` (strict verifiers, red-team
  suites, browser captures, static gates) which this slice orchestrates.

## Vertical Slice

Close baseline task `8.2`: orchestrate the six verification domains against
the requirements and the parity matrix, add the missing facticity checker and
the E2E journey capture, aggregate the per-domain evidence into
`evidence/six-domain-summary.json`, and keep blocked repository-add row `4`
explicit.

## In Scope

- Facticity: a checker that re-derives the 67-row parity matrix from the
  current source (router routes, prototype artifact route list, i18n keys,
  acceptance statuses) and reports mismatches between the matrix text and the
  executed evidence references.
- Static: re-run the whole-tree static gate (Prettier, ESLint, vue-tsc, Vite
  build, `git diff --check`) via the Task `029` gate script.
- Unit: re-run the full Vitest suite.
- Redteam: re-run the Task `027` responsive red-team (9 mutations) and the
  Task `023` audit red-team (5 mutations); both prove the evidence verifiers
  reject tampering.
- E2E: capture the key user journey with the CDP machinery — guest login page
  (light theme), authenticated overview, repository list, deployment detail
  with the log console (dark theme) — verifying navigation, data rendering,
  and console/log rendering at desktop.
- Sensory: aggregate the Task `020-022` strict browser evidence bundles and
  the Task `027` three-viewport containment audit as the sensory evidence,
  referencing their exact run IDs and state counts.
- Produce `evidence/six-domain-summary.json` and record the orchestrated run
  as `development/evidence/041-030-six-domain-verification.log`.
- Close only baseline task `8.2` after both reviews pass.

## Out Of Scope

- The HTML verification report (task `8.3`) and the final parity declaration
  (task `8.4`).
- Reopening blocked repository-add row `4`.
- New production features, routes, APIs, or prototype fixtures.
- Re-capturing full per-route sensory evidence; the Task `020-022/027`
  bundles are reused as the sensory domain evidence.

## Files Allowed

- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/030-six-domain-verification/**`
- Existing task graph, CodeGraph plan, handoff, ledger, context, validation,
  drift, and acceptance files for task `030`.
- Read-only reuse of all sibling task evidence and the Task `029` gate script.

## Interfaces / Seams

- The orchestration invokes the sibling gate/verifier scripts exactly as the
  sibling slices did; no production code is touched.
- The E2E capture reuses the Task `027` consolidated Mock API and the CDP
  machinery conventions.

## Components To Create

- No production component is planned; create the facticity checker, the E2E
  journey capture, and the orchestration script under the task's `evidence/`.

## Components To Reuse

- The Task `029` static gate script, the Task `027` responsive verifier and
  red-team, the Task `023` audit red-team, the full Vitest suite, and the
  Task `020-022/027` sensory bundles.

## Components To Extract

- No extraction is needed; the orchestration is a thin script over existing
  tooling.

## API / Data Flow Contracts

- Verification only; no production code, API, or data-flow change.

## State / Error / Empty / Loading Behavior

- The E2E journey covers the login (guest), overview, repository, and
  deployment-detail-with-log states; each state must reach its readiness
  pattern with zero browser health failures.

## TDD Requirement

- The facticity checker must fail when the matrix row count, route names, or
  status vocabulary drift from the source of truth; the red-team suites are
  the tamper-detection regressions.

## Verification Commands

- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/030-six-domain-verification/evidence/run_six_domains.mjs`
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- A domain command fails without a direct in-scope fix.
- The facticity checker finds a matrix/source mismatch that cannot be
  explained or repaired inside the allowed scope.
- Closure would complete tasks `8.3-8.4`, row `4`, or parent acceptance.

## Unsafe Assumptions

- Reusing the sibling sensory bundles is valid only because their manifests
  and run IDs are re-verified in this slice; the orchestration must fail if a
  referenced bundle is missing or its summary says not-ok.
- The E2E journey is a representative sampling, not a claim that every
  interactive flow was re-driven in this slice.
