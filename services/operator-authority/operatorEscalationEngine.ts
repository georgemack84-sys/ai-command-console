import type { OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function shouldOperatorEscalate(input: OperatorAuthorityInput): boolean {
  return input.actionType === "ESCALATE"
    || input.metadata?.overrideAmbiguity === true
    || input.metadata?.propagationMismatch === true
    || input.metadata?.replayDrift === true;
}
