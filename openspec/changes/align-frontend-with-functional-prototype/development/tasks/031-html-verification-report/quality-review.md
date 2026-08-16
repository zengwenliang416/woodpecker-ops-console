# Quality Review: 031-html-verification-report

## Verdict

approved

## Separation Of Concerns

- The generator (`evidence/build_html_report.mjs`) is a thin, read-only
  pipeline over executed evidence: it loads acceptance.json, the Task 030
  six-domain summary, the 67-row parity matrix, per-slice acceptances
  (001-030), and the validation log, then renders three pages plus the report
  model and render manifest. No production code is touched, which matches the
  brief's "no production component" scope.
- The browser spot check (`evidence/spot_check_report.mjs`) is cleanly
  separated from generation: it only reads the three written HTML files via
  headless Chrome CDP and asserts rendering facts. The gate wrapper
  (`evidence/validate_task.mjs`) composes generator + spot check + JSON/syntax
  checks + Prettier + `git diff --check`.
- The original data-contract mismatch (generator reading `a.claim` against the
  `statement` field of acceptance.json) is fixed: the assertion table now reads
  `a.statement ?? a.claim ?? ''`, and the rendered overview page shows the real
  A1-A4 statements (verified in the generated `verify/reports/overview.html`;
  the full A1 text "Every documented prototype route and tab state is present
  in a maintained parity matrix with an explicit verification status." renders
  in the assertion table).

## Component Cohesion / Coupling

- Cohesion is high within the task: the generator, spot check, gate wrapper,
  and generated artifacts form one self-contained slice, and every artifact
  path is under the brief's allowed roots (`verify/reports/**`,
  `verify/v2/report-*.json`, the task directory). No writes outside scope were
  observed.
- Coupling to upstream evidence is explicit and versioned by assertion:
  `assert.equal(sixDomain.ok, true)`, `assert.equal(matrixRows.length, 67)`,
  `assert.equal(row4.status, 'blocked')`, `assert.ok(sliceAcceptances.length >= 30)`
  — the generator fails loudly if any upstream contract drifts. The formerly
  uncoupled field name (`a.claim`) is now version-tolerant via the
  `statement ?? claim` fallback and is covered by the spot check.
- The overview page labels the domain card "六域验证 全部通过" while rendering
  seven rows because `six-domain-summary.json` contains two `redteam` entries
  (027 and 023). The generator copies the source without transformation per
  the brief's contract, so this is inherited upstream data, not a generator
  rewrite — a stakeholder-facing inconsistency worth an upstream 030 data
  repair, but out of scope for this task.

## Test Quality

- The spot check is meaningful and was re-run by the reviewer after the fix:
  headless Chrome via CDP asserts the overview title, the "Blocked row 4"
  banner on both overview and catalog pages, exactly 67 catalog rows, >= 30
  slice rows, zero console errors, and zero network requests. It now also
  asserts absence of "undefined" content and presence of assertion text on the
  overview page. Re-run result:
  `{"ok":true,"pages":3,"catalog_rows":67,"console_errors":0,"network_requests":0}`
  (runId 08a9a745-0763-4631-a437-bb7f70979dc8).
- The generator's self-check re-verifies every manifest sha256 against the
  written files and asserts exactly one blocked row; the reviewer independently
  recomputed the three hashes and sizes after regeneration — all MATCH the
  manifest, and `report-model.json`'s `report_id` equals the manifest's
  `report_model_id` (report-b0edbfe39b45b481dc1c391e).
- The original defect class is now caught: the spot check's
  `!overview.text.includes('undefined')` assertion fails closed on the exact
  regression found in the first review round. Minor hardening note (not
  blocking): the companion `overview.text.includes('平价矩阵')` assertion also
  matches the always-present nav label, so it is a weak proxy for "A1 statement
  present"; the definitive check is the "undefined" absence plus the rendered
  statement text, which the reviewer confirmed directly in the generated HTML.

## Error Handling

- Fails closed as required: missing evidence files throw via `readFileSync`;
  `sixDomain.ok === false` aborts; fewer than 67 matrix rows, a non-blocked
  row 4, fewer than 30 slice acceptances, and manifest-hash drift after write
  all abort with assertion failures. No fallback evidence is invented
  anywhere.
- The `gitHead` read is the only tolerated fallback (`'unknown'` on failure),
  which is a metadata field, not evidence — acceptable.
- The spot check cleans up its Chrome process and temp profile in a `finally`
  block and fails on missing Chrome start, non-ready CDP endpoint, or any
  assertion failure.

## Reuse / Duplication

- The generator reuses the executed evidence verbatim (acceptance assertions,
  six-domain rows, matrix rows, slice acceptances, validation receipts) rather
  than re-deriving numbers; the report model is built from the same in-memory
  readings as the pages, so model and pages cannot drift within one run.
- The shared CSS and page shell are defined once and reused across the three
  pages, and `esc()`/`statusBadge()` centralize escaping and status styling.
  The status-badge palette now covers verified/blocked/pass/passing plus
  failing/not-started/in-progress/unknown, so every status the report can emit
  renders styled. No meaningful duplication was found in the ~440 lines of task
  scripts.

## Complexity Delta

- Complexity added is small and proportionate: two scripts (generator ~250
  lines, spot check ~190 lines) plus a thin gate wrapper, over evidence files
  that already existed. No new production behavior, routes, APIs, or fixtures
  were introduced; the diff is confined to the task's allowed roots.
- The mixed-schema validation log (early v1 entries use `task_id`, later v2
  entries use `task`/`receipt_id`) is handled defensively with `?? ''`
  fallbacks, which keeps the receipts table rendering — at the cost of one
  blank row for the `acceptance-refreshed` entry that carries neither field.
  Minor cosmetic; the root cause is upstream schema evolution.

## Required Fixes

- None blocking. The required fix from the first review round is applied and
  re-verified: the assertion table renders the real `statement` text (the
  generator now reads `a.statement ?? a.claim ?? ''`), the overview page
  contains zero occurrences of "undefined", and the spot check asserts both
  absence of "undefined" and presence of assertion text. Both fast checks
  re-ran green in the reviewer's session (generator ok; spot check ok, 67
  catalog rows, 0 console errors, 0 network requests), and the render manifest
  hashes/sizes independently recompute to MATCH the regenerated files with the
  report_id linked between model and manifest.
- Optional non-blocking polish (out of scope for this task): the slice
  acceptance pills on `test-case-results.html` use status "approved", which has
  no dedicated badge CSS class yet (renders with the base badge style only),
  and the duplicated `redteam` domain rows on the overview page trace to the
  upstream Task 030 summary data.
