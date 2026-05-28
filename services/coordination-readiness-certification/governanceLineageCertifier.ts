import type {
  CoordinationReadinessCertificationError,
  CoordinationReadinessCertificationInput,
  CoordinationReadinessViolation,
} from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

function error(
  code: CoordinationReadinessCertificationError["code"],
  message: string,
  path?: string,
): CoordinationReadinessCertificationError {
  return Object.freeze({ code, message, path });
}

export function certifyGovernanceLineage(input: CoordinationReadinessCertificationInput): {
  governanceLinked: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const governanceSnapshotIds = new Set([
    input.coordinationRecord.governanceSnapshotId,
    input.coordinationReplay.governance.governanceSnapshotId,
    input.escalationResult.record.governanceSnapshotId,
    input.overrideResult.record.governanceSnapshotId,
    input.boundaryResult.record.governanceSnapshotId,
  ]);
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const governanceLinked = governanceSnapshotIds.size === 1
    && !serialized.includes("bypassgovernance")
    && !serialized.includes("substitutegovernance")
    && !serialized.includes("mutategovernance");

  if (!governanceLinked) {
    errors.push(error(
      "COORDINATION_READINESS_GOVERNANCE_LINKAGE",
      "Governance linkage was incomplete, ambiguous, or mutated across readiness artifacts.",
      "governanceSnapshotId",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("coordination-readiness-governance-violation-id", {
        certificationId: input.certificationId,
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "governance",
      severity: "critical",
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("coordination-readiness-governance-violation", [...governanceSnapshotIds]),
    }));
  }

  return Object.freeze({
    governanceLinked,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
