# Task Brief: 026-accessibility-interaction-closure

## Goal

The completed slices `001-025` are operable by keyboard, expose visible focus
on shared controls, use semantic interactive elements with accessible names,
pair status icons with translated text instead of relying on icon-only
meaning, and stop large or infinite motion when the user prefers reduced
motion. Baseline task `7.2` closes with focused regressions that fail when a
new non-semantic click target, unguarded animation, or unnamed icon button
appears.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/goal.md`
- Tasks `001-025`, including their signed acceptance, reports, and reviews.

## Vertical Slice

Audit every Vue template for non-semantic click targets, globally removed
focus outlines, missing focus-visible styling on shared form controls, and
component styles declaring keyframes, infinite animations, or full-property
transitions without a `prefers-reduced-motion` guard; repair the genuine
gaps, mark the decorative running icon `aria-hidden`, and lock the baseline
with `web/src/accessibilityInteraction.test.ts`.

## In Scope

- `web/src/App.vue`: the pipeline-feed slide transition stops under reduced
  motion.
- `web/src/components/layout/header/ActivePipelines.vue`: the active-pipeline
  spinner stops under reduced motion.
- `web/src/components/repo/pipeline/PipelineRunningIcon.vue`: the pecking
  woodpecker stops under reduced motion and is `aria-hidden` because the
  translated status text carries the meaning.
- `web/src/accessibilityInteraction.test.ts`: six regressions covering the
  animation guard, semantic click-target guard with explicit allowlist, no
  global outline reset, focus-visible presence on shared form controls,
  IconButton semantics (`type=button`, `aria-label`, `title`,
  `aria-disabled`), and the decorative running icon.

## Out Of Scope

- The two documented non-semantic click targets stay allowed: the App drawer
  backdrop (`aria-hidden` with the Escape close path already tested in
  `App.test.ts`) and the RepoAdd click-guard wrapper around a real Button.
- Full phase `8` static/sensory runs; this slice records its own clean
  lint/type/format receipts and the full-suite pass at the closure HEAD.

## Files Allowed

- `web/src/App.vue`
- `web/src/components/layout/header/ActivePipelines.vue`
- `web/src/components/repo/pipeline/PipelineRunningIcon.vue`
- `web/src/accessibilityInteraction.test.ts`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/026-accessibility-interaction-closure/**`
- Existing task graph, CodeGraph plan, ledger, context, validation, drift, and
  acceptance files for task `026`.

## Verification Commands

- Focused Vitest: `web/src/accessibilityInteraction.test.ts` (`6/6`).
- Touched-area suites (App, layout, pipeline views): `90/90`.
- Full frontend Vitest: `600/600` at the closure HEAD.
- ESLint, Prettier, and `vue-tsc --noEmit` clean on all changed files.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- A keyboard, focus, semantic-control, label, status text/icon pairing, or
  reduced-motion regression appears outside the documented allowlist.
- Any focused, touched-area, or full regression, lint, format, or type check
  fails.
- Closure would touch blocked row `4`, phase `8`, or parent acceptance.
