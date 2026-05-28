import { VALIDATION_ERROR_CODES, makeValidationError } from "./validationErrors";
import { dedupeReasons, PLANNER_TOOL_REGISTRY } from "./validationPolicies";
import type { PlanStepDraft, PlannerToolRegistryEntry, ValidationError } from "./validationContracts";

export function validateToolResolution(input: {
  steps: readonly PlanStepDraft[];
  registry?: Record<string, PlannerToolRegistryEntry>;
}) {
  const registry = input.registry ?? PLANNER_TOOL_REGISTRY;
  const errors: ValidationError[] = [];
  const resolvedTools: string[] = [];

  for (const step of input.steps) {
    const entry = registry[step.tool];
    if (!entry) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.TOOL_NOT_FOUND, phase: "tool-resolution", severity: "critical", message: `tool ${step.tool} not found`, stepId: step.id, recoverable: false }));
      continue;
    }
    if (!entry.enabled) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.TOOL_DISABLED, phase: "tool-resolution", severity: "critical", message: `tool ${step.tool} is disabled`, stepId: step.id, recoverable: false }));
    }
    if (!entry.riskLevel) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.TOOL_RISK_UNDECLARED, phase: "tool-resolution", severity: "critical", message: `tool ${step.tool} missing risk declaration`, stepId: step.id, recoverable: false }));
    }
    if (entry.requiresApproval === undefined) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.TOOL_APPROVAL_UNDECLARED, phase: "tool-resolution", severity: "critical", message: `tool ${step.tool} missing approval declaration`, stepId: step.id, recoverable: false }));
    }
    if (!entry.inputSchema || !entry.owner || !entry.version) {
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.TOOL_SCHEMA_INVALID, phase: "tool-resolution", severity: "critical", message: `tool ${step.tool} registry entry is malformed`, stepId: step.id, recoverable: false }));
    }
    resolvedTools.push(entry.canonicalToolId);
  }

  return {
    valid: errors.length === 0,
    resolvedTools: Array.from(new Set(resolvedTools)).sort(),
    blockedReasons: dedupeReasons(errors.map((error) => error.code)),
    errors,
  };
}
