import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { correlateFeedbackEvidence, replayFeedbackEvidenceCorrelation } from "@/services/feedback-evidence-correlation";
import type { FeedbackEvidenceCorrelationInput } from "@/types/feedback-evidence-correlation";
import type {
  OperatorFeedbackAdaptationUsageRecord,
  OperatorFeedbackCertificationLineageRecord,
  OperatorFeedbackEvidenceHistoryRecord,
  OperatorFeedbackHistoryRecord,
  OperatorFeedbackLedgerApiSurface,
  OperatorFeedbackLedgerAuditEvent,
  OperatorFeedbackLedgerFailure,
  OperatorFeedbackLedgerFoundation,
  OperatorFeedbackLedgerInput,
  OperatorFeedbackLedgerRecord,
  OperatorFeedbackLedgerResult,
  OperatorFeedbackLedgerScenario,
  OperatorFeedbackLedgerState,
  OperatorFeedbackReplayLedgerRecord,
  OperatorFeedbackLedgerIntegrityReport,
  OperatorFeedbackSimulationUsageRecord,
} from "@/types/operator-feedback-ledger";

const LEDGER_VERSION = "operator-feedback-ledger/v1" as const;
const RECORD_VERSION = "operator-feedback-ledger-record/v1" as const;
const AUDIT_VERSION = "operator-feedback-ledger-audit/v1" as const;
const REPLAY_VERSION = "operator-feedback-replay/v1" as const;
const LEDGER_TIMESTAMP = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<OperatorFeedbackLedgerInput["scenario"]>;

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

function buildApiSurface(): OperatorFeedbackLedgerApiSurface {
  const base: Omit<OperatorFeedbackLedgerApiSurface, "integrity_hash"> = {
    api_id: "operator_feedback_ledger_api",
    append_record: "POST /operator-feedback-ledger/append",
    retrieve_records: "POST /operator-feedback-ledger/records",
    retrieve_replay_ledger: "POST /operator-feedback-ledger/replay-ledger",
    retrieve_approval_history: "POST /operator-feedback-ledger/approval-history",
    retrieve_override_history: "POST /operator-feedback-ledger/override-history",
    retrieve_rejection_history: "POST /operator-feedback-ledger/rejection-history",
    retrieve_evidence_history: "POST /operator-feedback-ledger/evidence-history",
    retrieve_adaptation_usage: "POST /operator-feedback-ledger/adaptation-usage",
    retrieve_simulation_usage: "POST /operator-feedback-ledger/simulation-usage",
    retrieve_certification_lineage: "POST /operator-feedback-ledger/certification-lineage",
    retrieve_integrity: "POST /operator-feedback-ledger/integrity",
    replay_ledger: "POST /operator-feedback-ledger/replay",
    retrieve_audit: "POST /operator-feedback-ledger/audit",
    retrieve_contract: "GET /operator-feedback-ledger/contract",
    append_only: true,
    update_supported: false,
    delete_supported: false,
    normalization_supported: false,
    analysis_supported: false,
    adaptive_proposal_generation_supported: false,
    production_mutation_supported: false,
    governance_action_supported: false,
    evidence_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function correlationInputFor(scenario: Scenario): FeedbackEvidenceCorrelationInput {
  if (scenario === "APPROVAL") return { scenario: "APPROVAL_FEEDBACK" };
  if (scenario === "REJECTION") return { scenario: "REJECTION_FEEDBACK" };
  if (scenario === "OVERRIDE") return { scenario: "OVERRIDE_FEEDBACK" };
  if (scenario === "MISSING_REPLAY_REFERENCE") return { scenario: "MISSING_REPLAY_LINEAGE" };
  if (scenario === "MISSING_GOVERNANCE_METADATA") return { scenario: "MISSING_GOVERNANCE_METADATA" };
  if (scenario === "TENANT_MISMATCH" || scenario === "CROSS_TENANT_CONTAMINATION") return { scenario: "CROSS_TENANT" };
  if (scenario === "CORRELATION_REJECTED") return { scenario: "MISSING_EVIDENCE" };
  return { scenario: "BASELINE" };
}

function recordHashPayload(record: Omit<OperatorFeedbackLedgerRecord, "record_hash" | "integrity_hash">): unknown {
  return {
    ledger_record_id: record.ledger_record_id,
    feedback_id: record.feedback_id,
    operator_id: record.operator_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    decision_id: record.decision_id,
    decision_package_id: record.decision_package_id,
    feedback_type: record.feedback_type,
    schema_version: record.schema_version,
    replay_id: record.replay_id,
    parent_hash: record.parent_hash,
    sequence_number: record.sequence_number,
  };
}

function buildRecord(input: OperatorFeedbackLedgerInput): OperatorFeedbackLedgerRecord {
  const scenario = input.scenario ?? "BASELINE";
  const correlation = input.correlation_result ?? correlateFeedbackEvidence(correlationInputFor(scenario));
  const normalized = correlation.normalization_result.normalized_record;
  const feedback = correlation.normalization_result.intake_result.feedback_record;
  const base: Omit<OperatorFeedbackLedgerRecord, "record_hash" | "integrity_hash"> = {
    ledger_record_id: scenario === "DUPLICATE_IDENTIFIER" ? "operator_feedback_ledger_duplicate" : `operator_feedback_ledger_${hash(`${scenario}:${feedback.feedback_id}`).slice(0, 16)}`,
    feedback_id: normalized?.original_feedback_id ?? "",
    operator_id: feedback.operator_id,
    tenant_id: scenario === "TENANT_MISMATCH" ? "tenant_foreign" : feedback.tenant_id,
    mission_id: feedback.mission_id,
    decision_id: feedback.decision_id,
    decision_package_id: feedback.decision_package_id,
    feedback_type: feedback.feedback_type,
    original_feedback: feedback.original_operator_wording,
    normalized_feedback: normalized?.normalized_summary ?? "",
    rationale: feedback.rationale,
    confidence_signal: feedback.confidence_signal,
    governance_metadata_hash: scenario === "MISSING_GOVERNANCE_METADATA" ? "" : feedback.governance_metadata.integrity_hash,
    creation_timestamp: LEDGER_TIMESTAMP,
    schema_version: scenario === "INVALID_SCHEMA_VERSION" ? "operator-feedback-ledger-record/v999" as "operator-feedback-ledger-record/v1" : RECORD_VERSION,
    replay_id: scenario === "MISSING_REPLAY_REFERENCE" ? "" : feedback.replay_id,
    parent_hash: "GENESIS",
    sequence_number: scenario === "ORDERING_VIOLATION" ? 0 : 1,
    append_only: true,
    immutable: true,
    deleted: false,
  };
  const record_hash = hash(recordHashPayload(base));
  const record = Object.freeze({ ...base, record_hash, integrity_hash: hashWithoutIntegrity({ ...base, record_hash }) });
  if (scenario === "INVALID_HASH") return Object.freeze({ ...record, record_hash: "invalid_record_hash" });
  if (scenario === "HISTORICAL_RECORD_MODIFICATION") return Object.freeze({ ...record, immutable: false as true });
  return record;
}

function historyRecord(record: OperatorFeedbackLedgerRecord, type: OperatorFeedbackHistoryRecord["history_type"], correlation = ""): OperatorFeedbackHistoryRecord {
  const base: Omit<OperatorFeedbackHistoryRecord, "integrity_hash"> = {
    history_id: `${type.toLowerCase()}_history_${hash(`${record.ledger_record_id}:${type}`).slice(0, 14)}`,
    history_type: type,
    feedback_id: record.feedback_id,
    recommendation_ref: record.decision_package_id,
    operator_id: record.operator_id,
    rationale: record.rationale,
    evidence_refs: freezeArray([`evidence_history_${record.feedback_id}`, correlation].filter(Boolean)),
    governance_refs: freezeArray([record.governance_metadata_hash].filter(Boolean)),
    replay_refs: freezeArray([record.replay_id].filter(Boolean)),
    mission_context: record.mission_id,
    outcome_ref: `outcome_${hash(record.mission_id).slice(0, 12)}`,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayLedger(record: OperatorFeedbackLedgerRecord, correlationReplayRefs: readonly string[]): OperatorFeedbackReplayLedgerRecord {
  const replayLineage = freezeArray([record.replay_id, ...correlationReplayRefs].filter(Boolean));
  const base: Omit<OperatorFeedbackReplayLedgerRecord, "integrity_hash"> = {
    replay_ledger_id: `operator_feedback_replay_ledger_${hash(record.ledger_record_id).slice(0, 14)}`,
    replay_id: record.replay_id,
    replay_version: REPLAY_VERSION,
    replay_timestamp: LEDGER_TIMESTAMP,
    replay_sequence: record.sequence_number,
    replay_dependencies: freezeArray([record.record_hash]),
    replay_lineage: replayLineage,
    replay_verification_results: replayLineage.length ? freezeArray(["ordering_verified", "lineage_verified", "integrity_verified"]) : freezeArray([]),
    byte_identical: replayLineage.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidenceHistory(record: OperatorFeedbackLedgerRecord, correlationRefs: readonly string[], replayRefs: readonly string[]): OperatorFeedbackEvidenceHistoryRecord {
  const base: Omit<OperatorFeedbackEvidenceHistoryRecord, "integrity_hash"> = {
    evidence_history_id: `operator_feedback_evidence_history_${hash(record.ledger_record_id).slice(0, 14)}`,
    feedback_id: record.feedback_id,
    original_evidence_refs: correlationRefs,
    normalized_evidence_refs: freezeArray([record.normalized_feedback].filter(Boolean)),
    supporting_document_refs: correlationRefs,
    telemetry_refs: freezeArray([`telemetry_${record.mission_id}`]),
    governance_evidence_refs: freezeArray([record.governance_metadata_hash].filter(Boolean)),
    simulation_evidence_refs: freezeArray([`simulation_${record.decision_id}`]),
    replay_refs: replayRefs,
    adaptive_evidence_usage_refs: freezeArray([`adaptive_usage_${record.feedback_id}`]),
    provenance_complete: correlationRefs.length > 0 && replayRefs.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAdaptationUsage(record: OperatorFeedbackLedgerRecord, evidenceRefs: readonly string[], scenario: Scenario): OperatorFeedbackAdaptationUsageRecord {
  const base: Omit<OperatorFeedbackAdaptationUsageRecord, "integrity_hash"> = {
    adaptation_usage_id: `operator_feedback_adaptation_usage_${hash(record.ledger_record_id).slice(0, 14)}`,
    adaptation_proposal_id: `adaptive_proposal_evidence_${hash(record.feedback_id).slice(0, 12)}`,
    referenced_feedback: record.feedback_id,
    referenced_evidence: evidenceRefs,
    usage_timestamp: LEDGER_TIMESTAMP,
    governance_review: record.governance_metadata_hash || "missing_governance",
    simulation_required: scenario === "SIMULATION_USAGE" || scenario === "ADAPTATION_USAGE",
    approval_status: scenario === "ADAPTATION_USAGE" ? "PENDING_REVIEW" : "NOT_REQUESTED",
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSimulationUsage(record: OperatorFeedbackLedgerRecord, replayRefs: readonly string[], scenario: Scenario): OperatorFeedbackSimulationUsageRecord {
  const base: Omit<OperatorFeedbackSimulationUsageRecord, "integrity_hash"> = {
    simulation_usage_id: `operator_feedback_simulation_usage_${hash(record.ledger_record_id).slice(0, 14)}`,
    simulation_id: `simulation_${hash(record.decision_id).slice(0, 12)}`,
    referenced_feedback: record.feedback_id,
    simulation_purpose: "feedback lineage validation",
    simulation_results: scenario === "SIMULATION_USAGE" ? "simulation lineage retained" : "not executed by ledger",
    replay_refs: replayRefs,
    validation_outcome: replayRefs.length ? "VALIDATED" : "PENDING_REVIEW",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertification(record: OperatorFeedbackLedgerRecord, evidenceRefs: readonly string[], replayRefs: readonly string[], failures: readonly OperatorFeedbackLedgerFailure[]): OperatorFeedbackCertificationLineageRecord {
  const base: Omit<OperatorFeedbackCertificationLineageRecord, "integrity_hash"> = {
    certification_id: `operator_feedback_certification_${hash(record.ledger_record_id).slice(0, 14)}`,
    certification_phase: "OPERATOR_FEEDBACK_LEDGER",
    validation_results: failures.length ? failures : freezeArray(["hash_verified", "replay_verified", "tenant_isolated", "append_only_verified"]),
    evidence_package: evidenceRefs,
    replay_refs: replayRefs,
    governance_approval: failures.length ? "REVIEW_REQUIRED" : "CERTIFIED",
    certification_timestamp: LEDGER_TIMESTAMP,
    immutable: true,
    replayable: replayRefs.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(record: OperatorFeedbackLedgerRecord, correlation: ReturnType<typeof correlateFeedbackEvidence>, scenario: Scenario): readonly OperatorFeedbackLedgerFailure[] {
  const failures: OperatorFeedbackLedgerFailure[] = [];
  if (scenario === "INVALID_HASH" || hash(recordHashPayload(record)) !== record.record_hash || hashWithoutIntegrity(record) !== record.integrity_hash) failures.push("INTEGRITY_HASH_INVALID");
  if (scenario === "DUPLICATE_IDENTIFIER") failures.push("IMMUTABLE_IDENTIFIER_DUPLICATED");
  if (scenario === "TENANT_MISMATCH" || record.tenant_id !== correlation.normalization_result.intake_result.feedback_record.tenant_id) failures.push("TENANT_MISMATCH");
  if (!record.replay_id || scenario === "MISSING_REPLAY_REFERENCE") failures.push("REPLAY_REFERENCE_MISSING");
  if (record.schema_version !== RECORD_VERSION || scenario === "INVALID_SCHEMA_VERSION") failures.push("SCHEMA_VERSION_INVALID");
  if (!record.governance_metadata_hash || scenario === "MISSING_GOVERNANCE_METADATA") failures.push("GOVERNANCE_METADATA_INCOMPLETE");
  if (record.sequence_number !== 1 || scenario === "ORDERING_VIOLATION") failures.push("ORDERING_VIOLATION_DETECTED");
  if (!record.feedback_id || scenario === "MISSING_RECORD") failures.push("MISSING_RECORD");
  if (scenario === "LEDGER_CORRUPTION") failures.push("LEDGER_CORRUPTION_DETECTED");
  if (scenario === "CROSS_TENANT_CONTAMINATION") failures.push("CROSS_TENANT_CONTAMINATION");
  if (correlation.correlation_state === "REJECTED" || scenario === "CORRELATION_REJECTED") failures.push("CORRELATION_REJECTED");
  if (!record.immutable || scenario === "HISTORICAL_RECORD_MODIFICATION") failures.push("HISTORICAL_RECORD_MODIFICATION");
  if (scenario === "PRODUCTION_MUTATION_ATTEMPT") failures.push("PRODUCTION_MUTATION_ATTEMPT");
  if (scenario === "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT") failures.push("ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function buildIntegrityReport(record: OperatorFeedbackLedgerRecord, replay: OperatorFeedbackReplayLedgerRecord, failures: readonly OperatorFeedbackLedgerFailure[]): OperatorFeedbackLedgerIntegrityReport {
  const base: Omit<OperatorFeedbackLedgerIntegrityReport, "integrity_hash"> = {
    report_id: `operator_feedback_integrity_${hash(record.ledger_record_id).slice(0, 14)}`,
    record_hashes_verified: !failures.includes("INTEGRITY_HASH_INVALID"),
    chain_integrity_verified: !failures.includes("LEDGER_CORRUPTION_DETECTED") && record.parent_hash === "GENESIS",
    immutable_identifiers_verified: !failures.includes("IMMUTABLE_IDENTIFIER_DUPLICATED") && !failures.includes("HISTORICAL_RECORD_MODIFICATION"),
    replay_references_verified: !failures.includes("REPLAY_REFERENCE_MISSING") && replay.byte_identical,
    schema_versions_verified: !failures.includes("SCHEMA_VERSION_INVALID"),
    ledger_ordering_verified: !failures.includes("ORDERING_VIOLATION_DETECTED"),
    tenant_ownership_verified: !failures.includes("TENANT_MISMATCH") && !failures.includes("CROSS_TENANT_CONTAMINATION"),
    governance_alert_required: failures.length > 0,
    certification_review_required: failures.length > 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function auditEvent(record: OperatorFeedbackLedgerRecord, event_type: OperatorFeedbackLedgerAuditEvent["event_type"]): OperatorFeedbackLedgerAuditEvent {
  const base: Omit<OperatorFeedbackLedgerAuditEvent, "integrity_hash"> = {
    audit_id: `operator_feedback_audit_${hash(`${record.ledger_record_id}:${event_type}`).slice(0, 14)}`,
    ledger_id: "operator_feedback_ledger",
    record_id: record.ledger_record_id,
    event_timestamp: LEDGER_TIMESTAMP,
    event_type,
    replay_identifier: record.replay_id,
    operator_identifier: record.operator_id,
    tenant_identifier: record.tenant_id,
    governance_metadata_hash: record.governance_metadata_hash,
    schema_version: AUDIT_VERSION,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(record: OperatorFeedbackLedgerRecord, failures: readonly OperatorFeedbackLedgerFailure[]): readonly OperatorFeedbackLedgerAuditEvent[] {
  return freezeArray([
    auditEvent(record, "LEDGER_APPEND"),
    auditEvent(record, "REPLAY_REGISTERED"),
    auditEvent(record, "HISTORY_REGISTERED"),
    auditEvent(record, "EVIDENCE_REGISTERED"),
    auditEvent(record, "ADAPTATION_USAGE_REGISTERED"),
    auditEvent(record, "SIMULATION_USAGE_REGISTERED"),
    auditEvent(record, "CERTIFICATION_REGISTERED"),
    auditEvent(record, "INTEGRITY_VERIFIED"),
    ...(failures.length ? [auditEvent(record, "REJECTION")] : []),
  ]);
}

function stateFor(failures: readonly OperatorFeedbackLedgerFailure[]): OperatorFeedbackLedgerState {
  return failures.length ? "FAIL_CLOSED" : "CERTIFIED";
}

function resultReplayHash(result: Omit<OperatorFeedbackLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    records: result.records,
    replay_ledger: result.replay_ledger,
    approval_history: result.approval_history,
    override_history: result.override_history,
    rejection_history: result.rejection_history,
    evidence_history: result.evidence_history,
    adaptation_usage: result.adaptation_usage,
    simulation_usage: result.simulation_usage,
    certification_lineage: result.certification_lineage,
    integrity_report: result.integrity_report,
    audit_events: result.audit_events,
    state: result.ledger_state,
  });
}

function resultIntegrityHash(result: Omit<OperatorFeedbackLedgerResult, "integrity_hash">): string {
  return hash({
    operator_feedback_ledger_version: result.operator_feedback_ledger_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    replay_hash: result.replay_ledger.integrity_hash,
    history_hashes: [...result.approval_history, ...result.override_history, ...result.rejection_history].map((history) => history.integrity_hash),
    evidence_history_hash: result.evidence_history.integrity_hash,
    adaptation_usage_hash: result.adaptation_usage.integrity_hash,
    simulation_usage_hash: result.simulation_usage.integrity_hash,
    certification_hash: result.certification_lineage.integrity_hash,
    integrity_report_hash: result.integrity_report.integrity_hash,
    result_replay_hash: result.replay_hash,
  });
}

export function appendOperatorFeedbackLedger(input: OperatorFeedbackLedgerInput = {}): OperatorFeedbackLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const correlation_result = input.correlation_result ?? correlateFeedbackEvidence(correlationInputFor(scenario));
  const record = buildRecord({ ...input, correlation_result });
  const replayRefs = correlation_result.lineage_registry_record?.replay_refs ?? freezeArray([]);
  const evidenceRefs = correlation_result.lineage_registry_record?.evidence_refs ?? freezeArray([]);
  const replay_ledger = buildReplayLedger(record, replayRefs);
  const preliminaryFailures = collectFailures(record, correlation_result, scenario);
  const approval_history = record.feedback_type === "APPROVAL" ? freezeArray([historyRecord(record, "APPROVAL", correlation_result.lifecycle_correlation?.correlation_id)]) : freezeArray([]);
  const override_history = record.feedback_type === "OVERRIDE" ? freezeArray([historyRecord(record, "OVERRIDE", correlation_result.lifecycle_correlation?.correlation_id)]) : freezeArray([]);
  const rejection_history = record.feedback_type === "REJECTION" ? freezeArray([historyRecord(record, "REJECTION", correlation_result.lifecycle_correlation?.correlation_id)]) : freezeArray([]);
  const evidence_history = buildEvidenceHistory(record, evidenceRefs, replayRefs);
  const adaptation_usage = buildAdaptationUsage(record, evidenceRefs, scenario);
  const simulation_usage = buildSimulationUsage(record, replayRefs, scenario);
  const certification_lineage = buildCertification(record, evidenceRefs, replayRefs, preliminaryFailures);
  const integrity_report = buildIntegrityReport(record, replay_ledger, preliminaryFailures);
  const audit_events = buildAudit(record, preliminaryFailures);
  const base: Omit<OperatorFeedbackLedgerResult, "integrity_hash" | "replay_hash"> = {
    operator_feedback_ledger_version: LEDGER_VERSION,
    ledger_schema_version: RECORD_VERSION,
    api_surface,
    correlation_result,
    records: freezeArray([record]),
    replay_ledger,
    approval_history,
    override_history,
    rejection_history,
    evidence_history,
    adaptation_usage,
    simulation_usage,
    certification_lineage,
    integrity_report,
    audit_events,
    ledger_state: stateFor(preliminaryFailures),
    failures: preliminaryFailures,
    deterministic: true,
    replayable: preliminaryFailures.length === 0 && replay_ledger.byte_identical && replayFeedbackEvidenceCorrelation(correlation_result),
    append_only: true,
    immutable: true,
    tenant_isolated: integrity_report.tenant_ownership_verified,
    authoritative_system_of_record: true,
    history_only: true,
    modifies_recommendations: false,
    generates_adaptive_proposals: false,
    executes_governance_actions: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayOperatorFeedbackLedger(result: OperatorFeedbackLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getOperatorFeedbackLedgerFoundation(): OperatorFeedbackLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    operator_feedback_ledger_version: LEDGER_VERSION,
    api_surface,
    result: appendOperatorFeedbackLedger(),
  });
}

export const OperatorFeedbackLedger = Object.freeze({
  append: appendOperatorFeedbackLedger,
  replay: replayOperatorFeedbackLedger,
});
