# Task Report: 006-pipeline-overview

## Status

DONE_WITH_CONCERNS

## Files Changed

- `web/src/views/repo/pipeline/Pipeline.vue`
- `web/src/views/repo/pipeline/Pipeline.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## What Changed

- Replaced the desktop-width implicit first-step log selection with an explicit
  default execution overview when the route has no `stepId`.
- Added a real workflow/step summary from `Pipeline.workflows`, including
  workflow count, step count, terminal-step progress, pipeline duration,
  translated step status, step duration, and workflow environment badges.
- Added an explicit `Not reported` / `未报告` image state because neither the
  persisted server `Step` nor the frontend `PipelineStep` contract exposes an
  execution image. Existing historical pipeline configuration availability
  only controls a link to the current config route; configuration data is not
  parsed or reinterpreted.
- Preserved the existing `PipelineStepList` and `PipelineLog` route contract.
  Selecting a real step continues to set the existing `stepId` route parameter.
- Preserved parse/runtime error precedence, blocked approval/decline intent,
  declined state, repository push permission, and the detail-header actions
  owned by task `3.1`.
- Added a single no-workflow empty state and guarded the previous
  `workflows[0].children` access so an empty workflow list cannot crash.
- Contained the dense step table inside its own horizontal scroll region and
  added the required central flex-item `min-w-0` boundary for `390px` layouts.
- Added English and Simplified-Chinese copy for the overview, columns,
  environment/image fallbacks, configuration entry, and log entry.

## TDD Evidence

- The original red-run ordering has no replayable `system-executed` receipt and
  is not used as acceptance evidence.
- The completed focused suite passes 1 file and 8 tests covering the default
  overview, real workflow/status/duration/environment context, explicit image
  availability, configuration entry, log routing, empty workflows, error
  precedence, blocked approval/decline APIs, and read-only permission.
- The complete frontend suite passes 24 files and 149 tests.

## Verification Commands

- PASS: `pnpm exec vitest run src/views/repo/pipeline/Pipeline.test.ts`
  (1 file, 8 tests).
- PASS: `pnpm test -- --run` (24 files, 149 tests).
- PASS: `pnpm exec prettier --check src/views/repo/pipeline/Pipeline.vue src/views/repo/pipeline/Pipeline.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the two pre-existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: `git diff --check`.

## Browser Evidence

- PASS: production populated overview in dark Simplified Chinese at
  `1600x1000` rendered the real pipeline/workflow summary and four real steps
  without opening a step log by default.
- PASS: production populated overview in dark Simplified Chinese and
  representative light English at `390x844` retained a `390px` body, `358px`
  overview, and `356px` table viewport; the `784px` table scroll width remained
  contained inside the table region instead of causing page-level overflow.
- PASS: the final mobile row rendered the explicit `未报告环境`, `未报告`, `—`,
  and `查看日志` fallbacks/action with no raw i18n key.
- PASS: selecting `查看日志` continued to route to
  `/repos/101/pipeline/842/11` and render the existing mobile log surface.
- PASS: read-only production state hid Retry and Debug while preserving the
  readable execution overview.
- PASS: the approved prototype was compared at attested desktop and `390x844`
  mobile viewports. Its standalone screenshot API cropped the saved PNGs to
  `1590x994` and `380x822`; the browser viewport receipt, not the crop, is the
  responsive evidence.
- Screenshots are under
  `/tmp/woodpecker-ui-review/006-pipeline-overview/`, including
  `production-desktop-dark-zh.png`, `production-mobile-dark-zh.png`,
  `production-mobile-light-en.png`, `production-mobile-log-dark-zh.png`,
  `prototype-desktop-dark-zh.png`, and `prototype-mobile-dark-zh.png`.

## Concerns

- Vite build retains the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.
- The executor image is unavailable in the current persisted/API step contract.
  This slice deliberately renders an explicit fallback instead of parsing
  arbitrary YAML, adding a dependency, changing the backend contract, or
  inventing prototype fixture data.
- Browser screenshots are temporary evidence. The replayable validation receipt
  and later six-domain verification remain the durable acceptance surfaces.
- The original red-run ordering is not replayable and is excluded from the
  acceptance claim; current focused coverage and system-executed regression
  receipts are authoritative.
- Task `3.3` still owns the log console controls and the changed-files,
  configuration, error-analysis, and debug route bodies.

## Scope Deviations

- None. No router, API client, store, authentication, permission calculation,
  backend, persistence, dependency, or approved prototype file changed.
- Prototype-only queue time, CPU/resource consumption, agent name, image,
  start time, release, annotation, artifact, and graph fixtures were not copied.

## Follow-up Needed

- Implement task `3.3` as a separate vertical slice for the existing log,
  changed-files, configuration, error-analysis, and debug route bodies.
- Keep task `3.4` focused on any remaining pipeline route/component coverage
  after the route bodies are aligned.

## Adjudication

Task `3.2` may close after independent spec and quality review. Acceptance
assertions `A2`, `A3`, and `A4` may be verified only for this execution-overview
slice: real pipeline data, current route/API/permission behavior, responsive
containment, and explicit unavailable-data semantics. This does not complete
the full pipeline route family or any task from `3.3` onward.
