// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { boot } from "../src/runtime/boot.js";

/** Execute the shipped boot string exactly as an inlined <script> would. */
function runBoot(): void {
  // The whole point of this slice is a stringified snippet inlined in <head>;
  // evaluating it is how we verify it actually runs and resolves correctly.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- evaluating the shipped boot string is the test
  const run = new Function(boot) as () => void;
  run();
}

/** Stub `matchMedia` so prefers-color-scheme is deterministic. */
function setSystemDark(dark: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  setSystemDark(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const themeOf = (): string | null =>
  document.documentElement.getAttribute("data-theme");

describe("boot snippet", () => {
  it("exports a non-empty string for inlining in <head>", () => {
    expect(typeof boot).toBe("string");
    expect(boot.length).toBeGreaterThan(0);
  });

  it("honors a stored choice over the system preference", () => {
    setSystemDark(true); // system says evening …
    localStorage.setItem("qovira-theme", "daylight"); // … but the user picked daylight
    runBoot();
    expect(themeOf()).toBe("daylight");
  });

  it("falls back to the system preference when there is no stored choice", () => {
    setSystemDark(true);
    runBoot();
    expect(themeOf()).toBe("evening");

    document.documentElement.removeAttribute("data-theme");
    setSystemDark(false);
    runBoot();
    expect(themeOf()).toBe("daylight");
  });

  it("ignores an invalid stored value and uses the system preference", () => {
    localStorage.setItem("qovira-theme", "neon");
    setSystemDark(true);
    runBoot();
    expect(themeOf()).toBe("evening");
  });

  it("defaults to evening when storage access throws", () => {
    setSystemDark(false); // would be daylight if reached
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    runBoot();
    expect(themeOf()).toBe("evening");
  });
});
