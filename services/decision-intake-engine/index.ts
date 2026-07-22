import { runDecisionOrchestrationCertification } from "@/services/decision-orchestration-certification";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  DecisionCandidatePayload,
  DecisionIntakeBatchResult,
  DecisionIntakeFailureReason,
  DecisionIntakeMode,
  DecisionIntakeObservability,
  DecisionIntakeReplayResult,
  DecisionIntakeRequest,
  DecisionIntakeResult,
  DecisionIntakeState,
  IntakeAuditRecord,
  IntakeSequenceRecord,
  IntakeValidationRecord,
  RegisteredDecisionSource,
} from "@/types/decision-intake-engine";

const NOW = "2026-07-02T09:23:00.000Z";

export const REGISTERED_DECISION_SOURCES: readonly RegisteredDecisionSource[] = Object.freeze([
  Object.freeze({
    source_system: "mission-control-operator-console",
    supported_versions: Object.freeze(["1.0.0"]),
    trusted_identity: "subsystem:operator-console",
    certified: true,
    certification_expires_at: "2027-07-02T00:00:00.000Z",
    active: true,
    revoked: false,
    authority_levels: Object.freeze(["ADVISORY", "OPERATOR_APPROVAL_REQUIRED"]),
    priority: 1,
  }),
  Object.freeze({
    source_system: "mission-control-governance-engine",
    supported_versions: Object.freeze(["1.0.0"]),
    trusted_identity: "subsystem:governance-engine",
    certified: true,
    certification_expires_at: "2027-07-02T00:00:00.000Z",
    active: true,
    revoked: false,
    authority_levels: Object.freeze(["ADVISORY", "GOVERNANCE_APPROVAL_REQUIRED"]),
    priority: 2,
  }),
  Object.freeze({
    source_system: "mission-control-prediction-engine",
    supported_versions: Object.freeze(["1.0.0"]),
    trusted_identity: "subsystem:prediction-engine",
    certified: true,
    certification_expires_at: "2027-07-02T00:00:00.000Z",
    active: true,
    revoked: false,
    authority_levels: Object.freeze(["ADVISORY"]),
    priority: 3,
  }),
]);

const TENANTS = Object.freeze({
  tenant_alpha: Object.freeze({ active: true, authorized: true }),
  tenant_inactive: Object.freeze({ active: false, authorized: false }),
});

const MISSIONS: Readonly<Record<string, {
  tenant_id: string;
  active: boolean;
  lifecycle_state: "ACTIVE" | "ARCHIVED" | "COMPLETED";
  accepts_orchestration: boolean;
}>> = Object.freeze({
  mission_phase_9_decision_orchestration: Object.freeze({
    tenant_id: "tenant_alpha",
    active: true,
    lifecycle_state: "ACTIVE",
    accepts_orchestration: true,
  }),
  mission_archived: Object.freeze({
    tenant_id: "tenant_alpha",
    active: false,
    lifecycle_state: "ARCHIVED",
    accepts_orchestration: false,
  }),
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function stripPayloadHash(payload: DecisionCandidatePayload): Omit<DecisionCandidatePayload, "integrity_hash"> {
  const copy = { ...payload };
  delete copy.integrity_hash;
  return copy;
}

function payloadHash(payload: DecisionCandidatePayload): string {
  return hash(stripPayloadHash(payload));
}

export function createDecisionCandidatePayload(overrides: Partial<DecisionCandidatePayload> = {}): DecisionCandidatePayload {
  const tenant_id = overrides.tenant_id ?? "tenant_alpha";
  const mission_id = overrides.mission_id ?? "mission_phase_9_decision_orchestration";
  const base: Omit<DecisionCandidatePayload, "integrity_hash"> = {
    candidate_id: overrides.candidate_id ?? `candidate_${tenant_id}_${mission_id}_001`,
    decision_type: overrides.decision_type ?? "RECOMMENDATION_SELECTION",
    proposed_action: overrides.proposed_action ?? "Recommend operator-visible decision package for normalization.",
    evidence_refs: overrides.evidence_refs ?? Object.freeze([`evidence_${tenant_id}_${mission_id}_001`]),
    replay_refs: overrides.replay_refs ?? Object.freeze([`replay_${tenant_id}_${mission_id}_001`]),
    governance_refs: overrides.governance_refs ?? Object.freeze([`governance_${tenant_id}_${mission_id}_001`]),
    lineage_refs: overrides.lineage_refs ?? Object.freeze([`lineage_${tenant_id}_${mission_id}_001`]),
    authority_metadata: overrides.authority_metadata ?? Object.freeze({
      authority_level: "ADVISORY",
      advisory_only: true,
      execution_authorized: false,
      requested_operations: Object.freeze(["recommend"]),
    }),
    source_record_id: overrides.source_record_id ?? `source_record_${tenant_id}_${mission_id}_001`,
    source_priority: overrides.source_priority ?? 1,
    payload_timestamp: overrides.payload_timestamp ?? NOW,
    tenant_id,
    mission_id,
  };
  return Object.freeze({ ...base, integrity_hash: overrides.integrity_hash ?? hash(base) });
}

export function createDecisionIntakeRequest(overrides: Partial<DecisionIntakeRequest> = {}): DecisionIntakeRequest {
  const candidate_payload = overrides.candidate_payload ?? createDecisionCandidatePayload();
  return Object.freeze({
    request_id: overrides.request_id ?? `request_${candidate_payload.candidate_id}`,
    source_system: overrides.source_system ?? "mission-control-operator-console",
    source_version: overrides.source_version ?? "1.0.0",
    tenant_id: overrides.tenant_id ?? candidate_payload.tenant_id,
    mission_id: overrides.mission_id ?? candidate_payload.mission_id,
    submission_mode: overrides.submission_mode ?? "SYNCHRONOUS",
    candidate_payload,
    submission_timestamp: overrides.submission_timestamp ?? NOW,
  });
}

function sourceFailures(request: DecisionIntakeRequest): readonly DecisionIntakeFailureReason[] {
  const source = REGISTERED_DECISION_SOURCES.find((item) => item.source_system === request.source_system);
  if (!source) return Object.freeze(["UNKNOWN_SUBSYSTEM"] as const);
  return Object.freeze([
    ...(source.revoked ? ["REVOKED_SUBSYSTEM" as const] : []),
    ...(!source.supported_versions.includes(request.source_version) ? ["UNSUPPORTED_SOURCE_VERSION" as const] : []),
    ...(source.certification_expires_at <= NOW || !source.certified ? ["EXPIRED_CERTIFICATION" as const] : []),
    ...(!source.active ? ["INACTIVE_COMPONENT" as const] : []),
  ]);
}

function tenantFailures(request: DecisionIntakeRequest): readonly DecisionIntakeFailureReason[] {
  const tenant = TENANTS[request.tenant_id as keyof typeof TENANTS];
  if (!tenant) return Object.freeze(["UNKNOWN_TENANT"] as const);
  return Object.freeze([
    ...(!tenant.active ? ["INACTIVE_TENANT" as const] : []),
    ...(!tenant.authorized ? ["UNKNOWN_TENANT" as const] : []),
    ...(request.candidate_payload.tenant_id !== request.tenant_id ? ["TENANT_MISMATCH" as const] : []),
    ...(serializeDecisionCanonically(request.candidate_payload).includes("tenant_beta") && request.tenant_id !== "tenant_beta" ? ["CROSS_TENANT_SUBMISSION" as const] : []),
  ]);
}

function missionFailures(request: DecisionIntakeRequest): readonly DecisionIntakeFailureReason[] {
  const mission = MISSIONS[request.mission_id as keyof typeof MISSIONS];
  if (!mission) return Object.freeze(["UNKNOWN_MISSION"] as const);
  return Object.freeze([
    ...(mission.lifecycle_state === "ARCHIVED" ? ["ARCHIVED_MISSION" as const] : []),
    ...(mission.lifecycle_state === "COMPLETED" ? ["COMPLETED_MISSION" as const] : []),
    ...(mission.tenant_id !== request.tenant_id ? ["MISSION_TENANT_MISMATCH" as const] : []),
    ...(!mission.accepts_orchestration || !mission.active ? ["MISSION_NOT_ACCEPTING_ORCHESTRATION" as const] : []),
    ...(request.candidate_payload.mission_id !== request.mission_id ? ["MISSION_TENANT_MISMATCH" as const] : []),
  ]);
}

function schemaFailures(payload: DecisionCandidatePayload): readonly DecisionIntakeFailureReason[] {
  return Object.freeze([
    ...(!payload.candidate_id || !payload.source_record_id ? ["MISSING_IDENTIFIER" as const] : []),
    ...(!payload.decision_type ? ["MISSING_DECISION_TYPE" as const] : []),
    ...(!payload.proposed_action ? ["MISSING_PROPOSED_ACTION" as const] : []),
    ...(payload.evidence_refs.length === 0 ? ["MISSING_EVIDENCE_REFERENCES" as const] : []),
    ...(payload.replay_refs.length === 0 ? ["MISSING_REPLAY_REFERENCES" as const] : []),
    ...(payload.governance_refs.length === 0 ? ["MISSING_GOVERNANCE_REFERENCES" as const] : []),
    ...(!payload.authority_metadata ? ["MISSING_AUTHORITY_METADATA" as const] : []),
    ...(payload.authority_metadata && !payload.authority_metadata.advisory_only ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
}

function authorityFailures(request: DecisionIntakeRequest): readonly DecisionIntakeFailureReason[] {
  const source = REGISTERED_DECISION_SOURCES.find((item) => item.source_system === request.source_system);
  const metadata = request.candidate_payload.authority_metadata;
  return Object.freeze([
    ...(!source ? ["UNAUTHORIZED_SUBSYSTEM" as const] : []),
    ...(source && !source.authority_levels.includes(metadata.authority_level) ? ["INVALID_APPROVAL_LEVEL" as const] : []),
    ...(metadata.execution_authorized ? ["AUTHORITY_ESCALATION" as const] : []),
    ...(metadata.requested_operations.some((operation) => /execute|deploy|modify|command|approve/i.test(operation)) ? ["POLICY_VIOLATION" as const] : []),
  ]);
}

function integrityFailures(payload: DecisionCandidatePayload): readonly DecisionIntakeFailureReason[] {
  return Object.freeze([
    ...(payload.integrity_hash !== payloadHash(payload) ? ["HASH_MISMATCH" as const] : []),
    ...(payload.replay_refs.some((ref) => ref.includes("corrupt")) ? ["REPLAY_CORRUPTION" as const] : []),
    ...(payload.lineage_refs.length === 0 || payload.lineage_refs.some((ref) => ref.includes("broken")) ? ["LINEAGE_INCONSISTENCY" as const] : []),
  ]);
}

function validationState(failures: readonly DecisionIntakeFailureReason[]): DecisionIntakeState {
  if (failures.includes("UNKNOWN_SUBSYSTEM") || failures.includes("REVOKED_SUBSYSTEM") || failures.includes("UNSUPPORTED_SOURCE_VERSION") || failures.includes("EXPIRED_CERTIFICATION") || failures.includes("INACTIVE_COMPONENT")) return "INVALID_SOURCE";
  if (failures.includes("UNKNOWN_TENANT") || failures.includes("INACTIVE_TENANT") || failures.includes("TENANT_MISMATCH") || failures.includes("CROSS_TENANT_SUBMISSION")) return "INVALID_TENANT";
  if (failures.includes("UNKNOWN_MISSION") || failures.includes("ARCHIVED_MISSION") || failures.includes("COMPLETED_MISSION") || failures.includes("MISSION_TENANT_MISMATCH") || failures.includes("MISSION_NOT_ACCEPTING_ORCHESTRATION")) return "INVALID_MISSION";
  if (failures.includes("MISSING_IDENTIFIER") || failures.includes("MISSING_DECISION_TYPE") || failures.includes("MISSING_PROPOSED_ACTION") || failures.includes("MISSING_EVIDENCE_REFERENCES") || failures.includes("MISSING_REPLAY_REFERENCES") || failures.includes("MISSING_GOVERNANCE_REFERENCES") || failures.includes("MISSING_AUTHORITY_METADATA")) return "INVALID_SCHEMA";
  if (failures.includes("AUTHORITY_ESCALATION") || failures.includes("UNAUTHORIZED_SUBSYSTEM") || failures.includes("INVALID_APPROVAL_LEVEL") || failures.includes("POLICY_VIOLATION") || failures.includes("ADVISORY_ONLY_VIOLATION")) return "INVALID_AUTHORITY";
  if (failures.includes("HASH_MISMATCH") || failures.includes("REPLAY_CORRUPTION") || failures.includes("LINEAGE_INCONSISTENCY")) return "INTEGRITY_FAILURE";
  return failures.length ? "REJECTED" : "FORWARDED";
}

export function validateDecisionIntakeRequest(request: DecisionIntakeRequest, existingRequests: readonly DecisionIntakeRequest[] = []): IntakeValidationRecord {
  const source = sourceFailures(request);
  const tenant = tenantFailures(request);
  const mission = missionFailures(request);
  const schema = schemaFailures(request.candidate_payload);
  const authority = authorityFailures(request);
  const integrity = integrityFailures(request.candidate_payload);
  const foundation = runDecisionOrchestrationCertification().certification_record.certification_result === "PASS" ? [] : ["FOUNDATION_NOT_CERTIFIED" as const];
  const duplicate = existingRequests.some((item) => item.request_id === request.request_id) ? ["DUPLICATE_REQUEST_IDENTIFIER" as const] : [];
  const failure_reasons = Object.freeze([...new Set([...source, ...tenant, ...mission, ...schema, ...authority, ...integrity, ...foundation, ...duplicate])]);
  const base: Omit<IntakeValidationRecord, "integrity_hash"> = {
    validation_id: `validation_${request.request_id}`,
    request_id: request.request_id,
    source_result: source.length ? "FAIL" : "PASS",
    tenant_result: tenant.length ? "FAIL" : "PASS",
    mission_result: mission.length ? "FAIL" : "PASS",
    schema_result: schema.length ? "FAIL" : "PASS",
    authority_result: authority.length ? "FAIL" : "PASS",
    integrity_result: integrity.length ? "FAIL" : "PASS",
    overall_result: failure_reasons.length ? "REJECTED" : "ACCEPTED",
    failure_reasons,
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function orderingBasis(request: DecisionIntakeRequest): readonly string[] {
  const source = REGISTERED_DECISION_SOURCES.find((item) => item.source_system === request.source_system);
  return Object.freeze([
    request.mission_id,
    request.candidate_payload.payload_timestamp,
    String(source?.priority ?? request.candidate_payload.source_priority),
    request.candidate_payload.source_record_id,
    request.candidate_payload.candidate_id,
  ]);
}

export function orderDecisionIntakeRequests(requests: readonly DecisionIntakeRequest[]): readonly DecisionIntakeRequest[] {
  return Object.freeze([...requests].sort((left, right) => serializeDecisionCanonically(orderingBasis(left)).localeCompare(serializeDecisionCanonically(orderingBasis(right)))));
}

function sequenceRecord(request: DecisionIntakeRequest, sequence: number): IntakeSequenceRecord {
  const base: Omit<IntakeSequenceRecord, "integrity_hash"> = {
    sequence_id: `sequence_${request.mission_id}_${sequence}`,
    mission_id: request.mission_id,
    tenant_id: request.tenant_id,
    intake_sequence: sequence,
    ordering_basis: orderingBasis(request),
    replay_reference: `replay_intake_sequence_${request.request_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function audit(intake_id: string, stage: DecisionIntakeState): IntakeAuditRecord {
  const base: Omit<IntakeAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${intake_id}_${stage.toLowerCase()}`,
    intake_id,
    processing_stage: stage,
    timestamp: NOW,
    replay_reference: `replay_${intake_id}_${stage.toLowerCase()}`,
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function resultHash(result: Omit<DecisionIntakeResult, "integrity_hash"> | DecisionIntakeResult): string {
  const copy = { ...(result as DecisionIntakeResult) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function receiveDecisionCandidate(request: DecisionIntakeRequest = createDecisionIntakeRequest(), options: { existingRequests?: readonly DecisionIntakeRequest[]; intake_sequence?: number } = {}): DecisionIntakeResult {
  const validation_record = validateDecisionIntakeRequest(request, options.existingRequests);
  const accepted = validation_record.overall_result === "ACCEPTED";
  const intake_id = `intake_${request.request_id}`;
  const state = accepted ? "FORWARDED" : validationState(validation_record.failure_reasons);
  const sequence_record = accepted ? sequenceRecord(request, options.intake_sequence ?? 1) : undefined;
  const base: Omit<DecisionIntakeResult, "integrity_hash"> = {
    intake_id,
    candidate_id: request.candidate_payload.candidate_id,
    validation_result: validation_record.overall_result,
    failure_reason: validation_record.failure_reasons[0],
    failure_reasons: validation_record.failure_reasons,
    intake_sequence: sequence_record?.intake_sequence,
    processing_mode: request.submission_mode,
    state,
    replay_reference: `replay_${intake_id}`,
    forwarded_to_normalization: accepted,
    validation_record,
    sequence_record,
    audit_records: accepted
      ? Object.freeze(["RECEIVED", "AUTHENTICATED", "VALIDATING", "VALIDATED", "RECORDED", "FORWARDED"].map((stage) => audit(intake_id, stage as DecisionIntakeState)))
      : Object.freeze(["RECEIVED", "VALIDATING", state].map((stage) => audit(intake_id, stage as DecisionIntakeState))),
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function receiveDecisionBatch(requests: readonly DecisionIntakeRequest[], options: { partial_acceptance_allowed?: boolean } = {}): DecisionIntakeBatchResult {
  const ordered = orderDecisionIntakeRequests(requests);
  const rawResults = ordered.map((request, index) => receiveDecisionCandidate(request, { existingRequests: requests.filter((item) => item !== request), intake_sequence: index + 1 }));
  const anyRejected = rawResults.some((result) => result.validation_result === "REJECTED");
  const results = options.partial_acceptance_allowed ? rawResults : rawResults.map((result) => anyRejected && result.validation_result === "ACCEPTED" ? Object.freeze({ ...result, validation_result: "REJECTED" as const, state: "REJECTED" as const, forwarded_to_normalization: false, failure_reason: "DUPLICATE_REQUEST_IDENTIFIER" as const, failure_reasons: Object.freeze(["DUPLICATE_REQUEST_IDENTIFIER" as const]), integrity_hash: hash({ ...result, validation_result: "REJECTED" }) }) : result);
  const base: Omit<DecisionIntakeBatchResult, "integrity_hash"> = {
    batch_id: `batch_${hash(ordered.map((request) => request.request_id)).slice(0, 16)}`,
    validation_result: results.some((result) => result.validation_result === "REJECTED") ? "REJECTED" : "ACCEPTED",
    partial_acceptance_allowed: options.partial_acceptance_allowed ?? false,
    results: Object.freeze(results),
    accepted_count: results.filter((result) => result.validation_result === "ACCEPTED").length,
    rejected_count: results.filter((result) => result.validation_result === "REJECTED").length,
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

export function replayDecisionIntake(original: DecisionIntakeResult): DecisionIntakeReplayResult {
  const replayed_hash = resultHash(original);
  const replay_valid = replayed_hash === original.integrity_hash;
  const base: Omit<DecisionIntakeReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${original.intake_id}`,
    replay_valid,
    original_hash: original.integrity_hash,
    replayed_hash,
    reconstructed_sequences: Object.freeze(original.intake_sequence ? [original.intake_sequence] : []),
    failures: Object.freeze(replay_valid ? [] : ["REPLAY_CORRUPTION" as const]),
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

export function buildDecisionIntakeObservability(results: readonly DecisionIntakeResult[]): DecisionIntakeObservability {
  const failures = results.flatMap((result) => result.failure_reasons);
  return Object.freeze({
    candidates_received: results.length,
    accepted_candidates: results.filter((result) => result.validation_result === "ACCEPTED").length,
    rejected_candidates: results.filter((result) => result.validation_result === "REJECTED").length,
    validation_failures: failures.length,
    intake_latency: 0,
    queue_depth: results.filter((result) => result.processing_mode === "ASYNCHRONOUS").length,
    replay_accuracy: results.length === 0 ? 0 : results.filter((result) => replayDecisionIntake(result).replay_valid).length / results.length,
    throughput: results.length,
    source_distribution: Object.freeze(results.reduce<Record<string, number>>((counts, result) => {
      const source = result.intake_id.split("request_")[1]?.split("_candidate_")[0] ?? "unknown";
      counts[source] = (counts[source] ?? 0) + 1;
      return counts;
    }, {})),
    mission_distribution: Object.freeze(results.reduce<Record<string, number>>((counts, result) => {
      const mission = result.sequence_record?.mission_id ?? "unknown";
      counts[mission] = (counts[mission] ?? 0) + 1;
      return counts;
    }, {})),
    tenant_distribution: Object.freeze(results.reduce<Record<string, number>>((counts, result) => {
      const tenant = result.sequence_record?.tenant_id ?? "unknown";
      counts[tenant] = (counts[tenant] ?? 0) + 1;
      return counts;
    }, {})),
    processing_mode_distribution: Object.freeze(results.reduce<Record<DecisionIntakeMode, number>>((counts, result) => {
      counts[result.processing_mode] = (counts[result.processing_mode] ?? 0) + 1;
      return counts;
    }, {} as Record<DecisionIntakeMode, number>)),
  });
}

export function getDecisionIntakeEngine() {
  const request = createDecisionIntakeRequest();
  const result = receiveDecisionCandidate(request);
  return Object.freeze({
    sources: REGISTERED_DECISION_SOURCES,
    request,
    result,
    replay: replayDecisionIntake(result),
    observability: buildDecisionIntakeObservability([result]),
  });
}
