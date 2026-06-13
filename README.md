# @qovira/theme

Qovira's visual foundation as a distributable package: **Tailwind v4 tokens**, **self-hosted fonts**, and a small **framework-agnostic theming runtime**. It is the single source of color, type, radius, elevation, and motion — plus spacing on Tailwind's stock 4px grid — and the two themes, **Daylight** and **Evening**, shared by every Qovira surface (the product web app and the [qovira.ai](https://qovira.ai) marketing site), so the brand stays identical across them without copy-paste.

The package is the _foundation_ a component library is built on — it ships only tokens, fonts, and a tiny runtime, and has **no framework dependency**.

> Status: stable (1.0). Tokens, fonts, runtime, and utilities are shipped; all four entry points resolve to real assets.

## Install

This package requires [Tailwind CSS v4](https://tailwindcss.com) in the consumer (both consumers use the `@tailwindcss/vite` plugin) and **Node `>=24`**. The package manager is **pnpm**.

```sh
pnpm add @qovira/theme
```

## Usage

### 1. Tokens + fonts — `app.css`

Import order matters: bring in `tailwindcss` **first** so the package's `@theme` blocks _extend_ the Tailwind defaults rather than precede them.

```css
@import "tailwindcss";
@import "@qovira/theme"; /* tokens + semantic layer + @theme inline */
@import "@qovira/theme/fonts"; /* self-hosted @font-face (no CDN) */
```

The fonts are bundled in the package and referenced with relative URLs; Vite fingerprints them and serves them from your own origin — no external request.

### 2. Pre-paint theme (no flash) — app shell `<head>`

Inline the boot snippet in the document `<head>` **before any stylesheet** so `data-theme` is set on `<html>` before first paint. It resolves the theme as `localStorage` → `prefers-color-scheme` → `evening`.

```js
import { boot } from "@qovira/theme/boot"; // the raw snippet, as a string
// inject `boot` into a synchronous <script> in <head>
```

> **SvelteKit:** the boot string must go in `src/app.html` inside `<head>`, **not** a layout — `%sveltekit.head%` runs too late to prevent a flash.

### 3. Toggle / persist — `@qovira/theme/runtime`

```ts
import { getTheme, setTheme, toggleTheme, subscribe } from "@qovira/theme/runtime";
```

Framework-agnostic get/set/persist with cross-tab sync. The runtime is browser-only — call it after the DOM exists (e.g. from `onMount`/an effect), not during SSR. A Svelte store/rune wrapper, and the three-state Daylight/Evening/System control, are the app's concern — built on `subscribe`.

## Entry points

| Import                  | Resolves to       | Contents                                  |
| ----------------------- | ----------------- | ----------------------------------------- |
| `@qovira/theme`         | `dist/theme.css`  | tokens + semantic layer + `@theme inline` |
| `@qovira/theme/fonts`   | `dist/fonts.css`  | `@font-face` + bundled woff2              |
| `@qovira/theme/runtime` | `dist/runtime.js` | get/set/persist toggle API                |
| `@qovira/theme/boot`    | `dist/boot.js`    | the raw pre-paint string, for inlining    |

## Component recipes

These are **reference patterns, not shipped components.** `@qovira/theme` has no framework dependency and ships only tokens, utilities, and fonts — a component library is built _on top_ of it, separately, in app code. The class strings below are copy-pasteable and built entirely from the semantic layer, so **one recipe is correct in both Daylight and Evening** with no per-theme edits — the `data-theme` attribute on `<html>` does the switching.

### Headings

Pair a family utility with a role size token (font-family isn't carried by the `text-*` tokens):

```
font-display text-h1
font-display text-h2
font-sans text-h4
```

Body copy uses `text-body`, caps measure at `max-w-[70ch]`, and always uses `text-text` (never `text-text-muted`).

### Button

Shared base (all variants). Touch contexts bump `h-10` → `h-11` (≥44px):

```
inline-flex items-center justify-center gap-2 rounded-md text-button h-10 px-4
select-none transition-[background,box-shadow,transform] duration-micro ease-qovira
focus-ring disabled:opacity-50 disabled:pointer-events-none
```

Primary — espresso (Daylight) ↔ honey (Evening), automatic via `--btn-primary`:

```
bg-btn-primary text-btn-primary-fg hover:bg-btn-primary-hover active:bg-btn-primary-active active:scale-[.99]
```

Key-CTA — the single most important action; raw honey in both themes. Only **one** per view (the ≤10% accent rule):

```
bg-accent text-warm-900 hover:bg-honey-600 active:bg-honey-700
```

Secondary — hairline-bordered:

```
bg-transparent text-text border border-border hover:bg-surface-raised active:bg-warm-200/40
```

Ghost — text-only:

```
bg-transparent text-link hover:bg-link/8 active:bg-link/12
```

Destructive — pair with a confirm for irreversible actions:

```
bg-error text-white hover:brightness-95 active:brightness-90
```

### Input

```
flex h-10 w-full rounded-md px-3 text-body bg-surface-raised text-text border border-border
placeholder:text-text-muted focus-ring aria-[invalid=true]:border-error disabled:opacity-50
```

Label uses `text-label text-text-muted`; helper/error text uses `text-small`, with the error message in:

```
text-small text-error-text
```

Never rely on the red border alone — set `aria-invalid` and show the message.

### Card / panel

```
rounded-lg bg-surface-raised border border-border p-6 shadow-[var(--shadow-sm)]
```

Interactive cards add:

```
focus-ring hover:shadow-[var(--shadow-md)] transition-shadow duration-base ease-qovira
```

Modals / dialogs use:

```
rounded-xl shadow-[var(--shadow-lg)]
```

### Focus

Every interactive element gets the brand's non-negotiable ring. Never removed, never a bare `outline: none`:

```
focus-ring
```

### Lamp-glow

The signature honey motif — focus emphasis, loaders, special moments; **never** general elevation. Static halo:

```
lamp-glow
```

As a loader, drive the pulse on a honey radial-gradient. Always provide a static / `aria-live` fallback so meaning isn't trapped in animation (the pulse is collapsed under `prefers-reduced-motion`):

```
lamp-glow-pulse
```

### Chip / pill

```
inline-flex items-center gap-1 rounded-sm h-7 px-2.5 text-small bg-surface-raised text-text-muted border border-border
```

Status chips swap to the matching tint/text **with an icon** — never color alone:

```
bg-success-tint text-success-text
```

Use `rounded-full` only for true pills, toggles, and avatars.

### Guardrails

- **Accent discipline.** Honey covers ≤ ~10% of any screen. Primary actions are espresso (Daylight) / honey (Evening); raw honey is reserved for the one Key-CTA, focus, and highlights.
- **Accent never signals status.** Status uses the semantic colors only — honey and warning-amber stay distinct so "heads up" never reads as "brand".
- **Never color alone.** Every status pairs color with an icon or text label; error inputs get `aria-invalid` + a message, not just a red border.
- **Focus is never removed.** Always the visible 2px honey ring via `focus-ring`; no bare `outline: none`.
- **Type.** Body copy always uses `text-text`, never `text-text-muted` (muted is for genuinely secondary text — timestamps, counts, hints).
- **Hit targets.** ≥40px desktop (`h-10`), ≥44px touch (`h-11`).

## Development

```sh
pnpm install
pnpm build       # tsup → dist/{runtime,boot}.js (+ .d.ts) + copy CSS/fonts → dist/
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint + prettier --check
pnpm test        # vitest run
```

## Versioning & releases

`@qovira/theme` follows **[semantic versioning](https://semver.org)**. It's the upstream of the Qovira stack: a breaking change here (a removed token, a changed runtime API) ripples to every consumer, so the version is a real contract.

| Bump      | What changed                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **major** | A breaking change: a token/utility/entry-point removed or renamed, a breaking runtime-API or storage-key change, a dropped theme/font, or a raised `tailwindcss` peer range. |
| **minor** | A backward-compatible addition: a new token, utility, font, or additive runtime API.                                                                                         |
| **patch** | A backward-compatible fix: a corrected token value, an accessibility/contrast fix, or a runtime edge-case fix.                                                               |

### Cutting a release

Versioning and the changelog are driven by [Changesets](https://github.com/changesets/changesets). The flow:

1. **As you work**, record each consumer-visible change with a changeset — `pnpm changeset` prompts for the bump level (per the table above) and a summary, writing a file under `.changeset/`. (See `.changeset/README.md`.)
2. **To release**, run `pnpm version-packages` (`changeset version`) on `main`: it consumes the pending changesets, bumps `package.json`, and updates `CHANGELOG.md`. Commit that, then create and push a matching `vX.Y.Z` tag.
3. **The tag triggers** [`.github/workflows/release.yml`](.github/workflows/release.yml): the full gate (tag-vs-`package.json`, build, lint, typecheck, test) runs on Blacksmith, then a single GitHub-hosted job publishes to npm via **Trusted Publishing** (tokenless OIDC) with a **provenance attestation**. Only `dist/` is in the published tarball (`files: ["dist"]`).

> **One-time npm setup** (outside this repo): on npmjs.com, configure `@qovira/theme`'s **Trusted Publisher** to point at this repository and the release workflow. No `NPM_TOKEN` secret is used — Trusted Publishing replaces long-lived tokens entirely.

## Contributing

Contributions are welcome — read [CONTRIBUTING.md](./CONTRIBUTING.md) first, and please follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Open an issue before sending a PR that adds or changes a token, color, or entry point.

## License

[Apache-2.0](./LICENSE) © OMNILIUM ADVANCED CYBERNETICS SRL
