import { describe, expect, it } from "vitest";

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

// [name, foreground, background] — the colors as shipped in src/theme.css.
const pairings: readonly (readonly [string, string, string])[] = [
  // Core body / UI text
  ["body · daylight", "#1e1712", "#f1e9dc"],
  ["body · evening", "#f3ecdf", "#1e1712"],
  ["muted · daylight", "#5c4a37", "#f1e9dc"],
  ["muted · evening", "#b7a892", "#1e1712"],
  // Links (daylight lifted to honey-800 for AA; evening lifted honey)
  ["link · daylight on surface", "#7e4f1c", "#f1e9dc"],
  ["link · daylight on raised", "#7e4f1c", "#faf6ef"],
  ["link · evening", "#ebbe74", "#1e1712"],
  // Primary button label on fill
  ["btn-primary · daylight", "#f1e9dc", "#1e1712"],
  ["btn-primary · evening", "#1e1712", "#e0a458"],
  // Key-CTA: warm-900 label on honey accent
  ["key-CTA", "#1e1712", "#e0a458"],
  // Status text on tint — daylight
  ["success · daylight", "#1e7a50", "#e2f1ea"],
  ["warning · daylight", "#855400", "#fbebd2"],
  ["error · daylight", "#a8331f", "#fbe6e1"],
  ["info · daylight", "#285699", "#e5eef9"],
  // Status text on tint — evening (derived; design AA action item)
  ["success · evening", "#6fd3a1", "#16271e"],
  ["warning · evening", "#e9b25e", "#2a2012"],
  ["error · evening", "#f0917f", "#2e1813"],
  ["info · evening", "#8fb4e8", "#16213a"],
];

describe("WCAG AA contrast", () => {
  it("sanity-checks the contrast function against known references", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it.each(pairings)("%s meets AA (>= 4.5:1)", (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
  });
});
