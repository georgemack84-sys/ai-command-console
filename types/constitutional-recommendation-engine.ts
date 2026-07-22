import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";
import type { RuntimeConstitutionalMonitoringRepository } from "@/types/runtime-constitutional-monitoring";
import type { ConstitutionalViolationDetectionRepository } from "@/types/constitutional-violation-detection";
import type { ConstitutionalResilienceAssessmentRepository, ConstitutionalResilienceScenario } from "@/types/constitutional-resilience-assessment";

export type ConstitutionalRecommendationType = "ADDITIONAL_MONITORING" | "ADDITIONAL_EVIDENCE" | "OPERATOR_REVIEW" | "POLICY_REVIEW" | "GOVERNANCE_REVIEW" | "REPLAY_VALIDATION" | "CONFIDENCE_RECALIBRATION" | "OPTIMIZATION_REVIEW" | "LEARNING_REVIEW";
export type ConstitutionalRecommendationPriority = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "MANDATORY_REVIEW";
export type ConstitutionalRecommendationStatus = "GENERATED" | "VALIDATED" | "PRESENTED" | "ACKNOWLEDGED" | "ACCEPTED" | "REJECTED" | "ARCHIVED" | "SUPPRESSED";
export type ConstitutionalRecommendationScenario = "BASELINE" | ConstitutionalRecommendationType | ConstitutionalResilienceScenario | "LOW_CONFIDENCE_RECOMMENDATION" | "NONDETERMINISTIC_RECOMMENDATION" | "INCOMPLETE_RECOMMENDATION_EVIDENCE" | "MISSING_RECOMMENDATION_GOVERNANCE" | "AUTHORITY_VALIDATION_FAILED" | "UNVERIFIABLE_REPLAY_REFERENCE" | "CONFIDENCE_CALCULATION_UNAVAILABLE" | "INCOMPLETE_RECOMMENDATION_EXPLAINABILITY" | "AUTONOMOUS_EXECUTION_IMPLIED" | "CONSTITUTIONAL_BEHAVIOR_MODIFICATION" | "RECOMMENDATION_LINEAGE_BROKEN" | "RECOMMENDATION_INTEGRITY_FAILURE" | "RECOMMENDATION_TENANT_ISOLATION_COMPROMISED";
export type ConstitutionalRecommendationFailure = "NONDETERMINISTIC_RECOMMENDATION_DETECTED" | "RECOMMENDATION_EVIDENCE_INCOMPLETE" | "RECOMMENDATION_GOVERNANCE_REFERENCE_MISSING" | "RECOMMENDATION_AUTHORITY_VALIDATION_FAILED" | "RECOMMENDATION_REPLAY_REFERENCE_UNVERIFIABLE" | "RECOMMENDATION_CONFIDENCE_UNAVAILABLE" | "RECOMMENDATION_EXPLAINABILITY_INCOMPLETE" | "RECOMMENDATION_AUTONOMOUS_EXECUTION_IMPLIED" | "RECOMMENDATION_CONSTITUTIONAL_BEHAVIOR_MODIFICATION" | "RECOMMENDATION_LINEAGE_BROKEN" | "RECOMMENDATION_INTEGRITY_FAILURE" | "RECOMMENDATION_TENANT_ISOLATION_COMPROMISED";

export type ConstitutionalRecommendationConfidence = Readonly<{
  confidence_id: string;
  recommendation_id: string;
  evidence_confidence: number;
  constitutional_confidence: number;
  governance_confidence: number;
  replay_confidence: number;
  historical_confidence: number;
  trend_confidence: number;
  overall_recommendation_confidence: number;
  threshold: 0.75;
  suppressed: boolean;
  integrity_hash: string;
}>;

export type ConstitutionalRecommendationRecord = Readonly<{
  recommendation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  recommendation_timestamp: "1970-01-01T00:00:00.000Z";
  recommendation_type: ConstitutionalRecommendationType;
  priority: ConstitutionalRecommendationPriority;
  recommendation_summary: string;
  constitutional_rationale: string;
  supporting_evidence: readonly string[];
  governance_reference: string;
  authority_reference: string;
  replay_reference: string;
  confidence_score: number;
  expected_benefit: string;
  operator_action_required: boolean;
  governance_action_required: boolean;
  status: ConstitutionalRecommendationStatus;
  lineage_reference: string;
  advisory_only: true;
  execution_authorized: false;
  policy_modification_authorized: false;
  constitutional_modification_authorized: false;
  authority_grant_authorized: false;
  governance_bypass_authorized: false;
  optimization_deployment_authorized: false;
  learning_activation_authorized: false;
  replay_mutation_authorized: false;
  confidence_algorithm_mutation_authorized: false;
  production_configuration_write_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalRecommendationExplanation = Readonly<{
  explanation_id: string;
  recommendation_id: string;
  constitutional_objective: string;
  reason_for_recommendation: string;
  supporting_evidence: readonly string[];
  affected_subsystem: string;
  constitutional_rules_referenced: readonly string[];
  governance_rationale: string;
  authority_rationale: string;
  replay_references: readonly string[];
  confidence_calculation: string;
  projected_constitutional_benefit: string;
  known_limitations: readonly string[];
  implementation_prerequisites: readonly string[];
  complete: boolean;
  deterministic: true;
  replayable: true;
  integrity_hash: string;
}>;

export type ConstitutionalRecommendationLedgerRecord = Readonly<{
  recommendation_record_id: string;
  recommendation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  priority: ConstitutionalRecommendationPriority;
  confidence: number;
  status: ConstitutionalRecommendationStatus;
  constitutional_reference: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  operator_response: "NONE" | "PENDING_REVIEW" | "ACKNOWLEDGED";
  governance_response: "NONE" | "PENDING_REVIEW" | "ACKNOWLEDGED";
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalRecommendationAuditRecord = Readonly<{
  audit_id: string;
  recommendation_id: string;
  reason: "BELOW_CONFIDENCE_THRESHOLD" | ConstitutionalRecommendationFailure;
  immutable: true;
  append_only: true;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalRecommendationRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  runtime_monitoring_repository_id: string;
  violation_detection_repository_id: string;
  resilience_assessment_repository_id: string;
  final_state: "CONSTITUTIONAL_RECOMMENDATION_ENGINE_COMPLETE" | "CONSTITUTIONAL_RECOMMENDATION_ENGINE_FAIL_CLOSED";
  confidence_threshold: 0.75;
  recommendations: readonly ConstitutionalRecommendationRecord[];
  suppressed_recommendations: readonly ConstitutionalRecommendationRecord[];
  confidence: readonly ConstitutionalRecommendationConfidence[];
  explanations: readonly ConstitutionalRecommendationExplanation[];
  ledger: readonly ConstitutionalRecommendationLedgerRecord[];
  audit_records: readonly ConstitutionalRecommendationAuditRecord[];
  failures: readonly ConstitutionalRecommendationFailure[];
  advisory_only: true;
  execution_authorized: false;
  policy_modification_authorized: false;
  constitutional_modification_authorized: false;
  authority_grant_authorized: false;
  governance_bypass_authorized: false;
  optimization_deployment_authorized: false;
  learning_activation_authorized: false;
  replay_mutation_authorized: false;
  confidence_algorithm_mutation_authorized: false;
  production_configuration_write_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalRecommendationValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  deterministic_recommendations: boolean;
  evidence_complete: boolean;
  governance_references_complete: boolean;
  authority_validated: boolean;
  replay_verified: boolean;
  confidence_calculated: boolean;
  explainability_complete: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  fail_closed_ready: boolean;
  no_autonomous_execution: boolean;
  no_constitutional_mutation: boolean;
  failures: readonly ConstitutionalRecommendationFailure[];
  validation_hash: string;
}>;

export type ConstitutionalRecommendationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  recommendation_count: number;
  suppressed_count: number;
  confidence_count: number;
  explanation_count: number;
  ledger_count: number;
  audit_count: number;
  failure_count: number;
  advisory_only: true;
  execution_authorized: false;
  constitutional_modification_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalRecommendationInput = Readonly<{ scenario?: ConstitutionalRecommendationScenario; baseline?: ConstitutionalBaselineContract; runtimeRepository?: RuntimeConstitutionalMonitoringRepository; violationRepository?: ConstitutionalViolationDetectionRepository; resilienceRepository?: ConstitutionalResilienceAssessmentRepository; repository?: ConstitutionalRecommendationRepository }>;

export type ConstitutionalRecommendationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "constitutional-recommendation-engine/v8ALT.10.6";
    final_state: "CONSTITUTIONAL_RECOMMENDATION_ENGINE_READY";
    recommendation_domains: readonly ConstitutionalRecommendationType[];
    principles: readonly string[];
  }>;
  repository: ConstitutionalRecommendationRepository;
  validation: ConstitutionalRecommendationValidationResult;
  observability: ConstitutionalRecommendationObservabilitySurface;
}>;
