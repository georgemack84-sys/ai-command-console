import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runReplayCertificationGate } from "@/services/replay-certification-gate";
import type {
  IntegrityArtifactType,
  IntegrityEngineInput,
  IntegrityFailureReason,
  IntegrityHashPolicy,
  IntegrityLifecycleState,
  IntegrityLifecycleTransition,
  IntegrityObservabilitySurface,
  IntegrityRecord,
  IntegrityRegistryRecord,
  IntegrityScenario,
  IntegrityState,
  IntegrityValidationError,
  IntegrityValidationResult,
} from "@/types/integrity-contract";

const NOW = "2026-06-30T11:00:00.000Z";
const SCHEMA_VERSION = "integrity-contract/v8H.1" as const;
const HASH_VERSION = "autonomy-integrity-hash/v8H.1" as const;
const SUPPORTED_HASH_ALGORITHM = "SHA-256" as const;
const PROTECTED_OBJECT_TYPES = Object.freeze(["PLANNING_RECORD", "EXECUTION_RECORD", "DELEGATION_RECORD", "ORCHESTRATION_RECORD", "SUPERVISION_RECORD", "INTERVENTION_RECORD", "REPLAY_RECORD", "GOVERNANCE_DECISION"] as const);
const IMMUTABLE_FIELDS = Object.freeze(["autonomy_id", "execution_id", "replay_id", "decision_id", "planning_id", "orchestration_id", "delegation_id", "supervision_id", "intervention_id", "governance_decision_id", "tenant_id", "creation_timestamp", "certification_timestamp", "constitutional_reference", "governance_reference", "policy_reference", "authority_reference", "replay_reference", "lineage_reference", "integrity_reference", "artifact_hash", "parent_hash", "lineage_hash", "replay_hash", "verification_hash"] as const);
const PROTECTED_FIELDS = Object.freeze(["integrity_id", "artifact_type", "artifact_id", "tenant_id", "immutable_identifiers", "protected_fields", "hash_policy", "replay_reference", "lineage_reference", "integrity_reference", "constitutional_reference", "governance_reference", "policy_reference", "authority_reference", "creation_timestamp", "certification_timestamp", "verification_state", "integrity_status", "schema_version"] as const);
const FAILURE_STATE: Readonly<Record<IntegrityFailureReason, IntegrityState>> = Object.freeze({
  MISSING_IDENTIFIERS: "CORRUPTED",
  MUTABLE_PROTECTED_FIELD: "CORRUPTED",
  INVALID_HASHES: "CORRUPTED",
  REPLAY_MISMATCH: "CORRUPTED",
  LINEAGE_CORRUPTION: "CORRUPTED",
  MISSING_GOVERNANCE_REFERENCES: "DEGRADED",
  CONSTITUTIONAL_VIOLATION: "CORRUPTED",
  DUPLICATE_IDENTIFIERS: "CORRUPTED",
  ORPHANED_ARTIFACT: "CORRUPTED",
  UNAUTHORIZED_MODIFICATION: "CORRUPTED",
  TENANT_BOUNDARY_VIOLATION: "CORRUPTED",
  SCHEMA_INCOMPATIBILITY: "DEGRADED",
  HIDDEN_VERIFICATION_STATE: "CORRUPTED",
});
const LIFECYCLE_TRANSITIONS: Readonly<Record<IntegrityLifecycleState, readonly IntegrityLifecycleState[]>> = Object.freeze({
  REGISTERED: ["HASHED", "CORRUPTED"],
  HASHED: ["VERIFIED", "DEGRADED", "CORRUPTED"],
  VERIFIED: ["CERTIFIED", "DEGRADED", "CORRUPTED"],
  CERTIFIED: ["MONITORED", "DEGRADED", "CORRUPTED"],
  MONITORED: ["DEGRADED", "CORRUPTED"],
  DEGRADED: ["RECOVERED", "CORRUPTED"],
  CORRUPTED: ["RECOVERED"],
  RECOVERED: ["MONITORED", "CORRUPTED"],
});

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values.filter(Boolean))].sort()); }
function id(prefix: string, domain: string, value: unknown) { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

export function classifyIntegrityFailure(reason: IntegrityFailureReason): IntegrityState { return FAILURE_STATE[reason]; }
function validationError(reason: IntegrityFailureReason, path: string, message: string): IntegrityValidationError {
  return Object.freeze({ reason, state: classifyIntegrityFailure(reason), path, message });
}
function deriveState(errors: readonly IntegrityValidationError[]): IntegrityState {
  if (errors.some((error) => error.state === "CORRUPTED")) return "CORRUPTED";
  if (errors.some((error) => error.state === "DEGRADED")) return "DEGRADED";
  return "VALID";
}

function payload(record: IntegrityRecord) {
  return {
    artifact_type: record.artifact_type,
    artifact_id: record.artifact_id,
    tenant_id: record.tenant_id,
    immutable_identifiers: record.immutable_identifiers,
    protected_fields: record.protected_fields,
    replay_reference: record.replay_reference,
    lineage_reference: record.lineage_reference,
    integrity_reference: record.integrity_reference,
    constitutional_reference: record.constitutional_reference,
    governance_reference: record.governance_reference,
    policy_reference: record.policy_reference,
    authority_reference: record.authority_reference,
    creation_timestamp: record.creation_timestamp,
    certification_timestamp: record.certification_timestamp,
    lineage: record.lineage,
    schema_version: record.schema_version,
  };
}
function metadata(record: IntegrityRecord) {
  return { integrity_id: record.integrity_id, verification_state: record.verification_state, integrity_status: record.integrity_status, lifecycle_state: record.lifecycle_state, schema_version: record.schema_version, fail_closed: record.fail_closed };
}
export function computeIntegrityPayloadHash(record: IntegrityRecord): string { return hashValue("integrity-contract-payload", payload(record)); }
export function computeIntegrityMetadataHash(record: IntegrityRecord): string { return hashValue("integrity-contract-metadata", metadata(record)); }
export function computeIntegrityLineageHash(record: IntegrityRecord): string { return hashValue("integrity-contract-lineage", record.lineage); }
export function computeIntegrityReplayHash(record: IntegrityRecord): string { return hashValue("integrity-contract-replay", { replay_reference: record.replay_reference, replay_id: record.immutable_identifiers.replay_id, source_replay_certification: record.source_replay_certification.integrity_hash }); }
export function computeIntegrityVerificationHash(record: IntegrityRecord): string { return hashValue("integrity-contract-verification", { payload: computeIntegrityPayloadHash(record), metadata: computeIntegrityMetadataHash(record), lineage: computeIntegrityLineageHash(record), replay: computeIntegrityReplayHash(record), governance: record.governance_reference, constitution: record.constitutional_reference }); }
export function computeIntegrityArtifactHash(record: IntegrityRecord): string { return hashValue("integrity-contract-artifact", { payload: computeIntegrityPayloadHash(record), metadata: computeIntegrityMetadataHash(record), verification: computeIntegrityVerificationHash(record) }); }
export function computeIntegrityRecordHash(record: IntegrityRecord): string { return hashValue("integrity-contract-record", { integrity_id: record.integrity_id, artifact_hash: record.hash_policy.artifact_hash, chain_hash: record.hash_policy.chain_hash, verification_hash: record.hash_policy.verification_hash, schema_version: record.schema_version }); }

function buildHashPolicy(record: Omit<IntegrityRecord, "hash_policy" | "record_hash">, parentHash: string): IntegrityHashPolicy {
  const draft = { ...record, hash_policy: { hash_algorithm: SUPPORTED_HASH_ALGORITHM, hash_version: HASH_VERSION, artifact_hash: "", payload_hash: "", metadata_hash: "", replay_hash: "", lineage_hash: "", parent_hash: parentHash, chain_hash: "", verification_hash: "" }, record_hash: "" } as IntegrityRecord;
  const payload_hash = computeIntegrityPayloadHash(draft);
  const metadata_hash = computeIntegrityMetadataHash(draft);
  const replay_hash = computeIntegrityReplayHash(draft);
  const lineage_hash = computeIntegrityLineageHash(draft);
  const verification_hash = hashValue("integrity-contract-verification", { payload: payload_hash, metadata: metadata_hash, lineage: lineage_hash, replay: replay_hash, governance: record.governance_reference, constitution: record.constitutional_reference });
  const artifact_hash = hashValue("integrity-contract-artifact", { payload: payload_hash, metadata: metadata_hash, verification: verification_hash });
  const chain_hash = hashValue("integrity-contract-chain", { parent_hash: parentHash, artifact_hash, lineage_hash, replay_hash });
  return Object.freeze({ hash_algorithm: SUPPORTED_HASH_ALGORITHM, hash_version: HASH_VERSION, artifact_hash, payload_hash, metadata_hash, replay_hash, lineage_hash, parent_hash: parentHash, chain_hash, verification_hash });
}

function normalize(record: Omit<IntegrityRecord, "hash_policy" | "record_hash">, parentHash: string): IntegrityRecord {
  const hash_policy = buildHashPolicy(record, parentHash);
  const withoutRecord = Object.freeze({ ...record, hash_policy, record_hash: "" }) as IntegrityRecord;
  return Object.freeze({ ...withoutRecord, record_hash: computeIntegrityRecordHash(withoutRecord) });
}

function baseRecord(input: IntegrityEngineInput): IntegrityRecord {
  const source = input.replayCertificationReport ?? runReplayCertificationGate();
  const artifact_type = input.artifact_type ?? "REPLAY_RECORD";
  const artifact_id = source.certification_id;
  const integrity_id = id("IC", "integrity-contract-id", { artifact_type, artifact_id });
  const identifiers = Object.freeze({
    autonomy_id: id("AUTO", "integrity-autonomy-id", source.certification_id),
    execution_id: source.source_replay_contract.replay_identity.execution_id,
    replay_id: source.source_replay_contract.replay_identity.replay_id,
    decision_id: source.planning_decision_reconstruction.decision_replay.decision_replay_id,
    planning_id: source.planning_decision_reconstruction.identity.planning_replay_id,
    orchestration_id: source.source_replay_contract.references.orchestration_reference,
    delegation_id: source.planning_decision_reconstruction.delegation_replay.delegation_replay_id,
    supervision_id: source.supervision_intervention_replay.identity.supervision_replay_id,
    intervention_id: source.supervision_intervention_replay.identity.intervention_reference,
    governance_decision_id: source.certification_result.result_id,
    tenant_id: source.certification_evidence.tenant_id,
  });
  const parentHash = source.ledger_entry.ledger_hash;
  return normalize({
    integrity_id,
    artifact_type,
    artifact_id,
    tenant_id: identifiers.tenant_id,
    immutable_identifiers: identifiers,
    protected_fields: PROTECTED_FIELDS,
    replay_reference: source.source_replay_contract.package_hash,
    lineage_reference: source.certification_evidence.lineage_reference,
    integrity_reference: source.integrity_hash,
    constitutional_reference: source.source_replay_contract.governance.constitution_version,
    governance_reference: source.source_replay_contract.references.governance_reference,
    policy_reference: source.source_replay_contract.governance.policy_version,
    authority_reference: source.source_replay_contract.governance.authority_reference,
    creation_timestamp: NOW,
    certification_timestamp: source.generated_at,
    verification_state: "VERIFIED",
    integrity_status: "VALID",
    lifecycle_state: "CERTIFIED",
    lineage: Object.freeze({
      parent_artifact_id: source.source_replay_contract.package_id,
      child_artifact_ids: freezeArray<string>([]),
      ancestor_artifact_ids: freezeArray([source.source_replay_contract.package_id, source.execution_reconstruction.package_id, source.planning_decision_reconstruction.package_id, source.supervision_intervention_replay.package_id]),
      descendant_artifact_ids: freezeArray<string>([]),
      replay_ancestor_id: source.source_replay_contract.replay_identity.replay_id,
      execution_ancestor_id: source.execution_reconstruction.identity.execution_reconstruction_id,
      planning_ancestor_id: source.planning_decision_reconstruction.identity.planning_replay_id,
      decision_ancestor_id: source.planning_decision_reconstruction.decision_replay.decision_replay_id,
      governance_ancestor_id: source.certification_evidence.certification_id,
      lineage_path: freezeArray([source.source_replay_contract.package_id, source.certification_id, integrity_id]),
    }),
    schema_version: SCHEMA_VERSION,
    source_replay_certification: source,
    fail_closed: true,
  }, parentHash);
}

function scenarioFailure(scenario: IntegrityScenario): IntegrityFailureReason | null {
  return scenario === "BASELINE" ? null : scenario;
}
function withScenario(record: IntegrityRecord, scenario: IntegrityScenario): IntegrityRecord {
  const failure = scenarioFailure(scenario);
  if (!failure) return record;
  const state = classifyIntegrityFailure(failure);
  const mutated = (() => {
    switch (scenario) {
      case "MISSING_IDENTIFIERS": return { ...record, integrity_id: "", artifact_id: "", immutable_identifiers: { ...record.immutable_identifiers, replay_id: "" } };
      case "MUTABLE_PROTECTED_FIELD": return { ...record, protected_fields: record.protected_fields.filter((field) => field !== "hash_policy") };
      case "INVALID_HASHES": return { ...record, hash_policy: { ...record.hash_policy, artifact_hash: "tampered-artifact-hash" } };
      case "REPLAY_MISMATCH": return { ...record, replay_reference: "replay:mismatch" };
      case "LINEAGE_CORRUPTION": return { ...record, lineage: { ...record.lineage, lineage_path: [] } };
      case "MISSING_GOVERNANCE_REFERENCES": return { ...record, governance_reference: "", policy_reference: "", authority_reference: "" };
      case "CONSTITUTIONAL_VIOLATION": return { ...record, constitutional_reference: "" };
      case "DUPLICATE_IDENTIFIERS": return record;
      case "ORPHANED_ARTIFACT": return { ...record, lineage: { ...record.lineage, parent_artifact_id: "missing-parent" } };
      case "UNAUTHORIZED_MODIFICATION": return { ...record, artifact_id: `${record.artifact_id}:modified` };
      case "TENANT_BOUNDARY_VIOLATION": return { ...record, tenant_id: "tenant_external" };
      case "SCHEMA_INCOMPATIBILITY": return { ...record, schema_version: "integrity-contract/v0" as "integrity-contract/v8H.1" };
      case "HIDDEN_VERIFICATION_STATE": return { ...record, verification_state: "FAILED" as const };
      default: return record;
    }
  })() as IntegrityRecord;
  const scenarioRecord = Object.freeze({ ...mutated, integrity_status: state, lifecycle_state: state === "CORRUPTED" ? "CORRUPTED" as const : "DEGRADED" as const }) as IntegrityRecord;
  if (["INVALID_HASHES", "UNAUTHORIZED_MODIFICATION", "REPLAY_MISMATCH", "MUTABLE_PROTECTED_FIELD"].includes(scenario)) return scenarioRecord;
  return normalize(scenarioRecord, scenarioRecord.hash_policy.parent_hash);
}

export function buildIntegrityContract(input: IntegrityEngineInput = {}): IntegrityRecord {
  return withScenario(input.record ?? baseRecord(input), input.scenario ?? "BASELINE");
}

function registryForScenario(record: IntegrityRecord, input: IntegrityEngineInput): readonly IntegrityRegistryRecord[] {
  if (input.registry) return input.registry;
  if (input.scenario !== "DUPLICATE_IDENTIFIERS") return [];
  return freezeArray([{ integrity_id: record.integrity_id, artifact_id: record.artifact_id, tenant_id: record.tenant_id }]);
}
function hasDuplicate(record: IntegrityRecord, registry: readonly IntegrityRegistryRecord[]): boolean {
  return registry.some((item) => item.integrity_id === record.integrity_id || item.artifact_id === record.artifact_id);
}
function hasParent(record: IntegrityRecord, registry: readonly IntegrityRegistryRecord[]): boolean {
  if (!record.lineage.parent_artifact_id || record.lineage.parent_artifact_id === record.source_replay_certification.source_replay_contract.package_id) return true;
  return registry.some((item) => item.artifact_id === record.lineage.parent_artifact_id);
}

function validationErrors(record: IntegrityRecord, registry: readonly IntegrityRegistryRecord[]): IntegrityValidationError[] {
  const errors: IntegrityValidationError[] = [];
  if (!record.integrity_id || !record.artifact_id || !record.tenant_id || Object.values(record.immutable_identifiers).some((value) => !value)) errors.push(validationError("MISSING_IDENTIFIERS", "immutable_identifiers", "Integrity identifiers are required and immutable."));
  if (record.protected_fields.length < PROTECTED_FIELDS.length || !PROTECTED_FIELDS.every((field) => record.protected_fields.includes(field))) errors.push(validationError("MUTABLE_PROTECTED_FIELD", "protected_fields", "All canonical protected fields must be locked after certification."));
  if (record.schema_version !== SCHEMA_VERSION || record.hash_policy.hash_version !== HASH_VERSION || record.hash_policy.hash_algorithm !== SUPPORTED_HASH_ALGORITHM) errors.push(validationError("SCHEMA_INCOMPATIBILITY", "schema_version", "Integrity schema and hash policy versions must be compatible with 8H.1."));
  const hashesValid = record.hash_policy.payload_hash === computeIntegrityPayloadHash(record) && record.hash_policy.metadata_hash === computeIntegrityMetadataHash(record) && record.hash_policy.lineage_hash === computeIntegrityLineageHash(record) && record.hash_policy.replay_hash === computeIntegrityReplayHash(record) && record.hash_policy.verification_hash === computeIntegrityVerificationHash(record) && record.hash_policy.artifact_hash === computeIntegrityArtifactHash(record) && record.record_hash === computeIntegrityRecordHash(record);
  if (!hashesValid) errors.push(validationError("INVALID_HASHES", "hash_policy", "All integrity hashes must be reproducible."));
  if (!record.replay_reference || record.replay_reference !== record.source_replay_certification.source_replay_contract.package_hash) errors.push(validationError("REPLAY_MISMATCH", "replay_reference", "Replay references must reconstruct the protected historical record."));
  if (!record.lineage_reference || record.lineage.lineage_path.length < 2 || !record.lineage.lineage_path.includes(record.integrity_id) || record.lineage.lineage_path[0] !== record.source_replay_certification.source_replay_contract.package_id) errors.push(validationError("LINEAGE_CORRUPTION", "lineage", "Lineage must remain complete and cryptographically linked."));
  if (!hasParent(record, registry)) errors.push(validationError("ORPHANED_ARTIFACT", "lineage.parent_artifact_id", "Parent artifact must exist unless rooted in the replay certification package."));
  if (!record.governance_reference || !record.policy_reference || !record.authority_reference) errors.push(validationError("MISSING_GOVERNANCE_REFERENCES", "governance", "Governance, policy, and authority references are required."));
  if (!record.constitutional_reference) errors.push(validationError("CONSTITUTIONAL_VIOLATION", "constitutional_reference", "Constitutional reference must be preserved."));
  if (hasDuplicate(record, registry)) errors.push(validationError("DUPLICATE_IDENTIFIERS", "identity", "Integrity identifiers and artifact identifiers must be unique."));
  if (record.artifact_id.endsWith(":modified") || computeIntegrityRecordHash(record) !== record.record_hash) errors.push(validationError("UNAUTHORIZED_MODIFICATION", "record_hash", "Unauthorized modification of protected fields is forbidden."));
  if (record.tenant_id !== record.immutable_identifiers.tenant_id || record.tenant_id.includes("external")) errors.push(validationError("TENANT_BOUNDARY_VIOLATION", "tenant_id", "Integrity records cannot cross tenant boundaries."));
  if (record.verification_state === "FAILED") errors.push(validationError("HIDDEN_VERIFICATION_STATE", "verification_state", "Failed verification state cannot be hidden."));
  return errors;
}

export function validateIntegrityContract(input: IntegrityRecord | IntegrityEngineInput = {}): IntegrityValidationResult {
  const engineInput = isRecord(input) && "schema_version" in input ? { record: input as IntegrityRecord } : input as IntegrityEngineInput;
  const record = buildIntegrityContract(engineInput);
  const registry = registryForScenario(record, engineInput);
  const failures = freezeArray(validationErrors(record, registry));
  const validation_state = deriveState(failures);
  const has = (reason: IntegrityFailureReason) => failures.some((failure) => failure.reason === reason);
  const source = { integrity_id: record.integrity_id || null, validation_state, failures, valid: validation_state === "VALID" };
  return Object.freeze({
    integrity_id: record.integrity_id || null,
    validation_state,
    valid: validation_state === "VALID",
    degraded: validation_state === "DEGRADED",
    corrupted: validation_state === "CORRUPTED",
    failures,
    schema_integrity_valid: !has("SCHEMA_INCOMPATIBILITY"),
    required_fields_valid: !has("MISSING_IDENTIFIERS"),
    immutable_identifiers_valid: !has("MISSING_IDENTIFIERS") && !has("DUPLICATE_IDENTIFIERS"),
    protected_fields_valid: !has("MUTABLE_PROTECTED_FIELD") && !has("UNAUTHORIZED_MODIFICATION"),
    hash_reproducible: !has("INVALID_HASHES"),
    lineage_continuous: !has("LINEAGE_CORRUPTION") && !has("ORPHANED_ARTIFACT"),
    replay_reconstructable: !has("REPLAY_MISMATCH"),
    governance_references_valid: !has("MISSING_GOVERNANCE_REFERENCES"),
    constitutional_references_valid: !has("CONSTITUTIONAL_VIOLATION"),
    tenant_ownership_valid: !has("TENANT_BOUNDARY_VIOLATION"),
    version_compatible: !has("SCHEMA_INCOMPATIBILITY"),
    fail_closed: true as const,
    validation_hash: hashValue("integrity-contract-validation", source),
  });
}

export function transitionIntegrityLifecycle(record = buildIntegrityContract(), to: IntegrityLifecycleState = "MONITORED"): IntegrityLifecycleTransition {
  const allowed = LIFECYCLE_TRANSITIONS[record.lifecycle_state].includes(to);
  const resulting_integrity_state: IntegrityState = to === "CORRUPTED" ? "CORRUPTED" : to === "DEGRADED" ? "DEGRADED" : "VALID";
  const source = { from: record.lifecycle_state, to, allowed, resulting_integrity_state };
  return Object.freeze({ ...source, transition_hash: hashValue("integrity-contract-lifecycle-transition", source) });
}

export function buildIntegrityObservabilitySurface(input: IntegrityEngineInput = {}): IntegrityObservabilitySurface {
  const record = buildIntegrityContract(input);
  const validation = validateIntegrityContract({ ...input, record });
  return Object.freeze({
    integrity_id: record.integrity_id,
    artifact_type: record.artifact_type,
    artifact_id: record.artifact_id,
    tenant_id: record.tenant_id,
    integrity_state: validation.validation_state,
    lifecycle_state: record.lifecycle_state,
    verification_state: record.verification_state,
    certification_state: validation.valid ? "CERTIFIED" : validation.degraded ? "CERTIFICATION_REVIEW" : "CERTIFICATION_BLOCKED",
    failure_count: validation.failures.length,
    failures: freezeArray(validation.failures.map((failure) => failure.reason)),
    artifact_hash: record.hash_policy.artifact_hash,
    chain_hash: record.hash_policy.chain_hash,
    replay_reference: record.replay_reference,
    lineage_reference: record.lineage_reference,
    governance_reference: record.governance_reference,
  });
}

export function getIntegrityContract() {
  const contract = buildIntegrityContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["autonomous-artifact-protection", "immutable-identifiers", "protected-fields", "deterministic-hashing", "replay-safe", "lineage-preserving", "governance-compliant", "constitutionally-protected", "tenant-isolated", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      hash_version: HASH_VERSION,
      protected_object_types: freezeArray(PROTECTED_OBJECT_TYPES),
      immutable_fields: freezeArray(IMMUTABLE_FIELDS),
      protected_fields: freezeArray(PROTECTED_FIELDS),
      lifecycle_states: freezeArray(["REGISTERED", "HASHED", "VERIFIED", "CERTIFIED", "MONITORED", "DEGRADED", "CORRUPTED", "RECOVERED"] as const),
      integrity_states: freezeArray(["VALID", "DEGRADED", "CORRUPTED"] as const),
      failure_state_mapping: FAILURE_STATE,
    }),
    contract,
    validation: validateIntegrityContract(contract),
    observability: buildIntegrityObservabilitySurface({ record: contract }),
  });
}
