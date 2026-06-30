import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import { runAutonomySearch } from "@/services/autonomy-search-engine";
import type { AutonomyQueryContract, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  ExecutionLookupRecord,
  ExecutionLookupState,
  ExecutionTimelineEvent,
  FailureInspection,
  PlanExecutionLookupAuditRecord,
  PlanExecutionLookupErrorState,
  PlanExecutionLookupInput,
  PlanExecutionLookupObservabilitySurface,
  PlanExecutionLookupResponse,
  PlanExecutionLookupScenario,
  PlanExecutionLookupState,
  PlanExecutionLookupType,
  PlanLookupRecord,
} from "@/types/plan-execution-lookup";

const NOW = "2026-06-30T18:00:00.000Z";
const SCHEMA_VERSION = "plan-execution-lookup/v8I.3" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function issue(state: PlanExecutionLookupErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<PlanExecutionLookupErrorState, AutonomyQueryErrorState> = {
    CONSTITUTIONAL_REJECTION: "CONSTITUTIONAL_REJECTION",
    EXECUTION_NOT_FOUND: "OBJECT_NOT_FOUND",
    INVALID_EXECUTION_STATE: "VALIDATION_FAILURE",
    INVALID_LOOKUP: "INVALID_QUERY",
    LINEAGE_REFERENCE_INVALID: "LINEAGE_REFERENCE_INVALID",
    MISSION_NOT_FOUND: "MISSION_SCOPE_VIOLATION",
    ORDERING_FAILURE: "ORDERING_FAILURE",
    PLAN_NOT_FOUND: "OBJECT_NOT_FOUND",
    POLICY_REJECTION: "GOVERNANCE_REJECTION",
    REPLAY_REFERENCE_INVALID: "REPLAY_REFERENCE_INVALID",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
    VALIDATION_FAILURE: "VALIDATION_FAILURE",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryForScenario(input: PlanExecutionLookupInput): AutonomyQueryContract {
  if (input.query_contract) return input.query_contract;
  switch (input.scenario) {
    case "EXECUTION_LOOKUP": return buildAutonomyQueryContract({ query_type: "EXECUTION_LOOKUP", query_scope: "EXECUTION", target_reference: input.target_reference ?? "execution:autonomy:8i3:001" });
    case "TIMELINE_LOOKUP": return buildAutonomyQueryContract({ query_type: "HISTORICAL_RECONSTRUCTION", query_scope: "MISSION", target_reference: input.target_reference ?? "mission:autonomy:001" });
    case "FAILURE_INSPECTION": return buildAutonomyQueryContract({ query_type: "EXECUTION_LOOKUP", query_scope: "EXECUTION", target_reference: input.target_reference ?? "execution:autonomy:8i3:failed" });
    case "UNAUTHORIZED": return buildAutonomyQueryContract({ scenario: "UNAUTHORIZED_OPERATOR" });
    case "TENANT_SCOPE_VIOLATION": return buildAutonomyQueryContract({ scenario: "TENANT_SCOPE_VIOLATION" });
    case "MISSION_NOT_FOUND": return buildAutonomyQueryContract({ scenario: "INVALID_MISSION" });
    case "REPLAY_REFERENCE_INVALID": return buildAutonomyQueryContract({ scenario: "REPLAY_REFERENCE_INVALID" });
    case "LINEAGE_REFERENCE_INVALID": return buildAutonomyQueryContract({ scenario: "LINEAGE_REFERENCE_INVALID" });
    case "POLICY_REJECTION": return buildAutonomyQueryContract({ scenario: "GOVERNANCE_REJECTION" });
    case "CONSTITUTIONAL_REJECTION": return buildAutonomyQueryContract({ scenario: "CONSTITUTIONAL_REJECTION" });
    default: return buildAutonomyQueryContract({ query_type: "PLAN_LOOKUP", query_scope: "PLAN", target_reference: input.target_reference ?? "plan:autonomy:8i3:001" });
  }
}

function lookupType(input: PlanExecutionLookupInput): PlanExecutionLookupType {
  if (input.lookup_type) return input.lookup_type;
  if (input.scenario === "EXECUTION_LOOKUP") return "EXECUTION";
  if (input.scenario === "TIMELINE_LOOKUP") return "TIMELINE";
  if (input.scenario === "FAILURE_INSPECTION") return "FAILURE";
  return "PLAN_AND_EXECUTION";
}

function buildPlan(contract: AutonomyQueryContract, scenario?: PlanExecutionLookupScenario): PlanLookupRecord | null {
  if (scenario === "PLAN_NOT_FOUND") return null;
  const source = {
    plan_id: "plan:autonomy:8i3:001",
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    objective_id: "objective:mission:8i3:primary",
    planning_state: "SELECTED" as const,
    original_mission_objective: "Stabilize mission workflow while preserving autonomy boundaries and governance oversight.",
    decomposed_objectives: freezeArray(["validate mission scope", "schedule dependent tasks", "prepare rollback path", "certify governance evidence"]),
    generated_subtasks: freezeArray(["task:scope-validation", "task:dependency-check", "task:checkpoint-capture", "task:governance-review"]),
    dependency_hierarchy: freezeArray([
      { from: "task:scope-validation", to: "task:dependency-check", dependency_type: "PREREQUISITE" },
      { from: "task:dependency-check", to: "task:checkpoint-capture", dependency_type: "ORDERING" },
      { from: "task:checkpoint-capture", to: "task:governance-review", dependency_type: "EVIDENCE" },
    ]),
    planning_assumptions: freezeArray(["tenant boundary remains stable", "replay evidence is available", "operator approval can be requested if confidence degrades"]),
    selected_plan: "sequential-governed-execution",
    planning_rationale: "Selected because dependencies are linear, rollback is available, and governance approval is deterministic.",
    optimization_decisions: freezeArray(["prefer deterministic ordering", "minimize rollback exposure", "preserve checkpoint visibility"]),
    alternative_plans: freezeArray([
      { plan_id: "plan:alternative:parallel", rejection_reason: "Parallel execution introduced ordering ambiguity.", confidence: 0.71, risk: "ORDERING_RISK" },
      { plan_id: "plan:alternative:fast-path", rejection_reason: "Skipped governance checkpoint.", confidence: 0.64, risk: "GOVERNANCE_RISK" },
    ]),
    branch_plans: freezeArray([{ branch_id: "branch:dependency-delay", activation_condition: "dependency readiness drops below threshold", expected_outcome: "pause before execution", replay_reference: contract.replay_reference }]),
    fallback_plans: freezeArray([{ fallback_id: "fallback:checkpoint-restore", activation_trigger: "runtime health degraded", recovery_sequence: freezeArray(["pause", "restore checkpoint", "request operator review"]), confidence: 0.86, governance_approval: "APPROVED" }]),
    contingency_plans: freezeArray([{ scenario: "policy block", actions: freezeArray(["stop scheduling", "notify governance", "retain replay evidence"]), rollback_option: "checkpoint:ready", escalation_path: "governance:operator-review", safe_stop: "freeze-before-dispatch" }]),
    dependency_graph: freezeArray(["scope-validation->dependency-check", "dependency-check->checkpoint-capture", "checkpoint-capture->governance-review"]),
    confidence: Object.freeze({ overall: 0.88, objective_clarity: 0.91, dependency_completeness: 0.87, policy_certainty: 0.9, authority_certainty: 0.86, historical_confidence: 0.84, resource_availability: 0.89 }),
    risk_score: 0.18,
    governance_result: Object.freeze({ constitutional_validation: "PASS", policy_compliance: "PASS", governance_approval: "APPROVED", validation_timestamp: NOW, evidence_references: freezeArray(["evidence:governance:8i3", "evidence:policy:8i3"]) }),
    authority_validation: Object.freeze({ authority_verified: true, authority_reference: "authority:autonomy:8i3", validation_result: "APPROVED" }),
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    integrity_hash: hashValue("plan-lookup-integrity", { tenant: contract.tenant_id, mission: contract.mission_id }),
    created_timestamp: "2026-06-30T17:30:00.000Z",
  };
  return Object.freeze({ ...source, plan_hash: hashValue("plan-lookup-record", source) });
}

function timelineEvent(state: ExecutionLookupState, sequence: number, summary: string, contract: AutonomyQueryContract): ExecutionTimelineEvent {
  const source = {
    event_id: id("ETL", "execution-timeline-event-id", { state, sequence }),
    execution_state: state,
    timestamp: `2026-06-30T17:${(30 + sequence).toString().padStart(2, "0")}:00.000Z`,
    event_sequence: sequence,
    summary,
    checkpoint_reference: sequence === 3 || sequence === 6 ? `checkpoint:8i3:${sequence}` : null,
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:execution:${sequence}`,
    integrity_hash: hashValue("execution-timeline-integrity", { state, sequence }),
  };
  return Object.freeze({ ...source, event_hash: hashValue("execution-timeline-event", source) });
}

function buildTimeline(contract: AutonomyQueryContract, scenario?: PlanExecutionLookupScenario): readonly ExecutionTimelineEvent[] {
  if (scenario === "ORDERING_FAILURE") {
    return freezeArray([
      timelineEvent("RUNNING", 2, "Execution started before readiness event in corrupted ordering scenario.", contract),
      timelineEvent("READY", 1, "Execution became ready.", contract),
    ]);
  }
  const base = [
    timelineEvent("PLANNED", 1, "Plan created and governance evidence attached.", contract),
    timelineEvent("READY", 2, "Dependencies validated and execution became ready.", contract),
    timelineEvent("RUNNING", 3, "Execution started and checkpoint captured.", contract),
    timelineEvent("RUNNING", 4, "Runtime supervision reported healthy progress.", contract),
  ];
  if (scenario === "FAILURE_INSPECTION" || scenario === "INVALID_EXECUTION_STATE") {
    return freezeArray([...base, timelineEvent("FAILED", 5, "Dependency health dropped below safe threshold.", contract), timelineEvent("ROLLED_BACK", 6, "Rollback completed to restored checkpoint.", contract)]);
  }
  return freezeArray([...base, timelineEvent("COMPLETED", 5, "Execution completed with governance verification.", contract)]);
}

function buildExecution(contract: AutonomyQueryContract, plan: PlanLookupRecord | null, scenario?: PlanExecutionLookupScenario): ExecutionLookupRecord | null {
  if (scenario === "EXECUTION_NOT_FOUND") return null;
  const timeline = buildTimeline(contract, scenario);
  const failed = scenario === "FAILURE_INSPECTION" || scenario === "INVALID_EXECUTION_STATE";
  const state: ExecutionLookupState = failed ? "FAILED" : "COMPLETED";
  const source = {
    execution_id: failed ? "execution:autonomy:8i3:failed" : "execution:autonomy:8i3:001",
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    plan_id: plan?.plan_id ?? "plan:autonomy:8i3:001",
    execution_state: state,
    execution_sequence: 8001,
    checkpoint_reference: failed ? "checkpoint:8i3:6" : "checkpoint:8i3:3",
    runtime_health: failed ? "FAILED" as const : "HEALTHY" as const,
    confidence: failed ? 0.42 : 0.89,
    failure_reason: failed ? "dependency readiness regression" : null,
    rollback_status: failed ? "COMPLETED" as const : "NOT_REQUIRED" as const,
    governance_validation: "APPROVED",
    authority_validation: "APPROVED",
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    integrity_hash: hashValue("execution-lookup-integrity", { state, mission: contract.mission_id }),
    execution_timestamp: NOW,
    timeline,
  };
  return Object.freeze({ ...source, execution_hash: hashValue("execution-lookup-record", source) });
}

function buildFailure(execution: ExecutionLookupRecord | null): FailureInspection | null {
  if (!execution?.failure_reason) return null;
  const source = {
    failure_id: id("PFI", "plan-execution-failure-id", execution.execution_id),
    execution_id: execution.execution_id,
    failure_point: "task:dependency-check",
    failure_reason: execution.failure_reason,
    failure_classification: "DEPENDENCY_FAILURE" as const,
    affected_tasks: freezeArray(["task:checkpoint-capture", "task:governance-review"]),
    dependency_impact: freezeArray(["checkpoint delayed", "governance review deferred"]),
    recommended_recovery: "retain rollback checkpoint, verify dependency health, request operator review",
    rollback_readiness: "READY" as const,
    governance_influence: "governance required rollback evidence retention",
    policy_influence: "tenant isolation policy prevented continuation with degraded dependency",
    evidence_references: freezeArray(["evidence:failure:8i3", "evidence:rollback:8i3"]),
  };
  return Object.freeze({ ...source, inspection_hash: hashValue("plan-execution-failure-inspection", source) });
}

function scenarioFailure(scenario?: PlanExecutionLookupScenario): PlanExecutionLookupErrorState | null {
  switch (scenario) {
    case "PLAN_NOT_FOUND": return "PLAN_NOT_FOUND";
    case "EXECUTION_NOT_FOUND": return "EXECUTION_NOT_FOUND";
    case "MISSION_NOT_FOUND": return "MISSION_NOT_FOUND";
    case "UNAUTHORIZED": return "UNAUTHORIZED";
    case "TENANT_SCOPE_VIOLATION": return "TENANT_SCOPE_VIOLATION";
    case "INVALID_EXECUTION_STATE": return "INVALID_EXECUTION_STATE";
    case "REPLAY_REFERENCE_INVALID": return "REPLAY_REFERENCE_INVALID";
    case "LINEAGE_REFERENCE_INVALID": return "LINEAGE_REFERENCE_INVALID";
    case "ORDERING_FAILURE": return "ORDERING_FAILURE";
    case "VALIDATION_FAILURE":
    case "MUTATION_ATTEMPT": return "VALIDATION_FAILURE";
    case "POLICY_REJECTION": return "POLICY_REJECTION";
    case "CONSTITUTIONAL_REJECTION": return "CONSTITUTIONAL_REJECTION";
    default: return null;
  }
}

function failureFromQuery(errors: readonly AutonomyQueryValidationIssue[]): PlanExecutionLookupErrorState | null {
  const states = errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_NOT_FOUND";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "REPLAY_REFERENCE_INVALID";
  if (states.includes("LINEAGE_REFERENCE_INVALID")) return "LINEAGE_REFERENCE_INVALID";
  if (states.includes("GOVERNANCE_REJECTION")) return "POLICY_REJECTION";
  if (states.includes("CONSTITUTIONAL_REJECTION")) return "CONSTITUTIONAL_REJECTION";
  if (states.length) return "INVALID_LOOKUP";
  return null;
}

function resultHash(plan: PlanLookupRecord | null, execution: ExecutionLookupRecord | null, timeline: readonly ExecutionTimelineEvent[], failure: FailureInspection | null): string | null {
  if (!plan && !execution && timeline.length === 0 && !failure) return null;
  return hashValue("plan-execution-lookup-result", {
    plan_hash: plan?.plan_hash ?? null,
    execution_hash: execution?.execution_hash ?? null,
    timeline: timeline.map((event) => event.event_hash),
    failure_hash: failure?.inspection_hash ?? null,
  });
}

function buildAudit(response: Omit<PlanExecutionLookupResponse, "audit_record">, authorization: "APPROVED" | "REJECTED"): PlanExecutionLookupAuditRecord {
  const source = {
    lookup_audit_id: id("PLA", "plan-execution-lookup-audit-id", response.lookup_id),
    lookup_id: response.lookup_id,
    operator_id: response.query_contract.operator_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    lookup_type: response.lookup_type,
    target_reference: response.target_reference,
    returned_record_count: Number(Boolean(response.plan_record)) + Number(Boolean(response.execution_record)) + response.timeline.length + Number(Boolean(response.failure_inspection)),
    authorization_result: authorization,
    result_hash: response.result_hash ?? "",
    replay_reference: response.replay_reference,
    lineage_reference: response.lineage_reference,
    execution_duration: "PT0.000S",
    audit_timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("plan-execution-lookup-audit", source) });
}

export function runPlanExecutionLookup(input: PlanExecutionLookupInput = {}): PlanExecutionLookupResponse {
  const contract = queryForScenario(input);
  const query_validation = validateAutonomyQueryContract(contract);
  const type = lookupType(input);
  const search_response = runAutonomySearch({ query_contract: contract, requested_domains: ["PLANNING", "EXECUTION", "ORCHESTRATION", "SUPERVISION", "INTERVENTION", "REPLAY", "INTEGRITY"], search_terms: ["autonomy"] });
  const queryFailure = failureFromQuery(query_validation.errors);
  const explicitFailure = scenarioFailure(input.scenario);
  const failureState = queryFailure ?? explicitFailure;
  const plan = failureState ? null : type === "EXECUTION" || type === "FAILURE" ? buildPlan(contract, undefined) : buildPlan(contract, input.scenario);
  const execution = failureState && failureState !== "INVALID_EXECUTION_STATE" ? null : type === "PLAN" ? null : buildExecution(contract, plan, input.scenario);
  const timeline = failureState && failureState !== "INVALID_EXECUTION_STATE" ? freezeArray<ExecutionTimelineEvent>([]) : type === "PLAN" ? freezeArray<ExecutionTimelineEvent>([]) : execution?.timeline ?? freezeArray<ExecutionTimelineEvent>([]);
  const failure_inspection = failureState && failureState !== "INVALID_EXECUTION_STATE" ? null : (type === "FAILURE" || input.scenario === "FAILURE_INSPECTION" || input.scenario === "INVALID_EXECUTION_STATE") ? buildFailure(execution) : null;
  const finalFailure = failureState ?? (!plan && (type === "PLAN" || type === "PLAN_AND_EXECUTION") ? "PLAN_NOT_FOUND" : null) ?? (!execution && type !== "PLAN" ? "EXECUTION_NOT_FOUND" : null);
  const lookup_state: PlanExecutionLookupState = finalFailure ?? ((plan || execution || timeline.length) ? "LOOKUP_RETURNED" : "NO_RESULTS");
  const lookup_id = id("PEL", "plan-execution-lookup-id", { query: contract.autonomy_query_id, type, scenario: input.scenario ?? "BASELINE" });
  const failures = freezeArray([
    ...query_validation.errors,
    ...(explicitFailure ? [issue(explicitFailure, "plan_execution_lookup", `${explicitFailure} detected during plan and execution lookup.`)] : []),
  ]);
  const result_hash = finalFailure ? null : resultHash(plan, execution, timeline, failure_inspection);
  const base = {
    phase_version: "8I.3" as const,
    schema_version: SCHEMA_VERSION,
    lookup_id,
    lookup_type: type,
    lookup_state,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    target_reference: contract.target_reference,
    query_contract: contract,
    query_validation,
    search_response,
    plan_record: plan,
    execution_record: execution,
    timeline,
    failure_inspection,
    failures,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    result_hash,
    read_only: true as const,
    advisory_only_notice: "Plan and execution lookup is deterministic, read-only, replayable, and audit-backed." as const,
  };
  const audit_record = buildAudit(base, query_validation.authorization_verified && !finalFailure ? "APPROVED" : "REJECTED");
  return Object.freeze({ ...base, audit_record });
}

export function validatePlanExecutionLookup(input: PlanExecutionLookupInput = {}) {
  const response = runPlanExecutionLookup(input);
  return Object.freeze({
    lookup_id: response.lookup_id,
    valid: response.lookup_state === "LOOKUP_RETURNED" || response.lookup_state === "NO_RESULTS",
    lookup_state: response.lookup_state,
    errors: response.failures,
    replay_compatible: Boolean(response.replay_reference) && response.query_validation.replay_compatible,
    lineage_compatible: Boolean(response.lineage_reference) && response.query_validation.lineage_compatible,
    read_only: response.read_only,
    result_hash: response.result_hash,
  });
}

export function buildPlanExecutionLookupObservabilitySurface(input: PlanExecutionLookupInput = {}): PlanExecutionLookupObservabilitySurface {
  const response = runPlanExecutionLookup(input);
  const errors = response.lookup_state === "LOOKUP_RETURNED" || response.lookup_state === "NO_RESULTS" ? [] : [response.lookup_state as PlanExecutionLookupErrorState];
  return Object.freeze({
    lookup_id: response.lookup_id,
    lookup_type: response.lookup_type,
    lookup_state: response.lookup_state,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    has_plan: Boolean(response.plan_record),
    has_execution: Boolean(response.execution_record),
    timeline_events: response.timeline.length,
    errors: freezeArray(errors),
    result_hash: response.result_hash,
    audit_hash: response.audit_record.audit_hash,
  });
}

export function getPlanExecutionLookupContract() {
  const response = runPlanExecutionLookup();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only", "deterministic", "replayable", "explainable", "immutable", "auditable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "reproducible"]),
      schema_version: SCHEMA_VERSION,
      lookup_types: freezeArray(["PLAN", "EXECUTION", "PLAN_AND_EXECUTION", "TIMELINE", "FAILURE"] as const),
      execution_states: freezeArray(["PLANNED", "READY", "RUNNING", "WAITING", "PAUSED", "COMPLETED", "FAILED", "ROLLED_BACK", "BLOCKED"] as const),
      no_execution_permitted: true,
    }),
    response,
    validation: validatePlanExecutionLookup(),
    observability: buildPlanExecutionLookupObservabilitySurface(),
  });
}
