import type { ConstitutionalReadinessResult } from "@/types/constitutional-readiness";
import type {
  ControlledAutonomyGateError,
  ControlledAutonomyReadinessGateInput,
} from "./controlledAutonomyReadinessGate";

export function evaluateConstitutionalReadiness(input: ControlledAutonomyReadinessGateInput): ConstitutionalReadinessResult {
  return input.constitutionalReadinessResult;
}

export function validateConstitutionalReadinessEnvelope(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const errors: ControlledAutonomyGateError[] = [];
  if (!input.constitutionalReadinessResult.derivedOnly) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_READINESS_NOT_DERIVED",
      message: "Controlled autonomy readiness gate requires a derived-only constitutional readiness result.",
      path: "constitutionalReadinessResult.derivedOnly",
    }));
  }
  return Object.freeze(errors);
}
