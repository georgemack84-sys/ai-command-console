export function severityForDivergence(category: string) {
  switch (category) {
    case "STATE_DIVERGENCE":
    case "OUTPUT_DIVERGENCE":
    case "GOVERNANCE_DIVERGENCE":
    case "RECOVERY_DIVERGENCE":
      return "CRITICAL";
    case "LEASE_DIVERGENCE":
    case "TIMELINE_DIVERGENCE":
      return "HIGH";
    default:
      return "MODERATE";
  }
}
