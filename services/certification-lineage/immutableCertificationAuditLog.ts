import type { CertificationEvidenceRecord, CoordinationReadinessCertificationInput } from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function buildImmutableCertificationAuditLog(input: {
  certificationInput: CoordinationReadinessCertificationInput;
  evidence: CertificationEvidenceRecord;
  certificationState: string;
}): Readonly<{
  auditId: string;
  certificationId: string;
  coordinationId: string;
  certificationState: string;
  createdAt: string;
  evidenceHash: string;
}> {
  const base = Object.freeze({
    certificationId: input.certificationInput.certificationId,
    coordinationId: input.certificationInput.coordinationRecord.coordinationId,
    certificationState: input.certificationState,
    createdAt: input.certificationInput.createdAt,
  });
  return Object.freeze({
    auditId: hashCoordinationReplayValue("coordination-readiness-audit-id", base),
    ...base,
    evidenceHash: input.evidence.evidenceHash,
  });
}
