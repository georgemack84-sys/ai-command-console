import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRecommendationRejection, replayRecommendationRejection } from "@/services/recommendation-rejection-analysis";
import type { RejectionAnalysisInput, RejectionAnalysisResult } from "@/types/recommendation-rejection-analysis";
import type {
  OverrideAnalysisApiSurface,
  OverrideAnalysisFailure,
  OverrideAnalysisFoundation,
  OverrideAnalysisInput,
  OverrideAnalysisLedgerRecord,
  OverrideAnalysisResult,
  OverrideAnalysisValidation,
  OverrideCategory,
  OverrideOutcomeAssessment,
  OverrideTrendPattern,
  OverrideTrendRecord,
  OverrideAnalysisRecord,
} from "@/types/override-analysis-engine";

const OVERRIDE_ANALYSIS_VERSION = "override-analysis-engine/v1" as const;

export const OVERRIDE_CATEGORIES: readonly OverrideCategory[] = Object.freeze([
  "IMPROVED_RECOMMENDATION",
  "PARTIAL_IMPROVEMENT",
  "MINOR_OPTIMIZATION",
  "CONTEXT_CHANGED",
  "RESOURCE_CONSTRAINT",
  "MISSION_PRIORITY_CHANGE",
  "TIMING_ADJUSTMENT",
  "GOVERNANCE_REQUIRED",
  "POLICY_ENFORCEMENT",
  "CONSTITUTIONAL_PROTECTION",
  "AUTHORITY_LIMITATION",
  "ESCALATION_REQUIRED",
  "APPROVAL_REQUIRED",
  "RISK_REDUCTION",
  "SAFETY_IMPROVEMENT",
  "UNCERTAINTY_MITIGATION",
  "BETTER_ALTERNATIVE",
  "IMPROVED_EVIDENCE",
  "CLARITY_IMPROVEMENT",
  "ADDITIONAL_CONTEXT",
  "WORKFLOW_PREFERENCE",
  "ORGANIZATIONAL_STANDARD",
  "OPERATOR_DISCRETION",
]);

type Scenario = NonNullable<OverrideAnalysisInput["scenario"]>;

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

function sourceForScenario(input: OverrideAnalysisInput, scenario: Scenario): RejectionAnalysisResult {
  if (input.rejection) return input.rejection;
  const rejectionScenario: RejectionAnalysisInput["scenario"] =
    scenario === "INCOMPLETE_EVIDENCE" ? "INSUFFICIENT_EVIDENCE" :
    scenario === "CLARITY_IMPROVEMENT" ? "POOR_EXPLANATION" :
    scenario === "UNCERTAINTY_MITIGATION" ? "LOW_CONFIDENCE" :
    scenario === "GOVERNANCE_REQUIRED" || scenario === "POLICY_ENFORCEMENT" ? "GOVERNANCE_CONCERN" :
    scenario === "AUTHORITY_LIMITATION" || scenario === "ESCALATION_REQUIRED" || scenario === "APPROVAL_REQUIRED" ? "AUTHORITY_CONFLICT" :
    scenario === "TIMING_ADJUSTMENT" ? "TIMING_ISSUE" :
    scenario === "ADDITIONAL_CONTEXT" || scenario === "CONTEXT_CHANGED" ? "INCOMPLETE_CONTEXT" :
    scenario === "BETTER_ALTERNATIVE" ? "INCORRECT_RECOMMENDATION" :
    scenario === "MISSING_GOVERNANCE" ? "MISSING_GOVERNANCE" :
    scenario === "MISSING_REPLAY" ? "MISSING_REPLAY" :
    scenario === "INCOMPLETE_LINEAGE" ? "INCOMPLETE_LINEAGE" :
    scenario === "HASH_MISMATCH" ? "HASH_MISMATCH" :
    scenario === "CROSS_TENANT" ? "CROSS_TENANT" :
    scenario === "RECONSTRUCTION_FAILURE" ? "RECONSTRUCTION_FAILURE" :
    scenario === "GOVERNANCE_FAILURE" ? "GOVERNANCE_FAILURE" :
    scenario === "CONSTITUTIONAL_FAILURE" || scenario === "CONSTITUTIONAL_PROTECTION" ? "CONSTITUTIONAL_FAILURE" :
    scenario === "REPLAY_DIVERGENCE" ? "REPLAY_DIVERGENCE" :
    scenario === "LEDGER_MUTATION" ? "LEDGER_MUTATION" :
    "BASELINE";
  return analyzeRecommendationRejection({ scenario: rejectionScenario });
}

function buildApiSurface(): OverrideAnalysisApiSurface {
  const base: Omit<OverrideAnalysisApiSurface, "integrity_hash"> = {
    api_id: "override_analysis_engine_api",
    analyze_override: "POST /override-analysis-engine/analyze",
    classify_override: "POST /override-analysis-engine/classify",
    compare_recommendation: "POST /override-analysis-engine/compare",
    evaluate_outcome: "POST /override-analysis-engine/outcome",
    generate_improvements: "POST /override-analysis-engine/improvements",
    validate_analysis: "POST /override-analysis-engine/validate",
    replay_analysis: "POST /override-analysis-engine/replay",
    retrieve_contract: "GET /override-analysis-engine/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoriesFor(scenario: Scenario): readonly OverrideCategory[] {
  if (OVERRIDE_CATEGORIES.includes(scenario as OverrideCategory)) return freezeArray([scenario as OverrideCategory]);
  if (scenario === "BASELINE") return freezeArray(["MINOR_OPTIMIZATION"]);
  return freezeArray(["OPERATOR_DISCRETION"]);
}

function trendFor(categories: readonly OverrideCategory[]): OverrideTrendPattern {
  if (categories.some((category) => category.includes("GOVERNANCE") || category === "POLICY_ENFORCEMENT" || category === "CONSTITUTIONAL_PROTECTION")) return "REPEATED_GOVERNANCE_OVERRIDE";
  if (categories.some((category) => category.includes("AUTHORITY") || category.includes("APPROVAL") || category.includes("ESCALATION"))) return "REPEATED_AUTHORITY_OVERRIDE";
  if (categories.some((category) => category.includes("WORKFLOW") || category === "ORGANIZATIONAL_STANDARD" || category === "OPERATOR_DISCRETION")) return "RECURRING_WORKFLOW_MODIFICATION";
  if (categories.some((category) => category.includes("EVIDENCE") || category === "ADDITIONAL_CONTEXT")) return "RECURRING_EVIDENCE_IMPROVEMENT";
  if (categories.some((category) => category.includes("IMPROVEMENT") || category.includes("OPTIMIZATION"))) return "COMMONLY_MODIFIED_RECOMMENDATION";
  return "FREQUENTLY_OVERRIDDEN_CATEGORY";
}

function outcomeFor(categories: readonly OverrideCategory[], scenario: Scenario): OverrideOutcomeAssessment {
  if (scenario === "INCOMPLETE_EVIDENCE" || scenario === "SUPPORTING_EVIDENCE_UNAVAILABLE") return "INSUFFICIENT_EVIDENCE";
  if (categories.includes("RISK_REDUCTION") || categories.includes("SAFETY_IMPROVEMENT") || categories.includes("UNCERTAINTY_MITIGATION")) return "REDUCED_RISK";
  if (categories.includes("GOVERNANCE_REQUIRED") || categories.includes("POLICY_ENFORCEMENT") || categories.includes("CONSTITUTIONAL_PROTECTION")) return "GOVERNANCE_PRESERVED";
  if (categories.includes("WORKFLOW_PREFERENCE") || categories.includes("ORGANIZATIONAL_STANDARD")) return "OPERATIONAL_EFFICIENCY";
  if (categories.includes("IMPROVED_RECOMMENDATION") || categories.includes("BETTER_ALTERNATIVE") || categories.includes("IMPROVED_EVIDENCE")) return "IMPROVED_OUTCOME";
  if (categories.includes("OPERATOR_DISCRETION")) return "EQUIVALENT_OUTCOME";
  return "EQUIVALENT_OUTCOME";
}

function improvementsFor(categories: readonly OverrideCategory[], scenario: Scenario): readonly string[] {
  if (scenario === "INCOMPLETE_EVIDENCE" || scenario === "SUPPORTING_EVIDENCE_UNAVAILABLE") return freezeArray([]);
  const opportunities = new Set<string>();
  if (categories.includes("IMPROVED_EVIDENCE") || categories.includes("ADDITIONAL_CONTEXT")) opportunities.add("strengthen evidence and context packaging");
  if (categories.includes("CLARITY_IMPROVEMENT")) opportunities.add("improve recommendation explanation clarity");
  if (categories.includes("UNCERTAINTY_MITIGATION")) opportunities.add("improve confidence and uncertainty communication");
  if (categories.includes("RISK_REDUCTION") || categories.includes("SAFETY_IMPROVEMENT")) opportunities.add("improve risk communication and mitigation options");
  if (categories.some((category) => category.includes("GOVERNANCE") || category === "POLICY_ENFORCEMENT")) opportunities.add("clarify governance guidance before operator review");
  if (categories.some((category) => category.includes("AUTHORITY") || category.includes("APPROVAL") || category.includes("ESCALATION"))) opportunities.add("clarify authority and approval path requirements");
  if (!opportunities.size) opportunities.add("review recommendation structure and workflow clarity");
  return freezeArray([...opportunities]);
}

function buildTrend(rejection: RejectionAnalysisResult, categories: readonly OverrideCategory[], scenario: Scenario): OverrideTrendRecord {
  const pattern = trendFor(categories);
  const base: Omit<OverrideTrendRecord, "integrity_hash"> = {
    trend_id: `override_trend_${hash(`${rejection.rejection_record.rejection_analysis_id}:${pattern}`).slice(0, 14)}`,
    tenant_id: rejection.rejection_record.tenant_id,
    pattern,
    categories,
    descriptive_only: true,
    modifies_future_recommendations: false,
    supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" ? freezeArray([]) : rejection.rejection_record.supporting_evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(rejection: RejectionAnalysisResult, trend: OverrideTrendRecord, scenario: Scenario): OverrideAnalysisRecord {
  const source = rejection.rejection_record;
  const categories = trend.categories;
  const primary = categories[0] ?? "OPERATOR_DISCRETION";
  const outcome = outcomeFor(categories, scenario);
  const opportunities = improvementsFor(categories, scenario);
  const effectiveness = Number(((source.mission_impact_score + source.governance_impact_score + (outcome === "IMPROVED_OUTCOME" || outcome === "REDUCED_RISK" || outcome === "GOVERNANCE_PRESERVED" ? 0.9 : 0.62)) / 3).toFixed(4));
  const base: Omit<OverrideAnalysisRecord, "integrity_hash"> = {
    override_analysis_id: `override_analysis_${hash(source.rejection_analysis_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${source.tenant_id}:foreign` : source.tenant_id,
    mission_id: source.mission_id,
    decision_id: source.decision_id,
    recommendation_id: source.recommendation_id,
    override_id: scenario === "MISSING_OVERRIDE" ? "" : `override_${hash(source.rejection_analysis_id).slice(0, 12)}`,
    original_recommendation: scenario === "MISSING_RECOMMENDATION" ? "" : source.recommendation_quality_assessment,
    modified_recommendation: `operator modification classified as ${primary.toLowerCase()}`,
    operator_action: scenario === "MISSING_OPERATOR_ACTION" || scenario === "OVERRIDE_UNVERIFIABLE" ? "" : "operator overrode recommendation and recorded modification",
    override_justification: scenario === "MISSING_JUSTIFICATION" ? "" : `${primary.toLowerCase()} justification supported by recorded operational context`,
    override_categories: categories,
    primary_override_category: primary,
    authority_assessment: categories.some((category) => category.includes("AUTHORITY") || category.includes("APPROVAL") || category.includes("ESCALATION")) ? "authority path required operator validation" : "operator authority preserved",
    governance_assessment: categories.some((category) => category.includes("GOVERNANCE") || category === "POLICY_ENFORCEMENT" || category === "CONSTITUTIONAL_PROTECTION") ? "governance preservation drove override" : "governance preserved",
    recommendation_comparison: scenario === "INCOMPLETE_COMPARISON" ? "" : "modified recommendation changes action scope while preserving recorded rationale references",
    override_outcome_assessment: outcome,
    override_effectiveness_score: effectiveness,
    mission_impact: `${outcome.toLowerCase()} with mission impact score ${source.mission_impact_score}`,
    workflow_impact_score: outcome === "OPERATIONAL_EFFICIENCY" ? 0.9 : 0.68,
    improvement_opportunities: opportunities,
    explanation: scenario === "MISSING_EXPLANATION" ? "" : `${primary.toLowerCase()} override classified from recorded justification, recommendation comparison, outcome assessment, and governance evidence`,
    trend_refs: freezeArray([trend.trend_id]),
    supporting_evidence_refs: scenario === "INCOMPLETE_EVIDENCE" || scenario === "SUPPORTING_EVIDENCE_UNAVAILABLE" ? freezeArray([]) : source.supporting_evidence_refs,
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : source.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : source.replay_refs,
    lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : source.lineage_refs,
    ledger_refs: freezeArray([rejection.ledger_record.ledger_record_id]),
    advisory_only: true,
    infers_operator_intent: false,
    modifies_recommendation_behavior: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.override_analysis_id }) });
  return record;
}

function collectFailures(rejection: RejectionAnalysisResult, record: OverrideAnalysisRecord, trend: OverrideTrendRecord, scenario: Scenario): readonly OverrideAnalysisFailure[] {
  const failures: OverrideAnalysisFailure[] = [];
  if (scenario === "MISSING_OVERRIDE" || !record.override_id) failures.push("OVERRIDE_RECORD_MISSING");
  if (scenario === "MISSING_OPERATOR_ACTION" || !record.operator_action) failures.push("OPERATOR_ACTION_UNAVAILABLE");
  if (scenario === "MISSING_RECOMMENDATION" || !record.original_recommendation) failures.push("RECOMMENDATION_UNAVAILABLE");
  if (scenario === "INCOMPLETE_COMPARISON" || !record.recommendation_comparison) failures.push("COMPARISON_INCOMPLETE");
  if (scenario === "MISSING_JUSTIFICATION" || !record.override_justification) failures.push("OVERRIDE_JUSTIFICATION_MISSING");
  if (scenario === "INCOMPLETE_EVIDENCE" || !record.supporting_evidence_refs.length || !trend.supporting_evidence_refs.length) failures.push("EVIDENCE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE" || !record.governance_refs.length) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || !record.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || !record.lineage_refs.length) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(record) !== record.integrity_hash) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== rejection.ledger_record.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "RECONSTRUCTION_FAILURE") failures.push("RECOMMENDATION_RECONSTRUCTION_FAILED");
  if (scenario === "OVERRIDE_UNVERIFIABLE") failures.push("OVERRIDE_UNVERIFIABLE");
  if (scenario === "SUPPORTING_EVIDENCE_UNAVAILABLE") failures.push("SUPPORTING_EVIDENCE_UNAVAILABLE");
  if (scenario === "GOVERNANCE_FAILURE" || !rejection.validation.governance_validated) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE" || !rejection.validation.replay_validated) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_MUTATION" || !rejection.validation.ledger_recorded) failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "MISSING_EXPLANATION" || !record.explanation) failures.push("EXPLANATION_MISSING");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly OverrideAnalysisFailure[]): OverrideAnalysisValidation["state"] {
  if (failures.includes("EVIDENCE_INCOMPLETE") || failures.includes("SUPPORTING_EVIDENCE_UNAVAILABLE")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildLedger(record: OverrideAnalysisRecord, scenario: Scenario): OverrideAnalysisLedgerRecord {
  const base: Omit<OverrideAnalysisLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `override_analysis_ledger_${hash(record.override_analysis_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    override_analysis_id: record.override_analysis_id,
    recommendation_ref: record.recommendation_id,
    decision_ref: record.decision_id,
    operator_override_ref: record.override_id,
    improvement_refs: record.improvement_opportunities.map((entry) => `improvement_${hash(entry).slice(0, 10)}`),
    trend_refs: record.trend_refs,
    evidence_refs: record.supporting_evidence_refs,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    append_only: true,
    deleted: false,
    ledger_sequence: 1,
  };
  const ledger = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_MUTATION") return Object.freeze({ ...ledger, deleted: true, integrity_hash: ledger.integrity_hash });
  return ledger;
}

function buildValidation(rejection: RejectionAnalysisResult, record: OverrideAnalysisRecord, trend: OverrideTrendRecord, ledger: OverrideAnalysisLedgerRecord, failures: readonly OverrideAnalysisFailure[]): OverrideAnalysisValidation {
  const recordVerified = hashWithoutIntegrity(record) === record.integrity_hash;
  const trendVerified = hashWithoutIntegrity(trend) === trend.integrity_hash;
  const ledgerVerified = hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const base: Omit<OverrideAnalysisValidation, "integrity_hash"> = {
    validation_id: "override_analysis_engine_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && recordVerified && trendVerified && ledgerVerified,
    failures,
    override_recorded: !failures.includes("OVERRIDE_RECORD_MISSING"),
    justification_captured: !failures.includes("OVERRIDE_JUSTIFICATION_MISSING"),
    comparison_completed: !failures.includes("COMPARISON_INCOMPLETE") && !failures.includes("RECOMMENDATION_UNAVAILABLE"),
    override_classified: record.override_categories.length > 0,
    outcome_evaluated: record.override_outcome_assessment !== "INSUFFICIENT_EVIDENCE" || !failures.includes("SUPPORTING_EVIDENCE_UNAVAILABLE"),
    improvements_identified: record.improvement_opportunities.length > 0 && !failures.includes("EVIDENCE_INCOMPLETE"),
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE") && replayRecommendationRejection(rejection),
    ledger_recorded: ledger.append_only && !ledger.deleted,
    evidence_complete: !failures.includes("EVIDENCE_INCOMPLETE") && !failures.includes("SUPPORTING_EVIDENCE_UNAVAILABLE"),
    explanations_complete: !failures.includes("EXPLANATION_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && record.tenant_id === rejection.ledger_record.tenant_id,
    integrity_verified: recordVerified && trendVerified && ledgerVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OverrideAnalysisResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    override_record: result.override_record,
    trend_record: result.trend_record,
    validation: result.validation,
    ledger: result.ledger_record,
    rejection_hash: result.rejection.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<OverrideAnalysisResult, "integrity_hash">): string {
  return hash({
    override_analysis_engine_version: result.override_analysis_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    override_record_hash: result.override_record.integrity_hash,
    trend_hash: result.trend_record.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_record.integrity_hash,
    rejection_hash: result.rejection.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    override_signal_only: result.override_signal_only,
    infers_operator_intent: result.infers_operator_intent,
    adaptive_learning: result.adaptive_learning,
    modifies_recommendations: result.modifies_recommendations,
    modifies_operator_actions: result.modifies_operator_actions,
  });
}

export function analyzeOverride(input: OverrideAnalysisInput = {}): OverrideAnalysisResult {
  const scenario = input.scenario ?? "BASELINE";
  const rejection = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const categories = categoriesFor(scenario);
  const trend_record = buildTrend(rejection, categories, scenario);
  const override_record = buildRecord(rejection, trend_record, scenario);
  const failures = collectFailures(rejection, override_record, trend_record, scenario);
  const ledger_record = buildLedger(override_record, scenario);
  const validation = buildValidation(rejection, override_record, trend_record, ledger_record, failures);
  const base: Omit<OverrideAnalysisResult, "integrity_hash" | "replay_hash"> = {
    override_analysis_engine_version: OVERRIDE_ANALYSIS_VERSION,
    rejection,
    api_surface,
    override_record,
    trend_record,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    override_signal_only: true,
    infers_operator_intent: false,
    adaptive_learning: false,
    modifies_recommendations: false,
    modifies_operator_actions: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayOverrideAnalysis(result: OverrideAnalysisResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function computeOverrideAnalysisHash(record: Omit<OverrideAnalysisRecord, "integrity_hash"> | OverrideAnalysisRecord): string {
  return hashWithoutIntegrity(record);
}

export function getOverrideAnalysisFoundation(): OverrideAnalysisFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    override_analysis_engine_version: OVERRIDE_ANALYSIS_VERSION,
    categories: OVERRIDE_CATEGORIES,
    api_surface,
    result: analyzeOverride(),
  });
}

export const OverrideAnalysisEngine = Object.freeze({
  analyze: analyzeOverride,
  replay: replayOverrideAnalysis,
});
