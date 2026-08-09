# Task Report: 004-shell-theme-evidence

## Status

DONE_WITH_CONCERNS

## Files Changed

- No production or test files changed. `git diff --quiet -- web` passed.
- This slice adds only its SpecNav task packet, CodeGraph development plan,
  evidence report, validation receipts, drift record, and task-state records.

## What Changed

- Replayed the current production `/overview` shell and the approved prototype
  `#/overview` in equivalent dark/light, desktop/mobile, authenticated
  administrator, and populated-data states.
- Confirmed the shared shell still renders a `248px` desktop sidebar, `64px`
  topbar, `17px` brand label, and `40px` navigation rows in both production and
  approved-prototype source and browser evidence.
- Confirmed dark and light semantic shell colors remain readable, theme state
  is applied to the rendered document, and neither desktop nor mobile evidence
  has page-level horizontal overflow.
- Confirmed the production mobile drawer is closed by default and exposes no
  backdrop or inert background, then opens with `aria-expanded=true`,
  `sidebar sidebar-open`, one backdrop, inert main content, locked body
  scrolling, and focus moved inside the drawer.
- Confirmed Escape closes the drawer, restores body scrolling, removes inert
  state and backdrop, and returns focus to the menu trigger.
- Found no reproducible requirement delta. The evidence-first stop rule
  therefore prohibited speculative shell edits.

## TDD Evidence

- No new test was required because the rendered shell passed and production
  remained unchanged.
- The existing shell-focused regression suite passed 4 files and 16 tests,
  covering Vite locale discovery plus shared App, Sidebar, and Navbar behavior.
- The complete frontend regression suite passed 22 files and 112 tests.

## Verification Commands

- PASS: `pnpm exec vitest run src/viteConfig.test.ts src/App.test.ts src/components/layout/header/Sidebar.test.ts src/components/layout/header/Navbar.test.ts`
  (4 files, 16 tests).
- PASS: `pnpm test -- --run` (22 files, 112 tests).
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the two pre-existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: targeted Prettier for the 11 allowed shell files other than the
  unchanged baseline `src/style.css`.
- BASELINE BLOCK: the all-allowed-files Prettier command reports only the
  unchanged `src/style.css`; this slice did not format that file because it has
  no production diff and a full-file rewrite would add unrelated noise.
- PASS: `git diff --check`.
- PASS: `git diff --quiet -- web`.

## Browser Evidence

- PASS: production and approved prototype dark/light desktop states rendered at
  `1600x1000`, with matching shell geometry and no horizontal overflow.
- PASS: production dark/light mobile closed and open states rendered at the
  requested `390x844` viewport and screenshot size.
- PASS: the approved prototype was rendered with an explicitly attested
  `390x844` viewport. Its standalone-page screenshot API cropped the captured
  content grid to `380x822`; this tool behavior is disclosed rather than
  concealed with synthetic padding.
- PASS: representative English plus light desktop production coverage rendered
  at `1600x1000`; the required dark comparisons used Simplified Chinese.
- Production screenshots:
  `/tmp/woodpecker-shell-evidence-production-dark-desktop-1600x1000.png`,
  `/tmp/woodpecker-shell-evidence-production-light-desktop-1600x1000.png`,
  `/tmp/woodpecker-shell-evidence-production-light-en-desktop-1600x1000.png`,
  `/tmp/woodpecker-shell-evidence-production-dark-mobile-closed-390x844.png`,
  `/tmp/woodpecker-shell-evidence-production-dark-mobile-open-390x844.png`,
  `/tmp/woodpecker-shell-evidence-production-light-mobile-closed-390x844.png`,
  and
  `/tmp/woodpecker-shell-evidence-production-light-mobile-open-390x844.png`.
- Approved-prototype screenshots:
  `/tmp/woodpecker-shell-evidence-prototype-dark-desktop-1600x1000.png`,
  `/tmp/woodpecker-shell-evidence-prototype-light-desktop-1600x1000.png`,
  `/tmp/woodpecker-shell-evidence-prototype-dark-mobile-closed-390x844.png`,
  `/tmp/woodpecker-shell-evidence-prototype-dark-mobile-open-390x844.png`,
  `/tmp/woodpecker-shell-evidence-prototype-light-mobile-closed-390x844.png`,
  and
  `/tmp/woodpecker-shell-evidence-prototype-light-mobile-open-390x844.png`.

## Concerns

- The prototype standalone screenshot API records the requested mobile viewport
  as a `380x822` content-grid image. The browser viewport was directly set to
  `390x844`, and responsive drawer behavior was rendered at that viewport, but
  the durable PNG dimensions alone cannot prove the outer viewport.
- `src/style.css` has a pre-existing Prettier mismatch. The other 11 allowed
  shell files pass targeted Prettier, `web/` has zero diff, and this slice
  introduces no formatting regression.
- Vite build retains the two pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.

## Scope Deviations

- None. No API, store, router, authentication, permission, persistence,
  backend, dependency, prototype, production, or test file changed.

## Follow-up Needed

- Route-family slices must still establish their own equivalent-state `A2`
  evidence. This task verifies only the shared-shell prerequisite and must not
  be used to claim route-family parity.
- Address the baseline `src/style.css` formatting mismatch only in an
  authorized formatting task that can review the whole-file noise.

## Adjudication

Task `2.4` may close after independent spec and quality review. The current
production shell satisfies the approved shared-shell prerequisite in dark/light
desktop and mobile states without requiring implementation changes. `A3` is
supported by focused/full tests and static/browser validation. The `A2`
shared-shell prerequisite is recorded, but `A2` itself remains unverified until
completed route families establish equivalent-state parity.
