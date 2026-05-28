import type { CoordinationEscalationGovernance, CoordinationGovernanceError } from "@/types/intent-coordination-governance-core";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export function validateEscalationContainment(input: {
  escalationGovernance: CoordinationEscalationGovernance;
  escalation: ConstitutionalEscalationRecord;
}): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  if (input.escalation.recommendation.executable !== false || input.escalation.recommendation.derivedOnly !== true) {
    errors.push(createCoordinationGovernanceError("ESCALATION_CONTAINMENT_VIOLATION", "Escalation evidence must remain recommendation-only.", "escalation.recommendation"));
  }
  if (input.escalationGovernance.executionAuthority !== false) {
    errors.push(createCoordinationGovernanceError("ESCALATION_CONTAINMENT_VIOLATION", "Escalation governance can never grant execution authority.", "escalationGovernance.executionAuthority"));
  }
  return Object.freeze(errors);
}
