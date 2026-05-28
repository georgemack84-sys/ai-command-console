import { describe, expect, it } from "vitest";
import { hashEscalationValue, serializeEscalationValue } from "@/services/constitutional-escalation-layer";

describe("escalation hashing", () => {
  it("serializes and hashes deterministically", () => {
    const left = { b: "beta", a: "alpha" };
    const right = { a: "alpha", b: "beta" };

    expect(serializeEscalationValue(left)).toBe(serializeEscalationValue(right));
    expect(hashEscalationValue("test", left)).toBe(hashEscalationValue("test", right));
  });
});
