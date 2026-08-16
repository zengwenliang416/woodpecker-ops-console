# Task Report: 026-accessibility-interaction-closure

## Outcome

Baseline task `7.2` is closed. Keyboard operation, visible focus, semantic
controls, accessible names, status text/icon pairing, and reduced-motion
behavior were audited across the completed slices; three genuine motion gaps
were repaired, the decorative running icon was hidden from assistive
technology, and six focused regressions now lock the baseline. Full suite at
the closure HEAD: `600/600`.

## What Changed

- `web/src/App.vue`: the pipeline-feed slide transition is disabled under
  `prefers-reduced-motion`.
- `web/src/components/layout/header/ActivePipelines.vue`: the infinite
  spinner stops under `prefers-reduced-motion`.
- `web/src/components/repo/pipeline/PipelineRunningIcon.vue`: the infinite
  peck animation stops under `prefers-reduced-motion`, and the decorative
  woodpecker is `aria-hidden` because the translated status text carries the
  meaning.
- `web/src/accessibilityInteraction.test.ts`: six regressions —
  reduced-motion guard for every keyframe/infinite/full-property transition,
  semantic click-target guard with an explicit two-entry allowlist, no
  global focus-outline reset, focus-visible presence on the shared form
  controls, IconButton semantics across its three render variants, and the
  decorative running icon.

## Audit Findings

- `evidence/accessibility-audit.json` records three findings with
  resolutions and six verified-conforming checks (drawer Escape close,
  backdrop pattern, IconButton semantics, form focus rings, sidebar guard,
  file-tree keyboard activation), plus the two documented non-semantic click
  exceptions with reasons.

## Verification

- Focused `6/6`; touched area (App, layout, pipeline views) `90/90`; full
  suite `600/600`.
- ESLint, Prettier, and `vue-tsc` clean on all changed files.

## Boundaries

- No route, API, permission, or data-flow change; the diff is limited to
  three style/template guards and one new test file.
- Blocked repository parity row `4` remains untouched and explicit.
