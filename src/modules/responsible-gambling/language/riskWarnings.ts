export const DEFAULT_RISK_WARNING = "Risk status: informational only. No betting recommendation generated.";

export const EXPANDED_RISK_WARNING =
  "Market observations can change quickly and do not predict outcomes. Only risk money you can afford to lose.";

export function getRiskWarning(level: "default" | "expanded" = "default"): string {
  return level === "expanded" ? EXPANDED_RISK_WARNING : DEFAULT_RISK_WARNING;
}
