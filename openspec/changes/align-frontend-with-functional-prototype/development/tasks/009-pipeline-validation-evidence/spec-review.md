# Spec Review: 009-pipeline-validation-evidence

## Verdict

approved

## Missing Requirements

- None for task `009` / baseline task `3.5`. The final evidence package
  contains exactly thirty production/prototype measurement and PNG pairs across
  the required desktop/mobile, dark Simplified-Chinese, representative
  light-English, and push/read-only states.
- Capture now proves its authoritative inputs before browser execution. It
  checks the manifest base commit against current Git ancestry, rejects
  production runtime drift outside the allowed router test, compares the direct
  Mock repository response with the Vite-proxied response, and verifies
  production entrypoint/router and approved-prototype markers.
- Production terminal route names come from the live Vue Router
  `currentRoute`. Exact URLs and complete rendered text are independently
  checked for overview totals, the selected failing log, all six changed-file
  paths, decoded config, both errors, push metadata, read-only denial, and all
  six approved-prototype destinations.
- Requests still pending after the five-second settle deadline become blocking
  network failures. Console artifacts contain the exact expected state matrix
  and are deep-equal to each measurement's complete health object.
- The replay summary, scripts, measurements, screenshots, console artifacts,
  and manifest form one checksum-valid package. A successful capture refreshes
  manifest timestamps, warning adjudication, file counts, and all
  aggregate/individual hashes in the same execution before reporting success.
  The current verifier passes all thirty pairs, exact PNG dimensions, service
  identity, browser health, semantics, overflow, locale/theme/permission, the
  capture manifest-transaction marker, and aggregate checksums.

## Extra Behavior

- The only `web/` diff is an explicit `15_000ms` timeout on the two existing
  dynamic-router-import tests in `web/src/router.test.ts`. Route inputs,
  expected hrefs, route-name and parameter assertions, production router code,
  and runtime behavior are unchanged.
- The task-local Mock API, smoke tool, CDP capture tool, verifier, measurements,
  screenshots, and replay summary stay inside the expanded allowed scope and
  are not imported by production code.
- The capture intercepts only the absent optional production
  `/assets/custom.js` hook and prototype `/favicon.ico`, attributes those
  interceptions per state, restores push permission, and uses race-free bounded
  TERM/KILL shutdown without suppressing API or application asset failures.

## Misunderstood Requirements

- None. The evidence compares equivalent hierarchy, behavior, responsive
  containment, theme, locale, permission, and populated data rather than
  requiring pixel identity or copying prototype-only fixtures into production.
- Production continues to use current APIs, workflow/step data, mutations,
  permission calculation, and explicit unsupported-data fallbacks. The
  prototype remains an immutable comparison surface.
- This approval is limited to task `009` / baseline task `3.5` and the
  completed pipeline route family. It does not verify `A1`, update rows 11
  through 16 of `route-parity.md`, complete all 67 routes, or close later route
  families and final six-domain verification.

## Cannot Verify From Diff

- Source inspection alone cannot prove the recorded browser state, service
  identity, no-overflow behavior, or artifact integrity. This reviewer
  independently ran the final verifier, which passed 30 paired states, 18
  production and 12 prototype states, exact semantic/health correspondences,
  2,396 warnings, and all checksums.
- The capture command rewrites the evidence package and was not rerun because
  this review is explicitly restricted to editing `spec-review.md`. Its final
  v3 system-executed receipt records code-0 completion, verified service
  identity, thirty zero-error captures, permission restoration, race-free
  bounded exit, and same-run manifest refresh; the exact captured outputs and
  script are independently checksum-verified by the current manifest and
  verifier.
- Representative production desktop overview, production `390x844` selected
  log, approved-prototype desktop overview, and production read-only Debug
  screenshots were independently inspected and agree with their measurements
  and semantic assertions.
- This reviewer independently reproduced the exact focused command three
  sequential times at 8 files / 66 tests, the full suite at 28 files / 175
  tests, targeted Prettier, ESLint, TypeScript, Vite build, Mock API smoke,
  harness syntax checks, Git runtime-drift checks, and `git diff --check`.
- The production capture records 2,396 warnings and zero errors. The disclosed
  warning classes are existing vue-i18n startup/fallback messages, extraneous
  `stepId` warnings, and deprecated router-guard callback warnings; settled
  English and Simplified-Chinese states contain no raw i18n keys.

## Acceptance Assertions Verified

- `A2`: verified for the completed pipeline route family. Production and the
  approved prototype are compared in equivalent populated theme, locale,
  viewport, and permission states across overview, selected log,
  changed-files, config, errors, and Debug, while production preserves real
  API, mutation, and permission seams.
- `A3`: verified for this completed frontend slice. Three sequential focused
  runs passed 8 files / 66 tests, the full suite passed 28 files / 175 tests,
  and targeted Prettier, ESLint, TypeScript, Vite build, `git diff --check`,
  Mock smoke, evidence verification, and desktop / `390x844` browser evidence
  all pass.
- `A4`: verified for pipeline presentation and data behavior. Workflow, step,
  status, duration, count, log, changed-file, config, error, and metadata
  values derive from current Mock API contracts; permission and unavailable
  states are explicit; retained unit coverage prevents invalid values and stale
  log responses from replacing current presentation.
- The complete parity matrix and remaining route families are intentionally
  outside this slice.

## Required Fixes

- None for task `009` / baseline task `3.5`.
- Keep global `A1` and the later route-family/final-verification tasks open
  until their owning slices update the parity matrix and provide their own
  evidence.
