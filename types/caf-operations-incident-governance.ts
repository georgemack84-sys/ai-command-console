export type OperationalSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type IncidentLifecycleState = "DETECTED" | "CLASSIFIED" | "ACKNOWLEDGED" | "UNDER_INVESTIGATION" | "CONTAINED" | "RECOVERY_IN_PROGRESS" | "VALIDATING" | "RESOLVED" | "CLOSED";
export type RecoveryLifecycleState = "REQUESTED" | "VALIDATED" | "APPROVED" | "EXECUTING" | "VERIFYING" | "COMPLETED" | "FAILED" | "ESCALATED";
export type RecoveryStrategy = "RESTART" | "RETRY" | "ROLLBACK" | "REPLAY_RESTORE" | "STATE_RESTORE" | "ISOLATE_AGENT" | "DISABLE_AGENT" | "MANUAL_RECOVERY";
export type OperationsCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type OperationsIncidentGovernanceFailure =
  | "P3_1_AGENT_IDENTITY_INVALID"
  | "P3_3_RUNTIME_INVALID"
  | "P3_7_GOVERNANCE_INVALID"
  | "P3_8_SAFETY_INVALID"
  | "P3_10_OBSERVABILITY_INVALID"
  | "P3_11_REPLAY_INVALID"
  | "P3_12_LEARNING_INVALID"
  | "CCI_OPERATIONS_NOT_CONSUMED"
  | "CCI_OPERATIONS_DUPLICATED"
  | "INCIDENT_NOT_RECORDED"
  | "INCIDENT_LIFECYCLE_INCOMPLETE"
  | "INCIDENT_SEVERITY_INVALID"
  | "RECOVERY_NOT_GOVERNED"
  | "RECOVERY_NON_DETERMINISTIC"
  | "RECOVERY_LIFECYCLE_INVALID"
  | "GOVERNANCE_BYPASSED"
  | "SAFETY_VALIDATION_BYPASSED"
  | "OPERATOR_OVERSIGHT_MISSING"
  | "REPLAY_VALIDATION_MISSING"
  | "OPERATIONAL_EVIDENCE_MISSING"
  | "OPERATIONAL_EVIDENCE_MUTABLE"
  | "AUTHORITY_EXPANSION_DURING_RECOVERY"
  | "CONSTITUTIONAL_COMPLIANCE_LOST"
  | "OPERATIONS_CONSOLE_INCOMPLETE"
  | "INCIDENT_LEDGER_INCOMPLETE"
  | "RECOVERY_FRAMEWORK_UNCERTIFIED"
  | "CERTIFICATION_PRUNED";

export type OperationsIncidentGovernanceScenario = "BASELINE" | OperationsIncidentGovernanceFailure;
export type OperationsIncidentGovernanceInput = Readonly<{ scenario?: OperationsIncidentGovernanceScenario; tenant_id?: string }>;

export type OperationsConsole = Readonly<{
  console_id: string;
  overview_ref: string;
  runtime_status_ref: string;
  health_summary_ref: string;
  workload_visibility_ref: string;
  incident_dashboard_ref: string;
  recovery_monitoring_ref: string;
  operator_controls_ref: string;
  operational: boolean;
  integrity_hash: string;
}>;

export type IncidentRecord = Readonly<{
  incident_id: string;
  affected_agents: readonly string[];
  severity: OperationalSeverity;
  lifecycle: readonly IncidentLifecycleState[];
  classification: string;
  impact_analysis: string;
  containment_ref: string;
  escalation_ref: string;
  operator_notification_ref: string;
  closure_timestamp: string;
  immutable_when_closed: boolean;
  integrity_hash: string;
}>;

export type RecoveryRecord = Readonly<{
  recovery_id: string;
  incident_ref: string;
  strategy: RecoveryStrategy;
  lifecycle: readonly RecoveryLifecycleState[];
  deterministic: boolean;
  governance_approval_refs: readonly string[];
  safety_validation_ref: string;
  replay_validation_ref: string;
  dependency_validation_refs: readonly string[];
  restoration_verified: boolean;
  authority_expanded: boolean;
  integrity_hash: string;
}>;

export type OperationalGovernanceRecord = Readonly<{
  governance_id: string;
  operational_policy_refs: readonly string[];
  approval_refs: readonly string[];
  authority_ref: string;
  restriction_refs: readonly string[];
  exception_refs: readonly string[];
  governance_precedes_recovery: boolean;
  safety_precedes_recovery: boolean;
  operator_authority_supreme: boolean;
  constitutional_compliance_preserved: boolean;
  integrity_hash: string;
}>;

export type OperationalEvidenceRecord = Readonly<{
  evidence_id: string;
  incident_ref: string;
  operational_state: string;
  severity: OperationalSeverity;
  recovery_strategy: RecoveryStrategy;
  governance_approvals: readonly string[];
  operator_actions: readonly string[];
  replay_refs: readonly string[];
  telemetry_refs: readonly string[];
  timestamps: readonly string[];
  immutable: boolean;
  auditable: boolean;
  integrity_hash: string;
}>;

export type IncidentLedger = Readonly<{
  ledger_id: string;
  incident_refs: readonly string[];
  recovery_refs: readonly string[];
  evidence_refs: readonly string[];
  complete: boolean;
  permanently_auditable: boolean;
  integrity_hash: string;
}>;

export type OperationalReplayValidation = Readonly<{
  replay_validation_id: string;
  incident_replayed: boolean;
  recovery_replayed: boolean;
  evidence_replayed: boolean;
  restoration_replayed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type OperationsIncidentGovernanceCertification = Readonly<{
  certification_id: string;
  outcome: OperationsCertificationOutcome;
  certified: boolean;
  consumes_cci_operations: boolean;
  does_not_duplicate_cci_operations: boolean;
  operations_console_operational: boolean;
  incident_recorded: boolean;
  incident_lifecycle_complete: boolean;
  incident_ledger_complete: boolean;
  recovery_governed: boolean;
  recovery_deterministic: boolean;
  recovery_lifecycle_valid: boolean;
  governance_enforced: boolean;
  safety_validated: boolean;
  operator_oversight_available: boolean;
  replay_validation_succeeded: boolean;
  evidence_immutable: boolean;
  no_authority_expansion: boolean;
  constitutional_compliance_preserved: boolean;
  recovery_framework_certified: boolean;
  failures: readonly OperationsIncidentGovernanceFailure[];
  integrity_hash: string;
}>;

export type OperationsIncidentGovernanceResult = Readonly<{
  phase_version: "caf-operations-incident-governance/v3.13";
  phase_identifier: "CafOperationsIncidentGovernance";
  agent_identity_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1";
  runtime_orchestration_ref: "caf-runtime-orchestration/v3.3";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8";
  observability_telemetry_ref: "caf-observability-telemetry/v3.10";
  behavioral_replay_divergence_ref: "caf-behavioral-replay-divergence/v3.11";
  learning_adaptation_ref: "caf-learning-adaptation/v3.12";
  cci_operations_ref: "Program 2 - CCI Operations Infrastructure";
  cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure";
  cci_replay_ref: "Program 2 - CCI Replay Infrastructure";
  operations_console: OperationsConsole;
  incident: IncidentRecord;
  recovery: RecoveryRecord;
  operational_governance: OperationalGovernanceRecord;
  operational_evidence: OperationalEvidenceRecord;
  incident_ledger: IncidentLedger;
  replay_validation: OperationalReplayValidation;
  certification: OperationsIncidentGovernanceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OperationsIncidentGovernanceValidation = Readonly<{
  valid: boolean;
  outcome: OperationsCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  console_valid: boolean;
  incident_valid: boolean;
  recovery_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  ledger_valid: boolean;
  replay_valid: boolean;
  certification_valid: boolean;
  failures: readonly OperationsIncidentGovernanceFailure[];
  integrity_hash: string;
}>;

export type OperationsIncidentGovernanceBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-operations-incident-governance/v3.13";
    owns_operations: true;
    owns_incidents: true;
    owns_recovery: true;
    owns_operational_governance: true;
    owns_operational_evidence: true;
    owns_platform_infrastructure_operations: false;
    owns_platform_failover: false;
    consumes_cci_operations: true;
    fail_closed_required: true;
  }>;
  result: OperationsIncidentGovernanceResult;
  validation: OperationsIncidentGovernanceValidation;
}>;
