import type { GovernanceAwareEscalationRecord } from "@/types/escalation";

export function trackEscalationCoordination(escalationRecord: GovernanceAwareEscalationRecord): Readonly<{
  escalationBound: boolean;
}> {
  return Object.freeze({
    escalationBound: escalationRecord.decision.governanceValidated && escalationRecord.decision.replaySafe,
  });
}
