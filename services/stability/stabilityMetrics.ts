function finite(value: number | undefined | null, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function clampMetric(value: number | undefined | null, fallback = 0.5) {
  const normalized = finite(value, fallback);
  return Math.max(0, Math.min(1, normalized));
}

export function ratio(numerator: number | undefined | null, denominator: number | undefined | null, fallback = 0.5) {
  const left = Math.max(0, finite(numerator, 0));
  const right = Math.max(0, finite(denominator, 0));
  if (right <= 0) {
    return clampMetric(fallback, fallback);
  }
  return clampMetric(left / right, fallback);
}

export function computeReplayInstabilityScore({
  divergenceCount = 0,
  divergenceSeverity = 0,
}: {
  divergenceCount?: number;
  divergenceSeverity?: number;
}) {
  return clampMetric((Math.max(0, divergenceCount) * 0.18) + (Math.max(0, divergenceSeverity) * 0.45), 0.2);
}

export function computeStaleExecutionSpread(staleExecutions = 0, activeRecoveries = 0) {
  return clampMetric((Math.max(0, staleExecutions) * 0.2) + (Math.max(0, activeRecoveries) * 0.08), 0.15);
}

export function computeDependencyInstabilityScore(degradedDependencies: string[] = []) {
  return clampMetric(Math.max(0, degradedDependencies.length) * 0.22, 0.1);
}

export function computeRecoveryPressure({
  activeRecoveries = 0,
  failedRecoveries = 0,
  repeatedFailures = 0,
}: {
  activeRecoveries?: number;
  failedRecoveries?: number;
  repeatedFailures?: number;
}) {
  return clampMetric(
    (Math.max(0, activeRecoveries) * 0.12)
      + (Math.max(0, failedRecoveries) * 0.2)
      + (Math.max(0, repeatedFailures) * 0.24),
    0.25,
  );
}

export function computeEscalationPressure({
  escalationCount = 0,
  unresolvedEscalations = 0,
}: {
  escalationCount?: number;
  unresolvedEscalations?: number;
}) {
  return clampMetric((Math.max(0, escalationCount) * 0.1) + (Math.max(0, unresolvedEscalations) * 0.3), 0.2);
}

export function computeOperatorInterventionPressure(interventionCount = 0) {
  return clampMetric(Math.max(0, interventionCount) * 0.18, 0.1);
}

export function computeRecoverySuccessConfidence({
  successfulRecoveries = 0,
  failedRecoveries = 0,
  repeatedFailures = 0,
}: {
  successfulRecoveries?: number;
  failedRecoveries?: number;
  repeatedFailures?: number;
}) {
  const base = ratio(successfulRecoveries, successfulRecoveries + failedRecoveries + repeatedFailures, 0.45);
  return clampMetric(base - (Math.max(0, repeatedFailures) * 0.08), 0.35);
}
