import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import { runAutonomySearch } from "@/services/autonomy-search-engine";
import type { AutonomyQueryContract, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  CheckpointQueryRecord,
  DelegationLookupRecord,
  DelegationLookupState,
  DelegationOrchestrationLookupAuditRecord,
  DelegationOrchestrationLookupErrorState,
  DelegationOrchestrationLookupInput,
  DelegationOrchestrationLookupObservabilitySurface,
  DelegationOrchestrationLookupResponse,
  DelegationOrchestrationLookupScenario,
  DelegationOrchestrationLookupState,
  DelegationOrchestrationLookupType,
  DelegationTaskType,
  DependencySearchRecord,
  OrchestrationLookupRecord,
  OrchestrationLookupState,
  OrchestrationTimelineEvent,
  RoutingDecisionView,
} from "@/types/delegation-orchestration-lookup";

const NOW = "2026-06-30T19:00:00.000Z";
const SCHEMA_VERSION = "delegation-orchestration-lookup/v8I.4" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function issue(state: DelegationOrchestrationLookupErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<DelegationOrchestrationLookupErrorState, AutonomyQueryErrorState> = {
    CHECKPOINT_NOT_FOUND: "OBJECT_NOT_FOUND",
    CONSTITUTIONAL_REJECTION: "CONSTITUTIONAL_REJECTION",
    DELEGATION_NOT_FOUND: "OBJECT_NOT_FOUND",
    INVALID_AUTHORITY_REFERENCE: "VALIDATION_FAILURE",
    INVALID_CHECKPOINT_REFERENCE: "VALIDATION_FAILURE",
    INVALID_DEPENDENCY_REFERENCE: "VALIDATION_FAILURE",
    INVALID_LOOKUP: "INVALID_QUERY",
    LINEAGE_REFERENCE_INVALID: "LINEAGE_REFERENCE_INVALID",
    MISSION_SCOPE_VIOLATION: "MISSION_SCOPE_VIOLATION",
    ORCHESTRATION_EVENT_NOT_FOUND: "OBJECT_NOT_FOUND",
    ORDERING_FAILURE: "ORDERING_FAILURE",
    POLICY_REJECTION: "GOVERNANCE_REJECTION",
    REPLAY_REFERENCE_INVALID: "REPLAY_REFERENCE_INVALID",
    TASK_NOT_FOUND: "OBJECT_NOT_FOUND",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
    VALIDATION_FAILURE: "VALIDATION_FAILURE",
    WORKFLOW_NOT_FOUND: "OBJECT_NOT_FOUND",
    WORKFLOW_SCOPE_VIOLATION: "MISSION_SCOPE_VIOLATION",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryForScenario(input: DelegationOrchestrationLookupInput): AutonomyQueryContract {
  if (input.query_contract) return input.query_contract;
  switch (input.scenario) {
    case "ORCHESTRATION_LOOKUP":
    case "TIMELINE_RECONSTRUCTION":
      return buildAutonomyQueryContract({ query_type: "HISTORICAL_RECONSTRUCTION", query_scope: "MISSION", target_reference: input.target_reference ?? "workflow:autonomy:8i4:primary" });
    case "UNAUTHORIZED":
      return buildAutonomyQueryContract({ scenario: "UNAUTHORIZED_OPERATOR" });
    case "TENANT_SCOPE_VIOLATION":
      return buildAutonomyQueryContract({ scenario: "TENANT_SCOPE_VIOLATION" });
    case "MISSION_SCOPE_VIOLATION":
      return buildAutonomyQueryContract({ scenario: "INVALID_MISSION" });
    case "REPLAY_REFERENCE_INVALID":
      return buildAutonomyQueryContract({ scenario: "REPLAY_REFERENCE_INVALID" });
    case "LINEAGE_REFERENCE_INVALID":
      return buildAutonomyQueryContract({ scenario: "LINEAGE_REFERENCE_INVALID" });
    case "POLICY_REJECTION":
      return buildAutonomyQueryContract({ scenario: "GOVERNANCE_REJECTION" });
    case "CONSTITUTIONAL_REJECTION":
      return buildAutonomyQueryContract({ scenario: "CONSTITUTIONAL_REJECTION" });
    default:
      return buildAutonomyQueryContract({ query_type: "DELEGATION_LOOKUP", query_scope: "MISSION", target_reference: input.target_reference ?? "delegation:autonomy:8i4:primary" });
  }
}

function lookupType(input: DelegationOrchestrationLookupInput): DelegationOrchestrationLookupType {
  if (input.lookup_type) return input.lookup_type;
  switch (input.scenario) {
    case "DELEGATION_LOOKUP": return "DELEGATION";
    case "ORCHESTRATION_LOOKUP": return "ORCHESTRATION";
    case "ROUTING_VIEW": return "ROUTING";
    case "DEPENDENCY_SEARCH": return "DEPENDENCY";
    case "CHECKPOINT_QUERY": return "CHECKPOINT";
    case "TIMELINE_RECONSTRUCTION": return "TIMELINE";
    default: return "DELEGATION_AND_ORCHESTRATION";
  }
}

function workflowId(input: DelegationOrchestrationLookupInput, contract: AutonomyQueryContract): string {
  return input.workflow_id ?? (contract.target_reference.startsWith("workflow:") ? contract.target_reference : "workflow:autonomy:8i4:primary");
}

function delegationRecord(contract: AutonomyQueryContract, workflow_id: string, task_type: DelegationTaskType, sequence: number): DelegationLookupRecord {
  const task_id = `task:8i4:${task_type.toLowerCase().replace("_", "-")}`;
  const blocked = task_type === "BLOCKED";
  const deferred = task_type === "DEFERRED";
  const state: DelegationLookupState = blocked ? "BLOCKED" : deferred ? "DEFERRED" : task_type === "AGENT" || task_type === "EXTERNAL_SYSTEM" ? "ASSIGNED" : "VALIDATED";
  const assigned_to = task_type === "OPERATOR" ? contract.operator_id : task_type === "AGENT" ? "agent:certified:runtime-supervisor" : task_type === "EXTERNAL_SYSTEM" ? "external:checkpoint-store" : task_type === "DEFERRED" ? "queue:deferred-policy-clearance" : "queue:blocked-authority";
  const source = {
    delegation_id: id("DLG", "delegation-id", { task_id, sequence }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    workflow_id,
    task_id,
    task_type,
    assigned_to,
    assignment_type: task_type === "OPERATOR" ? "OPERATOR" as const : task_type === "AGENT" ? "CERTIFIED_AGENT" as const : task_type === "EXTERNAL_SYSTEM" ? "APPROVED_EXTERNAL_SYSTEM" as const : task_type === "DEFERRED" ? "DEFERRED_QUEUE" as const : "BLOCKED_QUEUE" as const,
    delegation_state: state,
    routing_decision: task_type === "OPERATOR" ? "operator-approval-route" : task_type === "AGENT" ? "certified-agent-route" : task_type === "EXTERNAL_SYSTEM" ? "approved-integration-route" : task_type === "DEFERRED" ? "defer-until-policy-clearance" : "block-authority-failure",
    rejected_routes: freezeArray([
      { route_id: "route:unverified-agent", rejection_reason: "agent certification evidence missing", authority_result: "REJECTED", confidence: 0.42 },
      { route_id: "route:direct-execution", rejection_reason: "read-only lookup cannot execute or unblock tasks", authority_result: "REJECTED", confidence: 0.22 },
    ]),
    authority_validation: Object.freeze({
      operator_authority: task_type === "OPERATOR" ? "REQUIRED_AND_VERIFIED" : "VERIFIED",
      agent_authority: task_type === "AGENT" ? "CERTIFIED" : "NOT_REQUIRED",
      governance_authority: "APPROVED",
      policy_authority: blocked ? "REJECTED" : "APPROVED",
      constitutional_authority: "PASS",
      tenant_scope: "IN_SCOPE",
    }),
    governance_validation: Object.freeze({
      status: blocked ? "REJECTED" as const : "APPROVED" as const,
      governance_reference: "governance:delegation:8i4",
      policy_reference: "policy:delegation-boundary:8i4",
      constitutional_reference: "constitution:autonomy-boundary:8i4",
    }),
    confidence: Object.freeze({
      confidence_level: blocked ? "LOW" as const : deferred ? "MEDIUM" as const : "HIGH" as const,
      confidence_score: blocked ? 0.38 : deferred ? 0.68 : 0.91,
      confidence_factors: freezeArray(["authority evidence", "tenant membership", "governance approval", "replay availability"]),
      risk_score: blocked ? 0.74 : deferred ? 0.35 : 0.13,
      uncertainty_reason: blocked ? "policy rejection prevents safe delegation" : deferred ? "waiting for policy clearance" : null,
    }),
    blocked_reason: blocked ? "POLICY_REJECTION" as const : null,
    deferred_reason: deferred ? "WAITING_FOR_POLICY_CLEARANCE" as const : null,
    lineage_reference: `${contract.lineage_reference}:delegation:${sequence}`,
    replay_reference: contract.replay_reference,
    integrity_hash: hashValue("delegation-integrity", { task_id, state, workflow_id }),
    created_timestamp: `2026-06-30T18:${(10 + sequence).toString().padStart(2, "0")}:00.000Z`,
    autonomy_event_sequence: 8400 + sequence,
  };
  return Object.freeze({ ...source, delegation_hash: hashValue("delegation-lookup-record", source) });
}

function buildDelegations(contract: AutonomyQueryContract, workflow_id: string, scenario?: DelegationOrchestrationLookupScenario): readonly DelegationLookupRecord[] {
  if (scenario === "DELEGATION_NOT_FOUND" || scenario === "TASK_NOT_FOUND") return freezeArray([]);
  return freezeArray([
    delegationRecord(contract, workflow_id, "OPERATOR", 1),
    delegationRecord(contract, workflow_id, "AGENT", 2),
    delegationRecord(contract, workflow_id, "EXTERNAL_SYSTEM", 3),
    delegationRecord(contract, workflow_id, "DEFERRED", 4),
    delegationRecord(contract, workflow_id, "BLOCKED", 5),
  ]);
}

function dependencyRecord(parent: string, child: string, sequence: number, status: DependencySearchRecord["dependency_status"]): DependencySearchRecord {
  const source = {
    dependency_id: id("DEP", "delegation-orchestration-dependency-id", { parent, child, sequence }),
    parent_task_id: parent,
    child_task_id: child,
    dependency_type: sequence === 2 ? "POLICY_CLEARANCE" as const : sequence === 3 ? "CHECKPOINT" as const : "PREREQUISITE" as const,
    dependency_status: status,
    blocking_status: status === "SATISFIED" ? "NOT_BLOCKING" as const : status === "WAITING" ? "BLOCKING_CHILD" as const : "BLOCKING_WORKFLOW" as const,
    critical_path: sequence <= 3,
    integrity_hash: hashValue("dependency-integrity", { parent, child, sequence, status }),
  };
  return Object.freeze({ ...source, dependency_hash: hashValue("dependency-search-record", source) });
}

function buildDependencies(scenario?: DelegationOrchestrationLookupScenario): readonly DependencySearchRecord[] {
  if (scenario === "INVALID_DEPENDENCY_REFERENCE") return freezeArray([]);
  return freezeArray([
    dependencyRecord("task:8i4:operator", "task:8i4:agent", 1, "SATISFIED"),
    dependencyRecord("task:8i4:agent", "task:8i4:external-system", 2, "SATISFIED"),
    dependencyRecord("task:8i4:external-system", "task:8i4:deferred", 3, "WAITING"),
    dependencyRecord("task:8i4:deferred", "task:8i4:blocked", 4, "FAILED"),
  ]);
}

function checkpointRecord(contract: AutonomyQueryContract, workflow_id: string, sequence: number): CheckpointQueryRecord {
  const source = {
    checkpoint_id: `checkpoint:8i4:${sequence}`,
    workflow_id,
    execution_id: "execution:autonomy:8i4:001",
    created_after_task: sequence === 1 ? "task:8i4:agent" : "task:8i4:external-system",
    checkpoint_state: sequence === 1 ? "VERIFIED" as const : "ROLLBACK_ELIGIBLE" as const,
    rollback_eligible: sequence === 2,
    integrity_hash: hashValue("checkpoint-integrity", { workflow_id, sequence }),
    replay_reference: contract.replay_reference,
  };
  return Object.freeze({ ...source, checkpoint_hash: hashValue("checkpoint-query-record", source) });
}

function buildCheckpoints(contract: AutonomyQueryContract, workflow_id: string, scenario?: DelegationOrchestrationLookupScenario): readonly CheckpointQueryRecord[] {
  if (scenario === "CHECKPOINT_NOT_FOUND" || scenario === "INVALID_CHECKPOINT_REFERENCE") return freezeArray([]);
  return freezeArray([checkpointRecord(contract, workflow_id, 1), checkpointRecord(contract, workflow_id, 2)]);
}

function orchestrationRecord(contract: AutonomyQueryContract, workflow_id: string, state: OrchestrationLookupState, sequence: number): OrchestrationLookupRecord {
  const task_id = ["task:8i4:operator", "task:8i4:agent", "task:8i4:external-system", "task:8i4:deferred", "task:8i4:blocked"][sequence - 1] ?? "task:8i4:completion";
  const source = {
    orchestration_event_id: id("ORC", "orchestration-event-id", { workflow_id, state, sequence }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    workflow_id,
    execution_id: "execution:autonomy:8i4:001",
    task_id,
    orchestration_state: state,
    task_sequence: sequence,
    dependency_references: sequence <= 1 ? freezeArray<string>([]) : freezeArray([id("DEP", "delegation-orchestration-dependency-id", { parent: "previous", child: task_id, sequence })]),
    checkpoint_reference: state === "CHECKPOINTED" || state === "ROLLBACK_READY" ? `checkpoint:8i4:${state === "CHECKPOINTED" ? 1 : 2}` : null,
    rollback_reference: state === "ROLLBACK_READY" ? "rollback:8i4:prepared" : null,
    supervision_reference: "supervision:runtime:8e:healthy",
    governance_reference: "governance:orchestration:8i4",
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:orchestration:${sequence}`,
    integrity_hash: hashValue("orchestration-integrity", { workflow_id, state, sequence }),
    event_timestamp: `2026-06-30T18:${(20 + sequence).toString().padStart(2, "0")}:00.000Z`,
    autonomy_event_sequence: 8500 + sequence,
  };
  return Object.freeze({ ...source, orchestration_hash: hashValue("orchestration-lookup-record", source) });
}

function buildOrchestration(contract: AutonomyQueryContract, workflow_id: string, scenario?: DelegationOrchestrationLookupScenario): readonly OrchestrationLookupRecord[] {
  if (scenario === "ORCHESTRATION_EVENT_NOT_FOUND" || scenario === "WORKFLOW_NOT_FOUND" || scenario === "WORKFLOW_SCOPE_VIOLATION") return freezeArray([]);
  if (scenario === "ORDERING_FAILURE") return freezeArray([
    orchestrationRecord(contract, workflow_id, "RUNNING", 3),
    orchestrationRecord(contract, workflow_id, "READY", 2),
  ]);
  return freezeArray([
    orchestrationRecord(contract, workflow_id, "CREATED", 1),
    orchestrationRecord(contract, workflow_id, "READY", 2),
    orchestrationRecord(contract, workflow_id, "SCHEDULED", 3),
    orchestrationRecord(contract, workflow_id, "RUNNING", 4),
    orchestrationRecord(contract, workflow_id, "CHECKPOINTED", 5),
    orchestrationRecord(contract, workflow_id, "WAITING", 6),
    orchestrationRecord(contract, workflow_id, "ROLLBACK_READY", 7),
  ]);
}

function timelineFromOrchestration(records: readonly OrchestrationLookupRecord[]): readonly OrchestrationTimelineEvent[] {
  return freezeArray(records.map((record) => {
    const source = {
      event_id: record.orchestration_event_id,
      state: record.orchestration_state,
      workflow_id: record.workflow_id,
      task_id: record.task_id,
      task_sequence: record.task_sequence,
      event_timestamp: record.event_timestamp,
      summary: `${record.orchestration_state} reached for ${record.task_id}.`,
      replay_reference: record.replay_reference,
      lineage_reference: record.lineage_reference,
      integrity_hash: record.integrity_hash,
    };
    return Object.freeze({ ...source, event_hash: hashValue("orchestration-timeline-event", source) });
  }));
}

function buildRoutingView(delegations: readonly DelegationLookupRecord[]): RoutingDecisionView | null {
  const agent = delegations.find((record) => record.task_type === "AGENT");
  if (!agent) return null;
  const source = {
    routing_view_id: id("RTV", "routing-view-id", agent.delegation_id),
    task_id: agent.task_id,
    selected_route: agent.routing_decision,
    rejected_routes: freezeArray(agent.rejected_routes.map((route) => route.route_id)),
    routing_rationale: "Certified agent route selected because authority, tenant scope, governance, and replay references were verified.",
    fallback_route: "operator-approval-route",
    routing_confidence: agent.confidence.confidence_score,
    authority_validation: agent.authority_validation.agent_authority,
    governance_constraints: freezeArray(["tenant-isolated", "policy-approved", "constitutional-pass", "read-only-lookup"]),
  };
  return Object.freeze({ ...source, routing_hash: hashValue("routing-decision-view", source) });
}

function scenarioFailure(scenario?: DelegationOrchestrationLookupScenario): DelegationOrchestrationLookupErrorState | null {
  switch (scenario) {
    case "DELEGATION_NOT_FOUND": return "DELEGATION_NOT_FOUND";
    case "ORCHESTRATION_EVENT_NOT_FOUND": return "ORCHESTRATION_EVENT_NOT_FOUND";
    case "TASK_NOT_FOUND": return "TASK_NOT_FOUND";
    case "WORKFLOW_NOT_FOUND": return "WORKFLOW_NOT_FOUND";
    case "CHECKPOINT_NOT_FOUND": return "CHECKPOINT_NOT_FOUND";
    case "UNAUTHORIZED": return "UNAUTHORIZED";
    case "TENANT_SCOPE_VIOLATION": return "TENANT_SCOPE_VIOLATION";
    case "MISSION_SCOPE_VIOLATION": return "MISSION_SCOPE_VIOLATION";
    case "WORKFLOW_SCOPE_VIOLATION": return "WORKFLOW_SCOPE_VIOLATION";
    case "INVALID_AUTHORITY_REFERENCE": return "INVALID_AUTHORITY_REFERENCE";
    case "INVALID_DEPENDENCY_REFERENCE": return "INVALID_DEPENDENCY_REFERENCE";
    case "INVALID_CHECKPOINT_REFERENCE": return "INVALID_CHECKPOINT_REFERENCE";
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

function failureFromQuery(errors: readonly AutonomyQueryValidationIssue[]): DelegationOrchestrationLookupErrorState | null {
  const states = errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_SCOPE_VIOLATION";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "REPLAY_REFERENCE_INVALID";
  if (states.includes("LINEAGE_REFERENCE_INVALID")) return "LINEAGE_REFERENCE_INVALID";
  if (states.includes("GOVERNANCE_REJECTION")) return "POLICY_REJECTION";
  if (states.includes("CONSTITUTIONAL_REJECTION")) return "CONSTITUTIONAL_REJECTION";
  if (states.length) return "INVALID_LOOKUP";
  return null;
}

function resultHash(delegations: readonly DelegationLookupRecord[], orchestration: readonly OrchestrationLookupRecord[], routing: RoutingDecisionView | null, dependencies: readonly DependencySearchRecord[], checkpoints: readonly CheckpointQueryRecord[], timeline: readonly OrchestrationTimelineEvent[]): string | null {
  if (!delegations.length && !orchestration.length && !routing && !dependencies.length && !checkpoints.length && !timeline.length) return null;
  return hashValue("delegation-orchestration-lookup-result", {
    delegation_hashes: delegations.map((record) => record.delegation_hash),
    orchestration_hashes: orchestration.map((record) => record.orchestration_hash),
    routing_hash: routing?.routing_hash ?? null,
    dependency_hashes: dependencies.map((record) => record.dependency_hash),
    checkpoint_hashes: checkpoints.map((record) => record.checkpoint_hash),
    timeline_hashes: timeline.map((record) => record.event_hash),
  });
}

function buildAudit(response: Omit<DelegationOrchestrationLookupResponse, "audit_record">, authorization: "APPROVED" | "REJECTED"): DelegationOrchestrationLookupAuditRecord {
  const source = {
    audit_id: id("DOL-AUD", "delegation-orchestration-audit-id", response.lookup_id),
    lookup_id: response.lookup_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    workflow_id: response.workflow_id,
    operator_id: response.query_contract.operator_id,
    lookup_type: response.lookup_type,
    target_reference: response.target_reference,
    authorization_result: authorization,
    returned_record_count: response.delegation_records.length + response.orchestration_records.length + Number(Boolean(response.routing_view)) + response.dependency_records.length + response.checkpoint_records.length + response.timeline.length,
    result_hash: response.result_hash ?? "",
    replay_reference: response.replay_reference,
    lineage_reference: response.lineage_reference,
    audit_timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("delegation-orchestration-lookup-audit", source) });
}

export function runDelegationOrchestrationLookup(input: DelegationOrchestrationLookupInput = {}): DelegationOrchestrationLookupResponse {
  const contract = queryForScenario(input);
  const query_validation = validateAutonomyQueryContract(contract);
  const type = lookupType(input);
  const workflow_id = workflowId(input, contract);
  const search_response = runAutonomySearch({ query_contract: contract, requested_domains: ["DELEGATION", "ORCHESTRATION", "EXECUTION", "SUPERVISION", "GOVERNANCE", "REPLAY", "INTEGRITY"], search_terms: ["delegation", "orchestration", workflow_id] });
  const queryFailure = failureFromQuery(query_validation.errors);
  const explicitFailure = scenarioFailure(input.scenario);
  const failureState = queryFailure ?? explicitFailure;
  const includeDelegation = type === "DELEGATION" || type === "DELEGATION_AND_ORCHESTRATION" || type === "ROUTING";
  const includeOrchestration = type === "ORCHESTRATION" || type === "DELEGATION_AND_ORCHESTRATION" || type === "TIMELINE";
  const includeDependency = type === "DEPENDENCY" || type === "DELEGATION_AND_ORCHESTRATION" || type === "TIMELINE";
  const includeCheckpoint = type === "CHECKPOINT" || type === "DELEGATION_AND_ORCHESTRATION" || type === "TIMELINE";
  const terminalFailure = failureState && failureState !== "ORDERING_FAILURE";
  const delegation_records = terminalFailure ? freezeArray<DelegationLookupRecord>([]) : includeDelegation ? buildDelegations(contract, workflow_id, input.scenario) : freezeArray<DelegationLookupRecord>([]);
  const orchestration_records = terminalFailure ? freezeArray<OrchestrationLookupRecord>([]) : includeOrchestration ? buildOrchestration(contract, workflow_id, input.scenario) : freezeArray<OrchestrationLookupRecord>([]);
  const dependency_records = terminalFailure ? freezeArray<DependencySearchRecord>([]) : includeDependency ? buildDependencies(input.scenario) : freezeArray<DependencySearchRecord>([]);
  const checkpoint_records = terminalFailure ? freezeArray<CheckpointQueryRecord>([]) : includeCheckpoint ? buildCheckpoints(contract, workflow_id, input.scenario) : freezeArray<CheckpointQueryRecord>([]);
  const routing_view = terminalFailure ? null : (type === "ROUTING" || type === "DELEGATION_AND_ORCHESTRATION") ? buildRoutingView(delegation_records) : null;
  const timeline = terminalFailure ? freezeArray<OrchestrationTimelineEvent>([]) : (type === "TIMELINE" || type === "DELEGATION_AND_ORCHESTRATION") ? timelineFromOrchestration(orchestration_records) : freezeArray<OrchestrationTimelineEvent>([]);
  const hasRecords = delegation_records.length || orchestration_records.length || dependency_records.length || checkpoint_records.length || routing_view || timeline.length;
  const finalFailure = failureState ?? (hasRecords ? null : "INVALID_LOOKUP");
  const lookup_state: DelegationOrchestrationLookupState = finalFailure ?? "LOOKUP_RETURNED";
  const lookup_id = id("DOL", "delegation-orchestration-lookup-id", { query: contract.autonomy_query_id, type, workflow_id, scenario: input.scenario ?? "BASELINE" });
  const failures = freezeArray([
    ...query_validation.errors,
    ...(explicitFailure ? [issue(explicitFailure, "delegation_orchestration_lookup", `${explicitFailure} detected during delegation and orchestration lookup.`)] : []),
  ]);
  const result_hash = finalFailure ? null : resultHash(delegation_records, orchestration_records, routing_view, dependency_records, checkpoint_records, timeline);
  const base = {
    phase_version: "8I.4" as const,
    schema_version: SCHEMA_VERSION,
    lookup_id,
    lookup_type: type,
    lookup_state,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    workflow_id,
    target_reference: contract.target_reference,
    query_contract: contract,
    query_validation,
    search_response,
    delegation_records,
    orchestration_records,
    routing_view,
    dependency_records,
    checkpoint_records,
    timeline,
    failures,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    result_hash,
    read_only: true as const,
    advisory_only_notice: "Delegation and orchestration lookup is deterministic, read-only, replayable, and audit-backed." as const,
  };
  const audit_record = buildAudit(base, query_validation.authorization_verified && !finalFailure ? "APPROVED" : "REJECTED");
  return Object.freeze({ ...base, audit_record });
}

export function validateDelegationOrchestrationLookup(input: DelegationOrchestrationLookupInput = {}) {
  const response = runDelegationOrchestrationLookup(input);
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

export function buildDelegationOrchestrationLookupObservabilitySurface(input: DelegationOrchestrationLookupInput = {}): DelegationOrchestrationLookupObservabilitySurface {
  const response = runDelegationOrchestrationLookup(input);
  const errors = response.lookup_state === "LOOKUP_RETURNED" || response.lookup_state === "NO_RESULTS" ? [] : [response.lookup_state as DelegationOrchestrationLookupErrorState];
  return Object.freeze({
    lookup_id: response.lookup_id,
    lookup_type: response.lookup_type,
    lookup_state: response.lookup_state,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    workflow_id: response.workflow_id,
    delegation_records: response.delegation_records.length,
    orchestration_records: response.orchestration_records.length,
    dependencies: response.dependency_records.length,
    checkpoints: response.checkpoint_records.length,
    timeline_events: response.timeline.length,
    errors: freezeArray(errors),
    result_hash: response.result_hash,
    audit_hash: response.audit_record.audit_hash,
  });
}

export function getDelegationOrchestrationLookupContract() {
  const response = runDelegationOrchestrationLookup();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only", "deterministic", "replayable", "lineage-preserving", "integrity-preserving", "auditable", "governance-aware", "tenant-isolated", "operator-visible", "non-mutating"]),
      schema_version: SCHEMA_VERSION,
      lookup_types: freezeArray(["DELEGATION", "ORCHESTRATION", "DELEGATION_AND_ORCHESTRATION", "ROUTING", "DEPENDENCY", "CHECKPOINT", "TIMELINE"] as const),
      delegation_task_types: freezeArray(["OPERATOR", "AGENT", "EXTERNAL_SYSTEM", "DEFERRED", "BLOCKED"] as const),
      orchestration_states: freezeArray(["CREATED", "READY", "SCHEDULED", "RUNNING", "WAITING", "CHECKPOINTED", "PAUSED", "ROLLBACK_READY", "ROLLING_BACK", "COMPLETED", "FAILED", "BLOCKED"] as const),
      deterministic_ordering_keys: freezeArray(["tenant_id", "mission_id", "workflow_id", "timestamp", "autonomy_event_sequence", "record_id"]),
      mutation_permitted: false,
    }),
    response,
    validation: validateDelegationOrchestrationLookup(),
    observability: buildDelegationOrchestrationLookupObservabilitySurface(),
  });
}
