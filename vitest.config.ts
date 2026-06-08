import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Web Storage polyfill for the DOM-environment runtime tests.
    setupFiles: ["./tests/setup-dom.ts"],
  },
});
