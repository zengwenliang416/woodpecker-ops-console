# Task Brief: 032-final-parity-declaration

## Goal

Declare the final verification state of the change: every completed
acceptance assertion (A1-A4) is approved on the final HEAD with per-slice
evidence bindings, the parity matrix keeps blocked repository row `4` explicit
and no unverified row is claimed verified, the HTML report (Task `031`)
covers every completed assertion and route row, and the change-level
acceptance is signed, completing baseline task `8.4` and the phase `7-8`
closure records.

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
- `openspec/changes/align-frontend-with-functional-prototype/handoff-to-verify.md`
- The slice packets and acceptances of slices `001-031`.

## Vertical Slice

Close baseline task `8.4` and the change: approve the change-level
acceptance (A1-A4) on the final HEAD, write the final parity declaration that
states exactly what is verified and what remains blocked (repository-add row
`4`), extend the handoff-to-verify record with the implemented-slice entry,
and close the phase `7-8` records.

## In Scope

- Update `acceptance.json`: A1-A4 status `approved` with `evidence_ref`
  bindings to the executed per-slice evidence (Task `030` six-domain summary,
  Task `031` report model/manifest, per-slice acceptances).
- Write `development/tasks/032-final-parity-declaration/parity-declaration.md`:
  the final declaration — 67-row matrix with 66 verified + row 4 explicitly
  blocked; what is verified (every completed assertion, every verified route
  row, the six verification domains) and what is not (global parity for row
  4; the prototype's four-step repository add wizard versus the measured
  production activation list).
- Extend `handoff-to-verify.md` with the implemented-slice entry for tasks
  `7.1-8.4` (slices `025-032`) and the final state summary.
- Check the `8.4` baseline checkbox in `tasks.md`; mark the task graph,
  ledgers, and validation log.
- Verify the closure state: all eight phase `7-8` checkboxes checked, every
  slice has signed acceptance, the HTML report covers every completed
  assertion and route row with blocked row `4` explicit.
- Close only baseline task `8.4` after both reviews pass; this slice also
  signs the parent acceptance.

## Out Of Scope

- Reopening blocked repository-add row `4` or claiming its parity.
- New production behavior, routes, APIs, or fixtures.
- Re-running the six domains (Task `030` evidence is reused and bound).

## Files Allowed

- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/handoff-to-verify.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/032-final-parity-declaration/**`
- Existing task graph, CodeGraph plan, handoff, ledger, context, validation,
  drift, and acceptance files for task `032`.

## Interfaces / Seams

- The parent acceptance approval binds the final HEAD; the per-slice
  acceptances (which bind their own closure HEADs) remain the row-level
  evidence.

## Components To Create

- No production component is planned; create the parity declaration document
  and the closure-state verification script under the task's `evidence/`.

## Components To Reuse

- The slice acceptances `001-031`, the six-domain summary (Task `030`), and
  the HTML report model/manifest (Task `031`).

## Components To Extract

- No extraction is needed; the slice is declarative.

## API / Data Flow Contracts

- No production change.

## State / Error / Empty / Loading Behavior

- The closure-state script fails closed if any phase `7-8` checkbox is
  unchecked, any slice acceptance is missing or not approved, or the HTML
  report does not cover the completed assertions/rows.

## TDD Requirement

- The closure-state script asserts: `7.1-8.4` all checked in `tasks.md`; at
  least `32` approved slice acceptances; the 67-row matrix with row `4`
  blocked; the report model exists with the six domains ok; acceptance.json
  A1-A4 approved with evidence refs.

## Verification Commands

- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/032-final-parity-declaration/evidence/verify_closure_state.mjs`
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- A phase `7-8` checkbox is unchecked or a slice acceptance is missing.
- The closure-state script fails without a direct in-scope fix.
- The declaration would claim parity for blocked or unverified rows.

## Unsafe Assumptions

- Approval of the parent acceptance does not change production code; it
  records the verified state on the final HEAD.
- "Global prototype parity" is not claimed; row `4` stays blocked and the
  declaration states exactly what is verified.
