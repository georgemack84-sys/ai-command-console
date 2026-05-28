import type { CoordinationRiskProfile, EscalationAwareCoordinationInput } from "@/types/escalation-aware-coordination";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";
import { COORDINATION_RISK_THRESHOLDS } from "./coordinationRiskContracts";
import { resolveEscalationState } from "./riskStateEvaluator";
import { detectCoordinationUncertainty } from "@/services/uncertainty-detection/uncertaintyDetector";

export function buildCoordinationRiskProfile(input: EscalationAwareCoordinationInput): CoordinationRiskProfile {
  const uncertainty = detectCoordinationUncertainty(input);
  const total = Math.min(
    uncertainty.confidenceDegradation +
      uncertainty.orchestrationAmbiguity +
      uncertainty.replayUncertainty +
      uncertainty.governanceMismatch +
      uncertainty.approvalIncomplete +
      uncertainty.boundaryDrift +
      uncertainty.policyUncertainty,
    1,
  );
  const { escalationState, escalationReason } = resolveEscalationState(uncertainty);
  const riskLevel =
    total >= COORDINATION_RISK_THRESHOLDS.critical ? "critical"
    : total >= COORDINATION_RISK_THRESHOLDS.high ? "high"
    : total >= COORDINATION_RISK_THRESHOLDS.moderate ? "moderate"
    : "low";

  const profile = Object.freeze({
    riskId: hashCoordinationReplayValue("coordination-risk-id", {
      escalationId: input.escalationId,
      coordinationId: input.coordinationRecord.coordinationId,
    }),
    coordinationId: input.coordinationRecord.coordinationId,
    riskLevel,
    confidenceScore: Math.max(0, 1 - uncertainty.confidenceDegradation),
    uncertaintyScore: total,
    replayRiskScore: uncertainty.replayUncertainty,
    governanceRiskScore: uncertainty.governanceMismatch + uncertainty.policyUncertainty,
    orchestrationRiskScore: uncertainty.orchestrationAmbiguity + uncertainty.boundaryDrift,
    approvalRiskScore: uncertainty.approvalIncomplete,
    escalationState,
    escalationReason,
    freezeRequired: escalationState === "frozen" || escalationState === "critical",
    reviewRequired: escalationState !== "stable",
    deterministicHash: "",
  });

  return Object.freeze({
    ...profile,
    deterministicHash: hashCoordinationReplayValue("coordination-risk-profile", profile),
  });
}
