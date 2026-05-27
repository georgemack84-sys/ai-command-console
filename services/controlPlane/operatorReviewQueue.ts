import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export type OperatorReviewState =
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ESCALATED"
  | "FROZEN"
  | "DISPUTED"
  | "CONSTITUTIONALLY_BLOCKED"
  | "VERIFIED"
  | "CONTAINED";

export type OperatorReviewQueueItem = {
  reviewId: string;
  targetId: string;
  targetType: string;
  reviewState: OperatorReviewState;
  constitutionalReasoning: string[];
  governanceReferences: string[];
  blockedReasons: string[];
  createdAt: number;
};

function normalizeRecordId(record: Record<string, unknown>, fallback: string) {
  return String(record.id ?? record.executionId ?? record.reviewId ?? record.disputeId ?? fallback);
}

export function buildOperatorReviewQueue(input: {
  dashboard: RecoveryDashboardReadModel;
  nowMs: number;
}): OperatorReviewQueueItem[] {
  const reviews: OperatorReviewQueueItem[] = [];

  input.dashboard.pendingApprovals.forEach((record, index) => {
    reviews.push({
      reviewId: `review:approval:${normalizeRecordId(record, `approval-${index}`)}`,
      targetId: normalizeRecordId(record, `approval-${index}`),
      targetType: "APPROVAL_PACKET",
      reviewState: "PENDING_REVIEW",
      constitutionalReasoning: ["approval required before governed continuation"],
      governanceReferences: ["dashboard.pendingApprovals"],
      blockedReasons: [],
      createdAt: input.nowMs,
    });
  });

  input.dashboard.governanceDisputes.forEach((record, index) => {
    reviews.push({
      reviewId: `review:dispute:${normalizeRecordId(record, `dispute-${index}`)}`,
      targetId: normalizeRecordId(record, `dispute-${index}`),
      targetType: "GOVERNANCE_DISPUTE",
      reviewState: "DISPUTED",
      constitutionalReasoning: ["disputed truth requires freeze-aware operator review"],
      governanceReferences: ["dashboard.governanceDisputes"],
      blockedReasons: ["replay_mismatch_unresolved"],
      createdAt: input.nowMs,
    });
  });

  if (input.dashboard.escalationCoordination?.frozen) {
    reviews.push({
      reviewId: `review:coordination-freeze:${input.dashboard.escalationCoordination.escalationId}`,
      targetId: input.dashboard.escalationCoordination.escalationId,
      targetType: "COORDINATION_FREEZE",
      reviewState: "FROZEN",
      constitutionalReasoning: [input.dashboard.escalationCoordination.reason],
      governanceReferences: [input.dashboard.escalationCoordination.escalationLineageId],
      blockedReasons: [input.dashboard.escalationCoordination.blockReason ?? "coordination_freeze_active"],
      createdAt: input.nowMs,
    });
  }

  if (input.dashboard.continuityConvergence?.requiresFreeze) {
    reviews.push({
      reviewId: `review:replay-freeze:${input.dashboard.replayVerificationState.toLowerCase()}`,
      targetId: input.dashboard.replayVerificationState,
      targetType: "REPLAY_MISMATCH",
      reviewState: "FROZEN",
      constitutionalReasoning: input.dashboard.continuityConvergence.divergenceReasons,
      governanceReferences: input.dashboard.continuityConvergence.evidence,
      blockedReasons: input.dashboard.continuityConvergence.unresolvedDisputes.length
        ? input.dashboard.continuityConvergence.unresolvedDisputes
        : ["replay_truth_precedence"],
      createdAt: input.nowMs,
    });
  }

  return reviews.sort((left, right) => left.reviewId.localeCompare(right.reviewId));
}
