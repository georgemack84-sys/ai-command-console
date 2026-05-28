export function evaluateRecoveryReplayEscalation(divergences: Array<{ category: string; severity: string; requiresEscalation: boolean }> = []) {
  const requiresQuarantine = divergences.some((divergence) => divergence.severity === "CRITICAL");
  return {
    requiresEscalation: divergences.some((divergence) => divergence.requiresEscalation),
    requiresQuarantine,
  };
}
