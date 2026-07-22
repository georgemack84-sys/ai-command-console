import { createDecisionCandidatePayload, createDecisionIntakeRequest } from "@/services/decision-intake-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { schemaValidationRequestFromIntake, validateDecisionCandidateSchema } from "@/services/decision-candidate-schema-validation";
import type { DecisionCandidatePayload, DecisionIntakeFailureReason, DecisionIntakeRequest } from "@/types/decision-intake-engine";
import type {
  EvidenceConsistencyRecord,
  GovernanceReferenceVerificationRecord,
  HashVerificationRecord,
  IntegrityVerificationAuditRecord,
  IntegrityVerificationFailureReason,
  IntegrityVerificationIntakeBridge,
  IntegrityVerificationLedgerRecord,
  IntegrityVerificationObservability,
  IntegrityVerificationReplayResult,
  IntegrityVerificationRequest,
  IntegrityVerificationResult,
  IntegrityVerificationState,
  LineageReferenceVerificationRecord,
  ReplayReferenceVerificationRecord,
  VerificationCheckStatus,
} from "@/types/decision-candidate-integrity-verification";

const NOW = "2026-07-02T09:26:00.000Z";
const VERIFICATION_ORDER: readonly IntegrityVerificationState[] = Object.freeze(["PAYLOAD_CANONICALIZED", "HASH_VERIFIED", "REPLAY_VERIFIED", "LINEAGE_VERIFIED", "EVIDENCE_VERIFIED", "GOVERNANCE_VERIFIED", "PASSED"] as const);
const HASH_RE = /^[a-f0-9]{64}$/;

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function sortedRefs(value: readonly string[]): readonly string[] {
  return Object.freeze([...value].sort());
}

function canonicalPayload(payload: DecisionCandidatePayload): Omit<DecisionCandidatePayload, "integrity_hash"> {
  const copy = { ...payload };
  delete copy.integrity_hash;
  return Object.freeze({
    ...copy,
    evidence_refs: sortedRefs(payload.evidence_refs),
    replay_refs: sortedRefs(payload.replay_refs),
    governance_refs: sortedRefs(payload.governance_refs),
    lineage_refs: sortedRefs(payload.lineage_refs),
  });
}

export function computeCandidateCanonicalHash(payload: DecisionCandidatePayload): string {
  return hash(canonicalPayload(payload));
}

function refsOrdered(values: readonly string[]): boolean {
  return values.every((value, index) => [...values].sort()[index] === value);
}

function unresolved(values: readonly string[]): readonly string[] {
  return Object.freeze(values.filter((ref) => /missing|unresolved|deleted|unknown/i.test(ref)));
}

function failed(status: VerificationCheckStatus): boolean {
  return status === "FAIL";
}

export function createIntegrityVerificationRequest(overrides: Partial<IntegrityVerificationRequest> = {}): IntegrityVerificationRequest {
  const candidate_payload = overrides.candidate_payload ?? createDecisionCandidatePayload();
  const integrity_hash = Object.prototype.hasOwnProperty.call(overrides, "integrity_hash") ? overrides.integrity_hash : candidate_payload.integrity_hash;
  return Object.freeze({
    verification_id: overrides.verification_id ?? `integrity_verification_${candidate_payload.candidate_id}`,
    intake_id: overrides.intake_id ?? `intake_request_${candidate_payload.candidate_id}`,
    candidate_id: overrides.candidate_id ?? candidate_payload.candidate_id,
    source_system: overrides.source_system ?? "mission-control-operator-console",
    tenant_id: overrides.tenant_id ?? candidate_payload.tenant_id,
    mission_id: overrides.mission_id ?? candidate_payload.mission_id,
    candidate_payload_ref: overrides.candidate_payload_ref ?? `payload_${candidate_payload.candidate_id}`,
    candidate_payload,
    integrity_hash,
    hash_algorithm: overrides.hash_algorithm ?? "SHA-256",
    replay_refs: overrides.replay_refs ?? candidate_payload.replay_refs,
    lineage_refs: overrides.lineage_refs ?? candidate_payload.lineage_refs,
    evidence_refs: overrides.evidence_refs ?? candidate_payload.evidence_refs,
    governance_refs: overrides.governance_refs ?? candidate_payload.governance_refs,
    schema_validation: overrides.schema_validation,
  });
}

function hashRecord(request: IntegrityVerificationRequest, canonical_hash = ""): HashVerificationRecord {
  const submitted = request.integrity_hash;
  const algorithmOk = request.hash_algorithm === "SHA-256";
  const metadataOk = Boolean(submitted) && HASH_RE.test(submitted ?? "");
  const base: Omit<HashVerificationRecord, "integrity_hash"> = {
    record_id: `hash_${request.verification_id}`,
    verification_id: request.verification_id,
    hash_algorithm: request.hash_algorithm,
    canonical_payload_ref: request.candidate_payload_ref,
    canonical_hash,
    submitted_hash: submitted,
    hash_match: algorithmOk && metadataOk && submitted === canonical_hash,
    result: algorithmOk && metadataOk && submitted === canonical_hash ? "PASS" : "FAIL",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayRecord(request: IntegrityVerificationRequest, checked = true): ReplayReferenceVerificationRecord {
  const refs = checked ? request.replay_refs : Object.freeze([] as string[]);
  const unresolved_replay_refs = unresolved(refs);
  const versionFail = refs.some((ref) => /v999|unsupported/i.test(ref));
  const compatibleFail = refs.some((ref) => /corrupt|incompatible/i.test(ref));
  const missing = refs.length === 0;
  const base: Omit<ReplayReferenceVerificationRecord, "integrity_hash"> = {
    record_id: `replay_${request.verification_id}`,
    verification_id: request.verification_id,
    replay_refs_checked: refs,
    unresolved_replay_refs,
    replay_version_status: checked ? versionFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    replay_compatibility_status: checked ? missing || unresolved_replay_refs.length || compatibleFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    result: checked ? missing || unresolved_replay_refs.length || versionFail || compatibleFail ? "FAIL" : "PASS" : "NOT_CHECKED",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function lineageRecord(request: IntegrityVerificationRequest, checked = true): LineageReferenceVerificationRecord {
  const refs = checked ? request.lineage_refs : Object.freeze([] as string[]);
  const unresolved_lineage_refs = unresolved(refs);
  const sourceOk = request.candidate_payload.source_record_id.includes(request.tenant_id) && request.candidate_payload.source_record_id.includes(request.mission_id);
  const broken = refs.some((ref) => /broken|orphan/i.test(ref));
  const base: Omit<LineageReferenceVerificationRecord, "integrity_hash"> = {
    record_id: `lineage_${request.verification_id}`,
    verification_id: request.verification_id,
    lineage_refs_checked: refs,
    unresolved_lineage_refs,
    lineage_continuity_status: checked ? refs.length === 0 || unresolved_lineage_refs.length || broken ? "FAIL" : "PASS" : "NOT_CHECKED",
    source_record_status: checked ? sourceOk ? "PASS" : "FAIL" : "NOT_CHECKED",
    result: checked ? refs.length === 0 || unresolved_lineage_refs.length || broken || !sourceOk ? "FAIL" : "PASS" : "NOT_CHECKED",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function evidenceRecord(request: IntegrityVerificationRequest, checked = true): EvidenceConsistencyRecord {
  const refs = checked ? request.evidence_refs : Object.freeze([] as string[]);
  const unresolved_evidence_refs = unresolved(refs);
  const tenantFail = refs.some((ref) => ref.includes("tenant_") && !ref.includes(request.tenant_id));
  const missionFail = refs.some((ref) => ref.includes("mission_") && !ref.includes(request.mission_id));
  const rationaleFail = refs.some((ref) => /conflict|inconsistent/i.test(ref));
  const lineageFail = refs.some((ref) => /broken/i.test(ref));
  const base: Omit<EvidenceConsistencyRecord, "integrity_hash"> = {
    record_id: `evidence_${request.verification_id}`,
    verification_id: request.verification_id,
    evidence_refs_checked: refs,
    unresolved_evidence_refs,
    tenant_consistency_status: checked ? tenantFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    mission_consistency_status: checked ? missionFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    rationale_consistency_status: checked ? refs.length === 0 || unresolved_evidence_refs.length || rationaleFail || lineageFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    result: checked ? refs.length === 0 || unresolved_evidence_refs.length || tenantFail || missionFail || rationaleFail || lineageFail ? "FAIL" : "PASS" : "NOT_CHECKED",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function governanceRecord(request: IntegrityVerificationRequest, checked = true): GovernanceReferenceVerificationRecord {
  const refs = checked ? request.governance_refs : Object.freeze([] as string[]);
  const unresolved_governance_refs = unresolved(refs);
  const authority = request.candidate_payload.authority_metadata;
  const policyFail = refs.length === 0 || unresolved_governance_refs.length;
  const authorityFail = authority.execution_authorized || !authority.advisory_only;
  const constitutionalFail = authority.authority_level === "GOVERNANCE_APPROVAL_REQUIRED" && !refs.some((ref) => /constitutional/i.test(ref));
  const versionFail = refs.some((ref) => /v999|unsupported/i.test(ref));
  const corruptionFail = refs.some((ref) => /corrupt|tamper/i.test(ref));
  const base: Omit<GovernanceReferenceVerificationRecord, "integrity_hash"> = {
    record_id: `governance_${request.verification_id}`,
    verification_id: request.verification_id,
    governance_refs_checked: refs,
    unresolved_governance_refs,
    policy_reference_status: checked ? policyFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    authority_reference_status: checked ? authorityFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    constitutional_reference_status: checked ? constitutionalFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    governance_version_status: checked ? versionFail || corruptionFail ? "FAIL" : "PASS" : "NOT_CHECKED",
    result: checked ? policyFail || authorityFail || constitutionalFail || versionFail || corruptionFail ? "FAIL" : "PASS" : "NOT_CHECKED",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function failureForHash(request: IntegrityVerificationRequest, record: HashVerificationRecord): IntegrityVerificationFailureReason | undefined {
  if (!request.integrity_hash) return "MISSING_INTEGRITY_HASH";
  if (request.hash_algorithm !== "SHA-256") return "UNSUPPORTED_HASH_ALGORITHM";
  if (!HASH_RE.test(request.integrity_hash)) return "INVALID_HASH_FORMAT";
  if (!record.hash_match) return "HASH_MISMATCH";
  return undefined;
}

function replayFailure(record: ReplayReferenceVerificationRecord): IntegrityVerificationFailureReason | undefined {
  if (record.replay_refs_checked.length === 0) return "MISSING_REPLAY_REFERENCE";
  if (record.unresolved_replay_refs.length) return "UNRESOLVED_REPLAY_REFERENCE";
  if (failed(record.replay_version_status)) return "REPLAY_VERSION_MISMATCH";
  if (failed(record.replay_compatibility_status)) return "REPLAY_CORRUPTION";
  return undefined;
}

function lineageFailure(record: LineageReferenceVerificationRecord): IntegrityVerificationFailureReason | undefined {
  if (record.lineage_refs_checked.length === 0) return "MISSING_LINEAGE_REFERENCE";
  if (record.unresolved_lineage_refs.length) return "UNRESOLVED_PARENT_REFERENCE";
  if (failed(record.source_record_status)) return "SOURCE_RECORD_MISMATCH";
  if (failed(record.lineage_continuity_status)) return "BROKEN_LINEAGE_CHAIN";
  return undefined;
}

function evidenceFailure(record: EvidenceConsistencyRecord): IntegrityVerificationFailureReason | undefined {
  if (record.evidence_refs_checked.length === 0) return "MISSING_EVIDENCE";
  if (record.unresolved_evidence_refs.length) return "UNRESOLVED_EVIDENCE";
  if (failed(record.tenant_consistency_status)) return "CROSS_TENANT_EVIDENCE";
  if (failed(record.mission_consistency_status)) return "UNRELATED_MISSION_EVIDENCE";
  if (failed(record.rationale_consistency_status)) return "INCONSISTENT_EVIDENCE";
  return undefined;
}

function governanceFailure(record: GovernanceReferenceVerificationRecord): IntegrityVerificationFailureReason | undefined {
  if (record.governance_refs_checked.length === 0) return "MISSING_GOVERNANCE_REFERENCE";
  if (record.unresolved_governance_refs.length || failed(record.policy_reference_status)) return "UNRESOLVED_POLICY_REFERENCE";
  if (failed(record.authority_reference_status)) return "AUTHORITY_REFERENCE_MISMATCH";
  if (failed(record.constitutional_reference_status)) return "CONSTITUTIONAL_REFERENCE_OMISSION";
  if (failed(record.governance_version_status)) return "GOVERNANCE_VERSION_MISMATCH";
  return undefined;
}

function audit(verification_id: string, event_type: IntegrityVerificationAuditRecord["event_type"], stage: IntegrityVerificationState, result: "PASS" | "FAIL"): IntegrityVerificationAuditRecord {
  const base: Omit<IntegrityVerificationAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${verification_id}_${event_type.toLowerCase()}`,
    verification_id,
    event_type,
    verification_stage: stage,
    result,
    replay_ref: `replay_${verification_id}_${event_type.toLowerCase()}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function resultHash(result: Omit<IntegrityVerificationResult, "integrity_hash"> | IntegrityVerificationResult): string {
  const copy = { ...(result as IntegrityVerificationResult) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function ledger(input: {
  request: IntegrityVerificationRequest;
  canonical_hash: string;
  failed_stage?: IntegrityVerificationState;
  failure_reason?: IntegrityVerificationFailureReason;
}): IntegrityVerificationLedgerRecord {
  const base: Omit<IntegrityVerificationLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `ledger_${input.request.verification_id}`,
    ledger_event: input.failure_reason ? "INTEGRITY_VERIFICATION_FAILED" : "INTEGRITY_VERIFICATION_PASSED",
    verification_id: input.request.verification_id,
    intake_id: input.request.intake_id,
    candidate_id: input.request.candidate_id,
    failed_stage: input.failed_stage,
    failure_reason: input.failure_reason,
    canonical_hash: input.canonical_hash,
    submitted_hash: input.request.integrity_hash,
    replay_ref: `replay_integrity_verification_${input.request.verification_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildResult(input: {
  request: IntegrityVerificationRequest;
  canonical_hash: string;
  hash_record: HashVerificationRecord;
  replay_record: ReplayReferenceVerificationRecord;
  lineage_record: LineageReferenceVerificationRecord;
  evidence_record: EvidenceConsistencyRecord;
  governance_record: GovernanceReferenceVerificationRecord;
  failure_reason?: IntegrityVerificationFailureReason;
  failed_stage?: IntegrityVerificationState;
  audit_records: readonly IntegrityVerificationAuditRecord[];
}): IntegrityVerificationResult {
  const passed = !input.failure_reason;
  const ledger_record = ledger({
    request: input.request,
    canonical_hash: input.canonical_hash,
    failed_stage: input.failed_stage,
    failure_reason: input.failure_reason,
  });
  const base: Omit<IntegrityVerificationResult, "integrity_hash"> = {
    verification_id: input.request.verification_id,
    intake_id: input.request.intake_id,
    candidate_id: input.request.candidate_id,
    verification_status: passed ? "PASS" : "FAIL",
    verification_state: passed ? "PASSED" : input.failed_stage ?? "FAILED_CANONICALIZATION",
    failure_reason: input.failure_reason,
    failure_reasons: Object.freeze(input.failure_reason ? [input.failure_reason] : []),
    failed_stage: input.failed_stage,
    canonical_hash: input.canonical_hash,
    submitted_hash: input.request.integrity_hash,
    replay_status: input.replay_record.result,
    lineage_status: input.lineage_record.result,
    evidence_status: input.evidence_record.result,
    governance_status: input.governance_record.result,
    hash_record: input.hash_record,
    replay_record: input.replay_record,
    lineage_record: input.lineage_record,
    evidence_record: input.evidence_record,
    governance_record: input.governance_record,
    ledger_record,
    audit_records: Object.freeze([
      ...input.audit_records,
      audit(input.request.verification_id, passed ? "INTEGRITY_VERIFICATION_PASSED" : "INTEGRITY_VERIFICATION_FAILED", passed ? "PASSED" : input.failed_stage ?? "FAILED_CANONICALIZATION", passed ? "PASS" : "FAIL"),
      ...(passed ? [] : [audit(input.request.verification_id, "INTAKE_REJECTED", input.failed_stage ?? "FAILED_CANONICALIZATION", "FAIL")]),
    ]),
    replay_ref: `replay_integrity_verification_${input.request.verification_id}`,
    downstream_allowed: passed,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function verifyDecisionCandidateIntegrity(request: IntegrityVerificationRequest = createIntegrityVerificationRequest()): IntegrityVerificationResult {
  const schemaFailure = request.schema_validation && request.schema_validation.validation_status !== "PASS";
  const orderFailure = !refsOrdered(request.replay_refs) || !refsOrdered(request.lineage_refs) || !refsOrdered(request.evidence_refs) || !refsOrdered(request.governance_refs);
  let canonical_hash = "";
  try {
    serializeDecisionCanonically(canonicalPayload(request.candidate_payload));
    canonical_hash = computeCandidateCanonicalHash(request.candidate_payload);
  } catch {
    canonical_hash = "";
  }

  const hash_record = hashRecord(request, canonical_hash);
  const skippedReplay = replayRecord(request, false);
  const skippedLineage = lineageRecord(request, false);
  const skippedEvidence = evidenceRecord(request, false);
  const skippedGovernance = governanceRecord(request, false);
  const canonicalFailure = schemaFailure ? "SCHEMA_VALIDATION_FAILED" : !canonical_hash ? "UNSERIALIZABLE_PAYLOAD" : orderFailure ? "UNSTABLE_REFERENCE_ORDER" : undefined;
  const canonicalAudit = audit(request.verification_id, "CANONICAL_PAYLOAD_GENERATED", canonicalFailure ? "FAILED_CANONICALIZATION" : "PAYLOAD_CANONICALIZED", canonicalFailure ? "FAIL" : "PASS");
  if (canonicalFailure) {
    return buildResult({ request, canonical_hash, hash_record, replay_record: skippedReplay, lineage_record: skippedLineage, evidence_record: skippedEvidence, governance_record: skippedGovernance, failure_reason: canonicalFailure, failed_stage: "FAILED_CANONICALIZATION", audit_records: [canonicalAudit] });
  }

  const hashFailure = failureForHash(request, hash_record);
  const hashAudit = audit(request.verification_id, "HASH_VERIFIED", hashFailure ? "FAILED_HASH" : "HASH_VERIFIED", hashFailure ? "FAIL" : "PASS");
  if (hashFailure) {
    return buildResult({ request, canonical_hash, hash_record, replay_record: skippedReplay, lineage_record: skippedLineage, evidence_record: skippedEvidence, governance_record: skippedGovernance, failure_reason: hashFailure, failed_stage: "FAILED_HASH", audit_records: [canonicalAudit, hashAudit] });
  }

  const replay_record = replayRecord(request);
  const replayCheckFailure = replayFailure(replay_record);
  const replayAudit = audit(request.verification_id, "REPLAY_REFERENCES_CHECKED", replayCheckFailure ? "FAILED_REPLAY" : "REPLAY_VERIFIED", replayCheckFailure ? "FAIL" : "PASS");
  if (replayCheckFailure) {
    return buildResult({ request, canonical_hash, hash_record, replay_record, lineage_record: skippedLineage, evidence_record: skippedEvidence, governance_record: skippedGovernance, failure_reason: replayCheckFailure, failed_stage: "FAILED_REPLAY", audit_records: [canonicalAudit, hashAudit, replayAudit] });
  }

  const lineage_record = lineageRecord(request);
  const lineageCheckFailure = lineageFailure(lineage_record);
  const lineageAudit = audit(request.verification_id, "LINEAGE_REFERENCES_CHECKED", lineageCheckFailure ? "FAILED_LINEAGE" : "LINEAGE_VERIFIED", lineageCheckFailure ? "FAIL" : "PASS");
  if (lineageCheckFailure) {
    return buildResult({ request, canonical_hash, hash_record, replay_record, lineage_record, evidence_record: skippedEvidence, governance_record: skippedGovernance, failure_reason: lineageCheckFailure, failed_stage: "FAILED_LINEAGE", audit_records: [canonicalAudit, hashAudit, replayAudit, lineageAudit] });
  }

  const evidence_record = evidenceRecord(request);
  const evidenceCheckFailure = evidenceFailure(evidence_record);
  const evidenceAudit = audit(request.verification_id, "EVIDENCE_CONSISTENCY_CHECKED", evidenceCheckFailure ? "FAILED_EVIDENCE" : "EVIDENCE_VERIFIED", evidenceCheckFailure ? "FAIL" : "PASS");
  if (evidenceCheckFailure) {
    return buildResult({ request, canonical_hash, hash_record, replay_record, lineage_record, evidence_record, governance_record: skippedGovernance, failure_reason: evidenceCheckFailure, failed_stage: "FAILED_EVIDENCE", audit_records: [canonicalAudit, hashAudit, replayAudit, lineageAudit, evidenceAudit] });
  }

  const governance_record = governanceRecord(request);
  const governanceCheckFailure = governanceFailure(governance_record);
  const governanceAudit = audit(request.verification_id, "GOVERNANCE_REFERENCES_CHECKED", governanceCheckFailure ? "FAILED_GOVERNANCE" : "GOVERNANCE_VERIFIED", governanceCheckFailure ? "FAIL" : "PASS");
  return buildResult({
    request,
    canonical_hash,
    hash_record,
    replay_record,
    lineage_record,
    evidence_record,
    governance_record,
    failure_reason: governanceCheckFailure,
    failed_stage: governanceCheckFailure ? "FAILED_GOVERNANCE" : undefined,
    audit_records: [canonicalAudit, hashAudit, replayAudit, lineageAudit, evidenceAudit, governanceAudit],
  });
}

export function integrityVerificationRequestFromIntake(intakeRequest: DecisionIntakeRequest = createDecisionIntakeRequest()): IntegrityVerificationRequest {
  const schema_validation = validateDecisionCandidateSchema(schemaValidationRequestFromIntake(intakeRequest));
  return createIntegrityVerificationRequest({
    verification_id: `integrity_verification_${intakeRequest.request_id}`,
    intake_id: `intake_${intakeRequest.request_id}`,
    candidate_id: intakeRequest.candidate_payload.candidate_id,
    source_system: intakeRequest.source_system,
    tenant_id: intakeRequest.tenant_id,
    mission_id: intakeRequest.mission_id,
    candidate_payload_ref: `payload_${intakeRequest.candidate_payload.candidate_id}`,
    candidate_payload: intakeRequest.candidate_payload,
    integrity_hash: intakeRequest.candidate_payload.integrity_hash,
    replay_refs: intakeRequest.candidate_payload.replay_refs,
    lineage_refs: intakeRequest.candidate_payload.lineage_refs,
    evidence_refs: intakeRequest.candidate_payload.evidence_refs,
    governance_refs: intakeRequest.candidate_payload.governance_refs,
    schema_validation,
  });
}

function toIntakeFailure(failure: IntegrityVerificationFailureReason): DecisionIntakeFailureReason {
  if (failure.includes("GOVERNANCE")) return "MISSING_GOVERNANCE_REFERENCES";
  if (failure.includes("EVIDENCE")) return "MISSING_EVIDENCE_REFERENCES";
  if (failure.includes("REPLAY")) return "REPLAY_CORRUPTION";
  if (failure.includes("LINEAGE") || failure.includes("ORPHANED") || failure.includes("SOURCE_RECORD")) return "LINEAGE_INCONSISTENCY";
  if (failure.includes("TENANT")) return "CROSS_TENANT_SUBMISSION";
  if (failure.includes("HASH") || failure.includes("CANONICAL") || failure.includes("SERIALIZABLE") || failure.includes("METADATA")) return "HASH_MISMATCH";
  return "HASH_MISMATCH";
}

export function verifyIntegrityForIntake(intakeRequest: DecisionIntakeRequest = createDecisionIntakeRequest()): IntegrityVerificationIntakeBridge {
  const integrity_verification = verifyDecisionCandidateIntegrity(integrityVerificationRequestFromIntake(intakeRequest));
  return Object.freeze({
    integrity_verification,
    intake_failure_reasons: Object.freeze(integrity_verification.failure_reasons.map(toIntakeFailure)),
    intake_allowed: integrity_verification.downstream_allowed,
  });
}

export function replayIntegrityVerification(result: IntegrityVerificationResult): IntegrityVerificationReplayResult {
  const reconstructed_hash = resultHash(result);
  const replay_valid = reconstructed_hash === result.integrity_hash;
  const base: Omit<IntegrityVerificationReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${result.verification_id}`,
    replay_valid,
    verification_id: result.verification_id,
    reconstructed_hash,
    expected_hash: result.integrity_hash,
    reconstructed_state: result.verification_state,
    reconstructed_failure_reason: result.failure_reason,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["REPLAY_CORRUPTION"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildIntegrityVerificationObservability(results: readonly IntegrityVerificationResult[]): IntegrityVerificationObservability {
  const failures = results.flatMap((result) => result.failure_reasons);
  return Object.freeze({
    integrity_verification_attempts: results.length,
    integrity_verification_passes: results.filter((result) => result.verification_status === "PASS").length,
    integrity_verification_failures: results.filter((result) => result.verification_status === "FAIL").length,
    hash_mismatch_count: failures.filter((failure) => ["HASH_MISMATCH", "MISSING_INTEGRITY_HASH", "INVALID_HASH_FORMAT", "UNSUPPORTED_HASH_ALGORITHM", "BROKEN_HASH_CHAIN"].includes(failure)).length,
    replay_reference_failures: failures.filter((failure) => failure.includes("REPLAY")).length,
    lineage_failures: failures.filter((failure) => failure.includes("LINEAGE") || failure.includes("ORPHANED") || failure.includes("SOURCE_RECORD")).length,
    evidence_consistency_failures: failures.filter((failure) => failure.includes("EVIDENCE")).length,
    governance_reference_failures: failures.filter((failure) => failure.includes("GOVERNANCE") || failure.includes("POLICY") || failure.includes("AUTHORITY") || failure.includes("CONSTITUTIONAL")).length,
    cross_tenant_reference_failures: failures.filter((failure) => failure.includes("TENANT")).length,
    canonicalization_failures: failures.filter((failure) => ["SCHEMA_VALIDATION_FAILED", "UNSERIALIZABLE_PAYLOAD", "NONDETERMINISTIC_FIELD_ORDER", "UNSTABLE_REFERENCE_ORDER"].includes(failure)).length,
  });
}

export function getDecisionCandidateIntegrityVerificationEngine() {
  const request = createIntegrityVerificationRequest();
  const verification = verifyDecisionCandidateIntegrity(request);
  return Object.freeze({
    verification_order: VERIFICATION_ORDER,
    request,
    verification,
    intake_bridge: verifyIntegrityForIntake(),
    replay: replayIntegrityVerification(verification),
    observability: buildIntegrityVerificationObservability([verification]),
  });
}
