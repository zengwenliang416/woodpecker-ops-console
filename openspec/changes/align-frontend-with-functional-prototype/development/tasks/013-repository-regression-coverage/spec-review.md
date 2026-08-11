# Spec Review: 013-repository-regression-coverage

## Verdict

approved

## Missing Requirements

- None for baseline task `4.4`.
- The router regression resolves `/repos`, `/repos/add`, repository activity,
  branch list/detail, pull-request list/detail, manual-run, and all seven
  settings destinations by both production route name and inbound path under
  the configured root path. It also checks the applicable parameters and
  inherited route metadata.
- `RepoWrapper` clears the previous permission and forge state at every
  repository lifecycle, captures both repository ID and a monotonic generation,
  and gates permission publication, redirects, repository/pipeline/forge
  follow-up work, forge publication, and last-access updates on the active
  generation.
- Both Vue lifecycle registrations now return the `loadRepo()` promise.
  Active permission, repository, pipeline, and forge failures clear partial
  shell state, reach Vue's configured error handler exactly once, and stop all
  later load and last-access effects. Obsolete failures remain suppressed.
- Focused tests cover one-way obsolete fulfillment at every downstream stage
  and same-ID `A -> B -> A` completion for permission, repository, pipeline,
  and forge ownership. The first A lifecycle cannot redirect, expose stale
  controls, publish a stale forge, start downstream work, or update last
  access after the newest A completes.
- Pull, push, administrator, pull-request availability, manual-route action,
  guest/authenticated denial, settings-shell bypass, and light/dark structural
  control invariance are covered without changing the existing permission
  calculation.
- Disabled pull-request list/detail routes render localized disabled feedback
  instead of throwing. The list regression executes the pagination loader and
  proves that disabled direct access performs no pull-request API request.
  Pagination and pipeline-store failures still reject while releasing loading
  state; overlapping pipeline requests keep loading active until all requests
  settle.
- Repository activity and settings-table regressions cover the declared
  structural containment seams: local wide-table scrolling, fixed table
  minimum width, mobile filter collapse, `min-w-0`, `overflow-hidden`, and the
  settings scroll owner's `contain: layout paint`.

## Extra Behavior

- None found. Production changes remain in the explicitly expanded,
  red-proven wrapper, pull-request, pagination, pipeline-store,
  settings-table, and locale owners.
- No route, API payload, backend behavior, dependency, authentication rule,
  permission calculation, repository field, mutation, prototype fixture, or
  compatibility path was added.

## Misunderstood Requirements

- None found.
- Theme and responsive assertions are correctly limited to structural control
  invariance and containment. They do not claim computed visual parity,
  rendered no-overflow proof, or task `4.5` sensory completion.
- Active request failures continue through Vue's established global error
  boundary rather than a new page-local error cache. Obsolete lifecycle
  failures are intentionally ignored because they no longer own the route.

## Cannot Verify From Diff

- Final bytes cannot prove that tests were written before implementation. The
  current focused tests, the recorded failing red receipt, and its
  system-executed superseding receipts are used instead of the report's TDD
  narrative.
- This reviewer independently reran the current focused task command after the
  repair: all `9` files and `63` tests passed. A task-scoped
  `git diff --check` also passed.
- The validation log explicitly overturns the original `56`-test, `307`-test,
  and static receipts. Their current system-executed replacements record the
  supporting repository-family suite at `22` files / `118` tests, the complete
  frontend suite at `50` files / `314` tests, and passing targeted Prettier,
  ESLint, TypeScript, Vite build, JSON/JSONL parsing, diff checks, and
  development entry.
- The expected failing quality-review red receipt and the resource-contended
  full-suite timeout are both explicitly overturned by the current passing
  focused and clean full-suite receipts. The handoff contract no longer reports
  a task `013` executed-evidence failure.
- The inspected supporting tests substantively cover filters, pagination,
  explicit states, permissions, actions, mutations, confirmed-value
  fallbacks, and stale-response boundaries from repository slices `010`
  through `012`.
- Task `013` has no current-byte desktop/390px browser review. Therefore the
  full `A3` assertion is not verified by this review even though its static,
  build, and Vitest portions pass. This is not a task `4.4` blocker because the
  task packet explicitly limits responsive evidence to structural regressions
  and leaves rendered screenshots and sensory comparison to task `4.5`.

## Acceptance Assertions Verified

- `A4`: verified for this repository-family regression slice through real
  repository/pipeline/branch/pull-request/settings test fixtures, explicit
  fallback and disabled states, request-counted loading, preserved rejection
  propagation through Vue, active-failure shell clearing, and direct
  generation-owned fulfillment/rejection regressions that prevent obsolete
  repository lifecycles from publishing current UI side effects.

## Required Fixes

- None for task `013-repository-regression-coverage`.
- Baseline task `4.5` must still provide the maintained parity-row closure and
  equivalent-state desktop/390px, theme, locale, permission, and data-state
  browser evidence. This review does not approve those open surfaces.
