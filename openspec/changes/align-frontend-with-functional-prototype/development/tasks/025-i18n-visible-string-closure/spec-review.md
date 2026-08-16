# Spec Review: 025-i18n-visible-string-closure

## Verdict

Approved.

## Requirement Trace

- Baseline `7.1` ("Remove untranslated visible strings from completed slices
  and verify Simplified Chinese plus English fallback") maps to three concrete
  obligations: a removal sweep, Simplified Chinese coverage, and an English
  fallback proof. All three are present:
  - The sweep is recorded in `evidence/visible-string-scan.json` with twelve
    findings and their key resolutions, and re-locked by the template-hygiene
    regression so a regression fails the suite.
  - Simplified Chinese coverage is enforced structurally: the parity
    regression resolves every i18n key referenced anywhere in `web/src` from
    both `en.json` and `zh-Hans.json`, which closes the exact gap class the
    missing `delete` message exposed.
  - The English fallback is exercised directly by a partial-message
    `createI18n` instance asserting the English rendering for keys absent
    from the active locale.
- Change-level requirement "do not introduce untranslated visible strings"
  (acceptance.md line 18) is now guarded by a red-capable test rather than
  review-only convention.

## Spec Compliance Checks

- Scope discipline: the production diff contains only template bindings and
  locale keys; no API, route, permission, or store contract is touched, which
  respects the change constraint that alignment is presentation-only.
- Prototype authority: Simplified Chinese values follow the established
  prototype wording already encoded in `zh-Hans.json` (proper nouns such as
  `Node Agent` stay untranslated on purpose and are documented as such).
- Exclusions are explicit, tested, and minimal: only the three runtime
  identifiers `docker`, `kubernetes`, and `systemd` may render verbatim.

## Concerns Raised And Resolved During Review

- The first implementation used a dynamic `$t(ternary)` key in
  `FileTree.vue`; `@intlify/vue-i18n/no-dynamic-keys` rejected it, and the
  binding was restructured to static keys before closure.
- The first draft of the parity test imported the locale JSON through the
  build pipeline, which returns precompiled message ASTs; the test reads the
  raw JSON files instead so assertions compare real translation strings.
