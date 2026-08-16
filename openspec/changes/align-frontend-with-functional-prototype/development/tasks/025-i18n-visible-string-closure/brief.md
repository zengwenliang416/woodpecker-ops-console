# Task Brief: 025-i18n-visible-string-closure

## Goal

Every user-visible string rendered by the completed slices `001-024` resolves
through the shared vue-i18n boundary in both English and Simplified Chinese:
no hardcoded English control labels, table headers, section titles, or
file-tree accessibility names remain, every i18n key referenced by the source
resolves from both `en.json` and `zh-Hans.json`, and the English fallback
locale is proven to serve keys missing from the active locale.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/goal.md`
- Tasks `001-024`, including their signed acceptance, reports, and reviews.

## Vertical Slice

Close baseline task `7.1`: sweep all `web/src` Vue templates for hardcoded
English `title`/`aria-label`/`label`/`placeholder`/`alt` attributes and
multi-word bare text nodes, route each genuine finding through `$t()` with new
bilingual keys, add the one missing Simplified Chinese message (`delete`),
and lock the result with a focused regression suite that fails when a new
untranslated string, an unresolved locale key, or a broken English fallback
appears.

## In Scope

- `web/src/views/infrastructure/` server, servers, overview, group, and
  services views: localized filter `aria-label`s, `CPU` headers, the detail
  `Agent` row, the `Node Agent` section title, and the metric-card label.
- `web/src/components/FileTree.vue`: localized expand/collapse/file
  accessibility names with the node name parameter.
- `web/src/assets/locales/en.json` and `zh-Hans.json`: new
  `ops.servers.filter_*`, `ops.server.cpu`, `ops.server.agent`,
  `ops.server_detail.agent_section`, `file_tree.*` keys and the missing
  Simplified Chinese `delete` message.
- `web/src/i18nVisibleStrings.test.ts`: source-key locale parity, template
  hardcoded-string hygiene, FileTree bilingual rendering, operations label
  exposure, English fallback, and the `delete` translation.

## Out Of Scope

- Runtime identifiers rendered verbatim by design (`docker`, `kubernetes`,
  `systemd` select options) stay untranslated.
- Proper nouns kept in Simplified Chinese by the approved prototype wording
  (`Node Agent`, `Agent`, `CPU`) keep their prototype-consistent values.
- Full phase `8` static/sensory verification runs; this slice only adds the
  focused regressions and its own clean lint/type/format receipt.

## Files Allowed

- `web/src/components/FileTree.vue`
- `web/src/views/infrastructure/InfrastructureOverview.vue`
- `web/src/views/infrastructure/InfrastructureServer.vue`
- `web/src/views/infrastructure/InfrastructureServers.vue`
- `web/src/views/infrastructure/InfrastructureGroup.vue`
- `web/src/views/infrastructure/InfrastructureServices.vue`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `web/src/i18nVisibleStrings.test.ts`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/025-i18n-visible-string-closure/**`
- Existing task graph, CodeGraph plan, ledger, context, validation, drift, and
  acceptance files for task `025`.

## Verification Commands

- Focused Vitest: `web/src/i18nVisibleStrings.test.ts` (`6/6`).
- Touched-area suites: infrastructure views, form components, and pipeline
  routes (`14` files, `111/111`).
- Full frontend Vitest recorded in `evidence/verification-receipt.json`.
- ESLint, `prettier --check` on all changed files, and `vue-tsc --noEmit`
  with zero errors.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- A new untranslated visible string appears that is not covered by the
  documented runtime-identifier/proper-noun allowlist.
- A locale key referenced by source does not resolve from both `en.json` and
  `zh-Hans.json`, or the English fallback cannot be proven.
- Any focused, touched-area, or full regression, lint, format, or type check
  fails.
- Closure would touch blocked row `4`, phase `8`, or parent acceptance.
