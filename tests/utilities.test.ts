import { describe, expect, it } from "vitest";

import { compileTheme } from "./compile.js";

/** Brace-depth-aware extraction of a full (possibly nested) rule. */
function rule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`rule \`${selector}\` not found`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces for \`${selector}\``);
}

describe("focus / lamp-glow / motion utilities", () => {
  it("focus-ring is a :focus-visible 2px-surface + 2px-honey ring", async () => {
    const css = await compileTheme(["focus-ring"]);
    const block = rule(css, ".focus-ring");
    expect(block).toContain("&:focus-visible");
    expect(block).toContain("outline: none");
    expect(block).toContain("0 0 0 2px var(--surface)");
    expect(block).toContain("0 0 0 4px var(--focus-ring)");
  });

  it("lamp-glow applies the honey halo box-shadow", async () => {
    const css = await compileTheme(["lamp-glow"]);
    expect(rule(css, ".lamp-glow")).toContain("box-shadow: var(--lamp-glow)");
  });

  it("lamp-glow-pulse drives the qovira-pulse keyframe at ~1200ms", async () => {
    const css = await compileTheme(["lamp-glow-pulse"]);
    expect(rule(css, ".lamp-glow-pulse")).toMatch(
      /animation:\s*qovira-pulse\s+1200ms/,
    );
    expect(css).toContain("@keyframes qovira-pulse");
  });

  it("duration-micro|base|overlay set transition-duration to the tokens", async () => {
    const css = await compileTheme([
      "duration-micro",
      "duration-base",
      "duration-overlay",
    ]);
    expect(rule(css, ".duration-micro")).toContain(
      "transition-duration: var(--duration-micro)",
    );
    expect(rule(css, ".duration-base")).toContain(
      "transition-duration: var(--duration-base)",
    );
    expect(rule(css, ".duration-overlay")).toContain(
      "transition-duration: var(--duration-overlay)",
    );
  });

  it("ships the global reduced-motion guard", async () => {
    const css = await compileTheme([]);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    const guard = css.slice(css.indexOf("@media (prefers-reduced-motion"));
    expect(guard).toContain("animation-duration: 0.01ms !important");
    expect(guard).toContain("transition-duration: 0.01ms !important");
  });

  it("the evening variant targets elements under [data-theme=evening]", async () => {
    const css = await compileTheme(["evening:border-0"]);
    const block = rule(css, ".evening\\:border-0");
    expect(block).toContain('[data-theme="evening"]');
  });
});
