export type ContinuousCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationState = "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "UNDER_REVIEW" | "RECERTIFICATION_REQUIRED" | "SUSPENDED" | "REVOKED";
export type CertificationTrigger = "PILOT_STARTUP" | "CONFIGURATION_CHANGE" | "DEPLOYMENT_EVENT" | "GOVERNANCE_POLICY_UPDATE" | "REPLAY_COMPLETION" | "EVIDENCE_INGESTION" | "OPERATIONAL_INCIDENT" | "TENANT_ENROLLMENT" | "SCOPE_MODIFICATION" | "OPERATOR_ACTION" | "SCHEDULED_EVALUATION" | "MANUAL_GOVERNANCE_REVIEW";
export type CertificationValidationCategory = "REPLAY_INTEGRITY" | "GOVERNANCE_COMPLIANCE" | "ADVISORY_BOUNDARY" | "TENANT_ISOLATION" | "DEPLOYMENT_INTEGRITY" | "OPERATIONAL_HEALTH" | "CERTIFICATION_EVIDENCE";
export type CertificationValidationStatus = "PASS" | "FAIL";
export type ContinuousCertificationFailure =
  | "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL"
  | "VIOLATIONS_NOT_DETECTED"
  | "EVIDENCE_INCOMPLETE"
  | "CERTIFICATION_DECISIONS_NON_DETERMINISTIC"
  | "CERTIFICATION_HISTORY_MUTABLE"
  | "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED"
  | "ADVISORY_BOUNDARY_NOT_ENFORCED"
  | "TENANT_ISOLATION_NOT_VALIDATED"
  | "REPLAY_INTEGRITY_NOT_VERIFIED"
  | "DEPLOYMENT_INTEGRITY_NOT_VALIDATED"
  | "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"
  | "GOVERNANCE_REVIEW_NOT_INTEGRATED"
  | "FAIL_CLOSED_NOT_VALIDATED"
  | "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED"
  | "PHASE_16_10_EXPANSION_NOT_VALID"
  | "NON_CONSTITUTIONAL_CERTIFICATION_WARNING";
export type ContinuousCertificationScenario = "BASELINE" | ContinuousCertificationFailure;
export type ContinuousCertificationInput = Readonly<{ scenario?: ContinuousCertificationScenario; tenant_id?: string; operator_id?: string; mission_id?: string; pilot_id?: string; scope_version?: string; evaluation_reason?: CertificationTrigger; certification_version?: string }>;

export type ContinuousCertificationEngine = Readonly<{ engine_id: string; cycle_triggers: readonly CertificationTrigger[]; cycles_scheduled: boolean; constitutional_guarantees_evaluated: boolean; certification_evidence_collected: boolean; qualification_drift_detected: boolean; governance_workflows_triggered: boolean; immutable_lineage_preserved: boolean; deterministic: boolean; replayable: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ComplianceValidationResult = Readonly<{ category: CertificationValidationCategory; status: CertificationValidationStatus; checks: readonly string[]; evidence_refs: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type ComplianceValidator = Readonly<{ validator_id: string; results: readonly ComplianceValidationResult[]; governance_policies_valid: boolean; advisory_boundary_valid: boolean; replay_determinism_valid: boolean; deployment_integrity_valid: boolean; tenant_isolation_valid: boolean; evidence_completeness_valid: boolean; operator_authority_valid: boolean; certification_freshness_valid: boolean; operational_readiness_valid: boolean; violations_detected: readonly ContinuousCertificationFailure[]; integrity_hash: string }>;
export type PilotCertificationRecord = Readonly<{ certification_id: string; pilot_id: string; tenant_id: string; scope_version: string; evaluation_time: string; evaluation_reason: CertificationTrigger; certification_state: CertificationState; constitutional_results: readonly string[]; governance_results: readonly string[]; replay_results: readonly string[]; deployment_results: readonly string[]; operational_results: readonly string[]; evidence_refs: readonly string[]; incident_refs: readonly string[]; recommendation_refs: readonly string[]; review_required: boolean; certification_version: string; previous_certification: string | null; integrity_hash: string }>;
export type CertificationLedgerEntry = Readonly<{ ledger_entry_id: string; sequence: number; event_type: "EVIDENCE_COLLECTED" | "COMPLIANCE_VALIDATED" | "CONSTITUTION_EVALUATED" | "STATE_DETERMINED" | "EVIDENCE_RECORDED" | "DASHBOARD_UPDATED" | "GOVERNANCE_NOTIFIED"; certification_refs: readonly string[]; evidence_refs: readonly string[]; governance_refs: readonly string[]; supersedes: string | null; append_only: boolean; immutable: boolean; integrity_hash: string }>;
export type CertificationLedger = Readonly<{ ledger_id: string; records: readonly PilotCertificationRecord[]; entries: readonly CertificationLedgerEntry[]; append_only: boolean; immutable: boolean; supersession_history_preserved: boolean; governance_decisions_recorded: boolean; integrity_hash: string }>;
export type CertificationDashboard = Readonly<{ dashboard_id: string; overall_certification_state: CertificationState; constitutional_health_visible: boolean; replay_status_visible: boolean; advisory_compliance_visible: boolean; tenant_isolation_visible: boolean; deployment_integrity_visible: boolean; evidence_completeness_visible: boolean; operational_health_visible: boolean; active_violations_visible: boolean; historical_trend_visible: boolean; active_violations: readonly ContinuousCertificationFailure[]; certification_trend: readonly CertificationState[]; operational: boolean; integrity_hash: string }>;
export type ContinuousCertificationEvidencePlatform = Readonly<{ platform_ref: string; evidence_platform_reused: boolean; duplicate_evidence_infrastructure_created: boolean; immutable_audit_reused: boolean; lineage_graph_reused: boolean; integrity_validation_reused: boolean; certification_linkage_reused: boolean; tenant_isolation_controls_reused: boolean; integrity_hash: string }>;
export type ContinuousCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: ContinuousCertificationOutcome; passed: boolean; failure_reason: ContinuousCertificationFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type ContinuousCertificationResult = Readonly<{ phase_version: "continuous-certification-during-pilot/v16.11"; phase_identifier: "ContinuousCertificationDuringPilot"; pilot_expansion_governance_ref: string; engine: ContinuousCertificationEngine; compliance_validator: ComplianceValidator; certification_record: PilotCertificationRecord; certification_ledger: CertificationLedger; dashboard: CertificationDashboard; evidence_platform: ContinuousCertificationEvidencePlatform; certification_tests: readonly ContinuousCertificationTest[]; failures: readonly ContinuousCertificationFailure[]; outcome: ContinuousCertificationOutcome; replay_hash: string; integrity_hash: string }>;
export type ContinuousCertificationValidation = Readonly<{ valid: boolean; outcome: ContinuousCertificationOutcome; engine_valid: boolean; compliance_valid: boolean; record_valid: boolean; ledger_valid: boolean; dashboard_valid: boolean; evidence_platform_valid: boolean; certification_valid: boolean; result_replay_valid: boolean; failures: readonly ContinuousCertificationFailure[]; integrity_hash: string }>;
export type ContinuousCertificationBundle = Readonly<{ doctrine: Readonly<{ version: "continuous-certification-during-pilot/v16.11"; upstream_phase: "pilot-expansion-governance/v16.10"; certification_states: readonly CertificationState[]; triggers: readonly CertificationTrigger[]; validation_categories: readonly CertificationValidationCategory[]; certification_outcomes: readonly ContinuousCertificationOutcome[] }>; result: ContinuousCertificationResult; validation: ContinuousCertificationValidation }>;
