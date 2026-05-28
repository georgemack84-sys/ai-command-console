import type { OperatorAuthorityAction, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";
import { hashOverrideReplayValue } from "./overrideReplayHashEngine";

export function buildOverrideReplayArtifact(input: {
  action: OperatorAuthorityAction;
  authorityInput: OperatorAuthorityInput;
}): string {
  return hashOverrideReplayValue("override-replay", {
    actionId: input.action.actionId,
    operatorId: input.action.operatorId,
    actionType: input.action.actionType,
    governanceSnapshotId: input.authorityInput.recommendationValidationResult.result.governanceSnapshotId,
    replaySnapshotId: input.authorityInput.recommendationValidationResult.result.replaySnapshotId,
    validationHash: input.authorityInput.recommendationValidationResult.result.validationHash,
  });
}
