# Task Report: 002-shared-shell-alignment

## Status

DONE

## Files Changed

- `web/src/App.vue`
- `web/src/App.test.ts`
- `web/src/components/layout/header/Sidebar.vue`
- `web/src/components/layout/header/Sidebar.test.ts`
- `web/src/components/layout/header/Navbar.vue`
- `web/src/components/layout/header/Navbar.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `web/src/viteConfig.test.ts`
- `web/vite.config.ts`

## What Changed

- Preserved the approved 248px sidebar and fixed the topbar at an actual 64px
  rendered height by preventing flex shrink and letting the main region consume
  the remaining height.
- Matched the prototype's 17px brand title, 40px navigation rows, 22px desktop
  topbar padding, and compact 390px topbar behavior.
- Replaced the mobile sidebar's display toggle with a reduced-motion-aware
  slide-in drawer, backdrop, close control, Escape handling, route-change
  closing, body scroll locking, and `aria-expanded` / `aria-controls` state.
- Put the mobile backdrop above the topbar, made the non-drawer shell inert
  while open, moved focus into the drawer, trapped Tab navigation, restored
  focus to the menu trigger on close, and cleared mobile-only side effects when
  crossing the desktop breakpoint.
- Kept administrator agents, queue, settings, users, and forge navigation behind
  the existing `user.admin` boundary while retaining personal secrets/settings
  for authenticated regular users.
- Preserved the topbar light/dark toggle and the user-settings `auto`, `light`,
  and `dark` selector.
- Replaced the hardcoded command-palette toast with localized English and
  Simplified-Chinese unavailable feedback; no search success is simulated.
- Filtered AppleDouble and non-JSON filesystem entries from the generated
  `SUPPORTED_LOCALES` virtual module, preventing invalid tags such as `._ar`
  from crashing `UserGeneral.vue`.

## TDD Evidence

- Initial shared-shell red run: 7 expected failures and 5 passes across 3 files.
  Failures covered missing drawer ARIA propagation, Escape handling, scroll
  locking, sidebar identity/density, and hardcoded search feedback.
- Browser measurement found the nominal 64px token rendered at approximately
  60.2px because the topbar could shrink. A focused source-contract regression
  failed before `shrink-0` and the remaining-height main layout were added.
- User-settings browser review reproduced `RangeError: Invalid language tag:
  ._ar`. The locale-discovery test then failed because the filter did not exist;
  it passed after JSON/AppleDouble filtering was added.
- The independent quality review caught the backdrop below the topbar, missing
  focus isolation/return, and stale mobile side effects on desktop resize.
  Focused tests were expanded before the production fix and now exercise the
  real close control, background inertness, focus entry/containment/return,
  existing overflow restoration, and breakpoint cleanup.
- Green focused run: 4 files and 16 tests passed.
- Full regression: 15 files and 91 tests passed.

## Verification Commands

- PASS: `pnpm exec vitest run src/viteConfig.test.ts src/App.test.ts src/components/layout/header/Sidebar.test.ts src/components/layout/header/Navbar.test.ts` (4 files, 16 tests).
- PASS: `pnpm test -- --run` (15 files, 91 tests).
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`.
- PASS: targeted Prettier for all 10 allowed files.
- PASS: `git diff --check`.
- PASS: browser review at 1600x1000, dark Simplified Chinese:
  sidebar 248px, topbar 64px, brand 17px, nav row 40px, no horizontal overflow.
- PASS: browser review at 390x844, dark Simplified Chinese:
  closed drawer translated -248px and hidden; open drawer 248px, visible,
  `aria-expanded=true`, backdrop present, body overflow locked, no horizontal
  overflow; Escape and route navigation restored scrolling and closed the
  drawer.
- PASS: focused DOM interaction review after the independent quality fix:
  backdrop layer contract is above the topbar; the main shell is inert while
  open; focus enters the real close control, wraps inside the drawer, returns
  to the menu trigger, preserves an existing body overflow value, and clears
  drawer side effects at the desktop breakpoint.
- PASS: fresh `/user` browser review rendered 27 locale options and theme
  options with no runtime errors; selecting English updated `lang`, heading, and
  search placeholder, then `zh-Hans` and dark mode restored successfully.
- BLOCKED BY PRE-EXISTING WORKSPACE METADATA: `pnpm format:check` reports 61
  ignored `._*` AppleDouble files. Targeted Prettier passed for every allowed
  file.

## Concerns

- Repository-wide Prettier remains blocked by AppleDouble metadata outside this
  task's allowed files. This slice filters those entries only from locale
  discovery; it does not delete metadata or change repository formatter policy.
- Vite build continues to report the two pre-existing non-module script warnings
  for `/web-config.js` and `/assets/custom.js`.

## Scope Deviations

- The task scope was expanded from 8 to 10 allowed files after direct browser
  evidence showed AppleDouble locale discovery crashed the user-settings page.
  The added files are limited to `web/vite.config.ts` and its focused test; no
  metadata was deleted and no formatter configuration was changed.

## Follow-up Needed

- Handle repository-wide AppleDouble cleanup or Prettier exclusion in a
  separately authorized task.
- Implement a real global command palette only when a production route/API/store
  contract is approved.

## Adjudication

Task `2.2` may close because all 10 allowed files pass focused and full Vitest,
targeted formatting, ESLint, TypeScript, Vite build, diff checks, and direct
desktop/mobile preference and drawer review. The full-tree Prettier failure is
caused only by pre-existing ignored AppleDouble metadata and cannot be counted
as evidence that global formatting task `8.1` passed.
