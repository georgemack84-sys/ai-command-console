import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function reconstructConstitutionalCoordination(record: ConstitutionalCoordinationRecord): string {
  return hashContainmentValue("constitutional-coordination-reconstruction", {
    coordinationId: record.coordinationId,
    governanceSnapshotId: record.governanceSnapshotId,
    replaySnapshotId: record.replaySnapshotId,
    escalationSnapshotId: record.escalationSnapshotId,
    state: record.coordinationState,
    ceiling: record.constitutionalCeilingLevel,
    lineage: record.lineage,
  });
}
