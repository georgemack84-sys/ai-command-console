import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runFinalAutonomyCertification } from "@/services/final-autonomy-certification-gate";
import type {
  CompletionMatrixCategory,
  CompletionMatrixRecord,
  CompletionReadinessAssessment,
  ControlledAutonomyCompletionFailure,
  ControlledAutonomyCompletionInput,
  ControlledAutonomyCompletionObservabilitySurface,
  ControlledAutonomyCompletionReport,
  ControlledAutonomyCompletionScenario,
  ControlledAutonomyCompletionValidationResult,
  CompletionEvidenceRecord,
} from "@/types/controlled-autonomy-completion-gate";

const NOW = "2026-07-01T12:00:00.000Z";
const VERSION = "controlled-autonomy-completion-gate/v8L" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:controlled-autonomy-completion:8l:primary";
const LINEAGE_REFERENCE = "lineage:controlled-autonomy-completion:8l:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const matrixCategories: readonly CompletionMatrixCategory[] = [
  "Controlled Autonomy",
  "Planning Engine",
  "Execution Orchestration",
  "Delegation Intelligence",
  "Runtime Supervision",
  "Boundary Enforcement",
  "Governance Integration",
  "Constitutional Compliance",
  "Authority Enforcement",
  "Replay Determinism",
  "Replay Reproducibility",
  "Integrity Verification",
  "Visibility",
  "Query Services",
  "Replay Viewer",
  "Planning Graph",
  "Delegation Graph",
  "Supervision Timeline",
  "Tamper Detection",
  "Certification Suite",
  "Tenant Isolation",
];

const failureByScenario: Partial<Record<ControlledAutonomyCompletionScenario, ControlledAutonomyCompletionFailure>> = Object.freeze({
  MINOR_DOCUMENTATION_GAP: "MINOR_DOCUMENTATION_GAP",
  MINOR_UI_IMPROVEMENT: "MINOR_UI_IMPROVEMENT",
  PERFORMANCE_OPTIMIZATION: "PERFORMANCE_OPTIMIZATION_REMAINING",
  GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
  GOVERNANCE_POLICY_IGNORED: "GOVERNANCE_POLICIES_IGNORED",
  UNAUTHORIZED_GOVERNANCE_MODIFICATION: "UNAUTHORIZED_GOVERNANCE_MODIFICATION",
  GOVERNANCE_REPLAY_MISMATCH: "GOVERNANCE_REPLAY_MISMATCH",
  CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
  CONSTITUTIONAL_CONSTRAINT_IGNORED: "CONSTITUTIONAL_CONSTRAINT_IGNORED",
  CONSTITUTIONAL_OVERRIDE_ATTEMPTED: "CONSTITUTIONAL_OVERRIDE_ATTEMPTED",
  CONSTITUTIONAL_REPLAY_MISMATCH: "CONSTITUTIONAL_REPLAY_MISMATCH",
  AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_OCCURRED",
  PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_DETECTED",
  UNAUTHORIZED_DELEGATION: "UNAUTHORIZED_DELEGATION",
  UNAUTHORIZED_EXECUTION: "UNAUTHORIZED_EXECUTION",
  NONDETERMINISTIC_PLANNING: "NONDETERMINISTIC_PLANNING_DETECTED",
  INCONSISTENT_PLANNING_RESULTS: "INCONSISTENT_PLANNING_RESULTS",
  PLANNING_REPLAY_MISMATCH: "PLANNING_REPLAY_MISMATCH",
  PLANNING_GRAPH_CORRUPTION: "PLANNING_GRAPH_CORRUPTION",
  HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DISCOVERED",
  EXECUTION_OUTSIDE_GOVERNANCE: "EXECUTION_OUTSIDE_GOVERNANCE",
  UNAUTHORIZED_WORKFLOW_EXECUTION: "UNAUTHORIZED_WORKFLOW_EXECUTION",
  ROLLBACK_FAILURE: "ROLLBACK_FAILURE",
  RUNTIME_SUPERVISION_FAILURE: "RUNTIME_SUPERVISION_FAILURE",
  DRIFT_UNDETECTED: "DRIFT_UNDETECTED",
  POLICY_VIOLATION_UNDETECTED: "POLICY_VIOLATION_UNDETECTED",
  INTERVENTION_UNAVAILABLE: "INTERVENTION_UNAVAILABLE",
  REPLAY_MISMATCH: "REPLAY_MISMATCH_EXISTS",
  INCOMPLETE_REPLAY: "INCOMPLETE_REPLAY",
  REPLAY_CORRUPTION: "REPLAY_CORRUPTION",
  REPLAY_NOT_REPRODUCIBLE: "REPLAY_NOT_REPRODUCIBLE",
  INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  TAMPERING_DETECTED: "TAMPERING_DETECTED",
  HASH_MISMATCH: "HASH_MISMATCH",
  CORRUPTED_AUTONOMY_HISTORY: "CORRUPTED_AUTONOMY_HISTORY",
  OPERATOR_VISIBILITY_INCOMPLETE: "OPERATOR_VISIBILITY_INCOMPLETE",
  HIDDEN_PLANNING: "HIDDEN_PLANNING",
  HIDDEN_DELEGATION: "HIDDEN_DELEGATION",
  HIDDEN_SUPERVISION: "HIDDEN_SUPERVISION",
  HIDDEN_GOVERNANCE_DECISIONS: "HIDDEN_GOVERNANCE_DECISIONS",
  TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
  CROSS_TENANT_EXECUTION: "CROSS_TENANT_EXECUTION",
  CROSS_TENANT_REPLAY: "CROSS_TENANT_REPLAY",
  CROSS_TENANT_VISIBILITY: "CROSS_TENANT_VISIBILITY",
  CERTIFICATION_SUITE_FAILS: "CERTIFICATION_SUITE_FAILED",
  DETERMINISTIC_CERTIFICATION_FAILS: "DETERMINISTIC_CERTIFICATION_FAILED",
  GOVERNANCE_CERTIFICATION_FAILS: "GOVERNANCE_CERTIFICATION_FAILED",
  REPLAY_CERTIFICATION_FAILS: "REPLAY_CERTIFICATION_FAILED",
  INTEGRITY_CERTIFICATION_FAILS: "INTEGRITY_CERTIFICATION_FAILED",
});

const conditionalFailures: readonly ControlledAutonomyCompletionFailure[] = ["MINOR_DOCUMENTATION_GAP", "MINOR_UI_IMPROVEMENT", "PERFORMANCE_OPTIMIZATION_REMAINING"];

function categoryFor(failure: ControlledAutonomyCompletionFailure | null): CompletionMatrixCategory | null {
  if (!failure) return null;
  if (failure.includes("GOVERNANCE")) return "Governance Integration";
  if (failure.includes("CONSTITUTIONAL")) return "Constitutional Compliance";
  if (failure.includes("AUTHORITY") || failure.includes("PRIVILEGE") || failure.includes("DELEGATION")) return "Authority Enforcement";
  if (failure.includes("PLANNING")) return "Planning Engine";
  if (failure.includes("EXECUTION") || failure.includes("WORKFLOW") || failure.includes("ROLLBACK")) return "Execution Orchestration";
  if (failure.includes("SUPERVISION") || failure.includes("DRIFT") || failure.includes("INTERVENTION")) return "Runtime Supervision";
  if (failure.includes("REPLAY")) return "Replay Reproducibility";
  if (failure.includes("INTEGRITY") || failure.includes("TAMPERING") || failure.includes("HASH") || failure.includes("CORRUPTED")) return "Integrity Verification";
  if (failure.includes("VISIBILITY") || failure.includes("HIDDEN")) return "Visibility";
  if (failure.includes("TENANT") || failure.includes("CROSS_TENANT")) return "Tenant Isolation";
  if (failure.includes("CERTIFICATION")) return "Certification Suite";
  return "Controlled Autonomy";
}

function matrixRecord(category: CompletionMatrixCategory, scenario: ControlledAutonomyCompletionScenario, refs: readonly string[]): CompletionMatrixRecord {
  const failure = failureByScenario[scenario] ?? null;
  const hit = categoryFor(failure) === category;
  const source = {
    matrix_id: id("CAGM", "completion-matrix-id", category),
    category,
    validation: hit ? "FAIL" as const : "PASS" as const,
    score: hit ? 0 : 1,
    failure_reason: hit ? failure : null,
    evidence_refs: freezeArray(refs),
  };
  return Object.freeze({ ...source, matrix_hash: hashValue("controlled-autonomy-completion-matrix", source) });
}

function evidence(sourceName: string, reference: string): CompletionEvidenceRecord {
  const source = {
    evidence_id: id("CAGE", "completion-evidence-id", sourceName),
    source: sourceName,
    evidence_reference: reference,
    replay_reference: `${REPLAY_REFERENCE}:${sourceName}`,
    lineage_reference: `${LINEAGE_REFERENCE}:${sourceName}`,
    integrity_hash: hashValue("completion-evidence-integrity", { sourceName, reference }),
    immutable: true,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("controlled-autonomy-completion-evidence", source) });
}

function readiness(state: ControlledAutonomyCompletionReport["completion_state"]): CompletionReadinessAssessment {
  const allowed = state === "PASS"
    ? ["production autonomy", "phase 9 progression", "certified autonomous workflows"]
    : ["development", "testing", "validation", "certification refinement", "documentation completion", "UI improvements"];
  const prohibited = state === "PASS" ? [] : ["production autonomy", "unrestricted execution", "customer deployment", "autonomous production workflows"];
  const source = {
    assessment_id: id("CARA", "completion-readiness-assessment-id", state),
    production_ready: state === "PASS",
    phase_9_authorized: state === "PASS",
    allowed_operations: freezeArray(allowed),
    prohibited_operations: freezeArray(prohibited),
  };
  return Object.freeze({ ...source, assessment_hash: hashValue("controlled-autonomy-readiness-assessment", source) });
}

function riskFor(failure: ControlledAutonomyCompletionFailure): string {
  if (conditionalFailures.includes(failure)) return `LOW:${failure}`;
  if (["CROSS_TENANT_EXECUTION", "CROSS_TENANT_REPLAY", "CROSS_TENANT_VISIBILITY", "UNAUTHORIZED_EXECUTION", "PRIVILEGE_ESCALATION_DETECTED"].includes(failure)) return `CRITICAL:${failure}`;
  return `HIGH:${failure}`;
}

export function computeControlledAutonomyCompletionReportHash(report: Omit<ControlledAutonomyCompletionReport, "report_hash"> | ControlledAutonomyCompletionReport): string {
  const { report_hash: _hash, ...source } = report as ControlledAutonomyCompletionReport;
  return hashValue("controlled-autonomy-completion-report", source);
}

export function runControlledAutonomyCompletionGate(input: ControlledAutonomyCompletionInput = {}): ControlledAutonomyCompletionReport {
  const scenario = input.scenario ?? "BASELINE";
  const finalCertification = runFinalAutonomyCertification();
  const evidenceRecords = freezeArray([evidence("final-autonomy-certification-gate", finalCertification.report_hash)]);
  const refs = evidenceRecords.map((item) => item.evidence_hash);
  const matrix = freezeArray(matrixCategories.map((category) => matrixRecord(category, scenario, refs)));
  const matrixFailures = matrix.map((item) => item.failure_reason).filter((item): item is ControlledAutonomyCompletionFailure => Boolean(item));
  const scenarioFailure = failureByScenario[scenario] ?? null;
  const failures = uniq([...matrixFailures, ...(scenarioFailure && !matrixFailures.includes(scenarioFailure) ? [scenarioFailure] : [])]);
  const onlyConditional = failures.length > 0 && failures.every((failure) => conditionalFailures.includes(failure));
  const state: ControlledAutonomyCompletionReport["completion_state"] = failures.length === 0 && finalCertification.overall_state === "PASS" ? "PASS" : onlyConditional ? "CONDITIONAL_PASS" : "FAIL";
  const assessment = readiness(state);
  const score = Number((matrix.filter((item) => item.validation === "PASS").length / matrix.length).toFixed(4));
  const integrity_hash = hashValue("controlled-autonomy-completion-integrity", { final: finalCertification.report_hash, matrix: matrix.map((item) => item.matrix_hash), evidence: evidenceRecords.map((item) => item.evidence_hash), state });
  const base = {
    completion_id: id("CAG", "controlled-autonomy-completion-id", scenario),
    phase: "8L" as const,
    completion_version: VERSION,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    completion_state: state,
    production_ready: state === "PASS",
    phase_9_authorized: state === "PASS",
    final_autonomy_certification: finalCertification,
    validation_matrix: matrix,
    completion_score: state === "PASS" ? 1 : score,
    detected_failures: failures,
    detected_risks: freezeArray(failures.map(riskFor)),
    recommendations: failures.length === 0 ? freezeArray(["Controlled Autonomy production readiness certified."]) : freezeArray(failures.map((failure) => `Resolve ${failure} before production readiness PASS.`)),
    operator_required: state !== "PASS",
    production_readiness_assessment: assessment,
    completion_evidence: evidenceRecords,
    deliverables: freezeArray(["Controlled Autonomy Completion Report", "Production Readiness Assessment", "Phase 8 Certification Record", "Integrated Autonomy Validation Matrix", "Governance Compliance Report", "Constitutional Compliance Report", "Authority Enforcement Report", "Deterministic Replay Verification Report", "Integrity Verification Report", "Operator Visibility Assessment", "Tenant Isolation Assessment", "Production Certification Package"]),
    completion_timestamp: NOW,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    integrity_hash,
  };
  return Object.freeze({ ...base, report_hash: computeControlledAutonomyCompletionReportHash(base as Omit<ControlledAutonomyCompletionReport, "report_hash">) });
}

export function validateControlledAutonomyCompletionReport(report?: ControlledAutonomyCompletionReport): ControlledAutonomyCompletionValidationResult {
  if (!report) {
    const failures = freezeArray<ControlledAutonomyCompletionFailure>(["CERTIFICATION_SUITE_FAILED"]);
    const source = { completion_id: null, valid: false, report_hash_valid: false, evidence_complete: false, phase_9_authorized: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("controlled-autonomy-completion-validation", source) });
  }
  const report_hash_valid = computeControlledAutonomyCompletionReportHash(report) === report.report_hash;
  const evidence_complete = report.completion_evidence.every((item) => item.evidence_reference && item.replay_reference && item.lineage_reference && item.integrity_hash && item.immutable);
  const valid = report.completion_state === "PASS" && report.production_ready && report.phase_9_authorized && report.detected_failures.length === 0 && report_hash_valid && evidence_complete;
  const source = { completion_id: report.completion_id, valid, report_hash_valid, evidence_complete, phase_9_authorized: valid, failures: report.detected_failures };
  return Object.freeze({ ...source, validation_hash: hashValue("controlled-autonomy-completion-validation", source) });
}

export function buildControlledAutonomyCompletionObservabilitySurface(report = runControlledAutonomyCompletionGate()): ControlledAutonomyCompletionObservabilitySurface {
  return Object.freeze({
    completion_id: report.completion_id,
    completion_state: report.completion_state,
    completion_score: report.completion_score,
    matrix_items: report.validation_matrix.length,
    failed_items: report.validation_matrix.filter((item) => item.validation === "FAIL").length,
    failures: report.detected_failures,
    risks: report.detected_risks,
    production_ready: report.production_ready,
    phase_9_authorized: report.phase_9_authorized,
    operator_required: report.operator_required,
    report_hash: report.report_hash,
  });
}

export function getControlledAutonomyCompletionContract() {
  const report = runControlledAutonomyCompletionGate();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "explainable", "replayable", "secure", "constitutionally-compliant", "governance-enforced", "tenant-isolated", "operator-transparent", "fail-closed", "production-ready-pass-only"]),
      completion_version: VERSION,
      decision_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      validation_matrix: freezeArray(matrixCategories),
      phase_9_authority: "PASS-only",
    }),
    report,
    validation: validateControlledAutonomyCompletionReport(report),
    observability: buildControlledAutonomyCompletionObservabilitySurface(report),
  });
}
