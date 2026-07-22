import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { compareMissionStrategies, replayMissionStrategyComparison } from "@/services/mission-strategy-comparison-engine";
import { analyzeStrategicFailures, replayStrategicFailureAnalysis } from "@/services/strategic-failure-analyzer";
import { analyzeStrategicOpportunities, replayStrategicOpportunityAnalysis } from "@/services/strategic-opportunity-analyzer";
import type { StrategyDomain } from "@/types/strategy-evolution-contract";
import type {
  StrategyEvolutionProposal,
  StrategyImprovementProposalFailure,
  StrategyImprovementProposalFoundation,
  StrategyImprovementProposalInput,
  StrategyImprovementProposalResult,
  StrategyProposalApiSurface,
  StrategyProposalRecommendation,
  StrategyProposalRegistry,
  StrategyProposalValidation,
} from "@/types/strategy-improvement-proposal-generator";

const STRATEGY_PROPOSAL_VERSION = "strategy-improvement-proposal-generator/v1" as const;

type Scenario = NonNullable<StrategyImprovementProposalInput["scenario"]>;
type UpstreamResults = Pick<StrategyImprovementProposalResult, "opportunity_result" | "failure_result" | "comparison_result">;

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

function buildApiSurface(): StrategyProposalApiSurface {
  const base: Omit<StrategyProposalApiSurface, "integrity_hash"> = {
    api_id: "strategy_improvement_proposal_generator_api",
    generate_proposals: "POST /strategy-improvement-proposal-generator/generate",
    retrieve_proposals: "POST /strategy-improvement-proposal-generator/proposals",
    retrieve_priority: "POST /strategy-improvement-proposal-generator/priority",
    retrieve_recommendation: "POST /strategy-improvement-proposal-generator/recommendation",
    retrieve_evidence: "POST /strategy-improvement-proposal-generator/evidence",
    retrieve_governance: "POST /strategy-improvement-proposal-generator/governance",
    replay_generation: "POST /strategy-improvement-proposal-generator/replay",
    retrieve_registry: "POST /strategy-improvement-proposal-generator/registry",
    retrieve_contract: "GET /strategy-improvement-proposal-generator/contract",
    update_supported: false,
    delete_supported: false,
    direct_strategy_mutation_supported: false,
    direct_approval_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function opportunityScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_UPSTREAM: "UNCERTIFIED_CONTRACT",
    MISSING_HISTORICAL_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_PATTERN_REFS: "MISSING_PATTERN_INTELLIGENCE",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "REPLAY_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    ADVISORY_VIOLATION: "ADVISORY_VIOLATION",
    STRATEGY_MUTATION: "STRATEGY_MUTATION",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "BASELINE";
}

function failureScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_UPSTREAM: "UNCERTIFIED_CONTRACT",
    MISSING_HISTORICAL_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_PATTERN_REFS: "MISSING_PATTERN_REFS",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "REPLAY_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    ADVISORY_VIOLATION: "ADVISORY_VIOLATION",
    STRATEGY_MUTATION: "STRATEGY_MUTATION",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "BASELINE";
}

function comparisonScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_UPSTREAM: "UNCERTIFIED_CONTRACT",
    MISSING_HISTORICAL_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_PATTERN_REFS: "MISSING_EVIDENCE",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "REPLAY_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    ADVISORY_VIOLATION: "ADVISORY_VIOLATION",
    STRATEGY_MUTATION: "STRATEGY_MUTATION",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "BASELINE";
}

function recommendationForScenario(scenario: Scenario, priority: number): StrategyProposalRecommendation {
  if (scenario === "REJECT") return "REJECT";
  if (scenario === "REVISE") return "REVISE";
  if (scenario === "DEFER") return "DEFER";
  if (priority >= 0.72) return "ADVANCE";
  if (priority >= 0.55) return "DEFER";
  return "REVISE";
}

function strategyAreaFor(scenario: Scenario): StrategyDomain {
  if (scenario === "REVISE") return "EVIDENCE_REQUIREMENTS";
  if (scenario === "DEFER") return "SIMULATION_SELECTION";
  if (scenario === "REJECT") return "GOVERNANCE_ROUTING";
  return "PRIORITIZATION";
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function buildProposal(sources: UpstreamResults, scenario: Scenario): StrategyEvolutionProposal {
  const opportunity = sources.opportunity_result;
  const failure = sources.failure_result;
  const comparison = sources.comparison_result;
  const opportunityRecord = opportunity.opportunities[0];
  const failureRecord = failure.failures[0];
  const comparisonRecord = comparison.comparisons[0];
  const benefits = scenario === "MISSING_BENEFITS" ? freezeArray([]) : freezeArray(["Increase mission success probability", "Reduce recurring strategic failure exposure", "Improve governance-ready evidence quality"]);
  const risks = scenario === "MISSING_RISKS" ? freezeArray([]) : freezeArray(["Implementation may require simulation tuning", "Mission-specific constraints may reduce transferability", "Operator review workload may temporarily increase"]);
  const governance = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["Requires governance review before adoption", "Preserves approval workflow and audit trace", "Maintains authority boundary enforcement"]);
  const constitutional = scenario === "MISSING_CONSTITUTIONAL" ? freezeArray([]) : freezeArray(["Preserves operator supremacy", "Preserves governance supremacy", "Maintains tenant isolation and replay integrity"]);
  const operatorImpact = scenario === "MISSING_OPERATOR_IMPACT" ? freezeArray([]) : freezeArray(["Improves decision clarity", "Keeps override authority intact", "Adds review context without reducing operator control"]);
  const patternRefs = scenario === "MISSING_PATTERN_REFS" ? freezeArray([]) : freezeArray([...(opportunityRecord?.supporting_pattern_refs ?? []), ...(failureRecord?.supporting_pattern_refs ?? []), ...(comparisonRecord?.supporting_pattern_refs ?? [])]);
  const outcomeRefs = scenario === "MISSING_HISTORICAL_EVIDENCE" ? freezeArray([]) : freezeArray([...(opportunityRecord?.supporting_outcome_refs ?? []), ...(failureRecord?.supporting_outcome_refs ?? []), ...(comparisonRecord?.supporting_outcome_refs ?? [])]);
  const evidenceRefs = scenario === "MISSING_HISTORICAL_EVIDENCE" ? freezeArray([]) : freezeArray([...(failureRecord?.supporting_evidence_refs ?? []), ...(comparisonRecord?.supporting_evidence_refs ?? [])]);
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray([...(opportunityRecord?.supporting_replay_refs ?? []), ...(failureRecord?.supporting_replay_refs ?? []), ...(comparisonRecord?.supporting_replay_refs ?? [])]);
  const scoreAdjustment = scenario === "DEFER" ? -0.18 : scenario === "REVISE" ? -0.3 : scenario === "REJECT" ? -0.55 : 0;
  const priority = clamp((opportunityRecord?.opportunity_score ?? 0.7) * 0.28 + (failureRecord?.recurrence_score ?? 0.7) * 0.18 + (comparisonRecord?.comparative_effectiveness_score ?? 0.7) * 0.22 + (comparisonRecord?.evidence_quality_score ?? 0.7) * 0.16 + (comparisonRecord?.replay_consistency_score ?? 0.7) * 0.16 + scoreAdjustment);
  const base: Omit<StrategyEvolutionProposal, "integrity_hash"> = {
    proposal_id: `strategy_improvement_proposal_${hash(`${opportunity.registry.registry_id}:${failure.registry.registry_id}:${comparison.registry.registry_id}:${scenario}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${opportunity.registry.tenant_id}:foreign` : opportunity.registry.tenant_id,
    mission_scope: opportunity.opportunities[0]?.mission_scope ?? comparison.comparisons[0]?.mission_scope ?? "mission_scope_unknown",
    strategy_area: strategyAreaFor(scenario),
    current_strategy_summary: "Current strategy shows repeatable improvement potential across certified strategic intelligence.",
    proposed_strategy_change: "Prioritize the historically stronger strategy pattern while requiring simulation, certification, governance review, and operator approval before adoption.",
    rationale: scenario === "HIDDEN_REASONING" ? "" : "The proposal is based on certified opportunity, failure, and comparative strategy evidence with replayable lineage.",
    supporting_pattern_refs: patternRefs,
    supporting_outcome_refs: outcomeRefs,
    supporting_evidence_refs: evidenceRefs,
    supporting_opportunity_refs: opportunity.opportunities.map((record) => record.opportunity_id),
    supporting_failure_refs: failure.failures.map((record) => record.failure_id),
    supporting_comparison_refs: comparison.comparisons.map((record) => record.comparison_id),
    expected_benefits: benefits,
    expected_risks: risks,
    governance_implications: governance,
    constitutional_implications: constitutional,
    operator_impact: operatorImpact,
    simulation_required: scenario !== "SIMULATION_DISABLED",
    approval_required: scenario !== "APPROVAL_DISABLED",
    certification_required: scenario !== "CERTIFICATION_DISABLED",
    rollback_plan_ref: scenario === "MISSING_ROLLBACK" ? "" : "rollback_plan_strategy_improvement_1",
    replay_refs: replayRefs,
    priority_score: scenario === "NONDETERMINISTIC_PRIORITY" ? clamp(priority - 0.2) : priority,
    priority_rank: scenario === "NONDETERMINISTIC_PRIORITY" ? 2 : 1,
    recommendation: recommendationForScenario(scenario, priority),
    lifecycle_state: scenario === "REJECT" ? "REJECTED" : "READY_FOR_GOVERNANCE_REVIEW",
    hidden_reasoning_detected: scenario === "HIDDEN_REASONING",
    advisory_only: true,
    mutates_strategy: false,
  };
  const proposal = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...proposal, integrity_hash: hash({ tampered: proposal.proposal_id }) });
  if (scenario === "STRATEGY_MUTATION") return Object.freeze({ ...proposal, mutates_strategy: true as false });
  return proposal;
}

function buildProposals(sources: UpstreamResults, scenario: Scenario): readonly StrategyEvolutionProposal[] {
  if (scenario === "UNCERTIFIED_UPSTREAM") return freezeArray([]);
  return freezeArray([buildProposal(sources, scenario)]);
}

function buildRegistry(proposals: readonly StrategyEvolutionProposal[], scenario: Scenario): StrategyProposalRegistry {
  const recommendation_index = proposals.reduce((index, proposal) => {
    return { ...index, [proposal.recommendation]: freezeArray([...(index[proposal.recommendation] ?? []), proposal.proposal_id]) };
  }, {} as Record<StrategyProposalRecommendation, readonly string[]>);
  const ranked = [...proposals].sort((a, b) => a.priority_rank - b.priority_rank || b.priority_score - a.priority_score);
  const tenant = proposals[0]?.tenant_id ?? "tenant_mission_control";
  const base: Omit<StrategyProposalRegistry, "integrity_hash"> = {
    registry_id: `strategy_proposal_registry_${hash(proposals.map((proposal) => proposal.proposal_id)).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${tenant}:foreign` : tenant,
    proposal_refs: proposals.map((proposal) => proposal.proposal_id),
    priority_index: freezeArray(ranked.map((proposal) => proposal.proposal_id)),
    recommendation_index: Object.freeze(recommendation_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function upstream(input: StrategyImprovementProposalInput, scenario: Scenario): UpstreamResults {
  return {
    opportunity_result: input.opportunity_result ?? analyzeStrategicOpportunities({ scenario: opportunityScenario(scenario) }),
    failure_result: input.failure_result ?? analyzeStrategicFailures({ scenario: failureScenario(scenario) }),
    comparison_result: input.comparison_result ?? compareMissionStrategies({ scenario: comparisonScenario(scenario) }),
  };
}

function collectFailures(sources: UpstreamResults, proposals: readonly StrategyEvolutionProposal[], registry: StrategyProposalRegistry, scenario: Scenario): readonly StrategyImprovementProposalFailure[] {
  const failures: StrategyImprovementProposalFailure[] = [];
  const upstreamCertified = sources.opportunity_result.validation.certified && sources.failure_result.validation.certified && sources.comparison_result.validation.certified;
  if (scenario === "UNCERTIFIED_UPSTREAM" || !upstreamCertified) failures.push("UPSTREAM_INTELLIGENCE_UNCERTIFIED");
  if (scenario === "MISSING_HISTORICAL_EVIDENCE" || proposals.some((proposal) => !proposal.supporting_outcome_refs.length || !proposal.supporting_evidence_refs.length)) failures.push("HISTORICAL_EVIDENCE_MISSING");
  if (scenario === "MISSING_PATTERN_REFS" || proposals.some((proposal) => !proposal.supporting_pattern_refs.length)) failures.push("RECURRING_PATTERN_REFERENCES_MISSING");
  if (scenario === "MISSING_BENEFITS" || proposals.some((proposal) => !proposal.expected_benefits.length)) failures.push("EXPECTED_BENEFITS_MISSING");
  if (scenario === "MISSING_RISKS" || proposals.some((proposal) => !proposal.expected_risks.length)) failures.push("EXPECTED_RISKS_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || proposals.some((proposal) => !proposal.governance_implications.length)) failures.push("GOVERNANCE_ANALYSIS_INCOMPLETE");
  if (scenario === "MISSING_CONSTITUTIONAL" || proposals.some((proposal) => !proposal.constitutional_implications.length)) failures.push("CONSTITUTIONAL_ANALYSIS_INCOMPLETE");
  if (scenario === "MISSING_OPERATOR_IMPACT" || proposals.some((proposal) => !proposal.operator_impact.length)) failures.push("OPERATOR_IMPACT_MISSING");
  if (scenario === "MISSING_REPLAY" || !replayStrategicOpportunityAnalysis(sources.opportunity_result) || !replayStrategicFailureAnalysis(sources.failure_result) || !replayMissionStrategyComparison(sources.comparison_result) || proposals.some((proposal) => !proposal.replay_refs.length)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scenario === "MISSING_ROLLBACK" || proposals.some((proposal) => !proposal.rollback_plan_ref)) failures.push("ROLLBACK_PLAN_MISSING");
  if (scenario === "SIMULATION_DISABLED" || proposals.some((proposal) => !proposal.simulation_required)) failures.push("SIMULATION_REQUIREMENT_DISABLED");
  if (scenario === "APPROVAL_DISABLED" || proposals.some((proposal) => !proposal.approval_required)) failures.push("APPROVAL_REQUIREMENT_DISABLED");
  if (scenario === "CERTIFICATION_DISABLED" || proposals.some((proposal) => !proposal.certification_required)) failures.push("CERTIFICATION_REQUIREMENT_DISABLED");
  if (scenario === "HIDDEN_REASONING" || proposals.some((proposal) => proposal.hidden_reasoning_detected || !proposal.rationale)) failures.push("HIDDEN_REASONING_DETECTED");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== (proposals[0]?.tenant_id ?? registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || proposals.some((proposal) => hashWithoutIntegrity(proposal) !== proposal.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "NONDETERMINISTIC_PRIORITY" || proposals.some((proposal) => proposal.priority_rank !== 1)) failures.push("PRIORITY_NONDETERMINISTIC");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "ADVISORY_VIOLATION") failures.push("ADVISORY_ONLY_VIOLATION");
  if (scenario === "STRATEGY_MUTATION" || proposals.some((proposal) => proposal.mutates_strategy)) failures.push("STRATEGY_MUTATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly StrategyImprovementProposalFailure[]): StrategyProposalValidation["state"] {
  if (failures.includes("HISTORICAL_EVIDENCE_MISSING") || failures.includes("RECURRING_PATTERN_REFERENCES_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(sources: UpstreamResults, proposals: readonly StrategyEvolutionProposal[], registry: StrategyProposalRegistry, failures: readonly StrategyImprovementProposalFailure[]): StrategyProposalValidation {
  const proposalsVerified = proposals.every((proposal) => hashWithoutIntegrity(proposal) === proposal.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategyProposalValidation, "integrity_hash"> = {
    validation_id: "strategy_improvement_proposal_generator_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && proposalsVerified && registryVerified,
    failures,
    upstream_certified: sources.opportunity_result.validation.certified && sources.failure_result.validation.certified && sources.comparison_result.validation.certified,
    evidence_complete: !failures.includes("HISTORICAL_EVIDENCE_MISSING"),
    pattern_references_complete: !failures.includes("RECURRING_PATTERN_REFERENCES_MISSING"),
    benefits_documented: !failures.includes("EXPECTED_BENEFITS_MISSING"),
    risks_documented: !failures.includes("EXPECTED_RISKS_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_ANALYSIS_INCOMPLETE"),
    constitutional_complete: !failures.includes("CONSTITUTIONAL_ANALYSIS_INCOMPLETE"),
    operator_impact_complete: !failures.includes("OPERATOR_IMPACT_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_INCOMPLETE"),
    rollback_complete: !failures.includes("ROLLBACK_PLAN_MISSING"),
    simulation_required: !failures.includes("SIMULATION_REQUIREMENT_DISABLED"),
    approval_required: !failures.includes("APPROVAL_REQUIREMENT_DISABLED"),
    certification_required: !failures.includes("CERTIFICATION_REQUIREMENT_DISABLED"),
    hidden_reasoning_absent: !failures.includes("HIDDEN_REASONING_DETECTED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    priority_deterministic: !failures.includes("PRIORITY_NONDETERMINISTIC"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: proposalsVerified && registryVerified,
    advisory_only: proposals.every((proposal) => proposal.advisory_only),
    no_strategy_mutation: proposals.every((proposal) => !proposal.mutates_strategy),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategyImprovementProposalResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    opportunity_replay_hash: result.opportunity_result.replay_hash,
    failure_replay_hash: result.failure_result.replay_hash,
    comparison_replay_hash: result.comparison_result.replay_hash,
    proposals: result.proposals,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategyImprovementProposalResult, "integrity_hash">): string {
  return hash({
    strategy_improvement_proposal_generator_version: result.strategy_improvement_proposal_generator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    proposal_hashes: result.proposals.map((proposal) => proposal.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    advisory_only: result.advisory_only,
    mutates_strategy: result.mutates_strategy,
    direct_approval: result.direct_approval,
  });
}

export function generateStrategyImprovementProposals(input: StrategyImprovementProposalInput = {}): StrategyImprovementProposalResult {
  const scenario = input.scenario ?? "BASELINE";
  const sources = upstream(input, scenario);
  const api_surface = buildApiSurface();
  const proposals = buildProposals(sources, scenario);
  const registry = buildRegistry(proposals, scenario);
  const validationFailures = collectFailures(sources, proposals, registry, scenario);
  const validation = buildValidation(sources, proposals, registry, validationFailures);
  const base: Omit<StrategyImprovementProposalResult, "integrity_hash" | "replay_hash"> = {
    strategy_improvement_proposal_generator_version: STRATEGY_PROPOSAL_VERSION,
    opportunity_result: sources.opportunity_result,
    failure_result: sources.failure_result,
    comparison_result: sources.comparison_result,
    api_surface,
    proposals,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    evidence_backed: validation.evidence_complete,
    governance_compliant: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    mutates_strategy: false,
    direct_approval: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategyImprovementProposalGeneration(result: StrategyImprovementProposalResult): boolean {
  return resultReplayHash(result) === result.replay_hash
    && resultIntegrityHash(result) === result.integrity_hash
    && replayStrategicOpportunityAnalysis(result.opportunity_result)
    && replayStrategicFailureAnalysis(result.failure_result)
    && replayMissionStrategyComparison(result.comparison_result);
}

export function getStrategyImprovementProposalFoundation(): StrategyImprovementProposalFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategy_improvement_proposal_generator_version: STRATEGY_PROPOSAL_VERSION,
    api_surface,
    result: generateStrategyImprovementProposals(),
  });
}

export const StrategyImprovementProposalGenerator = Object.freeze({
  generate: generateStrategyImprovementProposals,
  replay: replayStrategyImprovementProposalGeneration,
});
