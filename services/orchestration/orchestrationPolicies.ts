import type { ConstitutionalState } from "../governance/constitutionalPolicyRegistry";

export function evaluateOrchestrationPolicies(input: {
  allowed: boolean;
  constitutionalState: ConstitutionalState;
  validationValid: boolean;
  escalationLoopDetected: boolean;
  containmentRequired: boolean;
}) {
  const blockedReasons: string[] = [];
  if (!input.validationValid) blockedReasons.push("validation_failure_blocks_orchestration");
  if (input.escalationLoopDetected) blockedReasons.push("escalation_loop_blocks_orchestration");
  if (input.containmentRequired) blockedReasons.push("containment_requirement_blocks_standard_execution");
  if (!input.allowed) blockedReasons.push("governance_denied_orchestration");

  return {
    authorized: input.allowed && input.validationValid && !input.escalationLoopDetected && !input.containmentRequired,
    locked: input.constitutionalState === "LOCKED" || input.constitutionalState === "DENIED" || input.constitutionalState === "EMERGENCY_GOVERNANCE",
    blockedReasons: Array.from(new Set(blockedReasons)),
  };
}
