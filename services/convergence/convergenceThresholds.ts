import type { ConvergenceThresholds } from "./convergenceTypes";

export function getConvergenceThresholds(): ConvergenceThresholds {
  return {
    driftWarningThreshold: 0.35,
    escalationThreshold: 0.52,
    containmentThreshold: 0.66,
    freezeThreshold: 0.74,
    systemicRiskThreshold: 0.86,
    replayDivergenceThreshold: 0.55,
    orphanedOperationThreshold: 2,
    dependencyPropagationThreshold: 0.5,
  };
}
