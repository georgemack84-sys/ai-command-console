export type Phase16CertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ThresholdStatus = "VERIFIED" | "DEFINED_BUT_UNPOPULATED" | "MISSING";
export type ExpansionAuthorization = "AUTHORIZED" | "CONDITIONALLY_AUTHORIZED" | "PROHIBITED";
export type Phase16CertificationFailure =
  | "PHASE_16_CERTIFICATION_NOT_COMPLETED"
  | "CERTIFICATION_DECISION_NON_DETERMINISTIC"
  | "CERTIFICATION_OUTCOME_NOT_ISSUED"
  | "VP1_NOT_COMPLETE"
  | "VP2_NOT_COMPLETE"
  | "CLASS_A_THRESHOLD_DEFINED_BUT_UNPOPULATED"
  | "CLASS_A_THRESHOLD_MISSING"
  | "EVIDENCE_PLATFORM_NOT_VERIFIED"
  | "UNIFIED_EVIDENCE_LINEAGE_INVALID"
  | "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "EXPANSION_READINESS_NOT_DETERMINED"
  | "CERTIFICATION_LEDGER_MUTABLE"
  | "PLATFORM_NOT_QUALIFIED_FOR_EXPANSION"
  | "ADVISORY_BOUNDARY_VIOLATED"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_NOT_DETERMINISTIC"
  | "UNAUTHORIZED_EXECUTION_AUTHORITY_DETECTED"
  | "PHASE_16_11_CONTINUOUS_CERTIFICATION_NOT_VALID"
  | "NON_CONSTITUTIONAL_GATE_WARNING";
export type Phase16CertificationScenario = "BASELINE" | Phase16CertificationFailure;
export type Phase16CertificationInput = Readonly<{ scenario?: Phase16CertificationScenario; tenant_id?: string; operator_id?: string; mission_id?: string; pilot_id?: string; certification_id?: string; evaluator_version?: string }>;

export type Vp1VerificationReport = Readonly<{ report_id: string; completed: boolean; class_a_thresholds: readonly { threshold_id: string; status: ThresholdStatus; integrity_hash: string }[]; all_required_verified: boolean; blocked: boolean; integrity_hash: string }>;
export type Vp2VerificationReport = Readonly<{ report_id: string; completed: boolean; evidence_infrastructure_verified: boolean; shared_evidence_platform_confirmed: boolean; unified_evidence_lineage_validated: boolean; duplicate_evidence_implementations: boolean; blocked: boolean; integrity_hash: string }>;
export type Phase16CertificationEngine = Readonly<{ engine_id: string; workflow_executed: boolean; prerequisites_verified: boolean; validation_orchestrated: boolean; evidence_aggregated: boolean; outcome_determined: boolean; package_published: boolean; deterministic: boolean; replayable: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type Phase16CertificationDecision = Readonly<{ decision_id: string; outcome: Phase16CertificationOutcome; expansion_authorization: ExpansionAuthorization; corrective_actions: readonly string[]; governance_approved_conditions: boolean; fail_prohibits_expansion: boolean; grants_execution_authority: boolean; deterministic: boolean; replayable: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type Phase16EvidenceValidator = Readonly<{ validator_id: string; evidence_complete: boolean; evidence_integrity_valid: boolean; evidence_lineage_valid: boolean; evidence_fresh: boolean; evidence_versioned: boolean; replay_references_valid: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type Phase16ConstitutionalComplianceReport = Readonly<{ report_id: string; governance_authority_valid: boolean; advisory_boundary_preserved: boolean; tenant_isolation_preserved: boolean; deterministic_replay_valid: boolean; immutable_evidence_valid: boolean; deployment_integrity_valid: boolean; operator_authority_preserved: boolean; certification_integrity_valid: boolean; prior_guarantees_preserved: boolean; integrity_hash: string }>;
export type Phase16ExpansionReadinessAssessment = Readonly<{ assessment_id: string; pilot_maturity: boolean; operational_stability: boolean; governance_effectiveness: boolean; evidence_completeness: boolean; certification_confidence: boolean; expansion_risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"; ready_for_controlled_expansion: boolean; determined: boolean; integrity_hash: string }>;
export type Phase16CertificationLedgerEntry = Readonly<{ ledger_entry_id: string; certification_id: string; certification_timestamp: string; certification_outcome: Phase16CertificationOutcome; evaluator_version: string; evidence_refs: readonly string[]; vp1_status: "PASS" | "FAIL"; vp2_status: "PASS" | "FAIL"; constitutional_validation_ref: string; expansion_authorization: ExpansionAuthorization; audit_refs: readonly string[]; append_only: boolean; immutable: boolean; integrity_hash: string }>;
export type Phase16CertificationReport = Readonly<{ report_id: string; certification_summary: string; decision_ref: string; compliance_ref: string; evidence_ref: string; readiness_ref: string; ledger_ref: string; audit_package_ref: string; integrity_hash: string }>;
export type Phase16CertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: Phase16CertificationOutcome; passed: boolean; failure_reason: Phase16CertificationFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type Phase16CertificationResult = Readonly<{ phase_version: "phase-16-certification-gate/v16.12"; phase_identifier: "Phase16CertificationGate"; continuous_certification_ref: string; engine: Phase16CertificationEngine; vp1_report: Vp1VerificationReport; vp2_report: Vp2VerificationReport; evidence_validator: Phase16EvidenceValidator; constitutional_report: Phase16ConstitutionalComplianceReport; expansion_readiness: Phase16ExpansionReadinessAssessment; decision: Phase16CertificationDecision; ledger_entry: Phase16CertificationLedgerEntry; certification_report: Phase16CertificationReport; certification_tests: readonly Phase16CertificationTest[]; failures: readonly Phase16CertificationFailure[]; outcome: Phase16CertificationOutcome; replay_hash: string; integrity_hash: string }>;
export type Phase16CertificationValidation = Readonly<{ valid: boolean; outcome: Phase16CertificationOutcome; engine_valid: boolean; vp1_valid: boolean; vp2_valid: boolean; evidence_valid: boolean; constitutional_valid: boolean; readiness_valid: boolean; decision_valid: boolean; ledger_valid: boolean; report_valid: boolean; certification_valid: boolean; result_replay_valid: boolean; failures: readonly Phase16CertificationFailure[]; integrity_hash: string }>;
export type Phase16CertificationBundle = Readonly<{ doctrine: Readonly<{ version: "phase-16-certification-gate/v16.12"; upstream_phase: "continuous-certification-during-pilot/v16.11"; outcomes: readonly Phase16CertificationOutcome[]; expansion_authorizations: readonly ExpansionAuthorization[]; certification_matrix_size: 25 }>; result: Phase16CertificationResult; validation: Phase16CertificationValidation }>;
