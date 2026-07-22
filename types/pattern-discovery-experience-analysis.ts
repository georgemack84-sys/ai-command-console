import type { MissionKnowledgeCapturePackage, MissionKnowledgeRecord } from "@/types/mission-knowledge-capture-engine";

export type OperationalPatternCategory = "PLANNING_PATTERN" | "EXECUTION_PATTERN" | "DELEGATION_PATTERN" | "COORDINATION_PATTERN" | "RECOVERY_PATTERN" | "CONFIDENCE_PATTERN" | "GOVERNANCE_PATTERN" | "MISSION_HEALTH_PATTERN" | "RISK_PATTERN" | "PERFORMANCE_PATTERN" | "OPERATOR_PATTERN" | "OPTIMIZATION_PATTERN";
export type PatternClassificationState = "CANDIDATE" | "OBSERVED" | "RECURRING" | "VALIDATED" | "CERTIFIED" | "SUPERSEDED" | "ARCHIVED" | "REJECTED";
export type PatternAnalysisScenario = "BASELINE" | "INVALID_CAPTURE_PACKAGE" | "INCOMPLETE_EVIDENCE" | "REPLAY_INCONSISTENCY" | "INTEGRITY_FAILURE" | "ORPHANED_LINEAGE" | "GOVERNANCE_VIOLATION" | "CONSTITUTIONAL_VIOLATION" | "UNSTABLE_ANALYTICAL_RESULT" | "NONDETERMINISTIC_DISCOVERY" | "DUPLICATE_CERTIFIED_PATTERN" | "CROSS_TENANT_CORRELATION_ATTEMPT" | "HISTORICAL_REWRITE_ATTEMPT" | "TEMPLATE_GENERATION_ATTEMPTED" | "RUNTIME_INFLUENCE_ATTEMPTED" | "PLANNING_MODIFICATION_ATTEMPTED";
export type PatternAnalysisFailure = "INVALID_CAPTURE_PACKAGE" | "INCOMPLETE_EVIDENCE_DETECTED" | "REPLAY_INCONSISTENCY_DETECTED" | "INTEGRITY_FAILURE_DETECTED" | "ORPHANED_LINEAGE_DETECTED" | "GOVERNANCE_VIOLATION_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "UNSTABLE_ANALYTICAL_RESULT_DETECTED" | "NONDETERMINISTIC_DISCOVERY_DETECTED" | "DUPLICATE_CERTIFIED_PATTERN_DETECTED" | "CROSS_TENANT_CORRELATION_DETECTED" | "HISTORICAL_REWRITE_DETECTED" | "TEMPLATE_GENERATION_ATTEMPTED" | "RUNTIME_INFLUENCE_ATTEMPTED" | "PLANNING_MODIFICATION_ATTEMPTED";

export type OperationalPatternRecord = Readonly<{
  pattern_id: string;
  pattern_name: string;
  pattern_version: string;
  pattern_category: OperationalPatternCategory;
  classification_state: PatternClassificationState;
  tenant_id: string;
  contributing_missions: readonly string[];
  contributing_executions: readonly string[];
  contributing_replays: readonly string[];
  contributing_knowledge_records: readonly string[];
  recurrence_frequency: number;
  occurrence_rate: number;
  stability_score: number;
  confidence_score: number;
  impact_level: "LOW" | "MODERATE" | "HIGH";
  evidence_chain: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  success_rate: number;
  failure_rate: number;
  recovery_rate: number;
  intervention_rate: number;
  replay_consistency: number;
  explainability: readonly string[];
  analysis_only: true;
  template_generation_authorized: boolean;
  runtime_influence_authorized: boolean;
  planning_modification_authorized: boolean;
  historical_truth_mutable: boolean;
  integrity_hash: string;
}>;

export type ExperienceCorrelationRecord = Readonly<{
  correlation_id: string;
  pattern_id: string;
  correlation_type: "PLANNING_EXECUTION" | "EXECUTION_RECOVERY" | "RECOVERY_OUTCOME" | "CONFIDENCE_OUTCOME" | "GOVERNANCE_SUCCESS" | "OPERATOR_RECOVERY" | "HEALTH_EXECUTION";
  source_record_ids: readonly string[];
  correlation_strength: number;
  deterministic_model_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type PatternTrendRecord = Readonly<{
  trend_id: string;
  pattern_id: string;
  trend_type: "SUCCESS" | "FAILURE" | "RECOVERY" | "CONFIDENCE" | "GOVERNANCE" | "MISSION_HEALTH" | "OPERATOR_INTERVENTION";
  stability_score: number;
  recurrence_count: number;
  trend_confidence: number;
  replay_consistency: number;
  integrity_hash: string;
}>;

export type PatternAnalysisAuditRecord = Readonly<{
  audit_id: string;
  pattern_id: string | null;
  rejection_reason: PatternAnalysisFailure;
  immutable: true;
  append_only: true;
  evidence_reference: string;
  integrity_hash: string;
}>;

export type PatternAnalysisRepository = Readonly<{
  repository_id: string;
  source_capture_id: string | null;
  final_state: "PATTERN_ANALYSIS_COMPLETE" | "PATTERN_ANALYSIS_REJECTED";
  patterns: readonly OperationalPatternRecord[];
  correlations: readonly ExperienceCorrelationRecord[];
  trends: readonly PatternTrendRecord[];
  audits: readonly PatternAnalysisAuditRecord[];
  failures: readonly PatternAnalysisFailure[];
  analysis_only: true;
  template_generation_authorized: false;
  runtime_influence_authorized: false;
  planning_modification_authorized: false;
  historical_truth_mutable: false;
  integrity_hash: string;
}>;

export type PatternAnalysisValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  capture_package_valid: boolean;
  evidence_complete: boolean;
  replay_consistent: boolean;
  integrity_verified: boolean;
  lineage_complete: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  stable_analysis: boolean;
  deterministic_discovery: boolean;
  duplicate_patterns_absent: boolean;
  tenant_isolated: boolean;
  historical_truth_preserved: boolean;
  analysis_only: true;
  template_generation_absent: boolean;
  runtime_influence_absent: boolean;
  planning_modification_absent: boolean;
  fail_closed: boolean;
  failures: readonly PatternAnalysisFailure[];
  validation_hash: string;
}>;

export type PatternAnalysisObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  pattern_count: number;
  correlation_count: number;
  trend_count: number;
  audit_count: number;
  failure_count: number;
  analysis_only: true;
  runtime_influence_authorized: false;
  integrity_hash: string;
}>;

export type PatternAnalysisInput = Readonly<{ scenario?: PatternAnalysisScenario; capture?: MissionKnowledgeCapturePackage; repository?: PatternAnalysisRepository }>;

export type PatternDiscoveryExperienceAnalysisBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "pattern-discovery-experience-analysis/v8ALT.9.3";
    final_state: "PATTERN_DISCOVERY_ANALYSIS_READY";
    classification_states: readonly PatternClassificationState[];
    principles: readonly string[];
  }>;
  repository: PatternAnalysisRepository;
  validation: PatternAnalysisValidationResult;
  observability: PatternAnalysisObservabilitySurface;
}>;
