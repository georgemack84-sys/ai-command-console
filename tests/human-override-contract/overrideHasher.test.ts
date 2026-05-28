import { describe, expect, it } from "vitest";

import { hashOverrideValue, serializeOverrideValue } from "@/services/human-override-contract";

describe("overrideHasher", () => {
  it("stabilizes normalization and serialization ordering", () => {
    expect(hashOverrideValue("override", { b: "e\u0301", a: 1 })).toBe(
      hashOverrideValue("override", { a: 1, b: "\u00e9" }),
    );
    expect(serializeOverrideValue({ b: 2, a: 1 })).toBe(
      serializeOverrideValue({ a: 1, b: 2 }),
    );
  });
});
