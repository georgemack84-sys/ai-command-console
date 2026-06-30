import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import { buildExecutionMonitor } from "@/services/execution-monitor";
import { buildCheckpointManager, computeCheckpointManagerHash, validateCheckpointManager } from "@/services/checkpoint-manager";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { CertifiedCheckpoint, CheckpointManagerPackage } from "@/types/checkpoint-manager";
import type {
  RecoveryCheckpointSelection,
  RecoveryRecommendation,
  RollbackBoundary,
  RollbackConfidenceReport,
  RollbackDependencyAnalysis,
  RollbackFailureReason,
  RollbackGraph,
  RollbackGraphEdge,
  RollbackGraphNode,
  RollbackLineageRecord,
  RollbackPlan,
  RollbackPreparationFramework,
  RollbackPreparationPackage,
  RollbackPreparationReplayResult,
  RollbackPreparationScenario,
  RollbackPreparationValidationResult,
  RollbackPreparationVisibilitySurface,
  RollbackSequenceStep,
  RollbackGovernanceValidation,
  ReversibilityStatus,
} from "@/types/rollback-preparation";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly RollbackFailureReason[]): readonly RollbackFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultCheckpointManager(identity: AutonomyIdentityRecord) {
  const contract = buildExecutionContract(identity);
  const workflow = activateWorkflow(identity, contract);
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  const monitor = buildExecutionMonitor(identity, schedule);
  return buildCheckpointManager(identity, monitor);
}

function eligibleCheckpoints(manager: CheckpointManagerPackage, scenario: RollbackPreparationScenario): readonly CertifiedCheckpoint[] {
  if (scenario === "NO_ELIGIBLE_CHECKPOINT") return freezeArray([]);
  return freezeArray(manager.checkpoints.filter((checkpoint) => checkpoint.lifecycle_state === "AVAILABLE" && checkpoint.rollback_reference.recovery_eligibility && checkpoint.replay_reference));
}

function selectedCheckpoint(manager: CheckpointManagerPackage, scenario: RollbackPreparationScenario): CertifiedCheckpoint | null {
  const eligible = eligibleCheckpoints(manager, scenario);
  return eligible[eligible.length - 1] ?? null;
}

function buildBoundary(manager: CheckpointManagerPackage, checkpoint: CertifiedCheckpoint | null, scenario: RollbackPreparationScenario): RollbackBoundary {
  return Object.freeze({
    boundary_id: id("RBB", "rollback-boundary-id", { manager: manager.manager_id, checkpoint: checkpoint?.checkpoint_id ?? "none", scenario }),
    checkpoint_id: checkpoint?.checkpoint_id ?? "",
    recovery_boundary: scenario === "BOUNDARY_UNSAFE" ? "" : checkpoint?.rollback_reference.recovery_boundary ?? "",
    rollback_scope: scenario === "BOUNDARY_UNSAFE" ? freezeArray<string>([]) : freezeArray(checkpoint?.rollback_reference.rollback_sequence ?? []),
    synchronization_points: freezeArray(checkpoint?.dependency_state.synchronization_barriers ?? []),
    governance_transition_refs: scenario === "GOVERNANCE_CONFLICT" ? freezeArray<string>([]) : freezeArray(checkpoint ? [checkpoint.governance_snapshot.policy_snapshot_ref] : []),
    operator_intervention_refs: freezeArray(checkpoint?.operator_approvals.completed_approvals ?? []),
    rollback_eligible: Boolean(checkpoint) && scenario !== "BOUNDARY_UNSAFE",
  });
}

function buildSelection(manager: CheckpointManagerPackage, checkpoint: CertifiedCheckpoint | null, scenario: RollbackPreparationScenario): RecoveryCheckpointSelection {
  const eligible = eligibleCheckpoints(manager, scenario);
  const ranking = [...eligible].reverse().map((item) => item.checkpoint_id);
  return Object.freeze({
    selected_checkpoint_id: checkpoint?.checkpoint_id ?? "",
    selected_checkpoint_rank: checkpoint ? 1 : 0,
    alternative_checkpoint_ids: checkpoint ? freezeArray(ranking.filter((idValue) => idValue !== checkpoint.checkpoint_id)) : freezeArray<string>([]),
    checkpoint_ranking: freezeArray(ranking),
    selection_criteria: freezeArray(["checkpoint_integrity", "replay_compatibility", "governance_validity", "authority_continuity", "dependency_consistency", "execution_completeness"]),
    integrity_verified: Boolean(checkpoint) && scenario !== "INTEGRITY_MISMATCH",
    replay_compatible: Boolean(checkpoint) && scenario !== "REPLAY_DIVERGENCE",
    governance_valid: Boolean(checkpoint) && scenario !== "GOVERNANCE_CONFLICT",
    authority_continuous: Boolean(checkpoint) && scenario !== "AUTHORITY_VIOLATION",
    dependency_consistent: Boolean(checkpoint) && scenario !== "DEPENDENCY_NOT_REVERSIBLE",
  });
}

function reversibilityFailures(scenario: RollbackPreparationScenario): readonly RollbackFailureReason[] {
  const map: Partial<Record<RollbackPreparationScenario, RollbackFailureReason>> = {
    IRREVERSIBLE_TASK: "IRREVERSIBLE_TASK",
    DEPENDENCY_NOT_REVERSIBLE: "DEPENDENCY_NOT_REVERSIBLE",
    RESOURCE_RESTORATION_FAILURE: "RESOURCE_RESTORATION_FAILURE",
    WORKFLOW_INCONSISTENT: "WORKFLOW_INCONSISTENT",
    GOVERNANCE_CONFLICT: "GOVERNANCE_CONFLICT",
    AUTHORITY_VIOLATION: "AUTHORITY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function buildReversibility(scenario: RollbackPreparationScenario, checkpoint: CertifiedCheckpoint | null): ReversibilityStatus {
  const reasons = checkpoint ? reversibilityFailures(scenario) : freezeArray<RollbackFailureReason>(["NO_ELIGIBLE_CHECKPOINT"]);
  return Object.freeze({
    reversible: reasons.length === 0,
    task_reversibility: scenario !== "IRREVERSIBLE_TASK" && Boolean(checkpoint),
    dependency_reversibility: scenario !== "DEPENDENCY_NOT_REVERSIBLE" && Boolean(checkpoint),
    resource_restoration: scenario !== "RESOURCE_RESTORATION_FAILURE" && Boolean(checkpoint),
    workflow_consistency: scenario !== "WORKFLOW_INCONSISTENT" && Boolean(checkpoint),
    governance_continuity: scenario !== "GOVERNANCE_CONFLICT" && Boolean(checkpoint),
    authority_validity: scenario !== "AUTHORITY_VIOLATION" && Boolean(checkpoint),
    rejection_reasons: reasons,
  });
}

function buildDependencyAnalysis(checkpoint: CertifiedCheckpoint | null, scenario: RollbackPreparationScenario): RollbackDependencyAnalysis {
  return Object.freeze({
    dependency_graph_ref: checkpoint?.dependency_state.dependency_graph_ref ?? "",
    impacted_dependencies: freezeArray([...(checkpoint?.dependency_state.satisfied_dependencies ?? []), ...(checkpoint?.dependency_state.pending_dependencies ?? [])]),
    restoration_dependencies: scenario === "DEPENDENCY_NOT_REVERSIBLE" ? freezeArray<string>([]) : freezeArray(checkpoint?.dependency_state.satisfied_dependencies ?? []),
    blocked_dependencies: scenario === "DEPENDENCY_NOT_REVERSIBLE" ? freezeArray([...(checkpoint?.dependency_state.blocked_dependencies ?? []), "dependency:rollback-blocked"]) : freezeArray(checkpoint?.dependency_state.blocked_dependencies ?? []),
    synchronization_boundaries: freezeArray(checkpoint?.dependency_state.synchronization_barriers ?? []),
    dependency_impact: scenario === "DEPENDENCY_NOT_REVERSIBLE" ? "CRITICAL" as const : checkpoint && checkpoint.dependency_state.pending_dependencies.length ? "MEDIUM" as const : "LOW" as const,
  });
}

function graphHashSource(graph: Omit<RollbackGraph, "integrity_hash"> | RollbackGraph) {
  return {
    graph_id: graph.graph_id,
    nodes: graph.nodes,
    edges: graph.edges,
    checkpoint_transitions: graph.checkpoint_transitions,
    governance_checkpoints: graph.governance_checkpoints,
    deterministic: graph.deterministic,
    replay_reference: graph.replay_reference,
  };
}

function buildGraph(planId: string, checkpoint: CertifiedCheckpoint | null, dependency: RollbackDependencyAnalysis, scenario: RollbackPreparationScenario): RollbackGraph {
  const nodeTypes: readonly RollbackGraphNode["node_type"][] = ["ROLLBACK_START", "CHECKPOINT", "DEPENDENCY_RESTORE", "GOVERNANCE_VALIDATION", "AUTHORITY_VALIDATION", "OPERATOR_APPROVAL", "ROLLBACK_READY"];
  const nodes = nodeTypes.map((nodeType, index): RollbackGraphNode => Object.freeze({
    node_id: id("RBN", "rollback-graph-node-id", { planId, nodeType, index }),
    node_type: nodeType,
    reference: nodeType === "CHECKPOINT" ? checkpoint?.checkpoint_id ?? "" : nodeType === "DEPENDENCY_RESTORE" ? dependency.dependency_graph_ref : `${planId}:${nodeType}`,
  }));
  const edges = nodes.slice(0, -1).map((node, index): RollbackGraphEdge => Object.freeze({
    edge_id: id("RBE", "rollback-graph-edge-id", { planId, from: node.node_id, to: nodes[index + 1].node_id }),
    from_node_id: node.node_id,
    to_node_id: nodes[index + 1].node_id,
    relationship: index === 1 ? "RESTORES" as const : index >= 2 ? "VALIDATES" as const : "PRECEDES" as const,
  }));
  const base = {
    graph_id: id("RBG", "rollback-graph-id", { planId, scenario }),
    nodes: scenario === "REPLAY_DIVERGENCE" ? freezeArray(nodes.map((node) => Object.freeze({ ...node, reference: node.node_type === "CHECKPOINT" ? "" : node.reference }))) : freezeArray(nodes),
    edges: freezeArray(edges),
    checkpoint_transitions: checkpoint ? freezeArray([checkpoint.checkpoint_id]) : freezeArray<string>([]),
    governance_checkpoints: scenario === "GOVERNANCE_CONFLICT" ? freezeArray<string>([]) : freezeArray(checkpoint ? [checkpoint.governance_snapshot.policy_snapshot_ref] : []),
    deterministic: true as const,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : checkpoint?.replay_reference ?? "",
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("rollback-preparation-graph", graphHashSource(base)) });
}

function buildSequence(planId: string, checkpoint: CertifiedCheckpoint | null, dependency: RollbackDependencyAnalysis, scenario: RollbackPreparationScenario): readonly RollbackSequenceStep[] {
  const stages: readonly RollbackSequenceStep["stage"][] = ["ANALYZE", "SELECT_CHECKPOINT", "RESTORE_DEPENDENCIES", "VALIDATE_GOVERNANCE", "VALIDATE_AUTHORITY", "REQUEST_APPROVAL", "PUBLISH_PLAN"];
  return freezeArray(stages.map((stage, index): RollbackSequenceStep => Object.freeze({
    step_id: id("RBS", "rollback-sequence-step-id", { planId, stage }),
    step_order: index + 1,
    stage,
    action: `${stage}:prepare-only`,
    checkpoint_reference: stage === "SELECT_CHECKPOINT" ? checkpoint?.checkpoint_id ?? null : null,
    dependency_reference: stage === "RESTORE_DEPENDENCIES" ? dependency.dependency_graph_ref : null,
    governance_gate: stage === "VALIDATE_GOVERNANCE" ? checkpoint?.governance_snapshot.policy_snapshot_ref ?? null : null,
    operator_approval_required: stage === "REQUEST_APPROVAL",
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : checkpoint?.replay_reference ?? "",
  })));
}

function governanceValidation(checkpoint: CertifiedCheckpoint | null, scenario: RollbackPreparationScenario): RollbackGovernanceValidation {
  return Object.freeze({
    constitutional_compliant: scenario !== "GOVERNANCE_CONFLICT" && Boolean(checkpoint?.governance_snapshot.constitutional_validation),
    governance_policy_compliant: scenario !== "GOVERNANCE_CONFLICT" && Boolean(checkpoint?.governance_snapshot.compliance_status),
    authority_scope_valid: scenario !== "AUTHORITY_VIOLATION" && Boolean(checkpoint?.authority_snapshot.authority_scope),
    operator_approval_required: true,
    operator_approval_present: scenario !== "OPERATOR_APPROVAL_MISSING",
    execution_constraints_preserved: scenario !== "WORKFLOW_INCONSISTENT" && Boolean(checkpoint),
    validation_refs: scenario === "GOVERNANCE_CONFLICT" ? freezeArray<string>([]) : freezeArray([checkpoint?.governance_snapshot.policy_snapshot_ref ?? "", checkpoint?.authority_snapshot.authorization_refs[0] ?? ""].filter(Boolean)),
  });
}

function confidenceFor(selection: RecoveryCheckpointSelection, reversibility: ReversibilityStatus, governance: RollbackGovernanceValidation, dependency: RollbackDependencyAnalysis, scenario: RollbackPreparationScenario): RollbackConfidenceReport {
  const risks: RollbackFailureReason[] = [];
  if (!selection.integrity_verified) risks.push("INTEGRITY_HASH_MISMATCH");
  if (!selection.replay_compatible) risks.push("REPLAY_DIVERGENCE");
  if (!selection.governance_valid || !governance.governance_policy_compliant) risks.push("GOVERNANCE_CONFLICT");
  if (!selection.authority_continuous || !governance.authority_scope_valid) risks.push("AUTHORITY_VIOLATION");
  if (!reversibility.reversible) risks.push(...reversibility.rejection_reasons);
  if (dependency.dependency_impact === "CRITICAL") risks.push("DEPENDENCY_NOT_REVERSIBLE");
  if (scenario === "CONDITIONAL_LOW_CONFIDENCE") risks.push("LOW_CONFIDENCE");
  const score = scenario === "CONDITIONAL_LOW_CONFIDENCE" ? 68 : risks.length === 0 ? 94 : Math.max(10, 84 - risks.length * 14);
  const level = score >= 90 ? "VERY_HIGH" as const : score >= 75 ? "HIGH" as const : score >= 55 ? "MEDIUM" as const : score >= 35 ? "LOW" as const : "INSUFFICIENT" as const;
  return Object.freeze({
    confidence_score: score,
    confidence_level: level,
    confidence_factors: freezeArray(["checkpoint_integrity", "workflow_consistency", "dependency_completeness", "governance_stability", "authority_continuity", "replay_fidelity", "resource_availability", "historical_recovery_success"]),
    identified_risks: uniqueFailures(risks),
    uncertainty_analysis: scenario === "CONDITIONAL_LOW_CONFIDENCE" ? freezeArray(["Historical recovery evidence is limited for this boundary."]) : freezeArray([]),
    recovery_probability: score / 100,
  });
}

function recommendations(planId: string, confidence: RollbackConfidenceReport, scenario: RollbackPreparationScenario): readonly RecoveryRecommendation[] {
  const types = confidence.identified_risks.length
    ? freezeArray(["GOVERNANCE_REVIEW", "OPERATOR_INTERVENTION", "DEPENDENCY_REVALIDATION", "EXECUTION_PAUSE"] as const)
    : freezeArray(["ROLLBACK_TO_CHECKPOINT", "OPERATOR_INTERVENTION", "GOVERNANCE_REVIEW"] as const);
  return freezeArray(types.map((recommendationType, index): RecoveryRecommendation => Object.freeze({
    recommendation_id: id("RBR", "rollback-recommendation-id", { planId, recommendationType, index }),
    recommendation_type: recommendationType,
    rationale: `${recommendationType} prepared for governed operator review.`,
    operator_action_required: true,
    governance_review_required: recommendationType === "GOVERNANCE_REVIEW" || scenario === "GOVERNANCE_CONFLICT",
    dependency_correction_required: recommendationType === "DEPENDENCY_REVALIDATION",
    resource_recommendation: null,
    advisory_only: true,
    replay_reference: `${planId}:recommendation:${index + 1}`,
  })));
}

function lineageHashSource(lineage: Omit<RollbackLineageRecord, "integrity_hash"> | RollbackLineageRecord) {
  return {
    lineage_id: lineage.lineage_id,
    rollback_request_ref: lineage.rollback_request_ref,
    analysis_refs: lineage.analysis_refs,
    selected_checkpoint_refs: lineage.selected_checkpoint_refs,
    boundary_decision_refs: lineage.boundary_decision_refs,
    confidence_refs: lineage.confidence_refs,
    governance_validation_refs: lineage.governance_validation_refs,
    recommendation_refs: lineage.recommendation_refs,
    replay_refs: lineage.replay_refs,
  };
}

function buildLineage(planId: string, selection: RecoveryCheckpointSelection, boundary: RollbackBoundary, governance: RollbackGovernanceValidation, recs: readonly RecoveryRecommendation[], scenario: RollbackPreparationScenario): RollbackLineageRecord {
  const base = {
    lineage_id: scenario === "LINEAGE_BROKEN" ? "" : id("RBL", "rollback-lineage-id", { planId, scenario }),
    rollback_request_ref: `rollback-request:${planId}`,
    analysis_refs: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray([`analysis:${planId}`]),
    selected_checkpoint_refs: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray(selection.selected_checkpoint_id ? [selection.selected_checkpoint_id] : []),
    boundary_decision_refs: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray(boundary.boundary_id ? [boundary.boundary_id] : []),
    confidence_refs: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray([`confidence:${planId}`]),
    governance_validation_refs: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : governance.validation_refs,
    recommendation_refs: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray(recs.map((rec) => rec.recommendation_id)),
    replay_refs: scenario === "LINEAGE_BROKEN" || scenario === "REPLAY_DIVERGENCE" ? freezeArray<string>([]) : freezeArray(recs.map((rec) => rec.replay_reference)),
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("rollback-preparation-lineage", lineageHashSource(base)) });
}

function planHashSource(plan: Omit<RollbackPlan, "integrity_hash"> | RollbackPlan) {
  return {
    rollback_plan_id: plan.rollback_plan_id,
    execution_id: plan.execution_id,
    workflow_id: plan.workflow_id,
    tenant_id: plan.tenant_id,
    rollback_state: plan.rollback_state,
    rollback_boundary: plan.rollback_boundary,
    selected_checkpoint: plan.selected_checkpoint,
    alternative_checkpoints: plan.alternative_checkpoints,
    rollback_graph: plan.rollback_graph,
    rollback_sequence: plan.rollback_sequence,
    reversibility_status: plan.reversibility_status,
    dependency_analysis: plan.dependency_analysis,
    governance_validation: plan.governance_validation,
    authority_validation: plan.authority_validation,
    rollback_confidence: plan.rollback_confidence,
    recovery_recommendations: plan.recovery_recommendations,
    estimated_recovery_time_ms: plan.estimated_recovery_time_ms,
    lineage_reference: plan.lineage_reference,
    replay_reference: plan.replay_reference,
    advisory_only: plan.advisory_only,
    rollback_executed: plan.rollback_executed,
    workflow_modified: plan.workflow_modified,
    authority_escalated: plan.authority_escalated,
    governance_bypassed: plan.governance_bypassed,
    timestamp: plan.timestamp,
  };
}

export function computeRollbackPlanHash(plan: Omit<RollbackPlan, "integrity_hash"> | RollbackPlan): string {
  return hashValue("rollback-preparation-plan", planHashSource(plan));
}

function buildPlan(manager: CheckpointManagerPackage, scenario: RollbackPreparationScenario): RollbackPlan {
  const checkpoint = selectedCheckpoint(manager, scenario);
  const planId = id("RBP", "rollback-plan-id", { manager: manager.manager_id, scenario });
  const boundary = buildBoundary(manager, checkpoint, scenario);
  const selection = buildSelection(manager, checkpoint, scenario);
  const reversibility = buildReversibility(scenario, checkpoint);
  const dependency = buildDependencyAnalysis(checkpoint, scenario);
  const governance = governanceValidation(checkpoint, scenario);
  const confidence = confidenceFor(selection, reversibility, governance, dependency, scenario);
  const graph = buildGraph(planId, checkpoint, dependency, scenario);
  const sequence = buildSequence(planId, checkpoint, dependency, scenario);
  const recs = recommendations(planId, confidence, scenario);
  const lineage = buildLineage(planId, selection, boundary, governance, recs, scenario);
  const rollbackState = !checkpoint ? "BLOCKED" as const : reversibility.reversible && governance.governance_policy_compliant && governance.authority_scope_valid ? "READY_FOR_APPROVAL" as const : "NOT_REVERSIBLE" as const;
  const base = {
    rollback_plan_id: planId,
    execution_id: manager.execution_id,
    workflow_id: manager.workflow_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : manager.tenant_id,
    rollback_state: rollbackState,
    rollback_boundary: boundary,
    selected_checkpoint: selection,
    alternative_checkpoints: selection.alternative_checkpoint_ids,
    rollback_graph: graph,
    rollback_sequence: sequence,
    reversibility_status: reversibility,
    dependency_analysis: dependency,
    governance_validation: governance,
    authority_validation: governance,
    rollback_confidence: confidence,
    recovery_recommendations: recs,
    estimated_recovery_time_ms: 45000 + sequence.length * 1000,
    lineage_reference: lineage,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : `${manager.registry.replay_refs[0] ?? manager.manager_id}:rollback-plan`,
    advisory_only: true as const,
    rollback_executed: scenario === "AUTONOMOUS_RECOVERY_ATTEMPT" ? true as false : false as const,
    workflow_modified: false as const,
    authority_escalated: false as const,
    governance_bypassed: false as const,
    timestamp: `rollback-time:${manager.execution_id}:${scenario}`,
  };
  const plan = Object.freeze({ ...base, integrity_hash: computeRollbackPlanHash(base) });
  if (scenario !== "INTEGRITY_MISMATCH") return plan;
  return Object.freeze({ ...plan, integrity_hash: "tampered" });
}

function packageHashSource(preparation: Omit<RollbackPreparationPackage, "integrity_hash"> | RollbackPreparationPackage) {
  return {
    preparation_id: preparation.preparation_id,
    execution_id: preparation.execution_id,
    workflow_id: preparation.workflow_id,
    tenant_id: preparation.tenant_id,
    rollback_state: preparation.rollback_state,
    plans: preparation.plans.map((plan) => ({ id: plan.rollback_plan_id, hash: plan.integrity_hash })),
    source_checkpoint_manager_hash: preparation.source_checkpoint_manager.integrity_hash,
    advisory_only: preparation.advisory_only,
    rollback_executed: preparation.rollback_executed,
    execution_restarted: preparation.execution_restarted,
    workflow_modified: preparation.workflow_modified,
    authority_escalated: preparation.authority_escalated,
    governance_bypassed: preparation.governance_bypassed,
  };
}

export function computeRollbackPreparationHash(preparation: Omit<RollbackPreparationPackage, "integrity_hash"> | RollbackPreparationPackage): string {
  return hashValue("rollback-preparation-package", packageHashSource(preparation));
}

export function buildRollbackPreparation(identity = generateAutonomyIdentity(), checkpointManager?: CheckpointManagerPackage, scenario: RollbackPreparationScenario = "BASELINE"): RollbackPreparationPackage {
  const sourceManager = checkpointManager ?? defaultCheckpointManager(identity);
  const effectiveManager = scenario === "INVALID_CHECKPOINT_MANAGER" ? Object.freeze({ ...sourceManager, integrity_hash: "invalid" }) : sourceManager;
  const plan = buildPlan(effectiveManager, scenario);
  const base = {
    preparation_id: id("RBPkg", "rollback-preparation-id", { manager: effectiveManager.manager_id, scenario }),
    execution_id: effectiveManager.execution_id,
    workflow_id: effectiveManager.workflow_id,
    tenant_id: effectiveManager.tenant_id,
    rollback_state: plan.rollback_state,
    plans: freezeArray([plan]),
    source_checkpoint_manager: effectiveManager,
    advisory_only: true as const,
    rollback_executed: scenario === "AUTONOMOUS_RECOVERY_ATTEMPT" ? true as false : false as const,
    execution_restarted: false as const,
    workflow_modified: false as const,
    authority_escalated: false as const,
    governance_bypassed: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: computeRollbackPreparationHash(base) });
}

function failuresForPlan(plan: RollbackPlan, preparation: RollbackPreparationPackage): RollbackFailureReason[] {
  const failures: RollbackFailureReason[] = [];
  if (plan.tenant_id !== preparation.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!plan.rollback_boundary.rollback_eligible || !plan.rollback_boundary.recovery_boundary) failures.push("ROLLBACK_BOUNDARY_UNSAFE");
  if (!plan.selected_checkpoint.selected_checkpoint_id || !plan.selected_checkpoint.integrity_verified) failures.push("NO_ELIGIBLE_CHECKPOINT");
  if (!plan.selected_checkpoint.replay_compatible || !plan.replay_reference || plan.rollback_sequence.some((step) => !step.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (!plan.selected_checkpoint.governance_valid || !plan.governance_validation.constitutional_compliant || !plan.governance_validation.governance_policy_compliant) failures.push("GOVERNANCE_CONFLICT");
  if (!plan.selected_checkpoint.authority_continuous || !plan.authority_validation.authority_scope_valid) failures.push("AUTHORITY_VIOLATION");
  if (plan.governance_validation.operator_approval_required && !plan.governance_validation.operator_approval_present) failures.push("OPERATOR_APPROVAL_REQUIRED");
  failures.push(...plan.reversibility_status.rejection_reasons);
  if (!plan.reversibility_status.task_reversibility) failures.push("IRREVERSIBLE_TASK");
  if (!plan.reversibility_status.dependency_reversibility || plan.dependency_analysis.dependency_impact === "CRITICAL") failures.push("DEPENDENCY_NOT_REVERSIBLE");
  if (!plan.reversibility_status.resource_restoration) failures.push("RESOURCE_RESTORATION_FAILURE");
  if (!plan.reversibility_status.workflow_consistency) failures.push("WORKFLOW_INCONSISTENT");
  if (!plan.lineage_reference.lineage_id || plan.lineage_reference.replay_refs.length === 0 || plan.lineage_reference.recommendation_refs.length === 0) failures.push("LINEAGE_BROKEN");
  if (!plan.advisory_only || plan.rollback_executed || plan.workflow_modified || plan.authority_escalated || plan.governance_bypassed) failures.push("AUTONOMOUS_RECOVERY_ATTEMPT");
  if (plan.rollback_confidence.confidence_level === "LOW" || plan.rollback_confidence.confidence_level === "INSUFFICIENT" || plan.rollback_confidence.identified_risks.includes("LOW_CONFIDENCE")) failures.push("LOW_CONFIDENCE");
  if (hashValue("rollback-preparation-graph", graphHashSource(plan.rollback_graph)) !== plan.rollback_graph.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (hashValue("rollback-preparation-lineage", lineageHashSource(plan.lineage_reference)) !== plan.lineage_reference.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeRollbackPlanHash(plan) !== plan.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

function failuresForPreparation(preparation: RollbackPreparationPackage): RollbackFailureReason[] {
  const failures: RollbackFailureReason[] = [];
  if (validateCheckpointManager(preparation.source_checkpoint_manager).certification_state === "FAIL") failures.push("INVALID_CHECKPOINT_MANAGER");
  if (computeCheckpointManagerHash(preparation.source_checkpoint_manager) !== preparation.source_checkpoint_manager.integrity_hash) failures.push("INVALID_CHECKPOINT_MANAGER");
  preparation.plans.forEach((plan) => failures.push(...failuresForPlan(plan, preparation)));
  if (!preparation.advisory_only || preparation.rollback_executed || preparation.execution_restarted || preparation.workflow_modified || preparation.authority_escalated || preparation.governance_bypassed) failures.push("AUTONOMOUS_RECOVERY_ATTEMPT");
  if (computeRollbackPreparationHash(preparation) !== preparation.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

export function validateRollbackPreparation(preparation: RollbackPreparationPackage): RollbackPreparationValidationResult {
  const failures = uniqueFailures(failuresForPreparation(preparation));
  const warnings = failures.includes("LOW_CONFIDENCE") ? freezeArray<RollbackFailureReason>(["LOW_CONFIDENCE"]) : freezeArray<RollbackFailureReason>([]);
  const hardFailures = failures.filter((failure) => failure !== "LOW_CONFIDENCE");
  const certification = hardFailures.length ? "FAIL" as const : warnings.length ? "CONDITIONAL_PASS" as const : "PASS" as const;
  const has = (reason: RollbackFailureReason) => failures.includes(reason);
  const source = { preparation: preparation.preparation_id, certification, failures, warnings };
  return Object.freeze({
    validation_id: id("RBV", "rollback-validation-id", source),
    preparation_id: preparation.preparation_id,
    certification_state: certification,
    failures,
    warnings,
    rollback_boundary_safe: !has("ROLLBACK_BOUNDARY_UNSAFE") && !has("NO_ELIGIBLE_CHECKPOINT"),
    recovery_checkpoint_certified: !has("INVALID_CHECKPOINT_MANAGER") && !has("NO_ELIGIBLE_CHECKPOINT"),
    reversibility_valid: !has("IRREVERSIBLE_TASK") && !has("DEPENDENCY_NOT_REVERSIBLE") && !has("RESOURCE_RESTORATION_FAILURE") && !has("WORKFLOW_INCONSISTENT"),
    dependency_impact_valid: !has("DEPENDENCY_NOT_REVERSIBLE"),
    governance_ready: !has("GOVERNANCE_CONFLICT") && !has("OPERATOR_APPROVAL_REQUIRED"),
    authority_ready: !has("AUTHORITY_VIOLATION") && !has("TENANT_ISOLATION_VIOLATION"),
    replay_compatible: !has("REPLAY_DIVERGENCE"),
    lineage_complete: !has("LINEAGE_BROKEN"),
    advisory_only_enforced: !has("AUTONOMOUS_RECOVERY_ATTEMPT"),
    ready_for_orchestration_certification: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("rollback-preparation-validation", source),
  });
}

export function replayRollbackPreparation(preparation: RollbackPreparationPackage): RollbackPreparationReplayResult {
  const validation = validateRollbackPreparation(preparation);
  const plan = preparation.plans[0];
  const source = {
    replay_id: id("RBRP", "rollback-replay-id", preparation.preparation_id),
    preparation_id: preparation.preparation_id,
    replay_plan_order: freezeArray(preparation.plans.map((item) => item.rollback_plan_id)),
    replay_checkpoint_order: freezeArray(preparation.plans.map((item) => item.selected_checkpoint.selected_checkpoint_id).filter(Boolean)),
    replay_recommendation_order: freezeArray(plan?.recovery_recommendations.map((item) => item.recommendation_type) ?? []),
    validation_state: validation.certification_state,
    failure_reason: validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("rollback-preparation-replay", source) });
}

export function buildRollbackPreparationVisibilitySurface(preparation: RollbackPreparationPackage): RollbackPreparationVisibilitySurface {
  const validation = validateRollbackPreparation(preparation);
  const plan = preparation.plans[0];
  return Object.freeze({
    preparation_id: preparation.preparation_id,
    execution_id: preparation.execution_id,
    workflow_id: preparation.workflow_id,
    rollback_state: preparation.rollback_state,
    plan_count: preparation.plans.length,
    selected_checkpoint_ids: freezeArray(preparation.plans.map((item) => item.selected_checkpoint.selected_checkpoint_id).filter(Boolean)),
    confidence_level: plan?.rollback_confidence.confidence_level ?? "INSUFFICIENT",
    recommendation_types: freezeArray(plan?.recovery_recommendations.map((item) => item.recommendation_type) ?? []),
    failure_reasons: validation.failures,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
    rollback_enabled: false,
  });
}

export function getRollbackPreparationFramework(): RollbackPreparationFramework {
  const identity = generateAutonomyIdentity();
  const checkpointManager = defaultCheckpointManager(identity);
  const preparation = buildRollbackPreparation(identity, checkpointManager);
  return Object.freeze({
    identity,
    checkpoint_validation: validateCheckpointManager(checkpointManager),
    preparation,
    validation: validateRollbackPreparation(preparation),
    replay: replayRollbackPreparation(preparation),
    visibility: buildRollbackPreparationVisibilitySurface(preparation),
  });
}
