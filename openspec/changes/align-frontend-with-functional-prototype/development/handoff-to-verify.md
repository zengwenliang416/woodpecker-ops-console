# Development Handoff To Verify: align-frontend-with-functional-prototype

## Implemented Slices

- `001-date-duration-integrity` / baseline task `2.1`: shared date and elapsed
  time boundaries now render invalid, missing, negative, non-finite, unsafe, and
  overflow values as explicit neutral fallbacks.
- `002-shared-shell-alignment` / baseline task `2.2`: approved desktop/mobile
  shell geometry, preference behavior, permission-aware navigation, truthful
  unavailable search feedback, locale discovery filtering, and accessible
  drawer lifecycle are implemented.
- `003-shared-feedback-primitives` / baseline task `2.3`: accessible shared
  loading, empty, error, disabled, permission, and stale feedback plus safe
  busy/disabled navigation behavior are implemented in representative
  repository and pipeline consumers.
- `004-shell-theme-evidence` / baseline task `2.4`: current production and
  approved-prototype shared shells passed equivalent dark/light desktop and
  attested 390px mobile review without requiring a production change.
- This is an incremental development snapshot, not a verification handoff.
  Tasks `3.1` through `8.4` remain incomplete.

## Files Changed

- Shared formatting: `web/src/compositions/useDate.ts`,
  `web/src/compositions/useElapsedTime.ts`, and focused tests.
- Shared shell: `web/src/App.vue`, `web/src/components/layout/header/Sidebar.vue`,
  `web/src/components/layout/header/Navbar.vue`, English/Simplified-Chinese
  locales, Vite locale discovery, and focused tests.
- Shared feedback: `web/src/components/atomic/FeedbackState.vue`,
  `Button.vue`, `IconButton.vue`, `Error.vue`, representative repository and
  pipeline consumers, English/Simplified-Chinese locales, and focused tests.
- Slice `004` changed no file under `web/`; its diff is limited to SpecNav and
  CodeGraph evidence/lifecycle artifacts.
- Exact task-owned file lists are recorded in
  `development/tasks/001-date-duration-integrity/report.md`,
  `development/tasks/002-shared-shell-alignment/report.md`,
  `development/tasks/003-shared-feedback-primitives/report.md`, and
  `development/tasks/004-shell-theme-evidence/report.md`.

## Requirements Covered

- `A4` is covered for shared date/duration formatting by slice `001`.
- `A2` and `A3` were independently verified for the implemented shared-shell
  behavior in slice `002`.
- `A3` was independently verified for shared feedback slice `003` and the
  evidence-only shell/theme gate in slice `004`.
- Slice `004` records only the shared-shell prerequisite for future `A2`
  route-family verification. It does not mark any route family complete.
- `A1`, full route-family `A2`, and full-change `A3`/`A4` remain open until the
  remaining development and parity-matrix work is complete.

## Prototype Decisions Implemented

- The approved prototype remains a product-state reference only; production
  continues to use real APIs, stores, permissions, routing, and mutations.
- The shared shell uses the approved `248px` sidebar, `64px` topbar, `17px`
  brand label, `40px` navigation rows, dark/light themes, desktop/mobile
  hierarchy, and accessible mobile drawer behavior.
- Shared feedback states use compact/full presentation and semantic status
  behavior without introducing a generic application state machine.
- Desktop/mobile comparisons normalize theme, locale, viewport, administrator
  permission, and populated-data state instead of copying prototype fixtures.

## Components Created / Reused / Extracted

- Created: display-only `FeedbackState` with loading, empty, error, disabled,
  permission, and stale variants.
- Reused and repaired: `App`, `Sidebar`, `Navbar`, `Button`, `IconButton`,
  `Error`, `PrototypeIcon`, `useTheme`, `useDate`, `useElapsedTime`, Vue i18n,
  Vue Router, pagination, authentication, permission, repository, and
  configuration seams.
- Extracted: no new extraction was required after shared feedback ownership was
  established; slice `004` intentionally added no duplicate shell or theme
  component.

## API / Data Flow Changes

- No backend, API payload, store, router, authentication, permission
  calculation, persistence, migration, or dependency contract changed in
  slices `001` through `004`.
- Existing theme and locale preference flows, repository/API truth, pagination,
  injected permissions, and repository identity-conflict data remain the
  authoritative state sources.

## Tests Added

- Focused date/duration boundary tests cover invalid, missing, zero-epoch,
  negative, non-finite, unsafe, and overflow values.
- Shared-shell tests cover geometry contracts, drawer ARIA/backdrop/inert/focus/
  scroll lifecycle, permission visibility, localized search feedback, theme and
  locale behavior, and safe locale discovery.
- Shared-feedback tests cover all variants, live-region semantics, busy and
  disabled route/HTTP/external controls, submit-type preservation, repository
  branch states, pipeline permission state, and repository stale conflicts.
- The current full frontend regression baseline is 22 test files and 112 tests.

## Local Validation

- PASS: current focused shell suite, 4 files and 16 tests.
- PASS: current complete frontend suite, 22 files and 112 tests.
- PASS: ESLint, TypeScript, Vite build, and `git diff --check`.
- PASS: slice-owned targeted Prettier checks. For slice `004`, all 11
  non-baseline allowed shell files pass and `web/` has zero diff.
- PASS: targeted desktop and 390px browser evidence for completed slices,
  including theme, locale, responsive overflow, drawer lifecycle, feedback
  states, long copy, and busy/disabled controls.
- Detailed replayable receipts are in `development/validation-log.jsonl`.

## Known Risks

- Twenty-eight baseline tasks remain incomplete, including every route-family
  implementation and full six-domain verification task. Global prototype
  parity must not be claimed.
- The unchanged `web/src/style.css` has a pre-existing Prettier mismatch.
  Slice `004` records the original failure plus a contract-accepted,
  task-scoped zero-diff adjudication; this is not evidence that the file is
  formatted.
- Vite build retains the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.
- Slice `004` prototype mobile rendering used an attested `390x844` viewport,
  while the standalone screenshot API cropped temporary PNG content to
  `380x822`. The crop is disclosed and the PNG alone is not treated as viewport
  proof.
- Temporary browser screenshots are not durable change artifacts; replayable
  system-executed receipts and future six-domain evidence must carry the final
  verification burden.

## Items Requiring Six-Domain Verification

- Do not begin final six-domain verification yet.
- After tasks `3.1` through `8.1` are complete, verify all 67 parity-matrix
  route/tab rows across equivalent theme, locale, viewport, permission, and
  data states.
- Re-run facticity, static, unit, redteam, E2E, and sensory verification for
  every assertion and completed route family.
- Confirm real APIs and mutations, permission boundaries, data integrity,
  accessibility, internationalization, responsive containment, and dark/light
  semantic token behavior.
- Produce the final HTML report only after remaining incomplete or blocked
  routes are explicitly resolved or retained as open findings.
