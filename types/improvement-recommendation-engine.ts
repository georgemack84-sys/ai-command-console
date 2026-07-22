import type { AutonomyMaturityDomain, AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { ReadinessGapAnalysisRepository } from "@/types/readiness-gap-analysis-engine";

export type ImprovementRecommendationScenario = "BASELINE" | "NONDETERMINISTIC_RECOMMENDATIONS" | "NONDETERMINISTIC_PRIORITIES" | "INCOMPLETE_SUPPORTING_EVIDENCE" | "INCONSISTENT_IMPLEMENTATION_GUIDANCE" | "GOVERNANCE_VALIDATION_FAILURE" | "CONSTITUTIONAL_VALIDATION_FAILURE" | "REPLAY_RECONSTRUCTION_MISMATCH" | "INTEGRITY_VERIFICATION_FAILURE" | "HIDDEN_RECOMMENDATION_LOGIC" | "AUTOMATIC_IMPLEMENTATION_ATTEMPT" | "RUNTIME_BEHAVIOR_MODIFICATION" | "OPERATOR_APPROVAL_BYPASS" | "TENANT_ISOLATION_VIOLATION";
export type ImprovementRecommendationFailure = "RECOMMENDATIONS_NONDETERMINISTIC" | "RECOMMENDATION_PRIORITIES_NONDETERMINISTIC" | "SUPPORTING_EVIDENCE_INCOMPLETE" | "IMPLEMENTATION_GUIDANCE_INCONSISTENT" | "GOVERNANCE_VALIDATION_FAILED" | "CONSTITUTIONAL_VALIDATION_FAILED" | "REPLAY_RECONSTRUCTION_MISMATCHED" | "INTEGRITY_VERIFICATION_FAILED" | "HIDDEN_RECOMMENDATION_LOGIC_DETECTED" | "AUTOMATIC_IMPLEMENTATION_ATTEMPTED" | "RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED" | "OPERATOR_APPROVAL_BYPASSED" | "TENANT_ISOLATION_VIOLATED";
export type RecommendationCategory = "ARCHITECTURE" | "GOVERNANCE" | "REPLAY" | "EXPLAINABILITY" | "RESILIENCE" | "CERTIFICATION";
export type RecommendationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type RecommendationState = "IDENTIFIED" | "VALIDATED" | "PRIORITIZED" | "REVIEW_READY" | "OPERATOR_APPROVED" | "IMPLEMENTED_EXTERNALLY" | "VERIFIED" | "ARCHIVED";

export type RecommendationRule = Readonly<{
  rule_id: string;
  category: RecommendationCategory;
  rule_version: "recommendation-rules/v1";
  priority_model_version: "recommendation-priority/v1";
  approved: boolean;
  deterministic: boolean;
  template: string;
  integrity_hash: string;
}>;

export type RecommendationEvidenceChain = Readonly<{
  evidence_chain_id: string;
  originating_evidence: string;
  supporting_observations: readonly string[];
  impacted_domains: readonly (AutonomyMaturityDomain | "CROSS_DOMAIN")[];
  historical_references: readonly string[];
  readiness_references: readonly string[];
  governance_references: readonly string[];
  constitutional_references: readonly string[];
  replay_references: readonly string[];
  integrity_verified: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type RecommendationImplementationGuidance = Readonly<{
  guidance_id: string;
  objective: string;
  rationale: string;
  implementation_sequence: readonly string[];
  dependencies: readonly string[];
  governance_considerations: readonly string[];
  constitutional_considerations: readonly string[];
  replay_impact: string;
  rollback_strategy: string;
  validation_requirements: readonly string[];
  certification_implications: string;
  advisory_only: true;
  operator_approval_required: true;
  integrity_hash: string;
}>;

export type ImprovementRecommendationRecord = Readonly<{
  recommendation_id: string;
  assessment_id: string;
  recommendation_version: "improvement-recommendation-engine/v8ALT.11.7";
  category: RecommendationCategory;
  priority: RecommendationPriority;
  state: RecommendationState;
  maturity_level: AutonomyMaturityLevel;
  affected_domains: readonly (AutonomyMaturityDomain | "CROSS_DOMAIN")[];
  maturity_impact: number;
  readiness_impact: number;
  certification_impact: number;
  improvement_objective: string;
  evidence_chain: RecommendationEvidenceChain;
  implementation_guidance: RecommendationImplementationGuidance;
  governance_status: "PASS" | "FAIL";
  constitutional_status: "PASS" | "FAIL";
  replay_reference: string;
  lineage_reference: string;
  advisory_only: true;
  automatic_implementation_authorized: false;
  runtime_behavior_modification_authorized: false;
  operator_approval_bypassed: false;
  integrity_hash: string;
}>;

export type RecommendationLedgerEntry = Readonly<{
  ledger_id: string;
  recommendation_id: string;
  assessment_id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  maturity_level: AutonomyMaturityLevel;
  evidence_chain_id: string;
  guidance_id: string;
  governance_status: "PASS" | "FAIL";
  constitutional_status: "PASS" | "FAIL";
  replay_reference: string;
  lineage_reference: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type ImprovementRecommendationReport = Readonly<{
  report_id: string;
  recommendation_count: number;
  category_summary: readonly string[];
  priority_summary: readonly string[];
  evidence_summary: readonly string[];
  implementation_summary: readonly string[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type ImprovementRecommendationRepository = Readonly<{
  repository_id: string;
  final_state: "IMPROVEMENT_RECOMMENDATIONS_COMPLETE" | "IMPROVEMENT_RECOMMENDATIONS_FAILED";
  readiness: ReadinessGapAnalysisRepository;
  rules: readonly RecommendationRule[];
  recommendations: readonly ImprovementRecommendationRecord[];
  ledger: readonly RecommendationLedgerEntry[];
  report: ImprovementRecommendationReport;
  failures: readonly ImprovementRecommendationFailure[];
  advisory_only: true;
  automatic_implementation_authorized: false;
  runtime_behavior_modification_authorized: false;
  governance_policy_modification_authorized: false;
  constitutional_rule_modification_authorized: false;
  maturity_classification_modification_authorized: false;
  scoring_algorithm_modification_authorized: false;
  system_configuration_modification_authorized: false;
  implementation_approval_authorized: false;
  operator_authority_bypass_authorized: false;
  integrity_hash: string;
}>;

export type ImprovementRecommendationValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  recommendations_deterministic: boolean;
  priorities_deterministic: boolean;
  evidence_complete: boolean;
  guidance_consistent: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  replay_verified: boolean;
  integrity_verified: boolean;
  no_hidden_logic: boolean;
  no_automatic_implementation: boolean;
  runtime_behavior_preserved: boolean;
  operator_approval_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  failures: readonly ImprovementRecommendationFailure[];
  validation_hash: string;
}>;

export type ImprovementRecommendationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  recommendation_count: number;
  rule_count: number;
  ledger_count: number;
  failure_count: number;
  highest_priority: RecommendationPriority;
  advisory_only: true;
  automatic_implementation_authorized: false;
  runtime_behavior_modification_authorized: false;
  integrity_hash: string;
}>;

export type ImprovementRecommendationInput = Readonly<{ scenario?: ImprovementRecommendationScenario; repository?: ImprovementRecommendationRepository; readiness?: ReadinessGapAnalysisRepository }>;

export type ImprovementRecommendationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "improvement-recommendation-engine/v8ALT.11.7";
    final_state: "IMPROVEMENT_RECOMMENDATION_ENGINE_READY";
    principles: readonly string[];
  }>;
  repository: ImprovementRecommendationRepository;
  validation: ImprovementRecommendationValidationResult;
  observability: ImprovementRecommendationObservabilitySurface;
}>;
