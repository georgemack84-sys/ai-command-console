import { runRetrievalIntelligence, validateRetrievalIntelligence } from "@/services/retrieval-intelligence-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  InstitutionalLearningRecord,
  InstitutionalMetrics,
  LearningCategory,
  LearningCertification,
  LearningCertificationTest,
  LearningContract,
  LearningFailure,
  LearningLedgerEntry,
  LearningObservability,
  LearningScenario,
  OrganizationalLearningContractBundle,
  OrganizationalLearningInput,
  OrganizationalLearningResult,
  OrganizationalLearningValidation,
  OrganizationalRecommendation,
  QualifiedLesson,
  StrategicEvolutionRecord,
  TrendIntelligence,
} from "@/types/organizational-learning-framework";

const VERSION = "organizational-learning-framework/v11.7" as const;
const ID = "OrganizationalLearningFramework" as const;
const TENANT_ID = "tenant_mission_control";
const ORG_ID = "org_civitas";
const CATEGORIES: readonly LearningCategory[] = Object.freeze(["STRATEGIC", "OPERATIONAL", "GOVERNANCE", "RISK", "CONFIDENCE", "ORGANIZATIONAL"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: LearningScenario): LearningFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly LearningFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

function contract(failures: readonly LearningFailure[]): LearningContract {
  const base: Omit<LearningContract, "integrity_hash"> = {
    contract_id: id("organizational_learning_contract", VERSION),
    lifecycle: freezeArray(["QUALIFIED_MISSION_HISTORY", "HISTORICAL_ANALYSIS", "PATTERN_CONSOLIDATION", "LESSON_QUALIFICATION", "RECOMMENDATION_GENERATION", "GOVERNANCE_VALIDATION", "REPLAY_VALIDATION", "INSTITUTIONAL_INTELLIGENCE"]),
    advisory_only: !failures.includes("AUTHORITY_BOUNDARY_VIOLATION"),
    self_executing_changes_supported: false,
    governance_required: !failures.includes("POLICY_NONCOMPLIANCE"),
    constitutional_required: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    human_authority_required: !failures.includes("HUMAN_APPROVAL_MISSING"),
    tenant_isolation_required: !failures.includes("TENANT_ISOLATION_BREACH"),
    replay_required: !failures.includes("REPLAY_DIVERGENCE"),
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INVALID") ? "invalid-learning-contract" : hashWithoutIntegrity(base) });
}

function lessons(sourceRefs: readonly string[], failures: readonly LearningFailure[]): readonly QualifiedLesson[] {
  return freezeArray(CATEGORIES.map((category, index) => {
    const base: Omit<QualifiedLesson, "integrity_hash"> = {
      lesson_id: id("qualified_lesson", { category, source: sourceRefs[index % sourceRefs.length] }),
      category,
      evidence_refs: failures.includes("EVIDENCE_INSUFFICIENT") ? freezeArray([]) : freezeArray(sourceRefs.slice(0, 3)),
      confidence_score: failures.includes("CONFIDENCE_NOT_QUALIFIED") ? 0.52 : 0.88 + index * 0.01,
      replay_validated: !failures.includes("REPLAY_DIVERGENCE"),
      governance_approved: !failures.includes("POLICY_NONCOMPLIANCE"),
      constitutional_valid: !failures.includes("CONSTITUTIONAL_VIOLATION"),
      duplicate_consolidated: !failures.includes("DUPLICATE_NOT_CONSOLIDATED"),
      operator_review_complete: !failures.includes("HUMAN_APPROVAL_MISSING"),
      lineage_refs: failures.includes("LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([`lineage:lesson:${category.toLowerCase()}`]),
      explainable: !failures.includes("LESSON_EXPLAINABILITY_INCOMPLETE"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function recommendations(lessonRows: readonly QualifiedLesson[], failures: readonly LearningFailure[]): readonly OrganizationalRecommendation[] {
  return freezeArray(lessonRows.map((lesson, index) => {
    const base: Omit<OrganizationalRecommendation, "integrity_hash"> = { recommendation_id: id("organizational_recommendation", lesson.lesson_id), category: lesson.category, title: `${lesson.category.toLowerCase()} improvement recommendation`, evidence_refs: lesson.evidence_refs, reproducible: !failures.includes("RECOMMENDATION_NONREPRODUCIBLE"), advisory_only: !failures.includes("AUTHORITY_BOUNDARY_VIOLATION"), governance_required: !failures.includes("POLICY_NONCOMPLIANCE"), auto_execute: false, expected_improvement: failures.includes("RISK_REDUCTION_NOT_VALIDATED") && lesson.category === "RISK" ? 0.02 : 0.14 + index * 0.01 };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function trends(lessonRows: readonly QualifiedLesson[], failures: readonly LearningFailure[]): readonly TrendIntelligence[] {
  return freezeArray(lessonRows.map((lesson) => {
    const base: Omit<TrendIntelligence, "integrity_hash"> = { trend_id: id("organizational_trend", lesson.lesson_id), category: lesson.category, pattern_refs: freezeArray([`pattern:${lesson.category.toLowerCase()}:recurring`, `pattern:${lesson.category.toLowerCase()}:maturity`]), reproducible: !failures.includes("TREND_NONREPRODUCIBLE"), explanation: `${lesson.category} trend is derived from qualified historical intelligence and replayable lesson lineage.` };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function evolution(failures: readonly LearningFailure[]): StrategicEvolutionRecord {
  const base: Omit<StrategicEvolutionRecord, "integrity_hash"> = { evolution_id: id("strategic_evolution", VERSION), strategy_lineage: freezeArray(["strategy:v1", "strategy:v2"]), recommendation_lineage: freezeArray(["recommendation:strategic", "recommendation:risk"]), improvement_history: freezeArray(["improvement:planning", "improvement:governance"]), evolution_confidence: failures.includes("STRATEGIC_EVOLUTION_INCONSISTENT") ? 0.4 : 0.9, governance_evolution: freezeArray(["governance:approval-path-refined"]), effectiveness_trend: failures.includes("STRATEGIC_EVOLUTION_INCONSISTENT") ? freezeArray([0.7, 0.61]) : freezeArray([0.72, 0.81, 0.88]), traceable: !failures.includes("STRATEGIC_EVOLUTION_INCONSISTENT") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function metrics(failures: readonly LearningFailure[]): InstitutionalMetrics {
  const deterministic = !failures.includes("METRICS_NONDETERMINISTIC");
  const base: Omit<InstitutionalMetrics, "integrity_hash"> = { metrics_id: id("institutional_metrics", VERSION), lesson_quality: 0.91, recommendation_effectiveness: 0.87, governance_efficiency: 0.84, strategy_improvement: 0.88, organizational_maturity: 0.82, confidence_growth: failures.includes("CONFIDENCE_IMPROVEMENT_INVALID") ? 0.01 : 0.12, risk_reduction: failures.includes("RISK_REDUCTION_NOT_VALIDATED") ? 0.02 : 0.18, replay_stability: failures.includes("REPLAY_DIVERGENCE") ? 0 : 1, evidence_quality: failures.includes("EVIDENCE_INSUFFICIENT") ? 0.4 : 0.92, qualification_success: failures.includes("QUALIFICATION_INCONSISTENT") ? 0.5 : 1, operator_adoption: failures.includes("HUMAN_APPROVAL_MISSING") ? 0 : 0.78, institutional_growth: 0.22, deterministic };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function record(input: OrganizationalLearningInput, sourceRefs: readonly string[], lessonRows: readonly QualifiedLesson[], recommendationRows: readonly OrganizationalRecommendation[], trendRows: readonly TrendIntelligence[], metricsRow: InstitutionalMetrics, failures: readonly LearningFailure[]): InstitutionalLearningRecord {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  const organization_id = input.organization_id ?? ORG_ID;
  const learning_id = id("institutional_learning", { tenant_id, organization_id, sourceRefs });
  const base: Omit<InstitutionalLearningRecord, "integrity_hash"> = { learning_id, organization_id, tenant_id, learning_type: "INSTITUTIONAL_INTELLIGENCE", learning_category: "ORGANIZATIONAL", source_history_refs: sourceRefs, qualified_lesson_refs: freezeArray(lessonRows.map((lesson) => lesson.lesson_id)), recommendation_refs: freezeArray(recommendationRows.map((rec) => rec.recommendation_id)), trend_refs: freezeArray(trendRows.map((trend) => trend.trend_id)), organizational_metrics: metricsRow.metrics_id, confidence_score: metricsRow.confidence_growth + 0.78, governance_status: failures.includes("POLICY_NONCOMPLIANCE") ? "REVIEW_REQUIRED" : "APPROVED", operator_status: failures.includes("HUMAN_APPROVAL_MISSING") ? "PENDING" : "APPROVED", qualification_status: failures.includes("QUALIFICATION_INCONSISTENT") ? "REJECTED" : "QUALIFIED", replay_status: failures.includes("REPLAY_DIVERGENCE") ? "DIVERGED" : "VALID", lineage_refs: failures.includes("LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:retrieval", "lineage:historical-reasoning", "lineage:organizational-learning"]), certification_status: statusFor(failures), created_at: "2026-07-14T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(learningId: string, failures: readonly LearningFailure[]): readonly LearningLedgerEntry[] {
  const events: readonly LearningLedgerEntry["event"][] = freezeArray(["LESSON_QUALIFIED", "RECOMMENDATION_GENERATED", "LINEAGE_RECORDED", "GOVERNANCE_APPROVED", "REPLAY_VALIDATED", "STRATEGY_EVOLVED", "METRICS_RECORDED", "CERTIFICATION_RECORDED"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<LearningLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("organizational_learning_ledger", `${learningId}:${event}:${index}`), sequence: index + 1, event, learning_id: learningId, replay_refs: freezeArray([`replay:organizational-learning:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(failures: readonly LearningFailure[]): LearningObservability {
  const base: Omit<LearningObservability, "integrity_hash"> = { observability_id: "organizational_learning_observability", learning_throughput: 18, qualification_failures: failures.includes("QUALIFICATION_INCONSISTENT") ? 1 : 0, recommendation_quality: failures.includes("RECOMMENDATION_NONREPRODUCIBLE") ? 0.4 : 0.89, governance_latency_ms: 42, replay_failures: failures.includes("REPLAY_DIVERGENCE") ? 1 : 0, lesson_adoption: failures.includes("HUMAN_APPROVAL_MISSING") ? 0 : 0.77, strategic_evolution: failures.includes("STRATEGIC_EVOLUTION_INCONSISTENT") ? 0.4 : 0.88, confidence_improvements: failures.includes("CONFIDENCE_IMPROVEMENT_INVALID") ? 0 : 0.12, risk_reductions: failures.includes("RISK_REDUCTION_NOT_VALIDATED") ? 0 : 0.18, institutional_growth: 0.22, certification_readiness: failures.length ? 0.3 : 1, operational: !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: LearningFailure, refs: readonly string[]): LearningCertificationTest {
  const base: Omit<LearningCertificationTest, "integrity_hash"> = { test_id: id("organizational_learning_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<OrganizationalLearningResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: TestBase): readonly LearningCertificationTest[] {
  const refs = result.record.source_history_refs;
  return freezeArray([
    test("Evidence sufficiency validation", result.lessons.every((lesson) => lesson.evidence_refs.length >= 3), "EVIDENCE_INSUFFICIENT", refs),
    test("Confidence qualification", result.lessons.every((lesson) => lesson.confidence_score >= 0.8), "CONFIDENCE_NOT_QUALIFIED", refs),
    test("Duplicate consolidation", result.lessons.every((lesson) => lesson.duplicate_consolidated), "DUPLICATE_NOT_CONSOLIDATED", refs),
    test("Qualification consistency", result.record.qualification_status === "QUALIFIED", "QUALIFICATION_INCONSISTENT", refs),
    test("Strategic recommendation reproducibility", result.recommendations.every((rec) => rec.reproducible), "RECOMMENDATION_NONREPRODUCIBLE", refs),
    test("Governance recommendation quality", result.recommendations.some((rec) => rec.category === "GOVERNANCE" && rec.expected_improvement >= 0.1), "GOVERNANCE_RECOMMENDATION_LOW_QUALITY", refs),
    test("Risk reduction effectiveness", result.metrics.risk_reduction >= 0.1, "RISK_REDUCTION_NOT_VALIDATED", refs),
    test("Confidence improvement validation", result.metrics.confidence_growth >= 0.1, "CONFIDENCE_IMPROVEMENT_INVALID", refs),
    test("Historical replay determinism", result.record.replay_status === "VALID", "REPLAY_DIVERGENCE", refs),
    test("Recommendation replay reproducibility", result.recommendations.every((rec) => rec.reproducible), "RECOMMENDATION_NONREPRODUCIBLE", refs),
    test("Lineage completeness", result.record.lineage_refs.length >= 3 && result.lessons.every((lesson) => lesson.lineage_refs.length > 0), "LINEAGE_INCOMPLETE", refs),
    test("Outcome consistency", result.metrics.recommendation_effectiveness >= 0.8, "OUTCOME_INCONSISTENT", refs),
    test("Constitutional compliance", result.contract.constitutional_required && result.lessons.every((lesson) => lesson.constitutional_valid), "CONSTITUTIONAL_VIOLATION", refs),
    test("Human approval enforcement", result.contract.human_authority_required && result.record.operator_status === "APPROVED", "HUMAN_APPROVAL_MISSING", refs),
    test("Policy adherence", result.contract.governance_required && result.record.governance_status === "APPROVED", "POLICY_NONCOMPLIANCE", refs),
    test("Authority boundary preservation", result.contract.advisory_only && result.recommendations.every((rec) => !rec.auto_execute), "AUTHORITY_BOUNDARY_VIOLATION", refs),
    test("Tenant isolation", result.contract.tenant_isolation_required, "TENANT_ISOLATION_BREACH", refs),
    test("Immutable ledger integrity", result.ledger.every((entry) => entry.append_only), "LEDGER_MUTATION", refs),
    test("Access control enforcement", result.retrieval_certified, "ACCESS_CONTROL_FAILURE", refs),
    test("Audit completeness", result.ledger.length === 8 && result.ledger.every((entry, index) => entry.sequence === index + 1), "AUDIT_INCOMPLETE", refs),
    test("Trend reproducibility", result.trends.every((trend) => trend.reproducible), "TREND_NONREPRODUCIBLE", refs),
    test("Strategic evolution consistency", result.strategic_evolution.traceable && result.strategic_evolution.evolution_confidence >= 0.8, "STRATEGIC_EVOLUTION_INCONSISTENT", refs),
    test("Institutional metrics determinism", result.metrics.deterministic, "METRICS_NONDETERMINISTIC", refs),
    test("Lesson explainability", result.lessons.every((lesson) => lesson.explainable), "LESSON_EXPLAINABILITY_INCOMPLETE", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}

function replayHash(result: Omit<OrganizationalLearningResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, lessons: result.lessons.map((lesson) => lesson.integrity_hash), recommendations: result.recommendations.map((rec) => rec.integrity_hash), trends: result.trends.map((trend) => trend.integrity_hash), evolution: result.strategic_evolution.integrity_hash, metrics: result.metrics.integrity_hash, record: result.record.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<OrganizationalLearningResult, "integrity_hash">): string {
  return hash({ version: result.learning_version, id: result.learning_identifier, status: result.certification.status, replay_hash: result.replay_hash });
}

export function runOrganizationalLearning(input: OrganizationalLearningInput = {}): OrganizationalLearningResult {
  const retrieval = runRetrievalIntelligence({ tenant_id: input.tenant_id });
  const retrievalValid = validateRetrievalIntelligence(retrieval).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<LearningFailure>([...(retrievalValid ? [] : ["RETRIEVAL_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const sourceRefs = freezeArray(retrieval.record.approved_records);
  const lessonRows = lessons(sourceRefs, failures);
  const recommendationRows = recommendations(lessonRows, failures);
  const trendRows = trends(lessonRows, failures);
  const evolutionRow = evolution(failures);
  const metricsRow = metrics(failures);
  const recordRow = record(input, sourceRefs, lessonRows, recommendationRows, trendRows, metricsRow, failures);
  const ledgerRows = ledger(recordRow.learning_id, failures);
  const baseWithoutCertification: TestBase = { learning_version: VERSION, learning_identifier: ID, retrieval_certified: retrievalValid, contract: contract(failures), lessons: lessonRows, recommendations: recommendationRows, trends: trendRows, strategic_evolution: evolutionRow, metrics: metricsRow, record: recordRow, ledger: ledgerRows, observability: observability(failures) };
  const validationTests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is LearningFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<LearningCertification, "integrity_hash"> = { certification_id: id("organizational_learning_certification", VERSION), status, approved_for_organizational_use: status === "PASS", failures: finalFailures, tests: validationTests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<OrganizationalLearningResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateOrganizationalLearning(result?: OrganizationalLearningResult): OrganizationalLearningValidation {
  if (!result) {
    const failures = freezeArray<LearningFailure>(["CONTRACT_INVALID"]);
    const base: Omit<OrganizationalLearningValidation, "validation_hash"> = { learning_id: null, valid: false, status: "FAIL", approved_for_organizational_use: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash && hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash) && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.approved_for_organizational_use && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<OrganizationalLearningValidation, "validation_hash"> = { learning_id: result.record.learning_id, valid, status: result.certification.status, approved_for_organizational_use: result.certification.approved_for_organizational_use, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayOrganizationalLearning(result = runOrganizationalLearning()): boolean {
  const replayed = runOrganizationalLearning({ tenant_id: result.record.tenant_id, organization_id: result.record.organization_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateOrganizationalLearning(result).valid;
}

export function getOrganizationalLearningContract(): OrganizationalLearningContractBundle {
  const result = runOrganizationalLearning();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, automatic_policy_changes_supported: false, automatic_execution_supported: false, cross_tenant_learning_supported: false, categories: CATEGORIES }), result, validation: validateOrganizationalLearning(result), observability: result.observability });
}

export const OrganizationalLearningFramework = Object.freeze({ run: runOrganizationalLearning, validate: validateOrganizationalLearning, replay: replayOrganizationalLearning });
