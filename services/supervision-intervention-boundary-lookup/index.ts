import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import { runAutonomySearch } from "@/services/autonomy-search-engine";
import type { AutonomyQueryContract, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  BoundaryLookupRecord,
  BoundaryRejectionView,
  BoundaryType,
  InterventionLookupRecord,
  InterventionType,
  RuntimeHealthLevel,
  RuntimeViolationSearchRecord,
  SupervisionInterventionBoundaryLookupAuditRecord,
  SupervisionInterventionBoundaryLookupErrorState,
  SupervisionInterventionBoundaryLookupInput,
  SupervisionInterventionBoundaryLookupObservabilitySurface,
  SupervisionInterventionBoundaryLookupResponse,
  SupervisionInterventionBoundaryLookupScenario,
  SupervisionInterventionBoundaryLookupState,
  SupervisionInterventionBoundaryLookupType,
  SupervisionLookupRecord,
  SupervisionType,
} from "@/types/supervision-intervention-boundary-lookup";

const NOW = "2026-06-30T20:00:00.000Z";
const SCHEMA_VERSION = "supervision-intervention-boundary-lookup/v8I.5" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function issue(state: SupervisionInterventionBoundaryLookupErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<SupervisionInterventionBoundaryLookupErrorState, AutonomyQueryErrorState> = {
    BOUNDARY_EVENT_NOT_FOUND: "OBJECT_NOT_FOUND",
    INTERVENTION_RECORD_NOT_FOUND: "OBJECT_NOT_FOUND",
    INVALID_BOUNDARY_REFERENCE: "VALIDATION_FAILURE",
    INVALID_CONSTITUTION_REFERENCE: "CONSTITUTIONAL_REJECTION",
    INVALID_LOOKUP: "INVALID_QUERY",
    INVALID_POLICY_REFERENCE: "GOVERNANCE_REJECTION",
    LINEAGE_REFERENCE_INVALID: "LINEAGE_REFERENCE_INVALID",
    MISSION_NOT_FOUND: "MISSION_SCOPE_VIOLATION",
    MISSION_SCOPE_VIOLATION: "MISSION_SCOPE_VIOLATION",
    ORDERING_FAILURE: "ORDERING_FAILURE",
    REPLAY_REFERENCE_INVALID: "REPLAY_REFERENCE_INVALID",
    SUPERVISION_RECORD_NOT_FOUND: "OBJECT_NOT_FOUND",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
    VALIDATION_FAILURE: "VALIDATION_FAILURE",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryForScenario(input: SupervisionInterventionBoundaryLookupInput): AutonomyQueryContract {
  if (input.query_contract) return input.query_contract;
  switch (input.scenario) {
    case "INTERVENTION_LOOKUP":
      return buildAutonomyQueryContract({ query_type: "INTERVENTION_LOOKUP", query_scope: "MISSION", target_reference: input.target_reference ?? "intervention:autonomy:8i5:primary" });
    case "BOUNDARY_LOOKUP":
    case "BOUNDARY_REJECTION_VIEW":
      return buildAutonomyQueryContract({ query_type: "POLICY_LOOKUP", query_scope: "MISSION", target_reference: input.target_reference ?? "boundary:autonomy:8i5:primary" });
    case "HISTORICAL_RECONSTRUCTION":
      return buildAutonomyQueryContract({ query_type: "HISTORICAL_RECONSTRUCTION", query_scope: "MISSION", target_reference: input.target_reference ?? "mission:autonomy:8i5:history" });
    case "UNAUTHORIZED":
      return buildAutonomyQueryContract({ scenario: "UNAUTHORIZED_OPERATOR" });
    case "TENANT_SCOPE_VIOLATION":
      return buildAutonomyQueryContract({ scenario: "TENANT_SCOPE_VIOLATION" });
    case "MISSION_NOT_FOUND":
    case "MISSION_SCOPE_VIOLATION":
      return buildAutonomyQueryContract({ scenario: "INVALID_MISSION" });
    case "REPLAY_REFERENCE_INVALID":
      return buildAutonomyQueryContract({ scenario: "REPLAY_REFERENCE_INVALID" });
    case "LINEAGE_REFERENCE_INVALID":
      return buildAutonomyQueryContract({ scenario: "LINEAGE_REFERENCE_INVALID" });
    case "INVALID_POLICY_REFERENCE":
      return buildAutonomyQueryContract({ scenario: "GOVERNANCE_REJECTION" });
    case "INVALID_CONSTITUTION_REFERENCE":
      return buildAutonomyQueryContract({ scenario: "CONSTITUTIONAL_REJECTION" });
    default:
      return buildAutonomyQueryContract({ query_type: "SUPERVISION_LOOKUP", query_scope: "MISSION", target_reference: input.target_reference ?? "supervision:autonomy:8i5:primary" });
  }
}

function lookupType(input: SupervisionInterventionBoundaryLookupInput): SupervisionInterventionBoundaryLookupType {
  if (input.lookup_type) return input.lookup_type;
  switch (input.scenario) {
    case "SUPERVISION_LOOKUP": return "SUPERVISION";
    case "INTERVENTION_LOOKUP": return "INTERVENTION";
    case "BOUNDARY_LOOKUP": return "BOUNDARY";
    case "RUNTIME_VIOLATION_SEARCH": return "RUNTIME_VIOLATION";
    case "BOUNDARY_REJECTION_VIEW": return "BOUNDARY_REJECTION";
    case "HISTORICAL_RECONSTRUCTION": return "HISTORICAL_RECONSTRUCTION";
    default: return "SUPERVISION_INTERVENTION_BOUNDARY";
  }
}

function supervisionRecord(contract: AutonomyQueryContract, supervision_type: SupervisionType, sequence: number): SupervisionLookupRecord {
  const violation = supervision_type === "POLICY_VIOLATION" || supervision_type === "CONSTITUTIONAL_VALIDATION";
  const drift = supervision_type === "DRIFT_MONITORING";
  const health: RuntimeHealthLevel = drift ? "DEGRADED" : violation ? "HIGH_RISK" : sequence === 4 ? "STABLE" : "HEALTHY";
  const source = {
    supervision_event_id: id("SUP", "supervision-event-id", { supervision_type, sequence }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    execution_id: "execution:autonomy:8i5:001",
    supervision_type,
    runtime_health: health,
    confidence: Object.freeze({
      score: drift ? 0.63 : violation ? 0.51 : 0.88,
      trend: drift || violation ? "DEGRADING" as const : "STABLE" as const,
      degradation: drift ? 0.18 : violation ? 0.27 : 0.03,
      contributors: freezeArray(["runtime telemetry", "governance evidence", "boundary checks", "replay verification"]),
      uncertainty_analysis: drift ? "orchestration drift increased uncertainty before intervention review" : "confidence supported by immutable evidence",
    }),
    drift_status: Object.freeze({
      detected: drift,
      severity: drift ? "HIGH" as const : "NONE" as const,
      events: drift ? freezeArray([{
        drift_type: "ORCHESTRATION" as const,
        severity: "HIGH" as const,
        detection_timestamp: "2026-06-30T19:11:00.000Z",
        affected_execution: "execution:autonomy:8i5:001",
        recommendation_reference: "intervention:8i5:pause",
      }]) : freezeArray([]),
    }),
    policy_validation: Object.freeze({
      status: supervision_type === "POLICY_VIOLATION" ? "VIOLATION" as const : "PASS" as const,
      policy_reference: "policy:runtime-boundary:8i5",
      evidence: freezeArray(["evidence:policy:runtime:8i5", "evidence:telemetry:8i5"]),
      governance_outcome: supervision_type === "POLICY_VIOLATION" ? "intervention recommended" : "approved for continued monitoring",
    }),
    constitutional_validation: Object.freeze({
      status: supervision_type === "CONSTITUTIONAL_VALIDATION" ? "VIOLATION" as const : "PASS" as const,
      principle: "no hidden execution and no authority bypass",
      evidence: freezeArray(["evidence:constitutional:8i5", "evidence:boundary:8i5"]),
      authority_decision: supervision_type === "CONSTITUTIONAL_VALIDATION" ? "escalation rejected" : "authority in scope",
    }),
    recommendation_reference: drift ? "intervention:8i5:pause" : violation ? "intervention:8i5:operator-review" : "intervention:8i5:none",
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:supervision:${sequence}`,
    integrity_hash: hashValue("supervision-integrity", { supervision_type, sequence, health }),
    event_timestamp: `2026-06-30T19:${(10 + sequence).toString().padStart(2, "0")}:00.000Z`,
    autonomy_event_sequence: 8600 + sequence,
  };
  return Object.freeze({ ...source, supervision_hash: hashValue("supervision-lookup-record", source) });
}

function buildSupervision(contract: AutonomyQueryContract, scenario?: SupervisionInterventionBoundaryLookupScenario): readonly SupervisionLookupRecord[] {
  if (scenario === "SUPERVISION_RECORD_NOT_FOUND") return freezeArray([]);
  if (scenario === "ORDERING_FAILURE") return freezeArray([
    supervisionRecord(contract, "EXECUTION_HEALTH", 3),
    supervisionRecord(contract, "DRIFT_MONITORING", 1),
  ]);
  return freezeArray([
    supervisionRecord(contract, "DRIFT_MONITORING", 1),
    supervisionRecord(contract, "POLICY_VIOLATION", 2),
    supervisionRecord(contract, "CONSTITUTIONAL_VALIDATION", 3),
    supervisionRecord(contract, "EXECUTION_HEALTH", 4),
    supervisionRecord(contract, "RUNTIME_CONFIDENCE", 5),
    supervisionRecord(contract, "RECOMMENDATION_VALIDITY", 6),
  ]);
}

function interventionRecord(contract: AutonomyQueryContract, intervention_type: InterventionType, sequence: number): InterventionLookupRecord {
  const checkpoint = intervention_type === "ROLLBACK" ? "checkpoint:8i5:rollback-ready" : null;
  const operator_required = intervention_type === "ESCALATION" || intervention_type === "OPERATOR_REVIEW";
  const source = {
    intervention_id: `intervention:8i5:${intervention_type.toLowerCase().replace("_", "-")}`,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    intervention_type,
    recommendation_reason: intervention_type === "PAUSE" ? "runtime drift exceeded governed threshold" : intervention_type === "ROLLBACK" ? "checkpoint is available and execution risk increased" : intervention_type === "ESCALATION" ? "authority boundary requires operator decision" : intervention_type === "CONTAINMENT" ? "contain affected workflow while preserving tenant isolation" : "operator review required for constitutional evidence",
    triggering_condition: intervention_type === "PAUSE" ? "orchestration drift high" : intervention_type === "ROLLBACK" ? "runtime health degraded" : intervention_type === "ESCALATION" ? "authority request exceeded mission grant" : intervention_type === "CONTAINMENT" ? "boundary anomaly detected" : "policy and constitutional evidence require review",
    affected_workflow: "workflow:autonomy:8i5:primary",
    supporting_evidence: freezeArray(["evidence:supervision:8i5", "evidence:boundary:8i5", "evidence:replay:8i5"]),
    governance_validation: Object.freeze({ status: "APPROVED" as const, governance_reference: "governance:intervention:8i5", policy_reference: "policy:intervention-advisory:8i5" }),
    authority_validation: Object.freeze({ required_authority: operator_required ? "OPERATOR" : "GOVERNANCE", validation_result: operator_required ? "OPERATOR_REQUIRED" as const : "APPROVED" as const, operator_required }),
    checkpoint_reference: checkpoint,
    urgency: intervention_type === "ESCALATION" ? "CRITICAL" as const : intervention_type === "ROLLBACK" ? "HIGH" as const : "MEDIUM" as const,
    advisory_only: true as const,
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:intervention:${sequence}`,
    integrity_hash: hashValue("intervention-integrity", { intervention_type, sequence }),
    created_timestamp: `2026-06-30T19:${(20 + sequence).toString().padStart(2, "0")}:00.000Z`,
    autonomy_event_sequence: 8700 + sequence,
  };
  return Object.freeze({ ...source, intervention_hash: hashValue("intervention-lookup-record", source) });
}

function buildInterventions(contract: AutonomyQueryContract, scenario?: SupervisionInterventionBoundaryLookupScenario): readonly InterventionLookupRecord[] {
  if (scenario === "INTERVENTION_RECORD_NOT_FOUND") return freezeArray([]);
  return freezeArray([
    interventionRecord(contract, "PAUSE", 1),
    interventionRecord(contract, "ROLLBACK", 2),
    interventionRecord(contract, "ESCALATION", 3),
    interventionRecord(contract, "CONTAINMENT", 4),
    interventionRecord(contract, "OPERATOR_REVIEW", 5),
  ]);
}

function boundaryRecord(contract: AutonomyQueryContract, boundary_type: BoundaryType, sequence: number): BoundaryLookupRecord {
  const rejected = boundary_type.startsWith("REJECTED");
  const source = {
    boundary_event_id: id("BND", "boundary-event-id", { boundary_type, sequence }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    boundary_type,
    evaluation_result: rejected ? "REJECTED" as const : boundary_type === "TENANT_ISOLATION" ? "ENFORCED" as const : "APPROVED" as const,
    requested_authority: boundary_type === "AUTHORITY" || boundary_type === "REJECTED_AUTHORITY_ESCALATION" ? "MISSION_OPERATOR_WRITE" : null,
    granted_authority: boundary_type === "AUTHORITY" ? "MISSION_OPERATOR_READ" : null,
    denied_authority: boundary_type === "REJECTED_AUTHORITY_ESCALATION" ? "MISSION_OPERATOR_WRITE" : null,
    rejection_reason: rejected ? boundary_type === "REJECTED_HIDDEN_EXECUTION" ? "hidden execution attempt rejected by runtime boundary" : boundary_type === "REJECTED_GOVERNANCE_BYPASS" ? "governance bypass rejected before execution" : "authority escalation exceeded approved scope" : null,
    policy_reference: "policy:boundary-enforcement:8i5",
    governance_reference: "governance:boundary:8i5",
    constitutional_reference: "constitution:controlled-autonomy:8i5",
    tenant_isolation_status: boundary_type === "TENANT_ISOLATION" ? "IN_SCOPE" as const : "IN_SCOPE" as const,
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:boundary:${sequence}`,
    integrity_hash: hashValue("boundary-integrity", { boundary_type, sequence }),
    event_timestamp: `2026-06-30T19:${(30 + sequence).toString().padStart(2, "0")}:00.000Z`,
    autonomy_event_sequence: 8800 + sequence,
  };
  return Object.freeze({ ...source, boundary_hash: hashValue("boundary-lookup-record", source) });
}

function buildBoundaries(contract: AutonomyQueryContract, scenario?: SupervisionInterventionBoundaryLookupScenario): readonly BoundaryLookupRecord[] {
  if (scenario === "BOUNDARY_EVENT_NOT_FOUND" || scenario === "INVALID_BOUNDARY_REFERENCE") return freezeArray([]);
  return freezeArray([
    boundaryRecord(contract, "AUTHORITY", 1),
    boundaryRecord(contract, "GOVERNANCE", 2),
    boundaryRecord(contract, "EXECUTION_LIMIT", 3),
    boundaryRecord(contract, "TENANT_ISOLATION", 4),
    boundaryRecord(contract, "CONSTITUTIONAL_COMPLIANCE", 5),
    boundaryRecord(contract, "REJECTED_AUTHORITY_ESCALATION", 6),
    boundaryRecord(contract, "REJECTED_HIDDEN_EXECUTION", 7),
    boundaryRecord(contract, "REJECTED_GOVERNANCE_BYPASS", 8),
  ]);
}

function buildViolations(contract: AutonomyQueryContract, supervision: readonly SupervisionLookupRecord[], interventions: readonly InterventionLookupRecord[]): readonly RuntimeViolationSearchRecord[] {
  const drift = supervision.find((record) => record.supervision_type === "DRIFT_MONITORING");
  const policy = supervision.find((record) => record.policy_validation.status === "VIOLATION");
  const constitutional = supervision.find((record) => record.constitutional_validation.status === "VIOLATION");
  const pause = interventions.find((record) => record.intervention_type === "PAUSE");
  const review = interventions.find((record) => record.intervention_type === "OPERATOR_REVIEW");
  const items = [
    { type: "DRIFT" as const, severity: "HIGH" as const, source: drift, intervention: pause },
    { type: "POLICY" as const, severity: "HIGH" as const, source: policy, intervention: review },
    { type: "CONSTITUTIONAL" as const, severity: "CRITICAL" as const, source: constitutional, intervention: review },
    { type: "CONFIDENCE_DEGRADATION" as const, severity: "MEDIUM" as const, source: drift, intervention: pause },
  ];
  return freezeArray(items.filter((item) => item.source && item.intervention).map((item, index) => {
    const source = {
      violation_id: id("VIO", "runtime-violation-id", { type: item.type, index }),
      violation_type: item.type,
      severity: item.severity,
      affected_execution: item.source?.execution_id ?? "execution:autonomy:8i5:001",
      associated_intervention: item.intervention?.intervention_id ?? "intervention:8i5:none",
      evidence_references: freezeArray(["evidence:violation:8i5", "evidence:supervision:8i5", "evidence:boundary:8i5"]),
      replay_reference: contract.replay_reference,
      lineage_reference: `${contract.lineage_reference}:violation:${index + 1}`,
    };
    return Object.freeze({ ...source, violation_hash: hashValue("runtime-violation-search-record", source) });
  }));
}

function buildBoundaryRejectionView(contract: AutonomyQueryContract, boundaries: readonly BoundaryLookupRecord[]): BoundaryRejectionView | null {
  const rejected = boundaries.filter((record) => record.evaluation_result === "REJECTED");
  if (!rejected.length) return null;
  const source = {
    rejection_view_id: id("BRV", "boundary-rejection-view-id", rejected.map((record) => record.boundary_hash)),
    rejected_authority_requests: freezeArray(rejected.filter((record) => record.boundary_type === "REJECTED_AUTHORITY_ESCALATION").map((record) => record.boundary_event_id)),
    blocked_executions: freezeArray(["execution:autonomy:8i5:hidden-attempt"]),
    governance_denials: freezeArray(rejected.filter((record) => record.boundary_type === "REJECTED_GOVERNANCE_BYPASS").map((record) => record.boundary_event_id)),
    constitutional_enforcements: freezeArray(rejected.map((record) => record.constitutional_reference)),
    tenant_isolation_events: freezeArray(["boundary:tenant-isolation:8i5:verified"]),
    hidden_execution_detections: freezeArray(rejected.filter((record) => record.boundary_type === "REJECTED_HIDDEN_EXECUTION").map((record) => record.boundary_event_id)),
    audit_evidence: freezeArray(["audit:boundary:8i5", "audit:supervision:8i5"]),
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:boundary-rejection-view`,
  };
  return Object.freeze({ ...source, rejection_hash: hashValue("boundary-rejection-view", source) });
}

function scenarioFailure(scenario?: SupervisionInterventionBoundaryLookupScenario): SupervisionInterventionBoundaryLookupErrorState | null {
  switch (scenario) {
    case "SUPERVISION_RECORD_NOT_FOUND": return "SUPERVISION_RECORD_NOT_FOUND";
    case "INTERVENTION_RECORD_NOT_FOUND": return "INTERVENTION_RECORD_NOT_FOUND";
    case "BOUNDARY_EVENT_NOT_FOUND": return "BOUNDARY_EVENT_NOT_FOUND";
    case "MISSION_NOT_FOUND": return "MISSION_NOT_FOUND";
    case "UNAUTHORIZED": return "UNAUTHORIZED";
    case "TENANT_SCOPE_VIOLATION": return "TENANT_SCOPE_VIOLATION";
    case "MISSION_SCOPE_VIOLATION": return "MISSION_SCOPE_VIOLATION";
    case "INVALID_BOUNDARY_REFERENCE": return "INVALID_BOUNDARY_REFERENCE";
    case "INVALID_POLICY_REFERENCE": return "INVALID_POLICY_REFERENCE";
    case "INVALID_CONSTITUTION_REFERENCE": return "INVALID_CONSTITUTION_REFERENCE";
    case "REPLAY_REFERENCE_INVALID": return "REPLAY_REFERENCE_INVALID";
    case "LINEAGE_REFERENCE_INVALID": return "LINEAGE_REFERENCE_INVALID";
    case "ORDERING_FAILURE": return "ORDERING_FAILURE";
    case "VALIDATION_FAILURE":
    case "MUTATION_ATTEMPT": return "VALIDATION_FAILURE";
    default: return null;
  }
}

function failureFromQuery(errors: readonly AutonomyQueryValidationIssue[]): SupervisionInterventionBoundaryLookupErrorState | null {
  const states = errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_SCOPE_VIOLATION";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "REPLAY_REFERENCE_INVALID";
  if (states.includes("LINEAGE_REFERENCE_INVALID")) return "LINEAGE_REFERENCE_INVALID";
  if (states.includes("GOVERNANCE_REJECTION")) return "INVALID_POLICY_REFERENCE";
  if (states.includes("CONSTITUTIONAL_REJECTION")) return "INVALID_CONSTITUTION_REFERENCE";
  if (states.length) return "INVALID_LOOKUP";
  return null;
}

function resultHash(supervision: readonly SupervisionLookupRecord[], interventions: readonly InterventionLookupRecord[], boundaries: readonly BoundaryLookupRecord[], violations: readonly RuntimeViolationSearchRecord[], rejection: BoundaryRejectionView | null): string | null {
  if (!supervision.length && !interventions.length && !boundaries.length && !violations.length && !rejection) return null;
  return hashValue("supervision-intervention-boundary-lookup-result", {
    supervision_hashes: supervision.map((record) => record.supervision_hash),
    intervention_hashes: interventions.map((record) => record.intervention_hash),
    boundary_hashes: boundaries.map((record) => record.boundary_hash),
    violation_hashes: violations.map((record) => record.violation_hash),
    rejection_hash: rejection?.rejection_hash ?? null,
  });
}

function buildAudit(response: Omit<SupervisionInterventionBoundaryLookupResponse, "audit_record">, authorization: "APPROVED" | "REJECTED"): SupervisionInterventionBoundaryLookupAuditRecord {
  const source = {
    audit_id: id("SIB-AUD", "supervision-intervention-boundary-audit-id", response.lookup_id),
    lookup_id: response.lookup_id,
    operator_id: response.query_contract.operator_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    lookup_type: response.lookup_type,
    target_reference: response.target_reference,
    authorization_result: authorization,
    returned_record_count: response.supervision_records.length + response.intervention_records.length + response.boundary_records.length + response.violation_records.length + Number(Boolean(response.boundary_rejection_view)),
    result_hash: response.result_hash ?? "",
    replay_reference: response.replay_reference,
    lineage_reference: response.lineage_reference,
    audit_timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("supervision-intervention-boundary-lookup-audit", source) });
}

export function runSupervisionInterventionBoundaryLookup(input: SupervisionInterventionBoundaryLookupInput = {}): SupervisionInterventionBoundaryLookupResponse {
  const contract = queryForScenario(input);
  const query_validation = validateAutonomyQueryContract(contract);
  const type = lookupType(input);
  const search_response = runAutonomySearch({ query_contract: contract, requested_domains: ["SUPERVISION", "INTERVENTION", "BOUNDARY", "GOVERNANCE", "REPLAY", "INTEGRITY"], search_terms: ["supervision", "intervention", "boundary"] });
  const queryFailure = failureFromQuery(query_validation.errors);
  const explicitFailure = scenarioFailure(input.scenario);
  const failureState = explicitFailure ?? queryFailure;
  const includeSupervision = type === "SUPERVISION" || type === "SUPERVISION_INTERVENTION_BOUNDARY" || type === "RUNTIME_VIOLATION" || type === "HISTORICAL_RECONSTRUCTION";
  const includeIntervention = type === "INTERVENTION" || type === "SUPERVISION_INTERVENTION_BOUNDARY" || type === "RUNTIME_VIOLATION" || type === "HISTORICAL_RECONSTRUCTION";
  const includeBoundary = type === "BOUNDARY" || type === "SUPERVISION_INTERVENTION_BOUNDARY" || type === "BOUNDARY_REJECTION" || type === "HISTORICAL_RECONSTRUCTION";
  const terminalFailure = failureState && failureState !== "ORDERING_FAILURE";
  const supervision_records = terminalFailure ? freezeArray<SupervisionLookupRecord>([]) : includeSupervision ? buildSupervision(contract, input.scenario) : freezeArray<SupervisionLookupRecord>([]);
  const intervention_records = terminalFailure ? freezeArray<InterventionLookupRecord>([]) : includeIntervention ? buildInterventions(contract, input.scenario) : freezeArray<InterventionLookupRecord>([]);
  const boundary_records = terminalFailure ? freezeArray<BoundaryLookupRecord>([]) : includeBoundary ? buildBoundaries(contract, input.scenario) : freezeArray<BoundaryLookupRecord>([]);
  const violation_records = terminalFailure ? freezeArray<RuntimeViolationSearchRecord>([]) : (type === "RUNTIME_VIOLATION" || type === "SUPERVISION_INTERVENTION_BOUNDARY" || type === "HISTORICAL_RECONSTRUCTION") ? buildViolations(contract, supervision_records, intervention_records) : freezeArray<RuntimeViolationSearchRecord>([]);
  const boundary_rejection_view = terminalFailure ? null : (type === "BOUNDARY_REJECTION" || type === "SUPERVISION_INTERVENTION_BOUNDARY" || type === "HISTORICAL_RECONSTRUCTION") ? buildBoundaryRejectionView(contract, boundary_records) : null;
  const hasRecords = supervision_records.length || intervention_records.length || boundary_records.length || violation_records.length || boundary_rejection_view;
  const finalFailure = failureState ?? (hasRecords ? null : "INVALID_LOOKUP");
  const lookup_state: SupervisionInterventionBoundaryLookupState = finalFailure ?? "LOOKUP_RETURNED";
  const lookup_id = id("SIB", "supervision-intervention-boundary-lookup-id", { query: contract.autonomy_query_id, type, scenario: input.scenario ?? "BASELINE" });
  const failures = freezeArray([
    ...query_validation.errors,
    ...(explicitFailure ? [issue(explicitFailure, "supervision_intervention_boundary_lookup", `${explicitFailure} detected during supervision, intervention, and boundary lookup.`)] : []),
  ]);
  const result_hash = finalFailure ? null : resultHash(supervision_records, intervention_records, boundary_records, violation_records, boundary_rejection_view);
  const base = {
    phase_version: "8I.5" as const,
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
    supervision_records,
    intervention_records,
    boundary_records,
    violation_records,
    boundary_rejection_view,
    failures,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    result_hash,
    read_only: true as const,
    advisory_only_notice: "Supervision, intervention, and boundary lookup is deterministic, read-only, replayable, and audit-backed." as const,
  };
  const audit_record = buildAudit(base, query_validation.authorization_verified && !finalFailure ? "APPROVED" : "REJECTED");
  return Object.freeze({ ...base, audit_record });
}

export function validateSupervisionInterventionBoundaryLookup(input: SupervisionInterventionBoundaryLookupInput = {}) {
  const response = runSupervisionInterventionBoundaryLookup(input);
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

export function buildSupervisionInterventionBoundaryLookupObservabilitySurface(input: SupervisionInterventionBoundaryLookupInput = {}): SupervisionInterventionBoundaryLookupObservabilitySurface {
  const response = runSupervisionInterventionBoundaryLookup(input);
  const errors = response.lookup_state === "LOOKUP_RETURNED" || response.lookup_state === "NO_RESULTS" ? [] : [response.lookup_state as SupervisionInterventionBoundaryLookupErrorState];
  return Object.freeze({
    lookup_id: response.lookup_id,
    lookup_type: response.lookup_type,
    lookup_state: response.lookup_state,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    supervision_records: response.supervision_records.length,
    intervention_records: response.intervention_records.length,
    boundary_records: response.boundary_records.length,
    violation_records: response.violation_records.length,
    has_boundary_rejection_view: Boolean(response.boundary_rejection_view),
    errors: freezeArray(errors),
    result_hash: response.result_hash,
    audit_hash: response.audit_record.audit_hash,
  });
}

export function getSupervisionInterventionBoundaryLookupContract() {
  const response = runSupervisionInterventionBoundaryLookup();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only", "deterministic", "replayable", "explainable", "immutable", "auditable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "reproducible"]),
      schema_version: SCHEMA_VERSION,
      lookup_types: freezeArray(["SUPERVISION", "INTERVENTION", "BOUNDARY", "SUPERVISION_INTERVENTION_BOUNDARY", "RUNTIME_VIOLATION", "BOUNDARY_REJECTION", "HISTORICAL_RECONSTRUCTION"] as const),
      health_levels: freezeArray(["OPTIMAL", "HEALTHY", "STABLE", "DEGRADED", "HIGH_RISK", "CRITICAL"] as const),
      intervention_types: freezeArray(["PAUSE", "ROLLBACK", "ESCALATION", "CONTAINMENT", "OPERATOR_REVIEW"] as const),
      boundary_types: freezeArray(["AUTHORITY", "GOVERNANCE", "EXECUTION_LIMIT", "TENANT_ISOLATION", "CONSTITUTIONAL_COMPLIANCE", "REJECTED_AUTHORITY_ESCALATION", "REJECTED_HIDDEN_EXECUTION", "REJECTED_GOVERNANCE_BYPASS"] as const),
      deterministic_ordering_keys: freezeArray(["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "record_id"]),
      intervention_execution_permitted: false,
      boundary_mutation_permitted: false,
    }),
    response,
    validation: validateSupervisionInterventionBoundaryLookup(),
    observability: buildSupervisionInterventionBoundaryLookupObservabilitySurface(),
  });
}
