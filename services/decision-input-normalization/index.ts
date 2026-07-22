import { createDecisionCandidatePayload, createDecisionIntakeRequest } from "@/services/decision-intake-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { integrityVerificationRequestFromIntake, verifyDecisionCandidateIntegrity, verifyIntegrityForIntake } from "@/services/decision-candidate-integrity-verification";
import type { DecisionCandidatePayload, DecisionIntakeFailureReason, DecisionIntakeRequest } from "@/types/decision-intake-engine";
import type {
  DecisionCandidate,
  DecisionCandidateRecord,
  DecisionIntakeMetrics,
  DecisionIntakeRecord,
  DuplicateDecisionRecord,
  DuplicateDecisionStatus,
  InputNormalizationIntakeBridge,
  InputNormalizationReplayResult,
  InputNormalizationRequest,
  InputNormalizationResult,
  NormalizationAuditRecord,
  NormalizationFailureReason,
  NormalizationRule,
  NormalizationState,
} from "@/types/decision-input-normalization";

const NOW = "2026-07-02T09:27:00.000Z";
const NORMALIZATION_VERSION = "decision-candidate-normalization/v1" as const;
const NORMALIZATION_ORDER: readonly NormalizationState[] = Object.freeze(["TERMINOLOGY_NORMALIZED", "IDENTIFIERS_NORMALIZED", "REFERENCES_NORMALIZED", "EVIDENCE_NORMALIZED", "GOVERNANCE_NORMALIZED", "REPLAY_NORMALIZED", "AUTHORITY_NORMALIZED", "ADVISORY_NORMALIZED", "REGISTERED", "DUPLICATE_EVALUATED", "LEDGER_RECORDED", "PASSED"] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function canonicalId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function canonicalRefs(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).map(canonicalId).filter(Boolean))].sort());
}

function normalizeDecisionType(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const aliases: Record<string, string> = {
    EXECUTION_PLAN: "RECOMMENDATION_SELECTION",
    PLAN_RECOMMENDATION: "RECOMMENDATION_SELECTION",
    RECOMMENDATION: "RECOMMENDATION_SELECTION",
  };
  return aliases[normalized] ?? normalized;
}

function normalizeAction(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function candidateHash(candidate: Omit<DecisionCandidate, "integrity_hash">): string {
  return hash(candidate);
}

function duplicateBasis(candidate: DecisionCandidate): readonly string[] {
  return Object.freeze([
    candidate.mission_id,
    candidate.decision_type,
    candidate.proposed_action,
    serializeDecisionCanonically(candidate.evidence_refs),
    serializeDecisionCanonically(candidate.governance_refs),
    String(candidate.authority_required),
    serializeDecisionCanonically(candidate.replay_refs),
  ]);
}

function makeRules(): readonly NormalizationRule[] {
  const specs: readonly [string, NormalizationState, string][] = Object.freeze([
    ["terminology", "TERMINOLOGY_NORMALIZED", "Map subsystem terms to Mission Control decision vocabulary."],
    ["identifiers", "IDENTIFIERS_NORMALIZED", "Canonicalize source, tenant, mission, candidate, and source record identifiers."],
    ["references", "REFERENCES_NORMALIZED", "Sort and deduplicate cross-record references."],
    ["evidence", "EVIDENCE_NORMALIZED", "Preserve canonical evidence references and lineage."],
    ["governance", "GOVERNANCE_NORMALIZED", "Preserve governance and constitutional references."],
    ["replay", "REPLAY_NORMALIZED", "Preserve deterministic replay references."],
    ["authority", "AUTHORITY_NORMALIZED", "Convert authority metadata into boolean downstream requirements."],
    ["advisory", "ADVISORY_NORMALIZED", "Preserve advisory-only constraints and block execution authority."],
  ]);
  return Object.freeze(specs.map(([id, stage, description]) => {
    const base: Omit<NormalizationRule, "integrity_hash"> = {
      rule_id: `normalization_rule_${id}`,
      stage,
      description,
      deterministic: true,
    };
    return Object.freeze({ ...base, integrity_hash: recordHash(base) });
  }));
}

export function createInputNormalizationRequest(overrides: Partial<InputNormalizationRequest> = {}): InputNormalizationRequest {
  const source_payload = overrides.source_payload ?? createDecisionCandidatePayload();
  const verification = overrides.integrity_verification ?? verifyDecisionCandidateIntegrity();
  return Object.freeze({
    normalization_id: overrides.normalization_id ?? `normalization_${source_payload.candidate_id}`,
    intake_id: overrides.intake_id ?? `intake_request_${source_payload.candidate_id}`,
    source_system: overrides.source_system ?? "mission-control-operator-console",
    tenant_id: overrides.tenant_id ?? source_payload.tenant_id,
    mission_id: overrides.mission_id ?? source_payload.mission_id,
    source_payload,
    integrity_verification: verification,
    existing_registry: overrides.existing_registry ?? Object.freeze([]),
    normalization_version: overrides.normalization_version ?? NORMALIZATION_VERSION,
  });
}

function buildCandidate(request: InputNormalizationRequest): DecisionCandidate {
  const payload = request.source_payload;
  const authority = payload.authority_metadata;
  const base: Omit<DecisionCandidate, "integrity_hash"> = {
    candidate_id: canonicalId(payload.candidate_id),
    source_system: canonicalId(request.source_system),
    source_record_ref: canonicalId(payload.source_record_id),
    tenant_id: canonicalId(request.tenant_id),
    mission_id: canonicalId(request.mission_id),
    decision_type: normalizeDecisionType(payload.decision_type),
    proposed_action: normalizeAction(payload.proposed_action),
    rationale_summary: normalizeAction(`Normalized ${payload.decision_type} from ${request.source_system}.`),
    evidence_refs: canonicalRefs(payload.evidence_refs),
    risk_refs: canonicalRefs((payload as DecisionCandidatePayload & { risk_refs?: readonly string[] }).risk_refs ?? []),
    confidence_refs: canonicalRefs((payload as DecisionCandidatePayload & { confidence_refs?: readonly string[] }).confidence_refs ?? []),
    governance_refs: canonicalRefs(payload.governance_refs),
    replay_refs: canonicalRefs(payload.replay_refs),
    authority_required: authority.authority_level !== "ADVISORY",
    operator_required: authority.authority_level === "OPERATOR_APPROVAL_REQUIRED" || authority.authority_level === "GOVERNANCE_APPROVAL_REQUIRED",
    advisory_only: authority.advisory_only && !authority.execution_authorized,
  };
  return Object.freeze({ ...base, integrity_hash: candidateHash(base) });
}

function validationFailure(request: InputNormalizationRequest): NormalizationFailureReason | undefined {
  if (!request.source_system) return "UNKNOWN_SOURCE";
  if (request.tenant_id !== request.source_payload.tenant_id || request.mission_id !== request.source_payload.mission_id) return "TENANT_MISMATCH";
  if (!request.source_payload.evidence_refs.length) return "MALFORMED_PAYLOAD";
  if (!request.source_payload.governance_refs.length) return "GOVERNANCE_OMISSION";
  if (!request.source_payload.replay_refs.length) return "REPLAY_MISMATCH";
  if (request.source_payload.authority_metadata.execution_authorized) return "AUTHORITY_VIOLATION";
  if (!request.source_payload.authority_metadata.advisory_only) return "ADVISORY_ONLY_VIOLATION";
  if (request.integrity_verification && request.integrity_verification.verification_status !== "PASS") return "INTEGRITY_VERIFICATION_FAILED";
  return undefined;
}

function duplicateRecord(candidate: DecisionCandidate, registry: readonly DecisionCandidateRecord[]): DuplicateDecisionRecord {
  const basis = duplicateBasis(candidate);
  const match = registry.find((record) => record.candidate_id === candidate.candidate_id || (record.tenant_id === candidate.tenant_id && record.mission_id === candidate.mission_id && record.integrity_hash === candidate.integrity_hash));
  const replayDuplicate = registry.find((record) => record.replay_ref && candidate.replay_refs.includes(record.replay_ref));
  const duplicate_status: DuplicateDecisionStatus = match || replayDuplicate ? "DUPLICATE" : "NEW";
  const base: Omit<DuplicateDecisionRecord, "integrity_hash"> = {
    duplicate_id: `duplicate_${candidate.candidate_id}`,
    candidate_id: candidate.candidate_id,
    duplicate_status,
    matched_candidate_id: match?.candidate_id ?? replayDuplicate?.candidate_id,
    duplicate_basis: basis,
    orchestration_blocked: duplicate_status !== "NEW",
    lineage_preserved: true,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function candidateRecord(candidate: DecisionCandidate, request: InputNormalizationRequest, duplicate_status: DuplicateDecisionStatus): DecisionCandidateRecord {
  const base: Omit<DecisionCandidateRecord, "integrity_hash"> = {
    candidate_id: candidate.candidate_id,
    source_system: candidate.source_system,
    source_record_ref: candidate.source_record_ref,
    normalized_version: NORMALIZATION_VERSION,
    intake_timestamp: NOW,
    tenant_id: candidate.tenant_id,
    mission_id: candidate.mission_id,
    validation_state: "PASSED",
    duplicate_status,
    replay_ref: `replay_normalization_${request.normalization_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash({ ...base, candidate_hash: candidate.integrity_hash }) });
}

function intakeRecord(input: {
  request: InputNormalizationRequest;
  candidate_id: string;
  validation_result: "ACCEPTED" | "REJECTED";
  duplicate_status: DuplicateDecisionStatus;
  replay_ref: string;
}): DecisionIntakeRecord {
  const base: Omit<DecisionIntakeRecord, "integrity_hash"> = {
    intake_id: input.request.intake_id,
    candidate_id: input.candidate_id,
    source_system: canonicalId(input.request.source_system),
    validation_result: input.validation_result,
    normalization_version: NORMALIZATION_VERSION,
    duplicate_status: input.duplicate_status,
    replay_ref: input.replay_ref,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function audit(normalization_id: string, normalization_stage: NormalizationState, audit_event: NormalizationAuditRecord["audit_event"], result: "PASS" | "FAIL"): NormalizationAuditRecord {
  const base: Omit<NormalizationAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${normalization_id}_${audit_event.toLowerCase()}`,
    normalization_id,
    normalization_stage,
    audit_event,
    result,
    replay_ref: `replay_${normalization_id}_${audit_event.toLowerCase()}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function resultHash(result: Omit<InputNormalizationResult, "integrity_hash"> | InputNormalizationResult): string {
  const copy = { ...(result as InputNormalizationResult) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function rejected(request: InputNormalizationRequest, failure: NormalizationFailureReason): InputNormalizationResult {
  const replay_ref = `replay_normalization_${request.normalization_id}`;
  const intake_record = intakeRecord({ request, candidate_id: canonicalId(request.source_payload.candidate_id), validation_result: "REJECTED", duplicate_status: "NEW", replay_ref });
  const base: Omit<InputNormalizationResult, "integrity_hash"> = {
    normalization_id: request.normalization_id,
    intake_id: request.intake_id,
    normalization_status: "FAIL",
    normalization_state: failure === "AUTHORITY_VIOLATION" || failure === "ADVISORY_ONLY_VIOLATION" ? "FAILED_AUTHORITY" : "FAILED_VALIDATION",
    failure_reason: failure,
    failure_reasons: Object.freeze([failure]),
    intake_record,
    normalization_rules: makeRules(),
    audit_records: Object.freeze([
      audit(request.normalization_id, "PENDING", "NORMALIZATION_STARTED", "PASS"),
      audit(request.normalization_id, "FAILED_VALIDATION", "NORMALIZATION_REJECTED", "FAIL"),
    ]),
    registry_size: request.existing_registry?.length ?? 0,
    forwarded_to_orchestration: false,
    replay_ref,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function normalizeDecisionCandidateInput(request: InputNormalizationRequest = createInputNormalizationRequest()): InputNormalizationResult {
  const failure = validationFailure(request);
  if (failure) return rejected(request, failure);

  const candidate = buildCandidate(request);
  const duplicate_record = duplicateRecord(candidate, request.existing_registry ?? []);
  const duplicateReplayFailure = duplicate_record.duplicate_status === "DUPLICATE" && duplicate_record.duplicate_basis.some((item) => item.includes("duplicate_replay"));
  if (duplicateReplayFailure) return rejected(request, "DUPLICATE_REPLAY_IDENTIFIER");

  const candidate_record = candidateRecord(candidate, request, duplicate_record.duplicate_status);
  const replay_ref = `replay_normalization_${request.normalization_id}`;
  const intake_record = intakeRecord({
    request,
    candidate_id: candidate.candidate_id,
    validation_result: "ACCEPTED",
    duplicate_status: duplicate_record.duplicate_status,
    replay_ref,
  });
  const base: Omit<InputNormalizationResult, "integrity_hash"> = {
    normalization_id: request.normalization_id,
    intake_id: request.intake_id,
    normalization_status: "PASS",
    normalization_state: "PASSED",
    failure_reasons: Object.freeze([]),
    candidate,
    candidate_record,
    duplicate_record,
    intake_record,
    normalization_rules: makeRules(),
    audit_records: Object.freeze([
      audit(request.normalization_id, "PENDING", "NORMALIZATION_STARTED", "PASS"),
      audit(request.normalization_id, "TERMINOLOGY_NORMALIZED", "TERMINOLOGY_NORMALIZED", "PASS"),
      audit(request.normalization_id, "IDENTIFIERS_NORMALIZED", "IDENTIFIERS_NORMALIZED", "PASS"),
      audit(request.normalization_id, "REFERENCES_NORMALIZED", "REFERENCES_NORMALIZED", "PASS"),
      audit(request.normalization_id, "GOVERNANCE_NORMALIZED", "GOVERNANCE_NORMALIZED", "PASS"),
      audit(request.normalization_id, "REPLAY_NORMALIZED", "REPLAY_NORMALIZED", "PASS"),
      audit(request.normalization_id, "AUTHORITY_NORMALIZED", "AUTHORITY_NORMALIZED", "PASS"),
      audit(request.normalization_id, "ADVISORY_NORMALIZED", "ADVISORY_METADATA_NORMALIZED", "PASS"),
      audit(request.normalization_id, "REGISTERED", "REGISTRY_UPDATED", "PASS"),
      audit(request.normalization_id, "DUPLICATE_EVALUATED", "DUPLICATE_EVALUATION_COMPLETED", "PASS"),
      audit(request.normalization_id, "LEDGER_RECORDED", "LEDGER_ENTRY_CREATED", "PASS"),
    ]),
    registry_size: (request.existing_registry?.length ?? 0) + 1,
    forwarded_to_orchestration: duplicate_record.duplicate_status === "NEW",
    replay_ref,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function inputNormalizationRequestFromIntake(intakeRequest: DecisionIntakeRequest = createDecisionIntakeRequest(), existing_registry: readonly DecisionCandidateRecord[] = []): InputNormalizationRequest {
  return createInputNormalizationRequest({
    normalization_id: `normalization_${intakeRequest.request_id}`,
    intake_id: `intake_${intakeRequest.request_id}`,
    source_system: intakeRequest.source_system,
    tenant_id: intakeRequest.tenant_id,
    mission_id: intakeRequest.mission_id,
    source_payload: intakeRequest.candidate_payload,
    integrity_verification: verifyDecisionCandidateIntegrity(integrityVerificationRequestFromIntake(intakeRequest)),
    existing_registry,
  });
}

function toIntakeFailures(failures: readonly NormalizationFailureReason[]): readonly DecisionIntakeFailureReason[] {
  return Object.freeze([...new Set(failures.map((failure): DecisionIntakeFailureReason => {
    if (failure === "UNKNOWN_SOURCE" || failure === "SOURCE_VALIDATION_FAILED") return "UNKNOWN_SUBSYSTEM";
    if (failure === "TENANT_MISMATCH") return "TENANT_MISMATCH";
    if (failure === "GOVERNANCE_OMISSION") return "MISSING_GOVERNANCE_REFERENCES";
    if (failure === "REPLAY_MISMATCH" || failure === "DUPLICATE_REPLAY_IDENTIFIER") return "REPLAY_CORRUPTION";
    if (failure === "AUTHORITY_VIOLATION") return "AUTHORITY_ESCALATION";
    if (failure === "ADVISORY_ONLY_VIOLATION") return "ADVISORY_ONLY_VIOLATION";
    if (failure === "INTEGRITY_VERIFICATION_FAILED") return "HASH_MISMATCH";
    return "MISSING_IDENTIFIER";
  }))]);
}

export function normalizeInputForIntake(intakeRequest: DecisionIntakeRequest = createDecisionIntakeRequest(), existing_registry: readonly DecisionCandidateRecord[] = []): InputNormalizationIntakeBridge {
  const normalization = normalizeDecisionCandidateInput(inputNormalizationRequestFromIntake(intakeRequest, existing_registry));
  return Object.freeze({
    normalization,
    intake_failure_reasons: toIntakeFailures(normalization.failure_reasons),
    normalization_allowed: normalization.forwarded_to_orchestration,
  });
}

export function replayInputNormalization(result: InputNormalizationResult): InputNormalizationReplayResult {
  const reconstructed_hash = resultHash(result);
  const replay_valid = reconstructed_hash === result.integrity_hash;
  const base: Omit<InputNormalizationReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${result.normalization_id}`,
    replay_valid,
    normalization_id: result.normalization_id,
    reconstructed_hash,
    expected_hash: result.integrity_hash,
    reconstructed_state: result.normalization_state,
    duplicate_status: result.duplicate_record?.duplicate_status,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["REPLAY_MISMATCH"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildDecisionIntakeMetrics(results: readonly InputNormalizationResult[]): DecisionIntakeMetrics {
  const accepted = results.filter((result) => result.normalization_status === "PASS");
  const failures = results.flatMap((result) => result.failure_reasons);
  return Object.freeze({
    candidates_received: results.length,
    accepted_candidates: accepted.length,
    rejected_candidates: results.length - accepted.length,
    normalization_latency: 0,
    duplicate_rate: results.length === 0 ? 0 : results.filter((result) => result.duplicate_record?.duplicate_status === "DUPLICATE").length / results.length,
    validation_failures: failures.filter((failure) => failure.includes("VALIDATION") || failure === "MALFORMED_PAYLOAD").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    replay_validation_success: results.length === 0 ? 0 : results.filter((result) => replayInputNormalization(result).replay_valid).length / results.length,
    tenant_distribution: Object.freeze(results.reduce<Record<string, number>>((counts, result) => {
      const tenant = result.candidate?.tenant_id ?? "unknown";
      counts[tenant] = (counts[tenant] ?? 0) + 1;
      return counts;
    }, {})),
    subsystem_distribution: Object.freeze(results.reduce<Record<string, number>>((counts, result) => {
      counts[result.intake_record.source_system] = (counts[result.intake_record.source_system] ?? 0) + 1;
      return counts;
    }, {})),
    normalization_throughput: results.length,
    registry_growth: results.reduce((count, result) => count + (result.candidate_record ? 1 : 0), 0),
    ledger_write_latency: 0,
  });
}

export function getDecisionInputNormalizationAdapter() {
  const request = createInputNormalizationRequest();
  const normalization = normalizeDecisionCandidateInput(request);
  return Object.freeze({
    normalization_order: NORMALIZATION_ORDER,
    normalization_rules: makeRules(),
    request,
    normalization,
    intake_bridge: normalizeInputForIntake(),
    integrity_bridge: verifyIntegrityForIntake(),
    replay: replayInputNormalization(normalization),
    metrics: buildDecisionIntakeMetrics([normalization]),
  });
}
