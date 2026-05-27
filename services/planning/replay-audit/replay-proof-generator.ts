import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import type { ReplayAuditInput, ReplayProof } from "./replay-audit-types";

export function buildReplayProof(input: {
  replayAuditInput: ReplayAuditInput;
  originalReplaySnapshotHash: string;
  replayedReplaySnapshotHash: string;
}): ReplayProof {
  const { replayAuditInput, originalReplaySnapshotHash, replayedReplaySnapshotHash } = input;
  const originalExecutionTruthHash = replayAuditInput.executionTruthPackage.executionTruthHash;
  const replayedExecutionTruthHash = replayAuditInput.executionTruthPackage.executionTruthHash;
  const originalExecutionCompatibilityHash = replayAuditInput.executionCompatibilityContract.executionCompatibilityHash;
  const replayedExecutionCompatibilityHash = replayAuditInput.executionCompatibilityContract.executionCompatibilityHash;

  const structuralEquality =
    originalExecutionTruthHash === replayedExecutionTruthHash
    && originalExecutionCompatibilityHash === replayedExecutionCompatibilityHash
    && originalReplaySnapshotHash === replayedReplaySnapshotHash;

  return {
    proofVersion: "4.2H",
    planId: replayAuditInput.normalizedPlan.planId,
    originalExecutionTruthHash,
    replayedExecutionTruthHash,
    originalExecutionCompatibilityHash,
    replayedExecutionCompatibilityHash,
    originalReplaySnapshotHash,
    replayedReplaySnapshotHash,
    structuralEquality,
    verdict: structuralEquality ? "REPLAY_COMPATIBLE" : "REPLAY_INCOMPATIBLE",
    failureCode: structuralEquality ? undefined : "PHASE4_2H_REPLAY_PROOF_MISMATCH",
  };
}

export function hashReplayProof(proof: ReplayProof): string {
  return hashPayloadDeterministically(proof);
}
