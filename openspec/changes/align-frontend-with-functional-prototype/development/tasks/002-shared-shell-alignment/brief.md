# Task Brief: 002-shared-shell-alignment

## Goal

Authenticated users can navigate the production shell at desktop and mobile
sizes with prototype-aligned density, accessible drawer behavior, working theme
and locale preferences, localized search feedback, and unchanged admin
boundaries.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/artifact/index.html`

## Vertical Slice

Open the shared shell as an authenticated regular user or administrator, use the
desktop navigation or mobile drawer, toggle the theme, and receive localized
global-search availability feedback without exposing administrator routes to a
regular user.

## In Scope

- The 248px desktop sidebar and 64px topbar production token contract.
- Prototype-aligned sidebar brand, section, and navigation-row density.
- Mobile sidebar drawer entry, backdrop/close control, Escape handling,
  route-change closing, body scroll lock, and accessible expanded/control state.
- Compact 390px topbar behavior without page-level horizontal overflow.
- Existing topbar light/dark toggle and user-settings `auto`, `light`, `dark`
  policy.
- Existing user-settings locale selector and English/Simplified-Chinese shell
  copy.
- Locale discovery excludes AppleDouble and non-JSON filesystem metadata so the
  user-settings selector only receives valid language tags.
- Global search placeholder plus explicit localized unavailable feedback; no
  simulated command-palette success.
- Existing regular-user and administrator navigation visibility rules.
- Focused component tests for the shell interactions and permission variants.

## Out Of Scope

- Implementing a command palette or repository/pipeline/user search.
- Moving locale selection into the topbar.
- Changing route names, authentication middleware, backend authorization, API
  contracts, persistence, or administrative capabilities.
- Restyling route-family content below the shared shell.
- Adding dependencies, prototype fixtures, or copied prototype JavaScript.
- Repository-wide AppleDouble cleanup or formatter configuration changes.

## Files Allowed

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

## Interfaces / Seams

- `App.vue` owns drawer-open state, route-close behavior, Escape handling, and
  temporary body scroll locking.
- `Sidebar.vue` receives the existing `open` prop and emits `close`; it continues
  to derive permissions from the existing authentication composition.
- `Navbar.vue` emits `openSidebar`, receives the current drawer state for ARIA,
  and uses the existing theme, notification, authentication, and route seams.
- `UserGeneral.vue`, `useTheme.ts`, and `useI18n.ts` remain the authoritative
  preference implementations and are verified without production edits.
- Vite locale discovery remains the source of `SUPPORTED_LOCALES` and filters
  filesystem metadata before exposing that virtual-module contract.

## Components To Create

- No new production component is expected.
- Adjacent focused test files may be created for `App`, `Sidebar`, `Navbar`, and
  Vite locale discovery.

## Components To Reuse

- Existing app shell, `Sidebar`, `Navbar`, `IconButton`, `Button`,
  `ActivePipelines`, `PrototypeIcon`, authentication/config/user-config/theme/
  notification compositions, Vue Router, and Vue i18n.

## Components To Extract

- None. Drawer state remains local to `App.vue`; permission and preference logic
  remains in its existing compositions because no repeated new contract exists.

## API / Data Flow Contracts

- `FLOW-PREFERENCES` remains browser-local: theme writes through
  `woodpecker:theme`; locale writes through `woodpecker:locale` from user
  settings.
- Navigation visibility remains an assistive client-side projection of the
  authenticated user; backend route authorization remains authoritative.
- Global search has no production API or command-palette contract in this
  slice, so the shell reports unavailability instead of simulating success.

## State / Error / Empty / Loading Behavior

- Loading: no new loading state; existing topbar and navigation render from
  current local/authenticated state.
- Empty: search remains a placeholder-only entry when no command-palette
  contract exists.
- Error: unavailable search produces localized informational feedback without
  navigation or data mutation.
- Disabled: the unavailable global search action explains its current state.
- Permission: regular users retain personal secrets/settings navigation but do
  not see administrator agents, queue, settings, users, or forge links.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/App.test.ts src/components/layout/header/Sidebar.test.ts src/components/layout/header/Navbar.test.ts`
- `pnpm exec vitest run src/viteConfig.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/App.vue src/App.test.ts src/components/layout/header/Sidebar.vue src/components/layout/header/Sidebar.test.ts src/components/layout/header/Navbar.vue src/components/layout/header/Navbar.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- Implementing global search requires a new route, API, store, or command
  contract.
- Permission changes require backend or router authorization changes.
- Drawer or locale behavior cannot be verified without editing outside the
  allowed files.

## Unsafe Assumptions

- Do not assume the prototype's always-admin fixture is the production
  permission contract.
- Do not assume a clickable prototype command palette authorizes simulated
  production search behavior.
- Do not assume `theme === dark` represents the stored `auto` preference; the
  existing composition exposes resolved and stored theme separately.
- Do not assume mobile drawer visibility is accessible merely because it is
  visually hidden.
- Do not assume every filesystem entry under `src/assets/locales` is a real
  locale dictionary.
