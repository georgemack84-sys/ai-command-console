import { clampMetric } from "../stability/stabilityMetrics";
import type { ContinuityConvergenceResult } from "../convergence/convergenceTypes";
import type { ConvergencePrioritySignals } from "./prioritizationTypes";

export function correlateConvergencePriority(
  convergence: ContinuityConvergenceResult | null | undefined,
): ConvergencePrioritySignals {
  if (!convergence) {
    return {
      convergenceConfidence: 0.2,
      divergenceScore: 1,
      runtimeDriftSeverity: 0.8,
      staleOwnershipRisk: 0.8,
      orphanedOperationRisk: 0.8,
      replayDivergenceRisk: 0.8,
      constitutionalRisk: 0.85,
      containmentPressure: 0.75,
      warnings: ["convergence_signal_missing"],
    };
  }

  return {
    convergenceConfidence: clampMetric(
      (
        convergence.continuityConfidence
        + convergence.replayConfidence
        + convergence.survivabilityConfidence
        + convergence.escalationStabilityConfidence
      ) / 4,
      0.15,
    ),
    divergenceScore: clampMetric(convergence.divergenceScore, 1),
    runtimeDriftSeverity: clampMetric(
      convergence.divergenceScore * 0.55 + (convergence.state === "DRIFTING" ? 0.2 : 0),
      1,
    ),
    staleOwnershipRisk: clampMetric(convergence.staleOwnershipClaims.length / 4, 1),
    orphanedOperationRisk: clampMetric(convergence.orphanedOperations.length / 4, 1),
    replayDivergenceRisk: clampMetric(
      (convergence.divergenceReasons.some((reason) => reason.includes("replay")) ? 0.65 : 0)
      + (1 - convergence.replayConfidence) * 0.5,
      1,
    ),
    constitutionalRisk: clampMetric(
      (convergence.unresolvedDisputes.length > 0 ? 0.55 : 0)
      + (convergence.state === "SYSTEMIC_RISK" ? 0.45 : 0)
      + (convergence.requiresFreeze ? 0.2 : 0),
      1,
    ),
    containmentPressure: clampMetric(
      (convergence.requiresContainment ? 0.5 : 0)
      + convergence.unstableDependencies.length / 6
      + convergence.divergenceScore * 0.35,
      1,
    ),
    warnings: [
      ...(convergence.requiresFreeze ? ["freeze_required"] : []),
      ...(convergence.requiresEscalation ? ["escalation_required"] : []),
      ...convergence.divergenceReasons,
    ],
  };
}
