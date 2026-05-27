import type { CanonicalPlan } from "../../contracts/plan-types";
import type { ValidationError } from "../validation-result";
import { validateAndNormalizePlan } from "../../schema/schema-validator";

export function runSchemaPass(input: unknown) {
  const evidence = validateAndNormalizePlan(input);
  if (evidence.status !== "valid" || !evidence.normalized) {
    const errors: ValidationError[] = evidence.issues.map((issue) => ({
      ...issue,
      stage: "schema",
      code: issue.code === "PHASE42A_UNKNOWN_FIELD"
        ? "PLAN_UNKNOWN_FIELD"
        : issue.code === "PHASE42A_CIRCULAR_DEPENDENCY"
          ? "STRUCTURE_CYCLE_DETECTED"
          : issue.code === "PHASE42A_INVALID_STEP_GRAPH"
            ? "STRUCTURE_INVALID_ORDERING"
            : issue.code === "PHASE42A_UNSAFE_STEP"
              ? "PLAN_SAFETY_VIOLATION"
              : issue.code === "PHASE42A_DUPLICATE_STEP_ID"
                ? "STRUCTURE_INVALID_ORDERING"
                : "PLAN_SCHEMA_INVALID",
    }));

    return {
      ok: false as const,
      evidence,
      errors,
    };
  }

  return {
    ok: true as const,
    evidence,
    plan: evidence.normalized as CanonicalPlan,
  };
}
