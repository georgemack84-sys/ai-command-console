import type { AutonomyMaturityContractRepository, AutonomyMaturityDomain } from "@/types/autonomy-maturity-assessment-contract";

export type MaturityDomainEvaluationScenario = "BASELINE" | "INCOMPLETE_EVIDENCE" | "INCONSISTENT_RULES" | "DETERMINISTIC_CALCULATION_FAILURE" | "REPLAY_RECONSTRUCTION_MISMATCH" | "GOVERNANCE_VALIDATION_FAILURE" | "CONSTITUTIONAL_VALIDATION_FAILURE" | "AUTHORITY_BYPASS" | "INTEGRITY_VERIFICATION_FAILURE" | "HIDDEN_EVALUATION_LOGIC" | "NONDETERMINISTIC_SCORING" | "TENANT_ISOLATION_VIOLATION" | "ADVISORY_ONLY_VIOLATION";
export type MaturityDomainEvaluationFailure = "DOMAIN_EVIDENCE_INCOMPLETE" | "EVALUATION_RULES_INCONSISTENT" | "DETERMINISTIC_CALCULATION_FAILED" | "REPLAY_RECONSTRUCTION_MISMATCHED" | "GOVERNANCE_VALIDATION_FAILED" | "CONSTITUTIONAL_VALIDATION_FAILED" | "AUTHORITY_ENFORCEMENT_BYPASSED" | "INTEGRITY_VERIFICATION_FAILED" | "HIDDEN_EVALUATION_LOGIC_DETECTED" | "NONDETERMINISTIC_SCORING_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "ADVISORY_ONLY_BEHAVIOR_COMPROMISED";
export type MaturityDomainState = "NOT_EVALUATED" | "INITIAL" | "EMERGING" | "DEVELOPING" | "MATURE" | "CERTIFIED" | "NON_COMPLIANT";
export type MaturityRiskIndicator = "LOW" | "MODERATE" | "HIGH" | "BLOCKING";
export type MaturityImprovementPriority = "OBSERVE" | "SCHEDULED" | "HIGH" | "IMMEDIATE";

export type MaturityDomainMetric = Readonly<{
  metric_id: string;
  domain: AutonomyMaturityDomain;
  metric_order: number;
  metric_name: string;
  metric_category: string;
  calculation_method: string;
  expected_evidence: readonly string[];
  scoring_rule: "WEIGHTED_DETERMINISTIC_RATIO";
  weighting_factor: number;
  replay_required: true;
  governance_required: true;
  constitutional_required: true;
  integrity_hash: string;
}>;

export type MaturityDomainEvidencePackage = Readonly<{
  evidence_id: string;
  domain: AutonomyMaturityDomain;
  tenant_id: string;
  runtime_evidence: string;
  governance_evidence: string;
  constitutional_evidence: string;
  replay_reference: string;
  lineage_reference: string;
  certification_evidence: string;
  explainability_artifact: string;
  monitoring_history: string;
  complete: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  replay_verified: boolean;
  authority_enforced: boolean;
  integrity_hash: string;
}>;

export type MaturityDomainReport = Readonly<{
  report_id: string;
  domain_id: string;
  domain: AutonomyMaturityDomain;
  maturity_state: MaturityDomainState;
  domain_score: number;
  confidence_score: number;
  readiness_score: number;
  risk_indicator: MaturityRiskIndicator;
  improvement_priority: MaturityImprovementPriority;
  metrics_evaluated: number;
  metrics_passed: number;
  metrics_failed: number;
  observations: readonly string[];
  evidence: MaturityDomainEvidencePackage;
  governance_assessment: "PASS" | "FAIL";
  constitutional_assessment: "PASS" | "FAIL";
  replay_assessment: "PASS" | "FAIL";
  recommendations: readonly string[];
  advisory_only: true;
  maturity_advancement_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type MaturityDomainAuditEntry = Readonly<{
  audit_id: string;
  evaluation_id: string;
  assessment_id: string;
  domain_id: string;
  domain: AutonomyMaturityDomain;
  evaluator_version: "maturity-domain-evaluation-engine/v8ALT.11.2";
  scoring_version: "domain-scoring/v1";
  evidence_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  replay_reference: string;
  lineage_reference: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  append_only: true;
  integrity_hash: string;
}>;

export type MaturityDomainEvaluationRepository = Readonly<{
  evaluation_id: string;
  final_state: "MATURITY_DOMAIN_EVALUATION_COMPLETE" | "MATURITY_DOMAIN_EVALUATION_FAILED";
  contract: AutonomyMaturityContractRepository;
  metrics: readonly MaturityDomainMetric[];
  reports: readonly MaturityDomainReport[];
  audit_log: readonly MaturityDomainAuditEntry[];
  failures: readonly MaturityDomainEvaluationFailure[];
  advisory_only: true;
  maturity_advancement_authorized: false;
  production_certification_authorized: false;
  governance_modification_authorized: false;
  authority_change_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type MaturityDomainEvaluationValidationResult = Readonly<{
  evaluation_id: string;
  valid: boolean;
  all_domains_evaluated: boolean;
  evidence_complete: boolean;
  rules_consistent: boolean;
  deterministic_calculations: boolean;
  replay_verified: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  authority_enforced: boolean;
  integrity_verified: boolean;
  no_hidden_logic: boolean;
  deterministic_scoring: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  no_execution_authority: boolean;
  failures: readonly MaturityDomainEvaluationFailure[];
  validation_hash: string;
}>;

export type MaturityDomainEvaluationObservabilitySurface = Readonly<{
  evaluation_id: string;
  final_state: string;
  domain_count: number;
  metric_count: number;
  report_count: number;
  audit_count: number;
  failure_count: number;
  minimum_domain_score: number;
  advisory_only: true;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type MaturityDomainEvaluationInput = Readonly<{ scenario?: MaturityDomainEvaluationScenario; repository?: MaturityDomainEvaluationRepository; contract?: AutonomyMaturityContractRepository }>;

export type MaturityDomainEvaluationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "maturity-domain-evaluation-engine/v8ALT.11.2";
    final_state: "MATURITY_DOMAIN_EVALUATION_ENGINE_READY";
    canonical_domain_count: 10;
    principles: readonly string[];
  }>;
  repository: MaturityDomainEvaluationRepository;
  validation: MaturityDomainEvaluationValidationResult;
  observability: MaturityDomainEvaluationObservabilitySurface;
}>;
