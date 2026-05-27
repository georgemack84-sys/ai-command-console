import type { HumanCoordinationOverrideError, HumanCoordinationOverrideInput } from "@/types/human-coordination-override";

function error(
  code: HumanCoordinationOverrideError["code"],
  message: string,
  path?: string,
): HumanCoordinationOverrideError {
  return Object.freeze({ code, message, path });
}

export function validateOverrideGovernance(
  input: HumanCoordinationOverrideInput,
): readonly HumanCoordinationOverrideError[] {
  const errors: HumanCoordinationOverrideError[] = [];
  if (input.coordinationRecord.governanceSnapshotId !== input.escalationResult.record.governanceSnapshotId) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_GOVERNANCE_MISMATCH",
      "Override must preserve the original escalation governance snapshot.",
      "escalationResult.record.governanceSnapshotId",
    ));
  }
  if (!input.operator.governanceAuthorized) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_UNAUTHORIZED",
      "Governance authorization is required for human override.",
      "operator.governanceAuthorized",
    ));
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("bypassgovernance")) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_GOVERNANCE_MISMATCH",
      "Governance bypass markers are forbidden.",
      "metadata.bypassGovernance",
    ));
  }
  return Object.freeze(errors);
}
