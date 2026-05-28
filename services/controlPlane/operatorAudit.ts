import type { ConstitutionalOperatorDecision } from "./operatorDecisionEngine";

export function buildOperatorDecisionAuditPreview(input: {
  decision: ConstitutionalOperatorDecision;
  submissionBlockedReason?: string;
}) {
  return {
    auditRef: `operator-audit:${input.decision.decisionId}`,
    eventType: "operator.review.preview",
    decisionId: input.decision.decisionId,
    targetId: input.decision.targetId,
    blockedReason: input.submissionBlockedReason ?? "read_dominant_phase_submission_disabled",
    immutableHash: input.decision.immutableHash,
    createdAt: input.decision.createdAt,
  };
}
