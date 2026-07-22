import crypto from "crypto";
import type {
  DecisionInput,
  DecisionMetadata,
  DecisionOrchestrationRecord,
  DecisionOutput,
  DecisionPriority,
  DecisionReference,
  DecisionReferenceType,
  DecisionSchemaFailure,
  DecisionSchemaFailureReason,
  DecisionSchemaObservabilityMetrics,
  DecisionSchemaValidationResult,
  DecisionState,
  DecisionType,
  ValidationStatus,
} from "@/types/decision-schema";

const NOW = "2026-07-02T09:12:00.000Z";
const SCHEMA_VERSION = "1.0.0" as const;
const CONTRACT_VERSION = "1.0.0" as const;

export const DECISION_SCHEMA_TYPES = Object.freeze(["PLAN_SELECTION", "RECOMMENDATION_SELECTION", "RISK_RESPONSE", "RECOVERY_OPTION", "GOVERNANCE_ESCALATION", "POLICY_CONFLICT", "MISSION_HEALTH_ACTION", "FORECAST_RESPONSE", "OPERATOR_INTERVENTION", "CERTIFICATION_DECISION", "CONTINUATION_DECISION", "DEFERRAL_DECISION"] as const);
export const DECISION_SCHEMA_PRIORITIES = Object.freeze(["LOW", "NORMAL", "HIGH", "CRITICAL", "BLOCKING"] as const);
export const DECISION_STATES = Object.freeze(["CREATED", "VALIDATING", "EVIDENCE_READY", "GOVERNANCE_REVIEW", "CONSTITUTION_REVIEW", "AUTHORITY_VALIDATION", "READY_FOR_ORCHESTRATION", "ORCHESTRATED", "OPERATOR_VISIBLE", "APPROVED", "REJECTED", "DEFERRED", "ARCHIVED", "FAILED"] as const);
export const VALIDATION_STATUSES = Object.freeze(["UNVALIDATED", "VALID", "INVALID", "CONDITIONAL_VALID", "FAILED_CLOSED"] as const);
export const DECISION_REFERENCE_TYPES = Object.freeze(["INPUT", "EVIDENCE", "RISK", "CONFIDENCE", "GOVERNANCE", "CONSTITUTIONAL", "REPLAY", "LINEAGE", "RECOMMENDATION", "PLAN", "RECOVERY", "FORECAST", "MISSION_HEALTH", "CERTIFICATION", "OPERATOR_ACTION"] as const);

const INPUT_REQUIRED_FIELDS = Object.freeze(["orchestration_id", "tenant_id", "mission_id", "decision_subject", "decision_type", "decision_source", "decision_priority", "input_refs", "evidence_refs", "governance_refs", "constitutional_refs", "replay_refs", "lineage_refs", "metadata", "created_at", "integrity_hash"] as const);
const OUTPUT_REQUIRED_FIELDS = Object.freeze(["orchestration_id", "tenant_id", "mission_id", "decision_state", "rejected_option_refs", "deferred_option_refs", "decision_rationale_ref", "explanation_ref", "governance_result_ref", "constitutional_result_ref", "operator_action_required", "operator_approval_required", "advisory_only", "replay_refs", "lineage_refs", "integrity_hash"] as const);
const METADATA_REQUIRED_FIELDS = Object.freeze(["contract_version", "schema_version", "schema_name", "tenant_scope", "mission_scope", "source_component", "source_phase", "lifecycle_state", "validation_status", "created_by", "created_at", "deterministic_serialization_version", "integrity_algorithm"] as const);
const REFERENCE_REQUIRED_FIELDS = Object.freeze(["ref_id", "ref_type", "ref_source", "tenant_id", "mission_id", "created_at"] as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function failure(reason: DecisionSchemaFailureReason, field_path: string, message: string): DecisionSchemaFailure {
  return Object.freeze({ reason, field_path, message, fail_closed: true });
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(Number(value.toFixed(10))) : "null";
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizedTimestamp(value: unknown): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
}

function sortReferences<T extends DecisionReference>(refs: readonly T[]): readonly T[] {
  return Object.freeze([...refs].sort((a, b) => `${a.ref_type}:${a.ref_id}`.localeCompare(`${b.ref_type}:${b.ref_id}`)));
}

function referencesDeterministic(refs: readonly DecisionReference[] | undefined): boolean {
  if (!refs) return true;
  return refs.every((ref, index) => sortReferences(refs)[index]?.ref_id === ref.ref_id && sortReferences(refs)[index]?.ref_type === ref.ref_type);
}

function withoutIntegrity<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  const copy = { ...payload };
  delete copy.integrity_hash;
  return copy;
}

export function serializeDecisionSchemaDeterministically(payload: unknown): string {
  return canonicalize(isRecord(payload) ? withoutIntegrity(payload) : payload);
}

export function hashDecisionSchemaPayload(payload: unknown): string {
  return sha256(serializeDecisionSchemaDeterministically(payload));
}

function makeReference(ref_type: DecisionReferenceType, tenant_id: string, mission_id: string, suffix: string): DecisionReference {
  const withoutHash = {
    ref_id: `${ref_type.toLowerCase()}_${tenant_id}_${mission_id}_${suffix}`,
    ref_type,
    ref_source: `phase_9_1_2_${ref_type.toLowerCase()}`,
    tenant_id,
    mission_id,
    created_at: NOW,
  };
  return Object.freeze({ ...withoutHash, integrity_hash: sha256(canonicalize(withoutHash)) });
}

export function createDecisionMetadata(overrides: Partial<DecisionMetadata> = {}): DecisionMetadata {
  return Object.freeze({
    contract_version: overrides.contract_version ?? CONTRACT_VERSION,
    schema_version: overrides.schema_version ?? SCHEMA_VERSION,
    schema_name: overrides.schema_name ?? "decision.input",
    tenant_scope: overrides.tenant_scope ?? "tenant_alpha",
    mission_scope: overrides.mission_scope ?? "mission_phase_9_decision_orchestration",
    source_component: overrides.source_component ?? "decision-schema-definitions",
    source_phase: overrides.source_phase ?? "9.1.2",
    lifecycle_state: overrides.lifecycle_state ?? "CREATED",
    validation_status: overrides.validation_status ?? "UNVALIDATED",
    created_by: overrides.created_by ?? "system:phase-9-1-2",
    created_at: overrides.created_at ?? NOW,
    updated_at: overrides.updated_at,
    deterministic_serialization_version: overrides.deterministic_serialization_version ?? "decision-schema-canonical-json/v1",
    integrity_algorithm: overrides.integrity_algorithm ?? "SHA-256",
    extension_namespace: overrides.extension_namespace,
  });
}

export function createDecisionInput(overrides: Partial<DecisionInput> = {}): DecisionInput {
  const tenant_id = overrides.tenant_id ?? "tenant_alpha";
  const mission_id = overrides.mission_id ?? "mission_phase_9_decision_orchestration";
  const withoutHash: Omit<DecisionInput, "integrity_hash"> = {
    orchestration_id: overrides.orchestration_id ?? `orch_${tenant_id}_${mission_id}_schema_001`,
    tenant_id,
    mission_id,
    operator_id: overrides.operator_id,
    decision_subject: overrides.decision_subject ?? "Select the certified recommendation for operator-visible orchestration.",
    decision_type: overrides.decision_type ?? "RECOMMENDATION_SELECTION",
    decision_source: overrides.decision_source ?? "DECISION_INTAKE",
    decision_priority: overrides.decision_priority ?? "HIGH",
    input_refs: overrides.input_refs ?? sortReferences([makeReference("INPUT", tenant_id, mission_id, "001")]),
    evidence_refs: overrides.evidence_refs ?? sortReferences([makeReference("EVIDENCE", tenant_id, mission_id, "001")]),
    risk_refs: overrides.risk_refs,
    confidence_refs: overrides.confidence_refs,
    governance_refs: overrides.governance_refs ?? sortReferences([makeReference("GOVERNANCE", tenant_id, mission_id, "001")]),
    constitutional_refs: overrides.constitutional_refs ?? sortReferences([makeReference("CONSTITUTIONAL", tenant_id, mission_id, "001")]),
    replay_refs: overrides.replay_refs ?? sortReferences([makeReference("REPLAY", tenant_id, mission_id, "001")]),
    lineage_refs: overrides.lineage_refs ?? sortReferences([makeReference("LINEAGE", tenant_id, mission_id, "001")]),
    advisory_notes: overrides.advisory_notes ?? Object.freeze(["Schema payload is advisory-only and cannot execute action."]),
    simulation_refs: overrides.simulation_refs,
    forecast_refs: overrides.forecast_refs,
    recovery_refs: overrides.recovery_refs,
    certification_refs: overrides.certification_refs,
    metadata: overrides.metadata ?? createDecisionMetadata({ tenant_scope: tenant_id, mission_scope: mission_id }),
    created_at: overrides.created_at ?? NOW,
  };
  return Object.freeze({ ...withoutHash, integrity_hash: overrides.integrity_hash ?? hashDecisionSchemaPayload(withoutHash) });
}

export function createDecisionOutput(overrides: Partial<DecisionOutput> = {}): DecisionOutput {
  const tenant_id = overrides.tenant_id ?? "tenant_alpha";
  const mission_id = overrides.mission_id ?? "mission_phase_9_decision_orchestration";
  const selected = overrides.selected_option_ref ?? makeReference("RECOMMENDATION", tenant_id, mission_id, "selected");
  const withoutHash: Omit<DecisionOutput, "integrity_hash"> = {
    orchestration_id: overrides.orchestration_id ?? `orch_${tenant_id}_${mission_id}_schema_001`,
    tenant_id,
    mission_id,
    decision_state: overrides.decision_state ?? "ORCHESTRATED",
    selected_option_ref: selected,
    rejected_option_refs: overrides.rejected_option_refs ?? sortReferences([makeReference("PLAN", tenant_id, mission_id, "rejected")]),
    deferred_option_refs: overrides.deferred_option_refs ?? sortReferences([]),
    decision_rationale_ref: overrides.decision_rationale_ref ?? makeReference("EVIDENCE", tenant_id, mission_id, "rationale"),
    explanation_ref: overrides.explanation_ref ?? makeReference("EVIDENCE", tenant_id, mission_id, "explanation"),
    governance_result_ref: overrides.governance_result_ref ?? makeReference("GOVERNANCE", tenant_id, mission_id, "result"),
    constitutional_result_ref: overrides.constitutional_result_ref ?? makeReference("CONSTITUTIONAL", tenant_id, mission_id, "result"),
    risk_result_ref: overrides.risk_result_ref,
    confidence_result_ref: overrides.confidence_result_ref,
    operator_action_required: overrides.operator_action_required ?? true,
    operator_approval_required: overrides.operator_approval_required ?? true,
    advisory_only: overrides.advisory_only ?? true,
    replay_refs: overrides.replay_refs ?? sortReferences([makeReference("REPLAY", tenant_id, mission_id, "output")]),
    lineage_refs: overrides.lineage_refs ?? sortReferences([makeReference("LINEAGE", tenant_id, mission_id, "output")]),
    completed_at: overrides.completed_at,
  };
  return Object.freeze({ ...withoutHash, integrity_hash: overrides.integrity_hash ?? hashDecisionSchemaPayload(withoutHash) });
}

export function createDecisionOrchestrationRecord(overrides: Partial<DecisionOrchestrationRecord> = {}): DecisionOrchestrationRecord {
  const input = overrides.input ?? createDecisionInput();
  const output = overrides.output;
  const metadata = overrides.metadata ?? createDecisionMetadata({ schema_name: "decision.orchestration.record", tenant_scope: input.tenant_id, mission_scope: input.mission_id });
  const references = overrides.references ?? sortReferences([...input.input_refs, ...input.evidence_refs, ...input.governance_refs, ...input.constitutional_refs, ...input.replay_refs, ...input.lineage_refs]);
  const withoutHash: Omit<DecisionOrchestrationRecord, "integrity_hash"> = {
    record_id: overrides.record_id ?? `decision_record_${input.tenant_id}_${input.mission_id}_001`,
    contract_version: overrides.contract_version ?? CONTRACT_VERSION,
    schema_version: overrides.schema_version ?? SCHEMA_VERSION,
    input,
    output,
    metadata,
    references,
  };
  return Object.freeze({ ...withoutHash, integrity_hash: overrides.integrity_hash ?? hashDecisionSchemaPayload(withoutHash) });
}

function validateRequired(payload: Record<string, unknown>, fields: readonly string[]): DecisionSchemaFailure[] {
  return fields.flatMap((field) => payload[field] === undefined || payload[field] === "" ? [failure("REQUIRED_FIELD_MISSING", field, `${field} is required.`)] : []);
}

function validateReferenceArray(refs: unknown, fieldPath: string, expectedType: DecisionReferenceType | null, tenant_id: string | undefined, mission_id: string | undefined): DecisionSchemaFailure[] {
  if (!Array.isArray(refs) || refs.length === 0) return [failure("REFERENCE_MISSING", fieldPath, `${fieldPath} requires at least one reference.`)];
  const errors = refs.flatMap((ref, index) => validateDecisionReferenceSchema(ref, { expected_type: expectedType, tenant_id, mission_id, field_path: `${fieldPath}[${index}]` }).errors);
  if (!referencesDeterministic(refs as DecisionReference[])) errors.push(failure("REFERENCE_ORDER_NONDETERMINISTIC", fieldPath, "References must be sorted by ref_type and ref_id."));
  return errors;
}

export function validateDecisionReferenceSchema(payload: unknown, options: { expected_type?: DecisionReferenceType | null; tenant_id?: string; mission_id?: string; field_path?: string } = {}): DecisionSchemaValidationResult {
  const errors: DecisionSchemaFailure[] = [];
  if (!isRecord(payload)) errors.push(failure("SCHEMA_PAYLOAD_MISSING", options.field_path ?? "$", "Decision reference payload is required."));
  else {
    errors.push(...validateRequired(payload, REFERENCE_REQUIRED_FIELDS));
    if (!DECISION_REFERENCE_TYPES.includes(payload.ref_type as DecisionReferenceType)) errors.push(failure("UNSUPPORTED_ENUM", `${options.field_path ?? "$"}.ref_type`, "Reference type is not supported."));
    if (options.expected_type && payload.ref_type !== options.expected_type) errors.push(failure("REFERENCE_TYPE_MISMATCH", options.field_path ?? "$", `Reference must be ${options.expected_type}.`));
    if (typeof payload.ref_id !== "string" || typeof payload.ref_source !== "string") errors.push(failure("REFERENCE_MALFORMED", options.field_path ?? "$", "Reference id and source must be strings."));
    if (options.tenant_id && payload.tenant_id !== options.tenant_id) errors.push(failure("TENANT_SCOPE_VIOLATION", `${options.field_path ?? "$"}.tenant_id`, "Reference tenant must match record tenant."));
    if (options.mission_id && payload.mission_id !== options.mission_id) errors.push(failure("MISSION_SCOPE_VIOLATION", `${options.field_path ?? "$"}.mission_id`, "Reference mission must match record mission."));
    if (!normalizedTimestamp(payload.created_at)) errors.push(failure("TIMESTAMP_NOT_NORMALIZED", `${options.field_path ?? "$"}.created_at`, "Reference timestamp must be normalized UTC ISO-8601 with milliseconds."));
  }
  return result("decision.reference", errors);
}

export function validateDecisionMetadataSchema(payload: unknown): DecisionSchemaValidationResult {
  const errors: DecisionSchemaFailure[] = [];
  if (!isRecord(payload)) errors.push(failure("SCHEMA_PAYLOAD_MISSING", "$", "Decision metadata payload is required."));
  else {
    errors.push(...validateRequired(payload, METADATA_REQUIRED_FIELDS));
    if (payload.contract_version !== CONTRACT_VERSION || payload.schema_version !== SCHEMA_VERSION || payload.source_phase !== "9.1.2") errors.push(failure("METADATA_MALFORMED", "$", "Metadata version and source phase must match Phase 9.1.2."));
    if (!DECISION_STATES.includes(payload.lifecycle_state as DecisionState) || !VALIDATION_STATUSES.includes(payload.validation_status as ValidationStatus)) errors.push(failure("UNSUPPORTED_ENUM", "$", "Metadata lifecycle or validation status enum is unsupported."));
    if (payload.integrity_algorithm !== "SHA-256" || payload.deterministic_serialization_version !== "decision-schema-canonical-json/v1") errors.push(failure("METADATA_MALFORMED", "$", "Metadata must use canonical serialization v1 and SHA-256."));
    if (!normalizedTimestamp(payload.created_at) || (payload.updated_at !== undefined && !normalizedTimestamp(payload.updated_at))) errors.push(failure("TIMESTAMP_NOT_NORMALIZED", "$", "Metadata timestamps must be normalized."));
  }
  return result("decision.metadata", errors);
}

export function validateDecisionInputSchema(payload: unknown): DecisionSchemaValidationResult {
  const errors: DecisionSchemaFailure[] = [];
  if (!isRecord(payload)) errors.push(failure("SCHEMA_PAYLOAD_MISSING", "$", "Decision input payload is required."));
  else {
    errors.push(...validateRequired(payload, INPUT_REQUIRED_FIELDS));
    if (!DECISION_SCHEMA_TYPES.includes(payload.decision_type as DecisionType) || !DECISION_SCHEMA_PRIORITIES.includes(payload.decision_priority as DecisionPriority)) errors.push(failure("UNSUPPORTED_ENUM", "$", "Decision input enum is unsupported."));
    errors.push(...validateReferenceArray(payload.input_refs, "input_refs", "INPUT", payload.tenant_id as string, payload.mission_id as string));
    errors.push(...validateReferenceArray(payload.evidence_refs, "evidence_refs", "EVIDENCE", payload.tenant_id as string, payload.mission_id as string));
    errors.push(...validateReferenceArray(payload.governance_refs, "governance_refs", "GOVERNANCE", payload.tenant_id as string, payload.mission_id as string));
    errors.push(...validateReferenceArray(payload.constitutional_refs, "constitutional_refs", "CONSTITUTIONAL", payload.tenant_id as string, payload.mission_id as string));
    errors.push(...validateReferenceArray(payload.replay_refs, "replay_refs", "REPLAY", payload.tenant_id as string, payload.mission_id as string));
    errors.push(...validateReferenceArray(payload.lineage_refs, "lineage_refs", "LINEAGE", payload.tenant_id as string, payload.mission_id as string));
    errors.push(...validateDecisionMetadataSchema(payload.metadata).errors);
    if (!normalizedTimestamp(payload.created_at)) errors.push(failure("TIMESTAMP_NOT_NORMALIZED", "created_at", "Input timestamp must be normalized."));
    if (typeof payload.integrity_hash === "string" && hashDecisionSchemaPayload(payload) !== payload.integrity_hash) errors.push(failure("INTEGRITY_HASH_MISMATCH", "integrity_hash", "Input integrity hash is not reproducible."));
  }
  return result("decision.input", errors);
}

export function validateDecisionOutputSchema(payload: unknown): DecisionSchemaValidationResult {
  const errors: DecisionSchemaFailure[] = [];
  if (!isRecord(payload)) errors.push(failure("SCHEMA_PAYLOAD_MISSING", "$", "Decision output payload is required."));
  else {
    errors.push(...validateRequired(payload, OUTPUT_REQUIRED_FIELDS));
    if (!DECISION_STATES.includes(payload.decision_state as DecisionState)) errors.push(failure("UNSUPPORTED_ENUM", "decision_state", "Decision state is unsupported."));
    if (!payload.selected_option_ref && (!Array.isArray(payload.rejected_option_refs) || payload.rejected_option_refs.length === 0) && (!Array.isArray(payload.deferred_option_refs) || payload.deferred_option_refs.length === 0)) errors.push(failure("OUTPUT_OPTION_REFERENCE_MISSING", "$", "Output must reference selected, rejected, or deferred options."));
    if (payload.advisory_only !== true) errors.push(failure("ADVISORY_ONLY_VIOLATION", "advisory_only", "Decision output must remain advisory-only."));
    errors.push(...validateDecisionReferenceSchema(payload.governance_result_ref, { expected_type: "GOVERNANCE", tenant_id: payload.tenant_id as string, mission_id: payload.mission_id as string, field_path: "governance_result_ref" }).errors);
    errors.push(...validateDecisionReferenceSchema(payload.constitutional_result_ref, { expected_type: "CONSTITUTIONAL", tenant_id: payload.tenant_id as string, mission_id: payload.mission_id as string, field_path: "constitutional_result_ref" }).errors);
    errors.push(...validateReferenceArray(payload.replay_refs, "replay_refs", "REPLAY", payload.tenant_id as string, payload.mission_id as string));
    errors.push(...validateReferenceArray(payload.lineage_refs, "lineage_refs", "LINEAGE", payload.tenant_id as string, payload.mission_id as string));
    if (typeof payload.integrity_hash === "string" && hashDecisionSchemaPayload(payload) !== payload.integrity_hash) errors.push(failure("INTEGRITY_HASH_MISMATCH", "integrity_hash", "Output integrity hash is not reproducible."));
  }
  return result("decision.output", errors);
}

export function validateDecisionOrchestrationRecordSchema(payload: unknown): DecisionSchemaValidationResult {
  const errors: DecisionSchemaFailure[] = [];
  if (!isRecord(payload)) errors.push(failure("SCHEMA_PAYLOAD_MISSING", "$", "Decision orchestration record payload is required."));
  else {
    errors.push(...validateDecisionInputSchema(payload.input).errors);
    if (payload.output !== undefined) errors.push(...validateDecisionOutputSchema(payload.output).errors);
    errors.push(...validateDecisionMetadataSchema(payload.metadata).errors);
    errors.push(...validateReferenceArray(payload.references, "references", null, isRecord(payload.input) ? payload.input.tenant_id as string : undefined, isRecord(payload.input) ? payload.input.mission_id as string : undefined));
    if (typeof payload.integrity_hash === "string" && hashDecisionSchemaPayload(payload) !== payload.integrity_hash) errors.push(failure("INTEGRITY_HASH_MISMATCH", "integrity_hash", "Record integrity hash is not reproducible."));
  }
  return result("decision.orchestration.record", errors);
}

function result(schema_name: string, errors: readonly DecisionSchemaFailure[]): DecisionSchemaValidationResult {
  const has = (reason: DecisionSchemaFailureReason) => errors.some((error) => error.reason === reason);
  return Object.freeze({
    schema_name,
    validation_status: errors.length ? "FAILED_CLOSED" : "VALID",
    errors,
    checks: Object.freeze({
      required_fields_present: !has("REQUIRED_FIELD_MISSING") && !has("SCHEMA_PAYLOAD_MISSING"),
      types_valid: !has("TYPE_MISMATCH") && !has("REFERENCE_MALFORMED") && !has("METADATA_MALFORMED"),
      enums_valid: !has("UNSUPPORTED_ENUM"),
      references_well_formed: !has("REFERENCE_MISSING") && !has("REFERENCE_MALFORMED") && !has("REFERENCE_TYPE_MISMATCH"),
      tenant_isolated: !has("TENANT_SCOPE_VIOLATION"),
      mission_scoped: !has("MISSION_SCOPE_VIOLATION"),
      governance_present: !has("GOVERNANCE_REFERENCE_MISSING") && !errors.some((error) => error.field_path.includes("governance") && error.reason === "REFERENCE_MISSING"),
      constitutional_present: !has("CONSTITUTIONAL_REFERENCE_MISSING") && !errors.some((error) => error.field_path.includes("constitutional") && error.reason === "REFERENCE_MISSING"),
      replay_present: !has("REPLAY_REFERENCE_MISSING") && !errors.some((error) => error.field_path.includes("replay") && error.reason === "REFERENCE_MISSING"),
      lineage_present: !has("LINEAGE_REFERENCE_MISSING") && !errors.some((error) => error.field_path.includes("lineage") && error.reason === "REFERENCE_MISSING"),
      deterministic_serialization_valid: !has("REFERENCE_ORDER_NONDETERMINISTIC"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      advisory_only_enforced: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

export function assertDecisionInputType(payload: unknown): asserts payload is DecisionInput {
  const validation = validateDecisionInputSchema(payload);
  if (validation.validation_status !== "VALID") throw new TypeError(validation.errors.map((error) => error.reason).join(", "));
}

export function assertDecisionOutputType(payload: unknown): asserts payload is DecisionOutput {
  const validation = validateDecisionOutputSchema(payload);
  if (validation.validation_status !== "VALID") throw new TypeError(validation.errors.map((error) => error.reason).join(", "));
}

export function assertDecisionReferenceType(payload: unknown): asserts payload is DecisionReference {
  const validation = validateDecisionReferenceSchema(payload);
  if (validation.validation_status !== "VALID") throw new TypeError(validation.errors.map((error) => error.reason).join(", "));
}

export function assertDecisionMetadataType(payload: unknown): asserts payload is DecisionMetadata {
  const validation = validateDecisionMetadataSchema(payload);
  if (validation.validation_status !== "VALID") throw new TypeError(validation.errors.map((error) => error.reason).join(", "));
}

export function buildDecisionSchemaObservabilityMetrics(validations: readonly DecisionSchemaValidationResult[]): DecisionSchemaObservabilityMetrics {
  const errors = validations.flatMap((validation) => validation.errors);
  return Object.freeze({
    schema_validation_count: validations.length,
    schema_validation_failures: validations.filter((validation) => validation.validation_status !== "VALID").length,
    failed_field_names: Object.freeze([...new Set(errors.map((error) => error.field_path))]),
    failed_reference_types: Object.freeze([...new Set(errors.filter((error) => error.reason.includes("REFERENCE")).map((error) => error.field_path.split("_")[0].toUpperCase()).filter((type): type is DecisionReferenceType => DECISION_REFERENCE_TYPES.includes(type as DecisionReferenceType)))]),
    type_safety_failures: errors.filter((error) => ["TYPE_MISMATCH", "REFERENCE_MALFORMED", "METADATA_MALFORMED"].includes(error.reason)).length,
    serialization_mismatch_count: errors.filter((error) => error.reason === "REFERENCE_ORDER_NONDETERMINISTIC").length,
    hash_mismatch_count: errors.filter((error) => error.reason === "INTEGRITY_HASH_MISMATCH").length,
    unsupported_enum_count: errors.filter((error) => error.reason === "UNSUPPORTED_ENUM").length,
    cross_tenant_reference_rejection_count: errors.filter((error) => error.reason === "TENANT_SCOPE_VIOLATION").length,
  });
}

export const DECISION_JSON_SCHEMA_REGISTRY = Object.freeze({
  "decision.input.schema.json": Object.freeze({ $id: "decision.input.schema.json", required: INPUT_REQUIRED_FIELDS, enum_fields: Object.freeze({ decision_type: DECISION_SCHEMA_TYPES, decision_priority: DECISION_SCHEMA_PRIORITIES }) }),
  "decision.output.schema.json": Object.freeze({ $id: "decision.output.schema.json", required: OUTPUT_REQUIRED_FIELDS, enum_fields: Object.freeze({ decision_state: DECISION_STATES }) }),
  "decision.metadata.schema.json": Object.freeze({ $id: "decision.metadata.schema.json", required: METADATA_REQUIRED_FIELDS, enum_fields: Object.freeze({ lifecycle_state: DECISION_STATES, validation_status: VALIDATION_STATUSES }) }),
  "decision.reference.schema.json": Object.freeze({ $id: "decision.reference.schema.json", required: REFERENCE_REQUIRED_FIELDS, enum_fields: Object.freeze({ ref_type: DECISION_REFERENCE_TYPES }) }),
  "decision.enums.schema.json": Object.freeze({ $id: "decision.enums.schema.json", decision_types: DECISION_SCHEMA_TYPES, decision_priorities: DECISION_SCHEMA_PRIORITIES, decision_states: DECISION_STATES, validation_statuses: VALIDATION_STATUSES, reference_types: DECISION_REFERENCE_TYPES }),
  "decision.orchestration.record.schema.json": Object.freeze({ $id: "decision.orchestration.record.schema.json", required: Object.freeze(["record_id", "contract_version", "schema_version", "input", "metadata", "references", "integrity_hash"] as const) }),
});
