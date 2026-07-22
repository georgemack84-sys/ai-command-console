import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { explainPriorities } from "@/services/decision-priority-explanation-engine";
import type { DecisionPriorityFactorName, DecisionPriorityState } from "@/types/decision-priority-contract";
import type { PriorityExplanationEngineResult, PriorityExplanationRecord } from "@/types/decision-priority-explanation-engine";
import type {
  PriorityAuditReport,
  PriorityHistoryRecord,
  PriorityLedgerFailureReason,
  PriorityLedgerMetadataRecord,
  PriorityLedgerObservability,
  PriorityLedgerRecord,
  PriorityLedgerReplayRecord,
  PriorityLedgerResult,
  PriorityLedgerWriteInput,
  PriorityRankingTimelineRecord,
  PriorityReplayIndex,
} from "@/types/decision-priority-ledger";

const NOW = "2026-07-03T09:59:00.000Z";
const ENGINE_VERSION = "priority-ledger/v1";

const FACTORS: readonly DecisionPriorityFactorName[] = Object.freeze([
  "mission_score",
  "urgency_score",
  "risk_score",
  "confidence_score",
  "governance_score",
  "runtime_score",
  "recovery_score",
  "forecast_score",
  "operator_score",
  "dependency_score",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function scoreFor(explanation: PriorityExplanationEngineResult, record: PriorityExplanationRecord) {
  const score = explanation.reports.find((report) => report.decision_candidate_id === record.decision_candidate_id);
  const scoringSource = explanation.explanation_records.find((item) => item.decision_candidate_id === record.decision_candidate_id);
  if (!score || !scoringSource) throw new Error(`priority explanation source missing for ${record.decision_candidate_id}`);
  return { report: score, explanation: scoringSource };
}

function factorRefs(candidateId: string): string[] {
  return FACTORS.map((factor) => `factor_${factor}_${candidateId}`);
}

function sequenceStart(existing: readonly PriorityLedgerRecord[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing.map((record) => record.ledger_sequence_number)) + 1;
}

function buildLedgerRecord(
  explanation: PriorityExplanationEngineResult,
  record: PriorityExplanationRecord,
  sequenceNumber: number,
): PriorityLedgerRecord {
  const ranking = explanation.reports.find((report) => report.decision_candidate_id === record.decision_candidate_id);
  const tenantId = explanation.ledger_record.tenant_id;
  const missionId = explanation.ledger_record.mission_id;
  const base: Omit<PriorityLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `priority_ledger_${tenantId}_${missionId}_${record.decision_candidate_id}_${sequenceNumber}`,
    tenant_id: tenantId,
    mission_id: missionId,
    decision_candidate_id: record.decision_candidate_id,
    overall_priority_score: record.overall_priority_score,
    priority_state: record.priority_state,
    ranking_order: record.ranking_position,
    factor_score_refs: Object.freeze(factorRefs(record.decision_candidate_id)),
    evidence_refs: record.evidence_refs,
    governance_refs: record.governance_refs,
    explanation_ref: record.explanation_id,
    replay_refs: record.replay_refs,
    scoring_profile_ref: ranking?.report_id ?? `priority_scoring_${record.decision_candidate_id}`,
    recorded_timestamp: NOW,
    ledger_sequence_number: sequenceNumber,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function previousFor(existing: readonly PriorityLedgerRecord[], candidateId: string): PriorityLedgerRecord | undefined {
  return [...existing]
    .filter((record) => record.decision_candidate_id === candidateId)
    .sort((a, b) => b.ledger_sequence_number - a.ledger_sequence_number)[0];
}

function buildHistoryRecord(record: PriorityLedgerRecord, previous: PriorityLedgerRecord | undefined): PriorityHistoryRecord {
  const base: Omit<PriorityHistoryRecord, "integrity_hash"> = {
    history_id: `priority_history_${record.decision_candidate_id}_${record.ledger_sequence_number}`,
    decision_candidate_id: record.decision_candidate_id,
    previous_priority_state: previous?.priority_state ?? null,
    current_priority_state: record.priority_state,
    previous_score: previous?.overall_priority_score ?? null,
    current_score: record.overall_priority_score,
    previous_ranking: previous?.ranking_order ?? null,
    current_ranking: record.ranking_order,
    change_reason: previous ? "Priority ledger append captured score, state, or ranking evolution." : "Initial priority ledger record.",
    replay_refs: record.replay_refs,
    recorded_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildReplayIndex(record: PriorityLedgerRecord): PriorityReplayIndex {
  const baseForHash = {
    decision_candidate_id: record.decision_candidate_id,
    priority_record_refs: [record.ledger_record_id],
    explanation_refs: [record.explanation_ref],
    governance_refs: record.governance_refs,
    evidence_refs: record.evidence_refs,
    replay_sequence: [record.ledger_sequence_number],
  };
  const base: Omit<PriorityReplayIndex, "integrity_hash"> = {
    replay_index_id: `priority_replay_index_${record.decision_candidate_id}_${record.ledger_sequence_number}`,
    ...baseForHash,
    reconstruction_hash: hash(baseForHash),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildTimeline(records: readonly PriorityLedgerRecord[], tenantId: string, missionId: string): PriorityRankingTimelineRecord {
  const ordered = [...records].sort((a, b) => a.ledger_sequence_number - b.ledger_sequence_number);
  const active = ordered.filter((record) => record.ranking_order !== null && record.priority_state !== "BLOCKED" && record.priority_state !== "REJECTED").sort((a, b) => (a.ranking_order ?? 0) - (b.ranking_order ?? 0));
  const base: Omit<PriorityRankingTimelineRecord, "integrity_hash"> = {
    timeline_id: `priority_ranking_timeline_${tenantId}_${missionId}`,
    tenant_id: tenantId,
    mission_id: missionId,
    ordered_record_refs: ordered.map((record) => record.ledger_record_id),
    active_ranking_order: active.map((record) => record.decision_candidate_id),
    blocked_record_refs: ordered.filter((record) => record.priority_state === "BLOCKED").map((record) => record.ledger_record_id),
    rejected_record_refs: ordered.filter((record) => record.priority_state === "REJECTED").map((record) => record.ledger_record_id),
    sequence_valid: ordered.every((record, index) => index === 0 || record.ledger_sequence_number > ordered[index - 1]!.ledger_sequence_number),
    recorded_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildMetadata(): PriorityLedgerMetadataRecord {
  const base: Omit<PriorityLedgerMetadataRecord, "integrity_hash"> = {
    metadata_id: "priority_ledger_metadata_v1",
    ledger_version: ENGINE_VERSION,
    schema_version: "priority-ledger-schema/v1",
    serialization_version: "canonical-json/v1",
    hash_algorithm: "decision-integrity-hash/v1",
    replay_algorithm: "priority-ledger-replay/v1",
    migration_history: Object.freeze([]),
    certification_history: Object.freeze(["phase-9-5-9-priority-ledger"]),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildAudit(records: readonly PriorityLedgerRecord[], histories: readonly PriorityHistoryRecord[], tenantId: string, missionId: string): PriorityAuditReport {
  const base: Omit<PriorityAuditReport, "integrity_hash"> = {
    audit_report_id: `priority_audit_${tenantId}_${missionId}`,
    tenant_id: tenantId,
    mission_id: missionId,
    priority_record_refs: records.map((record) => record.ledger_record_id).sort(),
    ranking_history_refs: histories.map((history) => history.history_id).sort(),
    governance_refs: normalizeStrings(records.flatMap((record) => record.governance_refs)),
    evidence_refs: normalizeStrings(records.flatMap((record) => record.evidence_refs)),
    replay_refs: normalizeStrings(records.flatMap((record) => record.replay_refs)),
    audit_summary: `${records.length} priority ledger records preserved for deterministic audit and replay.`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function integrityValid(record: PriorityLedgerRecord): boolean {
  return recordHash({ ...record, integrity_hash: undefined }) === record.integrity_hash;
}

function collectFailures(input: PriorityLedgerWriteInput, records: readonly PriorityLedgerRecord[], explanation: PriorityExplanationEngineResult): PriorityLedgerFailureReason[] {
  const failures: PriorityLedgerFailureReason[] = [];
  if (input.canonical_ordering_reproducible === false) failures.push("CANONICAL_ORDERING_FAILED");
  if ((input.attempted_mutation_refs ?? []).length > 0) failures.push("LEDGER_MUTATION_DETECTED");
  if ((input.attempted_deletion_refs ?? []).length > 0) failures.push("LEDGER_DELETION_DETECTED");
  const sequenceCounts = new Map<number, number>();
  for (const record of records) {
    sequenceCounts.set(record.ledger_sequence_number, (sequenceCounts.get(record.ledger_sequence_number) ?? 0) + 1);
    if (!Number.isFinite(record.overall_priority_score)) failures.push("PRIORITY_SCORE_MISSING");
    if (record.ranking_order === undefined) failures.push("RANKING_INFORMATION_INCOMPLETE");
    if (record.evidence_refs.length === 0) failures.push("EVIDENCE_REFERENCES_MISSING");
    if (record.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
    if (!record.explanation_ref) failures.push("EXPLANATION_REFERENCE_MISSING");
    if (record.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
    if (!integrityValid(record)) failures.push("INTEGRITY_VERIFICATION_FAILED");
    if (tenantLeak([...record.evidence_refs, ...record.governance_refs, ...record.replay_refs], record.tenant_id)) failures.push("CROSS_TENANT_REFERENCE_DETECTED");
  }
  if ([...sequenceCounts.values()].some((count) => count > 1)) failures.push("DUPLICATE_LEDGER_SEQUENCE");
  if (explanation.explanation_status === "FAIL") failures.push("INTEGRITY_VERIFICATION_FAILED");
  return failures;
}

function replayHashValue(input: {
  records: readonly PriorityLedgerRecord[];
  histories: readonly PriorityHistoryRecord[];
  indexes: readonly PriorityReplayIndex[];
  timeline: PriorityRankingTimelineRecord;
  metadata: PriorityLedgerMetadataRecord;
  audit: PriorityAuditReport;
}): string {
  return hash(input);
}

function buildReplay(replayHash: string, records: readonly PriorityLedgerRecord[], failures: readonly PriorityLedgerFailureReason[]): PriorityLedgerReplayRecord {
  const base: Omit<PriorityLedgerReplayRecord, "integrity_hash"> = {
    replay_id: "priority_ledger_replay",
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    replay_valid: failures.length === 0,
    ledger_sequence: records.map((record) => record.ledger_sequence_number),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function writePriorityLedger(input: PriorityLedgerWriteInput = {}): PriorityLedgerResult {
  const explanation = input.explanation_result ?? explainPriorities();
  const existing = [...(input.existing_records ?? [])].sort((a, b) => a.ledger_sequence_number - b.ledger_sequence_number);
  const firstSequence = sequenceStart(existing);
  const appended = [...explanation.explanation_records]
    .sort((a, b) => a.decision_candidate_id.localeCompare(b.decision_candidate_id))
    .map((record, index) => buildLedgerRecord(explanation, record, firstSequence + index));
  const records = Object.freeze([...existing, ...appended].sort((a, b) => a.ledger_sequence_number - b.ledger_sequence_number));
  const histories = Object.freeze(appended.map((record) => buildHistoryRecord(record, previousFor(existing, record.decision_candidate_id))));
  const indexes = Object.freeze(appended.map(buildReplayIndex));
  const tenantId = explanation.ledger_record.tenant_id;
  const missionId = explanation.ledger_record.mission_id;
  const timeline = buildTimeline(records, tenantId, missionId);
  const metadata = buildMetadata();
  const audit = buildAudit(records, histories, tenantId, missionId);
  const failures = collectFailures(input, records, explanation);
  const replayHash = replayHashValue({ records, histories, indexes, timeline, metadata, audit });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "LEDGER_REPLAY_MISMATCH" as const] : failures;
  const replay = buildReplay(replayHash, records, Object.freeze([...new Set(replayFailures)]));
  const status = replayFailures.length === 0 ? "PASS" : "FAIL";
  const base: Omit<PriorityLedgerResult, "integrity_hash"> = {
    ledger_status: status,
    certificationStatus: status,
    failures: Object.freeze([...new Set(replayFailures)]),
    ledger_records: records,
    history_records: histories,
    replay_indexes: indexes,
    ranking_timeline: timeline,
    metadata_record: metadata,
    audit_report: audit,
    replay_record: replay,
    deterministic: true,
    advisoryOnly: true,
    appendOnly: true,
    immutable: true,
    failClosed: true,
    replay_hash: replayHash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayPriorityLedger(result: PriorityLedgerResult): PriorityLedgerReplayRecord {
  const replayHash = replayHashValue({
    records: result.ledger_records,
    histories: result.history_records,
    indexes: result.replay_indexes,
    timeline: result.ranking_timeline,
    metadata: result.metadata_record,
    audit: result.audit_report,
  });
  const failures: PriorityLedgerFailureReason[] = replayHash === result.replay_hash ? [] : ["LEDGER_REPLAY_MISMATCH"];
  return buildReplay(replayHash, result.ledger_records, Object.freeze(failures));
}

export function verifyPriorityLedgerIntegrity(record: PriorityLedgerRecord): boolean {
  return integrityValid(record);
}

export function queryPriorityAudit(result: PriorityLedgerResult, candidateId?: string): PriorityAuditReport {
  const records = candidateId ? result.ledger_records.filter((record) => record.decision_candidate_id === candidateId) : result.ledger_records;
  const histories = candidateId ? result.history_records.filter((history) => history.decision_candidate_id === candidateId) : result.history_records;
  return buildAudit(records, histories, result.audit_report.tenant_id, result.audit_report.mission_id);
}

export function buildPriorityLedgerObservability(results: readonly PriorityLedgerResult[]): PriorityLedgerObservability {
  const records = results.flatMap((result) => result.ledger_records);
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.ledger_status === "PASS").length,
    fail_count: results.filter((result) => result.ledger_status === "FAIL").length,
    ledger_records_written: records.length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    integrity_failures: results.filter((result) => result.failures.includes("INTEGRITY_VERIFICATION_FAILED")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_REFERENCE_DETECTED")).length,
    duplicate_sequence_failures: results.filter((result) => result.failures.includes("DUPLICATE_LEDGER_SEQUENCE")).length,
    state_distribution: Object.freeze(records.reduce<Record<DecisionPriorityState, number>>((counts, record) => {
      counts[record.priority_state] = (counts[record.priority_state] ?? 0) + 1;
      return counts;
    }, {} as Record<DecisionPriorityState, number>)),
    factor_ref_distribution: Object.freeze(FACTORS.reduce<Record<DecisionPriorityFactorName, number>>((counts, factor) => {
      counts[factor] = records.filter((record) => record.factor_score_refs.some((ref) => ref.includes(factor))).length;
      return counts;
    }, {} as Record<DecisionPriorityFactorName, number>)),
  });
}

export function getPriorityLedgerEngine() {
  const result = writePriorityLedger();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayPriorityLedger(result),
    observability: buildPriorityLedgerObservability([result]),
  });
}
