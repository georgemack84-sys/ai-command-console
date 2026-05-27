import type { TruthDispute } from "./truthReconciliationTypes";

export function detectTruthDisputes({
  replayIntegrity,
  governanceIntegrity,
  continuityState,
  reconciliationEvidence = [],
}: {
  replayIntegrity: { valid: boolean; evidence: string[] };
  governanceIntegrity: { valid: boolean; evidence: string[] };
  continuityState?: any;
  reconciliationEvidence?: string[];
}) {
  const disputes: TruthDispute[] = [];
  if (!replayIntegrity.valid) {
    disputes.push({
      code: "replay_divergence",
      severity: "CRITICAL",
      evidence: [...replayIntegrity.evidence],
    });
  }
  if (!governanceIntegrity.valid) {
    disputes.push({
      code: "governance_integrity_failed",
      severity: "HIGH",
      evidence: [...governanceIntegrity.evidence],
    });
  }
  if (continuityState?.replayDivergenceDetected) {
    disputes.push({
      code: "continuity_replay_divergence",
      severity: "CRITICAL",
      evidence: ["continuity:replay_divergence"],
    });
  }
  if (Array.isArray(reconciliationEvidence) && reconciliationEvidence.length > 0) {
    disputes.push({
      code: "truth_reconciliation_dispute",
      severity: "HIGH",
      evidence: [...reconciliationEvidence],
    });
  }
  return disputes;
}
