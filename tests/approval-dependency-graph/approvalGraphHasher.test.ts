import { describe, expect, it } from "vitest";

import { hashApprovalGraphValue, serializeApprovalGraphValue } from "@/services/approval-dependency-graph";

describe("approvalGraphHasher", () => {
  it("stabilizes ordering and normalization", () => {
    expect(hashApprovalGraphValue("graph", { b: "e\u0301", a: 1 })).toBe(
      hashApprovalGraphValue("graph", { a: 1, b: "\u00e9" }),
    );
    expect(serializeApprovalGraphValue({ b: 2, a: 1 })).toBe(
      serializeApprovalGraphValue({ a: 1, b: 2 }),
    );
  });
});
