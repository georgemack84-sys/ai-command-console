import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function hashConstitutionalCoordinationRecord(record: Omit<ConstitutionalCoordinationRecord, "deterministicHash">): string {
  return hashContainmentValue("constitutional-coordination-record", {
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
}
