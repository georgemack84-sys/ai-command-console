import { clampMetric } from "../stability/stabilityMetrics";
import type { ContinuityConvergenceResult } from "../convergence/convergenceTypes";
import type { OperationalStabilityAssessment } from "../stability/operationalStabilityEngine";

export function computeDriftAwarePriority({
  convergence,
  stability,
}: {
  convergence?: ContinuityConvergenceResult | null;
  stability?: OperationalStabilityAssessment | null;
}) {
  const runtimeDriftSeverity = clampMetric(
    (convergence?.divergenceScore || 0) * 0.6
      + (stability?.degradationRate || 0) * 0.4
      + (convergence?.state === "DESYNCHRONIZED" ? 0.2 : 0),
    1,
  );

  const containmentPressure = clampMetric(
    (convergence?.requiresContainment ? 0.5 : 0)
      + (stability?.containmentRecommended ? 0.35 : 0)
      + (stability?.replayInstabilityScore || 0) * 0.25,
    1,
  );

  return {
    runtimeDriftSeverity,
    containmentPressure,
  };
}
