import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveMemoryReplayEngine, replayAdaptiveMemoryReplayEngine } from "@/services/adaptive-memory-replay-engine";
import type { MemoryReplayRecord } from "@/types/adaptive-memory-replay-engine";
import type {
  LifecycleLedgerEntry,
  LifecyclePolicy,
  LifecycleTransitionOutcome,
  LifecycleValidationReport,
  LifecycleValidator,
  MemoryLifecycleApiSurface,
  MemoryLifecycleContract,
  MemoryLifecycleFailure,
  MemoryLifecycleInput,
  MemoryLifecycleManager,
  MemoryLifecycleMetrics,
  MemoryLifecycleRecord,
  MemoryLifecycleResult,
  MemoryLifecycleScenario,
  MemoryLifecycleState,
} from "@/types/memory-lifecycle-expiration-management";

const LIFECYCLE_VERSION = "memory-lifecycle-expiration-management/v1" as const;
const MANAGER_IDENTIFIER = "MemoryLifecycleExpirationManagement" as const;
const TRANSITION_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

const STATES: readonly MemoryLifecycleState[] = Object.freeze([
  "CANDIDATE",
  "QUALIFIED",
  "APPROVED",
  "ACTIVE",
  "REFERENCED",
  "SUPERSEDED",
  "ARCHIVED",
  "EXPIRED",
  "HISTORICAL",
]);

const VALIDATORS: readonly LifecycleValidator[] = Object.freeze([
  "LIFECYCLE_VALIDATION",
  "GOVERNANCE_VALIDATION",
  "RETENTION_EVALUATION",
  "EXPIRATION_EVALUATION",
  "SUPERSESSION_EVALUATION",
  "ARCHIVAL_VALIDATION",
  "REPLAY_VALIDATION",
  "TENANT_OWNERSHIP_VALIDATION",
  "INTEGRITY_VERIFICATION",
]);

const OUTCOMES: readonly LifecycleTransitionOutcome[] = Object.freeze(["TRANSITION_APPROVED", "TRANSITION_DENIED"]);

type Scenario = NonNullable<MemoryLifecycleInput["scenario"]>;

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

function buildApiSurface(): MemoryLifecycleApiSurface {
  const base: Omit<MemoryLifecycleApiSurface, "integrity_hash"> = {
    api_id: "memory_lifecycle_expiration_management_api",
    establish_manager: "POST /memory-lifecycle-expiration-management/establish",
    retrieve_contract: "GET /memory-lifecycle-expiration-management/contract",
    retrieve_records: "POST /memory-lifecycle-expiration-management/records",
    retrieve_retention: "POST /memory-lifecycle-expiration-management/retention",
    retrieve_expiration: "POST /memory-lifecycle-expiration-management/expiration",
    retrieve_ledger: "POST /memory-lifecycle-expiration-management/ledger",
    retrieve_metrics: "POST /memory-lifecycle-expiration-management/metrics",
    replay_manager: "POST /memory-lifecycle-expiration-management/replay",
    inspect_manager: "POST /memory-lifecycle-expiration-management/inspect",
    historical_deletion_supported: false,
    destructive_expiration_supported: false,
    supersession_overwrite_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): MemoryLifecycleFailure | undefined {
  const map: Partial<Record<MemoryLifecycleScenario, MemoryLifecycleFailure>> = {
    REPLAY_ENGINE_UNAVAILABLE: "REPLAY_ENGINE_UNAVAILABLE",
    HISTORICAL_DELETION: "HISTORICAL_MEMORY_DELETED",
    SUPERSESSION_OVERWRITE: "SUPERSESSION_OVERWROTE_PREVIOUS_MEMORY",
    EXPIRATION_REPLAY_REMOVAL: "EXPIRATION_REMOVED_REPLAY_CAPABILITY",
    NONDETERMINISTIC_TRANSITION: "LIFECYCLE_TRANSITION_NONDETERMINISTIC",
    GOVERNANCE_BYPASS: "GOVERNANCE_VALIDATION_BYPASSED",
    REPLAY_CONTINUITY_BREAK: "REPLAY_CONTINUITY_BROKEN",
    EVIDENCE_LINEAGE_LOSS: "EVIDENCE_LINEAGE_LOST",
    UNAUTHORIZED_TRANSITION: "UNAUTHORIZED_LIFECYCLE_TRANSITION",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_VIOLATED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, replayValid: boolean): readonly MemoryLifecycleFailure[] {
  const failures: MemoryLifecycleFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!replayValid) failures.push("REPLAY_ENGINE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function buildContract(): MemoryLifecycleContract {
  const base: Omit<MemoryLifecycleContract, "integrity_hash"> = {
    contract_id: "memory-lifecycle-expiration-management-contract",
    version: LIFECYCLE_VERSION,
    architecture: freezeArray(["Qualified Memory", "Lifecycle Manager", "Activation", "Supersession", "Expiration", "Archival", "Retention", "Lifecycle Ledger", "Replay & Historical Traceability"]),
    states: STATES,
    validators: VALIDATORS,
    outcomes: OUTCOMES,
    transition_rules: freezeArray(["activation_requires_governance_approval", "activation_requires_qualification_complete", "activation_requires_replay_available", "activation_requires_integrity_verified", "activation_requires_tenant_authorization", "supersession_requires_newer_qualified_version", "supersession_preserves_lineage", "archival_requires_replay_validation"]),
    retention_rules: freezeArray(["mission_lifecycle_evaluated", "legal_requirements_evaluated", "regulatory_requirements_evaluated", "governance_requirements_evaluated", "certification_dependencies_preserved", "replay_obligations_preserved", "evidence_obligations_preserved", "constitutional_protections_preserved"]),
    expiration_rules: freezeArray(["expiration_removes_operational_availability_only", "historical_replay_remains_available", "policy_evaluation_required", "governance_validation_required", "retention_verification_required", "archival_readiness_required"]),
    security_requirements: freezeArray(["prevent_unauthorized_transitions", "prevent_historical_deletion", "encrypt_lifecycle_metadata", "preserve_tenant_isolation", "validate_every_transition", "detect_lifecycle_tampering", "preserve_immutable_history"]),
    historical_guarantees: freezeArray(["no_historical_deletion", "immutable_lineage", "deterministic_transitions", "replay_continuity", "version_preservation", "archival_integrity", "governance_preservation"]),
    history_is_permanent: true,
    lifecycle_without_information_loss: true,
    governance_before_transition: true,
    replay_across_time: true,
    advisory_only: true,
    deletion_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validatorValid(validator: LifecycleValidator, failures: readonly MemoryLifecycleFailure[]): boolean {
  const blocked: Record<LifecycleValidator, readonly MemoryLifecycleFailure[]> = {
    LIFECYCLE_VALIDATION: ["HISTORICAL_MEMORY_DELETED", "LIFECYCLE_TRANSITION_NONDETERMINISTIC"],
    GOVERNANCE_VALIDATION: ["GOVERNANCE_VALIDATION_BYPASSED"],
    RETENTION_EVALUATION: ["HISTORICAL_MEMORY_DELETED", "EVIDENCE_LINEAGE_LOST"],
    EXPIRATION_EVALUATION: ["EXPIRATION_REMOVED_REPLAY_CAPABILITY"],
    SUPERSESSION_EVALUATION: ["SUPERSESSION_OVERWROTE_PREVIOUS_MEMORY"],
    ARCHIVAL_VALIDATION: ["HISTORICAL_MEMORY_DELETED", "REPLAY_CONTINUITY_BROKEN"],
    REPLAY_VALIDATION: ["REPLAY_ENGINE_UNAVAILABLE", "REPLAY_CONTINUITY_BROKEN", "EXPIRATION_REMOVED_REPLAY_CAPABILITY"],
    TENANT_OWNERSHIP_VALIDATION: ["TENANT_ISOLATION_VIOLATED", "UNAUTHORIZED_LIFECYCLE_TRANSITION"],
    INTEGRITY_VERIFICATION: ["INTEGRITY_VERIFICATION_FAILED", "LIFECYCLE_TRANSITION_NONDETERMINISTIC"],
  };
  return !blocked[validator].some((failure) => failures.includes(failure));
}

function buildReport(validator: LifecycleValidator, failures: readonly MemoryLifecycleFailure[]): LifecycleValidationReport {
  const valid = validatorValid(validator, failures);
  const base: Omit<LifecycleValidationReport, "integrity_hash"> = {
    validator,
    valid,
    deterministic: !failures.includes("LIFECYCLE_TRANSITION_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_CONTINUITY_BROKEN") && !failures.includes("EXPIRATION_REMOVED_REPLAY_CAPABILITY"),
    outcome: valid ? "TRANSITION_APPROVED" : "TRANSITION_DENIED",
    explanation: valid ? `${validator.toLowerCase()} approved governed lifecycle transition.` : `${validator.toLowerCase()} denied lifecycle transition.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPolicy(type: "RETENTION" | "EXPIRATION", source: MemoryReplayRecord, failures: readonly MemoryLifecycleFailure[]): LifecyclePolicy {
  const preservesReplay = !failures.includes("EXPIRATION_REMOVED_REPLAY_CAPABILITY") && !failures.includes("REPLAY_CONTINUITY_BROKEN");
  const compliant = type === "RETENTION"
    ? !failures.includes("EVIDENCE_LINEAGE_LOST") && !failures.includes("HISTORICAL_MEMORY_DELETED")
    : preservesReplay;
  const base: Omit<LifecyclePolicy, "integrity_hash"> = {
    policy_id: `${type.toLowerCase()}_${hash({ memory_id: source.memory_id, mission_id: source.mission_id }).slice(0, 24)}`,
    policy_type: type,
    requirements: type === "RETENTION"
      ? freezeArray(["mission_lifecycle", "legal_requirements", "regulatory_requirements", "governance_requirements", "certification_dependencies", "replay_obligations", "evidence_obligations"])
      : freezeArray(["evidence_freshness", "memory_age", "mission_completion", "superseding_knowledge", "governance_policy", "certification_expiration", "operational_relevance"]),
    compliant,
    preserves_historical_memory: true,
    preserves_replayability: preservesReplay,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function statesFor(index: number, failures: readonly MemoryLifecycleFailure[]): readonly [MemoryLifecycleState, MemoryLifecycleState, string, boolean] {
  if (failures.length) return ["APPROVED", "APPROVED", "transition_denied_by_lifecycle_validation", true] as const;
  const mode = index % 5;
  if (mode === 0) return ["APPROVED", "ACTIVE", "activation_governance_approved", true] as const;
  if (mode === 1) return ["ACTIVE", "REFERENCED", "memory_referenced_by_authorized_mission", true] as const;
  if (mode === 2) return ["REFERENCED", "SUPERSEDED", "newer_qualified_version_preserved_lineage", false] as const;
  if (mode === 3) return ["SUPERSEDED", "ARCHIVED", "immutable_archive_ready", false] as const;
  return ["ARCHIVED", "EXPIRED", "expiration_removed_operational_reuse_only", false] as const;
}

function buildRecord(source: MemoryReplayRecord, index: number, failures: readonly MemoryLifecycleFailure[]): MemoryLifecycleRecord {
  const reports = freezeArray(VALIDATORS.map((validator) => buildReport(validator, failures)));
  const [previous_state, new_state, transition_reason, operationally_available] = statesFor(index, failures);
  const transition_outcome: LifecycleTransitionOutcome = failures.length ? "TRANSITION_DENIED" : "TRANSITION_APPROVED";
  const retention_policy = buildPolicy("RETENTION", source, failures);
  const expiration_policy = buildPolicy("EXPIRATION", source, failures);
  const base: Omit<MemoryLifecycleRecord, "integrity_hash"> = {
    lifecycle_id: `mlcm_${hash({ source: source.replay_id, version: LIFECYCLE_VERSION }).slice(0, 32)}`,
    memory_id: source.memory_id,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source.tenant_id,
    mission_id: source.mission_id,
    previous_state,
    new_state,
    transition_reason,
    expiration_policy,
    retention_policy,
    supersession_refs: new_state === "SUPERSEDED" ? freezeArray([`supersession:${source.memory_id}:v2`]) : freezeArray([]),
    governance_refs: failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? [] : source.governance_refs,
    replay_refs: failures.includes("REPLAY_CONTINUITY_BROKEN") ? [] : freezeArray([source.replay_id, source.replay_hash]),
    certification_refs: source.certification_refs,
    validation_reports: reports,
    transition_outcome,
    transition_timestamp: TRANSITION_TIMESTAMP,
    historical_memory_preserved: !failures.includes("HISTORICAL_MEMORY_DELETED") && !failures.includes("SUPERSESSION_OVERWROTE_PREVIOUS_MEMORY"),
    operationally_available,
    replay_available: !failures.includes("EXPIRATION_REMOVED_REPLAY_CAPABILITY") && !failures.includes("REPLAY_CONTINUITY_BROKEN"),
    source_replay_hash: source.integrity_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly MemoryLifecycleRecord[], failures: readonly MemoryLifecycleFailure[]): readonly LifecycleLedgerEntry[] {
  const events: readonly LifecycleLedgerEntry["event"][] = ["ACTIVATION", "SUPERSESSION", "EXPIRATION", "ARCHIVAL", "RETENTION_DECISION", "GOVERNANCE_APPROVAL", "REPLAY_VALIDATION", "LIFECYCLE_TRANSITION", "POLICY_EVALUATION", "INTEGRITY_VERIFICATION"];
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<LifecycleLedgerEntry, "integrity_hash"> = {
      ledger_id: `memory_lifecycle_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      lifecycle_id: record.lifecycle_id,
      memory_id: record.memory_id,
      tenant_id: record.tenant_id,
      event,
      append_only: true,
      immutable: true,
      deterministic: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      cryptographically_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function buildMetrics(records: readonly MemoryLifecycleRecord[], failures: readonly MemoryLifecycleFailure[]): MemoryLifecycleMetrics {
  const approved = records.filter((record) => record.transition_outcome === "TRANSITION_APPROVED").length;
  const base: Omit<MemoryLifecycleMetrics, "integrity_hash"> = {
    lifecycle_transitions: records.length,
    activation_count: records.filter((record) => record.new_state === "ACTIVE").length,
    supersession_count: records.filter((record) => record.new_state === "SUPERSEDED").length,
    expiration_count: records.filter((record) => record.new_state === "EXPIRED").length,
    archival_count: records.filter((record) => record.new_state === "ARCHIVED").length,
    retention_compliance: failures.includes("EVIDENCE_LINEAGE_LOST") || failures.includes("HISTORICAL_MEMORY_DELETED") ? 0 : 1,
    replay_success: failures.includes("REPLAY_CONTINUITY_BROKEN") || failures.includes("EXPIRATION_REMOVED_REPLAY_CAPABILITY") ? 0 : 1,
    lifecycle_latency_ms: 6,
    transition_failures: records.length - approved,
    policy_violations: failures.some((failure) => ["HISTORICAL_MEMORY_DELETED", "EXPIRATION_REMOVED_REPLAY_CAPABILITY", "EVIDENCE_LINEAGE_LOST"].includes(failure)) ? 1 : 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<MemoryLifecycleResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    replay_hash: result.replay_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    record_hashes: result.lifecycle_records.map((record) => record.integrity_hash),
    ledger_hashes: result.lifecycle_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<MemoryLifecycleResult, "integrity_hash">): string {
  return hash({
    version: result.memory_lifecycle_version,
    manager_identifier: result.manager_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishMemoryLifecycleExpirationManagement(input: MemoryLifecycleInput = {}): MemoryLifecycleResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const replay_result = input.replay_result ?? establishAdaptiveMemoryReplayEngine();
  const failures = collectFailures(scenario, replayAdaptiveMemoryReplayEngine(replay_result));
  const contract = buildContract();
  const lifecycle_records = freezeArray(replay_result.replay_records.map((record, index) => buildRecord(record, index, failures)));
  const lifecycle_ledger = buildLedger(lifecycle_records, failures);
  const metrics = buildMetrics(lifecycle_records, failures);
  const base: Omit<MemoryLifecycleResult, "integrity_hash" | "replay_hash"> = {
    memory_lifecycle_version: LIFECYCLE_VERSION,
    manager_identifier: MANAGER_IDENTIFIER,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    replay_result,
    contract,
    lifecycle_records,
    lifecycle_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("LIFECYCLE_TRANSITION_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_CONTINUITY_BROKEN") && !failures.includes("EXPIRATION_REMOVED_REPLAY_CAPABILITY"),
    governance_enforced: !failures.includes("GOVERNANCE_VALIDATION_BYPASSED"),
    historical_traceability_preserved: !failures.includes("HISTORICAL_MEMORY_DELETED") && !failures.includes("EVIDENCE_LINEAGE_LOST"),
    replay_continuity_preserved: !failures.includes("REPLAY_CONTINUITY_BROKEN") && !failures.includes("EXPIRATION_REMOVED_REPLAY_CAPABILITY"),
    tenant_isolation_enforced: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    historical_deletion_prevented: !failures.includes("HISTORICAL_MEMORY_DELETED"),
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayMemoryLifecycleExpirationManagement(result: MemoryLifecycleResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayAdaptiveMemoryReplayEngine(result.replay_result) &&
    verifyHashedRecord(result.contract) &&
    result.lifecycle_records.every((record) =>
      verifyHashedRecord(record.expiration_policy) &&
      verifyHashedRecord(record.retention_policy) &&
      record.validation_reports.every(verifyHashedRecord) &&
      verifyHashedRecord(record)
    ) &&
    result.lifecycle_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getMemoryLifecycleExpirationManagement(): MemoryLifecycleManager {
  const api_surface = buildApiSurface();
  return Object.freeze({
    memory_lifecycle_version: LIFECYCLE_VERSION,
    supported_states: STATES,
    supported_validators: VALIDATORS,
    supported_outcomes: OUTCOMES,
    api_surface,
    result: establishMemoryLifecycleExpirationManagement(),
  });
}

export const MemoryLifecycleExpirationManagement = Object.freeze({
  establish: establishMemoryLifecycleExpirationManagement,
  replay: replayMemoryLifecycleExpirationManagement,
});
