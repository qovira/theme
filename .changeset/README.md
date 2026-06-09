# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets) —
it drives `@qovira/theme`'s versioning and changelog.

When you make a change that should ship in a release, add a changeset:

```sh
pnpm changeset
```

It asks for the bump level and a summary, then writes a markdown file here. Pick
the level by the semver contract — what the change means for a consumer:

- **major** — a breaking change to the public surface: removing or renaming a
  semantic token or utility, removing or renaming an entry point (`.`, `./fonts`,
  `./runtime`, `./boot`), a breaking change to the runtime API
  (`getTheme`/`setTheme`/`toggleTheme`/`subscribe`) or the storage-key contract,
  dropping a theme or a bundled font, or raising the required `tailwindcss` peer
  range.
- **minor** — a backward-compatible addition: a new semantic token or utility, a
  new font, or an additive runtime API.
- **patch** — a backward-compatible fix with no surface change: a corrected token
  value, an accessibility/contrast fix, or a runtime edge-case fix.

Brand-governed changes (the palette, the type ramp, the two themes) still need
design sign-off regardless of bump level — see `CONTRIBUTING.md`.

At release time the accumulated changesets are consumed by `changeset version`,
which bumps `package.json` and writes `CHANGELOG.md`. See `CONTRIBUTING.md` for
the full release flow.
