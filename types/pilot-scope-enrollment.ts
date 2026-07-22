export type PilotScopeEnrollmentOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type PilotEnrollmentLifecycleState = "SCOPE_DEFINED" | "QUALIFICATION_PENDING" | "TENANT_QUALIFIED" | "OPERATOR_APPROVED" | "CAPABILITIES_APPROVED" | "ENVIRONMENT_APPROVED" | "DATASET_APPROVED" | "ENROLLMENT_APPROVED" | "ACTIVE" | "SUSPENDED" | "REVOKED" | "COMPLETED";
export type TenantQualificationOutcome = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "REQUIRES_REVIEW" | "NOT_QUALIFIED";
export type EnrollmentOutcome = "APPROVED" | "CONDITIONALLY_APPROVED" | "REJECTED" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_RECERTIFICATION" | "SUSPENDED" | "REVOKED";
export type PilotScopeEnrollmentFailure = "SCOPE_NOT_GOVERNED" | "SCOPE_NOT_VERSIONED" | "ENROLLMENT_NOT_REPRODUCIBLE" | "TENANT_QUALIFICATION_INCOMPLETE" | "OPERATOR_QUALIFICATION_INCOMPLETE" | "CAPABILITY_ENROLLMENT_NOT_GOVERNED" | "ENVIRONMENT_QUALIFICATION_NOT_VERIFIED" | "DATASET_APPROVAL_NOT_GOVERNED" | "ENROLLMENT_LINEAGE_MUTABLE" | "GOVERNANCE_APPROVALS_NOT_REPLAYABLE" | "UNAUTHORIZED_ENROLLMENT_POSSIBLE" | "UNQUALIFIED_TENANT_ENROLLED" | "SCOPE_EXPANSION_WITHOUT_GOVERNANCE" | "QUALIFICATION_EVIDENCE_MUTABLE" | "REVOKED_ENROLLMENT_NOT_REPLAYABLE" | "PHASE_16_1_GOVERNANCE_NOT_VALID" | "NON_CONSTITUTIONAL_ENROLLMENT_WARNING";
export type PilotScopeEnrollmentScenario = "BASELINE" | PilotScopeEnrollmentFailure;

export type PilotScopeEnrollmentInput = Readonly<{ scenario?: PilotScopeEnrollmentScenario; pilot_id?: string; tenant_id?: string; operator_id?: string; scope_version?: string }>;

export type PilotScopeRegistryRecord = Readonly<{
  scope_id: string;
  pilot_id: string;
  scope_version: string;
  participating_tenants: readonly string[];
  approved_operators: readonly string[];
  approved_capabilities: readonly string[];
  datasets: readonly string[];
  environments: readonly string[];
  governance_refs: readonly string[];
  certification_refs: readonly string[];
  effective_period: Readonly<{ starts_at: string; ends_at: string | null }>;
  governed: boolean;
  immutable: boolean;
  current: boolean;
  integrity_hash: string;
}>;

export type TenantQualificationRecord = Readonly<{
  qualification_id: string;
  tenant_id: string;
  identity_validated: boolean;
  certification_status: "CURRENT" | "EXPIRED" | "MISSING";
  governance_compliance: boolean;
  isolation_readiness: boolean;
  evidence_completeness: boolean;
  operational_readiness: boolean;
  advisory_boundary_compliance: boolean;
  outcome: TenantQualificationOutcome;
  evidence_refs: readonly string[];
  evidence_immutable: boolean;
  integrity_hash: string;
}>;

export type OperatorQualificationRecord = Readonly<{
  operator_id: string;
  approval_authority: string;
  certification_ref: string;
  operational_role: string;
  permissions: readonly string[];
  governance_approvals: readonly string[];
  audit_required: boolean;
  approved: boolean;
  integrity_hash: string;
}>;

export type CapabilityEnrollmentRecord = Readonly<{
  capability_id: string;
  activation_status: "ENABLED" | "DISABLED" | "SUSPENDED";
  governance_approval_ref: string;
  certification_dependency_ref: string;
  rollout_restrictions: readonly string[];
  governed: boolean;
  integrity_hash: string;
}>;

export type DatasetRegistryRecord = Readonly<{
  dataset_id: string;
  version: string;
  lineage_refs: readonly string[];
  approval_status: "APPROVED" | "REJECTED" | "REQUIRES_REVIEW";
  governance_classification: "PILOT_PRODUCTION" | "RESTRICTED" | "CONSTITUTIONAL";
  tenant_owner: string;
  evidence_refs: readonly string[];
  governed: boolean;
  integrity_hash: string;
}>;

export type EnvironmentEnrollmentRecord = Readonly<{
  environment_id: string;
  certification_refs: readonly string[];
  deployment_status: "APPROVED" | "BLOCKED" | "SUSPENDED";
  configuration_version: string;
  qualification_history: readonly string[];
  qualification_verified: boolean;
  integrity_hash: string;
}>;

export type ScopeVersionRecord = Readonly<{
  scope_id: string;
  version: string;
  predecessor: string | null;
  successor: string | null;
  governance_approval_ref: string;
  effective_timestamp: string;
  change_summary: string;
  immutable: boolean;
  expansion_governed: boolean;
  reduction_history_preserved: boolean;
  integrity_hash: string;
}>;

export type EnrollmentWorkflowRecord = Readonly<{
  workflow_id: string;
  stages: readonly PilotEnrollmentLifecycleState[];
  current_state: PilotEnrollmentLifecycleState;
  outcome: EnrollmentOutcome;
  deterministic: boolean;
  qualification_bypass_blocked: boolean;
  unauthorized_expansion_blocked: boolean;
  evidence_refs: readonly string[];
  approval_refs: readonly string[];
  replay_hash: string;
  integrity_hash: string;
}>;

export type PilotEnrollmentLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "ENROLLMENT_REQUEST" | "TENANT_QUALIFICATION" | "OPERATOR_APPROVAL" | "CAPABILITY_APPROVAL" | "ENVIRONMENT_APPROVAL" | "DATASET_APPROVAL" | "GOVERNANCE_DECISION" | "SCOPE_VERSION" | "ENROLLMENT_ACTIVE" | "REVOCATION_REPLAY";
  scope_version: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ScopeLineageRecord = Readonly<{
  lineage_id: string;
  scope_versions: readonly string[];
  enrollment_events: readonly string[];
  governance_approvals: readonly string[];
  certification_refs: readonly string[];
  tenant_participation: readonly string[];
  operator_participation: readonly string[];
  capability_evolution: readonly string[];
  complete: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type PilotScopeEnrollmentCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: PilotScopeEnrollmentOutcome;
  passed: boolean;
  failure_reason: PilotScopeEnrollmentFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PilotScopeEnrollmentResult = Readonly<{
  phase_version: "pilot-scope-enrollment/v16.2";
  phase_identifier: "PilotScopeEnrollment";
  pilot_governance_ref: string;
  lifecycle: readonly PilotEnrollmentLifecycleState[];
  scope: PilotScopeRegistryRecord;
  scope_version: ScopeVersionRecord;
  tenant_qualification: TenantQualificationRecord;
  operator_qualification: OperatorQualificationRecord;
  capabilities: readonly CapabilityEnrollmentRecord[];
  datasets: readonly DatasetRegistryRecord[];
  environments: readonly EnvironmentEnrollmentRecord[];
  workflow: EnrollmentWorkflowRecord;
  ledger: readonly PilotEnrollmentLedgerEntry[];
  lineage: ScopeLineageRecord;
  certification_tests: readonly PilotScopeEnrollmentCertificationTest[];
  failures: readonly PilotScopeEnrollmentFailure[];
  outcome: PilotScopeEnrollmentOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PilotScopeEnrollmentValidation = Readonly<{
  valid: boolean;
  outcome: PilotScopeEnrollmentOutcome;
  scope_valid: boolean;
  version_valid: boolean;
  tenant_valid: boolean;
  operator_valid: boolean;
  capability_valid: boolean;
  dataset_valid: boolean;
  environment_valid: boolean;
  workflow_valid: boolean;
  ledger_valid: boolean;
  lineage_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly PilotScopeEnrollmentFailure[];
  integrity_hash: string;
}>;

export type PilotScopeEnrollmentBundle = Readonly<{
  doctrine: Readonly<{
    version: "pilot-scope-enrollment/v16.2";
    upstream_phase: "pilot-governance-foundation/v16.1";
    lifecycle: readonly PilotEnrollmentLifecycleState[];
    qualification_outcomes: readonly TenantQualificationOutcome[];
    enrollment_outcomes: readonly EnrollmentOutcome[];
    certification_outcomes: readonly PilotScopeEnrollmentOutcome[];
  }>;
  result: PilotScopeEnrollmentResult;
  validation: PilotScopeEnrollmentValidation;
}>;
