import type { ConstitutionalCoordinationError, ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

export function validateDeterministicState(record: ConstitutionalCoordinationRecord): readonly ConstitutionalCoordinationError[] {
  const replayedHash = hashContainmentValue("constitutional-coordination-record", {
    coordinationId: record.coordinationId,
    proposalId: record.proposalId,
    governanceSnapshotId: record.governanceSnapshotId,
    replaySnapshotId: record.replaySnapshotId,
    escalationSnapshotId: record.escalationSnapshotId,
    coordinationState: record.coordinationState,
    constitutionalCeilingLevel: record.constitutionalCeilingLevel,
    lineage: record.lineage,
    authorityContract: record.authorityContract,
    governanceBinding: record.governanceBinding,
    replayBinding: record.replayBinding,
    escalationBinding: record.escalationBinding,
    chronology: record.chronology,
  });
  if (replayedHash === record.deterministicHash) {
    return Object.freeze([]);
  }
  return Object.freeze([
    createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_HASH_MISMATCH",
      "Deterministic reconstruction did not reproduce the coordination hash.",
      "deterministicHash",
    ),
  ]);
}
