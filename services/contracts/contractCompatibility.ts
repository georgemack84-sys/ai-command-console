import type { CompatibilityChange, ContractCompatibilityResult } from "./contractTypes";
import { evaluateCompatibilityRules } from "./compatibilityRules";

export function assessContractCompatibility(input: {
  fromVersion: string;
  toVersion: string;
  changes: CompatibilityChange[];
}): ContractCompatibilityResult {
  return evaluateCompatibilityRules(input);
}
