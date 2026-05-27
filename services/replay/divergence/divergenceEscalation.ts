export function requiresDivergenceEscalation(category: string, severity: string) {
  return severity === "CRITICAL" || category === "GOVERNANCE_DIVERGENCE" || category === "RECOVERY_DIVERGENCE";
}
