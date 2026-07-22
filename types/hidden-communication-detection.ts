export type ApprovedChannelType = "MISSION_BUS" | "GOVERNANCE_BUS" | "COORDINATION_BUS" | "REPLAY_BUS" | "INTEGRITY_BUS" | "OPERATOR_REVIEW_CHANNEL" | "CERTIFICATION_CHANNEL";
export type CommunicationState = "AUTHORIZED" | "UNAUTHORIZED" | "UNREGISTERED" | "HIDDEN_SUSPECTED" | "SIDE_CHANNEL_SUSPECTED" | "MISSING_EVIDENCE" | "REPLAY_READY" | "INVALID";
export type CommunicationMachineState = "MONITORING" | "CHANNEL_VALIDATION" | "PERMISSION_VALIDATION" | "LOGGING_VALIDATION" | "GOVERNANCE_VISIBILITY_CHECK" | "REPLAY_CAPTURE_CHECK" | "TENANT_ISOLATION_CHECK" | "LINEAGE_GRAPH_UPDATE" | "ISSUE_DETECTED" | "ESCALATION_PENDING" | "REPLAY_READY" | "CERTIFIED" | "FAILED";
export type HiddenCommunicationScenario = "BASELINE" | "UNAPPROVED_CHANNEL" | "UNLOGGED_MESSAGE" | "HIDDEN_GOVERNANCE_COMMUNICATION" | "MISSING_REPLAY_CAPTURE" | "CROSS_TENANT_COMMUNICATION" | "UNAUTHORIZED_EXCHANGE" | "HIDDEN_COMMUNICATION" | "SIDE_CHANNEL_SIGNALING" | "UNREGISTERED_MESSAGE" | "MISSING_COMMUNICATION_EVIDENCE" | "HIDDEN_LINEAGE_EDGE" | "REPLAY_MISMATCH" | "INTEGRITY_FAILURE" | "OPERATOR_VISIBILITY_INCOMPLETE";
export type HiddenCommunicationFailure = "UNAPPROVED_CHANNEL_DETECTED" | "UNLOGGED_MESSAGE_DETECTED" | "HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED" | "MISSING_REPLAY_CAPTURE_DETECTED" | "CROSS_TENANT_COMMUNICATION_DETECTED" | "UNAUTHORIZED_AGENT_EXCHANGE_DETECTED" | "HIDDEN_COMMUNICATION_DETECTED" | "SIDE_CHANNEL_SIGNALING_DETECTED" | "UNREGISTERED_MESSAGE_DETECTED" | "MISSING_COMMUNICATION_EVIDENCE_DETECTED" | "HIDDEN_LINEAGE_EDGE_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "INTEGRITY_HASH_INVALID" | "OPERATOR_VISIBILITY_INCOMPLETE";

export type ApprovedChannel = Readonly<{
  channel_id: string;
  channel_type: ApprovedChannelType;
  authorized_agents: readonly string[];
  tenant_scope: string;
  mission_scope: string;
  governance_reference: string;
  logging_required: boolean;
  replay_required: boolean;
  integrity_hash: string;
}>;

export type CommunicationPermissionRecord = Readonly<{
  source_agent: string;
  target_agent: string;
  allowed_message_types: readonly string[];
  approved_channels: readonly string[];
  governance_required: boolean;
  operator_review_required: boolean;
  replay_required: boolean;
  status: "ALLOWED" | "DENIED";
}>;

export type MessageRecord = Readonly<{
  message_id: string;
  coordination_session_id: string;
  source_agent: string;
  target_agent: string;
  channel_id: string;
  message_type: string;
  payload_hash: string;
  authorization_status: "AUTHORIZED" | "UNAUTHORIZED";
  governance_reference: string;
  authority_reference: string;
  tenant_id: string;
  timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type CommunicationLineageGraph = Readonly<{
  graph_id: string;
  message_nodes: readonly string[];
  agent_nodes: readonly string[];
  channel_nodes: readonly string[];
  governance_nodes: readonly string[];
  authority_nodes: readonly string[];
  replay_nodes: readonly string[];
  integrity_nodes: readonly string[];
  decision_nodes: readonly string[];
  hidden_edges_detected: boolean;
  integrity_hash: string;
}>;

export type CommunicationAuditEntry = Readonly<{
  audit_entry_id: string;
  coordination_session_id: string;
  message_id: string;
  source_agent: string;
  target_agent: string;
  channel_id: string;
  message_type: string;
  permission_result: "PASS" | "FAIL";
  governance_result: "PASS" | "FAIL";
  replay_result: "PASS" | "FAIL";
  integrity_result: "PASS" | "FAIL";
  timestamp: string;
}>;

export type CommunicationAlert = Readonly<{
  alert_id: string;
  communication_state: CommunicationState;
  affected_agents: readonly string[];
  suspected_channel: string;
  evidence_gap: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommended_action: string;
  failure: HiddenCommunicationFailure;
}>;

export type CommunicationEvidence = Readonly<{
  communication_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  source_agent: string;
  target_agent: string;
  channel_id: string;
  message_id: string;
  message_type: string;
  permission_evidence: string;
  governance_evidence: string;
  authority_evidence: string;
  tenant_evidence: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type HiddenCommunicationAnalysis = Readonly<{
  hidden_communication_contract_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  participating_agents: readonly string[];
  approved_channels: readonly ApprovedChannel[];
  communication_permission_matrix: readonly CommunicationPermissionRecord[];
  logging_policy: readonly string[];
  governance_visibility_policy: readonly string[];
  replay_capture_policy: readonly string[];
  tenant_isolation_policy: readonly string[];
  side_channel_detection_policy: readonly string[];
  integrity_policy: readonly string[];
  messages: readonly MessageRecord[];
  lineage_graph: CommunicationLineageGraph;
  audit_trail: readonly CommunicationAuditEntry[];
  alerts: readonly CommunicationAlert[];
  evidence: CommunicationEvidence;
  state: CommunicationMachineState;
  created_timestamp: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
  contract_hash: string;
}>;

export type HiddenCommunicationInput = Readonly<{
  scenario?: HiddenCommunicationScenario;
  tenant_id?: string;
  mission_id?: string;
  analysis?: HiddenCommunicationAnalysis;
}>;

export type HiddenCommunicationValidationResult = Readonly<{
  hidden_communication_contract_id: string | null;
  valid: boolean;
  contract_valid: boolean;
  channels_valid: boolean;
  message_logging_enforced: boolean;
  governance_visibility_complete: boolean;
  replay_capture_complete: boolean;
  tenant_isolated: boolean;
  permissions_valid: boolean;
  hidden_communication_absent: boolean;
  side_channel_absent: boolean;
  unregistered_messages_absent: boolean;
  evidence_complete: boolean;
  lineage_graph_complete: boolean;
  audit_trail_immutable: boolean;
  ordering_deterministic: boolean;
  replay_reproducible: boolean;
  integrity_valid: boolean;
  operator_visible: boolean;
  fail_closed: boolean;
  failures: readonly HiddenCommunicationFailure[];
  validation_hash: string;
}>;

export type HiddenCommunicationObservabilitySurface = Readonly<{
  hidden_communication_contract_id: string;
  tenant_id: string;
  mission_id: string;
  channel_count: number;
  message_count: number;
  alert_count: number;
  state: CommunicationMachineState;
  contract_hash: string;
}>;

export type HiddenCommunicationDetectionBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "hidden-communication-detection/v8ALT.7.10";
    final_state: "HIDDEN_COMMUNICATION_DETECTION_CERTIFIED";
    channel_types: readonly ApprovedChannelType[];
    communication_states: readonly CommunicationState[];
    machine_states: readonly CommunicationMachineState[];
    principles: readonly string[];
  }>;
  analysis: HiddenCommunicationAnalysis;
  validation: HiddenCommunicationValidationResult;
  observability: HiddenCommunicationObservabilitySurface;
}>;
