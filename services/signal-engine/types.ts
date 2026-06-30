export type SignalInputEventType =
  | "market_movement_event"
  | "spread_movement_event"
  | "totals_movement_event"
  | "moneyline_movement_event"
  | "odds_shift_event";

export type SignalType =
  | "STEAM_MOVEMENT"
  | "REVERSE_LINE_MOVEMENT"
  | "CONSENSUS_DIVERGENCE"
  | "VOLATILITY_SPIKE"
  | "IMPLIED_PROBABILITY_SHIFT"
  | "UNCLASSIFIED";

export type SignalRejectionCode =
  | "EVENT_NOT_VERIFIED"
  | "MISSING_REQUIRED_FIELD"
  | "MISSING_EVIDENCE"
  | "UNKNOWN_SIGNAL_TYPE"
  | "SIGNAL_TYPE_DISABLED"
  | "RECOMMENDATION_LANGUAGE_BLOCKED"
  | "REPLAY_REFERENCE_MISSING";

export type VerificationStatus = "VERIFIED" | "LIMITED" | "UNVERIFIED";

export type RiskStatus = "INFORMATIONAL_ONLY";

export interface ConfidenceScore {
  value: number;
  tier: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  scoring_version: string;
}

export interface EvidenceChain {
  evidence_chain_id: string;
  market_id: string;
  source_ids: string[];
  observations_used: string[];
  movement_events_used: string[];
  required_evidence_present: boolean;
  evidence_summary: string;
  previous_values?: SteamValueObservation[];
  new_values?: SteamValueObservation[];
  source_count?: number;
  movement_direction?: SteamMovementDirection;
  movement_size?: number;
  time_window?: SteamTimeWindow;
  timestamps?: string[];
  movement_speed?: MovementSpeedSummary;
  source_alignment?: SourceAlignmentSummary | ConsensusDivergenceEvidence["source_alignment"];
  public_side?: string;
  public_percentage?: number;
  opposing_side?: string;
  market_side_strengthened?: string;
  previous_line?: number | string;
  new_line?: number | string;
  timestamp?: string;
  public_consensus_reference?: ReverseLineMovementEvidence["public_consensus_reference"];
  comparison_result?: ReverseLineMovementEvidence["comparison_result"];
  source_values?: ConsensusDivergenceEvidence["source_values"];
  highest_value?: number | string;
  lowest_value?: number | string;
  divergence_size?: number;
  market_type?: SourceMarketValueSnapshot["market_type"];
  divergence_state?: ConsensusDivergenceEvidence["divergence_state"];
  freshness_summary?: ConsensusDivergenceEvidence["freshness_summary"];
  movement_count?: number;
  movement_sequence?: VolatilitySpikeEvidence["movement_sequence"];
  largest_change?: VolatilitySpikeEvidence["largest_change"];
  direction_changes?: number;
  volatility_state?: VolatilitySpikeEvidence["volatility_state"];
  frequency_metrics?: VolatilitySpikeEvidence["frequency_metrics"];
  created_at: string;
}

export interface SteamReplayInput {
  movement_events: string[];
  source_values: {
    previous_values: SteamValueObservation[];
    new_values: SteamValueObservation[];
  };
  timestamps: string[];
  thresholds: SteamMovementThresholds;
  classifier_version: string;
  schema_version: string;
}

export interface ReplayReference {
  input_event_id: string;
  validation_record_id: string;
  registry_version: string;
  engine_version: string;
  schema_version: string;
  replay_input?: SteamReplayInput | ReverseLineReplayInput | ConsensusDivergenceReplayInput | VolatilitySpikeReplayInput;
}

export interface MarketSignal {
  signal_id: string;
  signal_type: SignalType;
  market_id: string;
  event_id: string;
  source_ids: string[];
  confidence_score: ConfidenceScore;
  evidence_chain: EvidenceChain;
  explanation: string;
  risk_status: RiskStatus;
  timestamp: string;
  replay_reference: ReplayReference;
  recommendation_generated: false;
}

export interface VerifiedMovementEvent {
  event_id: string;
  event_type: SignalInputEventType;
  market_id: string;
  source_ids: string[];
  timestamp: string;
  verification_status: VerificationStatus;
  validation_record_id: string;
  schema_version: string;
  evidence: {
    observations_used: string[];
    movement_events_used: string[];
    evidence_summary: string;
    required_evidence_present: boolean;
  };
  payload: Record<string, unknown>;
}

export interface SignalRegistryEntry {
  signalType: SignalType;
  enabled: boolean;
  requiredEvidence: string[];
  recommendationAllowed: false;
}

export interface SignalRegistry {
  registryVersion: string;
  entries: Record<SignalType, SignalRegistryEntry>;
}

export type SignalClassifierResult =
  | {
      status: "SIGNAL";
      signalType: SignalType;
      reasons: string[];
    }
  | {
      status: "NO_SIGNAL";
      signalType: "UNCLASSIFIED";
      reasons: string[];
    };

export type SteamMovementDirection =
  | "UP"
  | "DOWN"
  | "TOWARD_FAVORITE"
  | "TOWARD_UNDERDOG"
  | "OVER"
  | "UNDER"
  | "SHORTENING"
  | "LENGTHENING"
  | "TOWARD_OVER"
  | "TOWARD_UNDER"
  | "PRICE_SHORTENING"
  | "PRICE_LENGTHENING";

export interface SteamValueObservation {
  source_id: string;
  value: number | string;
  timestamp: string;
}

export interface SteamTimeWindow {
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
}

export type MovementSpeedState = "SLOW" | "NORMAL" | "FAST" | "SPIKE";

export interface MovementSpeedSummary {
  total_movement_size: number;
  duration_seconds: number;
  movement_per_minute: number;
  speed_state: MovementSpeedState;
}

export interface SourceAlignment {
  source_id: string;
  previous_value: number | string;
  new_value: number | string;
  movement_direction: SteamMovementDirection;
  aligned: boolean;
  timestamp: string;
}

export interface SourceAlignmentSummary {
  aligned_source_count: number;
  total_source_count: number;
  alignment_ratio: number;
  majority_direction: SteamMovementDirection;
}

export interface SteamMovementEvidence {
  previous_values: SteamValueObservation[];
  new_values: SteamValueObservation[];
  source_count: number;
  movement_direction: SteamMovementDirection;
  movement_size: number;
  time_window: SteamTimeWindow;
  timestamps: string[];
  movement_speed: MovementSpeedSummary;
  source_alignment: SourceAlignmentSummary;
}

export interface SteamMovementThresholds {
  minimum_source_count: number;
  minimum_movement_size: number;
  maximum_time_window_seconds: number;
  minimum_alignment_ratio: number;
  fast_movement_per_minute: number;
}

export interface SteamConfidenceFactors {
  source_count: number;
  alignment_ratio: number;
  movement_size: number;
  movement_speed_state: MovementSpeedState;
  evidence_completeness: boolean;
}

export interface PublicConsensusSnapshot {
  consensus_id: string;
  market_id: string;
  public_side: string;
  public_percentage: number;
  opposing_side: string;
  opposing_percentage: number;
  consensus_type: "BET_PERCENTAGE" | "HANDLE_PERCENTAGE" | "TICKET_PERCENTAGE";
  source_id: string;
  captured_at: string;
  verification_status: "VERIFIED" | "LIMITED" | "INVALID";
  schema_version: string;
}

export interface ReverseLineMovementEvidence {
  public_side: string;
  public_percentage: number;
  opposing_side: string;
  movement_direction:
    | "TOWARD_FAVORITE"
    | "TOWARD_UNDERDOG"
    | "TOWARD_OVER"
    | "TOWARD_UNDER"
    | "PRICE_SHORTENING"
    | "PRICE_LENGTHENING";
  market_side_strengthened: string;
  previous_line: number | string;
  new_line: number | string;
  source_ids: string[];
  source_count: number;
  timestamp: string;
  public_consensus_reference: {
    source_id: string;
    captured_at: string;
    consensus_type: "BET_PERCENTAGE" | "HANDLE_PERCENTAGE" | "TICKET_PERCENTAGE";
  };
  comparison_result: {
    public_side_matches_market_strengthened_side: boolean;
    reverse_detected: boolean;
    divergence_size: number;
  };
}

export interface ReverseLineMovementThresholds {
  minimum_public_percentage: number;
  minimum_movement_size: number;
  maximum_consensus_age_seconds: number;
  require_verified_movement_event: boolean;
}

export interface ReverseLineConfidenceFactors {
  public_percentage: number;
  movement_size: number;
  source_count: number;
  consensus_age_seconds: number;
  consensus_verification_status: "VERIFIED" | "LIMITED";
  evidence_completeness: boolean;
}

export interface ReverseLineReplayInput {
  movement_event: string;
  public_consensus_snapshot: {
    consensus_id: string;
    source_id: string;
    captured_at: string;
    public_side: string;
    public_percentage: number;
    verification_status: "VERIFIED" | "LIMITED" | "INVALID";
  };
  thresholds: ReverseLineMovementThresholds;
  classifier_version: string;
  schema_version: string;
}

export interface MarketSideStrengthResult {
  market_side_strengthened: string;
  movement_direction: ReverseLineMovementEvidence["movement_direction"];
  explanation: string;
  movement_size: number;
  previous_line: number | string;
  new_line: number | string;
}

export interface SourceMarketValueSnapshot {
  snapshot_id: string;
  market_id: string;
  source_id: string;
  market_type: "SPREAD" | "TOTAL" | "MONEYLINE" | "PROP" | "UNKNOWN";
  value: number | string;
  timestamp: string;
  verification_status: "VERIFIED" | "LIMITED" | "INVALID";
  freshness_status: "CURRENT" | "STALE" | "UNKNOWN";
  schema_version: string;
}

export interface SourceSeparationEvidence {
  moving_source_id: string;
  stationary_source_ids: string[];
  previous_value: number | string;
  new_value: number | string;
  stationary_values: Array<{
    source_id: string;
    value: number | string;
    timestamp: string;
  }>;
  separation_size: number;
  timestamp: string;
}

export interface ConsensusDivergenceEvidence {
  source_values: Array<{
    source_id: string;
    value: number | string;
    market_type: "SPREAD" | "TOTAL" | "MONEYLINE" | "PROP" | "UNKNOWN";
    timestamp: string;
    status: "CURRENT" | "STALE" | "LIMITED" | "INVALID";
  }>;
  highest_value: number | string;
  lowest_value: number | string;
  divergence_size: number;
  source_count: number;
  market_type: "SPREAD" | "TOTAL" | "MONEYLINE" | "PROP" | "UNKNOWN";
  timestamp: string;
  divergence_state: "NONE" | "MINOR" | "MEANINGFUL" | "SEVERE";
  source_alignment: {
    aligned_source_count: number;
    divergent_source_count: number;
    divergence_ratio: number;
  };
  freshness_summary: {
    current_source_count: number;
    stale_source_count: number;
    limited_source_count: number;
  };
  source_separation?: SourceSeparationEvidence;
}

export interface ConsensusDivergenceThresholds {
  minimum_source_count: number;
  spread_divergence_threshold: number;
  total_divergence_threshold: number;
  moneyline_divergence_threshold: number;
  maximum_snapshot_age_seconds: number;
  severe_divergence_multiplier: number;
}

export interface ConsensusDivergenceConfidenceFactors {
  source_count: number;
  divergence_size: number;
  divergence_state: "NONE" | "MINOR" | "MEANINGFUL" | "SEVERE";
  current_source_count: number;
  stale_source_count: number;
  limited_source_count: number;
  evidence_completeness: boolean;
}

export interface ConsensusDivergenceReplayInput {
  source_value_snapshots: Array<{
    snapshot_id: string;
    source_id: string;
    value: number | string;
    market_type: SourceMarketValueSnapshot["market_type"];
    timestamp: string;
    verification_status: SourceMarketValueSnapshot["verification_status"];
    freshness_status: SourceMarketValueSnapshot["freshness_status"];
  }>;
  thresholds: ConsensusDivergenceThresholds;
  classifier_version: string;
  schema_version: string;
}

export interface MovementHistoryWindow {
  market_id: string;
  market_type: "SPREAD" | "TOTAL" | "MONEYLINE" | "PROP" | "UNKNOWN";
  events: Array<{
    event_id: string;
    source_id: string;
    previous_value: number | string;
    new_value: number | string;
    movement_size: number;
    movement_direction: string;
    timestamp: string;
    verification_status: "VERIFIED" | "LIMITED" | "INVALID";
  }>;
  window_start: string;
  window_end: string;
  schema_version: string;
}

export interface DirectionChangeResult {
  direction_changes: number;
  direction_sequence: string[];
  back_and_forth_detected: boolean;
}

export interface MovementFrequencyMetrics {
  movement_count: number;
  duration_seconds: number;
  movements_per_minute: number;
  average_seconds_between_movements: number;
  acceleration_detected: boolean;
}

export interface VolatilitySpikeEvidence {
  movement_count: number;
  movement_sequence: Array<{
    event_id: string;
    source_id: string;
    previous_value: number | string;
    new_value: number | string;
    movement_size: number;
    movement_direction: string;
    timestamp: string;
  }>;
  largest_change: {
    event_id: string;
    movement_size: number;
    previous_value: number | string;
    new_value: number | string;
    timestamp: string;
  };
  direction_changes: number;
  time_window: {
    start_timestamp: string;
    end_timestamp: string;
    duration_seconds: number;
  };
  source_ids: string[];
  source_count: number;
  timestamp: string;
  volatility_state: "NONE" | "ELEVATED" | "SPIKE" | "SEVERE_SPIKE";
  frequency_metrics: MovementFrequencyMetrics;
}

export interface VolatilitySpikeThresholds {
  minimum_movement_count: number;
  minimum_largest_change: number;
  maximum_time_window_seconds: number;
  minimum_direction_changes: number;
  minimum_movements_per_minute: number;
  severe_spike_multiplier: number;
}

export interface VolatilitySpikeConfidenceFactors {
  movement_count: number;
  largest_change: number;
  direction_changes: number;
  movements_per_minute: number;
  source_count: number;
  evidence_completeness: boolean;
}

export interface VolatilitySpikeReplayInput {
  movement_history_window: MovementHistoryWindow;
  thresholds: VolatilitySpikeThresholds;
  classifier_version: string;
  schema_version: string;
}

export type SteamSignalEvaluation =
  | {
      status: "SIGNAL";
      reasons: string[];
      evidence: SteamMovementEvidence;
      confidence_factors: SteamConfidenceFactors;
      replay_input: SteamReplayInput;
    }
  | {
      status: "NO_SIGNAL";
      reasons: string[];
    }
  | {
      status: "REJECTED";
      reasons: string[];
      rejection_code: Extract<SignalRejectionCode, "EVENT_NOT_VERIFIED" | "MISSING_EVIDENCE">;
    };

export type ReverseLineSignalEvaluation =
  | {
      status: "SIGNAL";
      reasons: string[];
      evidence: ReverseLineMovementEvidence;
      confidence_factors: ReverseLineConfidenceFactors;
      replay_input: ReverseLineReplayInput;
    }
  | {
      status: "NO_SIGNAL";
      reasons: string[];
    }
  | {
      status: "REJECTED";
      reasons: string[];
      rejection_code: Extract<SignalRejectionCode, "EVENT_NOT_VERIFIED" | "MISSING_EVIDENCE">;
    };

export type ConsensusDivergenceSignalEvaluation =
  | {
      status: "SIGNAL";
      reasons: string[];
      evidence: ConsensusDivergenceEvidence;
      confidence_factors: ConsensusDivergenceConfidenceFactors;
      replay_input: ConsensusDivergenceReplayInput;
    }
  | {
      status: "NO_SIGNAL";
      reasons: string[];
    }
  | {
      status: "REJECTED";
      reasons: string[];
      rejection_code: Extract<SignalRejectionCode, "EVENT_NOT_VERIFIED" | "MISSING_EVIDENCE">;
    };

export type VolatilitySpikeSignalEvaluation =
  | {
      status: "SIGNAL";
      reasons: string[];
      evidence: VolatilitySpikeEvidence;
      confidence_factors: VolatilitySpikeConfidenceFactors;
      replay_input: VolatilitySpikeReplayInput;
    }
  | {
      status: "NO_SIGNAL";
      reasons: string[];
    }
  | {
      status: "REJECTED";
      reasons: string[];
      rejection_code: Extract<SignalRejectionCode, "EVENT_NOT_VERIFIED" | "MISSING_EVIDENCE">;
    };

export type SignalEngineResult =
  | {
      status: "SIGNAL_CREATED";
      reason: string;
      signal: MarketSignal;
    }
  | {
      status: "NO_SIGNAL";
      reason: string;
    }
  | {
      status: "REJECTED";
      reason: string;
      rejection_code: SignalRejectionCode;
    };
