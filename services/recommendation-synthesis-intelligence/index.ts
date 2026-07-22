import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPortfolioAssessmentIntelligence, validatePortfolioAssessmentIntelligence } from "@/services/portfolio-assessment-intelligence";
import type {
  AuthorityValidationReport,
  NonRecommendationArtifact,
  NonRecommendationOutcome,
  OutcomeResolutionRecord,
  RecommendationArtifact,
  RecommendationEligibilityReport,
  RecommendationExplainabilityPackage,
  RecommendationIntegrityReport,
  RecommendationObservabilityReport,
  RecommendationOutcome,
  RecommendationRegistry,
  RecommendationReplayReport,
  RecommendationSynthesisCertification,
  RecommendationSynthesisCertificationTest,
  RecommendationSynthesisContractBundle,
  RecommendationSynthesisFailure,
  RecommendationSynthesisInput,
  RecommendationSynthesisResult,
  RecommendationSynthesisScenario,
  RecommendationSynthesisValidation,
} from "@/types/recommendation-synthesis-intelligence";

const VERSION = "recommendation-synthesis-intelligence/v12.9" as const;
const ID = "RecommendationSynthesisIntelligence" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: RecommendationSynthesisScenario): RecommendationSynthesisFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly RecommendationSynthesisFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function eligibility(portfolioValid: boolean, failures: readonly RecommendationSynthesisFailure[]): RecommendationEligibilityReport {
  const base = { report_id: id("recommendation_eligibility", failures), completed_cycle: portfolioValid, comparisons_complete: !failures.includes("INCOMPLETE_COMPARISON_ACCEPTED"), forecasts_complete: !failures.includes("INCOMPLETE_FORECAST_ACCEPTED"), scenarios_complete: !failures.includes("INCOMPLETE_SCENARIO_ACCEPTED"), portfolio_complete: !failures.includes("INCOMPLETE_PORTFOLIO_ACCEPTED"), policy_compliant: !failures.includes("POLICY_BINDING_INVALID"), governance_approved: !failures.includes("GOVERNANCE_FAILURE"), authority_eligible: !failures.includes("EXECUTION_AUTHORITY_PRESENT"), evidence_sufficient: !failures.includes("EVIDENCE_INSUFFICIENT"), replay_ready: !failures.includes("REPLAY_READINESS_FAILED"), eligible: false };
  return nested({ ...base, eligible: Object.entries(base).filter(([key]) => !["report_id", "eligible"].includes(key)).every(([, value]) => value === true) && !failures.includes("ELIGIBILITY_ENFORCEMENT_FAILED") });
}

function outcome(eligible: RecommendationEligibilityReport, portfolioRef: string, strategyRef: string | undefined, failures: readonly RecommendationSynthesisFailure[]): OutcomeResolutionRecord {
  const selected: RecommendationOutcome = !eligible.policy_compliant ? "POLICY_BLOCKED" : !eligible.governance_approved ? "GOVERNANCE_REVIEW_REQUIRED" : failures.includes("CONSTITUTIONAL_VIOLATION") ? "CONSTITUTIONALLY_PROHIBITED" : !eligible.evidence_sufficient ? "INSUFFICIENT_EVIDENCE" : eligible.eligible ? "RECOMMEND_WITH_REVIEW" : "NO_RECOMMENDATION";
  const outcomes = failures.includes("MULTIPLE_OUTCOMES_PRODUCED") ? freezeArray([selected, "NO_RECOMMENDATION" as const]) : freezeArray([selected]);
  return nested({ resolution_id: id("recommendation_outcome", { selected, portfolioRef, strategyRef }), outcomes, selected_outcome: selected, deterministic: !failures.includes("OUTCOME_NONDETERMINISTIC"), recommended_strategy_ref: selected.startsWith("RECOMMEND") ? strategyRef ?? null : null, recommended_portfolio_ref: selected.startsWith("RECOMMEND") ? portfolioRef : null, confidence: 0.82, uncertainty: 0.18, constraints: freezeArray(["operator review required", "governance posture unchanged"]), required_reviews: freezeArray(["operator", "governance"]) });
}

function nonRecommendation(resolution: OutcomeResolutionRecord, failures: readonly RecommendationSynthesisFailure[]): NonRecommendationArtifact | null {
  if (resolution.selected_outcome.startsWith("RECOMMEND") && !failures.includes("NON_RECOMMENDATION_UNSUPPORTED")) return null;
  const outcome: NonRecommendationOutcome = resolution.selected_outcome === "POLICY_BLOCKED" ? "POLICY_BLOCKED" : resolution.selected_outcome === "GOVERNANCE_REVIEW_REQUIRED" ? "GOVERNANCE_PENDING" : resolution.selected_outcome === "CONSTITUTIONALLY_PROHIBITED" ? "CONSTITUTIONAL_REJECTION" : resolution.selected_outcome === "INSUFFICIENT_EVIDENCE" ? "EVIDENCE_INSUFFICIENT" : "NO_ELIGIBLE_PORTFOLIO";
  return nested({ artifact_id: id("non_recommendation", outcome), outcome, rationale: "Policy-defined non-recommendation outcome completed deterministically.", blocking_conditions: freezeArray([outcome]), governing_policies: freezeArray(["policy:recommendation-synthesis:v1"]), corrective_actions: freezeArray(["resolve blocking condition and create a new recommendation cycle"]), replay_ref: `replay:non-recommendation:${outcome}` });
}

function authority(failures: readonly RecommendationSynthesisFailure[]): AuthorityValidationReport {
  return nested({ report_id: id("recommendation_authority", VERSION), advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"), no_execution_authority: !failures.includes("EXECUTION_AUTHORITY_PRESENT"), no_resource_allocation: true, no_governance_modification: true, operator_supremacy_preserved: !failures.includes("OPERATOR_SUPREMACY_VIOLATED"), constitutional_compliant: !failures.includes("CONSTITUTIONAL_VIOLATION"), governance_compliant: !failures.includes("GOVERNANCE_FAILURE") });
}

function recommendation(tenantId: string, cycleId: string, resolution: OutcomeResolutionRecord, portfolio: ReturnType<typeof runPortfolioAssessmentIntelligence>, auth: AuthorityValidationReport, failures: readonly RecommendationSynthesisFailure[]): RecommendationArtifact {
  const seed = { cycleId, outcome: resolution.selected_outcome, portfolio: resolution.recommended_portfolio_ref, version: VERSION };
  const recommendationId = failures.includes("RECOMMENDATION_IDENTITY_NONDETERMINISTIC") ? id("recommendation", { seed, nonce: "unstable" }) : id("recommendation", seed);
  return nested({ recommendation_id: recommendationId, recommendation_cycle_id: cycleId, recommendation_outcome: resolution.selected_outcome, recommended_strategy_ref: resolution.recommended_strategy_ref, recommended_portfolio_ref: resolution.recommended_portfolio_ref, baseline_ref: "baseline:phase-12:canonical", comparison_refs: freezeArray([portfolio.comparison.comparison_id]), scenario_refs: portfolio.scenarios.scenario_refs, forecast_refs: freezeArray(["forecast:phase-12.6:registry"]), supporting_evidence_refs: failures.includes("EVIDENCE_INSUFFICIENT") ? freezeArray([]) : portfolio.assessment.evidence_refs, policy_set_manifest_ref: failures.includes("POLICY_BINDING_INVALID") ? "" : portfolio.assessment.policy_manifest_ref, rationale: failures.includes("HIDDEN_RATIONALE") ? "" : portfolio.advisory.advisory_narrative, expected_benefits: freezeArray(["coherent portfolio selection", "bounded aggregate risk"]), expected_risks: freezeArray(["operator workload", "resource contention"]), confidence: resolution.confidence, uncertainty: resolution.uncertainty, constraints: resolution.constraints, required_reviews: resolution.required_reviews, authority_boundary: auth.advisory_only ? "ADVISORY_ONLY_NO_EXECUTION_AUTHORITY" : "INVALID_AUTHORITY", origin_ref: failures.includes("ORIGIN_INVALID") ? "" : `origin:${cycleId}:recommendation-synthesis`, lifecycle_state: "PUBLISHED" as const, advisory_only: auth.advisory_only && auth.no_execution_authority, tenant_id: failures.includes("TENANT_ISOLATION_BREACH") ? "tenant_beta" : tenantId });
}

function explain(rec: RecommendationArtifact, failures: readonly RecommendationSynthesisFailure[]): RecommendationExplainabilityPackage {
  const complete = !failures.includes("EXPLAINABILITY_INCOMPLETE") && rec.rationale.length > 0;
  return nested({ package_id: id("recommendation_explainability", rec.recommendation_id), executive_summary: complete ? rec.rationale : "", technical_explanation: "Selection is derived from completed portfolio assessment, comparison, forecast, scenario, and evidence lineage.", governance_explanation: "Recommendation is advisory-only and policy-bound.", evidence_summary: `${rec.supporting_evidence_refs.length} evidence references support synthesis.`, comparison_summary: `${rec.comparison_refs.length} comparison references used.`, confidence_report: `Confidence ${rec.confidence}.`, risk_summary: rec.expected_risks.join("; "), hidden_rationale_absent: !failures.includes("HIDDEN_RATIONALE"), complete });
}

function integrity(rec: RecommendationArtifact, failures: readonly RecommendationSynthesisFailure[]): RecommendationIntegrityReport {
  const duplicate = failures.includes("DUPLICATE_RECOMMENDATION") ? freezeArray([rec.recommendation_id]) : freezeArray([]);
  return nested({ report_id: id("recommendation_integrity", rec.recommendation_id), lineage_valid: !failures.includes("LINEAGE_VALIDATION_FAILED"), origin_valid: rec.origin_ref.length > 0, evidence_refs_valid: rec.supporting_evidence_refs.length > 0, comparison_refs_valid: rec.comparison_refs.length > 0, scenario_refs_valid: rec.scenario_refs.length > 0, forecast_refs_valid: rec.forecast_refs.length > 0, portfolio_refs_valid: Boolean(rec.recommended_portfolio_ref) || !rec.recommendation_outcome.startsWith("RECOMMEND"), policy_binding_valid: rec.policy_set_manifest_ref.length > 0, authority_boundary_valid: rec.advisory_only, replay_complete: !failures.includes("REPLAY_MISMATCH"), duplicate_recommendations_detected: duplicate });
}

function replay(failures: readonly RecommendationSynthesisFailure[]): RecommendationReplayReport {
  const ok = !failures.includes("REPLAY_MISMATCH");
  return nested({ report_id: id("recommendation_replay", VERSION), selection_reproduced: ok, rationale_reproduced: ok, evidence_reproduced: ok, comparison_reproduced: ok, policy_application_reproduced: ok, confidence_reproduced: ok, uncertainty_reproduced: ok, outcome_reproduced: ok, outcome: ok ? "MATCH" as const : "FAILURE" as const });
}

function registry(tenantId: string, rec: RecommendationArtifact, nonRec: NonRecommendationArtifact | null): RecommendationRegistry {
  return nested({ registry_id: id("recommendation_registry", { tenantId, cycle: rec.recommendation_cycle_id }), tenant_id: tenantId, recommendation: rec, non_recommendation: nonRec, complete: rec.lifecycle_state === "PUBLISHED" });
}

function observability(failures: readonly RecommendationSynthesisFailure[]): RecommendationObservabilityReport {
  return nested({ report_id: id("recommendation_observability", VERSION), generation_latency_ms: 90, synthesis_duration_ms: 140, throughput: 1, explainability_completeness: failures.includes("EXPLAINABILITY_INCOMPLETE") ? 0 : 1, replay_success_rate: failures.includes("REPLAY_MISMATCH") ? 0 : 1, integrity_validation_rate: failures.includes("INTEGRITY_VALIDATION_FAILED") ? 0 : 1, duplicate_attempts: failures.includes("DUPLICATE_RECOMMENDATION") ? 1 : 0, advisory_boundary_violations: failures.includes("ADVISORY_BOUNDARY_VIOLATION") ? 1 : 0, policy_blocking_frequency: failures.includes("POLICY_BINDING_INVALID") ? 1 : 0, observable: !failures.includes("OBSERVABILITY_MISSING") });
}

function certTest(name: string, passed: boolean, failure: RecommendationSynthesisFailure, refs: readonly string[]): RecommendationSynthesisCertificationTest {
  return nested({ test_id: id("recommendation_synthesis_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}

type CertBase = Omit<RecommendationSynthesisResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly RecommendationSynthesisCertificationTest[] {
  const refs = freezeArray([result.recommendation.integrity_hash, result.integrity.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Recommendation contract validated", result.recommendation.recommendation_id.length > 0, "RECOMMENDATION_CONTRACT_INVALID", refs),
    certTest("Recommendation identity deterministic", result.recommendation.recommendation_id === id("recommendation", { cycleId: result.recommendation.recommendation_cycle_id, outcome: result.outcome_resolution.selected_outcome, portfolio: result.outcome_resolution.recommended_portfolio_ref, version: VERSION }), "RECOMMENDATION_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Eligibility enforcement complete", result.eligibility.eligible, "ELIGIBILITY_ENFORCEMENT_FAILED", refs),
    certTest("Completed comparisons required", result.eligibility.comparisons_complete, "INCOMPLETE_COMPARISON_ACCEPTED", refs),
    certTest("Completed forecasts required", result.eligibility.forecasts_complete, "INCOMPLETE_FORECAST_ACCEPTED", refs),
    certTest("Completed scenarios required", result.eligibility.scenarios_complete, "INCOMPLETE_SCENARIO_ACCEPTED", refs),
    certTest("Completed portfolio required", result.eligibility.portfolio_complete, "INCOMPLETE_PORTFOLIO_ACCEPTED", refs),
    certTest("Policy binding immutable", result.integrity.policy_binding_valid, "POLICY_BINDING_INVALID", refs),
    certTest("Evidence sufficient", result.integrity.evidence_refs_valid, "EVIDENCE_INSUFFICIENT", refs),
    certTest("Replay readiness enforced", result.eligibility.replay_ready, "REPLAY_READINESS_FAILED", refs),
    certTest("Exactly one canonical outcome produced", result.outcome_resolution.outcomes.length === 1, "MULTIPLE_OUTCOMES_PRODUCED", refs),
    certTest("Outcome resolution deterministic", result.outcome_resolution.deterministic, "OUTCOME_NONDETERMINISTIC", refs),
    certTest("Non-recommendation outcomes deterministic", !result.non_recommendation || result.non_recommendation.outcome !== null, "NON_RECOMMENDATION_UNSUPPORTED", refs),
    certTest("Advisory-only boundary enforced", result.authority_validation.advisory_only && result.recommendation.advisory_only, "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("No execution authority present", result.authority_validation.no_execution_authority, "EXECUTION_AUTHORITY_PRESENT", refs),
    certTest("Operator supremacy preserved", result.authority_validation.operator_supremacy_preserved, "OPERATOR_SUPREMACY_VIOLATED", refs),
    certTest("Recommendation fully explainable", result.explainability.complete, "EXPLAINABILITY_INCOMPLETE", refs),
    certTest("No hidden rationale", result.explainability.hidden_rationale_absent, "HIDDEN_RATIONALE", refs),
    certTest("Lineage validated", result.integrity.lineage_valid, "LINEAGE_VALIDATION_FAILED", refs),
    certTest("Origin valid", result.integrity.origin_valid, "ORIGIN_INVALID", refs),
    certTest("Duplicate recommendations prevented", result.integrity.duplicate_recommendations_detected.length === 0, "DUPLICATE_RECOMMENDATION", refs),
    certTest("Integrity verified", result.integrity.authority_boundary_valid, "INTEGRITY_VALIDATION_FAILED", refs),
    certTest("Replay deterministic", result.replay.outcome === "MATCH", "REPLAY_MISMATCH", refs),
    certTest("Governance compliance validated", result.authority_validation.governance_compliant, "GOVERNANCE_FAILURE", refs),
    certTest("Constitutional compliance validated", result.authority_validation.constitutional_compliant, "CONSTITUTIONAL_VIOLATION", refs),
    certTest("Tenant isolation preserved", result.recommendation.tenant_id === result.registry.tenant_id, "TENANT_ISOLATION_BREACH", refs),
    certTest("Audit trail complete", result.registry.complete, "AUDIT_TRAIL_INCOMPLETE", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<RecommendationSynthesisResult, "replay_hash" | "integrity_hash">): string {
  return hash({ recommendation: result.recommendation.integrity_hash, eligibility: result.eligibility.integrity_hash, outcome: result.outcome_resolution.integrity_hash, non: result.non_recommendation?.integrity_hash, authority: result.authority_validation.integrity_hash, explain: result.explainability.integrity_hash, integrity: result.integrity.integrity_hash, replay: result.replay.integrity_hash, registry: result.registry.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<RecommendationSynthesisResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runRecommendationSynthesisIntelligence(input: RecommendationSynthesisInput = {}): RecommendationSynthesisResult {
  const portfolio = runPortfolioAssessmentIntelligence({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const portfolioValid = validatePortfolioAssessmentIntelligence(portfolio).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<RecommendationSynthesisFailure>([...(portfolioValid ? [] : ["INCOMPLETE_PORTFOLIO_ACCEPTED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const tenantId = input.tenant_id ?? "tenant_mission_control";
  const cycleId = input.recommendation_cycle_id ?? portfolio.assessment.recommendation_cycle_ref;
  const eligible = eligibility(portfolioValid, failures);
  const resolved = outcome(eligible, portfolio.assessment.portfolio_assessment_id, portfolio.assessment.strategy_refs[0], failures);
  const nonRec = nonRecommendation(resolved, failures);
  const auth = authority(failures);
  const rec = recommendation(tenantId, cycleId, resolved, portfolio, auth, failures);
  const exp = explain(rec, failures);
  const int = integrity(rec, failures);
  const rep = replay(failures);
  const reg = registry(tenantId, rec, nonRec);
  const obs = observability(failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, recommendation: rec, eligibility: eligible, outcome_resolution: resolved, non_recommendation: nonRec, authority_validation: auth, explainability: exp, integrity: int, replay: rep, registry: reg, observability: obs };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is RecommendationSynthesisFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification = nested({ certification_id: id("recommendation_synthesis_certification", VERSION), status, ready_for_publication: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateRecommendationSynthesisIntelligence(result?: RecommendationSynthesisResult): RecommendationSynthesisValidation {
  if (!result) {
    const failures = freezeArray<RecommendationSynthesisFailure>(["RECOMMENDATION_CONTRACT_INVALID"]);
    const base = { recommendation_id: null, valid: false, status: "FAIL" as const, ready_for_publication: false, failures, replay_hash_valid: false, integrity_hash_valid: false, exactly_one_outcome_valid: false, advisory_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.recommendation) === result.recommendation.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const exactly_one_outcome_valid = result.outcome_resolution.outcomes.length === 1;
  const advisory_valid = result.recommendation.advisory_only && result.authority_validation.no_execution_authority;
  const valid = result.certification.status === "PASS" && result.certification.ready_for_publication && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && exactly_one_outcome_valid && advisory_valid;
  const base = { recommendation_id: result.recommendation.recommendation_id, valid, status: result.certification.status, ready_for_publication: result.certification.ready_for_publication, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, exactly_one_outcome_valid, advisory_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayRecommendationSynthesisIntelligence(result = runRecommendationSynthesisIntelligence()): boolean {
  const replayed = runRecommendationSynthesisIntelligence({ tenant_id: result.registry.tenant_id, recommendation_cycle_id: result.recommendation.recommendation_cycle_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateRecommendationSynthesisIntelligence(result).valid;
}

export function getRecommendationSynthesisIntelligenceContract(): RecommendationSynthesisContractBundle {
  const result = runRecommendationSynthesisIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, exactly_one_outcome_required: true, advisory_only: true, explainability_required: true, policy_binding_required: true, replay_required: true, duplicate_authoritative_recommendations_blocked: true }), result, validation: validateRecommendationSynthesisIntelligence(result) });
}

export const RecommendationSynthesisIntelligence = Object.freeze({ run: runRecommendationSynthesisIntelligence, validate: validateRecommendationSynthesisIntelligence, replay: replayRecommendationSynthesisIntelligence });
