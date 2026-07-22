export type IncidentExceptionGovernanceOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type IncidentCategory = "RUNTIME_FAILURE" | "REPLAY_FAILURE" | "GOVERNANCE_VIOLATION" | "ADVISORY_BOUNDARY_VIOLATION" | "TENANT_ISOLATION_VIOLATION" | "EVIDENCE_INTEGRITY_VIOLATION" | "DEPLOYMENT_INTEGRITY_VIOLATION" | "OPERATOR_WORKFLOW_ISSUE";
export type IncidentSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CONSTITUTIONAL_CRITICAL";
export type IncidentLifecycleState = "DETECTED" | "CLASSIFIED" | "EVIDENCE_CAPTURED" | "CONTAINED" | "INVESTIGATING" | "REQUIRE_GOVERNANCE_REVIEW" | "REQUIRE_RECERTIFICATION" | "FAIL_CLOSED" | "ROOT_CAUSE_IDENTIFIED" | "REMEDIATION_APPROVED" | "RESOLVED" | "CERTIFIED_CLOSED";
export type EscalationOutcome = "LOG_ONLY" | "MONITOR" | "REQUIRE_OPERATOR_REVIEW" | "REQUIRE_GOVERNANCE_REVIEW" | "RESTRICT_SCOPE" | "FREEZE_PILOT" | "DISABLE_CAPABILITY" | "REQUIRE_RECERTIFICATION" | "FAIL_CLOSED";
export type IncidentExceptionGovernanceFailure = "INCIDENT_TAXONOMY_INCOMPLETE" | "ESCALATION_NON_DETERMINISTIC" | "FORENSIC_EVIDENCE_NOT_PRESERVED" | "INCIDENT_LIFECYCLE_NOT_REPLAYABLE" | "IMMUTABLE_INCIDENT_EVIDENCE_NOT_VERIFIED" | "GOVERNANCE_REVIEW_NOT_OPERATIONAL" | "ROOT_CAUSE_ANALYSIS_NOT_REPRODUCIBLE" | "CERTIFICATION_IMPACT_NOT_TRACEABLE" | "INCIDENT_HISTORY_MUTABLE" | "CONSTITUTIONAL_GUARANTEES_NOT_PRESERVED" | "PHASE_16_7_MONITORING_NOT_VALID" | "NON_CONSTITUTIONAL_INCIDENT_WARNING";
export type IncidentExceptionGovernanceScenario = "BASELINE" | IncidentExceptionGovernanceFailure;

export type IncidentExceptionGovernanceInput = Readonly<{ scenario?: IncidentExceptionGovernanceScenario; tenant_id?: string; operator_id?: string; mission_id?: string; incident_id?: string }>;

export type IncidentClassificationPolicy = Readonly<{
  policy_id: string;
  categories: readonly IncidentCategory[];
  severities: readonly IncidentSeverity[];
  escalation_rules: readonly string[];
  governance_requirements: readonly string[];
  certification_consequences: readonly string[];
  containment_requirements: readonly string[];
  recovery_requirements: readonly string[];
  deterministic: boolean;
  immutable: boolean;
  version: "incident-exception-governance/v16.8";
  integrity_hash: string;
}>;

export type IncidentRecord = Readonly<{
  incident_id: string;
  tenant_id: string;
  pilot_id: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  current_lifecycle_state: IncidentLifecycleState;
  detection_source: string;
  detection_timestamp: string;
  affected_components: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  root_cause_ref: string;
  escalation_outcome: EscalationOutcome;
  governance_decision: string;
  certification_impact: "NONE" | "REVIEW_REQUIRED" | "RECERTIFICATION_REQUIRED" | "BLOCKING";
  resolution_status: "RESOLVED" | "OPEN" | "FAIL_CLOSED";
  resolution_timestamp: string;
  immutable_audit_ref: string;
  integrity_hash: string;
}>;

export type ExceptionWorkflowRecord = Readonly<{
  workflow_id: string;
  sources: readonly string[];
  classification_ref: string;
  governed_response_ref: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  deterministic: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type EscalationDecisionRecord = Readonly<{
  escalation_id: string;
  severity: IncidentSeverity;
  constitutional_impact: boolean;
  outcome: EscalationOutcome;
  deterministic: boolean;
  governance_required: boolean;
  fail_closed_available: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RootCauseAnalysisRecord = Readonly<{
  root_cause_id: string;
  classification: string;
  contributing_factors: readonly string[];
  impacted_components: readonly string[];
  affected_tenants: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  certification_impact: string;
  recommended_remediation: readonly string[];
  reproducible: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type IncidentTimelineEntry = Readonly<{
  timeline_entry_id: string;
  sequence: number;
  state: IncidentLifecycleState;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  timestamp: string;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type IncidentEvidenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "DETECTION" | "CLASSIFICATION" | "EVIDENCE_CAPTURE" | "ESCALATION" | "ROOT_CAUSE" | "GOVERNANCE_REVIEW" | "REMEDIATION" | "CERTIFICATION_CLOSE";
  incident_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type GovernanceReviewQueueRecord = Readonly<{
  queue_id: string;
  incident_refs: readonly string[];
  governance_authority: string;
  review_required: boolean;
  operational: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type IncidentCertificationInterface = Readonly<{
  interface_id: string;
  pilot_qualification_impact: string;
  certification_validity_impact: string;
  operational_readiness_impact: string;
  performance_validation_impact: string;
  governance_status_impact: string;
  expansion_eligibility_impact: string;
  certification_refs: readonly string[];
  traceable: boolean;
  integrity_hash: string;
}>;

export type IncidentExceptionGovernanceCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: IncidentExceptionGovernanceOutcome;
  passed: boolean;
  failure_reason: IncidentExceptionGovernanceFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type IncidentExceptionGovernanceResult = Readonly<{
  phase_version: "incident-exception-governance/v16.8";
  phase_identifier: "IncidentExceptionGovernance";
  pilot_monitoring_observability_ref: string;
  lifecycle: readonly IncidentLifecycleState[];
  classification_policy: IncidentClassificationPolicy;
  incident: IncidentRecord;
  exception_workflow: ExceptionWorkflowRecord;
  escalation: EscalationDecisionRecord;
  root_cause_analysis: RootCauseAnalysisRecord;
  timeline: readonly IncidentTimelineEntry[];
  evidence_ledger: readonly IncidentEvidenceLedgerEntry[];
  governance_review_queue: GovernanceReviewQueueRecord;
  certification_interface: IncidentCertificationInterface;
  certification_tests: readonly IncidentExceptionGovernanceCertificationTest[];
  failures: readonly IncidentExceptionGovernanceFailure[];
  outcome: IncidentExceptionGovernanceOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type IncidentExceptionGovernanceValidation = Readonly<{
  valid: boolean;
  outcome: IncidentExceptionGovernanceOutcome;
  policy_valid: boolean;
  incident_valid: boolean;
  workflow_valid: boolean;
  escalation_valid: boolean;
  rca_valid: boolean;
  timeline_valid: boolean;
  ledger_valid: boolean;
  governance_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly IncidentExceptionGovernanceFailure[];
  integrity_hash: string;
}>;

export type IncidentExceptionGovernanceBundle = Readonly<{
  doctrine: Readonly<{
    version: "incident-exception-governance/v16.8";
    upstream_phase: "pilot-monitoring-observability/v16.7";
    categories: readonly IncidentCategory[];
    severities: readonly IncidentSeverity[];
    lifecycle: readonly IncidentLifecycleState[];
    escalation_outcomes: readonly EscalationOutcome[];
    certification_outcomes: readonly IncidentExceptionGovernanceOutcome[];
  }>;
  result: IncidentExceptionGovernanceResult;
  validation: IncidentExceptionGovernanceValidation;
}>;
