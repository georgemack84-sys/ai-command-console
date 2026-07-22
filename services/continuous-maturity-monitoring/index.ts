import { replayAssessmentWithExplainability } from "@/services/assessment-replay-explainability";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityDomain } from "@/types/autonomy-maturity-assessment-contract";
import type { AssessmentReplayRepository } from "@/types/assessment-replay-explainability";
import type {
  AlertSeverity,
  AssessmentTriggerDecision,
  ChangeCategory,
  ContinuousMaturityMonitoringBundle,
  ContinuousMaturityMonitoringFailure,
  ContinuousMaturityMonitoringInput,
  ContinuousMaturityMonitoringObservabilitySurface,
  ContinuousMaturityMonitoringRepository,
  ContinuousMaturityMonitoringScenario,
  ContinuousMaturityMonitoringValidationResult,
  DetectedMaturityChange,
  MaturityMonitoringAlert,
  MonitoringAuditReport,
  MonitoringDomain,
  MonitoringLedgerEntry,
  MonitoringRule,
  MonitoringScheduleRecord,
} from "@/types/continuous-maturity-monitoring";

const VERSION = "continuous-maturity-monitoring/v8ALT.11.11" as const;
const monitoredDomains = ["ARCHITECTURE", "GOVERNANCE", "CONSTITUTION", "RUNTIME", "REPLAY", "RESILIENCE", "CERTIFICATION", "EXPLAINABILITY", "OPTIMIZATION", "RECOVERY", "HISTORICAL_MATURITY"] as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ContinuousMaturityMonitoringScenario): ContinuousMaturityMonitoringFailure | null {
  const map: Partial<Record<ContinuousMaturityMonitoringScenario, ContinuousMaturityMonitoringFailure>> = {
    CHANGES_NOT_DETECTED: "MONITORED_CHANGES_NOT_DETECTED",
    TRIGGER_MISMATCH: "ASSESSMENT_TRIGGERS_DIFFERED_FOR_IDENTICAL_EVENTS",
    NONDETERMINISTIC_ALERTS: "ALERTS_NONDETERMINISTIC",
    MONITORING_HISTORY_MODIFIED: "MONITORING_HISTORY_MODIFIED",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCHED",
    GOVERNANCE_CHANGES_MISSED: "GOVERNANCE_CHANGES_MISSED",
    CONSTITUTIONAL_CHANGES_MISSED: "CONSTITUTIONAL_CHANGES_MISSED",
    CERTIFICATION_CHANGES_MISSED: "CERTIFICATION_CHANGES_MISSED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_MONITORING_LOGIC: "HIDDEN_MONITORING_LOGIC_DETECTED",
    RUNTIME_BEHAVIOR_MODIFICATION: "RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED",
    OPERATOR_AUTHORITY_BYPASS: "OPERATOR_AUTHORITY_BYPASSED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
  };
  return map[scenario] ?? null;
}

function rules(scenario: ContinuousMaturityMonitoringScenario): readonly MonitoringRule[] {
  return freezeArray(monitoredDomains.map((domain, index) => {
    const base = { rule_id: id("CMM-R", "monitoring-rule", domain), monitored_domain: domain, rule_version: "continuous-monitoring-rules/v1" as const, threshold: index < 3 ? "MAJOR" as const : "MODERATE" as const, approved: true, deterministic: !(scenario === "HIDDEN_MONITORING_LOGIC" && index === 0) };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("continuous-monitoring-rule", base) });
  }));
}

function affectedDomains(domain: MonitoringDomain): readonly AutonomyMaturityDomain[] {
  const map: Record<MonitoringDomain, readonly AutonomyMaturityDomain[]> = {
    ARCHITECTURE: ["PLANNING_INTELLIGENCE", "EXECUTION_INTELLIGENCE"],
    GOVERNANCE: ["GOVERNANCE_COMPLIANCE", "AUTHORITY_ENFORCEMENT"],
    CONSTITUTION: ["CONSTITUTIONAL_COMPLIANCE"],
    RUNTIME: ["EXECUTION_INTELLIGENCE", "RESILIENCE", "VISIBILITY"],
    REPLAY: ["REPLAY_INTEGRITY"],
    RESILIENCE: ["RESILIENCE"],
    CERTIFICATION: ["CERTIFICATION_READINESS"],
    EXPLAINABILITY: ["EXPLAINABILITY"],
    OPTIMIZATION: ["PLANNING_INTELLIGENCE", "RESILIENCE"],
    RECOVERY: ["RESILIENCE"],
    HISTORICAL_MATURITY: ["CERTIFICATION_READINESS", "VISIBILITY"],
  };
  return map[domain];
}

function changes(replay: AssessmentReplayRepository, scenario: ContinuousMaturityMonitoringScenario): readonly DetectedMaturityChange[] {
  if (scenario === "CHANGES_NOT_DETECTED") return freezeArray([]);
  const source = monitoredDomains.filter((domain) => !(
    (scenario === "GOVERNANCE_CHANGES_MISSED" && domain === "GOVERNANCE") ||
    (scenario === "CONSTITUTIONAL_CHANGES_MISSED" && domain === "CONSTITUTION") ||
    (scenario === "CERTIFICATION_CHANGES_MISSED" && domain === "CERTIFICATION")
  ));
  return freezeArray(source.map((domain, index) => {
    const category: ChangeCategory = domain === "CONSTITUTION" || domain === "CERTIFICATION" ? "CRITICAL" : index < 4 ? "MAJOR" : "MODERATE";
    const base = { change_id: id("CMM-C", "maturity-change", domain), monitored_domain: domain, affected_maturity_domains: affectedDomains(domain), category, description: scenario === "HIDDEN_MONITORING_LOGIC" && domain === "ARCHITECTURE" ? "hidden monitoring logic" : `${domain.toLowerCase()} maturity signal observed`, readiness_impact: category === "CRITICAL" ? 100 : category === "MAJOR" ? 75 : 50, certification_impact: domain === "CERTIFICATION" ? 100 : 40, evidence_reference: replay.context.assessment_id, replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" && domain === "REPLAY" ? "" : replay.replay.replay_reference };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && domain === "REPLAY" ? "" : hashValue("detected-maturity-change", base) });
  }));
}

function triggers(detected: readonly DetectedMaturityChange[], scenario: ContinuousMaturityMonitoringScenario): readonly AssessmentTriggerDecision[] {
  return freezeArray(detected.map((change, index) => {
    const mismatch = scenario === "TRIGGER_MISMATCH" && index === 0;
    const base = { trigger_id: id("CMM-T", "assessment-trigger", change.change_id), trigger_status: mismatch ? "NOT_REQUIRED" as const : change.category === "CRITICAL" ? "ADVISORY_REASSESSMENT_RECOMMENDED" as const : "SCHEDULED_REASSESSMENT_ADVISED" as const, trigger_reason: `${change.monitored_domain} ${change.category} change`, duplicate_trigger_rejected: true, deterministic_order: mismatch ? 99 : index + 1, evidence_reference: change.evidence_reference, replay_reference: change.replay_reference, advisory_only: true as const, assessment_execution_authorized: false as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("assessment-trigger-decision", base) });
  }));
}

function schedules(scenario: ContinuousMaturityMonitoringScenario): readonly MonitoringScheduleRecord[] {
  const modes = ["SCHEDULED", "MILESTONE", "CERTIFICATION", "DEPLOYMENT", "GOVERNANCE", "CONSTITUTIONAL", "OPERATOR_REQUESTED"] as const;
  return freezeArray(modes.map((schedule_mode, index) => {
    const base = { schedule_id: id("CMM-S", "monitoring-schedule", schedule_mode), schedule_mode, cadence: "DETERMINISTIC_CYCLE" as const, next_cycle_hint: `cycle:${index + 1}`, version: "monitoring-schedule/v1" as const, advisory_only: true as const, background_job_started: false as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("monitoring-schedule-record", base) });
  }));
}

function alertSeverity(category: ChangeCategory): AlertSeverity {
  if (category === "CRITICAL") return "CRITICAL";
  if (category === "MAJOR") return "HIGH";
  if (category === "MODERATE") return "WARNING";
  if (category === "MINOR") return "ADVISORY";
  return "INFORMATIONAL";
}

function alerts(detected: readonly DetectedMaturityChange[], scenario: ContinuousMaturityMonitoringScenario): readonly MaturityMonitoringAlert[] {
  const built = detected.map((change, index) => {
    const base = { alert_id: id("CMM-A", "monitoring-alert", change.change_id), alert_type: change.monitored_domain === "CERTIFICATION" ? "CERTIFICATION_BLOCKED" as const : change.monitored_domain === "GOVERNANCE" ? "GOVERNANCE_DEGRADED" as const : change.monitored_domain === "CONSTITUTION" ? "CONSTITUTIONAL_ISSUE_DETECTED" as const : change.monitored_domain === "REPLAY" ? "REPLAY_INCONSISTENCY_DETECTED" as const : change.monitored_domain === "RESILIENCE" || change.monitored_domain === "RUNTIME" ? "RESILIENCE_DEGRADATION" as const : change.monitored_domain === "OPTIMIZATION" ? "OPTIMIZATION_OPPORTUNITY" as const : "READINESS_CHANGED" as const, severity: scenario === "NONDETERMINISTIC_ALERTS" && index === 0 ? "INFORMATIONAL" as const : alertSeverity(change.category), message: `${change.description} requires operator review`, affected_domains: change.affected_maturity_domains, recommended_operator_actions: freezeArray(["review evidence", "confirm governance posture", "schedule assessment externally if needed"]), replay_reference: change.replay_reference, advisory_only: true as const, corrective_action_authorized: false as const };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 0 ? "" : hashValue("maturity-monitoring-alert", base) });
  });
  return freezeArray(built);
}

function ledgerEntry(detected: readonly DetectedMaturityChange[], triggerDecisions: readonly AssessmentTriggerDecision[], alertSet: readonly MaturityMonitoringAlert[], replay: AssessmentReplayRepository, scenario: ContinuousMaturityMonitoringScenario): readonly MonitoringLedgerEntry[] {
  const base = { monitoring_id: id("CMM", "monitoring-ledger", scenario), monitoring_cycle: 1, monitored_domains: monitoredDomains, detected_changes: freezeArray(detected.map((change) => change.change_id)), trigger_status: triggerDecisions.some((trigger) => trigger.trigger_status === "ADVISORY_REASSESSMENT_RECOMMENDED") ? "ADVISORY_REASSESSMENT_RECOMMENDED" as const : "SCHEDULED_REASSESSMENT_ADVISED" as const, generated_alerts: freezeArray(alertSet.map((alert) => alert.alert_id)), governance_status: scenario === "GOVERNANCE_CHANGES_MISSED" ? "FAIL" as const : "PASS" as const, constitutional_status: scenario === "CONSTITUTIONAL_CHANGES_MISSED" ? "FAIL" as const : "PASS" as const, replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "" : replay.replay.replay_reference, lineage_reference: replay.replay.lineage_reference, immutable: scenario !== "MONITORING_HISTORY_MODIFIED", timestamp: "1970-01-01T00:00:00.000Z" as const };
  return freezeArray([Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("monitoring-ledger-entry", base) })]);
}

function auditReport(ledger: readonly MonitoringLedgerEntry[], detected: readonly DetectedMaturityChange[], scenario: ContinuousMaturityMonitoringScenario): MonitoringAuditReport {
  const entry = ledger[0]!;
  const base = { report_id: id("CMM-AR", "monitoring-audit-report", entry.monitoring_id), monitoring_id: entry.monitoring_id, monitoring_version: VERSION, trigger_engine_version: "assessment-trigger/v1" as const, monitoring_rule_version: "continuous-monitoring-rules/v1" as const, evidence_references: freezeArray(detected.map((change) => change.evidence_reference)), governance_references: freezeArray(["governance:continuous-maturity-monitoring"]), constitutional_references: freezeArray(["constitutional:continuous-maturity-monitoring"]), replay_reference: entry.replay_reference, lineage_reference: entry.lineage_reference, timestamp: "1970-01-01T00:00:00.000Z" as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("monitoring-audit-report", base) });
}

function collectFailures(repository: Omit<ContinuousMaturityMonitoringRepository, "integrity_hash"> | ContinuousMaturityMonitoringRepository): readonly ContinuousMaturityMonitoringFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.changes.length === 0 ? ["MONITORED_CHANGES_NOT_DETECTED" as const] : []),
    ...(repository.triggers.some((trigger, index) => trigger.deterministic_order !== index + 1 || trigger.trigger_status === "NOT_REQUIRED") ? ["ASSESSMENT_TRIGGERS_DIFFERED_FOR_IDENTICAL_EVENTS" as const] : []),
    ...(repository.alerts.some((alert, index) => index === 0 && alert.severity === "INFORMATIONAL") ? ["ALERTS_NONDETERMINISTIC" as const] : []),
    ...(repository.ledger.some((entry) => !entry.immutable) ? ["MONITORING_HISTORY_MODIFIED" as const] : []),
    ...(repository.ledger.some((entry) => !entry.replay_reference) || repository.changes.some((change) => !change.replay_reference) ? ["REPLAY_RECONSTRUCTION_MISMATCHED" as const] : []),
    ...(repository.changes.every((change) => change.monitored_domain !== "GOVERNANCE") || repository.ledger.some((entry) => entry.governance_status === "FAIL") ? ["GOVERNANCE_CHANGES_MISSED" as const] : []),
    ...(repository.changes.every((change) => change.monitored_domain !== "CONSTITUTION") || repository.ledger.some((entry) => entry.constitutional_status === "FAIL") ? ["CONSTITUTIONAL_CHANGES_MISSED" as const] : []),
    ...(repository.changes.every((change) => change.monitored_domain !== "CERTIFICATION") ? ["CERTIFICATION_CHANGES_MISSED" as const] : []),
    ...(repository.rules.some((rule) => !rule.integrity_hash) || repository.changes.some((change) => !change.integrity_hash) || repository.triggers.some((trigger) => !trigger.integrity_hash) || repository.schedules.some((schedule) => !schedule.integrity_hash) || repository.alerts.some((alert) => !alert.integrity_hash) || repository.ledger.some((entry) => !entry.integrity_hash) || !repository.audit_report.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.rules.some((rule) => !rule.deterministic) || repository.changes.some((change) => change.description.includes("hidden")) ? ["HIDDEN_MONITORING_LOGIC_DETECTED" as const] : []),
    ...(repository.runtime_behavior_modification_authorized ? ["RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED" as const] : []),
    ...(repository.operator_authority_bypass_authorized ? ["OPERATOR_AUTHORITY_BYPASSED" as const] : []),
    ...(repository.replay_repository.analytics_repository.ledger_repository.assessment_ledger.some((entry) => entry.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
  ]);
}

export function runContinuousMaturityMonitoring(input: ContinuousMaturityMonitoringInput = {}): ContinuousMaturityMonitoringRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const replay_repository = input.replay_repository ?? replayAssessmentWithExplainability(scenario === "TENANT_ISOLATION_VIOLATION" ? { scenario: "TENANT_ISOLATION_VIOLATION" } : {});
  const monitoringRules = rules(scenario);
  const detected = changes(replay_repository, scenario);
  const triggerDecisions = triggers(detected, scenario);
  const scheduleRecords = schedules(scenario);
  const alertSet = alerts(detected, scenario);
  const ledger = ledgerEntry(detected, triggerDecisions, alertSet, replay_repository, scenario);
  const audit = auditReport(ledger, detected, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { repository_id: id("CMM", "continuous-maturity-monitoring", scenario), final_state: "CONTINUOUS_MATURITY_MONITORING_COMPLETE" as const, replay_repository, rules: monitoringRules, changes: detected, triggers: triggerDecisions, schedules: scheduleRecords, alerts: alertSet, ledger, audit_report: audit, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, runtime_behavior_modification_authorized: false as const, recommendation_execution_authorized: false as const, maturity_level_change_authorized: false as const, governance_policy_change_authorized: false as const, constitutional_rule_change_authorized: false as const, scoring_model_change_authorized: false as const, autonomous_recovery_authorized: false as const, certification_approval_authorized: false as const, operator_authority_bypass_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "CONTINUOUS_MATURITY_MONITORING_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("continuous-maturity-monitoring-repository", repository) });
}

export function listMaturityMonitoringChanges(input: ContinuousMaturityMonitoringInput = {}) { return runContinuousMaturityMonitoring(input).changes; }
export function listMaturityMonitoringTriggers(input: ContinuousMaturityMonitoringInput = {}) { return runContinuousMaturityMonitoring(input).triggers; }
export function listMaturityMonitoringAlerts(input: ContinuousMaturityMonitoringInput = {}) { return runContinuousMaturityMonitoring(input).alerts; }
export function listMaturityMonitoringLedger(input: ContinuousMaturityMonitoringInput = {}) { return runContinuousMaturityMonitoring(input).ledger; }

export function validateContinuousMaturityMonitoring(repository = runContinuousMaturityMonitoring()): ContinuousMaturityMonitoringValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: ContinuousMaturityMonitoringFailure) => failures.includes(failure);
  const result = { repository_id: repository.repository_id, valid: failures.length === 0 && repository.final_state === "CONTINUOUS_MATURITY_MONITORING_COMPLETE", changes_detected: !has("MONITORED_CHANGES_NOT_DETECTED"), triggers_deterministic: !has("ASSESSMENT_TRIGGERS_DIFFERED_FOR_IDENTICAL_EVENTS"), alerts_deterministic: !has("ALERTS_NONDETERMINISTIC"), history_immutable: !has("MONITORING_HISTORY_MODIFIED"), replay_reconstruction_verified: !has("REPLAY_RECONSTRUCTION_MISMATCHED"), governance_changes_detected: !has("GOVERNANCE_CHANGES_MISSED"), constitutional_changes_detected: !has("CONSTITUTIONAL_CHANGES_MISSED"), certification_changes_detected: !has("CERTIFICATION_CHANGES_MISSED"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"), no_hidden_logic: !has("HIDDEN_MONITORING_LOGIC_DETECTED"), runtime_behavior_preserved: !has("RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED"), operator_authority_preserved: !has("OPERATOR_AUTHORITY_BYPASSED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), advisory_only: true as const, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("continuous-maturity-monitoring-validation", result) });
}

export function buildContinuousMaturityMonitoringObservabilitySurface(repository = runContinuousMaturityMonitoring()): ContinuousMaturityMonitoringObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, rule_count: repository.rules.length, change_count: repository.changes.length, trigger_count: repository.triggers.length, schedule_count: repository.schedules.length, alert_count: repository.alerts.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, advisory_only: true, runtime_behavior_modification_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getContinuousMaturityMonitoringBundle(): ContinuousMaturityMonitoringBundle {
  const repository = runContinuousMaturityMonitoring();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONTINUOUS_MATURITY_MONITORING_READY", principles: freezeArray(["replay-derived-monitoring", "deterministic-cycle-artifacts", "advisory-triggers-only", "no-background-jobs", "no-runtime-modification", "operator-authority-preserved", "tenant-isolated", "replayable-monitoring"]) }), repository, validation: validateContinuousMaturityMonitoring(repository), observability: buildContinuousMaturityMonitoringObservabilitySurface(repository) });
}
