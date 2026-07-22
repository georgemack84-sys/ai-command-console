import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { analyzeWaitGraph } from "@/services/deadlock-race-condition-detection";
import type {
  ApprovedChannel,
  ApprovedChannelType,
  CommunicationAlert,
  CommunicationMachineState,
  CommunicationState,
  HiddenCommunicationAnalysis,
  HiddenCommunicationDetectionBundle,
  HiddenCommunicationFailure,
  HiddenCommunicationInput,
  HiddenCommunicationObservabilitySurface,
  HiddenCommunicationScenario,
  HiddenCommunicationValidationResult,
} from "@/types/hidden-communication-detection";

const VERSION = "hidden-communication-detection/v8ALT.7.10" as const;
const NOW = "2026-07-14T02:00:00.000Z";
const channelTypes = Object.freeze(["MISSION_BUS", "GOVERNANCE_BUS", "COORDINATION_BUS", "REPLAY_BUS", "INTEGRITY_BUS", "OPERATOR_REVIEW_CHANNEL", "CERTIFICATION_CHANNEL"] as const);
const commStates = Object.freeze(["AUTHORIZED", "UNAUTHORIZED", "UNREGISTERED", "HIDDEN_SUSPECTED", "SIDE_CHANNEL_SUSPECTED", "MISSING_EVIDENCE", "REPLAY_READY", "INVALID"] as const);
const machineStates = Object.freeze(["MONITORING", "CHANNEL_VALIDATION", "PERMISSION_VALIDATION", "LOGGING_VALIDATION", "GOVERNANCE_VISIBILITY_CHECK", "REPLAY_CAPTURE_CHECK", "TENANT_ISOLATION_CHECK", "LINEAGE_GRAPH_UPDATE", "ISSUE_DETECTED", "ESCALATION_PENDING", "REPLAY_READY", "CERTIFIED", "FAILED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failureFor(scenario: HiddenCommunicationScenario): HiddenCommunicationFailure | null {
  const map: Partial<Record<HiddenCommunicationScenario, HiddenCommunicationFailure>> = {
    UNAPPROVED_CHANNEL: "UNAPPROVED_CHANNEL_DETECTED",
    UNLOGGED_MESSAGE: "UNLOGGED_MESSAGE_DETECTED",
    HIDDEN_GOVERNANCE_COMMUNICATION: "HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED",
    MISSING_REPLAY_CAPTURE: "MISSING_REPLAY_CAPTURE_DETECTED",
    CROSS_TENANT_COMMUNICATION: "CROSS_TENANT_COMMUNICATION_DETECTED",
    UNAUTHORIZED_EXCHANGE: "UNAUTHORIZED_AGENT_EXCHANGE_DETECTED",
    HIDDEN_COMMUNICATION: "HIDDEN_COMMUNICATION_DETECTED",
    SIDE_CHANNEL_SIGNALING: "SIDE_CHANNEL_SIGNALING_DETECTED",
    UNREGISTERED_MESSAGE: "UNREGISTERED_MESSAGE_DETECTED",
    MISSING_COMMUNICATION_EVIDENCE: "MISSING_COMMUNICATION_EVIDENCE_DETECTED",
    HIDDEN_LINEAGE_EDGE: "HIDDEN_LINEAGE_EDGE_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
    OPERATOR_VISIBILITY_INCOMPLETE: "OPERATOR_VISIBILITY_INCOMPLETE",
  };
  return map[scenario] ?? null;
}

function analysisHash(analysis: Omit<HiddenCommunicationAnalysis, "contract_hash"> | HiddenCommunicationAnalysis): string {
  const { contract_hash: _hash, ...source } = analysis as HiddenCommunicationAnalysis;
  return hashValue("hidden-communication-analysis", source);
}

function alertFor(failure: HiddenCommunicationFailure | null, agents: readonly string[], channel: string): readonly CommunicationAlert[] {
  if (!failure) return freezeArray([]);
  const state: Record<HiddenCommunicationFailure, CommunicationState> = {
    UNAPPROVED_CHANNEL_DETECTED: "UNAUTHORIZED",
    UNLOGGED_MESSAGE_DETECTED: "UNREGISTERED",
    HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED: "HIDDEN_SUSPECTED",
    MISSING_REPLAY_CAPTURE_DETECTED: "MISSING_EVIDENCE",
    CROSS_TENANT_COMMUNICATION_DETECTED: "UNAUTHORIZED",
    UNAUTHORIZED_AGENT_EXCHANGE_DETECTED: "UNAUTHORIZED",
    HIDDEN_COMMUNICATION_DETECTED: "HIDDEN_SUSPECTED",
    SIDE_CHANNEL_SIGNALING_DETECTED: "SIDE_CHANNEL_SUSPECTED",
    UNREGISTERED_MESSAGE_DETECTED: "UNREGISTERED",
    MISSING_COMMUNICATION_EVIDENCE_DETECTED: "MISSING_EVIDENCE",
    HIDDEN_LINEAGE_EDGE_DETECTED: "HIDDEN_SUSPECTED",
    REPLAY_MISMATCH_DETECTED: "INVALID",
    INTEGRITY_HASH_INVALID: "INVALID",
    OPERATOR_VISIBILITY_INCOMPLETE: "INVALID",
  };
  return freezeArray([Object.freeze({ alert_id: id("HCAL", "hidden-communication-alert", failure), communication_state: state[failure], affected_agents: agents.slice(0, 2), suspected_channel: channel, evidence_gap: failure, severity: "CRITICAL" as const, recommended_action: "Fail closed and preserve communication visibility evidence for operator/governance review.", failure })]);
}

export function buildHiddenCommunicationAnalysis(input: HiddenCommunicationInput = {}): HiddenCommunicationAnalysis {
  if (input.analysis) return input.analysis;
  const scenario = input.scenario ?? "BASELINE";
  const failure = failureFor(scenario);
  const deadlock = analyzeWaitGraph({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const contractId = id("HCDC", "hidden-communication-contract", { mission: deadlock.contract.mission_id, scenario });
  const tenant = failure === "CROSS_TENANT_COMMUNICATION_DETECTED" ? "external-tenant" : deadlock.contract.tenant_id;
  const agents = freezeArray(deadlock.contract.participating_agents);
  const channels: readonly ApprovedChannel[] = freezeArray(channelTypes.map((type, index) => {
    const base = { channel_id: failure === "UNAPPROVED_CHANNEL_DETECTED" && index === 1 ? "channel:unknown" : `channel:${type.toLowerCase()}`, channel_type: type, authorized_agents: agents, tenant_scope: failure === "CROSS_TENANT_COMMUNICATION_DETECTED" && index === 1 ? "external-tenant" : tenant, mission_scope: deadlock.contract.mission_id, governance_reference: failure === "HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED" && index === 1 ? "" : deadlock.contract.governance_reference, logging_required: true, replay_required: failure !== "MISSING_REPLAY_CAPTURE_DETECTED", };
    return Object.freeze({ ...base, integrity_hash: hashValue("approved-communication-channel", base) });
  }));
  const primaryChannel = channels[2]?.channel_id ?? "channel:coordination_bus";
  const permissions = freezeArray([{ source_agent: agents[0], target_agent: agents[1], allowed_message_types: freezeArray(["STATUS", "EVIDENCE", "GOVERNANCE"]), approved_channels: freezeArray([primaryChannel]), governance_required: true, operator_review_required: false, replay_required: true, status: failure === "UNAUTHORIZED_AGENT_EXCHANGE_DETECTED" ? "DENIED" as const : "ALLOWED" as const }]);
  const messageBase = { message_id: failure === "UNREGISTERED_MESSAGE_DETECTED" ? "" : id("MSG", "hidden-communication-message", contractId), coordination_session_id: deadlock.contract.coordination_session_id, source_agent: agents[0], target_agent: failure === "UNAUTHORIZED_AGENT_EXCHANGE_DETECTED" ? "agent:executor" : agents[1], channel_id: failure === "UNAPPROVED_CHANNEL_DETECTED" ? "channel:unknown" : primaryChannel, message_type: "STATUS", payload_hash: hashValue("message-payload", { contractId }), authorization_status: failure === "UNAUTHORIZED_AGENT_EXCHANGE_DETECTED" ? "UNAUTHORIZED" as const : "AUTHORIZED" as const, governance_reference: failure === "HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED" ? "" : deadlock.contract.governance_reference, authority_reference: deadlock.contract.authority_reference, tenant_id: tenant, timestamp: NOW, lineage_reference: failure === "HIDDEN_LINEAGE_EDGE_DETECTED" ? "" : `lineage:message:${contractId}`, replay_reference: failure === "MISSING_REPLAY_CAPTURE_DETECTED" || failure === "REPLAY_MISMATCH_DETECTED" ? "" : `replay:message:${contractId}` };
  const messages = failure === "UNLOGGED_MESSAGE_DETECTED" ? freezeArray([]) : freezeArray([Object.freeze({ ...messageBase, integrity_hash: failure === "INTEGRITY_HASH_INVALID" ? "" : hashValue("message-record", messageBase) })]);
  const graphBase = { graph_id: id("CMLG", "communication-lineage-graph", contractId), message_nodes: freezeArray(messages.map((m) => m.message_id).filter(Boolean)), agent_nodes: agents, channel_nodes: freezeArray(channels.map((c) => c.channel_id)), governance_nodes: freezeArray(channels.map((c) => c.governance_reference).filter(Boolean)), authority_nodes: freezeArray([deadlock.contract.authority_reference]), replay_nodes: freezeArray(messages.map((m) => m.replay_reference).filter(Boolean)), integrity_nodes: freezeArray(messages.map((m) => m.integrity_hash).filter(Boolean)), decision_nodes: failure === "MISSING_COMMUNICATION_EVIDENCE_DETECTED" ? freezeArray(["decision:orphan"]) : freezeArray(["decision:coordinated"]), hidden_edges_detected: failure === "HIDDEN_LINEAGE_EDGE_DETECTED" || failure === "HIDDEN_COMMUNICATION_DETECTED" };
  const lineage_graph = Object.freeze({ ...graphBase, integrity_hash: failure === "INTEGRITY_HASH_INVALID" ? "" : hashValue("communication-lineage-graph", graphBase) });
  const audit_trail = freezeArray(messages.map((m) => Object.freeze({ audit_entry_id: id("AUD", "communication-audit", m.message_id), coordination_session_id: m.coordination_session_id, message_id: m.message_id, source_agent: m.source_agent, target_agent: m.target_agent, channel_id: m.channel_id, message_type: m.message_type, permission_result: m.authorization_status === "AUTHORIZED" ? "PASS" as const : "FAIL" as const, governance_result: m.governance_reference ? "PASS" as const : "FAIL" as const, replay_result: m.replay_reference ? "PASS" as const : "FAIL" as const, integrity_result: m.integrity_hash ? "PASS" as const : "FAIL" as const, timestamp: m.timestamp })));
  const alerts = alertFor(failure, agents, primaryChannel);
  const evidenceBase = { communication_validation_id: id("HCEV", "communication-evidence", contractId), coordination_session_id: deadlock.contract.coordination_session_id, mission_id: deadlock.contract.mission_id, source_agent: agents[0], target_agent: agents[1], channel_id: primaryChannel, message_id: messages[0]?.message_id ?? "", message_type: "STATUS", permission_evidence: permissions[0]?.status ?? "", governance_evidence: messages[0]?.governance_reference ?? "", authority_evidence: deadlock.contract.authority_reference, tenant_evidence: tenant, replay_reference: messages[0]?.replay_reference ?? "", lineage_reference: messages[0]?.lineage_reference ?? "", timestamp: NOW };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: failure === "INTEGRITY_HASH_INVALID" ? "" : hashValue("communication-evidence", evidenceBase) });
  const base = { hidden_communication_contract_id: contractId, coordination_session_id: deadlock.contract.coordination_session_id, mission_id: deadlock.contract.mission_id, tenant_id: tenant, participating_agents: agents, approved_channels: channels, communication_permission_matrix: permissions, logging_policy: freezeArray(["append-only", "deterministic-ordering", "immutable-history"]), governance_visibility_policy: freezeArray(["governance-reference-required", ...(failure === "OPERATOR_VISIBILITY_INCOMPLETE" ? [] : ["operator-visible"])]), replay_capture_policy: freezeArray(["message-replay-reference-required", "payload-hash-required"]), tenant_isolation_policy: freezeArray(["tenant-scope-required", "no-cross-tenant-channel"]), side_channel_detection_policy: freezeArray(["timing-pattern-detection", "metadata-signal-detection", "resource-lock-signal-detection"]), integrity_policy: freezeArray(["hash-message", "hash-lineage", "hash-audit"]), messages, lineage_graph, audit_trail, alerts, evidence, state: failure ? "ISSUE_DETECTED" as CommunicationMachineState : "CERTIFIED" as CommunicationMachineState, created_timestamp: NOW, immutable: true as const, append_only: true as const, integrity_hash: failure === "INTEGRITY_HASH_INVALID" ? "" : hashValue("hidden-communication-contract", { contractId, channels, permissions, messages, evidence }) };
  return Object.freeze({ ...base, contract_hash: analysisHash(base as Omit<HiddenCommunicationAnalysis, "contract_hash">) });
}

export function validateChannel(input: HiddenCommunicationInput = {}) { const a = buildHiddenCommunicationAnalysis(input); return { channels_valid: validateHiddenCommunication(a).channels_valid, channels: a.approved_channels }; }
export function validatePermission(input: HiddenCommunicationInput = {}) { const a = buildHiddenCommunicationAnalysis(input); return { permissions_valid: validateHiddenCommunication(a).permissions_valid, permission_matrix: a.communication_permission_matrix }; }
export function registerMessage(input: HiddenCommunicationInput = {}) { return buildHiddenCommunicationAnalysis(input).messages; }
export function verifyMessageLineage(input: HiddenCommunicationInput = {}) { return buildHiddenCommunicationAnalysis(input).lineage_graph; }
export function detectHiddenCommunication(input: HiddenCommunicationInput = {}) { return buildHiddenCommunicationAnalysis(input).alerts.filter((a) => a.communication_state === "HIDDEN_SUSPECTED" || a.failure === "UNLOGGED_MESSAGE_DETECTED" || a.failure === "UNREGISTERED_MESSAGE_DETECTED"); }
export function detectSideChannel(input: HiddenCommunicationInput = {}) { return buildHiddenCommunicationAnalysis(input).alerts.filter((a) => a.communication_state === "SIDE_CHANNEL_SUSPECTED"); }
export function generateCommunicationReport(input: HiddenCommunicationInput = {}) { const analysis = buildHiddenCommunicationAnalysis(input); return { analysis, validation: validateHiddenCommunication(analysis), alerts: analysis.alerts }; }

export function validateHiddenCommunication(analysis = buildHiddenCommunicationAnalysis()): HiddenCommunicationValidationResult {
  const contract_valid = analysis.immutable && analysis.append_only && Boolean(analysis.integrity_hash);
  const channels_valid = analysis.approved_channels.every((c) => c.channel_id.startsWith("channel:") && channelTypes.includes(c.channel_type) && c.governance_reference && c.logging_required && c.replay_required && c.integrity_hash && c.tenant_scope === analysis.tenant_id);
  const message_logging_enforced = analysis.messages.length > 0 && analysis.audit_trail.length === analysis.messages.length;
  const governance_visibility_complete = analysis.messages.every((m) => m.governance_reference) && analysis.governance_visibility_policy.includes("operator-visible");
  const replay_capture_complete = analysis.messages.every((m) => m.replay_reference && m.payload_hash);
  const tenant_isolated = analysis.tenant_id.startsWith("tenant:") && analysis.messages.every((m) => m.tenant_id === analysis.tenant_id) && analysis.approved_channels.every((c) => c.tenant_scope === analysis.tenant_id);
  const permissions_valid = analysis.communication_permission_matrix.every((p) => p.status === "ALLOWED") && analysis.messages.every((m) => m.authorization_status === "AUTHORIZED");
  const hidden_communication_absent = !analysis.alerts.some((a) => a.failure === "HIDDEN_COMMUNICATION_DETECTED" || a.failure === "HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED" || a.failure === "UNLOGGED_MESSAGE_DETECTED");
  const side_channel_absent = !analysis.alerts.some((a) => a.failure === "SIDE_CHANNEL_SIGNALING_DETECTED");
  const unregistered_messages_absent = analysis.messages.every((m) => m.message_id && m.channel_id && m.source_agent && m.target_agent && m.governance_reference && m.replay_reference && m.integrity_hash);
  const evidence_complete = Boolean(analysis.evidence.message_id && analysis.evidence.permission_evidence && analysis.evidence.governance_evidence && analysis.evidence.replay_reference && analysis.evidence.lineage_reference);
  const lineage_graph_complete = !analysis.lineage_graph.hidden_edges_detected && analysis.lineage_graph.message_nodes.length === analysis.messages.length && Boolean(analysis.lineage_graph.integrity_hash);
  const audit_trail_immutable = analysis.audit_trail.every((a) => a.permission_result === "PASS" && a.governance_result === "PASS" && a.replay_result === "PASS" && a.integrity_result === "PASS");
  const ordering_deterministic = analysis.messages.every((m, i, rows) => i === 0 || rows[i - 1]!.timestamp <= m.timestamp);
  const replay_reproducible = replay_capture_complete && !analysis.alerts.some((a) => a.failure === "REPLAY_MISMATCH_DETECTED");
  const integrity_valid = Boolean(analysis.integrity_hash && analysis.contract_hash && analysisHash(analysis) === analysis.contract_hash && analysis.evidence.integrity_hash);
  const operator_visible = analysis.governance_visibility_policy.includes("operator-visible");
  const failures = unique([
    ...(!channels_valid ? ["UNAPPROVED_CHANNEL_DETECTED" as const] : []),
    ...(!message_logging_enforced ? ["UNLOGGED_MESSAGE_DETECTED" as const] : []),
    ...(!governance_visibility_complete ? ["HIDDEN_GOVERNANCE_COMMUNICATION_DETECTED" as const] : []),
    ...(!replay_capture_complete ? ["MISSING_REPLAY_CAPTURE_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_COMMUNICATION_DETECTED" as const] : []),
    ...(!permissions_valid ? ["UNAUTHORIZED_AGENT_EXCHANGE_DETECTED" as const] : []),
    ...(!hidden_communication_absent ? ["HIDDEN_COMMUNICATION_DETECTED" as const] : []),
    ...(!side_channel_absent ? ["SIDE_CHANNEL_SIGNALING_DETECTED" as const] : []),
    ...(!unregistered_messages_absent ? ["UNREGISTERED_MESSAGE_DETECTED" as const] : []),
    ...(!evidence_complete ? ["MISSING_COMMUNICATION_EVIDENCE_DETECTED" as const] : []),
    ...(!lineage_graph_complete ? ["HIDDEN_LINEAGE_EDGE_DETECTED" as const] : []),
    ...(!replay_reproducible ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!operator_visible ? ["OPERATOR_VISIBILITY_INCOMPLETE" as const] : []),
    ...analysis.alerts.map((a) => a.failure),
  ]);
  const valid = failures.length === 0;
  const source = { hidden_communication_contract_id: analysis.hidden_communication_contract_id, valid, contract_valid, channels_valid, message_logging_enforced, governance_visibility_complete, replay_capture_complete, tenant_isolated, permissions_valid, hidden_communication_absent, side_channel_absent, unregistered_messages_absent, evidence_complete, lineage_graph_complete, audit_trail_immutable, ordering_deterministic, replay_reproducible, integrity_valid, operator_visible, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("hidden-communication-validation", source) });
}

export function buildHiddenCommunicationObservabilitySurface(analysis = buildHiddenCommunicationAnalysis()): HiddenCommunicationObservabilitySurface {
  return Object.freeze({ hidden_communication_contract_id: analysis.hidden_communication_contract_id, tenant_id: analysis.tenant_id, mission_id: analysis.mission_id, channel_count: analysis.approved_channels.length, message_count: analysis.messages.length, alert_count: analysis.alerts.length, state: analysis.state, contract_hash: analysis.contract_hash });
}

export function getHiddenCommunicationDetection(): HiddenCommunicationDetectionBundle {
  const analysis = buildHiddenCommunicationAnalysis();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "HIDDEN_COMMUNICATION_DETECTION_CERTIFIED", channel_types: channelTypes, communication_states: commStates, machine_states: machineStates, principles: freezeArray(["approved-channels-only", "mandatory-message-logging", "governance-visible-communication", "operator-visible-communication", "deterministic-replay-capture", "tenant-isolation", "authority-separation", "immutable-communication-lineage", "fail-closed-validation", "no-communication-mutation"]) }),
    analysis,
    validation: validateHiddenCommunication(analysis),
    observability: buildHiddenCommunicationObservabilitySurface(analysis),
  });
}
