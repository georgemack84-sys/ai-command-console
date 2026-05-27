export type ConstitutionalFreezeRecommendation = Readonly<{
  freezeRecommendationId: string;
  severity: "E3" | "E4" | "E5";
  reason:
    | "risk_too_high"
    | "confidence_too_low"
    | "policy_mismatch"
    | "replay_uncertainty"
    | "topology_overflow"
    | "authority_drift"
    | "override_unreachable"
    | "unknown_state";
  evidenceRefs: readonly string[];
  lineageHash: string;
  createdAt: string;
}>;
