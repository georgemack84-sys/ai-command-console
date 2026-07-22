import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { HealthExplanation, HealthExplanationConfidenceState } from "@/types/health-explainability-engine";
import type { MissionTrendState } from "@/types/mission-trend-intelligence-engine";

export type MissionHealthRecommendationType = "NO_ACTION" | "MONITOR" | "OPERATOR_REVIEW" | "SUBSYSTEM_INSPECTION" | "GOVERNANCE_REVIEW" | "REPLAY_VALIDATION" | "INTEGRITY_VERIFICATION" | "EXECUTION_PAUSE_RECOMMENDATION" | "RECOVERY_RECOMMENDATION" | "PREDICTIVE_MONITORING" | "CERTIFICATION_REVIEW";
export type RecommendationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
export type RecommendationState = "GENERATED" | "VALIDATED" | "GOVERNANCE_APPROVED" | "OPERATOR_REVIEW" | "ACKNOWLEDGED" | "SUPERSEDED" | "ARCHIVED" | "REJECTED";
export type RecommendationSeverity = "INFO" | "NOTICE" | "WARNING" | "HIGH_RISK" | "CRITICAL";

export type MissionHealthRecommendationScenario =
  | "BASELINE"
  | "MISSING_HEALTH_EXPLANATION"
  | "MISSING_EVIDENCE"
  | "UNSUPPORTED_RECOMMENDATION"
  | "GOVERNANCE_FAILURE"
  | "INSUFFICIENT_CONFIDENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "BROKEN_LINEAGE"
  | "INTEGRITY_FAILURE"
  | "TENANT_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "OPERATOR_APPROVAL_BYPASS_ATTEMPT"
  | "AUTONOMOUS_EXECUTION_ATTEMPT";

export type MissionHealthRecommendationFailure =
  | "RECOMMENDATION_CONTRACT_INVALID"
  | "HEALTH_EXPLANATION_MISSING"
  | "EVIDENCE_MISSING"
  | "UNSUPPORTED_RECOMMENDATION"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONFIDENCE_INSUFFICIENT"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "AUTHORITY_INVALID"
  | "OPERATOR_APPROVAL_REQUIRED"
  | "OPERATOR_APPROVAL_BYPASSED"
  | "ADVISORY_ONLY_VIOLATION";

export type RecommendationEvidence = Readonly<{
  evidence_id: string;
  recommendation_id: string;
  mission_health_reference: string;
  health_explanation_reference: string;
  subsystem_reference: MissionSubsystemId | "mission";
  trend_reference: MissionTrendState;
  confidence_reference: HealthExplanationConfidenceState;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type GovernanceValidation = Readonly<{
  governance_validated: boolean;
  constitutional_compliance: boolean;
  authority_boundary_valid: boolean;
  operator_approval_required: true;
  operator_approval_bypassed: boolean;
  execution_authority_granted: false;
  recovery_authority_granted: false;
  validation_hash: string;
}>;

export type MissionHealthRecommendation = Readonly<{
  recommendation_id: string;
  mission_id: string;
  tenant_id: string;
  mission_health_score_id: string;
  recommendation_type: MissionHealthRecommendationType;
  priority: RecommendationPriority;
  severity: RecommendationSeverity;
  recommendation_state: RecommendationState;
  confidence: HealthExplanationConfidenceState;
  confidence_score: number;
  risk_score: number;
  recommended_action: string;
  justification: string;
  affected_subsystems: readonly MissionSubsystemId[];
  supporting_evidence: readonly RecommendationEvidence[];
  health_score: number;
  readiness_score: number;
  stability_index: string;
  trend_state: MissionTrendState;
  predicted_outcome: string;
  operator_required: true;
  governance_validation: GovernanceValidation;
  alternatives_considered: readonly MissionHealthRecommendationType[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
  contract_version: "mission-health-recommendation-engine/v8ALT.4.7";
  advisory_only: true;
  action_executed: boolean;
  execution_controlled: boolean;
  autonomous_intervention_performed: boolean;
  governance_modified: boolean;
  authority_escalated: boolean;
  constitutional_rules_changed: boolean;
  subsystem_state_altered: boolean;
  recommendation_hash: string;
}>;

export type MissionHealthRecommendationSet = Readonly<{
  recommendation_set_id: string;
  mission_id: string;
  tenant_id: string;
  recommendations: readonly MissionHealthRecommendation[];
  source_explanation: HealthExplanation | null;
  operator_advisory_report: string;
  set_state: RecommendationState;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  contract_version: "mission-health-recommendation-engine/v8ALT.4.7";
  recommendation_set_hash: string;
}>;

export type MissionHealthRecommendationInput = Readonly<{
  scenario?: MissionHealthRecommendationScenario;
  explanation?: HealthExplanation;
  mission_id?: string;
  tenant_id?: string;
}>;

export type MissionHealthRecommendationValidationResult = Readonly<{
  recommendation_set_id: string | null;
  valid: boolean;
  recommendation_contract_valid: boolean;
  health_explanation_exists: boolean;
  evidence_complete: boolean;
  recommendation_supported: boolean;
  governance_validation_valid: boolean;
  confidence_sufficient: boolean;
  replay_references_present: boolean;
  lineage_continuity_valid: boolean;
  integrity_hashes_valid: boolean;
  tenant_isolated: boolean;
  authority_valid: boolean;
  operator_approval_required: boolean;
  operator_approval_not_bypassed: boolean;
  advisory_only_behavior_enforced: boolean;
  failures: readonly MissionHealthRecommendationFailure[];
  validation_hash: string;
}>;

export type MissionHealthRecommendationReplayResult = Readonly<{
  replay_reference: string;
  recommendation_set_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type MissionHealthRecommendationObservabilitySurface = Readonly<{
  recommendation_set_id: string;
  mission_id: string;
  tenant_id: string;
  recommendation_count: number;
  highest_priority: RecommendationPriority;
  operator_required: true;
  advisory_only: true;
  recommendation_set_hash: string;
}>;

export type MissionHealthRecommendationEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "mission-health-recommendation-engine/v8ALT.4.7";
    principles: readonly string[];
    recommendation_types: readonly MissionHealthRecommendationType[];
    priorities: readonly RecommendationPriority[];
    states: readonly RecommendationState[];
    severities: readonly RecommendationSeverity[];
    advisory_only: true;
  }>;
  recommendation_set: MissionHealthRecommendationSet;
  validation: MissionHealthRecommendationValidationResult;
  replay: MissionHealthRecommendationReplayResult;
  observability: MissionHealthRecommendationObservabilitySurface;
}>;
