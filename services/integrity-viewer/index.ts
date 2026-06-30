import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  HashChainStatusDisplay,
  IntegrityBlastRadiusDisplay,
  IntegrityDependencyImpactDisplay,
  IntegrityHistoryDisplay,
  IntegrityIssueAnalysis,
  IntegrityStatusRecord,
  IntegrityStatusViewerAuditEvent,
  IntegrityStatusViewerContract,
  IntegrityStatusViewerDetail,
  IntegrityStatusViewerView,
  IntegritySummaryDisplay,
  IntegrityViewerCertificationState,
  IntegrityViewerIntegrityState,
  IntegrityViewerQuery,
  IntegrityViewerTamperState,
  LedgerSegmentIntegrityDisplay,
  RecordIntegrityDisplay,
  TamperDetectionDisplay,
} from "@/types/integrity-viewer";
import type { TruthDashboardAccessLevel, TruthDashboardAccessResult } from "@/types/truth-dashboard";

const NOW = "2026-06-24T16:00:00.000Z";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function freezeRecord(record: IntegrityStatusRecord): IntegrityStatusRecord {
  return Object.freeze({
    ...record,
    target: Object.freeze({ ...record.target }),
    verification: Object.freeze({ ...record.verification }),
    impact: Object.freeze({ ...record.impact }),
    refs: Object.freeze(Object.fromEntries(Object.entries(record.refs).map(([key, value]) => [key, Object.freeze([...value])]))) as IntegrityStatusRecord["refs"],
    visibility: Object.freeze({ ...record.visibility }),
    timestamps: Object.freeze({ ...record.timestamps }),
  });
}

export function buildIntegrityStatusViewerContract(input: Readonly<{
  viewer_id?: string;
  tenant_id: string;
  operator_id: string;
  mission_ids?: readonly string[];
  access_level?: TruthDashboardAccessLevel;
}>): IntegrityStatusViewerContract {
  return Object.freeze({
    viewer_id: input.viewer_id ?? "integrity_status_viewer_primary",
    tenant_id: input.tenant_id,
    operator_id: input.operator_id,
    scope: Object.freeze({
      mission_ids: input.mission_ids ? Object.freeze([...input.mission_ids]) : undefined,
      access_level: input.access_level ?? "READ_ONLY",
    }),
    displays: Object.freeze({
      integrity_summary: true,
      record_integrity: true,
      ledger_integrity: true,
      hash_chain_status: true,
      tamper_detection_status: true,
      verification_results: true,
      certification_status: true,
      affected_records: true,
      dependency_impact: true,
      replay_impact: true,
      lineage_impact: true,
      evidence_impact: true,
      historical_integrity_status: true,
    }),
    governance: Object.freeze({
      tenant_isolation_required: true,
      operator_access_required: true,
      restricted_records_hidden: input.access_level !== "RESTRICTED_READ",
      redaction_required: true,
      mutation_blocked: true,
      hash_repair_blocked: true,
      certification_override_blocked: true,
      trusted_interpretation_blocked_when_corrupted: true,
      fail_closed_required: true,
    }),
    integrity_visibility: Object.freeze({
      states_visible: true,
      hash_chain_visible: true,
      tamper_alerts_visible: true,
      degraded_corrupted_reason_visible: true,
      verification_timestamp_visible: true,
    }),
    audit: Object.freeze({
      viewer_access_audited: true,
      restricted_access_audited: true,
      corruption_view_audited: true,
      verification_view_audited: true,
    }),
  });
}

export function buildIntegrityStatusSeedRecords(): readonly IntegrityStatusRecord[] {
  return Object.freeze([
    record("integrity_status_001", "TRUTH_RECORD", "truth_rec_001", "VALID", "PASS", "VALID", "CLEAR", "PASS", "Certified query contract integrity", "6J query contract record is fully verified.", 1),
    record("integrity_status_002", "LEDGER_ENTRY", "ledger_002", "DEGRADED", "CONDITIONAL_PASS", "PARTIAL", "SUSPECTED", "WARN", "Ledger sequence requires attention", "Sequence anomaly is bounded but still visible to operators.", 2),
    record("integrity_status_003", "EVIDENCE", "evidence_restricted_bundle", "CORRUPTED", "FAIL", "BROKEN", "CONFIRMED", "FAIL", "Restricted evidence hash mismatch", "Evidence bundle has confirmed corruption and blocks trusted interpretation.", 3, true),
    record("integrity_status_004", "LINEAGE", "lineage_query_layer", "VALID", "PASS", "VALID", "CLEAR", "PASS", "Lineage continuity verified", "Parent and child truth relationships remain consistent.", 4),
    record("integrity_status_005", "REPLAY", "replay_dashboard_view_001", "UNVERIFIED", "NOT_CERTIFIED", "UNKNOWN", "UNKNOWN", "UNKNOWN", "Replay integrity pending", "Replay view has not been certified by the integrity verification service.", 5),
    freezeRecord({
      ...record("integrity_status_beta", "TRUTH_RECORD", "truth_rec_beta", "VALID", "PASS", "VALID", "CLEAR", "PASS", "Cross-tenant integrity status", "Must never be visible to tenant alpha.", 6, false, "tenant_beta"),
      mission_id: "mission_external",
    }),
  ]);
}

function record(
  id: string,
  targetType: IntegrityStatusRecord["target"]["target_type"],
  targetId: string,
  integrity: IntegrityViewerIntegrityState,
  certification: IntegrityViewerCertificationState,
  hashState: IntegrityStatusRecord["hash_chain_state"],
  tamperState: IntegrityViewerTamperState,
  verificationResult: IntegrityStatusRecord["verification"]["verification_result"],
  title: string,
  summary: string,
  order: number,
  restricted = false,
  tenant = "tenant_alpha",
): IntegrityStatusRecord {
  const trusted = integrity !== "CORRUPTED" && tamperState !== "CONFIRMED" && certification !== "FAIL";
  return freezeRecord({
    integrity_status_id: id,
    tenant_id: tenant,
    mission_id: "mission_query_layer",
    target: { target_type: targetType, target_id: targetId },
    title,
    summary,
    integrity_state: integrity,
    certification_state: certification,
    hash_chain_state: hashState,
    tamper_detection_state: tamperState,
    verification: {
      verified: verificationResult === "PASS" || verificationResult === "WARN" || verificationResult === "FAIL",
      verification_service_ref: verificationResult === "UNKNOWN" ? undefined : "integrity_verification_service_6i4",
      verification_timestamp: verificationResult === "UNKNOWN" ? undefined : new Date(Date.parse("2026-06-24T12:00:00.000Z") + order * 600000).toISOString(),
      verification_result: verificationResult,
    },
    impact: {
      affected_truth_records: integrity === "VALID" ? 1 : integrity === "CORRUPTED" ? 4 : 2,
      affected_ledger_entries: integrity === "CORRUPTED" ? 3 : 1,
      affected_evidence: targetType === "EVIDENCE" || integrity === "CORRUPTED" ? 2 : 0,
      affected_lineage: integrity === "VALID" ? 0 : 1,
      affected_replays: integrity === "CORRUPTED" ? 2 : integrity === "UNVERIFIED" ? 1 : 0,
      affected_governance_events: integrity === "CORRUPTED" ? 2 : certification === "CONDITIONAL_PASS" ? 1 : 0,
      trusted_interpretation_allowed: trusted,
    },
    refs: {
      truth_record_refs: ["truth_rec_001", targetId.startsWith("truth_rec") ? targetId : "truth_rec_002"],
      ledger_entry_refs: [targetId.startsWith("ledger") ? targetId : `ledger_00${Math.min(order, 5)}`],
      evidence_refs: restricted ? ["evidence_restricted_bundle", "evidence_hash_mismatch"] : order === 5 ? [] : ["evidence_integrity_snapshot"],
      lineage_refs: ["lineage_query_layer"],
      replay_refs: integrity === "CORRUPTED" ? ["replay_dashboard_view_001", "replay_restricted_bundle"] : order === 5 ? ["replay_dashboard_view_001"] : [],
      governance_refs: integrity === "CORRUPTED" ? ["gov_integrity_fail_closed", "gov_restricted_evidence"] : certification === "CONDITIONAL_PASS" ? ["gov_conditional_integrity"] : ["gov_read_only_integrity_view"],
      verification_refs: verificationResult === "UNKNOWN" ? [] : [`verification_${id}`],
      certification_refs: certification === "NOT_CERTIFIED" || certification === "NOT_APPLICABLE" ? [] : [`certification_${id}`],
      tamper_alert_refs: tamperState === "CLEAR" || tamperState === "UNKNOWN" ? [] : [`tamper_${id}`],
    },
    visibility: {
      restricted,
      redacted: restricted,
      hidden: false,
      access_result: restricted ? "REDACTED" : "ALLOWED",
      restriction_reason: restricted ? "Restricted integrity record redacts raw evidence and hash material." : undefined,
    },
    timestamps: {
      detected_at: new Date(Date.parse("2026-06-24T12:00:00.000Z") + order * 600000).toISOString(),
      updated_at: new Date(Date.parse("2026-06-24T13:00:00.000Z") + order * 600000).toISOString(),
      verified_at: verificationResult === "UNKNOWN" ? undefined : new Date(Date.parse("2026-06-24T14:00:00.000Z") + order * 600000).toISOString(),
    },
  });
}

function redacted(record: IntegrityStatusRecord): IntegrityStatusRecord {
  if (!record.visibility.restricted) return record;
  return freezeRecord({
    ...record,
    title: "Restricted integrity status",
    summary: "This integrity record is restricted by governance policy. Raw evidence, replay, tamper, and hash material is redacted.",
    refs: {
      ...record.refs,
      evidence_refs: [],
      replay_refs: [],
      tamper_alert_refs: record.refs.tamper_alert_refs,
      verification_refs: record.refs.verification_refs,
      certification_refs: record.refs.certification_refs,
    },
    visibility: { ...record.visibility, redacted: true, access_result: "REDACTED" },
  });
}

function accessResult(contract: IntegrityStatusViewerContract, record: IntegrityStatusRecord): TruthDashboardAccessResult {
  if (record.tenant_id !== contract.tenant_id) return "FAILED_CLOSED";
  if (!record.visibility.restricted) return "ALLOWED";
  return contract.scope.access_level === "RESTRICTED_READ" ? "REDACTED" : "DENIED";
}

function inScope(contract: IntegrityStatusViewerContract, record: IntegrityStatusRecord): boolean {
  if (record.tenant_id !== contract.tenant_id) return false;
  if (contract.scope.mission_ids?.length && (!record.mission_id || !contract.scope.mission_ids.includes(record.mission_id))) return false;
  if (contract.scope.truth_record_ids?.length && !contract.scope.truth_record_ids.includes(record.target.target_id)) return false;
  if (contract.scope.ledger_entry_ids?.length && !record.refs.ledger_entry_refs.some((ref) => contract.scope.ledger_entry_ids?.includes(ref))) return false;
  if (contract.scope.evidence_ids?.length && !record.refs.evidence_refs.some((ref) => contract.scope.evidence_ids?.includes(ref))) return false;
  if (contract.scope.replay_ids?.length && !record.refs.replay_refs.some((ref) => contract.scope.replay_ids?.includes(ref))) return false;
  if (contract.scope.time_range) {
    const time = Date.parse(record.timestamps.detected_at);
    if (time < Date.parse(contract.scope.time_range.from) || time > Date.parse(contract.scope.time_range.to)) return false;
  }
  return true;
}

function matchesQuery(record: IntegrityStatusRecord, query: IntegrityViewerQuery): boolean {
  if (record.tenant_id !== query.tenant_id) return false;
  if (query.filters.mission_id && record.mission_id !== query.filters.mission_id) return false;
  if (query.filters.target_ref && record.target.target_id !== query.filters.target_ref && record.integrity_status_id !== query.filters.target_ref) return false;
  if (query.filters.integrity_state && record.integrity_state !== query.filters.integrity_state) return false;
  if (query.filters.certification_state && record.certification_state !== query.filters.certification_state) return false;
  if (query.filters.tamper_detection_state && record.tamper_detection_state !== query.filters.tamper_detection_state) return false;
  if (query.filters.restricted !== undefined && record.visibility.restricted !== query.filters.restricted) return false;
  if (query.filters.search_text) {
    const haystack = `${record.integrity_status_id} ${record.target.target_id} ${record.title} ${record.summary} ${record.integrity_state}`.toLowerCase();
    if (!haystack.includes(query.filters.search_text.toLowerCase())) return false;
  }
  return true;
}

export function queryIntegrityStatusRecords(
  contract: IntegrityStatusViewerContract,
  query: IntegrityViewerQuery,
  records: readonly IntegrityStatusRecord[] = buildIntegrityStatusSeedRecords(),
): readonly IntegrityStatusRecord[] {
  if (query.tenant_id !== contract.tenant_id || query.operator_id !== contract.operator_id) return Object.freeze([]);
  if (query.governance_context.access_level !== contract.scope.access_level) return Object.freeze([]);
  return Object.freeze(records
    .filter((item) => inScope(contract, item) && matchesQuery(item, query))
    .filter((item) => item.visibility.restricted ? query.governance_context.restricted_access_allowed || contract.scope.access_level === "RESTRICTED_READ" : true)
    .map((item) => accessResult(contract, item) === "REDACTED" ? redacted(item) : item)
    .sort((a, b) => a.timestamps.detected_at.localeCompare(b.timestamps.detected_at) || a.integrity_status_id.localeCompare(b.integrity_status_id)));
}

export function createIntegritySummary(records: readonly IntegrityStatusRecord[]): IntegritySummaryDisplay {
  return Object.freeze({
    total_records: records.length,
    valid_count: records.filter((item) => item.integrity_state === "VALID").length,
    degraded_count: records.filter((item) => item.integrity_state === "DEGRADED").length,
    corrupted_count: records.filter((item) => item.integrity_state === "CORRUPTED").length,
    unknown_count: records.filter((item) => item.integrity_state === "UNKNOWN").length,
    unverified_count: records.filter((item) => item.integrity_state === "UNVERIFIED").length,
    suspected_tamper_count: records.filter((item) => item.tamper_detection_state === "SUSPECTED").length,
    confirmed_tamper_count: records.filter((item) => item.tamper_detection_state === "CONFIRMED").length,
    critical_findings: Object.freeze(records.filter((item) => item.integrity_state === "CORRUPTED" || item.tamper_detection_state === "CONFIRMED").map((item) => `${item.target.target_id}:${item.integrity_state}`)),
    trusted_interpretation_allowed: records.every((item) => item.impact.trusted_interpretation_allowed),
  });
}

export function createRecordIntegrityDisplay(record: IntegrityStatusRecord): RecordIntegrityDisplay {
  const fail = record.integrity_state === "CORRUPTED";
  const warn = record.integrity_state === "DEGRADED" || record.integrity_state === "UNVERIFIED" || record.integrity_state === "UNKNOWN";
  const check = (type: RecordIntegrityDisplay["checks"][number]["check_type"], refs: readonly string[] = []): RecordIntegrityDisplay["checks"][number] => Object.freeze({
    check_id: `${record.integrity_status_id}_${type}`,
    check_type: type,
    result: fail && ["HASH_VALID", "EVIDENCE_REFS_VALID", "REPLAY_REFS_VALID"].includes(type) ? "FAIL" : warn && ["HASH_VALID", "TIMESTAMP_VALID", "LIFECYCLE_STATE_VALID"].includes(type) ? "WARN" : "PASS",
    severity: fail && ["HASH_VALID", "EVIDENCE_REFS_VALID"].includes(type) ? "CRITICAL" : warn && type === "HASH_VALID" ? "WARN" : "INFO",
    summary: `${type} evaluated for ${record.target.target_id}.`,
    refs,
  });
  return Object.freeze({
    target_ref: record.target.target_id,
    checks: Object.freeze([
      check("RECORD_CONTRACT_VALID", [record.integrity_status_id]),
      check("REQUIRED_FIELDS_PRESENT", [record.target.target_id]),
      check("TENANT_SCOPE_VALID", [record.tenant_id]),
      check("MISSION_SCOPE_VALID", record.mission_id ? [record.mission_id] : []),
      check("EVIDENCE_REFS_VALID", record.refs.evidence_refs),
      check("LINEAGE_REFS_VALID", record.refs.lineage_refs),
      check("REPLAY_REFS_VALID", record.refs.replay_refs),
      check("GOVERNANCE_REFS_VALID", record.refs.governance_refs),
      check("HASH_VALID", record.refs.ledger_entry_refs),
      check("TIMESTAMP_VALID", [record.timestamps.detected_at]),
      check("LIFECYCLE_STATE_VALID", [record.integrity_state]),
    ]),
  });
}

export function createLedgerSegmentDisplay(records: readonly IntegrityStatusRecord[], segmentId = "truth-ledger-main"): LedgerSegmentIntegrityDisplay {
  const warnings = [
    records.some((item) => item.hash_chain_state === "BROKEN") ? "BROKEN_HASH_LINK" : "",
    records.some((item) => item.integrity_state === "CORRUPTED") ? "CORRUPTED_RECORD" : "",
    records.some((item) => item.integrity_state === "UNVERIFIED") ? "UNVERIFIED_RECORD" : "",
    records.some((item) => item.visibility.redacted) ? "RESTRICTED_RECORD" : "",
    records.some((item) => item.integrity_state === "DEGRADED") ? "ORDERING_ANOMALY" : "",
  ].filter(Boolean) as LedgerSegmentIntegrityDisplay["segment_warnings"][number][];
  return Object.freeze({ segment_id: segmentId, records: Object.freeze(records.map((item) => item.target.target_id)), segment_warnings: Object.freeze(warnings) });
}

export function createHashChainDisplay(record: IntegrityStatusRecord): HashChainStatusDisplay {
  const broken = record.hash_chain_state === "BROKEN";
  return Object.freeze({
    target_ref: record.target.target_id,
    hash_chain_state: record.hash_chain_state,
    hash_links: Object.freeze([
      Object.freeze({ source_hash: `hash_prev_${record.integrity_status_id}`, target_hash: broken ? `hash_broken_${record.integrity_status_id}` : `hash_current_${record.integrity_status_id}`, valid: !broken }),
      Object.freeze({ source_hash: `hash_current_${record.integrity_status_id}`, target_hash: `hash_next_${record.integrity_status_id}`, valid: record.hash_chain_state !== "MISSING" }),
    ]),
    broken_links: Object.freeze(broken ? [`hash_prev_${record.integrity_status_id}->hash_broken_${record.integrity_status_id}`] : []),
  });
}

export function createTamperDetectionDisplay(record: IntegrityStatusRecord): TamperDetectionDisplay {
  const alert = record.tamper_detection_state === "CLEAR" || record.tamper_detection_state === "UNKNOWN" ? [] : [
    Object.freeze({
      tamper_alert_id: record.refs.tamper_alert_refs[0] ?? `tamper_${record.integrity_status_id}`,
      indicator: record.tamper_detection_state === "CONFIRMED" ? "HASH_MISMATCH" as const : "SEQUENCE_ANOMALY" as const,
      severity: record.tamper_detection_state === "CONFIRMED" ? "CRITICAL" as const : "WARN" as const,
      confidence: record.tamper_detection_state === "CONFIRMED" ? "HIGH" as const : "MEDIUM" as const,
      summary: record.tamper_detection_state === "CONFIRMED" ? "Confirmed hash mismatch blocks trusted interpretation." : "Sequence anomaly requires operator review.",
    }),
  ];
  return Object.freeze({ target_ref: record.target.target_id, tamper_detection_state: record.tamper_detection_state, alerts: Object.freeze(alert) });
}

export function createIssueAnalysis(record: IntegrityStatusRecord): IntegrityIssueAnalysis | undefined {
  if (record.integrity_state !== "DEGRADED" && record.integrity_state !== "CORRUPTED") return undefined;
  return Object.freeze({
    issue_id: `${record.integrity_state.toLowerCase()}_${record.integrity_status_id}`,
    target_ref: record.target.target_id,
    state: record.integrity_state,
    reasons: Object.freeze([
      record.hash_chain_state !== "VALID" ? `hash_chain:${record.hash_chain_state}` : "",
      record.tamper_detection_state !== "CLEAR" ? `tamper:${record.tamper_detection_state}` : "",
      record.certification_state !== "PASS" ? `certification:${record.certification_state}` : "",
    ].filter(Boolean)),
    required_operator_posture: record.integrity_state === "CORRUPTED" ? "FAIL_CLOSED" : "MONITOR",
    trusted_interpretation_allowed: record.impact.trusted_interpretation_allowed,
  });
}

export function createBlastRadius(record: IntegrityStatusRecord): IntegrityBlastRadiusDisplay {
  return Object.freeze({
    issue_id: `issue_${record.integrity_status_id}`,
    target_ref: record.target.target_id,
    affected_truth_records: record.refs.truth_record_refs,
    affected_evidence: record.refs.evidence_refs,
    affected_lineage: record.refs.lineage_refs,
    affected_replays: record.refs.replay_refs,
    affected_governance: record.refs.governance_refs,
    severity: record.integrity_state === "CORRUPTED" ? "CRITICAL" : record.integrity_state === "DEGRADED" ? "WARN" : "INFO",
  });
}

export function createDependencyImpact(record: IntegrityStatusRecord, type: IntegrityDependencyImpactDisplay["dependency_type"]): readonly IntegrityDependencyImpactDisplay[] {
  const refs = type === "EVIDENCE" ? record.refs.evidence_refs : type === "LINEAGE" ? record.refs.lineage_refs : type === "REPLAY" ? record.refs.replay_refs : record.refs.governance_refs;
  return Object.freeze(refs.map((ref) => Object.freeze({
    dependency_ref: ref,
    dependency_type: type,
    impacted_truth_records: record.refs.truth_record_refs,
    impacted_integrity_states: [record.integrity_state],
    trusted_interpretation_allowed: record.impact.trusted_interpretation_allowed,
  })));
}

export function createIntegrityHistory(record: IntegrityStatusRecord): IntegrityHistoryDisplay {
  return Object.freeze({
    target_ref: record.target.target_id,
    events: Object.freeze([
      Object.freeze({ timestamp: record.timestamps.detected_at, integrity_state: "UNKNOWN" as const, verification_result: "UNKNOWN" as const, summary: "Integrity observation registered." }),
      Object.freeze({ timestamp: record.timestamps.updated_at, integrity_state: record.integrity_state, verification_result: record.verification.verification_result, summary: record.summary }),
    ]),
  });
}

export function buildIntegrityStatusDetail(
  contract: IntegrityStatusViewerContract,
  targetRef: string,
  records: readonly IntegrityStatusRecord[] = buildIntegrityStatusSeedRecords(),
): IntegrityStatusViewerDetail {
  const tenantRecords = records.filter((item) => item.tenant_id === contract.tenant_id);
  const source = records.find((item) =>
    item.target.target_id === targetRef ||
    item.integrity_status_id === targetRef ||
    item.refs.truth_record_refs.includes(targetRef) ||
    item.refs.ledger_entry_refs.includes(targetRef) ||
    item.refs.evidence_refs.includes(targetRef) ||
    item.refs.lineage_refs.includes(targetRef) ||
    item.refs.replay_refs.includes(targetRef) ||
    item.refs.governance_refs.includes(targetRef) ||
    item.refs.tamper_alert_refs.includes(targetRef) ||
    item.refs.verification_refs.includes(targetRef) ||
    item.refs.certification_refs.includes(targetRef)
  );
  if (!source || source.tenant_id !== contract.tenant_id) {
    const fallback = tenantRecords[0] ?? records[0];
    const failed = freezeRecord({ ...fallback, visibility: { ...fallback.visibility, access_result: "FAILED_CLOSED" } });
    return detailFor(failed, tenantRecords, "FAILED_CLOSED", ["Integrity status access failed closed."], failed);
  }
  const result = accessResult(contract, source);
  if (result === "DENIED") return detailFor(source, tenantRecords, "DENIED", ["Integrity status access denied by governance policy."], source);
  const visible = result === "REDACTED" ? redacted(source) : source;
  return detailFor(visible, tenantRecords.map((item) => item.integrity_status_id === source.integrity_status_id ? visible : item), result, warnings(visible), source);
}

function detailFor(record: IntegrityStatusRecord, tenantRecords: readonly IntegrityStatusRecord[], access_result: TruthDashboardAccessResult, warningList: readonly string[], impactRecord: IntegrityStatusRecord): IntegrityStatusViewerDetail {
  const degraded = createIssueAnalysis(record);
  return Object.freeze({
    record,
    summary: createIntegritySummary(tenantRecords),
    record_integrity: createRecordIntegrityDisplay(record),
    ledger_segment: createLedgerSegmentDisplay(tenantRecords),
    hash_chain: createHashChainDisplay(record),
    tamper_detection: createTamperDetectionDisplay(record),
    verification_result: Object.freeze({
      verification_id: record.refs.verification_refs[0] ?? `verification_${record.integrity_status_id}`,
      target_ref: record.target.target_id,
      result: record.verification.verification_result,
      verified_at: record.verification.verification_timestamp,
      service_ref: record.verification.verification_service_ref,
      summary: `Verification result is ${record.verification.verification_result}.`,
    }),
    certification_gate: Object.freeze({
      certification_id: record.refs.certification_refs[0] ?? `certification_${record.integrity_status_id}`,
      target_ref: record.target.target_id,
      certification_state: record.certification_state,
      gate_ref: "integrity_certification_gate_6i5",
      summary: `Certification gate returned ${record.certification_state}.`,
      trusted_interpretation_allowed: record.impact.trusted_interpretation_allowed,
    }),
    degraded_analysis: degraded?.state === "DEGRADED" ? degraded : undefined,
    corrupted_analysis: degraded?.state === "CORRUPTED" ? degraded : undefined,
    blast_radius: createBlastRadius(impactRecord),
    evidence_impact: createDependencyImpact(impactRecord, "EVIDENCE"),
    lineage_impact: createDependencyImpact(impactRecord, "LINEAGE"),
    replay_impact: createDependencyImpact(impactRecord, "REPLAY"),
    governance_impact: createDependencyImpact(impactRecord, "GOVERNANCE"),
    history: createIntegrityHistory(record),
    warnings: Object.freeze([...warningList]),
    access_result,
  });
}

function warnings(record: IntegrityStatusRecord): readonly string[] {
  return Object.freeze([
    record.integrity_state === "CORRUPTED" ? "Corrupted integrity status blocks trusted interpretation." : "",
    record.integrity_state === "DEGRADED" ? "Degraded integrity status requires operator review." : "",
    record.integrity_state === "UNVERIFIED" ? "Unverified integrity status cannot be certified as trusted." : "",
    record.hash_chain_state === "BROKEN" ? "Broken hash chain warning." : "",
    record.tamper_detection_state === "CONFIRMED" ? "Confirmed tamper warning." : "",
    record.visibility.redacted ? "Restricted integrity record is redacted." : "",
  ].filter(Boolean));
}

export function createIntegrityViewerAuditEvent(input: Readonly<{
  contract: IntegrityStatusViewerContract;
  event_type: IntegrityStatusViewerAuditEvent["event_type"];
  access_result: TruthDashboardAccessResult;
  target_ref?: string;
  timestamp?: string;
}>): IntegrityStatusViewerAuditEvent {
  return Object.freeze({
    audit_event_id: hashValue("mission-control-integrity-viewer-audit-event-id", { viewer_id: input.contract.viewer_id, event_type: input.event_type, target_ref: input.target_ref, timestamp: input.timestamp ?? NOW }),
    viewer_id: input.contract.viewer_id,
    tenant_id: input.contract.tenant_id,
    operator_id: input.contract.operator_id,
    event_type: input.event_type,
    target_ref: input.target_ref,
    access_result: input.access_result,
    timestamp: input.timestamp ?? NOW,
    appendOnly: true,
    sourceMutationAllowed: false,
  });
}

export function buildIntegrityStatusViewerView(input: Readonly<{
  tenant_id?: string;
  operator_id?: string;
  mission_id?: string;
  selected_target_ref?: string;
  access_level?: TruthDashboardAccessLevel;
}> = {}): IntegrityStatusViewerView {
  const contract = buildIntegrityStatusViewerContract({
    tenant_id: input.tenant_id ?? "tenant_alpha",
    operator_id: input.operator_id ?? "operator_console",
    mission_ids: [input.mission_id ?? "mission_query_layer"],
    access_level: input.access_level ?? "RESTRICTED_READ",
  });
  const query: IntegrityViewerQuery = {
    tenant_id: contract.tenant_id,
    operator_id: contract.operator_id,
    filters: { mission_id: input.mission_id ?? "mission_query_layer" },
    governance_context: { access_level: contract.scope.access_level, restricted_access_allowed: contract.scope.access_level === "RESTRICTED_READ" },
  };
  const records = queryIntegrityStatusRecords(contract, query);
  const selected = buildIntegrityStatusDetail(contract, input.selected_target_ref ?? records[0]?.target.target_id ?? "truth_rec_001", buildIntegrityStatusSeedRecords());
  const state = records.length === 0 ? "FAIL_CLOSED" : records.some((item) => item.integrity_state === "CORRUPTED") ? "ERROR" : records.some((item) => item.integrity_state === "DEGRADED" || item.integrity_state === "UNVERIFIED") ? "DEGRADED" : records.some((item) => item.visibility.redacted) ? "RESTRICTED" : "READY";
  return Object.freeze({
    contract,
    state,
    records,
    selected_record: selected,
    audit_events: Object.freeze([
      createIntegrityViewerAuditEvent({ contract, event_type: "INTEGRITY_VIEWER_OPENED", access_result: "ALLOWED" }),
      createIntegrityViewerAuditEvent({ contract, event_type: selected.record.integrity_state === "CORRUPTED" ? "CORRUPTION_VIEWED" : "INTEGRITY_RECORD_VIEWED", access_result: selected.access_result, target_ref: selected.record.target.target_id }),
    ]),
    available_filters: Object.freeze({
      integrity_states: unique(records.map((item) => item.integrity_state)),
      certification_states: unique(records.map((item) => item.certification_state)),
      tamper_states: unique(records.map((item) => item.tamper_detection_state)),
    }),
    guardrails: Object.freeze([
      "read-only integrity visibility",
      "tenant isolation",
      "operator access verification",
      "restricted record redaction",
      "no integrity record mutation",
      "no hash repair",
      "no hash recalculation",
      "no tamper warning suppression",
      "no certification override",
      "no governance override",
      "trusted interpretation blocked when corrupted",
      "fail-closed behavior",
    ]),
    query_hash: hashValue("mission-control-integrity-viewer-query-hash", query),
    generated_at: NOW,
    readOnly: true,
    mutationAllowed: false,
    hashRepairAllowed: false,
    certificationOverrideAllowed: false,
    governanceOverrideAllowed: false,
  });
}

export function assertIntegrityViewerActionBlocked(action: "REPAIR_HASH" | "RECALCULATE_HASH" | "SUPPRESS_TAMPER_WARNING" | "MARK_CORRUPTED_VALID" | "RERUN_CERTIFICATION" | "OVERRIDE_CERTIFICATION" | "OVERRIDE_GOVERNANCE" | "MUTATE_EVIDENCE" | "REWRITE_LINEAGE" | "EXECUTE_DECISION"): never {
  throw new Error(`Integrity Status Viewer is read-only and blocks ${action}.`);
}
