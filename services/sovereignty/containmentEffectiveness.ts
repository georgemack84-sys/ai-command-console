import { clampMetric } from "../stability/stabilityMetrics";

export function scoreContainmentEffectiveness(input: {
  activeContainment?: boolean;
  failedContainmentAttempts?: number;
  unresolvedInstability?: number;
  repeatedRecoveryLoops?: number;
  escalationSaturation?: number;
  containmentWeakness?: number;
}) {
  const failedContainmentAttempts = clampMetric(input.failedContainmentAttempts ?? 0, 0);
  const unresolvedInstability = clampMetric(input.unresolvedInstability ?? 0, 0);
  const repeatedRecoveryLoops = clampMetric(input.repeatedRecoveryLoops ?? 0, 0);
  const escalationSaturation = clampMetric(input.escalationSaturation ?? 0, 0);
  const containmentWeakness = clampMetric(input.containmentWeakness ?? 0, 0);

  const containmentEffectiveness = clampMetric(
    (input.activeContainment ? 0.65 : 0.5)
      - failedContainmentAttempts * 0.18
      - unresolvedInstability * 0.18
      - repeatedRecoveryLoops * 0.16
      - escalationSaturation * 0.12
      - containmentWeakness * 0.16,
    0.05,
  );

  return {
    containmentEffectiveness,
    weak: containmentEffectiveness < 0.5,
  };
}
