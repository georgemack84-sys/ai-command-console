import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";
import type { ContinuousConstitutionalValidationRepository } from "@/types/continuous-constitutional-validation";
import type { RuntimeConstitutionalMonitoringRepository } from "@/types/runtime-constitutional-monitoring";
import type { ConstitutionalViolationDetectionRepository, ConstitutionalViolationScenario } from "@/types/constitutional-violation-detection";

export type ConstitutionalResilienceDomain = "AUTHORITY" | "GOVERNANCE" | "REPLAY" | "INTEGRITY" | "OPERATOR_CONTROL" | "POLICY" | "ISOLATION" | "LEARNING_SAFETY" | "OPTIMIZATION_SAFETY";
export type ConstitutionalHealthState = "FULLY_RESILIENT" | "RESILIENT" | "WATCH" | "DEGRADED" | "CRITICAL" | "NON_COMPLIANT";
export type ConstitutionalTrendDirection = "IMPROVING" | "STABLE" | "DEGRADING";
export type ConstitutionalRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "BLOCKING";
export type ConstitutionalResilienceScenario = "BASELINE" | ConstitutionalViolationScenario | "NONDETERMINISTIC_SCORING" | "WEIGHT_MUTATION" | "MISSING_CONSTITUTIONAL_REFERENCE" | "INCOMPLETE_GOVERNANCE_EVIDENCE" | "AUTHORITY_VALIDATION_UNAVAILABLE" | "OPERATOR_CONTROL_UNCONFIRMED" | "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE" | "ASSESSMENT_LINEAGE_BROKEN" | "HEALTH_CALCULATION_UNAVAILABLE";
export type ConstitutionalResilienceFailure = "NONDETERMINISTIC_SCORING_DETECTED" | "REPLAY_ASSESSMENT_MISMATCH_DETECTED" | "ASSESSMENT_WEIGHT_MUTATION_DETECTED" | "ASSESSMENT_EVIDENCE_INTEGRITY_FAILURE" | "CONSTITUTIONAL_REFERENCE_MISSING" | "GOVERNANCE_EVIDENCE_INCOMPLETE" | "AUTHORITY_VALIDATION_UNAVAILABLE" | "OPERATOR_CONTROL_UNCONFIRMED" | "TENANT_ISOLATION_EVIDENCE_UNAVAILABLE" | "ASSESSMENT_LINEAGE_BROKEN" | "CONSTITUTIONAL_HEALTH_CALCULATION_UNAVAILABLE";

export type ConstitutionalScoreComponent = Readonly<{
  domain: ConstitutionalResilienceDomain;
  score: number;
  weight: number;
  weighted_score: number;
  confidence: number;
  stability_index: number;
  trend_direction: ConstitutionalTrendDirection;
  risk_level: ConstitutionalRiskLevel;
  contributing_evidence: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalScoreExplanation = Readonly<{
  explanation_id: string;
  assessment_id: string;
  domain: ConstitutionalResilienceDomain;
  constitutional_rules_evaluated: readonly string[];
  governance_references: readonly string[];
  authority_references: readonly string[];
  replay_references: readonly string[];
  integrity_validation: "VERIFIED" | "FAILED";
  weighting_calculation: string;
  trend_justification: string;
  confidence_rationale: string;
  historical_comparison: string;
  deterministic: true;
  replayable: true;
  integrity_hash: string;
}>;

export type ConstitutionalAssessmentRecord = Readonly<{
  assessment_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  assessment_timestamp: "1970-01-01T00:00:00.000Z";
  authority_score: number;
  governance_score: number;
  replay_score: number;
  integrity_score: number;
  operator_control_score: number;
  policy_score: number;
  isolation_score: number;
  learning_safety_score: number;
  optimization_safety_score: number;
  overall_constitutional_score: number;
  health_state: ConstitutionalHealthState;
  confidence_level: number;
  trend_direction: ConstitutionalTrendDirection;
  risk_level: ConstitutionalRiskLevel;
  recommendations: readonly string[];
  lineage_reference: string;
  evidence_reference: string;
  replay_reference: string;
  fail_closed_required: boolean;
  observational_only: true;
  advisory_only: true;
  execution_modification_authorized: false;
  policy_modification_authorized: false;
  authority_grant_authorized: false;
  autonomous_remediation_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalResilienceTrend = Readonly<{
  trend_id: string;
  domain: ConstitutionalResilienceDomain | "OVERALL";
  current_score: number;
  prior_score: number;
  delta: number;
  trend_direction: ConstitutionalTrendDirection;
  certification_readiness: "READY" | "WATCH" | "REVIEW_REQUIRED" | "BLOCKED";
  weakening_detected: boolean;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalAssessmentLedgerRecord = Readonly<{
  assessment_record_id: string;
  assessment_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  overall_score: number;
  health_state: ConstitutionalHealthState;
  trend: ConstitutionalTrendDirection;
  confidence: number;
  risk: ConstitutionalRiskLevel;
  constitutional_reference: string;
  evidence_reference: string;
  lineage_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalResilienceAssessmentRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  validation_repository_id: string;
  runtime_monitoring_repository_id: string;
  violation_detection_repository_id: string;
  final_state: "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_COMPLETE" | "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_FAIL_CLOSED";
  weights: Readonly<Record<ConstitutionalResilienceDomain, number>>;
  scores: readonly ConstitutionalScoreComponent[];
  assessment: ConstitutionalAssessmentRecord;
  explanations: readonly ConstitutionalScoreExplanation[];
  trends: readonly ConstitutionalResilienceTrend[];
  ledger: readonly ConstitutionalAssessmentLedgerRecord[];
  failures: readonly ConstitutionalResilienceFailure[];
  observational_only: true;
  advisory_only: true;
  execution_modification_authorized: false;
  policy_modification_authorized: false;
  authority_grant_authorized: false;
  autonomous_remediation_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalResilienceAssessmentValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  deterministic_scoring: boolean;
  replay_identical: boolean;
  immutable_weights: boolean;
  evidence_complete: boolean;
  explanations_complete: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  health_calculated: boolean;
  observational_only: true;
  advisory_only: true;
  fail_closed_ready: boolean;
  no_execution_influence: boolean;
  failures: readonly ConstitutionalResilienceFailure[];
  validation_hash: string;
}>;

export type ConstitutionalResilienceAssessmentObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  overall_score: number;
  health_state: ConstitutionalHealthState;
  score_count: number;
  explanation_count: number;
  trend_count: number;
  ledger_count: number;
  failure_count: number;
  observational_only: true;
  advisory_only: true;
  execution_modification_authorized: false;
  autonomous_remediation_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalResilienceAssessmentInput = Readonly<{ scenario?: ConstitutionalResilienceScenario; baseline?: ConstitutionalBaselineContract; validationRepository?: ContinuousConstitutionalValidationRepository; runtimeRepository?: RuntimeConstitutionalMonitoringRepository; violationRepository?: ConstitutionalViolationDetectionRepository; repository?: ConstitutionalResilienceAssessmentRepository }>;

export type ConstitutionalResilienceAssessmentBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "constitutional-resilience-assessment/v8ALT.10.5";
    final_state: "CONSTITUTIONAL_RESILIENCE_ASSESSMENT_READY";
    score_domains: readonly ConstitutionalResilienceDomain[];
    principles: readonly string[];
  }>;
  repository: ConstitutionalResilienceAssessmentRepository;
  validation: ConstitutionalResilienceAssessmentValidationResult;
  observability: ConstitutionalResilienceAssessmentObservabilitySurface;
}>;
