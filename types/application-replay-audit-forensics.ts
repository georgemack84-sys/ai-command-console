export type ApplicationReplayForensicsOutcome = "PASS" | "FAIL" | "PRUNED";
export type ReplayRequestStatus = "REQUESTED" | "AUTHORIZED" | "EVIDENCE_RETRIEVED" | "ANALYZED" | "ARCHIVED";

export type ApplicationReplayForensicsFailure =
  | "P4_8_GOVERNANCE_BINDING_INVALID"
  | "CCI_REPLAY_INFRASTRUCTURE_INVALID"
  | "CCI_REPLAY_LEDGER_INVALID"
  | "CCI_AUDIT_LEDGER_INVALID"
  | "CCI_EVIDENCE_SERVICES_INVALID"
  | "CCI_IMMUTABLE_STORAGE_INVALID"
  | "CAF_BEHAVIORAL_REPLAY_INVALID"
  | "CAF_DIVERGENCE_REPORTS_INVALID"
  | "CAF_ASSURANCE_EVIDENCE_INVALID"
  | "CAF_GOVERNANCE_EVIDENCE_INVALID"
  | "REPLAY_REQUEST_UNAUTHORIZED"
  | "REPLAY_REQUEST_MISSING"
  | "REPLAY_SESSION_REFERENCE_MISSING"
  | "CANONICAL_REPLAY_EVIDENCE_MISSING"
  | "NON_CCI_REPLAY_EVIDENCE_USED"
  | "CAF_REPLAY_EVIDENCE_MISSING"
  | "REPLAY_ANALYSIS_NON_DETERMINISTIC"
  | "REPLAY_ANALYSIS_REPORT_MISSING"
  | "AUDIT_INTERPRETATION_NON_DETERMINISTIC"
  | "AUDIT_REPORT_MISSING"
  | "FORENSIC_FINDING_MISSING"
  | "FORENSIC_CONFIDENCE_INSUFFICIENT"
  | "TIMELINE_NON_DETERMINISTIC"
  | "TIMELINE_INCOMPLETE"
  | "CORRELATION_MAP_MISSING"
  | "CROSS_APPLICATION_CORRELATION_INVALID"
  | "INVESTIGATION_REPORT_MISSING"
  | "INVESTIGATION_LINEAGE_INCOMPLETE"
  | "REPORT_NOT_REPRODUCIBLE"
  | "EVIDENCE_REFERENCE_MUTATED"
  | "REPLAY_EXECUTION_ATTEMPTED"
  | "CCI_REPLAY_REPLACEMENT_ATTEMPTED"
  | "CAF_REPLAY_REPLACEMENT_ATTEMPTED"
  | "FORENSIC_STORAGE_ATTEMPTED"
  | "AUDIT_HISTORY_MUTATION_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type ApplicationReplayForensicsScenario = "BASELINE" | ApplicationReplayForensicsFailure;
export type ApplicationReplayForensicsInput = Readonly<{ scenario?: ApplicationReplayForensicsScenario; application_id?: string; requester?: string; incident_reference?: string }>;

export type ReplayRequestRecord = Readonly<{
  replay_request_id: string;
  requester: string;
  application_id: string;
  replay_scope: readonly string[];
  requested_period: string;
  authorization_reference: string;
  status: ReplayRequestStatus;
  request_timestamp: string;
  integrity_hash: string;
}>;

export type ReplayAnalysisReport = Readonly<{
  report_id: string;
  replay_request_id: string;
  application_id: string;
  replay_session_reference: string;
  replay_scope: readonly string[];
  analyzed_events: readonly string[];
  divergence_summary: string;
  execution_summary: string;
  dependency_summary: string;
  findings: readonly string[];
  evidence_references: readonly string[];
  analysis_timestamp: string;
  deterministic: boolean;
  uses_only_cci_replay_evidence: boolean;
  integrity_hash: string;
}>;

export type AuditReport = Readonly<{
  audit_report_id: string;
  application_id: string;
  audit_scope: readonly string[];
  governance_events: readonly string[];
  lifecycle_events: readonly string[];
  compliance_summary: string;
  audit_findings: readonly string[];
  evidence_references: readonly string[];
  generated_timestamp: string;
  deterministic: boolean;
  immutable_history_preserved: boolean;
  integrity_hash: string;
}>;

export type InvestigationTimeline = Readonly<{
  timeline_id: string;
  investigation_id: string;
  ordered_events: readonly string[];
  dependency_timeline_refs: readonly string[];
  deterministic_ordering: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ForensicFinding = Readonly<{
  finding_id: string;
  investigation_id: string;
  application_id: string;
  incident_reference: string;
  reconstructed_timeline: string;
  causal_analysis: string;
  affected_components: readonly string[];
  evidence_references: readonly string[];
  confidence_level: "LOW" | "MEDIUM" | "HIGH";
  investigator: string;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type CorrelationMap = Readonly<{
  correlation_id: string;
  application_id: string;
  replay_evidence_refs: readonly string[];
  audit_event_refs: readonly string[];
  governance_decision_refs: readonly string[];
  lifecycle_history_refs: readonly string[];
  application_dependency_refs: readonly string[];
  cross_application_links: readonly string[];
  valid: boolean;
  integrity_hash: string;
}>;

export type InvestigationReport = Readonly<{
  report_id: string;
  investigation_id: string;
  replay_summary_ref: string;
  audit_report_ref: string;
  forensic_finding_refs: readonly string[];
  timeline_ref: string;
  correlation_map_ref: string;
  compliance_evidence_refs: readonly string[];
  reproducible_from_canonical_evidence: boolean;
  generated_timestamp: string;
  integrity_hash: string;
}>;

export type InvestigationLineageRecord = Readonly<{
  lineage_id: string;
  evidence_references: readonly string[];
  investigation_refs: readonly string[];
  report_refs: readonly string[];
  replay_provenance_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationReplayForensicsCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationReplayForensicsOutcome;
  phase_ready: boolean;
  replay_requests_governed: boolean;
  application_replay_analysis_operational: boolean;
  audit_interpretation_operational: boolean;
  forensic_reconstruction_deterministic: boolean;
  cross_application_correlation_functional: boolean;
  timeline_reconstruction_deterministic: boolean;
  reports_reproducible: boolean;
  immutable_lineage_preserved: boolean;
  no_replay_execution_logic: boolean;
  no_evidence_mutation: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly ApplicationReplayForensicsFailure[];
  integrity_hash: string;
}>;

export type ApplicationReplayAuditForensicsResult = Readonly<{
  phase_version: "application-replay-audit-forensics/v4.9";
  phase_identifier: "ApplicationReplayAuditForensics";
  governance_binding_ref: "application-governance-binding/v4.8";
  cci_replay_infrastructure_ref: "Program 2 - CCI Replay Infrastructure";
  cci_audit_ledger_ref: "Program 2 - CCI Audit Ledger";
  caf_behavioral_replay_ref: "Program 3 - CAF Behavioral Replay Evidence";
  replay_request: ReplayRequestRecord;
  replay_analysis_report: ReplayAnalysisReport;
  audit_report: AuditReport;
  investigation_timeline: InvestigationTimeline;
  forensic_finding: ForensicFinding;
  correlation_map: CorrelationMap;
  investigation_report: InvestigationReport;
  lineage_record: InvestigationLineageRecord;
  certification: ApplicationReplayForensicsCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationReplayForensicsValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationReplayForensicsOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  request_valid: boolean;
  analysis_valid: boolean;
  audit_valid: boolean;
  timeline_valid: boolean;
  forensic_valid: boolean;
  correlation_valid: boolean;
  report_valid: boolean;
  lineage_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationReplayForensicsFailure[];
  integrity_hash: string;
}>;

export type ApplicationReplayForensicsBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-replay-audit-forensics/v4.9";
    owns_replay_requests: true;
    owns_application_replay_analysis: true;
    owns_audit_interpretation: true;
    owns_forensic_interpretation: true;
    executes_replay_engines: false;
    replaces_cci_replay_services: false;
    replaces_caf_behavioral_replay: false;
    mutates_replay_evidence: false;
    alters_forensic_evidence: false;
    modifies_audit_history: false;
  }>;
  result: ApplicationReplayAuditForensicsResult;
  validation: ApplicationReplayForensicsValidation;
}>;
