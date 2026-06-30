import type { TruthDashboardAccessLevel, TruthDashboardAccessResult, TruthDashboardState } from "@/types/truth-dashboard";

export type IntegrityViewerTargetType = "TRUTH_RECORD" | "LEDGER_ENTRY" | "EVIDENCE" | "LINEAGE" | "REPLAY" | "GOVERNANCE_EVENT" | "RUNTIME_EVENT" | "HASH_CHAIN_SEGMENT";
export type IntegrityViewerIntegrityState = "VALID" | "DEGRADED" | "CORRUPTED" | "UNKNOWN" | "UNVERIFIED";
export type IntegrityViewerCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "NOT_CERTIFIED" | "NOT_APPLICABLE";
export type IntegrityViewerHashChainState = "VALID" | "BROKEN" | "PARTIAL" | "MISSING" | "UNKNOWN";
export type IntegrityViewerTamperState = "CLEAR" | "SUSPECTED" | "CONFIRMED" | "UNKNOWN";
export type IntegrityViewerVerificationResult = "PASS" | "WARN" | "FAIL" | "BLOCKED" | "UNKNOWN";
export type IntegrityViewerSeverity = "INFO" | "WARN" | "HIGH" | "CRITICAL";

export type IntegrityStatusViewerContract = Readonly<{
  viewer_id: string;
  tenant_id: string;
  operator_id: string;
  scope: Readonly<{
    mission_ids?: readonly string[];
    truth_record_ids?: readonly string[];
    ledger_entry_ids?: readonly string[];
    evidence_ids?: readonly string[];
    replay_ids?: readonly string[];
    time_range?: Readonly<{ from: string; to: string }>;
    access_level: TruthDashboardAccessLevel;
  }>;
  displays: Readonly<Record<"integrity_summary" | "record_integrity" | "ledger_integrity" | "hash_chain_status" | "tamper_detection_status" | "verification_results" | "certification_status" | "affected_records" | "dependency_impact" | "replay_impact" | "lineage_impact" | "evidence_impact" | "historical_integrity_status", boolean>>;
  governance: Readonly<{
    tenant_isolation_required: boolean;
    operator_access_required: boolean;
    restricted_records_hidden: boolean;
    redaction_required: boolean;
    mutation_blocked: boolean;
    hash_repair_blocked: boolean;
    certification_override_blocked: boolean;
    trusted_interpretation_blocked_when_corrupted: boolean;
    fail_closed_required: boolean;
  }>;
  integrity_visibility: Readonly<{
    states_visible: boolean;
    hash_chain_visible: boolean;
    tamper_alerts_visible: boolean;
    degraded_corrupted_reason_visible: boolean;
    verification_timestamp_visible: boolean;
  }>;
  audit: Readonly<{
    viewer_access_audited: boolean;
    restricted_access_audited: boolean;
    corruption_view_audited: boolean;
    verification_view_audited: boolean;
  }>;
}>;

export type IntegrityStatusRecord = Readonly<{
  integrity_status_id: string;
  tenant_id: string;
  mission_id?: string;
  target: Readonly<{ target_type: IntegrityViewerTargetType; target_id: string }>;
  title: string;
  summary: string;
  integrity_state: IntegrityViewerIntegrityState;
  certification_state: IntegrityViewerCertificationState;
  hash_chain_state: IntegrityViewerHashChainState;
  tamper_detection_state: IntegrityViewerTamperState;
  verification: Readonly<{
    verified: boolean;
    verification_service_ref?: string;
    verification_timestamp?: string;
    verification_result: IntegrityViewerVerificationResult;
  }>;
  impact: Readonly<{
    affected_truth_records: number;
    affected_ledger_entries: number;
    affected_evidence: number;
    affected_lineage: number;
    affected_replays: number;
    affected_governance_events: number;
    trusted_interpretation_allowed: boolean;
  }>;
  refs: Readonly<{
    truth_record_refs: readonly string[];
    ledger_entry_refs: readonly string[];
    evidence_refs: readonly string[];
    lineage_refs: readonly string[];
    replay_refs: readonly string[];
    governance_refs: readonly string[];
    verification_refs: readonly string[];
    certification_refs: readonly string[];
    tamper_alert_refs: readonly string[];
  }>;
  visibility: Readonly<{
    restricted: boolean;
    redacted: boolean;
    hidden: boolean;
    access_result: TruthDashboardAccessResult;
    restriction_reason?: string;
  }>;
  timestamps: Readonly<{ detected_at: string; updated_at: string; verified_at?: string }>;
}>;

export type IntegrityCheckResult = Readonly<{
  check_id: string;
  check_type: "RECORD_CONTRACT_VALID" | "REQUIRED_FIELDS_PRESENT" | "TENANT_SCOPE_VALID" | "MISSION_SCOPE_VALID" | "EVIDENCE_REFS_VALID" | "LINEAGE_REFS_VALID" | "REPLAY_REFS_VALID" | "GOVERNANCE_REFS_VALID" | "HASH_VALID" | "TIMESTAMP_VALID" | "LIFECYCLE_STATE_VALID";
  result: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  severity: IntegrityViewerSeverity;
  summary: string;
  refs: readonly string[];
}>;

export type IntegritySummaryDisplay = Readonly<{
  total_records: number;
  valid_count: number;
  degraded_count: number;
  corrupted_count: number;
  unknown_count: number;
  unverified_count: number;
  suspected_tamper_count: number;
  confirmed_tamper_count: number;
  critical_findings: readonly string[];
  trusted_interpretation_allowed: boolean;
}>;

export type RecordIntegrityDisplay = Readonly<{ target_ref: string; checks: readonly IntegrityCheckResult[] }>;

export type LedgerSegmentIntegrityDisplay = Readonly<{
  segment_id: string;
  records: readonly string[];
  segment_warnings: readonly ("MISSING_SEQUENCE" | "DUPLICATE_SEQUENCE" | "BROKEN_HASH_LINK" | "CORRUPTED_RECORD" | "UNVERIFIED_RECORD" | "RESTRICTED_RECORD" | "TIMESTAMP_ANOMALY" | "ORDERING_ANOMALY")[];
}>;

export type HashChainStatusDisplay = Readonly<{
  target_ref: string;
  hash_chain_state: IntegrityViewerHashChainState;
  hash_links: readonly Readonly<{ source_hash: string; target_hash: string; valid: boolean }>[];
  broken_links: readonly string[];
}>;

export type TamperDetectionDisplay = Readonly<{
  target_ref: string;
  tamper_detection_state: IntegrityViewerTamperState;
  alerts: readonly Readonly<{
    tamper_alert_id: string;
    indicator: "HASH_MISMATCH" | "UNEXPECTED_MUTATION" | "TIMESTAMP_ANOMALY" | "SEQUENCE_ANOMALY" | "MISSING_REFERENCE" | "UNAUTHORIZED_WRITE" | "CONTRACT_VIOLATION" | "LINEAGE_INCONSISTENCY" | "REPLAY_INCONSISTENCY" | "EVIDENCE_INCONSISTENCY";
    severity: IntegrityViewerSeverity;
    confidence: "LOW" | "MEDIUM" | "HIGH";
    summary: string;
  }>[];
}>;

export type IntegrityVerificationResultDisplay = Readonly<{ verification_id: string; target_ref: string; result: IntegrityViewerVerificationResult; verified_at?: string; service_ref?: string; summary: string }>;
export type IntegrityCertificationGateDisplay = Readonly<{ certification_id: string; target_ref: string; certification_state: IntegrityViewerCertificationState; gate_ref: string; summary: string; trusted_interpretation_allowed: boolean }>;
export type IntegrityIssueAnalysis = Readonly<{ issue_id: string; target_ref: string; state: "DEGRADED" | "CORRUPTED"; reasons: readonly string[]; required_operator_posture: "MONITOR" | "QUARANTINE" | "FAIL_CLOSED"; trusted_interpretation_allowed: boolean }>;
export type IntegrityBlastRadiusDisplay = Readonly<{ issue_id: string; target_ref: string; affected_truth_records: readonly string[]; affected_evidence: readonly string[]; affected_lineage: readonly string[]; affected_replays: readonly string[]; affected_governance: readonly string[]; severity: IntegrityViewerSeverity }>;
export type IntegrityDependencyImpactDisplay = Readonly<{ dependency_ref: string; dependency_type: "EVIDENCE" | "LINEAGE" | "REPLAY" | "GOVERNANCE"; impacted_truth_records: readonly string[]; impacted_integrity_states: readonly IntegrityViewerIntegrityState[]; trusted_interpretation_allowed: boolean }>;
export type IntegrityHistoryDisplay = Readonly<{ target_ref: string; events: readonly Readonly<{ timestamp: string; integrity_state: IntegrityViewerIntegrityState; verification_result: IntegrityViewerVerificationResult; summary: string }>[] }>;

export type IntegrityStatusViewerAuditEvent = Readonly<{
  audit_event_id: string;
  viewer_id: string;
  tenant_id: string;
  operator_id: string;
  event_type: "INTEGRITY_VIEWER_OPENED" | "INTEGRITY_RECORD_VIEWED" | "RESTRICTED_INTEGRITY_ATTEMPTED" | "CORRUPTION_VIEWED" | "VERIFICATION_VIEWED" | "TAMPER_ALERT_VIEWED" | "AUDIT_EVENT_RECORDED";
  target_ref?: string;
  access_result: TruthDashboardAccessResult;
  timestamp: string;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type IntegrityViewerQuery = Readonly<{
  tenant_id: string;
  operator_id: string;
  filters: Readonly<{ mission_id?: string; target_ref?: string; integrity_state?: IntegrityViewerIntegrityState; certification_state?: IntegrityViewerCertificationState; tamper_detection_state?: IntegrityViewerTamperState; search_text?: string; restricted?: boolean }>;
  governance_context: Readonly<{ access_level: TruthDashboardAccessLevel; restricted_access_allowed: boolean }>;
}>;

export type IntegrityStatusViewerDetail = Readonly<{
  record: IntegrityStatusRecord;
  summary: IntegritySummaryDisplay;
  record_integrity: RecordIntegrityDisplay;
  ledger_segment: LedgerSegmentIntegrityDisplay;
  hash_chain: HashChainStatusDisplay;
  tamper_detection: TamperDetectionDisplay;
  verification_result: IntegrityVerificationResultDisplay;
  certification_gate: IntegrityCertificationGateDisplay;
  degraded_analysis?: IntegrityIssueAnalysis;
  corrupted_analysis?: IntegrityIssueAnalysis;
  blast_radius: IntegrityBlastRadiusDisplay;
  evidence_impact: readonly IntegrityDependencyImpactDisplay[];
  lineage_impact: readonly IntegrityDependencyImpactDisplay[];
  replay_impact: readonly IntegrityDependencyImpactDisplay[];
  governance_impact: readonly IntegrityDependencyImpactDisplay[];
  history: IntegrityHistoryDisplay;
  warnings: readonly string[];
  access_result: TruthDashboardAccessResult;
}>;

export type IntegrityStatusViewerView = Readonly<{
  contract: IntegrityStatusViewerContract;
  state: TruthDashboardState;
  records: readonly IntegrityStatusRecord[];
  selected_record: IntegrityStatusViewerDetail;
  audit_events: readonly IntegrityStatusViewerAuditEvent[];
  available_filters: Readonly<{ integrity_states: readonly IntegrityViewerIntegrityState[]; certification_states: readonly IntegrityViewerCertificationState[]; tamper_states: readonly IntegrityViewerTamperState[] }>;
  guardrails: readonly string[];
  query_hash: string;
  generated_at: string;
  readOnly: true;
  mutationAllowed: false;
  hashRepairAllowed: false;
  certificationOverrideAllowed: false;
  governanceOverrideAllowed: false;
}>;
