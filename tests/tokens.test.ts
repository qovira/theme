import { describe, expect, it } from "vitest";

import { compileTheme } from "./compile.js";

/** Extract the declaration block (between the braces) of a single CSS rule. */
function ruleBody(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`rule \`${selector}\` not found in output`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

describe("primitive design tokens", () => {
  it("emits every brand color value exactly", async () => {
    const css = await compileTheme([]);
    const colors: Record<string, string> = {
      // Warm neutrals
      "--color-warm-50": "#faf6ef",
      "--color-warm-100": "#f1e9dc",
      "--color-warm-200": "#e6dac8",
      "--color-warm-300": "#d4c4ad",
      "--color-warm-400": "#b09a7e",
      "--color-warm-500": "#8a745b",
      "--color-warm-600": "#6b563f",
      "--color-warm-700": "#4a3a2a",
      "--color-warm-800": "#2c2118",
      "--color-warm-900": "#1e1712",
      // Honey accent
      "--color-honey-50": "#fcf3e4",
      "--color-honey-100": "#f8e6c8",
      "--color-honey-200": "#f1d199",
      "--color-honey-300": "#ebbe74",
      "--color-honey-400": "#e5b063",
      "--color-honey-500": "#e0a458",
      "--color-honey-600": "#c9883c",
      "--color-honey-700": "#a66b28",
      "--color-honey-800": "#7e4f1c",
      "--color-honey-900": "#573514",
      // Clay secondary
      "--color-clay-400": "#d08c66",
      "--color-clay-500": "#c2754c",
      "--color-clay-600": "#a85f3a",
      "--color-clay-700": "#8a4b2c",
      // Status base
      "--color-success": "#2f9e6b",
      "--color-warning": "#e08a1e",
      "--color-error": "#d6452e",
      "--color-info": "#3b72c0",
    };
    for (const [name, hex] of Object.entries(colors)) {
      expect(css, name).toContain(`${name}: ${hex}`);
    }
  });

  it("generates color utilities that track the ramp variables", async () => {
    const css = await compileTheme(["bg-honey-500", "text-warm-700"]);
    expect(ruleBody(css, ".bg-honey-500")).toContain(
      "background-color: var(--color-honey-500)",
    );
    expect(ruleBody(css, ".text-warm-700")).toContain(
      "color: var(--color-warm-700)",
    );
  });

  it("overrides the radius scale (rounded-md = 10px)", async () => {
    const css = await compileTheme(["rounded-md"]);
    expect(css).toContain("--radius-sm: 8px");
    expect(css).toContain("--radius-md: 10px");
    expect(css).toContain("--radius-lg: 14px");
    expect(css).toContain("--radius-xl: 18px");
    expect(css).toContain("--radius-full: 999px");
    expect(ruleBody(css, ".rounded-md")).toContain(
      "border-radius: var(--radius-md)",
    );
  });

  it("defines the font families and generates font utilities", async () => {
    const css = await compileTheme(["font-display"]);
    expect(css).toContain(`--font-display: "Fraunces", Georgia, serif`);
    expect(css).toContain(`--font-sans: "Figtree", system-ui, sans-serif`);
    expect(css).toContain(
      `--font-mono: "JetBrains Mono", ui-monospace, monospace`,
    );
    expect(ruleBody(css, ".font-display")).toContain(
      "font-family: var(--font-display)",
    );
  });

  it("carries size + line-height + letter-spacing + weight on type tokens", async () => {
    const css = await compileTheme(["text-h1"]);
    expect(css).toContain("--text-h1: 2.375rem");
    expect(css).toContain("--text-h1--line-height: 1.1");
    expect(css).toContain("--text-h1--letter-spacing: -0.01em");
    expect(css).toContain("--text-h1--font-weight: 500");

    const body = ruleBody(css, ".text-h1");
    expect(body).toContain("font-size: var(--text-h1)");
    expect(body).toContain("--text-h1--line-height");
    expect(body).toContain("--text-h1--letter-spacing");
    expect(body).toContain("--text-h1--font-weight");
  });

  it("transcribes every type-scale token size exactly", async () => {
    const css = await compileTheme([]);
    const sizes: Record<string, string> = {
      "--text-display": "3.25rem",
      "--text-h1": "2.375rem",
      "--text-h2": "1.75rem",
      "--text-h3": "1.375rem",
      "--text-h4": "1.125rem",
      "--text-lead": "1.125rem",
      "--text-body": "1rem",
      "--text-small": "0.875rem",
      "--text-button": "0.875rem",
      "--text-label": "0.75rem",
      "--text-code": "0.875rem",
    };
    for (const [name, size] of Object.entries(sizes)) {
      expect(css, name).toContain(`${name}: ${size}`);
    }
    // Spot-check distinguishing modifiers from the §5 table.
    expect(css).toContain("--text-h2--letter-spacing: -0.005em");
    expect(css).toContain("--text-h3--font-weight: 600");
    expect(css).toContain("--text-button--letter-spacing: 0.005em");
    expect(css).toContain("--text-label--letter-spacing: 0.08em");
    expect(css).toContain("--text-code--line-height: 1.6");
  });

  it("generates ease-qovira natively and emits the motion/z-index variables", async () => {
    const css = await compileTheme(["ease-qovira"]);
    expect(css).toContain("--ease-qovira: cubic-bezier(0.2, 0.8, 0.2, 1)");
    expect(ruleBody(css, ".ease-qovira")).toContain("var(--ease-qovira)");

    // Durations + z-index are plain custom properties (no utility namespace).
    expect(css).toContain("--duration-micro: 140ms");
    expect(css).toContain("--duration-base: 200ms");
    expect(css).toContain("--duration-overlay: 280ms");
    expect(css).toContain("--z-base: 0");
    expect(css).toContain("--z-dropdown: 1000");
    expect(css).toContain("--z-sticky: 1100");
    expect(css).toContain("--z-overlay: 1200");
    expect(css).toContain("--z-modal: 1300");
    expect(css).toContain("--z-toast: 1400");
  });

  it("leaves spacing at the Tailwind default (4px base, no off-grid override)", async () => {
    const css = await compileTheme(["p-4"]);
    expect(css).toContain("--spacing: 0.25rem");
    expect(ruleBody(css, ".p-4")).toContain("calc(var(--spacing) * 4)");
  });
});
