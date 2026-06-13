import { describe, expect, it } from "vitest";

import { compileTheme } from "./compile.js";

// WCAG 2.x relative-luminance contrast ratio. Verified against references:
// black/white = 21.00, #767676/white = 4.54.
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5; // WCAG AA, normal text

/** Value of the `--name: value;` declaration within `scope` (a rule body / CSS). */
function decl(scope: string, name: string): string {
  // Anchor the name so e.g. `--text` doesn't match `--text-muted`.
  const match = new RegExp(`(?:^|[\\s;{])${name}\\s*:\\s*([^;]+);`).exec(scope);
  if (!match?.[1]) throw new Error(`declaration \`${name}\` not found`);
  return match[1].trim();
}

/** Declaration block of a `[data-theme="…"]` rule in the compiled output. */
function themeBlock(css: string, theme: "daylight" | "evening"): string {
  const idx = css.indexOf(`[data-theme="${theme}"] {`);
  if (idx === -1) throw new Error(`${theme} theme block not found`);
  const open = css.indexOf("{", idx);
  return css.slice(open + 1, css.indexOf("}", open));
}

describe("WCAG AA contrast", () => {
  it("sanity-checks the contrast function against known references", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("every shipped text/background pairing meets AA (>= 4.5:1)", async () => {
    // Resolve every colour from the COMPILED theme so a value drift in
    // src/theme.css changes the ratio under test — not a stale parallel copy.
    const css = await compileTheme([]);
    const day = themeBlock(css, "daylight");
    const eve = themeBlock(css, "evening");
    const primitive = (name: string): string => decl(css, name); // layer-1 @theme value

    // [name, foreground, background] — fg/bg pulled from the emitted variables.
    const pairings: readonly (readonly [string, string, string])[] = [
      // Core body / UI text
      ["body · daylight", decl(day, "--text"), decl(day, "--surface")],
      ["body · evening", decl(eve, "--text"), decl(eve, "--surface")],
      ["muted · daylight", decl(day, "--text-muted"), decl(day, "--surface")],
      ["muted · evening", decl(eve, "--text-muted"), decl(eve, "--surface")],
      // Links (daylight lifted to honey-800 for AA; evening lifted honey)
      ["link · daylight on surface", decl(day, "--link"), decl(day, "--surface")],
      ["link · daylight on raised", decl(day, "--link"), decl(day, "--surface-raised")],
      ["link · evening", decl(eve, "--link"), decl(eve, "--surface")],
      // Primary button label on fill
      ["btn-primary · daylight", decl(day, "--btn-primary-fg"), decl(day, "--btn-primary")],
      ["btn-primary · evening", decl(eve, "--btn-primary-fg"), decl(eve, "--btn-primary")],
      // Destructive button: white label on the error fill (`bg-error text-white`),
      // 14px/500 normal text → AA 4.5:1. Theme-constant (layer-1 --color-error),
      // so one pairing covers both themes; the fill must stay dark enough for white.
      ["destructive btn · white on error", "#ffffff", primitive("--color-error")],
      // Key-CTA: warm-900 label on honey accent (accent is identical in both themes)
      ["key-CTA · warm-900 on accent", primitive("--color-warm-900"), decl(day, "--accent")],
      // Status text on tint — daylight
      ["success · daylight", decl(day, "--success-text"), decl(day, "--success-tint")],
      ["warning · daylight", decl(day, "--warning-text"), decl(day, "--warning-tint")],
      ["error · daylight", decl(day, "--error-text"), decl(day, "--error-tint")],
      ["info · daylight", decl(day, "--info-text"), decl(day, "--info-tint")],
      // Status text on tint — evening
      ["success · evening", decl(eve, "--success-text"), decl(eve, "--success-tint")],
      ["warning · evening", decl(eve, "--warning-text"), decl(eve, "--warning-tint")],
      ["error · evening", decl(eve, "--error-text"), decl(eve, "--error-tint")],
      ["info · evening", decl(eve, "--info-text"), decl(eve, "--info-tint")],
    ];

    for (const [name, fg, bg] of pairings) {
      expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(AA);
    }
  });
});
