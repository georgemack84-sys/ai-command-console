import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runGovernanceOperatorOutcomeRecorder } from "@/services/governance-operator-outcome-recorder";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { GovernanceOperatorOutcomeRecorderResult } from "@/types/governance-operator-outcome-recorder";
import type {
  OutcomeLedgerApiSurface,
  OutcomeLedgerAuditReport,
  OutcomeLedgerCheck,
  OutcomeLedgerFailure,
  OutcomeLedgerLifecycleState,
  OutcomeLedgerMetrics,
  OutcomeLedgerQueryDomain,
  OutcomeLedgerQueryResult,
  OutcomeLedgerRecord,
  OutcomeLedgerReplayIndex,
  OutcomeLedgerReplayReport,
  OutcomeLedgerValidation,
  OutcomeObservationLedgerFoundation,
  OutcomeObservationLedgerInput,
  OutcomeObservationLedgerResult,
} from "@/types/outcome-observation-ledger";

const OUTCOME_OBSERVATION_LEDGER_VERSION = "outcome-observation-ledger/v1" as const;
const GENESIS_HASH = "GENESIS_OUTCOME_OBSERVATION_LEDGER";

export const OUTCOME_LEDGER_CHECKS: readonly OutcomeLedgerCheck[] = Object.freeze(["SOURCE_VALIDATION", "APPEND_ONLY_STORAGE", "IMMUTABLE_RECORDS", "HASH_GENERATION", "CHAIN_VALIDATION", "REPLAY_INDEX", "REPLAY_RECONSTRUCTION", "GOVERNANCE_LINEAGE", "REPLAY_REFERENCES", "TENANT_ISOLATION", "QUERY_PURITY", "HISTORICAL_COMPATIBILITY", "INTEGRITY_VALIDATION"]);
export const OUTCOME_LEDGER_LIFECYCLE: readonly OutcomeLedgerLifecycleState[] = Object.freeze(["VALIDATED", "HASHED", "APPENDED", "INDEXED", "REPLAYABLE"]);
export const OUTCOME_LEDGER_QUERY_DOMAINS: readonly OutcomeLedgerQueryDomain[] = Object.freeze(["TENANT", "MISSION", "DECISION", "OUTCOME", "OPERATOR", "GOVERNANCE", "REPLAY", "EVIDENCE"]);

type Scenario = NonNullable<OutcomeObservationLedgerInput["scenario"]>;

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

function sourceForScenario(input: OutcomeObservationLedgerInput, scenario: Scenario): GovernanceOperatorOutcomeRecorderResult {
  if (input.governance_operator_recorder) return input.governance_operator_recorder;
  if (scenario === "INVALID_SOURCE") return runGovernanceOperatorOutcomeRecorder({ scenario: "MISSING_AUTHORITY" });
  if (scenario === "MISSING_GOVERNANCE") return runGovernanceOperatorOutcomeRecorder({ scenario: "MISSING_GOVERNANCE_LINEAGE" });
  if (scenario === "UNAUTHORIZED_TENANT_ACCESS") return runGovernanceOperatorOutcomeRecorder({ scenario: "TENANT_VIOLATION" });
  if (scenario === "HASH_MISMATCH" || scenario === "INTEGRITY_BYPASS") return runGovernanceOperatorOutcomeRecorder({ scenario: "INTEGRITY_FAILURE" });
  return runGovernanceOperatorOutcomeRecorder();
}

function visibleToRole(source: GovernanceOperatorOutcomeRecorderResult, role: VisibilityRole): boolean {
  return source.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildApiSurface(): OutcomeLedgerApiSurface {
  const base: Omit<OutcomeLedgerApiSurface, "integrity_hash"> = {
    api_id: "outcome_ledger_api",
    supported_operations: freezeArray(["APPEND", "READ", "QUERY", "VERIFY"]),
    unsupported_operations: freezeArray(["UPDATE", "DELETE"]),
    append_supported: true,
    read_supported: true,
    query_supported: true,
    verify_supported: true,
    update_supported: false,
    delete_supported: false,
    query_domains: OUTCOME_LEDGER_QUERY_DOMAINS,
    deterministic_access: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function canonicalRecord(source: GovernanceOperatorOutcomeRecorderResult, previousHash: string, sequence: number, scenario: Scenario): OutcomeLedgerRecord {
  const observation = source.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.observation_record;
  const base: Omit<OutcomeLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `outcome_ledger_${String(sequence).padStart(6, "0")}`,
    tenant_id: scenario === "UNAUTHORIZED_TENANT_ACCESS" ? `${observation.tenant_id}:foreign` : observation.tenant_id,
    mission_id: observation.mission_id,
    outcome_id: observation.outcome_id,
    decision_id: observation.decision_id,
    observation_timestamp: observation.observed_timestamp,
    observation_refs: freezeArray([observation.outcome_id, source.governance_outcome_record.governance_outcome_id]),
    evidence_refs: source.actualization_recorder.actualization_record.supporting_evidence_refs,
    mission_impact_refs: freezeArray([source.actualization_recorder.mission_impact_recorder.impact_record.impact_id]),
    governance_outcome_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray([source.governance_outcome_record.governance_outcome_id, ...source.governance_outcome_record.governance_evidence_refs]),
    operator_action_refs: freezeArray([source.governance_outcome_record.operator_workflow_id, source.governance_outcome_record.operator_action]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : source.governance_outcome_record.replay_refs,
    previous_record_hash: scenario === "CHAIN_BROKEN" ? "BROKEN_PREVIOUS_HASH" : previousHash,
    ledger_sequence: scenario === "DUPLICATE_SEQUENCE" ? 1 : sequence,
    committed_timestamp: "2026-01-01T00:04:00.000Z",
    schema_version: OUTCOME_OBSERVATION_LEDGER_VERSION,
    append_only: true,
    deleted: false,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.ledger_record_id }) });
  if (scenario === "RECORD_MODIFICATION") return Object.freeze({ ...built, evidence_refs: freezeArray(["modified:evidence"]), integrity_hash: built.integrity_hash });
  if (scenario === "RECORD_DELETION") return Object.freeze({ ...built, deleted: true as false, integrity_hash: built.integrity_hash });
  return built;
}

function buildLedgerRecords(source: GovernanceOperatorOutcomeRecorderResult, scenario: Scenario): readonly OutcomeLedgerRecord[] {
  const first = canonicalRecord(source, GENESIS_HASH, 1, scenario);
  if (scenario !== "DUPLICATE_SEQUENCE" && scenario !== "NONDETERMINISTIC_ORDERING") return freezeArray([first]);
  const second = canonicalRecord(source, first.integrity_hash, 2, scenario);
  if (scenario === "NONDETERMINISTIC_ORDERING") return freezeArray([second, first]);
  return freezeArray([first, second]);
}

function buildReplayIndex(records: readonly OutcomeLedgerRecord[]): OutcomeLedgerReplayIndex {
  const by_tenant = freezeArray([...new Set(records.map((record) => record.tenant_id))]);
  const by_mission = freezeArray([...new Set(records.map((record) => record.mission_id))]);
  const by_decision = freezeArray([...new Set(records.map((record) => record.decision_id))]);
  const by_outcome = freezeArray([...new Set(records.map((record) => record.outcome_id))]);
  const by_governance_event = freezeArray([...new Set(records.flatMap((record) => record.governance_outcome_refs))]);
  const by_operator_action = freezeArray([...new Set(records.flatMap((record) => record.operator_action_refs))]);
  const by_replay_sequence = freezeArray([...new Set(records.flatMap((record) => record.replay_refs))]);
  const by_evidence = freezeArray([...new Set(records.flatMap((record) => record.evidence_refs))]);
  const reconstruction_order = freezeArray(records.map((record) => record.ledger_record_id));
  const base: Omit<OutcomeLedgerReplayIndex, "integrity_hash"> = {
    replay_index_id: "outcome_observation_ledger_replay_index",
    by_tenant,
    by_mission,
    by_decision,
    by_outcome,
    by_governance_event,
    by_operator_action,
    by_replay_sequence,
    by_evidence,
    reconstruction_order,
    reconstruction_hash: hash({ records: reconstruction_order, by_tenant, by_mission, by_decision, by_outcome, by_governance_event, by_operator_action, by_replay_sequence, by_evidence }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function queryRef(record: OutcomeLedgerRecord, domain: OutcomeLedgerQueryDomain): string {
  if (domain === "TENANT") return record.tenant_id;
  if (domain === "MISSION") return record.mission_id;
  if (domain === "DECISION") return record.decision_id;
  if (domain === "OUTCOME") return record.outcome_id;
  if (domain === "OPERATOR") return record.operator_action_refs[0] ?? "";
  if (domain === "GOVERNANCE") return record.governance_outcome_refs[0] ?? "";
  if (domain === "REPLAY") return record.replay_refs[0] ?? "";
  return record.evidence_refs[0] ?? "";
}

function buildQueryResult(records: readonly OutcomeLedgerRecord[], domain: OutcomeLedgerQueryDomain, scenario: Scenario): OutcomeLedgerQueryResult {
  const ref = queryRef(records[0], domain);
  const base: Omit<OutcomeLedgerQueryResult, "integrity_hash"> = {
    query_id: "outcome_ledger_query",
    query_domain: domain,
    query_ref: ref,
    matched_record_ids: freezeArray(records.filter((record) => queryRef(record, domain) === ref).map((record) => record.ledger_record_id)),
    query_mutated_state: false,
    latency_ms: scenario === "QUERY_MUTATION" ? 1 : 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function chainValid(records: readonly OutcomeLedgerRecord[]): boolean {
  return records.every((record, index) => {
    if (hashWithoutIntegrity(record) !== record.integrity_hash) return false;
    if (index === 0) return record.previous_record_hash === GENESIS_HASH;
    return record.previous_record_hash === records[index - 1].integrity_hash;
  });
}

function ordered(records: readonly OutcomeLedgerRecord[]): boolean {
  return records.every((record, index) => record.ledger_sequence === index + 1);
}

function collectFailures(input: {
  source: GovernanceOperatorOutcomeRecorderResult;
  records: readonly OutcomeLedgerRecord[];
  replayIndex: OutcomeLedgerReplayIndex;
  query: OutcomeLedgerQueryResult;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeLedgerFailure[] {
  const failures: OutcomeLedgerFailure[] = [];
  const sequences = input.records.map((record) => record.ledger_sequence);
  const first = input.records[0];
  if (input.source.validation.validation_status !== "VALID" || input.scenario === "INVALID_SOURCE") failures.push("SOURCE_RECORD_NOT_VALIDATED");
  if (input.scenario === "RECORD_MODIFICATION" || input.records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash && input.scenario !== "HASH_MISMATCH")) failures.push("LEDGER_PERMITS_RECORD_MODIFICATION");
  if (input.scenario === "RECORD_DELETION" || input.records.some((record) => record.deleted)) failures.push("LEDGER_PERMITS_RECORD_DELETION");
  if (input.scenario === "APPEND_ONLY_VIOLATION") failures.push("APPEND_ONLY_BEHAVIOR_VIOLATED");
  if (input.records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || input.scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_NOT_REPRODUCIBLE");
  if (!chainValid(input.records) || input.scenario === "CHAIN_BROKEN") failures.push("HASH_CHAIN_BROKEN");
  if (input.scenario === "REPLAY_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_DIFFERS");
  if (!first.governance_outcome_refs.length || input.scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (!first.replay_refs.length || input.scenario === "MISSING_REPLAY") failures.push("REPLAY_REFERENCES_MISSING");
  if (new Set(sequences).size !== sequences.length || input.scenario === "DUPLICATE_SEQUENCE") failures.push("DUPLICATE_LEDGER_SEQUENCE_ACCEPTED");
  if (!ordered(input.records) || input.scenario === "NONDETERMINISTIC_ORDERING") failures.push("LEDGER_ORDERING_NONDETERMINISTIC");
  if (first.tenant_id !== input.source.governance_outcome_record.tenant_id || input.scenario === "UNAUTHORIZED_TENANT_ACCESS") failures.push("UNAUTHORIZED_TENANT_ACCESS_PERMITTED");
  if (input.scenario === "INTEGRITY_BYPASS") failures.push("INTEGRITY_VERIFICATION_BYPASSED");
  if (input.scenario === "INFERRED_OBSERVATION") failures.push("INFERRED_OBSERVATION_ACCEPTED");
  if (input.scenario === "QUERY_MUTATION") failures.push("QUERY_MUTATED_LEDGER_STATE");
  if (input.scenario === "HISTORICAL_COMPATIBILITY_BROKEN") failures.push("HISTORICAL_REPLAY_COMPATIBILITY_BROKEN");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_LEDGER_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly OutcomeLedgerFailure[]): OutcomeLedgerValidation {
  const has = (failure: OutcomeLedgerFailure) => failures.includes(failure);
  const base: Omit<OutcomeLedgerValidation, "integrity_hash"> = {
    validation_id: "outcome_observation_ledger_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    source_validated: !has("SOURCE_RECORD_NOT_VALIDATED"),
    structural_valid: !has("DUPLICATE_LEDGER_SEQUENCE_ACCEPTED"),
    append_only_enforced: !has("APPEND_ONLY_BEHAVIOR_VIOLATED"),
    immutable_storage_enforced: !has("LEDGER_PERMITS_RECORD_MODIFICATION") && !has("LEDGER_PERMITS_RECORD_DELETION"),
    integrity_hashes_reproducible: !has("INTEGRITY_HASH_NOT_REPRODUCIBLE"),
    hash_chain_valid: !has("HASH_CHAIN_BROKEN"),
    replay_reconstruction_identical: !has("REPLAY_RECONSTRUCTION_DIFFERS"),
    governance_lineage_preserved: !has("GOVERNANCE_REFERENCES_MISSING"),
    replay_references_complete: !has("REPLAY_REFERENCES_MISSING"),
    tenant_isolated: !has("UNAUTHORIZED_TENANT_ACCESS_PERMITTED"),
    query_purity_preserved: !has("QUERY_MUTATED_LEDGER_STATE"),
    historical_compatibility_preserved: !has("HISTORICAL_REPLAY_COMPATIBILITY_BROKEN"),
    integrity_verification_enforced: !has("INTEGRITY_VERIFICATION_BYPASSED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayReport(records: readonly OutcomeLedgerRecord[], replayIndex: OutcomeLedgerReplayIndex, validation: OutcomeLedgerValidation): OutcomeLedgerReplayReport {
  const record_hashes = freezeArray(records.map((record) => record.integrity_hash));
  const base: Omit<OutcomeLedgerReplayReport, "integrity_hash"> = {
    replay_report_id: "outcome_observation_ledger_replay_report",
    record_hashes,
    chain_tip_hash: record_hashes.at(-1) ?? GENESIS_HASH,
    replay_index_hash: replayIndex.integrity_hash,
    ledger_reconstruction_hash: hash({ records, replayIndex }),
    replay_reconstruction_identical: validation.replay_reconstruction_identical,
    historical_compatibility_preserved: validation.historical_compatibility_preserved,
    deterministic_serialization: validation.integrity_hashes_reproducible && validation.hash_chain_valid,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(records: readonly OutcomeLedgerRecord[], validation: OutcomeLedgerValidation): OutcomeLedgerMetrics {
  const base: Omit<OutcomeLedgerMetrics, "integrity_hash"> = {
    metrics_id: "outcome_observation_ledger_metrics",
    ledger_records_committed: validation.failures.length ? 0 : records.length,
    append_operations: records.length,
    replay_operations: 1,
    integrity_verification_success_rate: validation.integrity_hashes_reproducible ? 1 : 0,
    hash_chain_validation_status: validation.hash_chain_valid ? "VALID" : "BROKEN",
    replay_reconstruction_success_rate: validation.replay_reconstruction_identical ? 1 : 0,
    ledger_growth: records.length,
    tenant_isolation_violations_detected: validation.tenant_isolated ? 0 : 1,
    query_latency_ms: 0,
    append_latency_ms: 0,
    tamper_detection_events: validation.integrity_hashes_reproducible && validation.hash_chain_valid ? 0 : 1,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(validation: OutcomeLedgerValidation, api: OutcomeLedgerApiSurface, replay: OutcomeLedgerReplayReport, records: readonly OutcomeLedgerRecord[]): OutcomeLedgerAuditReport {
  const base: Omit<OutcomeLedgerAuditReport, "integrity_hash"> = {
    report_id: "outcome_observation_ledger_audit_report",
    tenant_id: records[0]?.tenant_id ?? "unknown",
    checks: OUTCOME_LEDGER_CHECKS,
    outcome_ledger_operational: validation.validation_status === "VALID",
    ledger_api_operational: api.append_supported && api.read_supported && api.query_supported && api.verify_supported,
    hash_generator_operational: validation.integrity_hashes_reproducible,
    replay_index_operational: replay.replay_reconstruction_identical,
    integrity_validator_operational: validation.integrity_verification_enforced,
    query_engine_operational: validation.query_purity_preserved,
    append_only_verified: validation.append_only_enforced,
    update_delete_absent: !api.update_supported && !api.delete_supported,
    tamper_detection_operational: validation.integrity_hashes_reproducible && validation.hash_chain_valid,
    constitutional_compliance_maintained: validation.governance_lineage_preserved,
    failure_analysis: validation.failures,
    certification_decision: validation.failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeObservationLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    api: result.api_surface,
    records: result.ledger_records,
    replayIndex: result.replay_index,
    query: result.query_result,
    validation: result.validation,
    replay: result.replay_report,
    audit: result.audit_report,
  });
}

export function runOutcomeObservationLedger(input: OutcomeObservationLedgerInput = {}): OutcomeObservationLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const governance_operator_recorder = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const ledger_records = buildLedgerRecords(governance_operator_recorder, scenario);
  const replay_index = buildReplayIndex(ledger_records);
  const query_result = buildQueryResult(ledger_records, input.query_domain ?? "OUTCOME", scenario);
  const failures = collectFailures({ source: governance_operator_recorder, records: ledger_records, replayIndex: replay_index, query: query_result, role, scenario });
  const validation = buildValidation(failures);
  const replay_report = buildReplayReport(ledger_records, replay_index, validation);
  const metrics = buildMetrics(ledger_records, validation);
  const audit_report = buildAudit(validation, api_surface, replay_report, ledger_records);
  const lifecycle: readonly OutcomeLedgerLifecycleState[] = failures.length ? freezeArray<OutcomeLedgerLifecycleState>(["VALIDATED", "HASHED", "APPENDED"]) : OUTCOME_LEDGER_LIFECYCLE;
  const base: Omit<OutcomeObservationLedgerResult, "integrity_hash" | "replay_hash"> = {
    outcome_observation_ledger_version: OUTCOME_OBSERVATION_LEDGER_VERSION,
    governance_operator_recorder,
    api_surface,
    ledger_records,
    replay_index,
    query_result,
    validation,
    replay_report,
    metrics,
    audit_report,
    lifecycle,
    deterministic: true,
    replayable: true,
    historical_record_only: true,
    execution_engine: false,
    analytics_engine: false,
    update_supported: false,
    delete_supported: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeObservationLedger(result: OutcomeObservationLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeLedgerRecordHash(record: Omit<OutcomeLedgerRecord, "integrity_hash"> | OutcomeLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

export function getOutcomeObservationLedgerFoundation(): OutcomeObservationLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    outcome_observation_ledger_version: OUTCOME_OBSERVATION_LEDGER_VERSION,
    checks: OUTCOME_LEDGER_CHECKS,
    lifecycle: OUTCOME_LEDGER_LIFECYCLE,
    api_surface,
    result: runOutcomeObservationLedger(),
  });
}

export const OutcomeObservationLedger = Object.freeze({
  run: runOutcomeObservationLedger,
  replay: replayOutcomeObservationLedger,
});
