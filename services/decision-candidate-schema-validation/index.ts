import { createDecisionCandidatePayload, createDecisionIntakeRequest } from "@/services/decision-intake-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { DecisionIntakeFailureReason, DecisionIntakeRequest } from "@/types/decision-intake-engine";
import type {
  CandidateSchemaAuditRecord,
  CandidateSchemaFailureReason,
  CandidateSchemaIntakeBridge,
  CandidateSchemaObservability,
  CandidateSchemaValidationState,
  LineageValidationRecord,
  ReferenceValidationRecord,
  RequiredFieldValidationRecord,
  SchemaValidationReplayResult,
  SchemaValidationRequest,
  SchemaValidationResult,
} from "@/types/decision-candidate-schema-validation";

const NOW = "2026-07-02T09:25:00.000Z";
const REQUIRED_FIELDS = Object.freeze(["source_system", "mission_id", "tenant_id", "decision_type", "proposed_action", "evidence_refs", "replay_refs"] as const);
const KNOWN_UNDEFINED_FIELD_KEYS = new Set<string>([
  ...REQUIRED_FIELDS,
  "candidate_id",
  "source_record_id",
  "source_record_ref",
  "lineage_refs",
]);
const REQUIRED_FAILURES = new Set<CandidateSchemaFailureReason>([
  "MISSING_SOURCE_SYSTEM",
  "MISSING_TENANT_ID",
  "MISSING_MISSION_ID",
  "MISSING_DECISION_TYPE",
  "MISSING_PROPOSED_ACTION",
  "MISSING_EVIDENCE_REFS",
  "MISSING_REPLAY_REFS",
  "EMPTY_REQUIRED_FIELD",
]);
const VALIDATION_ORDER: readonly CandidateSchemaValidationState[] = Object.freeze(["STRUCTURE_VALIDATED", "FIELDS_VALIDATED", "IDENTIFIERS_VALIDATED", "REFERENCES_VALIDATED", "LINEAGE_VALIDATED", "SERIALIZATION_VALIDATED", "PASSED"] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExecutableContent(value: unknown): boolean {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") return true;
  if (Array.isArray(value)) return value.some((item) => hasExecutableContent(item));
  if (isRecord(value)) {
    return Object.entries(value).some(([key, item]) => /execute|script|function|eval|command|hidden_logic/i.test(key) || hasExecutableContent(item));
  }
  return false;
}

function hasUnsupportedUndefined(value: unknown, key?: string): boolean {
  if (value === undefined) return key === undefined || !KNOWN_UNDEFINED_FIELD_KEYS.has(key);
  if (Array.isArray(value)) return value.some((item) => hasUnsupportedUndefined(item));
  if (isRecord(value)) return Object.entries(value).some(([childKey, item]) => hasUnsupportedUndefined(item, childKey));
  return false;
}

function idValid(value: unknown): boolean {
  return typeof value === "string" && /^[a-z][a-z0-9_-]*$/i.test(value) && !/random|uuid|Math\.random|Date\.now/i.test(value);
}

function refs(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : Object.freeze([]);
}

function duplicateRefs(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  return Object.freeze(values.filter((item) => {
    if (seen.has(item)) return true;
    seen.add(item);
    return false;
  }));
}

function deterministicOrder(values: readonly string[]): boolean {
  return values.every((value, index) => [...values].sort()[index] === value);
}

export function createSchemaValidationRequest(overrides: Partial<SchemaValidationRequest> = {}): SchemaValidationRequest {
  const payload = Object.prototype.hasOwnProperty.call(overrides, "raw_candidate_payload") ? overrides.raw_candidate_payload : {
    ...createDecisionCandidatePayload(),
    source_system: "mission-control-operator-console",
    source_record_ref: "source_record_tenant_alpha_mission_phase_9_decision_orchestration_001",
  };
  return Object.freeze({
    validation_id: overrides.validation_id ?? "schema_validation_candidate_001",
    intake_id: overrides.intake_id ?? "intake_candidate_001",
    source_system: overrides.source_system ?? (isRecord(payload) ? payload.source_system as string | undefined : undefined),
    tenant_id: overrides.tenant_id ?? (isRecord(payload) ? payload.tenant_id as string | undefined : undefined),
    mission_id: overrides.mission_id ?? (isRecord(payload) ? payload.mission_id as string | undefined : undefined),
    raw_candidate_payload: payload,
    schema_version: overrides.schema_version ?? "decision-candidate-schema/v1",
    validation_policy_ref: overrides.validation_policy_ref ?? "policy_decision_candidate_schema_v1",
  });
}

function structureFailures(payload: unknown): readonly CandidateSchemaFailureReason[] {
  return Object.freeze([
    ...(!isRecord(payload) ? ["MALFORMED_OBJECT" as const] : []),
    ...(Array.isArray(payload) ? ["UNSUPPORTED_ROOT_STRUCTURE" as const] : []),
    ...(hasExecutableContent(payload) ? ["HIDDEN_EXECUTABLE_LOGIC" as const] : []),
    ...(hasUnsupportedUndefined(payload) ? ["UNSUPPORTED_FIELD_TYPE" as const] : []),
  ]);
}

function requiredFieldRecord(request: SchemaValidationRequest): RequiredFieldValidationRecord {
  const payload = isRecord(request.raw_candidate_payload) ? request.raw_candidate_payload : {};
  const missing_fields = Object.freeze(REQUIRED_FIELDS.filter((field) => payload[field] === undefined));
  const empty_fields = Object.freeze(REQUIRED_FIELDS.filter((field) => payload[field] === "" || (Array.isArray(payload[field]) && payload[field].length === 0)));
  const base: Omit<RequiredFieldValidationRecord, "integrity_hash"> = {
    record_id: `required_fields_${request.validation_id}`,
    validation_id: request.validation_id,
    required_fields_checked: REQUIRED_FIELDS,
    missing_fields,
    empty_fields,
    result: missing_fields.length || empty_fields.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function requiredFailures(record: RequiredFieldValidationRecord): readonly CandidateSchemaFailureReason[] {
  const missingMap: Record<string, CandidateSchemaFailureReason> = {
    source_system: "MISSING_SOURCE_SYSTEM",
    tenant_id: "MISSING_TENANT_ID",
    mission_id: "MISSING_MISSION_ID",
    decision_type: "MISSING_DECISION_TYPE",
    proposed_action: "MISSING_PROPOSED_ACTION",
    evidence_refs: "MISSING_EVIDENCE_REFS",
    replay_refs: "MISSING_REPLAY_REFS",
  };
  return Object.freeze([...record.missing_fields.map((field) => missingMap[field] ?? "EMPTY_REQUIRED_FIELD"), ...(record.empty_fields.length ? ["EMPTY_REQUIRED_FIELD" as const] : [])]);
}

function identifierFailures(payload: Record<string, unknown>): readonly CandidateSchemaFailureReason[] {
  const identifiers = [payload.source_system, payload.tenant_id, payload.mission_id, payload.candidate_id, payload.source_record_ref ?? payload.source_record_id].filter((item) => item !== undefined);
  return Object.freeze([
    ...(identifiers.some((item) => typeof item !== "string" || item.length === 0) ? ["MALFORMED_IDENTIFIER" as const] : []),
    ...(identifiers.some((item) => typeof item === "string" && !idValid(item)) ? ["NON_CANONICAL_IDENTIFIER" as const] : []),
    ...(identifiers.some((item) => typeof item === "string" && /random|uuid|timestamp/i.test(item)) ? ["UNSTABLE_IDENTIFIER" as const] : []),
  ]);
}

function referenceRecord(request: SchemaValidationRequest): ReferenceValidationRecord {
  const payload = isRecord(request.raw_candidate_payload) ? request.raw_candidate_payload : {};
  const evidence = refs(payload.evidence_refs);
  const replay = refs(payload.replay_refs);
  const invalid_refs = Object.freeze([...evidence, ...replay].filter((ref) => !idValid(ref)));
  const duplicate_refs = duplicateRefs([...evidence, ...replay]);
  const nondeterministic = !deterministicOrder(evidence) || !deterministicOrder(replay);
  const base: Omit<ReferenceValidationRecord, "integrity_hash"> = {
    record_id: `references_${request.validation_id}`,
    validation_id: request.validation_id,
    evidence_refs_status: evidence.length && evidence.every(idValid) ? "PASS" : "FAIL",
    replay_refs_status: replay.length && replay.every(idValid) ? "PASS" : "FAIL",
    invalid_refs,
    duplicate_refs: Object.freeze([...duplicate_refs, ...(nondeterministic ? ["REFERENCE_ORDER_NONDETERMINISTIC"] : [])]),
    result: evidence.length && replay.length && invalid_refs.length === 0 && duplicate_refs.length === 0 && !nondeterministic ? "PASS" : "FAIL",
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function referenceFailures(record: ReferenceValidationRecord): readonly CandidateSchemaFailureReason[] {
  return Object.freeze([
    ...(record.evidence_refs_status === "FAIL" ? ["INVALID_EVIDENCE_REF" as const] : []),
    ...(record.replay_refs_status === "FAIL" ? ["INVALID_REPLAY_REF" as const] : []),
    ...(record.invalid_refs.length ? ["INVALID_EVIDENCE_REF" as const] : []),
    ...(record.duplicate_refs.some((ref) => ref === "REFERENCE_ORDER_NONDETERMINISTIC") ? ["REFERENCE_ORDER_NONDETERMINISTIC" as const] : []),
    ...(record.duplicate_refs.some((ref) => ref !== "REFERENCE_ORDER_NONDETERMINISTIC") ? ["DUPLICATE_REFERENCE" as const] : []),
  ]);
}

function lineageRecord(request: SchemaValidationRequest): LineageValidationRecord {
  const payload = isRecord(request.raw_candidate_payload) ? request.raw_candidate_payload : {};
  const lineageRefs = refs(payload.lineage_refs);
  const sourceRecord = payload.source_record_ref ?? payload.source_record_id;
  const missing_lineage_refs = Object.freeze([
    ...(!sourceRecord ? ["source_record_ref"] : []),
    ...(refs(payload.evidence_refs).length === 0 ? ["evidence_refs"] : []),
    ...(refs(payload.replay_refs).length === 0 ? ["replay_refs"] : []),
    ...(lineageRefs.length === 0 ? ["lineage_refs"] : []),
  ]);
  const base: Omit<LineageValidationRecord, "integrity_hash"> = {
    record_id: `lineage_${request.validation_id}`,
    validation_id: request.validation_id,
    source_lineage_status: sourceRecord ? "PASS" : "FAIL",
    evidence_lineage_status: refs(payload.evidence_refs).length ? "PASS" : "FAIL",
    replay_lineage_status: refs(payload.replay_refs).length && lineageRefs.length ? "PASS" : "FAIL",
    missing_lineage_refs,
    result: missing_lineage_refs.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function lineageFailures(record: LineageValidationRecord): readonly CandidateSchemaFailureReason[] {
  return Object.freeze([
    ...(record.result === "FAIL" ? ["INCOMPLETE_LINEAGE" as const] : []),
    ...(record.missing_lineage_refs.includes("source_record_ref") ? ["MISSING_SOURCE_RECORD" as const, "ORPHANED_CANDIDATE" as const] : []),
    ...(record.missing_lineage_refs.includes("replay_refs") ? ["MISSING_REPLAY_PATH" as const] : []),
    ...(record.missing_lineage_refs.includes("evidence_refs") ? ["BROKEN_EVIDENCE_CHAIN" as const] : []),
  ]);
}

function serializationFailures(payload: unknown): readonly CandidateSchemaFailureReason[] {
  try {
    serializeDecisionCanonically(payload);
    const serialized = JSON.stringify(payload);
    return Object.freeze([
      ...(serialized.includes("Date.now") || serialized.includes("Math.random") ? ["NONDETERMINISTIC_FIELD" as const] : []),
    ]);
  } catch {
    return Object.freeze(["UNSERIALIZABLE_VALUE"] as const);
  }
}

function stateFor(failures: readonly CandidateSchemaFailureReason[]): CandidateSchemaValidationState {
  if (failures.some((failure) => ["MALFORMED_OBJECT", "UNSUPPORTED_ROOT_STRUCTURE", "INVALID_NESTED_STRUCTURE", "UNSUPPORTED_FIELD_TYPE", "HIDDEN_EXECUTABLE_LOGIC"].includes(failure))) return "FAILED_STRUCTURE";
  if (failures.some((failure) => REQUIRED_FAILURES.has(failure))) return "FAILED_REQUIRED_FIELDS";
  if (failures.some((failure) => ["MALFORMED_IDENTIFIER", "NON_CANONICAL_IDENTIFIER", "UNSTABLE_IDENTIFIER"].includes(failure))) return "FAILED_IDENTIFIERS";
  if (failures.some((failure) => ["INVALID_EVIDENCE_REF", "INVALID_REPLAY_REF", "DUPLICATE_REFERENCE", "REFERENCE_ORDER_NONDETERMINISTIC"].includes(failure))) return "FAILED_REFERENCES";
  if (failures.some((failure) => ["INCOMPLETE_LINEAGE", "ORPHANED_CANDIDATE", "MISSING_SOURCE_RECORD", "MISSING_REPLAY_PATH", "BROKEN_EVIDENCE_CHAIN"].includes(failure))) return "FAILED_LINEAGE";
  if (failures.some((failure) => ["NON_CANONICAL_PAYLOAD", "NONDETERMINISTIC_FIELD", "UNSERIALIZABLE_VALUE"].includes(failure))) return "FAILED_SERIALIZATION";
  return "PASSED";
}

function audit(validation_id: string, stage: CandidateSchemaValidationState, ok: boolean): CandidateSchemaAuditRecord {
  const base: Omit<CandidateSchemaAuditRecord, "integrity_hash"> = {
    audit_id: `audit_${validation_id}_${stage.toLowerCase()}`,
    validation_id,
    validation_stage: stage,
    validation_result: ok ? "PASS" : "FAIL",
    replay_ref: `replay_${validation_id}_${stage.toLowerCase()}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function resultHash(result: Omit<SchemaValidationResult, "integrity_hash"> | SchemaValidationResult): string {
  const copy = { ...(result as SchemaValidationResult) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function validateDecisionCandidateSchema(request: SchemaValidationRequest = createSchemaValidationRequest()): SchemaValidationResult {
  const payload = request.raw_candidate_payload;
  const required_field_record = requiredFieldRecord(request);
  const reference_record = referenceRecord(request);
  const lineage_record = lineageRecord(request);
  const structure = structureFailures(payload);
  const required = requiredFailures(required_field_record);
  const identifiers = isRecord(payload) ? identifierFailures(payload) : Object.freeze([] as CandidateSchemaFailureReason[]);
  const references = referenceFailures(reference_record);
  const lineage = lineageFailures(lineage_record);
  const serialization = serializationFailures(payload);
  const failure_reasons = Object.freeze([...new Set([...structure, ...required, ...identifiers, ...references, ...lineage, ...serialization])]);
  const validation_state = stateFor(failure_reasons);
  const passed = failure_reasons.length === 0;
  const base: Omit<SchemaValidationResult, "integrity_hash"> = {
    validation_id: request.validation_id,
    intake_id: request.intake_id,
    validation_status: passed ? "PASS" : "FAIL",
    validation_state,
    failure_reason: failure_reasons[0],
    failure_reasons,
    missing_fields: required_field_record.missing_fields,
    malformed_fields: Object.freeze([...new Set([...required_field_record.empty_fields, ...(identifiers.length ? ["identifiers"] : []), ...(structure.length ? ["payload"] : [])])]),
    invalid_references: Object.freeze([...reference_record.invalid_refs, ...reference_record.duplicate_refs]),
    lineage_status: lineage_record.result === "PASS" ? "COMPLETE" : "INCOMPLETE",
    schema_version: request.schema_version,
    replay_ref: `replay_schema_validation_${request.validation_id}`,
    required_field_record,
    reference_record,
    lineage_record,
    audit_records: passed ? Object.freeze(VALIDATION_ORDER.map((stage) => audit(request.validation_id, stage, true))) : Object.freeze(["PENDING", validation_state].map((stage, index) => audit(request.validation_id, stage as CandidateSchemaValidationState, index === 0))),
    downstream_allowed: passed,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function schemaValidationRequestFromIntake(intakeRequest: DecisionIntakeRequest = createDecisionIntakeRequest()): SchemaValidationRequest {
  return createSchemaValidationRequest({
    validation_id: `schema_validation_${intakeRequest.request_id}`,
    intake_id: `intake_${intakeRequest.request_id}`,
    source_system: intakeRequest.source_system,
    tenant_id: intakeRequest.tenant_id,
    mission_id: intakeRequest.mission_id,
    raw_candidate_payload: Object.freeze({
      ...intakeRequest.candidate_payload,
      source_system: intakeRequest.source_system,
      source_record_ref: intakeRequest.candidate_payload.source_record_id,
    }),
  });
}

function toIntakeFailures(failures: readonly CandidateSchemaFailureReason[]): readonly DecisionIntakeFailureReason[] {
  const mapped = failures.map((failure): DecisionIntakeFailureReason => {
    if (failure.includes("SOURCE_SYSTEM")) return "UNKNOWN_SUBSYSTEM";
    if (failure.includes("TENANT")) return "UNKNOWN_TENANT";
    if (failure.includes("MISSION")) return "UNKNOWN_MISSION";
    if (failure.includes("DECISION_TYPE")) return "MISSING_DECISION_TYPE";
    if (failure.includes("PROPOSED_ACTION")) return "MISSING_PROPOSED_ACTION";
    if (failure.includes("EVIDENCE")) return "MISSING_EVIDENCE_REFERENCES";
    if (failure.includes("REPLAY")) return "MISSING_REPLAY_REFERENCES";
    if (failure.includes("LINEAGE") || failure.includes("SOURCE_RECORD") || failure.includes("ORPHANED")) return "LINEAGE_INCONSISTENCY";
    return "MISSING_IDENTIFIER";
  });
  return Object.freeze([...new Set(mapped)]);
}

export function validateSchemaForIntake(intakeRequest: DecisionIntakeRequest = createDecisionIntakeRequest()): CandidateSchemaIntakeBridge {
  const schema_validation = validateDecisionCandidateSchema(schemaValidationRequestFromIntake(intakeRequest));
  return Object.freeze({
    schema_validation,
    intake_failure_reasons: toIntakeFailures(schema_validation.failure_reasons),
    intake_allowed: schema_validation.downstream_allowed,
  });
}

export function replaySchemaValidation(result: SchemaValidationResult): SchemaValidationReplayResult {
  const reconstructed_hash = resultHash(result);
  const replay_valid = reconstructed_hash === result.integrity_hash;
  const base: Omit<SchemaValidationReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${result.validation_id}`,
    replay_valid,
    validation_id: result.validation_id,
    reconstructed_state: result.validation_state,
    reconstructed_hash,
    expected_hash: result.integrity_hash,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["NON_CANONICAL_PAYLOAD"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

export function buildCandidateSchemaObservability(results: readonly SchemaValidationResult[]): CandidateSchemaObservability {
  const failures = results.flatMap((result) => result.failure_reasons);
  return Object.freeze({
    schema_validation_attempts: results.length,
    schema_validation_passes: results.filter((result) => result.validation_status === "PASS").length,
    schema_validation_failures: results.filter((result) => result.validation_status === "FAIL").length,
    missing_field_failures: failures.filter((failure) => failure.startsWith("MISSING_") || failure === "EMPTY_REQUIRED_FIELD").length,
    malformed_object_failures: failures.filter((failure) => ["MALFORMED_OBJECT", "UNSUPPORTED_ROOT_STRUCTURE", "INVALID_NESTED_STRUCTURE", "UNSUPPORTED_FIELD_TYPE", "HIDDEN_EXECUTABLE_LOGIC"].includes(failure)).length,
    invalid_reference_failures: failures.filter((failure) => ["INVALID_EVIDENCE_REF", "INVALID_REPLAY_REF", "DUPLICATE_REFERENCE", "REFERENCE_ORDER_NONDETERMINISTIC"].includes(failure)).length,
    incomplete_lineage_failures: failures.filter((failure) => ["INCOMPLETE_LINEAGE", "ORPHANED_CANDIDATE", "MISSING_SOURCE_RECORD", "MISSING_REPLAY_PATH", "BROKEN_EVIDENCE_CHAIN"].includes(failure)).length,
    serialization_failures: failures.filter((failure) => ["NON_CANONICAL_PAYLOAD", "NONDETERMINISTIC_FIELD", "UNSERIALIZABLE_VALUE"].includes(failure)).length,
  });
}

export function getDecisionCandidateSchemaValidationEngine() {
  const request = createSchemaValidationRequest();
  const validation = validateDecisionCandidateSchema(request);
  return Object.freeze({
    required_fields: REQUIRED_FIELDS,
    validation_order: VALIDATION_ORDER,
    request,
    validation,
    intake_bridge: validateSchemaForIntake(),
    replay: replaySchemaValidation(validation),
    observability: buildCandidateSchemaObservability([validation]),
  });
}
