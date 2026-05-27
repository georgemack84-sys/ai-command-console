import { createCompatibilityViolation } from "./execution-compatibility-errors";
import type { ApprovalContract, CompatibilityViolation } from "./execution-compatibility-types";

function isWildcard(values: string[]) {
  return values.some((value) => value.includes("*"));
}

function isDynamicTenant(values: string[]) {
  return values.some((value) => value.includes("${") || value.toLowerCase().includes("dynamic"));
}

export function validateScopeBoundaries(approvalContracts: ApprovalContract[]): CompatibilityViolation[] {
  const violations: CompatibilityViolation[] = [];

  for (const contract of approvalContracts) {
    const scopes = Object.entries(contract.scope) as Array<[string, string[]]>;
    for (const [scopeName, values] of scopes) {
      if (isWildcard(values)) {
        violations.push(createCompatibilityViolation(
          "PLAN_SCOPE_BOUNDARY_INVALID",
          `Wildcard scope is invalid for ${contract.stepId}.`,
          `approvalContracts.${contract.stepId}.${scopeName}`,
        ));
      }
      if (scopeName === "tenantScope" && isDynamicTenant(values)) {
        violations.push(createCompatibilityViolation(
          "PLAN_SCOPE_BOUNDARY_INVALID",
          `Dynamic tenant scope is invalid for ${contract.stepId}.`,
          `approvalContracts.${contract.stepId}.${scopeName}`,
        ));
      }
    }
  }

  return violations;
}
