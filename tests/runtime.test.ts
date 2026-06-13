// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getTheme, setTheme, STORAGE_KEY, subscribe, toggleTheme } from "../src/runtime/theme.js";

const KEY = STORAGE_KEY;

function setSystemDark(dark: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

const themeAttr = (): string | null => document.documentElement.getAttribute("data-theme");

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

  it("flips from the resolved default when nothing is set yet", () => {
    // No attribute, no stored choice, system light → getTheme() resolves daylight.
    expect(themeAttr()).toBeNull();
    expect(toggleTheme()).toBe("evening");
    expect(themeAttr()).toBe("evening");
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
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "daylight" }));
    expect(seen).toEqual(["daylight"]);
    expect(themeAttr()).toBe("daylight");

    // Another tab clearing the key → follow system (stub: dark → evening).
    setSystemDark(true);
    localStorage.removeItem(KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: null }));
    expect(seen).toEqual(["daylight", "evening"]);
    expect(themeAttr()).toBe("evening");

    // Unrelated key changes are ignored.
    window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "x" }));
    expect(seen).toEqual(["daylight", "evening"]);

    unsubscribe();
  });

  it("re-resolves when another tab clears all storage (key === null)", () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((t) => seen.push(t));

    setTheme("daylight");
    expect(seen).toEqual(["daylight"]);

    // A bulk `localStorage.clear()` in another tab dispatches a storage event
    // with key === null (not a per-key removal) — we must still follow system.
    setSystemDark(true);
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null, newValue: null }));
    expect(seen).toEqual(["daylight", "evening"]);
    expect(themeAttr()).toBe("evening");

    unsubscribe();
  });

  it("does not re-notify when another tab writes the already-active theme", () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((t) => seen.push(t));

    setTheme("daylight");
    expect(seen).toEqual(["daylight"]);

    // Another tab re-writes the same value: re-resolving yields no change, so
    // subscribers must not see a spurious no-op notification.
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "daylight" }));
    expect(seen).toEqual(["daylight"]);

    unsubscribe();
  });

  it("binds the cross-tab storage listener once across multiple subscribers", () => {
    const a: string[] = [];
    const b: string[] = [];
    const ua = subscribe((t) => a.push(t));
    const ub = subscribe((t) => b.push(t));

    // One storage event must fire each subscriber exactly once. A per-subscribe
    // listener (no once-only guard) would double-emit here.
    localStorage.setItem(KEY, "daylight");
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "daylight" }));
    expect(a).toEqual(["daylight"]);
    expect(b).toEqual(["daylight"]);

    ua();
    ub();
  });
});

describe("storage-unavailable fallbacks", () => {
  it("resolves to evening when reading localStorage throws", () => {
    setSystemDark(false); // would resolve daylight if the read succeeded
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getTheme()).toBe("evening");
  });

  it("setTheme still applies and notifies when persisting throws", () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((t) => seen.push(t));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    setTheme("daylight");
    expect(themeAttr()).toBe("daylight"); // applied for this session despite the failure
    expect(seen).toEqual(["daylight"]); // subscribers still notified

    unsubscribe();
  });

  it("setTheme(null) still applies a resolved theme when storage is unavailable", () => {
    const seen: string[] = [];
    const unsubscribe = subscribe((t) => seen.push(t));
    setTheme("daylight");
    expect(seen).toEqual(["daylight"]);

    // Storage fully unavailable: the removeItem clear AND the re-resolve read throw.
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setTheme(null);
    expect(themeAttr()).toBe("evening"); // resolve()'s catch → evening, still applied
    expect(seen).toEqual(["daylight", "evening"]);

    unsubscribe();
  });
});
