/**
 * Theme runtime — placeholder.
 *
 * The real framework-agnostic get/set/persist API (`getTheme`, `setTheme`,
 * `toggleTheme`, `subscribe`) lands in QOV-6. For now only the shared `Theme`
 * type is exported so the build can wire `@qovira/theme/runtime`.
 */
export type Theme = "daylight" | "evening";
