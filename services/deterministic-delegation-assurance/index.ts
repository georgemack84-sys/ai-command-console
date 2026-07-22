import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateSynchronizedPlan } from "@/services/synchronized-planning-assurance";
import type { AgentIdentity, AgentRole, AuthorityCategory } from "@/types/multi-agent-coordination-contract";
import type {
  BlockedTaskRecord,
  CapabilityCategory,
  CapabilityProfile,
  DelegationConflict,
  DelegationContract,
  DelegationEvent,
  DelegationFailure,
  DelegationInput,
  DelegationObservabilitySurface,
  DelegationRecord,
  DelegationReplayResult,
  DelegationReplayTrace,
  DelegationScenario,
  DelegationState,
  DelegationValidationResult,
  DeterministicDelegationAssuranceBundle,
  FallbackRoute,
  RoutingJustification,
  TaskOwnershipRecord,
} from "@/types/deterministic-delegation-assurance";

const VERSION = "deterministic-delegation-assurance/v8ALT.7.3" as const;
const NOW = "2026-07-13T19:00:00.000Z";
const states = Object.freeze(["INITIALIZING", "TASK_CLASSIFICATION", "CAPABILITY_MATCHING", "AUTHORITY_VALIDATION", "ROUTING", "FALLBACK_EVALUATION", "OWNERSHIP_ASSIGNMENT", "VALIDATED", "REPLAY_READY", "CERTIFIED", "FAILED"] as const);
const capabilities = Object.freeze(["PLANNING", "ANALYSIS", "VALIDATION", "OBSERVATION", "COORDINATION", "SUPERVISION", "RECOVERY", "EXPLAINABILITY", "PREDICTION", "INTEGRITY", "CERTIFICATION", "GOVERNANCE_ADVISORY"] as const);
const blockingReasons = Object.freeze(["AUTHORITY_RESTRICTION", "GOVERNANCE_REJECTION", "CONSTITUTIONAL_RESTRICTION", "RESOURCE_UNAVAILABLE", "CAPABILITY_MISSING", "TENANT_RESTRICTION", "DEPENDENCY_FAILURE", "RUNTIME_BLOCK"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function failuresFor(scenario: DelegationScenario): readonly DelegationFailure[] {
  const map: Partial<Record<DelegationScenario, DelegationFailure>> = {
    REPLAY_MISMATCH: "DELEGATION_REPLAY_MISMATCH",
    NONDETERMINISTIC_ASSIGNMENT: "NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED",
    CAPABILITY_MISMATCH: "CAPABILITY_MISMATCH_DETECTED",
    DUPLICATE_OWNERSHIP: "DUPLICATE_OWNERSHIP_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    UNAUTHORIZED_DELEGATION: "UNAUTHORIZED_DELEGATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
    BLOCKED_TASK_DELEGATED: "BLOCKED_TASK_INCORRECTLY_DELEGATED",
    FALLBACK_MISMATCH: "FALLBACK_ROUTING_MISMATCH_DETECTED",
    CIRCULAR_DELEGATION: "CIRCULAR_DELEGATION_DETECTED",
    MISSING_ACCOUNTABILITY: "MISSING_ACCOUNTABILITY_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
    CROSS_TENANT_DELEGATION: "CROSS_TENANT_DELEGATION_DETECTED",
    HIDDEN_DELEGATION: "HIDDEN_DELEGATION_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function capabilityForRole(role: AgentRole): CapabilityCategory {
  const map: Record<AgentRole, CapabilityCategory> = {
    Coordinator: "COORDINATION",
    Planner: "PLANNING",
    Analyst: "ANALYSIS",
    Observer: "OBSERVATION",
    Executor: "OBSERVATION",
    Validator: "VALIDATION",
    "Governance Advisor": "GOVERNANCE_ADVISORY",
    "Runtime Supervisor": "SUPERVISION",
    "Recovery Advisor": "RECOVERY",
    "Explainability Agent": "EXPLAINABILITY",
    "Prediction Agent": "PREDICTION",
    "Integrity Auditor": "INTEGRITY",
    "Certification Agent": "CERTIFICATION",
  };
  return map[role];
}

function profiles(agents: readonly AgentIdentity[], failures: readonly DelegationFailure[]): readonly CapabilityProfile[] {
  return freezeArray(agents.map((agent, index) => {
    const base = {
      agent_id: agent.agent_id,
      capabilities: freezeArray([failures.includes("CAPABILITY_MISMATCH_DETECTED") && index === 1 ? "OBSERVATION" : capabilityForRole(agent.role)] as CapabilityCategory[]),
      certification_level: failures.includes("UNAUTHORIZED_DELEGATION_DETECTED") && index === 1 ? "UNCERTIFIED" as const : agent.certification_level,
      authority_scope: failures.includes("AUTHORITY_ESCALATION_DETECTED") && index === 1 ? "CERTIFY" as const : agent.authority_profile,
      governance_eligible: !failures.includes("GOVERNANCE_BYPASS_DETECTED"),
      tenant_id: failures.includes("CROSS_TENANT_DELEGATION_DETECTED") && index === 1 ? "external-tenant" : agent.tenant_id,
      workload_capacity: 1,
      mission_compatible: true,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("delegation-capability-profile", base) });
  }));
}

function conflicts(taskIds: readonly string[], failures: readonly DelegationFailure[], assignedAgents: readonly string[]): readonly DelegationConflict[] {
  const make = (type: DelegationConflict["conflict_type"], failure: DelegationFailure, taskIndex = 0) => Object.freeze({
    conflict_id: id("DCON", "delegation-conflict", { type, failure }),
    conflict_type: type,
    task_id: taskIds[taskIndex] ?? "task:unknown",
    assigned_agents: freezeArray(assignedAgents.slice(0, 2)),
    expected_agent: assignedAgents[0] ?? "",
    observed_agent: failure === "NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED" ? assignedAgents[1] ?? "" : assignedAgents[0] ?? "",
    severity: "CRITICAL" as const,
    authority_review: `authority-review:${failure}`,
    replay_reference: `replay:delegation-conflict:${failure}`,
  });
  return freezeArray([
    failures.includes("NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED") ? make("ASSIGNMENT", "NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED") : null,
    failures.includes("CAPABILITY_MISMATCH_DETECTED") ? make("CAPABILITY", "CAPABILITY_MISMATCH_DETECTED") : null,
    failures.includes("DUPLICATE_OWNERSHIP_DETECTED") ? make("OWNERSHIP", "DUPLICATE_OWNERSHIP_DETECTED") : null,
    failures.includes("AUTHORITY_ESCALATION_DETECTED") || failures.includes("UNAUTHORIZED_DELEGATION_DETECTED") ? make("AUTHORITY", failures.includes("AUTHORITY_ESCALATION_DETECTED") ? "AUTHORITY_ESCALATION_DETECTED" : "UNAUTHORIZED_DELEGATION_DETECTED") : null,
    failures.includes("GOVERNANCE_BYPASS_DETECTED") ? make("GOVERNANCE", "GOVERNANCE_BYPASS_DETECTED") : null,
    failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? make("CONSTITUTION", "CONSTITUTIONAL_VIOLATION_DETECTED") : null,
    failures.includes("BLOCKED_TASK_INCORRECTLY_DELEGATED") ? make("BLOCKED_TASK", "BLOCKED_TASK_INCORRECTLY_DELEGATED") : null,
    failures.includes("FALLBACK_ROUTING_MISMATCH_DETECTED") ? make("FALLBACK", "FALLBACK_ROUTING_MISMATCH_DETECTED") : null,
    failures.includes("CIRCULAR_DELEGATION_DETECTED") ? make("CIRCULAR", "CIRCULAR_DELEGATION_DETECTED") : null,
    failures.includes("MISSING_ACCOUNTABILITY_DETECTED") ? make("ACCOUNTABILITY", "MISSING_ACCOUNTABILITY_DETECTED") : null,
    failures.includes("DELEGATION_REPLAY_MISMATCH") ? make("REPLAY", "DELEGATION_REPLAY_MISMATCH") : null,
    failures.includes("CROSS_TENANT_DELEGATION_DETECTED") ? make("TENANT", "CROSS_TENANT_DELEGATION_DETECTED") : null,
    failures.includes("HIDDEN_DELEGATION_DETECTED") ? make("VISIBILITY", "HIDDEN_DELEGATION_DETECTED") : null,
    failures.includes("INTEGRITY_HASH_INVALID") ? make("INTEGRITY", "INTEGRITY_HASH_INVALID") : null,
  ].filter(Boolean) as DelegationConflict[]);
}

function contractHash(contract: Omit<DelegationContract, "contract_hash"> | DelegationContract): string {
  const { contract_hash: _hash, ...source } = contract as DelegationContract;
  return hashValue("deterministic-delegation-contract", source);
}

export function generateDelegationMap(input: DelegationInput = {}): DelegationContract {
  if (input.contract) return input.contract;
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const planning = generateSynchronizedPlan({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const contractId = id("DDAC", "deterministic-delegation-contract", { mission: planning.mission_id, scenario: input.scenario ?? "BASELINE" });
  const sessionId = id("DDAS", "deterministic-delegation-session", { contractId, mission: planning.mission_id });
  const agents = failures.includes("HIDDEN_DELEGATION_DETECTED") ? planning.participating_agents.slice(1) : planning.participating_agents;
  const caps = profiles(agents, failures);
  const graphTasks = freezeArray(planning.execution_graph.map((node) => node.node_id));
  const coordinator = agents.find((agent) => agent.role === "Coordinator")?.agent_id ?? agents[0]?.agent_id ?? "";
  const pickAgent = (task: string, index: number) => {
    const targetCapability: CapabilityCategory = task.includes("validate") ? "VALIDATION" : task.includes("governance") ? "GOVERNANCE_ADVISORY" : task.includes("replay") ? "INTEGRITY" : task.includes("conflict") ? "ANALYSIS" : "PLANNING";
    const matched = caps.find((profile) => profile.capabilities.includes(targetCapability) && profile.certification_level === "CERTIFIED" && profile.governance_eligible && profile.tenant_id === planning.tenant_id);
    if (failures.includes("NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED") && index === 1) return caps[0]?.agent_id ?? "";
    return matched?.agent_id ?? coordinator;
  };
  const delegationRecords: DelegationRecord[] = graphTasks.map((task, index) => {
    const assigned = pickAgent(task, index);
    const profile = caps.find((item) => item.agent_id === assigned);
    const base = {
      delegation_id: id("DELG", "deterministic-delegation-record", { task, assigned }),
      task_id: task,
      delegating_agent: failures.includes("CIRCULAR_DELEGATION_DETECTED") && index === 2 ? assigned : coordinator,
      assigned_agent: failures.includes("CAPABILITY_MISMATCH_DETECTED") && index === 1 ? caps.find((item) => item.capabilities.includes("OBSERVATION"))?.agent_id ?? assigned : assigned,
      authority_level: failures.includes("AUTHORITY_ESCALATION_DETECTED") && index === 1 ? "CERTIFY" as AuthorityCategory : profile?.authority_scope ?? "ANALYZE",
      capability_profile: profile?.capabilities[0] ?? "PLANNING",
      routing_reason: "deterministic certified capability and authority match",
      fallback_used: index === graphTasks.length - 1,
      delegation_state: failures.length ? "FAILED" as DelegationState : "CERTIFIED" as DelegationState,
      timestamp: failures.includes("NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED") && index === 1 ? "2026-07-13T19:00:01.000Z" : NOW,
      lineage_reference: `lineage:delegation:${task}`,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("deterministic-delegation-record", base) });
  });
  const ownership = delegationRecords.flatMap((record, index) => {
    if (failures.includes("MISSING_ACCOUNTABILITY_DETECTED") && index === 1) return [];
    const owner = failures.includes("DUPLICATE_OWNERSHIP_DETECTED") && index === 1 ? delegationRecords[0]?.assigned_agent ?? record.assigned_agent : record.assigned_agent;
    const base = { ownership_id: id("OWN", "delegation-ownership", { task: record.task_id, owner }), task_id: record.task_id, owner_agent: owner, ownership_state: failures.length ? "FAILED" as const : "ASSIGNED" as const, authority_reference: `authority:${record.authority_level}`, governance_reference: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? "" : "governance:delegation:v8ALT.7.3", assignment_reason: "single deterministic accountable owner", created_timestamp: NOW, lineage_reference: record.lineage_reference };
    const rows = [Object.freeze({ ...base, integrity_hash: hashValue("delegation-ownership", base) })];
    if (failures.includes("DUPLICATE_OWNERSHIP_DETECTED") && index === 0) {
      const duplicate = { ...base, ownership_id: id("OWN", "delegation-ownership-duplicate", record.task_id), owner_agent: delegationRecords[1]?.assigned_agent ?? owner };
      rows.push(Object.freeze({ ...duplicate, integrity_hash: hashValue("delegation-ownership", duplicate) }));
    }
    return rows;
  });
  const blockedTaskBase = { task_id: "node:runtime-blocked-task", blocking_reason: "RESOURCE_UNAVAILABLE" as const, retained_owner: coordinator, action: "ESCALATE_TO_OPERATOR" as const, delegated: failures.includes("BLOCKED_TASK_INCORRECTLY_DELEGATED"), fallback_reference: "fallback:runtime-blocked-task" };
  const blockedTasks = freezeArray([Object.freeze({ ...blockedTaskBase, integrity_hash: hashValue("delegation-blocked-task", blockedTaskBase) })]);
  const fallbackRoutes: FallbackRoute[] = delegationRecords.slice(0, 2).map((record, index) => {
    const base = { fallback_id: id("FALL", "delegation-fallback", { task: record.task_id, index }), task_id: record.task_id, primary_agent: record.assigned_agent, fallback_agent: failures.includes("FALLBACK_ROUTING_MISMATCH_DETECTED") && index === 1 ? coordinator : delegationRecords[index + 1]?.assigned_agent ?? coordinator, trigger: "capability-unavailable", preserves_authority: !failures.includes("FALLBACK_ROUTING_MISMATCH_DETECTED"), preserves_governance: !failures.includes("FALLBACK_ROUTING_MISMATCH_DETECTED"), deterministic_order: failures.includes("FALLBACK_ROUTING_MISMATCH_DETECTED") && index === 1 ? 1 : index + 1, replay_reference: `replay:fallback:${record.task_id}` };
    return Object.freeze({ ...base, integrity_hash: hashValue("delegation-fallback", base) });
  });
  const replayTraces: DelegationReplayTrace[] = delegationRecords.map((record, index) => {
    const base = { replay_id: id("DREP", "delegation-replay", record.delegation_id), delegation_id: record.delegation_id, routing_sequence: freezeArray([record.delegating_agent, record.assigned_agent]), authority_validation: failures.includes("AUTHORITY_ESCALATION_DETECTED") ? "INVALID" as const : "VALID" as const, governance_validation: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? "INVALID" as const : "VALID" as const, fallback_path: freezeArray(fallbackRoutes.filter((route) => route.task_id === record.task_id).map((route) => route.fallback_agent)), ownership_validation: ownership.some((item) => item.task_id === record.task_id) ? "VALID" as const : "INVALID" as const, result: failures.includes("DELEGATION_REPLAY_MISMATCH") && index === 1 ? "MISMATCH" as const : "REPRODUCED" as const, timestamp: NOW };
    return Object.freeze({ ...base, replay_hash: hashValue("delegation-replay-trace", base) });
  });
  const justifications: RoutingJustification[] = delegationRecords.map((record) => {
    const profile = caps.find((item) => item.agent_id === record.assigned_agent);
    const base = { justification_id: id("JUST", "delegation-routing-justification", record.delegation_id), task_id: record.task_id, selected_agent: record.assigned_agent, capability_match: Boolean(profile?.capabilities.includes(record.capability_profile)) && !failures.includes("CAPABILITY_MISMATCH_DETECTED"), authority_validation: record.authority_level !== "CERTIFY", governance_validation: !failures.includes("GOVERNANCE_BYPASS_DETECTED"), constraint_analysis: freezeArray(["tenant-isolated", "advisory-only", "operator-visible", "no-execution-dispatch"]), confidence_score: failures.length ? 0.48 : 0.96, risk_score: failures.length ? 0.72 : 0.08 };
    return Object.freeze({ ...base, integrity_hash: hashValue("delegation-routing-justification", base) });
  });
  const foundConflicts = conflicts(graphTasks, failures, delegationRecords.map((record) => record.assigned_agent));
  const events: DelegationEvent[] = delegationRecords.map((record, index) => {
    const base = { event_id: id("DLEV", "delegation-event", { sessionId, index }), delegation_session_id: sessionId, task_id: record.task_id, delegating_agent: record.delegating_agent, assigned_agent: record.assigned_agent, event_type: "delegation_route_certified", delegation_state: record.delegation_state, authority_reference: `authority:${record.authority_level}`, governance_reference: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? "" : "governance:delegation:v8ALT.7.3", timestamp: NOW };
    return Object.freeze({ ...base, integrity_hash: hashValue("delegation-event", base) });
  });
  const evidenceBase = { delegation_session_id: sessionId, coordination_session_id: planning.coordination_session_id, mission_id: planning.mission_id, task_ids: graphTasks, delegation_map: freezeArray(delegationRecords), ownership_records: freezeArray(ownership), authority_evidence: freezeArray(delegationRecords.map((record) => `authority:${record.authority_level}`)), governance_evidence: freezeArray(events.map((event) => event.governance_reference).filter(Boolean)), routing_evidence: freezeArray(justifications.map((item) => item.integrity_hash)), fallback_evidence: freezeArray(fallbackRoutes.map((route) => route.integrity_hash)), replay_reference: failures.includes("DELEGATION_REPLAY_MISMATCH") ? "" : `replay:delegation:${contractId}`, lineage_reference: `lineage:delegation:${contractId}`, timestamp: NOW };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: hashValue("delegation-evidence", evidenceBase) });
  const base = {
    delegation_contract_id: contractId,
    delegation_session_id: sessionId,
    coordination_session_id: planning.coordination_session_id,
    mission_id: planning.mission_id,
    tenant_id: planning.tenant_id,
    planning_graph_id: planning.execution_graph[0]?.graph_id ?? "graph:primary",
    participating_agents: freezeArray(agents),
    capability_profiles: caps,
    delegation_policy: freezeArray(["deterministic-routing", "single-owner-per-task", "advisory-only", "no-execution-dispatch"]),
    authority_policy: freezeArray(["no-authority-escalation", "authority-profile-required"]),
    governance_policy: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? freezeArray<string>([]) : freezeArray(["governance-validation-required"]),
    constitutional_policy: failures.includes("CONSTITUTIONAL_VIOLATION_DETECTED") ? freezeArray<string>([]) : freezeArray(["constitutional-validation-required"]),
    routing_policy: freezeArray(["capability-first", "authority-bound", "tenant-bound"]),
    fallback_policy: freezeArray(["deterministic-fallback-order", "operator-review-on-block"]),
    delegation_records: freezeArray(delegationRecords),
    ownership_ledger: freezeArray(ownership),
    blocked_tasks: blockedTasks,
    fallback_routes: freezeArray(fallbackRoutes),
    replay_traces: freezeArray(replayTraces),
    routing_justifications: freezeArray(justifications),
    conflicts: foundConflicts,
    events: freezeArray(events),
    evidence,
    created_timestamp: NOW,
    version: VERSION,
    immutable: true as const,
    append_only: true as const,
    operator_visible: !failures.includes("HIDDEN_DELEGATION_DETECTED"),
    integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("delegation-integrity", { contractId, delegationRecords, ownership, replayTraces, evidence }),
  };
  return Object.freeze({ ...base, contract_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : contractHash(base as Omit<DelegationContract, "contract_hash">) });
}

export function validateDelegationAssurance(contract = generateDelegationMap()): DelegationValidationResult {
  const mapHash = new Set(contract.delegation_records.map((record) => hashValue("delegation-record-stable", { task_id: record.task_id, assigned_agent: record.assigned_agent, timestamp: record.timestamp })));
  const reproducible = mapHash.size === contract.delegation_records.length && contract.delegation_records.every((record) => record.timestamp === NOW);
  const capability_valid = contract.routing_justifications.every((item) => item.capability_match) && contract.capability_profiles.every((profile) => profile.certification_level === "CERTIFIED" && profile.mission_compatible && profile.workload_capacity > 0);
  const ownershipCounts = new Map<string, number>();
  contract.ownership_ledger.forEach((item) => ownershipCounts.set(item.task_id, (ownershipCounts.get(item.task_id) ?? 0) + 1));
  const ownership_unique = contract.delegation_records.every((record) => ownershipCounts.get(record.task_id) === 1);
  const authority_valid = contract.delegation_records.every((record) => record.authority_level !== "CERTIFY") && contract.routing_justifications.every((item) => item.authority_validation);
  const governance_valid = contract.governance_policy.length > 0 && contract.routing_justifications.every((item) => item.governance_validation) && contract.events.every((event) => event.governance_reference);
  const constitutional_valid = contract.constitutional_policy.length > 0;
  const blocked_task_handling_valid = contract.blocked_tasks.every((task) => !task.delegated && task.retained_owner && task.action !== "DEFER_DELEGATION");
  const fallbackOrders = contract.fallback_routes.map((route) => route.deterministic_order);
  const fallback_valid = contract.fallback_routes.every((route) => route.preserves_authority && route.preserves_governance && route.replay_reference) && new Set(fallbackOrders).size === fallbackOrders.length;
  const circular_free = contract.delegation_records.every((record) => record.delegating_agent !== record.assigned_agent);
  const accountability_valid = contract.delegation_records.every((record) => contract.ownership_ledger.some((owner) => owner.task_id === record.task_id && owner.owner_agent === record.assigned_agent));
  const replay_valid = Boolean(contract.evidence.replay_reference) && contract.replay_traces.every((trace) => trace.result === "REPRODUCED" && trace.ownership_validation === "VALID");
  const lineage_preserved = contract.delegation_records.every((record) => record.lineage_reference) && contract.ownership_ledger.every((record) => record.lineage_reference) && Boolean(contract.evidence.lineage_reference);
  const integrity_valid = Boolean(contract.integrity_hash && contract.contract_hash) && contractHash(contract) === contract.contract_hash;
  const tenant_isolated = contract.tenant_id.startsWith("tenant:") && contract.capability_profiles.every((profile) => profile.tenant_id === contract.tenant_id);
  const operator_visible = contract.operator_visible;
  const failures = unique([
    ...(!reproducible ? ["NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED" as const] : []),
    ...(!capability_valid ? ["CAPABILITY_MISMATCH_DETECTED" as const] : []),
    ...(!ownership_unique ? ["DUPLICATE_OWNERSHIP_DETECTED" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_VIOLATION_DETECTED" as const] : []),
    ...(!blocked_task_handling_valid ? ["BLOCKED_TASK_INCORRECTLY_DELEGATED" as const] : []),
    ...(!fallback_valid ? ["FALLBACK_ROUTING_MISMATCH_DETECTED" as const] : []),
    ...(!circular_free ? ["CIRCULAR_DELEGATION_DETECTED" as const] : []),
    ...(!accountability_valid ? ["MISSING_ACCOUNTABILITY_DETECTED" as const] : []),
    ...(!replay_valid ? ["DELEGATION_REPLAY_MISMATCH" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_DELEGATION_DETECTED" as const] : []),
    ...(!operator_visible ? ["HIDDEN_DELEGATION_DETECTED" as const] : []),
    ...contract.conflicts.map((conflict) => conflict.conflict_type === "AUTHORITY" && contract.capability_profiles.some((profile) => profile.certification_level === "UNCERTIFIED") ? "UNAUTHORIZED_DELEGATION_DETECTED" as const : conflict.conflict_type === "BLOCKED_TASK" ? "BLOCKED_TASK_INCORRECTLY_DELEGATED" as const : conflict.conflict_type === "REPLAY" ? "DELEGATION_REPLAY_MISMATCH" as const : conflict.conflict_type === "ASSIGNMENT" ? "NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED" as const : conflict.conflict_type === "TENANT" ? "CROSS_TENANT_DELEGATION_DETECTED" as const : conflict.conflict_type === "VISIBILITY" ? "HIDDEN_DELEGATION_DETECTED" as const : conflict.conflict_type === "CAPABILITY" ? "CAPABILITY_MISMATCH_DETECTED" as const : conflict.conflict_type === "ACCOUNTABILITY" ? "MISSING_ACCOUNTABILITY_DETECTED" as const : conflict.conflict_type === "CIRCULAR" ? "CIRCULAR_DELEGATION_DETECTED" as const : conflict.conflict_type === "FALLBACK" ? "FALLBACK_ROUTING_MISMATCH_DETECTED" as const : conflict.conflict_type === "GOVERNANCE" ? "GOVERNANCE_BYPASS_DETECTED" as const : conflict.conflict_type === "CONSTITUTION" ? "CONSTITUTIONAL_VIOLATION_DETECTED" as const : conflict.conflict_type === "INTEGRITY" ? "INTEGRITY_HASH_INVALID" as const : "DUPLICATE_OWNERSHIP_DETECTED" as const),
  ]);
  const valid = failures.length === 0;
  const source = { delegation_contract_id: contract.delegation_contract_id, valid, reproducible, capability_valid, ownership_unique, authority_valid, governance_valid, constitutional_valid, blocked_task_handling_valid, fallback_valid, circular_free, accountability_valid, replay_valid, lineage_preserved, integrity_valid, tenant_isolated, operator_visible, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("delegation-validation", source) });
}

export function validateCapabilityMatch(input: DelegationInput = {}) { const validation = validateDelegationAssurance(generateDelegationMap(input)); return { capability_valid: validation.capability_valid, failures: validation.failures }; }
export function validateDelegationAuthority(input: DelegationInput = {}) { const validation = validateDelegationAssurance(generateDelegationMap(input)); return { authority_valid: validation.authority_valid, failures: validation.failures }; }
export function computeFallbackRoute(input: DelegationInput = {}) { return generateDelegationMap(input).fallback_routes; }
export function detectDelegationConflicts(input: DelegationInput = {}) { return generateDelegationMap(input).conflicts; }
export function validateDelegationReplay(input: DelegationInput = {}) { const validation = validateDelegationAssurance(generateDelegationMap(input)); return { replay_valid: validation.replay_valid, failures: validation.failures }; }
export function finalizeDelegationMap(input: DelegationInput = {}) { return generateDelegationMap(input); }

export function replayDelegationAssurance(contract = generateDelegationMap()): DelegationReplayResult {
  const validation = validateDelegationAssurance(contract);
  const source = { status: validation.replay_valid ? "REPRODUCIBLE" : "MISMATCH", contract_hash: contract.contract_hash, trace_hashes: contract.replay_traces.map((trace) => trace.replay_hash) };
  return Object.freeze({ delegation_replay_status: validation.replay_valid ? "REPRODUCIBLE" : "MISMATCH", reproducibility_score: validation.replay_valid ? 1 : 0, replay_hash: hashValue("delegation-replay-result", source), validation_timestamp: NOW });
}

export function buildDelegationObservabilitySurface(contract = generateDelegationMap()): DelegationObservabilitySurface {
  return Object.freeze({ delegation_contract_id: contract.delegation_contract_id, delegation_session_id: contract.delegation_session_id, tenant_id: contract.tenant_id, mission_id: contract.mission_id, delegation_count: contract.delegation_records.length, ownership_count: contract.ownership_ledger.length, blocked_task_count: contract.blocked_tasks.length, conflict_count: contract.conflicts.length, state: validateDelegationAssurance(contract).valid ? "CERTIFIED" : "FAILED", contract_hash: contract.contract_hash });
}

export function getDeterministicDelegationAssurance(): DeterministicDelegationAssuranceBundle {
  const contract = generateDelegationMap();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "DETERMINISTIC_DELEGATION_ASSURANCE_CERTIFIED", states, capabilities, blocking_reasons: blockingReasons, principles: freezeArray(["deterministic-task-delegation", "certified-capability-matching", "single-task-ownership", "authority-bound-routing", "deterministic-blocked-task-handling", "deterministic-fallback-routing", "immutable-delegation-lineage", "replay-reproducibility", "tenant-isolation", "operator-visible-advisory-delegation"]) }),
    contract,
    validation: validateDelegationAssurance(contract),
    replay: replayDelegationAssurance(contract),
    observability: buildDelegationObservabilitySurface(contract),
  });
}
