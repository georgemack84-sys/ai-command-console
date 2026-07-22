import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { SubsystemHealthCollection } from "@/types/subsystem-health-collection-engine";

export type MissionHealthScoringState = "RECEIVED" | "INPUT_VALIDATION" | "WEIGHT_CALCULATION" | "CONFIDENCE_ADJUSTMENT" | "HEALTH_CONSISTENCY_ANALYSIS" | "READINESS_EVALUATION" | "STABILITY_ANALYSIS" | "FINAL_SCORING" | "VALIDATED" | "PUBLISHED" | "REJECTED";
export type MissionHealthScoreState = "OPTIMAL" | "HEALTHY" | "STABLE" | "WARNING" | "DEGRADED" | "HIGH_RISK" | "CRITICAL" | "FAILED";
export type HealthConsistency = "CONSISTENT" | "MOSTLY_CONSISTENT" | "PARTIALLY_CONSISTENT" | "INCONSISTENT";
export type OperationalReadiness = "FULLY_READY" | "READY" | "LIMITED" | "DEGRADED" | "NOT_READY";
export type StabilityIndex = "VERY_STABLE" | "STABLE" | "MODERATELY_STABLE" | "UNSTABLE" | "HIGHLY_UNSTABLE";
export type DegradationSeverity = "NONE" | "MINOR" | "MODERATE" | "MAJOR" | "SEVERE" | "CRITICAL";

export type MissionHealthScoringScenario =
  | "BASELINE"
  | "MISSING_SUBSYSTEM"
  | "DUPLICATE_SUBSYSTEM"
  | "INVALID_WEIGHT"
  | "INVALID_CONFIDENCE"
  | "MISSING_EVIDENCE"
  | "REPLAY_MISMATCH"
  | "BROKEN_LINEAGE"
  | "INTEGRITY_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "TENANT_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION";

export type MissionHealthScoringFailure =
  | "SCORING_CONTRACT_INVALID"
  | "SCORING_INPUT_INVALID"
  | "SUBSYSTEM_COMPLETENESS_INVALID"
  | "CERTIFIED_SUBSYSTEM_IDENTITY_INVALID"
  | "WEIGHTING_INTEGRITY_INVALID"
  | "CONFIDENCE_INVALID"
  | "NORMALIZATION_INTEGRITY_INVALID"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_INVALID"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "ADVISORY_ONLY_VIOLATION";

export type WeightingProfile = Readonly<{
  profile_id: string;
  contract_version: "mission-health-scoring-engine/v8ALT.4.3";
  weights: Readonly<Record<MissionSubsystemId, number>>;
  total_weight: number;
  immutable: true;
  governance_approved: true;
  profile_hash: string;
}>;

export type OverallConfidence = Readonly<{
  overall_confidence: number;
  confidence_score: number;
  confidence_distribution: readonly number[];
  confidence_variance: number;
  confidence_consistency: number;
  evidence_quality: number;
  confidence_hash: string;
}>;

export type MissionHealthScoringEvidence = Readonly<{
  evidence_id: string;
  mission_health_score_id: string;
  subsystem: MissionSubsystemId;
  metric: string;
  weight: number;
  health_score: number;
  confidence: number;
  contribution: number;
  timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type MissionHealthScore = Readonly<{
  mission_health_score_id: string;
  mission_id: string;
  tenant_id: string;
  scoring_state: MissionHealthScoringState;
  overall_health_score: number;
  weighted_base_score: number;
  confidence_adjusted_score: number;
  overall_confidence: OverallConfidence;
  readiness_score: number;
  readiness: OperationalReadiness;
  stability_index: StabilityIndex;
  consistency_score: number;
  consistency: HealthConsistency;
  degradation_severity: DegradationSeverity;
  health_state: MissionHealthScoreState;
  subsystem_scores: readonly string[];
  weighting_profile: WeightingProfile;
  scoring_evidence: readonly MissionHealthScoringEvidence[];
  calculation_timestamp: string;
  evidence_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  contract_version: "mission-health-scoring-engine/v8ALT.4.3";
  source_collection: SubsystemHealthCollection;
  advisory_only: true;
  execution_initiated: boolean;
  recovery_authorized: boolean;
  subsystem_data_modified: boolean;
  governance_modified: boolean;
  constitutional_modified: boolean;
  operator_authority_overridden: boolean;
  score_hash: string;
}>;

export type MissionHealthScoringInput = Readonly<{
  scenario?: MissionHealthScoringScenario;
  tenant_id?: string;
  mission_id?: string;
  collection?: SubsystemHealthCollection;
}>;

export type MissionHealthScoringValidationResult = Readonly<{
  mission_health_score_id: string | null;
  valid: boolean;
  scoring_contract_valid: boolean;
  scoring_inputs_valid: boolean;
  subsystem_completeness_valid: boolean;
  certified_subsystem_identity_valid: boolean;
  weighting_integrity_valid: boolean;
  confidence_valid: boolean;
  normalization_integrity_valid: boolean;
  evidence_complete: boolean;
  replay_references_present: boolean;
  lineage_continuity_valid: boolean;
  integrity_hashes_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  tenant_isolated: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly MissionHealthScoringFailure[];
  validation_hash: string;
}>;

export type MissionHealthScoringReplayResult = Readonly<{
  replay_reference: string;
  mission_health_score_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type MissionHealthScoringObservabilitySurface = Readonly<{
  mission_health_score_id: string;
  mission_id: string;
  tenant_id: string;
  health_state: MissionHealthScoreState;
  overall_health_score: number;
  readiness: OperationalReadiness;
  stability_index: StabilityIndex;
  degradation_severity: DegradationSeverity;
  advisory_only: true;
  score_hash: string;
}>;

export type MissionHealthScoringEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "mission-health-scoring-engine/v8ALT.4.3";
    principles: readonly string[];
    scoring_states: readonly MissionHealthScoringState[];
    health_states: readonly MissionHealthScoreState[];
    consistency_levels: readonly HealthConsistency[];
    readiness_levels: readonly OperationalReadiness[];
    stability_levels: readonly StabilityIndex[];
    degradation_levels: readonly DegradationSeverity[];
    advisory_only: true;
  }>;
  score: MissionHealthScore;
  validation: MissionHealthScoringValidationResult;
  replay: MissionHealthScoringReplayResult;
  observability: MissionHealthScoringObservabilitySurface;
}>;
