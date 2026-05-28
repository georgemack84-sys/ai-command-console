export function verifyContinuitySnapshots(snapshots: Record<string, unknown>[] = []) {
  if (snapshots.length === 0) {
    return {
      valid: false,
      evidence: ["continuity:missing"],
      disputes: ["SNAPSHOT_MISSING"],
    };
  }

  const latest = snapshots.at(-1) || {};
  const replayDivergenceDetected = Boolean(latest.replayDivergenceDetected);
  return {
    valid: !replayDivergenceDetected,
    evidence: ["continuity:snapshots_present"],
    disputes: replayDivergenceDetected ? ["SNAPSHOT_REPLAY_DIVERGENCE"] : [],
  };
}
