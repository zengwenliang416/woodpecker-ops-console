# Task Report: 025-i18n-visible-string-closure

## Outcome

Baseline task `7.1` is closed. The completed slices `001-024` render every
user-visible control label, table header, section title, and accessibility
name through the shared vue-i18n boundary with real Simplified Chinese and
English messages, and the English fallback locale is locked by a focused
regression. Twelve hardcoded findings across six infrastructure views and the
shared file tree were routed through new bilingual keys, and the one missing
Simplified Chinese message (`delete`, used by the shared list editor) was
added.

## What Changed

- `web/src/components/FileTree.vue`: the expand/collapse/file accessibility
  names now interpolate the node name through `file_tree.*` keys instead of
  hardcoded English template literals.
- `web/src/views/infrastructure/InfrastructureServers.vue`: the three filter
  selects expose localized `aria-label`s and the server table header uses
  `ops.server.cpu`.
- `web/src/views/infrastructure/InfrastructureServer.vue`: the metric card
  label, detail `Agent` row, services `CPU` header, and `Node Agent` section
  title resolve through locale keys.
- `web/src/views/infrastructure/InfrastructureOverview.vue`,
  `InfrastructureGroup.vue`, and `InfrastructureServices.vue`: `CPU` headers
  resolve through `ops.server.cpu`.
- `web/src/assets/locales/en.json` and `zh-Hans.json`: new
  `ops.servers.filter_status/filter_group/filter_region`, `ops.server.cpu`,
  `ops.server.agent`, `ops.server_detail.agent_section`, and `file_tree.*`
  keys in both locales, plus the Simplified Chinese `delete` message that
  English already had.
- `web/src/i18nVisibleStrings.test.ts`: six focused regressions covering
  source-key locale parity for every referenced i18n key, template
  hardcoded-string hygiene with an explicit runtime-identifier allowlist,
  bilingual FileTree accessibility names, operations label exposure, English
  fallback for keys missing from the active locale, and the `delete`
  translation.

## Verification

- Focused suite `src/i18nVisibleStrings.test.ts`: `6/6` passing.
- Touched-area suites (infrastructure views, form components, pipeline
  routes): `14` files, `111/111` tests passing.
- Full frontend Vitest run at the closure HEAD: recorded in
  `evidence/verification-receipt.json`.
- `eslint` and `prettier --check` clean on all changed files;
  `vue-tsc --noEmit` reports zero errors.

## Boundaries

- Runtime identifiers rendered verbatim by design (`docker`, `kubernetes`,
  `systemd`) and prototype-consistent proper nouns (`Node Agent`, `Agent`,
  `CPU`) are documented as the explicit allowlist in the regression rather
  than silently ignored.
- No route, API, permission, store, or streaming behavior changed; the diff
  is limited to locale keys, template bindings, and the new test.
- Blocked repository parity row `4` is untouched and remains explicit.
