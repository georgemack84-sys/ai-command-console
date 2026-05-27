export function validateCoordinationConstraints(input: {
  enforcementExecutable: boolean;
  approvalRequired: boolean;
  approvalVerified: boolean;
  lineagePresent: boolean;
  disputedTruthPresent: boolean;
}) {
  const blockedReasons: string[] = [];
  if (!input.enforcementExecutable) blockedReasons.push("runtime_enforcement_precedence");
  if (input.approvalRequired && !input.approvalVerified) blockedReasons.push("approval_requirement_preserved");
  if (!input.lineagePresent) blockedReasons.push("coordination_lineage_missing");
  if (input.disputedTruthPresent) blockedReasons.push("disputed_truth_freezes_coordination");
  return {
    allowed: blockedReasons.length === 0,
    blockedReasons,
  };
}
