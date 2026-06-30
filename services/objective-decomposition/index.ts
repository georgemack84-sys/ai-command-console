import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decideConstitutionalRequest } from "@/services/autonomy-constitutional-constraints";
import { buildGovernanceInterfaceTransaction, validateGovernanceInterfaceTransaction } from "@/services/autonomy-governance-interfaces";
import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type {
  InterpretedObjective,
  MissionObjective,
  ObjectiveAtomicTask,
  ObjectiveDecompositionFramework,
  ObjectiveDecompositionReplayResult,
  ObjectiveDecompositionScenario,
  ObjectiveDecompositionVisibilitySurface,
  ObjectiveFailureReason,
  ObjectiveHierarchyPackage,
  ObjectiveMilestone,
  ObjectiveMilestoneType,
  ObjectiveSubObjective,
  ObjectiveValidationState,
  ObjectiveValidationResult,
} from "@/types/objective-decomposition";

const NOW = "2026-06-29T03:00:00.000Z";
const MILESTONES: readonly ObjectiveMilestoneType[] = Object.freeze(["PLANNING_COMPLETE", "VALIDATION_COMPLETE", "PREPARATION_COMPLETE", "EXECUTION_READY", "EXECUTION_COMPLETE", "VERIFICATION_COMPLETE"]);

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

export function buildMissionObjective(identity = generateAutonomyIdentity(), scenario: ObjectiveDecompositionScenario = "BASELINE"): MissionObjective {
  return Object.freeze({
    objective_id: scenario === "DUPLICATE_OBJECTIVE" ? "OBJ-DUPLICATE" : id("OBJ", "objective-id", { autonomy_id: identity.primary.autonomy_id, scenario }),
    mission_id: identity.primary.mission_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_beta" : identity.primary.tenant_id,
    title: scenario === "AMBIGUOUS_OBJECTIVE" ? "Improve things" : "Deploy governed mission update",
    description: scenario === "AMBIGUOUS_OBJECTIVE" ? "" : "Prepare, validate, stage, execute, and verify an approved mission update without bypassing governance.",
    approved: scenario !== "MISSING_APPROVAL",
    approval_reference: scenario === "MISSING_APPROVAL" ? "" : `approval:${identity.primary.autonomy_id}`,
    authority_scope: scenario === "INVALID_AUTHORITY" ? "RECOVER" : identity.primary.authority_scope,
    governance_profile: scenario === "GOVERNANCE_VIOLATION" ? "" : identity.source_contract.governance.governance_profile,
    constitutional_profile: scenario === "CONSTITUTIONAL_VIOLATION" ? "" : identity.source_contract.constitution.constitutional_profile,
    mission_context: "mission-control:controlled-autonomy:phase-8b",
    available_capabilities: freezeArray(["validate-package", "verify-policy", "prepare-rollout", "publish-execution-intent", "record-evidence", "verify-success"]),
    environmental_assumptions: freezeArray(["governance interfaces available", "truth ledger available", "operator approval required"]),
    risk_profile: "MEDIUM",
    created_timestamp: NOW,
  });
}

export function interpretObjective(objective: MissionObjective): InterpretedObjective {
  const normalized = objective.title.trim().toLowerCase().replace(/\s+/g, "-");
  const source = {
    normalized_objective: normalized,
    mission_intent: "deliver approved mission update through governed preparation and verification",
    desired_outcomes: ["validated update package", "policy-compliant rollout", "execution-ready plan", "verified mission outcome"],
    planning_scope: ["validation", "preparation", "execution-intent", "verification"],
    completion_definition: "mission update is verified with evidence, replay, and governance references",
    mission_constraints: ["operator approval required", "governance interfaces required", "no hidden tasks", "tenant isolated"],
    planning_boundaries: ["decomposition only", "no optimization", "no execution"],
  };
  return Object.freeze({ ...source, interpretation_hash: hashValue("objective-interpretation", source) });
}

function subObjective(objective: MissionObjective, title: string, order: number): ObjectiveSubObjective {
  const sub_objective_id = id("SUB", "sub-objective-id", { objective_id: objective.objective_id, title, order });
  return Object.freeze({
    sub_objective_id,
    parent_objective_id: objective.objective_id,
    title,
    completion_criteria: freezeArray([`${title} complete`, "evidence reference recorded", "governance reference retained"]),
    governance_references: freezeArray([objective.governance_profile, objective.constitutional_profile].filter(Boolean)),
    authority_requirement: objective.authority_scope,
    lineage_reference: `lineage:${objective.objective_id}:${sub_objective_id}`,
    deterministic_order: order,
  });
}

function milestone(objective: MissionObjective, sub: ObjectiveSubObjective, type: ObjectiveMilestoneType, order: number): ObjectiveMilestone {
  return Object.freeze({
    milestone_id: id("MS", "objective-milestone-id", { objective_id: objective.objective_id, sub: sub.sub_objective_id, type, order }),
    objective_id: objective.objective_id,
    sub_objective_id: sub.sub_objective_id,
    milestone_type: type,
    title: type.toLowerCase().replace(/_/g, " "),
    completion_criteria: freezeArray([`${type} checkpoint reached`, "checkpoint is replayable"]),
    replay_reference: `replay:${objective.objective_id}:${type}`,
    deterministic_order: order,
  });
}

function task(objective: MissionObjective, sub: ObjectiveSubObjective, ms: ObjectiveMilestone, title: string, action: string, order: number, scenario: ObjectiveDecompositionScenario): ObjectiveAtomicTask {
  const task_id = scenario === "DUPLICATE_TASK" && order > 1 ? "TASK-DUPLICATE" : id("TASK", "objective-task-id", { objective_id: objective.objective_id, sub: sub.sub_objective_id, title, order });
  return Object.freeze({
    task_id,
    parent_objective_id: objective.objective_id,
    parent_sub_objective_id: scenario === "ORPHAN_TASK" && order === 1 ? "missing-parent" : sub.sub_objective_id,
    milestone_id: ms.milestone_id,
    title,
    action,
    required_authority: objective.authority_scope,
    governance_references: freezeArray([objective.governance_profile, objective.constitutional_profile].filter(Boolean)),
    completion_criteria: freezeArray([`${action} completed`, "result evidence captured"]),
    replay_reference: `replay:${task_id}`,
    lineage_reference: `lineage:${sub.sub_objective_id}:${task_id}`,
    explanation: `${title} exists to support ${sub.title} for objective ${objective.objective_id}.`,
    deterministic_order: scenario === "NONDETERMINISTIC_ORDERING" && order === 2 ? 99 : order,
    hidden_subactions: false,
  });
}

function packageHashSource(pkg: Omit<ObjectiveHierarchyPackage, "integrity_hash"> | ObjectiveHierarchyPackage) {
  return {
    objective_id: pkg.objective_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    objective: pkg.objective,
    parent_objective: pkg.parent_objective,
    interpreted_objective: pkg.interpreted_objective,
    sub_objectives: pkg.sub_objectives,
    milestones: pkg.milestones,
    tasks: pkg.tasks,
    authority_requirements: pkg.authority_requirements,
    governance_constraints: pkg.governance_constraints,
    completion_criteria: pkg.completion_criteria,
    planning_state: pkg.planning_state,
    replay_reference: pkg.replay_reference,
    lineage_reference: pkg.lineage_reference,
    created_timestamp: pkg.created_timestamp,
  };
}

export function computeObjectiveHierarchyHash(pkg: Omit<ObjectiveHierarchyPackage, "integrity_hash"> | ObjectiveHierarchyPackage): string {
  return hashValue("objective-hierarchy-package", packageHashSource(pkg));
}

export function decomposeObjective(identity = generateAutonomyIdentity(), scenario: ObjectiveDecompositionScenario = "BASELINE"): ObjectiveHierarchyPackage {
  const objective = buildMissionObjective(identity, scenario);
  const interpreted = interpretObjective(objective);
  const subs = freezeArray([
    subObjective(objective, "Validate package readiness", 1),
    subObjective(objective, "Verify governance and policy compliance", 2),
    subObjective(objective, "Prepare rollout artifacts", 3),
    subObjective(objective, "Publish execution intent", 4),
    subObjective(objective, "Verify completion evidence", 5),
  ]);
  const milestoneSource = scenario === "MISSING_MILESTONE" ? MILESTONES.slice(0, 5) : MILESTONES;
  const milestones = freezeArray(milestoneSource.map((type, index) => milestone(objective, subs[Math.min(index, subs.length - 1)], type, index + 1)));
  const taskTitles = [
    ["Validate package manifest", "validate package manifest"],
    ["Verify policy compliance", "verify active policies"],
    ["Prepare rollback plan", "prepare rollback artifacts"],
    ["Publish execution intent", "publish governed execution intent"],
    ["Record execution evidence", "record evidence"],
    ["Verify success criteria", "verify success"],
  ] as const;
  const tasks = freezeArray(taskTitles.map(([title, action], index) => task(objective, subs[Math.min(index, subs.length - 1)], milestones[Math.min(index, milestones.length - 1)], title, action, index + 1, scenario)));
  const base = {
    objective_id: objective.objective_id,
    mission_id: objective.mission_id,
    tenant_id: objective.tenant_id,
    objective,
    parent_objective: scenario === "CYCLIC_HIERARCHY" ? objective.objective_id : null,
    interpreted_objective: interpreted,
    sub_objectives: subs,
    milestones,
    tasks: scenario === "HIDDEN_TASK" ? freezeArray([...tasks, { ...tasks[0], task_id: id("TASK", "hidden-task", objective.objective_id), title: "Hidden task", explanation: "hidden", deterministic_order: 7 }]) : tasks,
    authority_requirements: freezeArray(uniq(tasks.map((item) => item.required_authority)) as AutonomyAuthorityScope[]),
    governance_constraints: freezeArray(uniq([objective.governance_profile, objective.constitutional_profile, "operator supremacy", "tenant isolation"].filter(Boolean))),
    completion_criteria: freezeArray(["all milestones complete", "all atomic tasks explainable", "replay metadata complete"]),
    planning_state: "READY" as const,
    replay_reference: `replay:${objective.objective_id}`,
    lineage_reference: `lineage:${objective.objective_id}`,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeObjectiveHierarchyHash(base) });
}

export function validateObjectiveHierarchy(identity: AutonomyIdentityRecord, pkg: ObjectiveHierarchyPackage, registry: readonly ObjectiveHierarchyPackage[] = [pkg]): ObjectiveValidationResult {
  const failures: ObjectiveFailureReason[] = [];
  if (!pkg.objective.title || !pkg.objective.description) failures.push("OBJECTIVE_SCHEMA_INVALID");
  if (!pkg.objective.approved || !pkg.objective.approval_reference) failures.push("OBJECTIVE_APPROVAL_MISSING");
  if (registry.filter((item) => item.objective_id === pkg.objective_id).length > 1) failures.push("DUPLICATE_OBJECTIVE");
  if (pkg.objective.authority_scope !== identity.primary.authority_scope) failures.push("INVALID_AUTHORITY");
  if (!pkg.objective.governance_profile) failures.push("GOVERNANCE_VIOLATION");
  if (!pkg.objective.constitutional_profile) failures.push("CONSTITUTIONAL_VIOLATION");
  if (pkg.tenant_id !== identity.primary.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!pkg.objective.mission_context) failures.push("MISSION_CONTEXT_INVALID");
  if (pkg.objective.title.length < 8 || pkg.interpreted_objective.planning_scope.length === 0) failures.push("AMBIGUOUS_OBJECTIVE");
  if (pkg.parent_objective === pkg.objective_id) failures.push("CYCLIC_HIERARCHY");
  const taskIds = pkg.tasks.map((item) => item.task_id);
  if (new Set(taskIds).size !== taskIds.length) failures.push("DUPLICATE_TASK_ID");
  const subIds = new Set(pkg.sub_objectives.map((item) => item.sub_objective_id));
  if (pkg.tasks.some((item) => !subIds.has(item.parent_sub_objective_id))) failures.push("ORPHAN_TASK");
  if (pkg.milestones.length < MILESTONES.length) failures.push("MILESTONE_MISSING");
  const orders = pkg.tasks.map((item) => item.deterministic_order);
  if (orders.some((order, index) => order !== index + 1)) failures.push("NONDETERMINISTIC_ORDERING");
  if (pkg.tasks.some((item) => item.title.toLowerCase().includes("hidden"))) failures.push("HIDDEN_TASK");
  if (pkg.tasks.some((item) => !item.lineage_reference) || !pkg.lineage_reference) failures.push("LINEAGE_INCOMPLETE");
  if (pkg.tasks.some((item) => !item.replay_reference) || !pkg.replay_reference) failures.push("REPLAY_METADATA_MISSING");
  if (computeObjectiveHierarchyHash(pkg) !== pkg.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const constitutional = decideConstitutionalRequest(identity);
  const governanceInterface = buildGovernanceInterfaceTransaction(identity);
  const interfaceValidation = validateGovernanceInterfaceTransaction(identity, governanceInterface);
  if (constitutional.validation.decision !== "APPROVED") failures.push("CONSTITUTIONAL_VIOLATION");
  if (interfaceValidation.decision !== "ACCEPTED") failures.push("GOVERNANCE_VIOLATION");
  const uniqueFailures = freezeArray([...new Set(failures)]);
  const has = (reason: ObjectiveFailureReason) => uniqueFailures.includes(reason);
  const state: ObjectiveValidationState = uniqueFailures.length ? "FAIL" : "PASS";
  const source = { objective_id: pkg.objective_id, state, uniqueFailures };
  return Object.freeze({
    validation_id: id("ODV", "objective-validation-id", source),
    objective_id: pkg.objective_id,
    validation_state: state,
    failures: uniqueFailures,
    schema_valid: !has("OBJECTIVE_SCHEMA_INVALID"),
    approval_valid: !has("OBJECTIVE_APPROVAL_MISSING") && !has("DUPLICATE_OBJECTIVE"),
    authority_valid: !has("INVALID_AUTHORITY"),
    governance_valid: !has("GOVERNANCE_VIOLATION"),
    constitution_valid: !has("CONSTITUTIONAL_VIOLATION"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    hierarchy_valid: !has("CYCLIC_HIERARCHY") && !has("DUPLICATE_TASK_ID") && !has("ORPHAN_TASK") && !has("MILESTONE_MISSING") && !has("HIDDEN_TASK"),
    deterministic: !has("NONDETERMINISTIC_ORDERING"),
    replay_ready: !has("REPLAY_METADATA_MISSING"),
    lineage_complete: !has("LINEAGE_INCOMPLETE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    ready_for_dependency_analysis: state === "PASS",
    validation_hash: hashValue("objective-validation", source),
  });
}

export function replayObjectiveDecomposition(pkg: ObjectiveHierarchyPackage): ObjectiveDecompositionReplayResult {
  const failures: ObjectiveFailureReason[] = [];
  const taskOrders = pkg.tasks.map((item) => item.deterministic_order);
  if (taskOrders.some((order, index) => order !== index + 1)) failures.push("NONDETERMINISTIC_ORDERING");
  if (computeObjectiveHierarchyHash(pkg) !== pkg.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!pkg.replay_reference) failures.push("REPLAY_METADATA_MISSING");
  const source = {
    replay_id: id("ODR", "objective-replay-id", pkg.objective_id),
    objective_id: pkg.objective_id,
    reconstructed_sub_objectives: freezeArray(pkg.sub_objectives.map((item) => item.sub_objective_id)),
    reconstructed_milestones: freezeArray(pkg.milestones.map((item) => item.milestone_id)),
    reconstructed_tasks: freezeArray(pkg.tasks.map((item) => item.task_id)),
    deterministic_order: freezeArray(pkg.tasks.map((item) => item.task_id)),
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("objective-decomposition-replay", source) });
}

export function buildObjectiveVisibilitySurface(identity: AutonomyIdentityRecord, pkg: ObjectiveHierarchyPackage): ObjectiveDecompositionVisibilitySurface {
  const validation = validateObjectiveHierarchy(identity, pkg);
  return Object.freeze({
    objective_id: pkg.objective_id,
    planning_state: validation.validation_state === "PASS" ? "READY" : "REJECTED",
    sub_objective_count: pkg.sub_objectives.length,
    milestone_count: pkg.milestones.length,
    task_count: pkg.tasks.length,
    failure_reasons: validation.failures,
    lineage_reference: pkg.lineage_reference,
    replay_reference: pkg.replay_reference,
    governance_constraints: pkg.governance_constraints,
    authority_requirements: pkg.authority_requirements,
    task_explanations: freezeArray(pkg.tasks.map((item) => item.explanation)),
    integrity_status: validation.integrity_verified ? "VALID" : "INVALID",
    hidden_tasks_visible: false,
  });
}

export function getObjectiveDecompositionFramework(): ObjectiveDecompositionFramework {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  return Object.freeze({
    identity,
    package: hierarchy,
    validation: validateObjectiveHierarchy(identity, hierarchy),
    replay: replayObjectiveDecomposition(hierarchy),
    visibility: buildObjectiveVisibilitySurface(identity, hierarchy),
  });
}
