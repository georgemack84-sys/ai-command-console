import type { FailureObservationLedger, ObservationCategory } from "@/types/failure-observation-monitoring";

export type RecoveryState = "NOT_REQUIRED" | "READY" | "IN_PROGRESS" | "PARTIALLY_RECOVERED" | "RECOVERED" | "FAILED" | "UNRECOVERABLE";
export type RecoveryStrategyType = "Continue Execution" | "Retry Operation" | "Restart Component" | "Rollback Execution" | "Checkpoint Restore" | "Dependency Replacement" | "Manual Intervention" | "Mission Pause" | "Mission Escalation" | "Graceful Shutdown";
export type WeakPointClassification = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CERTIFICATION_BLOCKER";
export type StressLevel = "RESILIENT" | "STRONG" | "STABLE" | "DEGRADED" | "CRITICAL";
export type RecommendationCategory = "Recovery" | "Infrastructure" | "Governance" | "Authority" | "Replay" | "Integrity" | "Mission Health" | "Runtime Assurance" | "Delegation" | "Planning" | "Orchestration" | "Architecture";
export type RecommendationPriority = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "CERTIFICATION_REQUIRED";
export type ReadinessState = "READY" | "READY_WITH_IMPROVEMENTS" | "LIMITED_DEPLOYMENT" | "CERTIFICATION_BLOCKED" | "NOT_READY";
export type RecoveryWeakPointScenario = "BASELINE" | "MISSING_OBSERVATION_LEDGER" | "INCOMPLETE_RECOVERY_METRICS" | "MISSING_RECOVERY_STRATEGY" | "MISSING_WEAK_POINT_ANALYSIS" | "NONREPRODUCIBLE_STRESS_SCORE" | "MISSING_GOVERNANCE_VALIDATION" | "MISSING_CONSTITUTIONAL_VALIDATION" | "MISSING_AUTHORITY_VALIDATION" | "MISSING_REPLAY_REFERENCE" | "MISSING_EVIDENCE_LINEAGE" | "CROSS_TENANT_INTELLIGENCE" | "RECOMMENDATION_NOT_OPERATOR_VISIBLE" | "NON_ADVISORY_RECOVERY_ACTION" | "INTEGRITY_HASH_FAILURE";
export type RecoveryWeakPointFailure = "OBSERVATION_LEDGER_MISSING" | "RECOVERY_METRICS_INCOMPLETE" | "RECOVERY_STRATEGY_MISSING" | "WEAK_POINT_ANALYSIS_MISSING" | "STRESS_SCORE_NONREPRODUCIBLE" | "GOVERNANCE_VALIDATION_MISSING" | "CONSTITUTIONAL_VALIDATION_MISSING" | "AUTHORITY_VALIDATION_MISSING" | "REPLAY_REFERENCE_MISSING" | "EVIDENCE_LINEAGE_MISSING" | "CROSS_TENANT_INTELLIGENCE_DETECTED" | "RECOMMENDATION_OPERATOR_VISIBILITY_MISSING" | "NON_ADVISORY_RECOVERY_ACTION_ATTEMPTED" | "INTEGRITY_HASH_INVALID";

export type RecoveryAnalysis = Readonly<{
  recovery_state: RecoveryState;
  recovery_speed: number;
  recovery_accuracy: number;
  recovery_success_rate: number;
  rollback_readiness: number;
  restart_readiness: number;
  operator_intervention_latency: string;
  recovery_reproducibility: number;
  recovery_confidence: number;
  mission_restoration: number;
  replay_restoration: number;
  integrity_restoration: number;
  governance_preservation: number;
  authority_preservation: number;
  tenant_preservation: number;
  analysis_hash: string;
}>;

export type RecoveryStrategy = Readonly<{
  strategy_id: string;
  strategy_type: RecoveryStrategyType;
  affected_component: string;
  rationale: string;
  governance_validation: "VALIDATED" | "MISSING";
  constitutional_validation: "VALIDATED" | "MISSING";
  authority_validation: "VALIDATED" | "MISSING";
  replay_reference: string;
  lineage_reference: string;
  advisory_only: true;
  action_executed: boolean;
  strategy_hash: string;
}>;

export type WeakPoint = Readonly<{
  weak_point_id: string;
  affected_component: string;
  classification: WeakPointClassification;
  evidence_chain: readonly string[];
  supporting_observations: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  weak_point_hash: string;
}>;

export type StressScores = Readonly<{
  overall_stress_score: number;
  stress_level: StressLevel;
  component_scores: Readonly<Record<ObservationCategory | "TENANT_ISOLATION", number>>;
  recovery_score: number;
  resilience_score: number;
  score_hash: string;
}>;

export type RecoveryRecommendation = Readonly<{
  recommendation_id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  affected_component: string;
  evidence_chain: readonly string[];
  supporting_failures: readonly string[];
  expected_improvement: string;
  governance_validation: "VALIDATED" | "MISSING";
  authority_validation: "VALIDATED" | "MISSING";
  operator_visible: boolean;
  advisory_only: true;
  action_executed: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type OperationalReadinessSummary = Readonly<{
  readiness_state: ReadinessState;
  stress_resilience: number;
  recovery_readiness: number;
  mission_continuity: number;
  governance_preservation: boolean;
  authority_preservation: boolean;
  replay_integrity: boolean;
  integrity_preservation: boolean;
  operator_visibility: boolean;
  certification_readiness: boolean;
  readiness_hash: string;
}>;

export type RecoveryIntelligenceLedger = Readonly<{
  analysis_id: string;
  engine_version: "recovery-weak-point-intelligence/v8ALT.6.4";
  scenario_id: string;
  simulation_id: string;
  mission_id: string;
  tenant_id: string;
  source_observation_ledger: FailureObservationLedger | null;
  recovery_analysis: RecoveryAnalysis | null;
  recovery_strategies: readonly RecoveryStrategy[];
  identified_weak_points: readonly WeakPoint[];
  stress_scores: StressScores | null;
  recommended_actions: readonly RecoveryRecommendation[];
  resilience_report: readonly string[];
  architecture_improvement_report: readonly string[];
  operational_readiness: OperationalReadinessSummary | null;
  governance_validation: "VALIDATED" | "MISSING";
  constitutional_validation: "VALIDATED" | "MISSING";
  authority_validation: "VALIDATED" | "MISSING";
  replay_reference: string;
  lineage_reference: string;
  timestamp: string;
  advisory_only: true;
  action_executed: boolean;
  append_only: true;
  integrity_hash: string;
  ledger_hash: string;
}>;

export type RecoveryWeakPointInput = Readonly<{
  scenario?: RecoveryWeakPointScenario;
  tenant_id?: string;
  mission_id?: string;
  observation_ledger?: FailureObservationLedger;
}>;

export type RecoveryWeakPointValidationResult = Readonly<{
  analysis_id: string | null;
  valid: boolean;
  observation_ledger_present: boolean;
  recovery_metrics_complete: boolean;
  recovery_strategy_present: boolean;
  weak_point_analysis_present: boolean;
  stress_score_reproducible: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  evidence_lineage_complete: boolean;
  tenant_isolated: boolean;
  recommendations_operator_visible: boolean;
  advisory_only_enforced: boolean;
  integrity_valid: boolean;
  failures: readonly RecoveryWeakPointFailure[];
  validation_hash: string;
}>;

export type RecoveryWeakPointReplayResult = Readonly<{
  replay_reference: string;
  analysis_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type RecoveryWeakPointObservabilitySurface = Readonly<{
  analysis_id: string;
  tenant_id: string;
  mission_id: string;
  weak_point_count: number;
  recommendation_count: number;
  readiness_state: ReadinessState | "UNKNOWN";
  advisory_only: true;
  ledger_hash: string;
}>;

export type RecoveryWeakPointContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "recovery-weak-point-intelligence/v8ALT.6.4";
    principles: readonly string[];
    recovery_states: readonly RecoveryState[];
    weak_point_classifications: readonly WeakPointClassification[];
    readiness_states: readonly ReadinessState[];
    advisory_only: true;
  }>;
  ledger: RecoveryIntelligenceLedger;
  validation: RecoveryWeakPointValidationResult;
  replay: RecoveryWeakPointReplayResult;
  observability: RecoveryWeakPointObservabilitySurface;
}>;
