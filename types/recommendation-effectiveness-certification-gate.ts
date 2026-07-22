import type { RecommendationPerformanceLedgerResult } from "@/types/recommendation-performance-ledger";

export type RecommendationEffectivenessCertificationResult = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RecommendationEffectivenessCertificationState = "CERTIFICATION_STARTED" | "ARCHITECTURE_VALIDATED" | "DETERMINISM_VALIDATED" | "REPLAY_VALIDATED" | "GOVERNANCE_VALIDATED" | "CONSTITUTION_VALIDATED" | "OPERATOR_VALIDATED" | "PRODUCTION_READY" | "CERTIFICATION_GRANTED" | "CERTIFICATION_FAILED";
export type RecommendationEffectivenessSubsystem =
  | "RECOMMENDATION_EFFECTIVENESS_CONTRACT"
  | "EXPECTED_VS_ACTUAL_COMPARATOR"
  | "RECOMMENDATION_QUALITY_SCORING"
  | "RECOMMENDATION_ACCEPTANCE_ANALYSIS"
  | "RECOMMENDATION_REJECTION_ANALYSIS"
  | "OVERRIDE_ANALYSIS_ENGINE"
  | "RECOMMENDATION_DIMENSION_EVALUATION"
  | "IMPROVEMENT_OPPORTUNITY_GENERATOR"
  | "RECOMMENDATION_PERFORMANCE_LEDGER";

export type RecommendationEffectivenessCertificationFailure =
  | "SUBSYSTEM_EXCLUDED"
  | "NONDETERMINISTIC_SCORING_DETECTED"
  | "REPLAY_MISMATCH_DETECTED"
  | "RECOMMENDATION_LINEAGE_INCOMPLETE"
  | "EVIDENCE_TRACEABILITY_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "OPERATOR_AUTHORITY_VIOLATED"
  | "ADVISORY_ONLY_BOUNDARY_VIOLATED"
  | "AUTOMATIC_LEARNING_DETECTED"
  | "AUTONOMOUS_OPTIMIZATION_DETECTED"
  | "HIDDEN_EVALUATION_LOGIC_DETECTED"
  | "HIDDEN_SCORING_HEURISTICS_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "LEDGER_MUTATION_DETECTED"
  | "CRYPTOGRAPHIC_INTEGRITY_FAILED"
  | "PRODUCTION_READINESS_INCOMPLETE";

export type RecommendationEffectivenessCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL_DOCUMENTATION_GAP"
  | "SUBSYSTEM_EXCLUDED"
  | "NONDETERMINISTIC_SCORING"
  | "REPLAY_MISMATCH"
  | "LINEAGE_BREAK"
  | "EVIDENCE_TRACEABILITY_GAP"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "OPERATOR_AUTHORITY_VIOLATION"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "AUTOMATIC_LEARNING"
  | "AUTONOMOUS_OPTIMIZATION"
  | "HIDDEN_EVALUATION_LOGIC"
  | "HIDDEN_SCORING_HEURISTICS"
  | "CROSS_TENANT"
  | "LEDGER_MUTATION"
  | "INTEGRITY_FAILURE"
  | "PRODUCTION_READINESS_GAP";

export type SubsystemCertificationResult = Readonly<{
  subsystem: RecommendationEffectivenessSubsystem;
  result: RecommendationEffectivenessCertificationResult;
  deterministic: boolean;
  replayable: boolean;
  governance_compliant: boolean;
  advisory_only: boolean;
  findings: readonly string[];
  integrity_hash: string;
}>;

export type CertificationDomainValidation = Readonly<{
  validation_id: string;
  passed: boolean;
  findings: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationEffectivenessCertification = Readonly<{
  certification_id: string;
  tenant_id: string;
  certification_timestamp: string;
  certification_result: RecommendationEffectivenessCertificationResult;
  certification_state: RecommendationEffectivenessCertificationState;
  subsystem_results: readonly SubsystemCertificationResult[];
  replay_validation: CertificationDomainValidation;
  governance_validation: CertificationDomainValidation;
  constitutional_validation: CertificationDomainValidation;
  operator_validation: CertificationDomainValidation;
  adaptive_boundary_validation: CertificationDomainValidation;
  production_readiness: CertificationDomainValidation;
  certification_findings: readonly string[];
  corrective_actions: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  lineage_refs: readonly string[];
  progression_to_phase_10_4_authorized: boolean;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  certification_id: string;
  performance_record_ref: string;
  subsystem_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  lineage_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessCertificationApiSurface = Readonly<{
  api_id: string;
  certify_architecture: "POST /recommendation-effectiveness-certification-gate/certify";
  certify_replay: "POST /recommendation-effectiveness-certification-gate/replay";
  certify_governance: "POST /recommendation-effectiveness-certification-gate/governance";
  certify_constitutional: "POST /recommendation-effectiveness-certification-gate/constitutional";
  certify_operator_authority: "POST /recommendation-effectiveness-certification-gate/operator";
  certify_production_readiness: "POST /recommendation-effectiveness-certification-gate/readiness";
  retrieve_contract: "GET /recommendation-effectiveness-certification-gate/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  autonomous_optimization_supported: false;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessCertificationInput = Readonly<{
  performance_ledger?: RecommendationPerformanceLedgerResult;
  scenario?: RecommendationEffectivenessCertificationScenario;
}>;

export type RecommendationEffectivenessCertificationGateResult = Readonly<{
  recommendation_effectiveness_certification_gate_version: "recommendation-effectiveness-certification-gate/v1";
  performance_ledger: RecommendationPerformanceLedgerResult;
  api_surface: RecommendationEffectivenessCertificationApiSurface;
  certification: RecommendationEffectivenessCertification;
  certification_ledger_entry: RecommendationEffectivenessCertificationLedgerEntry;
  failures: readonly RecommendationEffectivenessCertificationFailure[];
  deterministic: true;
  replayable: true;
  advisory_only: true;
  governance_controlled: true;
  constitutionally_constrained: true;
  operator_controlled: true;
  adaptive_learning: false;
  autonomous_optimization: false;
  modifies_recommendations: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessCertificationFoundation = Readonly<{
  recommendation_effectiveness_certification_gate_version: "recommendation-effectiveness-certification-gate/v1";
  certified_subsystems: readonly RecommendationEffectivenessSubsystem[];
  api_surface: RecommendationEffectivenessCertificationApiSurface;
  result: RecommendationEffectivenessCertificationGateResult;
}>;
