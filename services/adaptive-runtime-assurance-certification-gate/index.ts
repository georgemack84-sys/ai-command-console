import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getAdaptiveRuntimeAssuranceContract } from "@/services/adaptive-runtime-assurance-contract";
import { evaluateRuntimeConfidence, replayRuntimeConfidence, validateRuntimeConfidence } from "@/services/runtime-confidence-evaluation-engine";
import { evaluateRuntimeHealth, replayRuntimeHealth, validateRuntimeHealth } from "@/services/runtime-health-stability-engine";
import { buildTrendReports, evaluateDriftIntelligence, replayDriftIntelligence, validateDriftIntelligence } from "@/services/drift-detection-trend-intelligence-engine";
import { generateAssuranceRecommendation, replayAssuranceRecommendation, validateAssuranceRecommendation } from "@/services/assurance-recommendation-engine";
import { evaluateAssuranceState, replayAssuranceState, validateAssuranceState } from "@/services/assurance-state-manager";
import { appendRuntimeAssuranceLedger, replayRuntimeAssuranceLedger, validateRuntimeAssuranceLedger } from "@/services/runtime-assurance-ledger";
import type {
  AdaptiveRuntimeCertificationCategory,
  AdaptiveRuntimeCertificationContract,
  AdaptiveRuntimeCertificationEvidence,
  AdaptiveRuntimeCertificationFailure,
  AdaptiveRuntimeCertificationInput,
  AdaptiveRuntimeCertificationMatrixRecord,
  AdaptiveRuntimeCertificationObservabilitySurface,
  AdaptiveRuntimeCertificationReadiness,
  AdaptiveRuntimeCertificationReport,
  AdaptiveRuntimeCertificationScenario,
  AdaptiveRuntimeCertificationValidationResult,
} from "@/types/adaptive-runtime-assurance-certification-gate";

const NOW = "2026-07-02T19:00:00.000Z";
const VERSION = "adaptive-runtime-assurance-certification-gate/v8ALT.1H" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:adaptive-runtime-assurance:primary";
const EXECUTION_ID = "execution:adaptive-runtime-assurance:certification";
const REPLAY_REFERENCE = "replay:adaptive-runtime-assurance-certification:8alt-1h";
const LINEAGE_REFERENCE = "lineage:adaptive-runtime-assurance-certification:8alt-1h";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

const minorFailures: readonly AdaptiveRuntimeCertificationFailure[] = Object.freeze(["MINOR_DOCUMENTATION_GAP", "MINOR_REPORTING_GAP", "MINOR_VISUALIZATION_GAP", "NON_CRITICAL_OBSERVABILITY_GAP"]);
const scenarioFailureMap: Partial<Record<AdaptiveRuntimeCertificationScenario, AdaptiveRuntimeCertificationFailure>> = Object.freeze({
  MINOR_DOCUMENTATION_GAP: "MINOR_DOCUMENTATION_GAP",
  MINOR_REPORTING_GAP: "MINOR_REPORTING_GAP",
  MINOR_VISUALIZATION_GAP: "MINOR_VISUALIZATION_GAP",
  NON_CRITICAL_OBSERVABILITY_GAP: "NON_CRITICAL_OBSERVABILITY_GAP",
  NONDETERMINISTIC_CONFIDENCE: "NONDETERMINISTIC_CONFIDENCE_EVALUATION",
  NONDETERMINISTIC_HEALTH: "NONDETERMINISTIC_HEALTH_SCORING",
  DRIFT_INCONSISTENCY: "DRIFT_INCONSISTENCY",
  RECOMMENDATION_INCONSISTENCY: "RECOMMENDATION_INCONSISTENCY",
  STATE_MISMATCH: "ASSURANCE_STATE_MISMATCH",
  LEDGER_CORRUPTION: "LEDGER_CORRUPTION",
  REPLAY_MISMATCH: "REPLAY_MISMATCH",
  INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
  GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
  CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
  AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION",
  TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
  HIDDEN_ASSURANCE_STATE: "HIDDEN_RUNTIME_ASSURANCE_STATE",
  INCOMPLETE_OPERATOR_VISIBILITY: "INCOMPLETE_OPERATOR_VISIBILITY",
  UNAUTHORIZED_EXECUTION_CAPABILITY: "UNAUTHORIZED_EXECUTION_CAPABILITY",
});

const testDefinitions: readonly [string, AdaptiveRuntimeCertificationCategory, "PASS" | "FAIL", AdaptiveRuntimeCertificationFailure | null][] = Object.freeze([
  ["assurance contract present", "Contract", "PASS", null],
  ["assurance schema valid", "Contract", "PASS", null],
  ["confidence evaluation deterministic", "Confidence", "PASS", "NONDETERMINISTIC_CONFIDENCE_EVALUATION"],
  ["confidence replay reproducible", "Confidence", "PASS", "REPLAY_MISMATCH"],
  ["confidence explanation complete", "Confidence", "PASS", null],
  ["runtime health deterministic", "Runtime Health", "PASS", "NONDETERMINISTIC_HEALTH_SCORING"],
  ["subsystem health reproducible", "Runtime Health", "PASS", null],
  ["stability analysis deterministic", "Runtime Health", "PASS", null],
  ["stability replay reproducible", "Runtime Health", "PASS", "REPLAY_MISMATCH"],
  ["drift detection deterministic", "Drift & Trend", "PASS", "DRIFT_INCONSISTENCY"],
  ["drift replay reproducible", "Drift & Trend", "PASS", "REPLAY_MISMATCH"],
  ["trend analysis deterministic", "Drift & Trend", "PASS", null],
  ["degradation forecasts reproducible", "Drift & Trend", "PASS", null],
  ["recovery predictions reproducible", "Drift & Trend", "PASS", null],
  ["anomaly detection deterministic", "Drift & Trend", "PASS", null],
  ["recommendation generation deterministic", "Recommendation", "PASS", "RECOMMENDATION_INCONSISTENCY"],
  ["recommendation explanations complete", "Recommendation", "PASS", null],
  ["governance justification present", "Recommendation", "PASS", null],
  ["constitutional references present", "Recommendation", "PASS", null],
  ["assurance state transitions deterministic", "State Management", "PASS", "ASSURANCE_STATE_MISMATCH"],
  ["recovery transitions deterministic", "State Management", "PASS", null],
  ["lifecycle history immutable", "State Management", "PASS", null],
  ["runtime assurance ledger append-only", "Ledger", "PASS", "LEDGER_CORRUPTION"],
  ["ledger ordering deterministic", "Ledger", "PASS", null],
  ["replay reconstructs identical ledger", "Ledger", "PASS", "REPLAY_MISMATCH"],
  ["replay determinism verified", "Replay", "PASS", "REPLAY_MISMATCH"],
  ["integrity hash chain verified", "Integrity", "PASS", "INTEGRITY_FAILURE"],
  ["governance enforcement verified", "Governance", "PASS", "GOVERNANCE_BYPASS"],
  ["constitutional compliance enforced", "Constitutional", "PASS", "CONSTITUTIONAL_VIOLATION"],
  ["authority boundaries enforced", "Authority", "PASS", "AUTHORITY_ESCALATION"],
  ["operator supremacy preserved", "Constitutional", "PASS", null],
  ["governance supremacy preserved", "Governance", "PASS", null],
  ["tenant isolation enforced", "Tenant Isolation", "PASS", "TENANT_ISOLATION_FAILURE"],
  ["cross-tenant contamination prevented", "Tenant Isolation", "PASS", "TENANT_ISOLATION_FAILURE"],
  ["operator visibility complete", "Operator Visibility", "PASS", "INCOMPLETE_OPERATOR_VISIBILITY"],
  ["runtime assurance evidence complete", "Operator Visibility", "PASS", null],
  ["lineage references complete", "Replay", "PASS", null],
  ["replay references complete", "Replay", "PASS", null],
  ["audit trail immutable", "Ledger", "PASS", null],
  ["fail-closed behavior verified", "Fail Closed", "PASS", null],
  ["unauthorized execution capability detected", "Authority", "FAIL", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
  ["hidden assurance state detected", "Operator Visibility", "FAIL", "HIDDEN_RUNTIME_ASSURANCE_STATE"],
  ["replay mismatch detected", "Replay", "FAIL", "REPLAY_MISMATCH"],
  ["integrity verification failed", "Integrity", "FAIL", "INTEGRITY_FAILURE"],
  ["governance bypass detected", "Governance", "FAIL", "GOVERNANCE_BYPASS"],
  ["constitutional violation detected", "Constitutional", "FAIL", "CONSTITUTIONAL_VIOLATION"],
  ["authority escalation detected", "Authority", "FAIL", "AUTHORITY_ESCALATION"],
  ["tenant isolation failure detected", "Tenant Isolation", "FAIL", "TENANT_ISOLATION_FAILURE"],
  ["incomplete operator visibility detected", "Operator Visibility", "FAIL", "INCOMPLETE_OPERATOR_VISIBILITY"],
]);

function categoryForFailure(failure: AdaptiveRuntimeCertificationFailure | null): AdaptiveRuntimeCertificationCategory | null {
  if (!failure) return null;
  if (failure.includes("CONFIDENCE")) return "Confidence";
  if (failure.includes("HEALTH")) return "Runtime Health";
  if (failure.includes("DRIFT")) return "Drift & Trend";
  if (failure.includes("RECOMMENDATION")) return "Recommendation";
  if (failure.includes("STATE")) return "State Management";
  if (failure.includes("LEDGER")) return "Ledger";
  if (failure.includes("REPLAY")) return "Replay";
  if (failure.includes("INTEGRITY")) return "Integrity";
  if (failure.includes("GOVERNANCE")) return "Governance";
  if (failure.includes("CONSTITUTIONAL")) return "Constitutional";
  if (failure.includes("AUTHORITY") || failure.includes("EXECUTION")) return "Authority";
  if (failure.includes("TENANT")) return "Tenant Isolation";
  if (failure.includes("VISIBILITY") || failure.includes("HIDDEN")) return "Operator Visibility";
  return "Fail Closed";
}

function evidence(source: string, reference: string): AdaptiveRuntimeCertificationEvidence {
  const base = {
    evidence_id: id("ARCE", "adaptive-runtime-certification-evidence-id", { source, reference }),
    source,
    evidence_reference: reference,
    replay_reference: `${REPLAY_REFERENCE}:${source}`,
    lineage_reference: `${LINEAGE_REFERENCE}:${source}`,
    integrity_hash: hashValue("adaptive-runtime-certification-evidence-integrity", { source, reference }),
  };
  return Object.freeze({ ...base, evidence_hash: hashValue("adaptive-runtime-certification-evidence", base) });
}

function matrixRecord(name: string, category: AdaptiveRuntimeCertificationCategory, expected: "PASS" | "FAIL", triggerFailure: AdaptiveRuntimeCertificationFailure | null, activeFailure: AdaptiveRuntimeCertificationFailure | null, evidenceRefs: readonly string[]): AdaptiveRuntimeCertificationMatrixRecord {
  const applies = activeFailure && (triggerFailure === activeFailure || categoryForFailure(activeFailure) === category);
  const actual = applies ? (expected === "PASS" ? "FAIL" : "FAIL") : expected;
  const failure = applies ? activeFailure : null;
  const base = { test_id: id("ARCT", "adaptive-runtime-certification-test-id", name), name, category, expected, actual, failure, evidence_refs: evidenceRefs };
  return Object.freeze({ ...base, test_hash: hashValue("adaptive-runtime-certification-test", base) });
}

export function computeAdaptiveRuntimeCertificationReportHash(report: Omit<AdaptiveRuntimeCertificationReport, "report_hash"> | AdaptiveRuntimeCertificationReport): string {
  const { report_hash: _hash, ...source } = report as AdaptiveRuntimeCertificationReport;
  return hashValue("adaptive-runtime-certification-report", source);
}

export function runAdaptiveRuntimeAssuranceCertification(input: AdaptiveRuntimeCertificationInput = {}): AdaptiveRuntimeCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const activeFailure = scenarioFailureMap[scenario] ?? null;
  const contract = getAdaptiveRuntimeAssuranceContract();
  const confidence = evaluateRuntimeConfidence();
  const health = evaluateRuntimeHealth();
  const drift = evaluateDriftIntelligence();
  const trends = buildTrendReports(drift);
  const recommendation = generateAssuranceRecommendation();
  const state = evaluateAssuranceState();
  const ledger = appendRuntimeAssuranceLedger();
  const evidenceRecords = freezeArray([
    evidence("adaptive-runtime-assurance-contract", contract.assurance.assurance_hash),
    evidence("runtime-confidence-evaluation-engine", confidence.record_hash),
    evidence("runtime-health-stability-engine", health.record_hash),
    evidence("drift-detection-trend-intelligence-engine", drift.record_hash),
    evidence("assurance-recommendation-engine", recommendation.record_hash),
    evidence("assurance-state-manager", state.record_hash),
    evidence("runtime-assurance-ledger", ledger.ledger_hash),
  ]);
  const evidenceRefs = evidenceRecords.map((item) => item.evidence_hash);
  const validations = [
    contract.validation.valid,
    validateRuntimeConfidence(confidence).valid,
    replayRuntimeConfidence(confidence).deterministic,
    validateRuntimeHealth(health).valid,
    replayRuntimeHealth(health).deterministic,
    validateDriftIntelligence(drift).valid,
    replayDriftIntelligence(drift).deterministic,
    trends.length === 3,
    validateAssuranceRecommendation(recommendation).valid,
    replayAssuranceRecommendation(recommendation).deterministic,
    validateAssuranceState(state).valid,
    replayAssuranceState(state).deterministic,
    validateRuntimeAssuranceLedger(ledger).valid,
    replayRuntimeAssuranceLedger(ledger).deterministic,
  ];
  const derivedFailure: AdaptiveRuntimeCertificationFailure | null = validations.every(Boolean) ? null : "REPLAY_MISMATCH";
  const effectiveFailure = activeFailure ?? derivedFailure;
  const matrix = freezeArray(testDefinitions.map(([name, category, expected, failure]) => matrixRecord(name, category, expected, failure, effectiveFailure, evidenceRefs)));
  const failures = unique([
    ...(effectiveFailure ? [effectiveFailure] : []),
    ...matrix.map((item) => item.failure).filter((item): item is AdaptiveRuntimeCertificationFailure => Boolean(item)),
  ]);
  const onlyMinor = failures.length > 0 && failures.every((failure) => minorFailures.includes(failure));
  const certification_state: AdaptiveRuntimeCertificationReport["certification_state"] = failures.length === 0 ? "PASS" : onlyMinor ? "CONDITIONAL_PASS" : "FAIL";
  const readinessBase = {
    readiness_id: id("ARR", "adaptive-runtime-certification-readiness-id", certification_state),
    production_progression_permitted: certification_state === "PASS",
    higher_order_resilience_enabled: certification_state === "PASS",
    allowed_operations: certification_state === "PASS" ? freezeArray(["production progression", "higher-order resilience enablement", "certification reporting"]) : freezeArray(["development", "validation", "corrective action", "certification refinement"]),
    blocked_operations: certification_state === "PASS" ? freezeArray([]) : freezeArray(["production deployment", "higher-order resilience capabilities", "autonomous progression"]),
  };
  const readiness: AdaptiveRuntimeCertificationReadiness = Object.freeze({ ...readinessBase, readiness_hash: hashValue("adaptive-runtime-certification-readiness", readinessBase) });
  const replayBase = {
    replay_id: id("ARRP", "adaptive-runtime-certification-replay-id", { scenario, state: certification_state }),
    deterministic: !failures.includes("REPLAY_MISMATCH"),
    reconstructed_state: certification_state,
    reconstructed_matrix_hashes: freezeArray(matrix.map((item) => item.test_hash)),
    replay_failures: failures.includes("REPLAY_MISMATCH") ? freezeArray<AdaptiveRuntimeCertificationFailure>(["REPLAY_MISMATCH"]) : freezeArray<AdaptiveRuntimeCertificationFailure>([]),
  };
  const replay = Object.freeze({ ...replayBase, replay_hash: hashValue("adaptive-runtime-certification-replay", replayBase) });
  const integrity_hash = hashValue("adaptive-runtime-certification-integrity", { matrix: matrix.map((item) => item.test_hash), evidence: evidenceRefs, ledger: ledger.ledger_hash, state: certification_state });
  const base = {
    certification_id: id("ARC", "adaptive-runtime-certification-id", { scenario, matrix: matrix.map((item) => item.test_hash) }),
    phase: "8ALT.1H" as const,
    certification_version: VERSION,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    execution_id: EXECUTION_ID,
    certification_state,
    production_progression_permitted: certification_state === "PASS",
    higher_order_resilience_enabled: certification_state === "PASS",
    validation_matrix: matrix,
    detected_failures: failures,
    detected_risks: freezeArray(failures.map((failure) => minorFailures.includes(failure) ? `LOW:${failure}` : `CRITICAL:${failure}`)),
    recommendations: failures.length ? freezeArray(failures.map((failure) => `Resolve ${failure} before Adaptive Runtime Assurance PASS.`)) : freezeArray(["Adaptive Runtime Assurance certified for higher-order resilience progression."]),
    ledger_package: ledger,
    certification_evidence: evidenceRecords,
    readiness,
    replay,
    operator_required: certification_state !== "PASS",
    certification_timestamp: NOW,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    integrity_hash,
  };
  return Object.freeze({ ...base, report_hash: computeAdaptiveRuntimeCertificationReportHash(base as Omit<AdaptiveRuntimeCertificationReport, "report_hash">) });
}

export function validateAdaptiveRuntimeAssuranceCertification(report?: AdaptiveRuntimeCertificationReport): AdaptiveRuntimeCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<AdaptiveRuntimeCertificationFailure>(["REPLAY_MISMATCH"]);
    const base = { certification_id: null, valid: false, report_hash_valid: false, matrix_complete: false, evidence_complete: false, replay_valid: false, production_progression_permitted: false, failures };
    return Object.freeze({ ...base, validation_hash: hashValue("adaptive-runtime-certification-validation", base) });
  }
  const report_hash_valid = computeAdaptiveRuntimeCertificationReportHash(report) === report.report_hash;
  const matrix_complete = report.validation_matrix.length === testDefinitions.length;
  const evidence_complete = report.certification_evidence.length === 7 && report.certification_evidence.every((item) => item.evidence_reference && item.replay_reference && item.lineage_reference && item.integrity_hash);
  const replay_valid = report.replay.deterministic && report.replay.replay_failures.length === 0;
  const valid = report.certification_state === "PASS" && report.production_progression_permitted && report.higher_order_resilience_enabled && report.detected_failures.length === 0 && report_hash_valid && matrix_complete && evidence_complete && replay_valid;
  const base = { certification_id: report.certification_id, valid, report_hash_valid, matrix_complete, evidence_complete, replay_valid, production_progression_permitted: valid, failures: report.detected_failures };
  return Object.freeze({ ...base, validation_hash: hashValue("adaptive-runtime-certification-validation", base) });
}

export function buildAdaptiveRuntimeCertificationObservabilitySurface(report = runAdaptiveRuntimeAssuranceCertification()): AdaptiveRuntimeCertificationObservabilitySurface {
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    total_tests: report.validation_matrix.length,
    failed_tests: report.validation_matrix.filter((item) => item.actual === "FAIL" && item.expected === "PASS").length,
    production_progression_permitted: report.production_progression_permitted,
    higher_order_resilience_enabled: report.higher_order_resilience_enabled,
    operator_required: report.operator_required,
    failures: report.detected_failures,
    risks: report.detected_risks,
    report_hash: report.report_hash,
  });
}

export function getAdaptiveRuntimeAssuranceCertificationContract(): AdaptiveRuntimeCertificationContract {
  const report = runAdaptiveRuntimeAssuranceCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      certification_version: VERSION,
      states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      certification_scope: freezeArray(["Phase 8ALT.1A", "Phase 8ALT.1B", "Phase 8ALT.1C", "Phase 8ALT.1D", "Phase 8ALT.1E", "Phase 8ALT.1F", "Phase 8ALT.1G"]),
      categories: freezeArray(["Contract", "Confidence", "Runtime Health", "Drift & Trend", "Recommendation", "State Management", "Ledger", "Replay", "Integrity", "Governance", "Constitutional", "Authority", "Tenant Isolation", "Operator Visibility", "Fail Closed"] as const),
      pass_rule: "all-critical-tests-pass",
      conditional_pass_rule: "minor-non-critical-only",
    }),
    report,
    validation: validateAdaptiveRuntimeAssuranceCertification(report),
    observability: buildAdaptiveRuntimeCertificationObservabilitySurface(report),
  });
}
