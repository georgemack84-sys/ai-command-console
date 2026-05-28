import type {
  RuntimeAdmissibilityClassification,
  RuntimeAdmissibilityError,
  RuntimeReadinessScore,
} from "./runtimeAdmissibilityStateTypes";

export function resolveRuntimeAdmissibilityClassification(
  errors: readonly RuntimeAdmissibilityError[],
  score: RuntimeReadinessScore,
): RuntimeAdmissibilityClassification {
  const codes = new Set(errors.map((error) => error.code));
  if (codes.has("RUNTIME_ADMISSIBILITY_OVERRIDE_INCOMPATIBLE")) {
    return "revoked";
  }
  if (codes.has("RUNTIME_ADMISSIBILITY_GOVERNANCE_DETACHED")
    || codes.has("RUNTIME_ADMISSIBILITY_GOVERNANCE_MISMATCH")
    || codes.has("RUNTIME_ADMISSIBILITY_BOUNDARY_VIOLATION")
    || codes.has("RUNTIME_ADMISSIBILITY_ISOLATION_VIOLATION")) {
    return "invalid";
  }
  if (codes.has("RUNTIME_ADMISSIBILITY_HIDDEN_ORCHESTRATION")
    || codes.has("RUNTIME_ADMISSIBILITY_RECURSIVE_COORDINATION")
    || codes.has("RUNTIME_ADMISSIBILITY_INVISIBLE_SCHEDULING")
    || codes.has("RUNTIME_ADMISSIBILITY_HIDDEN_EXECUTION")
    || codes.has("RUNTIME_ADMISSIBILITY_ANTI_EMERGENCE_VIOLATION")
    || codes.has("RUNTIME_ADMISSIBILITY_CONTAINMENT_DEGRADED")) {
    return "frozen";
  }
  if (errors.length > 0) {
    return "disputed";
  }
  if (score.score < 100) {
    return "elevated";
  }
  return "admissible";
}
