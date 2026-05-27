import { describe, expect, it } from "vitest";
import { hashReadinessValue, serializeReadinessValue } from "@/services/constitutional-autonomy-readiness-gate";

describe("readiness hashing", () => {
  it("normalizes ordering deterministically", () => {
    const left = { b: "beta", a: "alpha" };
    const right = { a: "alpha", b: "beta" };

    expect(serializeReadinessValue(left)).toBe(serializeReadinessValue(right));
    expect(hashReadinessValue("test", left)).toBe(hashReadinessValue("test", right));
  });
});
