import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type {
  AdaptiveMemoryApiSurface,
  AdaptiveMemoryContract,
  AdaptiveMemoryFailure,
  AdaptiveMemoryFoundation as AdaptiveMemoryFoundationDefinition,
  AdaptiveMemoryFoundationResult,
  AdaptiveMemoryGovernanceValidation,
  AdaptiveMemoryInput,
  AdaptiveMemoryLedgerEntry,
  AdaptiveMemoryMetrics,
  AdaptiveMemoryScenario,
  AdaptiveMemoryStatus,
  MemoryClassification,
  MemoryLifecycleStage,
  MemoryOwner,
  MemoryPermission,
  MemoryPermissionRegistryEntry,
  MemoryRecord,
  MemoryReusePolicy,
  MemoryType,
  MemoryVisibility,
} from "@/types/adaptive-memory-foundation";

const FOUNDATION_VERSION = "adaptive-memory-foundation/v1" as const;
const FOUNDATION_IDENTIFIER = "AdaptiveMemoryFoundation" as const;

const LIFECYCLE: readonly MemoryLifecycleStage[] = Object.freeze([
  "DISCOVERED",
  "CANDIDATE",
  "VALIDATED",
  "GOVERNANCE_REVIEW",
  "APPROVED",
  "INDEXED",
  "ACTIVE",
  "REUSED",
  "SUPERSEDED",
  "EXPIRED",
  "ARCHIVED",
]);

const OWNERS: readonly MemoryOwner[] = Object.freeze([
  "MISSION",
  "TENANT",
  "RECOMMENDATION",
  "PATTERN",
  "STRATEGY",
  "RISK_ANALYSIS",
  "CONFIDENCE_ANALYSIS",
  "GOVERNANCE_DECISION",
  "SIMULATION",
  "CERTIFICATION",
]);

const CLASSIFICATIONS: readonly MemoryClassification[] = Object.freeze([
  "OUTCOME_MEMORY",
  "RECOMMENDATION_MEMORY",
  "RISK_MEMORY",
  "CONFIDENCE_MEMORY",
  "GOVERNANCE_MEMORY",
  "OPERATOR_MEMORY",
  "STRATEGY_MEMORY",
  "PATTERN_MEMORY",
  "SIMULATION_MEMORY",
  "ROLLBACK_MEMORY",
  "CERTIFICATION_MEMORY",
]);

const MEMORY_TYPES: readonly MemoryType[] = Object.freeze([
  "EVIDENCE_OBSERVATION",
  "VALIDATED_OUTCOME",
  "CERTIFIED_PATTERN",
  "GOVERNANCE_HISTORY",
  "REPLAY_REFERENCE",
  "SIMULATION_HISTORY",
  "OPERATOR_DECISION",
  "CERTIFICATION_HISTORY",
]);

const PERMISSIONS: readonly MemoryPermission[] = Object.freeze([
  "READ",
  "REUSE",
  "REPLAY",
  "GOVERNANCE_REVIEW",
  "CERTIFICATION_REVIEW",
  "ARCHIVE",
]);

const REPLAY_REQUIREMENTS = Object.freeze([
  "originating_event",
  "supporting_evidence",
  "recommendation",
  "decision_path",
  "governance_review",
  "operator_actions",
  "simulation",
  "outcomes",
  "certification",
  "hash_verification",
]);

const REUSE_RULES = Object.freeze([
  "governance_approval_required",
  "replay_availability_required",
  "evidence_lineage_required",
  "integrity_validation_required",
  "mission_authorization_required",
  "visibility_approval_required",
  "tenant_match_required_unless_explicitly_authorized",
]);

const PROHIBITED_BEHAVIORS = Object.freeze([
  "execute_workflows",
  "initiate_actions",
  "approve_proposals",
  "modify_recommendations",
  "change_confidence",
  "alter_risk",
  "mutate_strategy",
  "change_policy",
  "learn_autonomously",
  "self_modify",
  "overwrite_historical_memory",
  "delete_historical_evidence",
  "create_hidden_memory",
  "conceal_failures",
  "bypass_governance",
  "bypass_replay",
  "bypass_certification",
  "infer_authority",
  "merge_tenants",
  "expose_restricted_information",
  "rewrite_operator_decisions",
  "fabricate_evidence",
]);

const CONSTITUTIONAL_GUARANTEES = Object.freeze([
  "deterministic_behavior",
  "immutable_lineage",
  "replayability",
  "evidence_provenance",
  "governance_enforcement",
  "constitutional_compliance",
  "tenant_isolation",
  "operator_visibility",
  "advisory_only_intelligence",
]);

type Scenario = NonNullable<AdaptiveMemoryInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): AdaptiveMemoryApiSurface {
  const base: Omit<AdaptiveMemoryApiSurface, "integrity_hash"> = {
    api_id: "adaptive_memory_foundation_api",
    establish_foundation: "POST /adaptive-memory-foundation/establish",
    retrieve_contract: "GET /adaptive-memory-foundation/contract",
    retrieve_lifecycle: "POST /adaptive-memory-foundation/lifecycle",
    retrieve_classifications: "POST /adaptive-memory-foundation/classifications",
    retrieve_permissions: "POST /adaptive-memory-foundation/permissions",
    retrieve_governance: "POST /adaptive-memory-foundation/governance",
    retrieve_ledger: "POST /adaptive-memory-foundation/ledger",
    replay_foundation: "POST /adaptive-memory-foundation/replay",
    inspect_foundation: "POST /adaptive-memory-foundation/inspect",
    autonomous_learning_supported: false,
    production_mutation_supported: false,
    cross_tenant_reuse_supported_by_default: false,
    deletion_supported: false,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): AdaptiveMemoryFailure | undefined {
  const map: Partial<Record<AdaptiveMemoryScenario, AdaptiveMemoryFailure>> = {
    DRIFT_DEFENSE_UNAVAILABLE: "DRIFT_DEFENSE_UNAVAILABLE",
    MISSING_EVIDENCE: "EVIDENCE_VALIDATION_MISSING",
    MISSING_REPLAY: "REPLAY_VALIDATION_MISSING",
    MISSING_GOVERNANCE: "GOVERNANCE_APPROVAL_MISSING",
    INTEGRITY_FAILURE: "INTEGRITY_VALIDATION_FAILED",
    MISSING_CLASSIFICATION: "CLASSIFICATION_MISSING",
    AMBIGUOUS_OWNER: "OWNERSHIP_AMBIGUOUS",
    TENANT_MISMATCH: "TENANT_ISOLATION_BREACH",
    MISSING_REUSE_AUTHORIZATION: "REUSE_AUTHORIZATION_MISSING",
    INVALID_CERTIFICATION: "CERTIFICATION_INVALID",
    DELETE_ATTEMPT: "DELETE_ATTEMPTED",
    PRODUCTION_MUTATION: "PRODUCTION_MUTATION_ATTEMPTED",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION_ATTEMPTED",
    AUTONOMOUS_LEARNING: "AUTONOMOUS_LEARNING_ATTEMPTED",
    HIDDEN_MEMORY: "HIDDEN_MEMORY_ATTEMPTED",
    HISTORY_REWRITE: "HISTORY_REWRITE_ATTEMPTED",
    RESTRICTED_EXPOSURE: "RESTRICTED_INFORMATION_EXPOSURE",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, driftDefenseReplayable: boolean): readonly AdaptiveMemoryFailure[] {
  const failures: AdaptiveMemoryFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!driftDefenseReplayable) failures.push("DRIFT_DEFENSE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly AdaptiveMemoryFailure[]): AdaptiveMemoryStatus {
  return failures.length ? "FAIL_CLOSED" : "AUTHORITATIVE";
}

function buildContract(): AdaptiveMemoryContract {
  const base: Omit<AdaptiveMemoryContract, "integrity_hash"> = {
    contract_id: "adaptive-memory-foundation-contract",
    version: FOUNDATION_VERSION,
    definition: "A governed evidence repository that preserves validated historical intelligence for advisory reuse without production authority.",
    required_fields: freezeArray([
      "memory_id",
      "tenant_id",
      "mission_scope",
      "memory_type",
      "memory_summary",
      "evidence_references",
      "outcome_references",
      "pattern_references",
      "governance_references",
      "replay_references",
      "reuse_policy",
      "authority_level",
      "classification",
      "visibility",
      "expiration_policy",
      "integrity_hash",
    ]),
    allowed_types: MEMORY_TYPES,
    allowed_owners: OWNERS,
    allowed_classifications: CLASSIFICATIONS,
    lifecycle: LIFECYCLE,
    permissions: PERMISSIONS,
    authority_level: "ADVISORY_ONLY",
    advisory_only: true,
    autonomous_learning_supported: false,
    production_mutation_supported: false,
    cross_tenant_reuse_supported_by_default: false,
    deletion_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function permissionRegistryFor(owner: MemoryOwner): MemoryPermissionRegistryEntry {
  const visibility: MemoryVisibility = owner === "CERTIFICATION"
    ? "CERTIFICATION_RESTRICTED"
    : owner === "GOVERNANCE_DECISION"
      ? "GOVERNANCE_RESTRICTED"
      : owner === "TENANT"
        ? "TENANT_PRIVATE"
        : "MISSION_SCOPED";
  const reusePermissions: readonly MemoryReusePolicy[] = owner === "CERTIFICATION"
    ? ["CERTIFICATION_REQUIRED_REUSE"]
    : ["GOVERNANCE_APPROVED_REUSE", "REPLAY_REQUIRED_REUSE"];
  const base: Omit<MemoryPermissionRegistryEntry, "integrity_hash"> = {
    owner,
    visibility,
    permissions: PERMISSIONS,
    governance_policy: `${owner.toLowerCase()}_memory_governance_policy`,
    reuse_permissions: reusePermissions,
    replay_required: true,
    archival_policy: "APPEND_ONLY_ARCHIVE",
    expiration_policy: "NO_DELETE_SUPERSEDE_EXPIRE_ARCHIVE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMemoryRecord(failures: readonly AdaptiveMemoryFailure[]): MemoryRecord {
  const activeEligible = !failures.some((failure) =>
    [
      "EVIDENCE_VALIDATION_MISSING",
      "REPLAY_VALIDATION_MISSING",
      "GOVERNANCE_APPROVAL_MISSING",
      "INTEGRITY_VALIDATION_FAILED",
      "CLASSIFICATION_MISSING",
      "OWNERSHIP_AMBIGUOUS",
      "TENANT_ISOLATION_BREACH",
      "CERTIFICATION_INVALID",
    ].includes(failure)
  );
  const base: Omit<MemoryRecord, "integrity_hash"> = {
    memory_id: "adaptive-memory-foundation-sample-001",
    tenant_id: "tenant-mission-control",
    mission_scope: "adaptive-memory-foundation",
    memory_type: "VALIDATED_OUTCOME",
    memory_summary: "Validated outcome memory used to establish advisory-only adaptive memory governance.",
    evidence_references: failures.includes("EVIDENCE_VALIDATION_MISSING") ? [] : ["evidence:outcome-observation-ledger:10.1.9"],
    outcome_references: ["outcome:truth-ledger-binding:10.2.3"],
    pattern_references: ["pattern:pattern-intelligence-engine:10.4"],
    governance_references: failures.includes("GOVERNANCE_APPROVAL_MISSING") ? [] : ["governance:governance-aware-adaptation-layer:10.8"],
    replay_references: failures.includes("REPLAY_VALIDATION_MISSING") ? [] : ["replay:adaptive-simulation-replay-validation:10.11"],
    reuse_policy: failures.includes("REUSE_AUTHORIZATION_MISSING") ? "REUSE_PROHIBITED" : "GOVERNANCE_APPROVED_REUSE",
    authority_level: "ADVISORY_ONLY",
    classification: "OUTCOME_MEMORY",
    secondary_classifications: ["GOVERNANCE_MEMORY", "SIMULATION_MEMORY"],
    visibility: failures.includes("TENANT_ISOLATION_BREACH") ? "GOVERNANCE_RESTRICTED" : "TENANT_PRIVATE",
    expiration_policy: "SUPERSEDE_EXPIRE_ARCHIVE_ONLY",
    owner: failures.includes("OWNERSHIP_AMBIGUOUS") ? "MISSION" : "TENANT",
    creator: "AdaptiveMemoryFoundation",
    lifecycle_stage: activeEligible ? "ACTIVE" : "GOVERNANCE_REVIEW",
    evidence_validated: !failures.includes("EVIDENCE_VALIDATION_MISSING"),
    replay_validated: !failures.includes("REPLAY_VALIDATION_MISSING"),
    governance_approved: !failures.includes("GOVERNANCE_APPROVAL_MISSING"),
    integrity_verified: !failures.includes("INTEGRITY_VALIDATION_FAILED"),
    certification_valid: !failures.includes("CERTIFICATION_INVALID"),
    reuse_authorized: !failures.includes("REUSE_AUTHORIZATION_MISSING"),
    created_at: "2026-07-11T00:00:00.000Z",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildGovernanceValidation(memory: MemoryRecord, failures: readonly AdaptiveMemoryFailure[]): AdaptiveMemoryGovernanceValidation {
  const base: Omit<AdaptiveMemoryGovernanceValidation, "integrity_hash"> = {
    constitutional_compliance: !failures.includes("AUTHORITY_EXPANSION_ATTEMPTED") && !failures.includes("PRODUCTION_MUTATION_ATTEMPTED"),
    governance_policy: memory.governance_approved && !failures.includes("HIDDEN_MEMORY_ATTEMPTED"),
    tenant_boundaries: !failures.includes("TENANT_ISOLATION_BREACH") && !failures.includes("RESTRICTED_INFORMATION_EXPOSURE"),
    mission_scope: true,
    authority_limits: memory.authority_level === "ADVISORY_ONLY" && !failures.includes("AUTHORITY_EXPANSION_ATTEMPTED"),
    replay_availability: memory.replay_validated,
    evidence_lineage: memory.evidence_validated && memory.evidence_references.length > 0,
    certification_dependencies: memory.certification_valid,
    reuse_authorization: memory.reuse_authorized && memory.reuse_policy !== "REUSE_PROHIBITED",
    available_for_reuse: false,
  };
  const available_for_reuse = Object.entries(base).every(([key, value]) => key === "available_for_reuse" || value === true);
  return Object.freeze({ ...base, available_for_reuse, integrity_hash: hashWithoutIntegrity({ ...base, available_for_reuse }) });
}

function buildLedger(memory: MemoryRecord, governance: AdaptiveMemoryGovernanceValidation): readonly AdaptiveMemoryLedgerEntry[] {
  return freezeArray(
    LIFECYCLE.slice(0, LIFECYCLE.indexOf(memory.lifecycle_stage) + 1).map((stage, index) => {
      const base: Omit<AdaptiveMemoryLedgerEntry, "integrity_hash"> = {
        ledger_id: `adaptive_memory_ledger_${String(index + 1).padStart(2, "0")}`,
        memory_id: memory.memory_id,
        transition: index === 0 ? "foundation_discovered" : `${LIFECYCLE[index - 1].toLowerCase()}_to_${stage.toLowerCase()}`,
        lifecycle_stage: stage,
        tenant_id: memory.tenant_id,
        owner: memory.owner,
        classification: memory.classification,
        governance_validated: governance.governance_policy,
        replay_validated: memory.replay_validated,
        authority_validated: governance.authority_limits,
        append_only: true,
        immutable: true,
        replayable: true,
        tenant_isolated: governance.tenant_boundaries,
      };
      return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    }),
  );
}

function buildMetrics(
  memoryRecords: readonly MemoryRecord[],
  ledger: readonly AdaptiveMemoryLedgerEntry[],
  failures: readonly AdaptiveMemoryFailure[],
): AdaptiveMemoryMetrics {
  const base: Omit<AdaptiveMemoryMetrics, "integrity_hash"> = {
    lifecycle_stage_count: LIFECYCLE.length,
    classification_count: CLASSIFICATIONS.length,
    owner_count: OWNERS.length,
    permission_count: PERMISSIONS.length,
    ledger_entry_count: ledger.length,
    active_memory_count: memoryRecords.filter((memory) => memory.lifecycle_stage === "ACTIVE").length,
    deterministic_replay_guaranteed: !failures.includes("REPLAY_VALIDATION_MISSING") && !failures.includes("HISTORY_REWRITE_ATTEMPTED"),
    governance_before_reuse_enforced: !failures.includes("GOVERNANCE_APPROVAL_MISSING") && !failures.includes("REUSE_AUTHORIZATION_MISSING"),
    tenant_isolation_preserved: !failures.includes("TENANT_ISOLATION_BREACH") && !failures.includes("RESTRICTED_INFORMATION_EXPOSURE"),
    advisory_only_enforced: !failures.includes("AUTHORITY_EXPANSION_ATTEMPTED") && !failures.includes("PRODUCTION_MUTATION_ATTEMPTED"),
    deletion_blocked: !failures.includes("DELETE_ATTEMPTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveMemoryFoundationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    drift_defense_hash: result.drift_defense_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    permission_hashes: result.permission_registry.map((entry) => entry.integrity_hash),
    memory_hashes: result.memory_records.map((memory) => memory.integrity_hash),
    governance_hash: result.governance_validation.integrity_hash,
    ledger_hashes: result.foundation_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveMemoryFoundationResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_memory_foundation_version,
    foundation_identifier: result.foundation_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishAdaptiveMemoryFoundation(input: AdaptiveMemoryInput = {}): AdaptiveMemoryFoundationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const drift_defense_result = input.drift_defense_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(drift_defense_result));
  const contract = buildContract();
  const permission_registry = freezeArray(OWNERS.map(permissionRegistryFor));
  const memory = buildMemoryRecord(failures);
  const memory_records = freezeArray([memory]);
  const governance_validation = buildGovernanceValidation(memory, failures);
  const foundation_ledger = buildLedger(memory, governance_validation);
  const metrics = buildMetrics(memory_records, foundation_ledger, failures);
  const base: Omit<AdaptiveMemoryFoundationResult, "integrity_hash" | "replay_hash"> = {
    adaptive_memory_foundation_version: FOUNDATION_VERSION,
    foundation_identifier: FOUNDATION_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    drift_defense_result,
    contract,
    lifecycle: LIFECYCLE,
    classification_taxonomy: CLASSIFICATIONS,
    ownership_model: OWNERS,
    permission_registry,
    governance_validation,
    memory_records,
    foundation_ledger,
    replay_requirements: REPLAY_REQUIREMENTS,
    reuse_rules: REUSE_RULES,
    prohibited_behaviors: PROHIBITED_BEHAVIORS,
    constitutional_guarantees: CONSTITUTIONAL_GUARANTEES,
    metrics,
    failures,
    deterministic: metrics.deterministic_replay_guaranteed,
    replayable: metrics.deterministic_replay_guaranteed,
    explainable: !failures.includes("HIDDEN_MEMORY_ATTEMPTED"),
    governance_preserved: governance_validation.governance_policy,
    constitutional_preserved: governance_validation.constitutional_compliance,
    operator_visibility_preserved: !failures.includes("HIDDEN_MEMORY_ATTEMPTED"),
    tenant_isolated: metrics.tenant_isolation_preserved,
    immutable_lineage: true,
    advisory_only: true,
    authorizes_actions: false,
    authorizes_production_mutation: false,
    authorizes_governance_override: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveMemoryFoundation(result: AdaptiveMemoryFoundationResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.drift_defense_result) &&
    verifyHashedRecord(result.contract) &&
    result.permission_registry.every(verifyHashedRecord) &&
    result.memory_records.every(verifyHashedRecord) &&
    verifyHashedRecord(result.governance_validation) &&
    result.foundation_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveMemoryFoundation(): AdaptiveMemoryFoundationDefinition {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_memory_foundation_version: FOUNDATION_VERSION,
    supported_classifications: CLASSIFICATIONS,
    supported_lifecycle: LIFECYCLE,
    api_surface,
    result: establishAdaptiveMemoryFoundation(),
  });
}

export const AdaptiveMemoryFoundation = Object.freeze({
  establish: establishAdaptiveMemoryFoundation,
  replay: replayAdaptiveMemoryFoundation,
});
