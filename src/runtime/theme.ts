/**
 * Theme runtime — placeholder.
 *
 * Will hold the framework-agnostic get/set/persist API (`getTheme`, `setTheme`,
 * `toggleTheme`, `subscribe`). For now only the shared `Theme` type is exported
 * so the build can wire `@qovira/theme/runtime`.
 */
export type Theme = "daylight" | "evening";
