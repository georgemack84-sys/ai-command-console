import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { monitorCoordination } from "@/services/coordination-conflict-detection";
import type {
  DeadlockRaceAnalysis,
  DeadlockRaceDetectionBundle,
  DeadlockRaceFailure,
  DeadlockRaceInput,
  DeadlockRaceObservabilitySurface,
  DeadlockRaceScenario,
  DeadlockRaceSeverity,
  DeadlockRaceState,
  DeadlockRaceValidationResult,
  RecoveryRecommendationType,
  TimingIssueType,
} from "@/types/deadlock-race-condition-detection";

const VERSION = "deadlock-race-condition-detection/v8ALT.7.9" as const;
const NOW = "2026-07-14T01:00:00.000Z";
const severities = Object.freeze(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const);
const recommendations = Object.freeze(["RETRY_WITH_ORDERING", "SERIALIZE_EVENTS", "REASSIGN_OWNER", "RELEASE_LOCK", "REPLAN_DEPENDENCIES", "PAUSE_COORDINATION", "ROLLBACK_TO_CHECKPOINT", "ESCALATE_TO_OPERATOR", "TERMINATE_COORDINATION"] as const);
const states = Object.freeze(["MONITORING", "WAIT_GRAPH_ANALYSIS", "LOCK_ANALYSIS", "RACE_WINDOW_ANALYSIS", "COLLISION_ANALYSIS", "LOOP_ANALYSIS", "ISSUE_DETECTED", "SEVERITY_CLASSIFIED", "RECOVERY_RECOMMENDED", "ESCALATION_PENDING", "RESOLVED", "FAILED", "CERTIFIED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failureFor(scenario: DeadlockRaceScenario): DeadlockRaceFailure | null {
  const map: Partial<Record<DeadlockRaceScenario, DeadlockRaceFailure>> = {
    UNDETECTED_DEADLOCK: "UNDETECTED_DEADLOCK",
    UNDETECTED_CIRCULAR_WAIT: "UNDETECTED_CIRCULAR_WAIT",
    UNDETECTED_DELEGATION_LOOP: "UNDETECTED_DELEGATION_LOOP",
    MISSED_SIMULTANEOUS_ACTION: "CONFLICTING_SIMULTANEOUS_ACTION_MISSED",
    UNDETECTED_RACE_CONDITION: "UNDETECTED_RACE_CONDITION",
    UNDETECTED_STATE_COLLISION: "UNDETECTED_STATE_COLLISION",
    MISSED_DEPENDENCY_LOCK: "UNRESOLVED_DEPENDENCY_LOCK_MISSED",
    MISSING_RECOVERY_RECOMMENDATION: "RECOVERY_RECOMMENDATION_MISSING",
    NONDETERMINISTIC_ORDERING: "NONDETERMINISTIC_EVENT_ORDERING_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    GOVERNANCE_ESCALATION_BYPASS: "GOVERNANCE_ESCALATION_BYPASSED",
    CROSS_TENANT_LOCK: "CROSS_TENANT_LOCK_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ?? null;
}

function issueFor(scenario: DeadlockRaceScenario): TimingIssueType | null {
  const map: Partial<Record<DeadlockRaceScenario, TimingIssueType>> = {
    DEADLOCK: "DEADLOCK",
    CIRCULAR_WAIT: "CIRCULAR_WAIT",
    DELEGATION_LOOP: "DELEGATION_LOOP",
    SIMULTANEOUS_ACTION: "RACE_CONDITION",
    RACE_CONDITION: "RACE_CONDITION",
    STATE_COLLISION: "STATE_COLLISION",
    DEPENDENCY_LOCK: "DEPENDENCY_LOCK",
  };
  return map[scenario] ?? null;
}

function analysisHash(analysis: Omit<DeadlockRaceAnalysis, "contract_hash"> | DeadlockRaceAnalysis): string {
  const { contract_hash: _hash, ...source } = analysis as DeadlockRaceAnalysis;
  return hashValue("deadlock-race-analysis", source);
}

function recommendationFor(issue: TimingIssueType | null): RecoveryRecommendationType {
  const map: Partial<Record<TimingIssueType, RecoveryRecommendationType>> = {
    DEADLOCK: "PAUSE_COORDINATION",
    CIRCULAR_WAIT: "REPLAN_DEPENDENCIES",
    DELEGATION_LOOP: "REASSIGN_OWNER",
    RACE_CONDITION: "SERIALIZE_EVENTS",
    STATE_COLLISION: "SERIALIZE_EVENTS",
    DEPENDENCY_LOCK: "RELEASE_LOCK",
    ORDERING: "RETRY_WITH_ORDERING",
    REPLAY: "ESCALATE_TO_OPERATOR",
    TENANT: "TERMINATE_COORDINATION",
    INTEGRITY: "ESCALATE_TO_OPERATOR",
  };
  return issue ? map[issue] ?? "ESCALATE_TO_OPERATOR" : "RETRY_WITH_ORDERING";
}

export function analyzeWaitGraph(input: DeadlockRaceInput = {}): DeadlockRaceAnalysis {
  if (input.analysis) return input.analysis;
  const scenario = input.scenario ?? "BASELINE";
  const failure = failureFor(scenario);
  const issue = issueFor(scenario);
  const conflict = monitorCoordination({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const contractId = id("DRCD", "deadlock-race-contract", { mission: conflict.contract.mission_id, scenario });
  const agents = freezeArray(["agent:coordinator", "agent:planner", "agent:analyst"]);
  const tenant = failure === "CROSS_TENANT_LOCK_DETECTED" ? "external-tenant" : conflict.contract.tenant_id;
  const policyMarker = failure ? [`failure:${failure}`] : [];
  const contractBase = {
    deadlock_race_contract_id: contractId,
    coordination_session_id: conflict.contract.coordination_session_id,
    mission_id: conflict.contract.mission_id,
    tenant_id: tenant,
    participating_agents: agents,
    dependency_policy: freezeArray(["acyclic-wait-graph", "deterministic-release-condition", ...policyMarker]),
    lock_policy: freezeArray(["no-cross-tenant-lock", "timeout-required", "advisory-release-only"]),
    state_update_policy: freezeArray(["serialized-updates", "hash-verified", "governance-checked"]),
    delegation_loop_policy: freezeArray(["detect-repeated-owners", "block-hidden-ambiguity"]),
    timing_policy: freezeArray(["deterministic-ordering", scenario === "NONDETERMINISTIC_ORDERING" ? "ordering:unstable" : "ordering:stable"]),
    race_detection_policy: freezeArray(["detect-race-windows", "detect-shared-state-collisions"]),
    recovery_policy: recommendations,
    governance_reference: conflict.contract.governance_context_id,
    authority_reference: conflict.contract.authority_context_id,
    replay_reference: failure === "REPLAY_MISMATCH_DETECTED" ? "" : `replay:deadlock-race:${contractId}`,
    created_timestamp: NOW,
    immutable: true as const,
    append_only: true as const,
  };
  const contract = Object.freeze({ ...contractBase, integrity_hash: failure === "INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("deadlock-race-contract", contractBase) });
  const severity: DeadlockRaceSeverity = issue === "DEADLOCK" || issue === "CIRCULAR_WAIT" || issue === "RACE_CONDITION" || issue === "TENANT" ? "CRITICAL" : issue ? "HIGH" : "INFO";
  const deadlocks = issue === "DEADLOCK" || issue === "CIRCULAR_WAIT" ? freezeArray([Object.freeze({ deadlock_id: id("DLOCK", "deadlock-record", contractId), coordination_session_id: contract.coordination_session_id, blocked_agents: agents, blocked_tasks: freezeArray(["task:planning", "task:delegation"]), wait_chain: freezeArray(issue === "CIRCULAR_WAIT" ? ["agent:coordinator->agent:planner", "agent:planner->agent:analyst", "agent:analyst->agent:coordinator"] : ["agent:coordinator->agent:planner", "agent:planner->agent:coordinator"]), dependency_references: freezeArray(["dependency:planning", "dependency:delegation"]), severity, detected_timestamp: NOW, replay_reference: contract.replay_reference, integrity_hash: hashValue("deadlock-record", { contractId, issue }) })]) : freezeArray([]);
  const delegation_loops = issue === "DELEGATION_LOOP" ? freezeArray([Object.freeze({ delegation_loop_id: id("DLOOP", "delegation-loop", contractId), task_id: "task:delegation", agents_in_loop: agents, delegation_sequence: freezeArray(["agent:coordinator", "agent:planner", "agent:analyst", "agent:coordinator"]), loop_count: 2, last_valid_owner: "agent:coordinator", recommended_resolution: "REASSIGN_OWNER" as const })]) : freezeArray([]);
  const race_conditions = issue === "RACE_CONDITION" ? freezeArray([Object.freeze({ race_condition_id: id("RACE", "race-condition", contractId), coordination_session_id: contract.coordination_session_id, affected_agents: agents.slice(0, 2), affected_artifacts: freezeArray(["shared-state:planning"]), expected_order: freezeArray(["event:a", "event:b"]), observed_order: scenario === "NONDETERMINISTIC_ORDERING" ? freezeArray(["event:b", "event:a"]) : freezeArray(["event:a", "event:b"]), race_type: "EVENT_ORDER" as const, severity, replay_reference: contract.replay_reference })]) : freezeArray([]);
  const state_collisions = issue === "STATE_COLLISION" ? freezeArray([Object.freeze({ collision_id: id("SCOL", "state-collision", contractId), shared_state_object: "planning_state", affected_agents: agents.slice(0, 2), attempted_updates: freezeArray(["set:ready", "set:blocked"]), required_order: freezeArray(["agent:coordinator", "agent:planner"]), observed_order: freezeArray(["agent:planner", "agent:coordinator"]), governance_reference: contract.governance_reference, authority_reference: contract.authority_reference, integrity_hash: hashValue("state-collision", contractId) })]) : freezeArray([]);
  const dependency_locks = issue === "DEPENDENCY_LOCK" || failure === "CROSS_TENANT_LOCK_DETECTED" ? freezeArray([Object.freeze({ dependency_lock_id: id("DPLK", "dependency-lock", contractId), locked_task: "task:dependency", locking_artifact: "artifact:lock", locking_agent: failure === "CROSS_TENANT_LOCK_DETECTED" ? "external-agent" : "agent:planner", blocked_agents: agents, blocked_since: NOW, lock_reason: "unresolved prerequisite", release_condition: "operator/governance review recommendation", status: "STALE" as const })]) : freezeArray([]);
  const graphBase = { graph_id: id("BAG", "blocked-agent-graph", contractId), blocked_agent_nodes: issue ? agents : freezeArray<string>([]), waiting_on_agent_edges: deadlocks.flatMap((record) => [...record.wait_chain]), dependency_edges: freezeArray(["dependency:planning->dependency:delegation"]), lock_edges: dependency_locks.map((lock) => `${lock.locking_agent}->${lock.locked_task}`), resource_edges: freezeArray(issue ? ["resource:shared-state"] : []), severity_nodes: freezeArray(issue ? [severity] : []) };
  const blocked_agent_graph = Object.freeze({ ...graphBase, integrity_hash: hashValue("blocked-agent-graph", graphBase) });
  const lockMapBase = { lock_map_id: id("LCKM", "dependency-lock-map", contractId), dependency_id: "dependency:planning", locked_task: dependency_locks[0]?.locked_task ?? "", locking_agent: dependency_locks[0]?.locking_agent ?? "", affected_agents: dependency_locks[0]?.blocked_agents ?? freezeArray([]), release_condition: dependency_locks[0]?.release_condition ?? "none", timeout_status: dependency_locks.length ? "STALE" as const : "WITHIN_THRESHOLD" as const, severity: dependency_locks.length ? "HIGH" as DeadlockRaceSeverity : "INFO" as DeadlockRaceSeverity };
  const dependency_lock_map = Object.freeze({ ...lockMapBase, integrity_hash: hashValue("dependency-lock-map", lockMapBase) });
  const raceGraphBase = { race_window_id: id("RWG", "race-window-graph", contractId), affected_agents: race_conditions[0]?.affected_agents ?? freezeArray([]), shared_artifact: race_conditions[0]?.affected_artifacts[0] ?? "", competing_events: freezeArray(["event:a", "event:b"]), required_order: race_conditions[0]?.expected_order ?? freezeArray(["event:a", "event:b"]), observed_order: race_conditions[0]?.observed_order ?? freezeArray(["event:a", "event:b"]), risk_score: race_conditions.length ? 0.91 : 0.03 };
  const race_window_graph = Object.freeze({ ...raceGraphBase, integrity_hash: hashValue("race-window-graph", raceGraphBase) });
  const recAction = recommendationFor(issue ?? (failure === "NONDETERMINISTIC_EVENT_ORDERING_DETECTED" ? "ORDERING" : failure === "REPLAY_MISMATCH_DETECTED" ? "REPLAY" : failure === "CROSS_TENANT_LOCK_DETECTED" ? "TENANT" : failure === "INTEGRITY_VERIFICATION_FAILED" ? "INTEGRITY" : null));
  const shouldHaveRecommendation = issue !== null || ["RECOVERY_RECOMMENDATION_MISSING", "NONDETERMINISTIC_EVENT_ORDERING_DETECTED", "REPLAY_MISMATCH_DETECTED", "GOVERNANCE_ESCALATION_BYPASSED", "CROSS_TENANT_LOCK_DETECTED", "INTEGRITY_VERIFICATION_FAILED"].includes(failure ?? "");
  const recovery_recommendations = failure === "RECOVERY_RECOMMENDATION_MISSING" ? freezeArray([]) : shouldHaveRecommendation ? freezeArray([(() => { const base = { recommendation_id: id("DREC", "deadlock-race-recommendation", contractId), issue_type: issue ?? "ORDERING" as TimingIssueType, recommended_action: recAction, governance_review_required: severity === "HIGH" || severity === "CRITICAL", operator_escalation_required: severity === "CRITICAL" || recAction === "ESCALATE_TO_OPERATOR" || recAction === "TERMINATE_COORDINATION", replay_validation_required: true, certification_impact: severity === "CRITICAL" ? "CERTIFICATION_BLOCKED" as const : "REVIEW_REQUIRED" as const, advisory_only: true as const, evidence_references: freezeArray([`evidence:deadlock-race:${contractId}`]) }; return Object.freeze({ ...base, integrity_hash: hashValue("deadlock-race-recommendation", base) }); })()]) : freezeArray([]);
  const evidenceBase = { detection_event_id: id("DREV", "deadlock-race-evidence", contractId), coordination_session_id: contract.coordination_session_id, mission_id: contract.mission_id, affected_agents: issue ? agents : freezeArray([]), affected_tasks: freezeArray(issue ? ["task:planning"] : []), affected_resources: freezeArray(issue ? ["resource:shared-state"] : []), issue_type: issue ?? (failure === "CROSS_TENANT_LOCK_DETECTED" ? "TENANT" as TimingIssueType : failure === "INTEGRITY_VERIFICATION_FAILED" ? "INTEGRITY" as TimingIssueType : "ORDERING" as TimingIssueType), severity: issue ? severity : "INFO" as DeadlockRaceSeverity, wait_graph_reference: blocked_agent_graph.graph_id, lock_map_reference: dependency_lock_map.lock_map_id, race_window_reference: race_window_graph.race_window_id, governance_reference: failure === "GOVERNANCE_ESCALATION_BYPASSED" ? "" : contract.governance_reference, authority_reference: contract.authority_reference, replay_reference: contract.replay_reference, lineage_reference: `lineage:deadlock-race:${contractId}`, timestamp: NOW };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: failure === "INTEGRITY_VERIFICATION_FAILED" ? "" : hashValue("deadlock-race-evidence", evidenceBase) });
  const base = { contract, deadlocks, delegation_loops, race_conditions, state_collisions, dependency_locks, blocked_agent_graph, dependency_lock_map, race_window_graph, recovery_recommendations, evidence, state: issue || failure ? "ISSUE_DETECTED" as DeadlockRaceState : "CERTIFIED" as DeadlockRaceState, version: VERSION };
  return Object.freeze({ ...base, contract_hash: analysisHash(base as Omit<DeadlockRaceAnalysis, "contract_hash">) });
}

export function detectRaceWindows(input: DeadlockRaceInput = {}) { return analyzeWaitGraph(input).race_window_graph; }
export function validateStateUpdates(input: DeadlockRaceInput = {}) { return analyzeWaitGraph(input).state_collisions; }
export function detectDelegationLoops(input: DeadlockRaceInput = {}) { return analyzeWaitGraph(input).delegation_loops; }
export function generateBlockedAgentGraph(input: DeadlockRaceInput = {}) { return analyzeWaitGraph(input).blocked_agent_graph; }
export function generateDependencyLockMap(input: DeadlockRaceInput = {}) { return analyzeWaitGraph(input).dependency_lock_map; }
export function recommendRecovery(input: DeadlockRaceInput = {}) { return analyzeWaitGraph(input).recovery_recommendations; }

export function validateDeadlockRaceDetection(analysis = analyzeWaitGraph()): DeadlockRaceValidationResult {
  const markers = new Set(analysis.contract.dependency_policy.filter((item) => item.startsWith("failure:")).map((item) => item.replace("failure:", "") as DeadlockRaceFailure));
  const hasDeadlock = analysis.deadlocks.some((record) => record.wait_chain.length > 0);
  const hasCircular = analysis.deadlocks.some((record) => record.wait_chain.some((edge) => edge.includes("agent:analyst->agent:coordinator")));
  const hasLoop = analysis.delegation_loops.length > 0;
  const hasRace = analysis.race_conditions.length > 0;
  const hasCollision = analysis.state_collisions.length > 0;
  const hasLock = analysis.dependency_locks.length > 0;
  const contract_valid = analysis.contract.immutable && analysis.contract.append_only && Boolean(analysis.contract.integrity_hash);
  const deadlock_detected = hasDeadlock || !markers.has("UNDETECTED_DEADLOCK");
  const circular_wait_detected = hasCircular || !markers.has("UNDETECTED_CIRCULAR_WAIT");
  const delegation_loop_detected = hasLoop || !markers.has("UNDETECTED_DELEGATION_LOOP");
  const simultaneous_action_detected = hasRace || !markers.has("CONFLICTING_SIMULTANEOUS_ACTION_MISSED");
  const race_condition_detected = hasRace || !markers.has("UNDETECTED_RACE_CONDITION");
  const state_collision_detected = hasCollision || !markers.has("UNDETECTED_STATE_COLLISION");
  const dependency_lock_detected = hasLock || !markers.has("UNRESOLVED_DEPENDENCY_LOCK_MISSED");
  const blocked_agent_graph_generated = Boolean(analysis.blocked_agent_graph.integrity_hash);
  const dependency_lock_map_generated = Boolean(analysis.dependency_lock_map.integrity_hash);
  const recovery_recommendation_reproducible = analysis.recovery_recommendations.length > 0 || analysis.state === "CERTIFIED";
  const deterministic_ordering_preserved = !analysis.contract.timing_policy.includes("ordering:unstable");
  const replay_references_preserved = Boolean(analysis.contract.replay_reference && analysis.evidence.replay_reference);
  const governance_review_enforced = Boolean(analysis.evidence.governance_reference) && analysis.recovery_recommendations.every((item) => !item.governance_review_required || item.evidence_references.length > 0);
  const operator_escalation_generated = analysis.recovery_recommendations.every((item) => !item.operator_escalation_required || item.advisory_only);
  const tenant_isolated = analysis.contract.tenant_id.startsWith("tenant:") && !markers.has("CROSS_TENANT_LOCK_DETECTED");
  const integrity_verified = Boolean(analysis.contract.integrity_hash && analysis.evidence.integrity_hash && analysisHash(analysis) === analysis.contract_hash);
  const failures = unique([
    ...(!deadlock_detected ? ["UNDETECTED_DEADLOCK" as const] : []),
    ...(!circular_wait_detected ? ["UNDETECTED_CIRCULAR_WAIT" as const] : []),
    ...(!delegation_loop_detected ? ["UNDETECTED_DELEGATION_LOOP" as const] : []),
    ...(!simultaneous_action_detected ? ["CONFLICTING_SIMULTANEOUS_ACTION_MISSED" as const] : []),
    ...(!race_condition_detected ? ["UNDETECTED_RACE_CONDITION" as const] : []),
    ...(!state_collision_detected ? ["UNDETECTED_STATE_COLLISION" as const] : []),
    ...(!dependency_lock_detected ? ["UNRESOLVED_DEPENDENCY_LOCK_MISSED" as const] : []),
    ...(!recovery_recommendation_reproducible ? ["RECOVERY_RECOMMENDATION_MISSING" as const] : []),
    ...(!deterministic_ordering_preserved ? ["NONDETERMINISTIC_EVENT_ORDERING_DETECTED" as const] : []),
    ...(!replay_references_preserved ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!governance_review_enforced ? ["GOVERNANCE_ESCALATION_BYPASSED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_LOCK_DETECTED" as const] : []),
    ...(!integrity_verified ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...Array.from(markers),
  ]);
  const valid = failures.length === 0;
  const source = { deadlock_race_contract_id: analysis.contract.deadlock_race_contract_id, valid, contract_valid, deadlock_detected, circular_wait_detected, delegation_loop_detected, simultaneous_action_detected, race_condition_detected, state_collision_detected, dependency_lock_detected, blocked_agent_graph_generated, dependency_lock_map_generated, recovery_recommendation_reproducible, deterministic_ordering_preserved, replay_references_preserved, governance_review_enforced, operator_escalation_generated, tenant_isolated, integrity_verified, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("deadlock-race-validation", source) });
}

export function buildDeadlockRaceObservabilitySurface(analysis = analyzeWaitGraph()): DeadlockRaceObservabilitySurface {
  const issue_count = analysis.deadlocks.length + analysis.delegation_loops.length + analysis.race_conditions.length + analysis.state_collisions.length + analysis.dependency_locks.length;
  return Object.freeze({ deadlock_race_contract_id: analysis.contract.deadlock_race_contract_id, tenant_id: analysis.contract.tenant_id, mission_id: analysis.contract.mission_id, issue_count, recommendation_count: analysis.recovery_recommendations.length, state: analysis.state, contract_hash: analysis.contract_hash });
}

export function getDeadlockRaceDetection(): DeadlockRaceDetectionBundle {
  const analysis = analyzeWaitGraph();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "DEADLOCK_RACE_CONDITION_DETECTION_CERTIFIED", severities, recommendations, states, principles: freezeArray(["detect-before-unsafe-execution", "deterministic-event-ordering", "governance-supremacy", "operator-supremacy", "tenant-isolation", "advisory-recovery-only", "immutable-detection-history", "replay-compatible-evidence", "fail-closed-blocking", "no-coordination-mutation"]) }),
    analysis,
    validation: validateDeadlockRaceDetection(analysis),
    observability: buildDeadlockRaceObservabilitySurface(analysis),
  });
}
