# Task Report: 005-pipeline-detail-header

## Status

DONE_WITH_CONCERNS

## Files Changed

- `web/src/views/repo/pipeline/PipelineWrapper.vue`
- `web/src/views/repo/pipeline/PipelineWrapper.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## What Changed

- Rebuilt the real pipeline detail header around the approved hierarchy:
  repository/pipeline eyebrow, pipeline number, translated icon-plus-text
  status, commit message, branch/ref, trigger event, author, short commit,
  created time, and duration.
- Preserved the existing API, store, router, permission, and deploy seams.
  Cancel remains limited to pending/running pipelines with push permission.
  Retry still calls `restartPipeline(..., { fork: true })` and routes to the
  returned pipeline number.
- Preserved both deployment paths: a real release mapping routes to
  `/deployments/new`, while pipelines without a release retain the existing
  deploy popup fallback.
- Aligned the existing production destinations to Overview, Changed files,
  Config, Errors, and permission-gated Debug. Changed files and Errors remain
  reachable when their current counts are zero.
- Added English and Simplified-Chinese copy for the visible retry, overview,
  and metadata vocabulary.

## TDD Evidence

- The original red-run ordering has no replayable `system-executed` receipt and
  is not used as acceptance evidence.
- The completed focused suite passes 1 file and 29 tests covering the required
  repository/pipeline eyebrow, every current `PipelineStatus`, every current
  `WebhookEvents` value, real metadata, pending Cancel, terminal Retry,
  retry busy semantics, release-backed deploy routing, deploy-disabled state,
  legacy deploy popup fallback, read-only permission behavior, blocked
  mutation behavior, and tab registration.
- The complete frontend suite passes 23 files and 141 tests.

## Verification Commands

- PASS: `pnpm exec vitest run src/views/repo/pipeline/PipelineWrapper.test.ts`
  (1 file, 29 tests).
- PASS: `pnpm test -- --run` (23 files, 141 tests).
- PASS: `pnpm exec prettier --check src/views/repo/pipeline/PipelineWrapper.vue src/views/repo/pipeline/PipelineWrapper.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the two pre-existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: `git diff --check`.

## Browser Evidence

- PASS: production and approved prototype were compared in dark Simplified
  Chinese with authenticated administrator/push permission and the equivalent
  `backend-api`, pipeline `#842`, failure, `main`, push, `alice`, commit, and
  message data semantics. Production uses `lang=zh-Hans`; the approved
  prototype uses `lang=zh-CN`. Both report `data-theme=dark`, computed body
  background `rgb(8, 16, 23)`, and text `rgb(237, 245, 247)`.
- PASS: production push-permission state at `1600x1000` rendered
  `backend-api / 流水线`, pipeline `#842`, translated failure status, the real
  commit message, all six metadata values, Retry, and all five real route tabs
  with no page-level horizontal overflow (`1600/1600`).
- PASS: production push-permission state at `390x844` retained the complete
  header and metadata, exposed Retry, kept responsive route navigation
  available through the existing tab overflow behavior, and had no page-level
  horizontal overflow (`390/390`).
- PASS: production read-only state at `1600x1000` hid Cancel, Retry, Deploy,
  and Debug while preserving Overview, Changed files, Config, and Errors; no
  page-level horizontal overflow was present.
- PASS: production read-only state at `390x844` retained the same permission
  boundary and had no page-level horizontal overflow (`390/390`).
- PASS: the approved prototype route was rendered at an attested `1600x1000`
  and `390x844` browser viewport for hierarchy and responsive comparison. The
  standalone page screenshot API cropped those images to `1590x994` and
  `380x822`; the requested browser viewports are established by the
  system-executed receipt rather than inferred from the cropped PNGs. Its step
  overview, log, execution summary, and detailed panels remain owned by tasks
  `3.2` and `3.3` and are not claimed by this slice.
- Production screenshots:
  `/tmp/woodpecker-pipeline-005-push-desktop-1600x1000.png`,
  `/tmp/woodpecker-pipeline-005-push-mobile-390x844.png`,
  `/tmp/woodpecker-pipeline-005-readonly-desktop-1600x1000.png`, and
  `/tmp/woodpecker-pipeline-005-readonly-mobile-390x844.png`.
- Approved-prototype screenshots:
  `/tmp/woodpecker-pipeline-005-prototype-desktop-1600x1000.png` and
  `/tmp/woodpecker-pipeline-005-prototype-mobile-390x844.png`.

## Concerns

- Vite build retains the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.
- Browser screenshots are temporary evidence. The replayable validation
  receipt and later six-domain verification remain the durable acceptance
  surfaces.
- The original red-run ordering is not replayable and is excluded from the
  acceptance claim; current focused coverage and system-executed regression
  receipts are authoritative.
- Tasks `3.2` and `3.3` still own the pipeline overview body, logs, detailed
  tab bodies, and diagnostic presentation. This slice must not be used to
  claim the complete pipeline route family is aligned.

## Scope Deviations

- None. No router, API client, store, authentication, repository permission
  calculation, backend, persistence, migration, dependency, or prototype file
  changed.

## Follow-up Needed

- Implement task `3.2` as a separate vertical slice using real workflow,
  pipeline, approval, restart, cancel, and deploy behavior.
- Implement task `3.3` separately for the log and remaining route-tab bodies.

## Adjudication

Task `3.1` may close after independent spec and quality review. The header,
metadata, action gating, and existing route navigation meet this slice's
approved prototype contract while preserving real application behavior.
Acceptance assertions `A2` and `A3` may be verified only for this completed
header slice; the remaining pipeline route-family work stays open.
