import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective, validateObjectiveHierarchy } from "@/services/objective-decomposition";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { ObjectiveAtomicTask, ObjectiveHierarchyPackage } from "@/types/objective-decomposition";
import type {
  DependencyAnalysisFramework,
  DependencyAnalysisScenario,
  DependencyFailureReason,
  DependencyGraphEdge,
  DependencyGraphNode,
  DependencyGraphPackage,
  DependencyIntakeRecord,
  DependencyReadinessState,
  DependencyReplayResult,
  DependencyValidationState,
  DependencyValidationResult,
  DependencyVisibilitySurface,
} from "@/types/dependency-analysis";

const NOW = "2026-06-29T04:00:00.000Z";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

export function buildDependencyIntake(identity = generateAutonomyIdentity(), hierarchy = decomposeObjective(identity), scenario: DependencyAnalysisScenario = "BASELINE"): DependencyIntakeRecord {
  const normalizedTasks = hierarchy.tasks.map((task, index) => ({
    ...task,
    task_id: scenario === "MISSING_TASK_ID" && index === 0 ? "" : scenario === "DUPLICATE_TASK" && index > 0 ? hierarchy.tasks[0].task_id : task.task_id,
    parent_sub_objective_id: scenario === "ORPHAN_TASK" && index === 0 ? "missing-parent" : task.parent_sub_objective_id,
    replay_reference: scenario === "MISSING_REPLAY" && index === 0 ? "" : task.replay_reference,
    deterministic_order: scenario === "NONDETERMINISTIC_ORDERING" && index === 1 ? 99 : task.deterministic_order,
  }));
  const source = {
    intake_id: id("DI", "dependency-intake-id", { objective_id: hierarchy.objective_id, scenario }),
    objective_id: hierarchy.objective_id,
    mission_id: hierarchy.mission_id,
    tenant_id: scenario === "INVALID_TENANT" ? "tenant_beta" : hierarchy.tenant_id,
    hierarchy,
    normalized_tasks: freezeArray(normalizedTasks),
    task_identity_map: Object.freeze(Object.fromEntries(normalizedTasks.filter((task) => task.task_id).map((task) => [task.task_id, task.lineage_reference]))),
    replay_reference: scenario === "MISSING_REPLAY" ? "" : hierarchy.replay_reference,
    lineage_reference: hierarchy.lineage_reference,
  };
  return Object.freeze({ ...source, intake_hash: hashValue("dependency-intake", source) });
}

function dataForTask(task: ObjectiveAtomicTask, scenario: DependencyAnalysisScenario): readonly string[] {
  if (scenario === "MISSING_DATA" && task.deterministic_order === 1) return freezeArray([]);
  const byOrder: Record<number, readonly string[]> = {
    1: ["package hash", "deployment manifest"],
    2: ["policy reference", "compliance record"],
    3: ["environment configuration", "rollback plan reference"],
    4: ["execution intent", "operator approval"],
    5: ["execution evidence", "truth ledger record"],
    6: ["post-deployment telemetry", "replay evidence"],
  };
  return freezeArray(byOrder[task.deterministic_order] ?? ["task evidence"]);
}

function resourcesForTask(task: ObjectiveAtomicTask, scenario: DependencyAnalysisScenario): readonly string[] {
  if (scenario === "RESOURCE_UNAVAILABLE" && task.deterministic_order === 3) return freezeArray(["unavailable deployment system"]);
  const resources = task.deterministic_order <= 2 ? ["validation service", "policy engine", "integrity framework"] : task.deterministic_order <= 4 ? ["deployment system", "replay engine", "truth ledger"] : ["telemetry service", "integrity framework", "visibility framework"];
  return freezeArray(resources);
}

function temporalForTask(task: ObjectiveAtomicTask, scenario: DependencyAnalysisScenario): readonly string[] {
  if (scenario === "TEMPORAL_CONFLICT" && task.deterministic_order === 4) return freezeArray(["maintenance window expired"]);
  return freezeArray(task.deterministic_order <= 3 ? ["after prerequisite completion"] : ["after rollout preparation", "rollback window open"]);
}

function nodeForTask(task: ObjectiveAtomicTask, scenario: DependencyAnalysisScenario, predecessorComplete: boolean): DependencyGraphNode {
  const blockers: DependencyFailureReason[] = [];
  const data = dataForTask(task, scenario);
  const resources = resourcesForTask(task, scenario);
  const temporal = temporalForTask(task, scenario);
  if (!predecessorComplete) blockers.push("MUTUALLY_BLOCKING_TASKS");
  if (task.parent_sub_objective_id === "missing-parent") blockers.push("ORPHAN_TASK");
  if (data.length === 0) blockers.push("MISSING_DATA");
  if (scenario === "AUTHORITY_GAP" && task.deterministic_order === 4) blockers.push("MISSING_AUTHORITY");
  if (scenario === "GOVERNANCE_UNRESOLVED" && task.deterministic_order === 2) blockers.push("MISSING_POLICY_VALIDATION");
  if (resources.some((resource) => resource.includes("unavailable"))) blockers.push("RESOURCE_UNAVAILABLE");
  if (temporal.some((item) => item.includes("expired"))) blockers.push("TEMPORAL_CONFLICT");
  if (scenario === "UNEXPLAINED_BLOCKER" && task.deterministic_order === 5) blockers.push("UNEXPLAINED_BLOCKER");
  const readiness: DependencyReadinessState = blockers.length ? "BLOCKED" : task.deterministic_order === 1 ? "READY" : "WAITING_ON_TASK";
  return Object.freeze({
    task_id: task.task_id,
    task_type: "ATOMIC" as const,
    parent_objective_id: task.parent_objective_id,
    milestone_id: task.milestone_id,
    readiness_state: readiness,
    authority_required: task.required_authority,
    governance_required: task.governance_references,
    resources_required: resources,
    data_required: data,
    temporal_constraints: temporal,
    blocker_reasons: freezeArray(blockers),
    replay_reference: task.replay_reference,
    lineage_reference: task.lineage_reference,
  });
}

function edge(from: ObjectiveAtomicTask, to: ObjectiveAtomicTask, type: DependencyGraphEdge["dependency_type"], reason: string, scenario: DependencyAnalysisScenario): DependencyGraphEdge {
  return Object.freeze({
    edge_id: id("DE", "dependency-edge-id", { from: from.task_id, to: to.task_id, type, reason }),
    from_task_id: from.task_id,
    to_task_id: scenario === "CYCLIC_DEPENDENCY" && to.deterministic_order === 2 ? from.task_id : to.task_id,
    dependency_type: type,
    reason,
    required_condition: `${from.title} complete before ${to.title}`,
    governance_reference: to.governance_references[0] ?? "governance_profile_controlled_autonomy",
    authority_reference: to.required_authority,
    data_reference: to.replay_reference,
    replay_reference: to.replay_reference,
    hidden: scenario === "HIDDEN_EDGE" && to.deterministic_order === 3,
  });
}

function graphHashSource(graph: Omit<DependencyGraphPackage, "integrity_hash"> | DependencyGraphPackage) {
  return {
    dependency_graph_id: graph.dependency_graph_id,
    objective_id: graph.objective_id,
    mission_id: graph.mission_id,
    tenant_id: graph.tenant_id,
    nodes: graph.nodes,
    edges: graph.edges,
    ready_tasks: graph.ready_tasks,
    blocked_tasks: graph.blocked_tasks,
    parallel_groups: graph.parallel_groups,
    critical_path: graph.critical_path,
    dependency_chains: graph.dependency_chains,
    validation_state: graph.validation_state,
    replay_reference: graph.replay_reference,
    lineage_reference: graph.lineage_reference,
    created_timestamp: graph.created_timestamp,
  };
}

export function computeDependencyGraphHash(graph: Omit<DependencyGraphPackage, "integrity_hash"> | DependencyGraphPackage): string {
  return hashValue("dependency-graph", graphHashSource(graph));
}

export function analyzeDependencies(identity = generateAutonomyIdentity(), hierarchy = decomposeObjective(identity), scenario: DependencyAnalysisScenario = "BASELINE"): DependencyGraphPackage {
  const intake = buildDependencyIntake(identity, hierarchy, scenario);
  const tasks = intake.normalized_tasks;
  const nodes = freezeArray(tasks.map((task, index) => nodeForTask(task, scenario, index === 0 || tasks[index - 1].task_id.length > 0)));
  const sequentialEdges = tasks.slice(1).map((task, index) => edge(tasks[index], task, "TASK", "sequential prerequisite", scenario));
  const dataEdges = tasks.map((task) => edge(task, task, "DATA", "data prerequisite", scenario));
  const authorityEdges = tasks.map((task) => edge(task, task, "AUTHORITY", "authority prerequisite", scenario));
  const governanceEdges = tasks.map((task) => edge(task, task, "GOVERNANCE", "governance prerequisite", scenario));
  const resourceEdges = tasks.map((task) => edge(task, task, "RESOURCE", "resource prerequisite", scenario));
  const temporalEdges = tasks.map((task) => edge(task, task, "TEMPORAL", "temporal prerequisite", scenario));
  const edges = freezeArray([...sequentialEdges, ...dataEdges, ...authorityEdges, ...governanceEdges, ...resourceEdges, ...temporalEdges]);
  const blockedTasks = nodes.filter((node) => node.blocker_reasons.length > 0 || node.readiness_state === "BLOCKED").map((node) => node.task_id);
  const readyTasks = nodes.filter((node) => node.readiness_state === "READY").map((node) => node.task_id);
  const orderedTaskIds = tasks.map((task) => task.task_id);
  const criticalPath = scenario === "CRITICAL_PATH_MISSING" ? [] : scenario === "NONDETERMINISTIC_ORDERING" ? [orderedTaskIds[1], orderedTaskIds[0], ...orderedTaskIds.slice(2)] : orderedTaskIds;
  const dependencyChains = freezeArray([freezeArray(tasks.map((task) => task.task_id))]);
  const base = {
    dependency_graph_id: id("DG", "dependency-graph-id", { objective_id: hierarchy.objective_id, scenario }),
    objective_id: hierarchy.objective_id,
    mission_id: hierarchy.mission_id,
    tenant_id: intake.tenant_id,
    nodes,
    edges,
    ready_tasks: freezeArray(readyTasks),
    blocked_tasks: freezeArray(blockedTasks),
    parallel_groups: freezeArray([freezeArray(tasks.slice(0, 1).map((task) => task.task_id)), freezeArray(tasks.slice(4, 6).map((task) => task.task_id))]),
    critical_path: freezeArray(criticalPath),
    dependency_chains: dependencyChains,
    validation_state: blockedTasks.length ? "CONDITIONAL_PASS" as const : "PASS" as const,
    replay_reference: intake.replay_reference,
    lineage_reference: intake.lineage_reference,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeDependencyGraphHash(base) });
}

function detectCycle(graph: DependencyGraphPackage): boolean {
  return graph.edges.some((item) => item.dependency_type === "TASK" && item.from_task_id === item.to_task_id);
}

export function validateDependencyGraph(identity: AutonomyIdentityRecord, graph: DependencyGraphPackage, hierarchy = decomposeObjective(identity)): DependencyValidationResult {
  const failures: DependencyFailureReason[] = [];
  const objectiveValidation = validateObjectiveHierarchy(identity, hierarchy);
  if (objectiveValidation.validation_state === "FAIL") failures.push("INTAKE_SCHEMA_INVALID");
  if (graph.nodes.some((node) => !node.task_id)) failures.push("MISSING_TASK_ID");
  const ids = graph.nodes.map((node) => node.task_id).filter(Boolean);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_TASK_ID");
  const taskIds = new Set(hierarchy.tasks.map((task) => task.task_id));
  if (graph.nodes.some((node) => !taskIds.has(node.task_id))) failures.push("ORPHAN_TASK");
  if (graph.tenant_id !== identity.primary.tenant_id) failures.push("INVALID_TENANT_REFERENCE");
  if (!graph.replay_reference || graph.nodes.some((node) => !node.replay_reference)) failures.push("REPLAY_METADATA_MISSING");
  for (const node of graph.nodes) failures.push(...node.blocker_reasons);
  if (graph.edges.some((edgeItem) => edgeItem.hidden)) failures.push("HIDDEN_DEPENDENCY_EDGE");
  if (detectCycle(graph)) failures.push("CYCLIC_DEPENDENCY");
  const orders = graph.nodes.map((node) => hierarchy.tasks.find((task) => task.task_id === node.task_id)?.deterministic_order ?? 0);
  if (orders.some((order, index) => order !== index + 1)) failures.push("NONDETERMINISTIC_ORDERING");
  if (graph.critical_path.length > 0 && graph.critical_path.join("|") !== graph.nodes.map((node) => node.task_id).join("|")) failures.push("NONDETERMINISTIC_ORDERING");
  if (graph.critical_path.length === 0) failures.push("CRITICAL_PATH_MISSING");
  if (computeDependencyGraphHash(graph) !== graph.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const uniqueFailures = freezeArray([...new Set(failures)]);
  const has = (reason: DependencyFailureReason) => uniqueFailures.includes(reason);
  const state: DependencyValidationState = has("CYCLIC_DEPENDENCY") || has("MISSING_TASK_ID") || has("DUPLICATE_TASK_ID") || has("INVALID_TENANT_REFERENCE") || has("INTEGRITY_HASH_MISMATCH") ? "FAIL" : uniqueFailures.length ? "CONDITIONAL_PASS" : "PASS";
  const source = { graph: graph.dependency_graph_id, state, uniqueFailures };
  return Object.freeze({
    validation_id: id("DGV", "dependency-validation-id", source),
    dependency_graph_id: graph.dependency_graph_id,
    validation_state: state,
    failures: uniqueFailures,
    graph_complete: graph.nodes.length > 0 && graph.edges.length > 0,
    graph_deterministic: !has("NONDETERMINISTIC_ORDERING"),
    ordering_reproducible: !has("NONDETERMINISTIC_ORDERING"),
    dependencies_classified: ["TASK", "DATA", "AUTHORITY", "GOVERNANCE", "RESOURCE", "TEMPORAL"].every((type) => graph.edges.some((edgeItem) => edgeItem.dependency_type === type)),
    cycle_free: !has("CYCLIC_DEPENDENCY"),
    hidden_edges_absent: !has("HIDDEN_DEPENDENCY_EDGE"),
    blockers_explainable: !has("UNEXPLAINED_BLOCKER"),
    tenant_isolated: !has("INVALID_TENANT_REFERENCE") && !has("CROSS_TENANT_DATA_REFERENCE"),
    governance_enforced: !has("MISSING_POLICY_VALIDATION") && !has("GOVERNANCE_BYPASS_PATH") && !has("HIDDEN_GOVERNANCE_DEPENDENCY"),
    authority_enforced: !has("MISSING_AUTHORITY") && !has("AUTHORITY_MISMATCH") && !has("PRIVILEGE_ESCALATION"),
    replay_complete: !has("REPLAY_METADATA_MISSING"),
    ready_for_optimization: state === "PASS",
    validation_hash: hashValue("dependency-validation", source),
  });
}

export function replayDependencyGraph(graph: DependencyGraphPackage): DependencyReplayResult {
  const failures: DependencyFailureReason[] = [];
  if (computeDependencyGraphHash(graph) !== graph.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!graph.replay_reference) failures.push("REPLAY_METADATA_MISSING");
  if (detectCycle(graph)) failures.push("CYCLIC_DEPENDENCY");
  const source = {
    replay_id: id("DGR", "dependency-replay-id", graph.dependency_graph_id),
    dependency_graph_id: graph.dependency_graph_id,
    reconstructed_ordering: freezeArray(graph.critical_path),
    reconstructed_edges: freezeArray(graph.edges.map((edgeItem) => edgeItem.edge_id)),
    reconstructed_ready_tasks: graph.ready_tasks,
    reconstructed_blocked_tasks: graph.blocked_tasks,
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("dependency-replay", source) });
}

export function buildDependencyVisibilitySurface(identity: AutonomyIdentityRecord, graph: DependencyGraphPackage, hierarchy = decomposeObjective(identity)): DependencyVisibilitySurface {
  const validation = validateDependencyGraph(identity, graph, hierarchy);
  return Object.freeze({
    dependency_graph_id: graph.dependency_graph_id,
    objective_id: graph.objective_id,
    ready_tasks: graph.ready_tasks,
    blocked_tasks: graph.blocked_tasks,
    parallel_groups: graph.parallel_groups,
    critical_path: graph.critical_path,
    dependency_chains: graph.dependency_chains,
    failure_reasons: validation.failures,
    governance_dependency_report: freezeArray(graph.edges.filter((edgeItem) => edgeItem.dependency_type === "GOVERNANCE").map((edgeItem) => edgeItem.required_condition)),
    authority_dependency_report: freezeArray(graph.edges.filter((edgeItem) => edgeItem.dependency_type === "AUTHORITY").map((edgeItem) => edgeItem.required_condition)),
    replay_reference: graph.replay_reference,
    lineage_reference: graph.lineage_reference,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
    hidden_edges_visible: false,
  });
}

export function getDependencyAnalysisFramework(): DependencyAnalysisFramework {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const intake = buildDependencyIntake(identity, hierarchy);
  const graph = analyzeDependencies(identity, hierarchy);
  return Object.freeze({
    identity,
    intake,
    graph,
    validation: validateDependencyGraph(identity, graph, hierarchy),
    replay: replayDependencyGraph(graph),
    visibility: buildDependencyVisibilitySurface(identity, graph, hierarchy),
  });
}
