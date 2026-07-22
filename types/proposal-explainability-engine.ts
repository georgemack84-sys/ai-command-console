import type { ProposalLifecycleResult } from "@/types/proposal-lifecycle-state-machine";

export type ProposalExplanationComponentType =
  | "GENERATION_RATIONALE"
  | "EVIDENCE_USED"
  | "PATTERNS_DETECTED"
  | "FEEDBACK_CONSIDERED"
  | "EXPECTED_IMPROVEMENTS"
  | "EXPECTED_RISKS"
  | "GOVERNANCE_EFFECTS"
  | "CONSTITUTIONAL_EFFECTS"
  | "AUTHORITY_EFFECTS"
  | "OPERATOR_EFFECTS"
  | "SIMULATION_REQUIREMENTS"
  | "CERTIFICATION_REQUIREMENTS"
  | "ROLLBACK_REQUIREMENTS";

export type ProposalExplainabilityState = "EXPLAINED" | "FAIL_CLOSED";

export type ProposalExplainabilityFailure =
  | "PROPOSAL_VALIDATION_FAILED"
  | "EVIDENCE_REFERENCES_INCOMPLETE"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_ANALYSIS_UNAVAILABLE"
  | "CONSTITUTIONAL_ANALYSIS_UNAVAILABLE"
  | "AUTHORITY_ANALYSIS_UNAVAILABLE"
  | "OPERATOR_ANALYSIS_UNAVAILABLE"
  | "SIMULATION_REQUIREMENTS_UNAVAILABLE"
  | "CERTIFICATION_REQUIREMENTS_UNAVAILABLE"
  | "ROLLBACK_REQUIREMENTS_UNAVAILABLE"
  | "REQUIRED_IMPACTS_UNEXPLAINED"
  | "EXPLANATION_COMPLETENESS_NOT_ACHIEVED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DETERMINISTIC_EXPLANATION_NOT_GUARANTEED"
  | "TENANT_ISOLATION_VIOLATED"
  | "REASONING_FABRICATION_ATTEMPT"
  | "SUPPORTING_EVIDENCE_OMISSION_ATTEMPT"
  | "GOVERNANCE_IMPACT_HIDE_ATTEMPT"
  | "CONSTITUTIONAL_IMPACT_HIDE_ATTEMPT"
  | "OPERATOR_IMPACT_HIDE_ATTEMPT"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "PROPOSAL_SCORE_MUTATION_ATTEMPT"
  | "PROPOSAL_APPROVAL_ATTEMPT"
  | "IMPLEMENTATION_AUTHORIZATION_ATTEMPT";

export type ProposalExplainabilityScenario =
  | "BASELINE"
  | "REJECTION_PATH"
  | "SUPPRESSION_PATH"
  | "ROLLBACK_PATH"
  | "PROPOSAL_VALIDATION_FAILURE"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_AUTHORITY"
  | "MISSING_OPERATOR"
  | "MISSING_SIMULATION"
  | "MISSING_CERTIFICATION"
  | "MISSING_ROLLBACK"
  | "IMPACTS_UNEXPLAINED"
  | "INCOMPLETE_EXPLANATION"
  | "INTEGRITY_FAILURE"
  | "NONDETERMINISTIC_EXPLANATION"
  | "TENANT_VIOLATION"
  | "FABRICATED_REASONING"
  | "OMITTED_EVIDENCE"
  | "HIDE_GOVERNANCE"
  | "HIDE_CONSTITUTIONAL"
  | "HIDE_OPERATOR"
  | "PROPOSAL_MUTATION_ATTEMPT"
  | "SCORE_MUTATION_ATTEMPT"
  | "APPROVAL_ATTEMPT"
  | "IMPLEMENTATION_ATTEMPT";

export type ProposalExplanationComponent = Readonly<{
  component_id: string;
  component_type: ProposalExplanationComponentType;
  title: string;
  narrative: string;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  governance_references: readonly string[];
  machine_verifiable_claims: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type ProposalExplanation = Readonly<{
  explanation_id: string;
  proposal_id: string;
  proposal_summary: string;
  components: readonly ProposalExplanationComponent[];
  replay_references: readonly string[];
  explanation_version: "proposal-explainability-engine/v1";
  explanation_timestamp: string;
  complete: boolean;
  deterministic: true;
  evidence_backed: boolean;
  traceable: boolean;
  reproducible: boolean;
  understandable: boolean;
  governance_aware: boolean;
  constitutionally_compliant: boolean;
  replayable: boolean;
  can_advance_to_approval: boolean;
  advisory_only: true;
  modifies_proposal: false;
  modifies_scores: false;
  approves_proposal: false;
  authorizes_implementation: false;
  integrity_hash: string;
}>;

export type ProposalExplainabilityMetrics = Readonly<{
  proposals_explained: number;
  explanation_completeness: number;
  evidence_attribution_coverage: number;
  governance_explanation_coverage: number;
  operator_explanation_coverage: number;
  simulation_explanation_coverage: number;
  certification_explanation_coverage: number;
  rollback_explanation_coverage: number;
  explanation_generation_latency_ms: number;
  explanation_validation_failures: readonly ProposalExplainabilityFailure[];
  deterministic_replay_success: boolean;
  integrity_hash: string;
}>;

export type ProposalExplainabilityApiSurface = Readonly<{
  api_id: string;
  explain_proposals: "POST /proposal-explainability-engine/explain";
  retrieve_explanations: "POST /proposal-explainability-engine/explanations";
  retrieve_components: "POST /proposal-explainability-engine/components";
  retrieve_metrics: "POST /proposal-explainability-engine/metrics";
  replay_explanations: "POST /proposal-explainability-engine/replay";
  inspect_explainability: "POST /proposal-explainability-engine/inspect";
  retrieve_contract: "GET /proposal-explainability-engine/contract";
  proposal_mutation_supported: false;
  score_mutation_supported: false;
  approval_supported: false;
  implementation_authorization_supported: false;
  reasoning_fabrication_supported: false;
  evidence_omission_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type ProposalExplainabilityInput = Readonly<{
  scenario?: ProposalExplainabilityScenario;
  lifecycle_result?: ProposalLifecycleResult;
}>;

export type ProposalExplainabilityResult = Readonly<{
  proposal_explainability_engine_version: "proposal-explainability-engine/v1";
  explanation_rule_version: "proposal-explainability-rules/v1";
  api_surface: ProposalExplainabilityApiSurface;
  lifecycle_result: ProposalLifecycleResult;
  explanations: readonly ProposalExplanation[];
  metrics: ProposalExplainabilityMetrics;
  explainability_state: ProposalExplainabilityState;
  failures: readonly ProposalExplainabilityFailure[];
  deterministic: true;
  replayable: boolean;
  tenant_isolated: boolean;
  complete: boolean;
  evidence_backed: boolean;
  governance_aware: boolean;
  constitutionally_compliant: boolean;
  advisory_only: true;
  modifies_proposals: false;
  modifies_scores: false;
  approves_proposals: false;
  authorizes_implementation: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProposalExplainabilityFoundation = Readonly<{
  proposal_explainability_engine_version: "proposal-explainability-engine/v1";
  supported_components: readonly ProposalExplanationComponentType[];
  api_surface: ProposalExplainabilityApiSurface;
  result: ProposalExplainabilityResult;
}>;
