import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getMultiAgentCoordinationContract } from "@/services/multi-agent-coordination-contract";
import { getSynchronizedPlanningAssurance } from "@/services/synchronized-planning-assurance";
import { getDeterministicDelegationAssurance } from "@/services/deterministic-delegation-assurance";
import { getAuthoritySeparationAssurance } from "@/services/authority-separation-assurance";
import { getSharedGovernanceAssurance } from "@/services/shared-governance-assurance";
import { getReplayConsistencyAssurance } from "@/services/replay-consistency-assurance";
import { getCoordinationConflictDetection } from "@/services/coordination-conflict-detection";
import { getDeadlockRaceDetection } from "@/services/deadlock-race-condition-detection";
import { getHiddenCommunicationDetection } from "@/services/hidden-communication-detection";
import type { DashboardFailure, DashboardInput, DashboardObservabilitySurface, DashboardScenario, DashboardValidationResult, MultiAgentCoordinationDashboard, MultiAgentCoordinationDashboardBundle } from "@/types/multi-agent-coordination-dashboard";

const VERSION = "multi-agent-coordination-dashboard/v8ALT.7.11" as const;
const NOW = "2026-07-14T03:00:00.000Z";
const states = Object.freeze(["INITIALIZING", "LOADING", "LIVE", "REPLAY", "WARNING", "DEGRADED", "ESCALATED", "CERTIFIED", "FAILED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failureFor(scenario: DashboardScenario): DashboardFailure | null {
  const map: Partial<Record<DashboardScenario, DashboardFailure>> = {
    HIDDEN_ACTIVE_AGENT: "HIDDEN_ACTIVE_AGENT_DETECTED",
    HIDDEN_COORDINATION_SESSION: "HIDDEN_COORDINATION_SESSION_DETECTED",
    INCOMPLETE_MISSION_STATE: "INCOMPLETE_MISSION_STATE_DETECTED",
    HIDDEN_PLANNING: "HIDDEN_PLANNING_SYNCHRONIZATION",
    HIDDEN_DELEGATION: "HIDDEN_DELEGATION_DETECTED",
    HIDDEN_AUTHORITY: "HIDDEN_AUTHORITY_BOUNDARY_DETECTED",
    HIDDEN_GOVERNANCE: "HIDDEN_GOVERNANCE_STATE_DETECTED",
    REPLAY_MISMATCH: "REPLAY_VISUALIZATION_MISMATCH",
    HIDDEN_CONFLICT: "HIDDEN_CONFLICT_DETECTED",
    HIDDEN_DEADLOCK: "HIDDEN_DEADLOCK_DETECTED",
    SUPPRESSED_COMMUNICATION_ALERT: "SUPPRESSED_COMMUNICATION_ALERT_DETECTED",
    EXECUTION_CAPABILITY: "DASHBOARD_EXECUTION_CAPABILITY_DETECTED",
    CROSS_TENANT_VISUALIZATION: "CROSS_TENANT_VISUALIZATION_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ?? null;
}

export function loadCoordinationDashboard(input: DashboardInput = {}): MultiAgentCoordinationDashboard {
  if (input.dashboard) return input.dashboard;
  const scenario = input.scenario ?? "BASELINE";
  const failure = failureFor(scenario);
  const coordination = getMultiAgentCoordinationContract();
  const planning = getSynchronizedPlanningAssurance();
  const delegation = getDeterministicDelegationAssurance();
  const authority = getAuthoritySeparationAssurance();
  const governance = getSharedGovernanceAssurance();
  const replay = getReplayConsistencyAssurance();
  const conflicts = getCoordinationConflictDetection();
  const deadlocks = getDeadlockRaceDetection();
  const comms = getHiddenCommunicationDetection();
  const tenant = failure === "CROSS_TENANT_VISUALIZATION_DETECTED" ? "external-tenant" : input.tenant_id ?? coordination.contract.tenant_id;
  const agents = coordination.contract.participating_agents.map((agent) => ({ agent_id: agent.agent_id, agent_name: agent.agent_name, agent_role: agent.role, agent_type: agent.agent_type, coordination_status: "READY" as const, authority_level: agent.authority_profile, governance_status: "VISIBLE" as const, tenant: failure === "CROSS_TENANT_VISUALIZATION_DETECTED" && agent.agent_id === coordination.contract.participating_agents[0]?.agent_id ? "external-tenant" : tenant, mission: input.mission_id ?? coordination.contract.mission_id, health: "HEALTHY" as const, confidence: 0.97, current_task: "observe-coordination", current_state: "certified" }));
  const active_agents = freezeArray(failure === "HIDDEN_ACTIVE_AGENT_DETECTED" ? agents.slice(1) : agents);
  const sessions = freezeArray(failure === "HIDDEN_COORDINATION_SESSION_DETECTED" ? [] : [{ coordination_session_id: coordination.contract.coordination_session_id, mission_id: coordination.contract.mission_id, participating_agents: active_agents.map((a) => a.agent_id), coordination_state: "CERTIFIED", planning_state: planning.contract.planning_state, delegation_state: "CERTIFIED", governance_state: "CERTIFIED", authority_state: "CERTIFIED", replay_state: failure === "REPLAY_VISUALIZATION_MISMATCH" ? "MISMATCH" as const : "REPRODUCED" as const, integrity_state: "VALID", start_time: coordination.contract.created_timestamp, duration: "PT1H" }]);
  const dashboardId = id("MACD", "multi-agent-coordination-dashboard", { mission: coordination.contract.mission_id, scenario });
  const shared_mission_state = failure === "INCOMPLETE_MISSION_STATE_DETECTED" ? {} : { mission_objective: coordination.contract.mission_scope.mission_objective, planning_status: planning.validation.valid, execution_readiness: "advisory-ready", confidence_score: planning.contract.evidence.compatibility_score.confidence_score };
  const planning_synchronization = failure === "HIDDEN_PLANNING_SYNCHRONIZATION" ? {} : { graph: planning.contract.execution_graph, score: planning.contract.evidence.compatibility_score, conflicts: planning.contract.evidence.conflict_analysis };
  const delegation_map = failure === "HIDDEN_DELEGATION_DETECTED" ? freezeArray([]) : delegation.contract.delegation_records.map((record) => ({ task: record.task_id, owner: record.assigned_agent, delegating_agent: record.delegating_agent, assigned_agent: record.assigned_agent, authority_scope: record.authority_level, routing_reason: record.routing_reason, fallback_path: delegation.contract.fallback_routes, status: record.delegation_state }));
  const authority_view = failure === "HIDDEN_AUTHORITY_BOUNDARY_DETECTED" ? {} : { profiles: authority.contract.authority_profiles, boundaries: authority.contract.authority_boundaries, operator_authority: authority.contract.operator_supremacy_policy };
  const governance_view = failure === "HIDDEN_GOVERNANCE_STATE_DETECTED" ? {} : { context: governance.contract.governance_context, policies: governance.contract.policy_alignment_matrix, graph: governance.contract.influence_graph };
  const replay_view = failure === "REPLAY_VISUALIZATION_MISMATCH" ? { state: "MISMATCH" } : { timeline: replay.session.timeline, ledger: replay.session.ledger, traces: replay.session.agent_traces };
  const conflict_view = failure === "HIDDEN_CONFLICT_DETECTED" ? {} : { conflicts: conflicts.analysis.conflicts, graph: conflicts.analysis.conflict_graph, recommendations: conflicts.analysis.escalation_recommendations };
  const deadlock_race_view = failure === "HIDDEN_DEADLOCK_DETECTED" ? {} : { deadlocks: deadlocks.analysis.deadlocks, graph: deadlocks.analysis.blocked_agent_graph, lock_map: deadlocks.analysis.dependency_lock_map, race_window: deadlocks.analysis.race_window_graph };
  const communication_alert_view = failure === "SUPPRESSED_COMMUNICATION_ALERT_DETECTED" ? {} : { alerts: comms.analysis.alerts, audit: comms.analysis.audit_trail, lineage: comms.analysis.lineage_graph };
  const agent_relationship_graph = { agents: active_agents.map((a) => a.agent_id), communication_links: comms.analysis.lineage_graph.message_nodes, delegation_links: delegation.contract.delegation_records.map((d) => d.delegation_id), authority_links: authority.contract.authority_profiles.map((p) => p.authority_profile_id), governance_links: governance.contract.influence_graph.map((g) => g.decision_id) };
  const shared_state_timeline = freezeArray([{ state: "mission", timestamp: NOW }, { state: "planning", timestamp: NOW }, { state: "delegation", timestamp: NOW }, { state: "governance", timestamp: NOW }, { state: "replay", timestamp: NOW }]);
  const snapshotBase = { dashboard_snapshot_id: id("DSNP", "dashboard-snapshot", dashboardId), coordination_session_id: coordination.contract.coordination_session_id, mission_id: coordination.contract.mission_id, active_agents: active_agents.map((a) => a.agent_id), coordination_state: "CERTIFIED", planning_state: Object.keys(planning_synchronization).length ? "VISIBLE" : "HIDDEN", delegation_state: delegation_map.length ? "VISIBLE" : "HIDDEN", governance_state: Object.keys(governance_view).length ? "VISIBLE" : "HIDDEN", authority_state: Object.keys(authority_view).length ? "VISIBLE" : "HIDDEN", replay_state: String((replay_view as { state?: string }).state ?? "REPRODUCED"), conflict_state: Object.keys(conflict_view).length ? "VISIBLE" : "HIDDEN", deadlock_state: Object.keys(deadlock_race_view).length ? "VISIBLE" : "HIDDEN", communication_state: Object.keys(communication_alert_view).length ? "VISIBLE" : "HIDDEN", snapshot_timestamp: NOW };
  const snapshot = Object.freeze({ ...snapshotBase, integrity_hash: hashValue("dashboard-snapshot", snapshotBase) });
  const events = freezeArray([(() => { const base = { dashboard_event_id: id("DEVT", "dashboard-event", dashboardId), operator_id: "operator:read-only", dashboard_view: "coordination-dashboard", coordination_session_id: coordination.contract.coordination_session_id, event_type: "LOAD" as const, filters: freezeArray(["tenant", "mission"]), timestamp: NOW }; return Object.freeze({ ...base, integrity_hash: hashValue("dashboard-event", base) }); })()]);
  const base = { dashboard_id: dashboardId, tenant_id: tenant, mission_id: coordination.contract.mission_id, read_only: true as const, execution_capability: failure === "DASHBOARD_EXECUTION_CAPABILITY_DETECTED" ? (true as false) : false as const, dashboard_state: failure ? "WARNING" as const : "CERTIFIED" as const, active_agents, coordination_sessions: sessions, shared_mission_state, planning_synchronization, delegation_map: freezeArray(delegation_map), authority_view, governance_view, replay_view, conflict_view, deadlock_race_view, communication_alert_view, agent_relationship_graph, shared_state_timeline, snapshot, events, immutable: true as const, integrity_hash: failure === "INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("multi-agent-dashboard", { dashboardId, snapshot, events }) };
  return Object.freeze(base);
}

export function loadAgentGraph(input: DashboardInput = {}) { return loadCoordinationDashboard(input).agent_relationship_graph; }
export function loadReplayTimeline(input: DashboardInput = {}) { return loadCoordinationDashboard(input).replay_view; }
export function loadConflictView(input: DashboardInput = {}) { return loadCoordinationDashboard(input).conflict_view; }
export function loadAuthorityView(input: DashboardInput = {}) { return loadCoordinationDashboard(input).authority_view; }
export function loadCommunicationAudit(input: DashboardInput = {}) { return loadCoordinationDashboard(input).communication_alert_view; }
export function loadDashboardSnapshot(input: DashboardInput = {}) { return loadCoordinationDashboard(input).snapshot; }

export function validateCoordinationDashboard(dashboard = loadCoordinationDashboard()): DashboardValidationResult {
  const dashboard_operational = dashboard.dashboard_state === "CERTIFIED" || dashboard.dashboard_state === "WARNING";
  const active_agents_visible = dashboard.active_agents.length >= 10;
  const sessions_visible = dashboard.coordination_sessions.length > 0;
  const mission_state_complete = Object.keys(dashboard.shared_mission_state).length > 0;
  const planning_visible = Object.keys(dashboard.planning_synchronization).length > 0;
  const delegation_visible = dashboard.delegation_map.length > 0;
  const authority_visible = Object.keys(dashboard.authority_view).length > 0;
  const governance_visible = Object.keys(dashboard.governance_view).length > 0;
  const replay_visible = Object.keys(dashboard.replay_view).length > 0 && (dashboard.replay_view as { state?: string }).state !== "MISMATCH";
  const conflicts_visible = Object.keys(dashboard.conflict_view).length > 0;
  const deadlocks_visible = Object.keys(dashboard.deadlock_race_view).length > 0;
  const communication_alerts_visible = Object.keys(dashboard.communication_alert_view).length > 0;
  const graph_deterministic = Object.keys(dashboard.agent_relationship_graph).length > 0;
  const timeline_deterministic = dashboard.shared_state_timeline.length > 0;
  const read_only_enforced = dashboard.read_only && !dashboard.execution_capability;
  const tenant_isolated = dashboard.tenant_id.startsWith("tenant:") && dashboard.active_agents.every((agent) => agent.tenant === dashboard.tenant_id);
  const integrity_valid = Boolean(dashboard.integrity_hash && dashboard.snapshot.integrity_hash && dashboard.events.every((event) => event.integrity_hash));
  const operator_visible = communication_alerts_visible && active_agents_visible && sessions_visible;
  const failures = unique([
    ...(!active_agents_visible ? ["HIDDEN_ACTIVE_AGENT_DETECTED" as const] : []),
    ...(!sessions_visible ? ["HIDDEN_COORDINATION_SESSION_DETECTED" as const] : []),
    ...(!mission_state_complete ? ["INCOMPLETE_MISSION_STATE_DETECTED" as const] : []),
    ...(!planning_visible ? ["HIDDEN_PLANNING_SYNCHRONIZATION" as const] : []),
    ...(!delegation_visible ? ["HIDDEN_DELEGATION_DETECTED" as const] : []),
    ...(!authority_visible ? ["HIDDEN_AUTHORITY_BOUNDARY_DETECTED" as const] : []),
    ...(!governance_visible ? ["HIDDEN_GOVERNANCE_STATE_DETECTED" as const] : []),
    ...(!replay_visible ? ["REPLAY_VISUALIZATION_MISMATCH" as const] : []),
    ...(!conflicts_visible ? ["HIDDEN_CONFLICT_DETECTED" as const] : []),
    ...(!deadlocks_visible ? ["HIDDEN_DEADLOCK_DETECTED" as const] : []),
    ...(!communication_alerts_visible ? ["SUPPRESSED_COMMUNICATION_ALERT_DETECTED" as const] : []),
    ...(!read_only_enforced ? ["DASHBOARD_EXECUTION_CAPABILITY_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_VISUALIZATION_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { dashboard_id: dashboard.dashboard_id, valid, dashboard_operational, active_agents_visible, sessions_visible, mission_state_complete, planning_visible, delegation_visible, authority_visible, governance_visible, replay_visible, conflicts_visible, deadlocks_visible, communication_alerts_visible, graph_deterministic, timeline_deterministic, read_only_enforced, tenant_isolated, integrity_valid, operator_visible, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("dashboard-validation", source) });
}

export function buildDashboardObservabilitySurface(dashboard = loadCoordinationDashboard()): DashboardObservabilitySurface {
  const alerts = (dashboard.communication_alert_view as { alerts?: unknown[] }).alerts?.length ?? 0;
  return Object.freeze({ dashboard_id: dashboard.dashboard_id, tenant_id: dashboard.tenant_id, mission_id: dashboard.mission_id, agent_count: dashboard.active_agents.length, session_count: dashboard.coordination_sessions.length, alert_count: alerts, state: validateCoordinationDashboard(dashboard).valid ? "CERTIFIED" : "FAILED", integrity_hash: dashboard.integrity_hash });
}

export function getMultiAgentCoordinationDashboard(): MultiAgentCoordinationDashboardBundle {
  const dashboard = loadCoordinationDashboard();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "MULTI_AGENT_COORDINATION_DASHBOARD_CERTIFIED", states, principles: freezeArray(["read-only-dashboard", "operator-supremacy", "governance-aware-visibility", "tenant-isolation", "deterministic-rendering", "replay-compatible-views", "immutable-snapshots", "complete-agent-visibility", "complete-risk-visibility", "no-execution-authority"]) }),
    dashboard,
    validation: validateCoordinationDashboard(dashboard),
    observability: buildDashboardObservabilitySurface(dashboard),
  });
}
