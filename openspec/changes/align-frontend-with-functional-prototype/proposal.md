## Why

The production Vue frontend has adopted the prototype shell and several operations pages, but many CI, repository, organization, administration, and personal-settings routes still use the older visual structure. A route-by-route parity change is needed so the user-designed functional prototype becomes a verifiable product contract rather than a small set of reference screenshots.

## What Changes

- Establish a complete route/state parity matrix for the 67 documented prototype routes and tab states.
- Align the global shell, page headers, navigation, cards, tables, filters, status vocabulary, empty/loading/error states, and responsive behavior with the functional prototype.
- Prioritize the remaining high-gap CI pipeline, repository subpage, organization, administration, and user-settings route families.
- Preserve real Woodpecker APIs, permissions, data loading, mutations, i18n, light/dark themes, and accessibility behavior.
- Add targeted component/store/router tests and dark/light desktop/mobile visual evidence for each completed vertical slice.
- Remove obsolete page-local visual patterns when a shared production component replaces them.

## Capabilities

### New Capabilities

- `frontend-prototype-parity`: Defines route/state coverage, visual/interaction parity, real-data behavior, theme/locale parity, and verification expectations for adopting the approved functional prototype.

### Modified Capabilities

- None.

## Impact

- Primary code impact: `web/src/App.vue`, `web/src/style.css`, `web/src/tailwind.css`, `web/src/router.ts`, `web/src/views/**`, `web/src/components/**`, `web/src/store/**`, and locale dictionaries.
- Existing Go APIs and datastore contracts remain authoritative; backend changes require a separately documented missing-capability decision.
- No new runtime dependency is required for the initial slices.
- Verification uses the existing Vitest, ESLint, TypeScript, Vite build, local Mock Ops API, and browser screenshot workflow.
