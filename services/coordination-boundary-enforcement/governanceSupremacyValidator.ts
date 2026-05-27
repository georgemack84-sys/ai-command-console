import type {
  BoundaryViolation,
  CoordinationBoundaryError,
  CoordinationBoundaryInput,
} from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

function error(
  code: CoordinationBoundaryError["code"],
  message: string,
  path?: string,
): CoordinationBoundaryError {
  return Object.freeze({ code, message, path });
}

export function validateGovernanceSupremacy(input: CoordinationBoundaryInput): {
  valid: boolean;
  violations: readonly BoundaryViolation[];
  errors: readonly CoordinationBoundaryError[];
} {
  const errors: CoordinationBoundaryError[] = [];
  const violations: BoundaryViolation[] = [];
  const governanceSnapshotIds = new Set([
    input.coordinationRecord.governanceSnapshotId,
    input.orchestrationRecord.governanceSnapshotId,
    input.escalationResult.record.governanceSnapshotId,
    input.overrideResult.record.governanceSnapshotId,
    input.coordinationReplay.governance.governanceSnapshotId,
  ]);

  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (governanceSnapshotIds.size !== 1 || serialized.includes("bypassgovernance") || serialized.includes("substitutegovernance")) {
    errors.push(error(
      "COORDINATION_BOUNDARY_GOVERNANCE_LINKAGE_MISSING",
      "Governance linkage was missing, substituted, or inconsistent across coordination artifacts.",
      "governanceSnapshotId",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("boundary-governance-violation-id", {
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      coordinationId: input.coordinationRecord.coordinationId,
      violationType: "GOVERNANCE_LINKAGE_MISSING",
      severity: "critical",
      governanceLinked: false,
      replaySafe: true,
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("boundary-governance-violation", [...governanceSnapshotIds]),
    }));
  }

  return Object.freeze({
    valid: errors.length === 0,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
