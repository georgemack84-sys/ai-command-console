import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import { validateContinuousConstitutionalCompliance, validateContinuousConstitutionalRepository } from "@/services/continuous-constitutional-validation";
import type {
  ConstitutionalHealthState,
  RuntimeComplianceStatus,
  RuntimeConstitutionalAuditRecord,
  RuntimeConstitutionalFailure,
  RuntimeConstitutionalMonitoringBundle,
  RuntimeConstitutionalMonitoringInput,
  RuntimeConstitutionalMonitoringObservabilitySurface,
  RuntimeConstitutionalMonitoringRepository,
  RuntimeConstitutionalMonitoringValidationResult,
  RuntimeConstitutionalScenario,
  RuntimeMonitoringDomain,
  RuntimeMonitoringLedgerRecord,
  RuntimeMonitoringTimelineEntry,
  RuntimeRiskIndicator,
} from "@/types/runtime-constitutional-monitoring";

const VERSION = "runtime-constitutional-monitoring/v8ALT.10.3" as const;
const domains = Object.freeze(["AUTHORITY", "POLICY", "OPERATOR_AUTHORITY", "RUNTIME_CONFIDENCE", "MISSION_STATE", "GOVERNANCE_HEALTH", "EXECUTION_INTEGRITY", "TENANT_ISOLATION", "SYSTEM_DRIFT"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: RuntimeConstitutionalScenario): RuntimeConstitutionalFailure | null {
  const map: Partial<Record<RuntimeConstitutionalScenario, RuntimeConstitutionalFailure>> = {
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    OPERATOR_AUTHORITY_OVERRIDE: "OPERATOR_AUTHORITY_OVERRIDE_DETECTED",
    POLICY_ENFORCEMENT_FAILURE: "POLICY_ENFORCEMENT_FAILURE_DETECTED",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
    EXECUTION_NONDETERMINISM: "EXECUTION_NONDETERMINISM_DETECTED",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE_DETECTED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILURE_DETECTED",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH_DETECTED",
    UNAUTHORIZED_LEARNING: "UNAUTHORIZED_LEARNING_DETECTED",
    UNAUTHORIZED_OPTIMIZATION: "UNAUTHORIZED_OPTIMIZATION_DETECTED",
    UNAUTHORIZED_RECOVERY: "UNAUTHORIZED_RECOVERY_DETECTED",
    MONITORING_EVIDENCE_CORRUPTION: "MONITORING_EVIDENCE_CORRUPTION_DETECTED",
    CONSTITUTIONAL_HEALTH_UNAVAILABLE: "CONSTITUTIONAL_HEALTH_UNAVAILABLE",
    MISSING_RUNTIME_VISIBILITY: "RUNTIME_VISIBILITY_MISSING",
    INCOMPLETE_MONITORING_LINEAGE: "MONITORING_LINEAGE_INCOMPLETE",
  };
  return map[scenario] ?? null;
}

function affectedDomain(scenario: RuntimeConstitutionalScenario): RuntimeMonitoringDomain {
  const map: Partial<Record<RuntimeConstitutionalScenario, RuntimeMonitoringDomain>> = {
    CONSTITUTIONAL_BYPASS: "POLICY",
    GOVERNANCE_BYPASS: "GOVERNANCE_HEALTH",
    AUTHORITY_ESCALATION: "AUTHORITY",
    OPERATOR_AUTHORITY_OVERRIDE: "OPERATOR_AUTHORITY",
    POLICY_ENFORCEMENT_FAILURE: "POLICY",
    HIDDEN_EXECUTION: "EXECUTION_INTEGRITY",
    EXECUTION_NONDETERMINISM: "EXECUTION_INTEGRITY",
    REPLAY_DIVERGENCE: "RUNTIME_CONFIDENCE",
    INTEGRITY_VERIFICATION_FAILURE: "EXECUTION_INTEGRITY",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION",
    UNAUTHORIZED_LEARNING: "SYSTEM_DRIFT",
    UNAUTHORIZED_OPTIMIZATION: "SYSTEM_DRIFT",
    UNAUTHORIZED_RECOVERY: "MISSION_STATE",
    MONITORING_EVIDENCE_CORRUPTION: "RUNTIME_CONFIDENCE",
    CONSTITUTIONAL_HEALTH_UNAVAILABLE: "RUNTIME_CONFIDENCE",
    MISSING_RUNTIME_VISIBILITY: "MISSION_STATE",
    INCOMPLETE_MONITORING_LINEAGE: "RUNTIME_CONFIDENCE",
  };
  return map[scenario] ?? "AUTHORITY";
}

function status(domain: RuntimeMonitoringDomain, index: number, scenario: RuntimeConstitutionalScenario, failure: RuntimeConstitutionalFailure | null): RuntimeComplianceStatus {
  const affected = Boolean(failure && domain === affectedDomain(scenario));
  const base = {
    runtime_monitor_id: id("RCM", "runtime-constitutional-monitor", { domain, scenario, index }),
    mission_id: "mission:runtime-constitutional-monitoring",
    execution_id: `execution:runtime:${index}`,
    tenant_id: affected && scenario === "TENANT_ISOLATION_BREACH" ? "tenant:foreign" : "tenant:alpha",
    constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const,
    runtime_timestamp: "1970-01-01T00:00:00.000Z" as const,
    monitored_domain: domain,
    authority_status: affected && ["AUTHORITY_ESCALATION", "OPERATOR_AUTHORITY_OVERRIDE"].includes(scenario) ? "FAIL" as const : "PASS" as const,
    policy_status: affected && ["CONSTITUTIONAL_BYPASS", "POLICY_ENFORCEMENT_FAILURE"].includes(scenario) ? "FAIL" as const : "PASS" as const,
    operator_status: affected && scenario === "OPERATOR_AUTHORITY_OVERRIDE" ? "FAIL" as const : "PASS" as const,
    governance_status: affected && scenario === "GOVERNANCE_BYPASS" ? "FAIL" as const : "PASS" as const,
    execution_integrity: affected && ["HIDDEN_EXECUTION", "EXECUTION_NONDETERMINISM", "INTEGRITY_VERIFICATION_FAILURE"].includes(scenario) ? "FAIL" as const : "PASS" as const,
    tenant_isolation: affected && scenario === "TENANT_ISOLATION_BREACH" ? "FAIL" as const : "PASS" as const,
    system_drift: affected ? "CRITICAL" as const : "STABLE" as const,
    constitution_health: affected ? "NON_COMPLIANT" as const : index % 3 === 0 ? "EXCELLENT" as const : "HEALTHY" as const,
    confidence_score: affected ? 0 : 0.98,
    overall_compliance: affected ? "FAIL_CLOSED" as const : "COMPLIANT" as const,
    recommendations: affected ? freezeArray(["fail closed", "notify operator", "preserve monitoring evidence"]) : freezeArray(["continue passive monitoring"]),
    lineage_reference: affected && scenario === "INCOMPLETE_MONITORING_LINEAGE" ? "" : `lineage:runtime-monitoring:${domain.toLowerCase()}`,
    replay_reference: affected && scenario === "REPLAY_DIVERGENCE" ? "replay:runtime:divergent" : `replay:runtime-monitoring:${domain.toLowerCase()}`,
    evidence_reference: affected && (scenario === "MONITORING_EVIDENCE_CORRUPTION" || scenario === "MISSING_RUNTIME_VISIBILITY") ? "" : `evidence:runtime-monitoring:${domain.toLowerCase()}`,
    failure: affected ? failure : null,
    monitoring_only: true as const,
    passive_observer: true as const,
    execution_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    governance_override_authorized: false as const,
    runtime_intervention_authorized: false as const,
    background_process_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: affected && scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("runtime-constitutional-status", base) });
}

function health(statuses: readonly RuntimeComplianceStatus[]) {
  const degraded = statuses.some((item) => item.overall_compliance === "FAIL_CLOSED");
  const score = (field: keyof Pick<RuntimeComplianceStatus, "authority_status" | "governance_status" | "policy_status" | "execution_integrity" | "tenant_isolation">) => statuses.every((item) => item[field] === "PASS") ? 1 : 0;
  const base = {
    health_id: id("RCH", "runtime-constitution-health", statuses.map((item) => item.integrity_hash)),
    authority_health: score("authority_status"),
    governance_health: score("governance_status"),
    policy_health: score("policy_status"),
    integrity_health: score("execution_integrity"),
    replay_health: statuses.every((item) => !item.replay_reference.includes("divergent")) ? 1 : 0,
    isolation_health: score("tenant_isolation"),
    confidence_health: statuses.reduce((sum, item) => sum + item.confidence_score, 0) / statuses.length,
    drift_health: statuses.every((item) => item.system_drift === "STABLE") ? 1 : 0,
    visibility_health: statuses.every((item) => item.evidence_reference.length > 0) ? 1 : 0,
    mission_health: degraded ? 0 : 1,
    overall_health_state: degraded ? "NON_COMPLIANT" as ConstitutionalHealthState : "EXCELLENT" as ConstitutionalHealthState,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("runtime-constitution-health", base) });
}

function timeline(item: RuntimeComplianceStatus): RuntimeMonitoringTimelineEntry {
  const base = { timeline_id: id("RCT", "runtime-monitoring-timeline", item.runtime_monitor_id), runtime_monitor_id: item.runtime_monitor_id, monitored_domain: item.monitored_domain, health_state: item.constitution_health, compliance_state: item.overall_compliance, replay_checkpoint: item.replay_reference };
  return Object.freeze({ ...base, integrity_hash: hashValue("runtime-monitoring-timeline", base) });
}

function risk(type: RuntimeRiskIndicator["risk_type"], statuses: readonly RuntimeComplianceStatus[], index: number): RuntimeRiskIndicator {
  const degraded = statuses.some((item) => item.overall_compliance === "FAIL_CLOSED");
  const base = { risk_id: id("RCR", "runtime-constitutional-risk", { type, index, degraded }), risk_type: type, risk_score: degraded ? 1 : 0.05, drift_score: degraded ? 1 : 0, risk_level: degraded ? "CRITICAL" as const : "LOW" as const, evidence_reference: `evidence:runtime-risk:${index}`, replay_reference: `replay:runtime-risk:${index}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("runtime-constitutional-risk", base) });
}

function ledger(item: RuntimeComplianceStatus): RuntimeMonitoringLedgerRecord {
  const base = { monitoring_record_id: id("RCL", "runtime-monitoring-ledger", item.runtime_monitor_id), runtime_monitor_id: item.runtime_monitor_id, mission_id: item.mission_id, execution_id: item.execution_id, tenant_id: item.tenant_id, timestamp: item.runtime_timestamp, monitored_domain: item.monitored_domain, health_state: item.constitution_health, compliance_state: item.overall_compliance, risk_score: item.overall_compliance === "FAIL_CLOSED" ? 1 : 0.05, drift_score: item.system_drift === "CRITICAL" ? 1 : 0, validation_reference: `validation:${item.runtime_monitor_id}`, evidence_reference: item.evidence_reference, lineage_reference: item.lineage_reference, immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("runtime-monitoring-ledger", base) });
}

function audit(failure: RuntimeConstitutionalFailure, scenario: RuntimeConstitutionalScenario): RuntimeConstitutionalAuditRecord {
  const base = { audit_id: id("RCA", "runtime-constitutional-audit", { failure, scenario }), failure, immutable: true as const, append_only: true as const, evidence_reference: `evidence:runtime:${failure}`, replay_reference: `replay:runtime:${failure}` };
  return Object.freeze({ ...base, integrity_hash: hashValue("runtime-constitutional-audit", base) });
}

function collectFailures(repository: Omit<RuntimeConstitutionalMonitoringRepository, "integrity_hash"> | RuntimeConstitutionalMonitoringRepository): readonly RuntimeConstitutionalFailure[] {
  return unique([
    ...repository.failures,
    ...repository.statuses.map((item) => item.failure).filter((failure): failure is RuntimeConstitutionalFailure => Boolean(failure)),
    ...(repository.statuses.some((item) => item.replay_reference.includes("divergent")) ? ["REPLAY_DIVERGENCE_DETECTED" as const] : []),
    ...(repository.statuses.some((item) => !item.integrity_hash) ? ["INTEGRITY_VERIFICATION_FAILURE_DETECTED" as const] : []),
    ...(repository.statuses.some((item) => item.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_BREACH_DETECTED" as const] : []),
    ...(repository.statuses.some((item) => !item.evidence_reference) ? ["MONITORING_EVIDENCE_CORRUPTION_DETECTED" as const] : []),
    ...(repository.statuses.some((item) => !item.lineage_reference) ? ["MONITORING_LINEAGE_INCOMPLETE" as const] : []),
    ...(repository.health.overall_health_state === "NON_COMPLIANT" && repository.statuses.some((item) => item.failure === "CONSTITUTIONAL_HEALTH_UNAVAILABLE") ? ["CONSTITUTIONAL_HEALTH_UNAVAILABLE" as const] : []),
  ]);
}

export function monitorRuntimeConstitutionalCompliance(input: RuntimeConstitutionalMonitoringInput = {}): RuntimeConstitutionalMonitoringRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const validationRepository = input.validationRepository ?? validateContinuousConstitutionalCompliance({ baseline });
  const baselineValid = validateConstitutionalBaseline(baseline).valid;
  const validationValid = validateContinuousConstitutionalRepository(validationRepository).valid;
  const failure = scenarioFailure(scenario);
  const statuses = freezeArray(domains.map((domain, index) => status(domain, index, scenario, failure)));
  const healthAssessment = health(statuses);
  const timelineEntries = freezeArray(statuses.map(timeline));
  const riskIndicators = freezeArray(["AUTHORITY_RISK", "GOVERNANCE_RISK", "REPLAY_RISK", "INTEGRITY_RISK", "ISOLATION_RISK", "CONSTITUTIONAL_RISK"].map((type, index) => risk(type as RuntimeRiskIndicator["risk_type"], statuses, index)));
  const ledgerRecords = freezeArray(statuses.map(ledger));
  const source = { repository_id: id("RCM", "runtime-constitutional-monitoring", { scenario, baseline: baseline.contract_id, validation: validationRepository.repository_id }), baseline_contract_id: baseline.contract_id, validation_repository_id: validationRepository.repository_id, final_state: "RUNTIME_CONSTITUTIONAL_MONITORING_COMPLETE" as const, statuses, health: healthAssessment, timeline: timelineEntries, risks: riskIndicators, ledger: ledgerRecords, audit_records: freezeArray<RuntimeConstitutionalAuditRecord>([]), failures: freezeArray(failure ? [failure] : []), monitoring_only: true as const, passive_observer: true as const, execution_modification_authorized: false as const, authority_grant_authorized: false as const, governance_override_authorized: false as const, runtime_intervention_authorized: false as const, background_process_authorized: false as const };
  const failures = unique([...collectFailures(source), ...(!baselineValid || !validationValid ? ["CONSTITUTIONAL_BYPASS_DETECTED" as const] : [])]);
  const audit_records = freezeArray(failures.map((item) => audit(item, scenario)));
  const repository = { ...source, failures, audit_records, final_state: failures.length ? "RUNTIME_CONSTITUTIONAL_MONITORING_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("runtime-constitutional-monitoring-repository", repository) });
}

export function listRuntimeComplianceStatus(input: RuntimeConstitutionalMonitoringInput = {}) { return monitorRuntimeConstitutionalCompliance(input).statuses; }
export function getRuntimeConstitutionHealth(input: RuntimeConstitutionalMonitoringInput = {}) { return monitorRuntimeConstitutionalCompliance(input).health; }
export function listRuntimeMonitoringTimeline(input: RuntimeConstitutionalMonitoringInput = {}) { return monitorRuntimeConstitutionalCompliance(input).timeline; }
export function listRuntimeRiskIndicators(input: RuntimeConstitutionalMonitoringInput = {}) { return monitorRuntimeConstitutionalCompliance(input).risks; }
export function listRuntimeMonitoringLedger(input: RuntimeConstitutionalMonitoringInput = {}) { return monitorRuntimeConstitutionalCompliance(input).ledger; }
export function listRuntimeConstitutionalAuditRecords(input: RuntimeConstitutionalMonitoringInput = {}) { return monitorRuntimeConstitutionalCompliance(input).audit_records; }

export function validateRuntimeConstitutionalMonitoring(repository = monitorRuntimeConstitutionalCompliance()): RuntimeConstitutionalMonitoringValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: RuntimeConstitutionalFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "RUNTIME_CONSTITUTIONAL_MONITORING_COMPLETE" && repository.monitoring_only && repository.passive_observer && !repository.runtime_intervention_authorized;
  const result = { repository_id: repository.repository_id, valid, passive_observer: true as const, monitoring_only: true as const, baseline_valid: !has("CONSTITUTIONAL_BYPASS_DETECTED"), deterministic_monitoring: !has("EXECUTION_NONDETERMINISM_DETECTED"), replay_compatible: !has("REPLAY_DIVERGENCE_DETECTED"), evidence_complete: !has("MONITORING_EVIDENCE_CORRUPTION_DETECTED") && !has("RUNTIME_VISIBILITY_MISSING"), lineage_complete: !has("MONITORING_LINEAGE_INCOMPLETE"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILURE_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_BREACH_DETECTED"), health_available: !has("CONSTITUTIONAL_HEALTH_UNAVAILABLE"), runtime_visibility_complete: !has("RUNTIME_VISIBILITY_MISSING"), fail_closed: valid || failures.length > 0 || repository.final_state !== "RUNTIME_CONSTITUTIONAL_MONITORING_COMPLETE", failures };
  return Object.freeze({ ...result, validation_hash: hashValue("runtime-constitutional-monitoring-validation", result) });
}

export function buildRuntimeConstitutionalMonitoringObservabilitySurface(repository = monitorRuntimeConstitutionalCompliance()): RuntimeConstitutionalMonitoringObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, status_count: repository.statuses.length, timeline_count: repository.timeline.length, risk_count: repository.risks.length, ledger_count: repository.ledger.length, audit_count: repository.audit_records.length, failure_count: repository.failures.length, health_state: repository.health.overall_health_state, monitoring_only: true, passive_observer: true, runtime_intervention_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getRuntimeConstitutionalMonitoringEngine(): RuntimeConstitutionalMonitoringBundle {
  const repository = monitorRuntimeConstitutionalCompliance();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "RUNTIME_CONSTITUTIONAL_MONITORING_READY", monitoring_domains: domains, principles: freezeArray(["passive-observer", "monitoring-only", "deterministic-cycles", "baseline-integrated", "validation-evidence-integrated", "no-runtime-intervention", "no-background-process", "tenant-isolated", "fail-closed-evidence"]) }), repository, validation: validateRuntimeConstitutionalMonitoring(repository), observability: buildRuntimeConstitutionalMonitoringObservabilitySurface(repository) });
}
