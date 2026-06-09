import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { compileTheme } from "./compile.js";

const readme = readFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), "utf8");

/** The "## Component recipes" section, up to the next top-level heading. */
function recipesSection(): string {
  const start = readme.indexOf("## Component recipes");
  expect(start, "Component recipes section").toBeGreaterThan(-1);
  const rest = readme.slice(start + "## Component recipes".length);
  const next = rest.indexOf("\n## ");
  return next === -1 ? rest : rest.slice(0, next);
}

/** Every utility class token from the fenced code blocks in the section. */
function recipeClasses(): string[] {
  const blocks = [...recipesSection().matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1] ?? "");
  const tokens = blocks.flatMap((b) => b.split(/\s+/)).filter(Boolean);
  return [...new Set(tokens)];
}

describe("component recipes", () => {
  it("documents the recipes as reference patterns, not shipped components", () => {
    expect(readme).toContain("reference patterns, not shipped components");
  });

  it("every recipe utility string resolves against the shipped CSS", async () => {
    const classes = recipeClasses();
    expect(classes.length).toBeGreaterThan(30); // sanity: the recipes are present
    const css = await compileTheme(classes);
    // Tailwind escapes special chars in selectors with backslashes; compare on
    // a backslash-stripped copy so each documented class can be matched as
    // `.<class>` regardless of escaping. A typo'd / nonexistent utility would
    // generate no rule and fail here.
    const deBackslashed = css.replaceAll("\\", "");
    const unresolved = classes.filter((cls) => !deBackslashed.includes(`.${cls}`));
    expect(unresolved, `unresolved utilities: ${unresolved.join(", ")}`).toEqual([]);
  });

  it("recipe utilities are semantic, so one recipe serves both themes", async () => {
    // Spot-check that the recipe's semantic classes emit var(--…) (theme-tracking)
    // rather than frozen values — this is what makes a single recipe correct in
    // Daylight and Evening with no per-theme edits.
    const css = await compileTheme(["bg-btn-primary", "text-text", "bg-success-tint"]);
    expect(css).toContain("var(--btn-primary)");
    expect(css).toContain("var(--text)");
    expect(css).toContain("var(--success-tint)");
  });

  it("states the accessibility & accent guardrails", () => {
    const section = recipesSection();
    expect(section).toContain("≤ ~10%"); // accent discipline
    expect(section).toContain("Accent never signals status");
    expect(section).toContain("Never color alone");
    expect(section).toContain("Focus is never removed");
    expect(section).toContain("never `text-text-muted`"); // type guardrail
    expect(section).toContain("≥40px desktop"); // hit targets
    expect(section).toContain("≥44px touch");
  });
});
