import { describe, expect, it } from "vitest";

import {
  normalizeSamActionType,
  validateSamProposal,
} from "../../services/sam/samProposalSchema.ts";

function createProposal(overrides: Record<string, unknown> = {}) {
  return {
    proposalId: "proposal_1",
    executionId: "demo-exec-1",
    attemptId: "attempt_1",
    actionType: "recover_execution",
    requestedBy: "ai",
    reason: "Need governed recovery preview.",
    riskLevel: "high",
    confidence: 0.7,
    params: {},
    createdAt: "2026-05-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("sam proposal schema", () => {
  it("rejects missing executionId", () => {
    const result = validateSamProposal(createProposal({ executionId: "" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("SAM_PROPOSAL_INVALID");
  });

  it("normalizes unknown actionType to unknown", () => {
    expect(normalizeSamActionType("definitely_not_real")).toBe("unknown");
  });

  it("rejects confidence below 0 or above 1", () => {
    const low = validateSamProposal(createProposal({ confidence: -0.1 }));
    const high = validateSamProposal(createProposal({ confidence: 1.1 }));

    expect(low.ok).toBe(false);
    expect(high.ok).toBe(false);
    if (!low.ok) {
      expect(low.errors[0]?.code).toBe("SAM_PROPOSAL_INVALID");
    }
    if (!high.ok) {
      expect(high.errors[0]?.code).toBe("SAM_PROPOSAL_INVALID");
    }
  });
});
