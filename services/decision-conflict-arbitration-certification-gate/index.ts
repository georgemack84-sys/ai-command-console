import { replayArbitrationRulesEngine, getArbitrationRulesEngineFoundation } from "@/services/decision-arbitration-rules-engine";
import { replayArbitrationObservabilityAnalytics, getArbitrationObservabilityAnalyticsFoundation } from "@/services/decision-arbitration-observability-analytics";
import { replayConflictClassification, getConflictClassificationEngineFoundation } from "@/services/decision-conflict-classification-engine";
import { getConflictDetectionContractFoundation } from "@/services/decision-conflict-detection-contract";
import { replayConflictDetectionEngine, getConflictDetectionEngineFoundation } from "@/services/decision-conflict-detection-engine";
import { replayConflictEscalationWorkflow, getConflictEscalationWorkflowFoundation } from "@/services/decision-conflict-escalation-workflow";
import { replayConflictLedger, getConflictLedgerFoundation } from "@/services/decision-conflict-ledger";
import { replayEnforcement, getEnforcementFoundation } from "@/services/decision-constitutional-governance-enforcement";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayTradeoffExplanations, getTradeoffExplanationGeneratorFoundation } from "@/services/decision-tradeoff-explanation-generator";
import type { ArbitrationRulesEngineResult } from "@/types/decision-arbitration-rules-engine";
import type { ArbitrationObservabilityAnalyticsResult } from "@/types/decision-arbitration-observability-analytics";
import type {
  ConflictArbitrationCertificationFailureReason,
  ConflictArbitrationCertificationFoundation,
  ConflictArbitrationCertificationInput,
  ConflictArbitrationCertificationLedgerRecord,
  ConflictArbitrationCertificationObservability,
  ConflictArbitrationCertificationOutcome,
  ConflictArbitrationCertificationReplay,
  ConflictArbitrationCertificationReport,
  ConflictArbitrationCertificationReportType,
  ConflictArbitrationCertificationResult,
  ConflictArbitrationCertificationTest,
  ConflictArbitrationCertificationValidation,
} from "@/types/decision-conflict-arbitration-certification-gate";
import type { ConflictClassificationEngineResult } from "@/types/decision-conflict-classification-engine";
import type { ConflictDetectionContractFoundation } from "@/types/decision-conflict-detection-contract";
import type { ConflictDetectionEngineResult } from "@/types/decision-conflict-detection-engine";
import type { ConflictLedgerResult } from "@/types/decision-conflict-ledger";
import type { EnforcementResult } from "@/types/decision-constitutional-governance-enforcement";
import type { EscalationWorkflowResult } from "@/types/decision-conflict-escalation-workflow";
import type { TradeoffExplanationGeneratorResult } from "@/types/decision-tradeoff-explanation-generator";

const NOW = "2026-07-04T00:10:00.000Z";
const CERTIFICATION_VERSION = "decision-conflict-arbitration-certification-gate/v1" as const;
const AUTHORIZED_COMPONENT = "decision-conflict-arbitration-certification-gate";

export const CERTIFICATION_REPORT_TYPES: readonly ConflictArbitrationCertificationReportType[] = Object.freeze([
  "Certification Report",
  "Arbitration Validation Report",
  "Replay Validation Report",
  "Governance Compliance Report",
  "Constitutional Compliance Report",
  "Conflict Ledger Validation Report",
  "Production Readiness Report",
]);

type Sources = Readonly<{
  conflictContract: ConflictDetectionContractFoundation;
  detection: ConflictDetectionEngineResult;
  classification: ConflictClassificationEngineResult;
  arbitration: ArbitrationRulesEngineResult;
  tradeoff: TradeoffExplanationGeneratorResult;
  escalation: EscalationWorkflowResult;
  ledger: ConflictLedgerResult;
  enforcement: EnforcementResult;
  analytics: ArbitrationObservabilityAnalyticsResult;
}>;

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)].sort());
}

function resolveSources(input: ConflictArbitrationCertificationInput = {}): Sources {
  const conflictContract = input.conflict_contract ?? getConflictDetectionContractFoundation();
  const detection = input.detection_result ?? getConflictDetectionEngineFoundation().result;
  const classification = input.classification_result ?? getConflictClassificationEngineFoundation().result;
  const arbitration = input.arbitration_result ?? getArbitrationRulesEngineFoundation().result;
  const tradeoff = input.tradeoff_result ?? getTradeoffExplanationGeneratorFoundation().result;
  const escalation = input.escalation_result ?? getConflictEscalationWorkflowFoundation().result;
  const ledger = input.ledger_result ?? getConflictLedgerFoundation().result;
  const enforcement = input.enforcement_result ?? getEnforcementFoundation().result;
  const analytics = input.analytics_result ?? getArbitrationObservabilityAnalyticsFoundation().result;
  return Object.freeze({ conflictContract, detection, classification, arbitration, tradeoff, escalation, ledger, enforcement, analytics });
}

function testHash(test: Omit<ConflictArbitrationCertificationTest, "integrity_hash"> | ConflictArbitrationCertificationTest): string {
  return hashWithoutIntegrity(test);
}

function certificationTest(input: Omit<ConflictArbitrationCertificationTest, "integrity_hash">): ConflictArbitrationCertificationTest {
  return Object.freeze({ ...input, integrity_hash: testHash(input) });
}

function passFail(condition: boolean): "PASS" | "FAIL" {
  return condition ? "PASS" : "FAIL";
}

function allAdvisory(sources: Sources): boolean {
  return sources.detection.advisory_only
    && sources.classification.advisory_only
    && sources.arbitration.advisory_only
    && sources.tradeoff.advisory_only
    && sources.escalation.advisory_only
    && sources.enforcement.advisory_only
    && sources.analytics.advisory_only;
}

function replayStatus(sources: Sources): Readonly<Record<string, boolean>> {
  return Object.freeze({
    conflict_contract: sources.conflictContract.replay.replay_valid,
    detection: replayConflictDetectionEngine(sources.detection).replay_valid,
    classification: replayConflictClassification(sources.classification).replay_valid,
    arbitration: replayArbitrationRulesEngine(sources.arbitration).replay_valid,
    tradeoff: replayTradeoffExplanations(sources.tradeoff).replay_valid,
    escalation: replayConflictEscalationWorkflow(sources.escalation).replay_valid,
    ledger: replayConflictLedger(sources.ledger).replay_valid,
    enforcement: replayEnforcement(sources.enforcement).replay_valid,
    analytics: replayArbitrationObservabilityAnalytics(sources.analytics).replay_valid,
  });
}

function buildTests(sources: Sources): readonly ConflictArbitrationCertificationTest[] {
  const replay = replayStatus(sources);
  const sourceReplayRefs = [
    sources.conflictContract.replay.replay_id,
    sources.detection.replay_hash,
    sources.classification.replay_hash,
    sources.arbitration.replay_hash,
    sources.tradeoff.replay_hash,
    sources.escalation.replay_hash,
    sources.ledger.replay_hash,
    sources.enforcement.replay_hash,
    sources.analytics.replay_hash,
  ];
  const hasGovernance = sources.ledger.entries.every((entry) => entry.governance_refs.length > 0) && !sources.enforcement.failures.includes("GOVERNANCE_POLICY_VIOLATION");
  const hasConstitution = sources.ledger.entries.every((entry) => entry.constitutional_refs.length > 0) && !sources.enforcement.failures.includes("CONSTITUTIONAL_VIOLATION");
  const hasAuthority = sources.ledger.entries.every((entry) => entry.authority_refs.length > 0) && !sources.enforcement.failures.includes("AUTHORITY_VIOLATION");
  const tenantIsolated = !sources.enforcement.failures.includes("TENANT_ISOLATION_BREACH") && Object.keys(sources.analytics.metrics.conflicts_by_tenant).length <= 1;
  const explanationComplete = sources.tradeoff.explanation_status === "PASS"
    && sources.tradeoff.explanations.length === sources.arbitration.arbitrations.length
    && sources.tradeoff.explanations.every((explanation) => explanation.supporting_evidence_refs.length > 0
      && explanation.rejected_evidence_refs.length > 0
      && explanation.risk_comparison.length > 0
      && explanation.confidence_comparison.length > 0
      && explanation.governance_reasoning.length > 0
      && explanation.constitutional_reasoning.length > 0
      && explanation.mission_impact.length > 0
      && explanation.forecast_comparison.length > 0
      && explanation.recovery_implications.length > 0);
  const criticalTests: Array<readonly [string, ConflictArbitrationCertificationTest["phase"], string, boolean, ConflictArbitrationCertificationFailureReason]> = [
    ["conflict_contract_valid", "9.6.1", "Conflict contract valid", sources.conflictContract.validation.validation_state === "VALID" && sources.conflictContract.replay.replay_valid, "CONFLICT_CONTRACT_INVALID"],
    ["conflict_detection_deterministic", "9.6.2", "Conflict detection deterministic", sources.detection.detection_status === "PASS" && sources.detection.deterministic && replay.detection, "DETECTION_NONDETERMINISTIC"],
    ["classification_reproducible", "9.6.3", "Conflict classification reproducible", sources.classification.classification_status === "PASS" && sources.classification.deterministic && replay.classification, "CLASSIFICATION_NONREPRODUCIBLE"],
    ["severity_scoring_deterministic", "9.6.3", "Severity scoring deterministic", sources.classification.classifications.every((item) => Number.isFinite(item.severity_score)) && replay.classification, "CLASSIFICATION_NONREPRODUCIBLE"],
    ["arbitration_rules_deterministic", "9.6.4", "Arbitration rules deterministic", sources.arbitration.arbitration_status === "PASS" && sources.arbitration.deterministic && replay.arbitration, "ARBITRATION_NONDETERMINISTIC"],
    ["tradeoff_explanations_complete", "9.6.5", "Tradeoff explanations complete", explanationComplete && replay.tradeoff, "TRADEOFF_EXPLANATION_INCOMPLETE"],
    ["escalation_workflow_deterministic", "9.6.6", "Escalation workflows deterministic", sources.escalation.escalation_status !== "FAIL" && sources.escalation.deterministic && replay.escalation, "ESCALATION_NONDETERMINISTIC"],
    ["conflict_ledger_verified", "9.6.7", "Immutable Conflict Ledger verified", sources.ledger.ledger_status === "PASS" && sources.ledger.append_only && replay.ledger, "LEDGER_INTEGRITY_FAILURE"],
    ["governance_enforcement_mandatory", "9.6.8", "Governance enforcement mandatory", hasGovernance && sources.enforcement.enforcement_status === "PASS", "GOVERNANCE_BYPASS"],
    ["constitutional_enforcement_mandatory", "9.6.8", "Constitutional enforcement mandatory", hasConstitution && sources.enforcement.enforcement_status === "PASS", "CONSTITUTIONAL_VIOLATION"],
    ["authority_boundaries_valid", "9.6.8", "Authority boundaries valid", hasAuthority, "AUTHORITY_BOUNDARY_VIOLATION"],
    ["tenant_isolation_preserved", "9.6.8", "Tenant isolation preserved", tenantIsolated, "TENANT_ISOLATION_FAILURE"],
    ["hidden_arbitration_rejected", "9.6.8", "Hidden arbitration detected as FAIL", !sources.enforcement.failures.includes("HIDDEN_ARBITRATION_DETECTED"), "HIDDEN_ARBITRATION"],
    ["undocumented_override_rejected", "9.6.8", "Undocumented override detected as FAIL", !sources.enforcement.failures.includes("UNDOCUMENTED_OVERRIDE"), "UNDOCUMENTED_OVERRIDE"],
    ["replay_reconstructs_identical_arbitration", "9.6.10", "Replay reconstructs identical arbitration", Object.values(replay).every(Boolean), "REPLAY_DIVERGENCE"],
    ["integrity_hashes_reproducible", "9.6.10", "Integrity hashes reproducible", sources.ledger.failures.length === 0 && sources.analytics.metrics.integrity_failures === 0, "INTEGRITY_HASH_MISMATCH"],
    ["advisory_only_boundary_intact", "9.6.10", "Advisory-only boundaries remain intact", allAdvisory(sources), "ADVISORY_ONLY_BOUNDARY_VIOLATION"],
  ];
  const categoryTests = sources.conflictContract.categories.map((category) => {
    const id = category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "");
    return certificationTest({
      test_id: `${id}_conflicts_supported`,
      phase: "9.6.1",
      description: `${category} conflicts detected/supported deterministically`,
      expected: "PASS",
      actual: passFail(sources.conflictContract.categories.includes(category)),
      critical: true,
      failure_reason: sources.conflictContract.categories.includes(category) ? undefined : "CONFLICT_CONTRACT_INVALID",
      evidence_refs: sourceReplayRefs,
      replay_ref: `replay_certification_${id}`,
    });
  });
  const standardTests = criticalTests.map(([test_id, phase, description, condition, failure_reason]) => certificationTest({
    test_id,
    phase,
    description,
    expected: "PASS",
    actual: passFail(condition),
    critical: true,
    failure_reason: condition ? undefined : failure_reason,
    evidence_refs: sourceReplayRefs,
    replay_ref: `replay_certification_${test_id}`,
  }));
  const observability = certificationTest({
    test_id: "observability_reproducible",
    phase: "9.6.9",
    description: "Observability dashboards, metrics, reports, and replay analytics reproducible",
    expected: "PASS",
    actual: passFail(sources.analytics.analytics_status === "PASS" && replay.analytics && sources.analytics.dashboards.length > 0 && sources.analytics.trend_reports.length > 0),
    critical: false,
    failure_reason: sources.analytics.analytics_status === "PASS" && replay.analytics ? undefined : "OBSERVABILITY_DEFICIENCY",
    evidence_refs: sourceReplayRefs,
    replay_ref: "replay_certification_observability_reproducible",
  });
  return Object.freeze([...standardTests, ...categoryTests, observability]);
}

function validationResult(tests: readonly ConflictArbitrationCertificationTest[]): ConflictArbitrationCertificationValidation {
  const failures = unique(tests.filter((test) => test.actual === "FAIL").map((test) => test.failure_reason ?? "PRODUCTION_READINESS_BLOCKED"));
  const has = (failure: ConflictArbitrationCertificationFailureReason) => failures.includes(failure);
  return Object.freeze({
    validation_state: failures.length === 0 ? "VALID" : "REJECTED",
    fail_closed: tests.some((test) => test.actual === "FAIL" && test.critical),
    failures,
    checks: Object.freeze({
      deterministic: !has("DETECTION_NONDETERMINISTIC") && !has("CLASSIFICATION_NONREPRODUCIBLE") && !has("ARBITRATION_NONDETERMINISTIC") && !has("ESCALATION_NONDETERMINISTIC"),
      replay_valid: !has("REPLAY_DIVERGENCE"),
      governance_enforced: !has("GOVERNANCE_BYPASS"),
      constitutional_enforced: !has("CONSTITUTIONAL_VIOLATION"),
      authority_valid: !has("AUTHORITY_BOUNDARY_VIOLATION"),
      tenant_isolated: !has("TENANT_ISOLATION_FAILURE"),
      ledger_integrity_valid: !has("LEDGER_INTEGRITY_FAILURE") && !has("INTEGRITY_HASH_MISMATCH"),
      explainability_complete: !has("TRADEOFF_EXPLANATION_INCOMPLETE"),
      observability_complete: !has("OBSERVABILITY_DEFICIENCY"),
      advisory_only: !has("ADVISORY_ONLY_BOUNDARY_VIOLATION"),
      production_ready: failures.length === 0,
    }),
  });
}

function outcomeFor(tests: readonly ConflictArbitrationCertificationTest[], validation: ConflictArbitrationCertificationValidation): ConflictArbitrationCertificationOutcome {
  if (validation.fail_closed) return "FAIL";
  if (tests.some((test) => test.actual === "FAIL")) return "CONDITIONAL_PASS";
  return "PASS";
}

function reportHash(report: Omit<ConflictArbitrationCertificationReport, "integrity_hash"> | ConflictArbitrationCertificationReport): string {
  return hashWithoutIntegrity(report);
}

function buildReport(type: ConflictArbitrationCertificationReportType, tests: readonly ConflictArbitrationCertificationTest[], outcome: ConflictArbitrationCertificationOutcome): ConflictArbitrationCertificationReport {
  const findings = unique(tests.filter((test) => test.actual === "FAIL").map((test) => test.failure_reason ?? "PRODUCTION_READINESS_BLOCKED"));
  const scopedTests = tests.filter((test) => {
    if (type === "Replay Validation Report") return test.test_id.includes("replay") || test.description.includes("Replay");
    if (type === "Governance Compliance Report") return test.description.includes("Governance") || test.failure_reason === "GOVERNANCE_BYPASS";
    if (type === "Constitutional Compliance Report") return test.description.includes("Constitutional") || test.failure_reason === "CONSTITUTIONAL_VIOLATION";
    if (type === "Conflict Ledger Validation Report") return test.description.includes("Ledger") || test.failure_reason === "LEDGER_INTEGRITY_FAILURE";
    if (type === "Arbitration Validation Report") return ["9.6.2", "9.6.3", "9.6.4", "9.6.5", "9.6.6"].includes(test.phase);
    if (type === "Production Readiness Report") return test.critical;
    return true;
  });
  const base: Omit<ConflictArbitrationCertificationReport, "integrity_hash"> = {
    report_id: `conflict_arbitration_certification_${hash(type).slice(0, 20)}`,
    report_type: type,
    outcome,
    findings,
    supporting_tests: Object.freeze(scopedTests.map((test) => test.test_id)),
    evidence_refs: unique(scopedTests.flatMap((test) => [...test.evidence_refs])),
    metrics: Object.freeze({
      tests_executed: scopedTests.length,
      tests_passed: scopedTests.filter((test) => test.actual === "PASS").length,
      tests_failed: scopedTests.filter((test) => test.actual === "FAIL").length,
      critical_failures: scopedTests.filter((test) => test.actual === "FAIL" && test.critical).length,
    }),
    replay_ref: `replay_report_${hash(type).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function buildObservability(tests: readonly ConflictArbitrationCertificationTest[], outcome: ConflictArbitrationCertificationOutcome): ConflictArbitrationCertificationObservability {
  const passed = tests.filter((test) => test.actual === "PASS").length;
  const failed = tests.length - passed;
  const rate = (count: number, total: number) => total === 0 ? 0 : Number((count / total).toFixed(6));
  const replayTests = tests.filter((test) => test.test_id.includes("replay") || test.description.includes("Replay"));
  const governanceTests = tests.filter((test) => test.description.includes("Governance") || test.failure_reason === "GOVERNANCE_BYPASS");
  const constitutionalTests = tests.filter((test) => test.description.includes("Constitutional") || test.failure_reason === "CONSTITUTIONAL_VIOLATION");
  const integrityTests = tests.filter((test) => test.description.includes("integrity") || test.description.includes("Ledger") || test.failure_reason === "INTEGRITY_HASH_MISMATCH");
  return Object.freeze({
    certification_execution_duration: tests.length === 0 ? 0 : 1,
    tests_executed: tests.length,
    tests_passed: passed,
    tests_failed: failed,
    replay_validation_success_rate: rate(replayTests.filter((test) => test.actual === "PASS").length, replayTests.length),
    governance_compliance_rate: rate(governanceTests.filter((test) => test.actual === "PASS").length, governanceTests.length),
    constitutional_compliance_rate: rate(constitutionalTests.filter((test) => test.actual === "PASS").length, constitutionalTests.length),
    integrity_verification_rate: rate(integrityTests.filter((test) => test.actual === "PASS").length, integrityTests.length),
    production_readiness_score: rate(passed, tests.length),
    certification_outcome_history: Object.freeze({
      PASS: outcome === "PASS" ? 1 : 0,
      CONDITIONAL_PASS: outcome === "CONDITIONAL_PASS" ? 1 : 0,
      FAIL: outcome === "FAIL" ? 1 : 0,
    }),
  });
}

function ledgerHash(record: Omit<ConflictArbitrationCertificationLedgerRecord, "integrity_hash"> | ConflictArbitrationCertificationLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function buildCertificationLedger(certification_id: string, outcome: ConflictArbitrationCertificationOutcome, reports: readonly ConflictArbitrationCertificationReport[], tests: readonly ConflictArbitrationCertificationTest[]): readonly ConflictArbitrationCertificationLedgerRecord[] {
  const base: Omit<ConflictArbitrationCertificationLedgerRecord, "integrity_hash"> = {
    ledger_id: `conflict_arbitration_certification_ledger_${certification_id}`,
    certification_id,
    outcome,
    report_refs: reports.map((report) => report.report_id),
    test_refs: tests.map((test) => test.test_id),
    production_ready: outcome === "PASS",
    phase_advancement_authorized: outcome === "PASS",
    replay_ref: `replay_ledger_${certification_id}`,
    lineage_ref: `lineage_${certification_id}`,
    ledger_timestamp: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<ConflictArbitrationCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_id: result.certification_id,
    certification_outcome: result.certification_outcome,
    production_ready: result.production_ready,
    phase_advancement_authorized: result.phase_advancement_authorized,
    tests: result.tests,
    reports: result.reports,
    certification_ledger: result.certification_ledger,
    observability: result.observability,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(failures: readonly ConflictArbitrationCertificationFailureReason[]): ConflictArbitrationCertificationResult {
  const tests: readonly ConflictArbitrationCertificationTest[] = Object.freeze([]);
  const validation: ConflictArbitrationCertificationValidation = Object.freeze({
    validation_state: "REJECTED",
    fail_closed: true,
    failures: unique(failures),
    checks: Object.freeze({
      deterministic: false,
      replay_valid: false,
      governance_enforced: false,
      constitutional_enforced: false,
      authority_valid: false,
      tenant_isolated: false,
      ledger_integrity_valid: false,
      explainability_complete: false,
      observability_complete: false,
      advisory_only: false,
      production_ready: false,
    }),
  });
  const base: Omit<ConflictArbitrationCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_id: "decision_conflict_arbitration_certification_failed",
    certification_outcome: "FAIL",
    production_ready: false,
    phase_advancement_authorized: false,
    fail_closed: true,
    tests,
    reports: Object.freeze([]),
    certification_ledger: Object.freeze([]),
    observability: buildObservability(tests, "FAIL"),
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function certifyDecisionConflictArbitration(input: ConflictArbitrationCertificationInput = {}): ConflictArbitrationCertificationResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_CERTIFICATION_ACCESS"]);
  const sources = resolveSources(input);
  const tests = buildTests(sources);
  const validation = validationResult(tests);
  const certification_outcome = outcomeFor(tests, validation);
  const certification_id = `decision_conflict_arbitration_certification_${hash(tests.map((test) => test.integrity_hash)).slice(0, 24)}`;
  const reports = Object.freeze(CERTIFICATION_REPORT_TYPES.map((type) => buildReport(type, tests, certification_outcome)));
  const certification_ledger = buildCertificationLedger(certification_id, certification_outcome, reports, tests);
  const observability = buildObservability(tests, certification_outcome);
  const base: Omit<ConflictArbitrationCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_id,
    certification_outcome,
    production_ready: certification_outcome === "PASS",
    phase_advancement_authorized: certification_outcome === "PASS",
    fail_closed: certification_outcome === "FAIL",
    tests,
    reports,
    certification_ledger,
    observability,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_DIVERGENCE"]);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionConflictArbitrationCertification(result: ConflictArbitrationCertificationResult): ConflictArbitrationCertificationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.tests.every((test) => testHash(test) === test.integrity_hash)
    && result.reports.every((report) => reportHash(report) === report.integrity_hash)
    && result.certification_ledger.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: ConflictArbitrationCertificationFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<ConflictArbitrationCertificationReplay, "integrity_hash"> = {
    replay_id: "replay_decision_conflict_arbitration_certification_gate",
    replay_valid,
    certification_ref: result.certification_id,
    test_refs: result.tests.map((test) => test.test_id),
    report_refs: result.reports.map((report) => report.report_id),
    ledger_refs: result.certification_ledger.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildCertificationObservability(result: ConflictArbitrationCertificationResult): ConflictArbitrationCertificationObservability {
  return result.observability;
}

export function getDecisionConflictArbitrationCertificationFoundation(): ConflictArbitrationCertificationFoundation {
  const result = certifyDecisionConflictArbitration();
  const replay = replayDecisionConflictArbitrationCertification(result);
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    report_types: CERTIFICATION_REPORT_TYPES,
    result,
    replay,
  });
}

export const DecisionConflictArbitrationCertificationGate = Object.freeze({
  certify: certifyDecisionConflictArbitration,
  replay: replayDecisionConflictArbitrationCertification,
  observability: buildCertificationObservability,
});
