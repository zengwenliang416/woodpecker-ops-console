# Task Report: 032-final-parity-declaration

## Status

DONE

## Files Changed

- Added the Task `032` scope packet, task graph node, task context record,
  and CodeGraph claim/query-plan records.
- `acceptance.json`: change-level assertions A1-A4 `passing` (the
  change-level contract schema accepts `failing|passing`) with string
  `evidence_ref` bindings to the executed per-slice evidence (facticity
  report for A1; Task `020` browser bundle for A2; Task `029` static receipt
  for A3; Task `030` six-domain log for A4), keeping the original statements
  and `verify_via` values (A4 = unit) intact, plus an `approval` block with
  the six-domain summary, report model, and manifest hashes. The Task `031`
  HTML report was regenerated after the approval so its assertion badges
  reflect the schema-valid `passing` state; its model and manifest were
  re-bound.
- `development/tasks/032-final-parity-declaration/parity-declaration.md`:
  the final declaration — 66 verified rows + row 4 explicitly blocked; what
  is verified (A1-A4, six domains, HTML report) and what is not (row 4
  parity, V2 adapter lifecycle).
- `development/handoff-to-verify.md`: extended with the implemented-slice
  entry for tasks `7.1-8.4` and the final state summary.
- `tasks.md`: baseline `8.4` checked (all eight phase `7-8` checkboxes now
  checked).
- Added `evidence/verify_closure_state.mjs` and
  `evidence/closure-state-summary.json`: the closure-state verification
  (phase 7-8 checkboxes, 32 approved slice acceptances, 67-row matrix with
  row 4 blocked, six domains ok, HTML report model/manifest bound, parent
  acceptance passing with evidence refs, 32 complete ledger entries). The
  ledger records for slices `025`/`026` were backfilled (their closures
  predated the ledger ritual; both have signed acceptances), and the `032`
  closure entry was appended after this task's acceptance build.

## What Changed

- Baseline task `8.4` is implemented as the final parity declaration and the
  change-level acceptance approval. The declaration states exactly what is
  verified (66/67 rows, A1-A4, the six verification domains, the HTML
  report) and what remains blocked (repository row 4 — production activation
  list vs the prototype's four-step add wizard) without claiming global
  prototype parity.
- The phase `7-8` closure records are complete: all eight checkboxes
  checked, every slice `001-032` has signed acceptance, the handoff record
  carries the implemented-slice entry, and the HTML report covers every
  completed assertion and route row with the blocked row explicit.

## TDD Evidence

- `evidence/verify_closure_state.mjs` fails closed when any phase `7-8`
  checkbox is unchecked, fewer than 32 slice acceptances are approved, the
  matrix is not 67 rows with row 4 blocked, the six domains are not ok, the
  report model/manifest are not bound, the parent assertions are not
  approved with evidence refs, or the ledger has fewer than 32 complete
  entries.

## Verification Commands

- PASS: `node .../evidence/verify_closure_state.mjs` — closure state verified
  on the final HEAD (`evidence/closure-state-summary.json`).

## Concerns

- "Global prototype parity" is not claimed; row 4 stays blocked.
- The parent acceptance approval records the verified state on the final
  HEAD; it does not change production code.

## Scope Deviations

- None.

## Follow-up Needed

- None within this change. The change is ready for release/archive review
  with the parent acceptance approved and blocked row 4 explicit.
