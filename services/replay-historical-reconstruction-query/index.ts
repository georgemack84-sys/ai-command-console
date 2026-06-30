import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import { runAutonomySearch } from "@/services/autonomy-search-engine";
import { runDelegationOrchestrationLookup } from "@/services/delegation-orchestration-lookup";
import { runPlanExecutionLookup } from "@/services/plan-execution-lookup";
import { runSupervisionInterventionBoundaryLookup } from "@/services/supervision-intervention-boundary-lookup";
import type { AutonomyQueryContract, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  HistoricalEventCategory,
  HistoricalReconstructionRecord,
  MismatchHistoricalRecord,
  MissingHistoricalRecord,
  ReconstructedHistoricalEvent,
  ReplayHistoricalReconstructionAuditRecord,
  ReplayHistoricalReconstructionErrorState,
  ReplayHistoricalReconstructionInput,
  ReplayHistoricalReconstructionObservabilitySurface,
  ReplayHistoricalReconstructionQueryType,
  ReplayHistoricalReconstructionResponse,
  ReplayHistoricalReconstructionScenario,
  ReplayHistoricalReconstructionState,
  ReplayLookupStatus,
  ReplayResultView,
} from "@/types/replay-historical-reconstruction-query";

const NOW = "2026-06-30T21:00:00.000Z";
const SCHEMA_VERSION = "replay-historical-reconstruction-query/v8I.6" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function issue(state: ReplayHistoricalReconstructionErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<ReplayHistoricalReconstructionErrorState, AutonomyQueryErrorState> = {
    HASH_MISMATCH: "VALIDATION_FAILURE",
    INTEGRITY_REFERENCE_INVALID: "VALIDATION_FAILURE",
    INVALID_RECONSTRUCTION_REQUEST: "INVALID_QUERY",
    LINEAGE_REFERENCE_INVALID: "LINEAGE_REFERENCE_INVALID",
    MISSING_HISTORICAL_RECORD: "OBJECT_NOT_FOUND",
    MISSION_NOT_FOUND: "MISSION_SCOPE_VIOLATION",
    ORDERING_FAILURE: "ORDERING_FAILURE",
    RECONSTRUCTION_NOT_FOUND: "OBJECT_NOT_FOUND",
    REPLAY_MISMATCH: "REPLAY_REFERENCE_INVALID",
    REPLAY_RECORD_NOT_FOUND: "OBJECT_NOT_FOUND",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
    VALIDATION_FAILURE: "VALIDATION_FAILURE",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryForScenario(input: ReplayHistoricalReconstructionInput): AutonomyQueryContract {
  if (input.query_contract) return input.query_contract;
  switch (input.scenario) {
    case "REPLAY_QUERY":
    case "REPLAY_RESULT_VIEW":
      return buildAutonomyQueryContract({ query_type: "REPLAY_LOOKUP", query_scope: "REPLAY", target_reference: input.target_reference ?? "replay:autonomy:8i6:primary" });
    case "UNAUTHORIZED":
      return buildAutonomyQueryContract({ scenario: "UNAUTHORIZED_OPERATOR" });
    case "TENANT_SCOPE_VIOLATION":
      return buildAutonomyQueryContract({ scenario: "TENANT_SCOPE_VIOLATION" });
    case "MISSION_NOT_FOUND":
      return buildAutonomyQueryContract({ scenario: "INVALID_MISSION" });
    case "LINEAGE_REFERENCE_INVALID":
      return buildAutonomyQueryContract({ scenario: "LINEAGE_REFERENCE_INVALID" });
    case "REPLAY_MISMATCH":
    case "REPLAY_RECORD_NOT_FOUND":
      return buildAutonomyQueryContract({ query_type: "REPLAY_LOOKUP", query_scope: "REPLAY", target_reference: input.target_reference ?? "replay:autonomy:8i6:mismatch" });
    default:
      return buildAutonomyQueryContract({ query_type: "HISTORICAL_RECONSTRUCTION", query_scope: "MISSION", target_reference: input.target_reference ?? "mission:autonomy:8i6:history" });
  }
}

function lookupType(input: ReplayHistoricalReconstructionInput): ReplayHistoricalReconstructionQueryType {
  if (input.lookup_type) return input.lookup_type;
  switch (input.scenario) {
    case "REPLAY_QUERY": return "REPLAY_QUERY";
    case "TIMELINE_RECONSTRUCTION": return "TIMELINE_RECONSTRUCTION";
    case "MISSING_RECORD_DETECTION": return "MISSING_RECORD_DETECTION";
    case "MISMATCH_INSPECTION": return "MISMATCH_INSPECTION";
    case "REPLAY_RESULT_VIEW": return "REPLAY_RESULT_VIEW";
    default: return "HISTORICAL_RECONSTRUCTION";
  }
}

function timestampFor(category: HistoricalEventCategory, sequence: number): string {
  const minute = 5 + sequence;
  return `2026-06-30T20:${minute.toString().padStart(2, "0")}:00.000Z`;
}

function event(contract: AutonomyQueryContract, category: HistoricalEventCategory, source_record_type: string, source_record_id: string, sequence: number, integrity_hash: string, input_references: readonly string[] = []): ReconstructedHistoricalEvent {
  const source = {
    event_id: id("HRE", "historical-reconstruction-event-id", { category, source_record_id, sequence }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    category,
    source_record_type,
    source_record_id,
    previous_event_id: null,
    next_event_id: null,
    original_timestamp: timestampFor(category, sequence),
    autonomy_event_sequence: 8900 + sequence,
    input_references: freezeArray(input_references),
    policy_references: freezeArray(["policy:controlled-autonomy:8i6"]),
    governance_reference: "governance:historical-reconstruction:8i6",
    constitutional_reference: "constitution:controlled-autonomy:8i6",
    authority_reference: "authority:read-only-reconstruction:8i6",
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:historical:${sequence}`,
    execution_hash: category === "EXECUTION" || category === "OUTCOME" ? integrity_hash : null,
    replay_hash: hashValue("historical-replay-hash", { source_record_id, sequence, replay: contract.replay_reference }),
    integrity_hash,
  };
  return Object.freeze({ ...source, event_hash: hashValue("historical-reconstruction-event", source) });
}

function linkEvents(events: readonly ReconstructedHistoricalEvent[]): readonly ReconstructedHistoricalEvent[] {
  return freezeArray(events.map((record, index) => Object.freeze({
    ...record,
    previous_event_id: events[index - 1]?.event_id ?? null,
    next_event_id: events[index + 1]?.event_id ?? null,
    event_hash: hashValue("historical-reconstruction-event-linked", {
      ...record,
      previous_event_id: events[index - 1]?.event_id ?? null,
      next_event_id: events[index + 1]?.event_id ?? null,
    }),
  })));
}

function buildEvents(contract: AutonomyQueryContract, scenario?: ReplayHistoricalReconstructionScenario): readonly ReconstructedHistoricalEvent[] {
  if (scenario === "RECONSTRUCTION_NOT_FOUND") return freezeArray([]);
  const plan = runPlanExecutionLookup({ query_contract: contract });
  const delegation = runDelegationOrchestrationLookup({ query_contract: contract });
  const supervision = runSupervisionInterventionBoundaryLookup({ query_contract: contract });
  const events = [
    event(contract, "MISSION_OBJECTIVE", "MISSION", contract.mission_id, 1, hashValue("mission-objective-integrity", contract.mission_id), ["objective:mission:8i6"]),
    event(contract, "PLANNING", "PLAN", plan.plan_record?.plan_id ?? "plan:missing", 2, plan.plan_record?.integrity_hash ?? hashValue("missing-plan", contract.mission_id), ["objective:mission:8i6"]),
    event(contract, "DECISION", "PLANNING_DECISION", plan.plan_record?.selected_plan ?? "decision:missing", 3, plan.plan_record?.plan_hash ?? hashValue("missing-decision", contract.mission_id), [plan.plan_record?.plan_id ?? "plan:missing"]),
    event(contract, "DELEGATION", "DELEGATION", delegation.delegation_records[1]?.delegation_id ?? "delegation:missing", 4, delegation.delegation_records[1]?.integrity_hash ?? hashValue("missing-delegation", contract.mission_id), [plan.plan_record?.plan_id ?? "plan:missing"]),
    event(contract, "ORCHESTRATION", "ORCHESTRATION", delegation.orchestration_records[4]?.orchestration_event_id ?? "orchestration:missing", 5, delegation.orchestration_records[4]?.integrity_hash ?? hashValue("missing-orchestration", contract.mission_id), [delegation.delegation_records[1]?.task_id ?? "task:missing"]),
    event(contract, "EXECUTION", "EXECUTION", plan.execution_record?.execution_id ?? "execution:missing", 6, plan.execution_record?.integrity_hash ?? hashValue("missing-execution", contract.mission_id), [delegation.orchestration_records[4]?.orchestration_event_id ?? "orchestration:missing"]),
    event(contract, "SUPERVISION", "SUPERVISION", supervision.supervision_records[0]?.supervision_event_id ?? "supervision:missing", 7, supervision.supervision_records[0]?.integrity_hash ?? hashValue("missing-supervision", contract.mission_id), [plan.execution_record?.execution_id ?? "execution:missing"]),
    event(contract, "INTERVENTION", "INTERVENTION", supervision.intervention_records[0]?.intervention_id ?? "intervention:missing", 8, supervision.intervention_records[0]?.integrity_hash ?? hashValue("missing-intervention", contract.mission_id), [supervision.supervision_records[0]?.supervision_event_id ?? "supervision:missing"]),
    event(contract, "OUTCOME", "EXECUTION_OUTCOME", plan.execution_record?.execution_state ?? "outcome:missing", 9, plan.execution_record?.execution_hash ?? hashValue("missing-outcome", contract.mission_id), [plan.execution_record?.execution_id ?? "execution:missing"]),
    event(contract, "REPLAY", "REPLAY_RESULT", contract.replay_reference, 10, hashValue("replay-result-integrity", contract.replay_reference), [contract.replay_reference]),
    event(contract, "INTEGRITY_VERIFICATION", "INTEGRITY_LEDGER", "integrity:autonomy:8i6:verified", 11, hashValue("integrity-ledger-verification", contract.lineage_reference), [contract.lineage_reference]),
  ];
  if (scenario === "ORDERING_FAILURE") return freezeArray([events[1], events[0]]);
  return linkEvents(events);
}

function missingRecord(contract: AutonomyQueryContract, type: MissingHistoricalRecord["missing_record_type"], sequence: number): MissingHistoricalRecord {
  const source = {
    missing_record_id: id("MISS", "missing-historical-record-id", { type, sequence }),
    missing_record_type: type,
    expected_reference: `${type.toLowerCase()}:autonomy:8i6:expected`,
    detection_reason: `${type} historical evidence was required but absent; reconstruction did not infer or synthesize it.`,
    reconstruction_blocking: type === "REPLAY" || type === "INTEGRITY" || type === "LINEAGE",
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:missing:${sequence}`,
  };
  return Object.freeze({ ...source, missing_hash: hashValue("missing-historical-record", source) });
}

function buildMissing(contract: AutonomyQueryContract, scenario?: ReplayHistoricalReconstructionScenario): readonly MissingHistoricalRecord[] {
  if (scenario !== "MISSING_RECORD_DETECTION" && scenario !== "MISSING_HISTORICAL_RECORD" && scenario !== "REPLAY_RECORD_NOT_FOUND") return freezeArray([]);
  return freezeArray([
    missingRecord(contract, "REPLAY", 1),
    missingRecord(contract, "INTEGRITY", 2),
    missingRecord(contract, "CHECKPOINT", 3),
  ]);
}

function mismatchRecord(contract: AutonomyQueryContract, type: MismatchHistoricalRecord["mismatch_type"], affected_event_id: string, sequence: number): MismatchHistoricalRecord {
  const source = {
    mismatch_id: id("MM", "mismatch-historical-record-id", { type, affected_event_id, sequence }),
    mismatch_type: type,
    expected_reference: `${type.toLowerCase()}:expected:8i6`,
    observed_reference: `${type.toLowerCase()}:observed:8i6`,
    detection_reason: `${type} evidence diverged from certified historical record.`,
    affected_event_id,
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:mismatch:${sequence}`,
  };
  return Object.freeze({ ...source, mismatch_hash: hashValue("mismatch-historical-record", source) });
}

function buildMismatches(contract: AutonomyQueryContract, events: readonly ReconstructedHistoricalEvent[], scenario?: ReplayHistoricalReconstructionScenario): readonly MismatchHistoricalRecord[] {
  if (scenario !== "MISMATCH_INSPECTION" && scenario !== "REPLAY_MISMATCH" && scenario !== "HASH_MISMATCH" && scenario !== "INTEGRITY_REFERENCE_INVALID") return freezeArray([]);
  const execution = events.find((record) => record.category === "EXECUTION") ?? events[0];
  const replay = events.find((record) => record.category === "REPLAY") ?? events[0];
  const mismatchType: MismatchHistoricalRecord["mismatch_type"] = scenario === "HASH_MISMATCH" ? "HASH" : scenario === "INTEGRITY_REFERENCE_INVALID" ? "INTEGRITY" : "REPLAY";
  return freezeArray([
    mismatchRecord(contract, mismatchType, execution?.event_id ?? "event:missing", 1),
    mismatchRecord(contract, "LINEAGE", replay?.event_id ?? "event:missing", 2),
  ]);
}

function replayStatus(scenario: ReplayHistoricalReconstructionScenario | undefined, missing: readonly MissingHistoricalRecord[], mismatches: readonly MismatchHistoricalRecord[]): ReplayLookupStatus {
  if (scenario === "INTEGRITY_REFERENCE_INVALID" || scenario === "HASH_MISMATCH") return "INVALID";
  if (mismatches.length || scenario === "REPLAY_MISMATCH") return "MISMATCH";
  if (missing.length || scenario === "MISSING_HISTORICAL_RECORD" || scenario === "REPLAY_RECORD_NOT_FOUND") return "INCOMPLETE";
  return "REPRODUCED";
}

function buildReconstruction(contract: AutonomyQueryContract, type: ReplayHistoricalReconstructionQueryType, scenario?: ReplayHistoricalReconstructionScenario): HistoricalReconstructionRecord | null {
  const events = buildEvents(contract, scenario);
  if (!events.length && scenario === "RECONSTRUCTION_NOT_FOUND") return null;
  const missing = buildMissing(contract, scenario);
  const mismatches = buildMismatches(contract, events, scenario);
  const status = replayStatus(scenario, missing, mismatches);
  const source = {
    reconstruction_id: id("HRC", "historical-reconstruction-id", { query: contract.autonomy_query_id, type, scenario: scenario ?? "BASELINE" }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    reconstruction_scope: type,
    replay_status: status,
    reconstructed_events: events,
    missing_events: missing,
    mismatch_events: mismatches,
    timeline_reference: id("TL", "historical-timeline-reference", events.map((record) => record.event_hash)),
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    integrity_hash: hashValue("historical-reconstruction-integrity", { events: events.map((record) => record.event_hash), missing: missing.map((record) => record.missing_hash), mismatches: mismatches.map((record) => record.mismatch_hash) }),
    governance_reference: "governance:historical-reconstruction:8i6",
    reconstruction_timestamp: NOW,
  };
  return Object.freeze({ ...source, reconstruction_hash: hashValue("historical-reconstruction-record", source) });
}

function buildReplayResult(contract: AutonomyQueryContract, reconstruction: HistoricalReconstructionRecord | null): ReplayResultView | null {
  if (!reconstruction) return null;
  const source = {
    replay_query_id: id("RQR", "replay-result-query-id", reconstruction.reconstruction_id),
    replay_status: reconstruction.replay_status,
    reconstructed_event_count: reconstruction.reconstructed_events.length,
    missing_record_count: reconstruction.missing_events.length,
    mismatch_count: reconstruction.mismatch_events.length,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    integrity_hash: reconstruction.integrity_hash,
    verification_timestamp: NOW,
  };
  return Object.freeze({ ...source, replay_result_hash: hashValue("replay-result-view", source) });
}

function scenarioFailure(scenario?: ReplayHistoricalReconstructionScenario): ReplayHistoricalReconstructionErrorState | null {
  switch (scenario) {
    case "RECONSTRUCTION_NOT_FOUND": return "RECONSTRUCTION_NOT_FOUND";
    case "MISSION_NOT_FOUND": return "MISSION_NOT_FOUND";
    case "REPLAY_RECORD_NOT_FOUND": return "REPLAY_RECORD_NOT_FOUND";
    case "LINEAGE_REFERENCE_INVALID": return "LINEAGE_REFERENCE_INVALID";
    case "INTEGRITY_REFERENCE_INVALID": return "INTEGRITY_REFERENCE_INVALID";
    case "MISSING_HISTORICAL_RECORD": return "MISSING_HISTORICAL_RECORD";
    case "REPLAY_MISMATCH": return "REPLAY_MISMATCH";
    case "ORDERING_FAILURE": return "ORDERING_FAILURE";
    case "HASH_MISMATCH": return "HASH_MISMATCH";
    case "UNAUTHORIZED": return "UNAUTHORIZED";
    case "TENANT_SCOPE_VIOLATION": return "TENANT_SCOPE_VIOLATION";
    case "VALIDATION_FAILURE":
    case "MUTATION_ATTEMPT": return "VALIDATION_FAILURE";
    default: return null;
  }
}

function failureFromQuery(errors: readonly AutonomyQueryValidationIssue[]): ReplayHistoricalReconstructionErrorState | null {
  const states = errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_NOT_FOUND";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "REPLAY_MISMATCH";
  if (states.includes("LINEAGE_REFERENCE_INVALID")) return "LINEAGE_REFERENCE_INVALID";
  if (states.includes("ORDERING_FAILURE")) return "ORDERING_FAILURE";
  if (states.length) return "INVALID_RECONSTRUCTION_REQUEST";
  return null;
}

function resultHash(reconstruction: HistoricalReconstructionRecord | null, replay: ReplayResultView | null): string | null {
  if (!reconstruction && !replay) return null;
  return hashValue("replay-historical-reconstruction-result", {
    reconstruction_hash: reconstruction?.reconstruction_hash ?? null,
    replay_result_hash: replay?.replay_result_hash ?? null,
  });
}

function buildAudit(response: Omit<ReplayHistoricalReconstructionResponse, "audit_record">, authorization: "APPROVED" | "REJECTED"): ReplayHistoricalReconstructionAuditRecord {
  const source = {
    audit_id: id("HRA", "historical-reconstruction-audit-id", response.lookup_id),
    reconstruction_id: response.reconstruction_record?.reconstruction_id ?? response.lookup_id,
    operator_id: response.query_contract.operator_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    replay_status: response.reconstruction_record?.replay_status ?? "INVALID" as ReplayLookupStatus,
    reconstructed_event_count: response.reconstruction_record?.reconstructed_events.length ?? 0,
    missing_record_count: response.reconstruction_record?.missing_events.length ?? 0,
    mismatch_count: response.reconstruction_record?.mismatch_events.length ?? 0,
    authorization_result: authorization,
    result_hash: response.result_hash ?? "",
    replay_reference: response.replay_reference,
    lineage_reference: response.lineage_reference,
    audit_timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("historical-reconstruction-audit", source) });
}

export function runReplayHistoricalReconstructionQuery(input: ReplayHistoricalReconstructionInput = {}): ReplayHistoricalReconstructionResponse {
  const contract = queryForScenario(input);
  const query_validation = validateAutonomyQueryContract(contract);
  const type = lookupType(input);
  const search_response = runAutonomySearch({ query_contract: contract, requested_domains: ["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "INTERVENTION", "GOVERNANCE", "REPLAY", "INTEGRITY"], search_terms: ["replay", "historical", "reconstruction"] });
  const explicitFailure = scenarioFailure(input.scenario);
  const queryFailure = failureFromQuery(query_validation.errors);
  const failureState = explicitFailure ?? queryFailure;
  const terminalFailure = failureState && !["MISSING_HISTORICAL_RECORD", "REPLAY_MISMATCH", "ORDERING_FAILURE", "HASH_MISMATCH", "INTEGRITY_REFERENCE_INVALID", "REPLAY_RECORD_NOT_FOUND"].includes(failureState);
  const plan_execution_lookup = terminalFailure ? null : runPlanExecutionLookup({ query_contract: contract });
  const delegation_orchestration_lookup = terminalFailure ? null : runDelegationOrchestrationLookup({ query_contract: contract });
  const supervision_intervention_boundary_lookup = terminalFailure ? null : runSupervisionInterventionBoundaryLookup({ query_contract: contract });
  const reconstruction_record = terminalFailure ? null : buildReconstruction(contract, type, input.scenario);
  const replay_result = terminalFailure ? null : buildReplayResult(contract, reconstruction_record);
  const finalFailure = failureState ?? (reconstruction_record ? null : "RECONSTRUCTION_NOT_FOUND");
  const lookup_state: ReplayHistoricalReconstructionState = finalFailure ?? "LOOKUP_RETURNED";
  const lookup_id = id("RHQ", "replay-historical-query-id", { query: contract.autonomy_query_id, type, scenario: input.scenario ?? "BASELINE" });
  const failures = freezeArray([
    ...query_validation.errors,
    ...(explicitFailure ? [issue(explicitFailure, "replay_historical_reconstruction_query", `${explicitFailure} detected during replay and historical reconstruction query.`)] : []),
  ]);
  const result_hash = finalFailure && terminalFailure ? null : resultHash(reconstruction_record, replay_result);
  const base = {
    phase_version: "8I.6" as const,
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
    plan_execution_lookup,
    delegation_orchestration_lookup,
    supervision_intervention_boundary_lookup,
    reconstruction_record,
    replay_result,
    failures,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    result_hash,
    read_only: true as const,
    advisory_only_notice: "Replay and historical reconstruction queries are deterministic, read-only, evidence-backed, and never infer missing history." as const,
  };
  const audit_record = buildAudit(base, query_validation.authorization_verified && !terminalFailure ? "APPROVED" : "REJECTED");
  return Object.freeze({ ...base, audit_record });
}

export function validateReplayHistoricalReconstructionQuery(input: ReplayHistoricalReconstructionInput = {}) {
  const response = runReplayHistoricalReconstructionQuery(input);
  return Object.freeze({
    lookup_id: response.lookup_id,
    valid: response.lookup_state === "LOOKUP_RETURNED" || response.lookup_state === "NO_RESULTS",
    lookup_state: response.lookup_state,
    replay_status: response.reconstruction_record?.replay_status ?? null,
    errors: response.failures,
    replay_compatible: Boolean(response.replay_reference) && response.query_validation.replay_compatible,
    lineage_compatible: Boolean(response.lineage_reference) && response.query_validation.lineage_compatible,
    read_only: response.read_only,
    result_hash: response.result_hash,
  });
}

export function buildReplayHistoricalReconstructionObservabilitySurface(input: ReplayHistoricalReconstructionInput = {}): ReplayHistoricalReconstructionObservabilitySurface {
  const response = runReplayHistoricalReconstructionQuery(input);
  const errors = response.lookup_state === "LOOKUP_RETURNED" || response.lookup_state === "NO_RESULTS" ? [] : [response.lookup_state as ReplayHistoricalReconstructionErrorState];
  return Object.freeze({
    lookup_id: response.lookup_id,
    lookup_type: response.lookup_type,
    lookup_state: response.lookup_state,
    replay_status: response.reconstruction_record?.replay_status ?? null,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    reconstructed_event_count: response.reconstruction_record?.reconstructed_events.length ?? 0,
    missing_record_count: response.reconstruction_record?.missing_events.length ?? 0,
    mismatch_count: response.reconstruction_record?.mismatch_events.length ?? 0,
    errors: freezeArray(errors),
    result_hash: response.result_hash,
    audit_hash: response.audit_record.audit_hash,
  });
}

export function getReplayHistoricalReconstructionContract() {
  const response = runReplayHistoricalReconstructionQuery();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "read-only", "replayable", "explainable", "immutable", "auditable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "reproducible", "no-inference"]),
      schema_version: SCHEMA_VERSION,
      lookup_types: freezeArray(["HISTORICAL_RECONSTRUCTION", "REPLAY_QUERY", "TIMELINE_RECONSTRUCTION", "MISSING_RECORD_DETECTION", "MISMATCH_INSPECTION", "REPLAY_RESULT_VIEW"] as const),
      replay_states: freezeArray(["REPRODUCED", "MISMATCH", "INCOMPLETE", "INVALID"] as const),
      timeline_categories: freezeArray(["MISSION_OBJECTIVE", "PLANNING", "DECISION", "DELEGATION", "ORCHESTRATION", "EXECUTION", "SUPERVISION", "INTERVENTION", "OUTCOME", "REPLAY", "INTEGRITY_VERIFICATION"] as const),
      deterministic_ordering_keys: freezeArray(["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "record_id"]),
      mutation_permitted: false,
      inference_permitted: false,
    }),
    response,
    validation: validateReplayHistoricalReconstructionQuery(),
    observability: buildReplayHistoricalReconstructionObservabilitySurface(),
  });
}
