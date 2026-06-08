import { describe, expect, it } from "vitest";

import { compileTheme } from "./compile.js";

/** Declaration block (between the braces) of the first rule matching `marker`. */
function block(css: string, marker: string): string {
  const idx = css.indexOf(marker);
  if (idx === -1) throw new Error(`block \`${marker}\` not found in output`);
  const open = css.indexOf("{", idx);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

/** Declaration block of a single utility rule. */
function ruleBody(css: string, selector: string): string {
  return block(css, `${selector} {`);
}

const DAYLIGHT = '[data-theme="daylight"] {';
const EVENING = '[data-theme="evening"] {';

// Every layer-2 semantic token, both themes (design §6 + §5 status table),
// with the two daylight AA fixes applied (--link honey-800, --warning-text).
const daylight: Record<string, string> = {
  "--bg": "#f1e9dc",
  "--surface": "#f1e9dc",
  "--surface-raised": "#faf6ef",
  "--text": "#1e1712",
  "--text-muted": "#5c4a37",
  "--border-hairline": "#e6dac8",
  "--accent": "#e0a458",
  "--link": "#7e4f1c",
  "--accent-clay": "#8a4b2c",
  "--btn-primary": "#1e1712",
  "--btn-primary-fg": "#f1e9dc",
  "--btn-primary-hover": "#2c2118",
  "--btn-primary-active": "#15100c",
  "--focus-ring": "#e0a458",
  "--success-tint": "#e2f1ea",
  "--success-text": "#1e7a50",
  "--warning-tint": "#fbebd2",
  "--warning-text": "#855400",
  "--error-tint": "#fbe6e1",
  "--error-text": "#a8331f",
  "--info-tint": "#e5eef9",
  "--info-text": "#285699",
};

const evening: Record<string, string> = {
  "--bg": "#15100c",
  "--surface": "#1e1712",
  "--surface-raised": "#241b12",
  "--text": "#f3ecdf",
  "--text-muted": "#b7a892",
  "--border-hairline": "#2c2118",
  "--accent": "#e0a458",
  "--link": "#ebbe74",
  "--accent-clay": "#d08c66",
  "--btn-primary": "#e0a458",
  "--btn-primary-fg": "#1e1712",
  "--btn-primary-hover": "#c9883c",
  "--btn-primary-active": "#a66b28",
  "--focus-ring": "#e0a458",
  "--success-tint": "#16271e",
  "--success-text": "#6fd3a1",
  "--warning-tint": "#2a2012",
  "--warning-text": "#e9b25e",
  "--error-tint": "#2e1813",
  "--error-text": "#f0917f",
  "--info-tint": "#16213a",
  "--info-text": "#8fb4e8",
};

describe("Daylight and Evening themes", () => {
  it("defines every §6 + status token for the Daylight theme", async () => {
    const css = await compileTheme([]);
    const body = block(css, DAYLIGHT);
    for (const [name, value] of Object.entries(daylight)) {
      expect(body, name).toContain(`${name}: ${value}`);
    }
    // Shadows are espresso-tinted in daylight.
    expect(body).toContain("--shadow-sm:");
    expect(body).toContain("rgba(30, 24, 18,");
    expect(body).toContain("--lamp-glow: 0 0 22px rgba(224, 164, 88, 0.5)");
  });

  it("defines every §6 + status token for the Evening theme", async () => {
    const css = await compileTheme([]);
    const body = block(css, EVENING);
    for (const [name, value] of Object.entries(evening)) {
      expect(body, name).toContain(`${name}: ${value}`);
    }
    // Shadows are pure black in evening.
    expect(body).toContain("--shadow-sm:");
    expect(body).toContain("rgba(0, 0, 0,");
    expect(body).toContain("--lamp-glow: 0 0 22px rgba(224, 164, 88, 0.5)");
  });

  it("exposes semantic utilities that emit var(--…) so they track the active theme", async () => {
    const css = await compileTheme([
      "bg-surface",
      "bg-surface-raised",
      "text-text",
      "text-text-muted",
      "border-border",
      "bg-accent",
      "text-link",
      "bg-btn-primary",
      "text-btn-primary-fg",
      "bg-success-tint",
      "text-success-text",
      "bg-warning-tint",
      "text-warning-text",
      "bg-error-tint",
      "text-error-text",
      "bg-info-tint",
      "text-info-text",
    ]);
    expect(ruleBody(css, ".bg-surface")).toContain("var(--surface)");
    expect(ruleBody(css, ".bg-surface-raised")).toContain(
      "var(--surface-raised)",
    );
    expect(ruleBody(css, ".text-text")).toContain("var(--text)");
    expect(ruleBody(css, ".text-text-muted")).toContain("var(--text-muted)");
    expect(ruleBody(css, ".border-border")).toContain("var(--border-hairline)");
    expect(ruleBody(css, ".bg-accent")).toContain("var(--accent)");
    expect(ruleBody(css, ".text-link")).toContain("var(--link)");
    expect(ruleBody(css, ".bg-btn-primary")).toContain("var(--btn-primary)");
    expect(ruleBody(css, ".text-btn-primary-fg")).toContain(
      "var(--btn-primary-fg)",
    );
    for (const role of ["success", "warning", "error", "info"]) {
      expect(ruleBody(css, `.bg-${role}-tint`)).toContain(
        `var(--${role}-tint)`,
      );
      expect(ruleBody(css, `.text-${role}-text`)).toContain(
        `var(--${role}-text)`,
      );
    }
  });

  it("diverges the two themes (a single attribute switch flips every role)", () => {
    // For the roles that carry meaning, Daylight and Evening must differ, which
    // is what makes `data-theme` alone repaint the UI with no component edits.
    for (const token of [
      "--surface",
      "--surface-raised",
      "--text",
      "--text-muted",
      "--border-hairline",
      "--link",
      "--btn-primary",
      "--btn-primary-fg",
    ]) {
      expect(daylight[token], token).not.toBe(evening[token]);
    }
  });
});
