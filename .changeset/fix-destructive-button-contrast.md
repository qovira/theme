---
"@qovira/theme": patch
---

Darken `--color-error` (`#d6452e` → `#cc4029`) so white text on a `bg-error`
fill — the destructive button — clears WCAG AA (now 4.85:1, was 4.42:1). The
error red stays a single token; borders, icons, and the independent
`--error-tint` / `--error-text` pairings are unaffected. A contrast test now
locks white-on-`error` at AA so it can't regress.
