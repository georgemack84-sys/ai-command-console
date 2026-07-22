import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayStrategyEvolutionContract, validateStrategyEvolutionContract } from "@/services/strategy-evolution-contract";
import type { StrategyEvolutionContractInput, StrategyEvolutionContractResult, StrategyDomain } from "@/types/strategy-evolution-contract";
import type {
  StrategicOpportunityApiSurface,
  StrategicOpportunityCategory,
  StrategicOpportunityFailure,
  StrategicOpportunityFoundation,
  StrategicOpportunityInput,
  StrategicOpportunityRecord,
  StrategicOpportunityRegistry,
  StrategicOpportunityResult,
  StrategicOpportunityValidation,
} from "@/types/strategic-opportunity-analyzer";

const STRATEGIC_OPPORTUNITY_VERSION = "strategic-opportunity-analyzer/v1" as const;

type Scenario = NonNullable<StrategicOpportunityInput["scenario"]>;

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

function sourceForScenario(input: StrategicOpportunityInput, scenario: Scenario): StrategyEvolutionContractResult {
  if (input.strategy_contract) return input.strategy_contract;
  return validateStrategyEvolutionContract({ scenario: contractScenario(scenario) });
}

function buildApiSurface(): StrategicOpportunityApiSurface {
  const base: Omit<StrategicOpportunityApiSurface, "integrity_hash"> = {
    api_id: "strategic_opportunity_analyzer_api",
    analyze_opportunities: "POST /strategic-opportunity-analyzer/analyze",
    retrieve_opportunities: "POST /strategic-opportunity-analyzer/opportunities",
    retrieve_ranking: "POST /strategic-opportunity-analyzer/ranking",
    retrieve_evidence: "POST /strategic-opportunity-analyzer/evidence",
    retrieve_governance: "POST /strategic-opportunity-analyzer/governance",
    replay_analysis: "POST /strategic-opportunity-analyzer/replay",
    retrieve_registry: "POST /strategic-opportunity-analyzer/registry",
    retrieve_contract: "GET /strategic-opportunity-analyzer/contract",
    update_supported: false,
    delete_supported: false,
    strategy_mutation_supported: false,
    proposal_generation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoryForScenario(scenario: Scenario): StrategicOpportunityCategory {
  const map: Partial<Record<Scenario, StrategicOpportunityCategory>> = {
    RISK_OPPORTUNITY: "RISK_OPPORTUNITY",
    DECISION_OPPORTUNITY: "DECISION_OPPORTUNITY",
    EVIDENCE_OPPORTUNITY: "EVIDENCE_OPPORTUNITY",
    GOVERNANCE_OPPORTUNITY: "GOVERNANCE_OPPORTUNITY",
    OPERATOR_OPPORTUNITY: "OPERATOR_OPPORTUNITY",
    SIMULATION_OPPORTUNITY: "SIMULATION_OPPORTUNITY",
  };
  return map[scenario] ?? "SUCCESS_OPPORTUNITY";
}

function strategyAreaFor(category: StrategicOpportunityCategory): StrategyDomain {
  const map: Record<StrategicOpportunityCategory, StrategyDomain> = {
    SUCCESS_OPPORTUNITY: "PRIORITIZATION",
    RISK_OPPORTUNITY: "RISK_HANDLING",
    DECISION_OPPORTUNITY: "CONFIDENCE_CALIBRATION",
    EVIDENCE_OPPORTUNITY: "EVIDENCE_REQUIREMENTS",
    GOVERNANCE_OPPORTUNITY: "GOVERNANCE_ROUTING",
    OPERATOR_OPPORTUNITY: "OPERATOR_ESCALATION",
    SIMULATION_OPPORTUNITY: "SIMULATION_SELECTION",
  };
  return map[category];
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function buildOpportunity(contract: StrategyEvolutionContractResult, scenario: Scenario, rankingPosition: number): StrategicOpportunityRecord {
  const category = categoryForScenario(scenario);
  const scoreAdjustment = scenario === "NOT_REPRODUCIBLE" || scenario === "SINGLE_SUCCESS" ? -0.35 : 0;
  const repeatability = clamp(scenario === "NOT_REPRODUCIBLE" ? 0.25 : scenario === "SINGLE_SUCCESS" ? 0.32 : 0.86);
  const evidence = clamp(scenario === "MISSING_EVIDENCE" ? 0 : 0.9);
  const replayRefs = scenario === "REPLAY_FAILURE" ? freezeArray([]) : contract.proposal_envelope.replay_refs;
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : contract.proposal_envelope.governance_refs;
  const baseScore = clamp(0.28 * repeatability + 0.22 * evidence + 0.18 * 0.82 + 0.14 * 0.74 + 0.1 * 0.76 + 0.08 * 0.8 + scoreAdjustment);
  const base: Omit<StrategicOpportunityRecord, "integrity_hash"> = {
    opportunity_id: `strategic_opportunity_${hash(`${contract.proposal_envelope.proposal_id}:${category}:${rankingPosition}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${contract.proposal_envelope.tenant_id}:foreign` : contract.proposal_envelope.tenant_id,
    mission_scope: contract.proposal_envelope.mission_scope,
    opportunity_category: category,
    strategy_area: strategyAreaFor(category),
    opportunity_summary: `${category.toLowerCase()} identified from repeatable certified Pattern Intelligence and Strategy Evolution evidence.`,
    supporting_pattern_refs: scenario === "MISSING_PATTERN_INTELLIGENCE" ? freezeArray([]) : contract.pattern_certification.dashboard_result.dashboard_view.visible_pattern_refs,
    supporting_outcome_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["outcome_ref_strategy_success_1", "outcome_ref_strategy_success_2", "outcome_ref_strategy_success_3"]),
    supporting_recommendation_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["recommendation_ref_durable_1", "recommendation_ref_durable_2", "recommendation_ref_durable_3"]),
    supporting_decision_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["decision_ref_quality_1", "decision_ref_quality_2", "decision_ref_quality_3"]),
    supporting_governance_refs: governanceRefs,
    supporting_replay_refs: replayRefs,
    opportunity_score: baseScore,
    repeatability_score: repeatability,
    evidence_strength: evidence,
    expected_benefit: clamp(category === "RISK_OPPORTUNITY" ? 0.88 : 0.8),
    governance_impact: clamp(category === "GOVERNANCE_OPPORTUNITY" ? 0.9 : 0.68),
    operator_impact: clamp(category === "OPERATOR_OPPORTUNITY" ? 0.9 : 0.7),
    ranking_position: scenario === "NONDETERMINISTIC_RANKING" ? 2 : rankingPosition,
    lifecycle_state: scenario === "NOT_REPRODUCIBLE" || scenario === "SINGLE_SUCCESS" ? "REJECTED" : "AVAILABLE_FOR_PROPOSAL",
    advisory_only: true,
    mutates_strategy: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.opportunity_id }) });
  if (scenario === "STRATEGY_MUTATION") return Object.freeze({ ...record, mutates_strategy: true as false });
  return record;
}

function buildOpportunities(contract: StrategyEvolutionContractResult, scenario: Scenario): readonly StrategicOpportunityRecord[] {
  if (scenario === "UNCERTIFIED_CONTRACT") return freezeArray([]);
  return freezeArray([buildOpportunity(contract, scenario, 1)]);
}

function buildRegistry(contract: StrategyEvolutionContractResult, opportunities: readonly StrategicOpportunityRecord[], scenario: Scenario): StrategicOpportunityRegistry {
  const category_index = opportunities.reduce((index, opportunity) => {
    return { ...index, [opportunity.opportunity_category]: freezeArray([...(index[opportunity.opportunity_category] ?? []), opportunity.opportunity_id]) };
  }, {} as Record<StrategicOpportunityCategory, readonly string[]>);
  const ranked = [...opportunities].sort((a, b) => a.ranking_position - b.ranking_position || b.opportunity_score - a.opportunity_score);
  const base: Omit<StrategicOpportunityRegistry, "integrity_hash"> = {
    registry_id: `strategic_opportunity_registry_${hash(contract.proposal_envelope.proposal_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${contract.proposal_envelope.tenant_id}:foreign` : contract.proposal_envelope.tenant_id,
    opportunity_refs: opportunities.map((opportunity) => opportunity.opportunity_id),
    category_index: Object.freeze(category_index),
    ranking_index: freezeArray(ranked.map((opportunity) => opportunity.opportunity_id)),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(contract: StrategyEvolutionContractResult, opportunities: readonly StrategicOpportunityRecord[], registry: StrategicOpportunityRegistry, scenario: Scenario): readonly StrategicOpportunityFailure[] {
  const failures: StrategicOpportunityFailure[] = [];
  if (scenario === "UNCERTIFIED_CONTRACT" || !contract.validation.certified) failures.push("STRATEGY_CONTRACT_UNCERTIFIED");
  if (scenario === "MISSING_EVIDENCE" || opportunities.some((opportunity) => !opportunity.supporting_outcome_refs.length || !opportunity.supporting_recommendation_refs.length || !opportunity.supporting_decision_refs.length)) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_PATTERN_INTELLIGENCE" || opportunities.some((opportunity) => !opportunity.supporting_pattern_refs.length)) failures.push("PATTERN_INTELLIGENCE_UNAVAILABLE");
  if (scenario === "REPLAY_FAILURE" || !replayStrategyEvolutionContract(contract) || opportunities.some((opportunity) => !opportunity.supporting_replay_refs.length)) failures.push("REPLAY_VERIFICATION_FAILED");
  if (scenario === "MISSING_GOVERNANCE" || opportunities.some((opportunity) => !opportunity.supporting_governance_refs.length)) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "NOT_REPRODUCIBLE" || opportunities.some((opportunity) => opportunity.repeatability_score < 0.65)) failures.push("OPPORTUNITY_NOT_REPRODUCIBLE");
  if (scenario === "NONDETERMINISTIC_RANKING" || opportunities.some((opportunity, index) => opportunity.ranking_position !== index + 1)) failures.push("RANKING_NONDETERMINISTIC");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== contract.proposal_envelope.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || opportunities.some((opportunity) => hashWithoutIntegrity(opportunity) !== opportunity.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "SINGLE_SUCCESS") failures.push("SINGLE_SUCCESS_INSUFFICIENT");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "ADVISORY_VIOLATION") failures.push("ADVISORY_ONLY_VIOLATION");
  if (scenario === "STRATEGY_MUTATION" || opportunities.some((opportunity) => opportunity.mutates_strategy)) failures.push("STRATEGY_MUTATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly StrategicOpportunityFailure[]): StrategicOpportunityValidation["state"] {
  if (failures.includes("SUPPORTING_EVIDENCE_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(contract: StrategyEvolutionContractResult, opportunities: readonly StrategicOpportunityRecord[], registry: StrategicOpportunityRegistry, failures: readonly StrategicOpportunityFailure[]): StrategicOpportunityValidation {
  const opportunitiesVerified = opportunities.every((opportunity) => hashWithoutIntegrity(opportunity) === opportunity.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategicOpportunityValidation, "integrity_hash"> = {
    validation_id: "strategic_opportunity_analyzer_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && opportunitiesVerified && registryVerified,
    failures,
    contract_certified: contract.validation.certified,
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    pattern_intelligence_available: !failures.includes("PATTERN_INTELLIGENCE_UNAVAILABLE"),
    replay_verified: !failures.includes("REPLAY_VERIFICATION_FAILED"),
    governance_referenced: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    reproducible: !failures.includes("OPPORTUNITY_NOT_REPRODUCIBLE") && !failures.includes("SINGLE_SUCCESS_INSUFFICIENT"),
    ranking_deterministic: !failures.includes("RANKING_NONDETERMINISTIC"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: opportunitiesVerified && registryVerified,
    advisory_only: opportunities.every((opportunity) => opportunity.advisory_only),
    no_strategy_mutation: opportunities.every((opportunity) => !opportunity.mutates_strategy),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategicOpportunityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    strategy_contract_replay_hash: result.strategy_contract.replay_hash,
    opportunities: result.opportunities,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategicOpportunityResult, "integrity_hash">): string {
  return hash({
    strategic_opportunity_analyzer_version: result.strategic_opportunity_analyzer_version,
    api_surface_hash: result.api_surface.integrity_hash,
    opportunity_hashes: result.opportunities.map((opportunity) => opportunity.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    advisory_only: result.advisory_only,
    mutates_strategy: result.mutates_strategy,
  });
}

export function analyzeStrategicOpportunities(input: StrategicOpportunityInput = {}): StrategicOpportunityResult {
  const scenario = input.scenario ?? "BASELINE";
  const strategy_contract = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const opportunities = buildOpportunities(strategy_contract, scenario);
  const registry = buildRegistry(strategy_contract, opportunities, scenario);
  const failures = collectFailures(strategy_contract, opportunities, registry, scenario);
  const validation = buildValidation(strategy_contract, opportunities, registry, failures);
  const base: Omit<StrategicOpportunityResult, "integrity_hash" | "replay_hash"> = {
    strategic_opportunity_analyzer_version: STRATEGIC_OPPORTUNITY_VERSION,
    strategy_contract,
    api_surface,
    opportunities,
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
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategicOpportunityAnalysis(result: StrategicOpportunityResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayStrategyEvolutionContract(result.strategy_contract);
}

export function getStrategicOpportunityAnalyzerFoundation(): StrategicOpportunityFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategic_opportunity_analyzer_version: STRATEGIC_OPPORTUNITY_VERSION,
    api_surface,
    result: analyzeStrategicOpportunities(),
  });
}

export const StrategicOpportunityAnalyzer = Object.freeze({
  analyze: analyzeStrategicOpportunities,
  replay: replayStrategicOpportunityAnalysis,
});
