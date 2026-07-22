import { runOperatorApprovalFramework } from "@/services/operator-approval-framework";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { OperatorApprovalFrameworkResult } from "@/types/operator-approval-framework";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  AdaptiveIntelligenceLedgerFoundation,
  AdaptiveIntelligenceLedgerInput,
  AdaptiveIntelligenceLedgerResult,
  AdaptiveLedgerCertificationReport,
  AdaptiveLedgerCheck,
  AdaptiveLedgerDashboard,
  AdaptiveLedgerEvent,
  AdaptiveLedgerEventType,
  AdaptiveLedgerFailure,
  AdaptiveLedgerIndex,
  AdaptiveLedgerIntegrityReport,
  AdaptiveLedgerLifecycleState,
  AdaptiveLedgerQuery,
  AdaptiveLedgerReaderResult,
  AdaptiveLedgerRecord,
  AdaptiveLedgerReplayResult,
  AdaptiveLedgerRetentionPolicy,
  AdaptiveLedgerValidation,
  AdaptiveLedgerValidationState,
  AdaptiveLedgerWriterConfirmation,
} from "@/types/adaptive-intelligence-ledger";

const LEDGER_VERSION = "adaptive-intelligence-ledger/v1" as const;
const RECORD_SCHEMA_VERSION = "adaptive-ledger-record/v1" as const;

export const ADAPTIVE_LEDGER_CHECKS: readonly AdaptiveLedgerCheck[] = Object.freeze(["SCHEMA_INTEGRITY", "SEQUENCE_INTEGRITY", "PARENT_CHILD_CONSISTENCY", "HASH_VERIFICATION", "PREVIOUS_HASH_CHAIN", "REPLAY_REFERENCE_VALIDATION", "LINEAGE_COMPLETENESS", "TENANT_ISOLATION", "APPEND_ONLY", "READ_AUTHORIZATION", "WRITE_AUTHORIZATION", "DETERMINISTIC_REPLAY"]);
export const ADAPTIVE_LEDGER_EVENT_TYPES: readonly AdaptiveLedgerEventType[] = Object.freeze(["PROPOSAL_CREATED", "VALIDATION", "SIMULATION", "GOVERNANCE_REVIEW", "OPERATOR_APPROVAL", "CERTIFICATION", "ROLLBACK", "REJECTION"]);
export const ADAPTIVE_LEDGER_LIFECYCLE_STATES: readonly AdaptiveLedgerLifecycleState[] = Object.freeze(["PROPOSED", "VALIDATED", "SIMULATED", "GOVERNANCE_REVIEWED", "OPERATOR_APPROVED", "CERTIFIED", "AVAILABLE", "ROLLED_BACK", "REJECTED"]);

type Scenario = NonNullable<AdaptiveIntelligenceLedgerInput["scenario"]>;

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

function state(pass: boolean): AdaptiveLedgerValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: OperatorApprovalFrameworkResult) {
  return {
    tenant_id: source.approval_record.tenant_id,
    mission_scope: source.approval_record.mission_scope,
    adaptation_id: source.approval_record.adaptation_id,
    proposal_id: source.approval_record.proposal_id,
  };
}

function visibleToRole(source: OperatorApprovalFrameworkResult, role: VisibilityRole): boolean {
  return source.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function sourceForScenario(input: AdaptiveIntelligenceLedgerInput, scenario: Scenario): OperatorApprovalFrameworkResult {
  if (input.approval_framework) return input.approval_framework;
  if (scenario === "MISSING_APPROVAL_RECORD") return runOperatorApprovalFramework({ scenario: "MISSING_APPROVAL_ID" });
  if (scenario === "MISSING_CERTIFICATION_RECORD") return runOperatorApprovalFramework({ scenario: "MISSING_CERTIFICATION_REFS" });
  if (scenario === "MISSING_REPLAY_REFS") return runOperatorApprovalFramework({ scenario: "MISSING_REPLAY_REFS" });
  if (scenario === "HASH_MISMATCH" || scenario === "HASH_TAMPERING") return runOperatorApprovalFramework({ scenario: "HASH_MISMATCH" });
  return runOperatorApprovalFramework();
}

function eventPlan(scenario: Scenario): readonly [AdaptiveLedgerEventType, AdaptiveLedgerLifecycleState, string][] {
  const baseline: [AdaptiveLedgerEventType, AdaptiveLedgerLifecycleState, string][] = [
    ["PROPOSAL_CREATED", "PROPOSED", "Adaptive proposal created and bound to immutable lineage."],
    ["VALIDATION", "VALIDATED", "Adaptive proposal validation recorded."],
    ["SIMULATION", "SIMULATED", "Adaptive simulation outputs and divergence analysis recorded."],
    ["GOVERNANCE_REVIEW", "GOVERNANCE_REVIEWED", "Governance, constitutional, and authority review recorded."],
    ["OPERATOR_APPROVAL", "OPERATOR_APPROVED", "Authorized operator approval recorded."],
    ["CERTIFICATION", "CERTIFIED", "Adaptive recommendation certification recorded."],
    ["ROLLBACK", "ROLLED_BACK", "Rollback readiness and replay target recorded."],
    ["REJECTION", "REJECTED", "Rejection branch retained as immutable history."],
  ];
  if (scenario === "HIDDEN_LEDGER_ENTRY") return freezeArray(baseline.filter(([event]) => event !== "SIMULATION"));
  if (scenario === "MISSING_APPROVAL_RECORD") return freezeArray(baseline.filter(([event]) => event !== "OPERATOR_APPROVAL"));
  if (scenario === "MISSING_CERTIFICATION_RECORD") return freezeArray(baseline.filter(([event]) => event !== "CERTIFICATION"));
  if (scenario === "MISSING_REJECTION_RECORD") return freezeArray(baseline.filter(([event]) => event !== "REJECTION"));
  return freezeArray(baseline);
}

function refsForEvent(source: OperatorApprovalFrameworkResult, eventType: AdaptiveLedgerEventType, scenario: Scenario) {
  const replayRefs = scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([source.replay_hash, source.approval_replay.replay_id, source.replay_traceability.replay_record.replay_id]);
  return {
    evidence_refs: scenario === "LINEAGE_INCOMPLETE" ? freezeArray([]) : source.replay_traceability.replay_record.evidence_refs,
    simulation_refs: eventType === "SIMULATION" && scenario !== "LINEAGE_INCOMPLETE" ? source.replay_traceability.replay_record.simulation_refs : freezeArray([]),
    governance_refs: source.approval_decision.governance_refs,
    operator_refs: eventType === "OPERATOR_APPROVAL" ? freezeArray([source.approval_record.assigned_operator, source.approval_decision.decision_id]) : freezeArray([]),
    certification_refs: eventType === "CERTIFICATION" && scenario !== "MISSING_CERTIFICATION_RECORD" ? source.approval_decision.certification_refs : freezeArray([]),
    rollback_refs: eventType === "ROLLBACK" && scenario !== "MISSING_ROLLBACK_REPLAY" ? freezeArray(["rollback:adaptive-ledger-safe-point", source.replay_traceability.replay_hash]) : freezeArray([]),
    replay_refs: eventType === "ROLLBACK" && scenario === "MISSING_ROLLBACK_REPLAY" ? freezeArray([]) : replayRefs,
  };
}

function buildRecords(source: OperatorApprovalFrameworkResult, scenario: Scenario): readonly AdaptiveLedgerRecord[] {
  const c = ctx(source);
  let previousHash = "GENESIS";
  const planned = eventPlan(scenario);
  const records = planned.map(([event_type, lifecycle_state, event_summary], index) => {
    const sequence = scenario === "SEQUENCE_VIOLATION" && index === 3 ? 2 : index + 1;
    const recordId = scenario === "DUPLICATE_LEDGER_ID" && index === 2 ? "adaptive_ledger_record_002" : `adaptive_ledger_record_${String(index + 1).padStart(3, "0")}`;
    const refs = refsForEvent(source, event_type, scenario);
    const parent = index === 0 ? freezeArray([]) : freezeArray([`adaptive_ledger_record_${String(index).padStart(3, "0")}`]);
    const child = index === planned.length - 1 ? freezeArray([]) : freezeArray([`adaptive_ledger_record_${String(index + 2).padStart(3, "0")}`]);
    const base: Omit<AdaptiveLedgerRecord, "integrity_hash"> = {
      record_id: recordId,
      ledger_sequence: sequence,
      tenant_id: scenario === "TENANT_VIOLATION" || scenario === "TENANT_CROSSOVER" ? `${c.tenant_id}:foreign` : c.tenant_id,
      mission_scope: c.mission_scope,
      adaptation_id: c.adaptation_id,
      proposal_id: c.proposal_id,
      event_type,
      lifecycle_state,
      event_timestamp: `2026-07-05T10:01:${String(20 + index).padStart(2, "0")}.000Z`,
      event_summary: scenario === "SCHEMA_INVALID" && index === 0 ? "" : event_summary,
      evidence_refs: refs.evidence_refs,
      simulation_refs: refs.simulation_refs,
      governance_refs: refs.governance_refs,
      operator_refs: refs.operator_refs,
      certification_refs: refs.certification_refs,
      rollback_refs: refs.rollback_refs,
      replay_refs: refs.replay_refs,
      parent_record_refs: scenario === "PARENT_CHILD_INCONSISTENT" && index === 2 ? freezeArray(["missing-parent"]) : parent,
      child_record_refs: scenario === "PARENT_CHILD_INCONSISTENT" && index === 1 ? freezeArray(["missing-child"]) : child,
      previous_hash: scenario === "PREVIOUS_HASH_INVALID" && index === 2 ? "invalid-previous-hash" : previousHash,
      recorded_by: scenario === "UNAUTHORIZED_WRITE" ? "actor:unauthorized" : "system:adaptive-ledger-writer",
      schema_version: RECORD_SCHEMA_VERSION,
      append_only: (scenario === "APPEND_OVERWRITE" || scenario === "RECORD_MODIFICATION" || scenario === "HISTORY_REWRITE" ? false : true) as true,
      deleted: (scenario === "RECORD_DELETION" ? true : false) as false,
    };
    const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    previousHash = built.integrity_hash;
    if ((scenario === "HASH_MISMATCH" || scenario === "HASH_TAMPERING" || scenario === "CHAIN_CORRUPTION") && index === 2) return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.record_id }) });
    return built;
  });
  return freezeArray(records);
}

function buildEvents(records: readonly AdaptiveLedgerRecord[]): readonly AdaptiveLedgerEvent[] {
  return freezeArray(records.map((record) => Object.freeze({
    event_id: `event:${record.record_id}`,
    adaptation_id: record.adaptation_id,
    proposal_id: record.proposal_id,
    tenant_id: record.tenant_id,
    mission_scope: record.mission_scope,
    event_type: record.event_type,
    lifecycle_state: record.lifecycle_state,
    replay_refs: record.replay_refs,
    evidence_refs: record.evidence_refs,
    simulation_refs: record.simulation_refs,
    governance_refs: record.governance_refs,
    operator_refs: record.operator_refs,
    certification_refs: record.certification_refs,
    rollback_refs: record.rollback_refs,
    integrity_hash: record.integrity_hash,
    previous_hash: record.previous_hash,
    timestamp: record.event_timestamp,
  })));
}

function matchesQuery(record: AdaptiveLedgerRecord, query: AdaptiveLedgerQuery): boolean {
  return (!query.proposal_id || record.proposal_id === query.proposal_id)
    && (!query.adaptation_id || record.adaptation_id === query.adaptation_id)
    && (!query.tenant_id || record.tenant_id === query.tenant_id)
    && (!query.mission || record.mission_scope.includes(query.mission))
    && (!query.event_type || record.event_type === query.event_type)
    && (!query.lifecycle_state || record.lifecycle_state === query.lifecycle_state)
    && (!query.governance_ref || record.governance_refs.includes(query.governance_ref))
    && (!query.certification_ref || record.certification_refs.includes(query.certification_ref))
    && (!query.replay_ref || record.replay_refs.includes(query.replay_ref))
    && (!query.integrity_hash || record.integrity_hash === query.integrity_hash);
}

function defaultQuery(source: OperatorApprovalFrameworkResult): AdaptiveLedgerQuery {
  return Object.freeze({
    query_id: "adaptive_ledger_query_all",
    tenant_id: source.approval_record.tenant_id,
    proposal_id: source.approval_record.proposal_id,
  });
}

function buildReader(source: OperatorApprovalFrameworkResult, records: readonly AdaptiveLedgerRecord[], query: AdaptiveLedgerQuery, role: VisibilityRole, scenario: Scenario): AdaptiveLedgerReaderResult {
  const readAuthorized = scenario !== "UNAUTHORIZED_READ" && visibleToRole(source, role);
  const matched = readAuthorized ? records.filter((record) => matchesQuery(record, query)).sort((a, b) => a.ledger_sequence - b.ledger_sequence) : [];
  const base: Omit<AdaptiveLedgerReaderResult, "integrity_hash"> = {
    reader_id: "adaptive_ledger_reader",
    query,
    records: freezeArray(matched),
    chronological_order_preserved: matched.every((record, index) => index === 0 || record.ledger_sequence >= matched[index - 1].ledger_sequence),
    tenant_isolated: matched.every((record) => !query.tenant_id || record.tenant_id === query.tenant_id),
    read_authorized: readAuthorized,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildWriter(records: readonly AdaptiveLedgerRecord[], scenario: Scenario): AdaptiveLedgerWriterConfirmation {
  const base: Omit<AdaptiveLedgerWriterConfirmation, "integrity_hash"> = {
    writer_id: "adaptive_ledger_writer",
    records_appended: records.length,
    assigned_sequences: freezeArray(records.map((record) => record.ledger_sequence)),
    first_record_id: records[0]?.record_id ?? "",
    last_record_id: records[records.length - 1]?.record_id ?? "",
    append_only: records.every((record) => record.append_only && !record.deleted),
    overwrite_attempted: scenario === "APPEND_OVERWRITE" || scenario === "RECORD_MODIFICATION" || scenario === "HISTORY_REWRITE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: OperatorApprovalFrameworkResult;
  records: readonly AdaptiveLedgerRecord[];
  reader: AdaptiveLedgerReaderResult;
  writer: AdaptiveLedgerWriterConfirmation;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AdaptiveLedgerFailure[] {
  const failures: AdaptiveLedgerFailure[] = [];
  const ids = input.records.map((record) => record.record_id);
  if (input.records.some((record) => !record.record_id || !record.event_summary || record.schema_version !== RECORD_SCHEMA_VERSION) || input.scenario === "SCHEMA_INVALID") failures.push("SCHEMA_INVALID");
  if (input.records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.records.some((record) => !record.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (input.records.some((record, index) => record.ledger_sequence !== index + 1)) failures.push("SEQUENCE_VIOLATION");
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_LEDGER_IDENTIFIER");
  if (input.records.some((record) => record.tenant_id !== input.source.approval_record.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (input.records.some((record) => !record.evidence_refs.length || !record.governance_refs.length) || input.scenario === "LINEAGE_INCOMPLETE") failures.push("LINEAGE_INCOMPLETE");
  if (!input.writer.append_only || input.writer.overwrite_attempted) failures.push("APPEND_OVERWRITE_ATTEMPTED");
  if (input.records.some((record, index) => index === 0 ? record.previous_hash !== "GENESIS" : record.previous_hash !== input.records[index - 1].integrity_hash)) failures.push("PREVIOUS_HASH_INVALID");
  if (input.records.some((record) => record.parent_record_refs.some((ref) => !ids.includes(ref)) || record.child_record_refs.some((ref) => !ids.includes(ref)))) failures.push("PARENT_CHILD_INCONSISTENT");
  if (input.scenario === "RECORD_MODIFICATION") failures.push("RECORD_MODIFICATION_ATTEMPTED");
  if (input.records.some((record) => record.deleted) || input.scenario === "RECORD_DELETION") failures.push("RECORD_DELETION_ATTEMPTED");
  if (input.scenario === "HISTORY_REWRITE") failures.push("HISTORY_REWRITE_ATTEMPTED");
  if (input.scenario === "HASH_TAMPERING") failures.push("HASH_TAMPERING");
  if (input.scenario === "HIDDEN_LEDGER_ENTRY" || !ADAPTIVE_LEDGER_EVENT_TYPES.every((eventType) => input.records.some((record) => record.event_type === eventType))) failures.push("HIDDEN_LEDGER_ENTRY");
  if (input.scenario === "UNAUTHORIZED_WRITE" || input.records.some((record) => record.recorded_by !== "system:adaptive-ledger-writer")) failures.push("UNAUTHORIZED_WRITE");
  if (!input.reader.read_authorized || input.scenario === "UNAUTHORIZED_READ" || !visibleToRole(input.source, input.role)) failures.push("UNAUTHORIZED_READ");
  if (input.scenario === "TENANT_CROSSOVER") failures.push("TENANT_CROSSOVER");
  if (input.scenario === "CHAIN_CORRUPTION") failures.push("CHAIN_CORRUPTION");
  if (!input.records.some((record) => record.event_type === "OPERATOR_APPROVAL")) failures.push("APPROVAL_RECORD_MISSING");
  if (!input.records.some((record) => record.event_type === "CERTIFICATION")) failures.push("CERTIFICATION_RECORD_MISSING");
  if (input.records.some((record) => record.event_type === "ROLLBACK" && (!record.rollback_refs.length || !record.replay_refs.length))) failures.push("ROLLBACK_REPLAY_MISSING");
  if (!input.records.some((record) => record.event_type === "REJECTION")) failures.push("REJECTION_RECORD_MISSING");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_LEDGER_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildIntegrityReport(records: readonly AdaptiveLedgerRecord[], failures: readonly AdaptiveLedgerFailure[]): AdaptiveLedgerIntegrityReport {
  const has = (failure: AdaptiveLedgerFailure) => failures.includes(failure);
  const base: Omit<AdaptiveLedgerIntegrityReport, "integrity_hash"> = {
    report_id: "adaptive_ledger_integrity_report",
    checks: ADAPTIVE_LEDGER_CHECKS,
    schema_integrity: !has("SCHEMA_INVALID"),
    sequence_integrity: !has("SEQUENCE_VIOLATION") && !has("DUPLICATE_LEDGER_IDENTIFIER"),
    parent_child_consistency: !has("PARENT_CHILD_INCONSISTENT"),
    hash_integrity: !has("INTEGRITY_HASH_MISMATCH") && !has("HASH_TAMPERING"),
    previous_hash_chain_valid: !has("PREVIOUS_HASH_INVALID") && !has("CHAIN_CORRUPTION"),
    replay_references_complete: !has("REPLAY_REFERENCES_MISSING") && !has("ROLLBACK_REPLAY_MISSING"),
    lineage_complete: !has("LINEAGE_INCOMPLETE"),
    tenant_isolation_preserved: !has("TENANT_ISOLATION_VIOLATED") && !has("TENANT_CROSSOVER"),
    append_only_preserved: records.every((record) => record.append_only && !record.deleted) && !has("APPEND_OVERWRITE_ATTEMPTED"),
    deterministic_replay_verified: !has("CHAIN_CORRUPTION") && !has("HIDDEN_LEDGER_ENTRY"),
    failure_analysis: failures,
    validation_result: state(failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(records: readonly AdaptiveLedgerRecord[], failures: readonly AdaptiveLedgerFailure[]): AdaptiveLedgerReplayResult {
  const base: Omit<AdaptiveLedgerReplayResult, "integrity_hash"> = {
    replay_id: "adaptive_ledger_replay",
    records_replayed: records.length,
    event_types_reconstructed: freezeArray([...new Set(records.map((record) => record.event_type))]),
    lifecycle_states_reconstructed: freezeArray([...new Set(records.map((record) => record.lifecycle_state))]),
    identical_history: !failures.includes("HISTORY_REWRITE_ATTEMPTED") && !failures.includes("HIDDEN_LEDGER_ENTRY"),
    identical_hash_chain: !failures.includes("PREVIOUS_HASH_INVALID") && !failures.includes("CHAIN_CORRUPTION") && !failures.includes("INTEGRITY_HASH_MISMATCH"),
    deterministic_result: state(!failures.includes("HISTORY_REWRITE_ATTEMPTED") && !failures.includes("HIDDEN_LEDGER_ENTRY") && !failures.includes("CHAIN_CORRUPTION")),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIndex(records: readonly AdaptiveLedgerRecord[]): AdaptiveLedgerIndex {
  const base: Omit<AdaptiveLedgerIndex, "integrity_hash"> = {
    index_id: "adaptive_ledger_index",
    by_proposal: freezeArray([...new Set(records.map((record) => record.proposal_id))]),
    by_adaptation: freezeArray([...new Set(records.map((record) => record.adaptation_id))]),
    by_tenant: freezeArray([...new Set(records.map((record) => record.tenant_id))]),
    by_mission: freezeArray([...new Set(records.flatMap((record) => record.mission_scope))]),
    by_event_type: freezeArray([...new Set(records.map((record) => record.event_type))]),
    by_lifecycle_state: freezeArray([...new Set(records.map((record) => record.lifecycle_state))]),
    by_governance_ref: freezeArray([...new Set(records.flatMap((record) => record.governance_refs))]),
    by_certification_ref: freezeArray([...new Set(records.flatMap((record) => record.certification_refs))]),
    by_replay_ref: freezeArray([...new Set(records.flatMap((record) => record.replay_refs))]),
    by_integrity_hash: freezeArray(records.map((record) => record.integrity_hash)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRetentionPolicy(): AdaptiveLedgerRetentionPolicy {
  const base: Omit<AdaptiveLedgerRetentionPolicy, "integrity_hash"> = {
    policy_id: "adaptive_ledger_retention_policy",
    retention_mode: "PERMANENT",
    deletion_permitted: false,
    mutation_permitted: false,
    history_rewrite_permitted: false,
    tenant_isolation_required: true,
    rollback_records_retained: true,
    rejection_records_retained: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboard(records: readonly AdaptiveLedgerRecord[], report: AdaptiveLedgerIntegrityReport, replay: AdaptiveLedgerReplayResult): AdaptiveLedgerDashboard {
  const base: Omit<AdaptiveLedgerDashboard, "integrity_hash"> = {
    dashboard_id: "adaptive_ledger_dashboard",
    ledger_growth: records.length,
    append_activity: records.length,
    integrity_validation_status: report.validation_result,
    replay_completeness: replay.deterministic_result,
    lifecycle_distribution: freezeArray([...new Set(records.map((record) => record.lifecycle_state))]),
    governance_events: records.filter((record) => record.event_type === "GOVERNANCE_REVIEW").length,
    approval_history: records.filter((record) => record.event_type === "OPERATOR_APPROVAL").length,
    certification_history: records.filter((record) => record.event_type === "CERTIFICATION").length,
    rollback_history: records.filter((record) => record.event_type === "ROLLBACK").length,
    rejection_statistics: records.filter((record) => record.event_type === "REJECTION").length,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertification(source: OperatorApprovalFrameworkResult, records: readonly AdaptiveLedgerRecord[], failures: readonly AdaptiveLedgerFailure[]): AdaptiveLedgerCertificationReport {
  const has = (failure: AdaptiveLedgerFailure) => failures.includes(failure);
  const base: Omit<AdaptiveLedgerCertificationReport, "integrity_hash"> = {
    report_id: "adaptive_ledger_certification_report",
    tenant_id: source.approval_record.tenant_id,
    checks: ADAPTIVE_LEDGER_CHECKS,
    all_lifecycle_events_recorded: ADAPTIVE_LEDGER_EVENT_TYPES.every((eventType) => records.some((record) => record.event_type === eventType)),
    append_only_compliant: !has("APPEND_OVERWRITE_ATTEMPTED"),
    reproducible_hashes: !has("INTEGRITY_HASH_MISMATCH") && !has("HASH_TAMPERING"),
    no_overwritten_records: !has("APPEND_OVERWRITE_ATTEMPTED") && !has("RECORD_MODIFICATION_ATTEMPTED"),
    no_deleted_records: !has("RECORD_DELETION_ATTEMPTED"),
    replay_complete: !has("REPLAY_REFERENCES_MISSING") && !has("ROLLBACK_REPLAY_MISSING"),
    deterministic_replay: !has("CHAIN_CORRUPTION") && !has("HISTORY_REWRITE_ATTEMPTED"),
    tenant_isolation_complete: !has("TENANT_ISOLATION_VIOLATED") && !has("TENANT_CROSSOVER"),
    auditability_complete: !has("HIDDEN_LEDGER_ENTRY") && !has("UNAUTHORIZED_READ") && !has("UNAUTHORIZED_WRITE"),
    failure_analysis: failures,
    certification_decision: state(failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(failures: readonly AdaptiveLedgerFailure[]): AdaptiveLedgerValidation {
  const has = (failure: AdaptiveLedgerFailure) => failures.includes(failure);
  const base: Omit<AdaptiveLedgerValidation, "integrity_hash"> = {
    validation_id: "adaptive_ledger_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    schema_valid: !has("SCHEMA_INVALID"),
    hash_integrity: !has("INTEGRITY_HASH_MISMATCH") && !has("HASH_TAMPERING"),
    replay_references_present: !has("REPLAY_REFERENCES_MISSING") && !has("ROLLBACK_REPLAY_MISSING"),
    sequence_valid: !has("SEQUENCE_VIOLATION") && !has("DUPLICATE_LEDGER_IDENTIFIER"),
    ledger_identifiers_unique: !has("DUPLICATE_LEDGER_IDENTIFIER"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED") && !has("TENANT_CROSSOVER"),
    lineage_complete: !has("LINEAGE_INCOMPLETE"),
    append_only: !has("APPEND_OVERWRITE_ATTEMPTED") && !has("RECORD_MODIFICATION_ATTEMPTED") && !has("RECORD_DELETION_ATTEMPTED") && !has("HISTORY_REWRITE_ATTEMPTED"),
    previous_hash_valid: !has("PREVIOUS_HASH_INVALID") && !has("CHAIN_CORRUPTION"),
    parent_child_consistent: !has("PARENT_CHILD_INCONSISTENT"),
    read_authorized: !has("UNAUTHORIZED_READ"),
    write_authorized: !has("UNAUTHORIZED_WRITE"),
    deterministic_replay: !has("HIDDEN_LEDGER_ENTRY") && !has("CHAIN_CORRUPTION"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveIntelligenceLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    writer: result.writer_confirmation,
    records: result.records,
    reader: result.reader_result,
    integrity: result.integrity_report,
    replay: result.replay_result,
    index: result.index,
    retention: result.retention_policy,
    certification: result.certification_report,
    validation: result.validation,
  });
}

export function runAdaptiveIntelligenceLedger(input: AdaptiveIntelligenceLedgerInput = {}): AdaptiveIntelligenceLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const approval_framework = sourceForScenario(input, scenario);
  const records = buildRecords(approval_framework, scenario);
  const events = buildEvents(records);
  const query = input.query ?? defaultQuery(approval_framework);
  const reader_result = buildReader(approval_framework, records, query, role, scenario);
  const writer_confirmation = buildWriter(records, scenario);
  const failures = collectFailures({ source: approval_framework, records, reader: reader_result, writer: writer_confirmation, role, scenario });
  const integrity_report = buildIntegrityReport(records, failures);
  const replay_result = buildReplay(records, failures);
  const index = buildIndex(records);
  const retention_policy = buildRetentionPolicy();
  const dashboard = buildDashboard(records, integrity_report, replay_result);
  const certification_report = buildCertification(approval_framework, records, failures);
  const validation = buildValidation(failures);
  const base: Omit<AdaptiveIntelligenceLedgerResult, "integrity_hash" | "replay_hash"> = {
    ledger_version: LEDGER_VERSION,
    approval_framework,
    writer_confirmation,
    records,
    events,
    reader_result,
    integrity_report,
    replay_result,
    index,
    retention_policy,
    dashboard,
    certification_report,
    validation,
    deterministic: true,
    replayable: true,
    append_only: true,
    tenant_isolated: validation.tenant_isolated,
    mutates_history: false,
    permits_record_deletion: false,
    permits_overwrite: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAdaptiveIntelligenceLedger(result: AdaptiveIntelligenceLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAdaptiveLedgerRecordHash(record: Omit<AdaptiveLedgerRecord, "integrity_hash"> | AdaptiveLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

export function getAdaptiveIntelligenceLedgerFoundation(): AdaptiveIntelligenceLedgerFoundation {
  return Object.freeze({
    ledger_version: LEDGER_VERSION,
    checks: ADAPTIVE_LEDGER_CHECKS,
    event_types: ADAPTIVE_LEDGER_EVENT_TYPES,
    lifecycle_states: ADAPTIVE_LEDGER_LIFECYCLE_STATES,
    result: runAdaptiveIntelligenceLedger(),
  });
}

export const AdaptiveIntelligenceLedger = Object.freeze({
  run: runAdaptiveIntelligenceLedger,
  replay: replayAdaptiveIntelligenceLedger,
});
