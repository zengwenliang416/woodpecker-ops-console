# Task Report: 007-pipeline-log-diagnostics

## Status

DONE_WITH_CONCERNS

## Files Changed

- `web/src/components/repo/pipeline/PipelineLog.vue`
- `web/src/components/repo/pipeline/PipelineLog.test.ts`
- `web/src/views/repo/pipeline/PipelineChangedFiles.vue`
- `web/src/views/repo/pipeline/PipelineChangedFiles.test.ts`
- `web/src/views/repo/pipeline/PipelineConfig.vue`
- `web/src/views/repo/pipeline/PipelineConfig.test.ts`
- `web/src/views/repo/pipeline/PipelineErrors.vue`
- `web/src/views/repo/pipeline/PipelineErrors.test.ts`
- `web/src/views/repo/pipeline/PipelineDebug.vue`
- `web/src/views/repo/pipeline/PipelineDebug.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## What Changed

- Added local search, real stderr-only filtering from `line.type === 1`,
  explicit no-match/reset behavior, line wrapping, and visible-line counts over
  the already loaded log buffer.
- Added a latest-request-wins generation/step-slug guard so a completed-log
  response or stream callback from a previously selected step cannot write into
  the current step's buffer.
- Preserved current log retrieval, streaming, download, push-gated deletion,
  grouped commands, line anchors, auto-scroll, fullscreen/mobile close, error
  highlighting, and exit-code behavior.
- Replaced the derived file tree with the complete real
  `pipeline.changed_files` path list, a count, local path filtering, and
  distinct no-files/no-match states. No diff content or line statistics are
  inferred.
- Added historical config file identity, base64-decoded read-only content,
  browser clipboard copy feedback, an explicit empty state, and contained code
  scrolling. The config remains unparsed and uneditable.
- Reorganized real workflow/runtime and pipeline parse/warning errors into
  responsive semantic sections while preserving typed metadata, Markdown,
  documentation links, and an existing changed-files route action. An explicit
  no-error state replaces manufactured analysis.
- Reorganized the existing push-gated debug metadata instructions, metadata
  download, generated filename, version, busy state, success/error feedback,
  object-URL cleanup, and no-permission state into responsive cards. No
  interactive debug session or new endpoint was added.
- Added English and Simplified-Chinese copy for all new controls and empty
  states. `web/src/style/console.css` required no change.

## TDD Evidence

- The original red-run ordering has no replayable `system-executed` receipt and
  is not used as acceptance evidence.
- The final focused suite passes 5 files and 13 tests covering loaded-log
  filtering without refetch, stderr-only semantics, no-match/reset and wrapping,
  push-gated deletion, stale completed-step response rejection, changed-file
  counts/search/empty states, config decode/copy/empty behavior, real
  runtime/parse error rendering, no-error behavior, and debug
  permission/metadata download cleanup.
- The isolated complete frontend suite passes 28 files and 160 tests.

## Verification Commands

- PASS: `pnpm exec vitest run src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.test.ts`
  (5 files, 13 tests).
- PASS: isolated `pnpm test -- --run` (28 files, 160 tests).
- PASS: targeted Prettier for all twelve changed production/test/locale files
  plus unchanged allowed `src/style/console.css`.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the two pre-existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: `git diff --check`.

## Browser Evidence

- PASS: production dark Simplified-Chinese desktop log diagnostics at
  `1600x1000` rendered 9 real loaded lines; stderr-only rendered 2/9 lines.
  Search, no-match, reset, and wrapping changed only local presentation state
  and did not issue another log request.
- PASS: production changed files rendered 4 complete real paths and filtered to
  `1/4`; config rendered the real filename and decoded YAML and copied the
  decoded content through the browser clipboard API.
- PASS: production errors rendered only real runtime/parse data and the existing
  changed-files route action; the empty API state rendered `没有流水线错误`.
- PASS: production push debug called the real metadata endpoint and rendered the
  existing CLI/filename/version contract. The browser automation surface did
  not expose a programmatic Blob download event, while the focused test directly
  verifies endpoint invocation, success notification, and URL cleanup.
- PASS: production read-only state hid Retry, Debug navigation, and log deletion;
  direct Debug navigation rendered the shared permission state.
- PASS: production log, changed-files, config, errors, and debug remained at
  `body.scrollWidth = 390` under the `390x844` viewport in dark Simplified
  Chinese and representative light English. The mobile debug CLI block uses
  internal horizontal scrolling.
- PASS: approved-prototype log, changed-files, config, errors, and debug routes
  were compared at `1600x1000` and attested `390x844` viewports. The standalone
  screenshot API produced full-page mobile captures at `380px` content width;
  the explicit browser viewport receipt is the responsive evidence.
- Screenshots are under
  `/tmp/woodpecker-ui-review/007-pipeline-log-diagnostics/`. Files use `.png`
  names but contain browser-returned JPEG data; production captures are true
  `1600x1000` or `390x844`.

## Concerns

- The first complete-suite run was executed concurrently with lint, typecheck,
  and build. `src/router.test.ts` timed out after 5 seconds while the other 158
  tests passed. Isolated reruns passed all 159 pre-review tests and all 160
  post-review tests; the later system-executed receipts formally overturn that
  resource-contention result.
- Independent review found that a late completed-step log response could append
  into a newly selected step. The final implementation adds generation/slug
  guards to completed responses and stream callbacks plus a deferred-promise
  regression test that resolves the old request last.
- Vite build retains the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.
- Browser screenshots remain temporary evidence. The replayable validation
  receipt and later six-domain verification are the durable acceptance
  surfaces.
- Prototype-only changed-file diff/line statistics, config validity/formatting/
  analysis, remediation and previous-success analysis, interactive Debug
  sessions, environment inventory, artifacts, annotations, image, agent, and
  resource fixtures are deliberately absent because current production
  contracts do not provide them.

## Scope Deviations

- None. No router, API client, store, authentication, permission calculation,
  backend, persistence, dependency, pipeline header/overview, approved
  prototype, or console stylesheet changed.

## Follow-up Needed

- Task `3.4` remains responsible for any pipeline status/router/action/tab
  coverage beyond the focused route-body tests in this slice.
- Task `3.5` remains responsible for the baseline task's consolidated pipeline
  validation and durable evidence handoff.

## Adjudication

Task `3.3` may close after independent spec and quality review. Acceptance
assertions `A2`, `A3`, and `A4` may be verified only for the five diagnostic
surfaces in this slice: prototype-equivalent hierarchy over real data,
responsive containment, current route/API/permission behavior, and explicit
unsupported-data fallbacks. This does not complete tasks `3.4`, `3.5`, the
entire pipeline route family, or the global acceptance assertions.
