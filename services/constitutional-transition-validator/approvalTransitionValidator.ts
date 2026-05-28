import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import type {
  ConstitutionalTransitionApprovalRecord,
  ConstitutionalTransitionInput,
} from "./types/constitutionalTransitionTypes";

export function validateTransitionApprovals(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionApprovalRecord {
  const approvalValidated =
    input.approvalLineageIds.length > 0
    && input.decisionAuditEpisodeResult.episode.approvalDependencySnapshotId.length > 0
    && input.recommendationValidationResult.result.admissibility !== "DISPUTED";
  return Object.freeze({
    approvalLineageIds: Object.freeze([...input.approvalLineageIds]),
    approvalValidated,
    approvalHash: hashConstitutionalTransitionValue("constitutional-transition-approval-record", {
      approvalLineageIds: input.approvalLineageIds,
      approvalValidated,
      approvalSnapshotId: input.decisionAuditEpisodeResult.episode.approvalDependencySnapshotId,
    }),
  });
}
