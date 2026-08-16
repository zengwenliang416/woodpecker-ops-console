# Quality Review: 025-i18n-visible-string-closure

## Verdict

Approved.

## Test Quality

- The six new cases are red-capable: deleting any new locale key, restoring a
  hardcoded template string, switching the FileTree accessibility name back
  to a template literal, or dropping the zh-Hans `delete` message each fails
  a named assertion.
- The parity regression scans every `.vue`/`.ts` file under `web/src` (minus
  itself) for literal `t('...')` keys and checks each against both locale
  key sets, so it guards the whole codebase rather than the six files this
  slice touched.
- The template-hygiene regression encodes the allowlist (`docker`,
  `kubernetes`, `systemd`) as data with reasons recorded in
  `evidence/visible-string-scan.json`, keeping exceptions reviewable.

## Implementation Quality

- Production changes are minimal and uniform: static strings became `$t()`
  bindings; no logic, layout, or data-flow change is present in the diff.
- New locale keys follow the existing `ops.*` hierarchy and the established
  Simplified Chinese prototype wording; `file_tree.*` forms a cohesive new
  namespace for the shared component.
- The multi-line FileTree binding keeps static keys, satisfying
  `@intlify/vue-i18n/no-dynamic-keys` instead of disabling it.

## Verification Evidence

- Focused `6/6`, touched-area `111/111`, full suite `594/594`, zero ESLint
  errors, zero TypeScript errors, Prettier clean (see
  `evidence/verification-receipt.json`).
- The full-suite run covers the previously closed slices, so the localization
  change introduces no regression elsewhere.

## Residual Risk

- Dynamic i18n keys built from variables (for example deployment status
  labels) are not enumerable by the literal scan; they were verified manually
  to exist in both locales and are covered by the deployment presentation
  component tests. Phase `8.2` facticity verification re-checks them.
