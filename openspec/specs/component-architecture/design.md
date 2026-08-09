# Component Architecture & Reuse Spec

## Overview

Woodpecker UI uses route-level Vue SFCs composed from atomic, form, layout, domain, and ops components. Prototype alignment should reduce page-local visual duplication while keeping domain state and API side effects outside presentational components.

## Component Taxonomy

- Page/screen components: `web/src/views/**`, own route composition and screen-specific state.
- Layout components: `App.vue`, sidebar/navbar, scaffold, container, panel, popup, tabs.
- Domain components: repository, pipeline, agent, deployment, and infrastructure components.
- Form components: `web/src/components/form/**`.
- Data display components: cards, badges, tables/lists, metrics, sparklines, logs.
- Feedback components: errors, warnings, notifications, empty/loading states.
- Headless hooks: `web/src/compositions/use*.ts`.
- Domain utilities/services: `web/src/lib`, typed API client/types, Pinia stores.

## Cohesion Rules

- Route pages coordinate data, derived state, and user intent for one screen.
- Presentational components render typed props and emit behavior-facing events.
- Stores own reusable server collections and request reconciliation.
- Compositions own reusable browser/runtime integration such as auth, theme, locale, config, pagination, and subscriptions.
- API and persistence details do not belong in visual components.

## Coupling Rules

- Pages may import shared components, compositions, stores, router APIs, and domain types.
- Shared components must not import page components.
- Atomic/form/layout components must not import domain stores or API clients.
- Domain components may import domain types and focused compositions but should not own unrelated routes.
- Stores may use the API client and types; they must not import page components.
- Backend or datastore modules never enter the frontend dependency graph.

## Shared Component Extraction Rules

- Extract repeated shell, card, metric, filter, table, status, empty, and action patterns after the second real use.
- Extract a hook/store when loading, pagination, stale-request protection, mutation reconciliation, or subscription logic repeats.
- Keep a pattern page-local when it is genuinely unique and extraction would expose page-specific props.
- Extend existing atomic/layout/ops components before creating a near-duplicate.
- Shared extraction must preserve i18n, theme parity, accessibility, and responsive behavior.

## Component Public API Rules

- Props are typed, minimal, and behavior-facing.
- Raw API entities are allowed only for domain display components whose responsibility is that entity.
- Events use domain intent names such as `approve`, `retry`, `select`, or `close`.
- Slots are used for composition points, not to bypass component styling contracts.
- Shared components define accessible labels and states or require them as explicit props.

## State Ownership Rules

- Local state: dialog visibility, temporary selection, filters, and unsaved form values.
- Shared UI state: authenticated user, feed visibility, persistent preferences, and cross-route domain collections.
- Server/cache state: Pinia stores or established data compositions.
- Form state: nearest page/form component until submission; server response is authoritative after mutation.
- URL state: route ids, tabs, and shareable navigation state.
- Derived state: computed values; never duplicated as independently mutable state.

## Composition Patterns

- Preferred composition patterns: route page + focused store/composition + shared ops/layout components; renderless hooks for browser/API behavior; scoped slots for reusable layout.
- Forbidden composition patterns: page-to-page imports, API calls in atomic components, duplicated global CSS systems, and hidden singleton state inside display components.
- Approved provider/context boundaries: Vue router, Pinia, Vue i18n, notifications, and application-level API/auth compositions.
- Approved headless hook patterns: `use*` functions returning refs/computed values and explicit actions; cleanup on component disposal for subscriptions/timers.

## File & Naming Conventions

- Component file naming: PascalCase Vue SFCs grouped by stable domain.
- Hook naming: `useX.ts`; store names describe domain ownership.
- Test naming: adjacent `*.test.ts` for focused frontend logic/components; Go `*_test.go` beside backend code.
- Story/prototype naming: SpecNav artifacts under the active change; the approved standalone prototype remains under `woodpecker-functional-prototype-with-ops/`.
- Barrel/export rules: use existing type/index barrels; do not add barrels that obscure ownership or create cycles.

## Testing Expectations

- Shared component tests: interactions, emitted intent, disabled/loading/error states, and important rendering variants.
- Hook tests: timers, subscriptions, storage, pagination, cancellation/stale response behavior.
- Integration tests: router registration, store/API reconciliation, and critical multi-step flows.
- Accessibility checks: keyboard reachability, visible focus, labels, semantic controls, contrast, and reduced motion.
- Visual/prototype review: compare each affected route/state in dark mode, representative light mode, desktop, and mobile; record screenshots and remaining deltas.

## Refactor Triggers

- Duplicate logic detected: extract after confirming contracts are equivalent.
- Cross-boundary import detected: move state/behavior to the owning layer.
- Props become data-source-specific: introduce a domain adapter or keep the component domain-specific.
- Component grows multiple responsibilities: split orchestration, presentation, and side effects.
- Test setup requires unrelated modules: reduce hidden dependencies or split the component.

## Component Do's and Don'ts

- Do reuse atomic, form, layout, scaffold, ops, repository, pipeline, and agent components.
- Do keep route orchestration explicit and server state authoritative.
- Do add targeted tests when extracting shared behavior.
- Don't copy prototype JavaScript/data into Vue production modules.
- Don't create generic abstraction layers without at least two concrete consumers.
- Don't place API calls, authentication, or persistence assumptions in low-level display components.
