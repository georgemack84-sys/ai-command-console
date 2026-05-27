import { describe, expect, it } from "vitest";

import { canonicalSerialize } from "../../services/contracts/canonicalSerializer.ts";
import { hashPayloadDeterministically } from "../../services/contracts/payloadHasher.ts";

describe("canonical serializer", () => {
  it("serializes object keys deterministically", () => {
    const left = canonicalSerialize({ b: 2, a: 1 });
    const right = canonicalSerialize({ a: 1, b: 2 });

    expect(left).toBe(right);
  });

  it("hashes payloads deterministically", () => {
    const left = hashPayloadDeterministically({ b: 2, a: 1 });
    const right = hashPayloadDeterministically({ a: 1, b: 2 });

    expect(left).toBe(right);
  });
});
