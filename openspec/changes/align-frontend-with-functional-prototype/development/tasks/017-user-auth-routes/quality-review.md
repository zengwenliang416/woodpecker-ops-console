# Quality Review: 017-user-auth-routes

## Verdict

approved

The superseding current-byte review found no remaining quality blocker. The
previous CLI callback ownership, OAuth error-link safety, and regression
coverage findings are closed by the implementation and focused tests.

## Separation Of Concerns

- Personal navigation, preferences, organization-backed personal resources,
  token management, login providers, CLI callback authorization, and
  not-found recovery remain separated by route.
- CLI callback destination ownership is now local to `Auth.vue`. The component
  derives and validates the reactive port, captures an immutable
  `callbackPort` when authorization begins, and invalidates active work when
  the query owner changes (`web/src/views/cli/Auth.vue:72-123`).
- Login query presentation remains separate from Forge loading and
  authentication. URL classification is a small computed presentation
  boundary rather than a new authentication or routing concern
  (`web/src/views/Login.vue:117-136`).

## Component Cohesion / Coupling

- `UserWrapper` and `UserSettingsNav` remain cohesive around the responsive
  personal-settings hierarchy, feature-gated Agent destination, and logout.
  Route pages do not depend on navigation rendering details.
- Secrets and Registries retain confirmed rows, editor ownership, mutation
  lifecycle, and notifications within their resource routes. `UserAgents`
  adapts the authenticated organization identity to the shared
  `AgentManager`.
- CLI authorization now has a coherent state machine: port changes synchronously
  reset `confirm` or `invalid`, clear stale failure text, and advance the same
  generation used to guard token and callback completions
  (`web/src/views/cli/Auth.vue:81-128`).

## Test Quality

- The independently executed focused suite passes 11 files and 45 tests.
- New real-router regressions keep requests pending while changing callback
  ownership from port A to B, from valid to invalid, and from invalid to valid.
  They prove obsolete token or callback completions cannot post to or overwrite
  the successor state (`web/src/views/cli/Auth.test.ts:160-214`).
- Login tests verify a valid absolute HTTPS link and reject malformed,
  `javascript:`, and `data:` values without hiding the OAuth error text
  (`web/src/views/Login.test.ts:75-98`).
- Existing coverage still exercises route metadata, responsive containment,
  resource/editor lifecycle ownership, token failure behavior, duplicate
  actions, unmount invalidation, disabled Agents, and not-found recovery.

## Error Handling

- CLI ports remain strict decimal TCP ports `1-65535`. Both token retrieval and
  callback publication are generation-gated, and only an OK callback with JSON
  `{ "ok": "true" }` can publish success (`web/src/views/cli/Auth.vue:76-111`).
- Every valid or invalid query-owner transition invalidates pending work; an
  obsolete completion cannot publish success, denial, or failure into the new
  owner state (`web/src/views/cli/Auth.vue:114-128`).
- OAuth `error_uri` becomes clickable only after `new URL()` succeeds and the
  protocol is exactly `http:` or `https:`. Malformed and disallowed schemes
  remain inert (`web/src/views/Login.vue:126-136`).
- Resource and token failures preserve confirmed values and active editor
  ownership; no swallowed exception or misleading success path was found.

## Reuse / Duplication

- The task reuses existing `Scaffold`, `FeedbackState`, Settings primitives,
  form components, pagination/authentication/theme/config compositions, and
  `AgentManager` rather than introducing task-specific frameworks.
- Secrets and Registries repeat a bounded confirmed-row/editor-generation
  pattern, but their API identities and mutation effects differ sufficiently
  that extracting a generic CRUD layer would increase coupling in this slice.
- Callback lifecycle logic correctly remains local to `Auth.vue`; no shared
  callback abstraction is warranted.

## Complexity Delta

- Complexity remains partitioned by route. The largest reviewed production
  component is `Login.vue` at 255 lines, followed by `UserSecrets.vue` at 250
  lines and `UserRegistries.vue` at 246 lines; no reviewed component approaches
  the 800-line organization warning threshold.
- The generation-based lifecycle guards add necessary concurrency state but
  use consistent naming and early returns. Capturing `callbackPort` removes the
  prior temporal coupling to the live route query.
- No excessive nesting, dead imports, broad type escape, debug output, or
  speculative abstraction was found in the reviewed task scope.

## Acceptance Assertions Verified

- `A3`: verified for task `017` only. The focused suite passes 11 files / 45
  tests. The current system-executed receipt records full Vitest at 84 files /
  462 tests, correctly rooted task/evidence Prettier, zero-warning ESLint,
  Vue TypeScript, Vite build, syntax/JSON/JSONL checks, and diff checks. Browser
  run `6e59b655-c195-4474-8ac2-f0cda499de43` verifies 32 task-local
  production/prototype states at desktop and 390px.
- `A4`: verified for task `017` only. Current resource, editor, token, login,
  and CLI async completions are bound to active lifecycle or query ownership,
  and focused regressions prove obsolete callback-owner completions remain
  inert.
- Rows `1` and `39-45` remain `in-progress`; baseline tasks `5.4` and `5.5`
  remain open.

## Required Fixes

- No task-local fix remains. The final current-byte implementation closes the
  callback-owner, OAuth-link, lifecycle, and evidence-format findings; later
  route-family and change-wide verification remain outside this review.

## Validation Performed

- PASS: independent focused task Vitest, 11 files and 45 tests.
- PASS: independent Vite build; output contains only the existing non-module
  warnings for `/web-config.js` and `/assets/custom.js` plus plugin timing
  diagnostics.
- PASS: task-scope `git diff --check`.
- PASS: current system-executed validation receipt for full Vitest (84 files /
  462 tests), targeted Prettier, zero-warning lint, typecheck, build, evidence
  syntax, JSON/JSONL, and diff checks.
- PASS: evidence summary run
  `6e59b655-c195-4474-8ac2-f0cda499de43`, with zero failed states, 32
  measurement JSON files, and 32 PNG files for rows `1` and `39-45`.
- NOTE: one parallel independent full-suite/lint/typecheck/Prettier rerun
  encountered transient macOS volume read error `-70` for
  `Auth.test.ts`. Five subsequent reads returned the stable 7,982-byte file
  with identical SHA-256, and the focused suite had already passed against
  those current bytes; this is an environment read failure, not a code
  finding.
- BLOCKED outside this quality verdict: the installed SpecNav development
  contract `0.3.0` still reports change-wide task-graph/context ownership,
  missing Verification 2.0 runtime status, and validation-ledger blockers.
  No lifecycle artifact was modified by this reviewer.
