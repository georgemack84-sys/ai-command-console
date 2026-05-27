export function buildAutonomyAuditRecord(input: {
  supervisionState: string;
  stabilizationRecommended: boolean;
  escalationRequired: boolean;
  containmentRequired: boolean;
  operationalRisk: number;
  supervisionConfidence: number;
  blockedReasons: string[];
  timestamp: string;
}) {
  return {
    auditRef: `autonomy:${input.supervisionState.toLowerCase()}:${input.timestamp}`,
    supervisionState: input.supervisionState,
    stabilizationRecommended: input.stabilizationRecommended,
    escalationRequired: input.escalationRequired,
    containmentRequired: input.containmentRequired,
    operationalRisk: input.operationalRisk,
    supervisionConfidence: input.supervisionConfidence,
    blockedReasons: Array.from(new Set(input.blockedReasons)).sort(),
    timestamp: input.timestamp,
  };
}
