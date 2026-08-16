# Spec Review: 030-six-domain-verification

## Verdict

approved

## Missing Requirements

None. Baseline task 8.2 is fully delivered and every prior Required Fix is verified against a single coherent recorded run (orchestration re-run, gate log `041-030-six-domain-verification.log` and all on-disk per-domain evidence files regenerated together at 15:36-15:39 local / 07:36-07:39Z):

- **Executed-evidence traceability is restored and verified read-only.** Gate log 041 records ONE coherent run that matches every on-disk per-domain evidence file:
  - e2e: log attests runId `5d9b17c0-849f-4daf-8071-1185730dc044` with generatedAt `07:39:10.746Z`; the on-disk `e2e-journey-summary.json` carries the identical runId and generatedAt, and the on-disk `e2e-journey-measurements.json` contains only that runId (5 states: login light, overview light, overview dark, repos dark, deployment detail dark).
  - facticity: log attests `generated_at 07:36:55.835Z`; on-disk `facticity-report.json` carries the identical timestamp, `ok: true`, 67 rows, and `tamper_self_test {row4_status: rejected, route_cell: rejected, multi_segment_route: rejected}` — matching the log's facticity section exactly.
  - six-domain summary: log ends with the summary JSON `generated_at 07:39:11.059Z`, `ok: true`, `blocked_row_4: "explicit"`; on-disk `six-domain-summary.json` carries the identical timestamp and content.
- **Facticity:** 67 ordered rows, valid status vocabulary (`{"verified":66,"blocked":1}`), row 4 explicitly blocked, every `Verified by task` reference (019-022) resolves to an approved acceptance, route cells cross-checked against `web/src/router.ts` (top-level segments + verbatim single-segment paths), and the tamper self-test rejects all three mutations (row-4 status, route cell, multi-segment rename). (Executed report records 9 top-level segments; that is the authoritative count and the check passes.)
- **Static:** whole-tree Prettier / ESLint / vue-tsc / Vite build / `git diff --check` re-run via the Task `029` gate with exit 0 (`[domain] static: PASS`).
- **Unit:** full Vitest 110 files / 610 tests pass (`[domain] unit: PASS`).
- **Redteam:** Task `027` responsive red-team rejects 9/9 mutations; Task `023` audit red-team re-executed at its closure HEAD (`f9f0bab`) in a temporary git worktree — `positiveAuditExitCode: 0`, all 5 mutations rejected (unapproved-acceptance, missing-evidence-artifact, verified-row-regression, blocked-row-incorrectly-closed, accepted-object-drift) — with the worktree cleanup recorded. The worktree directory is removed.
- **E2E:** five-state key journey (guest login light, overview light + dark, repos dark, deployment detail dark with log console) with zero health failures and zero page overflow; genuine log-console local scroll containment asserted (`scrollWidth 1735 > clientWidth 628`, `overflowX: auto`, `locallyScrollable: true`) via `!m.logContainment.locallyScrollable`; theme parity non-vacuous (overview captured in both themes, light `rgb(244,247,248)` vs dark `rgb(8,16,23)`); `e2e-journey-summary.json`: 5 states, 4 routes, `failures: []`.
- **Sensory:** Task `020` (20), `021` (62), `022` (54), and `027` (39 x 3 viewports) bundles re-verified present, `ok: true`, with expected state counts asserted and each bundle's run ID recorded in the summary — run IDs match the bundle summaries (`1eae7bc3...`, `84b42687...`, `0051a9bc...`, `b9894081...`).
- **Header/docstring and report hygiene:** `e2e_journey.mjs` header now reads "Task 030 e2e journey..." (`grep "Task 030 e2e journey"` = 1, `grep "Task 028"` = 0); report.md records wording corrected ("appended at closure (after both reviews approve)") and the fixture token described as "space-free unbreakable token".

## Extra Behavior

- The `mock_api.py` fixture carries the deployment-detail `logs` array (with the space-free unbreakable `LONG_LOG_TOKEN`) plus the legacy `/api/deployments/142/logs` endpoint. It is shared test infrastructure, `mock_api.py` is inside `allowed_files`, and the deviation is disclosed in report.md Scope Deviations. No production byte changed (`git status` shows no `web/` changes). Acceptable.
- The 023 red-team worktree re-execution at its closure HEAD is a correct remedy for the route-parity.md owner drift and is fully attested in the gate log. Acceptable and verified.

## Misunderstood Requirements

None. Constraints respected: no production code/routes/APIs changed; blocked repository-add row 4 stays blocked and explicit; tasks 8.3/8.4, row 4, and parent acceptance remain open. The unsafe-assumption guards are implemented (orchestration fails if a sensory bundle is missing/not-ok/state-count-drifted; E2E is a representative sampling). The orchestration and the recorded run are now coherent (verified read-only; no standalone regeneration after the log).

## Cannot Verify From Diff

- The full static gate, Vitest suite, and E2E journey are attested in the gate log rather than re-run in this review (per review scope and the explicit read-only instruction to preserve run coherence). Spot-checked every per-domain section in `041-030-six-domain-verification.log`: Facticity (line 2), Static gate (line 63), unit Vitest (line 3556), Responsive red-team (line 7025), 023 worktree (lines 7073-7119: add → audit → cleanup), E2E journey (line 7121), Sensory (line 7131) — each followed by a `[domain] ... PASS` marker, ending with the six-domain summary JSON `ok: true`.
- Run IDs/timestamps cross-checked between the log and on-disk JSONs (e2e `5d9b17c0...`, facticity `07:36:55.835Z`, summary `07:39:11.059Z`) — all match exactly; the log contains the on-disk e2e runId and the on-disk files carry only that runId.
- Facticity was re-run by this reviewer in an earlier round (exit 0, ok, 67 rows, three-way tamper rejection); the current on-disk report and log agree with that result. No further re-runs were performed this round to preserve the recorded run.

## Acceptance Assertions Verified

Domain-verification sense only; parent approval remains for 8.4 (acceptance.json assertions A1-A4 are still `failing` by design until change-level acceptance):

- **A1** (parity matrix maintained): facticity domain — 67 ordered rows, valid status vocabulary (66 verified / 1 blocked), row 4 explicitly blocked, all `Verified by task` references resolve to approved acceptances, route cells cross-checked against `web/src/router.ts`, tamper self-test passes with three rejected mutations.
- **A2** (route families match prototype in equivalent states): sensory domain — Task 020/021/022/027 bundles (20 + 62 + 54 + 39 states) re-verified present, `ok: true`, expected state counts asserted, run IDs recorded and matching the bundle summaries.
- **A3** (static gates): static domain — whole-tree Prettier/ESLint/vue-tsc/Vite build/git diff --check re-run with exit 0 in the gate log.
- **A4** (operational data regressions): unit domain — full Vitest 110 files / 610 tests pass with zero failures.

## Required Fixes

None blocking. The single prior traceability defect is resolved: the gate log and every on-disk per-domain evidence file come from one recorded run with matching run IDs/timestamps, and the log ends with the six-domain summary `ok: true`. Follow-up (already recorded, not this task's scope): task ledger records and the validation-log entry are appended at closure after both reviews approve (per the per-slice ritual); tasks 8.3/8.4, blocked repository-add row 4, and parent acceptance remain open.
