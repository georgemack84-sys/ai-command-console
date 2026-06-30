import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  CrossLedgerCorrelationExplorerRecord,
  EvidenceRelationshipExplorerRecord,
  GovernanceEscalationExplorerRecord,
  HistoricalLedgerExplorerView,
  LedgerExplorerAuditEvent,
  LedgerExplorerContract,
  LedgerExplorerDetail,
  LedgerExplorerQuery,
  LedgerExplorerRecord,
  LedgerExplorerView,
  LedgerGraphEdge,
  LedgerGraphNode,
  LedgerIntegrityExplorerRecord,
  LedgerRecordDrilldown,
  LedgerTimelineEvent,
  RecommendationDecisionExplorerRecord,
  RetentionArchiveExplorerRecord,
  RuntimeEventExplorerRecord,
} from "@/types/ledger-explorer";
import type { TruthDashboardAccessLevel, TruthDashboardAccessResult, TruthDashboardIntegrityState, TruthDashboardRecordType } from "@/types/truth-dashboard";

const NOW = "2026-06-24T15:00:00.000Z";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function freezeRecord(record: LedgerExplorerRecord): LedgerExplorerRecord {
  return Object.freeze({
    ...record,
    timestamps: Object.freeze({ ...record.timestamps }),
    references: Object.freeze(Object.fromEntries(Object.entries(record.references).map(([key, value]) => [key, Object.freeze([...value])]))) as LedgerExplorerRecord["references"],
    ledger_position: Object.freeze({ ...record.ledger_position }),
    visibility: Object.freeze({ ...record.visibility }),
  });
}

export function buildLedgerExplorerContract(input: Readonly<{
  explorer_id?: string;
  tenant_id: string;
  operator_id: string;
  mission_ids?: readonly string[];
  access_level?: TruthDashboardAccessLevel;
}>): LedgerExplorerContract {
  return Object.freeze({
    explorer_id: input.explorer_id ?? "ledger_explorer_primary",
    tenant_id: input.tenant_id,
    operator_id: input.operator_id,
    scope: Object.freeze({
      mission_ids: input.mission_ids ? Object.freeze([...input.mission_ids]) : undefined,
      access_level: input.access_level ?? "READ_ONLY",
    }),
    navigation_modes: Object.freeze({
      record_index: true,
      timeline_view: true,
      graph_view: true,
      lineage_view: true,
      evidence_view: true,
      recommendation_decision_view: true,
      governance_view: true,
      runtime_event_view: true,
      integrity_chain_view: true,
      archive_view: true,
    }),
    governance: Object.freeze({
      tenant_isolation_required: true,
      operator_access_required: true,
      restricted_records_hidden: input.access_level !== "RESTRICTED_READ",
      restricted_records_redacted: true,
      mutation_blocked: true,
      approval_blocked: true,
      execution_blocked: true,
      governance_override_blocked: true,
    }),
    integrity: Object.freeze({
      integrity_state_visible: true,
      hash_chain_visible: true,
      tamper_alerts_visible: true,
      broken_reference_warnings_visible: true,
    }),
    replay: Object.freeze({
      replay_refs_visible: true,
      reconstruction_refs_visible: true,
      replay_state_visible: true,
    }),
    audit: Object.freeze({
      explorer_access_audited: true,
      restricted_access_audited: true,
      record_navigation_audited: true,
    }),
  });
}

export function buildLedgerExplorerSeedRecords(): readonly LedgerExplorerRecord[] {
  const base = [
    record("truth_rec_001", "ledger_001", "RECOMMENDATION", "VERIFIED", "VALID", "Preserve governed query contract", "Recommendation requiring all dashboard lookups through certified query paths.", 1, {
      child_refs: ["truth_rec_002", "truth_rec_004"],
      evidence_refs: ["truth_rec_003"],
      recommendation_refs: ["rec_6j_contract"],
      decision_refs: ["decision_6j_gate"],
      governance_refs: ["gov_cert_6j5"],
      replay_refs: ["replay_cert_6j5_000001"],
      integrity_refs: ["integrity_cert_6j5"],
    }),
    record("truth_rec_002", "ledger_002", "DECISION", "VERIFIED", "DEGRADED", "Release dashboard read-only", "Decision keeps approval and execution outside dashboard and explorer boundaries.", 2, {
      parent_refs: ["truth_rec_001"],
      evidence_refs: ["truth_rec_003"],
      recommendation_refs: ["rec_6j_contract"],
      decision_refs: ["decision_dashboard_read_only"],
      governance_refs: ["gov_dashboard_read_only"],
      escalation_refs: ["escalation_integrity_review"],
      replay_refs: ["replay_dashboard_view_001"],
      integrity_refs: ["integrity_dashboard_degraded"],
    }),
    record("truth_rec_003", "ledger_003", "EVIDENCE", "RESTRICTED", "CORRUPTED", "Restricted evidence bundle", "Restricted evidence is redacted and cannot support trusted interpretation.", 3, {
      parent_refs: ["truth_rec_001"],
      child_refs: ["truth_rec_002"],
      evidence_refs: ["evidence_restricted_bundle"],
      governance_refs: ["gov_restricted_evidence"],
      replay_refs: ["replay_restricted_bundle"],
      integrity_refs: ["integrity_evidence_corrupted"],
    }, true),
    record("truth_rec_004", "ledger_004", "LINEAGE", "VERIFIED", "VALID", "Query layer lineage path", "Lineage connects recommendation, decision, evidence, replay, and certification records.", 4, {
      parent_refs: ["truth_rec_001"],
      child_refs: ["truth_rec_002"],
      evidence_refs: ["truth_rec_003"],
      governance_refs: ["gov_dashboard_read_only"],
      replay_refs: ["replay_mismatch_001"],
      integrity_refs: ["integrity_lineage_valid"],
    }),
    record("truth_rec_005", "ledger_005", "GOVERNANCE", "VERIFIED", "VALID", "Governance restriction applied", "Governance policy redacts restricted evidence and blocks override from explorer surfaces.", 5, {
      parent_refs: ["truth_rec_003"],
      governance_refs: ["gov_restricted_evidence"],
      escalation_refs: ["escalation_integrity_review"],
      replay_refs: ["replay_restricted_bundle"],
      integrity_refs: ["integrity_governance_valid"],
    }),
    record("truth_rec_006", "ledger_006", "RUNTIME", "CREATED", "UNKNOWN", "Runtime query event", "Runtime read event records a governed ledger exploration query.", 6, {
      parent_refs: ["truth_rec_001"],
      governance_refs: ["gov_dashboard_read_only"],
      replay_refs: ["replay_query_event"],
      integrity_refs: ["integrity_runtime_unknown"],
    }),
    freezeRecord({
      ...record("truth_rec_beta", "ledger_beta", "RECOMMENDATION", "VERIFIED", "VALID", "Cross-tenant record", "Must never be visible to tenant alpha.", 7, {}, false, "tenant_beta"),
      mission_id: "mission_external",
    }),
  ];
  return Object.freeze(base);
}

function record(
  truthId: string,
  ledgerId: string,
  eventType: TruthDashboardRecordType,
  lifecycle: LedgerExplorerRecord["lifecycle_state"],
  integrity: TruthDashboardIntegrityState,
  title: string,
  summary: string,
  sequence: number,
  refs: Partial<LedgerExplorerRecord["references"]>,
  restricted = false,
  tenant = "tenant_alpha",
): LedgerExplorerRecord {
  return freezeRecord({
    truth_record_id: truthId,
    ledger_entry_id: ledgerId,
    tenant_id: tenant,
    mission_id: "mission_query_layer",
    event_type: eventType,
    lifecycle_state: lifecycle,
    integrity_state: integrity,
    title,
    summary,
    timestamps: { created_at: new Date(Date.parse("2026-06-24T12:00:00.000Z") + sequence * 900000).toISOString() },
    references: {
      parent_refs: refs.parent_refs ?? [],
      child_refs: refs.child_refs ?? [],
      evidence_refs: refs.evidence_refs ?? [],
      recommendation_refs: refs.recommendation_refs ?? [],
      decision_refs: refs.decision_refs ?? [],
      governance_refs: refs.governance_refs ?? [],
      escalation_refs: refs.escalation_refs ?? [],
      replay_refs: refs.replay_refs ?? [],
      integrity_refs: refs.integrity_refs ?? [],
    },
    ledger_position: {
      sequence_number: sequence,
      partition_id: "truth-ledger-main",
      previous_hash: sequence > 1 ? `hash_ledger_${String(sequence - 1).padStart(3, "0")}` : undefined,
      current_hash: integrity === "CORRUPTED" ? "hash_broken_003" : `hash_ledger_${String(sequence).padStart(3, "0")}`,
      next_hash: `hash_ledger_${String(sequence + 1).padStart(3, "0")}`,
    },
    visibility: {
      restricted,
      redacted: restricted,
      hidden: false,
      access_result: restricted ? "REDACTED" : "ALLOWED",
      restriction_reason: restricted ? "Restricted ledger record redacts raw evidence content." : undefined,
    },
  });
}

function redacted(record: LedgerExplorerRecord): LedgerExplorerRecord {
  if (!record.visibility.restricted) return record;
  return freezeRecord({
    ...record,
    title: "Restricted ledger record",
    summary: "This ledger record is restricted by governance policy. Raw content is not visible.",
    references: {
      ...record.references,
      evidence_refs: [],
      recommendation_refs: [],
      decision_refs: [],
      replay_refs: record.references.replay_refs,
    },
    visibility: { ...record.visibility, redacted: true, access_result: "REDACTED" },
  });
}

function accessResult(contract: LedgerExplorerContract, record: LedgerExplorerRecord): TruthDashboardAccessResult {
  if (record.tenant_id !== contract.tenant_id) return "FAILED_CLOSED";
  if (!record.visibility.restricted) return "ALLOWED";
  return contract.scope.access_level === "RESTRICTED_READ" ? "REDACTED" : "DENIED";
}

function inScope(contract: LedgerExplorerContract, record: LedgerExplorerRecord): boolean {
  if (record.tenant_id !== contract.tenant_id) return false;
  if (contract.scope.mission_ids?.length && (!record.mission_id || !contract.scope.mission_ids.includes(record.mission_id))) return false;
  if (contract.scope.event_types?.length && !contract.scope.event_types.includes(record.event_type)) return false;
  if (contract.scope.truth_record_ids?.length && !contract.scope.truth_record_ids.includes(record.truth_record_id)) return false;
  if (contract.scope.ledger_ids?.length && !contract.scope.ledger_ids.includes(record.ledger_entry_id)) return false;
  if (contract.scope.time_range) {
    const time = Date.parse(record.timestamps.created_at);
    if (time < Date.parse(contract.scope.time_range.from) || time > Date.parse(contract.scope.time_range.to)) return false;
  }
  return true;
}

function matchesQuery(record: LedgerExplorerRecord, query: LedgerExplorerQuery): boolean {
  if (record.tenant_id !== query.tenant_id) return false;
  if (query.filters.mission_id && record.mission_id !== query.filters.mission_id) return false;
  if (query.filters.truth_record_id && record.truth_record_id !== query.filters.truth_record_id) return false;
  if (query.filters.event_type && record.event_type !== query.filters.event_type) return false;
  if (query.filters.lifecycle_state && record.lifecycle_state !== query.filters.lifecycle_state) return false;
  if (query.filters.integrity_state && record.integrity_state !== query.filters.integrity_state) return false;
  if (query.filters.restricted !== undefined && record.visibility.restricted !== query.filters.restricted) return false;
  if (query.filters.archived !== undefined && (record.lifecycle_state === "ARCHIVED") !== query.filters.archived) return false;
  if (query.filters.search_text) {
    const haystack = `${record.truth_record_id} ${record.ledger_entry_id} ${record.title} ${record.summary} ${record.event_type}`.toLowerCase();
    if (!haystack.includes(query.filters.search_text.toLowerCase())) return false;
  }
  return true;
}

export function queryLedgerExplorerRecords(
  contract: LedgerExplorerContract,
  query: LedgerExplorerQuery,
  records: readonly LedgerExplorerRecord[] = buildLedgerExplorerSeedRecords(),
): readonly LedgerExplorerRecord[] {
  if (query.tenant_id !== contract.tenant_id || query.operator_id !== contract.operator_id) return Object.freeze([]);
  if (query.governance_context.access_level !== contract.scope.access_level) return Object.freeze([]);
  return Object.freeze(records
    .filter((item) => inScope(contract, item) && matchesQuery(item, query))
    .filter((item) => item.visibility.restricted ? query.governance_context.restricted_access_allowed || contract.scope.access_level === "RESTRICTED_READ" : true)
    .map((item) => accessResult(contract, item) === "REDACTED" ? redacted(item) : item)
    .sort((a, b) => (a.ledger_position.sequence_number ?? 0) - (b.ledger_position.sequence_number ?? 0) || a.truth_record_id.localeCompare(b.truth_record_id)));
}

export function createLedgerTimeline(records: readonly LedgerExplorerRecord[]): readonly LedgerTimelineEvent[] {
  const ordered = [...records].sort((a, b) => a.timestamps.created_at.localeCompare(b.timestamps.created_at) || a.truth_record_id.localeCompare(b.truth_record_id));
  return Object.freeze(ordered.map((record, index) => Object.freeze({
    timeline_event_id: `timeline_${record.truth_record_id}`,
    truth_record_id: record.truth_record_id,
    ledger_entry_id: record.ledger_entry_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    event_type: record.event_type,
    lifecycle_state: record.lifecycle_state,
    integrity_state: record.integrity_state,
    timestamp: record.timestamps.created_at,
    title: record.title,
    summary: record.summary,
    sequence_number: record.ledger_position.sequence_number,
    relationships: Object.freeze({
      previous_event_ref: ordered[index - 1]?.truth_record_id,
      next_event_ref: ordered[index + 1]?.truth_record_id,
      parent_refs: record.references.parent_refs,
      child_refs: record.references.child_refs,
      causal_refs: unique([...record.references.parent_refs, ...record.references.evidence_refs]),
    }),
    visibility: Object.freeze({ restricted: record.visibility.restricted, redacted: record.visibility.redacted }),
  })));
}

export function createLedgerGraph(records: readonly LedgerExplorerRecord[]): Readonly<{ nodes: readonly LedgerGraphNode[]; edges: readonly LedgerGraphEdge[] }> {
  const nodeFor = (record: LedgerExplorerRecord): LedgerGraphNode => Object.freeze({
    node_id: `node_${record.truth_record_id}`,
    truth_record_id: record.truth_record_id,
    node_type: record.event_type === "RECOMMENDATION" ? "RECOMMENDATION" : record.event_type === "DECISION" ? "DECISION" : record.event_type === "EVIDENCE" ? "EVIDENCE" : record.event_type === "GOVERNANCE" ? "GOVERNANCE" : record.event_type === "RUNTIME" ? "RUNTIME" : record.event_type === "REPLAY" ? "REPLAY" : "TRUTH_RECORD",
    title: record.title,
    summary: record.summary,
    lifecycle_state: record.lifecycle_state,
    integrity_state: record.integrity_state,
    restricted: record.visibility.restricted,
    redacted: record.visibility.redacted,
  });
  const edges: LedgerGraphEdge[] = [];
  for (const record of records) {
    for (const target of record.references.child_refs) edges.push(edge(record.truth_record_id, target, "PARENT_OF", record.integrity_state, record.visibility.restricted));
    for (const target of record.references.evidence_refs) edges.push(edge(record.truth_record_id, target, "SUPPORTS", record.integrity_state, record.visibility.restricted));
    for (const target of record.references.governance_refs) edges.push(edge(record.truth_record_id, target, "GOVERNED_BY", record.integrity_state, record.visibility.restricted));
    for (const target of record.references.replay_refs) edges.push(edge(record.truth_record_id, target, "REPLAY_OF", record.integrity_state, record.visibility.restricted));
    if (record.ledger_position.previous_hash) edges.push(edge(record.ledger_position.previous_hash, record.ledger_position.current_hash ?? record.truth_record_id, "HASH_PRECEDES", record.integrity_state, false));
  }
  return Object.freeze({ nodes: Object.freeze(records.map(nodeFor)), edges: Object.freeze(edges) });
}

function edge(source: string, target: string, relationship: LedgerGraphEdge["relationship_type"], integrity: TruthDashboardIntegrityState, restricted: boolean): LedgerGraphEdge {
  return Object.freeze({
    edge_id: `edge_${source}_${relationship}_${target}`,
    source_node_id: source.startsWith("hash_") ? source : `node_${source}`,
    target_node_id: target.startsWith("hash_") ? target : target.startsWith("truth_") ? `node_${target}` : target,
    relationship_type: relationship,
    integrity_state: integrity,
    restricted,
  });
}

export function createLedgerDrilldown(record: LedgerExplorerRecord, access_result: TruthDashboardAccessResult): LedgerRecordDrilldown {
  return Object.freeze({
    truth_record_id: record.truth_record_id,
    ledger_entry_id: record.ledger_entry_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    record_summary: Object.freeze({
      event_type: record.event_type,
      title: record.title,
      summary: record.summary,
      lifecycle_state: record.lifecycle_state,
      created_at: record.timestamps.created_at,
    }),
    ledger_metadata: Object.freeze({
      sequence_number: record.ledger_position.sequence_number,
      partition_id: record.ledger_position.partition_id,
      write_timestamp: record.timestamps.created_at,
      previous_hash: record.ledger_position.previous_hash,
      current_hash: record.ledger_position.current_hash,
      next_hash: record.ledger_position.next_hash,
    }),
    relationships: record.references,
    integrity: Object.freeze({
      integrity_state: record.integrity_state,
      hash_chain_state: record.integrity_state === "CORRUPTED" ? "BROKEN" : record.integrity_state === "UNKNOWN" ? "UNKNOWN" : "VALID",
      tamper_detection_state: record.integrity_state === "CORRUPTED" ? "CONFIRMED" : record.integrity_state === "DEGRADED" ? "SUSPECTED" : "CLEAR",
    }),
    visibility: Object.freeze({ restricted: record.visibility.restricted, redacted: record.visibility.redacted, access_result }),
  });
}

export function createEvidenceRelationshipRecords(record: LedgerExplorerRecord): readonly EvidenceRelationshipExplorerRecord[] {
  return Object.freeze(record.references.evidence_refs.map((evidence_id) => Object.freeze({
    evidence_id,
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    evidence_type: record.visibility.redacted ? "DOCUMENT" as const : "OBSERVATION" as const,
    evidence_state: record.visibility.redacted ? "RESTRICTED" as const : record.integrity_state === "CORRUPTED" ? "CONFLICTING" as const : "VERIFIED" as const,
    supports: record.references.recommendation_refs,
    conflicts_with: record.integrity_state === "CORRUPTED" ? Object.freeze(["trusted_interpretation"]) : Object.freeze([]),
    derived_from: record.references.parent_refs,
    used_by_replay_refs: record.references.replay_refs,
    integrity_state: record.integrity_state,
    restricted: record.visibility.restricted,
    redacted: record.visibility.redacted,
  })));
}

export function createRecommendationDecisionRecords(record: LedgerExplorerRecord): readonly RecommendationDecisionExplorerRecord[] {
  const recommendation = record.references.recommendation_refs.map((ref) => rd(record, "RECOMMENDATION", ref));
  const decision = record.references.decision_refs.map((ref) => rd(record, "DECISION", ref));
  return Object.freeze([...recommendation, ...decision]);
}

function rd(record: LedgerExplorerRecord, kind: "RECOMMENDATION" | "DECISION", ref: string): RecommendationDecisionExplorerRecord {
  return Object.freeze({
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    record_kind: kind,
    title: ref,
    summary: `${kind.toLowerCase()} reference from ${record.truth_record_id}.`,
    state: record.visibility.redacted ? "RESTRICTED" : kind === "DECISION" && record.references.escalation_refs.length ? "ESCALATED" : kind === "DECISION" ? "APPROVED" : "VALIDATED",
    recommendation_refs: record.references.recommendation_refs,
    decision_refs: record.references.decision_refs,
    evidence_refs: record.references.evidence_refs,
    governance_refs: record.references.governance_refs,
    escalation_refs: record.references.escalation_refs,
    replay_refs: record.references.replay_refs,
    risk_level: record.integrity_state === "CORRUPTED" ? "CRITICAL" : record.integrity_state === "DEGRADED" ? "MEDIUM" : "LOW",
    confidence_level: record.integrity_state === "VALID" ? "HIGH" : record.integrity_state === "DEGRADED" ? "MEDIUM" : "LOW",
    authority_boundary: kind === "RECOMMENDATION" ? "ADVISORY_ONLY" : "OPERATOR_DECISION_REQUIRED",
    integrity_state: record.integrity_state,
  });
}

export function createGovernanceRecords(record: LedgerExplorerRecord): readonly GovernanceEscalationExplorerRecord[] {
  return Object.freeze(record.references.governance_refs.map((ref) => Object.freeze({
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    record_kind: record.references.escalation_refs.length ? "ESCALATION" as const : "GOVERNANCE" as const,
    title: ref,
    summary: `Governance reference for ${record.truth_record_id}.`,
    governance_state: record.visibility.redacted ? "RESTRICTED" as const : record.integrity_state === "CORRUPTED" ? "FAILED" as const : record.references.escalation_refs.length ? "ESCALATED" as const : "PASSED" as const,
    policy_refs: [ref],
    authority_refs: ["authority_read_only"],
    recommendation_refs: record.references.recommendation_refs,
    decision_refs: record.references.decision_refs,
    evidence_refs: record.references.evidence_refs,
    replay_refs: record.references.replay_refs,
    escalation_state: record.references.escalation_refs.length ? "PENDING" as const : "NONE" as const,
    integrity_state: record.integrity_state,
    restricted: record.visibility.restricted,
  })));
}

export function createRuntimeEvents(record: LedgerExplorerRecord): readonly RuntimeEventExplorerRecord[] {
  return Object.freeze([
    Object.freeze({
      event_id: `runtime_read_${record.truth_record_id}`,
      truth_record_id: record.truth_record_id,
      ledger_entry_id: record.ledger_entry_id,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      event_type: "READ_EVENT",
      event_state: record.visibility.hidden ? "BLOCKED" : record.integrity_state === "CORRUPTED" ? "WARN" : "PASS",
      title: `Read ${record.truth_record_id}`,
      summary: "Governed ledger explorer read event.",
      timestamp: record.timestamps.created_at,
      related_truth_record_refs: [record.truth_record_id],
      governance_refs: record.references.governance_refs,
      replay_refs: record.references.replay_refs,
      integrity_refs: record.references.integrity_refs,
      restricted: record.visibility.restricted,
      redacted: record.visibility.redacted,
    }),
  ]);
}

export function createIntegrityRecord(record: LedgerExplorerRecord): LedgerIntegrityExplorerRecord {
  return Object.freeze({
    truth_record_id: record.truth_record_id,
    hash_chain_state: record.integrity_state === "CORRUPTED" ? "BROKEN" : record.integrity_state === "UNKNOWN" ? "UNKNOWN" : "VALID",
    tamper_detection_state: record.integrity_state === "CORRUPTED" ? "CONFIRMED" : record.integrity_state === "DEGRADED" ? "SUSPECTED" : "CLEAR",
    integrity_state: record.integrity_state,
    previous_hash: record.ledger_position.previous_hash,
    current_hash: record.ledger_position.current_hash,
    next_hash: record.ledger_position.next_hash,
    warnings: Object.freeze([
      record.integrity_state === "CORRUPTED" ? "Broken hash chain warning." : "",
      record.integrity_state === "DEGRADED" ? "Degraded integrity warning." : "",
      record.references.parent_refs.length === 0 && record.ledger_position.sequence_number !== 1 ? "Broken lineage warning." : "",
    ].filter(Boolean)),
  });
}

export function createArchiveRecord(record: LedgerExplorerRecord): RetentionArchiveExplorerRecord {
  return Object.freeze({
    truth_record_id: record.truth_record_id,
    lifecycle_state: record.lifecycle_state,
    archived_at: record.timestamps.archived_at,
    superseded_at: record.timestamps.superseded_at,
    retention_state: record.lifecycle_state === "ARCHIVED" ? "ARCHIVED" : "RETAINED",
    archive_refs: record.lifecycle_state === "ARCHIVED" ? [`archive_${record.truth_record_id}`] : [],
  });
}

export function createHistoricalView(records: readonly LedgerExplorerRecord[]): HistoricalLedgerExplorerView {
  return Object.freeze({
    reconstruction_id: hashValue("ledger-explorer-historical-reconstruction", records.map((item) => item.truth_record_id)),
    as_of: NOW,
    reconstruction_state: records.some((item) => item.visibility.redacted) ? "RESTRICTED" : records.some((item) => item.integrity_state === "CORRUPTED") ? "CORRUPTED" : "COMPLETE",
    reconstructed_record_refs: Object.freeze(records.map((item) => item.truth_record_id)),
    missing_refs: Object.freeze(records.filter((item) => item.references.evidence_refs.length === 0 && item.event_type !== "RUNTIME").map((item) => `evidence:${item.truth_record_id}`)),
    restricted_refs: Object.freeze(records.filter((item) => item.visibility.redacted).map((item) => item.truth_record_id)),
  });
}

export function createCrossLedgerCorrelations(record: LedgerExplorerRecord, allowed: boolean): readonly CrossLedgerCorrelationExplorerRecord[] {
  if (!allowed) return Object.freeze([]);
  return Object.freeze([...record.references.decision_refs, ...record.references.replay_refs].map((target, index) => Object.freeze({
    correlation_id: `corr_${record.truth_record_id}_${index}`,
    source_truth_record_id: record.truth_record_id,
    target_truth_record_id: target,
    relationship_type: target.startsWith("replay") ? "REPLAY_OF" as const : "INFLUENCED" as const,
    correlation_state: record.visibility.redacted ? "REDACTED" as const : "VERIFIED" as const,
    evidence_refs: record.references.evidence_refs,
    governance_refs: record.references.governance_refs,
    replay_refs: record.references.replay_refs,
    restricted: record.visibility.restricted,
  })));
}

export function buildLedgerExplorerDetail(
  contract: LedgerExplorerContract,
  truthRecordId: string,
  records: readonly LedgerExplorerRecord[] = buildLedgerExplorerSeedRecords(),
  crossLedgerAllowed = true,
): LedgerExplorerDetail {
  const source = records.find((item) => item.truth_record_id === truthRecordId);
  if (!source || source.tenant_id !== contract.tenant_id) {
    const fallback = records.find((item) => item.tenant_id === contract.tenant_id) ?? records[0];
    const record = freezeRecord({ ...fallback, visibility: { ...fallback.visibility, access_result: "FAILED_CLOSED" } });
    return detailFor(record, records.filter((item) => item.tenant_id === contract.tenant_id), "FAILED_CLOSED", ["Ledger access failed closed."], crossLedgerAllowed);
  }
  const result = accessResult(contract, source);
  if (result === "DENIED") return detailFor(source, records, "DENIED", ["Ledger record access denied by governance policy."], crossLedgerAllowed);
  const visible = result === "REDACTED" ? redacted(source) : source;
  return detailFor(visible, records.filter((item) => item.tenant_id === contract.tenant_id), result, warnings(visible), crossLedgerAllowed);
}

function detailFor(record: LedgerExplorerRecord, records: readonly LedgerExplorerRecord[], access_result: TruthDashboardAccessResult, warningList: readonly string[], crossLedgerAllowed: boolean): LedgerExplorerDetail {
  return Object.freeze({
    record,
    drilldown: createLedgerDrilldown(record, access_result),
    timeline: createLedgerTimeline(records),
    graph: createLedgerGraph(records),
    evidence: createEvidenceRelationshipRecords(record),
    recommendation_decision: createRecommendationDecisionRecords(record),
    governance: createGovernanceRecords(record),
    runtime_events: createRuntimeEvents(record),
    integrity: createIntegrityRecord(record),
    archive: createArchiveRecord(record),
    historical_reconstruction: createHistoricalView(records),
    cross_ledger_correlations: createCrossLedgerCorrelations(record, crossLedgerAllowed),
    replay_refs: record.references.replay_refs,
    warnings: Object.freeze([...warningList]),
    access_result,
  });
}

function warnings(record: LedgerExplorerRecord): readonly string[] {
  return Object.freeze([
    record.integrity_state === "CORRUPTED" ? "Corrupted ledger record warning; trusted interpretation is blocked." : "",
    record.integrity_state === "DEGRADED" ? "Degraded ledger record warning." : "",
    record.references.parent_refs.length === 0 && record.ledger_position.sequence_number !== 1 ? "Broken lineage warning." : "",
    record.references.evidence_refs.length === 0 && record.event_type !== "RUNTIME" ? "Missing evidence warning." : "",
    record.visibility.redacted ? "Restricted ledger record is redacted." : "",
  ].filter(Boolean));
}

export function createLedgerExplorerAuditEvent(input: Readonly<{
  contract: LedgerExplorerContract;
  event_type: LedgerExplorerAuditEvent["event_type"];
  access_result: TruthDashboardAccessResult;
  target_ref?: string;
  restriction_reason?: string;
  timestamp?: string;
}>): LedgerExplorerAuditEvent {
  return Object.freeze({
    audit_event_id: hashValue("mission-control-ledger-explorer-audit-event-id", { explorer_id: input.contract.explorer_id, event_type: input.event_type, target_ref: input.target_ref, timestamp: input.timestamp ?? NOW }),
    explorer_id: input.contract.explorer_id,
    tenant_id: input.contract.tenant_id,
    operator_id: input.contract.operator_id,
    event_type: input.event_type,
    target_ref: input.target_ref,
    access_result: input.access_result,
    timestamp: input.timestamp ?? NOW,
    governance_context: Object.freeze({ policy_id: "ledger_explorer_read_only_policy", access_level: input.contract.scope.access_level, restriction_reason: input.restriction_reason }),
    appendOnly: true,
    sourceMutationAllowed: false,
  });
}

export function buildLedgerExplorerView(input: Readonly<{
  tenant_id?: string;
  operator_id?: string;
  mission_id?: string;
  selected_record_id?: string;
  access_level?: TruthDashboardAccessLevel;
}> = {}): LedgerExplorerView {
  const contract = buildLedgerExplorerContract({
    tenant_id: input.tenant_id ?? "tenant_alpha",
    operator_id: input.operator_id ?? "operator_console",
    mission_ids: [input.mission_id ?? "mission_query_layer"],
    access_level: input.access_level ?? "RESTRICTED_READ",
  });
  const query: LedgerExplorerQuery = {
    tenant_id: contract.tenant_id,
    operator_id: contract.operator_id,
    filters: { mission_id: input.mission_id ?? "mission_query_layer" },
    governance_context: { access_level: contract.scope.access_level, restricted_access_allowed: contract.scope.access_level === "RESTRICTED_READ", cross_ledger_allowed: true },
  };
  const records = queryLedgerExplorerRecords(contract, query);
  const selected = buildLedgerExplorerDetail(contract, input.selected_record_id ?? records[0]?.truth_record_id ?? "truth_rec_001", buildLedgerExplorerSeedRecords(), query.governance_context.cross_ledger_allowed);
  const auditEvents = Object.freeze([
    createLedgerExplorerAuditEvent({ contract, event_type: "LEDGER_EXPLORER_OPENED", access_result: "ALLOWED" }),
    createLedgerExplorerAuditEvent({ contract, event_type: selected.access_result === "REDACTED" ? "REDACTED_RECORD_VIEWED" : "LEDGER_RECORD_VIEWED", access_result: selected.access_result, target_ref: selected.record.truth_record_id, restriction_reason: selected.record.visibility.restriction_reason }),
  ]);
  const restricted = records.some((item) => item.visibility.redacted);
  const degraded = records.some((item) => item.integrity_state !== "VALID");
  return Object.freeze({
    contract,
    state: records.length === 0 ? "FAIL_CLOSED" : restricted ? "RESTRICTED" : degraded ? "DEGRADED" : "READY",
    records,
    selected_record: selected,
    audit_events: auditEvents,
    available_filters: Object.freeze({
      event_types: unique(records.map((item) => item.event_type)) as readonly TruthDashboardRecordType[],
      lifecycle_states: unique(records.map((item) => item.lifecycle_state)),
      integrity_states: unique(records.map((item) => item.integrity_state)) as readonly TruthDashboardIntegrityState[],
    }),
    guardrails: Object.freeze([
      "read-only ledger navigation",
      "tenant isolation",
      "operator access verification",
      "restricted record redaction",
      "no ledger mutation",
      "no evidence modification",
      "no lineage rewrite",
      "no recommendation approval",
      "no decision execution",
      "no governance override",
      "fail-closed behavior",
    ]),
    query_hash: hashValue("mission-control-ledger-explorer-query-hash", query),
    generated_at: NOW,
    readOnly: true,
    mutationAllowed: false,
    approvalAllowed: false,
    executionAllowed: false,
    governanceOverrideAllowed: false,
  });
}

export function assertLedgerExplorerActionBlocked(action: "CREATE_RECORD" | "EDIT_RECORD" | "DELETE_RECORD" | "MODIFY_EVIDENCE" | "REWRITE_LINEAGE" | "APPROVE_RECOMMENDATION" | "EXECUTE_DECISION" | "OVERRIDE_GOVERNANCE" | "REPAIR_HASH_CHAIN"): never {
  throw new Error(`Ledger Explorer is read-only and blocks ${action}.`);
}
