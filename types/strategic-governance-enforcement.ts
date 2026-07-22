export type StrategicGovernanceStatus = "PASS" | "FAIL";
export type GovernanceValidationOutcome = "APPROVED" | "CONDITIONALLY_APPROVED" | "REQUIRES_REVIEW" | "REJECTED";
export type SecurityValidationOutcome = "VERIFIED" | "WARNING" | "REQUIRES_INVESTIGATION" | "BLOCKED";
export type GovernanceState =
  | "PENDING"
  | "CONSTITUTION_VALIDATED"
  | "GOVERNANCE_APPROVED"
  | "AUTHORITY_RESOLVED"
  | "EVIDENCE_QUALIFIED"
  | "TRUST_QUALIFIED"
  | "TENANT_VALIDATED"
  | "SECURITY_VALIDATED"
  | "RESTRICTED_INFORMATION_VALIDATED"
  | "ELIGIBLE_FOR_RECOMMENDATION"
  | "COMPLETE"
  | "FAILED_CLOSED";
export type GovernanceFailureReason =
  | "CONSTITUTIONAL_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "AUTHORITY_FAILURE"
  | "POLICY_FAILURE"
  | "EVIDENCE_FAILURE"
  | "TRUST_FAILURE"
  | "TENANT_FAILURE"
  | "SECURITY_FAILURE"
  | "REPLAY_FAILURE"
  | "INTEGRITY_FAILURE"
  | "UNKNOWN_FAILURE";
export type StrategicGovernanceFailure =
  | GovernanceFailureReason
  | "OPERATOR_SUPREMACY_FAILURE"
  | "RESTRICTED_DATA_FAILURE"
  | "LEDGER_FAILURE"
  | "FAIL_CLOSED_FAILURE";
export type StrategicGovernanceScenario = "BASELINE" | StrategicGovernanceFailure;
export type StrategicGovernanceInput = Readonly<{ scenario?: StrategicGovernanceScenario; tenant_id?: string }>;

export type ConstitutionalValidationReport = Readonly<{ report_id: string; advisory_only: boolean; operator_supremacy: boolean; governance_supremacy: boolean; tenant_isolation: boolean; evidence_required: boolean; trust_required: boolean; deterministic_replay: boolean; immutable_lineage: boolean; immutable_audit_history: boolean; authority_boundaries: boolean; approved: boolean; violations: readonly string[]; integrity_hash: string }>;
export type GovernanceValidationReport = Readonly<{ report_id: string; outcome: GovernanceValidationOutcome; policies_resolved: boolean; approvals_present: boolean; review_complete: boolean; constitutional_approval: boolean; organizational_approval: boolean; regulatory_approval: boolean; delegated_authority_valid: boolean; escalation_required: boolean; integrity_hash: string }>;
export type AuthorityResolutionReport = Readonly<{ report_id: string; permitted_actions: readonly string[]; prohibited_actions: readonly string[]; advisory_only: boolean; operator_may_override: boolean; authority_ceiling: "ADVISORY_ONLY"; execution_authority_granted: boolean; mutation_authority_granted: boolean; boundaries_valid: boolean; integrity_hash: string }>;
export type OperatorAuthorityReport = Readonly<{ report_id: string; operator_supremacy_preserved: boolean; overrides_visible: boolean; review_bypass_prevented: boolean; auto_approval_prevented: boolean; execution_prevented: boolean; override_ledger_refs: readonly string[]; integrity_hash: string }>;
export type EvidenceQualificationReport = Readonly<{ report_id: string; complete: boolean; provenance_valid: boolean; authenticity_valid: boolean; freshness_valid: boolean; integrity_valid: boolean; qualified: boolean; replay_available: boolean; sufficiency_score: number; rejected_reasons: readonly string[]; integrity_hash: string }>;
export type TrustQualificationReport = Readonly<{ report_id: string; source_trust: number; evidence_trust: number; historical_reliability: number; governance_confidence: number; certification_status: "CERTIFIED" | "REQUIRES_REVIEW"; replay_success: boolean; integrity_verified: boolean; restrictions: readonly string[]; execution_authority_granted: false; qualified: boolean; integrity_hash: string }>;
export type TenantIsolationReport = Readonly<{ report_id: string; tenant_id: string; strategies_isolated: boolean; forecasts_isolated: boolean; scenarios_isolated: boolean; observations_isolated: boolean; recommendations_isolated: boolean; portfolios_isolated: boolean; evidence_isolated: boolean; policies_isolated: boolean; lineage_isolated: boolean; replay_isolated: boolean; cross_tenant_access_detected: boolean; integrity_hash: string }>;
export type RestrictedDataReport = Readonly<{ report_id: string; classification_resolved: boolean; role_filtering_applied: boolean; attribute_filtering_applied: boolean; fields_masked: readonly string[]; derived_views_filtered: boolean; explainability_filtered: boolean; replay_filtered: boolean; unauthorized_disclosure_prevented: boolean; integrity_hash: string }>;
export type SecurityValidationReport = Readonly<{ report_id: string; outcome: SecurityValidationOutcome; artifact_integrity_valid: boolean; origins_valid: boolean; lineage_valid: boolean; policy_binding_valid: boolean; replay_integrity_valid: boolean; mutation_absent: boolean; references_valid: boolean; hashes_valid: boolean; signatures_valid: boolean; registry_consistent: boolean; incidents: readonly string[]; integrity_hash: string }>;
export type FailClosedReport = Readonly<{ report_id: string; mandatory_gates_satisfied: boolean; state: GovernanceState; failure_reason: StrategicGovernanceFailure | null; generation_allowed: boolean; comparison_completion_allowed: boolean; recommendation_issuance_allowed: boolean; replay_allowed: boolean; observation_closure_allowed: boolean; archival_progression_allowed: boolean; recovery_recommendation: string; integrity_hash: string }>;
export type GovernanceEnforcementLedgerEntry = Readonly<{ enforcement_id: string; recommendation_cycle_id: string; artifact_ref: string; validation_stage: GovernanceState; validation_type: string; policy_manifest_ref: string; governance_refs: readonly string[]; authority_resolution: "ADVISORY_ONLY" | "FAILED"; evidence_status: "QUALIFIED" | "REJECTED"; trust_status: "QUALIFIED" | "RESTRICTED"; tenant_status: "ISOLATED" | "FAILED"; security_status: SecurityValidationOutcome; restricted_information_status: "PROTECTED" | "FAILED"; enforcement_outcome: "ALLOW_ADVISORY" | "FAILED_CLOSED"; failure_reason: StrategicGovernanceFailure | null; operator_actions: readonly string[]; replay_ref: string; timestamp: string; integrity_hash: string }>;
export type GovernanceEnforcementLedger = Readonly<{ ledger_id: string; entries: readonly GovernanceEnforcementLedgerEntry[]; append_only: boolean; hash_linked: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type StrategicGovernanceCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: StrategicGovernanceFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type StrategicGovernanceCertification = Readonly<{ certification_id: string; status: StrategicGovernanceStatus; certified: boolean; failures: readonly StrategicGovernanceFailure[]; tests: readonly StrategicGovernanceCertificationTest[]; integrity_hash: string }>;
export type StrategicGovernanceObservability = Readonly<{ report_id: string; state: GovernanceState; failed_closed: boolean; security_incidents: number; restrictions_applied: number; ledger_entries: number; observable: boolean; integrity_hash: string }>;

export type StrategicGovernanceResult = Readonly<{ phase_version: "strategic-governance-enforcement/v12.12"; phase_identifier: "StrategicGovernanceEnforcement"; constitution: ConstitutionalValidationReport; governance: GovernanceValidationReport; authority: AuthorityResolutionReport; operator: OperatorAuthorityReport; evidence: EvidenceQualificationReport; trust: TrustQualificationReport; tenant: TenantIsolationReport; restricted_data: RestrictedDataReport; security: SecurityValidationReport; fail_closed: FailClosedReport; ledger: GovernanceEnforcementLedger; observability: StrategicGovernanceObservability; certification: StrategicGovernanceCertification; replay_hash: string; integrity_hash: string }>;
export type StrategicGovernanceValidation = Readonly<{ valid: boolean; status: StrategicGovernanceStatus; certified: boolean; failures: readonly StrategicGovernanceFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; fail_closed_valid: boolean; ledger_valid: boolean; validation_hash: string }>;
export type StrategicGovernanceContractBundle = Readonly<{ doctrine: Readonly<{ version: "strategic-governance-enforcement/v12.12"; constitutional_validation_required: true; advisory_only_authority: true; operator_supremacy_required: true; evidence_qualification_required: true; trust_qualification_required: true; tenant_isolation_required: true; restricted_data_protection_required: true; security_validation_required: true; deterministic_fail_closed_required: true }>; result: StrategicGovernanceResult; validation: StrategicGovernanceValidation }>;
