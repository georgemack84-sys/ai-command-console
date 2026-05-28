import { createCompatibilityViolation } from "./execution-compatibility-errors";
import type { CompensationContract, CompatibilityViolation } from "./execution-compatibility-types";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function buildCompensationContracts(steps: Array<{ id: string; inputs: Record<string, unknown> }>): CompensationContract[] {
  return steps.map((step) => {
    const compatibility = readRecord(step.inputs.compatibility);
    const compensation = readRecord(compatibility.compensation);
    return {
      stepId: step.id,
      irreversible: compensation.irreversible === true || step.inputs.irreversible === true,
      compensationStrategy: typeof compensation.compensationStrategy === "string"
        ? compensation.compensationStrategy
        : undefined,
      compensationWindowSeconds: typeof compensation.compensationWindowSeconds === "number"
        ? compensation.compensationWindowSeconds
        : undefined,
      requiresApproval: compensation.requiresApproval === true,
    };
  });
}

export function validateCompensationContracts(contracts: CompensationContract[]): CompatibilityViolation[] {
  const violations: CompatibilityViolation[] = [];
  for (const contract of contracts) {
    if (contract.irreversible && !contract.compensationStrategy) {
      violations.push(createCompatibilityViolation(
        "PLAN_COMPENSATION_REQUIRED",
        `Irreversible step ${contract.stepId} requires compensation metadata.`,
        `compensationContracts.${contract.stepId}`,
      ));
    }
  }
  return violations;
}
