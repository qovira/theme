# CLAUDE.md — `@qovira/theme`

Working guide for `@qovira/theme`. Authoritative for this repo's internals.

## Identity & hard constraints

`@qovira/theme` is Qovira's visual foundation, shipped as a distributable npm package: **Tailwind v4 design tokens, self-hosted fonts, and a small framework-agnostic theming runtime**. It is the single source of color/type/radius/elevation/motion (spacing rides Tailwind's stock 4px grid) and of the two themes — Daylight and Evening — for every Qovira surface (the SvelteKit product app and the marketing site).

Constraints to hold:

- Ships **only** CSS + fonts + a tiny TS runtime. It has **no framework dependency** and is **not a component library** — never add either.
- pnpm is the only package manager; **npm and yarn are banned**. pnpm settings (e.g. `allowBuilds: esbuild`) live in `pnpm-workspace.yaml`, never `package.json`.
- License Apache-2.0; © OMNILIUM ADVANCED CYBERNETICS SRL.

## Commands

```sh
pnpm build       # tsup → dist/{runtime,boot}.js (+ .d.ts); copy CSS + fonts → dist/
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint + prettier --check
pnpm format      # prettier --write
pnpm test        # vitest run
pnpm changeset           # record a changeset (drives versioning); see .changeset/
pnpm version-packages    # changeset version: consume changesets, bump + changelog
```

## Layout & build

- `src/theme.css` — the **single token file**; built verbatim to `dist/theme.css`.
- `src/fonts.css` + `src/fonts/*.woff2` — self-hosted variable fonts (+ OFL licenses).
- `src/runtime/boot.ts` → `dist/boot.js`; `src/runtime/theme.ts` → `dist/runtime.js`.
- `tsup` builds the two TS entries. `scripts/copy-assets.mjs` copies the CSS and `fonts/` into `dist/`, running `rm -rf dist/fonts` first so renamed/removed fonts can't linger — tsup's `clean` doesn't recurse that copied subtree.
- `exports`: `.`→theme.css, `./fonts`→fonts.css, `./runtime`→runtime.js, `./boot`→boot.js. The published tarball is `dist/` only (`files: ["dist"]`).

## Token architecture (load-bearing model)

`src/theme.css` has three layers. **Address Layer 3 (semantic utilities) almost exclusively from components** so a single component is correct in both themes:

1. **Layer 1 — `@theme` primitives** (theme-agnostic): brand ramps (`--color-warm/honey/clay-*`), status bases, `--font-*`, `--radius-*`, the `--text-*` role scale (size + line-height + letter-spacing + weight via the v4 `--text-*--…` modifiers), `--ease-qovira`. Plus a plain `:root` for `--duration-*` and `--z-*` (no Tailwind utility namespace).
2. **Layer 2 — semantic `[data-theme]` aliases** (theme-aware): `--surface`, `--text`, `--btn-primary*`, `--shadow-*`, status `--*-tint`/`--*-text`, etc. Defined for `:root, [data-theme="daylight"]` (default) and `[data-theme="evening"]` (declared later, so it wins). This is **the only place the two themes diverge**, and it is kept OUTSIDE `@theme` so it can be redeclared per theme.
3. **Layer 3 — `@theme inline`**: re-exports the Layer-2 vars as Tailwind tokens so `bg-surface`, `text-text`, `bg-success-tint`, … emit `var(--…)` and track the active theme.

After the layers: `@utility focus-ring|lamp-glow|lamp-glow-pulse|duration-*`, the `@keyframes qovira-pulse`, the global `prefers-reduced-motion` guard, and `@custom-variant evening`.

**To add a color/role:** put the raw value in Layer 1 `@theme`; add the role mapping to **both** Layer-2 blocks; expose it via Layer 3 `@theme inline` only if it needs a utility. Keep shadows and the lamp glow as raw `var(--shadow-*)` / `var(--lamp-glow)` (not color utilities). **Never redefine spacing** — brand 4px = `0.25rem` = the v4 `--spacing`; no off-grid values.

## Theming runtime

The active theme is `data-theme` on `<html>` (`daylight` | `evening`). Resolution order everywhere: stored `localStorage["qovira-theme"]` → `prefers-color-scheme` → `evening`. `./boot` is a synchronous IIFE **string** to inline in `<head>` before any stylesheet (prevents flash). `./runtime` exposes `getTheme/setTheme/toggleTheme/subscribe` — `setTheme(null)` clears the key (follow system); `subscribe` syncs cross-tab via the `storage` event. The boot string duplicates the storage-key literal because it must stand alone; a test asserts the two copies agree.

## Conventions

- **Keep `CLAUDE.md` and `README.md` current.** Both must track reality: when a change alters anything either describes (commands, layout, token architecture, runtime API, conventions, versioning/release flow), update the affected doc in the **same** change — never as a follow-up. Stale docs silently mislead every future session.
- **TypeScript** per the `writing-ts` house skill: ESM-only, `@tsconfig/strictest`, TS 6.x (`ignoreDeprecations: "6.0"`, because strictest still sets `baseUrl`).
- **Accessibility is enforced, not aspirational.** All text pairings must meet WCAG AA — `tests/contrast.test.ts` computes the ratios. Watch the traps: honey-700 (`#a66b28`) is **AA-large only** on cream, so the daylight `--link` uses honey-800 (`#7e4f1c`), and daylight `--warning-text` is `#855400`.
- **Versioning** is driven by **Changesets** (`.changeset/`): `pnpm changeset` records a consumer-visible change; `pnpm version-packages` (`changeset version`) consumes them on `main`, bumps `package.json`, and writes `CHANGELOG.md`. Then push a matching `v*` tag to release. Bump contract (full version in `.changeset/README.md`): **major** = removed/renamed token·utility·entry, breaking runtime/storage change, dropped theme·font, or raised `tailwindcss` range; **minor** = additive token·utility·font·runtime API; **patch** = token-value/contrast/runtime-edge fix.
- **CI** (`writing-workflows` house skill): jobs run on **Blacksmith** runners — except the `release.yml` publish job, which **must** run GitHub-hosted, because npm provenance (sigstore) is only attestable there (Blacksmith reports as self-hosted → the registry 422s). `ci.yml` = build + lint + typecheck + test. `release.yml` (on a `v*` tag) is **two jobs**: a `verify` gate on Blacksmith (guard tag == `package.json`, then build + lint + typecheck + test) → a minimal GitHub-hosted `publish` (build + `pnpm publish` via OIDC trusted publishing + provenance). **Never publish anything that didn't pass the gate.**
- **Contributor docs:** `CONTRIBUTING.md` (outside-PR workflow, scope, the tests-required-for-new-tokens rule, changesets) and `CODE_OF_CONDUCT.md` (Contributor Covenant) define the human-contributor process; keep them in sync with these conventions.

## Testing

Tests live in `tests/` (Vitest). CSS is verified by **actually compiling `src/theme.css` through Tailwind v4** via `tests/compile.ts` — `compileTheme(...)` with `@source inline(...)`, then asserting on the emitted variables/utilities. This is the source of truth for "does this token/utility resolve". Runtime tests use `// @vitest-environment happy-dom` plus `tests/setup-dom.ts` (an in-memory `localStorage` polyfill — neither happy-dom nor Node exposes a usable one). `tests/recipes.test.ts` extracts every utility string from the README recipes and asserts each resolves, so the docs can't drift from the shipped CSS.

**When you change `src/theme.css`, run `pnpm test`** — the compile-based suites catch typos, missing tokens, and AA regressions.
