import type { OperatorAuthorityInput, OverridePropagationRecord } from "./types/operatorAuthorityTypes";
import { hashOverrideReplayValue } from "./overrideReplayHashEngine";

export function buildOverridePropagation(input: OperatorAuthorityInput): OverridePropagationRecord {
  const propagationCompleted =
    input.metadata?.propagationMismatch !== true
    && input.metadata?.delayedPropagation !== true
    && input.targetIds.length > 0;
  return Object.freeze({
    actionId: input.actionId,
    actionType: input.actionType,
    targetIds: Object.freeze([...input.targetIds]),
    propagationCompleted,
    propagationHash: hashOverrideReplayValue("override-propagation", {
      actionId: input.actionId,
      actionType: input.actionType,
      targetIds: input.targetIds,
      propagationCompleted,
    }),
  });
}
