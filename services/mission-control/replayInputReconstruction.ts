import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  createDefaultTruthReplayContractFixture,
  hashTruthReplayContract,
  validateTruthReplayContract,
} from "./replayContract";
import type {
  ReconstructedAuthorityInput,
  ReconstructedEvent,
  ReconstructedEvidenceInput,
  ReconstructedGovernanceInput,
  ReconstructedLineageInput,
  ReconstructedTruthRecord,
  TruthReplayContractType,
  TruthReplayInputAuditEventName,
  TruthReplayInputBundle,
  TruthReplayInputBundleStorageRecord,
  TruthReplayInputCertificationState,
  TruthReplayInputCompletenessReport,
  TruthReplayInputFailureCode,
  TruthReplayInputFailureReason,
  TruthReplayInputHashSet,
  TruthReplayInputIntegrityReport,
  TruthReplayInputManifest,
  TruthReplayInputReconstructionRequest,
  TruthReplayInputReconstructionState,
  TruthReplayInputReconstructionTransitionValidation,
  TruthReplayInputReconstructionType,
  TruthReplayOrderingContext,
  TruthReplayRequiredInput,
  TruthReplaySchemaContext,
  TruthReplaySerializationContext,
  TruthReplaySupersededInput,
} from "./types";

export const TRUTH_REPLAY_INPUT_RECONSTRUCTION_EVENTS: Readonly<Record<TruthReplayInputAuditEventName, TruthReplayInputAuditEventName>> = Object.freeze({
  REPLAY_INPUT_RECONSTRUCTION_REQUESTED: "REPLAY_INPUT_RECONSTRUCTION_REQUESTED",
  REPLAY_INPUT_CONTRACT_LOADED: "REPLAY_INPUT_CONTRACT_LOADED",
  REPLAY_INPUT_SCOPE_VERIFIED: "REPLAY_INPUT_SCOPE_VERIFIED",
  REPLAY_INPUT_MANIFEST_CREATED: "REPLAY_INPUT_MANIFEST_CREATED",
  REPLAY_INPUT_TRUTH_RECORDS_LOADED: "REPLAY_INPUT_TRUTH_RECORDS_LOADED",
  REPLAY_INPUT_EVENTS_LOADED: "REPLAY_INPUT_EVENTS_LOADED",
  REPLAY_INPUT_EVIDENCE_LOADED: "REPLAY_INPUT_EVIDENCE_LOADED",
  REPLAY_INPUT_LINEAGE_LOADED: "REPLAY_INPUT_LINEAGE_LOADED",
  REPLAY_INPUT_GOVERNANCE_LOADED: "REPLAY_INPUT_GOVERNANCE_LOADED",
  REPLAY_INPUT_AUTHORITY_VERIFIED: "REPLAY_INPUT_AUTHORITY_VERIFIED",
  REPLAY_INPUT_SCHEMA_CONTEXT_LOADED: "REPLAY_INPUT_SCHEMA_CONTEXT_LOADED",
  REPLAY_INPUT_ORDERED: "REPLAY_INPUT_ORDERED",
  REPLAY_INPUT_CANONICALIZED: "REPLAY_INPUT_CANONICALIZED",
  REPLAY_INPUT_INTEGRITY_VERIFIED: "REPLAY_INPUT_INTEGRITY_VERIFIED",
  REPLAY_INPUT_BUNDLE_CREATED: "REPLAY_INPUT_BUNDLE_CREATED",
  REPLAY_INPUT_RECONSTRUCTION_FAILED: "REPLAY_INPUT_RECONSTRUCTION_FAILED",
  REPLAY_INPUT_RECONSTRUCTION_ESCALATED: "REPLAY_INPUT_RECONSTRUCTION_ESCALATED",
});

const RECONSTRUCTION_TYPES: Readonly<Record<TruthReplayContractType, TruthReplayInputReconstructionType>> = Object.freeze({
  TRUTH_RECORD_REPLAY: "TRUTH_RECORD_INPUT_RECONSTRUCTION",
  EVENT_REPLAY: "EVENT_INPUT_RECONSTRUCTION",
  EVIDENCE_REPLAY: "EVIDENCE_INPUT_RECONSTRUCTION",
  RECOMMENDATION_REPLAY: "RECOMMENDATION_INPUT_RECONSTRUCTION",
  GOVERNANCE_REPLAY: "GOVERNANCE_INPUT_RECONSTRUCTION",
  LINEAGE_REPLAY: "LINEAGE_INPUT_RECONSTRUCTION",
  MISSION_REPLAY: "MISSION_INPUT_RECONSTRUCTION",
  FULL_CONTEXT_REPLAY: "FULL_CONTEXT_INPUT_RECONSTRUCTION",
});

const ACTIVE_RECONSTRUCTION_STATES: readonly TruthReplayInputReconstructionState[] = [
  "REQUESTED",
  "CONTRACT_LOADED",
  "SCOPE_VERIFIED",
  "SOURCES_DISCOVERED",
  "SOURCES_LOADED",
  "ORDERED",
  "CANONICALIZED",
  "INTEGRITY_VERIFIED",
];

const RECONSTRUCTION_TRANSITIONS: Readonly<Record<TruthReplayInputReconstructionState, readonly TruthReplayInputReconstructionState[]>> = Object.freeze({
  REQUESTED: ["CONTRACT_LOADED", "FAILED", "ESCALATED"],
  CONTRACT_LOADED: ["SCOPE_VERIFIED", "FAILED", "ESCALATED"],
  SCOPE_VERIFIED: ["SOURCES_DISCOVERED", "FAILED", "ESCALATED"],
  SOURCES_DISCOVERED: ["SOURCES_LOADED", "FAILED", "ESCALATED"],
  SOURCES_LOADED: ["ORDERED", "FAILED", "ESCALATED"],
  ORDERED: ["CANONICALIZED", "FAILED", "ESCALATED"],
  CANONICALIZED: ["INTEGRITY_VERIFIED", "FAILED", "ESCALATED"],
  INTEGRITY_VERIFIED: ["BUNDLE_CREATED", "FAILED", "ESCALATED"],
  BUNDLE_CREATED: ["ARCHIVED"],
  FAILED: [],
  ESCALATED: [],
  ARCHIVED: [],
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(code: TruthReplayInputFailureCode, message: string, path: string, input_ref?: string): TruthReplayInputFailureReason {
  return Object.freeze({ code, message, path, input_ref });
}

function pushFailure(
  failures: TruthReplayInputFailureReason[],
  code: TruthReplayInputFailureCode,
  message: string,
  path: string,
  input_ref?: string,
): void {
  failures.push(failure(code, message, path, input_ref));
}

function refs(records: readonly { input_ref: string }[]): readonly string[] {
  return Object.freeze(records.map((record) => record.input_ref));
}

function required(input_type: TruthReplayRequiredInput["input_type"], input_ref: string): TruthReplayRequiredInput {
  return Object.freeze({ input_type, input_ref });
}

function requiredInputs(request: TruthReplayInputReconstructionRequest): readonly TruthReplayRequiredInput[] {
  const contract = request.replay_contract;
  return Object.freeze([
    ...contract.source_truth_record_ids.map((id) => required("TRUTH_RECORD", id)),
    ...(contract.source_event_ids ?? []).map((id) => required("EVENT", id)),
    ...(contract.source_evidence_refs ?? []).map((id) => required("EVIDENCE", id)),
    ...(contract.source_lineage_refs ?? []).map((id) => required("LINEAGE", id)),
    ...(contract.governance_context.governance_decision_ids ?? []).map((id) => required("GOVERNANCE", id)),
    ...(contract.governance_context.escalation_ids ?? []).map((id) => required("GOVERNANCE", id)),
    ...(contract.source_policy_refs ?? []).map((id) => required("POLICY", id)),
    ...request.authority_inputs?.map((input) => required("AUTHORITY", input.authority_ref)) ?? [],
    ...request.schema_inputs.map((input) => required("SCHEMA", input.schema_ref)),
  ]);
}

function includedRefs(request: TruthReplayInputReconstructionRequest): Readonly<Record<TruthReplayRequiredInput["input_type"], readonly string[]>> {
  return Object.freeze({
    TRUTH_RECORD: Object.freeze(request.truth_records.map((record) => record.truth_record_id)),
    EVENT: Object.freeze((request.events ?? []).map((event) => event.event_id)),
    EVIDENCE: Object.freeze((request.evidence_inputs ?? []).map((evidence) => evidence.evidence_ref)),
    LINEAGE: Object.freeze((request.lineage_inputs ?? []).map((lineage) => lineage.lineage_ref)),
    GOVERNANCE: Object.freeze((request.governance_inputs ?? []).map((governance) => governance.governance_ref)),
    POLICY: Object.freeze((request.governance_inputs ?? []).filter((governance) => governance.governance_type === "POLICY_SNAPSHOT").map((governance) => governance.governance_ref)),
    AUTHORITY: Object.freeze((request.authority_inputs ?? []).map((authority) => authority.authority_ref)),
    SCHEMA: Object.freeze(request.schema_inputs.map((schema) => schema.schema_ref)),
  });
}

function missingInputs(request: TruthReplayInputReconstructionRequest): readonly TruthReplayRequiredInput[] {
  const included = includedRefs(request);
  return Object.freeze(requiredInputs(request).filter((input) => !included[input.input_type].includes(input.input_ref)));
}

function restrictedInputs(request: TruthReplayInputReconstructionRequest): readonly TruthReplayRequiredInput[] {
  const restricted: TruthReplayRequiredInput[] = [];
  request.truth_records.filter((input) => input.restricted === true && input.authorized !== true).forEach((input) => restricted.push(required("TRUTH_RECORD", input.truth_record_id)));
  (request.events ?? []).filter((input) => input.restricted === true && input.authorized !== true).forEach((input) => restricted.push(required("EVENT", input.event_id)));
  (request.evidence_inputs ?? []).filter((input) => input.restricted === true && input.authorized !== true).forEach((input) => restricted.push(required("EVIDENCE", input.evidence_ref)));
  (request.lineage_inputs ?? []).filter((input) => input.restricted === true && input.authorized !== true).forEach((input) => restricted.push(required("LINEAGE", input.lineage_ref)));
  (request.governance_inputs ?? []).filter((input) => input.restricted === true && input.authorized !== true).forEach((input) => restricted.push(required("GOVERNANCE", input.governance_ref)));
  return Object.freeze(restricted);
}

function supersededInputs(records: readonly ReconstructedTruthRecord[], lineage: readonly ReconstructedLineageInput[]): readonly TruthReplaySupersededInput[] {
  return Object.freeze([
    ...records
      .filter((record) => !!record.superseded_by)
      .map((record) => Object.freeze({
        input_type: "TRUTH_RECORD" as const,
        input_ref: record.truth_record_id,
        superseded_by: record.superseded_by,
        superseded_at: record.superseded_at,
      })),
    ...lineage
      .filter((input) => input.supersession_preserved === true)
      .map((input) => Object.freeze({
        input_type: "LINEAGE" as const,
        input_ref: input.lineage_ref,
      })),
  ]);
}

function orderInputRefs(request: TruthReplayInputReconstructionRequest, failures: TruthReplayInputFailureReason[]): readonly string[] {
  if (request.force_ambiguous_ordering === true || request.replay_contract.replay_ordering.require_total_order !== true) {
    pushFailure(failures, "EVENT_ORDERING_AMBIGUOUS", "Replay inputs require deterministic total ordering.", "ordering_context");
  }
  const entries = [
    ...request.truth_records.map((record) => ({ ref: record.truth_record_id, timestamp: "", sequence: 0 })),
    ...(request.events ?? []).map((event) => ({
      ref: event.event_id,
      timestamp: event.event_timestamp ?? "",
      sequence: event.ledger_sequence ?? 0,
    })),
    ...(request.evidence_inputs ?? []).map((evidence) => ({ ref: evidence.evidence_ref, timestamp: "", sequence: 0 })),
    ...(request.lineage_inputs ?? []).map((lineage) => ({ ref: lineage.lineage_ref, timestamp: "", sequence: 0 })),
    ...(request.governance_inputs ?? []).map((governance) => ({ ref: governance.governance_ref, timestamp: "", sequence: 0 })),
    ...(request.authority_inputs ?? []).map((authority) => ({ ref: authority.authority_ref, timestamp: "", sequence: 0 })),
    ...request.schema_inputs.map((schema) => ({ ref: schema.schema_ref, timestamp: "", sequence: 0 })),
  ];
  const strategy = request.replay_contract.replay_ordering.ordering_strategy;
  const sorted = [...entries].sort((left, right) => {
    if (strategy === "LEDGER_SEQUENCE" && left.sequence !== right.sequence) return left.sequence - right.sequence;
    if (strategy === "TIMESTAMP_THEN_ID" && left.timestamp !== right.timestamp) return left.timestamp.localeCompare(right.timestamp);
    return left.ref.localeCompare(right.ref);
  });
  return Object.freeze(sorted.map((entry) => entry.ref));
}

function validateScope(request: TruthReplayInputReconstructionRequest, failures: TruthReplayInputFailureReason[]): void {
  const contract = request.replay_contract;
  const scope = contract.replay_scope;
  if (!scope) {
    pushFailure(failures, "RECONSTRUCTION_SCOPE_MISSING", "Replay reconstruction scope is required.", "replay_contract.replay_scope");
    return;
  }
  if (!scope.allowed_tenant_ids.includes(request.tenant_id) || request.tenant_id !== contract.tenant_id) {
    pushFailure(failures, "TENANT_SCOPE_VIOLATION", "Reconstruction tenant must match replay contract tenant scope.", "tenant_id", request.tenant_id);
  }
  if (request.mission_id && contract.mission_id && request.mission_id !== contract.mission_id) {
    pushFailure(failures, "MISSION_SCOPE_VIOLATION", "Reconstruction mission must match replay contract mission.", "mission_id", request.mission_id);
  }
  for (const record of request.truth_records) {
    if (record.tenant_id !== contract.tenant_id) pushFailure(failures, "TENANT_SCOPE_VIOLATION", "Truth record tenant is outside replay scope.", "truth_records", record.truth_record_id);
    if (contract.mission_id && record.mission_id && record.mission_id !== contract.mission_id) pushFailure(failures, "MISSION_SCOPE_VIOLATION", "Truth record mission is outside replay scope.", "truth_records", record.truth_record_id);
    if (!scope.allowed_record_types.includes(record.record_type)) pushFailure(failures, "RECORD_TYPE_UNAUTHORIZED", "Truth record type is not allowed by replay scope.", "truth_records.record_type", record.truth_record_id);
  }
  for (const event of request.events ?? []) {
    if (event.tenant_id !== contract.tenant_id) pushFailure(failures, "TENANT_SCOPE_VIOLATION", "Event tenant is outside replay scope.", "events", event.event_id);
    if (!scope.allowed_event_types.includes(event.event_type)) pushFailure(failures, "EVENT_TYPE_UNAUTHORIZED", "Event type is not allowed by replay scope.", "events.event_type", event.event_id);
  }
  for (const restricted of restrictedInputs(request)) {
    pushFailure(failures, "RESTRICTED_INPUT_UNAUTHORIZED", "Restricted replay input requires authorization.", "restricted_inputs", restricted.input_ref);
  }
}

function validateSources(request: TruthReplayInputReconstructionRequest, missing: readonly TruthReplayRequiredInput[], failures: TruthReplayInputFailureReason[]): void {
  for (const input of missing) {
    const code: TruthReplayInputFailureCode = input.input_type === "TRUTH_RECORD"
      ? "REQUIRED_TRUTH_RECORD_MISSING"
      : input.input_type === "EVENT"
        ? "REQUIRED_EVENT_MISSING"
        : input.input_type === "EVIDENCE"
          ? "REQUIRED_EVIDENCE_MISSING"
          : input.input_type === "LINEAGE"
            ? "REQUIRED_LINEAGE_MISSING"
            : input.input_type === "SCHEMA"
              ? "REQUIRED_SCHEMA_MISSING"
              : "REQUIRED_GOVERNANCE_MISSING";
    pushFailure(failures, code, "Required replay input is missing.", "input_manifest.missing_inputs", input.input_ref);
  }
  for (const record of request.truth_records) {
    if (record.expected_hash && record.expected_hash !== record.record_hash) pushFailure(failures, "TRUTH_RECORD_HASH_MISMATCH", "Truth record hash mismatch.", "truth_records.record_hash", record.truth_record_id);
    if (record.corrupted === true) pushFailure(failures, "TRUTH_RECORD_CORRUPTED", "Truth record corruption detected.", "truth_records", record.truth_record_id);
    if (record.authorized === false) pushFailure(failures, "TRUTH_RECORD_UNAUTHORIZED", "Truth record is unauthorized for replay.", "truth_records", record.truth_record_id);
  }
  for (const event of request.events ?? []) {
    if (event.expected_hash && event.expected_hash !== event.event_hash) pushFailure(failures, "EVENT_HASH_MISMATCH", "Event hash mismatch.", "events.event_hash", event.event_id);
    if (!event.event_timestamp && event.ledger_sequence === undefined) pushFailure(failures, "EVENT_ORDERING_AMBIGUOUS", "Event needs timestamp or ledger sequence for deterministic ordering.", "events", event.event_id);
  }
  for (const evidence of request.evidence_inputs ?? []) {
    if (evidence.expected_hash && evidence.expected_hash !== evidence.evidence_hash) pushFailure(failures, "EVIDENCE_HASH_MISMATCH", "Evidence hash mismatch.", "evidence_inputs.evidence_hash", evidence.evidence_ref);
    if (evidence.relationship_preserved !== true) pushFailure(failures, "EVIDENCE_RELATIONSHIP_BROKEN", "Evidence relationship was not preserved.", "evidence_inputs.relationship_preserved", evidence.evidence_ref);
  }
  for (const lineage of request.lineage_inputs ?? []) {
    if (lineage.expected_hash && lineage.expected_hash !== lineage.lineage_hash) pushFailure(failures, "LINEAGE_HASH_MISMATCH", "Lineage hash mismatch.", "lineage_inputs.lineage_hash", lineage.lineage_ref);
    if (lineage.causal_chain_preserved !== true) pushFailure(failures, "CAUSAL_CHAIN_BROKEN", "Lineage causal chain was not preserved.", "lineage_inputs.causal_chain_preserved", lineage.lineage_ref);
  }
  const policySnapshot = request.governance_inputs?.some((input) => input.governance_type === "POLICY_SNAPSHOT" && input.governance_ref === request.replay_contract.governance_context.policy_snapshot_id) === true;
  if (request.replay_contract.governance_context.enforce_original_policy_context === true && !policySnapshot) {
    pushFailure(failures, "POLICY_SNAPSHOT_MISSING", "Original policy snapshot is required.", "governance_inputs", request.replay_contract.governance_context.policy_snapshot_id);
  }
  for (const governance of request.governance_inputs ?? []) {
    if (governance.expected_hash && governance.expected_hash !== governance.governance_hash) pushFailure(failures, "INPUT_HASH_MISMATCH", "Governance hash mismatch.", "governance_inputs.governance_hash", governance.governance_ref);
    if (governance.current_policy_substituted === true || governance.original_context_preserved !== true) pushFailure(failures, "CURRENT_POLICY_SUBSTITUTED", "Current policy cannot replace original policy context.", "governance_inputs.original_context_preserved", governance.governance_ref);
  }
  for (const authority of request.authority_inputs ?? []) {
    if (authority.execution_authority !== "NONE") pushFailure(failures, "EXECUTION_AUTHORITY_DETECTED", "Replay input authority cannot execute.", "authority_inputs.execution_authority", authority.authority_ref);
    if (authority.authority_expansion_allowed !== false) pushFailure(failures, "AUTHORITY_EXPANSION_DETECTED", "Replay input authority cannot expand.", "authority_inputs.authority_expansion_allowed", authority.authority_ref);
  }
  if (request.schema_inputs.length === 0) {
    pushFailure(failures, "REQUIRED_SCHEMA_MISSING", "Replay input reconstruction requires schema context.", "schema_inputs");
  }
  for (const schema of request.schema_inputs) {
    if (schema.expected_hash && schema.expected_hash !== schema.schema_hash) pushFailure(failures, "SCHEMA_HASH_MISMATCH", "Schema hash mismatch.", "schema_inputs.schema_hash", schema.schema_ref);
    if (schema.supported !== true) pushFailure(failures, "UNSUPPORTED_SCHEMA_VERSION", "Unsupported schema version.", "schema_inputs.schema_version", schema.schema_ref);
    if (schema.silent_migration_attempted === true) pushFailure(failures, "SILENT_SCHEMA_MIGRATION_ATTEMPTED", "Replay input reconstruction cannot silently migrate schemas.", "schema_inputs", schema.schema_ref);
  }
}

function buildManifest(
  request: TruthReplayInputReconstructionRequest,
  missing: readonly TruthReplayRequiredInput[],
): TruthReplayInputManifest {
  const superseded = supersededInputs(request.truth_records, request.lineage_inputs ?? []);
  const manifestWithoutHash = {
    manifest_id: `${request.bundle_id}:manifest`,
    replay_id: request.replay_contract.replay_id,
    tenant_id: request.replay_contract.tenant_id,
    mission_id: request.replay_contract.mission_id,
    truth_record_ids: request.truth_records.map((record) => record.truth_record_id),
    event_ids: (request.events ?? []).map((event) => event.event_id),
    evidence_refs: (request.evidence_inputs ?? []).map((evidence) => evidence.evidence_ref),
    lineage_refs: (request.lineage_inputs ?? []).map((lineage) => lineage.lineage_ref),
    governance_refs: (request.governance_inputs ?? []).map((governance) => governance.governance_ref),
    policy_refs: request.replay_contract.source_policy_refs ?? [],
    authority_refs: (request.authority_inputs ?? []).map((authority) => authority.authority_ref),
    schema_refs: request.schema_inputs.map((schema) => schema.schema_ref),
    required_inputs: requiredInputs(request),
    optional_inputs: request.optional_inputs,
    missing_inputs: missing,
    restricted_inputs: restrictedInputs(request),
    superseded_inputs: superseded,
  };
  return Object.freeze({
    ...manifestWithoutHash,
    manifest_hash: hashValue("mission-control-replay-input-manifest-hash", manifestWithoutHash),
  });
}

function buildCompletenessReport(
  request: TruthReplayInputReconstructionRequest,
  missing: readonly TruthReplayRequiredInput[],
): TruthReplayInputCompletenessReport {
  const missingTypes = new Set(missing.map((input) => input.input_type));
  const partial = missing.length > 0;
  const escalation = partial && request.replay_contract.failure_policy.allow_partial_replay === true && request.replay_contract.failure_policy.partial_replay_requires_escalation === true;
  return Object.freeze({
    complete: missing.length === 0,
    required_truth_records_complete: !missingTypes.has("TRUTH_RECORD"),
    required_events_complete: !missingTypes.has("EVENT"),
    required_evidence_complete: !missingTypes.has("EVIDENCE"),
    required_lineage_complete: !missingTypes.has("LINEAGE"),
    required_governance_complete: !missingTypes.has("GOVERNANCE") && !missingTypes.has("POLICY"),
    required_authority_complete: !missingTypes.has("AUTHORITY"),
    required_schema_context_complete: !missingTypes.has("SCHEMA"),
    missing_required_inputs: missing,
    missing_optional_inputs: request.optional_inputs?.filter((input) => !refs(requiredInputs(request)).includes(input.input_ref)),
    partial_reconstruction: partial,
    escalation_required: escalation,
  });
}

function buildIntegrityReport(
  request: TruthReplayInputReconstructionRequest,
  missing: readonly TruthReplayRequiredInput[],
  failures: readonly TruthReplayInputFailureReason[],
): TruthReplayInputIntegrityReport {
  const hashMismatches = Object.freeze(failures
    .filter((failureReason) => failureReason.code.endsWith("HASH_MISMATCH") || failureReason.code === "INPUT_HASH_MISMATCH")
    .map((failureReason) => Object.freeze({
      input_type: failureReason.path,
      input_ref: failureReason.input_ref ?? "",
    })));
  const corrupted = Object.freeze(failures
    .filter((failureReason) => failureReason.code.includes("CORRUPTED"))
    .map((failureReason) => Object.freeze({
      input_type: failureReason.path,
      input_ref: failureReason.input_ref ?? "",
      reason: failureReason.message,
    })));
  const unauthorized = Object.freeze(failures
    .filter((failureReason) => failureReason.code.includes("UNAUTHORIZED") || failureReason.code.includes("AUTHORITY"))
    .map((failureReason) => Object.freeze({
      input_type: failureReason.path,
      input_ref: failureReason.input_ref ?? "",
      reason: failureReason.message,
    })));
  const partialEscalation = missing.length > 0
    && request.replay_contract.failure_policy.allow_partial_replay === true
    && request.replay_contract.failure_policy.partial_replay_requires_escalation === true;
  const integrityState = partialEscalation
    ? "ESCALATION_REQUIRED"
    : missing.length > 0
      ? "INCOMPLETE"
      : unauthorized.length > 0
        ? "UNAUTHORIZED"
        : corrupted.length > 0
          ? "CORRUPTED"
          : hashMismatches.length > 0
            ? "MISMATCH"
            : "VERIFIED";
  return Object.freeze({
    integrity_verified: integrityState === "VERIFIED",
    truth_records_integrity_verified: !failures.some((reason) => reason.code.startsWith("TRUTH_RECORD") || reason.code === "REQUIRED_TRUTH_RECORD_MISSING"),
    events_integrity_verified: !failures.some((reason) => reason.code.startsWith("EVENT") || reason.code === "REQUIRED_EVENT_MISSING"),
    evidence_integrity_verified: !failures.some((reason) => reason.code.startsWith("EVIDENCE") || reason.code === "REQUIRED_EVIDENCE_MISSING"),
    lineage_integrity_verified: !failures.some((reason) => reason.code.startsWith("LINEAGE") || reason.code === "REQUIRED_LINEAGE_MISSING" || reason.code === "CAUSAL_CHAIN_BROKEN"),
    governance_integrity_verified: !failures.some((reason) => reason.code.includes("GOVERNANCE") || reason.code.includes("POLICY")),
    authority_integrity_verified: !failures.some((reason) => reason.code.includes("AUTHORITY") || reason.code === "EXECUTION_AUTHORITY_DETECTED"),
    schema_integrity_verified: !failures.some((reason) => reason.code.includes("SCHEMA")),
    hash_mismatches: hashMismatches,
    corrupted_inputs: corrupted,
    unauthorized_inputs: unauthorized,
    superseded_inputs: supersededInputs(request.truth_records, request.lineage_inputs ?? []),
    integrity_state: integrityState,
  });
}

function buildSchemaContext(request: TruthReplayInputReconstructionRequest): TruthReplaySchemaContext {
  const withoutHash = {
    schema_refs: request.schema_inputs.map((schema) => schema.schema_ref),
    schemas: request.schema_inputs,
  };
  return Object.freeze({
    ...withoutHash,
    schema_context_hash: hashValue("mission-control-replay-schema-context-hash", withoutHash),
  });
}

function buildOrderingContext(
  request: TruthReplayInputReconstructionRequest,
  orderedInputRefs: readonly string[],
): TruthReplayOrderingContext {
  const withoutHash = {
    ordering_strategy: request.replay_contract.replay_ordering.ordering_strategy,
    tie_breaker: request.replay_contract.replay_ordering.tie_breaker,
    require_total_order: request.replay_contract.replay_ordering.require_total_order,
    ordered_input_refs: orderedInputRefs,
  };
  return Object.freeze({
    ...withoutHash,
    ordering_hash: hashValue("mission-control-replay-input-ordering-hash", withoutHash),
  });
}

function buildSerializationContext(request: TruthReplayInputReconstructionRequest, failures: TruthReplayInputFailureReason[]): TruthReplaySerializationContext {
  if (request.force_unstable_serialization === true) pushFailure(failures, "UNSTABLE_SERIALIZATION_DETECTED", "Replay input serialization must be stable.", "serialization_context");
  if (request.force_wall_clock_injection === true) pushFailure(failures, "WALL_CLOCK_VALUE_INJECTED", "Replay input serialization cannot inject wall-clock values.", "serialization_context");
  if (request.force_environment_value_injection === true) pushFailure(failures, "ENVIRONMENT_VALUE_INJECTED", "Replay input serialization cannot inject environment-specific values.", "serialization_context");
  const withoutHash = {
    canonical_serialization: request.replay_contract.deterministic_requirements.canonical_serialization,
    stable_key_ordering: true as const,
    stable_array_ordering: true as const,
    wall_clock_injected: false as const,
    environment_values_injected: false as const,
  };
  return Object.freeze({
    ...withoutHash,
    serialization_hash: hashValue("mission-control-replay-input-serialization-hash", withoutHash),
  });
}

function buildInputHashes(
  request: TruthReplayInputReconstructionRequest,
  manifest: TruthReplayInputManifest,
  schemaContext: TruthReplaySchemaContext,
  authorityInputs: readonly ReconstructedAuthorityInput[],
  fullBundleSeed: Record<string, unknown>,
): TruthReplayInputHashSet {
  const contractHash = request.replay_contract.contract_hash ?? hashTruthReplayContract(request.replay_contract);
  const partial = {
    contract_hash: contractHash,
    manifest_hash: manifest.manifest_hash,
    truth_records_hash: hashValue("mission-control-replay-truth-record-inputs-hash", request.truth_records),
    events_hash: hashValue("mission-control-replay-event-inputs-hash", request.events ?? []),
    evidence_hash: hashValue("mission-control-replay-evidence-inputs-hash", request.evidence_inputs ?? []),
    lineage_hash: hashValue("mission-control-replay-lineage-inputs-hash", request.lineage_inputs ?? []),
    governance_hash: hashValue("mission-control-replay-governance-inputs-hash", request.governance_inputs ?? []),
    authority_hash: hashValue("mission-control-replay-authority-inputs-hash", authorityInputs),
    schema_context_hash: schemaContext.schema_context_hash,
  };
  return Object.freeze({
    ...partial,
    full_input_bundle_hash: hashValue("mission-control-replay-full-input-bundle-hash", {
      ...fullBundleSeed,
      input_hashes: partial,
    }),
  });
}

function certificationState(
  failures: readonly TruthReplayInputFailureReason[],
  completeness: TruthReplayInputCompletenessReport,
  integrity: TruthReplayInputIntegrityReport,
): TruthReplayInputCertificationState {
  if (failures.length > 0 && !completeness.escalation_required) return "RECONSTRUCTION_FAILED";
  if (completeness.escalation_required) return "RECONSTRUCTION_FAILED";
  if (completeness.complete && integrity.integrity_verified) return "INPUT_BUNDLE_CERTIFIED";
  return "UNCERTIFIED";
}

export function reconstructTruthReplayInputBundle(request: TruthReplayInputReconstructionRequest): TruthReplayInputBundle {
  const replayContract = request.replay_contract ?? createDefaultTruthReplayContractFixture({
    replay_id: "missing_replay_contract",
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    source_truth_record_ids: [],
    source_evidence_refs: [],
    source_lineage_refs: [],
    source_policy_refs: [],
  });
  const safeRequest: TruthReplayInputReconstructionRequest = Object.freeze({
    ...request,
    replay_contract: replayContract,
  });
  const failures: TruthReplayInputFailureReason[] = [];
  const auditEvents: TruthReplayInputAuditEventName[] = ["REPLAY_INPUT_RECONSTRUCTION_REQUESTED"];
  const contractValidation = validateTruthReplayContract(safeRequest.replay_contract, safeRequest.created_at);
  if (!request.replay_contract || contractValidation.state === "INVALID") {
    pushFailure(failures, "REPLAY_CONTRACT_MISSING", "Replay contract validation failed.", "replay_contract");
  }
  const expectedContractHash = hashTruthReplayContract(safeRequest.replay_contract);
  if (safeRequest.replay_contract.contract_hash && safeRequest.replay_contract.contract_hash !== expectedContractHash) {
    pushFailure(failures, "REPLAY_CONTRACT_HASH_MISMATCH", "Replay contract hash mismatch.", "replay_contract.contract_hash");
  }
  if (!["CONTRACT_VALIDATED", "REPLAYABLE", "CERTIFIED"].includes(safeRequest.replay_contract.certification_state)) {
    pushFailure(failures, "REPLAY_CONTRACT_UNVALIDATED", "Replay contract must be validated before input reconstruction.", "replay_contract.certification_state");
  }
  auditEvents.push("REPLAY_INPUT_CONTRACT_LOADED");

  validateScope(safeRequest, failures);
  auditEvents.push("REPLAY_INPUT_SCOPE_VERIFIED");

  const missing = missingInputs(safeRequest);
  const manifest = buildManifest(safeRequest, missing);
  auditEvents.push("REPLAY_INPUT_MANIFEST_CREATED");
  validateSources(safeRequest, missing, failures);
  auditEvents.push(
    "REPLAY_INPUT_TRUTH_RECORDS_LOADED",
    "REPLAY_INPUT_EVENTS_LOADED",
    "REPLAY_INPUT_EVIDENCE_LOADED",
    "REPLAY_INPUT_LINEAGE_LOADED",
    "REPLAY_INPUT_GOVERNANCE_LOADED",
    "REPLAY_INPUT_AUTHORITY_VERIFIED",
  );

  const orderedInputRefs = orderInputRefs(safeRequest, failures);
  const schemaContext = buildSchemaContext(safeRequest);
  auditEvents.push("REPLAY_INPUT_SCHEMA_CONTEXT_LOADED", "REPLAY_INPUT_ORDERED");
  const serializationContext = buildSerializationContext(safeRequest, failures);
  auditEvents.push("REPLAY_INPUT_CANONICALIZED");

  const completeness = buildCompletenessReport(safeRequest, missing);
  if (completeness.partial_reconstruction && !completeness.escalation_required) {
    pushFailure(failures, "PARTIAL_RECONSTRUCTION_REQUIRES_ESCALATION", "Partial reconstruction requires explicit escalation.", "completeness_report.partial_reconstruction");
  }
  const integrity = buildIntegrityReport(safeRequest, missing, failures);
  auditEvents.push("REPLAY_INPUT_INTEGRITY_VERIFIED");

  const reconstructionState: TruthReplayInputReconstructionState = completeness.escalation_required
    ? "ESCALATED"
    : failures.length === 0
      ? "BUNDLE_CREATED"
      : "FAILED";
  const certState = certificationState(failures, completeness, integrity);
  if (certState === "INPUT_BUNDLE_CERTIFIED" && (!completeness.complete || !integrity.integrity_verified)) {
    pushFailure(failures, "INCOMPLETE_BUNDLE_CERTIFICATION_BLOCKED", "Incomplete bundles cannot be certified.", "certification_state");
  }
  auditEvents.push(reconstructionState === "BUNDLE_CREATED" ? "REPLAY_INPUT_BUNDLE_CREATED" : reconstructionState === "ESCALATED" ? "REPLAY_INPUT_RECONSTRUCTION_ESCALATED" : "REPLAY_INPUT_RECONSTRUCTION_FAILED");

  const orderingContext = buildOrderingContext(safeRequest, orderedInputRefs);
  const bundleSeed = {
    bundle_id: safeRequest.bundle_id,
    replay_id: safeRequest.replay_contract.replay_id,
    tenant_id: safeRequest.replay_contract.tenant_id,
    mission_id: safeRequest.replay_contract.mission_id,
    replay_contract_ref: safeRequest.replay_contract.replay_id,
    replay_contract_hash: expectedContractHash,
    reconstruction_type: RECONSTRUCTION_TYPES[safeRequest.replay_contract.replay_type],
    reconstruction_scope: safeRequest.replay_contract.replay_scope,
    truth_records: safeRequest.truth_records,
    events: safeRequest.events ?? [],
    evidence_inputs: safeRequest.evidence_inputs ?? [],
    lineage_inputs: safeRequest.lineage_inputs ?? [],
    governance_inputs: safeRequest.governance_inputs ?? [],
    authority_inputs: safeRequest.authority_inputs ?? [],
    schema_context: schemaContext,
    ordering_context: orderingContext,
    serialization_context: serializationContext,
    completeness_report: completeness,
    integrity_report: integrity,
    input_manifest: manifest,
    reconstruction_state: reconstructionState,
    certification_state: certState,
    failure_reasons: failures,
    created_at: safeRequest.created_at,
  };
  const inputHashes = buildInputHashes(safeRequest, manifest, schemaContext, safeRequest.authority_inputs ?? [], bundleSeed);
  return Object.freeze({
    ...bundleSeed,
    input_hashes: inputHashes,
    failure_reasons: Object.freeze([...failures]),
    audit_events: Object.freeze(auditEvents),
    readOnly: true as const,
    executionAuthorized: false as const,
    sourceMutationAllowed: false as const,
  });
}

export function validateTruthReplayInputReconstructionTransition(
  from_state: TruthReplayInputReconstructionState,
  to_state: TruthReplayInputReconstructionState,
): TruthReplayInputReconstructionTransitionValidation {
  const valid = RECONSTRUCTION_TRANSITIONS[from_state]?.includes(to_state) === true
    || (ACTIVE_RECONSTRUCTION_STATES.includes(from_state) && (to_state === "FAILED" || to_state === "ESCALATED"));
  return Object.freeze({
    valid,
    from_state,
    to_state,
    error: valid ? undefined : failure(
      "NON_DETERMINISTIC_ORDERING",
      `Replay input reconstruction transition ${from_state} -> ${to_state} is not allowed.`,
      "reconstruction_state",
    ),
  });
}

export function canonicalizeTruthReplayInputBundle(bundle: TruthReplayInputBundle): string {
  if (bundle.serialization_context.canonical_serialization !== "STABLE_JSON") {
    throw new Error("UNSTABLE_SERIALIZATION_DETECTED");
  }
  return canonicalizeConfidenceToString(bundle);
}

export function toTruthReplayInputBundleStorageRecord(bundle: TruthReplayInputBundle): TruthReplayInputBundleStorageRecord {
  return Object.freeze({
    bundle_id: bundle.bundle_id,
    replay_id: bundle.replay_id,
    tenant_id: bundle.tenant_id,
    mission_id: bundle.mission_id,
    replay_contract_ref: bundle.replay_contract_ref,
    replay_contract_hash: bundle.replay_contract_hash,
    reconstruction_type: bundle.reconstruction_type,
    reconstruction_scope_json: canonicalizeConfidenceToString(bundle.reconstruction_scope),
    input_manifest_json: canonicalizeConfidenceToString(bundle.input_manifest),
    truth_records_json: canonicalizeConfidenceToString(bundle.truth_records),
    events_json: canonicalizeConfidenceToString(bundle.events),
    evidence_inputs_json: canonicalizeConfidenceToString(bundle.evidence_inputs),
    lineage_inputs_json: canonicalizeConfidenceToString(bundle.lineage_inputs),
    governance_inputs_json: canonicalizeConfidenceToString(bundle.governance_inputs),
    authority_inputs_json: canonicalizeConfidenceToString(bundle.authority_inputs),
    schema_context_json: canonicalizeConfidenceToString(bundle.schema_context),
    ordering_context_json: canonicalizeConfidenceToString(bundle.ordering_context),
    serialization_context_json: canonicalizeConfidenceToString(bundle.serialization_context),
    completeness_report_json: canonicalizeConfidenceToString(bundle.completeness_report),
    integrity_report_json: canonicalizeConfidenceToString(bundle.integrity_report),
    input_hashes_json: canonicalizeConfidenceToString(bundle.input_hashes),
    reconstruction_state: bundle.reconstruction_state,
    certification_state: bundle.certification_state,
    failure_reasons_json: bundle.failure_reasons ? canonicalizeConfidenceToString(bundle.failure_reasons) : undefined,
    full_input_bundle_hash: bundle.input_hashes.full_input_bundle_hash,
    created_at: bundle.created_at,
  });
}
