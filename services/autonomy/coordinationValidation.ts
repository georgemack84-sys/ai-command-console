export function validateAutonomousCoordination(input: {
  constitutionalSafe: boolean;
  survivabilityScore: number;
  disputedTruth: boolean;
  freezeActive: boolean;
  containmentRequired: boolean;
}) {
  const blockedReasons: string[] = [];
  if (input.disputedTruth) blockedReasons.push("disputed_truth_freezes_coordination");
  if (input.freezeActive) blockedReasons.push("freeze_state_blocks_coordination");
  if (input.containmentRequired) blockedReasons.push("containment_precedence_preserved");
  if (input.survivabilityScore < 0.45) blockedReasons.push("insufficient_survivability_confidence");
  if (!input.constitutionalSafe) blockedReasons.push("constitutional_safety_insufficient");

  return {
    valid: blockedReasons.length === 0,
    blockedReasons: Array.from(new Set(blockedReasons)),
  };
}
