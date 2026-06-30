import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runTruthTamperScan } from "./tamperDetection";
import type {
  TruthIntegrityCertificationDecision,
  TruthIntegrityOperatorVisibilityReport,
  TruthIntegrityVerificationLedgerRecord,
  TruthIntegrityVerificationRequest,
  TruthIntegrityVerificationResult,
  TruthIntegrityVerificationState,
  TruthTamperDetectionState,
  TruthTamperProtectedRecord,
  TruthTamperScanRequest,
  TruthVerificationCheckResult,
  TruthVerificationCheckStatus,
} from "./types";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function payloadHash(value: unknown): string {
  return hashValue("mission-control-tamper-record-canonical-hash", value);
}

function check(status: TruthVerificationCheckStatus, required: boolean, rationale: readonly string[], extra: Partial<TruthVerificationCheckResult> = {}): TruthVerificationCheckResult {
  return Object.freeze({ status, required, rationale, ...extra });
}

function skipped(required: boolean, name: string): TruthVerificationCheckResult {
  return check("SKIPPED", required, [`${name} was not requested.`]);
}

function validateRequest(request: TruthIntegrityVerificationRequest, records: readonly TruthTamperProtectedRecord[]): TruthVerificationCheckResult | undefined {
  if (!request.verification_request_id || !request.tenant_id || !request.scope || !request.trigger || !request.requested_by || !request.requested_at || !request.options) {
    return check("INVALID", true, ["Verification request is missing required contract fields."]);
  }
  const hasTarget = !!request.target_record_id
    || !!request.target_chain_id
    || !!request.replay_bundle_id
    || !!request.evidence_bundle_id
    || !!request.lineage_graph_id
    || !!request.governance_scope_id
    || !!request.archive_package_id
    || !!request.certification_scope_id
    || (request.target_record_ids?.length ?? 0) > 0
    || records.length > 0;
  if (!hasTarget) return check("INVALID", true, ["Verification request must resolve at least one target."]);
  return undefined;
}

function schemaCheck(records: readonly TruthTamperProtectedRecord[], required: boolean): TruthVerificationCheckResult {
  const invalid = records.filter((record) => !record.protected_record_id || !record.protected_record_type || !record.tenant_id || record.payload === undefined || record.canonicalization_failed);
  if (invalid.length > 0) return check("FAIL", required, ["One or more records are missing required schema fields."], { finding_refs: invalid.map((record) => record.protected_record_id) });
  return check("PASS", required, ["All required record fields are present."]);
}

function identityCheck(request: TruthIntegrityVerificationRequest, records: readonly TruthTamperProtectedRecord[]): TruthVerificationCheckResult {
  const ids = records.map((record) => record.protected_record_id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const missionMismatch = records.filter((record) => request.mission_id && record.mission_id && record.mission_id !== request.mission_id);
  if (duplicates.length > 0) return check("FAIL", true, ["Record identities must be unique."], { finding_refs: duplicates });
  if (missionMismatch.length > 0) return check("FAIL", true, ["Record mission identity does not match request mission."], { finding_refs: missionMismatch.map((record) => record.protected_record_id) });
  return check("PASS", true, ["Record identities are unique and stable."]);
}

function hashCheck(records: readonly TruthTamperProtectedRecord[], required: boolean): TruthVerificationCheckResult {
  const missing = records.filter((record) => !record.expected_hash && !record.stored_hash);
  if (missing.length > 0) return check("UNVERIFIABLE", required, ["One or more records have no expected or stored hash."], { finding_refs: missing.map((record) => record.protected_record_id) });
  const mismatches = records.filter((record) => {
    const expected = record.expected_hash ?? record.stored_hash;
    return expected && payloadHash(record.payload) !== expected;
  });
  if (mismatches.length > 0) {
    return check("FAIL", required, ["Recomputed canonical hash does not match stored or expected hash."], {
      finding_refs: mismatches.map((record) => record.protected_record_id),
      expected_value: mismatches[0].expected_hash ?? mismatches[0].stored_hash,
      observed_value: payloadHash(mismatches[0].payload),
    });
  }
  return check("PASS", required, ["Canonical hashes match expected integrity values."]);
}

function chainCheck(records: readonly TruthTamperProtectedRecord[], required: boolean): TruthVerificationCheckResult {
  const missing = records.filter((record) => record.missing);
  if (missing.length > 0) return check("INCOMPLETE", required, ["Required chain records are missing."], { finding_refs: missing.map((record) => record.protected_record_id) });
  const failures = records.filter((record) => record.inserted || record.duplicate || (record.expected_parent_hash && record.parent_hash !== record.expected_parent_hash) || (record.expected_sequence !== undefined && record.sequence !== record.expected_sequence));
  if (failures.length > 0) return check("FAIL", required, ["Hash chain continuity, order, or uniqueness failed."], { finding_refs: failures.map((record) => record.protected_record_id) });
  return check("PASS", required, ["Hash chain continuity is preserved."]);
}

function tenantBoundaryCheck(request: TruthIntegrityVerificationRequest, records: readonly TruthTamperProtectedRecord[]): TruthVerificationCheckResult {
  const mismatches = records.filter((record) => record.tenant_id !== request.tenant_id || (record.index_tenant_id && record.index_tenant_id !== record.tenant_id));
  if (mismatches.length > 0) return check("FAIL", true, ["Tenant boundary validation failed."], { finding_refs: mismatches.map((record) => record.protected_record_id) });
  return check("PASS", true, ["No tenant boundary drift detected."]);
}

function refCheck(
  enabled: boolean,
  required: boolean,
  label: string,
  records: readonly TruthTamperProtectedRecord[],
  currentKey: keyof TruthTamperProtectedRecord,
  expectedKey: keyof TruthTamperProtectedRecord,
): TruthVerificationCheckResult {
  if (!enabled) return skipped(required, label);
  const drift = records.filter((record) => JSON.stringify([...(record[currentKey] as readonly string[] | undefined ?? [])].sort()) !== JSON.stringify([...(record[expectedKey] as readonly string[] | undefined ?? [])].sort()));
  if (drift.length > 0) return check("FAIL", required, [`${label} references drifted.`], { finding_refs: drift.map((record) => record.protected_record_id) });
  return check("PASS", required, [`${label} references are preserved.`]);
}

function archiveCheck(enabled: boolean, required: boolean, records: readonly TruthTamperProtectedRecord[]): TruthVerificationCheckResult {
  if (!enabled) return skipped(required, "Archive validation");
  const failures = records.filter((record) => (record.archival_hash && record.archival_hash !== (record.expected_hash ?? record.stored_hash)) || (record.protected_record_type === "ARCHIVAL_RECORD" && record.archive_manifest_present === false));
  if (failures.length > 0) return check("FAIL", required, ["Archive integrity validation failed."], { finding_refs: failures.map((record) => record.protected_record_id) });
  return check("PASS", required, ["Archive package integrity is preserved."]);
}

function indexCheck(enabled: boolean, required: boolean, records: readonly TruthTamperProtectedRecord[]): TruthVerificationCheckResult {
  if (!enabled) return skipped(required, "Index validation");
  const mismatches = records.filter((record) => record.index_record_hash && record.index_record_hash !== (record.expected_hash ?? record.stored_hash));
  const critical = mismatches.filter((record) => record.governance_status === "GOVERNANCE_VIOLATED" || record.index_tenant_id !== undefined && record.index_tenant_id !== record.tenant_id);
  if (critical.length > 0) return check("FAIL", required, ["Index mismatch hides governance failure or tenant violation."], { finding_refs: critical.map((record) => record.protected_record_id) });
  if (mismatches.length > 0) return check("WARN", false, ["Derived index is stale or inconsistent."], { finding_refs: mismatches.map((record) => record.protected_record_id) });
  return check("PASS", required, ["Derived index matches source ledger state."]);
}

function classify(checks: readonly TruthVerificationCheckResult[]): TruthIntegrityVerificationState {
  if (checks.some((item) => item.status === "INVALID")) return "INVALID";
  if (checks.some((item) => item.required && item.status === "INCOMPLETE")) return "INCOMPLETE";
  if (checks.some((item) => item.required && item.status === "UNVERIFIABLE")) return "UNVERIFIABLE";
  if (checks.some((item) => item.status === "FAIL")) return "FAILED";
  if (checks.some((item) => item.status === "WARN")) return "DEGRADED";
  if (checks.some((item) => item.status === "SKIPPED")) return "PARTIALLY_VERIFIED";
  return "VERIFIED";
}

function decision(state: TruthIntegrityVerificationState): TruthIntegrityCertificationDecision {
  if (state === "VERIFIED") return "CERTIFIABLE";
  if (state === "PARTIALLY_VERIFIED" || state === "DEGRADED") return "CONDITIONAL_CERTIFICATION";
  if (state === "FAILED") return "NOT_CERTIFIABLE";
  return "CERTIFICATION_BLOCKED";
}

function tamperRequest(request: TruthIntegrityVerificationRequest): TruthTamperScanRequest {
  return {
    scan_id: `tamper_${request.verification_request_id}`,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    scope: request.scope === "SINGLE_RECORD" ? "SINGLE_RECORD" : request.scope === "CHAIN_SEGMENT" ? "CHAIN_SEGMENT" : request.scope === "REPLAY_BUNDLE" ? "REPLAY_BUNDLE" : request.scope === "GOVERNANCE_SCOPE" ? "GOVERNANCE_SCOPE" : request.scope === "TENANT_LEDGER" ? "TENANT_LEDGER" : request.scope === "MISSION_LEDGER" ? "MISSION_LEDGER" : "FULL_INTEGRITY_SCAN",
    target_record_id: request.target_record_id,
    target_chain_id: request.target_chain_id,
    start_record_id: request.start_record_id,
    end_record_id: request.end_record_id,
    include_replay_check: request.options.include_replay_validation,
    include_lineage_check: request.options.include_lineage_validation,
    include_evidence_check: request.options.include_evidence_validation,
    include_governance_check: request.options.include_governance_validation,
    include_tenant_boundary_check: request.options.include_tenant_boundary_validation,
    requested_by: request.requested_by === "REPLAY_ENGINE" ? "SYSTEM" : request.requested_by === "TAMPER_DETECTION_ENGINE" ? "SYSTEM" : request.requested_by,
    requested_at: request.requested_at,
  };
}

export function verifyTruthIntegrity(request: TruthIntegrityVerificationRequest, records: readonly TruthTamperProtectedRecord[]): TruthIntegrityVerificationResult {
  const invalidRequest = validateRequest(request, records);
  const options = request.options;
  const required = options.fail_closed;
  const tamper = options.include_tamper_detection ? runTruthTamperScan(tamperRequest(request), records) : undefined;
  const tamperCheck = !options.include_tamper_detection ? skipped(false, "Tamper detection") :
    tamper?.detection_state === "CLEAN" ? check("PASS", true, ["Tamper Detection returned clean findings."]) :
      tamper?.detection_state === "SUSPECT" ? check("WARN", true, ["Tamper Detection returned suspect findings."], { finding_refs: tamper.findings.map((item) => item.finding_id) }) :
        tamper?.detection_state === "INCOMPLETE" ? check("INCOMPLETE", true, ["Tamper Detection reported incomplete integrity material."], { finding_refs: tamper.findings.map((item) => item.finding_id) }) :
          tamper?.detection_state === "UNVERIFIABLE" ? check("UNVERIFIABLE", true, ["Tamper Detection could not prove integrity."], { finding_refs: tamper.findings.map((item) => item.finding_id) }) :
            tamper?.detection_state === "INVALID" ? check("INVALID", true, ["Tamper Detection request or state is invalid."], { finding_refs: tamper.findings.map((item) => item.finding_id) }) :
              check("FAIL", true, ["Tamper Detection reported tampering."], { finding_refs: tamper?.findings.map((item) => item.finding_id) });

  const checks = Object.freeze({
    schema_check: invalidRequest ?? (options.include_schema_validation ? schemaCheck(records, required) : skipped(false, "Schema validation")),
    identity_check: invalidRequest ?? identityCheck(request, records),
    hash_check: invalidRequest ?? (options.include_hash_validation ? hashCheck(records, required) : skipped(false, "Hash validation")),
    chain_check: invalidRequest ?? (options.include_chain_validation ? chainCheck(records, required) : skipped(false, "Chain validation")),
    tamper_check: invalidRequest ?? tamperCheck,
    lineage_check: invalidRequest ?? refCheck(options.include_lineage_validation, required, "Lineage", records, "lineage_refs", "expected_lineage_refs"),
    replay_check: invalidRequest ?? refCheck(options.include_replay_validation, required, "Replay", records, "replay_refs", "expected_replay_refs"),
    evidence_check: invalidRequest ?? refCheck(options.include_evidence_validation, required, "Evidence", records, "evidence_refs", "expected_evidence_refs"),
    governance_check: invalidRequest ?? refCheck(options.include_governance_validation, required, "Governance", records, "governance_refs", "expected_governance_refs"),
    tenant_boundary_check: invalidRequest ?? (options.include_tenant_boundary_validation ? tenantBoundaryCheck(request, records) : skipped(false, "Tenant boundary validation")),
    archive_check: invalidRequest ?? archiveCheck(options.include_archive_validation, required, records),
    index_check: invalidRequest ?? indexCheck(options.include_index_validation, false, records),
  });
  const allChecks = Object.values(checks);
  const state = classify(allChecks);
  const cert = decision(state);
  const failedRecordIds = Object.freeze([...new Set(allChecks.flatMap((item) => item.status === "FAIL" || item.status === "INVALID" ? item.finding_refs ?? [] : []))]);
  const unverifiableRecordIds = Object.freeze([...new Set(allChecks.flatMap((item) => item.status === "UNVERIFIABLE" || item.status === "INCOMPLETE" ? item.finding_refs ?? [] : []))]);
  const verifiedRecordIds = Object.freeze(records.map((record) => record.protected_record_id).filter((id) => !failedRecordIds.includes(id) && !unverifiableRecordIds.includes(id)));
  const rationale = Object.freeze(allChecks.flatMap((item) => item.rationale));
  const resultWithoutHash = {
    verification_result_id: `ivr_${request.verification_request_id}`,
    verification_request_id: request.verification_request_id,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    scope: request.scope,
    trigger: request.trigger,
    verification_state: state,
    certification_decision: cert,
    verified_record_ids: verifiedRecordIds,
    failed_record_ids: failedRecordIds,
    unverifiable_record_ids: unverifiableRecordIds,
    checks,
    tamper_findings: tamper?.findings.map((item) => item.finding_id),
    affected_chain_ids: Object.freeze([...new Set(records.map((record) => record.chain_id).filter((item): item is string => !!item))]),
    affected_replay_refs: Object.freeze([...new Set(records.flatMap((record) => record.replay_refs ?? []))]),
    affected_evidence_refs: Object.freeze([...new Set(records.flatMap((record) => record.evidence_refs ?? []))]),
    affected_lineage_refs: Object.freeze([...new Set(records.flatMap((record) => record.lineage_refs ?? []))]),
    affected_governance_refs: Object.freeze([...new Set(records.flatMap((record) => record.governance_refs ?? []))]),
    escalation_required: state === "INVALID" || tamper?.escalation_required === true || allChecks.some((item) => item.status === "FAIL" && item.required),
    operator_review_required: state !== "VERIFIED" || tamper?.operator_review_required === true,
    certification_blocked: cert === "CERTIFICATION_BLOCKED" || cert === "NOT_CERTIFIABLE",
    rationale,
    started_at: request.requested_at,
    completed_at: request.requested_at,
    appendOnly: true as const,
    sourceMutationAllowed: false as const,
  };
  return Object.freeze({
    ...resultWithoutHash,
    result_hash: hashValue("mission-control-integrity-verification-result-hash", resultWithoutHash),
  });
}

export function toTruthIntegrityVerificationLedgerRecord(result: TruthIntegrityVerificationResult): TruthIntegrityVerificationLedgerRecord {
  return Object.freeze({
    verification_record_id: `verification_record_${result.verification_result_id}`,
    verification_result_id: result.verification_result_id,
    verification_request_id: result.verification_request_id,
    tenant_id: result.tenant_id,
    mission_id: result.mission_id,
    scope: result.scope,
    trigger: result.trigger,
    verification_state: result.verification_state,
    certification_decision: result.certification_decision,
    failed_record_ids_json: canonicalizeConfidenceToString(result.failed_record_ids),
    unverifiable_record_ids_json: canonicalizeConfidenceToString(result.unverifiable_record_ids),
    checks_json: canonicalizeConfidenceToString(result.checks),
    rationale_json: canonicalizeConfidenceToString(result.rationale),
    result_hash: result.result_hash,
    created_at: result.completed_at,
  });
}

export function toTruthIntegrityOperatorVisibilityReport(result: TruthIntegrityVerificationResult): TruthIntegrityOperatorVisibilityReport {
  const failedChecks = Object.entries(result.checks).filter(([, value]) => value.status === "FAIL" || value.status === "INVALID").map(([key]) => key);
  const unverifiableChecks = Object.entries(result.checks).filter(([, value]) => value.status === "UNVERIFIABLE" || value.status === "INCOMPLETE").map(([key]) => key);
  return Object.freeze({
    verification_result_id: result.verification_result_id,
    summary: `Integrity verification ${result.verification_state} for ${result.scope}.`,
    checked_scope: result.scope,
    checked_records: result.verified_record_ids,
    failed_checks: Object.freeze(failedChecks),
    unverifiable_checks: Object.freeze(unverifiableChecks),
    certification_decision: result.certification_decision,
    escalation_required: result.escalation_required,
    operator_review_required: result.operator_review_required,
    rationale: result.rationale,
  });
}
