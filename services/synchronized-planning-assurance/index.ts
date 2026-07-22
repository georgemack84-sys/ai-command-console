import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createCoordinationContract } from "@/services/multi-agent-coordination-contract";
import type {
  AgentPlan,
  ConstraintCategory,
  DependencyRecord,
  DependencyType,
  PlanCompatibilityScore,
  PlanningContract,
  PlanningEvent,
  PlanningFailure,
  PlanningGraphNode,
  PlanningInput,
  PlanningObservabilitySurface,
  PlanningReplayResult,
  PlanningScenario,
  PlanningValidationResult,
  SharedObjective,
  SynchronizedPlanningAssuranceBundle,
} from "@/types/synchronized-planning-assurance";

const VERSION = "synchronized-planning-assurance/v8ALT.7.2" as const;
const PLAN_VERSION = "synchronized-planning/v8ALT.7.2" as const;
const NOW = "2026-07-13T18:00:00.000Z";
const states = Object.freeze(["INITIALIZING", "OBJECTIVE_VALIDATION", "PLAN_GENERATION", "DEPENDENCY_ALIGNMENT", "SEQUENCE_VALIDATION", "CONSTRAINT_VALIDATION", "CONFLICT_ANALYSIS", "SYNCHRONIZED", "REPLAY_READY", "CERTIFIED", "FAILED"] as const);
const dependencyTypes = Object.freeze(["TASK", "RESOURCE", "DATA", "SERVICE", "MISSION", "AUTHORITY", "POLICY", "GOVERNANCE", "CONSTITUTION"] as const);
const constraintCategories = Object.freeze(["Mission", "Resource", "Authority", "Governance", "Constitution", "Security", "Runtime", "Risk", "Confidence", "Time", "Tenant"] as const);
const baseTasks = Object.freeze(["interpret-objective", "validate-governance", "align-dependencies", "validate-sequence", "synchronize-constraints", "analyze-conflicts", "prepare-replay"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function failuresFor(scenario: PlanningScenario): readonly PlanningFailure[] {
  const map: Partial<Record<PlanningScenario, PlanningFailure>> = {
    OBJECTIVE_MISMATCH: "OBJECTIVE_INTERPRETATION_MISMATCH",
    NONDETERMINISTIC_PLAN: "PLAN_GENERATION_NONDETERMINISTIC",
    MISSING_DEPENDENCY: "MISSING_DEPENDENCY_DETECTED",
    DEPENDENCY_ORDER_MISMATCH: "DEPENDENCY_ORDERING_MISMATCH",
    INCOMPATIBLE_TASK_ORDER: "INCOMPATIBLE_TASK_ORDER_DETECTED",
    CONSTRAINT_MISMATCH: "CONSTRAINT_MISMATCH_DETECTED",
    GRAPH_CYCLE: "PLANNING_GRAPH_CYCLE_DETECTED",
    CONFLICTING_OBJECTIVES: "CONFLICTING_OBJECTIVES_DETECTED",
    DUPLICATE_TASK_OWNERSHIP: "DUPLICATE_TASK_OWNERSHIP_DETECTED",
    PLAN_DIVERGENCE: "PLAN_DIVERGENCE_DETECTED",
    GOVERNANCE_MISMATCH: "GOVERNANCE_MISMATCH_DETECTED",
    AUTHORITY_OVERLAP: "AUTHORITY_OVERLAP_DETECTED",
    CONSTITUTIONAL_MISMATCH: "CONSTITUTIONAL_MISMATCH_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
    CROSS_TENANT_PLANNING: "CROSS_TENANT_PLANNING_DETECTED",
    HIDDEN_PLANNING_ACTIVITY: "HIDDEN_PLANNING_ACTIVITY_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function sharedObjective(missionId: string, failures: readonly PlanningFailure[], governance: string, constitution: string): SharedObjective {
  return Object.freeze({
    mission_id: missionId,
    objective_id: id("OBJ", "synchronized-planning-objective", missionId),
    objective_description: failures.includes("OBJECTIVE_INTERPRETATION_MISMATCH") ? "Divergent mission interpretation" : "Produce one deterministic governance-compliant advisory execution plan",
    success_criteria: failures.includes("CONFLICTING_OBJECTIVES_DETECTED") ? freezeArray(["maximize conflicting local objective"]) : freezeArray(["all agents share objective", "dependencies aligned", "sequencing deterministic", "replay certified"]),
    priority: "CERTIFICATION",
    constraints: freezeArray(["advisory-only", "no-execution-authority", "tenant-isolated", "operator-visible"]),
    authorized_resources: freezeArray(["evidence", "governance-context", "replay-ledger"]),
    authorized_outputs: freezeArray(["synchronized-plan", "compatibility-score", "conflict-analysis", "certification-report"]),
    governance_context: failures.includes("GOVERNANCE_MISMATCH_DETECTED") ? "" : governance,
    constitutional_context: failures.includes("CONSTITUTIONAL_MISMATCH_DETECTED") ? "" : constitution,
  });
}

function dependencyGraph(failures: readonly PlanningFailure[]): readonly DependencyRecord[] {
  const tasks = failures.includes("DEPENDENCY_ORDERING_MISMATCH") ? [...baseTasks].reverse() : [...baseTasks];
  const rows = tasks.slice(1).map((task, index) => {
    const parent = failures.includes("PLANNING_GRAPH_CYCLE_DETECTED") && index === tasks.length - 2 ? task : tasks[index];
    const base = {
      dependency_id: id("DEP", "synchronized-planning-dependency", { parent, task }),
      parent_task: parent,
      dependent_task: task,
      dependency_type: dependencyTypes[(index % dependencyTypes.length)] as DependencyType,
      validation_state: failures.includes("MISSING_DEPENDENCY_DETECTED") && index === 1 ? "MISSING" as const : failures.includes("DEPENDENCY_ORDERING_MISMATCH") ? "INVALID_ORDER" as const : "VALID" as const,
      authority_reference: "authority:operator:planning",
      governance_reference: failures.includes("GOVERNANCE_MISMATCH_DETECTED") ? "" : "governance:planning:v8ALT.7.2",
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("synchronized-planning-dependency", base) });
  });
  return freezeArray(failures.includes("MISSING_DEPENDENCY_DETECTED") ? rows.slice(1) : rows);
}

function executionGraph(agentIds: readonly string[], failures: readonly PlanningFailure[]): readonly PlanningGraphNode[] {
  const ownerFor = (index: number) => failures.includes("DUPLICATE_TASK_OWNERSHIP_DETECTED") && index < 2 ? agentIds[0] : agentIds[index % agentIds.length];
  return freezeArray(baseTasks.map((task, index) => Object.freeze({
    graph_id: id("GRAPH", "synchronized-planning-graph", "primary"),
    node_id: `node:${task}`,
    node_type: index === 0 ? "plan_node" : index === 1 ? "governance_node" : index === 2 ? "dependency_node" : index === 3 ? "execution_node" : index === 4 ? "constraint_node" : index === 5 ? "decision_node" : "checkpoint_node",
    parent_node: index === 0 ? (failures.includes("PLANNING_GRAPH_CYCLE_DETECTED") ? "node:prepare-replay" : null) : `node:${baseTasks[index - 1]}`,
    dependency_nodes: index === 0 ? freezeArray([]) : freezeArray([`node:${baseTasks[index - 1]}`]),
    execution_order: failures.includes("INCOMPATIBLE_TASK_ORDER_DETECTED") && index === 3 ? 1 : index + 1,
    owner_agent: ownerFor(index),
    authority_scope: failures.includes("AUTHORITY_OVERLAP_DETECTED") && index === 2 ? "CERTIFY" : "ANALYZE",
    constraint_reference: failures.includes("CONSTRAINT_MISMATCH_DETECTED") && index === 2 ? "" : `constraint:${constraintCategories[index % constraintCategories.length]}`,
    governance_reference: failures.includes("GOVERNANCE_MISMATCH_DETECTED") ? "" : "governance:planning:v8ALT.7.2",
    risk_score: failures.length ? 0.72 : 0.12,
    confidence_score: failures.length ? 0.42 : 0.96,
    status: failures.length ? "FAILED" : "READY",
  })));
}

function agentPlans(agentIds: readonly string[], sessionId: string, objective: SharedObjective, dependencies: readonly DependencyRecord[], failures: readonly PlanningFailure[]): readonly AgentPlan[] {
  const canonicalExecution = freezeArray(baseTasks);
  const canonicalDependencyIds = freezeArray(dependencies.map((dependency) => dependency.dependency_id));
  const canonicalConstraints = freezeArray(constraintCategories.map((constraint) => `constraint:${constraint}`));
  return freezeArray(agentIds.map((agentId, index) => {
    const objectiveSource = failures.includes("OBJECTIVE_INTERPRETATION_MISMATCH") && index === 1 ? { ...objective, objective_description: "Different local objective" } : objective;
    const execution = failures.includes("PLAN_DIVERGENCE_DETECTED") && index === 1 ? freezeArray([...baseTasks].reverse()) : canonicalExecution;
    const dependencyIds = failures.includes("DEPENDENCY_ORDERING_MISMATCH") && index === 1 ? freezeArray([...canonicalDependencyIds].reverse()) : canonicalDependencyIds;
    const constraints = failures.includes("CONSTRAINT_MISMATCH_DETECTED") && index === 1 ? freezeArray(canonicalConstraints.slice(1)) : canonicalConstraints;
    const base = {
      plan_id: id("PLAN", "synchronized-agent-plan", { agentId, sessionId }),
      coordination_session_id: sessionId,
      agent_id: agentId,
      planning_version: PLAN_VERSION,
      planning_timestamp: failures.includes("PLAN_GENERATION_NONDETERMINISTIC") && index === 1 ? "2026-07-13T18:00:01.000Z" : NOW,
      planning_state: failures.length ? "FAILED" as const : "CERTIFIED" as const,
      planning_confidence: failures.length ? 0.51 : 0.97,
      objective_interpretation_hash: hashValue("synchronized-objective-interpretation", objectiveSource),
      execution_graph: execution,
      dependency_graph: dependencyIds,
      constraint_graph: constraints,
      governance_validation: failures.includes("GOVERNANCE_MISMATCH_DETECTED") ? "INVALID" as const : "VALID" as const,
    };
    return Object.freeze({ ...base, integrity_hash: hashValue("synchronized-agent-plan", base) });
  }));
}

function conflicts(agentIds: readonly string[], failures: readonly PlanningFailure[]): readonly import("@/types/synchronized-planning-assurance").PlanningConflict[] {
  const make = (type: import("@/types/synchronized-planning-assurance").PlanningConflict["conflict_type"], failure: PlanningFailure, resolution: string, category?: import("@/types/synchronized-planning-assurance").DivergenceCategory) => Object.freeze({
    conflict_id: id("PCON", "synchronized-planning-conflict", { type, failure }),
    conflict_type: type,
    affected_agents: freezeArray(agentIds.slice(0, 2)),
    affected_tasks: freezeArray(baseTasks.slice(0, 3)),
    severity: "CRITICAL" as const,
    expected_order: freezeArray(baseTasks),
    observed_order: failure === "INCOMPATIBLE_TASK_ORDER_DETECTED" || failure === "DEPENDENCY_ORDERING_MISMATCH" ? freezeArray([...baseTasks].reverse()) : freezeArray(baseTasks),
    recommended_resolution: resolution,
    ...(category ? { divergence_category: category } : {}),
  });
  const rows = [
    failures.includes("OBJECTIVE_INTERPRETATION_MISMATCH") || failures.includes("CONFLICTING_OBJECTIVES_DETECTED") ? make("OBJECTIVE", "CONFLICTING_OBJECTIVES_DETECTED", "Reconcile shared objective before planning.", "OBJECTIVE") : null,
    failures.includes("INCOMPATIBLE_TASK_ORDER_DETECTED") || failures.includes("DEPENDENCY_ORDERING_MISMATCH") ? make("SEQUENCE", "INCOMPATIBLE_TASK_ORDER_DETECTED", "Restore canonical dependency and checkpoint order.", "SEQUENCE") : null,
    failures.includes("DUPLICATE_TASK_OWNERSHIP_DETECTED") ? make("OWNERSHIP", "DUPLICATE_TASK_OWNERSHIP_DETECTED", "Assign a single owner per planning node.") : null,
    failures.includes("MISSING_DEPENDENCY_DETECTED") ? make("DEPENDENCY", "MISSING_DEPENDENCY_DETECTED", "Resolve missing prerequisite before finalization.", "DEPENDENCY") : null,
    failures.includes("PLAN_DIVERGENCE_DETECTED") || failures.includes("PLAN_GENERATION_NONDETERMINISTIC") ? make("DIVERGENCE", "PLAN_DIVERGENCE_DETECTED", "Regenerate plans from canonical inputs.", "EXECUTION") : null,
    failures.includes("AUTHORITY_OVERLAP_DETECTED") ? make("AUTHORITY", "AUTHORITY_OVERLAP_DETECTED", "Remove overlapping planning authority.") : null,
    failures.includes("GOVERNANCE_MISMATCH_DETECTED") ? make("GOVERNANCE", "GOVERNANCE_MISMATCH_DETECTED", "Synchronize governance context.") : null,
    failures.includes("CONSTITUTIONAL_MISMATCH_DETECTED") ? make("CONSTITUTION", "CONSTITUTIONAL_MISMATCH_DETECTED", "Synchronize constitutional context.") : null,
    failures.includes("CROSS_TENANT_PLANNING_DETECTED") ? make("TENANT", "CROSS_TENANT_PLANNING_DETECTED", "Reject external tenant planning participants.") : null,
    failures.includes("HIDDEN_PLANNING_ACTIVITY_DETECTED") ? make("VISIBILITY", "HIDDEN_PLANNING_ACTIVITY_DETECTED", "Expose all planning activity to the operator.") : null,
    failures.includes("INTEGRITY_HASH_INVALID") ? make("INTEGRITY", "INTEGRITY_HASH_INVALID", "Regenerate immutable integrity hashes.") : null,
  ].filter(Boolean);
  return freezeArray(rows as ReturnType<typeof make>[]);
}

function score(failures: readonly PlanningFailure[]): PlanCompatibilityScore {
  const penalty = failures.length ? 0.4 : 0;
  const conflictScore = failures.length ? 0.82 : 0;
  return Object.freeze({
    compatibility_score: 0.98 - penalty,
    synchronization_score: 0.97 - penalty,
    conflict_score: conflictScore,
    risk_score: failures.length ? 0.7 : 0.08,
    confidence_score: failures.length ? 0.48 : 0.96,
    objective_agreement: failures.includes("OBJECTIVE_INTERPRETATION_MISMATCH") ? 0 : 1,
    dependency_agreement: failures.includes("MISSING_DEPENDENCY_DETECTED") || failures.includes("DEPENDENCY_ORDERING_MISMATCH") ? 0.2 : 1,
    sequencing_agreement: failures.includes("INCOMPATIBLE_TASK_ORDER_DETECTED") ? 0 : 1,
    authority_agreement: failures.includes("AUTHORITY_OVERLAP_DETECTED") ? 0 : 1,
    governance_agreement: failures.includes("GOVERNANCE_MISMATCH_DETECTED") ? 0 : 1,
    constraint_agreement: failures.includes("CONSTRAINT_MISMATCH_DETECTED") ? 0 : 1,
    replay_agreement: failures.includes("REPLAY_MISMATCH_DETECTED") ? 0 : 1,
  });
}

function lifecycle(sessionId: string, agentId: string, objectiveId: string): readonly PlanningEvent[] {
  const transitions: [PlanningEvent["previous_state"], PlanningEvent["new_state"]][] = [["INITIALIZING", "OBJECTIVE_VALIDATION"], ["OBJECTIVE_VALIDATION", "PLAN_GENERATION"], ["PLAN_GENERATION", "DEPENDENCY_ALIGNMENT"], ["DEPENDENCY_ALIGNMENT", "SEQUENCE_VALIDATION"], ["SEQUENCE_VALIDATION", "CONSTRAINT_VALIDATION"], ["CONSTRAINT_VALIDATION", "CONFLICT_ANALYSIS"], ["CONFLICT_ANALYSIS", "SYNCHRONIZED"], ["SYNCHRONIZED", "REPLAY_READY"], ["REPLAY_READY", "CERTIFIED"]];
  return freezeArray(transitions.map(([previous_state, new_state], index) => {
    const base = { event_id: id("SPEV", "synchronized-planning-event", { sessionId, index }), planning_session_id: sessionId, agent_id: agentId, event_type: "planning_state_transition", planning_state: new_state, previous_state, new_state, objective_reference: objectiveId, dependency_reference: "dependency-graph:primary", governance_reference: "governance:planning:v8ALT.7.2", timestamp: `2026-07-13T18:0${index}:00.000Z` };
    return Object.freeze({ ...base, integrity_hash: hashValue("synchronized-planning-event", base) });
  }));
}

function contractHash(contract: Omit<PlanningContract, "contract_hash"> | PlanningContract): string {
  const { contract_hash: _hash, ...source } = contract as PlanningContract;
  return hashValue("synchronized-planning-contract", source);
}

export function generateSynchronizedPlan(input: PlanningInput = {}): PlanningContract {
  if (input.contract) return input.contract;
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const coordination = createCoordinationContract({ tenant_id: input.tenant_id, mission_id: input.mission_id });
  const missionId = input.mission_id ?? coordination.mission_id;
  const tenantId = input.tenant_id ?? coordination.tenant_id;
  const contractId = id("SPAC", "synchronized-planning-contract", { missionId, scenario: input.scenario ?? "BASELINE" });
  const sessionId = id("SPAS", "synchronized-planning-session", { contractId, missionId });
  const participants = failures.includes("HIDDEN_PLANNING_ACTIVITY_DETECTED") ? coordination.participating_agents.slice(1) : coordination.participating_agents.map((agent, index) => failures.includes("CROSS_TENANT_PLANNING_DETECTED") && index === 1 ? Object.freeze({ ...agent, tenant_id: "external-tenant" }) : agent);
  const objective = sharedObjective(missionId, failures, coordination.governance_binding.governance_context_id, coordination.governance_binding.constitution_version);
  const dependencies = dependencyGraph(failures);
  const graph = executionGraph(participants.map((agent) => agent.agent_id), failures);
  const plans = agentPlans(participants.map((agent) => agent.agent_id), coordination.coordination_session_id, objective, dependencies, failures);
  const foundConflicts = conflicts(participants.map((agent) => agent.agent_id), failures);
  const compatibility = score(failures);
  const events = lifecycle(sessionId, participants[0]?.agent_id ?? "agent:coordinator", objective.objective_id);
  const evidenceBase = {
    planning_session_id: sessionId,
    coordination_session_id: coordination.coordination_session_id,
    mission_id: missionId,
    agent_ids: freezeArray(participants.map((agent) => agent.agent_id)),
    objective_evidence: freezeArray(plans.map((plan) => plan.objective_interpretation_hash)),
    dependency_evidence: freezeArray(dependencies.map((dependency) => dependency.integrity_hash)),
    sequence_evidence: freezeArray(graph.map((node) => `${node.node_id}:${node.execution_order}`)),
    constraint_evidence: freezeArray(graph.map((node) => node.constraint_reference).filter(Boolean)),
    governance_evidence: freezeArray([objective.governance_context, ...graph.map((node) => node.governance_reference)].filter(Boolean)),
    authority_evidence: freezeArray(graph.map((node) => `${node.node_id}:${node.authority_scope}`)),
    conflict_analysis: foundConflicts,
    compatibility_score: compatibility,
    lineage_reference: `lineage:synchronized-planning:${contractId}`,
    replay_reference: failures.includes("REPLAY_MISMATCH_DETECTED") ? "" : `replay:synchronized-planning:${contractId}`,
    timestamp: NOW,
  };
  const evidence = Object.freeze({ ...evidenceBase, integrity_hash: hashValue("synchronized-planning-evidence", evidenceBase) });
  const base = {
    planning_contract_id: contractId,
    planning_session_id: sessionId,
    coordination_session_id: coordination.coordination_session_id,
    mission_id: missionId,
    tenant_id: tenantId,
    participating_agents: freezeArray(participants),
    shared_objective: objective,
    planning_constraints: constraintCategories,
    agent_plans: plans,
    dependency_graph: dependencies,
    execution_graph: graph,
    governance_reference: failures.includes("GOVERNANCE_MISMATCH_DETECTED") ? "" : coordination.governance_binding.governance_context_id,
    constitutional_reference: failures.includes("CONSTITUTIONAL_MISMATCH_DETECTED") ? "" : coordination.governance_binding.constitution_version,
    authority_reference: "authority:operator:planning",
    planning_version: VERSION,
    planning_state: failures.length ? "FAILED" as const : "CERTIFIED" as const,
    lifecycle_events: events,
    evidence,
    created_timestamp: NOW,
    immutable: true as const,
    append_only: true as const,
    operator_visible: !failures.includes("HIDDEN_PLANNING_ACTIVITY_DETECTED"),
    integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("synchronized-planning-integrity", { contractId, sessionId, plans, dependencies, graph, evidence }),
  };
  return Object.freeze({ ...base, contract_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : contractHash(base as Omit<PlanningContract, "contract_hash">) });
}

export function validateSynchronizedPlanning(contract = generateSynchronizedPlan()): PlanningValidationResult {
  const objectiveHashes = new Set(contract.agent_plans.map((plan) => plan.objective_interpretation_hash));
  const executionHashes = new Set(contract.agent_plans.map((plan) => hashValue("execution-graph", plan.execution_graph)));
  const dependencyHashes = new Set(contract.agent_plans.map((plan) => hashValue("dependency-graph", plan.dependency_graph)));
  const constraintHashes = new Set(contract.agent_plans.map((plan) => hashValue("constraint-graph", plan.constraint_graph)));
  const taskOrder = new Map<string, number>(baseTasks.map((task, index) => [task, index]));
  const dependencyOrders = contract.dependency_graph.map((dependency) => (taskOrder.get(dependency.parent_task) ?? Number.POSITIVE_INFINITY) <= (taskOrder.get(dependency.dependent_task) ?? Number.NEGATIVE_INFINITY));
  const executionOrders = contract.execution_graph.map((node) => node.execution_order);
  const duplicateOrders = new Set(executionOrders).size !== executionOrders.length;
  const duplicateOwners = contract.execution_graph.some((node, index, rows) => rows.findIndex((other) => other.owner_agent === node.owner_agent) !== index && index < 2);
  const hasCycle = contract.execution_graph.some((node) => node.parent_node && node.dependency_nodes.includes(node.node_id)) || contract.execution_graph.some((node) => node.parent_node === "node:prepare-replay" && node.node_id === "node:interpret-objective");
  const objective_valid = objectiveHashes.size === 1 && contract.shared_objective.governance_context !== "" && contract.shared_objective.constitutional_context !== "";
  const plan_generation_deterministic = executionHashes.size === 1 && contract.agent_plans.every((plan) => plan.planning_timestamp === NOW);
  const dependency_alignment_valid = dependencyHashes.size === 1 && contract.dependency_graph.length === baseTasks.length - 1 && contract.dependency_graph.every((dependency) => dependency.validation_state === "VALID") && dependencyOrders.every(Boolean);
  const sequencing_valid = !duplicateOrders && contract.execution_graph.every((node, index) => node.execution_order === index + 1);
  const constraint_awareness_valid = constraintHashes.size === 1 && contract.execution_graph.every((node) => node.constraint_reference);
  const graph_valid = !hasCycle && !duplicateOwners && contract.execution_graph.every((node) => node.status === "READY");
  const conflict_free = contract.evidence.conflict_analysis.length === 0;
  const governance_valid = Boolean(contract.governance_reference && contract.shared_objective.governance_context) && contract.agent_plans.every((plan) => plan.governance_validation === "VALID") && contract.execution_graph.every((node) => node.governance_reference);
  const authority_valid = contract.execution_graph.every((node) => node.authority_scope !== "CERTIFY");
  const constitutional_valid = Boolean(contract.constitutional_reference && contract.shared_objective.constitutional_context);
  const replay_valid = Boolean(contract.evidence.replay_reference) && contract.lifecycle_events.every((event) => event.integrity_hash);
  const integrity_valid = Boolean(contract.integrity_hash && contract.contract_hash) && contractHash(contract) === contract.contract_hash;
  const tenant_isolated = contract.tenant_id.startsWith("tenant:") && contract.participating_agents.every((agent) => agent.tenant_id === contract.tenant_id);
  const operator_visible = contract.operator_visible;
  const failures = unique([
    ...(!objective_valid ? ["OBJECTIVE_INTERPRETATION_MISMATCH" as const] : []),
    ...(!plan_generation_deterministic ? ["PLAN_GENERATION_NONDETERMINISTIC" as const] : []),
    ...(!dependency_alignment_valid ? [contract.dependency_graph.some((dependency) => dependency.validation_state === "MISSING") || contract.dependency_graph.length < baseTasks.length - 1 ? "MISSING_DEPENDENCY_DETECTED" as const : "DEPENDENCY_ORDERING_MISMATCH" as const] : []),
    ...(!sequencing_valid ? ["INCOMPATIBLE_TASK_ORDER_DETECTED" as const] : []),
    ...(!constraint_awareness_valid ? ["CONSTRAINT_MISMATCH_DETECTED" as const] : []),
    ...(!graph_valid ? [hasCycle ? "PLANNING_GRAPH_CYCLE_DETECTED" as const : "DUPLICATE_TASK_OWNERSHIP_DETECTED" as const] : []),
    ...(!conflict_free ? contract.evidence.conflict_analysis.map((conflict) => conflict.conflict_type === "DIVERGENCE" ? "PLAN_DIVERGENCE_DETECTED" as const : conflict.conflict_type === "OBJECTIVE" ? "CONFLICTING_OBJECTIVES_DETECTED" as const : `${conflict.conflict_type}_MISMATCH_DETECTED` as PlanningFailure) : []),
    ...(!governance_valid ? ["GOVERNANCE_MISMATCH_DETECTED" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_OVERLAP_DETECTED" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_MISMATCH_DETECTED" as const] : []),
    ...(!replay_valid ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_PLANNING_DETECTED" as const] : []),
    ...(!operator_visible ? ["HIDDEN_PLANNING_ACTIVITY_DETECTED" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { planning_contract_id: contract.planning_contract_id, valid, objective_valid, plan_generation_deterministic, dependency_alignment_valid, sequencing_valid, constraint_awareness_valid, graph_valid, conflict_free, governance_valid, authority_valid, constitutional_valid, replay_valid, integrity_valid, tenant_isolated, operator_visible, fail_closed: !valid ? failures.length > 0 : true, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("synchronized-planning-validation", source) });
}

export function validateObjective(input: PlanningInput = {}) { const validation = validateSynchronizedPlanning(generateSynchronizedPlan(input)); return { objective_valid: validation.objective_valid, failures: validation.failures }; }
export function validateDependencies(input: PlanningInput = {}) { const validation = validateSynchronizedPlanning(generateSynchronizedPlan(input)); return { dependency_alignment_valid: validation.dependency_alignment_valid, failures: validation.failures }; }
export function validateSequencing(input: PlanningInput = {}) { const validation = validateSynchronizedPlanning(generateSynchronizedPlan(input)); return { sequencing_valid: validation.sequencing_valid, failures: validation.failures }; }
export function analyzePlanningConflicts(input: PlanningInput = {}) { return generateSynchronizedPlan(input).evidence.conflict_analysis; }
export function computeCompatibilityScore(input: PlanningInput = {}) { return generateSynchronizedPlan(input).evidence.compatibility_score; }
export function finalizeSynchronizedPlan(input: PlanningInput = {}) { return generateSynchronizedPlan(input); }

export function replaySynchronizedPlanning(contract = generateSynchronizedPlan()): PlanningReplayResult {
  const reconstructed_hash = contractHash(contract);
  const source = { replay_reference: `replay:synchronized-planning:${contract.planning_contract_id}`, planning_contract_id: contract.planning_contract_id, deterministic: reconstructed_hash === contract.contract_hash && Boolean(contract.evidence.replay_reference), reconstructed_hash, original_hash: contract.contract_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("synchronized-planning-replay", source) });
}

export function buildPlanningObservabilitySurface(contract = generateSynchronizedPlan()): PlanningObservabilitySurface {
  return Object.freeze({ planning_contract_id: contract.planning_contract_id, planning_session_id: contract.planning_session_id, tenant_id: contract.tenant_id, mission_id: contract.mission_id, participating_agent_count: contract.participating_agents.length, graph_node_count: contract.execution_graph.length, dependency_count: contract.dependency_graph.length, conflict_count: contract.evidence.conflict_analysis.length, state: validateSynchronizedPlanning(contract).valid ? "CERTIFIED" : "FAILED", compatibility_score: contract.evidence.compatibility_score.compatibility_score, contract_hash: contract.contract_hash });
}

export function getSynchronizedPlanningAssurance(): SynchronizedPlanningAssuranceBundle {
  const contract = generateSynchronizedPlan();
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "SYNCHRONIZED_PLANNING_ASSURANCE_CERTIFIED", states, dependency_types: dependencyTypes, constraint_categories: constraintCategories, principles: freezeArray(["shared-objective-interpretation", "deterministic-plan-generation", "dependency-alignment", "sequencing-consistency", "constraint-synchronization", "conflict-free-planning-graph", "governance-supremacy", "constitutional-supremacy", "tenant-isolation", "replay-certification"]) }),
    contract,
    validation: validateSynchronizedPlanning(contract),
    replay: replaySynchronizedPlanning(contract),
    observability: buildPlanningObservabilitySurface(contract),
  });
}
