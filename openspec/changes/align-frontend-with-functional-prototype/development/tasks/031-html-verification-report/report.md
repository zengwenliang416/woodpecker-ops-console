# Task Report: 031-html-verification-report

## Status

DONE

## Files Changed

- Added the Task `031` scope packet, task graph node, task context record,
  and CodeGraph claim/query-plan records.
- Added `evidence/build_html_report.mjs`: the replayable HTML report
  generator over the executed evidence.
- Added `evidence/spot_check_report.mjs` and
  `evidence/report-spot-check-summary.json`: the headless-browser spot check
  of the three generated pages.
- Generated artifacts:
  - `verify/reports/overview.html` — aggregate verdict, six-domain results,
    assertion coverage (A1-A4), blocked row 4 banner;
  - `verify/reports/test-case-catalog.html` — all 67 parity rows with
    prototype/production routes, assessment, and status (66 verified +
    row 4 blocked);
  - `verify/reports/test-case-results.html` — per-slice acceptance inventory
    (30+ slices) and recent validation receipts;
  - `verify/v2/report-model.json` — the report data model;
  - `verify/v2/report-render-manifest.json` — the three HTML paths with
    sha256 hashes and sizes, self-checked against the written files.
- Recorded the executed gate as
  `development/evidence/042-031-html-verification-report.log`.

## What Changed

- Baseline task `8.3` is implemented: the stakeholder-facing HTML
  verification report covers every completed acceptance assertion (A1-A4 in
  their task-scoped sense) and every verified route row of the 67-row parity
  matrix, with blocked repository row `4` explicit in the overview banner and
  the catalog banner.
- The pages are self-contained (inline CSS, no external assets); the browser
  spot check verifies rendering (title, 67 catalog rows, blocked banner), zero
  console errors, and zero network requests.
- The V2 adapter lifecycle is not run (verify/v2 contains only
  runtime-status.json); the report is generated directly from the executed
  development evidence and that decision is recorded in the report model and
  the overview page.

## TDD Evidence

- The generator fails closed when a required evidence file is missing or its
  summary says not-ok, and asserts exactly 67 matrix rows with row 4 blocked
  and exactly one blocked row.
- The render manifest binds the three HTML paths with sha256 hashes that the
  generator re-verifies against the written files.
- The browser spot check asserts the catalog renders 67 rows and the blocked
  banner is present.

## Verification Commands

- PASS: `node .../evidence/validate_task.mjs` — full gate chain exits `0`
  (recorded in `development/evidence/042-031-html-verification-report.log`).
- PASS: generator self-check, browser spot check (3 pages, 67 rows, zero
  console/network issues), JSON validity, Prettier, `git diff --check`.

## Concerns

- The report is generated from the executed development evidence; it is not a
  claim that the V2 verification adapter lifecycle ran.
- Blocked row `4` is explicit; nothing in the report claims parity for it.

## Scope Deviations

- None. All generated files are inside the allowed `verify/reports/**` and
  `verify/v2` paths declared in the brief.

## Follow-up Needed

- Task `8.4` (final parity declaration + change-level acceptance approval),
  blocked repository-add row `4`, and the parent acceptance remain open.
