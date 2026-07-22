export type DeadlockRaceSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RecoveryRecommendationType = "RETRY_WITH_ORDERING" | "SERIALIZE_EVENTS" | "REASSIGN_OWNER" | "RELEASE_LOCK" | "REPLAN_DEPENDENCIES" | "PAUSE_COORDINATION" | "ROLLBACK_TO_CHECKPOINT" | "ESCALATE_TO_OPERATOR" | "TERMINATE_COORDINATION";
export type DeadlockRaceState = "MONITORING" | "WAIT_GRAPH_ANALYSIS" | "LOCK_ANALYSIS" | "RACE_WINDOW_ANALYSIS" | "COLLISION_ANALYSIS" | "LOOP_ANALYSIS" | "ISSUE_DETECTED" | "SEVERITY_CLASSIFIED" | "RECOVERY_RECOMMENDED" | "ESCALATION_PENDING" | "RESOLVED" | "FAILED" | "CERTIFIED";
export type TimingIssueType = "DEADLOCK" | "CIRCULAR_WAIT" | "DELEGATION_LOOP" | "SIMULTANEOUS_ACTION" | "RACE_CONDITION" | "STATE_COLLISION" | "DEPENDENCY_LOCK" | "ORDERING" | "REPLAY" | "TENANT" | "INTEGRITY";
export type DeadlockRaceScenario = "BASELINE" | "DEADLOCK" | "UNDETECTED_DEADLOCK" | "CIRCULAR_WAIT" | "UNDETECTED_CIRCULAR_WAIT" | "DELEGATION_LOOP" | "UNDETECTED_DELEGATION_LOOP" | "SIMULTANEOUS_ACTION" | "MISSED_SIMULTANEOUS_ACTION" | "RACE_CONDITION" | "UNDETECTED_RACE_CONDITION" | "STATE_COLLISION" | "UNDETECTED_STATE_COLLISION" | "DEPENDENCY_LOCK" | "MISSED_DEPENDENCY_LOCK" | "MISSING_RECOVERY_RECOMMENDATION" | "NONDETERMINISTIC_ORDERING" | "REPLAY_MISMATCH" | "GOVERNANCE_ESCALATION_BYPASS" | "CROSS_TENANT_LOCK" | "INTEGRITY_FAILURE";
export type DeadlockRaceFailure = "UNDETECTED_DEADLOCK" | "UNDETECTED_CIRCULAR_WAIT" | "UNDETECTED_DELEGATION_LOOP" | "CONFLICTING_SIMULTANEOUS_ACTION_MISSED" | "UNDETECTED_RACE_CONDITION" | "UNDETECTED_STATE_COLLISION" | "UNRESOLVED_DEPENDENCY_LOCK_MISSED" | "RECOVERY_RECOMMENDATION_MISSING" | "NONDETERMINISTIC_EVENT_ORDERING_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "GOVERNANCE_ESCALATION_BYPASSED" | "CROSS_TENANT_LOCK_DETECTED" | "INTEGRITY_VERIFICATION_FAILED";

export type DeadlockRaceContract = Readonly<{
  deadlock_race_contract_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  participating_agents: readonly string[];
  dependency_policy: readonly string[];
  lock_policy: readonly string[];
  state_update_policy: readonly string[];
  delegation_loop_policy: readonly string[];
  timing_policy: readonly string[];
  race_detection_policy: readonly string[];
  recovery_policy: readonly RecoveryRecommendationType[];
  governance_reference: string;
  authority_reference: string;
  replay_reference: string;
  created_timestamp: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type DeadlockRecord = Readonly<{
  deadlock_id: string;
  coordination_session_id: string;
  blocked_agents: readonly string[];
  blocked_tasks: readonly string[];
  wait_chain: readonly string[];
  dependency_references: readonly string[];
  severity: DeadlockRaceSeverity;
  detected_timestamp: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type DelegationLoopRecord = Readonly<{
  delegation_loop_id: string;
  task_id: string;
  agents_in_loop: readonly string[];
  delegation_sequence: readonly string[];
  loop_count: number;
  last_valid_owner: string;
  recommended_resolution: RecoveryRecommendationType;
}>;

export type RaceConditionRecord = Readonly<{
  race_condition_id: string;
  coordination_session_id: string;
  affected_agents: readonly string[];
  affected_artifacts: readonly string[];
  expected_order: readonly string[];
  observed_order: readonly string[];
  race_type: "EVENT_ORDER" | "SHARED_STATE_ACCESS" | "DELEGATION_TIMING" | "COMMUNICATION_EFFECT" | "REPLAY_SEQUENCE";
  severity: DeadlockRaceSeverity;
  replay_reference: string;
}>;

export type StateCollisionRecord = Readonly<{
  collision_id: string;
  shared_state_object: string;
  affected_agents: readonly string[];
  attempted_updates: readonly string[];
  required_order: readonly string[];
  observed_order: readonly string[];
  governance_reference: string;
  authority_reference: string;
  integrity_hash: string;
}>;

export type DependencyLockRecord = Readonly<{
  dependency_lock_id: string;
  locked_task: string;
  locking_artifact: string;
  locking_agent: string;
  blocked_agents: readonly string[];
  blocked_since: string;
  lock_reason: string;
  release_condition: string;
  status: "ACTIVE" | "STALE" | "CIRCULAR" | "RESOLVED";
}>;

export type BlockedAgentGraph = Readonly<{
  graph_id: string;
  blocked_agent_nodes: readonly string[];
  waiting_on_agent_edges: readonly string[];
  dependency_edges: readonly string[];
  lock_edges: readonly string[];
  resource_edges: readonly string[];
  severity_nodes: readonly DeadlockRaceSeverity[];
  integrity_hash: string;
}>;

export type DependencyLockMap = Readonly<{
  lock_map_id: string;
  dependency_id: string;
  locked_task: string;
  locking_agent: string;
  affected_agents: readonly string[];
  release_condition: string;
  timeout_status: "WITHIN_THRESHOLD" | "STALE" | "TIMED_OUT";
  severity: DeadlockRaceSeverity;
  integrity_hash: string;
}>;

export type RaceWindowGraph = Readonly<{
  race_window_id: string;
  affected_agents: readonly string[];
  shared_artifact: string;
  competing_events: readonly string[];
  required_order: readonly string[];
  observed_order: readonly string[];
  risk_score: number;
  integrity_hash: string;
}>;

export type RecoveryRecommendation = Readonly<{
  recommendation_id: string;
  issue_type: TimingIssueType;
  recommended_action: RecoveryRecommendationType;
  governance_review_required: boolean;
  operator_escalation_required: boolean;
  replay_validation_required: boolean;
  certification_impact: "NONE" | "REVIEW_REQUIRED" | "CERTIFICATION_BLOCKED";
  advisory_only: true;
  evidence_references: readonly string[];
  integrity_hash: string;
}>;

export type DetectionEvidence = Readonly<{
  detection_event_id: string;
  coordination_session_id: string;
  mission_id: string;
  affected_agents: readonly string[];
  affected_tasks: readonly string[];
  affected_resources: readonly string[];
  issue_type: TimingIssueType;
  severity: DeadlockRaceSeverity;
  wait_graph_reference: string;
  lock_map_reference: string;
  race_window_reference: string;
  governance_reference: string;
  authority_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type DeadlockRaceAnalysis = Readonly<{
  contract: DeadlockRaceContract;
  deadlocks: readonly DeadlockRecord[];
  delegation_loops: readonly DelegationLoopRecord[];
  race_conditions: readonly RaceConditionRecord[];
  state_collisions: readonly StateCollisionRecord[];
  dependency_locks: readonly DependencyLockRecord[];
  blocked_agent_graph: BlockedAgentGraph;
  dependency_lock_map: DependencyLockMap;
  race_window_graph: RaceWindowGraph;
  recovery_recommendations: readonly RecoveryRecommendation[];
  evidence: DetectionEvidence;
  state: DeadlockRaceState;
  version: "deadlock-race-condition-detection/v8ALT.7.9";
  contract_hash: string;
}>;

export type DeadlockRaceInput = Readonly<{
  scenario?: DeadlockRaceScenario;
  tenant_id?: string;
  mission_id?: string;
  analysis?: DeadlockRaceAnalysis;
}>;

export type DeadlockRaceValidationResult = Readonly<{
  deadlock_race_contract_id: string | null;
  valid: boolean;
  contract_valid: boolean;
  deadlock_detected: boolean;
  circular_wait_detected: boolean;
  delegation_loop_detected: boolean;
  simultaneous_action_detected: boolean;
  race_condition_detected: boolean;
  state_collision_detected: boolean;
  dependency_lock_detected: boolean;
  blocked_agent_graph_generated: boolean;
  dependency_lock_map_generated: boolean;
  recovery_recommendation_reproducible: boolean;
  deterministic_ordering_preserved: boolean;
  replay_references_preserved: boolean;
  governance_review_enforced: boolean;
  operator_escalation_generated: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  fail_closed: boolean;
  failures: readonly DeadlockRaceFailure[];
  validation_hash: string;
}>;

export type DeadlockRaceObservabilitySurface = Readonly<{
  deadlock_race_contract_id: string;
  tenant_id: string;
  mission_id: string;
  issue_count: number;
  recommendation_count: number;
  state: DeadlockRaceState;
  contract_hash: string;
}>;

export type DeadlockRaceDetectionBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "deadlock-race-condition-detection/v8ALT.7.9";
    final_state: "DEADLOCK_RACE_CONDITION_DETECTION_CERTIFIED";
    severities: readonly DeadlockRaceSeverity[];
    recommendations: readonly RecoveryRecommendationType[];
    states: readonly DeadlockRaceState[];
    principles: readonly string[];
  }>;
  analysis: DeadlockRaceAnalysis;
  validation: DeadlockRaceValidationResult;
  observability: DeadlockRaceObservabilitySurface;
}>;
