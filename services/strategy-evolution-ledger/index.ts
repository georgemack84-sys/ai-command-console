import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  generateStrategyImprovementProposals,
  replayStrategyImprovementProposalGeneration,
} from "@/services/strategy-improvement-proposal-generator";
import type {
  StrategyEvolutionLedgerApiSurface,
  StrategyEvolutionLedgerFailure,
  StrategyEvolutionLedgerFoundation,
  StrategyEvolutionLedgerInput,
  StrategyEvolutionLedgerRecord,
  StrategyEvolutionLedgerRegistry,
  StrategyEvolutionLedgerResult,
  StrategyEvolutionLedgerValidation,
} from "@/types/strategy-evolution-ledger";

const STRATEGY_EVOLUTION_LEDGER_VERSION = "strategy-evolution-ledger/v1" as const;
const LEDGER_TIMESTAMP = "2026-07-09T00:00:00.000Z";
const GENESIS_PREVIOUS_HASH = "GENESIS";

type Scenario = NonNullable<StrategyEvolutionLedgerInput["scenario"]>;

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

function proposalScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_PROPOSAL: "UNCERTIFIED_UPSTREAM",
    MISSING_REPLAY: "MISSING_REPLAY",
    MISSING_ROLLBACK: "MISSING_ROLLBACK",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "BASELINE";
}

function sourceForScenario(input: StrategyEvolutionLedgerInput, scenario: Scenario) {
  return input.proposal_result ?? generateStrategyImprovementProposals({ scenario: proposalScenario(scenario) });
}

function buildApiSurface(): StrategyEvolutionLedgerApiSurface {
  const base: Omit<StrategyEvolutionLedgerApiSurface, "integrity_hash"> = {
    api_id: "strategy_evolution_ledger_api",
    record_proposal: "POST /strategy-evolution-ledger/record",
    retrieve_records: "POST /strategy-evolution-ledger/records",
    retrieve_versions: "POST /strategy-evolution-ledger/versions",
    retrieve_lineage: "POST /strategy-evolution-ledger/lineage",
    verify_integrity: "POST /strategy-evolution-ledger/integrity",
    replay_ledger: "POST /strategy-evolution-ledger/replay",
    retrieve_rollback: "POST /strategy-evolution-ledger/rollback",
    retrieve_registry: "POST /strategy-evolution-ledger/registry",
    retrieve_contract: "GET /strategy-evolution-ledger/contract",
    update_supported: false,
    delete_supported: false,
    overwrite_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: StrategyEvolutionLedgerInput, scenario: Scenario): StrategyEvolutionLedgerRecord {
  const proposalResult = sourceForScenario(input, scenario);
  const proposal = proposalResult.proposals[0];
  const proposalId = scenario === "MISSING_PROPOSAL_ID" ? "" : proposal?.proposal_id ?? "";
  const proposalVersion = scenario === "MISSING_VERSION" ? "" : scenario === "REVISION" ? "v2" : "v1";
  const parentVersionRef = scenario === "MISSING_LINEAGE" ? "" : scenario === "REVISION" ? `${proposalId}:v1` : "origin";
  const previousHash = scenario === "REVISION" ? hash(`${proposalId}:v1`) : GENESIS_PREVIOUS_HASH;
  const base: Omit<StrategyEvolutionLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `strategy_evolution_ledger_${hash(`${proposalId}:${proposalVersion}:${scenario}`).slice(0, 16)}`,
    proposal_id: proposalId,
    proposal_version: proposalVersion,
    tenant_id: scenario === "CROSS_TENANT" ? `${proposal?.tenant_id ?? "tenant_mission_control"}:foreign` : proposal?.tenant_id ?? "tenant_mission_control",
    mission_scope: proposal?.mission_scope ?? "mission_scope_unknown",
    strategy_area: proposal?.strategy_area ?? "PRIORITIZATION",
    lifecycle_state: scenario === "SUPERSEDED" ? "SUPERSEDED" : scenario === "ARCHIVED" ? "ARCHIVED" : "IMMUTABLE",
    parent_version_ref: parentVersionRef,
    superseded_by_ref: scenario === "SUPERSEDED" ? `${proposalId}:v2` : "",
    supporting_proposal_refs: proposalId ? freezeArray([proposalId]) : freezeArray([]),
    governance_decision_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_decision_ref_strategy_review_1"]),
    simulation_refs: scenario === "MISSING_SIMULATION" ? freezeArray([]) : freezeArray(["simulation_ref_strategy_evolution_1"]),
    certification_refs: scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : freezeArray(["certification_ref_strategy_evolution_1"]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : proposal?.replay_refs ?? freezeArray([]),
    rollback_refs: scenario === "MISSING_ROLLBACK" ? freezeArray([]) : proposal?.rollback_plan_ref ? freezeArray([proposal.rollback_plan_ref]) : freezeArray([]),
    lineage_refs: scenario === "MISSING_LINEAGE" ? freezeArray([]) : freezeArray([parentVersionRef, proposalId].filter(Boolean)),
    previous_hash: scenario === "PREVIOUS_HASH_MISMATCH" ? hash("tampered_previous_hash") : previousHash,
    ledger_timestamp: LEDGER_TIMESTAMP,
    append_only: true,
    immutable: true,
    deleted: scenario === "LEDGER_MUTATION",
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.ledger_record_id }) });
  return record;
}

function buildRecords(input: StrategyEvolutionLedgerInput, scenario: Scenario): readonly StrategyEvolutionLedgerRecord[] {
  if (scenario === "UNCERTIFIED_PROPOSAL") return freezeArray([]);
  const record = buildRecord(input, scenario);
  if (scenario === "VERSION_OVERWRITE") return freezeArray([record, Object.freeze({ ...record, ledger_record_id: `${record.ledger_record_id}_duplicate` })]);
  return freezeArray([record]);
}

function buildRegistry(records: readonly StrategyEvolutionLedgerRecord[], scenario: Scenario): StrategyEvolutionLedgerRegistry {
  const proposal_version_index = records.reduce((index, record) => {
    return { ...index, [record.proposal_id]: freezeArray([...(index[record.proposal_id] ?? []), record.proposal_version]) };
  }, {} as Record<string, readonly string[]>);
  const lineage_index = records.reduce((index, record) => {
    return { ...index, [record.proposal_id]: freezeArray([...(index[record.proposal_id] ?? []), ...record.lineage_refs]) };
  }, {} as Record<string, readonly string[]>);
  const base: Omit<StrategyEvolutionLedgerRegistry, "integrity_hash"> = {
    registry_id: `strategy_evolution_ledger_registry_${hash(records.map((record) => record.ledger_record_id)).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${records[0]?.tenant_id ?? "tenant_mission_control"}:foreign` : records[0]?.tenant_id ?? "tenant_mission_control",
    ledger_record_refs: records.map((record) => record.ledger_record_id),
    proposal_version_index: Object.freeze(proposal_version_index),
    lineage_index: Object.freeze(lineage_index),
    previous_hash_chain: freezeArray(records.map((record) => record.previous_hash)),
    append_only: scenario !== "APPEND_ONLY_VIOLATION",
    immutable: true,
    deleted: scenario === "LEDGER_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: StrategyEvolutionLedgerInput, proposalResult: ReturnType<typeof sourceForScenario>, records: readonly StrategyEvolutionLedgerRecord[], registry: StrategyEvolutionLedgerRegistry, scenario: Scenario): readonly StrategyEvolutionLedgerFailure[] {
  const failures: StrategyEvolutionLedgerFailure[] = [];
  if (scenario === "UNCERTIFIED_PROPOSAL" || !proposalResult.validation.certified) failures.push("PROPOSAL_GENERATOR_UNCERTIFIED");
  if (scenario === "MISSING_PROPOSAL_ID" || records.some((record) => !record.proposal_id)) failures.push("PROPOSAL_IDENTIFIER_MISSING");
  if (scenario === "MISSING_VERSION" || records.some((record) => !record.proposal_version)) failures.push("PROPOSAL_VERSION_MISSING");
  if (scenario === "VERSION_OVERWRITE" || new Set(records.map((record) => `${record.proposal_id}:${record.proposal_version}`)).size !== records.length) failures.push("VERSION_OVERWRITE_ATTEMPTED");
  if (scenario === "LEDGER_MUTATION" || registry.deleted || records.some((record) => record.deleted)) failures.push("LEDGER_MUTATION_ATTEMPTED");
  if (scenario === "MISSING_LINEAGE" || records.some((record) => !record.parent_version_ref || !record.lineage_refs.length)) failures.push("LINEAGE_REFERENCE_INCOMPLETE");
  if (scenario === "MISSING_REPLAY" || records.some((record) => !record.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_ROLLBACK" || records.some((record) => !record.rollback_refs.length)) failures.push("ROLLBACK_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || records.some((record) => !record.governance_decision_refs.length)) failures.push("GOVERNANCE_REFERENCES_INCOMPLETE");
  if (scenario === "MISSING_SIMULATION" || records.some((record) => !record.simulation_refs.length)) failures.push("SIMULATION_REFERENCES_MISSING");
  if (scenario === "MISSING_CERTIFICATION" || records.some((record) => !record.certification_refs.length)) failures.push("CERTIFICATION_REFERENCES_MISSING");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "PREVIOUS_HASH_MISMATCH" || records.some((record) => record.previous_hash !== GENESIS_PREVIOUS_HASH && record.previous_hash !== hash(`${record.proposal_id}:v1`))) failures.push("PREVIOUS_HASH_MISMATCH");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== (records[0]?.tenant_id ?? registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "APPEND_ONLY_VIOLATION" || !registry.append_only) failures.push("APPEND_ONLY_VIOLATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly StrategyEvolutionLedgerFailure[]): StrategyEvolutionLedgerValidation["state"] {
  if (failures.some((failure) => failure.includes("REFERENCES") || failure.includes("LINEAGE"))) return "PENDING_REFERENCES";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(proposalResult: ReturnType<typeof sourceForScenario>, records: readonly StrategyEvolutionLedgerRecord[], registry: StrategyEvolutionLedgerRegistry, failures: readonly StrategyEvolutionLedgerFailure[]): StrategyEvolutionLedgerValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategyEvolutionLedgerValidation, "integrity_hash"> = {
    validation_id: "strategy_evolution_ledger_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && registryVerified,
    failures,
    proposal_generator_certified: proposalResult.validation.certified,
    proposal_identity_complete: !failures.includes("PROPOSAL_IDENTIFIER_MISSING"),
    version_complete: !failures.includes("PROPOSAL_VERSION_MISSING"),
    version_not_overwritten: !failures.includes("VERSION_OVERWRITE_ATTEMPTED"),
    ledger_not_mutated: !failures.includes("LEDGER_MUTATION_ATTEMPTED"),
    lineage_complete: !failures.includes("LINEAGE_REFERENCE_INCOMPLETE"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    rollback_complete: !failures.includes("ROLLBACK_REFERENCES_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_INCOMPLETE"),
    simulation_complete: !failures.includes("SIMULATION_REFERENCES_MISSING"),
    certification_complete: !failures.includes("CERTIFICATION_REFERENCES_MISSING"),
    previous_hash_verified: !failures.includes("PREVIOUS_HASH_MISMATCH"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    append_only: !failures.includes("APPEND_ONLY_VIOLATION"),
    registry_immutable: registry.immutable && !registry.deleted,
    integrity_verified: recordsVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategyEvolutionLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    proposal_replay_hash: result.proposal_result.replay_hash,
    records: result.records,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategyEvolutionLedgerResult, "integrity_hash">): string {
  return hash({
    strategy_evolution_ledger_version: result.strategy_evolution_ledger_version,
    api_surface_hash: result.api_surface.integrity_hash,
    record_hashes: result.records.map((record) => record.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function recordStrategyEvolutionLedger(input: StrategyEvolutionLedgerInput = {}): StrategyEvolutionLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const proposal_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const records = buildRecords(input, scenario);
  const registry = buildRegistry(records, scenario);
  const validationFailures = collectFailures(input, proposal_result, records, registry, scenario);
  const validation = buildValidation(proposal_result, records, registry, validationFailures);
  const base: Omit<StrategyEvolutionLedgerResult, "integrity_hash" | "replay_hash"> = {
    strategy_evolution_ledger_version: STRATEGY_EVOLUTION_LEDGER_VERSION,
    proposal_result,
    api_surface,
    records,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    append_only: validation.append_only,
    immutable: validation.registry_immutable,
    tenant_isolated: validation.tenant_isolated,
    governance_protected: validation.governance_complete,
    constitutionally_compliant: validation.certified,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategyEvolutionLedger(result: StrategyEvolutionLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash
    && resultIntegrityHash(result) === result.integrity_hash
    && replayStrategyImprovementProposalGeneration(result.proposal_result);
}

export function getStrategyEvolutionLedgerFoundation(): StrategyEvolutionLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategy_evolution_ledger_version: STRATEGY_EVOLUTION_LEDGER_VERSION,
    api_surface,
    result: recordStrategyEvolutionLedger(),
  });
}

export const StrategyEvolutionLedger = Object.freeze({
  record: recordStrategyEvolutionLedger,
  replay: replayStrategyEvolutionLedger,
});
