import type { SimulationValidationLedgerResult } from "@/types/simulation-validation-ledger";

export type AdaptiveSimulationCertificationOutcome =
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL"
  | "REQUIRES_MORE_EVIDENCE"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_OPERATOR_REVIEW";

export type AdaptiveSimulationCertificationComponent =
  | "REPLAY_CERTIFICATION"
  | "SIMULATION_CERTIFICATION"
  | "GOVERNANCE_CERTIFICATION"
  | "OPERATOR_CERTIFICATION"
  | "ROLLBACK_CERTIFICATION"
  | "AUDIT_CERTIFICATION";

export type AdaptiveSimulationCertificationFailure =
  | "SIMULATION_LEDGER_UNAVAILABLE"
  | "NONDETERMINISTIC_REPLAY"
  | "SIMULATION_INCONSISTENCY"
  | "UNEXPLAINED_REPLAY_DIVERGENCE"
  | "HIDDEN_REGRESSION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_EXPANSION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "APPROVAL_WORKFLOW_DEGRADATION"
  | "ROLLBACK_FAILURE"
  | "INCOMPLETE_AUDIT_EVIDENCE"
  | "MISSING_LINEAGE"
  | "LEDGER_INTEGRITY_FAILURE"
  | "REPLAY_INTEGRITY_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "INCOMPLETE_CERTIFICATION_EVIDENCE";

export type AdaptiveSimulationCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL_DOCUMENTATION"
  | "NONDETERMINISTIC_REPLAY"
  | "SIMULATION_INCONSISTENCY"
  | "UNEXPLAINED_REPLAY_DIVERGENCE"
  | "HIDDEN_REGRESSION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_EXPANSION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "APPROVAL_WORKFLOW_DEGRADATION"
  | "ROLLBACK_FAILURE"
  | "INCOMPLETE_AUDIT_EVIDENCE"
  | "MISSING_LINEAGE"
  | "LEDGER_INTEGRITY_FAILURE"
  | "REPLAY_INTEGRITY_FAILURE"
  | "TENANT_ISOLATION_BREACH"
  | "INCOMPLETE_CERTIFICATION_EVIDENCE";

export type ComponentCertification = Readonly<{
  component: AdaptiveSimulationCertificationComponent;
  verified_requirements: readonly string[];
  pass: boolean;
  failures: readonly AdaptiveSimulationCertificationFailure[];
  evidence_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveSimulationCertificationRecord = Readonly<{
  certification_id: string;
  proposal_id: string;
  tenant_id: string;
  replay_certification: ComponentCertification;
  simulation_certification: ComponentCertification;
  governance_certification: ComponentCertification;
  operator_certification: ComponentCertification;
  rollback_certification: ComponentCertification;
  audit_certification: ComponentCertification;
  certification_outcome: AdaptiveSimulationCertificationOutcome;
  certification_rationale: string;
  required_follow_up: string;
  evidence_package_reference: string;
  replay_reference: string;
  simulation_reference: string;
  integrity_hash: string;
}>;

export type AdaptiveSimulationCertificationEvidencePackage = Readonly<{
  replay_certification_report_hash: string;
  simulation_certification_report_hash: string;
  governance_certification_report_hash: string;
  operator_certification_report_hash: string;
  rollback_certification_report_hash: string;
  audit_certification_report_hash: string;
  certification_decision_summary_hash: string;
  replay_integrity_report_hash: string;
  simulation_evidence_package_hash: string;
  certification_lineage_package_hash: string;
  governance_review_package_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveSimulationCertificationMetrics = Readonly<{
  mandatory_certifications_evaluated: number;
  mandatory_certifications_passed: number;
  deterministic_replay_certified: boolean;
  simulation_reproducibility_certified: boolean;
  measurable_improvement_certified: boolean;
  governance_certified: boolean;
  operator_authority_certified: boolean;
  rollback_certified: boolean;
  audit_certified: boolean;
  certification_progression_authorized: boolean;
  failures: readonly AdaptiveSimulationCertificationFailure[];
  integrity_hash: string;
}>;

export type AdaptiveSimulationCertificationApiSurface = Readonly<{
  api_id: string;
  certify_simulation: "POST /adaptive-simulation-certification-gate/certify";
  retrieve_components: "POST /adaptive-simulation-certification-gate/components";
  retrieve_evidence: "POST /adaptive-simulation-certification-gate/evidence";
  retrieve_metrics: "POST /adaptive-simulation-certification-gate/metrics";
  replay_certification: "POST /adaptive-simulation-certification-gate/replay";
  inspect_gate: "POST /adaptive-simulation-certification-gate/inspect";
  retrieve_contract: "GET /adaptive-simulation-certification-gate/contract";
  implementation_authorization_supported: false;
  governance_bypass_supported: false;
  fail_open_supported: false;
  advisory_only: true;
  integrity_hash: string;
}>;

export type AdaptiveSimulationCertificationInput = Readonly<{
  scenario?: AdaptiveSimulationCertificationScenario;
  proposal_id?: string;
  tenant_id?: string;
  ledger_result?: SimulationValidationLedgerResult;
}>;

export type AdaptiveSimulationCertificationResult = Readonly<{
  adaptive_simulation_certification_gate_version: "adaptive-simulation-certification-gate/v1";
  gate_identifier: "AdaptiveSimulationCertificationGate";
  api_surface: AdaptiveSimulationCertificationApiSurface;
  ledger_result: SimulationValidationLedgerResult;
  components: readonly ComponentCertification[];
  record: AdaptiveSimulationCertificationRecord;
  evidence_package: AdaptiveSimulationCertificationEvidencePackage;
  metrics: AdaptiveSimulationCertificationMetrics;
  certification_outcome: AdaptiveSimulationCertificationOutcome;
  failures: readonly AdaptiveSimulationCertificationFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  rollback_ready: boolean;
  audit_complete: boolean;
  tenant_isolated: boolean;
  authorizes_governance_review: boolean;
  authorizes_implementation: false;
  advisory_only: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveSimulationCertificationFoundation = Readonly<{
  adaptive_simulation_certification_gate_version: "adaptive-simulation-certification-gate/v1";
  certification_components: readonly AdaptiveSimulationCertificationComponent[];
  api_surface: AdaptiveSimulationCertificationApiSurface;
  result: AdaptiveSimulationCertificationResult;
}>;
