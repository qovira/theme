/**
 * Pre-paint boot snippet.
 *
 * A tiny synchronous IIFE shipped as a STRING so consumers can inline it
 * verbatim in `<head>` — before any stylesheet — and have `data-theme` set on
 * `<html>` before first paint (no flash on reload).
 *
 * Resolution order, matching the toggle API:
 *   1. stored choice — localStorage["qovira-theme"], if "daylight" | "evening"
 *   2. system preference — prefers-color-scheme: dark → "evening", else "daylight"
 *   3. default — "evening" (also the fallback if anything throws)
 *
 * The localStorage key is duplicated here as a literal because this snippet is
 * standalone (it cannot import from the runtime); a test asserts the two agree.
 *
 * SvelteKit: inline this in `src/app.html` inside `<head>`, NOT a layout —
 * `%sveltekit.head%` runs too late to prevent a flash.
 */
export const boot = `(function () {
  try {
    var s = localStorage.getItem("qovira-theme");
    var t =
      s === "daylight" || s === "evening"
        ? s
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "evening"
          : "daylight";
    document.documentElement.setAttribute("data-theme", t);
  } catch {
    document.documentElement.setAttribute("data-theme", "evening");
  }
})();`;
