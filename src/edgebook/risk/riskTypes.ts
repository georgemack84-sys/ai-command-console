export type RiskTier = "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "LIMITED";

export type RiskFactor =
  | "stale_data"
  | "conflicting_sources"
  | "missing_source_attribution"
  | "abnormal_volatility"
  | "low_confidence"
  | "incomplete_market_history"
  | "suspicious_movement_speed";

export interface RiskAnalysis {
  risk_tier: RiskTier;
  factors: RiskFactor[];
}
