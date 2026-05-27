export function validateAutonomyConstraints(input: {
  actionCategory: string;
  operatorOverrideAttempted: boolean;
  approvalVerified: boolean;
  governanceAllowed: boolean;
  immutableEvidenceMutationAttempted: boolean;
  unboundedAutonomyRequested: boolean;
  emergencyContainmentActive: boolean;
}) {
  const blockedReasons: string[] = [];
  if (input.actionCategory === "destructive") blockedReasons.push("destructive_self_authorization_blocked");
  if (!input.approvalVerified) blockedReasons.push("approval_bypass_blocked");
  if (input.operatorOverrideAttempted) blockedReasons.push("operator_override_blocked");
  if (!input.governanceAllowed) blockedReasons.push("governance_bypass_blocked");
  if (input.immutableEvidenceMutationAttempted) blockedReasons.push("immutable_evidence_mutation_blocked");
  if (input.unboundedAutonomyRequested) blockedReasons.push("unbounded_autonomy_blocked");
  if (input.emergencyContainmentActive) blockedReasons.push("autonomy_blocked_during_emergency_containment");
  return {
    allowed: blockedReasons.length === 0,
    blockedReasons: Array.from(new Set(blockedReasons)),
  };
}
