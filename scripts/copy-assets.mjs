// Copy the CSS entry files and self-hosted font binaries into dist/ after the
// tsup TS build. tsup emits the ESM runtime (runtime.js, boot.js); the CSS and
// fonts are shipped as-is, so they are copied rather than compiled.
import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(repoRoot, "src");
const dist = join(repoRoot, "dist");

await mkdir(dist, { recursive: true });

await cp(join(src, "theme.css"), join(dist, "theme.css"));
await cp(join(src, "fonts.css"), join(dist, "fonts.css"));
await cp(join(src, "fonts"), join(dist, "fonts"), { recursive: true });

console.log("copy-assets: theme.css, fonts.css, fonts/ → dist/");
