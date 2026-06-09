# CLAUDE.md

Guidance for working in `@qovira/theme`.

## What this is

`@qovira/theme` is Qovira's visual foundation as a distributable npm package:
**Tailwind v4 tokens, self-hosted fonts, and a small framework-agnostic theming
runtime**. It is the single source of color/type/radius/elevation/motion (spacing
rides Tailwind's stock 4px grid) and the two themes (Daylight, Evening) for every
Qovira surface — the product web
app (SvelteKit) and the marketing site. It ships only CSS + fonts + a tiny TS
runtime; it has **no framework dependency** and is **not** a component library.

License Apache-2.0; © OMNILIUM ADVANCED CYBERNETICS SRL.

## Commands

```sh
pnpm build       # tsup → dist/{runtime,boot}.js (+ .d.ts); copy CSS + fonts → dist/
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint + prettier --check
pnpm format      # prettier --write
pnpm test        # vitest run
```

pnpm is the only package manager (npm/yarn are banned). pnpm settings (e.g.
`allowBuilds: esbuild`) live in `pnpm-workspace.yaml`, not `package.json`.

## Layout & build

- `src/theme.css` — the **single token file** (built verbatim to `dist/theme.css`).
- `src/fonts.css` + `src/fonts/*.woff2` — self-hosted variable fonts (+ OFL licenses).
- `src/runtime/boot.ts` → `dist/boot.js`; `src/runtime/theme.ts` → `dist/runtime.js`.
- `tsup` builds the two TS entries; `scripts/copy-assets.mjs` copies the CSS and
  `fonts/` into `dist/` (it `rm -rf dist/fonts` first so renamed/removed fonts
  can't linger — tsup's `clean` doesn't recurse that copied subtree).
- `exports`: `.`→theme.css, `./fonts`→fonts.css, `./runtime`→runtime.js,
  `./boot`→boot.js. Published tarball is `dist/` only (`files: ["dist"]`).

## Token architecture (the load-bearing model)

`src/theme.css` has three layers; **components address Layer 3 (semantic
utilities) almost exclusively** so one component is correct in both themes:

1. **Layer 1 — `@theme` primitives** (theme-agnostic): brand ramps
   (`--color-warm/honey/clay-*`), status bases, `--font-*`, `--radius-*`, the
   `--text-*` role scale (size + line-height + letter-spacing + weight via the v4
   `--text-*--…` modifiers), `--ease-qovira`. Plus a plain `:root` for
   `--duration-*` and `--z-*` (no Tailwind utility namespace).
2. **Layer 2 — semantic `[data-theme]` aliases** (theme-aware): `--surface`,
   `--text`, `--btn-primary*`, `--shadow-*`, status `--*-tint`/`--*-text`, etc.
   Defined for `:root, [data-theme="daylight"]` (default) and
   `[data-theme="evening"]` (later, so it wins). **The only place the two themes
   diverge.** Kept OUTSIDE `@theme` so they can be redeclared per theme.
3. **Layer 3 — `@theme inline`**: re-exports the Layer-2 vars as Tailwind tokens
   so `bg-surface`, `text-text`, `bg-success-tint`, … emit `var(--…)` and track
   the active theme.

Then: `@utility focus-ring|lamp-glow|lamp-glow-pulse|duration-*`, the
`@keyframes qovira-pulse`, the global `prefers-reduced-motion` guard, and
`@custom-variant evening`.

**Adding a color/role:** raw value → Layer 1 `@theme`; role mapping → both
Layer-2 blocks; expose via Layer 3 `@theme inline` only if it needs a utility.
Shadows and the lamp glow stay raw `var(--shadow-*)` / `var(--lamp-glow)` (not
color utilities). Spacing is intentionally NOT redefined (brand 4px = `0.25rem` =
v4 `--spacing`); no off-grid values.

## Theming runtime

The active theme is `data-theme` on `<html>` (`daylight` | `evening`). Resolution
order everywhere: stored `localStorage["qovira-theme"]` → `prefers-color-scheme`
→ `evening`. `./boot` is a synchronous IIFE **string** to inline in `<head>`
before any stylesheet (no flash); `./runtime` is `getTheme/setTheme/toggleTheme/
subscribe` (`setTheme(null)` clears the key → follow system; `subscribe` syncs
cross-tab via the `storage` event). The boot string duplicates the storage-key
literal (it's standalone); a test asserts the two agree.

## Conventions

- **TypeScript** per the `writing-ts` house skill: ESM-only, `@tsconfig/strictest`,
  TS 6.x (`ignoreDeprecations: "6.0"` because strictest still sets `baseUrl`).
- **Accessibility is enforced, not aspirational.** All text pairings must meet
  WCAG AA — `tests/contrast.test.ts` computes the ratios. Note: honey-700
  (`#a66b28`) is **AA-large only** on cream, so the daylight `--link` uses
  honey-800 (`#7e4f1c`); daylight `--warning-text` is `#855400`.
- **Don't put Linear issue references** (`QOV-…`) in source, comments, or docs —
  the codebase stands on its own. Issue IDs belong only in commit messages.
- **CI** (`writing-workflows`): jobs run on **Blacksmith** runners — except the
  `release.yml` publish job, which must run GitHub-hosted because npm provenance
  (sigstore) is only attestable there (Blacksmith reports as self-hosted → the
  registry 422s). `ci.yml` = build+lint+typecheck+test; `release.yml` publishes
  on a `v*` tag (OIDC trusted publishing + provenance; guards that the tag ==
  `package.json` version).
- **Contributor docs:** `CONTRIBUTING.md` (outside-PR workflow, scope, the
  tests-required-for-new-tokens rule) and `CODE_OF_CONDUCT.md` (Contributor
  Covenant) define the human-contributor process; keep them in sync with these
  conventions.

## Testing

Tests live in `tests/` (Vitest). CSS is verified by **actually compiling
`src/theme.css` through Tailwind v4** via `tests/compile.ts` — `compileTheme(...)`
with `@source inline(...)` — then asserting on the emitted variables/utilities;
this is the source of truth for "does this token/utility resolve". Runtime tests
use `// @vitest-environment happy-dom` plus `tests/setup-dom.ts` (an in-memory
`localStorage` polyfill — neither happy-dom nor Node exposes a usable one
here). `tests/recipes.test.ts` extracts every utility string from the README
recipes and asserts each resolves, so the docs can't drift from the shipped CSS.

When you change `src/theme.css`, run `pnpm test` — the compile-based suites catch
typos, missing tokens, and AA regressions.
