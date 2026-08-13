# Task Report: 015-organization-routes

## Status

DONE

## Files Changed

- Organization router coverage, wrapper, repository overview, settings wrapper,
  Secrets, Registries, and Agents production components plus focused tests.
- Scope-neutral shared `SettingsSection`, `SettingsTable`, and
  `SettingsActionRow` components promoted from repository-only names; all
  existing repository consumers now use the shared paths and the obsolete
  repository-named files are removed.
- Shared `AgentManager` state/error/lifecycle behavior and caller-owned copy,
  English and Simplified-Chinese organization copy, and task-local browser
  evidence producer/verifier artifacts.

## What Changed

- `/orgs/:orgId` now loads organization and permission state through a
  monotonic lifecycle generation that is provided to descendant routes and
  invalidated on unmount. It clears the previous shell during transitions,
  exposes loading/error/retry feedback, and rejects obsolete organization,
  permission, list, and mutation completions across `A -> B -> A`.
- The organization overview now loads the existing repository store, filters
  only real rows matching the active `org.id`, supports search, loading, empty,
  no-match, error, retry, dense table navigation, and locally contained mobile
  scrolling without adding prototype statistics or fixtures. The repository
  store now applies latest-request-wins ownership before writing repository,
  owned-ID, or last-pipeline state.
- Organization settings now use a responsive `220px + minmax(0,1fr)` hierarchy
  with a dedicated navigation component, current-organization back behavior,
  permission re-evaluation, and the existing Agent feature flag guarding both
  navigation and direct-route content.
- Secrets and Registries now use real existing CRUD endpoints, shared feedback
  and table primitives, pagination-owned reloads, confirmed-row continuity,
  organization lifecycle guards, deletion confirmation, visible mutation
  failures, and explicit loading/empty/error/retry outcomes. Active failures
  preserve the editor and confirmed rows; obsolete fulfilled and rejected
  completions are inert. Registry organization rows override duplicate global
  addresses and inherited global rows remain read-only.
- The shared Agent manager now supplies loading/empty/error/retry/list/form
  presentation, preserves confirmed rows, exposes active mutation failures,
  suppresses obsolete create/update/delete completions using owner ID plus a
  monotonic lifecycle key, and uses caller-owned descriptions plus a
  scope-neutral retry label.
- The browser evidence producer captures dark Simplified-Chinese production
  and approved-prototype states for rows `24-27` at `1600x1000` and `390x844`.
  It waits for the exact terminal route and content before capture, owns its
  services, waits for termination after `SIGTERM` or `SIGKILL`, exits cleanly,
  and the verifier requires the exact 16 state IDs, paired JSON/PNG basenames,
  row/surface/viewport/run-ID mapping, route, content, browser health, raw-key,
  and page-overflow assertions.

## TDD Evidence

- Focused tests cover all four organization route destinations, the settings
  root, organization loading/error/retry, same-ID lifecycle ownership,
  repository filtering/search states, administrator permission changes,
  current-organization back navigation, Agent feature disablement, Registry
  precedence, Secret/Registry/Agent create/update/delete success ownership,
  active mutation failures, obsolete fulfilled/rejected completions,
  confirmed-row preservation, pagination rejection, repository-store overlap,
  shared Settings containment, and shared Agent copy/lifecycle behavior.
- The final focused command passes `13` files and `44` tests.
- The supporting repository settings command passes `8` files and `62` tests,
  proving the shared component promotion preserves existing consumers.
- The complete frontend suite passes `59` files and `351` tests.

## Verification Commands

- PASS: focused organization/router/shared component Vitest
  (`13` files, `44` tests).
- PASS: supporting repository settings Vitest (`8` files, `62` tests).
- PASS: `pnpm test -- --run` (`59` files, `351` tests).
- PASS: targeted Prettier for all task production, tests, and locales.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the existing `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: `node evidence/capture_browser.mjs`; final run
  `f5452fe5-ef9d-4b00-9126-20404e946858` captured and exited cleanly with
  `16/16` states.
- PASS: `node evidence/verify_evidence.mjs`; all `16` JSON measurements and
  `16` PNG files exactly match the expected state inventory and basename pairs,
  share the final run ID, and pass row/surface/viewport, terminal-route,
  content, browser-health, overflow, and raw-i18n-key checks.
- PASS: evidence JavaScript/Python syntax and changed/untracked JSON/JSONL
  parsing.
- PASS: SpecNav development entry and `git diff --check`.

## Concerns

- This slice intentionally does not copy prototype-only members, teams,
  statistics, success rates, monthly pipeline counts, Secret usage/reveal,
  Registry connection tests, Agent binding, online/busy state, resource
  telemetry, or fixed fixture pagination because no current backend contract
  supports those values or actions.
- The task-local browser set is representative dark Simplified-Chinese
  desktop/mobile evidence for rows `24-27`; baseline task `5.5` still owns
  complete organization/administration/user/authentication/error parity across
  theme, locale, permission, and data-state combinations and the full `A2`
  claim.
- The local checkout contains pre-existing macOS `._*` metadata under
  `web/src/views/org`; task formatting checks use explicit allowed files and do
  not modify or commit those unrelated artifacts.

## Scope Deviations

- Independent review proved that route-local guards could not prevent obsolete
  `repoStore.loadRepos()` requests from writing shared repository and pipeline
  state. The allowed files were explicitly expanded to
  `web/src/store/repos.ts`, `web/src/store/repos.test.ts`, and
  `web/src/compositions/useInjectProvide.ts`; CodeGraph was refreshed and the
  SpecNav development entry returned `ok:true` before those edits.
- The expansion adds no route, endpoint, field, store, backend behavior,
  dependency, permission calculation, Registry URL behavior, or prototype-only
  capability.

## Follow-up Needed

- Continue with baseline task `5.2` for administration routes, then tasks
  `5.3-5.5` for personal/authentication/error routes, permission-family
  closure, and complete parity verification.
- Do not begin final six-domain verification while tasks `5.2-8.4` remain
  unchecked.

## Adjudication

Baseline task `5.1` is complete after superseding independent spec and quality
reviews approved the final current bytes. The task verifies task-scoped `A3`
and `A4` only. Rows `24-27` remain `in-progress`, and baseline task `5.5`
remains open for full route-family `A2`.
