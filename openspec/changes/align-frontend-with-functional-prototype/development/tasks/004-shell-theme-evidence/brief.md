# Task Brief: 004-shell-theme-evidence

## Goal

Users see the approved shared shell in equivalent dark/light desktop and 390px
mobile states before route-family implementation begins.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/specs/ui-design/design.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Open the production shell and the approved prototype in equivalent theme,
locale, viewport, permission, and populated-data states. Verify desktop shell
density and mobile drawer behavior in dark and light modes, recording direct
measurements and screenshots before any route-family slice proceeds.

## In Scope

- Capture production and approved-prototype shell evidence for:
  - dark desktop at `1600x1000`;
  - light desktop at `1600x1000`;
  - dark mobile at `390x844`;
  - light mobile at `390x844`.
- Use Simplified Chinese for the required dark comparisons and representative
  English coverage for the light comparison.
- Measure the `248px` desktop sidebar, `64px` topbar, `17px` brand label, and
  `40px` navigation rows.
- Verify theme class/data attributes, computed shell colors, readable text and
  controls, and absence of page-level horizontal overflow.
- Verify the mobile drawer closed/open states, backdrop, `aria-expanded`,
  focus entry, background inertness, body scroll lock, Escape close, and focus
  return.
- Re-run the existing shell-focused tests plus the complete frontend static,
  unit, build, formatting, and diff checks.
- Treat this as an evidence-only slice when measurements pass. Modify
  production shell files only if a reproducible requirement delta is observed.

## Out Of Scope

- Route-family page redesign or route-by-route parity work.
- API, store, router, authentication, permission calculation, backend,
  persistence, or dependency changes.
- Changes to the approved prototype or import of prototype fixtures/runtime
  code into production.
- Adding another token system, shell component family, or temporary comparison
  harness to production.
- Claiming all route families satisfy `A2`; this slice verifies only the shared
  shell prerequisite.

## Files Allowed

- `web/src/App.vue`
- `web/src/App.test.ts`
- `web/src/components/layout/header/Sidebar.vue`
- `web/src/components/layout/header/Sidebar.test.ts`
- `web/src/components/layout/header/Navbar.vue`
- `web/src/components/layout/header/Navbar.test.ts`
- `web/src/compositions/useTheme.ts`
- `web/src/style.css`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `web/src/viteConfig.test.ts`
- `web/vite.config.ts`

## Interfaces / Seams

- `useTheme` remains the only owner of stored and resolved theme state.
- `App.vue` remains the owner of mobile drawer lifecycle, focus containment,
  inert background state, and scroll lock.
- `Sidebar.vue` and `Navbar.vue` remain presentation and intent components
  using existing authentication, repository, configuration, theme, and i18n
  seams.
- Production uses real Mock API/store values; the prototype uses its approved
  standalone data. Comparisons normalize only theme, locale, viewport,
  permission role, and populated state.

## Components To Create

- None planned. This task is evidence-first and must not add a component unless
  a measured defect proves an existing approved component cannot own the fix.

## Components To Reuse

- Existing `App`, `Sidebar`, `Navbar`, `IconButton`, `Button`,
  `ActivePipelines`, `PrototypeIcon`, `useTheme`, Vue i18n, authentication,
  configuration, repository store, CSS variables, and Tailwind mappings.

## Components To Extract

- None. Shared shell behavior was already extracted and implemented in slice
  `002`; duplicating or replacing it is prohibited.

## API / Data Flow Contracts

- No API, payload, mutation, store, routing, authentication, permission, or
  persistence contract changes.
- Theme writes continue through `woodpecker:theme` and `useTheme`.
- Locale writes continue through the existing user preferences flow.
- Browser comparison data is evidence only and is not copied into production.

## State / Error / Empty / Loading Behavior

- Loading: use the current populated `/overview` shell after required Mock API
  requests settle; loading behavior is not redefined.
- Empty: not applicable to the shared shell evidence gate.
- Error: console/runtime errors fail the evidence gate; do not mask them with
  screenshot-only approval.
- Disabled: existing controls must remain visibly and semantically usable in
  both themes; no new disabled behavior is introduced.
- Permission: use an authenticated administrator state so the same complete
  navigation set is compared; preserve existing permission visibility.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/viteConfig.test.ts src/App.test.ts src/components/layout/header/Sidebar.test.ts src/components/layout/header/Navbar.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/App.vue src/App.test.ts src/components/layout/header/Sidebar.vue src/components/layout/header/Sidebar.test.ts src/components/layout/header/Navbar.vue src/components/layout/header/Navbar.test.ts src/compositions/useTheme.ts src/style.css src/assets/locales/en.json src/assets/locales/zh-Hans.json src/viteConfig.test.ts vite.config.ts`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- Browser review of production `/overview` and approved prototype
  `#/overview` at `1600x1000` and `390x844` in dark/light modes.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- Production and prototype cannot be placed in equivalent theme, locale,
  viewport, permission, or populated-data states.
- A measured defect requires edits outside the twelve allowed production/test
  files.
- Browser evidence depends on static DOM inspection without rendering the real
  pages at the required viewports.

## Unsafe Assumptions

- Do not assume the earlier slice `002` browser receipt proves the current
  committed shell snapshot.
- Do not assume matching token source text proves computed browser geometry,
  contrast, overflow, or drawer behavior.
- Do not compare dark production with light prototype, English with Chinese, or
  different navigation permission states.
- Do not modify production solely to make screenshots pixel-identical when
  hierarchy, density, behavior, and semantic tokens already satisfy the
  approved contract.
