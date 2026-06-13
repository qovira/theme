---
"@qovira/theme": minor
---

Harden the theming runtime and export `STORAGE_KEY`. A bulk `localStorage.clear()` in another tab now re-resolves the theme (the cross-tab `storage` handler previously ignored the `key === null` clear event and left a stale theme), and a storage event that resolves to the already-active theme no longer fires a no-op subscriber notification. The `STORAGE_KEY` literal is now exported from `@qovira/theme/runtime` so consumers can reference the persisted key directly.
