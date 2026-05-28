import type {
  ConstitutionalEscalationEvidence,
  ConstitutionalFreezeRecommendation,
  EscalationLevel,
} from "@/types/constitutional-escalation-layer";
import { hashEscalationValue } from "./escalationHasher";

export function deriveConstitutionalFreezeRecommendation(input: {
  severity: EscalationLevel;
  evidence: ConstitutionalEscalationEvidence;
  lineageHash: string;
  createdAt: string;
}): ConstitutionalFreezeRecommendation | undefined {
  if (!["E3", "E4", "E5"].includes(input.severity)) {
    return undefined;
  }

  const reason: ConstitutionalFreezeRecommendation["reason"] =
    input.evidence.replayUnsafe ? "replay_uncertainty"
    : input.evidence.policyMismatch ? "policy_mismatch"
    : input.evidence.authorityDrift ? "authority_drift"
    : input.evidence.branchFactorOverflow || input.evidence.depthOverflow ? "topology_overflow"
    : input.evidence.missingOverrideReachability ? "override_unreachable"
    : input.evidence.confidenceTooLow ? "confidence_too_low"
    : input.evidence.riskTooHigh ? "risk_too_high"
    : "unknown_state";

  return Object.freeze({
    freezeRecommendationId: hashEscalationValue("constitutional-freeze-recommendation-id", {
      severity: input.severity,
      reason,
      createdAt: input.createdAt,
    }),
    severity: input.severity as "E3" | "E4" | "E5",
    reason,
    evidenceRefs: input.evidence.evidenceRefs,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });
}
