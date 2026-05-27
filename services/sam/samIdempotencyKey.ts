import { hashSamProposal } from "./samProposalHash";
import type { SamProposal } from "./samTypes";

type KeyInput = {
  proposal: SamProposal;
  approval?: {
    status?: string;
    approvedBy?: string;
  };
};

export function createSamIdempotencyKey({ proposal, approval }: KeyInput) {
  if (!proposal?.executionId || !proposal?.attemptId || !proposal?.actionType) {
    return {
      ok: false as const,
      error: "SAM_IDEMPOTENCY_INPUT_INVALID",
    };
  }

  const proposalHash = hashSamProposal({
    tenantId: proposal.tenantContext?.tenantId || "",
    workspaceId: proposal.tenantContext?.workspaceId || "",
    executionId: proposal.executionId,
    actionType: proposal.actionType,
    requestedBy: proposal.requestedBy,
    reason: proposal.reason,
    riskLevel: proposal.riskLevel,
    confidence: proposal.confidence,
    params: proposal.params || {},
  });

  const idempotencyKey = hashSamProposal({
    tenantId: proposal.tenantContext?.tenantId || "",
    workspaceId: proposal.tenantContext?.workspaceId || "",
    executionId: proposal.executionId,
    actionType: proposal.actionType,
    proposalHash,
    approvalScope: {
      status: approval?.status || "required",
      approvedBy: approval?.approvedBy || "",
    },
  });

  return {
    ok: true as const,
    data: {
      proposalHash,
      idempotencyKey,
    },
  };
}
