export function computeVerificationConfidence({
  replayIntegrity,
  governanceIntegrity,
  truthIntegrity,
  continuityIntegrity,
  disputeCount,
}: {
  replayIntegrity: boolean;
  governanceIntegrity: boolean;
  truthIntegrity: boolean;
  continuityIntegrity: boolean;
  disputeCount: number;
}) {
  let score = 1;
  score -= replayIntegrity ? 0 : 0.35;
  score -= governanceIntegrity ? 0 : 0.2;
  score -= truthIntegrity ? 0 : 0.2;
  score -= continuityIntegrity ? 0 : 0.15;
  score -= Math.min(0.3, disputeCount * 0.08);
  return Math.max(0, Math.min(1, score));
}
