import type { BoundaryViolationInspection, CoordinationBoundaryVerdict, BoundaryViolation } from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectBoundaryViolations(input: {
  coordinationId: string;
  verdict: CoordinationBoundaryVerdict;
  violations: readonly BoundaryViolation[];
}): BoundaryViolationInspection {
  const base = Object.freeze({
    coordinationId: input.coordinationId,
    verdict: input.verdict,
    violationTypes: Object.freeze(input.violations.map((violation) => violation.violationType)),
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-boundary-violation-inspection", base),
  });
}
