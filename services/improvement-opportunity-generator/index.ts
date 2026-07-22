import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { evaluateRecommendationDimensions, replayRecommendationDimensionEvaluation } from "@/services/recommendation-dimension-evaluation";
import type { DimensionEvaluationInput, DimensionEvaluationResult, RecommendationDimension } from "@/types/recommendation-dimension-evaluation";
import type {
  ImplementationComplexity,
  ImprovementClassification,
  ImprovementOpportunityApiSurface,
  ImprovementOpportunityCategory,
  ImprovementOpportunityFailure,
  ImprovementOpportunityFoundation,
  ImprovementOpportunityInput,
  ImprovementOpportunityLedgerRecord,
  ImprovementOpportunityRegistry,
  ImprovementOpportunityResult,
  ImprovementOpportunityValidation,
  ImprovementPriority,
  RecommendationImprovement,
} from "@/types/improvement-opportunity-generator";

const IMPROVEMENT_OPPORTUNITY_VERSION = "improvement-opportunity-generator/v1" as const;

export const IMPROVEMENT_OPPORTUNITY_CATEGORIES: readonly ImprovementOpportunityCategory[] = Object.freeze([
  "EVIDENCE",
  "CONFIDENCE",
  "EXPLAINABILITY",
  "RISK",
  "GOVERNANCE",
  "WORKFLOW",
  "DECISION_PACKAGE",
]);

export const IMPROVEMENT_CLASSIFICATIONS: readonly ImprovementClassification[] = Object.freeze([
  "EVIDENCE_COMPLETENESS",
  "EVIDENCE_CREDIBILITY",
  "EVIDENCE_RELEVANCE",
  "EVIDENCE_SUFFICIENCY",
  "CONFIDENCE_CALIBRATION",
  "CONFIDENCE_TRANSPARENCY",
  "UNCERTAINTY_COMMUNICATION",
  "CLARITY",
  "TRANSPARENCY",
  "OPERATOR_READABILITY",
  "RISK_ESTIMATION",
  "MITIGATION_QUALITY",
  "UNCERTAINTY_HANDLING",
  "CONSTITUTIONAL_ALIGNMENT",
  "POLICY_ALIGNMENT",
  "AUTHORITY_ALIGNMENT",
  "OPERATOR_USABILITY",
  "DECISION_FLOW",
  "EXECUTION_SUPPORT",
  "CONTEXT_COMPLETENESS",
  "ALTERNATIVE_QUALITY",
  "ROLLBACK_QUALITY",
]);

type Scenario = NonNullable<ImprovementOpportunityInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): DimensionEvaluationInput["scenario"] {
  const map: Partial<Record<Scenario, DimensionEvaluationInput["scenario"]>> = {
    WEAK_EVIDENCE_ONLY: "WEAK_EVIDENCE_ONLY",
    WEAK_RISK_ONLY: "WEAK_RISK_ONLY",
    WEAK_CONFIDENCE_ONLY: "WEAK_CONFIDENCE_ONLY",
    WEAK_GOVERNANCE_ONLY: "WEAK_GOVERNANCE_ONLY",
    WEAK_EXPLAINABILITY_ONLY: "WEAK_EXPLAINABILITY_ONLY",
    WEAK_ALTERNATIVES_ONLY: "WEAK_ALTERNATIVES_ONLY",
    WEAK_ROLLBACK_ONLY: "WEAK_ROLLBACK_ONLY",
    MISSING_RECOMMENDATION: "MISSING_RECOMMENDATION",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    INCOMPLETE_LINEAGE: "INCOMPLETE_LINEAGE",
    HASH_MISMATCH: "HASH_MISMATCH",
    CROSS_TENANT: "CROSS_TENANT",
    RECONSTRUCTION_FAILURE: "RECONSTRUCTION_FAILURE",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    LEDGER_MUTATION: "LEDGER_MUTATION",
    EVALUATION_VERIFICATION_FAILURE: "HASH_MISMATCH",
    EVIDENCE_UNAVAILABLE: "MISSING_EVIDENCE",
    EXCEPTIONAL: "EXCEPTIONAL",
    HIGH: "HIGH",
    GOOD: "GOOD",
    ADEQUATE: "ADEQUATE",
    LIMITED: "LIMITED",
    POOR: "POOR",
    UNACCEPTABLE: "UNACCEPTABLE",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: ImprovementOpportunityInput, scenario: Scenario): DimensionEvaluationResult {
  if (input.dimension_evaluation) return input.dimension_evaluation;
  if (scenario === "MISSING_EVALUATION") return evaluateRecommendationDimensions({ scenario: "INCOMPLETE_DIMENSIONS" });
  return evaluateRecommendationDimensions({ scenario: sourceScenario(scenario) });
}

function buildApiSurface(): ImprovementOpportunityApiSurface {
  const base: Omit<ImprovementOpportunityApiSurface, "integrity_hash"> = {
    api_id: "improvement_opportunity_generator_api",
    generate_opportunities: "POST /improvement-opportunity-generator/generate",
    register_opportunities: "POST /improvement-opportunity-generator/registry",
    classify_opportunities: "POST /improvement-opportunity-generator/classify",
    assess_benefits: "POST /improvement-opportunity-generator/benefit",
    evaluate_governance_readiness: "POST /improvement-opportunity-generator/governance",
    validate_generation: "POST /improvement-opportunity-generator/validate",
    replay_generation: "POST /improvement-opportunity-generator/replay",
    retrieve_contract: "GET /improvement-opportunity-generator/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
    recommendation_modification_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoryForDimension(dimension: RecommendationDimension): ImprovementOpportunityCategory {
  const map: Record<RecommendationDimension, ImprovementOpportunityCategory> = {
    EVIDENCE: "EVIDENCE",
    RISK: "RISK",
    CONFIDENCE: "CONFIDENCE",
    GOVERNANCE: "GOVERNANCE",
    EXPLAINABILITY: "EXPLAINABILITY",
    ALTERNATIVES: "DECISION_PACKAGE",
    ROLLBACK: "DECISION_PACKAGE",
  };
  return map[dimension];
}

function classificationFor(dimension: RecommendationDimension, score: number): ImprovementClassification {
  if (dimension === "EVIDENCE") return score < 0.5 ? "EVIDENCE_SUFFICIENCY" : "EVIDENCE_COMPLETENESS";
  if (dimension === "RISK") return score < 0.5 ? "MITIGATION_QUALITY" : "RISK_ESTIMATION";
  if (dimension === "CONFIDENCE") return score < 0.5 ? "UNCERTAINTY_COMMUNICATION" : "CONFIDENCE_CALIBRATION";
  if (dimension === "GOVERNANCE") return score < 0.5 ? "CONSTITUTIONAL_ALIGNMENT" : "POLICY_ALIGNMENT";
  if (dimension === "EXPLAINABILITY") return score < 0.5 ? "OPERATOR_READABILITY" : "CLARITY";
  if (dimension === "ALTERNATIVES") return "ALTERNATIVE_QUALITY";
  return "ROLLBACK_QUALITY";
}

function priorityFor(score: number): ImprovementPriority {
  if (score < 0.4) return "CRITICAL";
  if (score < 0.5) return "HIGH";
  if (score < 0.65) return "MEDIUM";
  if (score < 0.75) return "LOW";
  return "MAINTAIN";
}

function complexityFor(category: ImprovementOpportunityCategory, priority: ImprovementPriority): ImplementationComplexity {
  if (category === "GOVERNANCE" || priority === "CRITICAL") return "HIGH";
  if (category === "DECISION_PACKAGE" || category === "WORKFLOW" || priority === "HIGH") return "MEDIUM";
  return "LOW";
}

function expectedBenefitFor(score: number, priority: ImprovementPriority): number {
  const base = Number((1 - Math.min(0.95, score)).toFixed(4));
  const multiplier = priority === "CRITICAL" ? 0.95 : priority === "HIGH" ? 0.82 : priority === "MEDIUM" ? 0.66 : priority === "LOW" ? 0.42 : 0.18;
  return Number(Math.max(0.05, Math.min(0.95, base * multiplier)).toFixed(4));
}

function governanceRequirements(category: ImprovementOpportunityCategory): readonly string[] {
  const base = ["operator approval", "governance approval", "adaptive intelligence evaluation"];
  if (category === "GOVERNANCE") return freezeArray([...base, "constitutional review", "authority review"]);
  if (category === "RISK") return freezeArray([...base, "simulation"]);
  return freezeArray(base);
}

function buildOpportunities(source: DimensionEvaluationResult, scenario: Scenario): readonly RecommendationImprovement[] {
  if (scenario === "MISSING_EVALUATION") return freezeArray([]);
  const evaluation = source.evaluation_record;
  const candidates = source.evaluation_record.dimension_scores.filter((score) => score.score < 0.75);
  const scored = candidates.length ? candidates : source.evaluation_record.dimension_scores;
  return freezeArray(scored.map((dimensionScore) => {
    const category = categoryForDimension(dimensionScore.dimension);
    const priority = priorityFor(dimensionScore.score);
    const classification = classificationFor(dimensionScore.dimension, dimensionScore.score);
    const base: Omit<RecommendationImprovement, "integrity_hash"> = {
      improvement_id: `improvement_${hash(`${evaluation.dimension_evaluation_id}:${dimensionScore.dimension}:${classification}`).slice(0, 14)}`,
      tenant_id: evaluation.tenant_id,
      mission_id: evaluation.mission_id,
      decision_id: evaluation.decision_id,
      recommendation_id: evaluation.recommendation_id,
      category,
      classification,
      rationale: `${dimensionScore.dimension.toLowerCase()} evaluation produced ${dimensionScore.rating.toLowerCase()} rating with deterministic score ${dimensionScore.score}`,
      supporting_evidence: dimensionScore.findings,
      expected_benefit: expectedBenefitFor(dimensionScore.score, priority),
      expected_benefit_summary: `${category.toLowerCase()} review may improve future recommendation quality; projection is advisory only`,
      governance_required: true,
      governance_requirements: governanceRequirements(category),
      implementation_priority: priority,
      implementation_complexity: complexityFor(category, priority),
      improvement_status: "GOVERNANCE_REVIEW_REQUIRED",
      supporting_evidence_refs: scenario === "MISSING_EVIDENCE" || scenario === "EVIDENCE_UNAVAILABLE" ? freezeArray([]) : dimensionScore.supporting_evidence_refs,
      governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : dimensionScore.governance_refs,
      replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : dimensionScore.replay_refs,
      lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : dimensionScore.lineage_refs,
      source_dimension_score_refs: freezeArray([dimensionScore.dimension_score_id]),
      ledger_refs: evaluation.ledger_refs,
      advisory_only: true,
      implementation_authorized: false,
      modifies_recommendation_behavior: false,
    };
    const opportunity = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HASH_MISMATCH" && dimensionScore.dimension === "EVIDENCE") return Object.freeze({ ...opportunity, integrity_hash: hash({ tampered: opportunity.improvement_id }) });
    return opportunity;
  }));
}

function buildRegistry(source: DimensionEvaluationResult, opportunities: readonly RecommendationImprovement[], scenario: Scenario): ImprovementOpportunityRegistry {
  const category_index = IMPROVEMENT_OPPORTUNITY_CATEGORIES.reduce((index, category) => {
    return { ...index, [category]: freezeArray(opportunities.filter((opportunity) => opportunity.category === category).map((opportunity) => opportunity.improvement_id)) };
  }, {} as Record<ImprovementOpportunityCategory, readonly string[]>);
  const base: Omit<ImprovementOpportunityRegistry, "integrity_hash"> = {
    registry_id: `improvement_registry_${hash(source.evaluation_record.dimension_evaluation_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${source.evaluation_record.tenant_id}:foreign` : source.evaluation_record.tenant_id,
    opportunity_refs: opportunities.map((opportunity) => opportunity.improvement_id),
    category_index: Object.freeze(category_index),
    append_only: true,
    tenant_isolated: scenario !== "CROSS_TENANT",
    immutable: true,
    update_supported: false,
    delete_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: DimensionEvaluationResult, registry: ImprovementOpportunityRegistry, opportunities: readonly RecommendationImprovement[], scenario: Scenario): ImprovementOpportunityLedgerRecord {
  const evidenceRefs = freezeArray([...new Set(opportunities.flatMap((opportunity) => opportunity.supporting_evidence_refs))]);
  const governanceRefs = freezeArray([...new Set(opportunities.flatMap((opportunity) => opportunity.governance_refs))]);
  const replayRefs = freezeArray([...new Set(opportunities.flatMap((opportunity) => opportunity.replay_refs))]);
  const base: Omit<ImprovementOpportunityLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `improvement_opportunity_ledger_${hash(registry.registry_id).slice(0, 14)}`,
    tenant_id: registry.tenant_id,
    registry_id: registry.registry_id,
    opportunity_refs: registry.opportunity_refs,
    recommendation_ref: source.evaluation_record.recommendation_id,
    decision_ref: source.evaluation_record.decision_id,
    evaluation_refs: freezeArray([source.evaluation_record.dimension_evaluation_id]),
    evidence_refs: evidenceRefs,
    governance_refs: governanceRefs,
    replay_refs: replayRefs,
    append_only: true,
    deleted: false,
    ledger_sequence: 1,
  };
  const ledger = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_MUTATION") return Object.freeze({ ...ledger, deleted: true, integrity_hash: ledger.integrity_hash });
  return ledger;
}

function collectFailures(source: DimensionEvaluationResult, opportunities: readonly RecommendationImprovement[], registry: ImprovementOpportunityRegistry, ledger: ImprovementOpportunityLedgerRecord, scenario: Scenario): readonly ImprovementOpportunityFailure[] {
  const failures: ImprovementOpportunityFailure[] = [];
  if (scenario === "MISSING_RECOMMENDATION" || !source.evaluation_record.recommendation_id) failures.push("ORIGINATING_RECOMMENDATION_UNAVAILABLE");
  if (scenario === "MISSING_EVALUATION" || !opportunities.length || !source.validation.dimensions_complete) failures.push("EVALUATION_RESULTS_MISSING");
  if (scenario === "MISSING_EVIDENCE" || scenario === "EVIDENCE_UNAVAILABLE" || opportunities.some((opportunity) => !opportunity.supporting_evidence_refs.length)) failures.push("SUPPORTING_EVIDENCE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE" || opportunities.some((opportunity) => !opportunity.governance_refs.length)) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || opportunities.some((opportunity) => !opportunity.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || opportunities.some((opportunity) => !opportunity.lineage_refs.length)) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || opportunities.some((opportunity) => hashWithoutIntegrity(opportunity) !== opportunity.integrity_hash)) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "CROSS_TENANT" || !registry.tenant_isolated || registry.tenant_id !== source.evaluation_record.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "RECONSTRUCTION_FAILURE") failures.push("RECOMMENDATION_RECONSTRUCTION_FAILED");
  if (scenario === "EVIDENCE_UNAVAILABLE") failures.push("SUPPORTING_EVIDENCE_UNAVAILABLE");
  if (scenario === "EVALUATION_VERIFICATION_FAILURE" || !replayRecommendationDimensionEvaluation(source)) failures.push("EVALUATION_VERIFICATION_FAILED");
  if (scenario === "GOVERNANCE_FAILURE" || !source.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE" || !source.validation.replay_validated) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_MUTATION" || ledger.deleted || !source.validation.ledger_recorded) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "ADAPTATION_ATTEMPT" || opportunities.some((opportunity) => opportunity.implementation_authorized || opportunity.modifies_recommendation_behavior)) failures.push("AUTOMATIC_ADAPTATION_ATTEMPTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly ImprovementOpportunityFailure[]): ImprovementOpportunityValidation["state"] {
  if (failures.includes("SUPPORTING_EVIDENCE_INCOMPLETE") || failures.includes("SUPPORTING_EVIDENCE_UNAVAILABLE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(source: DimensionEvaluationResult, opportunities: readonly RecommendationImprovement[], registry: ImprovementOpportunityRegistry, ledger: ImprovementOpportunityLedgerRecord, failures: readonly ImprovementOpportunityFailure[]): ImprovementOpportunityValidation {
  const opportunitiesVerified = opportunities.every((opportunity) => hashWithoutIntegrity(opportunity) === opportunity.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<ImprovementOpportunityValidation, "integrity_hash"> = {
    validation_id: "improvement_opportunity_generator_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && opportunitiesVerified && registryVerified && ledgerVerified,
    failures,
    originating_recommendation_available: !failures.includes("ORIGINATING_RECOMMENDATION_UNAVAILABLE"),
    evaluation_results_verified: !failures.includes("EVALUATION_RESULTS_MISSING") && !failures.includes("EVALUATION_VERIFICATION_FAILED"),
    supporting_evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_INCOMPLETE") && !failures.includes("SUPPORTING_EVIDENCE_UNAVAILABLE"),
    governance_ready: !failures.includes("GOVERNANCE_VALIDATION_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    governance_approval_required: opportunities.every((opportunity) => opportunity.governance_required),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE") && replayRecommendationDimensionEvaluation(source),
    ledger_recorded: ledger.append_only && !ledger.deleted,
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && registry.tenant_id === source.evaluation_record.tenant_id,
    integrity_verified: opportunitiesVerified && registryVerified && ledgerVerified,
    advisory_only: opportunities.every((opportunity) => opportunity.advisory_only),
    no_automatic_adaptation: opportunities.every((opportunity) => !opportunity.implementation_authorized && !opportunity.modifies_recommendation_behavior),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ImprovementOpportunityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    opportunities: result.opportunities,
    registry: result.registry,
    validation: result.validation,
    ledger: result.ledger_record,
    dimension_evaluation_hash: result.dimension_evaluation.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<ImprovementOpportunityResult, "integrity_hash">): string {
  return hash({
    improvement_opportunity_generator_version: result.improvement_opportunity_generator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    opportunity_hashes: result.opportunities.map((opportunity) => opportunity.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_record.integrity_hash,
    dimension_evaluation_hash: result.dimension_evaluation.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    governance_controlled: result.governance_controlled,
    adaptive_learning: result.adaptive_learning,
    modifies_recommendations: result.modifies_recommendations,
    implementation_authorized: result.implementation_authorized,
  });
}

export function generateImprovementOpportunities(input: ImprovementOpportunityInput = {}): ImprovementOpportunityResult {
  const scenario = input.scenario ?? "BASELINE";
  const dimension_evaluation = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const opportunities = [...buildOpportunities(dimension_evaluation, scenario)].sort((left, right) => {
    const order: Record<ImprovementPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, MAINTAIN: 4 };
    return order[left.implementation_priority] - order[right.implementation_priority] || left.improvement_id.localeCompare(right.improvement_id);
  });
  const frozenOpportunities = freezeArray(opportunities);
  const registry = buildRegistry(dimension_evaluation, frozenOpportunities, scenario);
  const ledger_record = buildLedger(dimension_evaluation, registry, frozenOpportunities, scenario);
  const failures = collectFailures(dimension_evaluation, frozenOpportunities, registry, ledger_record, scenario);
  const validation = buildValidation(dimension_evaluation, frozenOpportunities, registry, ledger_record, failures);
  const base: Omit<ImprovementOpportunityResult, "integrity_hash" | "replay_hash"> = {
    improvement_opportunity_generator_version: IMPROVEMENT_OPPORTUNITY_VERSION,
    dimension_evaluation,
    api_surface,
    opportunities: frozenOpportunities,
    registry,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    governance_controlled: true,
    adaptive_learning: false,
    modifies_recommendations: false,
    implementation_authorized: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayImprovementOpportunityGeneration(result: ImprovementOpportunityResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function computeImprovementOpportunityHash(record: Omit<RecommendationImprovement, "integrity_hash"> | RecommendationImprovement): string {
  return hashWithoutIntegrity(record);
}

export function getImprovementOpportunityFoundation(): ImprovementOpportunityFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    improvement_opportunity_generator_version: IMPROVEMENT_OPPORTUNITY_VERSION,
    categories: IMPROVEMENT_OPPORTUNITY_CATEGORIES,
    classifications: IMPROVEMENT_CLASSIFICATIONS,
    api_surface,
    result: generateImprovementOpportunities(),
  });
}

export const ImprovementOpportunityGenerator = Object.freeze({
  generate: generateImprovementOpportunities,
  replay: replayImprovementOpportunityGeneration,
});
