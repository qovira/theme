/**
 * Theme runtime — framework-agnostic get/set/persist for the active theme.
 *
 * The active theme is the `data-theme` attribute on `<html>`, always one of
 * `daylight` | `evening`; everything visual keys off it through the semantic
 * layer. This module reads and writes that attribute and the `qovira-theme`
 * localStorage key, and notifies subscribers — including across tabs via the
 * `storage` event. Pre-paint application is the boot snippet's job (`./boot`);
 * a Svelte store/rune wrapper and the theme-control UI are the app's concern.
 */
export type Theme = "daylight" | "evening";

/** Must match the literal used in the boot snippet (`./boot`). */
const STORAGE_KEY = "qovira-theme";

type Listener = (theme: Theme) => void;
const listeners = new Set<Listener>();
let storageBound = false;

function isTheme(value: unknown): value is Theme {
  return value === "daylight" || value === "evening";
}

/** Resolve the theme as the boot snippet would: stored → system → evening. */
function resolve(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
    return matchMedia("(prefers-color-scheme: dark)").matches
      ? "evening"
      : "daylight";
  } catch {
    return "evening";
  }
}

function apply(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function emit(theme: Theme): void {
  for (const listener of listeners) listener(theme);
}

/** Bind the cross-tab `storage` listener once, lazily on first subscribe. */
function bindStorage(): void {
  if (storageBound) return;
  storageBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    // Another tab changed (or cleared) the stored choice; re-resolve and apply.
    const next = resolve();
    apply(next);
    emit(next);
  });
}

/** The current theme — the `data-theme` attribute, or the resolved default. */
export function getTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return isTheme(attr) ? attr : resolve();
}

/**
 * Apply and persist a theme. `setTheme(null)` clears the stored choice and
 * re-resolves from the system preference (i.e. follow system again).
 */
export function setTheme(theme: Theme | null): void {
  if (theme === null) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage unavailable — apply the resolved theme anyway */
    }
    const next = resolve();
    apply(next);
    emit(next);
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* localStorage unavailable — still apply for this session */
  }
  apply(theme);
  emit(theme);
}

/** Flip between the two themes and return the new value. */
export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "evening" ? "daylight" : "evening";
  setTheme(next);
  return next;
}

/**
 * Subscribe to theme changes (this tab via set/toggle, other tabs via the
 * `storage` event). Returns an unsubscribe function.
 */
export function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  bindStorage();
  return () => {
    listeners.delete(callback);
  };
}
