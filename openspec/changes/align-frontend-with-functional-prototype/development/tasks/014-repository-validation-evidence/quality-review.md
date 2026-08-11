# Quality Review: 014-repository-validation-evidence

## Verdict

approved

## Separation Of Concerns

- The evidence implementation remains task-local. Independent inspection found
  no `web/` or approved-prototype worktree change from
  `c416ce346110b4b2315c995e2302797ea5ee9f0c`; production routes, stores, API
  clients, permissions, locales, dependencies, and prototype sources are not
  modified by this task.
- The initial service-provenance blocker is closed. `startOwnedService()`
  rejects a responsive process already occupying any evidence URL before
  starting the task process (`capture_browser.mjs:330-353`). Production,
  prototype, and Mock API services are therefore owned by the capture run
  rather than silently reused.
- Service identity now binds the run to the current production and prototype
  Git trees, clean protected worktree state, exact served prototype
  `index.html`, prototype SHA-256, direct/proxied repository identity, and the
  Mock API run ID (`capture_browser.mjs:375-444`).

## Component Cohesion / Coupling

- `mock_api.py`, `mock_api_smoke.mjs`, `capture_browser.mjs`, and
  `verify_evidence.mjs` retain focused fixture, smoke, capture, and independent
  oracle responsibilities. No evidence helper has become a production
  abstraction.
- The initial resume/manifest coupling blocker is closed. Resume and
  forced-state paths have been removed; the final runner executes
  `captureState()` for every one of the `100` states
  (`capture_browser.mjs:947-951`).
- Run `1082fba7-576e-4c0f-8f72-fb8beca08df0` is recorded in every measurement,
  the Mock API identity, service identity, replay summary, and manifest. The
  verifier independently requires that correspondence and rejects mixed-run
  measurements (`verify_evidence.mjs:323,484-485,527`).
- Capture and verification intentionally retain separate 21-destination
  tables. This is appropriate independent-oracle duplication: the verifier
  derives rows `3-23`, `84` primary states, `16` secondary states, and the
  exact `100`-pair matrix without trusting capture-produced counts.

## Test Quality

- Independent execution of `node evidence/verify_evidence.mjs` passed the
  current bytes: run ID matched, `100` states were present (`58` production and
  `42` prototype), rows `3` and `5-23` verified, row `4` remained honestly
  blocked, and no page-overflow, raw-i18n, browser-error, or checksum state was
  reported.
- Independent execution of `node evidence/mock_api_smoke.mjs` passed
  repository list/detail, pipelines, branches, pull requests, settings
  resources, and read-only/administrator permission switching.
- `node --check` passed all three MJS files. Python AST parsing passed
  `mock_api.py`. Project Prettier passed all three MJS files; the project has no
  Prettier parser for Python, so Python formatting was not claimed.
- The exact inventory assertion covers the six support files plus exactly
  `100` measurement JSON files and `100` PNG files
  (`verify_evidence.mjs:233-270`). It also validates PNG signatures and
  dimensions, URL and live terminal route, viewport, theme, locale,
  permission, required content, overflow ownership, raw keys, and browser
  health for each state.
- Independent redteam execution confirmed that an occupied production port
  exits capture with code `1`. Separate temporary-copy redteams confirmed that
  an unexpected evidence subdirectory and a single mismatched measurement run
  ID both exit verification with code `1`.

## Error Handling

- Browser capture retains console errors, runtime exceptions, failed network
  requests, HTTP responses at or above `400`, and non-stream requests still
  pending after the settle deadline. All contribute to `errorCount`, while the
  verifier requires empty blocking-error collections.
- The initial warning-adjudication finding is closed. Each measurement stores
  independently recomputable categories; manifest and summary aggregate them;
  the verifier recomputes correspondence and requires `other: 0`
  (`verify_evidence.mjs:295-309,343-356,472-507`). Current counts are `8900`
  vue-i18n, `24` Vue extraneous-prop, and `60` Vue Router deprecation warnings.
  Their later cleanup remains task `7.1` work and is not a task `014` blocker.
- Measurement PNG/JSON files, replay summary, and manifest use temporary
  same-directory files followed by rename
  (`capture_browser.mjs:365-373,831-834,985-986`). A shared run ID plus strict
  inventory and checksum verification makes an interrupted or mixed summary /
  manifest update fail closed.
- Child processes receive bounded SIGTERM and SIGKILL cleanup. The occupied
  port redteam also demonstrated that a partially started Mock API is cleaned
  up when a later owned-service gate fails.

## Reuse / Duplication

- The Mock API reuses the task `009` pipeline fixture and task `012` repository
  settings fixture, with both dependency files checksum-bound in service
  identity. Existing Vite proxy, production routes/stores, CDP, and standard
  Node/Python libraries are reused without a new runtime dependency.
- Mirrored destination and checksum logic is limited to producer-versus-oracle
  validation and is justified by the need to detect producer drift. Sharing
  those expectations would weaken the independent evidence check.
- The initial unmanaged-artifact finding is closed:
  `evidence/__pycache__` is absent, the current evidence directory contains no
  subdirectory, and the verifier rejects any unexpected file or directory
  before accepting measurements.

## Complexity Delta

- Production runtime complexity remains unchanged. The evidence harness is
  large but proportionate to the required matrix: one deterministic fixture,
  one capture lifecycle, one independent verifier, `100` measurements, and
  `100` viewport-matched screenshots.
- The evidence directory remains approximately `29 MiB` on disk. This is
  reasonable for durable desktop/mobile screenshots and detailed browser
  health records across `100` states; no duplicate historical capture set or
  generated cache directory remains.
- Removing resume reduces lifecycle state and removes the most difficult
  correctness branch. Exclusive service ownership, one run identifier, atomic
  replacement, exact inventory, and protected-tree hashes now form a linear,
  fail-closed provenance model.

## Required Fixes

None. The initial resume provenance, pre-existing service reuse, warning
classification, non-atomic artifact replacement, and unmanaged
`__pycache__`/inventory findings are closed in the current bytes.
