import type {
  ApprovalLineageRecord,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function resolveApprovalDependencies(input: RecommendationLineageInput): ApprovalLineageRecord {
  return Object.freeze({
    approvalSnapshotId: input.approvalSnapshot.approvalSnapshotId,
    approvalDependencies: Object.freeze(input.approvalSnapshot.approvalDependencies),
    escalationApprovals: Object.freeze(input.approvalSnapshot.escalationApprovals),
    operatorInterventions: Object.freeze(input.approvalSnapshot.operatorInterventions),
    approvalRevocations: Object.freeze(input.approvalSnapshot.approvalRevocations),
    overrideHistory: Object.freeze(input.approvalSnapshot.overrideHistory),
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-approval-record", input.approvalSnapshot),
  });
}
