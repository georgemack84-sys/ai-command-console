import type { SamProposal } from "../../services/sam/samTypes";

export function createSamProposal(overrides: Partial<SamProposal> = {}): SamProposal {
  return {
    proposalId: "proposal_1",
    executionId: "demo-exec-1",
    attemptId: "attempt_1",
    actionType: "recover_execution",
    requestedBy: "ai",
    reason: "preview",
    riskLevel: "high",
    confidence: 0.8,
    params: { nested: { beta: 2, alpha: 1 } },
    createdAt: "2026-05-06T00:00:00.000Z",
    ...overrides,
  };
}
