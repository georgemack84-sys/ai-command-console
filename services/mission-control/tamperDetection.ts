import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthTamperDetectionFinding,
  TruthTamperDetectionState,
  TruthTamperFindingLedgerRecord,
  TruthTamperProtectedRecord,
  TruthTamperScanRequest,
  TruthTamperScanResult,
  TruthTamperSeverity,
  TruthTamperType,
} from "./types";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function arraysEqual(left?: readonly string[], right?: readonly string[]): boolean {
  return JSON.stringify([...(left ?? [])].sort()) === JSON.stringify([...(right ?? [])].sort());
}

function stateRank(state: TruthTamperDetectionState): number {
  return {
    CLEAN: 0,
    SUSPECT: 1,
    INCOMPLETE: 2,
    UNVERIFIABLE: 3,
    TAMPERED: 4,
    INVALID: 5,
  }[state];
}

function dominantState(states: readonly TruthTamperDetectionState[]): TruthTamperDetectionState {
  return states.reduce<TruthTamperDetectionState>((current, next) => (stateRank(next) > stateRank(current) ? next : current), "CLEAN");
}

function requiresEscalation(severity: TruthTamperSeverity): boolean {
  return severity === "HIGH" || severity === "CRITICAL";
}

function finding(
  request: TruthTamperScanRequest,
  record: TruthTamperProtectedRecord,
  index: number,
  detection_state: TruthTamperDetectionState,
  tamper_type: TruthTamperType | undefined,
  severity: TruthTamperSeverity,
  rationale: readonly string[],
  extra: Partial<TruthTamperDetectionFinding> = {},
): TruthTamperDetectionFinding {
  return Object.freeze({
    finding_id: `tamper_find_${request.scan_id}_${index + 1}_${tamper_type ?? detection_state}`,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    scan_id: request.scan_id,
    scan_timestamp: request.requested_at,
    protected_record_type: record.protected_record_type,
    protected_record_id: record.protected_record_id,
    detection_state,
    tamper_type,
    severity,
    expected_hash: record.expected_hash ?? record.stored_hash,
    observed_hash: extra.observed_hash,
    expected_parent_hash: record.expected_parent_hash,
    observed_parent_hash: record.parent_hash,
    expected_sequence: record.expected_sequence,
    observed_sequence: record.sequence,
    affected_chain_id: record.chain_id,
    affected_refs: {
      evidence_refs: record.evidence_refs,
      replay_refs: record.replay_refs,
      lineage_refs: record.lineage_refs,
      governance_refs: record.governance_refs,
      recommendation_refs: record.recommendation_refs,
    },
    replay_status: record.replay_status ?? (request.include_replay_check ? "REPLAY_VALID" : "REPLAY_NOT_TESTED"),
    governance_status: record.governance_status ?? (request.include_governance_check ? "GOVERNANCE_VALID" : undefined),
    escalation_required: requiresEscalation(severity),
    operator_review_required: severity !== "INFO" && severity !== "LOW",
    rationale,
    created_at: request.requested_at,
    ...extra,
  });
}

function ledgerRecord(finding: TruthTamperDetectionFinding, index: number): TruthTamperFindingLedgerRecord {
  return Object.freeze({
    finding_record_id: `tamper_finding_record_${finding.scan_id}_${index + 1}`,
    finding_id: finding.finding_id,
    tenant_id: finding.tenant_id,
    mission_id: finding.mission_id,
    detection_state: finding.detection_state,
    tamper_type: finding.tamper_type,
    severity: finding.severity,
    protected_record_id: finding.protected_record_id,
    protected_record_type: finding.protected_record_type,
    expected_hash: finding.expected_hash,
    observed_hash: finding.observed_hash,
    affected_chain_id: finding.affected_chain_id,
    affected_replay_refs: finding.affected_refs?.replay_refs,
    affected_lineage_refs: finding.affected_refs?.lineage_refs,
    affected_evidence_refs: finding.affected_refs?.evidence_refs,
    affected_governance_refs: finding.affected_refs?.governance_refs,
    escalation_required: finding.escalation_required,
    operator_review_required: finding.operator_review_required,
    scan_id: finding.scan_id,
    created_at: finding.created_at,
  });
}

function inspectRecord(request: TruthTamperScanRequest, record: TruthTamperProtectedRecord, index: number): TruthTamperDetectionFinding[] {
  const findings: TruthTamperDetectionFinding[] = [];
  if (record.canonicalization_failed) {
    findings.push(finding(request, record, index, "INVALID", "UNKNOWN_INTEGRITY_STATE", "HIGH", ["Canonical serialization failed."]));
    return findings;
  }
  if (record.missing) {
    findings.push(finding(request, record, index, "TAMPERED", "RECORD_DELETION", "CRITICAL", ["Expected record is missing from observed chain."]));
    return findings;
  }
  const observedHash = hashValue("mission-control-tamper-record-canonical-hash", record.payload);
  if (!record.stored_hash && !record.expected_hash) {
    findings.push(finding(request, record, index, "UNVERIFIABLE", "UNKNOWN_INTEGRITY_STATE", "MEDIUM", ["Record has no stored or expected integrity hash."], { observed_hash: observedHash }));
  }
  if ((record.expected_hash ?? record.stored_hash) && observedHash !== (record.expected_hash ?? record.stored_hash)) {
    findings.push(finding(request, record, index, "TAMPERED", "CONTENT_MUTATION", "HIGH", ["Observed canonical hash does not match expected integrity hash."], { observed_hash: observedHash }));
  }
  if (record.stored_hash && record.expected_hash && record.stored_hash !== record.expected_hash) {
    findings.push(finding(request, record, index, "TAMPERED", "HASH_MISMATCH", "HIGH", ["Stored hash does not match expected hash."], { observed_hash: record.stored_hash }));
  }
  if (record.expected_parent_hash && record.parent_hash !== record.expected_parent_hash) {
    findings.push(finding(request, record, index, "TAMPERED", "CHAIN_BREAK", "CRITICAL", ["Parent hash continuity is broken."]));
  }
  if (record.expected_sequence !== undefined && record.sequence !== record.expected_sequence) {
    findings.push(finding(request, record, index, "TAMPERED", "CHAIN_REORDERING", "HIGH", ["Observed sequence does not match expected sequence."]));
  }
  if (record.inserted) findings.push(finding(request, record, index, "TAMPERED", "RECORD_INSERTION", "HIGH", ["Unexpected record was inserted into the observed chain."], { observed_hash: observedHash }));
  if (record.duplicate) findings.push(finding(request, record, index, "TAMPERED", "DUPLICATE_RECORD", "HIGH", ["Duplicate record identity, hash, sequence, lineage edge, or replay ref detected."], { observed_hash: observedHash }));
  if (record.unauthorized_write) findings.push(finding(request, record, index, "TAMPERED", "UNAUTHORIZED_WRITE", "CRITICAL", ["Unauthorized write detected."]));
  if (record.unauthorized_supersession || (record.expected_lifecycle_state && record.lifecycle_state !== record.expected_lifecycle_state && record.supersession_authorized !== true)) {
    findings.push(finding(request, record, index, "TAMPERED", "UNAUTHORIZED_SUPERSESSION", "CRITICAL", ["Lifecycle or supersession changed without authorization."]));
  }
  if (request.include_tenant_boundary_check && (record.tenant_id !== request.tenant_id || (record.index_tenant_id && record.index_tenant_id !== record.tenant_id))) {
    findings.push(finding(request, record, index, "TAMPERED", "TENANT_BOUNDARY_DRIFT", "CRITICAL", ["Record or index moved outside tenant boundary."], { observed_hash: observedHash }));
  }
  if (request.include_evidence_check && !arraysEqual(record.evidence_refs, record.expected_evidence_refs)) {
    findings.push(finding(request, record, index, "TAMPERED", "EVIDENCE_REFERENCE_DRIFT", "HIGH", ["Evidence references changed."]));
  }
  if (request.include_replay_check && !arraysEqual(record.replay_refs, record.expected_replay_refs)) {
    findings.push(finding(request, record, index, "TAMPERED", "REPLAY_DIVERGENCE", "HIGH", ["Replay references changed."], { replay_status: "REPLAY_MISMATCH" }));
  }
  if (request.include_lineage_check && !arraysEqual(record.lineage_refs, record.expected_lineage_refs)) {
    findings.push(finding(request, record, index, "TAMPERED", "LINEAGE_DRIFT", "HIGH", ["Lineage references changed."]));
  }
  if (request.include_governance_check && !arraysEqual(record.governance_refs, record.expected_governance_refs)) {
    findings.push(finding(request, record, index, "TAMPERED", "GOVERNANCE_REFERENCE_DRIFT", "CRITICAL", ["Governance references changed."], { governance_status: "GOVERNANCE_VIOLATED" }));
  }
  if (record.archival_hash && record.archival_hash !== (record.expected_hash ?? record.stored_hash)) {
    findings.push(finding(request, record, index, "TAMPERED", "ARCHIVAL_MISMATCH", "HIGH", ["Archive hash does not match original record hash."]));
  }
  if (record.protected_record_type === "ARCHIVAL_RECORD" && record.archive_manifest_present === false) {
    findings.push(finding(request, record, index, "INCOMPLETE", "ARCHIVAL_MISMATCH", "MEDIUM", ["Archive manifest is missing."]));
  }
  if (record.index_record_hash && record.index_record_hash !== (record.expected_hash ?? record.stored_hash)) {
    findings.push(finding(request, record, index, "SUSPECT", "INDEX_MISMATCH", "MEDIUM", ["Derived index does not match source ledger record."]));
  }
  if (record.unknown_integrity_state) {
    findings.push(finding(request, record, index, "UNVERIFIABLE", "UNKNOWN_INTEGRITY_STATE", "MEDIUM", ["Record integrity state cannot be proven."]));
  }
  if (findings.length === 0) {
    findings.push(finding(request, record, index, "CLEAN", undefined, "INFO", ["Record matches expected integrity state."], { observed_hash: observedHash }));
  }
  return findings;
}

export function runTruthTamperScan(request: TruthTamperScanRequest, records: readonly TruthTamperProtectedRecord[]): TruthTamperScanResult {
  const invalid: TruthTamperDetectionFinding[] = [];
  if (!request.scan_id || !request.tenant_id || !request.scope || !request.requested_by) {
    const fallback: TruthTamperProtectedRecord = records[0] ?? {
      protected_record_type: "INTEGRITY_RECORD",
      protected_record_id: "missing_scan_request",
      tenant_id: request.tenant_id || "unknown_tenant",
      payload: {},
    };
    invalid.push(finding(request, fallback, 0, "INVALID", "UNKNOWN_INTEGRITY_STATE", "HIGH", ["Tamper scan request violates required contract fields."]));
  }
  const findings = Object.freeze([...invalid, ...records.flatMap((record, index) => inspectRecord(request, record, index + invalid.length))]);
  const ledgerRecords = Object.freeze(findings.map((item, index) => ledgerRecord(item, index)));
  const detectionState = dominantState(findings.map((item) => item.detection_state));
  return Object.freeze({
    scan_id: request.scan_id,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    scope: request.scope,
    detection_state: detectionState,
    findings,
    ledger_records: ledgerRecords,
    certification_blocked: findings.some((item) => item.detection_state !== "CLEAN" && item.detection_state !== "SUSPECT"),
    escalation_required: findings.some((item) => item.escalation_required),
    operator_review_required: findings.some((item) => item.operator_review_required),
    scan_hash: hashValue("mission-control-tamper-scan-result-hash", { request, findings }),
    created_at: request.requested_at,
    appendOnly: true,
    sourceMutationAllowed: false,
  });
}
