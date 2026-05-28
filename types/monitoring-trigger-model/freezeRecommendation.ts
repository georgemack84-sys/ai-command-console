export type FreezeRecommendation = Readonly<{
  recommendationId: string;
  reason:
    | "replay_mismatch"
    | "governance_uncertainty"
    | "confidence_collapse"
    | "trigger_correlation"
    | "integrity_drift";
  severity: "high" | "critical";
  evidenceHashes: readonly string[];
  lineageHash: string;
  createdAt: string;
}>;
