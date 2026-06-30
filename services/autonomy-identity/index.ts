import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyContract, validateAutonomyContract } from "@/services/autonomy-contract";
import type { AutonomyContract } from "@/types/autonomy-contract";
import type {
  AutonomyIdentityFailureReason,
  AutonomyIdentityObservabilitySurface,
  AutonomyIdentityRecord,
  AutonomyIdentityRegistry,
  AutonomyIdentityRegistryAuditEntry,
  AutonomyIdentityScenario,
  AutonomyIdentityValidationFailure,
  AutonomyIdentityValidationResult,
  AutonomyIdentityVersionPolicy,
  AutonomyLineageIdentity,
  AutonomyLineageReconstructionResult,
  AutonomyPrimaryIdentity,
  AutonomyRuntimeInstanceIdentity,
} from "@/types/autonomy-identity";

type PrimaryIdentityDraft = Omit<AutonomyPrimaryIdentity, "identity_hash" | "integrity_hash"> & Partial<Pick<AutonomyPrimaryIdentity, "identity_hash" | "integrity_hash">>;

const NOW = "2026-06-28T22:00:00.000Z";
const IDENTITY_VERSION = "autonomy-identity/v8A.2" as const;
const VALID_IDENTITY_STATES = ["GENERATED", "REGISTERED", "VALIDATED", "CERTIFIED", "ACTIVE", "RETIRED", "ARCHIVED"] as const;
const INVALID_IDENTITY_STATES = ["UNKNOWN", "DUPLICATE", "ORPHANED", "CORRUPTED", "INVALID", "EXPIRED"] as const;
const KNOWN_TENANT_MISSIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  tenant_alpha: Object.freeze(["mission_controlled_autonomy", "mission_governance_identity"]),
  tenant_beta: Object.freeze(["mission_beta_autonomy"]),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function failure(reason: AutonomyIdentityFailureReason, field_path: string, message: string): AutonomyIdentityValidationFailure {
  return Object.freeze({
    failure_id: `AIF-${hashValue("autonomy-identity-failure", { reason, field_path, message }).slice(0, 12).toUpperCase()}`,
    reason,
    field_path,
    message,
    fail_closed: true,
    audit_logged: true,
  });
}

function primaryHashSource(identity: PrimaryIdentityDraft | AutonomyPrimaryIdentity) {
  return {
    autonomy_id: identity.autonomy_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    root_autonomy_id: identity.root_autonomy_id,
    parent_autonomy_id: identity.parent_autonomy_id,
    instance_id: identity.instance_id,
    version: identity.version,
    created_timestamp: identity.created_timestamp,
    autonomy_type: identity.autonomy_type,
    authority_scope: identity.authority_scope,
    contract_reference: identity.contract_reference,
    governance_reference: identity.governance_reference,
    constitutional_reference: identity.constitutional_reference,
    replay_reference: identity.replay_reference,
    lineage_reference: identity.lineage_reference,
    generation: identity.generation,
    lifecycle_state: identity.lifecycle_state,
    certification_state: identity.certification_state,
  };
}

export function computeAutonomyIdentityHash(identity: PrimaryIdentityDraft | AutonomyPrimaryIdentity): string {
  return hashValue("autonomy-primary-identity", primaryHashSource(identity));
}

export function computeAutonomyIdentityIntegrityHash(identity: PrimaryIdentityDraft | AutonomyPrimaryIdentity): string {
  return hashValue("autonomy-primary-identity-integrity", { ...primaryHashSource(identity), identity_hash: identity.identity_hash ?? computeAutonomyIdentityHash(identity) });
}

function computeRuntimeHash(runtime: Omit<AutonomyRuntimeInstanceIdentity, "runtime_hash"> | AutonomyRuntimeInstanceIdentity): string {
  return hashValue("autonomy-runtime-identity", {
    runtime_identity_id: runtime.runtime_identity_id,
    autonomy_id: runtime.autonomy_id,
    instance_id: runtime.instance_id,
    tenant_id: runtime.tenant_id,
    mission_id: runtime.mission_id,
    execution_id: runtime.execution_id,
    lifecycle_state: runtime.lifecycle_state,
    replay_reference: runtime.replay_reference,
    created_timestamp: runtime.created_timestamp,
  });
}

function computeLineageHash(lineage: Omit<AutonomyLineageIdentity, "lineage_hash"> | AutonomyLineageIdentity): string {
  return hashValue("autonomy-lineage-identity", {
    lineage_identity_id: lineage.lineage_identity_id,
    autonomy_id: lineage.autonomy_id,
    tenant_id: lineage.tenant_id,
    root_autonomy_id: lineage.root_autonomy_id,
    parent_autonomy_id: lineage.parent_autonomy_id,
    child_autonomy_ids: lineage.child_autonomy_ids,
    generation: lineage.generation,
    derivation_path: lineage.derivation_path,
    version_history: lineage.version_history,
    replay_references: lineage.replay_references,
  });
}

function primaryId(contract: AutonomyContract, parent?: AutonomyIdentityRecord) {
  return `AID-${hashValue("autonomy-identity-id", {
    contract_autonomy_id: contract.identity.autonomy_id,
    tenant_id: contract.identity.tenant_id,
    mission_id: contract.identity.mission_id,
    parent_autonomy_id: parent?.primary.autonomy_id ?? null,
    generation: parent ? parent.primary.generation + 1 : 0,
    version: IDENTITY_VERSION,
  }).slice(0, 14).toUpperCase()}`;
}

function instanceId(contract: AutonomyContract, autonomy_id: string, scenario: AutonomyIdentityScenario, parent?: AutonomyIdentityRecord) {
  if (scenario === "DUPLICATE_INSTANCE_ID" && parent) return parent.primary.instance_id;
  return `AII-${hashValue("autonomy-instance-id", {
    autonomy_id,
    tenant_id: contract.identity.tenant_id,
    mission_id: contract.identity.mission_id,
    replay_reference: contract.replay.replay_reference,
    version: IDENTITY_VERSION,
  }).slice(0, 14).toUpperCase()}`;
}

function freezeRecord(record: AutonomyIdentityRecord): AutonomyIdentityRecord {
  return Object.freeze({
    primary: Object.freeze({ ...record.primary }),
    runtime: Object.freeze({ ...record.runtime }),
    lineage: Object.freeze({
      ...record.lineage,
      child_autonomy_ids: freezeArray(record.lineage.child_autonomy_ids),
      derivation_path: freezeArray(record.lineage.derivation_path),
      version_history: freezeArray(record.lineage.version_history),
      replay_references: freezeArray(record.lineage.replay_references),
    }),
    source_contract: record.source_contract,
  });
}

export function generateAutonomyIdentity(input: {
  contract?: AutonomyContract;
  parent_identity?: AutonomyIdentityRecord;
  scenario?: AutonomyIdentityScenario;
} = {}): AutonomyIdentityRecord {
  const scenario = input.scenario ?? "BASELINE";
  const sourceContract = input.contract ?? buildAutonomyContract({ parent_contract: input.parent_identity?.source_contract });
  const parent = input.parent_identity;
  const autonomy_id = scenario === "DUPLICATE_AUTONOMY_ID" && parent ? parent.primary.autonomy_id : scenario === "REUSED_IDENTIFIER" && parent ? parent.primary.autonomy_id : primaryId(sourceContract, parent);
  const tenant_id = scenario === "MISSING_TENANT" ? "" : scenario === "CROSS_TENANT_IDENTITY" && parent ? "tenant_beta" : sourceContract.identity.tenant_id;
  const mission_id = scenario === "INVALID_MISSION" ? "mission_unknown" : sourceContract.identity.mission_id;
  const root_autonomy_id = scenario === "BROKEN_LINEAGE" ? "missing-root" : parent?.primary.root_autonomy_id ?? autonomy_id;
  const parent_autonomy_id = scenario === "CIRCULAR_LINEAGE" ? autonomy_id : parent?.primary.autonomy_id ?? null;
  const generation = scenario === "BROKEN_LINEAGE" ? (parent ? parent.primary.generation + 3 : 2) : parent ? parent.primary.generation + 1 : 0;
  const instance_id = instanceId(sourceContract, autonomy_id, scenario, parent);
  const basePrimary: PrimaryIdentityDraft = {
    autonomy_id,
    tenant_id,
    mission_id,
    root_autonomy_id,
    parent_autonomy_id,
    instance_id,
    version: scenario === "UNSUPPORTED_VERSION" ? "autonomy-identity/v0" as typeof IDENTITY_VERSION : scenario === "DEPRECATED_VERSION" ? "autonomy-identity/v8A.0" as typeof IDENTITY_VERSION : IDENTITY_VERSION,
    created_timestamp: NOW,
    autonomy_type: sourceContract.identity.autonomy_type,
    authority_scope: scenario === "AUTHORITY_MISMATCH" ? "RECOVER" : sourceContract.authority.authority_scope,
    contract_reference: sourceContract.identity.autonomy_id,
    governance_reference: sourceContract.governance.governance_profile,
    constitutional_reference: sourceContract.constitution.constitutional_profile,
    replay_reference: sourceContract.replay.replay_reference,
    lineage_reference: sourceContract.lineage.lineage_reference,
    generation,
    lifecycle_state: "REGISTERED",
    certification_state: "VALIDATED",
  };
  const identity_hash = computeAutonomyIdentityHash(basePrimary);
  const integrity_hash = scenario === "HASH_MISMATCH" ? "tampered-identity-integrity" : computeAutonomyIdentityIntegrityHash({ ...basePrimary, identity_hash });
  const primary: AutonomyPrimaryIdentity = Object.freeze({ ...basePrimary, identity_hash, integrity_hash });
  const runtimeBase = {
    runtime_identity_id: `AIR-${hashValue("autonomy-runtime-identity-id", { autonomy_id, instance_id }).slice(0, 14).toUpperCase()}`,
    autonomy_id,
    instance_id,
    tenant_id,
    mission_id,
    execution_id: `EXEC-${hashValue("autonomy-execution-id", { autonomy_id, instance_id, replay_reference: primary.replay_reference }).slice(0, 14).toUpperCase()}`,
    lifecycle_state: "REGISTERED" as const,
    replay_reference: primary.replay_reference,
    created_timestamp: NOW,
  };
  const runtime: AutonomyRuntimeInstanceIdentity = Object.freeze({ ...runtimeBase, runtime_hash: computeRuntimeHash(runtimeBase) });
  const derivation_path = parent ? [...parent.lineage.derivation_path, autonomy_id] : [autonomy_id];
  const lineageBase = {
    lineage_identity_id: `AIL-${hashValue("autonomy-lineage-identity-id", { root_autonomy_id, autonomy_id }).slice(0, 14).toUpperCase()}`,
    autonomy_id,
    tenant_id,
    root_autonomy_id,
    parent_autonomy_id,
    child_autonomy_ids: freezeArray<string>([]),
    generation,
    derivation_path: freezeArray(derivation_path),
    version_history: freezeArray([IDENTITY_VERSION]),
    replay_references: freezeArray([primary.replay_reference]),
  };
  const lineage: AutonomyLineageIdentity = Object.freeze({ ...lineageBase, lineage_hash: computeLineageHash(lineageBase) });
  return freezeRecord({ primary, runtime, lineage, source_contract: sourceContract });
}

function validateTenantAndMission(identity: AutonomyIdentityRecord, failures: AutonomyIdentityValidationFailure[]) {
  const tenantMissions = KNOWN_TENANT_MISSIONS[identity.primary.tenant_id];
  if (!identity.primary.tenant_id) failures.push(failure("TENANT_MISSING", "primary.tenant_id", "tenant_id is required"));
  else if (!tenantMissions) failures.push(failure("TENANT_NOT_FOUND", "primary.tenant_id", "tenant is not registered"));
  if (!identity.primary.mission_id) failures.push(failure("MISSION_MISSING", "primary.mission_id", "mission_id is required"));
  else if (!tenantMissions?.includes(identity.primary.mission_id)) failures.push(failure("MISSION_NOT_FOUND", "primary.mission_id", "mission is not registered for tenant"));
  if (tenantMissions && identity.primary.mission_id && !tenantMissions.includes(identity.primary.mission_id)) failures.push(failure("MISSION_TENANT_MISMATCH", "primary.mission_id", "mission belongs to another tenant"));
  if (identity.primary.tenant_id !== identity.runtime.tenant_id || identity.primary.tenant_id !== identity.lineage.tenant_id) failures.push(failure("TENANT_OWNERSHIP_INVALID", "runtime.tenant_id", "identity sections disagree on tenant ownership"));
}

export function validateAutonomyIdentity(identity?: AutonomyIdentityRecord, context: { registry?: readonly AutonomyIdentityRecord[]; original_identity?: AutonomyIdentityRecord } = {}): AutonomyIdentityValidationResult {
  if (!identity) {
    const failures = freezeArray([failure("IDENTITY_MISSING", "identity", "autonomy identity is required")]);
    return Object.freeze({
      validation_id: `AIV-${hashValue("autonomy-identity-validation", failures).slice(0, 12).toUpperCase()}`,
      autonomy_id: null,
      validation_state: "FAIL",
      failures,
      globally_unique: false,
      instance_unique: false,
      immutable: false,
      tenant_isolated: false,
      mission_bound: false,
      lineage_complete: false,
      replay_correlated: false,
      authority_validated: false,
      certification_ready: false,
      integrity_hash: null,
    });
  }
  const failures: AutonomyIdentityValidationFailure[] = [];
  const required: readonly [string, unknown][] = [
    ["primary.autonomy_id", identity.primary.autonomy_id],
    ["primary.tenant_id", identity.primary.tenant_id],
    ["primary.mission_id", identity.primary.mission_id],
    ["primary.root_autonomy_id", identity.primary.root_autonomy_id],
    ["primary.instance_id", identity.primary.instance_id],
    ["primary.created_timestamp", identity.primary.created_timestamp],
    ["primary.replay_reference", identity.primary.replay_reference],
    ["primary.identity_hash", identity.primary.identity_hash],
    ["primary.integrity_hash", identity.primary.integrity_hash],
    ["runtime.runtime_identity_id", identity.runtime.runtime_identity_id],
    ["lineage.lineage_identity_id", identity.lineage.lineage_identity_id],
  ];
  for (const [fieldPath, value] of required) if (!value) failures.push(failure("REQUIRED_FIELD_MISSING", fieldPath, `${fieldPath} is required`));
  validateTenantAndMission(identity, failures);
  const contractRegistry = context.registry?.map((item) => item.source_contract);
  const contractValidation = validateAutonomyContract(identity.source_contract, { registry: contractRegistry });
  if (contractValidation.validation_state === "FAIL") failures.push(failure("TENANT_OWNERSHIP_INVALID", "source_contract", "source autonomy contract is not valid"));
  if (identity.primary.version !== IDENTITY_VERSION) {
    failures.push(failure(identity.primary.version === "autonomy-identity/v8A.0" ? "DEPRECATED_IDENTITY_VERSION" : "UNSUPPORTED_IDENTITY_VERSION", "primary.version", "identity version is not supported"));
  }
  if (!VALID_IDENTITY_STATES.includes(identity.primary.lifecycle_state as never) || INVALID_IDENTITY_STATES.includes(identity.primary.lifecycle_state as never)) failures.push(failure("INVALID_LIFECYCLE_STATE", "primary.lifecycle_state", "identity lifecycle state is invalid"));
  if (identity.primary.replay_reference !== identity.runtime.replay_reference || !identity.primary.replay_reference) failures.push(failure("REPLAY_REFERENCE_MISSING", "runtime.replay_reference", "runtime instance must correlate to primary replay reference"));
  if (identity.primary.authority_scope !== identity.source_contract.authority.authority_scope) failures.push(failure("AUTHORITY_OWNERSHIP_INVALID", "primary.authority_scope", "identity authority does not match source contract"));
  if (computeAutonomyIdentityHash(identity.primary) !== identity.primary.identity_hash || computeAutonomyIdentityIntegrityHash(identity.primary) !== identity.primary.integrity_hash) failures.push(failure("INTEGRITY_HASH_MISMATCH", "primary.integrity_hash", "identity hash cannot be reproduced"));
  if (computeRuntimeHash(identity.runtime) !== identity.runtime.runtime_hash) failures.push(failure("INTEGRITY_HASH_MISMATCH", "runtime.runtime_hash", "runtime hash cannot be reproduced"));
  if (computeLineageHash(identity.lineage) !== identity.lineage.lineage_hash) failures.push(failure("INTEGRITY_HASH_MISMATCH", "lineage.lineage_hash", "lineage hash cannot be reproduced"));
  if (identity.primary.autonomy_id !== identity.runtime.autonomy_id || identity.primary.autonomy_id !== identity.lineage.autonomy_id) failures.push(failure("IDENTIFIER_REUSE_DETECTED", "primary.autonomy_id", "identity sections disagree on autonomy_id"));
  if (identity.primary.instance_id !== identity.runtime.instance_id) failures.push(failure("DUPLICATE_INSTANCE_ID", "runtime.instance_id", "runtime instance does not match primary instance"));
  if (identity.primary.generation === 0 && identity.primary.root_autonomy_id !== identity.primary.autonomy_id) failures.push(failure("ROOT_IDENTITY_MISSING", "primary.root_autonomy_id", "root generation must reference itself"));
  if (identity.primary.generation > 0 && !identity.primary.parent_autonomy_id) failures.push(failure("PARENT_IDENTITY_MISSING", "primary.parent_autonomy_id", "derived identity requires parent identity"));
  if (identity.primary.parent_autonomy_id === identity.primary.autonomy_id) failures.push(failure("CIRCULAR_ANCESTRY", "primary.parent_autonomy_id", "identity cannot parent itself"));
  if (identity.lineage.root_autonomy_id !== identity.primary.root_autonomy_id || identity.lineage.generation !== identity.primary.generation) failures.push(failure("GENERATION_INCONSISTENT", "lineage.generation", "lineage identity disagrees with primary generation"));

  const registry = context.registry ?? [];
  if (registry.filter((item) => item.primary.autonomy_id === identity.primary.autonomy_id).length > 1) failures.push(failure("DUPLICATE_AUTONOMY_ID", "primary.autonomy_id", "autonomy identity is duplicated"));
  if (registry.filter((item) => item.primary.instance_id === identity.primary.instance_id).length > 1) failures.push(failure("DUPLICATE_INSTANCE_ID", "primary.instance_id", "runtime instance identity is duplicated"));
  const parent = identity.primary.parent_autonomy_id ? registry.find((item) => item.primary.autonomy_id === identity.primary.parent_autonomy_id) : undefined;
  if (identity.primary.generation > 0 && !parent) failures.push(failure("BROKEN_LINEAGE", "primary.parent_autonomy_id", "parent identity cannot be reconstructed"));
  if (parent && parent.primary.tenant_id !== identity.primary.tenant_id) failures.push(failure("CROSS_TENANT_IDENTITY", "primary.parent_autonomy_id", "parent identity belongs to another tenant"));
  if (parent && parent.primary.root_autonomy_id !== identity.primary.root_autonomy_id) failures.push(failure("BROKEN_LINEAGE", "primary.root_autonomy_id", "root identity does not match parent lineage"));
  if (parent && parent.primary.generation + 1 !== identity.primary.generation) failures.push(failure("GENERATION_INCONSISTENT", "primary.generation", "generation does not follow parent"));
  const original = context.original_identity;
  if (original) {
    const protectedPairs: readonly [string, unknown, unknown][] = [
      ["primary.autonomy_id", original.primary.autonomy_id, identity.primary.autonomy_id],
      ["primary.tenant_id", original.primary.tenant_id, identity.primary.tenant_id],
      ["primary.instance_id", original.primary.instance_id, identity.primary.instance_id],
      ["primary.created_timestamp", original.primary.created_timestamp, identity.primary.created_timestamp],
      ["primary.root_autonomy_id", original.primary.root_autonomy_id, identity.primary.root_autonomy_id],
    ];
    for (const [fieldPath, before, after] of protectedPairs) if (before !== after) failures.push(failure("IMMUTABLE_FIELD_MUTATION", fieldPath, `${fieldPath} cannot be modified`));
  }
  const frozenFailures = freezeArray(failures);
  const has = (reason: AutonomyIdentityFailureReason) => frozenFailures.some((item) => item.reason === reason);
  const validation_state = frozenFailures.length ? "FAIL" : "PASS";
  return Object.freeze({
    validation_id: `AIV-${hashValue("autonomy-identity-validation", { id: identity.primary.autonomy_id, frozenFailures }).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    validation_state,
    failures: frozenFailures,
    globally_unique: !has("DUPLICATE_AUTONOMY_ID") && !has("IDENTIFIER_REUSE_DETECTED"),
    instance_unique: !has("DUPLICATE_INSTANCE_ID"),
    immutable: !has("IMMUTABLE_FIELD_MUTATION") && !has("INTEGRITY_HASH_MISMATCH"),
    tenant_isolated: !has("CROSS_TENANT_IDENTITY") && !has("TENANT_OWNERSHIP_INVALID") && !has("MISSION_TENANT_MISMATCH"),
    mission_bound: !has("MISSION_MISSING") && !has("MISSION_NOT_FOUND") && !has("MISSION_TENANT_MISMATCH"),
    lineage_complete: !has("ROOT_IDENTITY_MISSING") && !has("PARENT_IDENTITY_MISSING") && !has("BROKEN_LINEAGE") && !has("CIRCULAR_ANCESTRY") && !has("GENERATION_INCONSISTENT"),
    replay_correlated: !has("REPLAY_REFERENCE_MISSING"),
    authority_validated: !has("AUTHORITY_OWNERSHIP_INVALID"),
    certification_ready: validation_state === "PASS",
    integrity_hash: identity.primary.integrity_hash,
  });
}

function auditEntry(event_type: AutonomyIdentityRegistryAuditEntry["event_type"], identity: AutonomyIdentityRecord, actor = "autonomy-identity-registry"): AutonomyIdentityRegistryAuditEntry {
  const source = { event_type, autonomy_id: identity.primary.autonomy_id, instance_id: identity.primary.instance_id, timestamp: NOW, actor };
  return Object.freeze({
    audit_id: `AIA-${hashValue("autonomy-identity-audit-id", source).slice(0, 12).toUpperCase()}`,
    ...source,
    audit_hash: hashValue("autonomy-identity-audit", source),
  });
}

export function buildAutonomyIdentityRegistry(identities: readonly AutonomyIdentityRecord[] = [generateAutonomyIdentity()]): AutonomyIdentityRegistry {
  const primaryIndex: Record<string, string> = {};
  const instanceIndex: Record<string, string> = {};
  const lineageIndex: Record<string, string[]> = {};
  const replayIndex: Record<string, string> = {};
  const auditLog: AutonomyIdentityRegistryAuditEntry[] = [];
  for (const identity of identities) {
    const validation = validateAutonomyIdentity(identity, { registry: identities });
    primaryIndex[identity.primary.autonomy_id] = identity.primary.integrity_hash;
    instanceIndex[identity.primary.instance_id] = identity.primary.autonomy_id;
    lineageIndex[identity.primary.root_autonomy_id] = [...(lineageIndex[identity.primary.root_autonomy_id] ?? []), identity.primary.autonomy_id];
    replayIndex[identity.primary.replay_reference] = identity.primary.autonomy_id;
    auditLog.push(auditEntry("GENERATED", identity));
    auditLog.push(auditEntry(validation.validation_state === "PASS" ? "VALIDATED" : "VALIDATION_FAILED", identity));
    if (validation.certification_ready) auditLog.push(auditEntry("CERTIFICATION_READY", identity));
  }
  const tenant_id = identities[0]?.primary.tenant_id ?? "tenant_alpha";
  const source = {
    registry_id: `AIRG-${hashValue("autonomy-identity-registry-id", identities.map((item) => item.primary.autonomy_id)).slice(0, 12).toUpperCase()}`,
    tenant_id,
    identities: freezeArray(identities),
    primary_index: Object.freeze(primaryIndex),
    instance_index: Object.freeze(instanceIndex),
    lineage_index: Object.freeze(Object.fromEntries(Object.entries(lineageIndex).map(([key, value]) => [key, freezeArray(value)]))),
    replay_index: Object.freeze(replayIndex),
    audit_log: freezeArray(auditLog),
  };
  return Object.freeze({ ...source, registry_hash: hashValue("autonomy-identity-registry", source) });
}

export function reconstructAutonomyLineage(identity: AutonomyIdentityRecord, registry: readonly AutonomyIdentityRecord[] = [identity]): AutonomyLineageReconstructionResult {
  const parentChain: string[] = [];
  const lineageBreaks: AutonomyIdentityFailureReason[] = [];
  const crossTenantViolations: string[] = [];
  let current: AutonomyIdentityRecord | undefined = identity;
  const seen = new Set<string>();
  while (current?.primary.parent_autonomy_id) {
    if (seen.has(current.primary.autonomy_id)) {
      lineageBreaks.push("CIRCULAR_ANCESTRY");
      break;
    }
    seen.add(current.primary.autonomy_id);
    const parent = registry.find((item) => item.primary.autonomy_id === current?.primary.parent_autonomy_id);
    if (!parent) {
      lineageBreaks.push("BROKEN_LINEAGE");
      break;
    }
    if (parent.primary.tenant_id !== identity.primary.tenant_id) crossTenantViolations.push(parent.primary.autonomy_id);
    parentChain.unshift(parent.primary.autonomy_id);
    current = parent;
  }
  if (identity.primary.root_autonomy_id !== (parentChain[0] ?? identity.primary.autonomy_id)) lineageBreaks.push("ROOT_IDENTITY_MISSING");
  const childAutonomyIds = registry.filter((item) => item.primary.parent_autonomy_id === identity.primary.autonomy_id).map((item) => item.primary.autonomy_id).sort();
  const source = {
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: identity.primary.tenant_id,
    root_autonomy_id: identity.primary.root_autonomy_id,
    parent_chain: freezeArray(parentChain),
    child_autonomy_ids: freezeArray(childAutonomyIds),
    derivation_path: freezeArray([...parentChain, identity.primary.autonomy_id]),
    generation: identity.primary.generation,
    lineage_complete: lineageBreaks.length === 0 && crossTenantViolations.length === 0,
    cross_tenant_violations: freezeArray(crossTenantViolations),
    lineage_breaks: freezeArray(lineageBreaks),
    replay_references: uniq(registry.filter((item) => item.primary.root_autonomy_id === identity.primary.root_autonomy_id).map((item) => item.primary.replay_reference)),
  };
  return Object.freeze({ ...source, lineage_hash: hashValue("autonomy-lineage-reconstruction", source) });
}

export function getAutonomyIdentityVersionPolicy(): AutonomyIdentityVersionPolicy {
  return Object.freeze({
    current_identity_version: IDENTITY_VERSION,
    supported_identity_versions: freezeArray([IDENTITY_VERSION]),
    deprecated_identity_versions: freezeArray(["autonomy-identity/v8A.0"]),
    compatible_contract_versions: freezeArray(["autonomy-contract/v8A.1"]),
    deterministic_generation_algorithm: "canonical-sha256-v8A.2",
    new_identity_required_for_structural_change: true,
  });
}

export function buildAutonomyIdentityObservabilitySurface(identity = generateAutonomyIdentity(), registry: readonly AutonomyIdentityRecord[] = [identity]): AutonomyIdentityObservabilitySurface {
  const validation = validateAutonomyIdentity(identity, { registry });
  return Object.freeze({
    autonomy_id: identity.primary.autonomy_id,
    instance_id: identity.primary.instance_id,
    tenant_id: identity.primary.tenant_id,
    mission_id: identity.primary.mission_id,
    root_autonomy_id: identity.primary.root_autonomy_id,
    parent_autonomy_id: identity.primary.parent_autonomy_id,
    generation: identity.primary.generation,
    lifecycle_state: identity.primary.lifecycle_state,
    certification_state: identity.primary.certification_state,
    validation_state: validation.validation_state,
    failure_reasons: freezeArray(validation.failures.map((item) => item.reason)),
    replay_reference: identity.primary.replay_reference,
    identity_hash: identity.primary.identity_hash,
    integrity_hash: identity.primary.integrity_hash,
  });
}

export function getAutonomyIdentityFramework() {
  const root = generateAutonomyIdentity();
  const registry = buildAutonomyIdentityRegistry([root]);
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["globally-unique", "immutable", "deterministic", "replayable", "tenant-isolated", "lineage-aware", "authority-bound", "auditable", "certification-ready"]),
      identity_version: IDENTITY_VERSION,
      lifecycle_states: freezeArray(VALID_IDENTITY_STATES),
      invalid_states: freezeArray(INVALID_IDENTITY_STATES),
    }),
    identity: root,
    validation: validateAutonomyIdentity(root, { registry: registry.identities }),
    registry,
    lineage: reconstructAutonomyLineage(root, registry.identities),
    version_policy: getAutonomyIdentityVersionPolicy(),
    observability: buildAutonomyIdentityObservabilitySurface(root, registry.identities),
  });
}
