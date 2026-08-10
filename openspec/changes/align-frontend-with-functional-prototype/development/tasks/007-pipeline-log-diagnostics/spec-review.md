# Spec Review: 007-pipeline-log-diagnostics

## Verdict

approved

## Missing Requirements

- None. The five diagnostic surfaces use current production data and seams:
  loaded step logs, `pipeline.changed_files`, injected historical configs,
  typed runtime/parse errors, repository push permission, and the existing
  metadata endpoint.
- Log search, stderr-only filtering, no-match/reset behavior, wrapping, and
  visible counts remain local projections over the loaded buffer. Existing
  download, deletion, streaming, grouping, anchors, auto-scroll, fullscreen,
  mobile close, highlighting, and exit-code behavior remain available.
- Changed files expose complete real paths without invented diff data; config
  remains decoded, read-only, unparsed, and copyable; errors and Debug expose
  explicit empty/permission/feedback states without prototype-only analysis or
  interactive-session claims.
- The review fix closes the prior A4 blocker. Each log load captures a
  generation and requested step slug, and finite responses plus stream
  callbacks are discarded if selection has moved to a newer generation.

## Extra Behavior

- None. The actual diff, including all five test paths, remains within the
  thirteen allowed files and introduces no router, API client, store, backend,
  persistence, dependency, authentication, permission-calculation, pipeline
  header/overview, prototype, or console-style change.
- Unsupported diff hunks/statistics, config validation/editing, remediation,
  previous-success analysis, artifacts, environment inventory, and interactive
  Debug fixtures remain deliberately absent.

## Misunderstood Requirements

- None. The current `stepId` route and API identifiers remain authoritative.
  The generation/slug guard changes only whether an obsolete response may
  commit to current presentation state; it does not cancel, replace, or extend
  an API contract.
- Repository push permission still gates log deletion and Debug metadata.
  Read-only log download and all non-mutating diagnostic routes remain
  available as before.
- This approval is limited to task `007` / baseline task `3.3`. It does not
  complete tasks `3.4`, `3.5`, the whole pipeline route family, or any global
  acceptance assertion.

## Cannot Verify From Diff

- Prototype parity, rendered theme/locale output, permission presentation, and
  page-level overflow cannot be proven by source diff alone. The
  system-executed `task-007-pipeline-diagnostics-browser-20260810` receipt
  covers all five production surfaces and the approved prototype at desktop
  and `390x844`, including dark Simplified Chinese, representative light
  English, push/read-only states, real data, and unsupported-data exclusions.
- Representative production/prototype screenshots were independently
  inspected. Production captures have the recorded `1600x1000` or `390x844`
  dimensions; disclosed prototype long-page crops are comparison artifacts,
  not claimed production viewport captures.
- The original red-test ordering has no system-executed receipt and is not used
  as acceptance evidence. Current source, independent rerun, and
  system-executed green receipts verify the final implementation.

## Acceptance Assertions Verified

- `A2`: verified only for the log, changed-files, config, errors, and Debug
  surfaces in this slice. The allowed-file diff, preserved API/router/
  permission seams, inspected screenshots, and system-executed browser receipt
  support prototype-equivalent hierarchy over real supported data at desktop
  and mobile.
- `A3`: verified by an independent focused rerun (5 files, 13 tests) plus
  system-executed focused and full suites (5 files / 13 tests and 28 files /
  160 tests), targeted Prettier, ESLint, TypeScript, Vite build,
  `git diff --check`, and desktop / `390x844` browser review. The earlier
  concurrent router timeout is contract-recognizably overturned by the later
  isolated 160-test pass.
- `A4`: verified only for data behavior owned by this slice. Log lines and
  stderr type derive from the current API response; changed-file and visible
  log counts derive from current arrays; config/error/debug content comes from
  current injected or API values; missing data uses explicit empty/permission
  fallbacks; and the generation/slug guard plus deferred old-request-last test
  prove obsolete completed-step responses cannot overwrite the selected step.

## Required Fixes

- None for this slice. Later pipeline tasks must independently verify their
  status/router/action coverage and consolidated route-family evidence.
