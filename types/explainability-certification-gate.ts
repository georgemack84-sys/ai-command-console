import type { ConfidenceRiskRepository } from "@/types/confidence-risk-reasoning-engine";
import type { DecisionNarrativeRepository } from "@/types/decision-narrative-engine";
import type { ReasoningGraphRepository } from "@/types/evidence-policy-reasoning-graph";
import type { ExplanationRepository } from "@/types/explainability-contract";

export type ExplainabilityCertificationState = "INITIALIZING" | "VALIDATING_SCHEMA" | "VALIDATING_NARRATIVES" | "VALIDATING_EVIDENCE" | "VALIDATING_POLICY" | "VALIDATING_CONSTITUTION" | "VALIDATING_AUTHORITY" | "VALIDATING_CONFIDENCE" | "VALIDATING_RISK" | "VALIDATING_REPLAY" | "VALIDATING_INTEGRITY" | "CERTIFIED" | "CONDITIONAL_PASS" | "FAIL";
export type ExplainabilityCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ExplainabilityCertificationCategory = "contract" | "schema" | "narrative" | "evidence" | "policy" | "constitution" | "authority" | "confidence_risk" | "replay" | "integrity";

export type ExplainabilityCertificationScenario =
  | "BASELINE"
  | "DOCUMENTATION_WARNING"
  | "MISSING_EXPLANATION"
  | "FABRICATED_EXPLANATION"
  | "HIDDEN_EVIDENCE"
  | "POLICY_OMISSION"
  | "AUTHORITY_OMISSION"
  | "CONFIDENCE_REPLAY_MISMATCH"
  | "RISK_REPLAY_MISMATCH"
  | "NONDETERMINISTIC_WORDING"
  | "CROSS_TENANT_LEAKAGE"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_FAILURE";

export type ExplainabilityCertificationFailure =
  | "EXPLAINABILITY_CONTRACT_INVALID"
  | "EXPLANATION_SCHEMA_INCOMPLETE"
  | "DECISION_NARRATIVE_NONDETERMINISTIC"
  | "EXPLANATION_REPLAY_MISMATCH"
  | "SELECTED_PLAN_UNEXPLAINED"
  | "REJECTED_PLANS_UNEXPLAINED"
  | "EVIDENCE_CHAIN_INCOMPLETE"
  | "EVIDENCE_LINEAGE_UNREPRODUCIBLE"
  | "POLICY_INFLUENCE_NONDETERMINISTIC"
  | "CONSTITUTIONAL_EVALUATIONS_MISSING"
  | "AUTHORITY_APPROVALS_UNTRACEABLE"
  | "CONFIDENCE_REASONING_UNREPRODUCIBLE"
  | "RISK_REASONING_UNREPRODUCIBLE"
  | "EXPLANATION_GRAPH_INCOMPLETE"
  | "MISSING_EXPLANATION_DETECTED"
  | "FABRICATED_EXPLANATION_DETECTED"
  | "HIDDEN_EVIDENCE_DETECTED"
  | "POLICY_OMISSION_DETECTED"
  | "AUTHORITY_OMISSION_DETECTED"
  | "CONFIDENCE_REPLAY_MISMATCH_DETECTED"
  | "RISK_REPLAY_MISMATCH_DETECTED"
  | "NONDETERMINISTIC_EXPLANATION_WORDING"
  | "CROSS_TENANT_EXPLANATION_LEAKAGE"
  | "REPLAY_EXPLANATION_MISMATCH"
  | "GOVERNANCE_COMPLIANCE_INVALID"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "REPLAY_NONDETERMINISTIC"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "NON_CRITICAL_DOCUMENTATION_WARNING";

export type ExplainabilityCertificationTestResult = Readonly<{
  test_id: string;
  name: string;
  category: ExplainabilityCertificationCategory;
  expected_outcome: ExplainabilityCertificationOutcome;
  actual_outcome: ExplainabilityCertificationOutcome;
  status: ExplainabilityCertificationOutcome;
  evidence_references: readonly string[];
  replay_reference: string;
  integrity_hash: string;
}>;

export type ExplainabilityCertificationReport = Readonly<{
  certification_id: string;
  phase_id: "8ALT.5.5";
  certification_version: "explainability-certification-gate/v8ALT.5.5";
  certification_timestamp: string;
  overall_status: ExplainabilityCertificationOutcome;
  certification_state: ExplainabilityCertificationState;
  tests_executed: number;
  tests_passed: number;
  tests_failed: number;
  warnings: readonly string[];
  explanation_coverage: boolean;
  replay_verification: boolean;
  governance_verification: boolean;
  constitutional_verification: boolean;
  authority_verification: boolean;
  confidence_verification: boolean;
  risk_verification: boolean;
  integrity_verification: boolean;
  tenant_isolation_status: boolean;
  test_results: readonly ExplainabilityCertificationTestResult[];
  failures: readonly ExplainabilityCertificationFailure[];
  truth_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  certified_by: string;
  advisory_only: true;
  report_hash: string;
}>;

export type ExplainabilityCertificationLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  reports: readonly ExplainabilityCertificationReport[];
  source_explainability_repository: ExplanationRepository;
  source_narrative_repository: DecisionNarrativeRepository;
  source_reasoning_graph_repository: ReasoningGraphRepository;
  source_confidence_risk_repository: ConfidenceRiskRepository;
  validation_evidence: readonly string[];
  lineage_references: readonly string[];
  replay_references: readonly string[];
  integrity_verification: readonly string[];
  append_only: true;
  read_only: true;
  ledger_hash: string;
}>;

export type ExplainabilityCertificationInput = Readonly<{
  scenario?: ExplainabilityCertificationScenario;
  tenant_id?: string;
  mission_id?: string;
  explainability_repository?: ExplanationRepository;
  narrative_repository?: DecisionNarrativeRepository;
  reasoning_graph_repository?: ReasoningGraphRepository;
  confidence_risk_repository?: ConfidenceRiskRepository;
}>;

export type ExplainabilityCertificationValidationResult = Readonly<{
  ledger_id: string | null;
  valid: boolean;
  contract_valid: boolean;
  schema_complete: boolean;
  narrative_valid: boolean;
  evidence_valid: boolean;
  policy_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  confidence_risk_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  advisory_only_enforced: boolean;
  failures: readonly ExplainabilityCertificationFailure[];
  validation_hash: string;
}>;

export type ExplainabilityCertificationReplayResult = Readonly<{
  replay_reference: string;
  ledger_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type ExplainabilityCertificationObservabilitySurface = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  certification_count: number;
  overall_status: ExplainabilityCertificationOutcome;
  tests_passed: number;
  tests_failed: number;
  production_certification_ready: boolean;
  advisory_only: true;
  ledger_hash: string;
}>;

export type ExplainabilityCertificationGateContract = Readonly<{
  doctrine: Readonly<{
    gate_version: "explainability-certification-gate/v8ALT.5.5";
    principles: readonly string[];
    certification_states: readonly ExplainabilityCertificationState[];
    certification_outcomes: readonly ExplainabilityCertificationOutcome[];
    certification_categories: readonly ExplainabilityCertificationCategory[];
    pass_required_for_production: true;
    advisory_only: true;
  }>;
  ledger: ExplainabilityCertificationLedger;
  validation: ExplainabilityCertificationValidationResult;
  replay: ExplainabilityCertificationReplayResult;
  observability: ExplainabilityCertificationObservabilitySurface;
}>;
