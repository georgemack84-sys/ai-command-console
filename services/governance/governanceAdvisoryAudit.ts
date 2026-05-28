export type GovernanceAdvisoryAuditEvent =
  | "governance.recommendation.created"
  | "governance.recommendation.blocked"
  | "governance.recommendation.requires_approval"
  | "governance.recommendation.low_confidence"
  | "governance.recommendation.constraint_violation"
  | "governance.sovereignty_risk.detected"
  | "governance.emergency_containment.recommended";

export function buildGovernanceAdvisoryAuditRecord(input: {
  eventType: GovernanceAdvisoryAuditEvent;
  recommendationIds: string[];
  blockedRecommendations: string[];
  evidenceRefs: string[];
  timestamp: string;
}) {
  return {
    auditRef: `governance-audit:${input.eventType}:${input.timestamp}`,
    eventType: input.eventType,
    recommendationIds: input.recommendationIds,
    blockedRecommendations: input.blockedRecommendations,
    evidenceRefs: input.evidenceRefs,
    timestamp: input.timestamp,
  };
}
