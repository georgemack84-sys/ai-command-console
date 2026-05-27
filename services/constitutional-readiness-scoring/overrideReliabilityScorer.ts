import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  OverrideReliabilityRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function scoreOverrideReliability(input: ConstitutionalReadinessInput): {
  record: OverrideReliabilityRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const globallyPropagated = input.humanSupremacyResult.overridePropagation.globallyPropagated;
  const propagationState = input.humanSupremacyResult.overridePropagation.propagationState;
  const score = globallyPropagated && propagationState === "immediate" ? 1 : 0.2;

  const errors: ConstitutionalReadinessError[] = [];
  if (!globallyPropagated || propagationState !== "immediate") {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_OVERRIDE_PROPAGATION_FAILED",
      message: "Override reliability degraded or propagation became partial.",
      path: "humanSupremacyResult.overridePropagation",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      supremacyId: input.humanSupremacyResult.record.supremacyId,
      globallyPropagated,
      propagationState,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-override-reliability", {
        supremacyId: input.humanSupremacyResult.record.supremacyId,
        globallyPropagated,
        propagationState,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
