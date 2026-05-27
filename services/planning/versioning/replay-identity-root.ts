import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { ReplayAuditResult } from "../replay-audit";
import type { ImmutableReplayIdentityRoot } from "./versioning-types";

export function buildImmutableReplayIdentityRoot(
  replayAuditResult: ReplayAuditResult,
  executionCompatibilityContract: ExecutionCompatibilityContract,
): ImmutableReplayIdentityRoot {
  return {
    executionTruthHash: executionCompatibilityContract.executionTruthHash,
    executionCompatibilityHash: executionCompatibilityContract.executionCompatibilityHash,
    initialReplaySnapshotHash: replayAuditResult.replaySnapshotHash ?? "",
    canonicalOriginVersion: replayAuditResult.artifacts?.replayInputSnapshot.snapshotVersion ?? "4.2H",
  };
}
