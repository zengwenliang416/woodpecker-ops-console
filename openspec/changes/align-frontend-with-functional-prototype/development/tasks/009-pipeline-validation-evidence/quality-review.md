# Quality Review: 009-pipeline-validation-evidence

## Verdict

approved

## Separation Of Concerns

- The task remains correctly isolated. The only `web/` change adds local
  `15_000ms` timeouts to two existing dynamic-import tests in
  `web/src/router.test.ts`; route inputs and assertions are unchanged.
- The deterministic Mock API, smoke command, CDP capture, verifier,
  measurements, screenshots, console artifacts, and manifest remain task-local
  evidence infrastructure. No fixture or capture concern leaks into production
  components, router runtime, API clients, stores, locales, dependencies, or
  the approved prototype.
- `capture_browser.mjs:175-214` validates Git ancestry/runtime drift, direct
  versus Vite-proxied repository identity, the production entrypoint/router
  marker, and the approved-prototype marker before capture. Port liveness alone
  is no longer accepted as service identity.

## Component Cohesion / Coupling

- `mock_api.py`, `mock_api_smoke.mjs`, `capture_browser.mjs`, and
  `verify_evidence.mjs` each have a focused responsibility. Production remains
  coupled only to its existing Vite proxy and API/store seams.
- Production `terminalRouteName` is observed from the live Vue Router
  `currentRoute` at `capture_browser.mjs:598`, rather than copied from the
  expected-state table. The verifier retains an independent route map and exact
  URL expectations.
- The final capture now owns manifest finalization through
  `updateManifest()` at `capture_browser.mjs:248-300,755-756`. The same
  successful execution refreshes capture times, warning totals, file count,
  aggregate hashes, and individual harness/summary hashes before verification.

## Test Quality

- Independent third-round execution passed the exact focused suite at
  `8/8` files and `66/66` tests and the complete frontend suite at `28/28`
  files and `175/175` tests.
- Independent Mock API smoke execution passed all 14 endpoint/status checks and
  restored push permission. Current Node syntax checks and isolated Python
  compilation also passed.
- `verify_evidence.mjs` independently passed exactly 30 paired states:
  18 production and 12 approved-prototype states. It verifies exact state and
  console matrices, PNG signatures/dimensions, viewport/theme/locale/permission,
  exact URLs, live route names, overflow, raw-key leakage, browser health, and
  console-to-measurement deep correspondence.
- Destination assertions distinguish overview totals, the selected failing
  log, all six changed files, decoded configuration commands, both diagnostic
  categories, Debug metadata, read-only denial, and approved-prototype
  equivalents. Replacing one destination with another can no longer pass.
- Independent SHA-256 recomputation matched the current manifest for the
  capture tool, all files, all PNG files, and all non-manifest JSON files.
  The current verifier passed with `checksumsVerified: true`.

## Error Handling

- Requests still pending after the five-second settle deadline are converted
  into explicit `networkFailures` at `capture_browser.mjs:526-533`; they
  contribute to `errorCount`, `errorStates`, and a failing replay summary.
- Console errors, runtime exceptions, failed requests, and HTTP errors are
  retained per state. The verifier requires zero blocking errors and exact
  correspondence with the two durable console artifacts.
- Child cleanup is bounded at `capture_browser.mjs:216-232`: SIGTERM and
  SIGKILL each receive a three-second polling deadline, followed by an explicit
  error rather than an unbounded wait.
- The final v3 replay exited with code 0, reported 30 states and no error
  states, refreshed the manifest in the same run, and was followed by a passing
  verifier receipt.

## Reuse / Duplication

- The task reuses Node built-ins, browser CDP, Python's standard HTTP server,
  the existing Vite command/proxy, current production APIs and stores, and the
  immutable standalone prototype. No new runtime dependency or competing
  browser framework was added.
- Capture and verifier intentionally keep separate expected-state contracts.
  Because route identity and rendered content now come from the live browser,
  that duplication provides an independent check rather than a same-assumption
  self-proof.
- Checksum construction is mirrored only where producer and verifier require
  independent calculation. The current values match, so the prior undocumented
  manual manifest-rebuild seam is closed.

## Complexity Delta

- Production runtime complexity is unchanged. The test delta is two explicit
  timeout arguments, proportionate to the reproduced cold dynamic-import delay.
- Evidence complexity is substantial but justified by the 30-state matrix,
  service/runtime identity checks, destination semantics, per-state browser
  health, exact PNG validation, and independently reproducible checksums.
- The manifest finalization and bounded cleanup additions close the last
  lifecycle gaps without introducing a production abstraction or compatibility
  path.
- The remaining 2,396 browser warnings are explicitly categorized as 2,370
  vue-i18n startup/fallback warnings, eight existing `stepId` warnings, and 18
  router deprecation warnings. They produced no settled raw keys, browser
  errors, failed requests, runtime exceptions, or acceptance violation, so
  they are non-blocking concerns for this evidence-only slice.

## Required Fixes

No changes are required for quality approval.
