import type {
  ConstitutionalCoordinationError,
  ConstitutionalCoordinationValidation,
} from "@/types/constitutional-coordination";
import type { CoordinationContainmentRecord } from "@/types/coordination-containment";
import { hashContainmentValue } from "@/services/coordination-containment/containmentHasher";

export function buildConstitutionalValidation(input: {
  containmentRecord: CoordinationContainmentRecord;
  resultingState: import("@/types/constitutional-coordination").ConstitutionalCoordinationState;
  ceilingLevel: import("@/types/constitutional-coordination").ConstitutionalCeilingLevel;
  errors: readonly ConstitutionalCoordinationError[];
  reasons: readonly string[];
}): ConstitutionalCoordinationValidation {
  return Object.freeze({
    validationId: hashContainmentValue("constitutional-coordination-validation-id", {
      coordinationId: input.containmentRecord.coordinationId,
      ceilingLevel: input.ceilingLevel,
      resultingState: input.resultingState,
    }),
    valid: input.errors.length === 0,
    failClosed: input.errors.length > 0 || input.containmentRecord.validation.failClosed,
    containmentState: input.containmentRecord.validation.containmentState,
    resultingState: input.resultingState,
    ceilingLevel: input.ceilingLevel,
    reasons: Object.freeze([...input.reasons]),
  });
}
