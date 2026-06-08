import { defineConfig } from "tsup";

// Two published ESM entry points: the toggle API (`./runtime`) and the raw
// pre-paint boot string (`./boot`). CSS + fonts are copied separately by
// scripts/copy-assets.mjs.
export default defineConfig({
  entry: {
    runtime: "src/runtime/theme.ts",
    boot: "src/runtime/boot.ts",
  },
  format: ["esm"],
  target: "es2022",
  dts: true,
  clean: true,
  outDir: "dist",
});
