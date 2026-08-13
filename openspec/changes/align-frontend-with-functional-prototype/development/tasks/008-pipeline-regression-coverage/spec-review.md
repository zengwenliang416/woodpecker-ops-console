# Spec Review: 008-pipeline-regression-coverage

## Verdict

approved

## Missing Requirements

- None for baseline task `3.4`. The current suite directly resolves the
  overview/step, changed-files, config, errors, and Debug named routes under
  `WOODPECKER_ROOT_PATH`, and verifies that the static diagnostic destinations
  do not fall through the optional `stepId` route.
- Pipeline component coverage includes every current status value, all three
  killed-pipeline cancellation branches, real tab destinations/counts,
  cancel/retry/deploy and approve/decline intent, busy state, push/read-only
  boundaries, valid step/workflow/invalid-step selection, and mobile log-close
  routing.
- Existing and added tests cover the required empty/error/stale cases:
  no steps, pipeline error precedence, no log match, obsolete log response,
  no changed files versus no filter match, no historical config, no pipeline
  errors, and Debug permission/metadata feedback.
- Mobile coverage is correctly limited to route behavior and local structural
  containment. The header/action groups wrap, the route body owns `min-w-0`,
  and dense tables, logs, paths, config, errors, and Debug values own local
  overflow regions.

## Extra Behavior

- The only production behavior change is the one-line
  `PipelineWrapper.vue` interpolation correction from `{ user: value }` to
  `{ step: value }` for `canceled_by_step`. This is justified by the recorded
  red regression, matches the existing locale contract in all shipped
  dictionaries, and was added to the allowed-file scope before the fix.
- No route, query, API, store, backend, persistence, dependency,
  authentication, permission calculation, locale text, prototype fixture, or
  compatibility behavior was added.

## Misunderstood Requirements

- None. The tests protect current production contracts rather than treating
  prototype-only data as supported behavior.
- Structural class assertions are not represented as rendered no-overflow or
  visual-parity proof. The report explicitly leaves desktop/mobile theme,
  locale, screenshot, and sensory verification to baseline task `3.5`.
- Baseline task `3.4` can close independently after these focused regressions;
  this approval does not close the pipeline route family, global acceptance, or
  baseline task `3.5`.

## Cannot Verify From Diff

- Source diff alone cannot prove the original red-test ordering. The
  system-executed `task-008-red-focused-vitest-20260810` receipt records the
  missing killed-step interpolation before the production correction.
- Source diff and CSS class assertions cannot prove prototype parity, resolved
  dark/light theme output, Simplified Chinese/English presentation, or absence
  of page-level horizontal overflow at desktop and `390px`. No task `008`
  browser or screenshot receipt claims otherwise.
- The recorded ESLint, TypeScript, and Vite build receipts were not derived
  from diff inspection. This reviewer independently reproduced the final
  focused suite at 8 files / 66 tests, the full frontend suite at 28 files /
  175 tests, targeted Prettier, and `git diff --check`.

## Acceptance Assertions Verified

- `A3`: verified only for the task `3.4` unit/static portion. Focused and full
  Vitest, targeted Prettier, and `git diff --check` were independently rerun;
  the system-executed evidence also records passing ESLint, TypeScript, and Vite
  build. The assertion remains globally open because its targeted desktop and
  `390px` browser review belongs to task `3.5`.
- `A4`: verified only for pipeline behavior exercised by this slice. Status and
  tab counts derive from current pipeline/workflow arrays, empty/error states
  remain explicit, and the retained stale-log regression prevents an obsolete
  response from replacing the selected step's log.
- Complete parity-matrix and equivalent-state sensory verification remain
  outside this task.

## Required Fixes

- None for task `008` / baseline task `3.4`.
- Keep baseline task `3.5` unchecked until focused/full validation is reconciled
  with desktop/mobile dark-mode and representative light-mode pipeline browser
  evidence. Do not promote the structural containment assertions in this slice
  to sensory or page-level overflow evidence.
