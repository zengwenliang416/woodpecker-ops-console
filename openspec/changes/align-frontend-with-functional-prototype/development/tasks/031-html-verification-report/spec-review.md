# Spec Review: 031-html-verification-report

## Verdict

approved

## Missing Requirements

- None. The brief's In Scope items are all present: `evidence/build_html_report.mjs` (replayable generator), `evidence/spot_check_report.mjs` + `evidence/report-spot-check-summary.json` (headless-browser spot check), the three self-contained HTML pages under `verify/reports/`, and the two JSON artifacts under `verify/v2/` (`report-model.json`, `report-render-manifest.json`). The generator fails closed on missing/not-ok evidence (`sixDomain.ok` assert, 67-row assert, row-4-blocked assert, exactly-one-blocked-row assert). Baseline task `8.3` is closed in `tasks.md`; `8.4`, row 4, and the parent acceptance remain open (non-goals respected).

## Extra Behavior

- No material extra behavior. The only working-tree changes outside the explicit allowed files are CodeGraph side-effect files (`codegraph/claims-report.json`, `evidence-index.json`, `guard-report.json`, `status.json`) and a re-run of `029-static-gate-closure/evidence/static-gate-receipt.json` (new timestamps/durations) — these are plugin/prior-slice drift, not task 031 edits; `claims-map.json` and `evidence-query-plan.json` (allowed) do contain the 031 records. No production code is touched.

## Misunderstood Requirements

- The one misread of the acceptance contract (generator read `a.claim` while `acceptance.json` defines the field as `statement`, rendering `undefined` in the overview assertion table) was raised as Required Fix 1 in the prior review round and is now corrected: `build_html_report.mjs` line 142 reads `a.statement ?? a.claim ?? ''`, and the regenerated `verify/reports/overview.html` renders the full assertion statements with zero `undefined` occurrences (verified: `grep -o undefined overview.html` = 0 and the full A1 statement text is present). No other misreadings remain.

## Cannot Verify From Diff

- The truth of the underlying executed evidence is not re-established by this review: sensory bundle contents and run IDs (020/021/022/027), redteam mutation rejections (027 9/9, 023 5/5), e2e journey states (5 states/4 routes), and Vitest 610 are relayed from `six-domain-summary.json` and the 30 slice `acceptance.json` files without transformation. I spot-verified the transcription path (six-domain rows, slice count 30, assertion ids `A1`-`A4` per slice, receipt count 429) but did not re-execute the underlying domain runs — consistent with the brief's documented unsafe assumption ("a rendered page implies content truth only insofar as the generator reads the executed evidence files without transformation").
- The V2 adapter lifecycle is not run (only `verify/v2/runtime-status.json` exists); the report documents this in `report-model.json` (`runtime.v2_adapter_lifecycle: "not-run"`) and on the overview page — verified, and the non-goal is respected.

## Acceptance Assertions Verified

Verified in their report-coverage, task-scoped sense (parent/change-level acceptance remains open under task 8.4; the overview table faithfully shows status `failing` from the unchanged `acceptance.json`, now with the real statement text rendered):

- A1 — the report covers the full 67-row parity matrix with explicit per-row status: catalog page renders 67 rows (68 `<tr>` including the header row), 66 `verified`, row 4 `blocked` with an explicit banner on both overview and catalog pages; facticity domain row PASS; A1 statement text renders in full on the overview page.
- A2 — the report covers the completed-route-families-match-prototype claim through the six-domain sensory PASS rows (020: 20 states, 021: 62 states, 022: 54 states, 027: 39 states × 3 viewports, with run IDs) and the per-slice acceptance inventory.
- A3 — the report covers the frontend-slice gates through the static PASS row (whole-tree Prettier/ESLint/vue-tsc/Vite build/git diff --check) and the unit PASS row (full Vitest 610 tests).
- A4 — the report covers the operational-data claim through the unit/redteam/e2e evidence rows and the per-slice acceptance inventory (30 slices, assertion ids A1-A4).

Caveat: A1-A4 are verified here only as "covered by the report with evidence references"; the change-level acceptance (task 8.4) remains open and no global parity is claimed for blocked/unverified rows.

## Required Fixes

- None remaining. All three fixes from the prior needs-fix review are applied and independently re-verified:
  1. Assertion claim rendering: generator now reads `a.statement ?? a.claim ?? ''`; regenerated overview renders real A1-A4 statements, `undefined` count = 0 (re-ran the generator myself: exit 0, report_model_id `report-b25fea92b2abf8558e002e6a` for my run; the on-disk artifacts from the implementer's gate run carry report_model_id `report-637150eeff72e2a701c6c6a4` and the current manifest binds report `report-b0edbfe39b45b481dc1c391e` — every run's sha256 recomputed and matched to the on-disk HTML files).
  2. Badge styling: `.badge.failing`, `.badge.not-started`, `.badge.in-progress`, `.badge.unknown` CSS rules added to the generator and present in the generated HTML.
  3. Spot check strengthened (asserts no `undefined` and presence of parity-matrix text on overview) and green: my re-run exited 0 (3 pages, catalog_rows 67, console_errors 0, network_requests 0), matching the recorded gate run in `development/evidence/042-031-html-verification-report.log`, which ends "Task 031 validation gates all passed."
