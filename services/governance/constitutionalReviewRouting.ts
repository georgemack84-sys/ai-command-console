export function buildConstitutionalReviewRoute(input: {
  reviewType: string;
  blockedReasons: string[];
}) {
  return {
    reviewType: input.reviewType,
    route: [
      "governance_validation",
      "constitutional_enforcement",
      "approval_validation",
      "replay_verification",
      "containment_verification",
      ...(input.blockedReasons.includes("COORDINATION_FREEZE_ACTIVE") ? ["coordination_freeze_review"] : []),
      ...(input.blockedReasons.includes("REPLAY_MISMATCH_UNRESOLVED") ? ["replay_mismatch_review"] : []),
      "immutable_audit_append",
    ],
  };
}
