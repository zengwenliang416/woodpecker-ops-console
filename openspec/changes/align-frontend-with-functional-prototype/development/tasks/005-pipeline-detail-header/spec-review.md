# Spec Review: 005-pipeline-detail-header

## Verdict

approved

## Missing Requirements

- None. The review fix replaces the old organization/repository breadcrumb
  with the approved repository/pipeline eyebrow: the real repository link is
  followed by localized `Pipeline` / `流水线` context.
- The final four-file diff also supplies the required pipeline number,
  translated icon-plus-text status, commit message, branch/ref, trigger event,
  author, short commit, created time, duration, responsive actions, and
  existing route tabs.
- Focused coverage now asserts the eyebrow and all current pipeline status and
  event variants in addition to action, permission, deploy, busy, and tab
  behavior.

## Extra Behavior

- None. The final diff remains within the four allowed files and introduces no
  router, API, store, authentication, permission calculation, persistence,
  dependency, prototype, or route-body contract.
- The status/event translation lookup and nonempty raw-value fallback expose
  real pipeline values without inventing a state or mutation.

## Misunderstood Requirements

- None. Cancel remains limited to pending/running pipelines with push
  permission; Retry remains available for non-blocked pipelines with push
  permission; Deploy retains its successful/deploy-enabled gate and both real
  release routing and legacy popup paths.
- Overview, changed files, config, and errors remain reachable at zero counts,
  while Debug and all mutation controls remain permission-gated.
- This approval is limited to the completed header slice. It does not claim
  the complete pipeline route family or tasks `3.2` and `3.3` are complete.

## Cannot Verify From Diff

- Responsive layout, page-level overflow, rendered permission boundaries, and
  the production/prototype sensory comparison cannot be proven from source
  diff alone. They are covered by the superseding system-executed
  `task-005-review-fix-browser-20260809` receipt.
- That receipt records equivalent dark Simplified-Chinese production/prototype
  states, including the production `zh-Hans` and prototype `zh-CN` locale
  identifiers, identical computed body colors, authenticated administrator
  push permission, equivalent pipeline #842 data semantics, desktop and
  390x844 viewports, responsive overflow, and production read-only behavior.
- The `/tmp/woodpecker-pipeline-005-*` screenshots are no longer present, so
  their pixels cannot be independently re-inspected. The receipt discloses
  true-size production PNGs and prototype standalone-page crops from attested
  1600x1000 and 390x844 browser viewports.
- The report's initial red-test claim has no system-executed validation entry.
  The final test source and independent green reruns verify current behavior,
  not historical test ordering; the report correctly excludes that ordering
  from its acceptance claim.

## Acceptance Assertions Verified

- `A2`: verified only for this pipeline detail header slice against the
  approved prototype hierarchy, the actual four-file diff, exhaustive current
  status/event tests, preserved API/router/permission/deploy seams, and the
  superseding same-theme, same-locale-family, equivalent-data desktop/mobile
  browser receipt. This does not close any route body or route-family parity
  claim.
- `A3`: independently verified by the focused component suite (1 file, 29
  tests), full frontend suite (23 files, 141 tests), targeted Prettier for all
  four allowed files, ESLint, TypeScript, Vite build, tracked and untracked
  diff checks, and the superseding desktop/390px browser receipt. The build
  retains only the two documented pre-existing non-module script warnings.

## Required Fixes

- None for this slice. Tasks `3.2` and `3.3` must independently implement and
  verify the pipeline overview, logs, and remaining route bodies before any
  complete pipeline route-family claim.
