export function verifyRuntimeContinuity({
  replayDeterministic,
  continuityConfidence = 1,
}: {
  replayDeterministic: boolean;
  continuityConfidence?: number;
}) {
  const valid = replayDeterministic && continuityConfidence >= 0.5;
  return {
    valid,
    evidence: valid ? ["continuity:verified"] : ["continuity:degraded"],
    disputes: valid ? [] : ["CONTINUITY_INSUFFICIENT"],
  };
}
