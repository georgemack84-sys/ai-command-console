import type { ConstitutionalCeilingLevel, ConstitutionalCoordinationError } from "@/types/constitutional-coordination";
import type { CoordinationContainmentRecord } from "@/types/coordination-containment";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

export function validateGovernanceCeiling(input: {
  ceilingLevel: ConstitutionalCeilingLevel;
  containmentRecord: CoordinationContainmentRecord;
}): readonly ConstitutionalCoordinationError[] {
  const containmentState = input.containmentRecord.validation.containmentState;
  if (containmentState === "safe" && input.ceilingLevel === "strict") {
    return Object.freeze([]);
  }
  if (containmentState === "restricted" && input.ceilingLevel !== "frozen") {
    return Object.freeze([]);
  }
  if (containmentState !== "safe" && input.ceilingLevel === "strict") {
    return Object.freeze([
      createConstitutionalCoordinationError(
        "CONSTITUTIONAL_COORDINATION_CONTAINMENT_PRECEDENCE",
        "Containment restrictions must take precedence over constitutional coordination ceilings.",
        "constitutionalCeilingLevel",
      ),
    ]);
  }
  return Object.freeze([]);
}
