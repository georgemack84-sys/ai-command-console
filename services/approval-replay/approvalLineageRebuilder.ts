import type { ApprovalReplayView, CoordinationReplayInput } from "@/types/coordination-replay";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function rebuildApprovalLineage(input: CoordinationReplayInput): ApprovalReplayView {
  return Object.freeze({
    approvalId: input.approval.approvalId,
    status: input.approval.status,
    explicit: input.approval.explicit,
    approvers: input.approval.approvers,
    scopeHash: input.approval.scopeHash,
    governanceDecisionHash: input.approval.governanceDecisionHash,
    valid: input.approval.valid,
    chronologyHash: hashCoordinationReplayValue("approval-chronology", {
      approvalId: input.approval.approvalId,
      status: input.approval.status,
      approvers: input.approval.approvers,
      scopeHash: input.approval.scopeHash,
      governanceDecisionHash: input.approval.governanceDecisionHash,
    }),
  });
}
