import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { normalizeFeedback, replayFeedbackNormalization } from "@/services/feedback-normalization-engine";
import type { FeedbackNormalizationEngineInput } from "@/types/feedback-normalization-engine";
import type {
  RejectionFailureDimension,
  RejectionGapCategory,
  RejectionGapRecord,
  RejectionImprovementEvidence,
  RejectionImprovementOpportunity,
  RejectionLearningAnalyzerFoundation,
  RejectionLearningAnalyzerInput,
  RejectionLearningAnalyzerResult,
  RejectionLearningApiSurface,
  RejectionLearningAuditEvent,
  RejectionLearningCategory,
  RejectionLearningExplanation,
  RejectionLearningFailure,
  RejectionLearningScenario,
  RejectionPatternRegistryRecord,
} from "@/types/rejection-learning-analyzer";

const ANALYZER_VERSION = "rejection-learning-analyzer/v1" as const;
const RULE_VERSION = "rejection-learning-rules/v1" as const;
const ANALYZED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RejectionLearningAnalyzerInput["scenario"]>;

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

function buildApiSurface(): RejectionLearningApiSurface {
  const base: Omit<RejectionLearningApiSurface, "integrity_hash"> = {
    api_id: "rejection_learning_analyzer_api",
    analyze_rejection_learning: "POST /rejection-learning-analyzer/analyze",
    retrieve_classification: "POST /rejection-learning-analyzer/classification",
    retrieve_failure_analysis: "POST /rejection-learning-analyzer/failure",
    retrieve_gaps: "POST /rejection-learning-analyzer/gaps",
    retrieve_opportunities: "POST /rejection-learning-analyzer/opportunities",
    retrieve_improvement_evidence: "POST /rejection-learning-analyzer/evidence",
    retrieve_registry: "POST /rejection-learning-analyzer/registry",
    retrieve_audit: "POST /rejection-learning-analyzer/audit",
    replay_analysis: "POST /rejection-learning-analyzer/replay",
    retrieve_contract: "GET /rejection-learning-analyzer/contract",
    recommendation_mutation_supported: false,
    adaptive_proposal_generation_supported: false,
    model_retraining_supported: false,
    confidence_mutation_supported: false,
    governance_override_supported: false,
    production_mutation_supported: false,
    evidence_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function normalizationInputFor(scenario: Scenario): FeedbackNormalizationEngineInput {
  if (scenario === "NO_REJECTION") return { scenario: "APPROVAL" };
  if (scenario === "NORMALIZATION_REJECTED") return { scenario: "UNSUPPORTED_FEEDBACK_CLASSIFICATION" };
  if (scenario === "MISSING_REPLAY_LINEAGE") return { scenario: "REPLAY_REFERENCE_MISSING" };
  if (scenario === "MISSING_GOVERNANCE_METADATA") return { scenario: "GOVERNANCE_METADATA_OMISSION" };
  if (scenario === "CROSS_TENANT") return { scenario: "CROSS_TENANT_REFERENCE" };
  if (scenario === "EVIDENCE_INSUFFICIENT" || scenario === "MISSING_EVIDENCE") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because supporting evidence was insufficient.", rationale: "Rejected because supporting evidence was insufficient." } };
  if (scenario === "RECOMMENDATION_INCORRECT") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because the recommendation was inaccurate for the mission.", rationale: "Rejected because the recommendation was inaccurate for the mission." } };
  if (scenario === "CONFIDENCE_MISMATCH") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because confidence feels too high for the uncertainty.", rationale: "Rejected because confidence feels too high for the uncertainty.", confidence_signal: "OVERCONFIDENT" } };
  if (scenario === "GOVERNANCE_ISSUE" || scenario === "GOVERNANCE_BYPASS_ATTEMPT") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because policy and governance constraints conflict with the recommendation.", rationale: "Rejected because policy and governance constraints conflict with the recommendation.", governance_relevance: "HIGH" } };
  if (scenario === "TIMING_ISSUE") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because the recommendation arrived too late for the operational window.", rationale: "Rejected because the recommendation arrived too late for the operational window." } };
  if (scenario === "INCOMPLETE_CONTEXT") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because essential mission context was missing.", rationale: "Rejected because essential mission context was missing." } };
  if (scenario === "OPERATOR_EXPERTISE") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because operator expertise and local knowledge justified a different decision.", rationale: "Rejected because operator expertise and local knowledge justified a different decision." } };
  if (scenario === "SIMULATION_DISAGREEMENT") return { scenario: "REJECTION", feedback: { original_operator_wording: "Rejected because simulation results disagreed with the recommendation.", rationale: "Rejected because simulation results disagreed with the recommendation." } };
  return { scenario: "REJECTION" };
}

function categoryFor(scenario: Scenario, wording: string): RejectionLearningCategory {
  const lower = wording.toLowerCase();
  if (scenario === "EVIDENCE_INSUFFICIENT" || lower.includes("evidence")) return "EVIDENCE_INSUFFICIENT";
  if (scenario === "RECOMMENDATION_INCORRECT" || lower.includes("inaccurate") || lower.includes("unsuitable")) return "RECOMMENDATION_INCORRECT";
  if (scenario === "CONFIDENCE_MISMATCH" || lower.includes("confidence")) return "CONFIDENCE_MISMATCH";
  if (scenario === "GOVERNANCE_ISSUE" || lower.includes("governance") || lower.includes("policy")) return "GOVERNANCE_ISSUE";
  if (scenario === "TIMING_ISSUE" || lower.includes("too late") || lower.includes("too early")) return "TIMING_ISSUE";
  if (scenario === "INCOMPLETE_CONTEXT" || lower.includes("context")) return "INCOMPLETE_CONTEXT";
  if (scenario === "OPERATOR_EXPERTISE" || lower.includes("expertise") || lower.includes("local knowledge")) return "OPERATOR_EXPERTISE";
  if (scenario === "SIMULATION_DISAGREEMENT" || lower.includes("simulation")) return "SIMULATION_DISAGREEMENT";
  return "INCOMPLETE_CONTEXT";
}

function failureDimensionFor(category: RejectionLearningCategory): RejectionFailureDimension {
  const map: Record<RejectionLearningCategory, RejectionFailureDimension> = {
    EVIDENCE_INSUFFICIENT: "EVIDENCE_SUFFICIENCY",
    RECOMMENDATION_INCORRECT: "FACTUAL_ACCURACY",
    CONFIDENCE_MISMATCH: "CONFIDENCE_CALIBRATION",
    GOVERNANCE_ISSUE: "GOVERNANCE_COMPLIANCE",
    TIMING_ISSUE: "TIMING_APPROPRIATENESS",
    INCOMPLETE_CONTEXT: "CONTEXTUAL_AWARENESS",
    OPERATOR_EXPERTISE: "MISSION_ALIGNMENT",
    SIMULATION_DISAGREEMENT: "MISSION_ALIGNMENT",
  };
  return map[category];
}

function gapCategoryFor(category: RejectionLearningCategory): RejectionGapCategory {
  const map: Record<RejectionLearningCategory, RejectionGapCategory> = {
    EVIDENCE_INSUFFICIENT: "EVIDENCE_ACQUISITION_GAP",
    RECOMMENDATION_INCORRECT: "REASONING_GAP",
    CONFIDENCE_MISMATCH: "CONFIDENCE_CALIBRATION_GAP",
    GOVERNANCE_ISSUE: "GOVERNANCE_VALIDATION_GAP",
    TIMING_ISSUE: "PRIORITIZATION_GAP",
    INCOMPLETE_CONTEXT: "CONTEXT_AWARENESS_GAP",
    OPERATOR_EXPERTISE: "MISSION_AWARENESS_GAP",
    SIMULATION_DISAGREEMENT: "SIMULATION_COVERAGE_GAP",
  };
  return map[category];
}

function opportunityTypeFor(gap: RejectionGapCategory): RejectionImprovementOpportunity["opportunity_type"] {
  const map: Record<RejectionGapCategory, RejectionImprovementOpportunity["opportunity_type"]> = {
    EVIDENCE_ACQUISITION_GAP: "ADDITIONAL_EVIDENCE_COLLECTION",
    REASONING_GAP: "MISSION_SPECIFIC_GUIDANCE",
    CONTEXT_AWARENESS_GAP: "ENHANCED_CONTEXTUAL_REASONING",
    CONFIDENCE_CALIBRATION_GAP: "IMPROVED_CONFIDENCE_CALIBRATION",
    GOVERNANCE_VALIDATION_GAP: "BETTER_GOVERNANCE_VALIDATION",
    SIMULATION_COVERAGE_GAP: "EXPANDED_SIMULATION_COVERAGE",
    PRIORITIZATION_GAP: "PRIORITIZATION_REFINEMENT",
    EXPLAINABILITY_GAP: "STRONGER_EXPLANATIONS",
    RECOMMENDATION_COMPLETENESS_GAP: "MISSION_SPECIFIC_GUIDANCE",
    MISSION_AWARENESS_GAP: "MISSION_SPECIFIC_GUIDANCE",
  };
  return map[gap];
}

function secondaryFactors(primary: RejectionLearningCategory, scenario: Scenario): readonly RejectionLearningCategory[] {
  const factors = new Set<RejectionLearningCategory>();
  if (primary !== "INCOMPLETE_CONTEXT") factors.add("INCOMPLETE_CONTEXT");
  if (primary === "EVIDENCE_INSUFFICIENT") factors.add("CONFIDENCE_MISMATCH");
  if (scenario === "MISSION_OUTCOME_GAP") factors.add("OPERATOR_EXPERTISE");
  if (scenario === "DOWNSTREAM_OUTCOME_GAP") factors.add("RECOMMENDATION_INCORRECT");
  if (primary === "GOVERNANCE_ISSUE") factors.add("OPERATOR_EXPERTISE");
  factors.delete(primary);
  return freezeArray([...factors]);
}

function directFailureFor(scenario: Scenario): RejectionLearningFailure | undefined {
  const map: Partial<Record<Scenario, RejectionLearningFailure>> = {
    MISSING_REJECTION_REFERENCE: "REJECTION_REFERENCE_MISSING",
    MISSING_RECOMMENDATION: "RECOMMENDATION_UNAVAILABLE",
    MISSING_REPLAY_LINEAGE: "REPLAY_LINEAGE_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_UNAVAILABLE",
    MISSING_MISSION_OUTCOME: "MISSION_OUTCOME_UNAVAILABLE",
    MISSING_GOVERNANCE_METADATA: "GOVERNANCE_METADATA_INCOMPLETE",
    INVALID_RULE_VERSION: "ANALYSIS_RULE_VERSION_INVALID",
    NORMALIZATION_REJECTED: "NORMALIZED_FEEDBACK_REJECTED",
    CROSS_TENANT: "TENANT_ISOLATION_FAILED",
    INTEGRITY_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
    PRODUCTION_MUTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS_ATTEMPT: "GOVERNANCE_BYPASS_ATTEMPT",
  };
  return map[scenario];
}

function buildGap(normalizedId: string, category: RejectionLearningCategory, scenario: Scenario, evidenceRefs: readonly string[], replayRefs: readonly string[]): RejectionGapRecord {
  const gap = gapCategoryFor(category);
  const base: Omit<RejectionGapRecord, "integrity_hash"> = {
    gap_id: `rejection_gap_${hash(`${normalizedId}:${gap}:${RULE_VERSION}`).slice(0, 14)}`,
    category: gap,
    severity: category === "GOVERNANCE_ISSUE" ? "CRITICAL" : category === "RECOMMENDATION_INCORRECT" ? "HIGH" : "MEDIUM",
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : evidenceRefs,
    replay_refs: scenario === "MISSING_REPLAY_LINEAGE" ? freezeArray([]) : replayRefs,
    affected_recommendation_category: "mission_recommendation",
    improvement_priority: category === "GOVERNANCE_ISSUE" ? 0.95 : 0.78,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOpportunity(gap: RejectionGapRecord): RejectionImprovementOpportunity {
  const type = opportunityTypeFor(gap.category);
  const base: Omit<RejectionImprovementOpportunity, "integrity_hash"> = {
    opportunity_id: `rejection_opportunity_${hash(`${gap.gap_id}:${type}`).slice(0, 14)}`,
    opportunity_type: type,
    description: `${type.toLowerCase()} derived from ${gap.category.toLowerCase()}`,
    source_gap_refs: freezeArray([gap.gap_id]),
    may_increase_adaptation_priority: true,
    may_trigger_simulation: gap.category === "SIMULATION_COVERAGE_GAP",
    supports_governance_review: gap.category === "GOVERNANCE_VALIDATION_GAP",
    becomes_adaptive_evidence: true,
    changes_production_recommendations: false,
    modifies_recommendation_logic: false,
    alters_governance: false,
    retrains_models: false,
    bypasses_approval_workflows: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(normalizedId: string, category: RejectionLearningCategory, failure: RejectionFailureDimension, gap: RejectionGapRecord, opportunities: readonly RejectionImprovementOpportunity[], scenario: Scenario): RejectionPatternRegistryRecord {
  const base: Omit<RejectionPatternRegistryRecord, "integrity_hash"> = {
    pattern_id: `rejection_pattern_${hash(`${normalizedId}:${category}:${failure}`).slice(0, 14)}`,
    canonical_rejection_category: category,
    failure_classification: failure,
    recurrence_frequency: scenario === "BASELINE" ? 0.11 : 0.22,
    affected_recommendation_categories: freezeArray([gap.affected_recommendation_category, category.toLowerCase()]),
    supporting_evidence_refs: gap.supporting_evidence_refs,
    replay_refs: gap.replay_refs,
    governance_relevance: category === "GOVERNANCE_ISSUE" ? "HIGH" : "MEDIUM",
    improvement_opportunities: opportunities.map((opportunity) => opportunity.opportunity_id),
    first_observed_timestamp: ANALYZED_AT,
    latest_observed_timestamp: ANALYZED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(category: RejectionLearningCategory, failure: RejectionFailureDimension, gap: RejectionGapRecord, registry: RejectionPatternRegistryRecord, scenario: Scenario): RejectionImprovementEvidence {
  const base: Omit<RejectionImprovementEvidence, "integrity_hash"> = {
    evidence_id: `rejection_improvement_evidence_${hash(`${registry.pattern_id}:${gap.gap_id}`).slice(0, 14)}`,
    rejected_recommendation_ref: registry.pattern_id,
    rejection_classification: category,
    root_cause: failure,
    identified_gap_refs: freezeArray([gap.gap_id]),
    supporting_evidence_refs: gap.supporting_evidence_refs,
    mission_outcome: scenario === "MISSING_MISSION_OUTCOME" ? "" : "mission outcome retained for advisory correlation",
    downstream_outcome: scenario === "DOWNSTREAM_OUTCOME_GAP" ? "downstream outcome requires follow-up review" : "downstream outcome retained as evidence",
    replay_refs: gap.replay_refs,
    governance_relevance: registry.governance_relevance,
    confidence_assessment: `classification confidence ${category === "CONFIDENCE_MISMATCH" ? "0.92" : "0.86"}`,
    advisory_only: true,
    deterministic: true,
    replayable: true,
    explainable: true,
    immutable: true,
    governance_compliant: category !== "GOVERNANCE_ISSUE" || registry.governance_relevance === "HIGH",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: RejectionLearningAnalyzerInput, classification: RejectionLearningCategory | null): readonly RejectionLearningFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const normalization = input.normalization_result ?? normalizeFeedback(normalizationInputFor(scenario));
  const normalized = normalization.normalized_record;
  const failures: RejectionLearningFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (normalization.normalization_state !== "NORMALIZED" || !normalized) failures.push("NORMALIZED_FEEDBACK_REJECTED");
  if (normalized && normalized.canonical_feedback_type !== "REJECTION_FEEDBACK") failures.push("UNSUPPORTED_FEEDBACK_TYPE");
  if (!normalization.tenant_isolated) failures.push("TENANT_ISOLATION_FAILED");
  if (!replayFeedbackNormalization(normalization)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "MISSING_EVIDENCE" || (normalized && normalized.preserved_evidence_refs.length === 0)) failures.push("EVIDENCE_UNAVAILABLE");
  if (scenario === "MISSING_REPLAY_LINEAGE" || (normalized && normalized.preserved_replay_refs.length === 0)) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE_METADATA" || (normalized && !normalized.governance_metadata_hash)) failures.push("GOVERNANCE_METADATA_INCOMPLETE");
  if (scenario === "MISSING_MISSION_OUTCOME") failures.push("MISSION_OUTCOME_UNAVAILABLE");
  if (!classification && normalized?.canonical_feedback_type === "REJECTION_FEEDBACK") failures.push("REJECTION_REFERENCE_MISSING");
  return freezeArray([...new Set(failures)]);
}

function buildExplanation(
  scenario: Scenario,
  classification: RejectionLearningCategory | null,
  gapRecords: readonly RejectionGapRecord[],
  opportunities: readonly RejectionImprovementOpportunity[],
  evidence: RejectionImprovementEvidence | null,
  failures: readonly RejectionLearningFailure[],
): RejectionLearningExplanation {
  const base: Omit<RejectionLearningExplanation, "integrity_hash"> = {
    explanation_id: `rejection_learning_explanation_${hash(`${scenario}:${classification ?? "none"}`).slice(0, 14)}`,
    why_recommendation_was_rejected: classification ? `recommendation rejected due to ${classification.toLowerCase()}` : "no supported rejection signal was available for analysis",
    rejection_classification: classification ?? "none",
    supporting_evidence: evidence?.supporting_evidence_refs ?? freezeArray([]),
    identified_gaps: gapRecords.map((gap) => gap.category),
    improvement_opportunities: opportunities.map((opportunity) => opportunity.opportunity_type),
    mission_outcome: evidence?.mission_outcome || "not_analyzed",
    downstream_outcome: evidence?.downstream_outcome ?? "not_analyzed",
    governance_considerations: evidence?.governance_relevance === "HIGH" ? "governance review required before downstream adaptation" : failures.join(",") || "governance metadata retained",
    replay_lineage: evidence?.replay_refs ?? freezeArray([]),
    traceable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function auditEvent(seed: string, event_type: RejectionLearningAuditEvent["event_type"], outcome: string): RejectionLearningAuditEvent {
  const base: Omit<RejectionLearningAuditEvent, "integrity_hash"> = {
    audit_event_id: `rejection_learning_audit_${hash(`${seed}:${event_type}`).slice(0, 14)}`,
    event_type,
    outcome,
    recorded_at: ANALYZED_AT,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(seed: string, classification: RejectionLearningCategory | null, gapRecords: readonly RejectionGapRecord[], failures: readonly RejectionLearningFailure[]): readonly RejectionLearningAuditEvent[] {
  return freezeArray([
    auditEvent(seed, "REJECTION_REFERENCE", classification ? "resolved" : "unresolved"),
    auditEvent(seed, "CLASSIFICATION", classification ?? "none"),
    auditEvent(seed, "FAILURE_ANALYSIS", classification ? failureDimensionFor(classification) : "none"),
    auditEvent(seed, "GAP_ANALYSIS", gapRecords.map((gap) => gap.category).join("|") || "none"),
    auditEvent(seed, "OPPORTUNITY_DETECTION", gapRecords.length ? "generated" : "not_generated"),
    auditEvent(seed, "IMPROVEMENT_EVIDENCE", classification ? "generated" : "not_generated"),
    auditEvent(seed, "REGISTRY_APPEND", classification ? "append_only_recorded" : "not_recorded"),
    ...(failures.length ? [auditEvent(seed, "REJECTION", failures.join("|"))] : []),
  ]);
}

function resultReplayHash(result: Omit<RejectionLearningAnalyzerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    normalization_hash: result.normalization_result.integrity_hash,
    primary_classification: result.primary_classification,
    secondary_factors: result.secondary_factors,
    failure_analysis: result.failure_analysis,
    gap_records: result.gap_records,
    opportunities: result.improvement_opportunities,
    evidence: result.improvement_evidence,
    registry: result.pattern_registry,
    explanation: result.explanation,
    audit_events: result.audit_events,
    state: result.analysis_state,
  });
}

function resultIntegrityHash(result: Omit<RejectionLearningAnalyzerResult, "integrity_hash">): string {
  return hash({
    rejection_learning_analyzer_version: result.rejection_learning_analyzer_version,
    analysis_rule_version: result.analysis_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    gap_hashes: result.gap_records.map((gap) => gap.integrity_hash),
    opportunity_hashes: result.improvement_opportunities.map((opportunity) => opportunity.integrity_hash),
    evidence_hash: result.improvement_evidence?.integrity_hash ?? "none",
    registry_hashes: result.pattern_registry.map((record) => record.integrity_hash),
    explanation_hash: result.explanation.integrity_hash,
    audit_hashes: result.audit_events.map((event) => event.integrity_hash),
    replay_hash: result.replay_hash,
  });
}

export function analyzeRejectionLearning(input: RejectionLearningAnalyzerInput = {}): RejectionLearningAnalyzerResult {
  const api_surface = buildApiSurface();
  const scenario = input.scenario ?? "BASELINE";
  const normalization_result = input.normalization_result ?? normalizeFeedback(normalizationInputFor(scenario));
  const normalized = normalization_result.normalized_record;
  const provisionalClassification = normalized?.canonical_feedback_type === "REJECTION_FEEDBACK" ? categoryFor(scenario, normalized.original_operator_wording) : null;
  const failures = collectFailures({ ...input, normalization_result }, provisionalClassification);
  const primary_classification = failures.length ? null : provisionalClassification;
  const secondary_factors = primary_classification ? secondaryFactors(primary_classification, scenario) : freezeArray([]);
  const failure_analysis = primary_classification ? failureDimensionFor(primary_classification) : null;
  const gap_records = primary_classification && normalized ? freezeArray([buildGap(normalized.normalized_feedback_id, primary_classification, scenario, normalized.preserved_evidence_refs, normalized.preserved_replay_refs)]) : freezeArray([]);
  const improvement_opportunities = freezeArray(gap_records.map(buildOpportunity));
  const pattern_registry = primary_classification && failure_analysis && gap_records[0] ? freezeArray([buildRegistry(normalized?.normalized_feedback_id ?? normalization_result.integrity_hash, primary_classification, failure_analysis, gap_records[0], improvement_opportunities, scenario)]) : freezeArray([]);
  const improvement_evidence = primary_classification && failure_analysis && gap_records[0] && pattern_registry[0] ? buildEvidence(primary_classification, failure_analysis, gap_records[0], pattern_registry[0], scenario) : null;
  const explanation = buildExplanation(scenario, primary_classification, gap_records, improvement_opportunities, improvement_evidence, failures);
  const audit_events = buildAudit(normalized?.normalized_feedback_id ?? normalization_result.integrity_hash, primary_classification, gap_records, failures);
  const base: Omit<RejectionLearningAnalyzerResult, "integrity_hash" | "replay_hash"> = {
    rejection_learning_analyzer_version: ANALYZER_VERSION,
    analysis_rule_version: RULE_VERSION,
    api_surface,
    normalization_result,
    primary_classification,
    secondary_factors,
    classification_confidence: primary_classification === "CONFIDENCE_MISMATCH" ? 0.92 : primary_classification ? 0.86 : 0,
    failure_analysis,
    gap_records,
    improvement_opportunities,
    improvement_evidence,
    pattern_registry,
    explanation,
    audit_events,
    analysis_state: failures.length ? "REJECTED" : primary_classification ? "ANALYZED" : "NO_REJECTION_SIGNAL",
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayFeedbackNormalization(normalization_result),
    explainable: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_FAILED"),
    evidence_lineage_complete: !failures.includes("EVIDENCE_UNAVAILABLE"),
    replay_lineage_complete: !failures.includes("REPLAY_LINEAGE_INCOMPLETE"),
    evidence_only: true,
    immutable_registry: true,
    append_only_audit: true,
    modifies_recommendations: false,
    modifies_confidence: false,
    retrains_models: false,
    creates_adaptive_proposals: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRejectionLearningAnalysis(result: RejectionLearningAnalyzerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRejectionLearningAnalyzerFoundation(): RejectionLearningAnalyzerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    rejection_learning_analyzer_version: ANALYZER_VERSION,
    api_surface,
    result: analyzeRejectionLearning(),
  });
}

export const RejectionLearningAnalyzer = Object.freeze({
  analyze: analyzeRejectionLearning,
  replay: replayRejectionLearningAnalysis,
});
