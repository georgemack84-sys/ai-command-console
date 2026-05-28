import { describe, expect, it } from "vitest";

import { parseIntentFallback } from "@/services/intent/fallbackParser";

describe("fallbackParser", () => {
  it("fails closed for unsupported input", () => {
    const result = parseIntentFallback("do the magic thing");

    expect(result.source).toBe("fallback");
    expect(result.supported).toBe(false);
    expect(result.clarificationRequired).toBe(true);
  });
});
