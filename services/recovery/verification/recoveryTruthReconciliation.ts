import type { RecoveryVerificationEvidenceBundle, TruthReconciliationResult } from "./recoveryVerificationTypes";

function score({
  replayConsistent,
  governanceConsistent,
  continuityConsistent,
  simulationConsistent,
  immutableEvidenceValid,
  mismatchCount,
}: {
  replayConsistent: boolean;
  governanceConsistent: boolean;
  continuityConsistent: boolean;
  simulationConsistent: boolean;
  immutableEvidenceValid: boolean;
  mismatchCount: number;
}) {
  let value = 1;
  if (!replayConsistent) value -= 0.3;
  if (!governanceConsistent) value -= 0.2;
  if (!continuityConsistent) value -= 0.2;
  if (!simulationConsistent) value -= 0.15;
  if (!immutableEvidenceValid) value -= 0.3;
  value -= Math.min(0.2, mismatchCount * 0.05);
  return Math.max(0, Math.min(1, value));
}

export function reconcileRecoveryTruthState({
  executionId,
  replayVerification,
  simulation,
  continuityState,
  immutableEvidenceValid,
  divergenceSummary,
  timestamp,
}: {
  executionId: string;
  replayVerification: RecoveryVerificationEvidenceBundle["replayVerification"];
  simulation: RecoveryVerificationEvidenceBundle["simulationResult"];
  continuityState: RecoveryVerificationEvidenceBundle["continuityState"];
  immutableEvidenceValid: boolean;
  divergenceSummary: {
    divergenceDetected: boolean;
    disputes: string[];
    governanceDisputes: string[];
    replayDivergenceCount: number;
  };
  timestamp: string;
}): TruthReconciliationResult {
  if (!replayVerification || !simulation || !continuityState || !immutableEvidenceValid) {
    return {
      executionId,
      reconciliationState: "UNVERIFIABLE",
      replayConsistent: false,
      governanceConsistent: false,
      continuityConsistent: false,
      simulationConsistent: false,
      immutableEvidenceValid,
      mismatches: ["evidence_missing"],
      disputed: true,
      divergenceDetected: divergenceSummary.divergenceDetected,
      confidenceScore: 0,
      timestamp,
    };
  }

  const replayConsistent = Boolean(replayVerification.replayIntegrity ?? replayVerification.verified);
  const governanceConsistent = Boolean(replayVerification.governanceIntegrity ?? true) && divergenceSummary.governanceDisputes.length === 0;
  const continuityConsistent = Boolean(replayVerification.continuityIntegrity ?? true) && !continuityState.replayDivergenceDetected;
  const simulationConsistent = !simulation.disputes?.length && simulation.outcome !== "REPLAY_DIVERGENCE_DETECTED" && simulation.outcome !== "GOVERNANCE_BLOCKED";

  const mismatches = Array.from(new Set([
    ...divergenceSummary.disputes,
    ...((simulation.disputes || []) as string[]),
    ...((replayVerification.disputes || []) as string[]),
    ...(continuityState.replayDivergenceDetected ? ["CONTINUITY_REPLAY_DIVERGENCE"] : []),
  ]));

  const disputed = divergenceSummary.governanceDisputes.length > 0 || simulation.outcome === "GOVERNANCE_BLOCKED";
  const divergenceDetected = divergenceSummary.divergenceDetected || simulation.outcome === "REPLAY_DIVERGENCE_DETECTED";

  const reconciliationState =
    divergenceDetected ? "DIVERGED"
      : disputed ? "DISPUTED"
        : mismatches.length > 0 ? "PARTIALLY_RECONCILED"
          : replayConsistent && governanceConsistent && continuityConsistent && simulationConsistent && immutableEvidenceValid
            ? "RECONCILED"
            : "PARTIALLY_RECONCILED";

  return {
    executionId,
    reconciliationState,
    replayConsistent,
    governanceConsistent,
    continuityConsistent,
    simulationConsistent,
    immutableEvidenceValid,
    mismatches,
    disputed,
    divergenceDetected,
    confidenceScore: score({
      replayConsistent,
      governanceConsistent,
      continuityConsistent,
      simulationConsistent,
      immutableEvidenceValid,
      mismatchCount: mismatches.length,
    }),
    timestamp,
  };
}
