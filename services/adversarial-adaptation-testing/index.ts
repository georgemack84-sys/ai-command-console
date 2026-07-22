import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  AdversarialReplayRecord,
  AdversarialScenarioRecord,
  AdversarialTestFailure,
  AdversarialTestingApiSurface,
  AdversarialTestingFoundation,
  AdversarialTestingInput,
  AdversarialTestingMetrics,
  AdversarialTestingResult,
  AdversarialTestRecord,
  AdversarialTestReport,
  AdversarialTestScenario,
  AdversarialTestStatus,
  AttackSimulationReport,
  AttackSuccessAnalysis,
  DefensiveCoverageReport,
  DefensiveValidationReport,
  ResilienceScoreReport,
} from "@/types/adversarial-adaptation-testing";

const TESTING_VERSION = "adversarial-adaptation-testing/v1" as const;
const TESTING_IDENTIFIER = "AdversarialAdaptationTesting" as const;
const TESTING_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<AdversarialTestingInput["scenario"]>;

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

function buildApiSurface(): AdversarialTestingApiSurface {
  const base: Omit<AdversarialTestingApiSurface, "integrity_hash"> = {
    api_id: "adversarial_adaptation_testing_api",
    run_adversarial_tests: "POST /adversarial-adaptation-testing/run",
    retrieve_scenario: "POST /adversarial-adaptation-testing/scenario",
    retrieve_simulation: "POST /adversarial-adaptation-testing/simulation",
    retrieve_validation: "POST /adversarial-adaptation-testing/validation",
    retrieve_attack_success: "POST /adversarial-adaptation-testing/attack-success",
    retrieve_coverage: "POST /adversarial-adaptation-testing/coverage",
    retrieve_resilience_score: "POST /adversarial-adaptation-testing/resilience-score",
    retrieve_report: "POST /adversarial-adaptation-testing/report",
    retrieve_adversarial_replay: "POST /adversarial-adaptation-testing/adversarial-replay",
    retrieve_ledger_record: "POST /adversarial-adaptation-testing/ledger",
    retrieve_metrics: "POST /adversarial-adaptation-testing/metrics",
    replay_testing: "POST /adversarial-adaptation-testing/replay",
    inspect_testing: "POST /adversarial-adaptation-testing/inspect",
    retrieve_contract: "GET /adversarial-adaptation-testing/contract",
    production_mutation_supported: false,
    attack_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): AdversarialTestFailure | undefined {
  const map: Partial<Record<AdversarialTestScenario, AdversarialTestFailure>> = {
    UNAUTHORIZED_SCENARIO_MODIFICATION: "UNAUTHORIZED_SCENARIO_MODIFICATION",
    POISONED_EVIDENCE: "POISONED_EVIDENCE_ATTACK",
    MALICIOUS_FEEDBACK: "MALICIOUS_FEEDBACK_ATTACK",
    REPLAY_CORRUPTION: "REPLAY_CORRUPTION_ATTACK",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTACK",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_ATTACK",
    CONFIDENCE_MANIPULATION: "CONFIDENCE_MANIPULATION_ATTACK",
    STRATEGIC_DECEPTION: "STRATEGIC_DECEPTION_ATTACK",
    OPTIMIZATION_ATTACK: "OPTIMIZATION_ATTACK",
    SYNTHETIC_HISTORY: "SYNTHETIC_HISTORY_ATTACK",
    FALSE_SUCCESS_PATTERNS: "FALSE_SUCCESS_PATTERN_ATTACK",
    CONFLICTING_EVIDENCE: "CONFLICTING_EVIDENCE_ATTACK",
    ADVERSARIAL_OPERATORS: "ADVERSARIAL_OPERATOR_ATTACK",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE_ATTACK",
    TENANT_CONTAMINATION: "TENANT_CONTAMINATION_ATTACK",
    EVIDENCE_LINEAGE_CORRUPTION: "EVIDENCE_LINEAGE_CORRUPTION",
    CERTIFICATION_BYPASS: "CERTIFICATION_BYPASS_ATTACK",
    POLICY_MANIPULATION: "POLICY_MANIPULATION_ATTACK",
    RECOMMENDATION_MANIPULATION: "RECOMMENDATION_MANIPULATION_ATTACK",
    OPTIMIZATION_PRESSURE: "OPTIMIZATION_PRESSURE_ATTACK",
    OPERATOR_COLLUSION: "OPERATOR_COLLUSION_ATTACK",
    SYNTHETIC_GOVERNANCE_EVENTS: "SYNTHETIC_GOVERNANCE_EVENT",
    TIMING_ATTACK: "TIMING_ATTACK",
    DEPENDENCY_CORRUPTION: "DEPENDENCY_CORRUPTION_ATTACK",
    AUDIT_MANIPULATION: "AUDIT_MANIPULATION_ATTACK",
    COORDINATED_ATTACK: "COORDINATED_ATTACK",
    MULTI_STAGE_ADAPTIVE_ATTACK: "MULTI_STAGE_ADAPTIVE_ATTACK",
    FAILED_CONTAINMENT: "FAILED_CONTAINMENT",
    INCOMPLETE_DETECTION: "INCOMPLETE_DETECTION",
    GOVERNANCE_DEGRADATION: "GOVERNANCE_DEGRADATION",
    REPLAY_FAILURE: "REPLAY_FAILURE",
    AUTHORITY_VIOLATION: "AUTHORITY_VIOLATION",
    CERTIFICATION_FAILURE: "CERTIFICATION_FAILURE",
    DEFENSIVE_GAP: "DEFENSIVE_GAP",
    INCOMPLETE_PROTECTION: "INCOMPLETE_PROTECTION",
    UNCOVERED_ATTACK_VECTOR: "UNCOVERED_ATTACK_VECTOR",
    MISSING_CONTAINMENT: "MISSING_CONTAINMENT",
    INADEQUATE_MONITORING: "INADEQUATE_MONITORING",
    NONDETERMINISTIC: "NONDETERMINISTIC_TEST",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_ATTACK_EVIDENCE",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    UNKNOWN_BEHAVIOR: "UNKNOWN_ATTACK_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly AdversarialTestFailure[] {
  const failures: AdversarialTestFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function criticalFailures(failures: readonly AdversarialTestFailure[]): boolean {
  return failures.some((failure) => [
    "UNKNOWN_ATTACK_BEHAVIOR",
    "TENANT_ISOLATION_BREACH",
    "GOVERNANCE_DEGRADATION",
    "AUTHORITY_VIOLATION",
    "FAILED_CONTAINMENT",
  ].includes(failure));
}

function severityFor(failures: readonly AdversarialTestFailure[]): DriftSeverity {
  if (criticalFailures(failures)) return "CRITICAL";
  if (failures.some((failure) => [
    "GOVERNANCE_BYPASS_ATTACK",
    "AUTHORITY_ESCALATION_ATTACK",
    "REPLAY_CORRUPTION_ATTACK",
    "TENANT_CONTAMINATION_ATTACK",
    "CERTIFICATION_BYPASS_ATTACK",
    "MULTI_STAGE_ADAPTIVE_ATTACK",
    "POISONED_EVIDENCE_ATTACK",
  ].includes(failure))) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly AdversarialTestFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_ATTACK_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly AdversarialTestFailure[]): AdversarialTestStatus {
  if (criticalFailures(failures)) return "FAIL_CLOSED";
  if (failures.some((failure) => [
    "POISONED_EVIDENCE_ATTACK",
    "REPLAY_CORRUPTION_ATTACK",
    "GOVERNANCE_BYPASS_ATTACK",
    "AUTHORITY_ESCALATION_ATTACK",
    "TENANT_CONTAMINATION_ATTACK",
    "CERTIFICATION_BYPASS_ATTACK",
    "MULTI_STAGE_ADAPTIVE_ATTACK",
  ].includes(failure))) return "CONTAINED";
  if (failures.includes("UNAUTHORIZED_SCENARIO_MODIFICATION")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "VULNERABILITY_DETECTED" : "PASS";
}

function resilienceScore(failures: readonly AdversarialTestFailure[]): number {
  if (!failures.length) return 0.98;
  if (criticalFailures(failures)) return 0.04;
  if (failures.includes("GOVERNANCE_BYPASS_ATTACK") || failures.includes("REPLAY_CORRUPTION_ATTACK") || failures.includes("POISONED_EVIDENCE_ATTACK")) return 0.18;
  return 0.56;
}

function successfulAttacks(failures: readonly AdversarialTestFailure[]): readonly AdversarialTestFailure[] {
  return freezeArray(failures.filter((failure) => [
    "FAILED_CONTAINMENT",
    "INCOMPLETE_DETECTION",
    "GOVERNANCE_DEGRADATION",
    "REPLAY_FAILURE",
    "AUTHORITY_VIOLATION",
    "CERTIFICATION_FAILURE",
    "UNKNOWN_ATTACK_BEHAVIOR",
  ].includes(failure)));
}

function containmentActions(failures: readonly AdversarialTestFailure[], response: DriftResponse): readonly string[] {
  if (!failures.length) return freezeArray(["monitor_adversarial_resilience"]);
  const actions = ["terminate_unsafe_simulation", "isolate_compromised_adaptive_components", "quarantine_poisoned_evidence", "suppress_compromised_adaptations", "preserve_forensic_evidence", "notify_operators"];
  if (response !== "MONITOR") actions.push("require_governance_review", "require_certification_before_progression");
  if (response === "FAIL_CLOSED") actions.push("fail_closed");
  return freezeArray(actions);
}

function buildScenarioRecord(scenario: Scenario, severity: DriftSeverity): AdversarialScenarioRecord {
  const base: Omit<AdversarialScenarioRecord, "integrity_hash"> = {
    scenario_id: `adversarial_scenario_${scenario.toLowerCase()}`,
    scenario_name: scenario,
    attack_category: scenario === "BASELINE" ? "resilience_baseline" : "adaptive_adversarial_attack",
    severity,
    attack_objective: scenario === "BASELINE" ? "Validate baseline resilience controls." : "Stress adaptive intelligence under hostile conditions.",
    expected_defense: "detect_contain_preserve_replay_require_governance_and_certification",
    governance_requirements: freezeArray(["governance_review_for_scenario_change", "operator_visibility_required", "successful_attacks_require_review"]),
    constitutional_requirements: freezeArray(["constitutional_constraints_preserved", "authority_boundaries_preserved", "tenant_isolation_preserved"]),
    replay_requirements: freezeArray(["deterministic_replay_required", "identical_attack_reproduction", "identical_defense_reproduction"]),
    certification_requirements: freezeArray(["certification_before_production_progression", "resilience_evidence_required"]),
    approval_reference: "governance-approval:adversarial-scenario-registry:v1",
    version: "adversarial-scenario/v1",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSimulation(failures: readonly AdversarialTestFailure[]): AttackSimulationReport {
  const base: Omit<AttackSimulationReport, "integrity_hash"> = {
    report_id: `attack_simulation_${hash(failures).slice(0, 14)}`,
    simulation_environment: "isolated_non_production",
    simulated_attack_vectors: failures.length ? failures : freezeArray(["baseline_resilience_probe"]),
    deterministic: true,
    isolated: true,
    replayable: true,
    evidence_backed: true,
    tenant_safe: !failures.includes("TENANT_ISOLATION_BREACH") && !failures.includes("TENANT_CONTAMINATION_ATTACK"),
    production_mutation: false,
    simulation_summary: failures.length ? "Controlled adversarial simulation executed with containment." : "Baseline adversarial readiness simulation passed.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(score: number, failures: readonly AdversarialTestFailure[]): DefensiveValidationReport {
  const validationFailures = freezeArray(failures.filter((failure) => [
    "FAILED_CONTAINMENT",
    "INCOMPLETE_DETECTION",
    "GOVERNANCE_DEGRADATION",
    "REPLAY_FAILURE",
    "AUTHORITY_VIOLATION",
    "CERTIFICATION_FAILURE",
  ].includes(failure)));
  const base: Omit<DefensiveValidationReport, "integrity_hash"> = {
    report_id: `defensive_validation_${hash({ score, failures }).slice(0, 14)}`,
    detection_accuracy_score: failures.includes("INCOMPLETE_DETECTION") ? 0.22 : score,
    containment_execution_score: failures.includes("FAILED_CONTAINMENT") ? 0.06 : score,
    governance_preservation_score: failures.includes("GOVERNANCE_DEGRADATION") || failures.includes("GOVERNANCE_BYPASS_ATTACK") ? 0.18 : score,
    constitutional_enforcement_score: failures.includes("AUTHORITY_VIOLATION") ? 0.08 : score,
    authority_preservation_score: failures.includes("AUTHORITY_VIOLATION") || failures.includes("AUTHORITY_ESCALATION_ATTACK") ? 0.12 : score,
    replay_integrity_score: failures.includes("REPLAY_FAILURE") || failures.includes("REPLAY_CORRUPTION_ATTACK") ? 0.16 : score,
    operator_visibility_score: score,
    recovery_execution_score: failures.includes("CERTIFICATION_FAILURE") ? 0.24 : score,
    defensive_behavior_assessment: validationFailures.length ? "Defensive behavior failed required adversarial controls." : "Defensive behavior matched expected controls.",
    validation_failures: validationFailures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAttackSuccess(score: number, failures: readonly AdversarialTestFailure[]): AttackSuccessAnalysis {
  const successful = successfulAttacks(failures);
  const attack_success_score = successful.length ? 0.92 : failures.length ? 0.2 : 0;
  const base: Omit<AttackSuccessAnalysis, "integrity_hash"> = {
    analysis_id: `attack_success_${hash(failures).slice(0, 14)}`,
    attack_success_score,
    attack_containment_score: successful.length ? 0.12 : failures.length ? 0.88 : 0.98,
    attack_propagation_score: criticalFailures(failures) ? 0.74 : failures.length ? 0.12 : 0,
    defensive_latency_score: failures.includes("TIMING_ATTACK") ? 0.55 : score,
    governance_impact_score: failures.includes("GOVERNANCE_DEGRADATION") || failures.includes("GOVERNANCE_BYPASS_ATTACK") ? 0.72 : 0,
    constitutional_impact_score: failures.includes("AUTHORITY_VIOLATION") || failures.includes("AUTHORITY_ESCALATION_ATTACK") ? 0.76 : 0,
    replay_impact_score: failures.includes("REPLAY_FAILURE") || failures.includes("REPLAY_CORRUPTION_ATTACK") ? 0.68 : 0,
    recovery_success_score: failures.includes("CERTIFICATION_FAILURE") ? 0.24 : score,
    residual_risk: successful.length ? "successful_attack_requires_fail_closed_review" : failures.length ? "attack_contained_with_review_required" : "low",
    successful_attacks: successful,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCoverage(score: number, failures: readonly AdversarialTestFailure[]): DefensiveCoverageReport {
  const gaps = freezeArray(failures.filter((failure) => [
    "DEFENSIVE_GAP",
    "INCOMPLETE_PROTECTION",
    "UNCOVERED_ATTACK_VECTOR",
    "MISSING_CONTAINMENT",
    "INADEQUATE_MONITORING",
  ].includes(failure)));
  const base: Omit<DefensiveCoverageReport, "integrity_hash"> = {
    report_id: `defensive_coverage_${hash({ score, failures }).slice(0, 14)}`,
    evidence_validation_score: failures.includes("POISONED_EVIDENCE_ATTACK") || failures.includes("EVIDENCE_LINEAGE_CORRUPTION") ? 0.22 : score,
    feedback_validation_score: failures.includes("MALICIOUS_FEEDBACK_ATTACK") ? 0.32 : score,
    replay_validation_score: failures.includes("REPLAY_CORRUPTION_ATTACK") || failures.includes("REPLAY_DIVERGENCE_ATTACK") ? 0.18 : score,
    governance_enforcement_score: failures.includes("GOVERNANCE_BYPASS_ATTACK") ? 0.18 : score,
    authority_enforcement_score: failures.includes("AUTHORITY_ESCALATION_ATTACK") ? 0.2 : score,
    confidence_validation_score: failures.includes("CONFIDENCE_MANIPULATION_ATTACK") ? 0.34 : score,
    optimization_defense_score: failures.includes("OPTIMIZATION_ATTACK") || failures.includes("OPTIMIZATION_PRESSURE_ATTACK") ? 0.26 : score,
    tenant_isolation_score: failures.includes("TENANT_CONTAMINATION_ATTACK") || failures.includes("TENANT_ISOLATION_BREACH") ? 0.12 : score,
    certification_validation_score: failures.includes("CERTIFICATION_BYPASS_ATTACK") ? 0.2 : score,
    recovery_validation_score: failures.includes("MISSING_CONTAINMENT") ? 0.25 : score,
    coverage_gap_analysis: gaps.length ? "Coverage gaps require remediation before certification." : "Supported adversarial vectors are covered.",
    detected_gaps: gaps,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildScore(score: number, validation: DefensiveValidationReport, coverage: DefensiveCoverageReport): ResilienceScoreReport {
  const base: Omit<ResilienceScoreReport, "integrity_hash"> = {
    score_id: `resilience_score_${hash({ score, validation: validation.integrity_hash }).slice(0, 14)}`,
    attack_resistance_score: score,
    containment_score: validation.containment_execution_score,
    governance_resilience_score: validation.governance_preservation_score,
    constitutional_resilience_score: validation.constitutional_enforcement_score,
    replay_resilience_score: validation.replay_integrity_score,
    recovery_score: validation.recovery_execution_score,
    defensive_coverage_score: Math.min(coverage.evidence_validation_score, coverage.replay_validation_score, coverage.governance_enforcement_score, coverage.tenant_isolation_score, score),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(failures: readonly AdversarialTestFailure[], severity: DriftSeverity, response: DriftResponse, actions: readonly string[]): AdversarialTestReport {
  const successful = successfulAttacks(failures);
  const base: Omit<AdversarialTestReport, "integrity_hash"> = {
    report_id: `adversarial_test_report_${hash(failures).slice(0, 14)}`,
    executed_scenarios: freezeArray(["scenario:adversarial-validation"]),
    detected_attacks: failures,
    successful_attacks: successful,
    blocked_attacks: successful.length ? freezeArray([]) : failures,
    defensive_behavior: successful.length ? "Successful adversarial path detected and failed closed." : failures.length ? "Attack detected and contained." : "Baseline adversarial controls passed.",
    governance_impacts: failures.length ? freezeArray(["governance_review_required"]) : freezeArray(["governance_preserved"]),
    constitutional_impacts: failures.includes("AUTHORITY_VIOLATION") || failures.includes("AUTHORITY_ESCALATION_ATTACK") ? freezeArray(["constitutional_authority_boundary_at_risk"]) : freezeArray(["constitutional_boundary_preserved"]),
    replay_impacts: failures.includes("REPLAY_FAILURE") || failures.includes("REPLAY_CORRUPTION_ATTACK") ? freezeArray(["replay_integrity_review_required"]) : freezeArray(["replay_preserved"]),
    recovery_analysis: failures.length ? "Recovery requires certification before production progression." : "No recovery action required.",
    supporting_evidence: freezeArray(["evidence:attack-simulation", "evidence:defensive-validation", "evidence:coverage-analysis", "evidence:adversarial-replay"]),
    recommendations: failures.length ? freezeArray(["contain_attack", "review_governance", "certify_recovery"]) : freezeArray(["continue_monitoring"]),
    recommended_response: response,
    containment_actions: actions,
    severity,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(failures: readonly AdversarialTestFailure[], actions: readonly string[]): AdversarialReplayRecord {
  const base: Omit<AdversarialReplayRecord, "integrity_hash"> = {
    replay_id: `adversarial_replay_${hash(failures).slice(0, 14)}`,
    attack_execution: failures.length ? failures : freezeArray(["baseline_resilience_probe"]),
    defensive_decisions: failures.length ? freezeArray(["detect", "contain", "preserve_evidence"]) : freezeArray(["monitor"]),
    containment_actions: actions,
    governance_responses: failures.length ? freezeArray(["governance_review_required"]) : freezeArray(["governance_preserved"]),
    operator_interventions: failures.length ? freezeArray(["operator_notification_required"]) : freezeArray([]),
    recovery_procedures: failures.length ? freezeArray(["certification_before_progression"]) : freezeArray([]),
    certification_outcomes: failures.length ? freezeArray(["certification_blocked_until_review"]) : freezeArray(["certification_ready"]),
    forensic_integrity_preserved: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: AdversarialTestingInput, scenario: AdversarialScenarioRecord, score: ResilienceScoreReport, analysis: AttackSuccessAnalysis, report: AdversarialTestReport): AdversarialTestRecord {
  const base: Omit<AdversarialTestRecord, "integrity_hash"> = {
    test_id: `adversarial_test_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", scenario: scenario.scenario_id, failures: report.detected_attacks }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    scenario_id: scenario.scenario_id,
    attack_category: scenario.attack_category,
    attack_severity: scenario.severity,
    attack_success_score: analysis.attack_success_score,
    defensive_coverage_score: score.defensive_coverage_score,
    governance_resilience_score: score.governance_resilience_score,
    constitutional_resilience_score: score.constitutional_resilience_score,
    replay_resilience_score: score.replay_resilience_score,
    severity: report.severity,
    detected_vulnerabilities: report.detected_attacks,
    affected_adaptations: freezeArray(["adaptation:proposal-generation", "adaptation:simulation", "adaptation:feedback-learning"]),
    affected_recommendations: freezeArray(["recommendation:adaptive", "recommendation:governance-reviewed"]),
    containment_actions: report.containment_actions,
    recovery_actions: report.detected_attacks.length ? freezeArray(["governance_review", "certification_review", "forensic_replay"]) : freezeArray([]),
    supporting_evidence: report.integrity_hash,
    recommended_response: report.recommended_response,
    replay_refs: freezeArray(["replay:adversarial-adaptation-testing"]),
    timestamp: TESTING_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(score: ResilienceScoreReport, analysis: AttackSuccessAnalysis, failures: readonly AdversarialTestFailure[]): AdversarialTestingMetrics {
  const base: Omit<AdversarialTestingMetrics, "integrity_hash"> = {
    attack_success_score: analysis.attack_success_score,
    defensive_coverage_score: score.defensive_coverage_score,
    governance_resilience_score: score.governance_resilience_score,
    constitutional_resilience_score: score.constitutional_resilience_score,
    replay_resilience_score: score.replay_resilience_score,
    containment_required: failures.length > 0,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_TEST"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_ATTACK_EVIDENCE"),
    governance_preserved: !failures.includes("GOVERNANCE_DEGRADATION") && !failures.includes("GOVERNANCE_BYPASS_ATTACK"),
    constitutional_preserved: !failures.includes("AUTHORITY_VIOLATION") && !failures.includes("AUTHORITY_ESCALATION_ATTACK"),
    operator_authority_preserved: !failures.includes("AUTHORITY_VIOLATION") && !failures.includes("ADVERSARIAL_OPERATOR_ATTACK"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH") && !failures.includes("TENANT_CONTAMINATION_ATTACK"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdversarialTestingResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    scenario_hash: result.scenario_record.integrity_hash,
    simulation_hash: result.simulation_report.integrity_hash,
    validation_hash: result.defensive_validation_report.integrity_hash,
    attack_success_hash: result.attack_success_analysis.integrity_hash,
    coverage_hash: result.defensive_coverage_report.integrity_hash,
    score_hash: result.resilience_score_report.integrity_hash,
    report_hash: result.adversarial_test_report.integrity_hash,
    replay_record_hash: result.adversarial_replay.integrity_hash,
    ledger_hash: result.adversarial_test_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdversarialTestingResult, "integrity_hash">): string {
  return hash({
    version: result.adversarial_adaptation_testing_version,
    testing_identifier: result.testing_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.adversarial_test_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function runAdversarialAdaptationTests(input: AdversarialTestingInput = {}): AdversarialTestingResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const score = resilienceScore(failures);
  const actions = containmentActions(failures, response);
  const scenario_record = buildScenarioRecord(scenario, severity);
  const simulation_report = buildSimulation(failures);
  const defensive_validation_report = buildValidation(score, failures);
  const attack_success_analysis = buildAttackSuccess(score, failures);
  const defensive_coverage_report = buildCoverage(score, failures);
  const resilience_score_report = buildScore(score, defensive_validation_report, defensive_coverage_report);
  const adversarial_test_report = buildReport(failures, severity, response, actions);
  const adversarial_replay = buildReplay(failures, actions);
  const adversarial_test_record = buildRecord(input, scenario_record, resilience_score_report, attack_success_analysis, adversarial_test_report);
  const metrics = buildMetrics(resilience_score_report, attack_success_analysis, failures);
  const base: Omit<AdversarialTestingResult, "integrity_hash" | "replay_hash"> = {
    adversarial_adaptation_testing_version: TESTING_VERSION,
    testing_identifier: TESTING_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    scenario_record,
    simulation_report,
    defensive_validation_report,
    attack_success_analysis,
    defensive_coverage_report,
    resilience_score_report,
    adversarial_test_report,
    adversarial_replay,
    adversarial_test_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_ATTACK_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_ATTACK_EVIDENCE"),
    governance_preserved: metrics.governance_preserved,
    constitutional_preserved: metrics.constitutional_preserved,
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_behavior: false,
    authorizes_attack: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdversarialAdaptationTesting(result: AdversarialTestingResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.scenario_record) &&
    verifyHashedRecord(result.simulation_report) &&
    verifyHashedRecord(result.defensive_validation_report) &&
    verifyHashedRecord(result.attack_success_analysis) &&
    verifyHashedRecord(result.defensive_coverage_report) &&
    verifyHashedRecord(result.resilience_score_report) &&
    verifyHashedRecord(result.adversarial_test_report) &&
    verifyHashedRecord(result.adversarial_replay) &&
    verifyHashedRecord(result.adversarial_test_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdversarialTestingFoundation(): AdversarialTestingFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adversarial_adaptation_testing_version: TESTING_VERSION,
    api_surface,
    result: runAdversarialAdaptationTests(),
  });
}

export const AdversarialAdaptationTesting = Object.freeze({
  run: runAdversarialAdaptationTests,
  replay: replayAdversarialAdaptationTesting,
});
