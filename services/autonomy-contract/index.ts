import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  AutonomyAuthorityScope,
  AutonomyContract,
  AutonomyContractScenario,
  AutonomyLifecycleState,
  AutonomyObservabilitySurface,
  AutonomyRegistry,
  AutonomyRegistryAuditEntry,
  AutonomyValidationFailure,
  AutonomyValidationFailureReason,
  AutonomyValidationResult,
  AutonomyVersionPolicy,
} from "@/types/autonomy-contract";

type AutonomyDraft = Omit<AutonomyContract, "certification"> & {
  certification: Omit<AutonomyContract["certification"], "integrity_hash"> & { integrity_hash?: string };
};

const NOW = "2026-06-28T21:00:00.000Z";
const CONTRACT_VERSION = "autonomy-contract/v8A.1" as const;
const VALID_AUTONOMY_TYPES = ["PLANNER", "ORCHESTRATOR", "SUPERVISOR", "RECOVERY", "AUTONOMOUS_SERVICE"] as const;
const VALID_GOVERNANCE_MODES = ["ADVISORY", "CONTROLLED", "RESTRICTED"] as const;
const VALID_AUTHORITY_SCOPES = ["OBSERVE", "RECOMMEND", "PLAN", "ORCHESTRATE", "RECOVER"] as const;
const VALID_LIFECYCLE_STATES = ["DRAFT", "VALIDATED", "REGISTERED", "CERTIFIED", "ACTIVE", "RETIRED", "ARCHIVED"] as const;
const INVALID_LIFECYCLE_STATES = ["UNKNOWN", "CORRUPTED", "ORPHANED", "INVALID", "UNSUPPORTED", "UNREGISTERED"] as const;
const KNOWN_TENANT_MISSIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  tenant_alpha: Object.freeze(["mission_controlled_autonomy", "mission_governance_identity"]),
  tenant_beta: Object.freeze(["mission_beta_autonomy"]),
});
const KNOWN_GOVERNANCE_PROFILES = ["governance_profile_controlled_autonomy", "governance_profile_restricted_autonomy"] as const;
const KNOWN_POLICY_SETS = ["runtime_policy_v7a", "tenant_policy_alpha", "mission_policy_controlled_autonomy", "authority_policy_v8a"] as const;
const KNOWN_CONSTITUTIONAL_PROFILES = ["constitutional_profile_controlled_autonomy"] as const;
const KNOWN_CONSTITUTIONAL_REVISIONS = ["constitution-revision-8a-0001"] as const;
const AUTHORITY_RANK: Readonly<Record<AutonomyAuthorityScope, number>> = Object.freeze({ OBSERVE: 0, RECOMMEND: 1, PLAN: 2, ORCHESTRATE: 3, RECOVER: 4 });
const MAX_SCOPE_BY_MODE: Readonly<Record<AutonomyContract["governance"]["governance_mode"], AutonomyAuthorityScope>> = Object.freeze({
  ADVISORY: "RECOMMEND",
  CONTROLLED: "ORCHESTRATE",
  RESTRICTED: "OBSERVE",
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

function failure(reason: AutonomyValidationFailureReason, field_path: string, message: string): AutonomyValidationFailure {
  return Object.freeze({
    failure_id: `ACF-${hashValue("autonomy-contract-failure", { reason, field_path, message }).slice(0, 12).toUpperCase()}`,
    reason,
    field_path,
    message,
    fail_closed: true,
  });
}

function buildIntegritySource(contract: AutonomyDraft | AutonomyContract) {
  return {
    identity: contract.identity,
    governance: contract.governance,
    constitution: contract.constitution,
    authority: contract.authority,
    lifecycle: contract.lifecycle,
    replay: contract.replay,
    lineage: contract.lineage,
    certification: {
      certification_state: contract.certification.certification_state,
      certification_version: contract.certification.certification_version,
      created_by: contract.certification.created_by,
      created_timestamp: contract.certification.created_timestamp,
    },
  };
}

export function computeAutonomyIntegrityHash(contract: AutonomyDraft | AutonomyContract): string {
  return hashValue("autonomy-contract-integrity", buildIntegritySource(contract));
}

function freezeContract(contract: AutonomyContract): AutonomyContract {
  return Object.freeze({
    identity: Object.freeze({ ...contract.identity }),
    governance: Object.freeze({ ...contract.governance, policy_set: freezeArray(contract.governance.policy_set) }),
    constitution: Object.freeze({ ...contract.constitution }),
    authority: Object.freeze({
      ...contract.authority,
      authority_profile: freezeArray(contract.authority.authority_profile),
      execution_permissions: freezeArray(contract.authority.execution_permissions),
    }),
    lifecycle: Object.freeze({ ...contract.lifecycle }),
    replay: Object.freeze({ ...contract.replay }),
    lineage: Object.freeze({ ...contract.lineage }),
    certification: Object.freeze({ ...contract.certification }),
  });
}

function autonomyId(input: { tenant_id: string; mission_id: string; autonomy_type: string; generation: number }) {
  return `AUTO-${hashValue("autonomy-id", input).slice(0, 14).toUpperCase()}`;
}

export function buildAutonomyContract(input: {
  scenario?: AutonomyContractScenario;
  tenant_id?: string;
  mission_id?: string;
  autonomy_type?: AutonomyContract["identity"]["autonomy_type"];
  parent_contract?: AutonomyContract;
  lifecycle_state?: AutonomyLifecycleState;
} = {}): AutonomyContract {
  const scenario = input.scenario ?? "BASELINE";
  const tenant_id = input.parent_contract?.identity.tenant_id ?? input.tenant_id ?? "tenant_alpha";
  const mission_id = scenario === "MISSING_MISSION" ? "" : input.parent_contract?.identity.mission_id ?? input.mission_id ?? "mission_controlled_autonomy";
  const autonomy_type = scenario === "UNSUPPORTED_TYPE" ? "UNKNOWN" as AutonomyContract["identity"]["autonomy_type"] : input.autonomy_type ?? "ORCHESTRATOR";
  const parent_autonomy = input.parent_contract?.identity.autonomy_id ?? null;
  const root_autonomy = input.parent_contract?.lineage.root_autonomy ?? "";
  const generation = input.parent_contract ? input.parent_contract.lineage.generation + 1 : 0;
  const id = scenario === "DUPLICATE_ID" && input.parent_contract ? input.parent_contract.identity.autonomy_id : autonomyId({ tenant_id, mission_id, autonomy_type, generation });
  const base: AutonomyDraft = {
    identity: {
      autonomy_id: id,
      autonomy_type,
      mission_id,
      tenant_id: scenario === "CROSS_TENANT_LINEAGE" && input.parent_contract ? "tenant_beta" : tenant_id,
      version: scenario === "INVALID_VERSION" ? "autonomy-contract/v0" as typeof CONTRACT_VERSION : CONTRACT_VERSION,
    },
    governance: {
      governance_profile: "governance_profile_controlled_autonomy",
      governance_version: "governance/v7",
      policy_set: uniq(["runtime_policy_v7a", "tenant_policy_alpha", "mission_policy_controlled_autonomy", "authority_policy_v8a"]),
      governance_mode: scenario === "GOVERNANCE_CONFLICT" ? "ADVISORY" : "CONTROLLED",
    },
    constitution: {
      constitutional_profile: "constitutional_profile_controlled_autonomy",
      constitution_version: "constitution/v8",
      constitutional_revision: "constitution-revision-8a-0001",
    },
    authority: {
      authority_scope: scenario === "AUTHORITY_ESCALATION" || scenario === "GOVERNANCE_CONFLICT" ? "RECOVER" : "ORCHESTRATE",
      authority_profile: uniq(["capability:plan", "capability:coordinate", "capability:request-approval"]),
      operator_required: true,
      execution_permissions: scenario === "GOVERNANCE_CONFLICT" ? freezeArray(["execute:unapproved-domain"]) : freezeArray(["domain:mission-control", "domain:truth-ledger"]),
    },
    lifecycle: {
      lifecycle_state: scenario === "INVALID_LIFECYCLE" ? "UNKNOWN" as AutonomyLifecycleState : input.lifecycle_state ?? "REGISTERED",
      lifecycle_version: "autonomy-lifecycle/v8A",
      activation_timestamp: input.lifecycle_state === "ACTIVE" ? NOW : null,
      retirement_timestamp: input.lifecycle_state === "RETIRED" || input.lifecycle_state === "ARCHIVED" ? NOW : null,
    },
    replay: {
      replay_reference: `replay:${id}`,
      replay_version: "autonomy-replay/v8A",
      replay_seed: scenario === "IMMUTABLE_MUTATION" ? "Date.now()" : `autonomy-seed:v8A:${tenant_id}:${mission_id}:stable`,
    },
    lineage: {
      lineage_reference: scenario === "BROKEN_LINEAGE" ? "" : `lineage:${root_autonomy || id}`,
      parent_autonomy,
      root_autonomy: scenario === "CIRCULAR_LINEAGE" ? id : root_autonomy || id,
      generation: scenario === "BROKEN_LINEAGE" ? generation + 2 : generation,
    },
    certification: {
      certification_state: "VALIDATED",
      certification_version: "autonomy-certification/v8A",
      created_by: "mission-control-autonomy-contract-service",
      created_timestamp: NOW,
    },
  };
  const withHash: AutonomyContract = {
    ...base,
    replay: { ...base.replay, replay_reference: scenario === "DUPLICATE_REPLAY_REFERENCE" && input.parent_contract ? input.parent_contract.replay.replay_reference : base.replay.replay_reference },
    certification: {
      ...base.certification,
      integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-integrity-hash" : computeAutonomyIntegrityHash(base),
    },
  };
  return freezeContract(withHash);
}

function validateKnownReferences(contract: AutonomyContract, failures: AutonomyValidationFailure[]) {
  const tenantMissions = KNOWN_TENANT_MISSIONS[contract.identity.tenant_id];
  if (!tenantMissions) failures.push(failure("TENANT_NOT_FOUND", "identity.tenant_id", "tenant is not registered"));
  if (!contract.identity.mission_id || !tenantMissions?.includes(contract.identity.mission_id)) failures.push(failure("MISSION_NOT_FOUND", "identity.mission_id", "mission is not registered for tenant"));
  if (tenantMissions && contract.identity.mission_id && !tenantMissions.includes(contract.identity.mission_id)) failures.push(failure("MISSION_TENANT_MISMATCH", "identity.mission_id", "mission belongs to another tenant"));
  if (!KNOWN_GOVERNANCE_PROFILES.includes(contract.governance.governance_profile as never)) failures.push(failure("GOVERNANCE_PROFILE_MISSING", "governance.governance_profile", "governance profile is unknown"));
  for (const policy of contract.governance.policy_set) {
    if (!KNOWN_POLICY_SETS.includes(policy as never)) failures.push(failure("POLICY_SET_UNKNOWN", "governance.policy_set", `policy ${policy} is unknown`));
  }
  if (!KNOWN_CONSTITUTIONAL_PROFILES.includes(contract.constitution.constitutional_profile as never)) failures.push(failure("CONSTITUTIONAL_PROFILE_MISSING", "constitution.constitutional_profile", "constitutional profile is unknown"));
  if (!KNOWN_CONSTITUTIONAL_REVISIONS.includes(contract.constitution.constitutional_revision as never)) failures.push(failure("CONSTITUTIONAL_REVISION_UNKNOWN", "constitution.constitutional_revision", "constitutional revision is unknown"));
}

export function validateAutonomyContract(contract?: AutonomyContract, context: { registry?: readonly AutonomyContract[]; original_contract?: AutonomyContract } = {}): AutonomyValidationResult {
  if (!contract) {
    const failures = freezeArray([failure("CONTRACT_MISSING", "contract", "autonomy contract is required")]);
    return Object.freeze({
      validation_id: `ACV-${hashValue("autonomy-validation", failures).slice(0, 12).toUpperCase()}`,
      autonomy_id: null,
      validation_state: "FAIL",
      failures,
      immutable: false,
      tenant_isolated: false,
      governance_bound: false,
      constitution_bound: false,
      authority_bounded: false,
      replay_ready: false,
      lineage_reconstructable: false,
      certification_ready: false,
      integrity_hash: null,
    });
  }
  const failures: AutonomyValidationFailure[] = [];
  const required: readonly [string, unknown][] = [
    ["identity.autonomy_id", contract.identity.autonomy_id],
    ["identity.mission_id", contract.identity.mission_id],
    ["identity.tenant_id", contract.identity.tenant_id],
    ["governance.governance_profile", contract.governance.governance_profile],
    ["constitution.constitutional_profile", contract.constitution.constitutional_profile],
    ["replay.replay_reference", contract.replay.replay_reference],
    ["lineage.lineage_reference", contract.lineage.lineage_reference],
    ["certification.integrity_hash", contract.certification.integrity_hash],
  ];
  for (const [fieldPath, value] of required) if (!value) failures.push(failure("REQUIRED_FIELD_MISSING", fieldPath, `${fieldPath} is required`));
  if (!VALID_AUTONOMY_TYPES.includes(contract.identity.autonomy_type as never)) failures.push(failure("UNSUPPORTED_AUTONOMY_TYPE", "identity.autonomy_type", "autonomy type is unsupported"));
  if (contract.identity.version !== CONTRACT_VERSION) failures.push(failure("UNSUPPORTED_SCHEMA_VERSION", "identity.version", "schema version is unsupported"));
  if (contract.governance.governance_version !== "governance/v7") failures.push(failure("UNSUPPORTED_GOVERNANCE_VERSION", "governance.governance_version", "governance version is unsupported"));
  if (!VALID_GOVERNANCE_MODES.includes(contract.governance.governance_mode as never)) failures.push(failure("INVALID_GOVERNANCE_MODE", "governance.governance_mode", "governance mode is invalid"));
  if (contract.constitution.constitution_version !== "constitution/v8") failures.push(failure("UNSUPPORTED_CONSTITUTION_VERSION", "constitution.constitution_version", "constitution version is unsupported"));
  if (!VALID_AUTHORITY_SCOPES.includes(contract.authority.authority_scope as never)) failures.push(failure("AUTHORITY_SCOPE_UNKNOWN", "authority.authority_scope", "authority scope is unknown"));
  if (contract.authority.authority_profile.length === 0) failures.push(failure("AUTHORITY_PROFILE_INVALID", "authority.authority_profile", "authority profile must list allowed capabilities"));
  if (contract.authority.operator_required !== true) failures.push(failure("OPERATOR_REQUIREMENT_UNDEFINED", "authority.operator_required", "operator approval requirement must be explicit"));
  if (contract.authority.execution_permissions.some((permission) => permission.startsWith("execute:"))) failures.push(failure("UNAUTHORIZED_PERMISSION", "authority.execution_permissions", "execution permission is not authorized"));
  const maxScope = MAX_SCOPE_BY_MODE[contract.governance.governance_mode];
  if (maxScope && AUTHORITY_RANK[contract.authority.authority_scope] > AUTHORITY_RANK[maxScope]) failures.push(failure("AUTHORITY_ESCALATION", "authority.authority_scope", "authority exceeds governance mode"));
  if (contract.governance.governance_mode === "ADVISORY" && contract.authority.execution_permissions.length > 0) failures.push(failure("GOVERNANCE_CONFLICT", "governance.governance_mode", "advisory mode cannot bind execution permissions"));
  if (!VALID_LIFECYCLE_STATES.includes(contract.lifecycle.lifecycle_state as never) || INVALID_LIFECYCLE_STATES.includes(contract.lifecycle.lifecycle_state as never)) failures.push(failure("INVALID_LIFECYCLE_STATE", "lifecycle.lifecycle_state", "lifecycle state is invalid"));
  if (contract.lifecycle.lifecycle_version !== "autonomy-lifecycle/v8A") failures.push(failure("UNSUPPORTED_LIFECYCLE_VERSION", "lifecycle.lifecycle_version", "lifecycle version is unsupported"));
  if (!contract.replay.replay_reference) failures.push(failure("MISSING_REPLAY_REFERENCE", "replay.replay_reference", "replay reference is required"));
  if (contract.replay.replay_version !== "autonomy-replay/v8A") failures.push(failure("UNSUPPORTED_REPLAY_VERSION", "replay.replay_version", "replay version is unsupported"));
  if (/random|date\.now|math\.random|live/i.test(contract.replay.replay_seed)) failures.push(failure("NON_DETERMINISTIC_REPLAY_SEED", "replay.replay_seed", "replay seed must be deterministic"));
  if (!contract.lineage.lineage_reference) failures.push(failure("MISSING_LINEAGE_REFERENCE", "lineage.lineage_reference", "lineage reference is required"));
  if (contract.lineage.parent_autonomy === contract.identity.autonomy_id) failures.push(failure("CIRCULAR_LINEAGE", "lineage.parent_autonomy", "contract cannot parent itself"));
  if (contract.lineage.generation === 0 && contract.lineage.root_autonomy !== contract.identity.autonomy_id) failures.push(failure("GENERATION_INCONSISTENT", "lineage.root_autonomy", "root generation must reference itself"));
  if (contract.lineage.generation > 0 && !contract.lineage.parent_autonomy) failures.push(failure("BROKEN_LINEAGE", "lineage.parent_autonomy", "child generation requires parent autonomy"));
  if (computeAutonomyIntegrityHash(contract) !== contract.certification.integrity_hash) failures.push(failure("INTEGRITY_HASH_MISMATCH", "certification.integrity_hash", "integrity hash does not match canonical contract"));
  validateKnownReferences(contract, failures);

  const registry = context.registry ?? [];
  if (registry.filter((item) => item.identity.autonomy_id === contract.identity.autonomy_id).length > 1) failures.push(failure("DUPLICATE_AUTONOMY_ID", "identity.autonomy_id", "autonomy_id is duplicated"));
  if (registry.filter((item) => item.replay.replay_reference === contract.replay.replay_reference).length > 1) failures.push(failure("DUPLICATE_REPLAY_REFERENCE", "replay.replay_reference", "replay reference is duplicated"));
  const parent = contract.lineage.parent_autonomy ? registry.find((item) => item.identity.autonomy_id === contract.lineage.parent_autonomy) : undefined;
  if (contract.lineage.generation > 0 && !parent) failures.push(failure("BROKEN_LINEAGE", "lineage.parent_autonomy", "parent autonomy cannot be reconstructed"));
  if (parent && parent.identity.tenant_id !== contract.identity.tenant_id) failures.push(failure("CROSS_TENANT_LINEAGE", "lineage.parent_autonomy", "parent autonomy belongs to another tenant"));
  if (parent && parent.lineage.root_autonomy !== contract.lineage.root_autonomy) failures.push(failure("BROKEN_LINEAGE", "lineage.root_autonomy", "root autonomy does not match parent lineage"));
  if (parent && parent.lineage.generation + 1 !== contract.lineage.generation) failures.push(failure("GENERATION_INCONSISTENT", "lineage.generation", "generation does not follow parent"));
  if (contract.lineage.root_autonomy) {
    const seen = new Set<string>();
    let current: AutonomyContract | undefined = contract;
    while (current?.lineage.parent_autonomy) {
      if (seen.has(current.identity.autonomy_id)) {
        failures.push(failure("CIRCULAR_LINEAGE", "lineage.parent_autonomy", "circular ancestry detected"));
        break;
      }
      seen.add(current.identity.autonomy_id);
      current = registry.find((item) => item.identity.autonomy_id === current?.lineage.parent_autonomy);
    }
  }
  const original = context.original_contract;
  if (original) {
    const protectedPairs: readonly [string, unknown, unknown][] = [
      ["identity.autonomy_id", original.identity.autonomy_id, contract.identity.autonomy_id],
      ["identity.tenant_id", original.identity.tenant_id, contract.identity.tenant_id],
      ["identity.version", original.identity.version, contract.identity.version],
      ["certification.created_timestamp", original.certification.created_timestamp, contract.certification.created_timestamp],
    ];
    for (const [fieldPath, before, after] of protectedPairs) if (before !== after) failures.push(failure("IMMUTABLE_FIELD_MUTATION", fieldPath, `${fieldPath} cannot be mutated`));
  }
  const frozenFailures = freezeArray(failures);
  const validation_state = frozenFailures.length ? "FAIL" : "PASS";
  const has = (reason: AutonomyValidationFailureReason) => frozenFailures.some((item) => item.reason === reason);
  return Object.freeze({
    validation_id: `ACV-${hashValue("autonomy-validation", { id: contract.identity.autonomy_id, frozenFailures }).slice(0, 12).toUpperCase()}`,
    autonomy_id: contract.identity.autonomy_id,
    validation_state,
    failures: frozenFailures,
    immutable: !has("IMMUTABLE_FIELD_MUTATION") && !has("INTEGRITY_HASH_MISMATCH"),
    tenant_isolated: !has("CROSS_TENANT_LINEAGE") && !has("MISSION_TENANT_MISMATCH"),
    governance_bound: !has("GOVERNANCE_PROFILE_MISSING") && !has("GOVERNANCE_CONFLICT") && !has("POLICY_SET_UNKNOWN"),
    constitution_bound: !has("CONSTITUTIONAL_PROFILE_MISSING") && !has("UNSUPPORTED_CONSTITUTION_VERSION") && !has("CONSTITUTIONAL_REVISION_UNKNOWN"),
    authority_bounded: !has("AUTHORITY_ESCALATION") && !has("UNAUTHORIZED_PERMISSION") && !has("AUTHORITY_SCOPE_UNKNOWN"),
    replay_ready: !has("MISSING_REPLAY_REFERENCE") && !has("DUPLICATE_REPLAY_REFERENCE") && !has("NON_DETERMINISTIC_REPLAY_SEED"),
    lineage_reconstructable: !has("BROKEN_LINEAGE") && !has("CIRCULAR_LINEAGE") && !has("MISSING_LINEAGE_REFERENCE"),
    certification_ready: validation_state === "PASS",
    integrity_hash: contract.certification.integrity_hash,
  });
}

function auditEntry(event_type: AutonomyRegistryAuditEntry["event_type"], contract: AutonomyContract, actor = "autonomy-contract-registry"): AutonomyRegistryAuditEntry {
  const source = { event_type, autonomy_id: contract.identity.autonomy_id, timestamp: NOW, actor };
  return Object.freeze({
    audit_id: `ACA-${hashValue("autonomy-registry-audit-id", source).slice(0, 12).toUpperCase()}`,
    ...source,
    audit_hash: hashValue("autonomy-registry-audit", source),
  });
}

export function buildAutonomyRegistry(contracts: readonly AutonomyContract[] = [buildAutonomyContract()]): AutonomyRegistry {
  const activeVersions: Record<string, string> = {};
  const historicalVersions: Record<string, string[]> = {};
  const auditTrail: AutonomyRegistryAuditEntry[] = [];
  for (const contract of contracts) {
    const validation = validateAutonomyContract(contract, { registry: contracts });
    const root = contract.lineage.root_autonomy;
    historicalVersions[root] = [...(historicalVersions[root] ?? []), contract.identity.autonomy_id];
    if (validation.validation_state === "PASS" && contract.lifecycle.lifecycle_state !== "ARCHIVED") {
      activeVersions[root] = contract.identity.autonomy_id;
      auditTrail.push(auditEntry("REGISTERED", contract));
    } else {
      auditTrail.push(auditEntry("VALIDATION_FAILED", contract));
    }
  }
  const tenant_id = contracts[0]?.identity.tenant_id ?? "tenant_alpha";
  const source = {
    registry_id: `ACR-${hashValue("autonomy-registry-id", contracts.map((item) => item.identity.autonomy_id)).slice(0, 12).toUpperCase()}`,
    tenant_id,
    contracts: freezeArray(contracts),
    active_versions: Object.freeze(activeVersions),
    historical_versions: Object.freeze(Object.fromEntries(Object.entries(historicalVersions).map(([key, value]) => [key, freezeArray(value)]))),
    audit_trail: freezeArray(auditTrail),
  };
  return Object.freeze({ ...source, registry_hash: hashValue("autonomy-registry", source) });
}

export function getAutonomyVersionPolicy(): AutonomyVersionPolicy {
  return Object.freeze({
    current_schema_version: CONTRACT_VERSION,
    supported_schema_versions: freezeArray([CONTRACT_VERSION]),
    deprecated_schema_versions: freezeArray([]),
    semantic_version: "8.1.0",
    backward_compatible_with: freezeArray([]),
    migration_guidance: freezeArray(["Create a new autonomy contract identity for structural changes.", "Retain prior versions in the registry historical_versions map.", "Validate replay seed and integrity hash before activation."]),
    deterministic_compatibility_required: true,
  });
}

export function buildAutonomyObservabilitySurface(contract = buildAutonomyContract(), registry: readonly AutonomyContract[] = [contract]): AutonomyObservabilitySurface {
  const validation = validateAutonomyContract(contract, { registry });
  return Object.freeze({
    autonomy_id: contract.identity.autonomy_id,
    tenant_id: contract.identity.tenant_id,
    mission_id: contract.identity.mission_id,
    lifecycle_state: contract.lifecycle.lifecycle_state,
    certification_state: contract.certification.certification_state,
    governance_mode: contract.governance.governance_mode,
    authority_scope: contract.authority.authority_scope,
    validation_state: validation.validation_state,
    failure_reasons: freezeArray(validation.failures.map((item) => item.reason)),
    replay_reference: contract.replay.replay_reference,
    lineage_reference: contract.lineage.lineage_reference,
    integrity_hash: contract.certification.integrity_hash,
  });
}

export function getAutonomyContract() {
  const contract = buildAutonomyContract();
  const registry = buildAutonomyRegistry([contract]);
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["immutable", "constitutional-first", "governance-bound", "authority-bounded", "deterministic", "replayable", "explainable", "tenant-isolated", "certification-ready"]),
      schema_version: CONTRACT_VERSION,
      lifecycle_states: freezeArray(VALID_LIFECYCLE_STATES),
      invalid_states: freezeArray(INVALID_LIFECYCLE_STATES),
    }),
    contract,
    validation: validateAutonomyContract(contract, { registry: registry.contracts }),
    registry,
    version_policy: getAutonomyVersionPolicy(),
    observability: buildAutonomyObservabilitySurface(contract, registry.contracts),
  });
}
