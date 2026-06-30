import type { TruthDashboardAccessLevel, TruthDashboardAccessResult, TruthDashboardIntegrityState, TruthDashboardRecordType, TruthDashboardState } from "@/types/truth-dashboard";

export type LedgerExplorerLifecycleState = "CREATED" | "VERIFIED" | "SUPERSEDED" | "RESTRICTED" | "ARCHIVED";
export type LedgerGraphNodeType = "TRUTH_RECORD" | "RECOMMENDATION" | "DECISION" | "EVIDENCE" | "GOVERNANCE" | "ESCALATION" | "RUNTIME" | "REPLAY" | "INTEGRITY";
export type LedgerGraphRelationshipType = "PARENT_OF" | "CHILD_OF" | "DERIVED_FROM" | "SUPPORTS" | "CONFLICTS_WITH" | "INFLUENCED" | "DEPENDS_ON" | "SUPERSEDES" | "SUPERSEDED_BY" | "REPLAY_OF" | "GOVERNED_BY" | "ESCALATED_TO" | "HASH_PRECEDES" | "HASH_FOLLOWS";

export type LedgerExplorerContract = Readonly<{
  explorer_id: string;
  tenant_id: string;
  operator_id: string;
  scope: Readonly<{
    mission_ids?: readonly string[];
    truth_record_ids?: readonly string[];
    ledger_ids?: readonly string[];
    event_types?: readonly TruthDashboardRecordType[];
    time_range?: Readonly<{ from: string; to: string }>;
    access_level: TruthDashboardAccessLevel;
  }>;
  navigation_modes: Readonly<Record<"record_index" | "timeline_view" | "graph_view" | "lineage_view" | "evidence_view" | "recommendation_decision_view" | "governance_view" | "runtime_event_view" | "integrity_chain_view" | "archive_view", boolean>>;
  governance: Readonly<{
    tenant_isolation_required: boolean;
    operator_access_required: boolean;
    restricted_records_hidden: boolean;
    restricted_records_redacted: boolean;
    mutation_blocked: boolean;
    approval_blocked: boolean;
    execution_blocked: boolean;
    governance_override_blocked: boolean;
  }>;
  integrity: Readonly<{
    integrity_state_visible: boolean;
    hash_chain_visible: boolean;
    tamper_alerts_visible: boolean;
    broken_reference_warnings_visible: boolean;
  }>;
  replay: Readonly<{
    replay_refs_visible: boolean;
    reconstruction_refs_visible: boolean;
    replay_state_visible: boolean;
  }>;
  audit: Readonly<{
    explorer_access_audited: boolean;
    restricted_access_audited: boolean;
    record_navigation_audited: boolean;
  }>;
}>;

export type LedgerExplorerRecord = Readonly<{
  truth_record_id: string;
  ledger_entry_id: string;
  tenant_id: string;
  mission_id?: string;
  event_type: TruthDashboardRecordType;
  lifecycle_state: LedgerExplorerLifecycleState;
  integrity_state: TruthDashboardIntegrityState;
  title: string;
  summary: string;
  timestamps: Readonly<{ created_at: string; updated_at?: string; archived_at?: string; superseded_at?: string }>;
  references: Readonly<{
    parent_refs: readonly string[];
    child_refs: readonly string[];
    evidence_refs: readonly string[];
    recommendation_refs: readonly string[];
    decision_refs: readonly string[];
    governance_refs: readonly string[];
    escalation_refs: readonly string[];
    replay_refs: readonly string[];
    integrity_refs: readonly string[];
  }>;
  ledger_position: Readonly<{
    sequence_number?: number;
    partition_id?: string;
    previous_hash?: string;
    current_hash?: string;
    next_hash?: string;
  }>;
  visibility: Readonly<{
    restricted: boolean;
    redacted: boolean;
    hidden: boolean;
    access_result: TruthDashboardAccessResult;
    restriction_reason?: string;
  }>;
}>;

export type LedgerTimelineEvent = Readonly<{
  timeline_event_id: string;
  truth_record_id: string;
  ledger_entry_id: string;
  tenant_id: string;
  mission_id?: string;
  event_type: TruthDashboardRecordType;
  lifecycle_state: LedgerExplorerLifecycleState;
  integrity_state: TruthDashboardIntegrityState;
  timestamp: string;
  title: string;
  summary: string;
  sequence_number?: number;
  relationships: Readonly<{ previous_event_ref?: string; next_event_ref?: string; parent_refs: readonly string[]; child_refs: readonly string[]; causal_refs: readonly string[] }>;
  visibility: Readonly<{ restricted: boolean; redacted: boolean }>;
}>;

export type LedgerGraphNode = Readonly<{
  node_id: string;
  truth_record_id: string;
  node_type: LedgerGraphNodeType;
  title: string;
  summary: string;
  lifecycle_state: LedgerExplorerLifecycleState;
  integrity_state: TruthDashboardIntegrityState;
  restricted: boolean;
  redacted: boolean;
}>;

export type LedgerGraphEdge = Readonly<{
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: LedgerGraphRelationshipType;
  integrity_state: TruthDashboardIntegrityState;
  restricted: boolean;
}>;

export type LedgerRecordDrilldown = Readonly<{
  truth_record_id: string;
  ledger_entry_id: string;
  tenant_id: string;
  mission_id?: string;
  record_summary: Readonly<{ event_type: TruthDashboardRecordType; title: string; summary: string; lifecycle_state: LedgerExplorerLifecycleState; created_at: string }>;
  ledger_metadata: Readonly<{ sequence_number?: number; partition_id?: string; write_timestamp?: string; previous_hash?: string; current_hash?: string; next_hash?: string }>;
  relationships: LedgerExplorerRecord["references"];
  integrity: Readonly<{ integrity_state: TruthDashboardIntegrityState; hash_chain_state: "VALID" | "BROKEN" | "UNKNOWN"; tamper_detection_state: "CLEAR" | "SUSPECTED" | "CONFIRMED" | "UNKNOWN" }>;
  visibility: Readonly<{ restricted: boolean; redacted: boolean; access_result: TruthDashboardAccessResult }>;
}>;

export type EvidenceRelationshipExplorerRecord = Readonly<{
  evidence_id: string;
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  evidence_type: "INPUT" | "DOCUMENT" | "SIGNAL" | "OBSERVATION" | "SYSTEM_EVENT" | "GOVERNANCE_EVENT" | "RUNTIME_EVENT" | "EXTERNAL_REFERENCE";
  evidence_state: "REGISTERED" | "VERIFIED" | "CONFLICTING" | "INCOMPLETE" | "RESTRICTED" | "SUPERSEDED" | "ARCHIVED";
  supports: readonly string[];
  conflicts_with: readonly string[];
  derived_from: readonly string[];
  used_by_replay_refs: readonly string[];
  integrity_state: TruthDashboardIntegrityState;
  restricted: boolean;
  redacted: boolean;
}>;

export type RecommendationDecisionExplorerRecord = Readonly<{
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  record_kind: "RECOMMENDATION" | "DECISION";
  title: string;
  summary: string;
  state: "PROPOSED" | "VALIDATED" | "APPROVED" | "REJECTED" | "ESCALATED" | "SUPERSEDED" | "RESTRICTED" | "ARCHIVED";
  recommendation_refs: readonly string[];
  decision_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  escalation_refs: readonly string[];
  replay_refs: readonly string[];
  risk_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence_level?: "LOW" | "MEDIUM" | "HIGH";
  authority_boundary: "ADVISORY_ONLY" | "OPERATOR_DECISION_REQUIRED";
  integrity_state: TruthDashboardIntegrityState;
}>;

export type GovernanceEscalationExplorerRecord = Readonly<{
  truth_record_id: string;
  tenant_id: string;
  mission_id?: string;
  record_kind: "GOVERNANCE" | "ESCALATION" | "VIOLATION";
  title: string;
  summary: string;
  governance_state: "PASSED" | "WARNED" | "RESTRICTED" | "ESCALATED" | "FAILED" | "BLOCKED";
  policy_refs: readonly string[];
  authority_refs: readonly string[];
  recommendation_refs: readonly string[];
  decision_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  escalation_state?: "NONE" | "PENDING" | "ACKNOWLEDGED" | "RESOLVED" | "SUPERSEDED" | "ARCHIVED";
  integrity_state: TruthDashboardIntegrityState;
  restricted: boolean;
}>;

export type RuntimeEventExplorerRecord = Readonly<{
  event_id: string;
  truth_record_id?: string;
  ledger_entry_id?: string;
  tenant_id: string;
  mission_id?: string;
  event_type: "SYSTEM_EVENT" | "OPERATOR_EVENT" | "GOVERNANCE_EVENT" | "RUNTIME_HEALTH_EVENT" | "POLICY_CHECK_EVENT" | "AUTHORITY_CHECK_EVENT" | "QUERY_EVENT" | "WRITE_EVENT" | "READ_EVENT" | "REPLAY_EVENT" | "INTEGRITY_EVENT" | "FAILURE_EVENT" | "CONTAINMENT_EVENT";
  event_state: "PASS" | "FAIL" | "WARN" | "BLOCKED" | "ESCALATED";
  title: string;
  summary: string;
  timestamp: string;
  related_truth_record_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  restricted: boolean;
  redacted: boolean;
}>;

export type LedgerIntegrityExplorerRecord = Readonly<{
  truth_record_id: string;
  hash_chain_state: "VALID" | "BROKEN" | "UNKNOWN";
  tamper_detection_state: "CLEAR" | "SUSPECTED" | "CONFIRMED" | "UNKNOWN";
  integrity_state: TruthDashboardIntegrityState;
  previous_hash?: string;
  current_hash?: string;
  next_hash?: string;
  warnings: readonly string[];
}>;

export type RetentionArchiveExplorerRecord = Readonly<{
  truth_record_id: string;
  lifecycle_state: LedgerExplorerLifecycleState;
  archived_at?: string;
  superseded_at?: string;
  retention_state: "ACTIVE" | "RETAINED" | "ARCHIVED" | "EXPIRED";
  archive_refs: readonly string[];
}>;

export type HistoricalLedgerExplorerView = Readonly<{
  reconstruction_id: string;
  as_of: string;
  reconstruction_state: "COMPLETE" | "PARTIAL" | "RESTRICTED" | "CORRUPTED";
  reconstructed_record_refs: readonly string[];
  missing_refs: readonly string[];
  restricted_refs: readonly string[];
}>;

export type CrossLedgerCorrelationExplorerRecord = Readonly<{
  correlation_id: string;
  source_truth_record_id: string;
  target_truth_record_id: string;
  relationship_type: LedgerGraphRelationshipType;
  correlation_state: "VERIFIED" | "CANDIDATE" | "REDACTED" | "BROKEN";
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  restricted: boolean;
}>;

export type LedgerExplorerAuditEvent = Readonly<{
  audit_event_id: string;
  explorer_id: string;
  tenant_id: string;
  operator_id: string;
  event_type: "LEDGER_EXPLORER_OPENED" | "LEDGER_RECORD_VIEWED" | "TIMELINE_VIEWED" | "GRAPH_VIEWED" | "LINEAGE_VIEWED" | "EVIDENCE_RELATIONSHIP_VIEWED" | "RECOMMENDATION_DECISION_VIEWED" | "GOVERNANCE_VIEWED" | "RUNTIME_EVENT_VIEWED" | "INTEGRITY_CHAIN_VIEWED" | "ARCHIVE_VIEWED" | "HISTORICAL_RECONSTRUCTION_VIEWED" | "CROSS_LEDGER_CORRELATION_VIEWED" | "RESTRICTED_RECORD_ATTEMPTED" | "REDACTED_RECORD_VIEWED" | "QUERY_EXECUTED";
  target_ref?: string;
  access_result: TruthDashboardAccessResult;
  timestamp: string;
  governance_context: Readonly<{ policy_id?: string; access_level: string; restriction_reason?: string }>;
  appendOnly: true;
  sourceMutationAllowed: false;
}>;

export type LedgerExplorerQuery = Readonly<{
  tenant_id: string;
  operator_id: string;
  filters: Readonly<{
    mission_id?: string;
    truth_record_id?: string;
    event_type?: TruthDashboardRecordType;
    lifecycle_state?: LedgerExplorerLifecycleState;
    integrity_state?: TruthDashboardIntegrityState;
    search_text?: string;
    restricted?: boolean;
    archived?: boolean;
  }>;
  governance_context: Readonly<{ access_level: TruthDashboardAccessLevel; restricted_access_allowed: boolean; cross_ledger_allowed?: boolean }>;
}>;

export type LedgerExplorerDetail = Readonly<{
  record: LedgerExplorerRecord;
  drilldown: LedgerRecordDrilldown;
  timeline: readonly LedgerTimelineEvent[];
  graph: Readonly<{ nodes: readonly LedgerGraphNode[]; edges: readonly LedgerGraphEdge[] }>;
  evidence: readonly EvidenceRelationshipExplorerRecord[];
  recommendation_decision: readonly RecommendationDecisionExplorerRecord[];
  governance: readonly GovernanceEscalationExplorerRecord[];
  runtime_events: readonly RuntimeEventExplorerRecord[];
  integrity: LedgerIntegrityExplorerRecord;
  archive: RetentionArchiveExplorerRecord;
  historical_reconstruction: HistoricalLedgerExplorerView;
  cross_ledger_correlations: readonly CrossLedgerCorrelationExplorerRecord[];
  replay_refs: readonly string[];
  warnings: readonly string[];
  access_result: TruthDashboardAccessResult;
}>;

export type LedgerExplorerView = Readonly<{
  contract: LedgerExplorerContract;
  state: TruthDashboardState;
  records: readonly LedgerExplorerRecord[];
  selected_record: LedgerExplorerDetail;
  audit_events: readonly LedgerExplorerAuditEvent[];
  available_filters: Readonly<{
    event_types: readonly TruthDashboardRecordType[];
    lifecycle_states: readonly LedgerExplorerLifecycleState[];
    integrity_states: readonly TruthDashboardIntegrityState[];
  }>;
  guardrails: readonly string[];
  query_hash: string;
  generated_at: string;
  readOnly: true;
  mutationAllowed: false;
  approvalAllowed: false;
  executionAllowed: false;
  governanceOverrideAllowed: false;
}>;
