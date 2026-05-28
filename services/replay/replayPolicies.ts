import type { ReplayGovernedAction } from "./replayPermissions";

export function getReplayPolicy(action: ReplayGovernedAction) {
  return {
    requiresEvidence: true,
    destructive: action === "rollback" || action === "terminate" || action === "override" || action === "reassign",
    blocksOnDispute: true,
    blocksOnNonDeterminism: action !== "quarantine",
  };
}
