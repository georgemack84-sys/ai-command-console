import { VALIDATION_ERROR_CODES, makeValidationError } from "./validationErrors";
import { dedupeReasons, isSupportedRiskLevel, isSupportedStepType } from "./validationPolicies";
import type { PlanDraft, ValidationError } from "./validationContracts";

export function validatePlanSchema(plan: PlanDraft) {
  const errors: ValidationError[] = [];

  if (!plan.planId) {
    errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.PLAN_ID_MISSING, phase: "schema", severity: "critical", message: "planId is required.", recoverable: false }));
  }
  if (!plan.intent) {
    errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.PLAN_SCHEMA_INVALID, phase: "schema", severity: "error", message: "intent is required.", recoverable: false }));
  }
  if (!plan.metadata || typeof plan.metadata !== "object") {
    errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.PLAN_SCHEMA_INVALID, phase: "schema", severity: "error", message: "metadata is required.", recoverable: false }));
  }
  if (!plan.schemaVersion) {
    errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.PLAN_SCHEMA_INVALID, phase: "schema", severity: "error", message: "schemaVersion is required.", recoverable: false }));
  }
  if (!Array.isArray(plan.steps)) {
    errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.PLAN_STEPS_MISSING, phase: "schema", severity: "critical", message: "steps array is required.", recoverable: false }));
  }

  const steps = Array.isArray(plan.steps) ? plan.steps : [];
  if (steps.length === 0) {
    errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.PLAN_EMPTY, phase: "schema", severity: "critical", message: "plan cannot be empty.", recoverable: false }));
  }

  const seen = new Set<string>();
  for (const step of steps) {
    if (seen.has(step.id)) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.DUPLICATE_STEP_ID, phase: "schema", severity: "critical", message: `duplicate step id ${step.id}`, stepId: step.id, recoverable: false }));
    }
    seen.add(step.id);
    if (!step.id || !step.tool || !step.input || !step.safety) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.PLAN_SCHEMA_INVALID, phase: "schema", severity: "error", message: "step requires id, tool, input, and safety.", stepId: step.id, recoverable: false }));
    }
    if (!isSupportedStepType(step.type)) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.INVALID_STEP_TYPE, phase: "schema", severity: "critical", message: `unsupported step type ${step.type}`, stepId: step.id, recoverable: false }));
    }
    if (!isSupportedRiskLevel(String(step.safety?.riskLevel ?? ""))) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.UNKNOWN_RISK_CLASS, phase: "schema", severity: "critical", message: `unknown risk level for ${step.id}`, stepId: step.id, recoverable: false }));
    }
  }

  const blockedReasons = dedupeReasons(errors.map((error) => error.code));
  return {
    valid: errors.length === 0,
    blockedReasons,
    errors,
  };
}
