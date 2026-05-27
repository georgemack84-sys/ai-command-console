import { CONSTITUTIONAL_POLICY_REGISTRY, type ConstitutionalState } from "./constitutionalPolicyRegistry";

export type ConstitutionalGovernanceResult = {
  allowed: boolean;
  constitutionalState: ConstitutionalState;
  violations: string[];
  requiredApprovals: string[];
  escalationRequired: boolean;
  containmentRequired: boolean;
  governanceConfidence: number;
  reasoning: string[];
};

export function arbitrateGovernanceResults(results: ConstitutionalGovernanceResult[]): ConstitutionalGovernanceResult {
  const sorted = [...results].sort((left, right) => {
    return CONSTITUTIONAL_POLICY_REGISTRY[left.constitutionalState].priority
      - CONSTITUTIONAL_POLICY_REGISTRY[right.constitutionalState].priority;
  });

  return sorted[0];
}
