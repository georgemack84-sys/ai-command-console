import type { BoundaryCertificationInspection } from "@/types/coordination-readiness-certification";
import type { CoordinationBoundaryResult } from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectBoundaryCertification(boundary: CoordinationBoundaryResult): BoundaryCertificationInspection {
  const base = Object.freeze({
    boundaryId: boundary.record.boundaryId,
    boundaryVerdict: boundary.record.verdict,
    boundaryState: boundary.record.boundaryState,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-readiness-boundary-inspection", base),
  });
}
