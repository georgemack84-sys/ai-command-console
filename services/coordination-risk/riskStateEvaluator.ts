import type { EscalationReason, EscalationState } from "@/types/escalation-aware-coordination";
import type { CoordinationUncertaintyProfile } from "@/services/uncertainty-detection/uncertaintyDetector";

export function resolveEscalationState(profile: CoordinationUncertaintyProfile): {
  escalationState: EscalationState;
  escalationReason: EscalationReason;
} {
  if (profile.replayUncertainty >= 1) {
    return { escalationState: "critical", escalationReason: "replay_break" };
  }
  if (profile.governanceMismatch >= 1) {
    return { escalationState: "frozen", escalationReason: "governance_mismatch" };
  }
  if (profile.approvalIncomplete >= 1) {
    return { escalationState: "restricted", escalationReason: "approval_incomplete" };
  }
  if (profile.orchestrationAmbiguity >= 0.7) {
    return { escalationState: "elevated", escalationReason: "orchestration_ambiguity" };
  }
  if (profile.boundaryDrift >= 0.6) {
    return { escalationState: "elevated", escalationReason: "boundary_drift" };
  }
  if (profile.policyUncertainty >= 1) {
    return { escalationState: "restricted", escalationReason: "policy_uncertainty" };
  }
  if (profile.confidenceDegradation >= 0.35) {
    return { escalationState: "degraded", escalationReason: "confidence_degradation" };
  }
  return { escalationState: "stable", escalationReason: "unknown_state" };
}
