import { describe, expect, it } from "vitest";

import { serializeDeterministically } from "@/services/planning/normalization";

describe("cross-runtime normalization", () => {
  it("stable serializer produces identical hashes independent of object key order", () => {
    const left = serializeDeterministically({ b: 2, a: 1, nested: { y: 2, x: 1 } });
    const right = serializeDeterministically({ nested: { x: 1, y: 2 }, a: 1, b: 2 });

    expect(left).toBe(right);
  });
});

