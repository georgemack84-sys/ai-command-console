import type { AutonomyDispute, AutonomyReadinessInput } from "@/types/autonomy-readiness";

export function buildAutonomyDisputes(input: {
  source: AutonomyReadinessInput;
  currentLevel: string;
  governanceDisputed: boolean;
  replayDisputed: boolean;
  snapshotLineageMissing: boolean;
  capabilityDriftDetected: boolean;
}): readonly AutonomyDispute[] {
  const disputes: AutonomyDispute[] = [];

  if (input.governanceDisputed) {
    disputes.push(Object.freeze({
      code: "AUTONOMY_DISPUTED",
      reason: "Governance is disputed, so autonomy must remain disputed.",
      path: "governanceBinding",
    }));
  }
  if (input.replayDisputed) {
    disputes.push(Object.freeze({
      code: "AUTONOMY_REPLAY_UNBOUND",
      reason: "Replay lineage is disputed or incomplete.",
      path: "replayBinding",
    }));
  }
  if (input.snapshotLineageMissing) {
    disputes.push(Object.freeze({
      code: "AUTONOMY_SNAPSHOT_UNBOUND",
      reason: "Snapshot lineage is missing or incomplete.",
      path: "snapshots",
    }));
  }
  if (input.capabilityDriftDetected) {
    disputes.push(Object.freeze({
      code: "AUTONOMY_CAPABILITY_DRIFT",
      reason: "Autonomy level drifted away from constitutional boundary evidence.",
      path: "authorityCeiling",
    }));
  }
  if (!["A0", "A1", "A2", "A3", "A4", "A5", "A6"].includes(input.currentLevel)) {
    disputes.push(Object.freeze({
      code: "AUTONOMY_LEVEL_INVALID",
      reason: "Autonomy level is invalid or unknown.",
      path: "autonomyLevel",
    }));
  }

  return Object.freeze(disputes);
}
