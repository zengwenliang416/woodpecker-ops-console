# Spec Review: 002-shared-shell-alignment

## Verdict

approved

## Missing Requirements

- None. The allowed-file diff implements the required 248px desktop sidebar,
  non-shrinking 64px topbar, prototype-aligned brand/navigation density,
  mobile drawer entry/backdrop/close/Escape/route-close/scroll-lock behavior,
  background isolation, focus entry/trapping/return, desktop-breakpoint
  cleanup, compact topbar layout, localized unavailable-search feedback,
  locale discovery filtering, and the existing regular-user/admin navigation
  boundary.
- Existing preference ownership remains intact: `Navbar.vue` continues to use
  `useTheme`, while the unchanged `UserGeneral.vue`, `useTheme.ts`, and
  `useI18n.ts` remain authoritative for `auto`/`light`/`dark` and locale
  persistence.

## Extra Behavior

- None. The exported `getSupportedLocales` helper is a focused test seam for the
  existing Vite virtual-module behavior; it does not introduce a new runtime
  feature, dependency, route, API, store, or persistence contract.
- The added `inert` state, focus lifecycle, backdrop layering, and breakpoint
  cleanup are not extra product behavior. They complete the brief's accessible
  mobile drawer, body-scroll-lock, close-control, and desktop/mobile responsive
  contracts without changing desktop navigation or route content.

## Misunderstood Requirements

- None. The implementation does not copy prototype JavaScript or fixtures,
  simulate command-palette success, move locale selection into the topbar, or
  weaken the existing `user.admin` visibility boundary.
- Focus return is suppressed when the drawer closes because the viewport
  crosses the desktop breakpoint, so the implementation does not incorrectly
  focus a now-hidden mobile trigger. Existing body overflow values are restored
  rather than replaced with an assumed default.

## Cannot Verify From Diff

- Browser-computed dimensions, page-level overflow, drawer behavior in a real
  390x844 viewport, and live locale/theme switching cannot be established from
  source diff alone. They are covered by the `system-executed` validation-log
  entries `task-002-shell-browser-20260809` and
  `task-002-preferences-browser-20260809`.
- Focus isolation/containment/return, restoration of a pre-existing body
  overflow value, real close-control behavior, backdrop layering, and
  desktop-breakpoint cleanup are covered by the new focused interaction tests
  and the `system-executed` receipt
  `task-002-quality-fix-focused-vitest-20260809`.
- The browser screenshots referenced under `/tmp/woodpecker-shell-*` are not
  durable task-packet artifacts. This does not leave an acceptance blocker
  because the replayable system attestation records the measured dimensions,
  ARIA/backdrop/scroll-lock/Escape/route-close/no-overflow results, 27 valid
  locale options, and successful English/Simplified-Chinese plus light/dark
  preference switching.
- Repository-wide `pnpm format:check` remains blocked by 61 pre-existing
  AppleDouble files outside the allowed scope. The task-required targeted
  Prettier check covers all ten allowed files and passes, so this is not a
  defect in this slice.

## Acceptance Assertions Verified

- `A2`: verified against the approved prototype CSS and handoff, the actual
  allowed-file diff, permission/localization/theme tests, and the
  `system-executed` desktop/mobile and preference browser reviews. The
  production shell matches the prototype's 248px sidebar, 64px topbar, 17px
  brand, 40px navigation rows, and 22px desktop topbar padding. The revised
  drawer additionally isolates background interaction, contains focus, returns
  focus on ordinary close, and clears mobile-only side effects at the desktop
  breakpoint without adding fake search success or changing real
  API/permission contracts.
- `A3`: verified by independent reruns of the focused Vitest command (4 files,
  16 tests), full frontend Vitest (15 files, 91 tests), targeted Prettier, and
  scoped `git diff --check`; the latest `system-executed` evidence also records
  passing ESLint, TypeScript, and Vite build plus the desktop and 390px browser
  review. The build succeeds with only the two documented pre-existing
  non-module script warnings.

## Required Fixes

- No implementation fix is required for this spec review. The slice may proceed
  to the remaining quality-review and task-ledger gates.
