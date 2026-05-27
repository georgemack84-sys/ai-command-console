import type { CoordinationReadinessCertificationInput, GovernanceCertificationInspection } from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectGovernanceCertification(input: CoordinationReadinessCertificationInput): GovernanceCertificationInspection {
  const base = Object.freeze({
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    governanceLinked: input.coordinationRecord.governanceSnapshotId === input.coordinationReplay.governance.governanceSnapshotId,
    governanceLineageId: input.coordinationRecord.lineage.governanceLineageId,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-readiness-governance-inspection", base),
  });
}
