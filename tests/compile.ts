import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";

const themeCssPath = fileURLToPath(
  new URL("../src/theme.css", import.meta.url),
);

/**
 * Compile `src/theme.css` through Tailwind v4 exactly as a consumer would
 * (`@import "tailwindcss"` first, then the theme), forcing the given utility
 * candidates to generate via `@source inline(...)`. Returns the emitted CSS so
 * tests can assert on both the `:root` variable declarations and the generated
 * utility rules.
 */
export async function compileTheme(
  candidates: readonly string[],
): Promise<string> {
  const theme = readFileSync(themeCssPath, "utf8");
  const input = [
    `@import "tailwindcss";`,
    theme,
    `@source inline("${candidates.join(" ")}");`,
  ].join("\n");

  const result = await postcss([tailwindcss()]).process(input, {
    from: themeCssPath,
  });
  return result.css;
}
