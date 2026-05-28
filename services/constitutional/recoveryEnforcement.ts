import type { ConstitutionalEnforcementAction } from "../decision/recoveryDecisionTypes";

export function enforceRecoveryConstitution(input: {
  requiredAction: ConstitutionalEnforcementAction;
  violations: string[];
  reasons: string[];
  evidence: string[];
}) {
  return {
    constitutionalAction: input.requiredAction,
    constitutionallyAllowed: input.requiredAction === "ALLOW" || input.requiredAction === "WARN",
    violations: input.violations,
    reasons: input.reasons,
    evidence: input.evidence,
  };
}
