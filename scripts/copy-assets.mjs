// Copy the CSS entry files and self-hosted font binaries into dist/ after the
// tsup TS build. tsup emits the ESM runtime (runtime.js, boot.js); the CSS and
// fonts are shipped as-is, so they are copied rather than compiled.
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(repoRoot, "src");
const dist = join(repoRoot, "dist");

await mkdir(dist, { recursive: true });

await cp(join(src, "theme.css"), join(dist, "theme.css"));
await cp(join(src, "fonts.css"), join(dist, "fonts.css"));

// Mirror src/fonts → dist/fonts. Remove the destination first so an incremental
// build (tsup's clean doesn't recurse into this copied subtree) can't leave a
// stale or renamed font behind to ship in the tarball.
await rm(join(dist, "fonts"), { recursive: true, force: true });
await cp(join(src, "fonts"), join(dist, "fonts"), { recursive: true });

console.log("copy-assets: theme.css, fonts.css, fonts/ → dist/");
