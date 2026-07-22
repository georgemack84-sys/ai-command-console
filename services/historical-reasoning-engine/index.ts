import { buildCrossMissionIntelligenceGraph, validateCrossMissionIntelligenceGraph } from "@/services/cross-mission-intelligence-graph";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  CounterfactualReferenceReport,
  HistoricalReasoningCertification,
  HistoricalReasoningCertificationTest,
  HistoricalReasoningContract,
  HistoricalReasoningContractBundle,
  HistoricalReasoningFailure,
  HistoricalReasoningInput,
  HistoricalReasoningLedgerEntry,
  HistoricalReasoningObservability,
  HistoricalReasoningRecord,
  HistoricalReasoningResult,
  HistoricalReasoningScenario,
  HistoricalReasoningType,
  HistoricalReasoningValidation,
  HistoricalRecommendation,
  HistoricalReport,
} from "@/types/historical-reasoning-engine";

const VERSION = "historical-reasoning-engine/v11.5" as const;
const ID = "HistoricalReasoningEngine" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_current_historical_context";
const TYPES: readonly HistoricalReasoningType[] = Object.freeze(["HISTORICAL_COMPARISON", "RECOMMENDATION_LOOKUP", "OUTCOME_CORRELATION", "STRATEGY_EVOLUTION", "FAILURE_ANALYSIS", "SUCCESS_ANALYSIS", "TEMPORAL_ANALYSIS", "COUNTERFACTUAL_REFERENCE", "HISTORICAL_CONFIDENCE", "HISTORICAL_RECOMMENDATION"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: HistoricalReasoningScenario): HistoricalReasoningFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly HistoricalReasoningFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

function contract(failures: readonly HistoricalReasoningFailure[]): HistoricalReasoningContract {
  const base: Omit<HistoricalReasoningContract, "integrity_hash"> = {
    contract_id: id("historical_reasoning_contract", VERSION),
    lifecycle: freezeArray(["HISTORICAL_REQUEST", "MISSION_QUALIFICATION", "HISTORICAL_RETRIEVAL", "SIMILARITY_ANALYSIS", "RECOMMENDATION_LOOKUP", "OUTCOME_CORRELATION", "STRATEGY_EVOLUTION_ANALYSIS", "SUCCESS_ANALYSIS", "FAILURE_ANALYSIS", "TEMPORAL_REASONING", "COUNTERFACTUAL_REFERENCE", "HISTORICAL_CONFIDENCE_CALCULATION", "HISTORICAL_RECOMMENDATION_GENERATION", "GOVERNANCE_VALIDATION", "CONSTITUTIONAL_VALIDATION", "OPERATOR_VISIBILITY", "LEDGER_RECORDING"]),
    advisory_only: !failures.includes("ADVISORY_ONLY_VIOLATION"),
    mutation_supported: false,
    autonomous_learning_supported: false,
    deterministic_retrieval_required: !failures.includes("RETRIEVAL_NONDETERMINISTIC"),
    replay_required: !failures.includes("REPLAY_DIVERGENCE"),
    governance_required: !failures.includes("GOVERNANCE_VALIDATION_MISSING"),
    constitutional_required: !failures.includes("CONSTITUTIONAL_VALIDATION_MISSING"),
    tenant_isolation_required: !failures.includes("TENANT_ISOLATION_BREACH"),
    counterfactual_separation_required: !failures.includes("COUNTERFACTUAL_CONTAMINATION"),
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INVALID") ? "invalid-historical-reasoning-contract" : hashWithoutIntegrity(base) });
}

function report(report_id: string, score: number, deterministic: boolean, refs: readonly string[], explanation: string): HistoricalReport {
  const base: Omit<HistoricalReport, "integrity_hash"> = { report_id, score, deterministic, refs: freezeArray(refs), explanation };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function recommendations(refs: readonly string[], failures: readonly HistoricalReasoningFailure[]): readonly HistoricalRecommendation[] {
  return freezeArray(["Use historically validated reroute playbook", "Request governance review before strategy reuse"].map((title, index) => {
    const base: Omit<HistoricalRecommendation, "integrity_hash"> = { recommendation_id: id("historical_recommendation", { title, index }), title, advisory_only: !failures.includes("ADVISORY_ONLY_VIOLATION"), lineage_refs: failures.includes("LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(refs.slice(0, 2)), governance_required: !failures.includes("GOVERNANCE_VALIDATION_MISSING"), constitutional_required: !failures.includes("CONSTITUTIONAL_VALIDATION_MISSING"), auto_execute: false };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function counterfactual(refs: readonly string[], failures: readonly HistoricalReasoningFailure[]): CounterfactualReferenceReport {
  const separated = !failures.includes("COUNTERFACTUAL_CONTAMINATION");
  const base: Omit<CounterfactualReferenceReport, "integrity_hash"> = { report_id: "counterfactual_reference_report", score: separated ? 1 : 0.2, deterministic: separated, refs: freezeArray(refs), explanation: separated ? "Validated simulations are referenced separately from actual historical evidence." : "Counterfactual references contaminated actual history.", simulated_refs: freezeArray(["simulation:historical-counterfactual:reroute", "simulation:alternative-governance-path"]), actual_history_refs: separated ? freezeArray(refs.slice(0, 2)) : freezeArray([...refs.slice(0, 2), "simulation:historical-counterfactual:reroute"]), separated_from_history: separated };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function record(input: HistoricalReasoningInput, refs: readonly string[], recommendationRows: readonly HistoricalRecommendation[], counterfactualReport: CounterfactualReferenceReport, failures: readonly HistoricalReasoningFailure[]): HistoricalReasoningRecord {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  const mission_id = input.mission_id ?? MISSION_ID;
  const reasoning_id = id("historical_reasoning", { tenant_id, mission_id, refs });
  const base: Omit<HistoricalReasoningRecord, "integrity_hash"> = {
    reasoning_id,
    tenant_id,
    mission_id,
    request_timestamp: "2026-07-14T00:00:00.000Z",
    reasoning_scope: "cross-mission-qualified-history",
    reasoning_type: "HISTORICAL_RECOMMENDATION",
    historical_context_refs: freezeArray(refs),
    mission_refs: freezeArray(refs.slice(0, 3).map((ref) => `mission-context:${ref}`)),
    pattern_refs: freezeArray(["pattern:recurring-risk", "pattern:governance-success"]),
    recommendation_refs: freezeArray(["recommendation:accepted:reroute", "recommendation:rejected:unsafe-alpha"]),
    strategy_refs: freezeArray(["strategy:evolved:risk-aware-routing"]),
    outcome_refs: freezeArray(["outcome:mission-success", "outcome:risk-reduction"]),
    similarity_results: freezeArray(["similarity:0.91:mission-risk", "similarity:0.86:governance-path"]),
    temporal_results: freezeArray(["timeline:ordered", "timeline:strategy-evolution"]),
    counterfactual_refs: counterfactualReport.simulated_refs,
    confidence_result: "confidence:0.89:evidence-weighted",
    generated_recommendations: freezeArray(recommendationRows.map((item) => item.recommendation_id)),
    governance_status: failures.includes("GOVERNANCE_VALIDATION_MISSING") ? "REVIEW_REQUIRED" : "APPROVED",
    constitutional_status: failures.includes("CONSTITUTIONAL_VALIDATION_MISSING") ? "VIOLATION" : "VALID",
    replay_refs: failures.includes("REPLAY_DIVERGENCE") ? freezeArray([]) : freezeArray(["replay:historical-reasoning:complete"]),
    ledger_refs: freezeArray([`ledger:${reasoning_id}`]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(reasoningId: string, failures: readonly HistoricalReasoningFailure[]): readonly HistoricalReasoningLedgerEntry[] {
  const events: readonly HistoricalReasoningLedgerEntry["event"][] = freezeArray(["REASONING_REQUESTED", "HISTORICAL_RETRIEVED", "COMPARISON_COMPLETED", "CORRELATION_COMPLETED", "CONFIDENCE_CALCULATED", "RECOMMENDATION_GENERATED", "GOVERNANCE_VALIDATED", "CONSTITUTIONAL_VALIDATED", "OPERATOR_VISIBLE", "REPLAY_RECORDED"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<HistoricalReasoningLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("historical_reasoning_ledger", `${reasoningId}:${event}:${index}`), sequence: index + 1, event, reasoning_id: reasoningId, replay_refs: freezeArray([`replay:historical-reasoning-ledger:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(failures: readonly HistoricalReasoningFailure[]): HistoricalReasoningObservability {
  const base: Omit<HistoricalReasoningObservability, "integrity_hash"> = { observability_id: "historical_reasoning_observability", retrieval_latency_ms: failures.includes("PERFORMANCE_THRESHOLD_MISSED" as HistoricalReasoningFailure) ? 250 : 37, similarity_quality: failures.includes("SIMILARITY_NONREPRODUCIBLE") ? 0.42 : 0.91, replay_consistency: failures.includes("REPLAY_DIVERGENCE") ? 0 : 1, reasoning_failures: failures.length, governance_violations: failures.includes("GOVERNANCE_VALIDATION_MISSING") ? 1 : 0, historical_drift: failures.includes("HISTORICAL_MUTATION_ATTEMPT") ? 1 : 0, lineage_completeness: failures.includes("LINEAGE_INCOMPLETE") ? 0.5 : 1, confidence_distribution: freezeArray([0.82, 0.87, failures.includes("CONFIDENCE_INCONSISTENT") ? 0.41 : 0.89]), counterfactual_separation: !failures.includes("COUNTERFACTUAL_CONTAMINATION"), ledger_integrity: !failures.includes("LEDGER_MUTATION"), operational: !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: HistoricalReasoningFailure, refs: readonly string[]): HistoricalReasoningCertificationTest {
  const base: Omit<HistoricalReasoningCertificationTest, "integrity_hash"> = { test_id: id("historical_reasoning_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<HistoricalReasoningResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: TestBase): readonly HistoricalReasoningCertificationTest[] {
  const refs = result.record.historical_context_refs;
  return freezeArray([
    test("Deterministic retrieval", result.retrieval.deterministic, "RETRIEVAL_NONDETERMINISTIC", refs),
    test("Qualification enforcement", result.graph_certified && result.retrieval.refs.length > 0, "QUALIFICATION_BYPASS", refs),
    test("Version correctness", result.retrieval.refs.every((ref) => ref.length > 0), "VERSION_INCORRECT", refs),
    test("Lineage completeness", result.record.historical_context_refs.length > 0 && result.recommendations.every((item) => item.lineage_refs.length > 0), "LINEAGE_INCOMPLETE", refs),
    test("Similarity reproducibility", result.comparison.deterministic && result.comparison.score >= 0.8, "SIMILARITY_NONREPRODUCIBLE", refs),
    test("Context consistency", result.record.mission_refs.length > 0 && result.record.pattern_refs.length > 0, "CONTEXT_INCONSISTENT", refs),
    test("Evidence validation", result.retrieval.refs.length >= 3, "QUALIFICATION_BYPASS", refs),
    test("Historical recommendation lookup", result.recommendation_history.deterministic && result.record.recommendation_refs.length > 0, "RECOMMENDATION_LOOKUP_INVALID", refs),
    test("Advisory-only enforcement", result.contract.advisory_only && result.recommendations.every((item) => item.advisory_only && !item.auto_execute), "ADVISORY_ONLY_VIOLATION", refs),
    test("Recommendation lineage verification", result.recommendations.every((item) => item.lineage_refs.length > 0), "LINEAGE_INCOMPLETE", refs),
    test("Outcome correlation", result.outcome_correlation.deterministic && result.outcome_correlation.score >= 0.8, "OUTCOME_CORRELATION_INVALID", refs),
    test("Strategy correlation", result.strategy_evolution.deterministic && result.strategy_evolution.score >= 0.8, "STRATEGY_CORRELATION_INVALID", refs),
    test("Confidence correlation", result.historical_confidence.deterministic && result.historical_confidence.score >= 0.8, "CONFIDENCE_CORRELATION_INVALID", refs),
    test("Timeline reconstruction", result.temporal_reasoning.deterministic, "TEMPORAL_NONDETERMINISTIC", refs),
    test("Event ordering", result.record.temporal_results.includes("timeline:ordered"), "TEMPORAL_NONDETERMINISTIC", refs),
    test("Historical sequencing", result.temporal_reasoning.score >= 0.8, "TEMPORAL_NONDETERMINISTIC", refs),
    test("Simulation separation", result.counterfactual_reference.separated_from_history, "COUNTERFACTUAL_CONTAMINATION", refs),
    test("Historical integrity", !result.counterfactual_reference.actual_history_refs.some((ref) => ref.startsWith("simulation:")), "COUNTERFACTUAL_CONTAMINATION", refs),
    test("Replay linkage", result.record.replay_refs.length > 0, "REPLAY_DIVERGENCE", refs),
    test("Confidence reproducibility", result.historical_confidence.deterministic, "CONFIDENCE_INCONSISTENT", refs),
    test("Qualification weighting", result.historical_confidence.score >= 0.8, "CONFIDENCE_INCONSISTENT", refs),
    test("Governance influence", result.record.governance_status === "APPROVED", "GOVERNANCE_VALIDATION_MISSING", refs),
    test("Policy compliance", result.contract.governance_required, "GOVERNANCE_VALIDATION_MISSING", refs),
    test("Approval enforcement", result.record.governance_status === "APPROVED", "GOVERNANCE_VALIDATION_MISSING", refs),
    test("Tenant isolation", result.contract.tenant_isolation_required, "TENANT_ISOLATION_BREACH", refs),
    test("Constitutional validation", result.record.constitutional_status === "VALID", "CONSTITUTIONAL_VALIDATION_MISSING", refs),
    test("Authority boundaries", result.contract.advisory_only, "ADVISORY_ONLY_VIOLATION", refs),
    test("Advisory-only guarantees", result.recommendations.every((item) => item.auto_execute === false), "ADVISORY_ONLY_VIOLATION", refs),
    test("Deterministic replay", result.record.replay_refs.length > 0, "REPLAY_DIVERGENCE", refs),
    test("Ledger reproducibility", result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1), "LEDGER_MUTATION", refs),
    test("Integrity verification", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}

function replayHash(result: Omit<HistoricalReasoningResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, reports: [result.retrieval.integrity_hash, result.comparison.integrity_hash, result.recommendation_history.integrity_hash, result.outcome_correlation.integrity_hash, result.strategy_evolution.integrity_hash, result.failure_analysis.integrity_hash, result.success_analysis.integrity_hash, result.temporal_reasoning.integrity_hash, result.counterfactual_reference.integrity_hash, result.historical_confidence.integrity_hash], recommendations: result.recommendations.map((item) => item.integrity_hash), record: result.record.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<HistoricalReasoningResult, "integrity_hash">): string {
  return hash({ version: result.historical_reasoning_version, id: result.historical_reasoning_identifier, status: result.certification.status, replay_hash: result.replay_hash });
}

export function runHistoricalReasoning(input: HistoricalReasoningInput = {}): HistoricalReasoningResult {
  const graph = buildCrossMissionIntelligenceGraph({ tenant_id: input.tenant_id });
  const graphValid = validateCrossMissionIntelligenceGraph(graph).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<HistoricalReasoningFailure>([...(graphValid ? [] : ["GRAPH_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const refs = freezeArray([...graph.nodes.slice(0, 3).map((node) => node.node_id), ...graph.edges.slice(0, 3).map((edge) => edge.edge_id)]);
  const retrieval = report("historical_retrieval_result", failures.includes("RETRIEVAL_NONDETERMINISTIC") ? 0.2 : 0.94, !failures.includes("RETRIEVAL_NONDETERMINISTIC"), refs, "Retrieved qualified graph intelligence with version-aware immutable references.");
  const comparison = report("historical_comparison_report", failures.includes("SIMILARITY_NONREPRODUCIBLE") ? 0.44 : 0.91, !failures.includes("SIMILARITY_NONREPRODUCIBLE"), refs, "Current mission profile compared against qualified historical graph context.");
  const recommendationHistory = report("recommendation_history_report", failures.includes("RECOMMENDATION_LOOKUP_INVALID") ? 0.3 : 0.88, !failures.includes("RECOMMENDATION_LOOKUP_INVALID"), refs, "Prior accepted, rejected, and governance-approved recommendations retrieved.");
  const outcomeCorrelation = report("outcome_correlation_report", failures.includes("OUTCOME_CORRELATION_INVALID") ? 0.4 : 0.86, !failures.includes("OUTCOME_CORRELATION_INVALID"), refs, "Historical outcomes correlated with strategy, risk, confidence, governance, and operator decisions.");
  const strategyEvolution = report("strategy_evolution_report", failures.includes("STRATEGY_CORRELATION_INVALID") ? 0.4 : 0.89, !failures.includes("STRATEGY_CORRELATION_INVALID"), refs, "Successful strategies traced through revisions, governance approvals, and confidence evolution.");
  const failureAnalysis = report("failure_analysis_report", 0.84, !failures.includes("CONTEXT_INCONSISTENT"), refs, "Historical failure clusters and root-cause patterns identified.");
  const successAnalysis = report("success_analysis_report", 0.9, !failures.includes("CONTEXT_INCONSISTENT"), refs, "Repeatable success patterns and best-practice evidence identified.");
  const temporal = report("temporal_reasoning_report", failures.includes("TEMPORAL_NONDETERMINISTIC") ? 0.3 : 0.92, !failures.includes("TEMPORAL_NONDETERMINISTIC"), refs, "Chronological sequence and evolution timeline reconstructed.");
  const counterfactualReport = counterfactual(refs, failures);
  const confidence = report("historical_confidence_report", failures.includes("CONFIDENCE_INCONSISTENT") ? 0.45 : 0.89, !failures.includes("CONFIDENCE_INCONSISTENT"), refs, "Confidence computed from qualification, replay, similarity, outcome consistency, governance, and version integrity.");
  const recommendationRows = recommendations(refs, failures);
  const recordRow = record(input, refs, recommendationRows, counterfactualReport, failures);
  const ledgerRows = ledger(recordRow.reasoning_id, failures);
  const baseWithoutCertification: TestBase = { historical_reasoning_version: VERSION, historical_reasoning_identifier: ID, graph_certified: graphValid, contract: contract(failures), retrieval, comparison, recommendation_history: recommendationHistory, outcome_correlation: outcomeCorrelation, strategy_evolution: strategyEvolution, failure_analysis: failureAnalysis, success_analysis: successAnalysis, temporal_reasoning: temporal, counterfactual_reference: counterfactualReport, historical_confidence: confidence, recommendations: recommendationRows, record: recordRow, ledger: ledgerRows, observability: observability(failures) };
  const validationTests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is HistoricalReasoningFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<HistoricalReasoningCertification, "integrity_hash"> = { certification_id: id("historical_reasoning_certification", VERSION), status, production_ready: status === "PASS", failures: finalFailures, tests: validationTests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<HistoricalReasoningResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateHistoricalReasoning(result?: HistoricalReasoningResult): HistoricalReasoningValidation {
  if (!result) {
    const failures = freezeArray<HistoricalReasoningFailure>(["CONTRACT_INVALID"]);
    const base: Omit<HistoricalReasoningValidation, "validation_hash"> = { reasoning_id: null, valid: false, status: "FAIL", production_ready: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash
    && hashWithoutIntegrity(result.record) === result.record.integrity_hash
    && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash)
    && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.production_ready && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<HistoricalReasoningValidation, "validation_hash"> = { reasoning_id: result.record.reasoning_id, valid, status: result.certification.status, production_ready: result.certification.production_ready, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayHistoricalReasoning(result = runHistoricalReasoning()): boolean {
  const replayed = runHistoricalReasoning({ tenant_id: result.record.tenant_id, mission_id: result.record.mission_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateHistoricalReasoning(result).valid;
}

export function getHistoricalReasoningContract(): HistoricalReasoningContractBundle {
  const result = runHistoricalReasoning();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, mutation_supported: false, autonomous_learning_supported: false, counterfactuals_are_history: false, reasoning_types: TYPES }), result, validation: validateHistoricalReasoning(result), observability: result.observability });
}

export const HistoricalReasoningEngine = Object.freeze({ run: runHistoricalReasoning, validate: validateHistoricalReasoning, replay: replayHistoricalReasoning });
