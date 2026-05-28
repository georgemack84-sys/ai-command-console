import type {
  ConstitutionalReadinessError,
  ReadinessClassification,
} from "./readinessStateTypes";

export function classifyReadiness(input: {
  confidenceScore: number;
  uncertaintyPenalty: number;
  errors: readonly ConstitutionalReadinessError[];
}): ReadinessClassification {
  const severeError = input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_READINESS_GOVERNANCE_BINDING_INVALID"
    || error.code === "CONSTITUTIONAL_READINESS_REPLAY_NONDETERMINISTIC"
    || error.code === "CONSTITUTIONAL_READINESS_CONTAINMENT_WEAKENED"
    || error.code === "CONSTITUTIONAL_READINESS_AUTHORITY_CROSSOVER"
    || error.code === "CONSTITUTIONAL_READINESS_BOUNDARY_VIOLATION");
  if (severeError) {
    return "FROZEN";
  }
  if (input.errors.length > 0) {
    return input.confidenceScore - input.uncertaintyPenalty > 0.5 ? "DEGRADED" : "DISPUTED";
  }
  const netScore = input.confidenceScore - input.uncertaintyPenalty;
  if (netScore >= 0.9) {
    return "VERIFIED";
  }
  if (netScore >= 0.7) {
    return "CONDITIONAL";
  }
  return "DEGRADED";
}
