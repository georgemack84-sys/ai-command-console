import type {
  BoundaryCertificationInspection,
  CertificationEvidenceRecord,
  CoordinationReadinessCertificationInput,
  EscalationCertificationInspection,
  GovernanceCertificationInspection,
  ReplayCertificationInspection,
} from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function buildCertificationEvidence(input: {
  certificationInput: CoordinationReadinessCertificationInput;
  replayInspection: ReplayCertificationInspection;
  governanceInspection: GovernanceCertificationInspection;
  escalationInspection: EscalationCertificationInspection;
  boundaryInspection: BoundaryCertificationInspection;
  reasons: readonly string[];
}): CertificationEvidenceRecord {
  const base = Object.freeze({
    certificationId: input.certificationInput.certificationId,
    coordinationId: input.certificationInput.coordinationRecord.coordinationId,
    governanceSnapshotId: input.certificationInput.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.certificationInput.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.certificationInput.coordinationRecord.escalationSnapshotId,
    overrideLineageId: input.certificationInput.overrideResult.lineage.lineageId,
    boundaryLineageId: input.certificationInput.boundaryResult.lineage.lineageId,
    reasons: Object.freeze([...input.reasons]),
  });
  return Object.freeze({
    evidenceId: hashCoordinationReplayValue("coordination-readiness-evidence-id", base),
    ...base,
    evidenceHash: hashCoordinationReplayValue("coordination-readiness-evidence", {
      ...base,
      replayInspectionHash: input.replayInspection.inspectionHash,
      governanceInspectionHash: input.governanceInspection.inspectionHash,
      escalationInspectionHash: input.escalationInspection.inspectionHash,
      boundaryInspectionHash: input.boundaryInspection.inspectionHash,
    }),
  });
}
