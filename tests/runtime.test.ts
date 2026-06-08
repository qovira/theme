// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTheme,
  setTheme,
  subscribe,
  toggleTheme,
} from "../src/runtime/theme.js";

const KEY = "qovira-theme";

function setSystemDark(dark: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

const themeAttr = (): string | null =>
  document.documentElement.getAttribute("data-theme");

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  setSystemDark(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getTheme", () => {
  it("returns the current data-theme attribute when valid", () => {
    document.documentElement.setAttribute("data-theme", "evening");
    expect(getTheme()).toBe("evening");
  });

  it("resolves stored > system > evening when the attribute is missing", () => {
    setSystemDark(true);
    expect(getTheme()).toBe("evening"); // from system
    setSystemDark(false);
    expect(getTheme()).toBe("daylight");
    localStorage.setItem(KEY, "evening");
    expect(getTheme()).toBe("evening"); // stored wins over light system
  });
});

describe("setTheme", () => {
  it("applies and persists the chosen theme", () => {
    setTheme("daylight");
    expect(themeAttr()).toBe("daylight");
    expect(localStorage.getItem(KEY)).toBe("daylight");

    setTheme("evening");
    expect(themeAttr()).toBe("evening");
    expect(localStorage.getItem(KEY)).toBe("evening");
  });

  it("setTheme(null) clears the stored choice and follows the system again", () => {
    setTheme("daylight"); // explicit choice
    expect(localStorage.getItem(KEY)).toBe("daylight");

    setSystemDark(true);
    setTheme(null);
    expect(localStorage.getItem(KEY)).toBeNull(); // key removed
    expect(themeAttr()).toBe("evening"); // re-resolved from system
  });
});

describe("toggleTheme", () => {
  it("flips the theme and returns the new value", () => {
    setTheme("daylight");
    expect(toggleTheme()).toBe("evening");
    expect(themeAttr()).toBe("evening");
    expect(toggleTheme()).toBe("daylight");
    expect(themeAttr()).toBe("daylight");
  });
});

describe("subscribe", () => {
  it("notifies on same-tab changes and stops after unsubscribe", () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((t) => seen.push(t));

    setTheme("daylight");
    toggleTheme(); // → evening
    expect(seen).toEqual(["daylight", "evening"]);

    unsubscribe();
    setTheme("daylight");
    expect(seen).toEqual(["daylight", "evening"]); // no further notifications
  });

  it("propagates a change from another tab via the storage event", () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((t) => seen.push(t));

    // Simulate another tab writing the key, then the browser delivering the event.
    localStorage.setItem(KEY, "daylight");
    window.dispatchEvent(
      new StorageEvent("storage", { key: KEY, newValue: "daylight" }),
    );
    expect(seen).toEqual(["daylight"]);
    expect(themeAttr()).toBe("daylight");

    // Another tab clearing the key → follow system (stub: dark → evening).
    setSystemDark(true);
    localStorage.removeItem(KEY);
    window.dispatchEvent(
      new StorageEvent("storage", { key: KEY, newValue: null }),
    );
    expect(seen).toEqual(["daylight", "evening"]);
    expect(themeAttr()).toBe("evening");

    // Unrelated key changes are ignored.
    window.dispatchEvent(
      new StorageEvent("storage", { key: "other", newValue: "x" }),
    );
    expect(seen).toEqual(["daylight", "evening"]);

    unsubscribe();
  });
});
