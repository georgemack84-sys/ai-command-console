import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { normalizeFeedback, replayFeedbackNormalization } from "@/services/feedback-normalization-engine";
import type { FeedbackNormalizationEngineInput } from "@/types/feedback-normalization-engine";
import type {
  OverrideContextAnalysis,
  OverrideContextCategory,
  OverrideFrequencyMetrics,
  OverrideImprovementEvidence,
  OverrideLearningAnalyzerFoundation,
  OverrideLearningAnalyzerInput,
  OverrideLearningAnalyzerResult,
  OverrideLearningApiSurface,
  OverrideLearningAuditEvent,
  OverrideLearningExplanation,
  OverrideLearningFailure,
  OverrideLearningScenario,
  OverridePatternRecord,
  OverridePatternType,
  OverrideRootCause,
} from "@/types/override-learning-analyzer";

const ANALYZER_VERSION = "override-learning-analyzer/v1" as const;
const RULE_VERSION = "override-learning-rules/v1" as const;
const ANALYZED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<OverrideLearningAnalyzerInput["scenario"]>;

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

function buildApiSurface(): OverrideLearningApiSurface {
  const base: Omit<OverrideLearningApiSurface, "integrity_hash"> = {
    api_id: "override_learning_analyzer_api",
    analyze_override_learning: "POST /override-learning-analyzer/analyze",
    retrieve_patterns: "POST /override-learning-analyzer/patterns",
    retrieve_root_cause: "POST /override-learning-analyzer/root-cause",
    retrieve_frequency: "POST /override-learning-analyzer/frequency",
    retrieve_context: "POST /override-learning-analyzer/context",
    retrieve_improvement_evidence: "POST /override-learning-analyzer/evidence",
    retrieve_registry: "POST /override-learning-analyzer/registry",
    retrieve_audit: "POST /override-learning-analyzer/audit",
    replay_analysis: "POST /override-learning-analyzer/replay",
    retrieve_contract: "GET /override-learning-analyzer/contract",
    modifies_recommendations_supported: false,
    confidence_mutation_supported: false,
    model_retraining_supported: false,
    adaptive_proposal_generation_supported: false,
    governance_override_supported: false,
    production_mutation_supported: false,
    evidence_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function normalizationInputFor(scenario: Scenario): FeedbackNormalizationEngineInput {
  if (scenario === "NO_OVERRIDE") return { scenario: "APPROVAL" };
  if (scenario === "NORMALIZATION_REJECTED") return { scenario: "UNSUPPORTED_FEEDBACK_CLASSIFICATION" };
  if (scenario === "MISSING_REPLAY_LINEAGE") return { scenario: "REPLAY_REFERENCE_MISSING" };
  if (scenario === "MISSING_GOVERNANCE_METADATA") return { scenario: "GOVERNANCE_METADATA_OMISSION" };
  if (scenario === "CROSS_TENANT") return { scenario: "CROSS_TENANT_REFERENCE" };
  if (scenario === "INSUFFICIENT_EVIDENCE" || scenario === "MISSING_EVIDENCE") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because supporting evidence was insufficient.", rationale: "Override because supporting evidence was insufficient." } };
  }
  if (scenario === "INACCURATE_CONFIDENCE") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because confidence feels too high for the uncertainty.", rationale: "Override because confidence feels too high for the uncertainty.", confidence_signal: "OVERCONFIDENT" } };
  }
  if (scenario === "GOVERNANCE_DISAGREEMENT" || scenario === "GOVERNANCE_BYPASS_ATTEMPT") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because policy and governance constraints require a different action.", rationale: "Override because policy and governance constraints require a different action.", governance_relevance: "HIGH" } };
  }
  if (scenario === "CONTEXTUAL_KNOWLEDGE" || scenario === "MISSING_MISSION_CONTEXT") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because local mission context changed after the recommendation was produced.", rationale: "Override because local mission context changed after the recommendation was produced." } };
  }
  if (scenario === "MISSION_SPECIFIC_FACTORS") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because mission objectives and constraints require a different priority.", rationale: "Override because mission objectives and constraints require a different priority." } };
  }
  if (scenario === "INCORRECT_PRIORITIZATION") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because the recommendation prioritized the wrong operational objective.", rationale: "Override because the recommendation prioritized the wrong operational objective." } };
  }
  if (scenario === "EXCESSIVE_CAUTION") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because the recommendation was too cautious for the operational window.", rationale: "Override because the recommendation was too cautious for the operational window." } };
  }
  if (scenario === "EXCESSIVE_OPTIMISM") {
    return { scenario: "OVERRIDE", feedback: { original_operator_wording: "Override because the recommendation underestimated risk and operational complexity.", rationale: "Override because the recommendation underestimated risk and operational complexity." } };
  }
  return { scenario: "OVERRIDE" };
}

function rootCauseFor(scenario: Scenario, wording: string): OverrideRootCause {
  const lower = wording.toLowerCase();
  if (scenario === "INSUFFICIENT_EVIDENCE" || lower.includes("evidence")) return "INSUFFICIENT_EVIDENCE";
  if (scenario === "INACCURATE_CONFIDENCE" || lower.includes("confidence")) return "INACCURATE_CONFIDENCE";
  if (scenario === "INCORRECT_PRIORITIZATION" || lower.includes("priorit")) return "INCORRECT_PRIORITIZATION";
  if (scenario === "EXCESSIVE_CAUTION" || lower.includes("too cautious")) return "EXCESSIVE_CAUTION";
  if (scenario === "EXCESSIVE_OPTIMISM" || lower.includes("underestimated risk") || lower.includes("complexity")) return "EXCESSIVE_OPTIMISM";
  if (scenario === "GOVERNANCE_DISAGREEMENT" || lower.includes("governance") || lower.includes("policy")) return "GOVERNANCE_DISAGREEMENT";
  if (scenario === "CONTEXTUAL_KNOWLEDGE" || lower.includes("local mission context") || lower.includes("context changed")) return "CONTEXTUAL_KNOWLEDGE";
  if (scenario === "MISSION_SPECIFIC_FACTORS" || lower.includes("mission objectives")) return "MISSION_SPECIFIC_FACTORS";
  return "CONTEXTUAL_KNOWLEDGE";
}

function contributingFactors(primary: OverrideRootCause, scenario: Scenario): readonly OverrideRootCause[] {
  const factors = new Set<OverrideRootCause>();
  if (primary !== "CONTEXTUAL_KNOWLEDGE") factors.add("CONTEXTUAL_KNOWLEDGE");
  if (scenario === "HIGH_RISK_MISSION" || scenario === "EMERGENCY_RESPONSE") factors.add("EXCESSIVE_OPTIMISM");
  if (scenario === "COMPLIANCE_SENSITIVE_MISSION" || primary === "GOVERNANCE_DISAGREEMENT") factors.add("GOVERNANCE_DISAGREEMENT");
  if (primary === "INSUFFICIENT_EVIDENCE") factors.add("INACCURATE_CONFIDENCE");
  factors.delete(primary);
  return freezeArray([...factors]);
}

function patternTypeFor(rootCause: OverrideRootCause): OverridePatternType {
  if (rootCause === "INSUFFICIENT_EVIDENCE") return "REPEATED_EVIDENCE_DEFICIENCY";
  if (rootCause === "INACCURATE_CONFIDENCE") return "RECURRING_CONFIDENCE_ISSUE";
  if (rootCause === "GOVERNANCE_DISAGREEMENT") return "GOVERNANCE_RELATED_OVERRIDE";
  if (rootCause === "MISSION_SPECIFIC_FACTORS") return "MISSION_SPECIFIC_OVERRIDE_TREND";
  if (rootCause === "INCORRECT_PRIORITIZATION" || rootCause === "EXCESSIVE_CAUTION" || rootCause === "EXCESSIVE_OPTIMISM") return "REPEATED_RECOMMENDATION_WEAKNESS";
  return "RECURRING_OVERRIDE_REASON";
}

function contextCategoriesFor(scenario: Scenario, rootCause: OverrideRootCause): readonly OverrideContextCategory[] {
  const categories = new Set<OverrideContextCategory>(["ROUTINE_OPERATIONS"]);
  if (scenario === "DEGRADED_OPERATIONS") categories.add("DEGRADED_OPERATIONS");
  if (scenario === "EMERGENCY_RESPONSE") categories.add("EMERGENCY_RESPONSE");
  if (scenario === "HIGH_RISK_MISSION" || rootCause === "EXCESSIVE_OPTIMISM") categories.add("HIGH_RISK_MISSION");
  if (rootCause === "GOVERNANCE_DISAGREEMENT") categories.add("GOVERNANCE_SENSITIVE_MISSION");
  if (scenario === "COMPLIANCE_SENSITIVE_MISSION") categories.add("COMPLIANCE_SENSITIVE_MISSION");
  if (scenario === "RESOURCE_CONSTRAINED_MISSION") categories.add("RESOURCE_CONSTRAINED_MISSION");
  if (scenario === "TIME_CRITICAL_MISSION" || rootCause === "EXCESSIVE_CAUTION") categories.add("TIME_CRITICAL_MISSION");
  if (rootCause === "MISSION_SPECIFIC_FACTORS") categories.add("HIGH_RISK_MISSION");
  return freezeArray([...categories]);
}

function directFailureFor(scenario: Scenario): OverrideLearningFailure | undefined {
  const map: Partial<Record<Scenario, OverrideLearningFailure>> = {
    MISSING_OVERRIDE_REFERENCE: "OVERRIDE_REFERENCE_MISSING",
    MISSING_RECOMMENDATION: "RECOMMENDATION_UNAVAILABLE",
    MISSING_MISSION_CONTEXT: "MISSION_CONTEXT_UNAVAILABLE",
    MISSING_REPLAY_LINEAGE: "REPLAY_LINEAGE_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_UNAVAILABLE",
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

function buildPattern(normalizedId: string, rootCause: OverrideRootCause, scenario: Scenario, evidenceRefs: readonly string[], replayRefs: readonly string[]): OverridePatternRecord {
  const patternType = patternTypeFor(rootCause);
  const base: Omit<OverridePatternRecord, "integrity_hash"> = {
    pattern_id: `override_pattern_${hash(`${normalizedId}:${rootCause}:${RULE_VERSION}`).slice(0, 14)}`,
    canonical_pattern_name: `${patternType.toLowerCase()}:${rootCause.toLowerCase()}`,
    pattern_type: patternType,
    root_cause: rootCause,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : evidenceRefs,
    replay_refs: scenario === "MISSING_REPLAY_LINEAGE" ? freezeArray([]) : replayRefs,
    governance_relevance: rootCause === "GOVERNANCE_DISAGREEMENT" ? "HIGH" : "MEDIUM",
    confidence_metric: rootCause === "INACCURATE_CONFIDENCE" ? 0.92 : 0.84,
    affected_recommendation_categories: freezeArray(["mission_recommendation", rootCause.toLowerCase()]),
    first_observed_timestamp: ANALYZED_AT,
    latest_observed_timestamp: ANALYZED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildFrequency(pattern: OverridePatternRecord, scenario: Scenario): OverrideFrequencyMetrics {
  const rate = pattern.root_cause === "GOVERNANCE_DISAGREEMENT" ? 0.18 : pattern.root_cause === "INSUFFICIENT_EVIDENCE" ? 0.24 : 0.12;
  const base: Omit<OverrideFrequencyMetrics, "integrity_hash"> = {
    metrics_id: `override_frequency_${hash(pattern.pattern_id).slice(0, 14)}`,
    override_rate: Number(rate.toFixed(4)),
    recurrence_interval_days: scenario === "BASELINE" ? 30 : 14,
    trend_direction: scenario === "BASELINE" ? "STABLE" : "INCREASING",
    concentration_by_mission: "mission_feedback_001",
    concentration_by_recommendation_type: pattern.affected_recommendation_categories[0] ?? "mission_recommendation",
    operator_consistency: 0.86,
    deterministic: true,
    tenant_isolated: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildContext(normalizedId: string, rootCause: OverrideRootCause, scenario: Scenario): OverrideContextAnalysis {
  const categories = contextCategoriesFor(scenario, rootCause);
  const base: Omit<OverrideContextAnalysis, "integrity_hash"> = {
    context_id: `override_context_${hash(`${normalizedId}:${categories.join(":")}`).slice(0, 14)}`,
    context_categories: categories,
    mission_objectives: freezeArray(["preserve mission outcome", "maintain governance compliance"]),
    mission_phase: scenario === "TIME_CRITICAL_MISSION" ? "time_critical_execution" : "operator_review",
    operational_constraints: categories.includes("RESOURCE_CONSTRAINED_MISSION") ? freezeArray(["resource_constraint"]) : freezeArray(["standard_operational_constraint"]),
    governance_context: rootCause === "GOVERNANCE_DISAGREEMENT" ? "governance constraints materially influenced override" : "governance metadata preserved",
    constitutional_requirements: freezeArray(["operator_authority_preserved", "no_automatic_learning"]),
    operator_expertise: "mission_operator",
    recommendation_timing: categories.includes("TIME_CRITICAL_MISSION") ? "time_sensitive" : "normal_review_window",
    deterministic_evidence: `context:${categories.join("|")}:root:${rootCause}`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(pattern: OverridePatternRecord, context: OverrideContextAnalysis, rootCause: OverrideRootCause): OverrideImprovementEvidence {
  const base: Omit<OverrideImprovementEvidence, "integrity_hash"> = {
    evidence_id: `override_improvement_evidence_${hash(`${pattern.pattern_id}:${context.context_id}`).slice(0, 14)}`,
    observed_override_ref: pattern.pattern_id,
    identified_root_cause: rootCause,
    supporting_evidence_refs: pattern.supporting_evidence_refs,
    confidence_assessment: `analysis confidence ${pattern.confidence_metric.toFixed(2)} from normalized override feedback`,
    governance_impact: pattern.governance_relevance === "HIGH" ? "requires governance review before any adaptive proposal" : "governance metadata retained for downstream review",
    contextual_factors: context.context_categories,
    mission_outcome: "mission outcome correlation retained as evidence only",
    replay_refs: pattern.replay_refs,
    may_increase_adaptation_priority: true,
    supports_simulation: true,
    supports_future_analysis: true,
    supports_governance_review: true,
    modifies_production_recommendations: false,
    changes_confidence_automatically: false,
    alters_operational_policies: false,
    creates_adaptive_proposals: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: OverrideLearningAnalyzerInput, rootCause: OverrideRootCause | null): readonly OverrideLearningFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const normalization = input.normalization_result ?? normalizeFeedback(normalizationInputFor(scenario));
  const normalized = normalization.normalized_record;
  const failures: OverrideLearningFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (normalization.normalization_state !== "NORMALIZED" || !normalized) failures.push("NORMALIZED_FEEDBACK_REJECTED");
  if (normalized && normalized.canonical_feedback_type !== "OVERRIDE_FEEDBACK") failures.push("UNSUPPORTED_FEEDBACK_TYPE");
  if (!normalization.tenant_isolated) failures.push("TENANT_ISOLATION_FAILED");
  if (!replayFeedbackNormalization(normalization)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "MISSING_EVIDENCE" || (normalized && normalized.preserved_evidence_refs.length === 0)) failures.push("EVIDENCE_UNAVAILABLE");
  if (scenario === "MISSING_REPLAY_LINEAGE" || (normalized && normalized.preserved_replay_refs.length === 0)) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE_METADATA" || (normalized && !normalized.governance_metadata_hash)) failures.push("GOVERNANCE_METADATA_INCOMPLETE");
  if (!rootCause && normalized?.canonical_feedback_type === "OVERRIDE_FEEDBACK") failures.push("OVERRIDE_REFERENCE_MISSING");
  return freezeArray([...new Set(failures)]);
}

function buildExplanation(
  scenario: Scenario,
  rootCause: OverrideRootCause | null,
  pattern: OverridePatternRecord | null,
  context: OverrideContextAnalysis | null,
  evidence: OverrideImprovementEvidence | null,
  failures: readonly OverrideLearningFailure[],
): OverrideLearningExplanation {
  const base: Omit<OverrideLearningExplanation, "integrity_hash"> = {
    explanation_id: `override_learning_explanation_${hash(`${scenario}:${rootCause ?? "none"}`).slice(0, 14)}`,
    why_override_occurred: rootCause ? `operator override analyzed as ${rootCause.toLowerCase()}` : "no supported override signal was available for analysis",
    root_cause_rationale: rootCause ? `classification derived from normalized operator wording and scenario rule ${RULE_VERSION}` : failures.join(",") || "not_applicable",
    supporting_evidence: pattern?.supporting_evidence_refs ?? freezeArray([]),
    confidence_assessment: pattern ? `root cause confidence ${pattern.confidence_metric.toFixed(2)}` : "none",
    contextual_influences: context?.context_categories ?? freezeArray([]),
    governance_considerations: pattern?.governance_relevance === "HIGH" ? "governance review required before downstream adaptation" : "governance metadata retained without override",
    mission_outcome: evidence?.mission_outcome ?? "not_analyzed",
    generated_improvement_evidence_ref: evidence?.evidence_id ?? "none",
    traceable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function auditEvent(seed: string, event_type: OverrideLearningAuditEvent["event_type"], outcome: string): OverrideLearningAuditEvent {
  const base: Omit<OverrideLearningAuditEvent, "integrity_hash"> = {
    audit_event_id: `override_learning_audit_${hash(`${seed}:${event_type}`).slice(0, 14)}`,
    event_type,
    outcome,
    recorded_at: ANALYZED_AT,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(seed: string, pattern: OverridePatternRecord | null, failures: readonly OverrideLearningFailure[]): readonly OverrideLearningAuditEvent[] {
  return freezeArray([
    auditEvent(seed, "OVERRIDE_REFERENCE", pattern ? "resolved" : "unresolved"),
    auditEvent(seed, "ROOT_CAUSE", pattern?.root_cause ?? "none"),
    auditEvent(seed, "PATTERN_DETECTION", pattern?.pattern_type ?? "none"),
    auditEvent(seed, "FREQUENCY_ANALYSIS", pattern ? "calculated" : "not_calculated"),
    auditEvent(seed, "CONTEXT_ANALYSIS", pattern ? "captured" : "not_captured"),
    auditEvent(seed, "IMPROVEMENT_EVIDENCE", pattern ? "generated" : "not_generated"),
    auditEvent(seed, "REGISTRY_APPEND", pattern ? "append_only_recorded" : "not_recorded"),
    ...(failures.length ? [auditEvent(seed, "REJECTION", failures.join("|"))] : []),
  ]);
}

function resultReplayHash(result: Omit<OverrideLearningAnalyzerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    normalization_hash: result.normalization_result.integrity_hash,
    pattern_record: result.pattern_record,
    root_cause: result.root_cause,
    frequency_metrics: result.frequency_metrics,
    context_analysis: result.context_analysis,
    improvement_evidence: result.improvement_evidence,
    explanation: result.explanation,
    registry: result.registry,
    audit_events: result.audit_events,
    state: result.analysis_state,
  });
}

function resultIntegrityHash(result: Omit<OverrideLearningAnalyzerResult, "integrity_hash">): string {
  return hash({
    override_learning_analyzer_version: result.override_learning_analyzer_version,
    analysis_rule_version: result.analysis_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    pattern_hash: result.pattern_record?.integrity_hash ?? "none",
    frequency_hash: result.frequency_metrics?.integrity_hash ?? "none",
    context_hash: result.context_analysis?.integrity_hash ?? "none",
    evidence_hash: result.improvement_evidence?.integrity_hash ?? "none",
    explanation_hash: result.explanation.integrity_hash,
    registry_hashes: result.registry.map((pattern) => pattern.integrity_hash),
    audit_hashes: result.audit_events.map((event) => event.integrity_hash),
    replay_hash: result.replay_hash,
  });
}

export function analyzeOverrideLearning(input: OverrideLearningAnalyzerInput = {}): OverrideLearningAnalyzerResult {
  const api_surface = buildApiSurface();
  const scenario = input.scenario ?? "BASELINE";
  const normalization_result = input.normalization_result ?? normalizeFeedback(normalizationInputFor(scenario));
  const normalized = normalization_result.normalized_record;
  const provisionalRoot = normalized?.canonical_feedback_type === "OVERRIDE_FEEDBACK" ? rootCauseFor(scenario, normalized.original_operator_wording) : null;
  const failures = collectFailures({ ...input, normalization_result }, provisionalRoot);
  const root_cause = failures.length ? null : provisionalRoot;
  const contributing_factors = root_cause ? contributingFactors(root_cause, scenario) : freezeArray([]);
  const pattern_record = root_cause && normalized ? buildPattern(normalized.normalized_feedback_id, root_cause, scenario, normalized.preserved_evidence_refs, normalized.preserved_replay_refs) : null;
  const frequency_metrics = pattern_record ? buildFrequency(pattern_record, scenario) : null;
  const context_analysis = root_cause && normalized ? buildContext(normalized.normalized_feedback_id, root_cause, scenario) : null;
  const improvement_evidence = pattern_record && context_analysis && root_cause ? buildEvidence(pattern_record, context_analysis, root_cause) : null;
  const explanation = buildExplanation(scenario, root_cause, pattern_record, context_analysis, improvement_evidence, failures);
  const registry = pattern_record ? freezeArray([pattern_record]) : freezeArray([]);
  const audit_events = buildAudit(normalized?.normalized_feedback_id ?? normalization_result.integrity_hash, pattern_record, failures);
  const base: Omit<OverrideLearningAnalyzerResult, "integrity_hash" | "replay_hash"> = {
    override_learning_analyzer_version: ANALYZER_VERSION,
    analysis_rule_version: RULE_VERSION,
    api_surface,
    normalization_result,
    pattern_record,
    root_cause,
    contributing_factors,
    root_cause_confidence: pattern_record?.confidence_metric ?? 0,
    frequency_metrics,
    context_analysis,
    improvement_evidence,
    explanation,
    registry,
    audit_events,
    analysis_state: failures.length ? "REJECTED" : root_cause ? "ANALYZED" : "NO_OVERRIDE_SIGNAL",
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

export function replayOverrideLearningAnalysis(result: OverrideLearningAnalyzerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getOverrideLearningAnalyzerFoundation(): OverrideLearningAnalyzerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    override_learning_analyzer_version: ANALYZER_VERSION,
    api_surface,
    result: analyzeOverrideLearning(),
  });
}

export const OverrideLearningAnalyzer = Object.freeze({
  analyze: analyzeOverrideLearning,
  replay: replayOverrideLearningAnalysis,
});
