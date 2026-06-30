import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DashboardReplayLink,
  DecisionDisplay,
  EvidenceDisplay,
  LineageDisplay,
  RecommendationDisplay,
  TruthDashboardAccessResult,
  TruthDashboardAuditEvent,
  TruthDashboardContract,
  TruthDashboardQuery,
  TruthDashboardRecord,
  TruthDashboardRecordDetail,
  TruthDashboardRecordType,
  TruthDashboardView,
} from "@/types/truth-dashboard";

const NOW = "2026-06-24T14:00:00.000Z";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function freezeRecord(record: TruthDashboardRecord): TruthDashboardRecord {
  return Object.freeze({
    ...record,
    recommendation_refs: Object.freeze([...record.recommendation_refs]),
    decision_refs: Object.freeze([...record.decision_refs]),
    evidence_refs: Object.freeze([...record.evidence_refs]),
    lineage_refs: Object.freeze([...record.lineage_refs]),
    replay_refs: Object.freeze([...record.replay_refs]),
    governance_state: Object.freeze({ ...record.governance_state }),
    confidence: record.confidence ? Object.freeze({ ...record.confidence }) : undefined,
    risk: record.risk ? Object.freeze({ ...record.risk }) : undefined,
  });
}

export function buildTruthDashboardContract(input: Readonly<{
  dashboard_id?: string;
  tenant_id: string;
  operator_id: string;
  mission_ids?: readonly string[];
  access_level?: "READ_ONLY" | "RESTRICTED_READ";
}>): TruthDashboardContract {
  return Object.freeze({
    dashboard_id: input.dashboard_id ?? "truth_dashboard_primary",
    tenant_id: input.tenant_id,
    operator_id: input.operator_id,
    scope: Object.freeze({
      mission_ids: input.mission_ids ? Object.freeze([...input.mission_ids]) : undefined,
      access_level: input.access_level ?? "READ_ONLY",
    }),
    displays: Object.freeze({
      recommendations: true,
      decisions: true,
      evidence: true,
      lineage: true,
    }),
    governance: Object.freeze({
      tenant_isolation_required: true,
      restricted_records_hidden: input.access_level !== "RESTRICTED_READ",
      authority_escalation_blocked: true,
      mutation_blocked: true,
    }),
    replay: Object.freeze({
      replay_refs_visible: true,
      reconstruction_links_visible: true,
    }),
    integrity: Object.freeze({
      integrity_state_visible: true,
      tamper_alerts_visible: true,
    }),
  });
}

export function buildTruthDashboardSeedRecords(): readonly TruthDashboardRecord[] {
  return Object.freeze([
    freezeRecord({
      truth_record_id: "truth_rec_001",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      event_type: "RECOMMENDATION",
      lifecycle_state: "ACTIVE",
      integrity_state: "VALID",
      title: "Preserve governed query contract before dashboard release",
      summary: "Recommendation requires every dashboard lookup to enter through the certified 6J query path.",
      recommendation_refs: ["rec_6j_contract"],
      decision_refs: ["decision_6j_gate"],
      evidence_refs: ["evidence_query_contract_tests", "evidence_search_tests"],
      lineage_refs: ["lineage_6j_001"],
      replay_refs: ["replay_cert_6j5_000001"],
      created_at: "2026-06-24T12:00:00.000Z",
      governance_state: {
        restricted: false,
        redacted: false,
        escalation_required: false,
        authority_boundary: "ADVISORY_ONLY",
      },
      confidence: { score: 0.91, label: "HIGH", rationale: "Certification test matrix passed and replay refs are present." },
      risk: { score: 0.24, label: "LOW", rationale: "No mutation or authority path is exposed by the dashboard." },
    }),
    freezeRecord({
      truth_record_id: "truth_rec_002",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      event_type: "DECISION",
      lifecycle_state: "ACTIVE",
      integrity_state: "DEGRADED",
      title: "Release dashboard in read-only observation mode",
      summary: "Decision keeps approval and execution outside the Truth Dashboard boundary.",
      recommendation_refs: ["rec_6j_contract"],
      decision_refs: ["decision_dashboard_read_only"],
      evidence_refs: ["evidence_dashboard_guardrails"],
      lineage_refs: ["lineage_6k_001"],
      replay_refs: ["replay_dashboard_view_001"],
      created_at: "2026-06-24T12:30:00.000Z",
      governance_state: {
        restricted: false,
        redacted: false,
        escalation_required: true,
        authority_boundary: "GOVERNED_READ",
      },
      confidence: { score: 0.73, label: "MEDIUM", rationale: "Replay linkage exists, but one downstream audit projection is incomplete." },
      risk: { score: 0.52, label: "MEDIUM", rationale: "Integrity is degraded, so trusted interpretation requires visible warning." },
    }),
    freezeRecord({
      truth_record_id: "truth_rec_003",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      event_type: "EVIDENCE",
      lifecycle_state: "ACTIVE",
      integrity_state: "CORRUPTED",
      title: "Restricted evidence bundle",
      summary: "Restricted evidence is available only as a redacted dashboard notice.",
      recommendation_refs: ["rec_6j_contract"],
      decision_refs: ["decision_6j_gate"],
      evidence_refs: ["evidence_restricted_bundle"],
      lineage_refs: ["lineage_evidence_restricted"],
      replay_refs: ["replay_restricted_bundle"],
      created_at: "2026-06-24T12:45:00.000Z",
      governance_state: {
        restricted: true,
        redacted: true,
        escalation_required: true,
        authority_boundary: "GOVERNED_READ",
        restriction_reason: "Restricted evidence may not expose raw contents through the dashboard.",
      },
      confidence: { score: 0.36, label: "LOW", rationale: "Evidence integrity is corrupted and requires verification." },
      risk: { score: 0.9, label: "CRITICAL", rationale: "Corrupted evidence must not be interpreted as trusted truth." },
    }),
    freezeRecord({
      truth_record_id: "truth_rec_004",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      event_type: "LINEAGE",
      lifecycle_state: "ACTIVE",
      integrity_state: "VALID",
      title: "Query layer lineage path",
      summary: "Lineage connects recommendation, decision, evidence, replay, and certification records.",
      recommendation_refs: ["rec_6j_contract"],
      decision_refs: ["decision_dashboard_read_only"],
      evidence_refs: ["evidence_query_contract_tests"],
      lineage_refs: ["lineage_6j_001", "lineage_6k_001"],
      replay_refs: ["replay_cert_6j5_000001"],
      created_at: "2026-06-24T13:00:00.000Z",
      governance_state: {
        restricted: false,
        redacted: false,
        escalation_required: false,
        authority_boundary: "READ_ONLY",
      },
      confidence: { score: 0.86, label: "HIGH", rationale: "Lineage references are complete and visible." },
      risk: { score: 0.18, label: "LOW", rationale: "No broken lineage segment is visible." },
    }),
    freezeRecord({
      truth_record_id: "truth_rec_beta",
      tenant_id: "tenant_beta",
      mission_id: "mission_external",
      event_type: "RECOMMENDATION",
      lifecycle_state: "ACTIVE",
      integrity_state: "VALID",
      title: "Cross-tenant record",
      summary: "This record must never appear in tenant alpha dashboard results.",
      recommendation_refs: ["rec_beta"],
      decision_refs: [],
      evidence_refs: [],
      lineage_refs: [],
      replay_refs: [],
      created_at: "2026-06-24T13:20:00.000Z",
      governance_state: {
        restricted: false,
        redacted: false,
        escalation_required: false,
        authority_boundary: "READ_ONLY",
      },
    }),
  ]);
}

function redacted(record: TruthDashboardRecord): TruthDashboardRecord {
  if (!record.governance_state.restricted) return record;
  return freezeRecord({
    ...record,
    title: "Restricted truth record",
    summary: "This record is restricted by governance policy. Raw contents are not visible in this dashboard.",
    recommendation_refs: [],
    decision_refs: [],
    evidence_refs: [],
    lineage_refs: [],
    replay_refs: record.replay_refs,
    governance_state: {
      ...record.governance_state,
      redacted: true,
    },
    confidence: undefined,
    risk: record.risk,
  });
}

function accessResult(contract: TruthDashboardContract, record: TruthDashboardRecord): TruthDashboardAccessResult {
  if (record.tenant_id !== contract.tenant_id) return "FAILED_CLOSED";
  if (!record.governance_state.restricted) return "ALLOWED";
  return contract.scope.access_level === "RESTRICTED_READ" ? "REDACTED" : "DENIED";
}

function withinContractScope(contract: TruthDashboardContract, record: TruthDashboardRecord): boolean {
  if (record.tenant_id !== contract.tenant_id) return false;
  if (contract.scope.mission_ids?.length && (!record.mission_id || !contract.scope.mission_ids.includes(record.mission_id))) return false;
  if (contract.scope.truth_record_types?.length && !contract.scope.truth_record_types.includes(record.event_type)) return false;
  if (contract.scope.time_range) {
    const created = Date.parse(record.created_at);
    if (created < Date.parse(contract.scope.time_range.from) || created > Date.parse(contract.scope.time_range.to)) return false;
  }
  return true;
}

function matchesQuery(record: TruthDashboardRecord, query: TruthDashboardQuery): boolean {
  if (record.tenant_id !== query.tenant_id) return false;
  if (query.filters.truth_record_id && record.truth_record_id !== query.filters.truth_record_id) return false;
  if (query.filters.mission_id && record.mission_id !== query.filters.mission_id) return false;
  if (query.filters.event_type && record.event_type !== query.filters.event_type) return false;
  if (query.filters.lifecycle_state && record.lifecycle_state !== query.filters.lifecycle_state) return false;
  if (query.filters.integrity_state && record.integrity_state !== query.filters.integrity_state) return false;
  if (query.filters.restricted !== undefined && record.governance_state.restricted !== query.filters.restricted) return false;
  if (query.filters.risk_label && record.risk?.label !== query.filters.risk_label) return false;
  if (query.filters.confidence_label && record.confidence?.label !== query.filters.confidence_label) return false;
  if (query.filters.replay_available !== undefined && (record.replay_refs.length > 0) !== query.filters.replay_available) return false;
  if (query.filters.time_range) {
    const created = Date.parse(record.created_at);
    if (created < Date.parse(query.filters.time_range.from) || created > Date.parse(query.filters.time_range.to)) return false;
  }
  if (query.filters.search_text) {
    const needle = query.filters.search_text.toLowerCase();
    const haystack = `${record.truth_record_id} ${record.title} ${record.summary} ${record.event_type} ${record.mission_id ?? ""}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export function queryTruthDashboardRecords(
  contract: TruthDashboardContract,
  query: TruthDashboardQuery,
  records: readonly TruthDashboardRecord[] = buildTruthDashboardSeedRecords(),
): readonly TruthDashboardRecord[] {
  if (query.tenant_id !== contract.tenant_id || query.operator_id !== contract.operator_id) return Object.freeze([]);
  if (!query.governance_context.access_level || query.governance_context.access_level !== contract.scope.access_level) return Object.freeze([]);

  return Object.freeze(records
    .filter((record) => withinContractScope(contract, record) && matchesQuery(record, query))
    .filter((record) => record.governance_state.restricted ? query.governance_context.restricted_access_allowed || contract.scope.access_level === "RESTRICTED_READ" : true)
    .map((record) => record.governance_state.restricted ? redacted(record) : record)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.truth_record_id.localeCompare(b.truth_record_id)));
}

export function createRecommendationDisplay(record: TruthDashboardRecord): RecommendationDisplay | undefined {
  if (record.event_type !== "RECOMMENDATION") return undefined;
  return Object.freeze({
    recommendation_id: record.recommendation_refs[0] ?? record.truth_record_id,
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    recommendation_title: record.title,
    recommendation_summary: record.summary,
    recommendation_state: record.governance_state.restricted ? "RESTRICTED" : "VALIDATED",
    rationale: record.confidence?.rationale ?? "Recommendation is visible through governed query certification.",
    supporting_evidence_refs: record.evidence_refs,
    conflicting_evidence_refs: record.risk && record.risk.score > 0.7 ? ["conflict_high_risk"] : Object.freeze([]),
    decision_refs: record.decision_refs,
    governance_refs: Object.freeze(["governance_dashboard_read_only"]),
    risk_refs: record.risk ? Object.freeze([`risk_${record.truth_record_id}`]) : Object.freeze([]),
    confidence_refs: record.confidence ? Object.freeze([`confidence_${record.truth_record_id}`]) : Object.freeze([]),
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    authority_boundary: "ADVISORY_ONLY",
    created_at: record.created_at,
  });
}

export function createDecisionDisplay(record: TruthDashboardRecord): DecisionDisplay | undefined {
  if (record.event_type !== "DECISION") return undefined;
  return Object.freeze({
    decision_id: record.decision_refs[0] ?? record.truth_record_id,
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    decision_title: record.title,
    decision_summary: record.summary,
    decision_state: record.governance_state.restricted ? "RESTRICTED" : record.governance_state.escalation_required ? "ESCALATED" : "APPROVED",
    decision_actor: Object.freeze({ actor_id: "operator_view_only", actor_type: "OPERATOR" as const }),
    recommendation_refs: record.recommendation_refs,
    evidence_refs: record.evidence_refs,
    governance_refs: Object.freeze(["governance_dashboard_read_only"]),
    escalation_refs: record.governance_state.escalation_required ? Object.freeze(["escalation_integrity_review"]) : Object.freeze([]),
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    decision_timestamp: record.created_at,
    governance_result: Object.freeze({
      policy_checked: true,
      authority_verified: true,
      escalation_required: record.governance_state.escalation_required,
      restriction_applied: record.governance_state.restricted,
    }),
  });
}

export function createEvidenceDisplay(record: TruthDashboardRecord): EvidenceDisplay | undefined {
  if (record.event_type !== "EVIDENCE") return undefined;
  return Object.freeze({
    evidence_id: record.evidence_refs[0] ?? record.truth_record_id,
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    evidence_type: record.governance_state.redacted ? "DOCUMENT" : "OBSERVATION",
    evidence_title: record.title,
    evidence_summary: record.summary,
    evidence_state: record.governance_state.redacted ? "RESTRICTED" : record.integrity_state === "CORRUPTED" ? "CONFLICTING" : "VERIFIED",
    integrity_state: record.integrity_state,
    supports: record.recommendation_refs,
    conflicts_with: record.integrity_state === "CORRUPTED" ? Object.freeze(["trusted_interpretation"]) : Object.freeze([]),
    derived_from: Object.freeze(["query_layer_certification"]),
    recommendation_refs: record.recommendation_refs,
    decision_refs: record.decision_refs,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    source: Object.freeze({
      source_id: record.governance_state.redacted ? undefined : "source_truth_ledger",
      source_type: record.governance_state.redacted ? "RESTRICTED" : "TRUTH_LEDGER",
      source_timestamp: record.created_at,
    }),
    created_at: record.created_at,
  });
}

export function createLineageDisplay(record: TruthDashboardRecord): LineageDisplay {
  const restricted = record.governance_state.restricted;
  const broken = record.event_type === "EVIDENCE" && record.integrity_state === "CORRUPTED";
  return Object.freeze({
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    parent_refs: restricted ? Object.freeze([]) : record.evidence_refs,
    child_refs: restricted ? Object.freeze([]) : [...record.recommendation_refs, ...record.decision_refs],
    ancestor_refs: restricted ? Object.freeze([]) : record.lineage_refs,
    descendant_refs: restricted ? Object.freeze([]) : record.replay_refs,
    evidence_lineage_refs: restricted ? Object.freeze([]) : record.evidence_refs,
    recommendation_lineage_refs: restricted ? Object.freeze([]) : record.recommendation_refs,
    decision_lineage_refs: restricted ? Object.freeze([]) : record.decision_refs,
    governance_lineage_refs: Object.freeze(["governance_dashboard_read_only"]),
    replay_lineage_refs: record.replay_refs,
    lineage_state: restricted ? "RESTRICTED" : broken ? "BROKEN" : record.lineage_refs.length > 0 ? "COMPLETE" : "PARTIAL",
    causality: Object.freeze({
      source_refs: restricted ? Object.freeze([]) : record.evidence_refs,
      influence_refs: restricted ? Object.freeze([]) : record.recommendation_refs,
      dependency_refs: restricted ? Object.freeze([]) : record.decision_refs,
    }),
    evolution: Object.freeze({
      supersedes: Object.freeze([]),
      branch_refs: restricted ? Object.freeze([]) : record.lineage_refs,
      modification_refs: Object.freeze([]),
    }),
  });
}

export function createReplayLinks(record: TruthDashboardRecord): readonly DashboardReplayLink[] {
  return Object.freeze(record.replay_refs.map((replay_ref) => Object.freeze({
    replay_ref,
    truth_record_id: record.truth_record_id,
    replay_state: record.integrity_state === "CORRUPTED" ? "INVALID" : record.integrity_state === "DEGRADED" ? "INCOMPLETE" : "REPRODUCED",
    reconstruction_available: record.integrity_state !== "CORRUPTED",
    replay_timestamp: record.created_at,
    governance_restricted: record.governance_state.restricted,
  })));
}

function warnings(record: TruthDashboardRecord, lineage: LineageDisplay): readonly string[] {
  return Object.freeze([
    record.integrity_state === "DEGRADED" ? "Integrity is degraded; verify before relying on this record." : "",
    record.integrity_state === "CORRUPTED" ? "Integrity is corrupted; trusted interpretation is blocked." : "",
    record.evidence_refs.length === 0 ? "Missing evidence reference." : "",
    lineage.lineage_state === "BROKEN" ? "Broken lineage warning." : "",
    record.governance_state.redacted ? "Restricted record content is redacted." : "",
  ].filter(Boolean));
}

export function buildTruthDashboardRecordDetail(
  contract: TruthDashboardContract,
  truthRecordId: string,
  records: readonly TruthDashboardRecord[] = buildTruthDashboardSeedRecords(),
): TruthDashboardRecordDetail {
  const source = records.find((record) => record.truth_record_id === truthRecordId);
  if (!source || source.tenant_id !== contract.tenant_id) {
    const denied = redacted(records.find((record) => record.tenant_id === contract.tenant_id) ?? records[0]);
    return Object.freeze({
      record: denied,
      lineage: createLineageDisplay(denied),
      replay_links: Object.freeze([]),
      integrity_indicators: Object.freeze(["FAIL_CLOSED"]),
      warnings: Object.freeze(["Record access failed closed."]),
      access_result: "FAILED_CLOSED",
    });
  }

  const result = accessResult(contract, source);
  const visible = result === "REDACTED" ? redacted(source) : source;
  const lineage = createLineageDisplay(visible);
  return Object.freeze({
    record: visible,
    recommendation: createRecommendationDisplay(visible),
    decision: createDecisionDisplay(visible),
    evidence: createEvidenceDisplay(visible),
    lineage,
    replay_links: createReplayLinks(visible),
    integrity_indicators: Object.freeze([
      `integrity:${visible.integrity_state}`,
      `tamper:${visible.integrity_state === "CORRUPTED" ? "ALERT" : "CLEAR"}`,
      `lineage:${lineage.lineage_state}`,
      `replay:${visible.replay_refs.length > 0 ? "LINKED" : "MISSING"}`,
    ]),
    warnings: warnings(visible, lineage),
    access_result: result,
  });
}

export function createTruthDashboardAuditEvent(input: Readonly<{
  contract: TruthDashboardContract;
  event_type: TruthDashboardAuditEvent["event_type"];
  access_result: TruthDashboardAccessResult;
  truth_record_id?: string;
  restriction_reason?: string;
  timestamp?: string;
}>): TruthDashboardAuditEvent {
  return Object.freeze({
    audit_event_id: hashValue("mission-control-truth-dashboard-audit-event-id", {
      dashboard_id: input.contract.dashboard_id,
      tenant_id: input.contract.tenant_id,
      operator_id: input.contract.operator_id,
      event_type: input.event_type,
      truth_record_id: input.truth_record_id,
      timestamp: input.timestamp ?? NOW,
    }),
    dashboard_id: input.contract.dashboard_id,
    tenant_id: input.contract.tenant_id,
    operator_id: input.contract.operator_id,
    event_type: input.event_type,
    truth_record_id: input.truth_record_id,
    access_result: input.access_result,
    timestamp: input.timestamp ?? NOW,
    governance_context: Object.freeze({
      policy_id: "truth_dashboard_read_only_policy",
      access_level: input.contract.scope.access_level,
      restriction_reason: input.restriction_reason,
    }),
    appendOnly: true,
    sourceMutationAllowed: false,
  });
}

export function buildTruthDashboardView(input: Readonly<{
  tenant_id?: string;
  operator_id?: string;
  mission_id?: string;
  selected_record_id?: string;
  access_level?: "READ_ONLY" | "RESTRICTED_READ";
}> = {}): TruthDashboardView {
  const contract = buildTruthDashboardContract({
    tenant_id: input.tenant_id ?? "tenant_alpha",
    operator_id: input.operator_id ?? "operator_console",
    mission_ids: [input.mission_id ?? "mission_query_layer"],
    access_level: input.access_level ?? "RESTRICTED_READ",
  });
  const query: TruthDashboardQuery = {
    tenant_id: contract.tenant_id,
    operator_id: contract.operator_id,
    query_type: "HISTORICAL_RECONSTRUCTION",
    filters: { mission_id: input.mission_id ?? "mission_query_layer" },
    governance_context: {
      access_level: contract.scope.access_level,
      restricted_access_allowed: contract.scope.access_level === "RESTRICTED_READ",
    },
  };
  const records = queryTruthDashboardRecords(contract, query);
  const selected = buildTruthDashboardRecordDetail(contract, input.selected_record_id ?? records[0]?.truth_record_id ?? "truth_rec_001");
  const auditEvents = Object.freeze([
    createTruthDashboardAuditEvent({ contract, event_type: "dashboard_view_opened", access_result: "ALLOWED" }),
    createTruthDashboardAuditEvent({
      contract,
      event_type: selected.access_result === "REDACTED" ? "redacted_record_viewed" : "truth_record_viewed",
      access_result: selected.access_result,
      truth_record_id: selected.record.truth_record_id,
      restriction_reason: selected.record.governance_state.restriction_reason,
    }),
  ]);
  const degraded = records.some((record) => record.integrity_state === "DEGRADED" || record.integrity_state === "CORRUPTED");
  const restricted = records.some((record) => record.governance_state.redacted);
  const state = records.length === 0 ? "FAIL_CLOSED" : restricted ? "RESTRICTED" : degraded ? "DEGRADED" : "READY";

  return Object.freeze({
    contract,
    state,
    records,
    selected_record: selected,
    audit_events: auditEvents,
    available_filters: Object.freeze({
      missions: unique(records.flatMap((record) => record.mission_id ? [record.mission_id] : [])),
      record_types: unique(records.map((record) => record.event_type)) as readonly TruthDashboardRecordType[],
      integrity_states: unique(records.map((record) => record.integrity_state)),
    }),
    guardrails: Object.freeze([
      "read-only access",
      "tenant isolation",
      "operator access verification",
      "restricted record redaction",
      "no mutation authority",
      "no approval authority",
      "no execution authority",
      "no policy override",
      "fail-closed behavior",
    ]),
    query_hash: hashValue("mission-control-truth-dashboard-query-hash", query),
    generated_at: NOW,
    readOnly: true,
    mutationAllowed: false,
    approvalAllowed: false,
    executionAllowed: false,
  });
}

export function assertTruthDashboardActionBlocked(action: "MUTATE_RECORD" | "APPROVE_RECOMMENDATION" | "EXECUTE_DECISION" | "MODIFY_EVIDENCE" | "REWRITE_LINEAGE" | "OVERRIDE_GOVERNANCE"): never {
  throw new Error(`Truth Dashboard is read-only and blocks ${action}.`);
}
