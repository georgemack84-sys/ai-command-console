import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  replayStrategyEvolutionExplainability,
  replayStrategyReplayExplainability,
} from "@/services/strategy-replay-explainability-engine";
import type {
  StrategyEvolutionCertificationApiSurface,
  StrategyEvolutionCertificationFailure,
  StrategyEvolutionCertificationFoundation,
  StrategyEvolutionCertificationInput,
  StrategyEvolutionCertificationRecord,
  StrategyEvolutionCertificationRegistry,
  StrategyEvolutionCertificationResult,
  StrategyEvolutionCertificationStatus,
  StrategyEvolutionCertificationValidation,
} from "@/types/strategy-evolution-certification-gate";

const CERTIFICATION_VERSION = "strategy-evolution-certification-gate/v1" as const;
const CERTIFICATION_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<StrategyEvolutionCertificationInput["scenario"]>;

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

function replayScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_REPLAY: "UNCERTIFIED_SIMULATION",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_PATTERNS: "MISSING_PATTERN",
    MISSING_OUTCOMES: "MISSING_OUTCOME",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_OPERATOR: "MISSING_OPERATOR",
    MISSING_REPLAY: "MISSING_SIMULATION",
    MISSING_LINEAGE: "MISSING_PROPOSAL",
    REPLAY_DIVERGENCE: "NONDETERMINISTIC_RECONSTRUCTION",
    HIDDEN_REASONING: "HIDDEN_REASONING",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    STRATEGY_MUTATION: "ADVISORY_VIOLATION",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "BASELINE";
}

function sourceForScenario(input: StrategyEvolutionCertificationInput, scenario: Scenario) {
  return input.replay_result ?? replayStrategyEvolutionExplainability({ scenario: replayScenario(scenario) });
}

function buildApiSurface(): StrategyEvolutionCertificationApiSurface {
  const base: Omit<StrategyEvolutionCertificationApiSurface, "integrity_hash"> = {
    api_id: "strategy_evolution_certification_gate_api",
    certify_strategy_evolution: "POST /strategy-evolution-certification-gate/certify",
    retrieve_records: "POST /strategy-evolution-certification-gate/records",
    retrieve_decision: "POST /strategy-evolution-certification-gate/decision",
    retrieve_functional: "POST /strategy-evolution-certification-gate/functional",
    retrieve_governance: "POST /strategy-evolution-certification-gate/governance",
    retrieve_constitutional: "POST /strategy-evolution-certification-gate/constitutional",
    retrieve_simulation: "POST /strategy-evolution-certification-gate/simulation",
    replay_certification: "POST /strategy-evolution-certification-gate/replay",
    retrieve_integrity: "POST /strategy-evolution-certification-gate/integrity",
    retrieve_registry: "POST /strategy-evolution-certification-gate/registry",
    retrieve_contract: "GET /strategy-evolution-certification-gate/contract",
    update_supported: false,
    delete_supported: false,
    production_promotion_supported: false,
    strategy_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failuresForScenario(scenario: Scenario): readonly StrategyEvolutionCertificationFailure[] {
  const map: Partial<Record<Scenario, StrategyEvolutionCertificationFailure>> = {
    UNCERTIFIED_REPLAY: "REPLAY_EXPLAINABILITY_UNCERTIFIED",
    INVALID_CONTRACT: "STRATEGY_EVOLUTION_CONTRACT_INVALID",
    NONDETERMINISTIC_PROPOSAL: "PROPOSAL_GENERATION_NONDETERMINISTIC",
    MISSING_EVIDENCE: "SUPPORTING_EVIDENCE_INCOMPLETE",
    MISSING_PATTERNS: "SUPPORTING_PATTERNS_ABSENT",
    MISSING_OUTCOMES: "SUPPORTING_OUTCOMES_MISSING",
    MISSING_GOVERNANCE: "GOVERNANCE_IMPLICATIONS_MISSING",
    MISSING_CONSTITUTIONAL: "CONSTITUTIONAL_IMPLICATIONS_MISSING",
    MISSING_OPERATOR: "OPERATOR_IMPACT_UNDOCUMENTED",
    SIMULATION_BYPASS: "SIMULATION_REQUIREMENT_BYPASSED",
    APPROVAL_BYPASS: "APPROVAL_REQUIREMENT_BYPASSED",
    CERTIFICATION_BYPASS: "CERTIFICATION_REQUIREMENT_BYPASSED",
    MISSING_ROLLBACK: "ROLLBACK_PLAN_ABSENT",
    MISSING_REPLAY: "REPLAY_REFERENCES_INCOMPLETE",
    MISSING_LINEAGE: "PROPOSAL_LINEAGE_INCOMPLETE",
    REPLAY_DIVERGENCE: "REPLAY_RECONSTRUCTION_DIVERGED",
    HIDDEN_REASONING: "HIDDEN_REASONING_DETECTED",
    STRATEGY_MUTATION: "UNAUTHORIZED_STRATEGY_MUTATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_REVIEW_BYPASSED",
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_REVIEW_BYPASSED",
    CROSS_TENANT: "TENANT_ISOLATION_VIOLATED",
    HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
    FAIL_OPEN: "FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED",
    CONDITIONAL_PASS: "NON_FUNCTIONAL_DEFICIENCY_REMAINING",
    REGISTRY_MUTATION: "REGISTRY_MUTATION_DETECTED",
  };
  const failure = map[scenario];
  return failure ? freezeArray([failure]) : freezeArray([]);
}

function statusFor(failures: readonly StrategyEvolutionCertificationFailure[], relevant: readonly StrategyEvolutionCertificationFailure[]): StrategyEvolutionCertificationStatus {
  return failures.some((failure) => relevant.includes(failure)) ? "FAIL" : "PASS";
}

function buildRecord(source: ReturnType<typeof sourceForScenario>, scenario: Scenario): StrategyEvolutionCertificationRecord {
  const replayRecord = source.replay_records[0];
  const proposalRefs = replayRecord?.proposal_refs.length ? replayRecord.proposal_refs : replayRecord?.proposal_id ? freezeArray([replayRecord.proposal_id]) : freezeArray([]);
  const scenarioFailures = failuresForScenario(scenario);
  const replayFailures: readonly StrategyEvolutionCertificationFailure[] = source.validation.certified ? freezeArray([]) : freezeArray(["REPLAY_EXPLAINABILITY_UNCERTIFIED"]);
  const failed_test_refs = freezeArray([...new Set([...scenarioFailures, ...replayFailures])]);
  const outcome = scenario === "CONDITIONAL_PASS" ? "CONDITIONAL_PASS" : failed_test_refs.length ? "FAIL" : "PASS";
  const base: Omit<StrategyEvolutionCertificationRecord, "integrity_hash"> = {
    certification_id: `strategy_evolution_certification_${hash(`${replayRecord?.replay_id ?? "missing"}:${scenario}`).slice(0, 16)}`,
    certification_version: "v1",
    tenant_id: scenario === "CROSS_TENANT" ? `${replayRecord?.tenant_id ?? "tenant_mission_control"}:foreign` : replayRecord?.tenant_id ?? "tenant_mission_control",
    mission_scope: replayRecord?.mission_scope ?? "mission_scope_unknown",
    proposal_refs: proposalRefs,
    functional_validation_status: statusFor(failed_test_refs, ["STRATEGY_EVOLUTION_CONTRACT_INVALID", "PROPOSAL_GENERATION_NONDETERMINISTIC", "REPLAY_EXPLAINABILITY_UNCERTIFIED"]),
    governance_validation_status: statusFor(failed_test_refs, ["GOVERNANCE_IMPLICATIONS_MISSING", "GOVERNANCE_REVIEW_BYPASSED"]),
    constitutional_validation_status: statusFor(failed_test_refs, ["CONSTITUTIONAL_IMPLICATIONS_MISSING", "CONSTITUTIONAL_REVIEW_BYPASSED", "UNAUTHORIZED_STRATEGY_MUTATION_DETECTED", "TENANT_ISOLATION_VIOLATED", "FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"]),
    simulation_validation_status: statusFor(failed_test_refs, ["SIMULATION_REQUIREMENT_BYPASSED"]),
    replay_validation_status: statusFor(failed_test_refs, ["REPLAY_REFERENCES_INCOMPLETE", "PROPOSAL_LINEAGE_INCOMPLETE", "REPLAY_RECONSTRUCTION_DIVERGED", "REPLAY_EXPLAINABILITY_UNCERTIFIED"]),
    explainability_validation_status: statusFor(failed_test_refs, ["HIDDEN_REASONING_DETECTED", "SUPPORTING_EVIDENCE_INCOMPLETE", "SUPPORTING_PATTERNS_ABSENT", "SUPPORTING_OUTCOMES_MISSING", "OPERATOR_IMPACT_UNDOCUMENTED"]),
    integrity_validation_status: statusFor(failed_test_refs, ["INTEGRITY_HASH_MISMATCH", "TENANT_ISOLATION_VIOLATED", "REGISTRY_MUTATION_DETECTED"]),
    certification_outcome: outcome,
    failed_test_refs,
    remediation_requirements: outcome === "PASS" ? freezeArray([]) : freezeArray(failed_test_refs.map((failure) => `Resolve ${failure.toLowerCase()} before production readiness.`)),
    reviewer_refs: freezeArray(["strategy_evolution_certification_gate"]),
    certification_timestamp: CERTIFICATION_TIMESTAMP,
    production_ready: outcome === "PASS",
    advisory_only_verified: !failed_test_refs.includes("UNAUTHORIZED_STRATEGY_MUTATION_DETECTED"),
    mutation_blocked: !failed_test_refs.includes("UNAUTHORIZED_STRATEGY_MUTATION_DETECTED"),
    tenant_isolation_verified: !failed_test_refs.includes("TENANT_ISOLATION_VIOLATED"),
    fail_closed_verified: !failed_test_refs.includes("FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"),
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.certification_id }) });
  return record;
}

function buildRecords(source: ReturnType<typeof sourceForScenario>, scenario: Scenario): readonly StrategyEvolutionCertificationRecord[] {
  return freezeArray([buildRecord(source, scenario)]);
}

function buildRegistry(records: readonly StrategyEvolutionCertificationRecord[], scenario: Scenario): StrategyEvolutionCertificationRegistry {
  const outcome_index = records.reduce((index, record) => {
    return { ...index, [record.certification_outcome]: freezeArray([...(index[record.certification_outcome] ?? []), record.certification_id]) };
  }, {} as Record<StrategyEvolutionCertificationRecord["certification_outcome"], readonly string[]>);
  const proposal_index = records.reduce((index, record) => {
    return record.proposal_refs.reduce((nested, proposalRef) => {
      return { ...nested, [proposalRef]: freezeArray([...(nested[proposalRef] ?? []), record.certification_id]) };
    }, index);
  }, {} as Record<string, readonly string[]>);
  const base: Omit<StrategyEvolutionCertificationRegistry, "integrity_hash"> = {
    registry_id: `strategy_evolution_certification_registry_${hash(records.map((record) => record.certification_id)).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${records[0]?.tenant_id ?? "tenant_mission_control"}:foreign` : records[0]?.tenant_id ?? "tenant_mission_control",
    certification_refs: records.map((record) => record.certification_id),
    outcome_index: Object.freeze(outcome_index),
    proposal_index: Object.freeze(proposal_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(source: ReturnType<typeof sourceForScenario>, records: readonly StrategyEvolutionCertificationRecord[], registry: StrategyEvolutionCertificationRegistry, scenario: Scenario): readonly StrategyEvolutionCertificationFailure[] {
  const failures: StrategyEvolutionCertificationFailure[] = [];
  for (const failure of failuresForScenario(scenario)) failures.push(failure);
  if (!source.validation.certified) failures.push("REPLAY_EXPLAINABILITY_UNCERTIFIED");
  if (records.some((record) => record.functional_validation_status === "FAIL")) failures.push("PROPOSAL_GENERATION_NONDETERMINISTIC");
  if (scenario === "MISSING_ROLLBACK") failures.push("ROLLBACK_PLAN_ABSENT");
  if (scenario === "APPROVAL_BYPASS") failures.push("APPROVAL_REQUIREMENT_BYPASSED");
  if (scenario === "CERTIFICATION_BYPASS") failures.push("CERTIFICATION_REQUIREMENT_BYPASSED");
  if (!replayStrategyReplayExplainability(source)) failures.push("REPLAY_RECONSTRUCTION_DIVERGED");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== (records[0]?.tenant_id ?? registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  return freezeArray([...new Set(failures)]);
}

function stateFor(records: readonly StrategyEvolutionCertificationRecord[], failures: readonly StrategyEvolutionCertificationFailure[]): StrategyEvolutionCertificationValidation["state"] {
  if (records.some((record) => record.certification_outcome === "CONDITIONAL_PASS")) return "CONDITIONAL";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(source: ReturnType<typeof sourceForScenario>, records: readonly StrategyEvolutionCertificationRecord[], registry: StrategyEvolutionCertificationRegistry, failures: readonly StrategyEvolutionCertificationFailure[]): StrategyEvolutionCertificationValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategyEvolutionCertificationValidation, "integrity_hash"> = {
    validation_id: "strategy_evolution_certification_gate_validation",
    state: stateFor(records, failures),
    certified: failures.length === 0 && records.every((record) => record.certification_outcome === "PASS") && recordsVerified && registryVerified,
    failures,
    replay_explainability_certified: source.validation.certified,
    functional_validated: !failures.includes("STRATEGY_EVOLUTION_CONTRACT_INVALID") && !failures.includes("PROPOSAL_GENERATION_NONDETERMINISTIC"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_INCOMPLETE") && !failures.includes("SUPPORTING_PATTERNS_ABSENT") && !failures.includes("SUPPORTING_OUTCOMES_MISSING"),
    governance_validated: !failures.includes("GOVERNANCE_IMPLICATIONS_MISSING") && !failures.includes("GOVERNANCE_REVIEW_BYPASSED"),
    constitutional_validated: !failures.includes("CONSTITUTIONAL_IMPLICATIONS_MISSING") && !failures.includes("CONSTITUTIONAL_REVIEW_BYPASSED"),
    simulation_validated: !failures.includes("SIMULATION_REQUIREMENT_BYPASSED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_INCOMPLETE") && !failures.includes("REPLAY_RECONSTRUCTION_DIVERGED"),
    explainability_validated: !failures.includes("HIDDEN_REASONING_DETECTED"),
    integrity_validated: !failures.includes("INTEGRITY_HASH_MISMATCH") && recordsVerified && registryVerified,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    advisory_only: !failures.includes("UNAUTHORIZED_STRATEGY_MUTATION_DETECTED"),
    mutation_blocked: !failures.includes("UNAUTHORIZED_STRATEGY_MUTATION_DETECTED"),
    fail_closed: !failures.includes("FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"),
    production_ready: failures.length === 0 && records.every((record) => record.production_ready),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: recordsVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategyEvolutionCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    replay_hash: result.replay_result.replay_hash,
    certification_records: result.certification_records,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategyEvolutionCertificationResult, "integrity_hash">): string {
  return hash({
    strategy_evolution_certification_gate_version: result.strategy_evolution_certification_gate_version,
    api_surface_hash: result.api_surface.integrity_hash,
    certification_hashes: result.certification_records.map((record) => record.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function certifyStrategyEvolution(input: StrategyEvolutionCertificationInput = {}): StrategyEvolutionCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const replay_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const certification_records = buildRecords(replay_result, scenario);
  const registry = buildRegistry(certification_records, scenario);
  const validationFailures = collectFailures(replay_result, certification_records, registry, scenario);
  const validation = buildValidation(replay_result, certification_records, registry, validationFailures);
  const certification_outcome = certification_records[0]?.certification_outcome ?? "FAIL";
  const base: Omit<StrategyEvolutionCertificationResult, "integrity_hash" | "replay_hash"> = {
    strategy_evolution_certification_gate_version: CERTIFICATION_VERSION,
    replay_result,
    api_surface,
    certification_records,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    certification_outcome,
    production_ready: validation.production_ready,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: validation.advisory_only,
    mutates_strategy: false,
    authorizes_adoption: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategyEvolutionCertification(result: StrategyEvolutionCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash
    && resultIntegrityHash(result) === result.integrity_hash
    && replayStrategyReplayExplainability(result.replay_result);
}

export function getStrategyEvolutionCertificationFoundation(): StrategyEvolutionCertificationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategy_evolution_certification_gate_version: CERTIFICATION_VERSION,
    api_surface,
    result: certifyStrategyEvolution(),
  });
}

export const StrategyEvolutionCertificationGate = Object.freeze({
  certify: certifyStrategyEvolution,
  replay: replayStrategyEvolutionCertification,
});
