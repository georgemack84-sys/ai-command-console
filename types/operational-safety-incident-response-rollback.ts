export type OperationalSafetyOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type OperationalSafetyLifecycleState = "INCIDENT_DETECTED" | "CLASSIFIED" | "CONTAINMENT_REQUIRED" | "CONTAINMENT_ACTIVE" | "FORENSICS_CAPTURED" | "ROOT_CAUSE_IDENTIFIED" | "REMEDIATION_IMPLEMENTED" | "RECOVERY_QUALIFICATION" | "FAILED" | "PRODUCTION_RESTORED" | "INCIDENT_CLOSED";
export type OperationalSafetySeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CONSTITUTIONAL";
export type OperationalIncidentCategory = "SAFETY_INCIDENT" | "GOVERNANCE_INCIDENT" | "SECURITY_INCIDENT" | "CONFIGURATION_INCIDENT" | "DEPLOYMENT_INCIDENT" | "MODEL_INCIDENT" | "REPLAY_INCIDENT" | "TENANT_ISOLATION_INCIDENT" | "DATA_INTEGRITY_INCIDENT" | "CERTIFICATION_INCIDENT" | "UNKNOWN_INCIDENT";
export type OperationalResponse = "MONITOR" | "RESTRICT_SCOPE" | "FREEZE_PROMOTION" | "DISABLE_CAPABILITY" | "ISOLATE_TENANT" | "REVOKE_RELEASE" | "ROLLBACK" | "FAIL_CLOSED" | "REQUIRE_GOVERNANCE_REVIEW" | "REQUIRE_RECERTIFICATION";
export type OperationalSafetyFailure = "INCIDENT_LIFECYCLE_NON_DETERMINISTIC" | "INCIDENT_CLASSIFICATION_NOT_REPRODUCIBLE" | "CONTAINMENT_RESPONSE_NON_DETERMINISTIC" | "EQUIVALENT_INCIDENTS_DIFFER" | "UNKNOWN_INCIDENT_NOT_FAIL_CLOSED" | "RESPONSE_VOCABULARY_NOT_ENFORCED" | "ROLLBACK_RECOMMENDATION_EXECUTES" | "ROLLBACK_NOT_INDEPENDENTLY_AUTHORIZED" | "ROLLBACK_REPLAY_NON_DETERMINISTIC" | "ROLLBACK_EVIDENCE_NOT_PRESERVED" | "FORENSIC_EVIDENCE_MUTABLE" | "FORENSIC_INTEGRITY_NOT_VERIFIED" | "INCIDENT_LINEAGE_INCOMPLETE" | "REMEDIATION_REWRITES_HISTORY" | "RECOVERY_QUALIFICATION_NOT_MANDATORY" | "UNQUALIFIED_RECOVERY_ALLOWED" | "CERTIFICATION_DEPENDENCIES_NOT_VALIDATED" | "GOVERNANCE_REVIEW_NOT_ENFORCED" | "TENANT_CONTAINMENT_NON_DETERMINISTIC" | "CONSTITUTIONAL_AUTHORITY_NOT_PRESERVED" | "ADVISORY_BOUNDARY_BROKEN" | "SAFETY_LEDGER_NOT_APPEND_ONLY" | "REPLAY_REFERENCES_LOST" | "CERTIFICATION_LINEAGE_LOST" | "NON_CONSTITUTIONAL_SAFETY_WARNING";
export type OperationalSafetyScenario = "BASELINE" | OperationalSafetyFailure;

export type OperationalSafetyInput = Readonly<{ scenario?: OperationalSafetyScenario; incident_id?: string; tenant_id?: string }>;

export type OperationalSafetyContract = Readonly<{
  contract_version: "operational-safety-incident-response-rollback/v15.9";
  lifecycle: readonly OperationalSafetyLifecycleState[];
  response_vocabulary: readonly OperationalResponse[];
  safety_before_availability: boolean;
  deterministic_containment_required: boolean;
  advisory_boundary_required: boolean;
  independent_authority_required: boolean;
  qualified_recovery_required: boolean;
  immutable_history_required: boolean;
  integrity_hash: string;
}>;

export type ProductionIncidentRecord = Readonly<{
  incident_id: string;
  category: OperationalIncidentCategory;
  severity: OperationalSafetySeverity;
  affected_release_refs: readonly string[];
  affected_tenants: readonly string[];
  affected_environments: readonly string[];
  evidence_refs: readonly string[];
  containment_status: "NOT_REQUIRED" | "REQUIRED" | "ACTIVE";
  rollback_status: "NOT_REQUIRED" | "RECOMMENDED" | "AUTHORIZED_REFERENCE_RECORDED";
  owner_ref: string;
  deterministic_state: boolean;
  integrity_hash: string;
}>;

export type IncidentClassificationRecord = Readonly<{
  classification_id: string;
  category: OperationalIncidentCategory;
  severity: OperationalSafetySeverity;
  constitutional_impact: boolean;
  tenant_impact: boolean;
  replay_impact: boolean;
  production_scope: "TENANT" | "RELEASE" | "ENVIRONMENT" | "GLOBAL";
  rollback_eligible: boolean;
  unknown_incident_fail_closed: boolean;
  reproducible: boolean;
  integrity_hash: string;
}>;

export type ContainmentDecisionRecord = Readonly<{
  containment_id: string;
  response: OperationalResponse;
  equivalent_incident_response_hash: string;
  deterministic: boolean;
  equivalent_incidents_identical: boolean;
  mandatory_constitutional_containment_weakened: false;
  tenant_containment_deterministic: boolean;
  authority_preserved: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RollbackRecommendationRecord = Readonly<{
  rollback_id: string;
  recommendation: "ROLLBACK_RECOMMENDED" | "NO_ROLLBACK_REQUIRED";
  advisory_only: boolean;
  independent_authorization_required: boolean;
  authorized_execution_ref: string;
  replay_deterministic: boolean;
  evidence_preserved: boolean;
  supported_scopes: readonly ("release" | "capability" | "configuration" | "tenant" | "environment")[];
  integrity_hash: string;
}>;

export type ForensicEvidenceRecord = Readonly<{
  forensic_id: string;
  production_state_ref: string;
  configuration_ref: string;
  input_ref: string;
  output_ref: string;
  telemetry_ref: string;
  governance_decision_ref: string;
  deployment_state_ref: string;
  replay_refs: readonly string[];
  captured_before_remediation: boolean;
  immutable: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RecoveryQualificationRecord = Readonly<{
  recovery_id: string;
  remediation_complete: boolean;
  replay_successful: boolean;
  divergence_resolved: boolean;
  governance_satisfied: boolean;
  production_safety_restored: boolean;
  certification_current: boolean;
  recovery_qualified: boolean;
  unqualified_recovery_blocked: boolean;
  certification_dependencies_validated: boolean;
  integrity_hash: string;
}>;

export type IncidentLineageRecord = Readonly<{
  lineage_id: string;
  incident_refs: readonly string[];
  containment_refs: readonly string[];
  rollback_refs: readonly string[];
  remediation_refs: readonly string[];
  qualification_refs: readonly string[];
  certification_refs: readonly string[];
  replay_refs: readonly string[];
  supersession_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  searchable_after_recovery: boolean;
  integrity_hash: string;
}>;

export type OperationalSafetyGovernanceRecord = Readonly<{
  governance_id: string;
  governance_review_enforced: boolean;
  authority_separation_verified: boolean;
  constitutional_compliance: boolean;
  approval_integrity: boolean;
  escalation_reproducible: boolean;
  advisory_boundary_maintained: boolean;
  integrity_hash: string;
}>;

export type OperationalSafetyLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "INCIDENT" | "CONTAINMENT_DECISION" | "ROLLBACK_RECOMMENDATION" | "AUTHORIZED_ROLLBACK_REFERENCE" | "FORENSIC_EVIDENCE" | "GOVERNANCE_REVIEW" | "RECOVERY_QUALIFICATION" | "CERTIFICATION_REFERENCE";
  sequence: number;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type OperationalSafetyCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: OperationalSafetyOutcome;
  passed: boolean;
  failure_reason: OperationalSafetyFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalSafetyResult = Readonly<{
  phase_version: "operational-safety-incident-response-rollback/v15.9";
  phase_identifier: "OperationalSafetyIncidentResponseRollback";
  production_replay_ref: string;
  contract: OperationalSafetyContract;
  incident: ProductionIncidentRecord;
  classification: IncidentClassificationRecord;
  containment: ContainmentDecisionRecord;
  rollback: RollbackRecommendationRecord;
  forensics: ForensicEvidenceRecord;
  recovery: RecoveryQualificationRecord;
  lineage: IncidentLineageRecord;
  governance: OperationalSafetyGovernanceRecord;
  ledger: readonly OperationalSafetyLedgerEntry[];
  certification_tests: readonly OperationalSafetyCertificationTest[];
  failures: readonly OperationalSafetyFailure[];
  outcome: OperationalSafetyOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OperationalSafetyValidation = Readonly<{
  valid: boolean;
  outcome: OperationalSafetyOutcome;
  contract_valid: boolean;
  incident_valid: boolean;
  classification_valid: boolean;
  containment_valid: boolean;
  rollback_valid: boolean;
  forensics_valid: boolean;
  recovery_valid: boolean;
  lineage_valid: boolean;
  governance_valid: boolean;
  ledger_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly OperationalSafetyFailure[];
  integrity_hash: string;
}>;

export type OperationalSafetyBundle = Readonly<{
  doctrine: Readonly<{
    version: "operational-safety-incident-response-rollback/v15.9";
    upstream_phase: "production-replay-digital-twin-validation/v15.8";
    lifecycle: readonly OperationalSafetyLifecycleState[];
    severities: readonly OperationalSafetySeverity[];
    categories: readonly OperationalIncidentCategory[];
    response_vocabulary: readonly OperationalResponse[];
    certification_outcomes: readonly OperationalSafetyOutcome[];
  }>;
  result: OperationalSafetyResult;
  validation: OperationalSafetyValidation;
}>;
