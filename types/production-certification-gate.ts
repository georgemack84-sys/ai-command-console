export type ProductionCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ProductionCertificationLifecycleState = "CERTIFICATION_REQUESTED" | "EVIDENCE_COLLECTION" | "EVIDENCE_VALIDATED" | "QUALIFICATION_VALIDATION" | "COMPLIANCE_VALIDATION" | "READINESS_VALIDATION" | "DECISION_PENDING" | "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ProductionCertificationFailure = "PHASE_14_CERTIFICATION_INVALID" | "RELEASE_ARTIFACT_MISMATCH" | "BUILD_PROVENANCE_INCOMPLETE" | "PRODUCTION_ENVIRONMENT_NOT_QUALIFIED" | "PROMOTION_AUTHORITY_NOT_ENFORCED" | "ADVISORY_ONLY_BOUNDARY_NOT_ENFORCED" | "DIRECT_EXECUTION_POSSIBLE" | "TENANT_ISOLATION_NOT_CONTINUOUSLY_VERIFIED" | "CANARY_EXPOSURE_POLICIES_NOT_ENFORCED" | "PRODUCTION_REPLAY_NON_DETERMINISTIC" | "UNEXPLAINED_DIVERGENCE_NOT_FAIL_CLOSED" | "ROLLBACK_NOT_VALIDATED" | "INCIDENT_EVIDENCE_MUTABLE" | "RECOVERY_REQUALIFICATION_NOT_REQUIRED" | "CONTINUOUS_ASSURANCE_NOT_OPERATIONAL" | "CERTIFICATION_FRESHNESS_NOT_ENFORCED" | "OPERATOR_ACTIONS_NOT_ATTRIBUTABLE" | "OBSERVABILITY_INCOMPLETE" | "CERTIFICATION_EVIDENCE_INCOMPLETE" | "CERTIFICATION_REPLAY_NON_DETERMINISTIC" | "CERTIFICATION_LEDGER_MUTABLE" | "NON_CONSTITUTIONAL_PRODUCTION_CERTIFICATION_WARNING";
export type ProductionCertificationScenario = "BASELINE" | ProductionCertificationFailure;

export type ProductionCertificationInput = Readonly<{ scenario?: ProductionCertificationScenario; release_id?: string; operator_id?: string; tenant_id?: string }>;

export type ProductionCertificationContract = Readonly<{
  contract_version: "production-certification-gate/v15.12";
  certification_authority: "CONSTITUTIONAL_PRODUCTION_CERTIFICATION_GATE";
  lifecycle: readonly ProductionCertificationLifecycleState[];
  evidence_requirements: readonly string[];
  evaluation_order: readonly string[];
  replay_required: boolean;
  governance_required: boolean;
  operator_accountability_required: boolean;
  advisory_only: boolean;
  fail_closed: boolean;
  immutable_requirements: boolean;
  integrity_hash: string;
}>;

export type ProductionCertificationEvidence = Readonly<{
  evidence_id: string;
  phase14_certification_ref: string;
  release_evidence_ref: string;
  deployment_evidence_ref: string;
  environment_evidence_ref: string;
  replay_evidence_ref: string;
  rollback_evidence_ref: string;
  tenant_isolation_evidence_ref: string;
  observability_evidence_ref: string;
  governance_evidence_ref: string;
  assurance_evidence_ref: string;
  complete: boolean;
  integrity_verified: boolean;
  freshness_verified: boolean;
  signatures_verified: boolean;
  lineage_complete: boolean;
  cryptographic_identity_verified: boolean;
  integrity_hash: string;
}>;

export type ProductionQualificationValidationRecord = Readonly<{
  validation_id: string;
  certified_artifacts_valid: boolean;
  production_environment_qualified: boolean;
  deployment_lineage_valid: boolean;
  release_identity_valid: boolean;
  replay_ready: boolean;
  rollback_ready: boolean;
  recovery_ready: boolean;
  production_monitoring_ready: boolean;
  dependencies_satisfied: boolean;
  integrity_hash: string;
}>;

export type ProductionComplianceValidationRecord = Readonly<{
  compliance_id: string;
  advisory_only_operation: boolean;
  authority_separation: boolean;
  governance_supremacy: boolean;
  operator_supremacy: boolean;
  tenant_isolation: boolean;
  deterministic_replay: boolean;
  immutable_lineage: boolean;
  continuous_certification: boolean;
  direct_execution_capability_absent: boolean;
  governance_bypass_absent: boolean;
  unexplained_replay_divergence_absent: boolean;
  certification_tampering_absent: boolean;
  integrity_hash: string;
}>;

export type ProductionReadinessValidationRecord = Readonly<{
  readiness_id: string;
  production_dashboards_ready: boolean;
  operator_controls_ready: boolean;
  alerts_ready: boolean;
  runbooks_ready: boolean;
  rollback_procedures_ready: boolean;
  incident_response_ready: boolean;
  continuous_assurance_ready: boolean;
  certification_monitoring_ready: boolean;
  recovery_verified: boolean;
  integrity_hash: string;
}>;

export type ProductionCertificationDecisionRecord = Readonly<{
  decision_id: string;
  outcome: ProductionCertificationOutcome;
  evidence_package_refs: readonly string[];
  deterministic: boolean;
  replay_reproducible: boolean;
  equivalent_evidence_same_outcome: boolean;
  manual_override_alters_evidence: false;
  governance_decisions_replayable: boolean;
  restrictions: readonly string[];
  integrity_hash: string;
}>;

export type FinalProductionCertificationRecord = Readonly<{
  certification_id: string;
  release_id: string;
  artifact_id: string;
  environment_id: string;
  phase14_certification_ref: string;
  qualification_refs: readonly string[];
  replay_refs: readonly string[];
  assurance_refs: readonly string[];
  governance_refs: readonly string[];
  operator_approval_refs: readonly string[];
  certification_outcome: ProductionCertificationOutcome;
  restrictions: readonly string[];
  certification_timestamp: string;
  supersedes_certification_ref: string | null;
  integrity_hash: string;
}>;

export type ProductionCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "CERTIFICATION_REQUEST" | "EVIDENCE" | "OUTCOME" | "OPERATOR_APPROVAL" | "GOVERNANCE_REVIEW" | "REPLAY_REFERENCE" | "SUPERSESSION" | "RECERTIFICATION_EVENT";
  sequence: number;
  certification_id: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  permanently_visible: boolean;
  integrity_hash: string;
}>;

export type ProductionCertificationReplayRecord = Readonly<{
  replay_id: string;
  inputs_replayed: boolean;
  evaluation_order_replayed: boolean;
  evidence_integrity_replayed: boolean;
  decision_reproduced: boolean;
  outcome_consistent: boolean;
  deterministic: boolean;
  unexplained_differences_absent: boolean;
  integrity_hash: string;
}>;

export type ProductionCertificationObservabilityRecord = Readonly<{
  observability_id: string;
  certification_status_visible: boolean;
  qualification_status_visible: boolean;
  evidence_freshness_visible: boolean;
  replay_health_visible: boolean;
  rollback_readiness_visible: boolean;
  assurance_health_visible: boolean;
  incidents_visible: boolean;
  operator_approvals_visible: boolean;
  governance_reviews_visible: boolean;
  alerts_operational: boolean;
  integrity_hash: string;
}>;

export type ProductionCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProductionCertificationOutcome;
  passed: boolean;
  failure_reason: ProductionCertificationFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionCertificationGateResult = Readonly<{
  phase_version: "production-certification-gate/v15.12";
  phase_identifier: "ProductionCertificationGate";
  observability_ref: string;
  contract: ProductionCertificationContract;
  evidence: ProductionCertificationEvidence;
  qualification: ProductionQualificationValidationRecord;
  compliance: ProductionComplianceValidationRecord;
  readiness: ProductionReadinessValidationRecord;
  decision: ProductionCertificationDecisionRecord;
  certification_record: FinalProductionCertificationRecord;
  ledger: readonly ProductionCertificationLedgerEntry[];
  replay: ProductionCertificationReplayRecord;
  observability: ProductionCertificationObservabilityRecord;
  certification_tests: readonly ProductionCertificationTest[];
  failures: readonly ProductionCertificationFailure[];
  outcome: ProductionCertificationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionCertificationGateValidation = Readonly<{
  valid: boolean;
  outcome: ProductionCertificationOutcome;
  contract_valid: boolean;
  evidence_valid: boolean;
  qualification_valid: boolean;
  compliance_valid: boolean;
  readiness_valid: boolean;
  decision_valid: boolean;
  record_valid: boolean;
  ledger_valid: boolean;
  replay_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly ProductionCertificationFailure[];
  integrity_hash: string;
}>;

export type ProductionCertificationGateBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-certification-gate/v15.12";
    upstream_phase: "production-observability-operator-control/v15.11";
    lifecycle: readonly ProductionCertificationLifecycleState[];
    evidence_requirements: readonly string[];
    certification_outcomes: readonly ProductionCertificationOutcome[];
  }>;
  result: ProductionCertificationGateResult;
  validation: ProductionCertificationGateValidation;
}>;
