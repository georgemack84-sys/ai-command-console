import type { EnforcementState } from "./executionSuppression";

export function buildEnforcementAuditRecord(input: {
  enforcementState: EnforcementState;
  blockedReasons: string[];
  containmentApplied: boolean;
  escalationTriggered: boolean;
  emergencyLockActive: boolean;
  enforcementConfidence: number;
  sourceLineage: string[];
  timestamp: string;
}) {
  return {
    auditRef: `enforcement:${input.enforcementState.toLowerCase()}:${input.timestamp}`,
    enforcementState: input.enforcementState,
    blockedReasons: Array.from(new Set(input.blockedReasons)).sort(),
    containmentApplied: input.containmentApplied,
    escalationTriggered: input.escalationTriggered,
    emergencyLockActive: input.emergencyLockActive,
    enforcementConfidence: input.enforcementConfidence,
    sourceLineage: input.sourceLineage,
    timestamp: input.timestamp,
  };
}
