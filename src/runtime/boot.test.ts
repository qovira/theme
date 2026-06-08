import { describe, expect, it } from "vitest";

import { boot } from "./boot.js";

describe("@qovira/theme/boot (placeholder)", () => {
  it("exports a string suitable for inlining in <head>", () => {
    expect(typeof boot).toBe("string");
  });
});
