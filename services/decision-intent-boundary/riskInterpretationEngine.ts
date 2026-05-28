import type { DecisionIntentBoundaryError, IntentRiskLevel } from "./decisionIntentStateTypes";

export function interpretIntentRisk(errors: readonly DecisionIntentBoundaryError[]): {
  level: IntentRiskLevel;
  factors: readonly string[];
} {
  if (errors.length === 0) {
    return Object.freeze({
      level: "low" as const,
      factors: Object.freeze(["No execution, orchestration, or authority crossover semantics detected."]),
    });
  }
  if (errors.length >= 4) {
    return Object.freeze({
      level: "critical" as const,
      factors: Object.freeze(errors.map((error) => error.code)),
    });
  }
  if (errors.length >= 2) {
    return Object.freeze({
      level: "high" as const,
      factors: Object.freeze(errors.map((error) => error.code)),
    });
  }
  return Object.freeze({
    level: "medium" as const,
    factors: Object.freeze(errors.map((error) => error.code)),
  });
}
