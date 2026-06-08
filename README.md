# @qovira/theme

Qovira's visual foundation as a distributable package: **Tailwind v4 tokens**,
**self-hosted fonts**, and a small **framework-agnostic theming runtime**. It is
the single source of color, type, spacing, radius, elevation, motion, and the two
themes — **Daylight** and **Evening** — shared by every Qovira surface (the
product web app and the [qovira.ai](http://qovira.ai) marketing site), so the
brand stays identical across them without copy-paste.

The package is the _foundation_ a component library is built on — it ships only
tokens, fonts, and a tiny runtime, and has **no framework dependency**.

> Status: early development. Tokens, fonts, runtime, and utilities are being
> filled in; some entry points still resolve to placeholders.

## Install

This package requires [Tailwind CSS v4](https://tailwindcss.com) in the consumer
(both consumers use the `@tailwindcss/vite` plugin). The package manager is
**pnpm**.

```sh
pnpm add @qovira/theme
```

## Usage

### 1. Tokens + fonts — `app.css`

Import order matters: bring in `tailwindcss` **first** so the package's `@theme`
blocks _extend_ the Tailwind defaults rather than precede them.

```css
@import "tailwindcss";
@import "@qovira/theme"; /* tokens + semantic layer + @theme inline */
@import "@qovira/theme/fonts"; /* self-hosted @font-face (no CDN) */
```

The fonts are bundled in the package and referenced with relative URLs; Vite
fingerprints them and serves them from your own origin — no external request.

### 2. Pre-paint theme (no flash) — app shell `<head>`

Inline the boot snippet in the document `<head>` **before any stylesheet** so
`data-theme` is set on `<html>` before first paint. It resolves the theme as
`localStorage` → `prefers-color-scheme` → `evening`.

```js
import { boot } from "@qovira/theme/boot"; // the raw snippet, as a string
// inject `boot` into a synchronous <script> in <head>
```

> **SvelteKit:** the boot string must go in `src/app.html` inside `<head>`, **not**
> a layout — `%sveltekit.head%` runs too late to prevent a flash.

### 3. Toggle / persist — `@qovira/theme/runtime`

```ts
import {
  getTheme,
  setTheme,
  toggleTheme,
  subscribe,
} from "@qovira/theme/runtime";
```

Framework-agnostic get/set/persist with cross-tab sync. A Svelte store/rune
wrapper, and the three-state Daylight/Evening/System control, are the app's
concern — built on `subscribe`.

## Entry points

| Import                  | Resolves to       | Contents                                  |
| ----------------------- | ----------------- | ----------------------------------------- |
| `@qovira/theme`         | `dist/theme.css`  | tokens + semantic layer + `@theme inline` |
| `@qovira/theme/fonts`   | `dist/fonts.css`  | `@font-face` + bundled woff2              |
| `@qovira/theme/runtime` | `dist/runtime.js` | get/set/persist toggle API                |
| `@qovira/theme/boot`    | `dist/boot.js`    | the raw pre-paint string, for inlining    |

## Development

```sh
pnpm install
pnpm build       # tsup → dist/{runtime,boot}.js + copy CSS/fonts → dist/
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint + prettier --check
pnpm test        # vitest run
```

## License

[Apache-2.0](./LICENSE) © OMNILIUM ADVANCED CYBERNETICS SRL
