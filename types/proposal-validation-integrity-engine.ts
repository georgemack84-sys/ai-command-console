import type { ProposalExplainabilityResult } from "@/types/proposal-explainability-engine";

export type ProposalValidationCategory =
  | "IDENTITY"
  | "REFERENCES"
  | "EVIDENCE"
  | "REPLAY"
  | "INTEGRITY"
  | "TENANT_ISOLATION"
  | "SCORING"
  | "LINEAGE"
  | "SIMULATION_ROUTING"
  | "APPROVAL_ROUTING"
  | "ROLLBACK_AVAILABILITY";

export type ProposalValidationOutcome = "VALID" | "INVALID" | "INCOMPLETE" | "CONFLICTING" | "REQUIRES_REVIEW";

export type ProposalValidationState = "VALIDATED" | "FAIL_CLOSED";

export type ProposalValidationFailure =
  | "PROPOSAL_CONTRACT_INVALID"
  | "PROPOSAL_IDENTITY_INVALID"
  | "REQUIRED_REFERENCES_MISSING"
  | "EVIDENCE_VERIFICATION_FAILED"
  | "REPLAY_VERIFICATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "PROPOSAL_SCORING_INCONSISTENT"
  | "PROPOSAL_LINEAGE_INCOMPLETE"
  | "SIMULATION_ROUTING_INVALID"
  | "APPROVAL_ROUTING_INVALID"
  | "ROLLBACK_REQUIREMENTS_MISSING"
  | "DETERMINISTIC_VALIDATION_NOT_GUARANTEED"
  | "CONTRADICTORY_REFERENCES_DETECTED"
  | "INCONSISTENT_ROUTING_DETECTED"
  | "CONFLICTING_LINEAGE_DETECTED"
  | "AMBIGUOUS_EVIDENCE_REQUIRES_REVIEW"
  | "EXCEPTIONAL_GOVERNANCE_REVIEW_REQUIRED"
  | "UNRESOLVED_CERTIFICATION_QUESTION"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "PROPOSAL_SCORE_MUTATION_ATTEMPT"
  | "VALIDATION_RESULT_FABRICATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "REPLAY_BYPASS_ATTEMPT"
  | "INTEGRITY_BYPASS_ATTEMPT"
  | "TENANT_ISOLATION_BYPASS_ATTEMPT"
  | "IMPLEMENTATION_AUTHORIZATION_ATTEMPT";

export type ProposalValidationScenario =
  | "BASELINE"
  | "INCOMPLETE"
  | "CONFLICTING"
  | "REQUIRES_REVIEW"
  | "CONTRACT_INVALID"
  | "IDENTITY_INVALID"
  | "MISSING_REFERENCES"
  | "EVIDENCE_FAILURE"
  | "REPLAY_FAILURE"
  | "INTEGRITY_FAILURE"
  | "TENANT_VIOLATION"
  | "SCORING_INCONSISTENT"
  | "LINEAGE_INCOMPLETE"
  | "SIMULATION_ROUTING_INVALID"
  | "APPROVAL_ROUTING_INVALID"
  | "ROLLBACK_MISSING"
  | "NONDETERMINISTIC_VALIDATION"
  | "CONTRADICTORY_REFERENCES"
  | "INCONSISTENT_ROUTING"
  | "CONFLICTING_LINEAGE"
  | "AMBIGUOUS_EVIDENCE"
  | "EXCEPTIONAL_GOVERNANCE"
  | "CERTIFICATION_QUESTION"
  | "PROPOSAL_MUTATION_ATTEMPT"
  | "SCORE_MUTATION_ATTEMPT"
  | "FABRICATED_VALIDATION"
  | "GOVERNANCE_BYPASS"
  | "REPLAY_BYPASS"
  | "INTEGRITY_BYPASS"
  | "TENANT_BYPASS"
  | "IMPLEMENTATION_ATTEMPT";

export type ProposalValidationCheck = Readonly<{
  check_id: string;
  category: ProposalValidationCategory;
  check_name: string;
  passed: boolean;
  evidence_references: readonly string[];
  replay_references: readonly string[];
  remediation: string;
  integrity_hash: string;
}>;

export type ProposalValidationReport = Readonly<{
  validation_id: string;
  proposal_id: string;
  validation_timestamp: string;
  engine_version: "proposal-validation-integrity-engine/v1";
  validation_outcome: ProposalValidationOutcome;
  completed_checks: readonly ProposalValidationCheck[];
  failed_checks: readonly ProposalValidationCheck[];
  warnings: readonly string[];
  integrity_verification: boolean;
  replay_verification: boolean;
  tenant_isolation_verification: boolean;
  recommended_remediation: readonly string[];
  may_progress_to_governance_review: boolean;
  advisory_only: true;
  modifies_proposal: false;
  modifies_scores: false;
  authorizes_implementation: false;
  integrity_hash: string;
}>;

export type ProposalValidationMetrics = Readonly<{
  proposals_validated: number;
  validation_success_rate: number;
  validation_failures: number;
  validation_outcomes: Readonly<Record<ProposalValidationOutcome, number>>;
  integrity_verification_failures: number;
  replay_verification_failures: number;
  tenant_isolation_violations: number;
  reference_validation_failures: number;
  simulation_routing_failures: number;
  approval_routing_failures: number;
  rollback_readiness_failures: number;
  validation_latency_ms: number;
  deterministic_replay_success: boolean;
  validation_failure_reasons: readonly ProposalValidationFailure[];
  integrity_hash: string;
}>;

export type ProposalValidationApiSurface = Readonly<{
  api_id: string;
  validate_proposals: "POST /proposal-validation-integrity-engine/validate";
  retrieve_reports: "POST /proposal-validation-integrity-engine/reports";
  retrieve_checks: "POST /proposal-validation-integrity-engine/checks";
  retrieve_metrics: "POST /proposal-validation-integrity-engine/metrics";
  replay_validation: "POST /proposal-validation-integrity-engine/replay";
  inspect_validation: "POST /proposal-validation-integrity-engine/inspect";
  retrieve_contract: "GET /proposal-validation-integrity-engine/contract";
  proposal_mutation_supported: false;
  score_mutation_supported: false;
  validation_fabrication_supported: false;
  governance_bypass_supported: false;
  implementation_authorization_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type ProposalValidationInput = Readonly<{
  scenario?: ProposalValidationScenario;
  explainability_result?: ProposalExplainabilityResult;
}>;

export type ProposalValidationResult = Readonly<{
  proposal_validation_integrity_engine_version: "proposal-validation-integrity-engine/v1";
  validation_rule_version: "proposal-validation-integrity-rules/v1";
  api_surface: ProposalValidationApiSurface;
  explainability_result: ProposalExplainabilityResult;
  validation_reports: readonly ProposalValidationReport[];
  metrics: ProposalValidationMetrics;
  validation_state: ProposalValidationState;
  validation_outcome: ProposalValidationOutcome;
  failures: readonly ProposalValidationFailure[];
  deterministic: true;
  replayable: boolean;
  tenant_isolated: boolean;
  proposal_contents_unchanged: true;
  advisory_only: true;
  modifies_proposals: false;
  modifies_scores: false;
  changes_governance_decisions: false;
  authorizes_implementation: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProposalValidationFoundation = Readonly<{
  proposal_validation_integrity_engine_version: "proposal-validation-integrity-engine/v1";
  supported_categories: readonly ProposalValidationCategory[];
  supported_outcomes: readonly ProposalValidationOutcome[];
  api_surface: ProposalValidationApiSurface;
  result: ProposalValidationResult;
}>;
