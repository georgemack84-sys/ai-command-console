import type { TruthIntegrityFinalCertificationState, TruthLifecycleState } from "@/services/mission-control";

export type TruthDashboardRecordType =
  | "INPUT"
  | "OUTPUT"
  | "DECISION"
  | "RECOMMENDATION"
  | "RISK"
  | "CONFIDENCE"
  | "VIOLATION"
  | "GOVERNANCE"
  | "ESCALATION"
  | "RUNTIME"
  | "EVIDENCE"
  | "LINEAGE"
  | "REPLAY";

export type TruthDashboardAccessLevel = "READ_ONLY" | "RESTRICTED_READ";
export type TruthDashboardState = "READY" | "LOADING" | "PARTIAL" | "RESTRICTED" | "DEGRADED" | "ERROR" | "FAIL_CLOSED";
export type TruthDashboardIntegrityState = TruthIntegrityFinalCertificationState | "UNKNOWN";
export type TruthDashboardAccessResult = "ALLOWED" | "REDACTED" | "DENIED" | "FAILED_CLOSED";

export type TruthDashboardContract = Readonly<{
  dashboard_id: string;
  tenant_id: string;
  operator_id: string;
  scope: Readonly<{
    mission_ids?: readonly string[];
    truth_record_types?: readonly TruthDashboardRecordType[];
    time_range?: Readonly<{ from: string; to: string }>;
    access_level: TruthDashboardAccessLevel;
  }>;
  displays: Readonly<{
    recommendations: boolean;
    decisions: boolean;
    evidence: boolean;
    lineage: boolean;
  }>;
  governance: Readonly<{
    tenant_isolation_required: boolean;
    restricted_records_hidden: boolean;
    authority_escalation_blocked: boolean;
    mutation_blocked: boolean;
  }>;
  replay: Readonly<{
    replay_refs_visible: boolean;
    reconstruction_links_visible: boolean;
  }>;
  integrity: Readonly<{
    integrity_state_visible: boolean;
    tamper_alerts_visible: boolean;
  }>;
}>;

export type TruthDashboardRecord = Readonly<{
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  event_type: TruthDashboardRecordType;
  lifecycle_state: TruthLifecycleState;
  integrity_state: TruthDashboardIntegrityState;
  title: string;
  summary: string;
  recommendation_refs: readonly string[];
  decision_refs: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  updated_at?: string;
  governance_state: Readonly<{
    restricted: boolean;
    redacted: boolean;
    escalation_required: boolean;
    authority_boundary: "ADVISORY_ONLY" | "READ_ONLY" | "GOVERNED_READ";
    restriction_reason?: string;
  }>;
  confidence?: Readonly<{ score: number; label: "LOW" | "MEDIUM" | "HIGH"; rationale: string }>;
  risk?: Readonly<{ score: number; label: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; rationale: string }>;
}>;

export type RecommendationDisplay = Readonly<{
  recommendation_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  recommendation_title: string;
  recommendation_summary: string;
  recommendation_state: "PROPOSED" | "VALIDATED" | "REJECTED" | "SUPERSEDED" | "RESTRICTED" | "ARCHIVED";
  rationale: string;
  supporting_evidence_refs: readonly string[];
  conflicting_evidence_refs: readonly string[];
  decision_refs: readonly string[];
  governance_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  authority_boundary: "ADVISORY_ONLY";
  created_at: string;
}>;

export type DecisionDisplay = Readonly<{
  decision_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  decision_title: string;
  decision_summary: string;
  decision_state: "PROPOSED" | "APPROVED" | "REJECTED" | "ESCALATED" | "SUPERSEDED" | "RESTRICTED" | "ARCHIVED";
  decision_actor?: Readonly<{ actor_id: string; actor_type: "OPERATOR" | "SYSTEM" | "GOVERNANCE" }>;
  recommendation_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  escalation_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  decision_timestamp: string;
  governance_result: Readonly<{
    policy_checked: boolean;
    authority_verified: boolean;
    escalation_required: boolean;
    restriction_applied: boolean;
  }>;
}>;

export type EvidenceDisplay = Readonly<{
  evidence_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  evidence_type: "INPUT" | "DOCUMENT" | "SIGNAL" | "OBSERVATION" | "SYSTEM_EVENT" | "GOVERNANCE_EVENT" | "RUNTIME_EVENT" | "EXTERNAL_REFERENCE";
  evidence_title: string;
  evidence_summary: string;
  evidence_state: "REGISTERED" | "VERIFIED" | "CONFLICTING" | "INCOMPLETE" | "RESTRICTED" | "SUPERSEDED" | "ARCHIVED";
  integrity_state: TruthDashboardIntegrityState;
  supports: readonly string[];
  conflicts_with: readonly string[];
  derived_from: readonly string[];
  recommendation_refs: readonly string[];
  decision_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  source: Readonly<{ source_id?: string; source_type: string; source_timestamp?: string }>;
  created_at: string;
}>;

export type LineageDisplay = Readonly<{
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  parent_refs: readonly string[];
  child_refs: readonly string[];
  ancestor_refs: readonly string[];
  descendant_refs: readonly string[];
  evidence_lineage_refs: readonly string[];
  recommendation_lineage_refs: readonly string[];
  decision_lineage_refs: readonly string[];
  governance_lineage_refs: readonly string[];
  replay_lineage_refs: readonly string[];
  lineage_state: "COMPLETE" | "PARTIAL" | "BROKEN" | "RESTRICTED" | "UNVERIFIED";
  causality: Readonly<{ source_refs: readonly string[]; influence_refs: readonly string[]; dependency_refs: readonly string[] }>;
  evolution: Readonly<{ superseded_by?: string; supersedes: readonly string[]; branch_refs: readonly string[]; modification_refs: readonly string[] }>;
}>;

export type DashboardReplayLink = Readonly<{
  replay_ref: string;
  truth_record_id: string;
  replay_state: "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID" | "NOT_AVAILABLE";
  reconstruction_available: boolean;
  replay_timestamp?: string;
  governance_restricted: boolean;
}>;

export type TruthDashboardAuditEvent = Readonly<{
  audit_event_id: string;
  dashboard_id: string;
  tenant_id: string;
  operator_id: string;
  event_type: "dashboard_view_opened" | "truth_record_viewed" | "recommendation_viewed" | "decision_viewed" | "evidence_viewed" | "lineage_viewed" | "restricted_record_attempted" | "redacted_record_viewed" | "integrity_warning_viewed" | "replay_link_opened";
  truth_record_id?: string;
  access_result: TruthDashboardAccessResult;
  timestamp: string;
  governance_context: Readonly<{
    policy_id?: string;
    access_level: string;
    restriction_reason?: string;
  }>;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type TruthDashboardQuery = Readonly<{
  tenant_id: string;
  operator_id: string;
  query_type: "RECOMMENDATION_LOOKUP" | "DECISION_LOOKUP" | "EVIDENCE_LOOKUP" | "LINEAGE_LOOKUP" | "HISTORICAL_RECONSTRUCTION" | "CROSS_LEDGER_CORRELATION" | "REPLAY_LOOKUP" | "INTEGRITY_LOOKUP";
  filters: Readonly<{
    mission_id?: string;
    truth_record_id?: string;
    event_type?: TruthDashboardRecordType;
    lifecycle_state?: TruthLifecycleState;
    integrity_state?: TruthDashboardIntegrityState;
    time_range?: Readonly<{ from: string; to: string }>;
    search_text?: string;
    restricted?: boolean;
    risk_label?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    confidence_label?: "LOW" | "MEDIUM" | "HIGH";
    replay_available?: boolean;
  }>;
  governance_context: Readonly<{
    access_level: string;
    restricted_access_allowed: boolean;
  }>;
}>;

export type TruthDashboardRecordDetail = Readonly<{
  record: TruthDashboardRecord;
  recommendation?: RecommendationDisplay;
  decision?: DecisionDisplay;
  evidence?: EvidenceDisplay;
  lineage: LineageDisplay;
  replay_links: readonly DashboardReplayLink[];
  integrity_indicators: readonly string[];
  warnings: readonly string[];
  access_result: TruthDashboardAccessResult;
}>;

export type TruthDashboardView = Readonly<{
  contract: TruthDashboardContract;
  state: TruthDashboardState;
  records: readonly TruthDashboardRecord[];
  selected_record: TruthDashboardRecordDetail;
  audit_events: readonly TruthDashboardAuditEvent[];
  available_filters: Readonly<{
    missions: readonly string[];
    record_types: readonly TruthDashboardRecordType[];
    integrity_states: readonly TruthDashboardIntegrityState[];
  }>;
  guardrails: readonly string[];
  query_hash: string;
  generated_at: string;
  readOnly: true;
  mutationAllowed: false;
  approvalAllowed: false;
  executionAllowed: false;
}>;
