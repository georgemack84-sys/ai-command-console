import type { CoordinationConflictState } from "../../types/coordination";

export function resolveCoordinationConflict(input: {
  disputedTruthPresent: boolean;
  containmentRequired: boolean;
  raceDetected: boolean;
  replayMismatch: boolean;
  approvalBypassAttempted: boolean;
}) {
  let conflictState: CoordinationConflictState = "NONE";
  if (input.disputedTruthPresent) conflictState = "DISPUTED";
  else if (input.replayMismatch) conflictState = "FROZEN";
  else if (input.containmentRequired) conflictState = "CONTAINED";
  else if (input.approvalBypassAttempted) conflictState = "BLOCKED";
  else if (input.raceDetected) conflictState = "CONFLICT";

  return {
    conflictState,
    blocked: ["DISPUTED", "FROZEN", "CONTAINED", "BLOCKED"].includes(conflictState),
  };
}
