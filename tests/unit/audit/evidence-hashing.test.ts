import { describe, expect, it } from "vitest";

import { hashEvidence, stableSerializeEvidence, verifyEvidenceHash } from "@/services/audit/evidenceHashing";

describe("evidenceHashing", () => {
  it("produces deterministic hashes", () => {
    const value = { b: 2, a: [1, { c: true }] };
    const serialized = stableSerializeEvidence(value);
    const hash = hashEvidence(value);

    expect(serialized).toBe("{\"a\":[1,{\"c\":true}],\"b\":2}");
    expect(verifyEvidenceHash(value, hash)).toBe(true);
  });
});
