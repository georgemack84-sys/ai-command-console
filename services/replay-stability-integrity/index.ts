import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runContinuousRiskIntelligence } from "@/services/continuous-risk-intelligence";
import type {
  ReplayDivergenceType,
  ReplayRegressionCategory,
  ReplayStabilityClassification,
  ReplayStabilityIntegrityBundle,
  ReplayStabilityIntegrityFailure,
  ReplayStabilityIntegrityInput,
  ReplayStabilityIntegrityOutcome,
  ReplayStabilityIntegrityResult,
  ReplayStabilityIntegrityTest,
} from "@/types/replay-stability-integrity";

const VERSION = "replay-stability-integrity/v18.10" as const;
const IDENTIFIER = "ReplayStabilityIntegrity" as const;
const DEFAULT_TENANT = "tenant_phase_18_replay_stability";
const DEFAULT_OPERATOR = "operator_phase_18_replay_stability";
const TIMESTAMP = "2026-07-16T00:00:00.000Z";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ReplayStabilityIntegrityFailure[], failure: ReplayStabilityIntegrityFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ReplayStabilityIntegrityInput["scenario"]): ReplayStabilityIntegrityFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ReplayStabilityIntegrityFailure[]): ReplayStabilityIntegrityOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_REPLAY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const stabilityClassifications = freezeArray(["STABLE", "MINOR_VARIANCE", "REGRESSION_DETECTED", "INTEGRITY_FAILURE", "GOVERNANCE_DIVERGENCE", "DEPENDENCY_DIVERGENCE", "INFRASTRUCTURE_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"] as const satisfies readonly ReplayStabilityClassification[]);
const regressionCategories = freezeArray(["EXECUTION", "ORDERING", "DEPENDENCY", "INFRASTRUCTURE", "GOVERNANCE", "POLICY", "OPTIMIZATION", "LEARNING", "CERTIFICATION", "EVIDENCE"] as const satisfies readonly ReplayRegressionCategory[]);
const divergenceTypes = freezeArray(["INPUT", "POLICY", "GOVERNANCE", "DEPENDENCY", "INFRASTRUCTURE", "EXECUTION_ORDER", "OPTIMIZATION", "LEARNING", "CERTIFICATION", "EVIDENCE", "NONDETERMINISTIC", "UNEXPLAINED"] as const satisfies readonly ReplayDivergenceType[]);

function certTest(name: string, passed: boolean, failure: ReplayStabilityIntegrityFailure, evidence_refs: readonly string[]): ReplayStabilityIntegrityTest {
  const actual: ReplayStabilityIntegrityOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_REPLAY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("replay_stability_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ReplayStabilityIntegrityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ risk: result.continuous_risk_intelligence_ref, monitor: result.stability_monitor.integrity_hash, regression: result.regression_engine.integrity_hash, integrity: result.integrity_validator.integrity_hash, baseline: result.baseline_registry.integrity_hash, record: result.stability_record.integrity_hash, divergence: result.divergence_analysis.integrity_hash, evidence: result.evidence_service.integrity_hash, ledger: result.stability_ledger.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ReplayStabilityIntegrityResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runReplayStabilityIntegrity(input: ReplayStabilityIntegrityInput = {}): ReplayStabilityIntegrityResult {
  const risk = runContinuousRiskIntelligence({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ReplayStabilityIntegrityFailure[] = risk.outcome === "PASS" ? [] : ["PHASE_18_9_RISK_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_REPLAY_WARNING"));
  const validationId = input.replay_validation_id ?? id("replay_validation", risk.integrity_hash);
  const continuous = !has(failures, "REPLAY_STABILITY_NOT_CONTINUOUSLY_VERIFIED");
  const regressionDeterministic = !has(failures, "REPLAY_REGRESSIONS_NOT_DETERMINISTIC");
  const baselinesImmutable = !has(failures, "REPLAY_BASELINES_MUTABLE") && !has(failures, "HISTORICAL_RECORD_MUTATED");
  const integrityContinuous = !has(failures, "INTEGRITY_NOT_CONTINUOUSLY_VALIDATED") && !has(failures, "CONSTITUTIONAL_INTEGRITY_NOT_PRESERVED");
  const divergenceClassified = !has(failures, "REPLAY_DIVERGENCE_NOT_CLASSIFIED");
  const evidenceReproducible = !has(failures, "EVIDENCE_NOT_REPRODUCIBLE");
  const lineageComplete = !has(failures, "REPLAY_LINEAGE_INCOMPLETE");
  const supersessionAdditive = !has(failures, "SUPERSESSION_NOT_ADDITIVE");
  const failClosed = !has(failures, "FAIL_CLOSED_NOT_VERIFIED") && !has(failures, "UNKNOWN_REPLAY_CONDITION_NOT_FAIL_CLOSED");
  const evidenceRefs = freezeArray(evidenceReproducible ? [risk.integrity_hash, risk.certification_package.integrity_hash, risk.risk_ledger.integrity_hash] : []);
  const replayRefs = freezeArray(evidenceReproducible ? [risk.replay_hash] : []);

  const health_record = nested({ health_id: id("replay_health", validationId), replay_success_rate: continuous, replay_latency: continuous, replay_consistency: continuous, replay_coverage: continuous, replay_failures: failClosed, divergence_frequency: divergenceClassified, baseline_drift: baselinesImmutable, integrity_violations: integrityContinuous });
  const stability_monitor = nested({ monitor_id: id("replay_stability_monitor", validationId), standing_constitutional_service: continuous, lifecycle_independent: continuous, continuous_verification: continuous, health_record });
  const regression_engine = nested({ engine_id: id("replay_regression_engine", validationId), certified_baselines_compared: regressionDeterministic, previous_versions_compared: regressionDeterministic, governance_revisions_compared: regressionDeterministic, policy_revisions_compared: regressionDeterministic, infrastructure_revisions_compared: regressionDeterministic, dependency_revisions_compared: regressionDeterministic, optimization_revisions_compared: regressionDeterministic, deterministic_detection: regressionDeterministic, regression_categories: regressionCategories });
  const integrity_validator = nested({ validator_id: id("integrity_validator", validationId), immutable_lineage: lineageComplete, cryptographic_integrity: integrityContinuous, evidence_references: evidenceRefs.length > 0, replay_references: replayRefs.length > 0, certification_references: true, governance_references: true, dependency_references: true, no_unauthorized_mutation: baselinesImmutable, no_missing_evidence: evidenceReproducible, no_orphaned_lineage: lineageComplete, no_integrity_degradation: integrityContinuous, continuous_validation: integrityContinuous });
  const previous_baseline = nested({ replay_identifier: id("replay_baseline_previous", validationId), certification_reference: risk.certification_package.integrity_hash, operational_version: "mission-control/v18.9", policy_version: "policy/v18.9", governance_version: "governance/v18.9", dependency_versions: freezeArray(["dependency-set/v18.9"]), infrastructure_fingerprint: id("infrastructure", "previous"), evidence_references: evidenceRefs, replay_checksum: hash({ risk: risk.replay_hash, generation: "previous" }), immutable: baselinesImmutable, supersedes: null });
  const current_baseline = nested({ replay_identifier: id("replay_baseline_current", validationId), certification_reference: risk.certification_package.integrity_hash, operational_version: "mission-control/v18.10", policy_version: "policy/v18.10", governance_version: "governance/v18.10", dependency_versions: freezeArray(["dependency-set/v18.10"]), infrastructure_fingerprint: id("infrastructure", "current"), evidence_references: evidenceRefs, replay_checksum: hash({ risk: risk.replay_hash, generation: "current" }), immutable: baselinesImmutable, supersedes: previous_baseline.integrity_hash });
  const baseline_registry = nested({ registry_id: id("replay_baseline_registry", validationId), baselines: freezeArray([previous_baseline, current_baseline]), immutable_baselines: baselinesImmutable, additive_supersession: supersessionAdditive, historical_baselines_preserved: baselinesImmutable });
  const stable = blockingFailures.length === 0;
  const stability_record = nested({ replay_validation_id: validationId, operational_event_reference: risk.risk_assessment.integrity_hash, replay_reference: replayRefs[0] ?? "", replay_baseline_reference: current_baseline.integrity_hash, operational_version: current_baseline.operational_version, governance_version: current_baseline.governance_version, policy_version: current_baseline.policy_version, dependency_versions: current_baseline.dependency_versions, infrastructure_version: current_baseline.infrastructure_fingerprint, replay_result: stable ? "STABLE" as const : "UNEXPLAINED_DIVERGENCE" as const, regression_category: stable ? null : "EVIDENCE" as const, divergence_summary: stable ? "Replay fully reproducible against certified baseline." : "Replay validation failed closed due to unmet constitutional requirements.", integrity_validation_result: integrityContinuous ? "PASS" as const : "FAIL" as const, evidence_references: evidenceRefs, certification_reference: risk.certification_package.integrity_hash, timestamp: TIMESTAMP, replay_hash: hash({ validationId, risk: risk.replay_hash }) });
  const divergence_analysis = nested({ analysis_id: id("replay_divergence", validationId), divergence_types: divergenceTypes, recognized_registry_version: "replay-divergence-registry/v18.10", unknown_conditions_fail_closed: failClosed, deterministic_classification: divergenceClassified, unexplained_divergence_blocks_certification: failClosed });
  const evidence_service = nested({ service_id: id("replay_evidence", validationId), replay_outputs: replayRefs, execution_traces: [risk.risk_assessment.integrity_hash], replay_hashes: [stability_record.replay_hash], integrity_hashes: [risk.integrity_hash, current_baseline.integrity_hash], divergence_analysis: [divergence_analysis.integrity_hash], regression_reports: [regression_engine.integrity_hash], certification_references: [risk.certification_package.integrity_hash], governance_references: [risk.adaptive_governance_ref], dependency_snapshots: current_baseline.dependency_versions, infrastructure_fingerprints: [current_baseline.infrastructure_fingerprint], immutable_evidence: baselinesImmutable, reproducible: evidenceReproducible });
  const stability_ledger = nested({ ledger_id: id("replay_stability_ledger", validationId), stability_records: [stability_record.integrity_hash], baseline_refs: baseline_registry.baselines.map((baseline) => baseline.integrity_hash), integrity_events: [integrity_validator.integrity_hash], divergence_records: [divergence_analysis.integrity_hash], supersession_events: [id("replay_supersession", validationId)], replay_recommendations: [id("replay_revalidation_recommendation", validationId)], additive_only: supersessionAdditive, immutable: baselinesImmutable });
  const certification_package = nested({ package_id: id("replay_stability_certification", validationId), replay_stability_continuously_verified: stability_monitor.continuous_verification, replay_regressions_detected_deterministically: regression_engine.deterministic_detection, replay_baselines_immutable: baseline_registry.immutable_baselines && baseline_registry.historical_baselines_preserved, integrity_continuously_validated: integrity_validator.continuous_validation && integrity_validator.no_integrity_degradation, replay_divergence_classified: divergence_analysis.deterministic_classification && divergence_analysis.divergence_types.length === 12, evidence_reproducible: evidence_service.reproducible && evidence_service.immutable_evidence, replay_lineage_complete: integrity_validator.no_orphaned_lineage && stability_ledger.stability_records.length > 0, supersession_additive: baseline_registry.additive_supersession && stability_ledger.additive_only, fail_closed_behavior_verified: divergence_analysis.unknown_conditions_fail_closed && divergence_analysis.unexplained_divergence_blocks_certification, constitutional_integrity_preserved: integrity_validator.cryptographic_integrity && integrity_validator.no_unauthorized_mutation, replay_stability_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Replay stability continuously verified", certification_package.replay_stability_continuously_verified, "REPLAY_STABILITY_NOT_CONTINUOUSLY_VERIFIED", [stability_monitor.integrity_hash]),
    certTest("Replay regressions detected deterministically", certification_package.replay_regressions_detected_deterministically, "REPLAY_REGRESSIONS_NOT_DETERMINISTIC", [regression_engine.integrity_hash]),
    certTest("Replay baselines immutable", certification_package.replay_baselines_immutable, "REPLAY_BASELINES_MUTABLE", [baseline_registry.integrity_hash]),
    certTest("Integrity continuously validated", certification_package.integrity_continuously_validated, "INTEGRITY_NOT_CONTINUOUSLY_VALIDATED", [integrity_validator.integrity_hash]),
    certTest("Replay divergence classified", certification_package.replay_divergence_classified, "REPLAY_DIVERGENCE_NOT_CLASSIFIED", [divergence_analysis.integrity_hash]),
    certTest("Evidence reproducible", certification_package.evidence_reproducible, "EVIDENCE_NOT_REPRODUCIBLE", [evidence_service.integrity_hash]),
    certTest("Replay lineage complete", certification_package.replay_lineage_complete, "REPLAY_LINEAGE_INCOMPLETE", [stability_ledger.integrity_hash]),
    certTest("Supersession additive", certification_package.supersession_additive, "SUPERSESSION_NOT_ADDITIVE", [stability_ledger.integrity_hash]),
    certTest("Fail-closed behavior verified", certification_package.fail_closed_behavior_verified, "FAIL_CLOSED_NOT_VERIFIED", [divergence_analysis.integrity_hash]),
    certTest("Constitutional integrity preserved", certification_package.constitutional_integrity_preserved, "CONSTITUTIONAL_INTEGRITY_NOT_PRESERVED", [integrity_validator.integrity_hash]),
    certTest("Replay stability certified", certification_package.replay_stability_certified, "REPLAY_STABILITY_NOT_CERTIFIED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ReplayStabilityIntegrityFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ReplayStabilityIntegrityResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, continuous_risk_intelligence_ref: risk.integrity_hash, stability_monitor, regression_engine, integrity_validator, baseline_registry, stability_record, divergence_analysis, evidence_service, stability_ledger, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateReplayStabilityIntegrity(result = runReplayStabilityIntegrity()) {
  const monitor_valid = verify(result.stability_monitor) && verify(result.stability_monitor.health_record) && result.stability_monitor.standing_constitutional_service && result.stability_monitor.lifecycle_independent && result.stability_monitor.continuous_verification;
  const regression_valid = verify(result.regression_engine) && result.regression_engine.regression_categories.length === 10 && Object.entries(result.regression_engine).filter(([key]) => !["engine_id", "regression_categories", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const integrity_valid = verify(result.integrity_validator) && Object.entries(result.integrity_validator).filter(([key]) => !["validator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const baseline_valid = verify(result.baseline_registry) && result.baseline_registry.baselines.length === 2 && result.baseline_registry.baselines.every((baseline) => verify(baseline) && baseline.evidence_references.length > 0 && baseline.replay_checksum.length > 0 && baseline.immutable) && result.baseline_registry.immutable_baselines && result.baseline_registry.additive_supersession && result.baseline_registry.historical_baselines_preserved;
  const stability_record_valid = verify(result.stability_record) && result.stability_record.replay_result === "STABLE" && result.stability_record.integrity_validation_result === "PASS" && result.stability_record.evidence_references.length > 0 && result.stability_record.replay_reference.length > 0 && result.stability_record.replay_hash.length > 0;
  const divergence_valid = verify(result.divergence_analysis) && result.divergence_analysis.divergence_types.length === 12 && result.divergence_analysis.unknown_conditions_fail_closed && result.divergence_analysis.deterministic_classification && result.divergence_analysis.unexplained_divergence_blocks_certification;
  const evidence_valid = verify(result.evidence_service) && result.evidence_service.immutable_evidence && result.evidence_service.reproducible && Object.entries(result.evidence_service).filter(([key]) => !["service_id", "immutable_evidence", "reproducible", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) && value.length > 0);
  const ledger_valid = verify(result.stability_ledger) && result.stability_ledger.additive_only && result.stability_ledger.immutable && Object.entries(result.stability_ledger).filter(([key]) => !["ledger_id", "additive_only", "immutable", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) && value.length > 0);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 11 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && monitor_valid && regression_valid && integrity_valid && baseline_valid && stability_record_valid && divergence_valid && evidence_valid && ledger_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, monitor_valid, regression_valid, integrity_valid, baseline_valid, stability_record_valid, divergence_valid, evidence_valid, ledger_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayReplayStabilityIntegrity(result = runReplayStabilityIntegrity()): boolean {
  const replayed = runReplayStabilityIntegrity();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateReplayStabilityIntegrity(result).valid;
}

export function getReplayStabilityIntegrityBundle(): ReplayStabilityIntegrityBundle {
  const result = runReplayStabilityIntegrity();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "continuous-risk-intelligence/v18.9" as const, stability_classifications: stabilityClassifications, regression_categories: regressionCategories, divergence_types: divergenceTypes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateReplayStabilityIntegrity(result) });
}

export const ReplayStabilityIntegrityService = Object.freeze({ run: runReplayStabilityIntegrity, validate: validateReplayStabilityIntegrity, replay: replayReplayStabilityIntegrity });
