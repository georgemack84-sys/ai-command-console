import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { validateTruthLedgerQueryContract } from "./queryContract";
import type {
  TruthHistoricalIndexRecord,
  TruthHistoricalReconstructionAuditRecord,
  TruthHistoricalReconstructionExecutionContext,
  TruthHistoricalReconstructionGap,
  TruthHistoricalReconstructionQuery,
  TruthHistoricalReconstructionReplayMetadata,
  TruthHistoricalReconstructionResponse,
  TruthHistoricalReconstructionResultState,
  TruthHistoricalTimelineEvent,
  TruthHistoricalVisibilityState,
  TruthIntegrityFinalCertificationState,
  TruthLedgerQueryContract,
  TruthLifecycleState,
} from "./types";

const HISTORICAL_SCHEMA_VERSION = "mission-control-historical-reconstruction/v1";

const RECONSTRUCTION_PERMISSION: Readonly<Record<TruthHistoricalReconstructionQuery["reconstruction_type"], string>> = Object.freeze({
  AS_OF_RECORD_STATE: "truth.history.record.read",
  AS_OF_MISSION_STATE: "truth.history.mission.read",
  TIMELINE_RECONSTRUCTION: "truth.history.timeline.read",
  DECISION_HISTORY: "truth.history.decision.read",
  RECOMMENDATION_HISTORY: "truth.history.recommendation.read",
  EVIDENCE_HISTORY: "truth.history.evidence.read",
  GOVERNANCE_HISTORY: "truth.history.governance.read",
  LINEAGE_HISTORY: "truth.history.lineage.read",
  CHANGESET_RECONSTRUCTION: "truth.history.changeset.read",
  BETWEEN_TIME_DIFF: "truth.history.diff.read",
  INCIDENT_RECONSTRUCTION: "truth.history.incident.read",
  CERTIFICATION_HISTORY: "truth.history.certification.read",
});

const INTEGRITY_RANK: Readonly<Record<TruthIntegrityFinalCertificationState, number>> = Object.freeze({
  CORRUPTED: 0,
  DEGRADED: 1,
  VALID: 2,
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function validDate(value: string | undefined): boolean {
  return !!value && !Number.isNaN(Date.parse(value));
}

function emptyResponse(
  contract: TruthLedgerQueryContract | undefined,
  query: TruthHistoricalReconstructionQuery,
  state: TruthHistoricalReconstructionResultState,
  warnings: readonly string[],
): TruthHistoricalReconstructionResponse {
  const queryHash = contract ? hashValue("mission-control-query-contract-hash", contract) : hashValue("mission-control-missing-query-contract-hash", query.query_contract_ref);
  const reconstructionHash = hashValue("mission-control-historical-reconstruction-hash", { state, warnings, query });
  return Object.freeze({
    reconstruction_query_id: query.reconstruction_query_id,
    query_id: contract?.query_id ?? query.query_contract_ref,
    tenant_id: query.tenant_id,
    mission_id: query.mission_id,
    reconstruction_type: query.reconstruction_type,
    temporal_anchor: query.temporal_anchor,
    result_state: state,
    reconstructed_records: Object.freeze([]),
    timeline_events: Object.freeze([]),
    recommendation_history_refs: Object.freeze([]),
    decision_history_refs: Object.freeze([]),
    evidence_history_refs: Object.freeze([]),
    governance_history_refs: Object.freeze([]),
    lineage_history_refs: Object.freeze([]),
    replay_refs: Object.freeze([]),
    gaps: Object.freeze([]),
    redaction_applied: false,
    redaction_refs: Object.freeze([]),
    current_access_governance_ref: query.governance_context_ref,
    historical_governance_refs: Object.freeze([]),
    authority_decision_ref: query.authority_context_ref,
    integrity_decision_ref: query.integrity_requirements_ref,
    query_hash: queryHash,
    reconstruction_hash: reconstructionHash,
    replay_ref: contract?.replay_requirements.replay_ref,
    reconstructed_at: query.created_at,
    warnings: Object.freeze(warnings),
    readOnly: true as const,
    sourceMutationAllowed: false as const,
  });
}

function temporalAnchorValid(query: TruthHistoricalReconstructionQuery): boolean {
  const anchor = query.temporal_anchor;
  if (!anchor?.anchor_type) return false;
  if (anchor.anchor_type === "BETWEEN_TIMES") {
    return validDate(anchor.start_time) && validDate(anchor.end_time) && Date.parse(anchor.start_time!) <= Date.parse(anchor.end_time!);
  }
  return validDate(anchor.as_of_time);
}

function deterministicOrderingValid(query: TruthHistoricalReconstructionQuery): boolean {
  return query.ordering_policy.tie_breakers.includes("truth_record_id")
    && (query.ordering_policy.order_by === "truth_record_id" || query.ordering_policy.tie_breakers.includes("event_sequence"));
}

function anchorTime(query: TruthHistoricalReconstructionQuery): string {
  return query.temporal_anchor.as_of_time ?? query.temporal_anchor.end_time ?? query.created_at;
}

function temporalValue(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery): string {
  if (query.temporal_anchor.anchor_type === "OCCURRED_AS_OF") return record.occurred_at ?? record.recorded_at;
  if (query.temporal_anchor.anchor_type === "EFFECTIVE_AS_OF") return record.effective_at ?? record.recorded_at;
  if (query.temporal_anchor.anchor_type === "VERIFIED_AS_OF") return record.verified_at ?? record.recorded_at;
  return record.recorded_at;
}

function isLateArriving(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery): boolean {
  if (query.temporal_anchor.anchor_type !== "KNOWN_AS_OF" || !record.occurred_at || !query.temporal_anchor.as_of_time) return false;
  return Date.parse(record.occurred_at) <= Date.parse(query.temporal_anchor.as_of_time) && Date.parse(record.recorded_at) > Date.parse(query.temporal_anchor.as_of_time);
}

function inTemporalScope(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery): boolean {
  if (query.temporal_anchor.anchor_type === "BETWEEN_TIMES") {
    const value = Date.parse(record.recorded_at);
    return value >= Date.parse(query.temporal_anchor.start_time!) && value <= Date.parse(query.temporal_anchor.end_time!);
  }
  const value = Date.parse(temporalValue(record, query));
  const anchor = Date.parse(anchorTime(query));
  if (isLateArriving(record, query)) return query.include_late_arriving_records;
  return value <= anchor;
}

function targetMatches(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery): boolean {
  const target = query.target_records;
  const hasTargets = Object.values(target).some((value) => Array.isArray(value) && value.length > 0);
  if (!hasTargets) return true;
  if (query.reconstruction_type === "DECISION_HISTORY" && target.decision_ids && target.decision_ids.length > 0) {
    return (record.decision_id ? target.decision_ids.includes(record.decision_id) : false)
      || target.decision_ids.some((id) => record.decision_refs?.includes(id))
      || (query.target_context.include_recommendations && !!record.recommendation_id)
      || (query.target_context.include_evidence && !!record.evidence_id)
      || (query.target_context.include_governance && target.decision_ids.some(() => record.governance_refs.length > 0));
  }
  if (query.reconstruction_type === "RECOMMENDATION_HISTORY" && target.recommendation_ids && target.recommendation_ids.length > 0) {
    return (record.recommendation_id ? target.recommendation_ids.includes(record.recommendation_id) : false)
      || target.recommendation_ids.some((id) => record.recommendation_refs?.includes(id))
      || (query.target_context.include_evidence && !!record.evidence_id)
      || (query.target_context.include_decisions && !!record.decision_id);
  }
  return (target.truth_record_ids?.includes(record.truth_record_id) ?? false)
    || (record.recommendation_id ? target.recommendation_ids?.includes(record.recommendation_id) ?? false : false)
    || (record.decision_id ? target.decision_ids?.includes(record.decision_id) ?? false : false)
    || (record.evidence_id ? target.evidence_ids?.includes(record.evidence_id) ?? false : false)
    || target.governance_refs?.some((ref) => record.governance_refs.includes(ref)) === true
    || target.replay_refs?.some((ref) => record.replay_refs.includes(ref)) === true
    || target.lineage_refs?.some((ref) => record.lineage_refs.includes(ref)) === true;
}

function typeMatches(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery): boolean {
  if (query.reconstruction_type === "DECISION_HISTORY") return !!record.decision_id || query.target_context.include_recommendations || query.target_context.include_evidence;
  if (query.reconstruction_type === "RECOMMENDATION_HISTORY") return !!record.recommendation_id || query.target_context.include_evidence || query.target_context.include_decisions;
  if (query.reconstruction_type === "EVIDENCE_HISTORY") return !!record.evidence_id;
  if (query.reconstruction_type === "GOVERNANCE_HISTORY") return record.governance_refs.length > 0;
  return true;
}

function visibleState(record: TruthHistoricalIndexRecord, governanceDecision: string | undefined): TruthHistoricalVisibilityState {
  if (governanceDecision === "DENY" || governanceDecision === "ESCALATE") return "DENIED";
  if (record.restricted && governanceDecision === "SUMMARY_ONLY") return "SUMMARY_ONLY";
  if (record.restricted || governanceDecision === "ALLOW_WITH_REDACTION") return "PARTIALLY_VISIBLE";
  return "VISIBLE";
}

function orderValue(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery): string | number {
  const key = query.ordering_policy.order_by;
  if (key === "event_sequence") return record.event_sequence ?? 0;
  if (key === "truth_record_id") return record.truth_record_id;
  return record[key] ?? record.recorded_at;
}

function sortRecords(query: TruthHistoricalReconstructionQuery, records: readonly TruthHistoricalIndexRecord[]): readonly TruthHistoricalIndexRecord[] {
  const direction = query.ordering_policy.direction === "ASC" ? 1 : -1;
  return Object.freeze([...records].sort((a, b) => {
    const aValue = orderValue(a, query);
    const bValue = orderValue(b, query);
    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;
    const sequenceDiff = (a.event_sequence ?? 0) - (b.event_sequence ?? 0);
    if (sequenceDiff !== 0) return sequenceDiff * direction;
    return a.truth_record_id.localeCompare(b.truth_record_id);
  }));
}

function lifecycleAtAnchor(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery): TruthLifecycleState {
  const anchor = Date.parse(anchorTime(query));
  if (record.superseded_by_ref && record.valid_to && Date.parse(record.valid_to) <= anchor) return "SUPERSEDED";
  return record.lifecycle_state;
}

function toRecordState(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery, governanceDecision: string | undefined) {
  const anchor = Date.parse(anchorTime(query));
  const late = isLateArriving(record, query);
  return Object.freeze({
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    record_type: record.record_type,
    existed_as_of_anchor: Date.parse(temporalValue(record, query)) <= anchor || late,
    visible_as_of_anchor: visibleState(record, governanceDecision) !== "DENIED",
    verified_as_of_anchor: !!record.verified_at && Date.parse(record.verified_at) <= anchor,
    lifecycle_state_as_of_anchor: lifecycleAtAnchor(record, query),
    active_version_ref: record.active_version_ref,
    superseded_by_ref: record.superseded_by_ref,
    superseded_after_anchor: !!record.valid_to && Date.parse(record.valid_to) > anchor,
    evidence_refs_as_of_anchor: Object.freeze(query.include_evidence ? [...record.evidence_refs] : []),
    governance_refs_as_of_anchor: Object.freeze(query.include_governance ? [...record.governance_refs] : []),
    replay_refs_as_of_anchor: Object.freeze(query.include_replay_refs ? [...record.replay_refs] : []),
    lineage_refs_as_of_anchor: Object.freeze(query.include_lineage ? [...record.lineage_refs] : []),
    integrity_state_as_of_anchor: record.integrity_state,
    late_arriving_record: late,
    late_arriving_record_state: late ? "INCLUDED_WITH_LATE_ARRIVAL_FLAG" as const : "NOT_INCLUDED" as const,
    restricted_as_of_anchor: record.restricted === true,
  });
}

function toTimelineEvent(record: TruthHistoricalIndexRecord, query: TruthHistoricalReconstructionQuery, governanceDecision: string | undefined): TruthHistoricalTimelineEvent {
  return Object.freeze({
    sequence_id: `hist_seq_${record.event_sequence ?? record.truth_record_id}`,
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    event_type: record.record_type,
    event_summary: record.event_summary,
    occurred_at: record.occurred_at,
    recorded_at: record.recorded_at,
    verified_at: record.verified_at,
    effective_at: record.effective_at,
    lifecycle_state_after_event: lifecycleAtAnchor(record, query),
    parent_refs: Object.freeze([...record.parent_refs]),
    child_refs: Object.freeze([...record.child_refs]),
    evidence_refs: Object.freeze(query.include_evidence ? [...record.evidence_refs] : []),
    governance_refs: Object.freeze(query.include_governance ? [...record.governance_refs] : []),
    replay_refs: Object.freeze(query.include_replay_refs ? [...record.replay_refs] : []),
    integrity_state: record.integrity_state,
    visibility_state: visibleState(record, governanceDecision),
  });
}

function gap(id: string, type: TruthHistoricalReconstructionGap["gap_type"], severity: TruthHistoricalReconstructionGap["severity"], affected: readonly string[], detectedAt: string, description: string, record?: TruthHistoricalIndexRecord): TruthHistoricalReconstructionGap {
  return Object.freeze({
    gap_id: id,
    gap_type: type,
    severity,
    affected_record_refs: Object.freeze([...affected]),
    detected_at: detectedAt,
    description,
    integrity_state: record?.integrity_state,
    governance_refs: record?.governance_refs,
    replay_refs: record?.replay_refs,
  });
}

function detectGaps(records: readonly TruthHistoricalIndexRecord[], query: TruthHistoricalReconstructionQuery): readonly TruthHistoricalReconstructionGap[] {
  return Object.freeze(records.flatMap((record) => {
    const found: TruthHistoricalReconstructionGap[] = [];
    if (record.broken_hash_chain) found.push(gap(`gap_hash_${record.truth_record_id}`, "BROKEN_HASH_CHAIN", "CRITICAL", [record.truth_record_id], query.created_at, "Historical hash chain continuity is broken.", record));
    if (record.broken_lineage || record.parent_refs.some((ref) => ref.startsWith("missing"))) found.push(gap(`gap_lineage_${record.truth_record_id}`, "BROKEN_LINEAGE", "HIGH", [record.truth_record_id, ...record.parent_refs], query.created_at, "Historical lineage references are incomplete.", record));
    const missingEvidence = [...(record.missing_evidence_refs ?? []), ...record.evidence_refs.filter((ref) => ref.startsWith("missing"))];
    if (missingEvidence.length > 0) found.push(gap(`gap_evidence_${record.truth_record_id}`, "MISSING_EVIDENCE", "MEDIUM", unique([record.truth_record_id, ...missingEvidence]), query.created_at, "Historical evidence references are missing from the reconstruction window.", record));
    if (record.conflicting_record_refs && record.conflicting_record_refs.length > 0) found.push(gap(`gap_conflict_${record.truth_record_id}`, "CONFLICTING_RECORDS", "MEDIUM", unique([record.truth_record_id, ...record.conflicting_record_refs]), query.created_at, "Conflicting historical records were detected.", record));
    if (isLateArriving(record, query)) found.push(gap(`gap_late_${record.truth_record_id}`, "LATE_ARRIVING_RECORD", "LOW", [record.truth_record_id], query.created_at, "Record occurred before the anchor but was recorded after it.", record));
    if (record.restricted) found.push(gap(`gap_redacted_${record.truth_record_id}`, "REDACTED_DEPENDENCY", "LOW", [record.truth_record_id], query.created_at, "Historical record is restricted by governance.", record));
    if (record.integrity_state === "DEGRADED") found.push(gap(`gap_degraded_${record.truth_record_id}`, "UNVERIFIED_RECORD", "LOW", [record.truth_record_id], query.created_at, "Historical record is integrity-degraded.", record));
    return found;
  }));
}

function resultState(records: readonly TruthHistoricalIndexRecord[], gaps: readonly TruthHistoricalReconstructionGap[], redaction: boolean): TruthHistoricalReconstructionResultState {
  if (records.length === 0) return "EMPTY";
  if (gaps.some((item) => item.gap_type === "CONFLICTING_RECORDS")) return "CONFLICT_DETECTED";
  if (gaps.some((item) => item.severity === "HIGH" || item.severity === "CRITICAL" || item.gap_type === "MISSING_EVIDENCE")) return "GAP_DETECTED";
  if (redaction) return "REDACTED";
  if (gaps.length > 0) return "PARTIAL";
  return "RECONSTRUCTED";
}

export function reconstructHistoricalTruthLedger(
  contract: TruthLedgerQueryContract | undefined,
  query: TruthHistoricalReconstructionQuery,
  indexRecords: readonly TruthHistoricalIndexRecord[],
  context: TruthHistoricalReconstructionExecutionContext = {},
): TruthHistoricalReconstructionResponse {
  if (!contract) return emptyResponse(contract, query, "INVALID_QUERY", ["Historical reconstruction requires a Query Contract."]);
  const validation = validateTruthLedgerQueryContract(contract, {
    observed_integrity_state: context.observed_integrity_state,
    mutation_attempted: context.mutation_attempted,
  });
  if (!validation.valid) {
    const state = validation.result_state === "AUTHORITY_BLOCKED" ? "AUTHORITY_BLOCKED" :
      validation.result_state === "GOVERNANCE_BLOCKED" ? "GOVERNANCE_BLOCKED" :
        validation.result_state === "INTEGRITY_BLOCKED" ? "INTEGRITY_BLOCKED" : "INVALID_QUERY";
    return emptyResponse(contract, query, state, validation.errors);
  }
  if (query.query_contract_ref !== contract.query_id || query.tenant_id !== contract.tenant_id || !temporalAnchorValid(query)) {
    return emptyResponse(contract, query, "INVALID_QUERY", ["Historical reconstruction must be contract-bound, tenant-scoped, and time-anchored."]);
  }
  if (query.mission_id && contract.mission_id && query.mission_id !== contract.mission_id) {
    return emptyResponse(contract, query, "INVALID_QUERY", ["Historical reconstruction mission scope does not match the Query Contract."]);
  }
  if (!deterministicOrderingValid(query)) return emptyResponse(contract, query, "INVALID_QUERY", ["Historical ordering must include deterministic event_sequence and truth_record_id tie breakers."]);
  if (context.mutation_attempted) return emptyResponse(contract, query, "INVALID_QUERY", ["Historical reconstruction is read-only and cannot mutate records."]);
  if (!contract.replay_requirements.replay_ref || !query.replay_requirements_ref) return emptyResponse(contract, query, "INVALID_QUERY", ["Replay-required historical reconstruction is missing replay metadata."]);
  if (!contract.authority_context.permissions.includes(RECONSTRUCTION_PERMISSION[query.reconstruction_type])) {
    return emptyResponse(contract, query, "AUTHORITY_BLOCKED", ["Requester lacks historical reconstruction permission."]);
  }

  const governanceDecision = context.governance_decision ?? (contract.redaction_policy.redaction_required ? "ALLOW_WITH_REDACTION" : "ALLOW");
  if (governanceDecision === "DENY" || governanceDecision === "ESCALATE") return emptyResponse(contract, query, "GOVERNANCE_BLOCKED", ["Governance blocks historical reconstruction visibility."]);

  const scoped = sortRecords(query, indexRecords.filter((record) => record.tenant_id === query.tenant_id
    && (!query.mission_id || record.mission_id === query.mission_id)
    && targetMatches(record, query)
    && typeMatches(record, query)
    && inTemporalScope(record, query)));

  const corrupted = scoped.filter((record) => record.integrity_state === "CORRUPTED" || record.broken_hash_chain);
  if (corrupted.length > 0 || context.observed_integrity_state === "CORRUPTED") {
    return emptyResponse(contract, query, "INTEGRITY_BLOCKED", ["Corrupted historical records or hash chains cannot be reconstructed as trusted history."]);
  }
  const minimum = contract.integrity_requirements.minimum_integrity_state;
  const integrityBlocked = scoped.some((record) => INTEGRITY_RANK[record.integrity_state] < INTEGRITY_RANK[minimum] && record.integrity_state !== "DEGRADED");
  if (integrityBlocked) return emptyResponse(contract, query, "INTEGRITY_BLOCKED", ["Historical record integrity is below the required query threshold."]);
  if (scoped.some((record) => record.restricted) && !contract.redaction_policy.redaction_required) {
    return emptyResponse(contract, query, "GOVERNANCE_BLOCKED", ["Restricted historical records require a redaction policy."]);
  }

  const records = scoped.map((record) => toRecordState(record, query, governanceDecision));
  const timeline = scoped.map((record) => toTimelineEvent(record, query, governanceDecision));
  const gaps = detectGaps(scoped, query);
  const redactionApplied = governanceDecision === "ALLOW_WITH_REDACTION" || governanceDecision === "SUMMARY_ONLY" || scoped.some((record) => record.restricted);
  const state = resultState(scoped, gaps, redactionApplied);
  const historicalGovernanceRefs = unique(scoped.flatMap((record) => record.governance_refs));
  const redactionRefs = unique(scoped.flatMap((record) => record.restricted_fields ?? []));
  const warnings = unique([
    ...gaps.map((item) => item.description),
    ...(redactionApplied ? ["Historical reconstruction was redacted by governance policy."] : []),
  ]);
  const reconstructionWithoutHash = {
    reconstruction_query_id: query.reconstruction_query_id,
    query_id: contract.query_id,
    tenant_id: query.tenant_id,
    mission_id: query.mission_id,
    reconstruction_type: query.reconstruction_type,
    temporal_anchor: query.temporal_anchor,
    result_state: state,
    reconstructed_records: records,
    timeline_events: timeline,
    recommendation_history_refs: unique(scoped.flatMap((record) => record.recommendation_id ? [record.recommendation_id] : record.recommendation_refs ?? [])),
    decision_history_refs: unique(scoped.flatMap((record) => record.decision_id ? [record.decision_id] : record.decision_refs ?? [])),
    evidence_history_refs: unique(scoped.flatMap((record) => record.evidence_id ? [record.evidence_id] : record.evidence_refs)),
    governance_history_refs: historicalGovernanceRefs,
    lineage_history_refs: unique(scoped.flatMap((record) => record.lineage_refs)),
    replay_refs: unique(scoped.flatMap((record) => record.replay_refs)),
    gaps,
    redaction_applied: redactionApplied,
    redaction_refs: redactionRefs,
    current_access_governance_ref: query.governance_context_ref,
    historical_governance_refs: historicalGovernanceRefs,
    authority_decision_ref: query.authority_context_ref,
    integrity_decision_ref: query.integrity_requirements_ref,
    query_hash: validation.query_hash,
    replay_ref: contract.replay_requirements.replay_ref,
    reconstructed_at: query.created_at,
    warnings,
    readOnly: true as const,
    sourceMutationAllowed: false as const,
  };

  return Object.freeze({
    ...reconstructionWithoutHash,
    reconstruction_hash: hashValue("mission-control-historical-reconstruction-hash", {
      ...reconstructionWithoutHash,
      index_version: context.index_version ?? scoped[0]?.index_version,
      historical_schema_version: context.historical_schema_version ?? HISTORICAL_SCHEMA_VERSION,
    }),
  });
}

export function createHistoricalReconstructionReplayMetadata(
  query: TruthHistoricalReconstructionQuery,
  response: TruthHistoricalReconstructionResponse,
  context: TruthHistoricalReconstructionExecutionContext = {},
): TruthHistoricalReconstructionReplayMetadata {
  return Object.freeze({
    reconstruction_query_id: query.reconstruction_query_id,
    query_id: response.query_id,
    temporal_anchor_hash: hashValue("mission-control-historical-temporal-anchor-hash", query.temporal_anchor),
    filter_hash: hashValue("mission-control-historical-target-hash", { target_records: query.target_records, target_context: query.target_context }),
    ordering_policy_hash: hashValue("mission-control-historical-ordering-policy-hash", query.ordering_policy),
    index_version: context.index_version ?? "historical-index/v1",
    historical_schema_version: context.historical_schema_version ?? HISTORICAL_SCHEMA_VERSION,
    authority_decision_ref: response.authority_decision_ref,
    governance_decision_ref: response.current_access_governance_ref,
    integrity_decision_ref: response.integrity_decision_ref,
    query_hash: response.query_hash,
    reconstruction_hash: response.reconstruction_hash,
    reconstructed_at: response.reconstructed_at,
  });
}

export function createHistoricalReconstructionAuditRecord(
  contract: TruthLedgerQueryContract,
  query: TruthHistoricalReconstructionQuery,
  response: TruthHistoricalReconstructionResponse,
): TruthHistoricalReconstructionAuditRecord {
  return Object.freeze({
    audit_id: `hist_audit_${query.reconstruction_query_id}`,
    reconstruction_query_id: query.reconstruction_query_id,
    query_id: contract.query_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    requester_type: contract.requester_type,
    operator_id: query.operator_id,
    reconstruction_type: query.reconstruction_type,
    temporal_anchor: query.temporal_anchor,
    result_state: response.result_state,
    reconstructed_record_count: response.reconstructed_records.length,
    timeline_event_count: response.timeline_events.length,
    gap_count: response.gaps.length,
    redaction_applied: response.redaction_applied,
    authority_decision_ref: response.authority_decision_ref,
    governance_decision_ref: response.current_access_governance_ref,
    integrity_decision_ref: response.integrity_decision_ref,
    replay_ref: response.replay_ref,
    query_hash: response.query_hash,
    reconstruction_hash: response.reconstruction_hash,
    created_at: response.reconstructed_at,
  });
}
