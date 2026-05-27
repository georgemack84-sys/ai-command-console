import { describe, expect, it } from "vitest";

import { hashProposalLifecycleValue, serializeProposalValue } from "@/services/proposal-lifecycle-engine";

describe("proposalLifecycleHasher", () => {
  it("remains stable across ordering and normalization differences", () => {
    expect(
      hashProposalLifecycleValue("proposal", { b: "e\u0301", a: 1 }),
    ).toBe(
      hashProposalLifecycleValue("proposal", { a: 1, b: "\u00e9" }),
    );
    expect(
      serializeProposalValue({ b: 2, a: 1 }),
    ).toBe(
      serializeProposalValue({ a: 1, b: 2 }),
    );
  });
});
