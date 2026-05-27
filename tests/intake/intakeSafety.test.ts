import { describe, expect, it } from "vitest";

import { inspectIntakeSafety, normalizeInput } from "@/services/intake/inputNormalization";

describe("intake safety", () => {
  it("rejects oversized payloads", () => {
    const large = "x".repeat(40_000);
    const inspection = inspectIntakeSafety(large);
    expect(inspection.exceedsLimits).toBe(true);
  });

  it("fails recursion protection deterministically", () => {
    const nested = { a: { b: { c: { d: { e: { f: { g: "too deep" } } } } } } };
    expect(() => normalizeInput(nested)).toThrow("intake_recursion_limit_exceeded");
  });

  it("flags binary fragments", () => {
    const inspection = inspectIntakeSafety("abc\u0002def");
    expect(inspection.containsBinaryData).toBe(true);
    expect(inspection.malformedEncoding).toBe(true);
  });
});
