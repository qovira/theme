# @qovira/theme

## 1.1.0

### Minor Changes

- a120d42: Harden the theming runtime and export `STORAGE_KEY`. A bulk `localStorage.clear()` in another tab now re-resolves the theme (the cross-tab `storage` handler previously ignored the `key === null` clear event and left a stale theme), and a storage event that resolves to the already-active theme no longer fires a no-op subscriber notification. The `STORAGE_KEY` literal is now exported from `@qovira/theme/runtime` so consumers can reference the persisted key directly.

## 1.0.2

### Patch Changes

- c8d9d21: Darken `--color-error` (`#d6452e` → `#cc4029`) so white text on a `bg-error`
  fill — the destructive button — clears WCAG AA (now 4.85:1, was 4.42:1). The
  error red stays a single token; borders, icons, and the independent
  `--error-tint` / `--error-text` pairings are unaffected. A contrast test now
  locks white-on-`error` at AA so it can't regress.
- 6b32946: Reformat the shipped `theme.css` with the standardized Prettier config
  (`printWidth: 180`). No token, utility, runtime, or API changes — the output is
  semantically identical; only source formatting differs.
