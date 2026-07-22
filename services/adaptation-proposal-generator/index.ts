import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayAdaptationProposalContract, validateAdaptationProposalContract } from "@/services/adaptation-proposal-contract";
import type { AdaptationProposalScenario } from "@/types/adaptation-proposal-contract";
import type {
  AdaptationOpportunity,
  AdaptationProposalCategory,
  AdaptationProposalGeneratorApiSurface,
  AdaptationProposalGeneratorFailure,
  AdaptationProposalGeneratorFoundation,
  AdaptationProposalGeneratorInput,
  AdaptationProposalGeneratorMetrics,
  AdaptationProposalGeneratorResult,
  AdaptationProposalGeneratorScenario,
  AdaptationProposalGeneratorState,
  AdaptiveIntelligenceSourceFinding,
  GeneratedAdaptationProposal,
} from "@/types/adaptation-proposal-generator";

const GENERATOR_VERSION = "adaptation-proposal-generator/v1" as const;
const SYNTHESIS_RULE_VERSION = "adaptation-proposal-synthesis-rules/v1" as const;

const SUPPORTED_CATEGORIES: readonly AdaptationProposalCategory[] = Object.freeze([
  "CONFIDENCE_CALIBRATION",
  "RISK_CALIBRATION",
  "RECOMMENDATION_HEURISTIC",
  "PRIORITY_WEIGHTING",
  "EVIDENCE_REQUIREMENT",
  "SIMULATION_SELECTION",
  "GOVERNANCE_ROUTING",
  "OPERATOR_VISIBILITY",
  "DECISION_PACKAGE_FORMAT",
  "STRATEGIC_PATTERN_RESPONSE",
  "ROLLBACK_GUIDANCE",
]);

type Scenario = NonNullable<AdaptationProposalGeneratorInput["scenario"]>;

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

function buildApiSurface(): AdaptationProposalGeneratorApiSurface {
  const base: Omit<AdaptationProposalGeneratorApiSurface, "integrity_hash"> = {
    api_id: "adaptation_proposal_generator_api",
    generate_proposals: "POST /adaptation-proposal-generator/generate",
    retrieve_proposals: "POST /adaptation-proposal-generator/proposals",
    retrieve_classifications: "POST /adaptation-proposal-generator/classifications",
    retrieve_metrics: "POST /adaptation-proposal-generator/metrics",
    replay_generation: "POST /adaptation-proposal-generator/replay",
    inspect_generator: "POST /adaptation-proposal-generator/inspect",
    retrieve_contract: "GET /adaptation-proposal-generator/contract",
    execution_supported: false,
    deployment_supported: false,
    production_mutation_supported: false,
    model_mutation_supported: false,
    policy_mutation_supported: false,
    governance_bypass_supported: false,
    operator_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sourceFinding(domain: AdaptiveIntelligenceSourceFinding["source_domain"], scenario: Scenario, tenantId = "tenant_alpha"): AdaptiveIntelligenceSourceFinding {
  const missingEvidence = scenario === "MISSING_EVIDENCE";
  const missingOutcomes = scenario === "MISSING_OUTCOMES";
  const missingReplay = scenario === "MISSING_REPLAY";
  const base: Omit<AdaptiveIntelligenceSourceFinding, "integrity_hash"> = {
    source_id: `adaptive_source_${domain.toLowerCase()}_${hash(`${domain}:${scenario}`).slice(0, 12)}`,
    source_domain: domain,
    finding_summary: `${domain.toLowerCase()} finding supports adaptive proposal synthesis.`,
    evidence_refs: missingEvidence ? freezeArray([]) : freezeArray([`evidence_${domain.toLowerCase()}_001`]),
    outcome_refs: missingOutcomes ? freezeArray([]) : freezeArray([`outcome_${domain.toLowerCase()}_001`]),
    replay_refs: missingReplay ? freezeArray([]) : freezeArray([`replay_${domain.toLowerCase()}_001`]),
    governance_refs: scenario === "GOVERNANCE_FAILURE" ? freezeArray([]) : freezeArray([`governance_${domain.toLowerCase()}_001`]),
    tenant_id: scenario === "TENANT_VIOLATION" && domain === "RISK_ADAPTATION" ? "tenant_foreign" : tenantId,
    confidence: domain === "CONFIDENCE_ADAPTATION" ? 0.72 : 0.84,
    severity: domain === "RISK_ADAPTATION" ? 0.78 : 0.42,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function defaultFindings(scenario: Scenario): readonly AdaptiveIntelligenceSourceFinding[] {
  if (scenario === "MISSING_INPUT") return freezeArray([]);
  return freezeArray([
    sourceFinding("OUTCOME_OBSERVATION", scenario),
    sourceFinding("RECOMMENDATION_ANALYSIS", scenario),
    sourceFinding("PATTERN_INTELLIGENCE", scenario),
    sourceFinding("CONFIDENCE_ADAPTATION", scenario),
    sourceFinding("RISK_ADAPTATION", scenario),
    sourceFinding("STRATEGY_EVOLUTION", scenario),
    sourceFinding("OPERATOR_FEEDBACK", scenario),
  ]);
}

function categoriesFor(scenario: Scenario): readonly AdaptationProposalCategory[] {
  const map: Partial<Record<AdaptationProposalGeneratorScenario, readonly AdaptationProposalCategory[]>> = {
    CONFIDENCE_IMPROVEMENT: ["CONFIDENCE_CALIBRATION", "OPERATOR_VISIBILITY"],
    RISK_IMPROVEMENT: ["RISK_CALIBRATION", "SIMULATION_SELECTION"],
    EVIDENCE_IMPROVEMENT: ["EVIDENCE_REQUIREMENT", "DECISION_PACKAGE_FORMAT"],
    SIMULATION_IMPROVEMENT: ["SIMULATION_SELECTION", "PRIORITY_WEIGHTING"],
    GOVERNANCE_ROUTING: ["GOVERNANCE_ROUTING", "PRIORITY_WEIGHTING"],
    OPERATOR_VISIBILITY: ["OPERATOR_VISIBILITY", "DECISION_PACKAGE_FORMAT"],
    STRATEGIC_IMPROVEMENT: ["STRATEGIC_PATTERN_RESPONSE", "RECOMMENDATION_HEURISTIC"],
    ROLLBACK_IMPROVEMENT: ["ROLLBACK_GUIDANCE", "GOVERNANCE_ROUTING"],
    PRIORITIZATION_LOGIC: ["PRIORITY_WEIGHTING", "RECOMMENDATION_HEURISTIC"],
    DECISION_PACKAGE_IMPROVEMENT: ["DECISION_PACKAGE_FORMAT", "EVIDENCE_REQUIREMENT"],
  };
  return freezeArray(map[scenario] ?? ["STRATEGIC_PATTERN_RESPONSE", "RECOMMENDATION_HEURISTIC", "OPERATOR_VISIBILITY"]);
}

function contractScenarioFor(scenario: Scenario, explicit?: AdaptationProposalScenario): AdaptationProposalScenario {
  if (explicit) return explicit;
  const map: Partial<Record<AdaptationProposalGeneratorScenario, AdaptationProposalScenario>> = {
    CONFIDENCE_IMPROVEMENT: "CONFIDENCE",
    RISK_IMPROVEMENT: "RISK",
    EVIDENCE_IMPROVEMENT: "EVIDENCE_REQUIREMENT",
    SIMULATION_IMPROVEMENT: "SIMULATION_REQUIREMENT",
    GOVERNANCE_ROUTING: "GOVERNANCE",
    OPERATOR_VISIBILITY: "OPERATOR_WORKFLOW",
    STRATEGIC_IMPROVEMENT: "BASELINE",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    GOVERNANCE_FAILURE: "MISSING_GOVERNANCE_ANALYSIS",
    CONSTITUTIONAL_FAILURE: "MISSING_CONSTITUTIONAL_ANALYSIS",
    AUTHORITY_FAILURE: "MISSING_AUTHORITY_ANALYSIS",
    CONTRACT_VALIDATION_FAILURE: "MISSING_BENEFIT_ANALYSIS",
    INTEGRITY_FAILURE: "INVALID_INTEGRITY_HASH",
    TENANT_VIOLATION: "CROSS_TENANT_REFERENCE",
    PRODUCTION_MUTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
    MODEL_MUTATION_ATTEMPT: "MODEL_RETRAINING_ATTEMPT",
    POLICY_MUTATION_ATTEMPT: "POLICY_MUTATION_ATTEMPT",
    CONSTITUTIONAL_BYPASS_ATTEMPT: "MISSING_CONSTITUTIONAL_ANALYSIS",
    OPERATOR_AUTHORITY_REMOVAL: "OPERATOR_BYPASS_ATTEMPT",
    GOVERNANCE_VISIBILITY_SUPPRESSION: "MISSING_GOVERNANCE_ANALYSIS",
  };
  return map[scenario] ?? "BASELINE";
}

function opportunityFrom(findings: readonly AdaptiveIntelligenceSourceFinding[], scenario: Scenario): AdaptationOpportunity | null {
  if (findings.length === 0) return null;
  const categories = categoriesFor(scenario);
  const evidenceRefs = freezeArray([...new Set(findings.flatMap((finding) => finding.evidence_refs))]);
  const outcomeRefs = freezeArray([...new Set(findings.flatMap((finding) => finding.outcome_refs))]);
  const replayRefs = freezeArray([...new Set(findings.flatMap((finding) => finding.replay_refs))]);
  const priority = Number((findings.reduce((sum, finding) => sum + finding.confidence * 0.55 + finding.severity * 0.45, 0) / findings.length).toFixed(4));
  const base: Omit<AdaptationOpportunity, "integrity_hash"> = {
    opportunity_id: `adaptation_opportunity_${hash(`${categories.join("|")}:${evidenceRefs.join("|")}`).slice(0, 14)}`,
    categories,
    source_finding_refs: findings.map((finding) => finding.source_id),
    evidence_refs: evidenceRefs,
    outcome_refs: outcomeRefs,
    replay_refs: replayRefs,
    priority_score: scenario === "NONDETERMINISTIC_GENERATION" ? Number((priority - 0.2).toFixed(4)) : priority,
    explainability: "Opportunity synthesized from outcome, recommendation, pattern, confidence, risk, strategy, and operator feedback findings.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function generatedProposal(opportunity: AdaptationOpportunity, scenario: Scenario, contract_scenario?: AdaptationProposalScenario): GeneratedAdaptationProposal {
  const contract_result = validateAdaptationProposalContract({ scenario: contractScenarioFor(scenario, contract_scenario) });
  const base: Omit<GeneratedAdaptationProposal, "integrity_hash"> = {
    generated_proposal_id: `generated_${contract_result.proposal.proposal_id}_${hash(opportunity.opportunity_id).slice(0, 8)}`,
    categories: opportunity.categories,
    source_finding_refs: opportunity.source_finding_refs,
    opportunity_id: opportunity.opportunity_id,
    contract_result,
    recommendation_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function directFailureFor(scenario: Scenario): AdaptationProposalGeneratorFailure | undefined {
  const map: Partial<Record<AdaptationProposalGeneratorScenario, AdaptationProposalGeneratorFailure>> = {
    MISSING_INPUT: "INPUT_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    MISSING_OUTCOMES: "OUTCOME_REFERENCES_MISSING",
    MISSING_REPLAY: "REPLAY_REFERENCES_INCOMPLETE",
    GOVERNANCE_FAILURE: "GOVERNANCE_ANALYSIS_FAILED",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_ANALYSIS_FAILED",
    AUTHORITY_FAILURE: "AUTHORITY_ANALYSIS_FAILED",
    CONTRACT_VALIDATION_FAILURE: "PROPOSAL_CONTRACT_VALIDATION_FAILED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    REPLAY_NOT_GUARANTEED: "DETERMINISTIC_REPLAY_NOT_GUARANTEED",
    NONDETERMINISTIC_GENERATION: "NONDETERMINISTIC_GENERATION_DETECTED",
    PRODUCTION_MUTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
    MODEL_MUTATION_ATTEMPT: "MODEL_MUTATION_ATTEMPT",
    POLICY_MUTATION_ATTEMPT: "POLICY_MUTATION_ATTEMPT",
    CONSTITUTIONAL_BYPASS_ATTEMPT: "CONSTITUTIONAL_BYPASS_ATTEMPT",
    OPERATOR_AUTHORITY_REMOVAL: "OPERATOR_AUTHORITY_REMOVAL_ATTEMPT",
    GOVERNANCE_VISIBILITY_SUPPRESSION: "GOVERNANCE_VISIBILITY_SUPPRESSION_ATTEMPT",
  };
  return map[scenario];
}

function collectFailures(findings: readonly AdaptiveIntelligenceSourceFinding[], opportunities: readonly AdaptationOpportunity[], proposals: readonly GeneratedAdaptationProposal[], scenario: Scenario): readonly AdaptationProposalGeneratorFailure[] {
  const failures: AdaptationProposalGeneratorFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (findings.length === 0) failures.push("INPUT_INCOMPLETE");
  if (findings.some((finding) => finding.evidence_refs.length === 0) || opportunities.some((opportunity) => opportunity.evidence_refs.length === 0)) failures.push("EVIDENCE_MISSING");
  if (findings.some((finding) => finding.outcome_refs.length === 0) || opportunities.some((opportunity) => opportunity.outcome_refs.length === 0)) failures.push("OUTCOME_REFERENCES_MISSING");
  if (findings.some((finding) => finding.replay_refs.length === 0) || opportunities.some((opportunity) => opportunity.replay_refs.length === 0)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (findings.some((finding) => finding.governance_refs.length === 0)) failures.push("GOVERNANCE_ANALYSIS_FAILED");
  if (new Set(findings.map((finding) => finding.tenant_id)).size > 1) failures.push("TENANT_ISOLATION_VIOLATED");
  if (proposals.some((proposal) => !proposal.contract_result.validation_report.certified)) failures.push("PROPOSAL_CONTRACT_VALIDATION_FAILED");
  if (proposals.some((proposal) => !replayAdaptationProposalContract(proposal.contract_result) || hashWithoutIntegrity(proposal) !== proposal.integrity_hash)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "REPLAY_NOT_GUARANTEED" || proposals.some((proposal) => !proposal.contract_result.replayable)) failures.push("DETERMINISTIC_REPLAY_NOT_GUARANTEED");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly AdaptationProposalGeneratorFailure[]): AdaptationProposalGeneratorState {
  if (failures.includes("EVIDENCE_MISSING") || failures.includes("OUTCOME_REFERENCES_MISSING") || failures.includes("REPLAY_REFERENCES_INCOMPLETE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "GENERATED";
}

function metricsFor(proposals: readonly GeneratedAdaptationProposal[], findings: readonly AdaptiveIntelligenceSourceFinding[], failures: readonly AdaptationProposalGeneratorFailure[]): AdaptationProposalGeneratorMetrics {
  const source_distribution = findings.reduce((acc, finding) => ({ ...acc, [finding.source_domain]: (acc[finding.source_domain] ?? 0) + 1 }), {} as Record<string, number>);
  const categories = freezeArray([...new Set(proposals.flatMap((proposal) => proposal.categories))]);
  const evidenceCount = findings.reduce((sum, finding) => sum + finding.evidence_refs.length, 0);
  const base: Omit<AdaptationProposalGeneratorMetrics, "integrity_hash"> = {
    proposals_generated: proposals.length,
    proposals_rejected: failures.length ? proposals.length || 1 : 0,
    generation_latency_ms: 0,
    proposal_categories: categories,
    evidence_utilization: findings.length ? Number((evidenceCount / findings.length).toFixed(4)) : 0,
    source_distribution: Object.freeze(source_distribution),
    deterministic_replay_success: failures.length === 0,
    validation_failures: failures,
    governance_evaluation_outcomes: freezeArray(proposals.map((proposal) => proposal.contract_result.governance_enforced ? "GOVERNANCE_ENFORCED" : "GOVERNANCE_FAILED")),
    operator_impact_classifications: freezeArray(proposals.map((proposal) => proposal.contract_result.proposal.operator_impact.summary ? "OPERATOR_REVIEW_REQUIRED" : "OPERATOR_IMPACT_MISSING")),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptationProposalGeneratorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    findings: result.source_findings.map((finding) => finding.integrity_hash),
    opportunities: result.opportunities.map((opportunity) => opportunity.integrity_hash),
    proposals: result.generated_proposals.map((proposal) => proposal.integrity_hash),
    metrics: result.metrics.integrity_hash,
    state: result.generation_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptationProposalGeneratorResult, "integrity_hash">): string {
  return hash({
    version: result.adaptation_proposal_generator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function generateAdaptationProposals(input: AdaptationProposalGeneratorInput = {}): AdaptationProposalGeneratorResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const source_findings = freezeArray(input.source_findings ?? defaultFindings(scenario));
  const opportunity = opportunityFrom(source_findings, scenario);
  const opportunities = freezeArray(opportunity ? [opportunity] : []);
  const generated_proposals = freezeArray(opportunity ? [generatedProposal(opportunity, scenario, input.contract_scenario)] : []);
  const failures = collectFailures(source_findings, opportunities, generated_proposals, scenario);
  const metrics = metricsFor(generated_proposals, source_findings, failures);
  const base: Omit<AdaptationProposalGeneratorResult, "integrity_hash" | "replay_hash"> = {
    adaptation_proposal_generator_version: GENERATOR_VERSION,
    synthesis_rule_version: SYNTHESIS_RULE_VERSION,
    api_surface,
    source_findings,
    opportunities,
    generated_proposals,
    metrics,
    generation_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && generated_proposals.every((proposal) => replayAdaptationProposalContract(proposal.contract_result)),
    explainable: generated_proposals.every((proposal) => Boolean(proposal.contract_result.proposal.reason_for_change)),
    evidence_backed: source_findings.length > 0 && source_findings.every((finding) => finding.evidence_refs.length > 0),
    tenant_isolated: new Set(source_findings.map((finding) => finding.tenant_id)).size <= 1 && !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governance_enforced: !failures.includes("GOVERNANCE_ANALYSIS_FAILED") && generated_proposals.every((proposal) => proposal.contract_result.governance_enforced),
    constitutional_enforced: !failures.includes("CONSTITUTIONAL_ANALYSIS_FAILED") && !failures.includes("CONSTITUTIONAL_BYPASS_ATTEMPT"),
    authority_enforced: !failures.includes("AUTHORITY_ANALYSIS_FAILED") && !failures.includes("OPERATOR_AUTHORITY_REMOVAL_ATTEMPT"),
    advisory_only: true,
    executes_changes: false,
    deploys_changes: false,
    mutates_production: false,
    mutates_models: false,
    mutates_policy: false,
    bypasses_constitutional_review: false,
    removes_operator_authority: false,
    suppresses_governance_visibility: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationProposalGeneration(result: AdaptationProposalGeneratorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptationProposalGeneratorFoundation(): AdaptationProposalGeneratorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_proposal_generator_version: GENERATOR_VERSION,
    supported_categories: SUPPORTED_CATEGORIES,
    api_surface,
    result: generateAdaptationProposals(),
  });
}

export const AdaptationProposalGenerator = Object.freeze({
  generate: generateAdaptationProposals,
  replay: replayAdaptationProposalGeneration,
});
