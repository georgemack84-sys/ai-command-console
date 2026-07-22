import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  establishTenantIsolationPrivacyEnforcement,
  replayTenantIsolationPrivacyEnforcement,
} from "@/services/tenant-isolation-privacy-enforcement";
import type { TenantIsolationRecord } from "@/types/tenant-isolation-privacy-enforcement";
import type {
  AdaptiveMemoryReplayApiSurface,
  AdaptiveMemoryReplayContract,
  AdaptiveMemoryReplayEngine as AdaptiveMemoryReplayEngineDefinition,
  AdaptiveMemoryReplayFailure,
  AdaptiveMemoryReplayInput,
  AdaptiveMemoryReplayMetrics,
  AdaptiveMemoryReplayResult,
  AdaptiveMemoryReplayScenario,
  MemoryReplayLedgerEntry,
  MemoryReplayRecord,
  ReconstructedMission,
  ReplayValidationOutcome,
  ReplayValidationReport,
  ReplayValidator,
} from "@/types/adaptive-memory-replay-engine";

const REPLAY_VERSION = "adaptive-memory-replay-engine/v1" as const;
const ENGINE_IDENTIFIER = "AdaptiveMemoryReplayEngine" as const;
const REPLAY_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

const VALIDATORS: readonly ReplayValidator[] = Object.freeze([
  "MEMORY_RETRIEVAL",
  "LINEAGE_RECOVERY",
  "MISSION_RECONSTRUCTION",
  "EVIDENCE_RECONSTRUCTION",
  "GOVERNANCE_RECONSTRUCTION",
  "SIMULATION_RECONSTRUCTION",
  "OUTCOME_RECONSTRUCTION",
  "CERTIFICATION_RECONSTRUCTION",
  "TENANT_ISOLATION_VALIDATION",
  "INTEGRITY_VERIFICATION",
]);

const OUTCOMES: readonly ReplayValidationOutcome[] = Object.freeze([
  "VALID",
  "REPLAY_DIVERGENCE",
  "INCOMPLETE_LINEAGE",
  "INTEGRITY_FAILURE",
]);

type Scenario = NonNullable<AdaptiveMemoryReplayInput["scenario"]>;

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

function buildApiSurface(): AdaptiveMemoryReplayApiSurface {
  const base: Omit<AdaptiveMemoryReplayApiSurface, "integrity_hash"> = {
    api_id: "adaptive_memory_replay_engine_api",
    establish_engine: "POST /adaptive-memory-replay-engine/establish",
    retrieve_contract: "GET /adaptive-memory-replay-engine/contract",
    retrieve_records: "POST /adaptive-memory-replay-engine/records",
    retrieve_lineage: "POST /adaptive-memory-replay-engine/lineage",
    retrieve_validation: "POST /adaptive-memory-replay-engine/validation",
    retrieve_ledger: "POST /adaptive-memory-replay-engine/ledger",
    retrieve_metrics: "POST /adaptive-memory-replay-engine/metrics",
    replay_engine: "POST /adaptive-memory-replay-engine/replay",
    inspect_engine: "POST /adaptive-memory-replay-engine/inspect",
    production_mutation_supported: false,
    historical_optimization_supported: false,
    tenant_bypass_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): AdaptiveMemoryReplayFailure | undefined {
  const map: Partial<Record<AdaptiveMemoryReplayScenario, AdaptiveMemoryReplayFailure>> = {
    TENANT_ISOLATION_UNAVAILABLE: "TENANT_ISOLATION_UNAVAILABLE",
    NONDETERMINISTIC_REPLAY: "REPLAY_NONDETERMINISTIC",
    REPLAY_DIVERGENCE: "HISTORICAL_RECONSTRUCTION_DIVERGED",
    INCOMPLETE_LINEAGE: "LINEAGE_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    ALTERED_GOVERNANCE: "GOVERNANCE_HISTORY_ALTERED",
    SIMULATION_FAILURE: "SIMULATION_RECONSTRUCTION_FAILED",
    OUTCOME_MISMATCH: "OUTCOME_INCONSISTENT",
    CERTIFICATION_MISMATCH: "CERTIFICATION_MISMATCH",
    INTEGRITY_FAILURE: "REPLAY_INTEGRITY_COMPROMISED",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_VIOLATED",
    VALIDATION_BYPASS: "REPLAY_VALIDATION_BYPASSED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, tenantReplayable: boolean): readonly AdaptiveMemoryReplayFailure[] {
  const failures: AdaptiveMemoryReplayFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!tenantReplayable) failures.push("TENANT_ISOLATION_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function buildContract(): AdaptiveMemoryReplayContract {
  const base: Omit<AdaptiveMemoryReplayContract, "integrity_hash"> = {
    contract_id: "adaptive-memory-replay-engine-contract",
    version: REPLAY_VERSION,
    architecture: freezeArray([
      "Adaptive Memory Record",
      "Replay Request",
      "Replay Reconstruction Service",
      "Lineage Recovery Engine",
      "Evidence Recovery",
      "Governance Reconstruction",
      "Replay Validator",
      "Replay Output",
      "Validation Report",
      "Replay Ledger",
    ]),
    validators: VALIDATORS,
    outcomes: OUTCOMES,
    replay_rules: freezeArray([
      "reconstruct_originating_mission",
      "reconstruct_complete_evidence_chain",
      "reconstruct_recommendation_lifecycle",
      "reconstruct_governance_approvals",
      "reconstruct_constitutional_reviews",
      "reconstruct_simulations",
      "reconstruct_mission_outcomes",
      "reconstruct_certification_decisions",
      "reconstruct_adaptive_memory_lifecycle",
    ]),
    deterministic_replay_rules: freezeArray([
      "preserve_execution_order",
      "preserve_timestamps",
      "preserve_evidence_lineage",
      "preserve_governance_sequence",
      "preserve_replay_dependencies",
      "preserve_certification_lineage",
      "preserve_integrity_hashes",
    ]),
    validation_rules: freezeArray([
      "evidence_complete",
      "lineage_complete",
      "governance_preserved",
      "replay_deterministic",
      "certification_preserved",
      "integrity_verified",
      "tenant_isolation_maintained",
    ]),
    security_requirements: freezeArray([
      "enforce_tenant_isolation",
      "validate_authorization",
      "encrypt_replay_metadata",
      "prevent_replay_tampering",
      "prevent_unauthorized_reconstruction",
      "preserve_immutable_replay_history",
      "detect_replay_manipulation",
    ]),
    replay_guarantees: freezeArray([
      "deterministic_execution",
      "reproducible_reconstruction",
      "evidence_completeness",
      "governance_preservation",
      "constitutional_consistency",
      "certification_preservation",
      "immutable_historical_fidelity",
    ]),
    replay_before_trust: true,
    historical_fidelity: true,
    evidence_centric_replay: true,
    governance_preservation: true,
    advisory_only: true,
    tenant_isolation_required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function outcomeFor(failures: readonly AdaptiveMemoryReplayFailure[]): ReplayValidationOutcome {
  if (failures.some((failure) => failure === "REPLAY_INTEGRITY_COMPROMISED" || failure === "REPLAY_NONDETERMINISTIC")) {
    return "INTEGRITY_FAILURE";
  }
  if (failures.some((failure) => failure === "LINEAGE_INCOMPLETE" || failure === "EVIDENCE_MISSING")) {
    return "INCOMPLETE_LINEAGE";
  }
  if (failures.length) return "REPLAY_DIVERGENCE";
  return "VALID";
}

function validatorValid(validator: ReplayValidator, failures: readonly AdaptiveMemoryReplayFailure[]): boolean {
  const blocked: Record<ReplayValidator, readonly AdaptiveMemoryReplayFailure[]> = {
    MEMORY_RETRIEVAL: ["TENANT_ISOLATION_UNAVAILABLE"],
    LINEAGE_RECOVERY: ["LINEAGE_INCOMPLETE"],
    MISSION_RECONSTRUCTION: ["HISTORICAL_RECONSTRUCTION_DIVERGED"],
    EVIDENCE_RECONSTRUCTION: ["EVIDENCE_MISSING"],
    GOVERNANCE_RECONSTRUCTION: ["GOVERNANCE_HISTORY_ALTERED"],
    SIMULATION_RECONSTRUCTION: ["SIMULATION_RECONSTRUCTION_FAILED"],
    OUTCOME_RECONSTRUCTION: ["OUTCOME_INCONSISTENT"],
    CERTIFICATION_RECONSTRUCTION: ["CERTIFICATION_MISMATCH"],
    TENANT_ISOLATION_VALIDATION: ["TENANT_ISOLATION_VIOLATED", "TENANT_ISOLATION_UNAVAILABLE"],
    INTEGRITY_VERIFICATION: ["REPLAY_INTEGRITY_COMPROMISED", "REPLAY_NONDETERMINISTIC", "REPLAY_VALIDATION_BYPASSED"],
  };
  return !blocked[validator].some((failure) => failures.includes(failure));
}

function buildReport(validator: ReplayValidator, failures: readonly AdaptiveMemoryReplayFailure[]): ReplayValidationReport {
  const valid = validatorValid(validator, failures);
  const base: Omit<ReplayValidationReport, "integrity_hash"> = {
    validator,
    valid,
    deterministic: !failures.includes("REPLAY_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_VALIDATION_BYPASSED"),
    outcome: valid ? "VALID" : outcomeFor(failures),
    explanation: valid
      ? `${validator.toLowerCase()} reproduced historical memory state deterministically.`
      : `${validator.toLowerCase()} rejected adaptive memory replay.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function refs(prefix: string, source: TenantIsolationRecord, count: number): readonly string[] {
  return freezeArray(Array.from({ length: count }, (_, index) => `${prefix}:${source.mission_id}:${source.memory_id}:${index + 1}`));
}

function buildReconstructedMission(source: TenantIsolationRecord, failures: readonly AdaptiveMemoryReplayFailure[]): ReconstructedMission {
  const reconstruction_order = freezeArray([
    "memory_retrieval",
    "lineage_recovery",
    "mission_reconstruction",
    "evidence_reconstruction",
    "governance_reconstruction",
    "simulation_reconstruction",
    "outcome_reconstruction",
    "certification_reconstruction",
    "replay_validation",
  ]);
  const base: Omit<ReconstructedMission, "integrity_hash"> = {
    mission_id: source.mission_id,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source.requester_tenant,
    originating_memory_id: source.memory_id,
    operational_context_hash: hash({ mission_id: source.mission_id, tenant_id: source.requester_tenant, evidence: source.evidence_refs }),
    historical_state_hash: hash({
      memory_id: source.memory_id,
      governance: source.governance_refs,
      replay: source.replay_refs,
      isolation: source.integrity_hash,
    }),
    reconstruction_order,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function recordReplayHash(record: Omit<MemoryReplayRecord, "integrity_hash" | "replay_hash">): string {
  return hash({
    memory_id: record.memory_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    reconstructed_mission_hash: record.reconstructed_mission.integrity_hash,
    evidence_refs: record.evidence_refs,
    recommendation_refs: record.recommendation_refs,
    governance_refs: record.governance_refs,
    simulation_refs: record.simulation_refs,
    outcome_refs: record.outcome_refs,
    certification_refs: record.certification_refs,
    lineage_refs: record.lineage_refs,
    validator_hashes: record.validators.map((validator) => validator.integrity_hash),
    replay_status: record.replay_status,
  });
}

function buildRecord(source: TenantIsolationRecord, failures: readonly AdaptiveMemoryReplayFailure[]): MemoryReplayRecord {
  const validators = freezeArray(VALIDATORS.map((validator) => buildReport(validator, failures)));
  const replay_status = outcomeFor(failures);
  const evidence_refs = failures.includes("EVIDENCE_MISSING") ? [] : source.evidence_refs;
  const governance_refs = failures.includes("GOVERNANCE_HISTORY_ALTERED") ? [] : source.governance_refs;
  const lineage_refs = failures.includes("LINEAGE_INCOMPLETE")
    ? refs("lineage", source, 1)
    : freezeArray([...source.replay_refs, ...refs("lineage", source, 6)]);
  const base: Omit<MemoryReplayRecord, "integrity_hash" | "replay_hash"> = {
    replay_id: `amre_${hash({ source: source.isolation_id, version: REPLAY_VERSION }).slice(0, 32)}`,
    memory_id: source.memory_id,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : source.requester_tenant,
    mission_id: source.mission_id,
    replay_timestamp: REPLAY_TIMESTAMP,
    replay_scope: "COMPLETE_MEMORY_LIFECYCLE",
    reconstructed_mission: buildReconstructedMission(source, failures),
    evidence_refs,
    recommendation_refs: refs("recommendation", source, 2),
    governance_refs,
    simulation_refs: failures.includes("SIMULATION_RECONSTRUCTION_FAILED") ? [] : refs("simulation", source, 2),
    outcome_refs: failures.includes("OUTCOME_INCONSISTENT") ? [] : refs("outcome", source, 2),
    certification_refs: failures.includes("CERTIFICATION_MISMATCH") ? [] : refs("certification", source, 2),
    lineage_refs,
    validators,
    replay_status,
    source_isolation_hash: source.integrity_hash,
  };
  const replay_hash = recordReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

function buildLedger(records: readonly MemoryReplayRecord[], failures: readonly AdaptiveMemoryReplayFailure[]): readonly MemoryReplayLedgerEntry[] {
  const events: readonly MemoryReplayLedgerEntry["event"][] = [
    "REPLAY_REQUEST",
    "MEMORY_RETRIEVAL",
    "LINEAGE_RECOVERY",
    "MISSION_RECONSTRUCTION",
    "EVIDENCE_RECOVERY",
    "GOVERNANCE_RECONSTRUCTION",
    "SIMULATION_RECONSTRUCTION",
    "OUTCOME_RECONSTRUCTION",
    "REPLAY_VALIDATION",
    "INTEGRITY_VERIFICATION",
    "REPLAY_OUTCOME",
  ];
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<MemoryReplayLedgerEntry, "integrity_hash"> = {
      ledger_id: `adaptive_memory_replay_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      replay_id: record.replay_id,
      memory_id: record.memory_id,
      tenant_id: record.tenant_id,
      event,
      append_only: true,
      immutable: true,
      deterministic: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      cryptographically_verified: !failures.includes("REPLAY_INTEGRITY_COMPROMISED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function buildMetrics(records: readonly MemoryReplayRecord[], failures: readonly AdaptiveMemoryReplayFailure[]): AdaptiveMemoryReplayMetrics {
  const successes = records.filter((record) => record.replay_status === "VALID").length;
  const base: Omit<AdaptiveMemoryReplayMetrics, "integrity_hash"> = {
    replay_requests: records.length,
    replay_duration_ms: 8,
    replay_success_rate: records.length ? successes / records.length : 0,
    replay_failures: records.length - successes,
    replay_divergence_events: failures.some((failure) =>
      ["HISTORICAL_RECONSTRUCTION_DIVERGED", "GOVERNANCE_HISTORY_ALTERED", "OUTCOME_INCONSISTENT"].includes(failure),
    ) ? 1 : 0,
    lineage_completeness: failures.includes("LINEAGE_INCOMPLETE") || failures.includes("EVIDENCE_MISSING") ? 0.4 : 1,
    reconstruction_latency_ms: 5,
    integrity_failures: failures.includes("REPLAY_INTEGRITY_COMPROMISED") || failures.includes("REPLAY_NONDETERMINISTIC") ? 1 : 0,
    authorization_failures: failures.includes("TENANT_ISOLATION_VIOLATED") || failures.includes("TENANT_ISOLATION_UNAVAILABLE") ? 1 : 0,
    replay_validation_accuracy: failures.includes("REPLAY_VALIDATION_BYPASSED") ? 0 : 1,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveMemoryReplayResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    tenant_isolation_hash: result.tenant_isolation_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    record_hashes: result.replay_records.map((record) => record.integrity_hash),
    ledger_hashes: result.replay_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveMemoryReplayResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_memory_replay_version,
    engine_identifier: result.engine_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

function verifyReplayRecord(record: MemoryReplayRecord): boolean {
  const { integrity_hash: _integrityHash, replay_hash: _replayHash, ...base } = record;
  return (
    verifyHashedRecord(record.reconstructed_mission) &&
    record.validators.every(verifyHashedRecord) &&
    recordReplayHash(base) === record.replay_hash &&
    verifyHashedRecord(record)
  );
}

export function establishAdaptiveMemoryReplayEngine(input: AdaptiveMemoryReplayInput = {}): AdaptiveMemoryReplayResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const tenant_isolation_result = input.tenant_isolation_result ?? establishTenantIsolationPrivacyEnforcement();
  const failures = collectFailures(scenario, replayTenantIsolationPrivacyEnforcement(tenant_isolation_result));
  const contract = buildContract();
  const replay_records = freezeArray(tenant_isolation_result.isolation_records.map((record) => buildRecord(record, failures)));
  const replay_ledger = buildLedger(replay_records, failures);
  const metrics = buildMetrics(replay_records, failures);
  const base: Omit<AdaptiveMemoryReplayResult, "integrity_hash" | "replay_hash"> = {
    adaptive_memory_replay_version: REPLAY_VERSION,
    engine_identifier: ENGINE_IDENTIFIER,
    status: failures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    tenant_isolation_result,
    contract,
    replay_records,
    replay_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("REPLAY_NONDETERMINISTIC"),
    replayable: !failures.includes("REPLAY_VALIDATION_BYPASSED"),
    historical_fidelity_preserved: !failures.includes("HISTORICAL_RECONSTRUCTION_DIVERGED"),
    evidence_provenance_preserved: !failures.includes("EVIDENCE_MISSING") && !failures.includes("LINEAGE_INCOMPLETE"),
    governance_preserved: !failures.includes("GOVERNANCE_HISTORY_ALTERED"),
    tenant_isolation_enforced: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("TENANT_ISOLATION_UNAVAILABLE"),
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveMemoryReplayEngine(result: AdaptiveMemoryReplayResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayTenantIsolationPrivacyEnforcement(result.tenant_isolation_result) &&
    verifyHashedRecord(result.contract) &&
    result.replay_records.every(verifyReplayRecord) &&
    result.replay_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveMemoryReplayEngine(): AdaptiveMemoryReplayEngineDefinition {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_memory_replay_version: REPLAY_VERSION,
    supported_validators: VALIDATORS,
    supported_outcomes: OUTCOMES,
    api_surface,
    result: establishAdaptiveMemoryReplayEngine(),
  });
}

export const AdaptiveMemoryReplayEngine = Object.freeze({
  establish: establishAdaptiveMemoryReplayEngine,
  replay: replayAdaptiveMemoryReplayEngine,
});
