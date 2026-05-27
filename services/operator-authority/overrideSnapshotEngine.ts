import type { OperatorAuthorityAction, OperatorAuthoritySnapshot } from "./types/operatorAuthorityTypes";
import { hashOverrideReplayValue } from "./overrideReplayHashEngine";

export function buildOverrideSnapshot(input: {
  action: OperatorAuthorityAction;
  propagationHash: string;
}): OperatorAuthoritySnapshot {
  return Object.freeze({
    snapshotId: hashOverrideReplayValue("override-snapshot-id", {
      actionId: input.action.actionId,
      propagationHash: input.propagationHash,
    }),
    actionId: input.action.actionId,
    governanceSnapshotId: input.action.governanceSnapshotId,
    replaySnapshotId: input.action.replaySnapshotId,
    propagationHash: input.propagationHash,
    snapshotHash: hashOverrideReplayValue("override-snapshot", {
      actionId: input.action.actionId,
      propagationHash: input.propagationHash,
      governanceSnapshotId: input.action.governanceSnapshotId,
      replaySnapshotId: input.action.replaySnapshotId,
    }),
  });
}
