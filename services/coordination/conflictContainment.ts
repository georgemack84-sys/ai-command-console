export function containCoordinationConflict(input: {
  conflictState: string;
  disputedTruthPresent: boolean;
  replayMismatch: boolean;
}) {
  const frozen =
    input.disputedTruthPresent
    || input.replayMismatch
    || ["CONFLICT", "FROZEN", "BLOCKED", "DISPUTED"].includes(input.conflictState);
  return {
    containmentRequired: frozen || input.conflictState === "CONTAINED",
    escalationRequired: input.disputedTruthPresent || input.replayMismatch,
    frozen,
  };
}
