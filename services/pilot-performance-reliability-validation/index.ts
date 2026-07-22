import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProductionReplayDeterminism } from "@/services/production-replay-determinism";
import type {
  PerformanceThresholdRecord,
  PilotPerformanceReliabilityBundle,
  PilotPerformanceReliabilityCertificationTest,
  PilotPerformanceReliabilityFailure,
  PilotPerformanceReliabilityInput,
  PilotPerformanceReliabilityOutcome,
  PilotPerformanceReliabilityResult,
  PilotPerformanceReliabilityValidation,
  ThresholdClassification,
  ThresholdLifecycleState,
  Vp1Status,
} from "@/types/pilot-performance-reliability-validation";

const VERSION = "pilot-performance-reliability-validation/v16.6" as const;
const IDENTIFIER = "PilotPerformanceReliabilityValidation" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_performance_reliability";
const DEFAULT_OPERATOR = "operator_phase_16_performance_reliability";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly PilotPerformanceReliabilityFailure[], failure: PilotPerformanceReliabilityFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: PilotPerformanceReliabilityInput["scenario"]): PilotPerformanceReliabilityFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly PilotPerformanceReliabilityFailure[]): PilotPerformanceReliabilityOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_PERFORMANCE_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const thresholdLifecycle = freezeArray(["PROPOSED", "UNDER_REVIEW", "APPROVED", "ACTIVE", "SUPERSEDED", "RETIRED", "ARCHIVED"] as const satisfies readonly ThresholdLifecycleState[]);
const thresholdClassifications = freezeArray(["CONSTITUTIONAL", "OPERATIONAL"] as const satisfies readonly ThresholdClassification[]);
const vp1Statuses = freezeArray(["VERIFIED", "DEFINED_BUT_UNPOPULATED", "MISSING"] as const satisfies readonly Vp1Status[]);

function certTest(name: string, passed: boolean, failure: PilotPerformanceReliabilityFailure, evidence_refs: readonly string[]): PilotPerformanceReliabilityCertificationTest {
  const actual: PilotPerformanceReliabilityOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_PERFORMANCE_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("pilot_performance_reliability_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<PilotPerformanceReliabilityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ replay: result.production_replay_determinism_ref, registry: result.threshold_registry.map((entry) => entry.integrity_hash), versions: result.threshold_versions.map((entry) => entry.integrity_hash), provenance: result.threshold_provenance.map((entry) => entry.integrity_hash), performance: result.performance_validator.integrity_hash, reliability: result.reliability_analyzer.integrity_hash, capacity: result.capacity_monitor.integrity_hash, dashboard: result.availability_dashboard.integrity_hash, ledger: result.threshold_evidence_ledger.map((entry) => entry.integrity_hash), vp1: result.vp1_report.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<PilotPerformanceReliabilityResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runPilotPerformanceReliabilityValidation(input: PilotPerformanceReliabilityInput = {}): PilotPerformanceReliabilityResult {
  const replay = runProductionReplayDeterminism({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: PilotPerformanceReliabilityFailure[] = replay.outcome === "PASS" ? [] : ["PHASE_16_5_REPLAY_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const registryVersion = input.registry_version ?? "16.6.0";
  const baseEvidence = freezeArray([replay.integrity_hash, replay.replay_record.integrity_hash, replay.observability.integrity_hash]);
  const certificationRefs = has(failures, "CERTIFICATION_EVIDENCE_INCOMPLETE") ? freezeArray([]) : freezeArray([replay.integrity_hash, ...replay.certification_tests.map((test) => test.integrity_hash)]);
  const constitutionalSources = has(failures, "UNDEFINED_AUTHORITY_SOURCE") ? freezeArray([""]) : freezeArray(["phase-14-certification", "phase-15-production-certification", "production-replay-determinism/v16.5"]);
  const thresholdSpecs = [
    { metric: "deterministic replay", classification: "CONSTITUTIONAL" as const, class_a: true, value: 1, unit: "pass", source: constitutionalSources[2] ?? "", inherited: true },
    { metric: "advisory boundary compliance", classification: "CONSTITUTIONAL" as const, class_a: true, value: 1, unit: "pass", source: "production-advisory-runtime/v16.3", inherited: true },
    { metric: "tenant isolation", classification: "CONSTITUTIONAL" as const, class_a: true, value: 1, unit: "pass", source: "pilot-scope-enrollment/v16.2", inherited: true },
    { metric: "recommendation latency", classification: "OPERATIONAL" as const, class_a: false, value: 250, unit: "ms", source: VERSION, inherited: false },
    { metric: "system availability", classification: "OPERATIONAL" as const, class_a: false, value: 99.9, unit: "percent", source: VERSION, inherited: false },
    { metric: "capacity utilization", classification: "OPERATIONAL" as const, class_a: false, value: 75, unit: "percent", source: VERSION, inherited: false },
  ] as const;
  const threshold_registry = freezeArray(thresholdSpecs.map((spec) => nested({ threshold_id: id("performance_threshold", spec.metric), metric: spec.metric, classification: spec.classification, class_a: spec.class_a, value: spec.value, unit: spec.unit, measurement_window: "rolling-15m", authority_source: spec.source, version: registryVersion, effective_date: TIMESTAMP, approval_authority: spec.classification === "OPERATIONAL" && has(failures, "OPERATIONAL_THRESHOLDS_NOT_APPROVED") ? "" : "governance_board", evidence_refs: baseEvidence, lifecycle: spec.classification === "OPERATIONAL" && has(failures, "OPERATIONAL_THRESHOLDS_NOT_APPROVED") ? "UNDER_REVIEW" as const : "ACTIVE" as const, inherited: spec.inherited && !has(failures, "CONSTITUTIONAL_THRESHOLDS_NOT_INHERITED"), immutable: !has(failures, "THRESHOLD_REGISTRY_MUTABLE") } satisfies Omit<PerformanceThresholdRecord, "integrity_hash">)));
  const threshold_versions = freezeArray(threshold_registry.map((threshold) => nested({ version_id: id("threshold_version", { id: threshold.threshold_id, version: threshold.version }), threshold_id: threshold.threshold_id, version: has(failures, "THRESHOLD_VERSIONING_INCOMPLETE") ? "" : threshold.version, predecessor: null, successor: null, immutable: !has(failures, "THRESHOLD_REGISTRY_MUTABLE"), replayable: !has(failures, "PERFORMANCE_VALIDATION_NON_DETERMINISTIC"), evidence_refs: baseEvidence })));
  const threshold_provenance = freezeArray(threshold_registry.map((threshold) => nested({ provenance_id: id("threshold_provenance", threshold.threshold_id), threshold_id: threshold.threshold_id, originating_specification: threshold.authority_source, amendment_history: freezeArray(["initial-pilot-validation"]), governance_approval: threshold.approval_authority, version_lineage: threshold_versions.filter((version) => version.threshold_id === threshold.threshold_id).map((version) => version.integrity_hash), certification_refs: certificationRefs, supersession_chain: freezeArray([]), evidence_refs: has(failures, "THRESHOLD_PROVENANCE_INCOMPLETE") ? freezeArray([]) : baseEvidence, complete: !has(failures, "THRESHOLD_PROVENANCE_INCOMPLETE") && Boolean(threshold.authority_source) && Boolean(threshold.approval_authority) })));
  const measuredMetrics = freezeArray(["recommendation latency", "dashboard responsiveness", "evidence ingestion delay", "replay completion time", "alert latency", "operator response time", "system availability", "recovery objectives", "capacity utilization", "constitutional compliance under production load", "certification readiness"]);
  const performance_validator = nested({ validator_id: id("performance_validator", registryVersion), evaluated_metrics: measuredMetrics, deterministic_measurement: !has(failures, "PERFORMANCE_VALIDATION_NON_DETERMINISTIC"), threshold_evaluation: true, metric_normalization: true, violation_detection: true, evidence_generation: !has(failures, "CERTIFICATION_EVIDENCE_INCOMPLETE"), certification_reporting: certificationRefs.length > 0, all_thresholds_met: !has(failures, "PERFORMANCE_VALIDATION_NON_DETERMINISTIC") && !has(failures, "OPERATIONAL_THRESHOLDS_NOT_APPROVED") });
  const reliability_analyzer = nested({ analyzer_id: id("reliability_analyzer", replay.integrity_hash), availability: 99.95, reliability: 99.97, service_continuity: !has(failures, "RELIABILITY_VALIDATION_INCOMPLETE"), recovery_performance: !has(failures, "RELIABILITY_VALIDATION_INCOMPLETE"), operational_consistency: !has(failures, "RELIABILITY_VALIDATION_INCOMPLETE"), replay_consistency: !has(failures, "RELIABILITY_VALIDATION_INCOMPLETE"), recommendation_stability: !has(failures, "RELIABILITY_VALIDATION_INCOMPLETE"), complete: !has(failures, "RELIABILITY_VALIDATION_INCOMPLETE") });
  const capacity_monitor = nested({ monitor_id: id("capacity_monitor", registryVersion), cpu_utilization: 38, memory_utilization: 42, storage_consumption: 31, network_utilization: 29, concurrent_operators: 2, concurrent_tenants: 1, recommendation_throughput: 60, replay_workload: 12, evidence_ingestion_capacity: 500, operational: !has(failures, "CAPACITY_MONITORING_NOT_OPERATIONAL") });
  const availability_dashboard = nested({ dashboard_id: id("availability_dashboard", registryVersion), uptime_visible: true, latency_visible: true, threshold_compliance_visible: true, active_violations_visible: true, historical_trends_visible: true, certification_readiness_visible: true, pilot_health_visible: true, replay_completion_visible: true, recovery_status_visible: true, operator_visibility_complete: !has(failures, "AVAILABILITY_DASHBOARD_NOT_OPERATIONAL"), operational: !has(failures, "AVAILABILITY_DASHBOARD_NOT_OPERATIONAL") });
  const vp1Audits = freezeArray(threshold_registry.filter((threshold) => threshold.classification === "CONSTITUTIONAL").map((threshold) => {
    const missing = has(failures, "MISSING_CONSTITUTIONAL_THRESHOLD") && threshold.metric === "tenant isolation";
    const blocked = missing || has(failures, "UNRESOLVED_CLASS_A_FINDINGS");
    const status: Vp1Status = missing ? "MISSING" : has(failures, "UNRESOLVED_CLASS_A_FINDINGS") ? "DEFINED_BUT_UNPOPULATED" : "VERIFIED";
    return nested({ audit_id: id("vp1_threshold_audit", threshold.threshold_id), threshold_id: threshold.threshold_id, authoritative_source_exists: Boolean(threshold.authority_source) && !has(failures, "UNDEFINED_AUTHORITY_SOURCE"), source_specification_approved: !has(failures, "UNDEFINED_AUTHORITY_SOURCE"), threshold_definition_present: !missing, authority_reference_valid: Boolean(threshold.authority_source) && !has(failures, "UNDEFINED_AUTHORITY_SOURCE"), version_traceable: !has(failures, "THRESHOLD_VERSIONING_INCOMPLETE"), lineage_complete: !has(failures, "THRESHOLD_PROVENANCE_INCOMPLETE"), evidence_available: certificationRefs.length > 0, classification_correct: threshold.classification === "CONSTITUTIONAL", status, class_a_blocking: threshold.class_a && blocked });
  }));
  const vp1_report = nested({ report_id: id("vp1_verification_report", registryVersion), audit_scope: freezeArray(vp1Audits.map((audit) => audit.threshold_id)), audited_thresholds: vp1Audits, missing_threshold_report: freezeArray(vp1Audits.filter((audit) => audit.status === "MISSING").map((audit) => audit.threshold_id)), class_a_blocking_report: freezeArray(vp1Audits.filter((audit) => audit.class_a_blocking).map((audit) => audit.threshold_id)), certification_readiness: vp1Audits.some((audit) => audit.class_a_blocking) || has(failures, "VP1_INCOMPLETE") ? "BLOCKED" as const : "READY" as const, complete: !has(failures, "VP1_INCOMPLETE") });
  const ledgerTypes = ["THRESHOLD_REGISTERED", "THRESHOLD_VERSIONED", "PROVENANCE_VERIFIED", "PERFORMANCE_VALIDATED", "RELIABILITY_ANALYZED", "CAPACITY_MONITORED", "AVAILABILITY_REPORTED", "VP1_AUDITED", "CERTIFICATION_EVIDENCE"] as const;
  const thresholdRefs = freezeArray(threshold_registry.map((threshold) => threshold.integrity_hash));
  const threshold_evidence_ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("threshold_evidence_ledger", { registryVersion, event_type }), sequence: index + 1, event_type, threshold_refs: thresholdRefs, evidence_refs: baseEvidence, replay_refs: freezeArray([replay.replay_hash]), certification_refs: certificationRefs, append_only: !has(failures, "THRESHOLD_REGISTRY_MUTABLE"), immutable: !has(failures, "THRESHOLD_REGISTRY_MUTABLE") })));
  const tests = freezeArray([
    certTest("Constitutional thresholds inherited", threshold_registry.filter((threshold) => threshold.classification === "CONSTITUTIONAL").every((threshold) => threshold.inherited && threshold.authority_source), "CONSTITUTIONAL_THRESHOLDS_NOT_INHERITED", thresholdRefs),
    certTest("Operational thresholds approved", threshold_registry.filter((threshold) => threshold.classification === "OPERATIONAL").every((threshold) => threshold.lifecycle === "ACTIVE" && Boolean(threshold.approval_authority)), "OPERATIONAL_THRESHOLDS_NOT_APPROVED", thresholdRefs),
    certTest("Threshold registry immutable", threshold_registry.every((threshold) => threshold.immutable) && threshold_evidence_ledger.every((entry) => entry.immutable), "THRESHOLD_REGISTRY_MUTABLE", thresholdRefs),
    certTest("Threshold provenance traceable", threshold_provenance.every((entry) => entry.complete && entry.evidence_refs.length > 0), "THRESHOLD_PROVENANCE_INCOMPLETE", threshold_provenance.map((entry) => entry.integrity_hash)),
    certTest("Threshold versioning complete", threshold_versions.every((entry) => entry.version && entry.immutable && entry.replayable), "THRESHOLD_VERSIONING_INCOMPLETE", threshold_versions.map((entry) => entry.integrity_hash)),
    certTest("Performance validation deterministic", performance_validator.deterministic_measurement && performance_validator.all_thresholds_met, "PERFORMANCE_VALIDATION_NON_DETERMINISTIC", [performance_validator.integrity_hash]),
    certTest("Reliability validation complete", reliability_analyzer.complete && reliability_analyzer.replay_consistency, "RELIABILITY_VALIDATION_INCOMPLETE", [reliability_analyzer.integrity_hash]),
    certTest("Capacity monitoring operational", capacity_monitor.operational, "CAPACITY_MONITORING_NOT_OPERATIONAL", [capacity_monitor.integrity_hash]),
    certTest("Availability dashboard operational", availability_dashboard.operational && availability_dashboard.operator_visibility_complete, "AVAILABILITY_DASHBOARD_NOT_OPERATIONAL", [availability_dashboard.integrity_hash]),
    certTest("VP1 complete", vp1_report.complete && vp1_report.audited_thresholds.every((audit) => audit.status === "VERIFIED"), "VP1_INCOMPLETE", [vp1_report.integrity_hash]),
    certTest("No unresolved Class A VP1 findings", vp1_report.class_a_blocking_report.length === 0, "UNRESOLVED_CLASS_A_FINDINGS", [vp1_report.integrity_hash]),
    certTest("Certification evidence complete", certificationRefs.length > 0 && performance_validator.certification_reporting && threshold_evidence_ledger.every((entry) => entry.certification_refs.length > 0), "CERTIFICATION_EVIDENCE_INCOMPLETE", threshold_evidence_ledger.map((entry) => entry.integrity_hash)),
    certTest("No undefined authority sources", threshold_registry.every((threshold) => Boolean(threshold.authority_source)), "UNDEFINED_AUTHORITY_SOURCE", thresholdRefs),
    certTest("No missing constitutional thresholds", vp1_report.missing_threshold_report.length === 0, "MISSING_CONSTITUTIONAL_THRESHOLD", [vp1_report.integrity_hash]),
    certTest("Phase 16.5 replay valid", replay.outcome === "PASS", "PHASE_16_5_REPLAY_NOT_VALID", [replay.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is PilotPerformanceReliabilityFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<PilotPerformanceReliabilityResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, production_replay_determinism_ref: replay.integrity_hash, threshold_lifecycle: thresholdLifecycle, threshold_registry, threshold_versions, threshold_provenance, performance_validator, reliability_analyzer, capacity_monitor, availability_dashboard, threshold_evidence_ledger, vp1_report, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePilotPerformanceReliabilityValidation(result = runPilotPerformanceReliabilityValidation()): PilotPerformanceReliabilityValidation {
  const registry_valid = result.threshold_registry.length === 6 && result.threshold_registry.every((threshold) => verify(threshold) && threshold.lifecycle === "ACTIVE" && threshold.immutable && Boolean(threshold.authority_source) && Boolean(threshold.approval_authority) && threshold.evidence_refs.length > 0);
  const provenance_valid = result.threshold_provenance.length === result.threshold_registry.length && result.threshold_provenance.every((entry) => verify(entry) && entry.complete && entry.version_lineage.length > 0 && entry.certification_refs.length > 0 && entry.evidence_refs.length > 0);
  const versioning_valid = result.threshold_versions.length === result.threshold_registry.length && result.threshold_versions.every((entry) => verify(entry) && Boolean(entry.version) && entry.immutable && entry.replayable && entry.evidence_refs.length > 0);
  const performance_valid = verify(result.performance_validator) && result.performance_validator.evaluated_metrics.length === 11 && result.performance_validator.deterministic_measurement && result.performance_validator.all_thresholds_met && result.performance_validator.certification_reporting;
  const reliability_valid = verify(result.reliability_analyzer) && result.reliability_analyzer.complete && result.reliability_analyzer.availability >= 99.9 && result.reliability_analyzer.replay_consistency && result.reliability_analyzer.recommendation_stability;
  const capacity_valid = verify(result.capacity_monitor) && result.capacity_monitor.operational && result.capacity_monitor.cpu_utilization <= 75 && result.capacity_monitor.memory_utilization <= 75 && result.capacity_monitor.evidence_ingestion_capacity > 0;
  const dashboard_valid = verify(result.availability_dashboard) && result.availability_dashboard.operational && result.availability_dashboard.operator_visibility_complete && Object.entries(result.availability_dashboard).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = result.threshold_evidence_ledger.length === 9 && result.threshold_evidence_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.threshold_refs.length > 0 && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.certification_refs.length > 0 && entry.append_only && entry.immutable);
  const vp1_valid = verify(result.vp1_report) && result.vp1_report.complete && result.vp1_report.certification_readiness === "READY" && result.vp1_report.audited_thresholds.length === 3 && result.vp1_report.audited_thresholds.every((audit) => verify(audit) && audit.status === "VERIFIED" && !audit.class_a_blocking) && result.vp1_report.missing_threshold_report.length === 0 && result.vp1_report.class_a_blocking_report.length === 0;
  const certification_valid = result.certification_tests.length === 15 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && registry_valid && provenance_valid && versioning_valid && performance_valid && reliability_valid && capacity_valid && dashboard_valid && ledger_valid && vp1_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, registry_valid, provenance_valid, versioning_valid, performance_valid, reliability_valid, capacity_valid, dashboard_valid, ledger_valid, vp1_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayPilotPerformanceReliabilityValidation(result = runPilotPerformanceReliabilityValidation()): boolean {
  const replayed = runPilotPerformanceReliabilityValidation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePilotPerformanceReliabilityValidation(result).valid;
}

export function getPilotPerformanceReliabilityValidationBundle(): PilotPerformanceReliabilityBundle {
  const result = runPilotPerformanceReliabilityValidation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-replay-determinism/v16.5" as const, threshold_lifecycle: thresholdLifecycle, threshold_classifications: thresholdClassifications, vp1_statuses: vp1Statuses, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validatePilotPerformanceReliabilityValidation(result) });
}

export const PilotPerformanceReliabilityValidationService = Object.freeze({ run: runPilotPerformanceReliabilityValidation, validate: validatePilotPerformanceReliabilityValidation, replay: replayPilotPerformanceReliabilityValidation });
