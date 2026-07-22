import type { OptimizationOpportunityRegistry } from "@/types/optimization-opportunity-discovery";
import type { OptimizationImpactAnalysisLedger } from "@/types/optimization-impact-analysis";
import type { DeterministicOptimizationValidationLedger } from "@/types/deterministic-optimization-validation";
import type { OptimizationRecommendationLedger } from "@/types/optimization-recommendation-engine";

export type ContinuousOptimizationCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ContinuousOptimizationUpstreamPhaseId = "OPTIMIZATION_DISCOVERY" | "OPTIMIZATION_IMPACT_ANALYSIS" | "DETERMINISTIC_OPTIMIZATION_VALIDATION" | "OPTIMIZATION_RECOMMENDATION_ENGINE";
export type ContinuousOptimizationUpstreamState = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "MISSING" | "UNKNOWN";
export type ContinuousOptimizationCertificationScenario = "BASELINE" | "DISCOVERY_INVALID" | "IMPACT_ANALYSIS_INVALID" | "DETERMINISTIC_VALIDATION_INVALID" | "RECOMMENDATIONS_INVALID" | "HIDDEN_OPTIMIZATION" | "AUTOMATIC_DEPLOYMENT_DETECTED" | "MISSION_OUTCOME_ALTERED" | "REPLAY_MISMATCH" | "NONDETERMINISTIC_RECOMMENDATION" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_VIOLATION" | "AUTHORITY_ESCALATION" | "CROSS_TENANT_OPTIMIZATION" | "INCOMPLETE_OPERATOR_VISIBILITY" | "MISSING_EXPLAINABILITY" | "MISSING_ROLLBACK_STRATEGY" | "RECOMMENDATION_EVIDENCE_INCOMPLETE" | "INTEGRITY_HASH_MISMATCH" | "DOCUMENTATION_GAP";
export type ContinuousOptimizationCertificationFailure = "DISCOVERY_CERTIFICATION_FAILED" | "IMPACT_ANALYSIS_CERTIFICATION_FAILED" | "DETERMINISTIC_VALIDATION_CERTIFICATION_FAILED" | "RECOMMENDATION_CERTIFICATION_FAILED" | "UPSTREAM_LEDGER_MISSING" | "UPSTREAM_LEDGER_UNKNOWN" | "UPSTREAM_INTEGRITY_UNVERIFIED" | "UPSTREAM_REPLAY_UNVERIFIED" | "UPSTREAM_GOVERNANCE_UNVERIFIED" | "UPSTREAM_CONDITIONAL_CERTIFICATION" | "HIDDEN_OPTIMIZATION_DETECTED" | "AUTOMATIC_DEPLOYMENT_DETECTED" | "MISSION_OUTCOME_ALTERED" | "REPLAY_MISMATCH_DETECTED" | "NONDETERMINISTIC_RECOMMENDATION_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "CONSTITUTIONAL_VIOLATION_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "CROSS_TENANT_OPTIMIZATION_DETECTED" | "OPERATOR_VISIBILITY_INCOMPLETE" | "EXPLAINABILITY_MISSING" | "ROLLBACK_STRATEGY_MISSING" | "RECOMMENDATION_EVIDENCE_INCOMPLETE" | "INTEGRITY_HASH_MISMATCH" | "DOCUMENTATION_GAP";

export type ContinuousOptimizationUpstreamLedgerState = Readonly<{
  ledger_id: string;
  phase_id: ContinuousOptimizationUpstreamPhaseId;
  state: ContinuousOptimizationUpstreamState;
  failures: readonly ContinuousOptimizationCertificationFailure[];
  integrity_verified: boolean;
  replay_verified: boolean;
  governance_verified: boolean;
  certified_at?: string;
}>;

export type ContinuousOptimizationCertificationOptions = Readonly<{
  revalidate_upstream?: boolean;
  diagnostic_mode?: boolean;
  allow_conditional_upstream?: boolean;
}>;

export type OptimizationCertificationRecord = Readonly<{
  certification_id: string;
  certification_version: "continuous-optimization-certification-gate/v8ALT.8.5";
  optimization_phase: "Phase 8ALT.8";
  certification_status: ContinuousOptimizationCertificationStatus;
  certification_timestamp: string;
  certifying_engine: "continuous-optimization-certification-gate";
  deployment_authorized: false;
  optimization_execution_authorized: false;
  operator_approval_required: true;
  completion_gate_ready: boolean;
  integrity_hash: string;
}>;

export type CertificationTestRecord = Readonly<{
  test_id: string;
  certification_id: string;
  test_name: string;
  expected_result: "PASS" | "FAIL";
  actual_result: "PASS" | "FAIL";
  evidence_reference: string;
  replay_reference: string;
  timestamp: string;
}>;

export type CertificationEvidenceRecord = Readonly<{
  evidence_id: string;
  certification_id: string;
  subsystem: string;
  validation_type: string;
  supporting_evidence: string;
  governance_reference: string;
  constitutional_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type CertificationDecisionRecord = Readonly<{
  decision_id: string;
  certification_id: string;
  decision_state: ContinuousOptimizationCertificationStatus;
  decision_reason: string;
  failed_tests: readonly string[];
  recommendations: readonly string[];
  operator_review_required: true;
  deployment_authorized: false;
  optimization_execution_authorized: false;
  completion_gate_ready: boolean;
  timestamp: string;
  integrity_hash: string;
}>;

export type ContinuousOptimizationCertificationLedger = Readonly<{
  ledger_id: string;
  final_state: "CONTINUOUS_OPTIMIZATION_CERTIFIED_FOR_COMPLETION_GATE" | "CONTINUOUS_OPTIMIZATION_CERTIFICATION_BLOCKED";
  source_discovery_registry_id: string | null;
  source_impact_ledger_id: string | null;
  source_validation_ledger_id: string | null;
  source_recommendation_ledger_id: string | null;
  certification: OptimizationCertificationRecord;
  tests: readonly CertificationTestRecord[];
  evidence: readonly CertificationEvidenceRecord[];
  decision: CertificationDecisionRecord;
  upstream_ledgers: readonly ContinuousOptimizationUpstreamLedgerState[];
  failures: readonly ContinuousOptimizationCertificationFailure[];
  deployment_authorized: false;
  optimization_execution_authorized: false;
  operator_approval_required: true;
  completion_gate_ready: boolean;
  integrity_hash: string;
}>;

export type ContinuousOptimizationCertificationValidationResult = Readonly<{
  ledger_id: string;
  valid: boolean;
  discovery_certified: boolean;
  impact_analysis_certified: boolean;
  deterministic_validation_certified: boolean;
  recommendations_certified: boolean;
  replay_reproducible: boolean;
  mission_outcomes_equivalent: boolean;
  governance_enforced: boolean;
  constitutional_compliant: boolean;
  authority_preserved: boolean;
  tenant_isolated: boolean;
  operator_visible: boolean;
  explainability_complete: boolean;
  lineage_immutable: boolean;
  advisory_only_enforced: boolean;
  deployment_authorization_absent: boolean;
  optimization_execution_authorization_absent: boolean;
  operator_approval_required: true;
  completion_gate_ready: boolean;
  fail_closed: boolean;
  failures: readonly ContinuousOptimizationCertificationFailure[];
  validation_hash: string;
}>;

export type ContinuousOptimizationCertificationObservabilitySurface = Readonly<{
  ledger_id: string;
  certification_status: ContinuousOptimizationCertificationStatus;
  final_state: string;
  tests_passed: number;
  tests_failed: number;
  failure_count: number;
  deployment_authorized: false;
  optimization_execution_authorized: false;
  completion_gate_ready: boolean;
  integrity_hash: string;
}>;

export type ContinuousOptimizationCertificationInput = Readonly<{
  scenario?: ContinuousOptimizationCertificationScenario;
  upstream_ledgers?: readonly ContinuousOptimizationUpstreamLedgerState[];
  options?: ContinuousOptimizationCertificationOptions;
  discovery_registry?: OptimizationOpportunityRegistry;
  impact_ledger?: OptimizationImpactAnalysisLedger;
  validation_ledger?: DeterministicOptimizationValidationLedger;
  recommendation_ledger?: OptimizationRecommendationLedger;
  ledger?: ContinuousOptimizationCertificationLedger;
}>;

export type ContinuousOptimizationCertificationGateBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "continuous-optimization-certification-gate/v8ALT.8.5";
    final_state: "CONTINUOUS_OPTIMIZATION_CERTIFIED_FOR_COMPLETION_GATE";
    certification_statuses: readonly ContinuousOptimizationCertificationStatus[];
    principles: readonly string[];
  }>;
  ledger: ContinuousOptimizationCertificationLedger;
  validation: ContinuousOptimizationCertificationValidationResult;
  observability: ContinuousOptimizationCertificationObservabilitySurface;
}>;
