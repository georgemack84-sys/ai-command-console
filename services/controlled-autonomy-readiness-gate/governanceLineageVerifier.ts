import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function verifyGovernanceLineage(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const governanceSnapshotId = input.constitutionalReadinessResult.record.governanceSnapshotId;
  if (!governanceSnapshotId) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_GOVERNANCE_LINEAGE_MISSING",
      message: "Governance lineage cannot be certified without an immutable governance snapshot.",
      path: "constitutionalReadinessResult.record.governanceSnapshotId",
    })]);
  }
  return Object.freeze([]);
}
