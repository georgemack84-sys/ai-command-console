export type DashboardState = "INITIALIZING" | "LOADING" | "LIVE" | "REPLAY" | "WARNING" | "DEGRADED" | "ESCALATED" | "CERTIFIED" | "FAILED";
export type AgentDisplayState = "INITIALIZING" | "READY" | "PLANNING" | "COORDINATING" | "WAITING" | "BLOCKED" | "ESCALATED" | "PAUSED" | "REPLAYING" | "COMPLETED" | "FAILED";
export type ReplayDisplayState = "READY" | "RUNNING" | "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "FAILED";
export type DashboardScenario = "BASELINE" | "HIDDEN_ACTIVE_AGENT" | "HIDDEN_COORDINATION_SESSION" | "INCOMPLETE_MISSION_STATE" | "HIDDEN_PLANNING" | "HIDDEN_DELEGATION" | "HIDDEN_AUTHORITY" | "HIDDEN_GOVERNANCE" | "REPLAY_MISMATCH" | "HIDDEN_CONFLICT" | "HIDDEN_DEADLOCK" | "SUPPRESSED_COMMUNICATION_ALERT" | "EXECUTION_CAPABILITY" | "CROSS_TENANT_VISUALIZATION" | "INTEGRITY_FAILURE";
export type DashboardFailure = "HIDDEN_ACTIVE_AGENT_DETECTED" | "HIDDEN_COORDINATION_SESSION_DETECTED" | "INCOMPLETE_MISSION_STATE_DETECTED" | "HIDDEN_PLANNING_SYNCHRONIZATION" | "HIDDEN_DELEGATION_DETECTED" | "HIDDEN_AUTHORITY_BOUNDARY_DETECTED" | "HIDDEN_GOVERNANCE_STATE_DETECTED" | "REPLAY_VISUALIZATION_MISMATCH" | "HIDDEN_CONFLICT_DETECTED" | "HIDDEN_DEADLOCK_DETECTED" | "SUPPRESSED_COMMUNICATION_ALERT_DETECTED" | "DASHBOARD_EXECUTION_CAPABILITY_DETECTED" | "CROSS_TENANT_VISUALIZATION_DETECTED" | "INTEGRITY_VERIFICATION_FAILED";

export type AgentMonitorRecord = Readonly<{
  agent_id: string;
  agent_name: string;
  agent_role: string;
  agent_type: string;
  coordination_status: AgentDisplayState;
  authority_level: string;
  governance_status: "VISIBLE" | "HIDDEN";
  tenant: string;
  mission: string;
  health: "HEALTHY" | "DEGRADED" | "FAILED";
  confidence: number;
  current_task: string;
  current_state: string;
}>;

export type CoordinationSessionView = Readonly<{
  coordination_session_id: string;
  mission_id: string;
  participating_agents: readonly string[];
  coordination_state: string;
  planning_state: string;
  delegation_state: string;
  governance_state: string;
  authority_state: string;
  replay_state: ReplayDisplayState;
  integrity_state: string;
  start_time: string;
  duration: string;
}>;

export type DashboardSnapshot = Readonly<{
  dashboard_snapshot_id: string;
  coordination_session_id: string;
  mission_id: string;
  active_agents: readonly string[];
  coordination_state: string;
  planning_state: string;
  delegation_state: string;
  governance_state: string;
  authority_state: string;
  replay_state: string;
  conflict_state: string;
  deadlock_state: string;
  communication_state: string;
  snapshot_timestamp: string;
  integrity_hash: string;
}>;

export type DashboardEvent = Readonly<{
  dashboard_event_id: string;
  operator_id: string;
  dashboard_view: string;
  coordination_session_id: string;
  event_type: "LOAD" | "INSPECT" | "REPLAY_VIEW" | "FILTER";
  filters: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type MultiAgentCoordinationDashboard = Readonly<{
  dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  read_only: true;
  execution_capability: false;
  dashboard_state: DashboardState;
  active_agents: readonly AgentMonitorRecord[];
  coordination_sessions: readonly CoordinationSessionView[];
  shared_mission_state: Record<string, unknown>;
  planning_synchronization: Record<string, unknown>;
  delegation_map: readonly Record<string, unknown>[];
  authority_view: Record<string, unknown>;
  governance_view: Record<string, unknown>;
  replay_view: Record<string, unknown>;
  conflict_view: Record<string, unknown>;
  deadlock_race_view: Record<string, unknown>;
  communication_alert_view: Record<string, unknown>;
  agent_relationship_graph: Record<string, unknown>;
  shared_state_timeline: readonly Record<string, unknown>[];
  snapshot: DashboardSnapshot;
  events: readonly DashboardEvent[];
  immutable: true;
  integrity_hash: string;
}>;

export type DashboardInput = Readonly<{ scenario?: DashboardScenario; tenant_id?: string; mission_id?: string; dashboard?: MultiAgentCoordinationDashboard }>;

export type DashboardValidationResult = Readonly<{
  dashboard_id: string | null;
  valid: boolean;
  dashboard_operational: boolean;
  active_agents_visible: boolean;
  sessions_visible: boolean;
  mission_state_complete: boolean;
  planning_visible: boolean;
  delegation_visible: boolean;
  authority_visible: boolean;
  governance_visible: boolean;
  replay_visible: boolean;
  conflicts_visible: boolean;
  deadlocks_visible: boolean;
  communication_alerts_visible: boolean;
  graph_deterministic: boolean;
  timeline_deterministic: boolean;
  read_only_enforced: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  operator_visible: boolean;
  fail_closed: boolean;
  failures: readonly DashboardFailure[];
  validation_hash: string;
}>;

export type DashboardObservabilitySurface = Readonly<{
  dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  agent_count: number;
  session_count: number;
  alert_count: number;
  state: DashboardState;
  integrity_hash: string;
}>;

export type MultiAgentCoordinationDashboardBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "multi-agent-coordination-dashboard/v8ALT.7.11";
    final_state: "MULTI_AGENT_COORDINATION_DASHBOARD_CERTIFIED";
    states: readonly DashboardState[];
    principles: readonly string[];
  }>;
  dashboard: MultiAgentCoordinationDashboard;
  validation: DashboardValidationResult;
  observability: DashboardObservabilitySurface;
}>;
