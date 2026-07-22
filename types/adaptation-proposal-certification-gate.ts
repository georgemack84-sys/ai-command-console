import type { ProposalValidationResult } from "@/types/proposal-validation-integrity-engine";

export type AdaptationProposalCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type AdaptationProposalCertificationArea =
  | "PROPOSAL_GENERATION"
  | "EVIDENCE_LINEAGE"
  | "REPLAY"
  | "SCORING_PRIORITIZATION"
  | "SUPPRESSION_CONSOLIDATION"
  | "GOVERNANCE_CONSTITUTIONAL"
  | "OPERATOR_SAFETY"
  | "INTEGRITY_SECURITY"
  | "LIFECYCLE"
  | "EXPLAINABILITY";

export type AdaptationProposalCertificationFailure =
  | "NONDETERMINISTIC_PROPOSAL_GENERATION"
  | "PROPOSAL_IDENTITY_COLLISION"
  | "PROPOSAL_SCHEMA_VALIDATION_FAILED"
  | "EVIDENCE_REFERENCES_INCOMPLETE"
  | "PROPOSAL_LINEAGE_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "AUTHORITY_BOUNDARY_VIOLATED"
  | "SCORING_NONDETERMINISTIC"
  | "PRIORITIZATION_NONDETERMINISTIC"
  | "SUPPRESSION_INCONSISTENT"
  | "CONSOLIDATION_LINEAGE_LOST"
  | "LIFECYCLE_INCONSISTENT"
  | "EXPLAINABILITY_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "IMMUTABLE_LEDGER_GUARANTEE_FAILED"
  | "TENANT_ISOLATION_FAILED"
  | "UNAUTHORIZED_PROPOSAL_MUTATION"
  | "ADVISORY_ONLY_VIOLATED"
  | "DIRECT_PRODUCTION_MUTATION_POSSIBLE"
  | "DOCUMENTATION_OBSERVABILITY_DEFICIENCY"
  | "REPORTING_DASHBOARD_DEFICIENCY";

export type AdaptationProposalCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL_DOCUMENTATION"
  | "CONDITIONAL_OBSERVABILITY"
  | "NONDETERMINISTIC_GENERATION"
  | "IDENTITY_COLLISION"
  | "SCHEMA_FAILURE"
  | "MISSING_EVIDENCE"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "AUTHORITY_FAILURE"
  | "SCORING_NONDETERMINISTIC"
  | "PRIORITIZATION_NONDETERMINISTIC"
  | "SUPPRESSION_INCONSISTENT"
  | "CONSOLIDATION_LINEAGE_LOST"
  | "LIFECYCLE_INCONSISTENT"
  | "EXPLAINABILITY_INCOMPLETE"
  | "INTEGRITY_FAILURE"
  | "LEDGER_FAILURE"
  | "TENANT_VIOLATION"
  | "PROPOSAL_MUTATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "PRODUCTION_MUTATION";

export type AdaptationProposalCertificationTest = Readonly<{
  test_id: string;
  area: AdaptationProposalCertificationArea;
  test_name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  evidence_references: readonly string[];
  replay_references: readonly string[];
  remediation: string;
  integrity_hash: string;
}>;

export type AdaptationProposalCertificationDeliverable = Readonly<{
  deliverable_id: string;
  title: string;
  complete: boolean;
  report_reference: string;
  integrity_hash: string;
}>;

export type AdaptationProposalCertificationSummary = Readonly<{
  summary_id: string;
  certification_outcome: AdaptationProposalCertificationOutcome;
  certification_timestamp: string;
  completed_tests: number;
  passed_tests: number;
  failed_tests: number;
  outstanding_findings: readonly AdaptationProposalCertificationFailure[];
  production_readiness_status: "READY_FOR_PHASE_10_11" | "BLOCKED" | "CONDITIONAL_BLOCKED";
  progression_to_phase_10_11_authorized: boolean;
  advisory_only: true;
  authorizes_implementation: false;
  authorizes_production_mutation: false;
  integrity_hash: string;
}>;

export type AdaptationProposalCertificationMetrics = Readonly<{
  certification_status: AdaptationProposalCertificationOutcome;
  certification_completion_percentage: number;
  proposal_determinism_rate: number;
  replay_success_rate: number;
  lineage_completeness: number;
  validation_success_rate: number;
  governance_compliance_rate: number;
  constitutional_compliance_rate: number;
  authority_compliance_rate: number;
  operator_safety_compliance: number;
  integrity_verification_success: number;
  tenant_isolation_verification: number;
  production_readiness_status: "READY_FOR_PHASE_10_11" | "BLOCKED" | "CONDITIONAL_BLOCKED";
  deterministic_replay_success: boolean;
  integrity_hash: string;
}>;

export type AdaptationProposalCertificationApiSurface = Readonly<{
  api_id: string;
  certify_engine: "POST /adaptation-proposal-certification-gate/certify";
  retrieve_summary: "POST /adaptation-proposal-certification-gate/summary";
  retrieve_matrix: "POST /adaptation-proposal-certification-gate/matrix";
  retrieve_deliverables: "POST /adaptation-proposal-certification-gate/deliverables";
  retrieve_metrics: "POST /adaptation-proposal-certification-gate/metrics";
  replay_certification: "POST /adaptation-proposal-certification-gate/replay";
  inspect_certification: "POST /adaptation-proposal-certification-gate/inspect";
  retrieve_contract: "GET /adaptation-proposal-certification-gate/contract";
  implementation_authorization_supported: false;
  production_mutation_supported: false;
  governance_override_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationProposalCertificationInput = Readonly<{
  scenario?: AdaptationProposalCertificationScenario;
  validation_result?: ProposalValidationResult;
}>;

export type AdaptationProposalCertificationResult = Readonly<{
  adaptation_proposal_certification_gate_version: "adaptation-proposal-certification-gate/v1";
  certification_rule_version: "adaptation-proposal-certification-rules/v1";
  api_surface: AdaptationProposalCertificationApiSurface;
  validation_result: ProposalValidationResult;
  certification_tests: readonly AdaptationProposalCertificationTest[];
  deliverables: readonly AdaptationProposalCertificationDeliverable[];
  summary: AdaptationProposalCertificationSummary;
  metrics: AdaptationProposalCertificationMetrics;
  certification_outcome: AdaptationProposalCertificationOutcome;
  failures: readonly AdaptationProposalCertificationFailure[];
  deterministic: true;
  replayable: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  governance_supremacy_preserved: boolean;
  constitutional_enforcement_preserved: boolean;
  authority_preservation_enforced: boolean;
  operator_first_design_verified: boolean;
  authorizes_implementation: false;
  authorizes_production_mutation: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationProposalCertificationFoundation = Readonly<{
  adaptation_proposal_certification_gate_version: "adaptation-proposal-certification-gate/v1";
  supported_outcomes: readonly AdaptationProposalCertificationOutcome[];
  certification_areas: readonly AdaptationProposalCertificationArea[];
  api_surface: AdaptationProposalCertificationApiSurface;
  result: AdaptationProposalCertificationResult;
}>;
