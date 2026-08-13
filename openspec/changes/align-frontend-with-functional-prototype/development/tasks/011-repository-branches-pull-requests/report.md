# Task Report: 011-repository-branches-pull-requests

## Status

DONE

## Files Changed

- Branch routes and tests:
  `web/src/views/repo/RepoBranches.vue`,
  `web/src/views/repo/RepoBranches.test.ts`,
  `web/src/views/repo/RepoBranch.vue`, and
  `web/src/views/repo/RepoBranch.test.ts`.
- Pull-request routes and tests:
  `web/src/views/repo/RepoPullRequests.vue`,
  `web/src/views/repo/RepoPullRequests.test.ts`,
  `web/src/views/repo/RepoPullRequest.vue`, and
  `web/src/views/repo/RepoPullRequest.test.ts`.
- Shared detail and ref seams:
  `web/src/components/repo/RepoPipelineReference.vue`,
  `web/src/components/repo/RepoPipelineReference.test.ts`,
  `web/src/lib/pipelineRefs.ts`,
  `web/src/lib/pipelineRefs.test.ts`, and
  `web/src/compositions/usePipeline.ts`.
- English and Simplified-Chinese locale files.
- Task-local deterministic Mock API, bounded CDP capture, independent evidence
  verifier, manifest, and eight desktop/mobile PNG screenshots.
- This task packet plus SpecNav/CodeGraph planning, ledger, validation, drift,
  and review artifacts.

## What Changed

- Replaced the legacy branch stack with a responsive, searchable list over the
  existing paginated `string[]` API. The default branch is first, refresh and
  load-more use `usePagination`, and loading, empty, and no-match states are
  distinct.
- Branch and PR refresh now retain a route-local snapshot of the currently
  confirmed rows while the authoritative `resetPage()` request is pending.
  The snapshot is discarded when a repository change starts a newer reset, and
  the confirmed page-one response replaces the old rows atomically.
- A route-local refresh generation owns snapshot completion independently from
  the pagination generation. Obsolete refresh continuations cannot clear a
  newer repository snapshot or propagate an obsolete rejection after the user
  switches repositories and starts another refresh.
- Each branch row uses only the newest already-loaded non-PR pipeline for
  status, message, commit, age, and detail navigation. A branch without loaded
  history renders an explicit unavailable state.
- Replaced the legacy PR stack with a responsive, searchable list over the
  existing `{ index, title }[]` API. Search covers only confirmed index/title
  values, while refresh, pagination, and explicit states retain the current
  data boundary.
- Each PR row uses only the newest already-loaded PR pipeline whose normalized
  ref index exactly matches the API record.
- Added `pipelineRefs.ts` for the three production ref formats already
  supported by Woodpecker and reused it in `usePipeline`, list correlation, and
  PR detail filtering.
- Added `RepoPipelineReference.vue` so branch and PR details share one
  information hierarchy: reference header, three real latest-history summary
  cards, and the existing `PipelineList`.
- The PR detail title comes from the newest matching pipeline title when
  present and otherwise uses the translated PR identifier. No author,
  source/target branch, approval, comment, diff, comparison, protection, or
  write behavior is fabricated.
- The shared history region owns any narrow `PipelineItem` horizontal overflow,
  keeping the 390px document and main route container contained.
- Removed four now-unused English/Simplified-Chinese keys that were owned only
  by the replaced branch/PR legacy headings and generic empty state.

## TDD Evidence

- Added `27` focused tests across six files.
- Pure-function tests cover all supported PR ref prefixes/suffixes, unsupported
  refs, event recognition, and exact index matching.
- List tests cover loading, empty, no-match, default-branch ordering,
  index/title search, newest exact pipeline enrichment, PR-event exclusion,
  unsupported history fallback, service pagination, synchronous-clear refresh
  preservation, loading-disabled actions, confirmed replacement, and
  stale-generation isolation across repository changes. Rejection regressions
  prove that the existing error still propagates while the last confirmed rows
  remain visible until a later successful refresh or repository reset; owner
  regressions prove obsolete fulfillments and rejections cannot clear a newer
  repository's pending refresh snapshot.
- Detail tests prove exact branch/PR filtering, non-PR exclusion, newest
  pipeline title selection, translated title fallback, default-branch state,
  real summary values, and empty-history fallbacks.
- The complete frontend suite passes `35` files and `211` tests.

## Verification Commands

- PASS: focused Vitest command from the task brief (`6` files, `27` tests).
- PASS: `pnpm test -- --run` (`35` files, `211` tests).
- PASS: targeted Prettier for all production, test, locale, and evidence
  JavaScript files.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: Python fixture compilation plus both evidence-script syntax checks.
- PASS: `git diff --check`.
- PASS: `node evidence/capture_browser.mjs && node
  evidence/verify_evidence.mjs`.
- PASS: eight checksum-valid `1280x720` / `390x844` screenshots covering branch
  list/detail and PR list/detail.
- Browser measurements prove exact routes and expected real text, zero raw
  locale keys, zero console errors, zero unexpected HTTP errors, three summary
  cards on both detail routes, and `1280/1280` plus `390/390` document/main
  route widths.

## Concerns

- The injected pipeline collection is a real recent cache but not a complete
  server-side history. All UI copy and counts intentionally describe loaded
  records rather than a server total.
- The browser captures record the existing `/assets/custom.js` development
  hook `404` separately and reject every other HTTP error. This slice neither
  creates nor changes that hook.
- Baseline task `4.5` still owns full equivalent-state comparison across
  repository themes, locales, permissions, browser health, and the complete
  parity matrix.

## Scope Deviations

- None. No API type/endpoint, backend, router, `RepoWrapper`, `PipelineList`,
  store, manual-run, repository-setting, permission, dependency, Forge
  mutation, or approved-prototype file changed.

## Follow-up Needed

- Continue baseline task `4.3` for manual-run and repository settings.
- Keep tasks `4.4` and `4.5` open for repository-family regression and complete
  sensory/parity closure.

## Adjudication

Baseline task `4.2` may close only after current-byte independent spec and
quality reviews approve this implementation. The concerns above are bounded to
the existing `4.4`/`4.5` follow-up scope and do not justify fabricated Forge
data or new backend contracts in this slice.
