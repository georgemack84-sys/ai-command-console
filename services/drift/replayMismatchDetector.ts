import type { DriftRecord, ReplayIntegrityState } from "@/types/freshness";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function detectReplayMismatch(input: {
  proposalId: string;
  replayValid: boolean;
  lifecycleReplayHash: string;
  proposalReplayHash: string;
  createdAt: string;
}): Readonly<{
  replayIntegrity: ReplayIntegrityState;
  drifts: readonly DriftRecord[];
}> {
  const mismatch = !input.replayValid || input.lifecycleReplayHash !== input.proposalReplayHash;
  if (!mismatch) {
    return Object.freeze({
      replayIntegrity: "verified",
      drifts: Object.freeze([]),
    });
  }

  return Object.freeze({
    replayIntegrity: input.replayValid ? "mismatch" : "quarantined",
    drifts: Object.freeze([
      Object.freeze({
        driftId: hashFreshnessValue("replay-drift-id", input),
        driftType: "replay" as const,
        severity: "critical" as const,
        detectedAt: input.createdAt,
        affectedProposalIds: Object.freeze([input.proposalId]),
        requiresEscalation: true,
        freezeRequired: true,
        replaySafe: false,
      }),
    ]),
  });
}
