import { describe, expect, it } from "vitest";

import { hashSamProposal } from "../../services/sam/samProposalHash.ts";

describe("sam proposal hash", () => {
  it("object key order does not change proposal hash", () => {
    const first = hashSamProposal({
      executionId: "demo-exec-1",
      actionType: "recover_execution",
      requestedBy: "ai",
      reason: "preview",
      riskLevel: "high",
      confidence: 0.7,
      params: {
        b: 2,
        a: 1,
        nested: {
          z: 3,
          y: 2,
        },
      },
    });

    const second = hashSamProposal({
      riskLevel: "high",
      requestedBy: "ai",
      confidence: 0.7,
      reason: "preview",
      actionType: "recover_execution",
      executionId: "demo-exec-1",
      params: {
        nested: {
          y: 2,
          z: 3,
        },
        a: 1,
        b: 2,
      },
    });

    expect(first).toBe(second);
  });

  it("different proposal changes proposal hash", () => {
    const first = hashSamProposal({
      executionId: "demo-exec-1",
      actionType: "recover_execution",
      requestedBy: "ai",
      reason: "preview",
      riskLevel: "high",
      confidence: 0.7,
      params: { a: 1 },
    });

    const second = hashSamProposal({
      executionId: "demo-exec-1",
      actionType: "recover_execution",
      requestedBy: "ai",
      reason: "preview",
      riskLevel: "high",
      confidence: 0.7,
      params: { a: 2 },
    });

    expect(first).not.toBe(second);
  });
});
