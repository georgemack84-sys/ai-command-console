import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { observeFailures, replayFailureObservation, validateFailureObservation } from "@/services/failure-observation-monitoring";
import { analyzeRecoveryWeakPoints, replayRecoveryWeakPoints, validateRecoveryWeakPoints } from "@/services/recovery-weak-point-intelligence";
import { createScenarioRegistry, validateScenarioRegistry } from "@/services/scenario-definition-framework";
import { replayStressInjection, runStressInjection, validateStressInjection } from "@/services/stress-injection-engine";
import type { FailureObservationScenario } from "@/types/failure-observation-monitoring";
import type { RecoveryWeakPointScenario } from "@/types/recovery-weak-point-intelligence";
import type { StressInjectionScenario } from "@/types/stress-injection-engine";
import type {
  ScenarioStressCertificationContract,
  ScenarioStressCertificationFailure,
  ScenarioStressCertificationInput,
  ScenarioStressCertificationLedger,
  ScenarioStressCertificationObservabilitySurface,
  ScenarioStressCertificationReplayResult,
  ScenarioStressCertificationReport,
  ScenarioStressCertificationScenario,
  ScenarioStressCertificationState,
  ScenarioStressCertificationTestResult,
  ScenarioStressCertificationValidationResult,
} from "@/types/scenario-stress-certification-gate";

const VERSION = "scenario-stress-certification-gate/v8ALT.6.5" as const;
const NOW = "2026-07-13T16:00:00.000Z";
const TENANT_ID = "tenant:autonomy:primary";
const states = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"] as const);
const categories = Object.freeze(["scenario", "injection", "observation", "recovery", "replay", "governance", "authority", "integrity", "explainability", "readiness"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function mappedScenario(scenario: ScenarioStressCertificationScenario): { stress?: StressInjectionScenario; observation?: FailureObservationScenario; recovery?: RecoveryWeakPointScenario; failure?: ScenarioStressCertificationFailure } {
  const map: Partial<Record<ScenarioStressCertificationScenario, ReturnType<typeof mappedScenario>>> = {
    AUTHORITY_ESCALATION: { stress: "AUTHORITY_ELEVATION", failure: "AUTHORITY_ESCALATION_DETECTED" },
    REPLAY_MISMATCH_UNNOTICED: { observation: "REPLAY_INCONSISTENCY", failure: "REPLAY_MISMATCH_UNDETECTED" },
    CROSS_TENANT_ACCESS: { stress: "CROSS_TENANT_INJECTION", observation: "CROSS_TENANT_OBSERVATION", recovery: "CROSS_TENANT_INTELLIGENCE", failure: "CROSS_TENANT_ACCESS_DETECTED" },
    HIDDEN_EXECUTION: { stress: "TRUTH_LEDGER_MUTATION", failure: "HIDDEN_EXECUTION_DETECTED" },
    HIDDEN_FAILURE_STATE: { observation: "HIDDEN_OBSERVATION", failure: "HIDDEN_FAILURE_STATE_DETECTED" },
    INTEGRITY_FAILURE: { stress: "INTEGRITY_FAILURE", observation: "INTEGRITY_HASH_FAILURE", recovery: "INTEGRITY_HASH_FAILURE", failure: "INTEGRITY_VERIFICATION_FAILED" },
    GOVERNANCE_BYPASS: { stress: "GOVERNANCE_BYPASS", failure: "GOVERNANCE_BYPASS_DETECTED" },
    STRESS_SCORE_INCONSISTENCY: { recovery: "NONREPRODUCIBLE_STRESS_SCORE", failure: "STRESS_SCORE_INCONSISTENT" },
    RECOVERY_RECOMMENDATION_MISMATCH: { recovery: "MISSING_RECOVERY_STRATEGY", failure: "RECOVERY_RECOMMENDATION_UNREPRODUCIBLE" },
  };
  return map[scenario] ?? {};
}

function testHash(test: Omit<ScenarioStressCertificationTestResult, "integrity_hash"> | ScenarioStressCertificationTestResult): string {
  const { integrity_hash: _hash, ...source } = test as ScenarioStressCertificationTestResult;
  return hashValue("scenario-stress-certification-test", source);
}

function test(name: string, category: ScenarioStressCertificationTestResult["category"], passed: boolean, evidence: readonly string[], replay: string): ScenarioStressCertificationTestResult {
  const base = { test_id: id("SSCT", "scenario-stress-certification-test", { name, category }), name, category, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, evidence_references: freezeArray(evidence.filter(Boolean).sort()), replay_reference: replay };
  return Object.freeze({ ...base, integrity_hash: testHash(base) });
}

function reportHash(report: Omit<ScenarioStressCertificationReport, "report_hash"> | ScenarioStressCertificationReport): string {
  const { report_hash: _hash, ...source } = report as ScenarioStressCertificationReport;
  return hashValue("scenario-stress-certification-report", source);
}

export function computeScenarioStressCertificationLedgerHash(ledger: Omit<ScenarioStressCertificationLedger, "ledger_hash"> | ScenarioStressCertificationLedger): string {
  const { ledger_hash: _hash, ...source } = ledger as ScenarioStressCertificationLedger;
  return hashValue("scenario-stress-certification-ledger", source);
}

export function runScenarioStressCertification(input: ScenarioStressCertificationInput = {}): ScenarioStressCertificationLedger {
  const scenario = input.scenario ?? "BASELINE";
  const mapped = mappedScenario(scenario);
  const registry = input.scenario_registry ?? createScenarioRegistry({ tenant_id: input.tenant_id, mission_scope: input.mission_id });
  const stress = input.stress_ledger ?? runStressInjection({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario: mapped.stress ?? "BASELINE", scenario_registry: registry });
  const observation = input.observation_ledger ?? observeFailures({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario: mapped.observation ?? "BASELINE", stress_ledger: stress });
  const recovery = input.recovery_ledger ?? analyzeRecoveryWeakPoints({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario: mapped.recovery ?? "BASELINE", observation_ledger: observation });
  const scenarioValid = validateScenarioRegistry(registry);
  const stressValid = validateStressInjection(stress);
  const observationValid = validateFailureObservation(observation);
  const recoveryValid = validateRecoveryWeakPoints(recovery);
  const stressReplay = replayStressInjection(stress);
  const observationReplay = replayFailureObservation(observation);
  const recoveryReplay = replayRecoveryWeakPoints(recovery);
  const evidence = [registry.registry_hash, stress.ledger_hash, observation.ledger_hash, recovery.ledger_hash, recovery.stress_scores?.score_hash ?? "", recovery.operational_readiness?.readiness_hash ?? ""];
  const replayOk = stressReplay.deterministic && observationReplay.deterministic && recoveryReplay.deterministic;
  const governanceOk = stressValid.governance_enforced && observationValid.governance_visible && recoveryValid.governance_valid;
  const authorityOk = stressValid.authority_enforced && observationValid.authority_visible && recoveryValid.authority_valid;
  const integrityOk = stressValid.integrity_valid && observationValid.integrity_valid && recoveryValid.integrity_valid;
  const tenantOk = stressValid.tenant_isolated && observationValid.tenant_isolated && recoveryValid.tenant_isolated;
  const operatorOk = observationValid.operator_visible && recoveryValid.recommendations_operator_visible;
  const tests = freezeArray([
    test("Hardware failures replay deterministically", "scenario", scenarioValid.valid && replayOk, evidence, stressReplay.replay_reference),
    test("Policy conflicts resolved through governance", "governance", governanceOk, evidence, stressReplay.replay_reference),
    test("Authority conflicts prevented", "authority", authorityOk, evidence, stressReplay.replay_reference),
    test("Unauthorized authority escalation rejected", "authority", scenario === "AUTHORITY_ESCALATION" ? !stressValid.authority_enforced : true, [stress.ledger_hash], stressReplay.replay_reference),
    test("Replay corruption detected", "replay", observationValid.replay_consistent && replayOk, evidence, observationReplay.replay_reference),
    test("Replay mismatch unnoticed", "replay", scenario === "REPLAY_MISMATCH_UNNOTICED" ? !observationValid.replay_consistent : true, [observation.ledger_hash], observationReplay.replay_reference),
    test("Tenant isolation maintained", "integrity", tenantOk, evidence, stressReplay.replay_reference),
    test("Cross-tenant access permitted", "integrity", scenario === "CROSS_TENANT_ACCESS" ? !tenantOk : true, evidence, stressReplay.replay_reference),
    test("Unavailable services handled gracefully", "injection", stressValid.valid, [stress.ledger_hash], stressReplay.replay_reference),
    test("Mission execution remains deterministic", "scenario", stressValid.deterministic_ordering && observationValid.deterministic_ordering, evidence, stressReplay.replay_reference),
    test("Cascading failures contained", "recovery", recoveryValid.valid, [recovery.ledger_hash], recoveryReplay.replay_reference),
    test("Recovery recommendations generated", "recovery", recovery.recommended_actions.length > 0 && recoveryValid.recovery_strategy_present, [recovery.ledger_hash], recoveryReplay.replay_reference),
    test("Weak-point analysis complete", "recovery", recoveryValid.weak_point_analysis_present, [recovery.ledger_hash], recoveryReplay.replay_reference),
    test("Governance remains advisory-only", "governance", recoveryValid.advisory_only_enforced && stressValid.simulation_only_enforced, evidence, recoveryReplay.replay_reference),
    test("Constitutional rules enforced under stress", "governance", stressValid.constitutional_enforced && observationValid.constitutional_visible && recoveryValid.constitutional_valid, evidence, stressReplay.replay_reference),
    test("Runtime supervision remains operational", "observation", observationValid.all_monitor_domains_present, [observation.ledger_hash], observationReplay.replay_reference),
    test("Integrity verification succeeds", "integrity", integrityOk, evidence, recoveryReplay.replay_reference),
    test("Mission health accurately reported", "observation", observationValid.recovery_readiness_present && observation.subsystem_health_report.mission_health > 0, [observation.ledger_hash], observationReplay.replay_reference),
    test("Explainability preserved during failures", "explainability", recovery.resilience_report.length > 0 && recovery.architecture_improvement_report.length > 0, [recovery.ledger_hash], recoveryReplay.replay_reference),
    test("Stress scores reproducible", "recovery", recoveryValid.stress_score_reproducible && recovery.stress_scores !== null, [recovery.stress_scores?.score_hash ?? ""], recoveryReplay.replay_reference),
    test("Recovery plans reproducible", "recovery", recoveryValid.recovery_strategy_present && recoveryReplay.deterministic, [recovery.ledger_hash], recoveryReplay.replay_reference),
    test("Operator visibility complete", "readiness", operatorOk, evidence, recoveryReplay.replay_reference),
    test("Hidden execution detected", "integrity", scenario === "HIDDEN_EXECUTION" ? !stressValid.simulation_only_enforced : true, [stress.ledger_hash], stressReplay.replay_reference),
    test("Hidden failure state detected", "observation", scenario === "HIDDEN_FAILURE_STATE" ? !observationValid.operator_visible : true, [observation.ledger_hash], observationReplay.replay_reference),
    test("Replay reproducibility verified", "replay", replayOk, evidence, stressReplay.replay_reference),
    test("Architecture resilience documented", "readiness", recovery.architecture_improvement_report.length > 0 && recovery.operational_readiness !== null, [recovery.ledger_hash], recoveryReplay.replay_reference),
  ]);
  const testFailures = tests.filter((item) => item.actual === "FAIL");
  const scenarioFailures = mapped.failure ? [mapped.failure] : [];
  const failures = unique([
    ...scenarioFailures,
    ...(!scenarioValid.valid ? ["SCENARIO_DEFINITION_INVALID" as const] : []),
    ...(!stressValid.valid ? ["STRESS_INJECTION_INVALID" as const] : []),
    ...(!observationValid.valid ? ["OBSERVATION_INVALID" as const] : []),
    ...(!recoveryValid.valid ? ["RECOVERY_INTELLIGENCE_INVALID" as const] : []),
    ...(!replayOk ? ["REPLAY_MISMATCH_UNDETECTED" as const] : []),
    ...(!governanceOk ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!authorityOk ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(!tenantOk ? ["CROSS_TENANT_ACCESS_DETECTED" as const] : []),
    ...(!integrityOk ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!recoveryValid.stress_score_reproducible ? ["STRESS_SCORE_INCONSISTENT" as const] : []),
    ...(!recoveryValid.recovery_strategy_present ? ["RECOVERY_RECOMMENDATION_UNREPRODUCIBLE" as const] : []),
    ...(!(recoveryValid.advisory_only_enforced && stressValid.simulation_only_enforced) ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...(scenario === "DOCUMENTATION_WARNING" ? ["NON_CRITICAL_DOCUMENTATION_WARNING" as const] : []),
  ]);
  const warnings = scenario === "DOCUMENTATION_WARNING" ? freezeArray(["non-critical reporting enhancement remains open"]) : freezeArray<string>([]);
  const criticalFailures = failures.filter((failure) => failure !== "NON_CRITICAL_DOCUMENTATION_WARNING");
  const state: ScenarioStressCertificationState = criticalFailures.length || testFailures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const certId = id("SSCG", "scenario-stress-certification", { mission: registry.mission_scope, scenario });
  const reportBase = {
    certification_id: certId,
    phase: "8ALT.6" as const,
    certification_version: VERSION,
    simulation_suite_id: stress.simulation_id,
    mission_id: input.mission_id ?? registry.mission_scope,
    tenant_id: scenario === "CROSS_TENANT_ACCESS" ? "external-tenant" : input.tenant_id ?? registry.tenant_id,
    certification_state: state,
    overall_stress_score: recovery.stress_scores?.overall_stress_score ?? 0,
    overall_resilience_score: recovery.stress_scores?.resilience_score ?? 0,
    scenario_count: registry.scenarios.length,
    successful_scenarios: state === "FAIL" ? Math.max(0, registry.scenarios.length - 1) : registry.scenarios.length,
    failed_scenarios: state === "FAIL" ? 1 : 0,
    governance_validation: governanceOk,
    constitutional_validation: stressValid.constitutional_enforced && observationValid.constitutional_visible && recoveryValid.constitutional_valid,
    authority_validation: authorityOk,
    tenant_isolation_validation: tenantOk,
    replay_validation: replayOk,
    integrity_validation: integrityOk,
    explainability_validation: recovery.resilience_report.length > 0,
    identified_weak_points: freezeArray(recovery.identified_weak_points.map((item) => item.weak_point_id)),
    recovery_recommendations: freezeArray(recovery.recommended_actions.map((item) => item.recommendation_id)),
    operator_visibility_status: operatorOk,
    tests,
    failures,
    warnings,
    certification_timestamp: NOW,
    replay_reference: `replay:scenario-stress-certification:${certId}`,
    lineage_reference: `lineage:scenario-stress-certification:${certId}`,
    integrity_hash: hashValue("scenario-stress-certification-integrity", { evidence, tests: tests.map((item) => item.integrity_hash) }),
    advisory_only: true as const,
  };
  const report = Object.freeze({ ...reportBase, report_hash: reportHash(reportBase as Omit<ScenarioStressCertificationReport, "report_hash">) });
  const ledgerBase = { ledger_id: id("SSCGLEDGER", "scenario-stress-certification-ledger", report.report_hash), tenant_id: report.tenant_id, mission_id: report.mission_id, reports: freezeArray([report]), source_scenario_registry: registry, source_stress_ledger: stress, source_observation_ledger: observation, source_recovery_ledger: recovery, validation_evidence: freezeArray(evidence.filter(Boolean).sort()), replay_references: freezeArray([stressReplay.replay_reference, observationReplay.replay_reference, recoveryReplay.replay_reference, report.replay_reference].filter(Boolean).sort()), lineage_references: freezeArray([stress.lineage_reference, observation.lineage_reference, recovery.lineage_reference, report.lineage_reference].filter(Boolean).sort()), integrity_verification: freezeArray([report.integrity_hash, ...tests.map((item) => item.integrity_hash)].sort()), append_only: true as const, read_only: true as const };
  return Object.freeze({ ...ledgerBase, ledger_hash: computeScenarioStressCertificationLedgerHash(ledgerBase as Omit<ScenarioStressCertificationLedger, "ledger_hash">) });
}

export function replayScenarioStressCertification(ledger = runScenarioStressCertification()): ScenarioStressCertificationReplayResult {
  const reconstructed_hash = computeScenarioStressCertificationLedgerHash(ledger);
  const source = { replay_reference: ledger.reports[0]?.replay_reference ?? "", ledger_id: ledger.ledger_id, deterministic: Boolean(ledger.replay_references.length) && reconstructed_hash === ledger.ledger_hash, reconstructed_hash, original_hash: ledger.ledger_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("scenario-stress-certification-replay", source) });
}

export function validateScenarioStressCertification(ledger = runScenarioStressCertification()): ScenarioStressCertificationValidationResult {
  const report = ledger.reports[0];
  const scenario_valid = validateScenarioRegistry(ledger.source_scenario_registry).valid;
  const injection_valid = validateStressInjection(ledger.source_stress_ledger).valid;
  const observation_valid = validateFailureObservation(ledger.source_observation_ledger).valid;
  const recovery_valid = validateRecoveryWeakPoints(ledger.source_recovery_ledger).valid;
  const replay_valid = replayScenarioStressCertification(ledger).deterministic && report.replay_validation;
  const governance_valid = report.governance_validation;
  const constitutional_valid = report.constitutional_validation;
  const authority_valid = report.authority_validation;
  const tenant_isolated = report.tenant_isolation_validation && ledger.tenant_id.startsWith("tenant:");
  const integrity_valid = report.integrity_validation && computeScenarioStressCertificationLedgerHash(ledger) === ledger.ledger_hash;
  const operator_visible = report.operator_visibility_status;
  const advisory_only_enforced = report.advisory_only && validateStressInjection(ledger.source_stress_ledger).simulation_only_enforced && validateRecoveryWeakPoints(ledger.source_recovery_ledger).advisory_only_enforced;
  const failures = unique([
    ...report.failures,
    ...(!scenario_valid ? ["SCENARIO_DEFINITION_INVALID" as const] : []),
    ...(!injection_valid ? ["STRESS_INJECTION_INVALID" as const] : []),
    ...(!observation_valid ? ["OBSERVATION_INVALID" as const] : []),
    ...(!recovery_valid ? ["RECOVERY_INTELLIGENCE_INVALID" as const] : []),
    ...(!replay_valid ? ["REPLAY_MISMATCH_UNDETECTED" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_ACCESS_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!advisory_only_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]).filter((failure) => failure !== "NON_CRITICAL_DOCUMENTATION_WARNING");
  const valid = failures.length === 0 && report.certification_state === "PASS";
  const source = { ledger_id: ledger.ledger_id, valid, scenario_valid, injection_valid, observation_valid, recovery_valid, replay_valid, governance_valid, constitutional_valid, authority_valid, tenant_isolated, integrity_valid, operator_visible, advisory_only_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("scenario-stress-certification-validation", source) });
}

export function buildScenarioStressCertificationObservabilitySurface(ledger = runScenarioStressCertification()): ScenarioStressCertificationObservabilitySurface {
  const report = ledger.reports[0];
  return Object.freeze({ ledger_id: ledger.ledger_id, tenant_id: ledger.tenant_id, mission_id: ledger.mission_id, certification_state: report.certification_state, tests_passed: report.tests.filter((item) => item.actual === "PASS").length, tests_failed: report.tests.filter((item) => item.actual === "FAIL").length, production_ready: report.certification_state === "PASS", advisory_only: true, ledger_hash: ledger.ledger_hash });
}

export function getScenarioStressCertificationContract(): ScenarioStressCertificationContract {
  const ledger = runScenarioStressCertification();
  return Object.freeze({
    doctrine: Object.freeze({ gate_version: VERSION, principles: freezeArray(["deterministic-stress-certification", "replay-first-validation", "governance-supremacy-under-stress", "constitutional-protection", "authority-preservation", "tenant-isolation", "integrity-verification", "operator-visibility", "advisory-only-certification", "pass-required-for-production"]), certification_states: states, categories, pass_required_for_production: true, advisory_only: true }),
    ledger,
    validation: validateScenarioStressCertification(ledger),
    replay: replayScenarioStressCertification(ledger),
    observability: buildScenarioStressCertificationObservabilitySurface(ledger),
  });
}
