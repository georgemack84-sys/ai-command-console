import type { ConstitutionalState } from "./constitutionalPolicyRegistry";

export function evaluateGovernanceEscalation(input: {
  constitutionalState: ConstitutionalState;
  violations: string[];
  governanceConfidence: number;
}) {
  const escalationRequired =
    input.constitutionalState === "EMERGENCY_GOVERNANCE"
    || input.constitutionalState === "ESCALATED"
    || input.violations.includes("disputed_truth_detected")
    || input.governanceConfidence < 0.55;

  const reasoning: string[] = [];
  if (input.constitutionalState === "EMERGENCY_GOVERNANCE") reasoning.push("emergency_governance_requires_escalation");
  if (input.violations.includes("disputed_truth_detected")) reasoning.push("disputed_truth_requires_escalation");
  if (input.governanceConfidence < 0.55) reasoning.push("low_governance_confidence_requires_escalation");

  return {
    escalationRequired,
    reasoning: Array.from(new Set(reasoning)),
  };
}
