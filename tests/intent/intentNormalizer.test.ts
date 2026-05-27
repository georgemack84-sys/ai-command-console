import { describe, expect, it } from "vitest";

import { normalizeIntentInput, normalizeIntentPayload } from "@/services/intent/intentNormalizer";

describe("intentNormalizer", () => {
  it("normalizes whitespace and line endings deterministically", () => {
    expect(normalizeIntentInput("  inspect\r\n service   status  ")).toBe("inspect\n service status");
    expect(normalizeIntentInput("  inspect\r\n service   status  ")).toBe("inspect\n service status");
  });

  it("rejects non-string input", () => {
    expect(() => normalizeIntentPayload({ text: "inspect service" })).toThrow("INVALID_INPUT");
  });
});
