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
- `005-pipeline-detail-header` / baseline task `3.1`: the real pipeline detail
  header now exposes the approved repository/pipeline hierarchy, translated
  status and execution metadata, real cancel/retry/deploy behavior, and
  permission-aware navigation to existing overview, changed-files, config,
  errors, and debug routes.
- `006-pipeline-overview` / baseline task `3.2`: the real pipeline route now
  defaults to a responsive execution overview derived from current workflows
  and steps, with workflow/step counts, terminal progress, translated status,
  duration, environment, explicit image unavailability, and current step-log
  routing while preserving error, approval, decline, and permission behavior.
- This is an incremental development snapshot, not a verification handoff.
  Tasks `3.3` through `8.4` remain incomplete.

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
- Pipeline detail header: `web/src/views/repo/pipeline/PipelineWrapper.vue`,
  its focused component test, and English/Simplified-Chinese locales.
- Pipeline execution overview: `web/src/views/repo/pipeline/Pipeline.vue`, its
  focused component test, and English/Simplified-Chinese locales.
- Exact task-owned file lists are recorded in
  `development/tasks/001-date-duration-integrity/report.md`,
  `development/tasks/002-shared-shell-alignment/report.md`,
  `development/tasks/003-shared-feedback-primitives/report.md`, and
  `development/tasks/004-shell-theme-evidence/report.md`, and
  `development/tasks/005-pipeline-detail-header/report.md`, and
  `development/tasks/006-pipeline-overview/report.md`.

## Requirements Covered

- `A4` is covered for shared date/duration formatting by slice `001`.
- `A2` and `A3` were independently verified for the implemented shared-shell
  behavior in slice `002`.
- `A3` was independently verified for shared feedback slice `003` and the
  evidence-only shell/theme gate in slice `004`.
- Slice `004` records only the shared-shell prerequisite for future `A2`
  route-family verification. It does not mark any route family complete.
- `A2` and `A3` were independently verified for the completed pipeline detail
  header slice `005`; that review did not cover the pipeline overview body,
  logs, or detailed tab bodies assigned to the following pipeline tasks.
- `A2`, `A3`, and `A4` were independently verified for the completed pipeline
  execution overview slice `006`; this covers only real workflow/step summary,
  unavailable-data fallbacks, current step-log entry, and responsive
  containment, not task `3.3` log controls or remaining route bodies.
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
- Pipeline detail uses the approved `repository / Pipeline` eyebrow, translated
  icon-plus-text status, real commit context, responsive actions, and existing
  production route destinations without copying prototype fixtures.
- Pipeline overview uses current workflows, steps, status, duration, and
  environment data; unsupported executor image, queue, resource, agent,
  release, annotation, artifact, graph, and start-clock fixtures are not
  invented.
- Desktop/mobile comparisons normalize theme, locale, viewport, administrator
  permission, and populated-data state instead of copying prototype fixtures.

## Components Created / Reused / Extracted

- Created: display-only `FeedbackState` with loading, empty, error, disabled,
  permission, and stale variants.
- Reused and repaired: `App`, `Sidebar`, `Navbar`, `Button`, `IconButton`,
  `Error`, `PrototypeIcon`, `useTheme`, `useDate`, `useElapsedTime`, Vue i18n,
  Vue Router, pagination, authentication, permission, repository, and
  configuration seams.
- Reused for pipeline detail: `Scaffold`, `Tab`, `PipelineStatusIcon`,
  `RenderMarkdown`, `DeployPipelinePopup`, `usePipeline`, `useAsyncAction`,
  pipeline/application stores, repository injection, and current API/router
  actions.
- Reused for the execution overview: `PipelineStepList`, `PipelineLog`,
  `PipelineStatusIcon`, `PipelineStepDuration`, `Badge`, `Panel`, `Button`,
  `usePipeline`, pipeline/config injection, Vue i18n, and current step routing.
- Extracted: no new extraction was required after shared feedback ownership was
  established; slice `004` intentionally added no duplicate shell or theme
  component, and slice `006` has no second consumer with the same
  workflow/environment/image/log contract.

## API / Data Flow Changes

- No backend, API payload, store, router, authentication, permission
  calculation, persistence, migration, or dependency contract changed in
  slices `001` through `006`.
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
- Pipeline-header tests cover the approved eyebrow, all 11 pipeline statuses,
  all 9 webhook events, pending and terminal action boundaries, retry busy
  semantics, both deploy paths, deploy-disabled state, permissions, and tabs.
- Pipeline-overview tests cover default overview state, real summary/context,
  explicit image availability and config entry, selected-step routing, empty
  workflows, error precedence, blocked approval/decline APIs, and read-only
  permission.
- The current full frontend regression baseline is 24 test files and 149 tests.

## Local Validation

- PASS: current pipeline-overview focused suite, 1 file and 8 tests.
- PASS: current complete frontend suite, 24 files and 149 tests.
- PASS: ESLint, TypeScript, Vite build, and `git diff --check`.
- PASS: slice-owned targeted Prettier checks. For slice `004`, all 11
  non-baseline allowed shell files pass and `web/` has zero diff.
- PASS: targeted desktop and 390px browser evidence for completed slices,
  including theme, locale, responsive overflow, drawer lifecycle, feedback
  states, long copy, busy/disabled controls, pipeline metadata, action/tab
  permission boundaries, execution overview and selected log states, explicit
  unavailable-data fallbacks, internal table scrolling, and equivalent
  dark Simplified-Chinese production/prototype comparison.
- Detailed replayable receipts are in `development/validation-log.jsonl`.

## Known Risks

- Twenty-six baseline tasks remain incomplete, including the pipeline log and
  remaining route bodies, remaining route-family implementation, and full
  six-domain verification tasks. Global prototype
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
- The standalone prototype screenshot API cropped the attested `1600x1000` and
  `390x844` viewports to `1590x994` and `380x822`; production screenshots retain
  the requested dimensions and the viewport receipt discloses the prototype
  crop.
- The current persisted/API step contract does not expose executor image data.
  Slice `006` reports this explicitly and does not parse arbitrary YAML or
  infer prototype fixture values.

## Items Requiring Six-Domain Verification

- Do not begin final six-domain verification yet.
- After tasks `3.3` through `8.1` are complete, verify all 67 parity-matrix
  route/tab rows across equivalent theme, locale, viewport, permission, and
  data states.
- Re-run facticity, static, unit, redteam, E2E, and sensory verification for
  every assertion and completed route family.
- Confirm real APIs and mutations, permission boundaries, data integrity,
  accessibility, internationalization, responsive containment, and dark/light
  semantic token behavior.
- Produce the final HTML report only after remaining incomplete or blocked
  routes are explicitly resolved or retained as open findings.
