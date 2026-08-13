# Quality Review: 019-route-family-parity-closure

## Verdict

approved

The superseding current-byte review found no remaining task-local quality
blocker. The prior fail-open theme, locale, content, health-schema, and runtime
transformation findings are closed by the implementation and independently
reproduced validation.

## Separation Of Concerns

- `web/src/route-family-parity.test.ts` remains a test-only route contract.
  Production routes, components, APIs, stores, localization, permissions,
  dependencies, and approved-prototype bytes are unchanged by task `019`.
- The concentrated test owns route resolution and focused-suite inventory,
  while existing component suites remain responsible for loading, empty,
  error, retry, mutation, permission, disabled, and stale-completion behavior.
  Browser replay does not duplicate those component-state contracts.
- Evidence responsibilities are now explicit: `capture_browser.mjs` produces
  current-byte measurements, `verify_evidence.mjs` independently owns the
  expected inventory and content oracle, `redteam_verifier.mjs` tests the
  oracle's rejection behavior, and `mock_api.py` remains a deterministic
  task-local fixture.

## Component Cohesion / Coupling

- The route table is cohesive around exactly parity rows `1` and `24-45`. It
  verifies inbound and named resolution, parameters, authentication and
  administrator metadata, login layout, CLI query handling, organization
  header metadata, catch-all ordering, and the 32 focused test files.
- Reuse of task `015-017` capture runners avoids copying roughly three full CDP
  implementations. The initial temporal-coupling risk is closed:
  `replaceExactly` requires each structural transformation anchor to occur once
  and reports the failing group/anchor
  (`evidence/capture_browser.mjs:120-145`).
- Generated-runner postconditions require the task-019 evidence root, run ID,
  fixture replacement, group Mock API port, bounded cleanup, terminal path,
  and compatible reverse loop, and reject remaining legacy identifiers or
  `.toReversed()` calls (`evidence/capture_browser.mjs:197-205`).

## Test Quality

- Independent execution passed the concentrated route command at 2 files and
  39 tests. Current system-executed receipts additionally record the complete
  focused family command at 34 files / 173 tests and full frontend Vitest at 85
  files / 496 tests.
- The verifier independently owns 23 destination definitions, both surfaces,
  both viewports, and per-destination/per-surface content regexes. It recomputes
  those patterns against persisted `bodyText` rather than trusting producer
  booleans (`evidence/verify_evidence.mjs:18-107,275-297`).
- Every measurement must have the exact non-empty assertion inventory, no
  duplicate patterns, only `pattern` and `passed` keys, and a true independently
  recomputed match. Optional body-text samples must equal the current body-text
  prefix (`evidence/verify_evidence.mjs:278-300`).
- Theme and locale are measured fields, not filename assumptions. The verifier
  requires dark for every state, `zh-Hans` for production, and `zh-CN` for the
  approved prototype (`evidence/verify_evidence.mjs:243-244`).
- Independent execution of the persistent redteam passed. Its positive
  verifier exited `0`; all 14 isolated mutations exited `1`: theme, locale,
  body text, empty/missing assertions, empty/missing health schema, path,
  route, overflow, source identity, PNG signature, PNG dimension, and run ID.

## Error Handling

- Capture rejects child failure, group-summary failure or run-ID mismatch,
  source-byte drift, incorrect aggregate counts, overflow, raw localization
  keys, failed content probes, and any recorded console/runtime/network/HTTP
  failure.
- Transformed runners wait after SIGTERM, escalate to SIGKILL, wait again, and
  fail if the child still has not exited. The aggregate runner then verifies
  that all three declared ports for each route group are free
  (`evidence/capture_browser.mjs:149-164,239`).
- The verifier requires `health` to be an object with exactly
  `consoleErrors`, `runtimeExceptions`, `networkFailures`, and `httpErrors`.
  Each value must be an array and exactly empty, so missing or empty-schema
  substitutions cannot pass vacuously
  (`evidence/verify_evidence.mjs:301-306`).
- Source identity, exact state/file inventory, route and path, viewport,
  overflow, raw keys, content, health, PNG signature, and PNG dimensions all
  fail through explicit assertions. The redteam demonstrates these paths
  reject corrupted evidence rather than merely documenting intended behavior.

## Reuse / Duplication

- Existing router definitions and 32 route-family component suites are reused;
  no component behavior was copied into the concentrated route test.
- The Mock API extends the existing administration fixture and adds only
  task-019 identity/bootstrap behavior plus the user-token endpoint. It does
  not redefine a production API contract.
- Destination expectations intentionally exist independently in the verifier.
  This oracle duplication is required to detect producer drift. Source-tree
  hashing is likewise recomputed independently rather than trusting the
  producer's summary.
- Runtime transformation remains more coupled than a shared parameterized
  capture library, but exact-one anchors, descriptive failures, postconditions,
  strict output verification, and persistent mutation tests make the current
  task-local reuse boundary fail closed.

## Complexity Delta

- Production runtime complexity is unchanged. The only frontend addition is
  the table-driven 213-line route test.
- Evidence complexity is linear in three reused route groups and 92 states:
  one aggregate producer, one independent verifier, one bounded redteam, one
  Mock API adapter, 92 measurements, and 92 viewport-sized screenshots.
- The largest reasoning cost is runtime runner adaptation. Its transformations
  are centralized in `transformCapture`, exact-match validation is centralized
  in `replaceExactly`, and all generated-code assumptions are checked before
  execution. No speculative production abstraction or dependency was added.
- The approximately 27 MiB evidence directory is proportionate to durable
  desktop/mobile PNG and measurement coverage for 92 exact states and contains
  no duplicate historical run set.

## Acceptance Assertions Verified

- `A2`: verified for task `019` only. Run
  `93ce89f7-0d51-40ba-827e-3731aeea2f96` covers rows `1` and `24-45` on
  production and the approved prototype at dark Simplified Chinese,
  `1600x1000` and `390x844`, with deterministic equivalent data, exact route
  and content oracles, stable source/service identity, zero page overflow, zero
  raw localization keys, and zero browser-health failures. This is not
  complete change-level `A2`; rows `2-23`, `46+`, and later phases are outside
  this review.
- `A3`: verified for task `019` only. Independent execution passed the
  concentrated 2-file/39-test route command, strict 92-state verifier,
  14-mutation redteam, and evidence syntax. Current system-executed receipts
  record focused Vitest `34/173`, full Vitest `85/496`, targeted Prettier,
  zero-warning ESLint, Vue TypeScript, Vite build, JSON/JSONL parsing, bounded
  cleanup, and `git diff --check`. This review does not mark the complete
  change-level assertion successful.

## Required Fixes

- No task-local quality blocker remains after the strict content, health,
  locale/theme, source, route/path, PNG, and runtime-transformation checks were
  independently reproduced.
- Operations rows `46+`, later phases, and complete change-level acceptance
  remain outside this task and must not be closed from this approval.

## Validation Performed

- PASS: independent route-family/router Vitest, 2 files / 39 tests.
- PASS: independent strict verifier, 92 measurements / 92 screenshots for run
  `93ce89f7-0d51-40ba-827e-3731aeea2f96`.
- PASS: independent persistent redteam, positive exit `0` and all 14 mutations
  rejected with exit `1`.
- PASS: independent artifact aggregation: one run ID, 92 dark states, exact
  46 `zh-Hans` / 46 `zh-CN` split, non-empty assertion inventories, exact
  four-key health schemas, zero failed assertions, and zero health entries.
- PASS: evidence JavaScript syntax, Python AST parsing, task test/evidence
  Prettier, and task-scope `git diff --check`.
- PASS from current system-executed receipt: focused `34/173`, full `85/496`,
  zero-warning lint, typecheck, build with only the two existing non-module
  warnings, JSON/JSONL parsing, bounded cleanup, and current-byte capture.
