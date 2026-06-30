import type { EvidenceChain } from "../signals/signalTypes";
import type { RiskAnalysis, RiskFactor, RiskTier } from "./riskTypes";

export function analyzeSignalRisk(input: {
  evidenceChain: EvidenceChain;
  confidenceScore: number;
  now?: string;
}): RiskAnalysis {
  const factors: RiskFactor[] = [];

  if (input.evidenceChain.source_ids.length === 0) {
    factors.push("missing_source_attribution");
  }

  if (input.evidenceChain.events.length < 2) {
    factors.push("incomplete_market_history");
  }

  if (input.confidenceScore < 0.55) {
    factors.push("low_confidence");
  }

  if (input.evidenceChain.events.some((event) => event.velocity > 0.25)) {
    factors.push("suspicious_movement_speed");
  }

  if (input.evidenceChain.events.some((event) => event.change_percentage > 0.15)) {
    factors.push("abnormal_volatility");
  }

  const tier: RiskTier =
    factors.includes("missing_source_attribution") ? "LIMITED" :
    factors.length >= 3 ? "HIGH" :
    factors.length === 2 ? "ELEVATED" :
    factors.length === 1 ? "MODERATE" :
    "LOW";

  return { risk_tier: tier, factors };
}
