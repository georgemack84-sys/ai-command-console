import type { ChangeEvent } from "../ears/changeDetectionTypes";
import type { RiskTier } from "../risk/riskTypes";

export type SignalType =
  | "steam_movement"
  | "reverse_line_movement"
  | "consensus_divergence"
  | "volatility_spike"
  | "odds_compression"
  | "odds_expansion"
  | "implied_probability_shift"
  | "source_disagreement";

export interface EvidenceChain {
  evidence_id: string;
  events: ChangeEvent[];
  source_ids: string[];
  summary: string;
}

export interface IntelligenceSignal {
  signal_id: string;
  signal_type: SignalType;
  confidence_score: number;
  evidence_chain: EvidenceChain;
  market_id: string;
  source_ids: string[];
  risk_tier: RiskTier;
  explanation: string;
  timestamp: string;
  ownership_hash: string;
  replay_reference: string;
}
