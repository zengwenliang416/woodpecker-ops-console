# Task Report: 009-pipeline-validation-evidence

## Status

DONE_WITH_CONCERNS

## Files Changed

- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/brief.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/context.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/evidence/mock_api.py`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/evidence/mock_api_smoke.mjs`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/evidence/capture_browser.mjs`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/evidence/verify_evidence.mjs`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/evidence/browser-replay-summary.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/evidence/manifest.json`
- Thirty durable browser-measurement JSON files and thirty paired PNG files
  under the task-local `evidence/` directory.
- `evidence/browser-console-production.json`
- `evidence/browser-console-prototype.json`
- `web/src/router.test.ts`
- This report and the independent review files.

## What Changed

- Added a deterministic task-local Mock API for authenticated repository `101`
  and failed pipeline `842`. It serves current repository, permission, pipeline,
  workflow/step, selected-log, changed-file, base64 config, error, Forge,
  application, environment, release, feed, event-stream, and metadata
  contracts, with a switchable push/read-only permission response.
- Added a 14-endpoint Mock API smoke command, a replayable CDP browser capture
  command, and an independent evidence verifier. The verifier requires exactly
  thirty paired states, validates PNG signatures and dimensions, checks
  theme/locale/permission/route/overflow/raw-key/browser-health assertions,
  reconciles each console state with its measurement, and reproduces manifest
  checksums.
- A successful capture writes the replay summary and then atomically refreshes
  manifest timestamps, warning adjudication, file counts, aggregate hashes, and
  individual harness/summary hashes before reporting success.
- The capture proves local service identity before opening Chrome: the manifest
  base commit is in the current Git ancestry, production runtime files are
  unchanged from that base except the allowed router test, Vite `/api` returns
  the exact Mock API fixture, the live production entrypoint/router source
  exposes the expected markers, and the standalone artifact exposes the
  approved prototype marker.
- Stabilized the two existing dynamic-router-import tests with an explicit
  `15_000ms` timeout. Assertions, route inputs, and production router behavior
  are unchanged.
- Captured the production overview, selected log, changed-files, config,
  errors, and Debug destinations in dark Simplified Chinese at `1600x1000` and
  `390x844`.
- Captured the same six approved-prototype destinations in dark Chinese at the
  same attested viewports.
- Captured representative production light-English overview and selected-log
  states at desktop and mobile.
- Captured production read-only overview and direct Debug access. Read-only
  state hides Retry and the Debug tab; direct Debug access renders permission
  feedback and exposes no metadata download.
- Recorded URLs, terminal route names, viewport/document dimensions, theme,
  language, computed colors, page and dense-container overflow, controls,
  complete normalized rendered text, raw i18n-key detection, console output,
  screenshot dimensions, and aggregate SHA-256 checksums in
  `evidence/manifest.json`.
- All production and prototype states avoid page-level horizontal overflow.
  Production mobile tables and logs retain their width inside designated local
  scrolling containers.
- Every screenshot contains PNG data and exactly matches its configured
  `1600x1000` or `390x844` viewport.
- Per-state browser health records contain zero console errors, runtime
  exceptions, failed network requests, and HTTP errors. The replay summary
  reports `30` states, `18` production states, `12` prototype states, and no
  error states.
- Production route names are read from the live Vue Router `currentRoute`.
  Verification checks exact URLs and destination-specific rendered data:
  workflow/step totals, selected failing log, all six changed-file paths,
  decoded config commands, both diagnostics, metadata filename/version,
  read-only denial, and approved-prototype equivalents.
- Requests still pending after the five-second settle deadline are recorded as
  network failures and make the replay fail. The final replay completed with
  no pending request failures and exited cleanly.
- Equivalent-state review confirms the production route family preserves real
  Woodpecker APIs, workflow/step data, mutations, permissions, unavailable-data
  fallbacks, and diagnostic behavior while matching the approved prototype's
  shell, route hierarchy, density, status vocabulary, and responsive intent.

## TDD Evidence

- No new product-behavior assertion was required because task `3.4` already
  owns the pipeline regression suite and no rendered production defect was
  reproduced. The only test change increases the timeout for the two existing
  dynamic-import cases after independent review reproduced the default
  five-second timeout in the combined suite.
- The exact focused pipeline command passed three sequential runs, each with
  `8` files and `66` tests, against base commit `5712db6` plus the current
  task-scoped test/evidence diff.
- The current complete frontend suite passed `28` files and `175` tests.
- Task `3.4` retains direct coverage for named/inbound routes, tab
  destinations/counts, all current status and cancellation branches,
  push/read-only actions, workflow/step routing, stale log rejection, explicit
  empty/error states, metadata behavior, and local responsive containment.

## Verification Commands

- PASS: focused pipeline Vitest command from `brief.md`, repeated sequentially
  three times (`8` files, `66` tests in every run).
- PASS: `pnpm test -- --run`
  (`28` files, `175` tests).
- PASS: targeted pipeline/evidence Prettier command.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the two pre-existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: `node evidence/mock_api_smoke.mjs` (`14` endpoints; push permission
  restored).
- PASS: `node evidence/capture_browser.mjs` (`30` states; verified services,
  actual routes/content, zero error states, clean process exit).
- PASS: `node evidence/verify_evidence.mjs` (`30` paired states; all checksums
  and console/measurement correspondences verified).
- PASS: Node syntax checks for all three `.mjs` tools and
  `python3 -m py_compile evidence/mock_api.py`.
- PASS: `git diff --check`.
- PASS: production and approved-prototype browser review recorded in
  `evidence/manifest.json`, including desktop/mobile, dark Simplified-Chinese,
  representative light-English, push/read-only, overflow, raw-key, console,
  route, control, and screenshot-dimension evidence.

## Concerns

- The production replay records `2396` warnings and zero errors:
  `2370` existing vue-i18n startup/fallback warnings, `8` existing extraneous
  `stepId` warnings on `PipelineWrapper`, and `18` existing Vue Router
  deprecated-`next()` warnings. No other warning category exists. Settled
  English and Simplified-Chinese states contain no raw i18n keys.
- The capture command intercepts only two absent optional localhost resources:
  production `/assets/custom.js` and approved-prototype `/favicon.ico`. Every
  interception is attributed per state; API requests and application assets
  are not intercepted.
- The production log groups the selected command in its existing collapsible
  console presentation, while the prototype shows an expanded illustrative
  log. The real four-line response, stderr typing, local controls, and dense
  scroll ownership are covered by the current browser/API evidence and focused
  tests; prototype-only log fixtures are not copied into production.

## Scope Deviations

- Independent review expanded the task from evidence-only to permit one
  test-only change in `web/src/router.test.ts`. The repair changes only the
  explicit Vitest timeout for two existing dynamic-import tests.
- The task still changes no production component, router runtime, API client,
  store, backend, locale, permission calculation, dependency, or prototype
  file.

## Follow-up Needed

- Later route-family work should address the console-warning debt only in its
  owning scope: asynchronous locale initialization, the selected-step
  `stepId` attribute warning, and the deprecated router guard callback.
- Tasks `4.1` through `8.4` remain pending. Do not treat this pipeline-family
  evidence as full 67-route parity or final six-domain verification.

## Adjudication

Baseline task `3.5` may close only after superseding independent spec and
quality reviews both approve. The previous review blockers are directly
addressed: the exact focused suite passes three sequential runs, the full
thirty-state browser/API evidence is replayable with per-state health
attribution, every screenshot is verified as exact-dimension PNG data, local
service/proxy/prototype identity is proven before capture, live route and
destination semantics are independently checked, pending requests are
blocking, console artifacts fully reconcile, and the SpecNav report/overturn
contracts pass.
