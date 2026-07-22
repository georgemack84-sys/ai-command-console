import { runContinuousOperationsFoundation } from "@/services/continuous-operations-foundation";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AnomalyCategory,
  ContinuousMonitoringIntelligenceBundle,
  ContinuousMonitoringIntelligenceFailure,
  ContinuousMonitoringIntelligenceInput,
  ContinuousMonitoringIntelligenceOutcome,
  ContinuousMonitoringIntelligenceResult,
  ContinuousMonitoringIntelligenceTest,
  ContinuousMonitoringIntelligenceValidation,
  MonitoringDomain,
  MonitoringLifecycleState,
  OperationalChangeCategory,
  OperationalHealthState,
} from "@/types/continuous-monitoring-intelligence";

const VERSION = "continuous-monitoring-intelligence/v18.2" as const;
const IDENTIFIER = "ContinuousMonitoringIntelligence" as const;
const DEFAULT_TENANT = "tenant_phase_18_monitoring";
const DEFAULT_OPERATOR = "operator_phase_18_monitoring";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousMonitoringIntelligenceFailure[], failure: ContinuousMonitoringIntelligenceFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousMonitoringIntelligenceInput["scenario"]): ContinuousMonitoringIntelligenceFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousMonitoringIntelligenceFailure[]): ContinuousMonitoringIntelligenceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_MONITORING_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["DISCOVER", "OBSERVE", "COLLECT", "ANALYZE", "DETECT", "CLASSIFY", "RECORD", "PUBLISH", "COMPLETE"] as const satisfies readonly MonitoringLifecycleState[]);
const monitoringDomains = freezeArray(["PLATFORM", "INFRASTRUCTURE", "GOVERNANCE", "CERTIFICATION", "REPLAY", "SECURITY"] as const satisfies readonly MonitoringDomain[]);
const changeCategories = freezeArray(["CONFIGURATION_CHANGE", "INFRASTRUCTURE_CHANGE", "DEPENDENCY_CHANGE", "GOVERNANCE_CHANGE", "POLICY_CHANGE", "REPLAY_CHANGE", "CERTIFICATION_CHANGE", "SECURITY_CHANGE"] as const satisfies readonly OperationalChangeCategory[]);
const healthStates = freezeArray(["HEALTHY", "DEGRADED", "WARNING", "UNAVAILABLE", "QUALIFICATION_REQUIRED"] as const satisfies readonly OperationalHealthState[]);
const anomalyCategories = freezeArray(["REPLAY", "DEPENDENCY", "GOVERNANCE", "CERTIFICATION", "PERFORMANCE", "CAPACITY", "SECURITY", "OPERATIONAL"] as const satisfies readonly AnomalyCategory[]);

function certTest(name: string, passed: boolean, failure: ContinuousMonitoringIntelligenceFailure, evidence_refs: readonly string[]): ContinuousMonitoringIntelligenceTest {
  const actual: ContinuousMonitoringIntelligenceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_MONITORING_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_monitoring_intelligence_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousMonitoringIntelligenceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ foundation: result.continuous_operations_foundation_ref, monitor: result.operations_monitor.integrity_hash, health: result.health_analyzer.integrity_hash, performance: result.performance_intelligence.integrity_hash, capacity: result.capacity_intelligence.integrity_hash, change: result.change_detector.integrity_hash, anomaly: result.anomaly_classifier.integrity_hash, cycle: result.monitoring_cycle.integrity_hash, reports: result.output_reports.map((report) => report.integrity_hash), evidence: result.evidence_ledger.map((entry) => entry.integrity_hash), package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousMonitoringIntelligenceResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runContinuousMonitoringIntelligence(input: ContinuousMonitoringIntelligenceInput = {}): ContinuousMonitoringIntelligenceResult {
  const foundation = runContinuousOperationsFoundation({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousMonitoringIntelligenceFailure[] = foundation.outcome === "PASS" ? [] : ["PHASE_18_1_FOUNDATION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_MONITORING_WARNING"));
  const cycleId = input.monitoring_cycle_id ?? id("monitoring_cycle", foundation.operational_identity.operation_id);
  const resourceId = input.monitored_resource_id ?? foundation.operational_identity.service_id;
  const deterministic = !has(failures, "OBSERVATION_NOT_DETERMINISTIC") && !has(failures, "CHANGE_DETECTION_NOT_DETERMINISTIC") && !has(failures, "HEALTH_ASSESSMENT_NOT_DETERMINISTIC");
  const advisory = !has(failures, "MONITORING_HAS_OPERATIONAL_AUTHORITY");
  const monitoringComplete = !has(failures, "MONITORING_INCOMPLETE");
  const awareness = !has(failures, "OPERATIONAL_AWARENESS_NOT_CONTINUOUS");
  const intelligence = !has(failures, "OPERATIONAL_INTELLIGENCE_NOT_REPRODUCIBLE");
  const anomalyCoverage = !has(failures, "ANOMALY_COVERAGE_INCOMPLETE");
  const replayValidated = !has(failures, "MONITORING_REPLAY_NOT_VALIDATED");
  const attribution = !has(failures, "GOVERNANCE_ATTRIBUTION_INCOMPLETE");
  const evidenceImmutable = !has(failures, "MONITORING_EVIDENCE_MUTABLE");
  const compliance = !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_PRESERVED");
  const standingOperational = !has(failures, "STANDING_MONITORING_SERVICES_NOT_OPERATIONAL") && foundation.certification_package.standing_services_defined;
  const operations_monitor = nested({ monitor_id: id("operations_monitor", cycleId), monitoring_domains: monitoringDomains, platform_monitoring: monitoringComplete, service_monitoring: monitoringComplete, lifecycle_monitoring: monitoringComplete, infrastructure_monitoring: monitoringComplete, governance_monitoring: monitoringComplete, certification_monitoring: monitoringComplete, replay_monitoring: monitoringComplete, operational_state_collection: awareness, advisory_only: advisory, deterministic_observation: deterministic });
  const health_analyzer = nested({ analyzer_id: id("platform_health", cycleId), operational_health: compliance ? "HEALTHY" as const : "WARNING" as const, constitutional_compliance: compliance, replay_health: replayValidated, governance_health: attribution, dependency_health: monitoringComplete, regional_health: monitoringComplete, tenant_health: monitoringComplete, service_health: monitoringComplete, deterministic_assessment: deterministic });
  const performance_intelligence = nested({ intelligence_id: id("performance_intelligence", cycleId), throughput_analyzed: intelligence, latency_analyzed: intelligence, utilization_analyzed: intelligence, queue_behavior_analyzed: intelligence, replay_performance_analyzed: intelligence, certification_latency_analyzed: intelligence, governance_latency_analyzed: intelligence, operational_trends_analyzed: intelligence, reproducible: intelligence && deterministic });
  const capacity_intelligence = nested({ intelligence_id: id("capacity_intelligence", cycleId), compute_capacity: intelligence, storage_capacity: intelligence, memory_utilization: intelligence, networking_utilization: intelligence, inference_capacity: intelligence, regional_capacity: intelligence, tenant_allocation: intelligence, operational_headroom: intelligence, reproducible: intelligence && deterministic });
  const evidenceRefs = freezeArray(evidenceImmutable ? [foundation.integrity_hash, foundation.operational_identity.integrity_hash] : []);
  const replayRefs = freezeArray(replayValidated ? [foundation.replay_hash] : []);
  const changes = freezeArray(changeCategories.map((category) => nested({ change_id: id("operational_change", { cycleId, category }), monitoring_cycle_id: cycleId, monitored_resource_id: resourceId, change_category: category, affected_component: resourceId, change_scope: "continuous-operations", detection_source: "deterministic-monitor", detection_reason: `${category.toLowerCase()} evaluation`, detection_result: "NO_CHANGE" as const, governing_policy_ref: attribution ? foundation.governance_rules.integrity_hash : "", constitutional_authority_ref: attribution ? foundation.authority_registry.integrity_hash : "", evidence_refs: evidenceRefs, replay_refs: replayRefs })));
  const change_detector = nested({ detector_id: id("change_detector", cycleId), change_categories: changeCategories, deterministic_detection: deterministic && !has(failures, "CHANGE_DETECTION_NOT_DETERMINISTIC"), configuration_changes: true, infrastructure_changes: true, dependency_changes: true, governance_changes: true, policy_changes: true, replay_changes: true, certification_changes: true, security_changes: true, change_records: changes });
  const anomaly_classifier = nested({ classifier_id: id("anomaly_classifier", cycleId), categories: anomalyCategories, deterministic_classification: deterministic, coverage_complete: anomalyCoverage, anomaly_refs: freezeArray(anomalyCoverage ? anomalyCategories.map((category) => id("anomaly", category)) : []) });
  const cycle = nested({ cycle_id: cycleId, lifecycle: lifecycleStates, immutable_evidence: evidenceImmutable, operational_lineage: foundation.operational_identity.integrity_hash, replay_refs: replayRefs, health_assessments: freezeArray([health_analyzer.integrity_hash]), detected_changes: changes.map((change) => change.integrity_hash), anomaly_classifications: anomaly_classifier.anomaly_refs, complete: monitoringComplete && awareness });
  const reportTypes = ["PLATFORM_HEALTH", "OPERATIONAL_CHANGE", "PERFORMANCE_INTELLIGENCE", "CAPACITY_INTELLIGENCE", "GOVERNANCE_HEALTH", "REPLAY_HEALTH", "CERTIFICATION_HEALTH", "SECURITY_HEALTH"] as const;
  const output_reports = freezeArray(reportTypes.map((report_type) => nested({ report_id: id("monitoring_report", { cycleId, report_type }), report_type, evidence_ref: evidenceRefs[0] ?? "", replay_ref: replayRefs[0] ?? "", governance_ref: attribution ? foundation.governance_rules.integrity_hash : "" })));
  const evidence_ledger = freezeArray(output_reports.map((report, index) => nested({ ledger_entry_id: id("monitoring_evidence", { cycleId, index }), sequence: index + 1, cycle_ref: cycle.integrity_hash, report_ref: report.integrity_hash, change_ref: changes[index % changes.length].integrity_hash, health_ref: health_analyzer.integrity_hash, anomaly_ref: anomaly_classifier.anomaly_refs[index % Math.max(1, anomaly_classifier.anomaly_refs.length)] ?? "", replay_ref: replayRefs[0] ?? "", governance_ref: attribution ? foundation.governance_rules.integrity_hash : "", append_only: evidenceImmutable, immutable: evidenceImmutable })));
  const certification_package = nested({ package_id: id("monitoring_certification", cycleId), monitoring_complete: cycle.complete && operations_monitor.platform_monitoring, operational_awareness_continuous: awareness && operations_monitor.operational_state_collection, change_detection_deterministic: change_detector.deterministic_detection, operational_intelligence_reproducible: performance_intelligence.reproducible && capacity_intelligence.reproducible, health_assessment_deterministic: health_analyzer.deterministic_assessment, anomaly_coverage_complete: anomaly_classifier.coverage_complete && anomaly_classifier.anomaly_refs.length === anomalyCategories.length, monitoring_replay_validated: cycle.replay_refs.length > 0, governance_attribution_complete: changes.every((change) => change.governing_policy_ref.length > 0 && change.constitutional_authority_ref.length > 0), immutable_monitoring_evidence_verified: evidence_ledger.every((entry) => entry.append_only && entry.immutable), constitutional_compliance_preserved: compliance && operations_monitor.advisory_only, standing_monitoring_services_operational: standingOperational, phase_18_2_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Monitoring complete", certification_package.monitoring_complete, "MONITORING_INCOMPLETE", [operations_monitor.integrity_hash]),
    certTest("Operational awareness continuous", certification_package.operational_awareness_continuous, "OPERATIONAL_AWARENESS_NOT_CONTINUOUS", [cycle.integrity_hash]),
    certTest("Change detection deterministic", certification_package.change_detection_deterministic, "CHANGE_DETECTION_NOT_DETERMINISTIC", [change_detector.integrity_hash]),
    certTest("Operational intelligence reproducible", certification_package.operational_intelligence_reproducible, "OPERATIONAL_INTELLIGENCE_NOT_REPRODUCIBLE", [performance_intelligence.integrity_hash, capacity_intelligence.integrity_hash]),
    certTest("Health assessment deterministic", certification_package.health_assessment_deterministic, "HEALTH_ASSESSMENT_NOT_DETERMINISTIC", [health_analyzer.integrity_hash]),
    certTest("Anomaly coverage complete", certification_package.anomaly_coverage_complete, "ANOMALY_COVERAGE_INCOMPLETE", [anomaly_classifier.integrity_hash]),
    certTest("Monitoring replay validated", certification_package.monitoring_replay_validated, "MONITORING_REPLAY_NOT_VALIDATED", [cycle.integrity_hash]),
    certTest("Governance attribution complete", certification_package.governance_attribution_complete, "GOVERNANCE_ATTRIBUTION_INCOMPLETE", changes.map((change) => change.integrity_hash)),
    certTest("Immutable monitoring evidence verified", certification_package.immutable_monitoring_evidence_verified, "MONITORING_EVIDENCE_MUTABLE", evidence_ledger.map((entry) => entry.integrity_hash)),
    certTest("Constitutional compliance preserved", certification_package.constitutional_compliance_preserved, "CONSTITUTIONAL_COMPLIANCE_NOT_PRESERVED", [health_analyzer.integrity_hash]),
    certTest("Standing monitoring services operational", certification_package.standing_monitoring_services_operational, "STANDING_MONITORING_SERVICES_NOT_OPERATIONAL", [foundation.standing_service_registry.integrity_hash]),
    certTest("Phase 18.2 certified", certification_package.phase_18_2_certified, "PHASE_18_2_NOT_CERTIFIED", [certification_package.integrity_hash]),
    certTest("Monitoring remains advisory", operations_monitor.advisory_only, "MONITORING_HAS_OPERATIONAL_AUTHORITY", [operations_monitor.integrity_hash]),
    certTest("Observation deterministic", operations_monitor.deterministic_observation, "OBSERVATION_NOT_DETERMINISTIC", [operations_monitor.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousMonitoringIntelligenceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousMonitoringIntelligenceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, continuous_operations_foundation_ref: foundation.integrity_hash, operations_monitor, health_analyzer, performance_intelligence, capacity_intelligence, change_detector, anomaly_classifier, monitoring_cycle: cycle, output_reports, evidence_ledger, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousMonitoringIntelligence(result = runContinuousMonitoringIntelligence()): ContinuousMonitoringIntelligenceValidation {
  const monitor_valid = verify(result.operations_monitor) && result.operations_monitor.monitoring_domains.length === 6 && Object.entries(result.operations_monitor).filter(([key]) => !["monitor_id", "monitoring_domains", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const health_valid = verify(result.health_analyzer) && result.health_analyzer.operational_health === "HEALTHY" && Object.entries(result.health_analyzer).filter(([key]) => !["analyzer_id", "operational_health", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const performance_valid = verify(result.performance_intelligence) && Object.entries(result.performance_intelligence).filter(([key]) => !["intelligence_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const capacity_valid = verify(result.capacity_intelligence) && Object.entries(result.capacity_intelligence).filter(([key]) => !["intelligence_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const change_valid = verify(result.change_detector) && result.change_detector.change_categories.length === 8 && result.change_detector.change_records.length === 8 && result.change_detector.change_records.every((change) => verify(change) && change.governing_policy_ref.length > 0 && change.constitutional_authority_ref.length > 0 && change.evidence_refs.length > 0 && change.replay_refs.length > 0) && Object.entries(result.change_detector).filter(([key]) => !["detector_id", "change_categories", "change_records", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const anomaly_valid = verify(result.anomaly_classifier) && result.anomaly_classifier.categories.length === 8 && result.anomaly_classifier.anomaly_refs.length === 8 && result.anomaly_classifier.deterministic_classification && result.anomaly_classifier.coverage_complete;
  const cycle_valid = verify(result.monitoring_cycle) && result.monitoring_cycle.lifecycle.length === 9 && result.monitoring_cycle.complete && result.monitoring_cycle.immutable_evidence && result.monitoring_cycle.replay_refs.length > 0 && result.monitoring_cycle.detected_changes.length === 8 && result.monitoring_cycle.anomaly_classifications.length === 8;
  const reports_valid = result.output_reports.length === 8 && result.output_reports.every((report) => verify(report) && report.evidence_ref.length > 0 && report.replay_ref.length > 0 && report.governance_ref.length > 0);
  const evidence_valid = result.evidence_ledger.length === 8 && result.evidence_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.cycle_ref.length > 0 && entry.report_ref.length > 0 && entry.change_ref.length > 0 && entry.health_ref.length > 0 && entry.anomaly_ref.length > 0 && entry.replay_ref.length > 0 && entry.governance_ref.length > 0 && entry.append_only && entry.immutable);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 14 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && monitor_valid && health_valid && performance_valid && capacity_valid && change_valid && anomaly_valid && cycle_valid && reports_valid && evidence_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, monitor_valid, health_valid, performance_valid, capacity_valid, change_valid, anomaly_valid, cycle_valid, reports_valid, evidence_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousMonitoringIntelligence(result = runContinuousMonitoringIntelligence()): boolean {
  const replayed = runContinuousMonitoringIntelligence();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousMonitoringIntelligence(result).valid;
}

export function getContinuousMonitoringIntelligenceBundle(): ContinuousMonitoringIntelligenceBundle {
  const result = runContinuousMonitoringIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "continuous-operations-foundation/v18.1" as const, lifecycle_states: lifecycleStates, monitoring_domains: monitoringDomains, change_categories: changeCategories, health_states: healthStates, anomaly_categories: anomalyCategories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousMonitoringIntelligence(result) });
}

export const ContinuousMonitoringIntelligenceService = Object.freeze({ run: runContinuousMonitoringIntelligence, validate: validateContinuousMonitoringIntelligence, replay: replayContinuousMonitoringIntelligence });
