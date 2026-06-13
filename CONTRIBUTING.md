# Contributing to @qovira/theme

Thanks for your interest in `@qovira/theme` — Qovira's visual foundation: Tailwind v4 tokens, self-hosted fonts, and a small framework-agnostic theming runtime. It is the single source of color, type, radius, elevation, and motion — plus spacing on Tailwind's stock 4px grid — for every Qovira surface, so changes here ripple everywhere. We're glad to have help keeping it sharp.

## Ground rules

- **Open an issue first.** Before sending a pull request — especially anything that adds or changes a token, color, or public entry point — open an issue so we can agree on the approach. A design system is a shared contract; a quick conversation up front saves a rejected PR later. Typo fixes and obviously correct documentation tweaks can skip straight to a PR.
- **Be kind.** This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you're expected to uphold it; please report unacceptable behavior to the address listed there.
- **Licensing.** The project is [Apache-2.0](./LICENSE). Under section 5 of that license, any contribution you submit for inclusion is licensed under the same terms — opening a pull request is all the agreement we need. There's no CLA and no per-commit sign-off to remember.

## What belongs here

This package is deliberately small. It ships **only** design tokens, self-hosted fonts, and a tiny theming runtime — it has **no framework dependency** and is **not** a component library. Keeping that boundary tight is what lets every Qovira surface share one source of truth.

**In scope** — contributions we welcome:

- Bug fixes (wrong token value, a broken utility, a runtime edge case).
- Accessibility fixes — especially anything that improves a WCAG contrast result.
- New **semantic** tokens or utilities that any surface can reuse.
- Documentation: the README recipes, this guide, code comments.
- Tests, build, and tooling improvements.

**Out of scope** — please don't open a PR for these:

- **Components.** Buttons, inputs, modals, and the like belong in app code, built _on top_ of these tokens. The README's "Component recipes" are reference patterns, not shipped UI.
- **Application-specific tokens.** A value only one surface needs lives in that surface, not here.
- **A framework dependency.** No Svelte, React, or DOM-framework imports — the runtime stays framework-agnostic.

**Brand-governed — design sign-off required.** The brand palette, the type ramp, and the two themes (Daylight and Evening) are owned by Qovira design. PRs that add brand colors, introduce a third theme, or alter the Daylight/Evening palettes won't be merged without prior design approval. Open an issue and we'll loop in design before any code is written. (Fixing a token that fails contrast is an accessibility fix, not a palette change — that's welcome.)

## Getting set up

You'll need **Node ≥ 24** and **pnpm** — pnpm is the only supported package manager (npm and yarn are not used here). The pnpm version is pinned in `package.json`; the easiest way to match it is [Corepack](https://nodejs.org/api/corepack.html), which ships with Node:

```sh
corepack enable          # one-time; activates the pinned pnpm
pnpm install
```

Four scripts cover the whole workflow:

```sh
pnpm build       # tsup → dist/{runtime,boot}.js + copy CSS & fonts → dist/
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint + prettier --check
pnpm test        # vitest run
```

Run `pnpm format` to apply Prettier. Before you open a PR, all four of the above should pass — that's exactly what CI runs.

## How the codebase is organized

Everything ships from a few small source files; `dist/` is generated, never edited by hand.

| Path                      | What it is                                                              |
| ------------------------- | ----------------------------------------------------------------------- |
| `src/theme.css`           | The **single token file** — built verbatim to `dist/theme.css`.         |
| `src/fonts.css`           | Self-hosted `@font-face` rules.                                         |
| `src/fonts/*.woff2`       | The bundled variable fonts (+ their OFL licenses).                      |
| `src/runtime/theme.ts`    | The `getTheme`/`setTheme`/`toggleTheme`/`subscribe` API → `runtime.js`. |
| `src/runtime/boot.ts`     | The pre-paint snippet (a string, inlined in `<head>`) → `boot.js`.      |
| `scripts/copy-assets.mjs` | Copies the CSS and `fonts/` into `dist/` after the TS build.            |
| `tests/`                  | Vitest suites (see [Testing](#testing-and-accessibility)).              |

`tsup` builds the two TypeScript entries; `pnpm build` then runs the copy script. The published tarball is `dist/` only.

### The three-layer token model

`src/theme.css` is the heart of the package, and it's built in three layers. Understanding them is the difference between a change that works in one theme and one that's correct in both. **Components address Layer 3 almost exclusively**, so a single class string is right in both Daylight and Evening.

1. **Layer 1 — `@theme` primitives** (theme-agnostic). The raw material: brand color ramps (`--color-warm/honey/clay-*`), status bases, `--font-*`, `--radius-*`, the `--text-*` role scale (size + line-height + letter-spacing + weight, via Tailwind v4's `--text-*--…` modifiers), and `--ease-qovira`. Plus a plain `:root` block for `--duration-*` and `--z-*`. These values don't change between themes.

2. **Layer 2 — semantic `[data-theme]` aliases** (theme-aware). This is the **only** place the two themes diverge. It maps primitives to roles — `--surface`, `--text`, `--btn-primary*`, `--shadow-*`, status `--*-tint`/`--*-text`, and so on. Declared twice: once for `:root, [data-theme="daylight"]` (the default) and again for `[data-theme="evening"]` (declared later, so it wins). It lives **outside** `@theme` precisely so it can be redeclared per theme.

3. **Layer 3 — `@theme inline`**. Re-exports the Layer 2 variables as Tailwind tokens, so `bg-surface`, `text-text`, `bg-success-tint`, … each emit `var(--…)` and automatically track the active theme.

After the three layers come the custom utilities (`focus-ring`, `lamp-glow`, `lamp-glow-pulse`, `duration-*`), the `qovira-pulse` keyframes, the global `prefers-reduced-motion` guard, and the `evening` custom variant.

### Adding a color or role

Follow the layers:

1. Put the **raw value** in Layer 1 (`@theme`).
2. Map it to a **role in both** Layer 2 blocks — the `daylight`/`:root` block and the `evening` block. A role that exists in one theme but not the other is a bug.
3. Expose it via Layer 3 (`@theme inline`) **only if** it needs to be a utility.

Some things stay raw on purpose: shadows and the lamp glow are used as `var(--shadow-*)` / `var(--lamp-glow)`, not color utilities. Spacing is **not** redefined — the brand's 4px grid is already Tailwind v4's default `--spacing` (`0.25rem`), so use the standard scale and don't introduce off-grid values.

When in doubt, read `src/theme.css` top to bottom — it's ordered to be read that way, and the comments explain the intent.

## Testing and accessibility

Tests live in `tests/` and run with Vitest (`pnpm test`). This suite is the source of truth for "does this token resolve and is it accessible," so it's worth understanding before you change `src/theme.css`.

The CSS tests don't assert on strings in the source file — they **actually compile `src/theme.css` through Tailwind v4** (via `tests/compile.ts`) and then assert on the emitted variables and utilities. That means a typo, a missing token, or a utility that doesn't resolve fails a test rather than slipping through. A few suites worth knowing:

- `tests/contrast.test.ts` computes real WCAG contrast ratios for text/background pairings, resolving every color from the compiled theme. **All text pairings must meet WCAG AA — this is enforced, not aspirational.** (For example, honey-700 is AA-large only on cream, which is exactly why the Daylight `--link` uses honey-800 instead.)
- `tests/recipes.test.ts` extracts every utility string from the README's component recipes and asserts each one resolves, so the docs can't drift from the shipped CSS.
- The runtime suites use happy-dom plus an in-memory `localStorage` polyfill (`tests/setup-dom.ts`).

### Tests are required for what you add

Keeping CI green is the floor, not the ceiling. Because so much is generated, adding to the system means adding to its tests:

- **A new semantic color** that produces a text/background pairing **must** come with a contrast assertion in `tests/contrast.test.ts`. No new pairing ships without a proven AA ratio.
- **A new token or utility** must have an assertion that it compiles and resolves to the expected value (the existing token/utility suites show the pattern).
- **A bug fix** must include a regression test that fails before your change and passes after.

If you're unsure where an assertion belongs, open the matching existing suite — they're short and the patterns are easy to copy.

## Opening a pull request

Once there's an issue and your change is ready:

1. **Branch** off `main` and make your change there.
2. **Keep it scoped.** One logical change per PR. A focused diff is reviewed faster than a sweeping one.
3. **Run the full check locally** — `pnpm build && pnpm lint && pnpm typecheck && pnpm test` — before you push. CI runs exactly these, and the same four must be green to merge.
4. **Add a changeset** for any consumer-visible change (see [Changesets](#changesets)).
5. **Write a clear PR description.** Say what changed and why, and link the issue it resolves. A good title is enough; you don't need to agonize over commit formatting (see below).

### Changesets

Consumer-visible changes are versioned with [Changesets](https://github.com/changesets/changesets). If your change affects what ships, run `pnpm changeset` and commit the generated file — it prompts for the bump level and a summary:

- **major** — removing/renaming a token, utility, or entry point; a breaking runtime-API or storage-key change; dropping a theme or font; or raising the `tailwindcss` peer range.
- **minor** — a new token, utility, font, or additive runtime API.
- **patch** — a corrected token value, an accessibility/contrast fix, or a runtime edge-case fix, with no surface change.

A changeset is the most useful thing you can add, but it's not a blocker — if you're unsure of the level or forget, a maintainer will add one on merge. See `.changeset/README.md`.

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) on `main`, but **you don't have to**. PRs are squash-merged, and a maintainer writes the final Conventional Commit message on merge. So:

- Give the **PR** a clear, descriptive title and a useful description — that's what we work from.
- Your individual commits can be whatever helps you; they won't survive the squash.
- You may notice `QOV-…` identifiers in our commit history. Those are internal Linear references and are **maintainer-only** — please don't add them, and never put them in source, comments, or docs. The codebase stands on its own.

### Review

A maintainer will review for correctness, scope, accessibility (does any new pairing pass AA?), and fit with the token model. Expect a conversation — it's how we keep the foundation coherent. Once it's approved and green, we squash and merge.

## Releases

Releasing is **maintainers only** — there's nothing for a contributor to do here beyond landing a changeset, but it's documented so the process isn't a mystery. Versioning and the changelog are driven by Changesets: `pnpm version-packages` (`changeset version`) consumes the pending changesets on `main`, bumps `package.json`, and writes `CHANGELOG.md`. The maintainer commits that and pushes the matching `v*` tag (e.g. `v1.2.3`).

The tag — never a manual `pnpm publish` — drives the release workflow, which first runs the **full gate on Blacksmith** (verifies the tag matches `package.json`, then build + lint + typecheck + test) and only then publishes `@qovira/theme` to npm from a single GitHub-hosted job with a signed provenance attestation via OIDC trusted publishing. A tag whose version doesn't match `package.json` fails before anything is built or published.

---

Thanks again for contributing. Questions that aren't a bug report are welcome as issues too — if something here is unclear, that's worth an issue of its own.
