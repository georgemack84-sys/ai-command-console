import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  UncertaintyPenaltyRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function computeUncertaintyPenalty(input: {
  readinessInput: ConstitutionalReadinessInput;
  errors: readonly ConstitutionalReadinessError[];
}): UncertaintyPenaltyRecord {
  const penaltyReasons = Object.freeze(input.errors.map((error) => error.code));
  const penalty = Number(Math.min(0.85, input.errors.length * 0.08).toFixed(4));

  return Object.freeze({
    readinessId: input.readinessInput.readinessId,
    penalty,
    penaltyReasons,
    penaltyHash: hashReadinessValue("constitutional-readiness-uncertainty-penalty", {
      readinessId: input.readinessInput.readinessId,
      penalty,
      penaltyReasons,
    }),
  });
}
