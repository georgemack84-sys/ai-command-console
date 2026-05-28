import type { EscalationAwareCoordinationError, EscalationAwareCoordinationInput } from "@/types/escalation-aware-coordination";

function error(
  code: EscalationAwareCoordinationError["code"],
  message: string,
  path?: string,
): EscalationAwareCoordinationError {
  return Object.freeze({ code, message, path });
}

export function validateGovernanceEscalation(input: EscalationAwareCoordinationInput): readonly EscalationAwareCoordinationError[] {
  const errors: EscalationAwareCoordinationError[] = [];
  if (
    input.coordinationRecord.governanceSnapshotId !== input.coordinationReplay.governance.governanceSnapshotId
  ) {
    errors.push(error(
      "ESCALATION_COORDINATION_GOVERNANCE_MISMATCH",
      "Escalation-aware coordination must bind to the original governance snapshot.",
      "governanceSnapshotId",
    ));
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("substitutegovernance") || serialized.includes("reinterpretgovernance")) {
    errors.push(error(
      "ESCALATION_COORDINATION_GOVERNANCE_MISMATCH",
      "Governance reinterpretation or substitution markers were detected.",
      "metadata.governance",
    ));
  }
  return Object.freeze(errors);
}
