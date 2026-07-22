import { analyzeReadinessGaps } from "@/services/readiness-gap-analysis-engine";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityDomain } from "@/types/autonomy-maturity-assessment-contract";
import type {
  ImprovementRecommendationBundle,
  ImprovementRecommendationFailure,
  ImprovementRecommendationInput,
  ImprovementRecommendationObservabilitySurface,
  ImprovementRecommendationRecord,
  ImprovementRecommendationRepository,
  ImprovementRecommendationReport,
  ImprovementRecommendationScenario,
  ImprovementRecommendationValidationResult,
  RecommendationCategory,
  RecommendationEvidenceChain,
  RecommendationImplementationGuidance,
  RecommendationLedgerEntry,
  RecommendationPriority,
  RecommendationRule,
} from "@/types/improvement-recommendation-engine";
import type { ReadinessGapAnalysisRepository, ReadinessGapFinding } from "@/types/readiness-gap-analysis-engine";

const VERSION = "improvement-recommendation-engine/v8ALT.11.7" as const;
const categories = ["ARCHITECTURE", "GOVERNANCE", "REPLAY", "EXPLAINABILITY", "RESILIENCE", "CERTIFICATION"] as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ImprovementRecommendationScenario): ImprovementRecommendationFailure | null {
  const map: Partial<Record<ImprovementRecommendationScenario, ImprovementRecommendationFailure>> = {
    NONDETERMINISTIC_RECOMMENDATIONS: "RECOMMENDATIONS_NONDETERMINISTIC",
    NONDETERMINISTIC_PRIORITIES: "RECOMMENDATION_PRIORITIES_NONDETERMINISTIC",
    INCOMPLETE_SUPPORTING_EVIDENCE: "SUPPORTING_EVIDENCE_INCOMPLETE",
    INCONSISTENT_IMPLEMENTATION_GUIDANCE: "IMPLEMENTATION_GUIDANCE_INCONSISTENT",
    GOVERNANCE_VALIDATION_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CONSTITUTIONAL_VALIDATION_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCHED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_RECOMMENDATION_LOGIC: "HIDDEN_RECOMMENDATION_LOGIC_DETECTED",
    AUTOMATIC_IMPLEMENTATION_ATTEMPT: "AUTOMATIC_IMPLEMENTATION_ATTEMPTED",
    RUNTIME_BEHAVIOR_MODIFICATION: "RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED",
    OPERATOR_APPROVAL_BYPASS: "OPERATOR_APPROVAL_BYPASSED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
  };
  return map[scenario] ?? null;
}

function rules(scenario: ImprovementRecommendationScenario): readonly RecommendationRule[] {
  return freezeArray(categories.map((category, index) => {
    const base = { rule_id: id("IRE-R", "recommendation-rule", category), category, rule_version: "recommendation-rules/v1" as const, priority_model_version: "recommendation-priority/v1" as const, approved: true, deterministic: !(scenario === "NONDETERMINISTIC_RECOMMENDATIONS" && index === 0), template: scenario === "HIDDEN_RECOMMENDATION_LOGIC" && index === 0 ? "hidden recommendation logic" : `${category.toLowerCase()} recommendation template` };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("improvement-recommendation-rule", base) });
  }));
}

function categoryForGap(gap: ReadinessGapFinding): RecommendationCategory {
  if (gap.category === "GOVERNANCE_GAP") return "GOVERNANCE";
  if (gap.category === "REPLAY_GAP") return "REPLAY";
  if (gap.category === "CERTIFICATION_GAP") return "CERTIFICATION";
  if (gap.domain === "EXPLAINABILITY") return "EXPLAINABILITY";
  if (gap.domain === "RESILIENCE") return "RESILIENCE";
  return "ARCHITECTURE";
}

function priorityForGap(gap: ReadinessGapFinding, scenario: ImprovementRecommendationScenario): RecommendationPriority {
  if (scenario === "NONDETERMINISTIC_PRIORITIES" && gap.category === "CERTIFICATION_GAP") return "LOW";
  if (gap.severity === "CRITICAL") return "CRITICAL";
  if (gap.severity === "HIGH") return "HIGH";
  if (gap.severity === "MEDIUM") return "MEDIUM";
  return "LOW";
}

function evidenceChain(gap: ReadinessGapFinding, readiness: ReadinessGapAnalysisRepository, scenario: ImprovementRecommendationScenario): RecommendationEvidenceChain {
  const impacted = freezeArray([gap.domain]);
  const complete = scenario !== "INCOMPLETE_SUPPORTING_EVIDENCE";
  const base = { evidence_chain_id: id("IRE-E", "recommendation-evidence", gap.gap_id), originating_evidence: complete ? gap.evidence_reference : "", supporting_observations: freezeArray(complete ? [gap.description, gap.dependency_impact] : []), impacted_domains: impacted, historical_references: freezeArray([readiness.history.repository_id]), readiness_references: freezeArray([readiness.analysis_id, gap.gap_id]), governance_references: freezeArray(complete ? [readiness.record.governance_reference] : []), constitutional_references: freezeArray(complete ? [readiness.record.constitutional_reference] : []), replay_references: freezeArray(scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? [] : [gap.replay_reference, readiness.record.replay_reference]), integrity_verified: scenario !== "INTEGRITY_VERIFICATION_FAILURE", complete };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("recommendation-evidence-chain", base) });
}

function guidance(gap: ReadinessGapFinding, category: RecommendationCategory, scenario: ImprovementRecommendationScenario): RecommendationImplementationGuidance {
  const inconsistent = scenario === "INCONSISTENT_IMPLEMENTATION_GUIDANCE" && category === "ARCHITECTURE";
  const base = { guidance_id: id("IRE-G", "recommendation-guidance", gap.gap_id), objective: `Improve ${category.toLowerCase()} readiness`, rationale: gap.description, implementation_sequence: freezeArray(inconsistent ? [] : ["prepare evidence", "obtain operator review", "plan implementation externally", "validate replay after external change"]), dependencies: freezeArray([gap.dependency_impact]), governance_considerations: freezeArray(["operator review required", "governance approval required before external implementation"]), constitutional_considerations: freezeArray(["constitutional validation required before external implementation"]), replay_impact: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "" : "replay validation required after external implementation", rollback_strategy: "restore prior operator-approved configuration externally", validation_requirements: freezeArray(inconsistent ? [] : ["governance validation", "constitutional validation", "replay validation", "integrity verification"]), certification_implications: category === "CERTIFICATION" ? "prepares certification evidence without approving certification" : "supports maturity readiness evidence", advisory_only: true as const, operator_approval_required: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && category === "ARCHITECTURE" ? "" : hashValue("recommendation-guidance", base) });
}

function recommendation(gap: ReadinessGapFinding, readiness: ReadinessGapAnalysisRepository, scenario: ImprovementRecommendationScenario): ImprovementRecommendationRecord {
  const category = categoryForGap(gap);
  const evidence = evidenceChain(gap, readiness, scenario);
  const implementation = guidance(gap, category, scenario);
  const bypass = scenario === "OPERATOR_APPROVAL_BYPASS" && category === "GOVERNANCE";
  const objective = scenario === "HIDDEN_RECOMMENDATION_LOGIC" && category === "ARCHITECTURE" ? "hidden recommendation logic" : `Address ${gap.category.toLowerCase()} for advisory readiness`;
  const base = { recommendation_id: id("IRE", "improvement-recommendation", gap.gap_id), assessment_id: readiness.record.assessment_id, recommendation_version: VERSION, category, priority: priorityForGap(gap, scenario), state: "REVIEW_READY" as const, maturity_level: readiness.record.current_maturity_level, affected_domains: evidence.impacted_domains, maturity_impact: gap.severity === "CRITICAL" ? 100 : gap.severity === "HIGH" ? 75 : gap.severity === "MEDIUM" ? 50 : 25, readiness_impact: gap.severity === "CRITICAL" ? 90 : 60, certification_impact: category === "CERTIFICATION" ? 100 : 40, improvement_objective: objective, evidence_chain: evidence, implementation_guidance: implementation, governance_status: scenario === "GOVERNANCE_VALIDATION_FAILURE" ? "FAIL" as const : "PASS" as const, constitutional_status: scenario === "CONSTITUTIONAL_VALIDATION_FAILURE" ? "FAIL" as const : "PASS" as const, replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "" : gap.replay_reference, lineage_reference: "lineage:improvement-recommendation", advisory_only: true as const, automatic_implementation_authorized: false as const, runtime_behavior_modification_authorized: false as const, operator_approval_bypassed: bypass as false };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && category === "ARCHITECTURE" ? "" : hashValue("improvement-recommendation", base) });
}

function ledger(recommendations: readonly ImprovementRecommendationRecord[], scenario: ImprovementRecommendationScenario): readonly RecommendationLedgerEntry[] {
  return freezeArray(recommendations.map((item) => {
    const base = { ledger_id: id("IRE-L", "recommendation-ledger", item.recommendation_id), recommendation_id: item.recommendation_id, assessment_id: item.assessment_id, category: item.category, priority: item.priority, maturity_level: item.maturity_level, evidence_chain_id: item.evidence_chain.evidence_chain_id, guidance_id: item.implementation_guidance.guidance_id, governance_status: item.governance_status, constitutional_status: item.constitutional_status, replay_reference: item.replay_reference, lineage_reference: item.lineage_reference, timestamp: "1970-01-01T00:00:00.000Z" as const, append_only: true as const, immutable: true as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && item.category === "ARCHITECTURE" ? "" : hashValue("recommendation-ledger-entry", base) });
  }));
}

function report(recommendations: readonly ImprovementRecommendationRecord[], scenario: ImprovementRecommendationScenario): ImprovementRecommendationReport {
  const base = { report_id: id("IRE-REP", "recommendation-report", recommendations.map((item) => item.recommendation_id)), recommendation_count: recommendations.length, category_summary: freezeArray(categories.map((category) => `${category}:${recommendations.filter((item) => item.category === category).length}`)), priority_summary: freezeArray(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"].map((priority) => `${priority}:${recommendations.filter((item) => item.priority === priority).length}`)), evidence_summary: freezeArray(recommendations.map((item) => item.evidence_chain.evidence_chain_id)), implementation_summary: freezeArray(recommendations.map((item) => item.implementation_guidance.guidance_id)), advisory_only: true as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("recommendation-report", base) });
}

function collectFailures(repository: Omit<ImprovementRecommendationRepository, "integrity_hash"> | ImprovementRecommendationRepository): readonly ImprovementRecommendationFailure[] {
  const ordered = repository.recommendations.map((item) => item.recommendation_id).join("|");
  const sorted = [...repository.recommendations].sort((a, b) => a.recommendation_id.localeCompare(b.recommendation_id)).map((item) => item.recommendation_id).join("|");
  return unique([
    ...repository.failures,
    ...(ordered !== sorted || repository.rules.some((rule) => !rule.deterministic) ? ["RECOMMENDATIONS_NONDETERMINISTIC" as const] : []),
    ...(repository.recommendations.some((item) => item.category === "CERTIFICATION" && item.priority === "LOW") ? ["RECOMMENDATION_PRIORITIES_NONDETERMINISTIC" as const] : []),
    ...(repository.recommendations.some((item) => !item.evidence_chain.complete || !item.evidence_chain.originating_evidence || item.evidence_chain.replay_references.length === 0) ? ["SUPPORTING_EVIDENCE_INCOMPLETE" as const] : []),
    ...(repository.recommendations.some((item) => item.implementation_guidance.implementation_sequence.length === 0 || item.implementation_guidance.validation_requirements.length === 0) ? ["IMPLEMENTATION_GUIDANCE_INCONSISTENT" as const] : []),
    ...(repository.recommendations.some((item) => item.governance_status === "FAIL") ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(repository.recommendations.some((item) => item.constitutional_status === "FAIL") ? ["CONSTITUTIONAL_VALIDATION_FAILED" as const] : []),
    ...(repository.recommendations.some((item) => !item.replay_reference || !item.implementation_guidance.replay_impact) ? ["REPLAY_RECONSTRUCTION_MISMATCHED" as const] : []),
    ...(repository.recommendations.some((item) => !item.integrity_hash || !item.evidence_chain.integrity_hash || !item.implementation_guidance.integrity_hash) || repository.rules.some((rule) => !rule.integrity_hash) || repository.ledger.some((entry) => !entry.integrity_hash) || !repository.report.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.rules.some((rule) => rule.template.includes("hidden")) || repository.recommendations.some((item) => item.improvement_objective.includes("hidden")) ? ["HIDDEN_RECOMMENDATION_LOGIC_DETECTED" as const] : []),
    ...(repository.automatic_implementation_authorized || repository.recommendations.some((item) => item.automatic_implementation_authorized) ? ["AUTOMATIC_IMPLEMENTATION_ATTEMPTED" as const] : []),
    ...(repository.runtime_behavior_modification_authorized || repository.recommendations.some((item) => item.runtime_behavior_modification_authorized) ? ["RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED" as const] : []),
    ...(repository.operator_authority_bypass_authorized || repository.recommendations.some((item) => item.operator_approval_bypassed || !item.implementation_guidance.operator_approval_required) ? ["OPERATOR_APPROVAL_BYPASSED" as const] : []),
    ...(repository.readiness.history.ledger.some((entry) => entry.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
  ]);
}

export function generateImprovementRecommendations(input: ImprovementRecommendationInput = {}): ImprovementRecommendationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const readiness = input.readiness ?? analyzeReadinessGaps(scenario === "TENANT_ISOLATION_VIOLATION" ? { scenario: "TENANT_ISOLATION_VIOLATION" } : {});
  const recommendationRules = rules(scenario);
  const recommendationsBase = freezeArray(readiness.gaps.map((gap) => recommendation(gap, readiness, scenario)).sort((a, b) => a.recommendation_id.localeCompare(b.recommendation_id)));
  const recommendations = scenario === "NONDETERMINISTIC_RECOMMENDATIONS" ? freezeArray([...recommendationsBase].reverse()) : recommendationsBase;
  const recommendationLedger = ledger(recommendations, scenario);
  const recommendationReport = report(recommendations, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { repository_id: id("IRE", "improvement-recommendations", scenario), final_state: "IMPROVEMENT_RECOMMENDATIONS_COMPLETE" as const, readiness, rules: recommendationRules, recommendations, ledger: recommendationLedger, report: recommendationReport, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, automatic_implementation_authorized: false as const, runtime_behavior_modification_authorized: false as const, governance_policy_modification_authorized: false as const, constitutional_rule_modification_authorized: false as const, maturity_classification_modification_authorized: false as const, scoring_algorithm_modification_authorized: false as const, system_configuration_modification_authorized: false as const, implementation_approval_authorized: false as const, operator_authority_bypass_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "IMPROVEMENT_RECOMMENDATIONS_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("improvement-recommendation-repository", repository) });
}

export function listRecommendationRules(input: ImprovementRecommendationInput = {}) { return generateImprovementRecommendations(input).rules; }
export function listRecommendationEvidenceChains(input: ImprovementRecommendationInput = {}) { return generateImprovementRecommendations(input).recommendations.map((item) => item.evidence_chain); }
export function listRecommendationGuidance(input: ImprovementRecommendationInput = {}) { return generateImprovementRecommendations(input).recommendations.map((item) => item.implementation_guidance); }
export function listRecommendationLedger(input: ImprovementRecommendationInput = {}) { return generateImprovementRecommendations(input).ledger; }

export function validateImprovementRecommendations(repository = generateImprovementRecommendations()): ImprovementRecommendationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: ImprovementRecommendationFailure) => failures.includes(failure);
  const result = { repository_id: repository.repository_id, valid: failures.length === 0 && repository.final_state === "IMPROVEMENT_RECOMMENDATIONS_COMPLETE", recommendations_deterministic: !has("RECOMMENDATIONS_NONDETERMINISTIC"), priorities_deterministic: !has("RECOMMENDATION_PRIORITIES_NONDETERMINISTIC"), evidence_complete: !has("SUPPORTING_EVIDENCE_INCOMPLETE"), guidance_consistent: !has("IMPLEMENTATION_GUIDANCE_INCONSISTENT"), governance_validated: !has("GOVERNANCE_VALIDATION_FAILED"), constitutional_validated: !has("CONSTITUTIONAL_VALIDATION_FAILED"), replay_verified: !has("REPLAY_RECONSTRUCTION_MISMATCHED"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"), no_hidden_logic: !has("HIDDEN_RECOMMENDATION_LOGIC_DETECTED"), no_automatic_implementation: !has("AUTOMATIC_IMPLEMENTATION_ATTEMPTED"), runtime_behavior_preserved: !has("RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED"), operator_approval_preserved: !has("OPERATOR_APPROVAL_BYPASSED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), advisory_only: true as const, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("improvement-recommendation-validation", result) });
}

export function buildImprovementRecommendationObservabilitySurface(repository = generateImprovementRecommendations()): ImprovementRecommendationObservabilitySurface {
  const order: Record<RecommendationPriority, number> = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFORMATIONAL: 1 };
  const highest = [...repository.recommendations].sort((a, b) => order[b.priority] - order[a.priority])[0]?.priority ?? "INFORMATIONAL";
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, recommendation_count: repository.recommendations.length, rule_count: repository.rules.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, highest_priority: highest, advisory_only: true, automatic_implementation_authorized: false, runtime_behavior_modification_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getImprovementRecommendationEngineBundle(): ImprovementRecommendationBundle {
  const repository = generateImprovementRecommendations();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "IMPROVEMENT_RECOMMENDATION_ENGINE_READY", principles: freezeArray(["readiness-gap-derived", "deterministic-recommendations", "complete-evidence-chain", "operator-review-required", "no-automatic-implementation", "no-runtime-modification", "tenant-isolated", "advisory-only"]) }), repository, validation: validateImprovementRecommendations(repository), observability: buildImprovementRecommendationObservabilitySurface(repository) });
}
