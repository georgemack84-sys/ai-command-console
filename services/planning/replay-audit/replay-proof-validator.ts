import { createReplayAuditFailure } from "./replay-audit-errors";
import type { ReplayAuditFailure, ReplayProof } from "./replay-audit-types";

export function validateReplayProof(proof: ReplayProof): readonly ReplayAuditFailure[] {
  if (proof.structuralEquality && proof.verdict === "REPLAY_COMPATIBLE") {
    return [];
  }

  return [createReplayAuditFailure(
    "PHASE4_2H_REPLAY_PROOF_MISMATCH",
    "Replay proof diverged from the original replay snapshot chain.",
    "replayProof",
  )];
}
