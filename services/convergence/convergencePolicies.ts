import { getConvergenceThresholds } from "./convergenceThresholds";
import type { ConvergenceState, ContinuityConvergenceResult } from "./convergenceTypes";

export type ConvergencePolicyDecision = {
  state: ConvergenceState;
  requiresContainment: boolean;
  requiresEscalation: boolean;
  requiresFreeze: boolean;
  reasons: string[];
};

export function applyConvergencePolicies({
  divergenceScore,
  replayDivergence,
  escalationConflict,
  disputed,
  systemicRisk,
  unstableDependencyPropagation,
}: {
  divergenceScore: number;
  replayDivergence: boolean;
  escalationConflict: boolean;
  disputed: boolean;
  systemicRisk: boolean;
  unstableDependencyPropagation: boolean;
}): ConvergencePolicyDecision {
  const thresholds = getConvergenceThresholds();
  const reasons: string[] = [];
  let state: ConvergenceState = "CONVERGED";
  let requiresContainment = false;
  let requiresEscalation = false;
  let requiresFreeze = false;

  if (disputed) {
    state = "DISPUTED";
    requiresFreeze = true;
    reasons.push("disputed_continuity_state");
  } else if (systemicRisk || divergenceScore >= thresholds.systemicRiskThreshold) {
    state = "SYSTEMIC_RISK";
    requiresEscalation = true;
    requiresContainment = true;
    requiresFreeze = true;
    reasons.push("systemic_divergence_risk");
  } else if (replayDivergence || escalationConflict || divergenceScore >= thresholds.freezeThreshold) {
    state = escalationConflict ? "FROZEN" : "DESYNCHRONIZED";
    requiresFreeze = true;
    requiresContainment = replayDivergence;
    requiresEscalation = true;
    reasons.push(replayDivergence ? "replay_divergence_requires_freeze" : "escalation_conflict_requires_freeze");
  } else if (unstableDependencyPropagation || divergenceScore >= thresholds.containmentThreshold) {
    state = "CONTAINMENT_REQUIRED";
    requiresContainment = true;
    reasons.push("unstable_dependency_propagation");
  } else if (divergenceScore >= thresholds.escalationThreshold) {
    state = "ESCALATED";
    requiresEscalation = true;
    reasons.push("divergence_requires_escalation");
  } else if (divergenceScore >= thresholds.driftWarningThreshold) {
    state = "DRIFTING";
    reasons.push("continuity_drift_warning");
  }

  return {
    state,
    requiresContainment,
    requiresEscalation,
    requiresFreeze,
    reasons,
  };
}
