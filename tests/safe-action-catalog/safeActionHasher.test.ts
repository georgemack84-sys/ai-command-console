import { describe, expect, it } from "vitest";

import { hashSafeActionValue } from "@/services/safe-action-catalog";

describe("safeActionHasher", () => {
  it("stabilizes object ordering and NFC normalization", () => {
    const left = hashSafeActionValue("sample", { b: "e\u0301", a: 1 });
    const right = hashSafeActionValue("sample", { a: 1, b: "\u00e9" });
    expect(left).toBe(right);
  });
});
