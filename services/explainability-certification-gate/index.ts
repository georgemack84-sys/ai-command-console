import { buildConfidenceRiskReasoning, getConfidenceRiskRecord, replayConfidenceAnalysis, replayRiskAnalysis, validateConfidenceRiskReasoning } from "@/services/confidence-risk-reasoning-engine";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateNarrative, getNarrative, replayNarrative, validateNarrative } from "@/services/decision-narrative-engine";
import { buildExplanationGraph, getReasoningGraph, replayReasoningGraph, validateReasoningGraph } from "@/services/evidence-policy-reasoning-graph";
import { getExplanation, registerExplanation, replayExplanation, validateExplanationRepository } from "@/services/explainability-contract";
import type { ConfidenceRiskScenario } from "@/types/confidence-risk-reasoning-engine";
import type { NarrativeScenario } from "@/types/decision-narrative-engine";
import type { ReasoningGraphScenario } from "@/types/evidence-policy-reasoning-graph";
import type { ExplainabilityScenario } from "@/types/explainability-contract";
import type {
  ExplainabilityCertificationFailure,
  ExplainabilityCertificationGateContract,
  ExplainabilityCertificationInput,
  ExplainabilityCertificationLedger,
  ExplainabilityCertificationObservabilitySurface,
  ExplainabilityCertificationOutcome,
  ExplainabilityCertificationReplayResult,
  ExplainabilityCertificationReport,
  ExplainabilityCertificationScenario,
  ExplainabilityCertificationTestResult,
  ExplainabilityCertificationValidationResult,
} from "@/types/explainability-certification-gate";

const NOW = "2026-07-13T12:00:00.000Z";
const VERSION = "explainability-certification-gate/v8ALT.5.5" as const;
const PHASE_ID = "8ALT.5.5" as const;
const TENANT_ID = "tenant:autonomy:primary";
const states = Object.freeze(["INITIALIZING", "VALIDATING_SCHEMA", "VALIDATING_NARRATIVES", "VALIDATING_EVIDENCE", "VALIDATING_POLICY", "VALIDATING_CONSTITUTION", "VALIDATING_AUTHORITY", "VALIDATING_CONFIDENCE", "VALIDATING_RISK", "VALIDATING_REPLAY", "VALIDATING_INTEGRITY", "CERTIFIED", "CONDITIONAL_PASS", "FAIL"] as const);
const outcomes = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const);
const categories = Object.freeze(["contract", "schema", "narrative", "evidence", "policy", "constitution", "authority", "confidence_risk", "replay", "integrity"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function scenarioMap(scenario: ExplainabilityCertificationScenario): { explainability?: ExplainabilityScenario; narrative?: NarrativeScenario; graph?: ReasoningGraphScenario; confidenceRisk?: ConfidenceRiskScenario; failure?: ExplainabilityCertificationFailure } {
  const map: Partial<Record<ExplainabilityCertificationScenario, ReturnType<typeof scenarioMap>>> = {
    MISSING_EXPLANATION: { explainability: "MISSING_IDENTIFIERS", failure: "MISSING_EXPLANATION_DETECTED" },
    FABRICATED_EXPLANATION: { explainability: "FABRICATED_REASONING", narrative: "FABRICATED_STATEMENT", failure: "FABRICATED_EXPLANATION_DETECTED" },
    HIDDEN_EVIDENCE: { explainability: "MISSING_EVIDENCE", graph: "MISSING_EVIDENCE", failure: "HIDDEN_EVIDENCE_DETECTED" },
    POLICY_OMISSION: { explainability: "INCOMPLETE_POLICY_REFERENCES", graph: "INCOMPLETE_POLICY_LINEAGE", failure: "POLICY_OMISSION_DETECTED" },
    AUTHORITY_OMISSION: { explainability: "AUTHORITY_VALIDATION_FAILURE", graph: "INCOMPLETE_AUTHORITY_VALIDATION", failure: "AUTHORITY_OMISSION_DETECTED" },
    CONFIDENCE_REPLAY_MISMATCH: { confidenceRisk: "NONDETERMINISTIC_CALCULATION", failure: "CONFIDENCE_REPLAY_MISMATCH_DETECTED" },
    RISK_REPLAY_MISMATCH: { confidenceRisk: "UNREPRODUCIBLE_RISK_CLASSIFICATION", failure: "RISK_REPLAY_MISMATCH_DETECTED" },
    NONDETERMINISTIC_WORDING: { narrative: "NONDETERMINISTIC_WORDING", failure: "NONDETERMINISTIC_EXPLANATION_WORDING" },
    CROSS_TENANT_LEAKAGE: { explainability: "CROSS_TENANT_REFERENCE", narrative: "CROSS_TENANT_EVIDENCE", graph: "CROSS_TENANT_RELATIONSHIP", confidenceRisk: "CROSS_TENANT_REFERENCE", failure: "CROSS_TENANT_EXPLANATION_LEAKAGE" },
    REPLAY_MISMATCH: { explainability: "INVALID_REPLAY_REFERENCE", narrative: "INVALID_REPLAY_REFERENCE", graph: "INVALID_REPLAY_REFERENCE", confidenceRisk: "INVALID_REPLAY_REFERENCE", failure: "REPLAY_EXPLANATION_MISMATCH" },
    INTEGRITY_FAILURE: { explainability: "INTEGRITY_HASH_FAILURE", narrative: "INTEGRITY_FAILURE", graph: "INTEGRITY_FAILURE", confidenceRisk: "INTEGRITY_FAILURE", failure: "INTEGRITY_VERIFICATION_FAILED" },
  };
  return map[scenario] ?? {};
}

function computeTestHash(test: Omit<ExplainabilityCertificationTestResult, "integrity_hash"> | ExplainabilityCertificationTestResult): string {
  const { integrity_hash: _hash, ...source } = test as ExplainabilityCertificationTestResult;
  return hashValue("explainability-certification-test", source);
}

function testResult(name: string, category: ExplainabilityCertificationTestResult["category"], passed: boolean, evidence: readonly string[], replay: string): ExplainabilityCertificationTestResult {
  const base = { test_id: id("ECT", "explainability-certification-test", { name, category }), name, category, expected_outcome: "PASS" as const, actual_outcome: passed ? "PASS" as const : "FAIL" as const, status: passed ? "PASS" as const : "FAIL" as const, evidence_references: freezeArray(evidence.filter(Boolean).sort()), replay_reference: replay };
  return Object.freeze({ ...base, integrity_hash: computeTestHash(base) });
}

function computeReportHash(report: Omit<ExplainabilityCertificationReport, "report_hash"> | ExplainabilityCertificationReport): string {
  const { report_hash: _hash, ...source } = report as ExplainabilityCertificationReport;
  return hashValue("explainability-certification-report", source);
}

export function computeExplainabilityCertificationLedgerHash(ledger: Omit<ExplainabilityCertificationLedger, "ledger_hash"> | ExplainabilityCertificationLedger): string {
  const { ledger_hash: _hash, ...source } = ledger as ExplainabilityCertificationLedger;
  return hashValue("explainability-certification-ledger", source);
}

export function runExplainabilityCertification(input: ExplainabilityCertificationInput = {}): ExplainabilityCertificationLedger {
  const scenario = input.scenario ?? "BASELINE";
  const mapped = scenarioMap(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const explanationRepository = input.explainability_repository ?? registerExplanation({ scenario: mapped.explainability ?? "BASELINE", tenant_id: tenantId, mission_id: input.mission_id });
  const explanation = getExplanation(explanationRepository);
  const narrativeRepository = input.narrative_repository ?? generateNarrative({ scenario: mapped.narrative ?? "BASELINE", tenant_id: tenantId, mission_id: explanationRepository.mission_id, explanation: explanation ?? undefined });
  const narrative = getNarrative(narrativeRepository);
  const graphRepository = input.reasoning_graph_repository ?? buildExplanationGraph({ scenario: mapped.graph ?? "BASELINE", tenant_id: tenantId, mission_id: explanationRepository.mission_id, explanation: explanation ?? undefined, narrative: narrative ?? undefined });
  const graph = getReasoningGraph(graphRepository);
  const confidenceRiskRepository = input.confidence_risk_repository ?? buildConfidenceRiskReasoning({ scenario: mapped.confidenceRisk ?? "BASELINE", tenant_id: tenantId, mission_id: explanationRepository.mission_id, explanation: explanation ?? undefined, graph: graph ?? undefined });
  const confidenceRisk = getConfidenceRiskRecord(confidenceRiskRepository);
  const explainabilityValid = validateExplanationRepository(explanationRepository);
  const narrativeValid = validateNarrative(narrative);
  const graphValid = validateReasoningGraph(graph);
  const confidenceRiskValid = validateConfidenceRiskReasoning(confidenceRisk);
  const explanationReplay = replayExplanation(explanation);
  const narrativeReplay = replayNarrative(narrative);
  const graphReplay = replayReasoningGraph(graph);
  const confidenceReplay = replayConfidenceAnalysis(confidenceRisk);
  const riskReplay = replayRiskAnalysis(confidenceRisk);
  const evidence = [explanationRepository.repository_hash, narrativeRepository.repository_hash, graphRepository.repository_hash, confidenceRiskRepository.repository_hash, explanation?.explanation_hash ?? "", narrative?.narrative_hash ?? "", graph?.graph_hash ?? "", confidenceRisk?.reasoning_hash ?? ""];
  const rows = freezeArray([
    testResult("Explainability contract valid", "contract", explainabilityValid.valid, [explanationRepository.repository_hash], explanationReplay.replay_reference),
    testResult("Explanation schema complete", "schema", explainabilityValid.schema_valid, [explanation?.explanation_hash ?? ""], explanationReplay.replay_reference),
    testResult("Decision narratives deterministic", "narrative", narrativeValid.valid && narrativeReplay.deterministic, [narrative?.narrative_hash ?? ""], narrativeReplay.replay_reference),
    testResult("Explanation replay identical", "replay", explanationReplay.deterministic, [explanation?.explanation_hash ?? ""], explanationReplay.replay_reference),
    testResult("Selected plan explained", "narrative", narrativeValid.valid && Boolean(explanation?.selected_option), [narrative?.narrative_hash ?? ""], narrativeReplay.replay_reference),
    testResult("Rejected plans explained", "narrative", narrativeValid.valid && Boolean(explanation?.rejected_options.length), [narrative?.narrative_hash ?? ""], narrativeReplay.replay_reference),
    testResult("Evidence chain complete", "evidence", graphValid.evidence_complete, [graph?.graph_hash ?? ""], graphReplay.replay_reference),
    testResult("Evidence lineage reproducible", "evidence", graphValid.lineage_complete && graphReplay.deterministic, [graph?.graph_hash ?? ""], graphReplay.replay_reference),
    testResult("Policy influence graph deterministic", "policy", graphValid.policy_complete && graphValid.topology_deterministic, [graph?.graph_hash ?? ""], graphReplay.replay_reference),
    testResult("Constitutional evaluations visible", "constitution", graphValid.constitutional_complete, [graph?.graph_hash ?? ""], graphReplay.replay_reference),
    testResult("Authority approvals traceable", "authority", graphValid.authority_complete, [graph?.graph_hash ?? ""], graphReplay.replay_reference),
    testResult("Confidence reasoning reproducible", "confidence_risk", confidenceRiskValid.confidence_factors_complete && confidenceReplay.deterministic, [confidenceRisk?.reasoning_hash ?? ""], confidenceReplay.replay_reference),
    testResult("Risk reasoning reproducible", "confidence_risk", confidenceRiskValid.risk_reproducible && riskReplay.deterministic, [confidenceRisk?.reasoning_hash ?? ""], riskReplay.replay_reference),
    testResult("Explanation graph complete", "evidence", graphValid.valid, [graph?.graph_hash ?? ""], graphReplay.replay_reference),
    testResult("Missing explanation detected", "schema", scenario === "MISSING_EXPLANATION" ? !explainabilityValid.valid : true, [explanationRepository.repository_hash], explanationReplay.replay_reference),
    testResult("Fabricated explanation generated", "schema", scenario === "FABRICATED_EXPLANATION" ? !explainabilityValid.valid || !narrativeValid.valid : true, [explanationRepository.repository_hash, narrativeRepository.repository_hash], narrativeReplay.replay_reference),
    testResult("Hidden evidence detected", "evidence", scenario === "HIDDEN_EVIDENCE" ? !graphValid.evidence_complete : true, [graphRepository.repository_hash], graphReplay.replay_reference),
    testResult("Policy omission detected", "policy", scenario === "POLICY_OMISSION" ? !graphValid.policy_complete : true, [graphRepository.repository_hash], graphReplay.replay_reference),
    testResult("Authority omission detected", "authority", scenario === "AUTHORITY_OMISSION" ? !graphValid.authority_complete : true, [graphRepository.repository_hash], graphReplay.replay_reference),
    testResult("Confidence mismatch during replay", "confidence_risk", scenario === "CONFIDENCE_REPLAY_MISMATCH" ? !confidenceRiskValid.deterministic_calculation_valid : true, [confidenceRiskRepository.repository_hash], confidenceReplay.replay_reference),
    testResult("Risk mismatch during replay", "confidence_risk", scenario === "RISK_REPLAY_MISMATCH" ? !confidenceRiskValid.risk_reproducible : true, [confidenceRiskRepository.repository_hash], riskReplay.replay_reference),
    testResult("Non-deterministic explanation wording", "narrative", scenario === "NONDETERMINISTIC_WORDING" ? !narrativeValid.deterministic_wording_valid : true, [narrativeRepository.repository_hash], narrativeReplay.replay_reference),
    testResult("Cross-tenant explanation leakage", "integrity", scenario === "CROSS_TENANT_LEAKAGE" ? !explainabilityValid.tenant_isolated || !graphValid.tenant_isolated || !confidenceRiskValid.tenant_isolated : true, evidence, graphReplay.replay_reference),
    testResult("Replay explanation mismatch", "replay", scenario === "REPLAY_MISMATCH" ? !explanationReplay.deterministic || !narrativeReplay.deterministic || !graphReplay.deterministic || !confidenceReplay.deterministic : true, evidence, explanationReplay.replay_reference),
    testResult("Governance compliance verified", "policy", explainabilityValid.governance_valid && graphValid.policy_complete, evidence, graphReplay.replay_reference),
    testResult("Constitutional compliance verified", "constitution", explainabilityValid.constitutional_valid && graphValid.constitutional_complete, evidence, graphReplay.replay_reference),
    testResult("Replay deterministic", "replay", explanationReplay.deterministic && narrativeReplay.deterministic && graphReplay.deterministic && confidenceReplay.deterministic && riskReplay.deterministic, evidence, graphReplay.replay_reference),
    testResult("Integrity verified", "integrity", explainabilityValid.integrity_valid && narrativeValid.integrity_valid && graphValid.integrity_valid && confidenceRiskValid.integrity_valid, evidence, graphReplay.replay_reference),
  ]);
  const rowFailures = rows.filter((row) => row.status === "FAIL");
  const scenarioFailure = mapped.failure ? [mapped.failure] : [];
  const failures = unique([
    ...scenarioFailure,
    ...(!explainabilityValid.valid ? ["EXPLAINABILITY_CONTRACT_INVALID" as const] : []),
    ...(!explainabilityValid.schema_valid ? ["EXPLANATION_SCHEMA_INCOMPLETE" as const] : []),
    ...(!narrativeValid.valid ? ["DECISION_NARRATIVE_NONDETERMINISTIC" as const] : []),
    ...(!graphValid.evidence_complete ? ["EVIDENCE_CHAIN_INCOMPLETE" as const] : []),
    ...(!graphValid.policy_complete ? ["POLICY_INFLUENCE_NONDETERMINISTIC" as const] : []),
    ...(!graphValid.constitutional_complete ? ["CONSTITUTIONAL_EVALUATIONS_MISSING" as const] : []),
    ...(!graphValid.authority_complete ? ["AUTHORITY_APPROVALS_UNTRACEABLE" as const] : []),
    ...(!confidenceRiskValid.confidence_factors_complete || !confidenceReplay.deterministic ? ["CONFIDENCE_REASONING_UNREPRODUCIBLE" as const] : []),
    ...(!confidenceRiskValid.risk_reproducible || !riskReplay.deterministic ? ["RISK_REASONING_UNREPRODUCIBLE" as const] : []),
    ...(!graphValid.valid ? ["EXPLANATION_GRAPH_INCOMPLETE" as const] : []),
    ...(!(explanationReplay.deterministic && narrativeReplay.deterministic && graphReplay.deterministic) ? ["REPLAY_NONDETERMINISTIC" as const] : []),
    ...(!(explainabilityValid.integrity_valid && narrativeValid.integrity_valid && graphValid.integrity_valid && confidenceRiskValid.integrity_valid) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!(explainabilityValid.advisory_only_enforced && narrativeValid.advisory_only_enforced && graphValid.advisory_only_enforced && confidenceRiskValid.advisory_only_enforced) ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...(scenario === "DOCUMENTATION_WARNING" ? ["NON_CRITICAL_DOCUMENTATION_WARNING" as const] : []),
  ]);
  const warnings = scenario === "DOCUMENTATION_WARNING" ? freezeArray(["documentation/runbook refinement remains open"]) : freezeArray<string>([]);
  const criticalFailures = failures.filter((failure) => failure !== "NON_CRITICAL_DOCUMENTATION_WARNING");
  const overall_status: ExplainabilityCertificationOutcome = criticalFailures.length || rowFailures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const certification_id = id("ECG", "explainability-certification", { scenario, mission: explanationRepository.mission_id });
  const reportBase = {
    certification_id,
    phase_id: PHASE_ID,
    certification_version: VERSION,
    certification_timestamp: NOW,
    overall_status,
    certification_state: overall_status === "PASS" ? "CERTIFIED" as const : overall_status === "CONDITIONAL_PASS" ? "CONDITIONAL_PASS" as const : "FAIL" as const,
    tests_executed: rows.length,
    tests_passed: rows.filter((row) => row.status === "PASS").length,
    tests_failed: rowFailures.length,
    warnings,
    explanation_coverage: explainabilityValid.valid && narrativeValid.valid,
    replay_verification: explanationReplay.deterministic && narrativeReplay.deterministic && graphReplay.deterministic && confidenceReplay.deterministic && riskReplay.deterministic,
    governance_verification: explainabilityValid.governance_valid && graphValid.policy_complete,
    constitutional_verification: explainabilityValid.constitutional_valid && graphValid.constitutional_complete,
    authority_verification: explainabilityValid.authority_valid && graphValid.authority_complete,
    confidence_verification: confidenceRiskValid.confidence_factors_complete && confidenceReplay.deterministic,
    risk_verification: confidenceRiskValid.risk_reproducible && riskReplay.deterministic,
    integrity_verification: explainabilityValid.integrity_valid && narrativeValid.integrity_valid && graphValid.integrity_valid && confidenceRiskValid.integrity_valid,
    tenant_isolation_status: explainabilityValid.tenant_isolated && narrativeValid.tenant_isolated && graphValid.tenant_isolated && confidenceRiskValid.tenant_isolated,
    test_results: rows,
    failures,
    truth_reference: `truth:explainability-certification:${certification_id}`,
    lineage_reference: `lineage:explainability-certification:${certification_id}`,
    replay_reference: `replay:explainability-certification:${certification_id}`,
    integrity_hash: hashValue("explainability-certification-integrity", { evidence, tests: rows.map((row) => row.integrity_hash) }),
    certified_by: "explainability-certification-gate",
    advisory_only: true as const,
  };
  const report = Object.freeze({ ...reportBase, report_hash: computeReportHash(reportBase as Omit<ExplainabilityCertificationReport, "report_hash">) });
  const ledgerBase = {
    ledger_id: id("ECGLEDGER", "explainability-certification-ledger", report.report_hash),
    tenant_id: scenario === "CROSS_TENANT_LEAKAGE" ? "external-tenant" : tenantId,
    mission_id: explanationRepository.mission_id,
    reports: freezeArray([report]),
    source_explainability_repository: explanationRepository,
    source_narrative_repository: narrativeRepository,
    source_reasoning_graph_repository: graphRepository,
    source_confidence_risk_repository: confidenceRiskRepository,
    validation_evidence: freezeArray(evidence.filter(Boolean).sort()),
    lineage_references: freezeArray([report.lineage_reference, explanation?.replay.lineage_reference ?? "", narrative?.lineage_reference ?? "", graph?.lineage_reference ?? "", confidenceRisk?.lineage_reference ?? ""].filter(Boolean).sort()),
    replay_references: freezeArray([report.replay_reference, explanation?.replay.replay_reference ?? "", narrative?.replay_reference ?? "", graph?.replay_reference ?? "", confidenceRisk?.replay_reference ?? ""].filter(Boolean).sort()),
    integrity_verification: freezeArray([report.integrity_hash, ...rows.map((row) => row.integrity_hash)].filter(Boolean).sort()),
    append_only: true as const,
    read_only: true as const,
  };
  return Object.freeze({ ...ledgerBase, ledger_hash: computeExplainabilityCertificationLedgerHash(ledgerBase as Omit<ExplainabilityCertificationLedger, "ledger_hash">) });
}

export function validateExplanationCertification(ledger = runExplainabilityCertification()): ExplainabilityCertificationValidationResult {
  const report = ledger.reports[0];
  const contract_valid = report.test_results.find((row) => row.name === "Explainability contract valid")?.status === "PASS";
  const schema_complete = report.test_results.find((row) => row.name === "Explanation schema complete")?.status === "PASS";
  const narrative_valid = report.test_results.filter((row) => row.category === "narrative").every((row) => row.status === "PASS");
  const evidence_valid = report.test_results.filter((row) => row.category === "evidence").every((row) => row.status === "PASS");
  const policy_valid = report.test_results.filter((row) => row.category === "policy").every((row) => row.status === "PASS");
  const constitutional_valid = report.constitutional_verification;
  const authority_valid = report.authority_verification;
  const confidence_risk_valid = report.confidence_verification && report.risk_verification;
  const replay_valid = report.replay_verification;
  const integrity_valid = report.integrity_verification && computeExplainabilityCertificationLedgerHash(ledger) === ledger.ledger_hash;
  const tenant_isolated = report.tenant_isolation_status && ledger.tenant_id.startsWith("tenant:");
  const fail_closed = report.overall_status === "FAIL" ? report.failures.length > 0 : true;
  const advisory_only_enforced = report.advisory_only;
  const failures = unique([
    ...report.failures,
    ...(!contract_valid ? ["EXPLAINABILITY_CONTRACT_INVALID" as const] : []),
    ...(!schema_complete ? ["EXPLANATION_SCHEMA_INCOMPLETE" as const] : []),
    ...(!narrative_valid ? ["DECISION_NARRATIVE_NONDETERMINISTIC" as const] : []),
    ...(!evidence_valid ? ["EVIDENCE_CHAIN_INCOMPLETE" as const] : []),
    ...(!policy_valid ? ["POLICY_INFLUENCE_NONDETERMINISTIC" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_COMPLIANCE_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_APPROVALS_UNTRACEABLE" as const] : []),
    ...(!confidence_risk_valid ? ["CONFIDENCE_REASONING_UNREPRODUCIBLE" as const] : []),
    ...(!replay_valid ? ["REPLAY_NONDETERMINISTIC" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_EXPLANATION_LEAKAGE" as const] : []),
    ...(!advisory_only_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]).filter((failure) => failure !== "NON_CRITICAL_DOCUMENTATION_WARNING");
  const valid = failures.length === 0 && report.overall_status === "PASS";
  const source = { ledger_id: ledger.ledger_id, valid, contract_valid, schema_complete, narrative_valid, evidence_valid, policy_valid, constitutional_valid, authority_valid, confidence_risk_valid, replay_valid, integrity_valid, tenant_isolated, fail_closed, advisory_only_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("explainability-certification-validation", source) });
}

export function validateExplanationReplay(ledger = runExplainabilityCertification()): ExplainabilityCertificationReplayResult {
  return replayExplainabilityCertification(ledger);
}

export function replayExplainabilityCertification(ledger = runExplainabilityCertification()): ExplainabilityCertificationReplayResult {
  const reconstructed_hash = computeExplainabilityCertificationLedgerHash(ledger);
  const source = { replay_reference: ledger.reports[0]?.replay_reference ?? "", ledger_id: ledger.ledger_id, deterministic: Boolean(ledger.replay_references.length) && reconstructed_hash === ledger.ledger_hash, reconstructed_hash, original_hash: ledger.ledger_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("explainability-certification-replay", source) });
}

export function generateExplainabilityCertificationReport(input: ExplainabilityCertificationInput = {}): ExplainabilityCertificationReport {
  return runExplainabilityCertification(input).reports[0];
}

export function buildExplainabilityCertificationObservabilitySurface(ledger = runExplainabilityCertification()): ExplainabilityCertificationObservabilitySurface {
  const report = ledger.reports[0];
  return Object.freeze({ ledger_id: ledger.ledger_id, tenant_id: ledger.tenant_id, mission_id: ledger.mission_id, certification_count: ledger.reports.length, overall_status: report.overall_status, tests_passed: report.tests_passed, tests_failed: report.tests_failed, production_certification_ready: report.overall_status === "PASS", advisory_only: true, ledger_hash: ledger.ledger_hash });
}

export function getExplainabilityCertificationGateContract(): ExplainabilityCertificationGateContract {
  const ledger = runExplainabilityCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      gate_version: VERSION,
      principles: freezeArray(["deterministic-explanations", "immutable-explanation-history", "evidence-backed-reasoning", "governance-transparency", "constitutional-accountability", "authority-traceability", "replay-reproducibility", "operator-readability", "tenant-isolation", "fail-closed-certification"]),
      certification_states: states,
      certification_outcomes: outcomes,
      certification_categories: categories,
      pass_required_for_production: true,
      advisory_only: true,
    }),
    ledger,
    validation: validateExplanationCertification(ledger),
    replay: replayExplainabilityCertification(ledger),
    observability: buildExplainabilityCertificationObservabilitySurface(ledger),
  });
}
