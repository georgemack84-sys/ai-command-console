import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayStrategyEvolutionContract, validateStrategyEvolutionContract } from "@/services/strategy-evolution-contract";
import type { StrategyEvolutionContractInput, StrategyEvolutionContractResult, StrategyDomain } from "@/types/strategy-evolution-contract";
import type {
  StrategicFailureApiSurface,
  StrategicFailureCategory,
  StrategicFailureFailure,
  StrategicFailureFoundation,
  StrategicFailureInput,
  StrategicFailureRecord,
  StrategicFailureRegistry,
  StrategicFailureResult,
  StrategicFailureSeverity,
  StrategicFailureValidation,
} from "@/types/strategic-failure-analyzer";

const STRATEGIC_FAILURE_VERSION = "strategic-failure-analyzer/v1" as const;

type Scenario = NonNullable<StrategicFailureInput["scenario"]>;

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

function contractScenario(scenario: Scenario): StrategyEvolutionContractInput["scenario"] {
  const map: Partial<Record<Scenario, StrategyEvolutionContractInput["scenario"]>> = {
    UNCERTIFIED_CONTRACT: "PATTERN_CERTIFICATION_MISSING",
    MISSING_EVIDENCE: "MISSING_REPLAY",
    REPLAY_FAILURE: "MISSING_REPLAY",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    ADVISORY_VIOLATION: "ADVISORY_DISABLED",
    STRATEGY_MUTATION: "AUTONOMOUS_MUTATION",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: StrategicFailureInput, scenario: Scenario): StrategyEvolutionContractResult {
  if (input.strategy_contract) return input.strategy_contract;
  return validateStrategyEvolutionContract({ scenario: contractScenario(scenario) });
}

function buildApiSurface(): StrategicFailureApiSurface {
  const base: Omit<StrategicFailureApiSurface, "integrity_hash"> = {
    api_id: "strategic_failure_analyzer_api",
    analyze_failures: "POST /strategic-failure-analyzer/analyze",
    retrieve_failures: "POST /strategic-failure-analyzer/failures",
    retrieve_classification: "POST /strategic-failure-analyzer/classification",
    retrieve_root_cause: "POST /strategic-failure-analyzer/root-cause",
    retrieve_evidence: "POST /strategic-failure-analyzer/evidence",
    retrieve_governance: "POST /strategic-failure-analyzer/governance",
    replay_analysis: "POST /strategic-failure-analyzer/replay",
    retrieve_registry: "POST /strategic-failure-analyzer/registry",
    retrieve_contract: "GET /strategic-failure-analyzer/contract",
    update_supported: false,
    delete_supported: false,
    strategy_mutation_supported: false,
    proposal_generation_supported: false,
    remediation_execution_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoryForScenario(scenario: Scenario): StrategicFailureCategory {
  const map: Partial<Record<Scenario, StrategicFailureCategory>> = {
    EVIDENCE_WEAKNESS: "EVIDENCE_WEAKNESS",
    CONFIDENCE_ERROR: "CONFIDENCE_ERROR",
    GOVERNANCE_ROUTING_ISSUE: "GOVERNANCE_ROUTING_ISSUE",
    ESCALATION_DELAY: "ESCALATION_DELAY",
    SIMULATION_GAP: "SIMULATION_GAP",
    PLANNING_FAILURE: "PLANNING_FAILURE",
  };
  return map[scenario] ?? "STRATEGY_MISMATCH";
}

function strategyAreaFor(category: StrategicFailureCategory): StrategyDomain {
  const map: Record<StrategicFailureCategory, StrategyDomain> = {
    STRATEGY_MISMATCH: "MISSION_PLANNING",
    EVIDENCE_WEAKNESS: "EVIDENCE_REQUIREMENTS",
    CONFIDENCE_ERROR: "CONFIDENCE_CALIBRATION",
    GOVERNANCE_ROUTING_ISSUE: "GOVERNANCE_ROUTING",
    ESCALATION_DELAY: "OPERATOR_ESCALATION",
    SIMULATION_GAP: "SIMULATION_SELECTION",
    PLANNING_FAILURE: "PRIORITIZATION",
  };
  return map[category];
}

function severityFor(category: StrategicFailureCategory, scenario: Scenario): StrategicFailureSeverity {
  if (scenario === "NONDETERMINISTIC_CLASSIFICATION") return "MODERATE";
  if (category === "GOVERNANCE_ROUTING_ISSUE" || category === "STRATEGY_MISMATCH") return "HIGH";
  if (category === "PLANNING_FAILURE" || category === "SIMULATION_GAP") return "MODERATE";
  return "HIGH";
}

function priorityFor(severity: StrategicFailureSeverity): number {
  const map: Record<StrategicFailureSeverity, number> = {
    LOW: 0.25,
    MODERATE: 0.55,
    HIGH: 0.78,
    CRITICAL: 0.95,
  };
  return map[severity];
}

function rootCauseFor(category: StrategicFailureCategory, scenario: Scenario): string {
  if (scenario === "MISSING_ROOT_CAUSE") return "";
  const map: Record<StrategicFailureCategory, string> = {
    STRATEGY_MISMATCH: "Mission strategy repeatedly misaligned with observed execution conditions.",
    EVIDENCE_WEAKNESS: "Evidence quality and lineage repeatedly failed to support strategic decisions.",
    CONFIDENCE_ERROR: "Confidence calibration repeatedly diverged from observed outcomes.",
    GOVERNANCE_ROUTING_ISSUE: "Governance routing repeatedly introduced approval ambiguity or delay.",
    ESCALATION_DELAY: "Escalation strategy repeatedly failed to respond within required timelines.",
    SIMULATION_GAP: "Simulation coverage repeatedly omitted material execution conditions.",
    PLANNING_FAILURE: "Planning and dependency sequencing repeatedly degraded mission execution.",
  };
  return map[category];
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function buildFailure(contract: StrategyEvolutionContractResult, scenario: Scenario): StrategicFailureRecord {
  const category = categoryForScenario(scenario);
  const severity = severityFor(category, scenario);
  const recurrence = clamp(scenario === "NOT_REPRODUCIBLE" ? 0.22 : scenario === "SINGLE_FAILURE" ? 0.31 : 0.84);
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["evidence_ref_failure_1", "evidence_ref_failure_2", "evidence_ref_failure_3"]);
  const patternRefs = scenario === "MISSING_PATTERN_REFS" ? freezeArray([]) : contract.pattern_certification.dashboard_result.dashboard_view.visible_pattern_refs;
  const replayRefs = scenario === "REPLAY_FAILURE" ? freezeArray([]) : contract.proposal_envelope.replay_refs;
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : contract.proposal_envelope.governance_refs;
  const base: Omit<StrategicFailureRecord, "integrity_hash"> = {
    failure_id: `strategic_failure_${hash(`${contract.proposal_envelope.proposal_id}:${category}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${contract.proposal_envelope.tenant_id}:foreign` : contract.proposal_envelope.tenant_id,
    mission_scope: contract.proposal_envelope.mission_scope,
    strategy_area: strategyAreaFor(category),
    failure_category: category,
    failure_summary: `${category.toLowerCase()} detected as a recurring strategic weakness with validated historical support.`,
    root_cause_summary: rootCauseFor(category, scenario),
    severity,
    recurrence_score: recurrence,
    operational_impact: clamp(severity === "HIGH" || severity === "CRITICAL" ? 0.82 : 0.58),
    governance_impact: clamp(category === "GOVERNANCE_ROUTING_ISSUE" ? 0.9 : 0.62),
    constitutional_impact: clamp(category === "GOVERNANCE_ROUTING_ISSUE" ? 0.72 : 0.4),
    supporting_pattern_refs: patternRefs,
    supporting_outcome_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["outcome_ref_failure_1", "outcome_ref_failure_2", "outcome_ref_failure_3"]),
    supporting_evidence_refs: evidenceRefs,
    supporting_recommendation_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["recommendation_ref_failure_1", "recommendation_ref_failure_2", "recommendation_ref_failure_3"]),
    supporting_replay_refs: replayRefs,
    supporting_governance_refs: governanceRefs,
    remediation_priority: priorityFor(severity),
    lifecycle_state: scenario === "NOT_REPRODUCIBLE" || scenario === "SINGLE_FAILURE" ? "REJECTED" : "AVAILABLE_FOR_STRATEGY_EVOLUTION",
    advisory_only: true,
    mutates_strategy: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.failure_id }) });
  if (scenario === "STRATEGY_MUTATION") return Object.freeze({ ...record, mutates_strategy: true as false });
  return record;
}

function buildFailures(contract: StrategyEvolutionContractResult, scenario: Scenario): readonly StrategicFailureRecord[] {
  if (scenario === "UNCERTIFIED_CONTRACT") return freezeArray([]);
  return freezeArray([buildFailure(contract, scenario)]);
}

function buildRegistry(contract: StrategyEvolutionContractResult, failures: readonly StrategicFailureRecord[], scenario: Scenario): StrategicFailureRegistry {
  const category_index = failures.reduce((index, failure) => {
    return { ...index, [failure.failure_category]: freezeArray([...(index[failure.failure_category] ?? []), failure.failure_id]) };
  }, {} as Record<StrategicFailureCategory, readonly string[]>);
  const severity_index = failures.reduce((index, failure) => {
    return { ...index, [failure.severity]: freezeArray([...(index[failure.severity] ?? []), failure.failure_id]) };
  }, {} as Record<StrategicFailureSeverity, readonly string[]>);
  const base: Omit<StrategicFailureRegistry, "integrity_hash"> = {
    registry_id: `strategic_failure_registry_${hash(contract.proposal_envelope.proposal_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${contract.proposal_envelope.tenant_id}:foreign` : contract.proposal_envelope.tenant_id,
    failure_refs: failures.map((failure) => failure.failure_id),
    category_index: Object.freeze(category_index),
    severity_index: Object.freeze(severity_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(contract: StrategyEvolutionContractResult, failures: readonly StrategicFailureRecord[], registry: StrategicFailureRegistry, scenario: Scenario): readonly StrategicFailureFailure[] {
  const validationFailures: StrategicFailureFailure[] = [];
  if (scenario === "UNCERTIFIED_CONTRACT" || !contract.validation.certified) validationFailures.push("STRATEGY_CONTRACT_UNCERTIFIED");
  if (scenario === "NOT_REPRODUCIBLE" || failures.some((failure) => failure.recurrence_score < 0.65)) validationFailures.push("FAILURE_NOT_REPRODUCIBLE");
  if (scenario === "MISSING_ROOT_CAUSE" || failures.some((failure) => !failure.root_cause_summary)) validationFailures.push("ROOT_CAUSE_MISSING");
  if (scenario === "MISSING_EVIDENCE" || failures.some((failure) => !failure.supporting_evidence_refs.length || !failure.supporting_outcome_refs.length || !failure.supporting_recommendation_refs.length)) validationFailures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_PATTERN_REFS" || failures.some((failure) => !failure.supporting_pattern_refs.length)) validationFailures.push("PATTERN_REFERENCES_MISSING");
  if (scenario === "REPLAY_FAILURE" || !replayStrategyEvolutionContract(contract) || failures.some((failure) => !failure.supporting_replay_refs.length)) validationFailures.push("REPLAY_VERIFICATION_FAILED");
  if (scenario === "MISSING_GOVERNANCE" || failures.some((failure) => !failure.supporting_governance_refs.length)) validationFailures.push("GOVERNANCE_REFERENCES_INCOMPLETE");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== contract.proposal_envelope.tenant_id) validationFailures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "NONDETERMINISTIC_CLASSIFICATION") validationFailures.push("CLASSIFICATION_NONDETERMINISTIC");
  if (scenario === "HASH_MISMATCH" || failures.some((failure) => hashWithoutIntegrity(failure) !== failure.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) validationFailures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "SINGLE_FAILURE") validationFailures.push("SINGLE_FAILURE_INSUFFICIENT");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) validationFailures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "ADVISORY_VIOLATION") validationFailures.push("ADVISORY_ONLY_VIOLATION");
  if (scenario === "STRATEGY_MUTATION" || failures.some((failure) => failure.mutates_strategy)) validationFailures.push("STRATEGY_MUTATION_DETECTED");
  if (scenario === "FAIL_OPEN") validationFailures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(validationFailures)]);
}

function stateFor(failures: readonly StrategicFailureFailure[]): StrategicFailureValidation["state"] {
  if (failures.includes("SUPPORTING_EVIDENCE_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(contract: StrategyEvolutionContractResult, records: readonly StrategicFailureRecord[], registry: StrategicFailureRegistry, failures: readonly StrategicFailureFailure[]): StrategicFailureValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategicFailureValidation, "integrity_hash"> = {
    validation_id: "strategic_failure_analyzer_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && registryVerified,
    failures,
    contract_certified: contract.validation.certified,
    reproducible: !failures.includes("FAILURE_NOT_REPRODUCIBLE") && !failures.includes("SINGLE_FAILURE_INSUFFICIENT"),
    root_cause_identified: !failures.includes("ROOT_CAUSE_MISSING"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    pattern_references_complete: !failures.includes("PATTERN_REFERENCES_MISSING"),
    replay_verified: !failures.includes("REPLAY_VERIFICATION_FAILED"),
    governance_referenced: !failures.includes("GOVERNANCE_REFERENCES_INCOMPLETE"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    classification_deterministic: !failures.includes("CLASSIFICATION_NONDETERMINISTIC"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: recordsVerified && registryVerified,
    advisory_only: records.every((record) => record.advisory_only),
    no_strategy_mutation: records.every((record) => !record.mutates_strategy),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategicFailureResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    strategy_contract_replay_hash: result.strategy_contract.replay_hash,
    failures: result.failures,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategicFailureResult, "integrity_hash">): string {
  return hash({
    strategic_failure_analyzer_version: result.strategic_failure_analyzer_version,
    api_surface_hash: result.api_surface.integrity_hash,
    failure_hashes: result.failures.map((failure) => failure.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    advisory_only: result.advisory_only,
    mutates_strategy: result.mutates_strategy,
  });
}

export function analyzeStrategicFailures(input: StrategicFailureInput = {}): StrategicFailureResult {
  const scenario = input.scenario ?? "BASELINE";
  const strategy_contract = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const failures = buildFailures(strategy_contract, scenario);
  const registry = buildRegistry(strategy_contract, failures, scenario);
  const validationFailures = collectFailures(strategy_contract, failures, registry, scenario);
  const validation = buildValidation(strategy_contract, failures, registry, validationFailures);
  const base: Omit<StrategicFailureResult, "integrity_hash" | "replay_hash"> = {
    strategic_failure_analyzer_version: STRATEGIC_FAILURE_VERSION,
    strategy_contract,
    api_surface,
    failures,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    evidence_backed: validation.evidence_complete,
    governance_compliant: validation.governance_referenced,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    mutates_strategy: false,
    generates_proposals: false,
    executes_remediation: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategicFailureAnalysis(result: StrategicFailureResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayStrategyEvolutionContract(result.strategy_contract);
}

export function getStrategicFailureAnalyzerFoundation(): StrategicFailureFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategic_failure_analyzer_version: STRATEGIC_FAILURE_VERSION,
    api_surface,
    result: analyzeStrategicFailures(),
  });
}

export const StrategicFailureAnalyzer = Object.freeze({
  analyze: analyzeStrategicFailures,
  replay: replayStrategicFailureAnalysis,
});
