import { describe, expect, it } from "vitest";

import { hashStableContent } from "@/services/planning/versioning";

describe("stable content hasher", () => {
  it("shuffled object keys produce identical hashes", () => {
    const left = hashStableContent("PLAN", { a: 1, b: { c: "x", d: "y" } });
    const right = hashStableContent("PLAN", { b: { d: "y", c: "x" }, a: 1 });
    expect(left).toBe(right);
  });

  it("semantic mutation changes hash", () => {
    const left = hashStableContent("PLAN", { a: 1 });
    const right = hashStableContent("PLAN", { a: 2 });
    expect(left).not.toBe(right);
  });

  it("non-semantic formatting mutation does not change hash", () => {
    const left = hashStableContent("PLAN", { a: "Cafe\u0301" });
    const right = hashStableContent("PLAN", { a: "Café" });
    expect(left).toBe(right);
  });
});
