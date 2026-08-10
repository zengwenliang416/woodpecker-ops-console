# Spec Review: 010-repository-pipeline-list

## Verdict

approved

## Missing Requirements

- None for baseline task `4.1`.
- The repository activity route derives its three metrics from loaded pipeline
  objects, provides text/status/branch/event filters, distinguishes initial
  loading, no-pipeline, and no-match states, pages loaded rows locally, and
  requests the next one-based API page without presenting a fabricated total.
- Pipeline detail navigation remains available to read-only users. Deployment
  entry is limited to successful pipelines when repository push permission and
  `allow_deploy` are both true, and submission remains owned by the existing
  deployment popup.
- The v4 pagination correction closes the prior action-locality gap:
  `loadRepoPipelines()` returns the boolean computed from its own response, and
  both the component action hook and direct next-page path consume that result.
  The component no longer attributes the store-global `hasMore` value to a
  completed repository action.

## Extra Behavior

- The only production seam added outside the original component/locales scope
  is the user-approved store return value and its focused regression. It
  exposes the already-computed request-local `hasMore` boolean without changing
  the API request, shared pipeline map, legacy global field, or pagination
  architecture.
- The route-local per-repository page and `hasMore` snapshots preserve confirmed
  pagination across remounts. They do not fabricate totals or infer server
  pages from mutable shared-map counts.
- No API, backend, route, permission calculation, dependency, prototype,
  branch/pull-request consumer, release mapping, or mutation behavior changed.

## Misunderstood Requirements

- None found in the v4 implementation.
- The implementation treats the API response length only as the existing
  store-level `hasMore` contract, keeps metrics and filters limited to loaded
  real objects, and leaves manual-run, deployment submission, repository
  permissions, and route ownership at their existing seams.
- Overlapping repository pagination is handled inside task `4.1`: confirmed
  cursors are keyed by repository, obsolete fulfillment/rejection is isolated
  by repository generation, and action results are request-local.

## Cannot Verify From Diff

- Final bytes cannot prove the original TDD ordering. Only current tests and
  system-executed receipts are used.
- This reviewer independently reproduced focused Vitest at 3 files / 13 tests,
  including a real Pinia same-turn concurrency case whose action results remain
  repository `101=false` and repository `202=true`. Full Vitest passed 30 files
  / 185 tests. Targeted Prettier, ESLint, Vue TypeScript, Vite build, evidence
  verification, both evidence-script syntax checks, and `git diff --check`
  also passed on the reviewed bytes.
- The task-local verifier passes four current PNG hashes and dimensions, the
  desktop/mobile state matrices, document-width equality, local table
  scrolling, raw-locale-key absence, and explicit no-match feedback. Browser
  evidence is a targeted layout/state surface rather than a complete
  equivalent-state prototype comparison.
- Full same-state prototype comparison, permissions/themes/locales matrix, and
  browser-console/network health remain assigned to task `4.5`.

## Acceptance Assertions Verified

- `A3`: verified for this completed slice. Targeted formatting, complete
  ESLint, TypeScript, focused/full Vitest, Vite build, `git diff --check`, and
  current desktop/390px populated and filtered-empty evidence verification all
  pass.
- `A4`: verified for this slice. Focused tests cover real derived metrics,
  invalid-value fallbacks, initial loading, same-length initial refresh,
  confirmed pagination cursors, request-local concurrent `hasMore` results,
  obsolete fulfillment/rejection isolation, and live-insert isolation.
- `A1` and `A2` are not verified by task `010`. It does not close the complete
  parity matrix or equivalent-state prototype comparison.

## Required Fixes

- None for task `010-repository-pipeline-list`.
- Tasks `4.4` and `4.5` remain responsible for repository-family regression,
  full equivalent-state sensory comparison, theme/locale/permission matrices,
  and browser console/network health; those are not blockers for this slice.
