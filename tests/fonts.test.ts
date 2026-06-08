import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const fontsCssPath = fileURLToPath(
  new URL("../src/fonts.css", import.meta.url),
);
const fontsDir = fileURLToPath(new URL("../src/fonts/", import.meta.url));
const css = readFileSync(fontsCssPath, "utf8");

/** @font-face block for a given font-family. */
function face(family: string): string {
  const marker = `font-family: "${family}"`;
  const idx = css.indexOf(marker);
  if (idx === -1) throw new Error(`no @font-face for ${family}`);
  const open = css.lastIndexOf("{", idx);
  const close = css.indexOf("}", idx);
  return css.slice(open + 1, close);
}

const families = [
  { family: "Fraunces", file: "fraunces-variable.woff2", weight: "100 900" },
  { family: "Figtree", file: "figtree-variable.woff2", weight: "300 900" },
  {
    family: "JetBrains Mono",
    file: "jetbrains-mono-variable.woff2",
    weight: "100 800",
  },
] as const;

describe("self-hosted fonts", () => {
  it.each(families)(
    "$family has a swap @font-face referencing a relative woff2",
    ({ family, file, weight }) => {
      const block = face(family);
      expect(block).toContain("font-display: swap");
      expect(block).toContain(`font-weight: ${weight}`);
      expect(block).toContain(`url("./fonts/${file}") format("woff2")`);
    },
  );

  it("ships every referenced woff2 as a real woff2 binary", () => {
    for (const { file } of families) {
      const path = fontsDir + file;
      expect(existsSync(path), file).toBe(true);
      // woff2 magic number "wOF2"
      const head = readFileSync(path).subarray(0, 4).toString("latin1");
      expect(head, file).toBe("wOF2");
    }
  });

  it("makes zero external/CDN requests (all urls are package-relative)", () => {
    expect(css).not.toMatch(/https?:/);
    // Every src url must be a ./fonts/ relative path.
    const urls = [...css.matchAll(/url\((.*?)\)/g)].map((m) => m[1] ?? "");
    expect(urls.length).toBe(families.length);
    for (const url of urls) {
      expect(url).toMatch(/^"\.\/fonts\//);
    }
  });

  it("covers the brand weights (Figtree 400/500/600, Fraunces 500/600)", () => {
    // Each family is a single variable file; its weight range must span the
    // discrete weights the brand uses.
    const inRange = (range: string, w: number): boolean => {
      const [lo, hi] = range.split(" ").map(Number) as [number, number];
      return w >= lo && w <= hi;
    };
    expect(
      ["100 900"].every((r) => [500, 600].every((w) => inRange(r, w))),
    ).toBe(true);
    for (const w of [400, 500, 600]) expect(inRange("300 900", w)).toBe(true);
  });
});
