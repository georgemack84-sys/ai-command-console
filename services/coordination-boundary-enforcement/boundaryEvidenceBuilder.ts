import type {
  BoundaryEvidenceRecord,
  CoordinationBoundaryInput,
  OrchestrationBoundaryInspection,
  RecursiveWorkflowInspection,
} from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function buildBoundaryEvidence(input: {
  boundaryInput: CoordinationBoundaryInput;
  orchestrationInspection: OrchestrationBoundaryInspection;
  recursiveInspection: RecursiveWorkflowInspection;
  violationCodes: readonly string[];
}): BoundaryEvidenceRecord {
  const base = Object.freeze({
    boundaryId: input.boundaryInput.boundaryId,
    coordinationId: input.boundaryInput.coordinationRecord.coordinationId,
    governanceSnapshotId: input.boundaryInput.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.boundaryInput.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.boundaryInput.coordinationRecord.escalationSnapshotId,
    overrideLineageId: input.boundaryInput.overrideResult.lineage.lineageId,
    violationCodes: Object.freeze([...input.violationCodes, ...input.recursiveInspection.indicators]),
  });
  return Object.freeze({
    evidenceId: hashCoordinationReplayValue("boundary-evidence-id", base),
    ...base,
    evidenceHash: hashCoordinationReplayValue("boundary-evidence", {
      ...base,
      orchestrationInspectionHash: input.orchestrationInspection.inspectionHash,
    }),
  });
}
