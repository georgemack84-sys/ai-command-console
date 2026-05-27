import { getConvergenceThresholds } from "./convergenceThresholds";
import type { ContinuityConvergenceInput, DivergenceCategory } from "./convergenceTypes";

export type DivergenceDetectionResult = {
  categories: DivergenceCategory[];
  divergenceReasons: string[];
  affectedSubsystems: string[];
  unresolvedDisputes: string[];
};

export function detectConvergenceDivergence(input: ContinuityConvergenceInput): DivergenceDetectionResult {
  const thresholds = getConvergenceThresholds();
  const categories: DivergenceCategory[] = [];
  const divergenceReasons: string[] = [];
  const affectedSubsystems = [...(input.stability?.unstableSubsystems || [])];
  const unresolvedDisputes = input.governanceDisputes?.flatMap((entry) =>
    Array.isArray(entry.disputes) ? entry.disputes.map((value) => String(value)) : [],
  ) || [];

  if (input.continuity?.replayDivergenceDetected || (input.stability?.replayInstabilityScore || 0) >= thresholds.replayDivergenceThreshold) {
    categories.push("REPLAY_DIVERGENCE");
    divergenceReasons.push("replay_divergence_detected");
  }
  if (input.escalation?.conflictingEscalations?.length || input.escalation?.frozen) {
    categories.push("ESCALATION_DIVERGENCE");
    divergenceReasons.push("escalation_conflict_detected");
  }
  if ((input.continuity?.degradedDependencies || []).length > 0) {
    categories.push("CONTINUITY_DRIFT");
    divergenceReasons.push("continuity_drift_detected");
  }
  if ((input.stability?.staleExecutionSpread || 0) > 0.35) {
    categories.push("RUNTIME_DESYNCHRONIZATION");
    divergenceReasons.push("runtime_desynchronization_detected");
  }
  if ((input.stability?.dependencyInstabilityScore || 0) >= thresholds.dependencyPropagationThreshold) {
    categories.push("DEPENDENCY_PROPAGATION_DIVERGENCE");
    divergenceReasons.push("dependency_propagation_unstable");
  }
  if (input.stewardship?.governanceBlocked || input.stewardship?.verificationBlocked || unresolvedDisputes.length > 0) {
    categories.push("GOVERNANCE_DIVERGENCE");
    divergenceReasons.push("governance_divergence_detected");
  }
  if (input.stability?.containmentRecommended || input.escalation?.requiresContainment) {
    categories.push("CONTAINMENT_DIVERGENCE");
    divergenceReasons.push("containment_pressure_detected");
  }
  if ((input.stability?.survivabilityScore || 1) < 0.2 || input.stability?.lockdownRecommended) {
    categories.push("SYSTEMIC_DIVERGENCE");
    divergenceReasons.push("systemic_divergence_detected");
  }

  return {
    categories: Array.from(new Set(categories)),
    divergenceReasons: Array.from(new Set(divergenceReasons)),
    affectedSubsystems: Array.from(new Set(affectedSubsystems)),
    unresolvedDisputes,
  };
}
