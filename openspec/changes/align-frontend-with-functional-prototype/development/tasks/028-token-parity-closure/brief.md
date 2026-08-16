# Task Brief: 028-token-parity-closure

## Goal

Every user-visible color in the completed slices resolves through the shared
semantic token system (`--wp-*` / `--color-int-wp-*`) with explicit light and
dark values, no component, view, console, or syntax palette defines
page-local color values, and a regression scan plus a light/dark browser
spot check lock the token-parity contract.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/artifact/index.html`
- `web/src/style.css` (the `--wp-*` semantic token definitions), `web/src/tailwind.css`
  (the `@theme` token definitions), and `web/src/compositions/useTheme.ts` (the
  documented theme-color mirrors).

## Vertical Slice

Close baseline task `7.4`: replace every page-local color value in components,
views, the ANSI console palette, and the syntax-highlight palette with
semantic tokens (adding light and dark token values where the current
palettes differ), and lock the result with a source-level token-parity
regression scan plus a light/dark browser spot check that reuses the Task
`027` capture machinery.

## In Scope

- Add `--wp-log-*` tokens (console background, text, muted, success, warning,
  danger, info) and migrate the deployment detail log console styles.
- Add `--wp-login-*` tokens and migrate the login gradient background.
- Add `--wp-primary-hover-100` / `--wp-primary-glow-rgb` tokens and migrate
  the primary button gradient hover and glow shadow.
- Add `--wp-ansi-*` tokens (light and dark values) and migrate
  `web/src/style/console.css` so no raw hex remains.
- Add `--wp-syntax-*` tokens (light and dark values) and migrate
  `web/src/style/prism.css` so no raw hex remains.
- Migrate the remaining page-local values (`ActivePipelines.vue` mask
  gradient) to tokens.
- Add `web/src/regression/tokens/token-parity.test.ts`: a scan proving no raw
  hex/rgb/rgba color values remain outside the token-definition allowlist
  (`web/src/tailwind.css`, `web/src/style.css`, `web/src/compositions/useTheme.ts`,
  and test files), and a resolution check that every `--wp-*` variable
  referenced by source is defined with light and dark values.
- Run a light/dark browser spot check with the Task `027` capture machinery:
  representative routes at desktop in light and dark themes, verifying zero
  page-level overflow, zero console/runtime/network failures, and the
  `data-theme` attribute application.
- Close only baseline task `7.4` after both reviews pass.

## Out Of Scope

- New routes, APIs, payload fields, backend behavior, or prototype fixtures.
- Reopening blocked repository-add row `4`.
- Changing token VALUES (this slice tokenizes page-local colors with their
  existing values; visual output is unchanged).
- Phase `8` static/six-domain verification and the HTML report.
- Accessibility (task `7.2`), i18n (task `7.1`), and responsive containment
  (task `7.3`) closure, all already closed.

## Files Allowed

- `web/src/style.css`
- `web/src/style/console.css`
- `web/src/style/prism.css`
- `web/src/views/deployments/DeploymentDetail.vue`
- `web/src/views/Login.vue`
- `web/src/components/atomic/Button.vue`
- `web/src/components/layout/header/ActivePipelines.vue`
- `web/src/compositions/useTheme.ts`
- `web/src/regression/tokens/**`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/028-token-parity-closure/**`
- Existing task graph, CodeGraph plan, handoff, ledger, context, validation,
  drift, and acceptance files for task `028`.

## Interfaces / Seams

- The `--wp-*` tokens in `web/src/style.css` (light block at
  `:root[data-theme='light']`, dark block at `:root[data-theme='dark']`) and
  the `@theme` tokens in `web/src/tailwind.css` remain the single source of
  color truth.
- The ANSI and syntax palettes keep their exact current colors as token
  values; only the definition site moves into the token system.

## Components To Create

- No production component is planned.
- Create the token-parity regression suite under
  `web/src/regression/tokens/` and the light/dark spot-check evidence under
  the task's `evidence/` directory.

## Components To Reuse

- The Task `027` CDP capture/verifier machinery (adapted to a light/dark
  matrix) and the existing semantic token system.

## Components To Extract

- None initially. If the scan finds repeated raw-color patterns, they move
  into the shared token system rather than a parallel abstraction.

## API / Data Flow Contracts

- No data or API behavior changes; the diff is color-value plumbing only.

## State / Error / Empty / Loading Behavior

- Tokenized colors must render identically in both themes; the light/dark
  spot check verifies zero health failures and no page overflow in either
  theme.

## TDD Requirement

- The token-parity scan must fail when a new raw hex/rgb color appears outside
  the allowlist or a referenced `--wp-*` token is undefined; the scan is the
  red-capable regression for this slice, written before the palette
  migration is considered complete.

## Verification Commands

- Focused Vitest: `web/src/regression/tokens/token-parity.test.ts`.
- Full frontend Vitest; Prettier; ESLint; Vue TypeScript; Vite build;
  `git diff --check`.
- Light/dark spot check via the task-local capture script.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- A page-local color cannot be expressed with an existing or new semantic
  token without changing its light/dark behavior.
- The token scan finds raw colors outside the allowlist that are not covered
  by this slice's migration.
- Any gate, review, or browser check fails without a direct fix inside the
  allowed scope.
- Closure would complete phase `8`, row `4`, or parent acceptance.

## Unsafe Assumptions

- A passing full suite does not prove token parity; only the raw-color scan
  with its explicit allowlist proves the absence of page-local colors.
- Light and dark parity is verified by the token definitions plus the browser
  spot check, not by re-screenshotting every route in both themes.
