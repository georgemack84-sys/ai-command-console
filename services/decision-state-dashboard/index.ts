import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionObservabilityContract } from "@/services/decision-observability-contract";
import type {
  ActiveDecisionDashboard,
  BlockedDecisionDashboard,
  DecisionDashboardFailure,
  DecisionDashboardLifecycleState,
  DecisionDashboardMetrics,
  DecisionDeferredState,
  DecisionEscalationState,
  DecisionOrchestrationStage,
  DecisionPriorityBand,
  DecisionStateDashboardFoundation,
  DecisionStateDashboardInput,
  DecisionStateDashboardResult,
  DecisionStateDashboardValidation,
  DecisionStateRecord,
  DeferredDecisionDashboard,
  EscalationDashboard,
  OperatorQueueDashboard,
} from "@/types/decision-state-dashboard";
import type { DecisionObservabilityResult, VisibilityRole } from "@/types/decision-observability-contract";

const DASHBOARD_VERSION = "decision-state-dashboard/v1" as const;
const NOW = "2026-07-05T02:45:00.000Z";

export const DECISION_DASHBOARD_LIFECYCLE_STATES: readonly DecisionDashboardLifecycleState[] = Object.freeze(["REGISTERED", "QUEUED", "ACTIVE", "BLOCKED", "ESCALATED", "DEFERRED", "RESUMED", "COMPLETED", "CANCELLED", "ARCHIVED"]);
export const DECISION_ORCHESTRATION_STAGES: readonly DecisionOrchestrationStage[] = Object.freeze(["INTAKE", "CONTEXT", "GRAPH", "PRIORITY", "ARBITRATION", "GOVERNANCE", "PACKAGE", "OPERATOR_WORKFLOW", "REPLAY_AUDIT", "CERTIFICATION"]);

type Scenario = NonNullable<DecisionStateDashboardInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function ctx(result: DecisionObservabilityResult) {
  const certification = result.certification_result;
  const analytics = certification.analytics_result;
  const ledger = analytics.ledger_result;
  const replay = ledger.integrity_result.audit_result.replay_difference_result.replay_result;
  const contract = result.contract;
  return { certification, analytics, ledger, replay, contract };
}

function record(
  result: DecisionObservabilityResult,
  decisionId: string,
  state: DecisionDashboardLifecycleState,
  stage: DecisionOrchestrationStage,
  priority: DecisionPriorityBand,
  risk: DecisionStateRecord["risk_level"],
  confidence: number,
  governance: DecisionStateRecord["governance_state"],
  authority: DecisionStateRecord["authority_state"],
  escalation: DecisionEscalationState,
  deferred: DecisionDeferredState,
  operator: string,
  blocker: string | null,
  dependencies: readonly string[],
  conflicts: readonly string[],
  recovery: string | null,
  sequence: number,
  scenario: Scenario,
): DecisionStateRecord {
  const c = ctx(result);
  const tenant = scenario === "CROSS_TENANT" && sequence === 1 ? "tenant_other" : c.certification.certification_record.tenant_id;
  const dashboardState = scenario === "STATE_MISMATCH" && decisionId === "decision_blocked_governance" ? "ACTIVE" : state;
  const lifecycle = scenario === "BAD_LIFECYCLE" && decisionId === "decision_active_priority" ? "ARCHIVED" : state;
  const replayRef = scenario === "BAD_REPLAY" && decisionId === "decision_active_priority" ? "replay_mismatch" : result.replay_hash;
  const certificationState = scenario === "MISSING_CERTIFICATION" && decisionId === "decision_active_priority" ? "PENDING" : c.certification.certification_status;
  const governanceState = scenario === "HIDE_GOVERNANCE" && governance === "RESTRICTED" ? "COMPLIANT" : governance;
  const base: Omit<DecisionStateRecord, "integrity_hash"> = {
    state_record_id: `decision_state_${decisionId}`,
    orchestration_id: c.certification.certification_record.orchestration_id,
    decision_id: decisionId,
    tenant_id: tenant,
    mission_id: c.certification.certification_record.mission_id,
    lifecycle_state: lifecycle,
    orchestration_stage: stage,
    dashboard_state: dashboardState,
    priority,
    risk_level: risk,
    confidence_score: confidence,
    governance_state: governanceState,
    constitutional_state: "COMPLIANT",
    authority_state: authority,
    escalation_state: escalation,
    deferred_state: deferred,
    replay_state: replayRef === result.replay_hash ? "VALIDATED" : "FAILED",
    certification_state: certificationState,
    assigned_operator: operator,
    blocker_reason: blocker,
    dependency_chain: freezeArray(dependencies),
    unresolved_conflicts: freezeArray(conflicts),
    recovery_recommendation: recovery,
    created_at: `${NOW}#${String(sequence).padStart(2, "0")}`,
    updated_at: `${NOW}#${String(sequence).padStart(2, "0")}`,
    replay_ref: replayRef,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && sequence === 1) return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.state_record_id }) });
  return built;
}

function buildRegistry(result: DecisionObservabilityResult, scenario: Scenario): readonly DecisionStateRecord[] {
  const records = [
    record(result, "decision_active_priority", "ACTIVE", "PRIORITY", "CRITICAL", "HIGH", 0.94, "COMPLIANT", "AUTHORIZED", "NONE", "NONE", "operator_alpha", null, ["dep_context_ready"], [], null, 1, scenario),
    record(result, "decision_queued_context", "QUEUED", "CONTEXT", "HIGH", "MODERATE", 0.88, "COMPLIANT", "AUTHORIZED", "NONE", "NONE", "operator_beta", null, ["dep_intake_complete"], [], null, 2, scenario),
    record(result, "decision_blocked_governance", "BLOCKED", "GOVERNANCE", "HIGH", "CRITICAL", 0.72, "RESTRICTED", "APPROVAL_REQUIRED", "NONE", "NONE", "operator_governance", "governance approval pending", ["dep_policy_review", "dep_authority_approval"], ["conflict_governance_scope"], "request governance approval package", 3, scenario),
    record(result, "decision_escalated_authority", "ESCALATED", "OPERATOR_WORKFLOW", "CRITICAL", "CRITICAL", 0.69, "REVIEW_REQUIRED", "ESCALATION_REQUIRED", "ACTIVE", "NONE", "operator_lead", "authority escalation active", ["dep_executive_authority"], ["conflict_authority_boundary"], "route to authority escalation queue", 4, scenario),
    record(result, "decision_deferred_evidence", "DEFERRED", "PACKAGE", "MEDIUM", "MODERATE", 0.81, "COMPLIANT", "APPROVAL_REQUIRED", "NONE", "AWAITING_EVIDENCE", "operator_gamma", "awaiting evidence bundle", ["dep_evidence_bundle"], [], "resume when evidence bundle is certified", 5, scenario),
    record(result, "decision_completed_certified", "COMPLETED", "CERTIFICATION", "LOW", "LOW", 0.97, "COMPLIANT", "AUTHORIZED", "RESOLVED", "NONE", "operator_alpha", null, [], [], null, 6, scenario),
    record(result, "decision_cancelled_duplicate", "CANCELLED", "INTAKE", "LOW", "LOW", 0.76, "COMPLIANT", "AUTHORIZED", "NONE", "NONE", "operator_beta", null, [], [], null, 7, scenario),
  ];
  return freezeArray(records);
}

function sortRecords(records: readonly DecisionStateRecord[]): readonly DecisionStateRecord[] {
  const priorityOrder: Record<DecisionPriorityBand, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, DEFERRED: 4 };
  return freezeArray([...records].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.created_at.localeCompare(b.created_at) || a.decision_id.localeCompare(b.decision_id)));
}

function dashboardHash<T extends object>(value: T): string {
  return hashWithoutIntegrity(value);
}

function buildActiveDashboard(records: readonly DecisionStateRecord[], replayRef: string, scenario: Scenario): ActiveDecisionDashboard {
  const source = scenario === "MISSING_ACTIVE" ? [] : records.filter((item) => item.lifecycle_state === "ACTIVE" || item.lifecycle_state === "QUEUED");
  const base: Omit<ActiveDecisionDashboard, "integrity_hash"> = {
    dashboard_id: "decision_state_active_dashboard",
    records: sortRecords(source),
    filters: freezeArray(["mission", "tenant", "operator", "state", "priority", "risk", "confidence", "governance", "replay", "certification"]),
    deterministic_sort: freezeArray(["priority", "created_at", "decision_id"]),
    replay_ref: replayRef,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

function buildBlockedDashboard(records: readonly DecisionStateRecord[], replayRef: string, scenario: Scenario): BlockedDecisionDashboard {
  const source = scenario === "HIDE_BLOCKED" ? [] : records.filter((item) => item.lifecycle_state === "BLOCKED");
  const base: Omit<BlockedDecisionDashboard, "integrity_hash"> = {
    dashboard_id: "decision_state_blocked_dashboard",
    records: sortRecords(source),
    blocker_categories: freezeArray(["dependency blocker", "governance blocker", "constitutional blocker", "authority blocker", "certification blocker", "evidence blocker", "operator blocker", "replay blocker"]),
    pending_approval_count: source.filter((item) => item.authority_state === "APPROVAL_REQUIRED").length,
    pending_evidence_count: source.filter((item) => item.blocker_reason?.includes("evidence")).length,
    replay_ref: replayRef,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

function buildEscalationDashboard(records: readonly DecisionStateRecord[], replayRef: string, scenario: Scenario): EscalationDashboard {
  const active = records.filter((item) => item.escalation_state === "ACTIVE");
  const historical = scenario === "BAD_ESCALATION" ? [] : records.filter((item) => item.escalation_state === "HISTORICAL" || item.escalation_state === "RESOLVED");
  const base: Omit<EscalationDashboard, "integrity_hash"> = {
    dashboard_id: "decision_state_escalation_dashboard",
    active_escalations: sortRecords(active),
    historical_escalations: sortRecords(historical),
    escalation_types: freezeArray(["governance", "constitutional", "authority", "operational", "certification", "mission", "security", "risk"]),
    replay_ref: replayRef,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

function buildDeferredDashboard(records: readonly DecisionStateRecord[], replayRef: string, scenario: Scenario): DeferredDecisionDashboard {
  const source = scenario === "MISSING_DEFERRED" ? [] : records.filter((item) => item.lifecycle_state === "DEFERRED");
  const base: Omit<DeferredDecisionDashboard, "integrity_hash"> = {
    dashboard_id: "decision_state_deferred_dashboard",
    records: sortRecords(source),
    deferred_categories: freezeArray(["AWAITING_EVIDENCE", "AWAITING_APPROVAL", "AWAITING_SIMULATION", "AWAITING_DEPENDENCY", "AWAITING_GOVERNANCE", "OPERATOR_DEFERRED"]),
    expected_review_refs: freezeArray(source.map((item) => `review_${item.decision_id}`)),
    replay_ref: replayRef,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

function buildOperatorQueue(records: readonly DecisionStateRecord[], replayRef: string, scenario: Scenario): OperatorQueueDashboard {
  const assigned = records.filter((item) => item.assigned_operator === "operator_alpha" || item.assigned_operator === "operator_governance" || item.assigned_operator === "operator_lead");
  const approvals = scenario === "INCOMPLETE_OPERATOR_QUEUE" ? [] : records.filter((item) => item.authority_state === "APPROVAL_REQUIRED").map((item) => item.decision_id);
  const pendingEscalations = records.filter((item) => item.escalation_state === "ACTIVE").map((item) => item.decision_id);
  const base: Omit<OperatorQueueDashboard, "integrity_hash"> = {
    dashboard_id: "decision_state_operator_queue_dashboard",
    operator_id: "operator_alpha",
    assigned_decisions: freezeArray(assigned.map((item) => item.decision_id)),
    pending_approvals: freezeArray(approvals),
    pending_overrides: freezeArray(["override_review_decision_escalated_authority"]),
    pending_escalations: freezeArray(pendingEscalations),
    pending_reviews: freezeArray(records.filter((item) => item.governance_state === "REVIEW_REQUIRED").map((item) => item.decision_id)),
    simulation_requests: freezeArray(["simulation_decision_deferred_evidence"]),
    evidence_requests: freezeArray(records.filter((item) => item.deferred_state === "AWAITING_EVIDENCE").map((item) => item.decision_id)),
    governance_requests: freezeArray(records.filter((item) => item.governance_state === "RESTRICTED").map((item) => item.decision_id)),
    queue_size: assigned.length + approvals.length + pendingEscalations.length,
    average_age_minutes: 42,
    highest_priority: "CRITICAL",
    overdue_items: 1,
    completed_today: records.filter((item) => item.lifecycle_state === "COMPLETED").length,
    escalation_rate: 0.14,
    replay_ref: replayRef,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

function buildMetrics(records: readonly DecisionStateRecord[]): DecisionDashboardMetrics {
  const base: Omit<DecisionDashboardMetrics, "integrity_hash"> = {
    active_decisions: records.filter((item) => item.lifecycle_state === "ACTIVE").length,
    queued_decisions: records.filter((item) => item.lifecycle_state === "QUEUED").length,
    blocked_decisions: records.filter((item) => item.lifecycle_state === "BLOCKED").length,
    completed_decisions: records.filter((item) => item.lifecycle_state === "COMPLETED").length,
    deferred_decisions: records.filter((item) => item.lifecycle_state === "DEFERRED").length,
    escalated_decisions: records.filter((item) => item.lifecycle_state === "ESCALATED").length,
    restricted_decisions: records.filter((item) => item.governance_state === "RESTRICTED").length,
    pending_approvals: records.filter((item) => item.authority_state === "APPROVAL_REQUIRED").length,
    governance_reviews: records.filter((item) => item.governance_state === "REVIEW_REQUIRED").length,
    constitutional_violations: records.filter((item) => item.constitutional_state === "VIOLATION").length,
    operator_workload: records.filter((item) => item.lifecycle_state !== "COMPLETED" && item.lifecycle_state !== "CANCELLED" && item.lifecycle_state !== "ARCHIVED").length,
    replay_readiness: records.filter((item) => item.replay_state === "VALIDATED").length,
    replay_failures: records.filter((item) => item.replay_state === "FAILED").length,
    replay_divergence: records.filter((item) => item.replay_state === "DIVERGED").length,
    certification_completion: records.filter((item) => item.certification_state === "PASS").length,
    outstanding_validations: records.filter((item) => item.certification_state !== "PASS").length,
    failed_checks: records.filter((item) => item.certification_state === "FAIL").length,
    readiness_score: 92,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  observability: DecisionObservabilityResult;
  registry: readonly DecisionStateRecord[];
  active: ActiveDecisionDashboard;
  blocked: BlockedDecisionDashboard;
  escalation: EscalationDashboard;
  deferred: DeferredDecisionDashboard;
  operator: OperatorQueueDashboard;
  metrics: DecisionDashboardMetrics;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly DecisionDashboardFailure[] {
  const failures: DecisionDashboardFailure[] = [];
  const tenant = input.observability.certification_result.certification_record.tenant_id;
  if (input.registry.some((item) => item.lifecycle_state === "ACTIVE") && input.active.records.length === 0) failures.push("ACTIVE_DECISIONS_MISSING");
  if (input.registry.some((item) => item.lifecycle_state === "BLOCKED") && input.blocked.records.length === 0) failures.push("BLOCKED_DECISIONS_HIDDEN");
  if (input.registry.some((item) => item.escalation_state === "RESOLVED") && input.escalation.historical_escalations.length === 0) failures.push("ESCALATION_STATUS_INACCURATE");
  if (input.registry.some((item) => item.lifecycle_state === "DEFERRED") && input.deferred.records.length === 0) failures.push("DEFERRED_DECISIONS_UNTRACKED");
  if (input.operator.pending_approvals.length === 0 || input.operator.assigned_decisions.length === 0) failures.push("OPERATOR_QUEUE_INCOMPLETE");
  if (input.registry.some((item) => item.dashboard_state !== item.lifecycle_state)) failures.push("DASHBOARD_STATE_MISMATCH");
  if (input.registry.some((item) => !DECISION_DASHBOARD_LIFECYCLE_STATES.includes(item.lifecycle_state) || item.lifecycle_state === "ARCHIVED" && item.orchestration_stage !== "CERTIFICATION")) failures.push("LIFECYCLE_TRANSITION_INVALID");
  if (input.registry.some((item) => item.blocker_reason?.includes("governance") && item.governance_state !== "RESTRICTED")) failures.push("GOVERNANCE_RESTRICTIONS_OMITTED");
  if (input.registry.some((item) => item.replay_ref !== input.observability.replay_hash || item.replay_state === "FAILED") || input.active.replay_ref !== input.observability.replay_hash) failures.push("REPLAY_STATUS_INCONSISTENT");
  if (input.registry.some((item) => item.certification_state === "PENDING")) failures.push("CERTIFICATION_STATUS_ABSENT");
  if (input.registry.some((item) => item.tenant_id !== tenant)) failures.push("CROSS_TENANT_INFORMATION_VISIBLE");
  if (
    input.registry.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || hashWithoutIntegrity(input.active) !== input.active.integrity_hash
    || hashWithoutIntegrity(input.blocked) !== input.blocked.integrity_hash
    || hashWithoutIntegrity(input.escalation) !== input.escalation.integrity_hash
    || hashWithoutIntegrity(input.deferred) !== input.deferred.integrity_hash
    || hashWithoutIntegrity(input.operator) !== input.operator.integrity_hash
    || hashWithoutIntegrity(input.metrics) !== input.metrics.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("DASHBOARD_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.observability.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly DecisionDashboardFailure[]): DecisionStateDashboardValidation {
  const has = (failure: DecisionDashboardFailure) => failures.includes(failure);
  const base: Omit<DecisionStateDashboardValidation, "integrity_hash"> = {
    validation_id: "decision_state_dashboard_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    active_decisions_visible: !has("ACTIVE_DECISIONS_MISSING"),
    blocked_decisions_visible: !has("BLOCKED_DECISIONS_HIDDEN"),
    escalations_accurate: !has("ESCALATION_STATUS_INACCURATE"),
    deferred_decisions_tracked: !has("DEFERRED_DECISIONS_UNTRACKED"),
    operator_queue_complete: !has("OPERATOR_QUEUE_INCOMPLETE"),
    dashboard_state_synchronized: !has("DASHBOARD_STATE_MISMATCH"),
    lifecycle_transitions_valid: !has("LIFECYCLE_TRANSITION_INVALID"),
    governance_visible: !has("GOVERNANCE_RESTRICTIONS_OMITTED"),
    replay_consistent: !has("REPLAY_STATUS_INCONSISTENT") && !has("DASHBOARD_REPLAY_RECONSTRUCTION_FAILED"),
    certification_visible: !has("CERTIFICATION_STATUS_ABSENT"),
    tenant_isolated: !has("CROSS_TENANT_INFORMATION_VISIBLE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    authorization_valid: !has("AUTHORIZATION_FAILURE") && !has("EXECUTION_AUTHORITY_GRANTED"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DecisionStateDashboardResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    registry: result.registry,
    active: result.active_dashboard,
    blocked: result.blocked_dashboard,
    escalation: result.escalation_dashboard,
    deferred: result.deferred_dashboard,
    operator: result.operator_queue_dashboard,
    metrics: result.metrics,
    validation: result.validation,
  });
}

export function runDecisionStateDashboard(input: DecisionStateDashboardInput = {}): DecisionStateDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const observability_result = input.observability_result ?? runDecisionObservabilityContract();
  const replayRef = scenario === "REPLAY_RECONSTRUCTION_FAILURE" ? "dashboard_replay_mismatch" : observability_result.replay_hash;
  const registry = buildRegistry(observability_result, scenario);
  const active_dashboard = buildActiveDashboard(registry, replayRef, scenario);
  const blocked_dashboard = buildBlockedDashboard(registry, replayRef, scenario);
  const escalation_dashboard = buildEscalationDashboard(registry, replayRef, scenario);
  const deferred_dashboard = buildDeferredDashboard(registry, replayRef, scenario);
  const operator_queue_dashboard = buildOperatorQueue(registry, replayRef, scenario);
  const metrics = buildMetrics(registry);
  const failures = collectFailures({
    observability: observability_result,
    registry,
    active: active_dashboard,
    blocked: blocked_dashboard,
    escalation: escalation_dashboard,
    deferred: deferred_dashboard,
    operator: operator_queue_dashboard,
    metrics,
    role,
    scenario,
  });
  const validation = buildValidation(failures);
  const base: Omit<DecisionStateDashboardResult, "integrity_hash" | "replay_hash"> = {
    dashboard_version: DASHBOARD_VERSION,
    observability_result,
    registry,
    active_dashboard,
    blocked_dashboard,
    escalation_dashboard,
    deferred_dashboard,
    operator_queue_dashboard,
    metrics,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_orchestration: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionStateDashboard(result: DecisionStateDashboardResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeDecisionStateRecordHash(record: Omit<DecisionStateRecord, "integrity_hash"> | DecisionStateRecord): string {
  return hashWithoutIntegrity(record);
}

export function getDecisionStateDashboardFoundation(): DecisionStateDashboardFoundation {
  return Object.freeze({
    dashboard_version: DASHBOARD_VERSION,
    lifecycle_states: DECISION_DASHBOARD_LIFECYCLE_STATES,
    orchestration_stages: DECISION_ORCHESTRATION_STAGES,
    result: runDecisionStateDashboard(),
  });
}

export const DecisionStateDashboard = Object.freeze({
  run: runDecisionStateDashboard,
  replay: replayDecisionStateDashboard,
});
