import { describe, expect, it } from "vitest";

import { validateNormalizedIntentEnvelope } from "@/services/intake/intakeValidation";

describe("validateNormalizedIntentEnvelope", () => {
  it("accepts a valid normalized envelope shape", () => {
    const result = validateNormalizedIntentEnvelope({
      source: "user",
      receivedAt: 10,
      rawInput: "hello",
      normalizedInput: { text: "hello" },
      metadata: { sessionId: "s1", userId: "u1" },
    });

    expect(result.valid).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects invalid metadata and source", () => {
    const result = validateNormalizedIntentEnvelope({
      source: "unknown",
      receivedAt: Number.NaN,
      rawInput: undefined,
      normalizedInput: {},
      metadata: { sessionId: "s1", userId: 3 as never },
    });

    expect(result.valid).toBe(false);
    expect(result.failureType).toBe("VALIDATION_FAILURE");
    expect(result.reasons).toContain("invalid_source");
  });
});
