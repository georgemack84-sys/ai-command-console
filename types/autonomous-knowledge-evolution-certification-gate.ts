export type AutonomousKnowledgeCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationTestStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type AutonomousKnowledgeCertificationScenario = "BASELINE" | "NONDETERMINISTIC_LEARNING" | "REPLAY_MISMATCH" | "HISTORICAL_TRUTH_MODIFIED" | "CONSTITUTION_MODIFIED" | "GOVERNANCE_RULES_MODIFIED" | "AUTHORITY_POLICIES_MODIFIED" | "AUTONOMOUS_ACTIVATION" | "OPERATOR_APPROVAL_BYPASSED" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_BYPASS" | "AUTHORITY_ESCALATION" | "CROSS_TENANT_LEAKAGE" | "CROSS_TENANT_REPLAY_ACCESS" | "MISSING_EVIDENCE_LINEAGE" | "MISSING_REPLAY_REFERENCES" | "BROKEN_VERSION_HISTORY" | "INTEGRITY_FAILURE" | "HASH_MISMATCH" | "DIGITAL_SIGNATURE_INVALID" | "INCOMPLETE_EXPLAINABILITY" | "HIDDEN_LEARNING_BEHAVIOR" | "HIDDEN_ACTIVATION" | "REPOSITORY_MUTATION" | "LEDGER_OVERWRITE" | "AUDIT_HISTORY_MODIFIED" | "NONDETERMINISTIC_CERTIFICATION_REPORT";
export type AutonomousKnowledgeCertificationFailure = "NONDETERMINISTIC_LEARNING" | "REPLAY_MISMATCH" | "HISTORICAL_TRUTH_MODIFIED" | "CONSTITUTION_MODIFIED" | "GOVERNANCE_RULES_MODIFIED" | "AUTHORITY_POLICIES_MODIFIED" | "AUTONOMOUS_ACTIVATION" | "OPERATOR_APPROVAL_BYPASSED" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_BYPASS" | "AUTHORITY_ESCALATION" | "CROSS_TENANT_LEAKAGE" | "CROSS_TENANT_REPLAY_ACCESS" | "MISSING_EVIDENCE_LINEAGE" | "MISSING_REPLAY_REFERENCES" | "BROKEN_VERSION_HISTORY" | "INTEGRITY_FAILURE" | "HASH_MISMATCH" | "DIGITAL_SIGNATURE_INVALID" | "INCOMPLETE_EXPLAINABILITY" | "HIDDEN_LEARNING_BEHAVIOR" | "HIDDEN_ACTIVATION" | "REPOSITORY_MUTATION" | "LEDGER_OVERWRITE" | "AUDIT_HISTORY_MODIFIED" | "NONDETERMINISTIC_CERTIFICATION_REPORT";

export type CertificationMatrixItem = Readonly<{
  test_id: string;
  test_name: string;
  expected_status: "PASS";
  actual_status: CertificationTestStatus;
  component: string;
  evidence_reference: string;
  replay_reference: string;
  explanation: string;
  integrity_hash: string;
}>;

export type CertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  event_type: "CERTIFICATION_STARTED" | "TEST_RECORDED" | "CONDITIONAL_BLOCKER_RECORDED" | "FAILURE_RECORDED" | "CERTIFICATION_DECIDED";
  event_sequence: number;
  event_status: CertificationTestStatus;
  replay_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type CertificationReport = Readonly<{
  report_id: string;
  certification_id: string;
  report_type: "FINAL_CERTIFICATION_REPORT" | "DETERMINISTIC_VALIDATION_REPORT" | "GOVERNANCE_COMPLIANCE_REPORT" | "REPLAY_VERIFICATION_REPORT" | "REPOSITORY_INTEGRITY_REPORT" | "EXPLAINABILITY_ASSESSMENT";
  report_status: AutonomousKnowledgeCertificationState;
  summary: readonly string[];
  required_actions: readonly string[];
  replay_reference: string;
  integrity_hash: string;
}>;

export type CertificationDashboard = Readonly<{
  certification_id: string;
  certification_state: AutonomousKnowledgeCertificationState;
  total_tests: number;
  pass_count: number;
  conditional_count: number;
  fail_count: number;
  automatic_failure_count: number;
  production_authorization_granted: false;
  activation_authorized: false;
  replay_ready: boolean;
  governance_compliant: boolean;
  tenant_isolated: boolean;
  audit_complete: boolean;
  integrity_hash: string;
}>;

export type AutonomousKnowledgeCertificationRecord = Readonly<{
  certification_id: string;
  certification_version: "autonomous-knowledge-evolution-certification-gate/v8ALT.9.11";
  certification_timestamp: "1970-01-01T00:00:00.000Z";
  contract_status: CertificationTestStatus;
  determinism_status: CertificationTestStatus;
  replay_status: CertificationTestStatus;
  governance_status: CertificationTestStatus;
  constitutional_status: CertificationTestStatus;
  authority_status: CertificationTestStatus;
  integrity_status: CertificationTestStatus;
  tenant_status: CertificationTestStatus;
  explainability_status: CertificationTestStatus;
  analytics_status: CertificationTestStatus;
  determinism_score: number;
  replay_score: number;
  governance_score: number;
  integrity_score: number;
  explainability_score: number;
  overall_certification_score: number;
  evidence_chain: readonly string[];
  lineage_reference: readonly string[];
  replay_reference: readonly string[];
  certification_state: AutonomousKnowledgeCertificationState;
  certification_reason: string;
  required_actions: readonly string[];
  next_review_date: "1970-01-01T00:00:00.000Z";
  matrix: readonly CertificationMatrixItem[];
  automatic_failures: readonly AutonomousKnowledgeCertificationFailure[];
  reports: readonly CertificationReport[];
  ledger_entries: readonly CertificationLedgerEntry[];
  dashboard: CertificationDashboard;
  certification_only: true;
  production_authorization_granted: false;
  activation_authorized: false;
  runtime_modification_authorized: false;
  governance_modification_authorized: false;
  integrity_hash: string;
}>;

export type AutonomousKnowledgeCertificationValidationResult = Readonly<{
  certification_id: string;
  valid: boolean;
  pass_or_conditional: boolean;
  automatic_failures_absent: boolean;
  deterministic: boolean;
  replayable: boolean;
  governance_enforced: boolean;
  constitutional_enforced: boolean;
  authority_preserved: boolean;
  tenant_isolated: boolean;
  explainability_complete: boolean;
  repository_immutable: boolean;
  ledger_append_only: boolean;
  operator_approval_required: boolean;
  certification_only: true;
  production_authorization_granted: false;
  activation_authorized: false;
  fail_closed: boolean;
  failures: readonly AutonomousKnowledgeCertificationFailure[];
  validation_hash: string;
}>;

export type AutonomousKnowledgeCertificationInput = Readonly<{ scenario?: AutonomousKnowledgeCertificationScenario; record?: AutonomousKnowledgeCertificationRecord }>;

export type AutonomousKnowledgeEvolutionCertificationGateBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "autonomous-knowledge-evolution-certification-gate/v8ALT.9.11";
    final_state: "AUTONOMOUS_KNOWLEDGE_EVOLUTION_CERTIFICATION_READY";
    certification_states: readonly AutonomousKnowledgeCertificationState[];
    principles: readonly string[];
  }>;
  certification: AutonomousKnowledgeCertificationRecord;
  validation: AutonomousKnowledgeCertificationValidationResult;
  dashboard: CertificationDashboard;
}>;
