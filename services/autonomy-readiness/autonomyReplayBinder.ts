import type { AutonomyReadinessInput, ReplayBinding } from "@/types/autonomy-readiness";

export function bindAutonomyReplay(input: AutonomyReadinessInput): ReplayBinding {
  const disputed = !input.governanceView.replayAuthority.replaySnapshotHash
    || !input.governanceView.replayAuthority.replayLineageHash
    || input.governanceView.replayAuthority.decision !== "ALLOW"
    || !input.governanceView.replayAuthority.lineageValid;

  return Object.freeze({
    replaySnapshotHash: input.governanceView.replayAuthority.replaySnapshotHash,
    replayLineageHash: input.governanceView.replayAuthority.replayLineageHash,
    reconstructionHash: input.source.replay.reconstructionHash,
    deterministic: input.source.replay.status === "RECONSTRUCTED" && input.source.replay.integrity.valid,
    disputed,
  });
}
