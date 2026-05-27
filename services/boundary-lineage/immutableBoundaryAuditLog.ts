import type { BoundaryEvidenceRecord, CoordinationBoundaryInput } from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function buildImmutableBoundaryAuditLog(input: {
  boundaryInput: CoordinationBoundaryInput;
  evidence: BoundaryEvidenceRecord;
  verdict: string;
}): Readonly<{
  auditId: string;
  boundaryId: string;
  coordinationId: string;
  verdict: string;
  createdAt: string;
  evidenceHash: string;
}> {
  const base = Object.freeze({
    boundaryId: input.boundaryInput.boundaryId,
    coordinationId: input.boundaryInput.coordinationRecord.coordinationId,
    verdict: input.verdict,
    createdAt: input.boundaryInput.createdAt,
  });
  return Object.freeze({
    auditId: hashCoordinationReplayValue("coordination-boundary-audit-id", base),
    ...base,
    evidenceHash: input.evidence.evidenceHash,
  });
}
