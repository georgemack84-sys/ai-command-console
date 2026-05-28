import type { GovernanceResolution } from "@/types/governanceResolution";

export function resolveGovernanceConflicts(input: {
  replaySafe: boolean;
  freezeSafe: boolean;
  semanticValid: boolean;
  governanceApproved: boolean;
  ambiguityResolved: boolean;
  protectedTargetValidated: boolean;
  unsafeAssumptionsDetected: boolean;
  approvalRequired: boolean;
  containmentRequired: boolean;
  blockedReasons: string[];
}) : GovernanceResolution {
  const governanceState =
    !input.replaySafe ? "REPLAY_BLOCKED"
    : !input.freezeSafe ? "FROZEN"
    : !input.governanceApproved ? "DENIED"
    : !input.semanticValid ? "BLOCKED"
    : !input.ambiguityResolved ? "AMBIGUOUS"
    : !input.protectedTargetValidated || input.containmentRequired ? "ESCALATED"
    : input.approvalRequired ? "RESTRICTED"
    : "VALID";

  const governanceActions = Array.from(new Set([
    ...(governanceState === "VALID" ? ["ALLOW"] : []),
    ...(governanceState === "AMBIGUOUS" ? ["REQUEST_CLARIFICATION"] : []),
    ...(governanceState === "RESTRICTED" ? ["REQUIRE_APPROVAL"] : []),
    ...(governanceState === "ESCALATED" ? ["ESCALATE"] : []),
    ...(governanceState === "FROZEN" ? ["FREEZE", "CONTAIN"] : []),
    ...(governanceState === "REPLAY_BLOCKED" ? ["BLOCK", "ESCALATE"] : []),
    ...(governanceState === "DENIED" || governanceState === "BLOCKED" ? ["DENY", "BLOCK"] : []),
  ]));

  return {
    governanceState,
    governanceActions,
    escalationTargets:
      governanceState === "VALID" ? []
      : ["operator", "governance-review"],
    blockedReasons: Array.from(new Set(input.blockedReasons)),
  };
}
