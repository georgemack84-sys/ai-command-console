import { VALIDATION_ERROR_CODES, makeValidationError } from "./validationErrors";
import { dedupeReasons, governanceBlocksPlan } from "./validationPolicies";
import type { GovernanceDecision, GovernanceValidationInput, PlanStepDraft, PlannerToolRegistryEntry, ValidationError } from "./validationContracts";

export function validateGovernance(input: {
  governance?: GovernanceValidationInput;
  steps: readonly PlanStepDraft[];
  registry: Record<string, PlannerToolRegistryEntry>;
}) {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  let decision: GovernanceDecision = "ALLOW";
  const governanceVersion = input.governance?.governanceVersion ?? "governance-unversioned";

  if (!input.governance) {
    decision = "BLOCKED";
    errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.GOVERNANCE_VALIDATION_FAILED, phase: "governance", severity: "critical", message: "governance state is required", recoverable: false }));
  } else {
    if (input.governance.disputed) {
      decision = "DISPUTED";
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.GOVERNANCE_VALIDATION_FAILED, phase: "governance", severity: "critical", message: "governance is disputed", recoverable: false }));
    }

    if (governanceBlocksPlan(input.governance)) {
      if (decision === "ALLOW") {
        decision = input.governance.freezeActive || input.governance.containmentActive || Boolean(input.governance.constitutionalConflict)
          ? "FREEZE"
          : "BLOCKED";
      }
      errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.GOVERNANCE_VALIDATION_FAILED, phase: "governance", severity: "critical", message: "governance blocked the plan", recoverable: false }));
    }

    for (const step of input.steps) {
      const entry = input.registry[step.tool];
      if (!entry) {
        continue;
      }
      if ((entry.destructive || entry.externalMutation) && input.governance.containmentActive) {
        decision = "FREEZE";
        errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.VALIDATION_POLICY_VIOLATION, phase: "governance", severity: "critical", message: `containment blocks ${step.tool}`, stepId: step.id, recoverable: false }));
      }
      if (entry.destructive && input.governance.destructiveToolsAllowed === false) {
        if (decision === "ALLOW") {
          decision = "BLOCKED";
        }
        errors.push(makeValidationError({ code: VALIDATION_ERROR_CODES.GOVERNANCE_VALIDATION_FAILED, phase: "governance", severity: "critical", message: `destructive tool ${step.tool} is not allowed`, stepId: step.id, recoverable: false }));
      }
      if (entry.privileged) {
        warnings.push(`privileged_tool:${step.id}`);
      }
    }

    if (decision === "ALLOW" && warnings.length > 0) {
      decision = "WARN";
    }
  }

  return {
    valid: errors.length === 0,
    blockedReasons: dedupeReasons(errors.map((error) => error.code)),
    errors,
    warnings: Array.from(new Set(warnings)).sort(),
    decision,
    governanceVersion,
  };
}
