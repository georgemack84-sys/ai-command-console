export type Phase13CertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type Phase13CertificationFailure =
  | "CONSTITUTIONAL_AUTHORITY_FAILURE"
  | "AUTHORITY_BOUNDARY_FAILURE"
  | "ASSURANCE_DEPENDENCY_FAILURE"
  | "ASSURANCE_EVALUATION_FAILURE"
  | "REPLAY_DETERMINISM_FAILURE"
  | "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED"
  | "ASSURANCE_LINEAGE_INCOMPLETE"
  | "SPECIFICATION_GOVERNANCE_FAILURE"
  | "DOCUMENT_TAXONOMY_FAILURE"
  | "AMENDMENT_GOVERNANCE_FAILURE"
  | "SPECIFICATION_INTEGRITY_FAILURE"
  | "EVIDENCE_BINDING_INCOMPLETE"
  | "CERTIFICATION_REPLAY_FAILURE"
  | "CERTIFICATION_LEDGER_MUTABLE"
  | "NON_CONSTITUTIONAL_DOCUMENTATION_ISSUE";

export type Phase13CertificationScenario = "BASELINE" | Phase13CertificationFailure;
export type Phase13CertificationInput = Readonly<{ scenario?: Phase13CertificationScenario; tenant_id?: string }>;

export type PhaseCertificationContract = Readonly<{
  certification_scope: "PHASE_13_ASSURANCE_FRAMEWORK";
  certification_version: "phase-13-certification-gate/v13.12";
  specification_manifest: readonly string[];
  constitutional_manifest: readonly string[];
  governance_manifest: readonly string[];
  dependency_manifest: readonly string[];
  certification_evidence_refs: readonly string[];
  certification_result: Phase13CertificationOutcome;
  certification_timestamp: string;
  certifying_authority: string;
  replay_manifest: readonly string[];
  integrity_hash: string;
}>;

export type Phase13CertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL" | "CONDITIONAL_PASS";
  passed: boolean;
  failure_reason: Phase13CertificationFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type Phase13DomainCertification = Readonly<{
  domain_id: string;
  domain:
    | "CONSTITUTIONAL_COMPLIANCE"
    | "AUTHORITY_FRAMEWORK"
    | "ASSURANCE_FRAMEWORK"
    | "REPLAY_DETERMINISM"
    | "GOVERNANCE"
    | "SPECIFICATION_INTEGRITY";
  outcome: Phase13CertificationOutcome;
  evidence_refs: readonly string[];
  failures: readonly Phase13CertificationFailure[];
  integrity_hash: string;
}>;

export type CertificationEvidenceBinder = Readonly<{
  evidence_binder_id: string;
  validation_results: readonly string[];
  constitutional_evidence: readonly string[];
  governance_evidence: readonly string[];
  replay_evidence: readonly string[];
  lineage_evidence: readonly string[];
  dependency_evidence: readonly string[];
  integrity_evidence: readonly string[];
  certification_reasoning: string;
  append_only: boolean;
  fully_explainable: boolean;
  supports_independent_verification: boolean;
  integrity_hash: string;
}>;

export type CertificationDecisionRecord = Readonly<{
  certification_id: string;
  phase_id: "13";
  specification_manifest_ref: string;
  constitutional_manifest_ref: string;
  governance_manifest_ref: string;
  authority_validation_ref: string;
  assurance_validation_ref: string;
  dependency_validation_ref: string;
  replay_validation_ref: string;
  integrity_validation_ref: string;
  taxonomy_validation_ref: string;
  consistency_validation_ref: string;
  evidence_binder_ref: string;
  certification_outcome: Phase13CertificationOutcome;
  certification_reasoning: string;
  conditions: readonly string[];
  certifying_authority: string;
  certification_timestamp: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type PhaseCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  event_type: "TEST_EXECUTED" | "DOMAIN_CERTIFIED" | "EVIDENCE_BOUND" | "DECISION_RECORDED" | "REPLAY_VALIDATED" | "REPORT_PUBLISHED";
  evidence_refs: readonly string[];
  sequence: number;
  append_only: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type FinalAssuranceCertificationReport = Readonly<{
  report_id: string;
  executive_summary: string;
  certification_outcome: Phase13CertificationOutcome;
  tests_passed: number;
  tests_failed: number;
  conditions: readonly string[];
  phase_13_normative_language_certified: boolean;
  future_specification_foundation_ready: boolean;
  integrity_hash: string;
}>;

export type Phase13CertificationGateResult = Readonly<{
  phase_version: "phase-13-certification-gate/v13.12";
  phase_identifier: "Phase13CertificationGate";
  contract: PhaseCertificationContract;
  constitutional_compliance: Phase13DomainCertification;
  authority_certification: Phase13DomainCertification;
  assurance_certification: Phase13DomainCertification;
  replay_certification: Phase13DomainCertification;
  governance_certification: Phase13DomainCertification;
  specification_integrity_certification: Phase13DomainCertification;
  tests: readonly Phase13CertificationTest[];
  evidence_binder: CertificationEvidenceBinder;
  decision: CertificationDecisionRecord;
  certification_ledger: readonly PhaseCertificationLedgerEntry[];
  replay_validator: Readonly<{ replay_validator_id: string; certification_replayed: boolean; identical_outcome: boolean; evidence_replayed: boolean; deterministic: boolean; integrity_hash: string }>;
  final_report: FinalAssuranceCertificationReport;
  replay_hash: string;
  integrity_hash: string;
}>;

export type Phase13CertificationGateValidation = Readonly<{
  valid: boolean;
  outcome: Phase13CertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  tests_valid: boolean;
  evidence_valid: boolean;
  ledger_valid: boolean;
  replay_valid: boolean;
  failures: readonly Phase13CertificationFailure[];
  integrity_hash: string;
}>;

export type Phase13CertificationGateBundle = Readonly<{
  doctrine: Readonly<{
    version: "phase-13-certification-gate/v13.12";
    certification_outcomes: readonly Phase13CertificationOutcome[];
    complete_phase_certification_required: true;
    certification_modifies_specifications: false;
    immutable_evidence_required: true;
    deterministic_decisions_required: true;
    replayable_decisions_required: true;
    explainable_reasoning_required: true;
  }>;
  result: Phase13CertificationGateResult;
  validation: Phase13CertificationGateValidation;
}>;
