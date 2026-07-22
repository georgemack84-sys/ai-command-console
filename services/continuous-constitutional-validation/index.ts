import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import type {
  ConstitutionalComplianceTimelineEntry,
  ConstitutionalTrendAssessment,
  ConstitutionalValidationReport,
  ConstitutionalViolationAlert,
  ContinuousConstitutionalAuditRecord,
  ContinuousConstitutionalFailure,
  ContinuousConstitutionalInput,
  ContinuousConstitutionalObservabilitySurface,
  ContinuousConstitutionalScenario,
  ContinuousConstitutionalSubsystem,
  ContinuousConstitutionalValidationBundle,
  ContinuousConstitutionalValidationRepository,
  ContinuousConstitutionalValidationResult,
} from "@/types/continuous-constitutional-validation";

const VERSION = "continuous-constitutional-validation/v8ALT.10.2" as const;
const subsystems = Object.freeze(["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "RECOVERY", "OPTIMIZATION", "LEARNING", "REPLAY", "VISIBILITY", "INTEGRITY", "GOVERNANCE", "AUTHORITY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: ContinuousConstitutionalScenario): ContinuousConstitutionalFailure | null {
  const map: Partial<Record<ContinuousConstitutionalScenario, ContinuousConstitutionalFailure>> = {
    CONSTITUTIONAL_RULE_VIOLATION: "CONSTITUTIONAL_RULE_VIOLATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    OPERATOR_AUTHORITY_OVERRIDE: "OPERATOR_AUTHORITY_OVERRIDE_DETECTED",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_DETECTED",
    NONDETERMINISTIC_EXECUTION: "NONDETERMINISTIC_EXECUTION_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILURE_DETECTED",
    HIDDEN_EXECUTION_PATH: "HIDDEN_EXECUTION_PATH_DETECTED",
    HIDDEN_AUTONOMOUS_LEARNING: "HIDDEN_AUTONOMOUS_LEARNING_DETECTED",
    POLICY_MUTATION: "POLICY_MUTATION_DETECTED",
    CONSTITUTIONAL_MUTATION: "CONSTITUTIONAL_MUTATION_DETECTED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
    MISSING_CONSTITUTIONAL_EVIDENCE: "CONSTITUTIONAL_EVIDENCE_MISSING",
    INCOMPLETE_VALIDATION_LINEAGE: "VALIDATION_LINEAGE_INCOMPLETE",
    UNVERIFIED_AUTONOMOUS_SUBSYSTEM: "UNVERIFIED_AUTONOMOUS_SUBSYSTEM_DETECTED",
  };
  return map[scenario] ?? null;
}

function affectedSubsystem(scenario: ContinuousConstitutionalScenario): ContinuousConstitutionalSubsystem {
  const map: Partial<Record<ContinuousConstitutionalScenario, ContinuousConstitutionalSubsystem>> = {
    GOVERNANCE_BYPASS: "GOVERNANCE",
    OPERATOR_AUTHORITY_OVERRIDE: "AUTHORITY",
    PRIVILEGE_ESCALATION: "DELEGATION",
    NONDETERMINISTIC_EXECUTION: "EXECUTION",
    REPLAY_MISMATCH: "REPLAY",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY",
    HIDDEN_EXECUTION_PATH: "VISIBILITY",
    HIDDEN_AUTONOMOUS_LEARNING: "LEARNING",
    POLICY_MUTATION: "GOVERNANCE",
    CONSTITUTIONAL_MUTATION: "GOVERNANCE",
    TENANT_ISOLATION_FAILURE: "AUTHORITY",
    MISSING_CONSTITUTIONAL_EVIDENCE: "VISIBILITY",
    INCOMPLETE_VALIDATION_LINEAGE: "REPLAY",
    UNVERIFIED_AUTONOMOUS_SUBSYSTEM: "SUPERVISION",
  };
  return map[scenario] ?? "PLANNING";
}

function report(subsystem: ContinuousConstitutionalSubsystem, index: number, scenario: ContinuousConstitutionalScenario, failure: ContinuousConstitutionalFailure | null): ConstitutionalValidationReport {
  const affected = failure && subsystem === affectedSubsystem(scenario);
  const base = {
    validation_id: id("CCV", "continuous-constitutional-validation", { subsystem, scenario, index }),
    mission_id: "mission:constitutional-validation",
    execution_id: `execution:constitutional:${index}`,
    tenant_id: scenario === "TENANT_ISOLATION_FAILURE" && affected ? "tenant:foreign" : "tenant:alpha",
    subsystem,
    validation_timestamp: "1970-01-01T00:00:00.000Z" as const,
    constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const,
    validated_invariants: freezeArray([`invariant:${subsystem.toLowerCase()}`, "invariant:governance", "invariant:authority", "invariant:replay"]),
    validation_result: affected ? "BLOCKED" as const : index % 2 === 0 ? "VERIFIED" as const : "COMPLIANT" as const,
    compliance_score: affected ? 0 : 1,
    authority_status: affected && ["OPERATOR_AUTHORITY_OVERRIDE", "PRIVILEGE_ESCALATION"].includes(scenario) ? "FAIL" as const : "PASS" as const,
    governance_status: affected && ["GOVERNANCE_BYPASS", "POLICY_MUTATION", "CONSTITUTIONAL_MUTATION"].includes(scenario) ? "FAIL" as const : "PASS" as const,
    determinism_status: affected && scenario === "NONDETERMINISTIC_EXECUTION" ? "FAIL" as const : "PASS" as const,
    replay_status: affected && scenario === "REPLAY_MISMATCH" ? "FAIL" as const : "PASS" as const,
    integrity_status: affected && scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "FAIL" as const : "PASS" as const,
    violation_count: affected ? 1 : 0,
    risk_level: affected ? "CRITICAL" as const : "LOW" as const,
    recommendations: affected ? freezeArray(["fail closed", "notify operator", "preserve replay evidence"]) : freezeArray(["continue validation"]),
    validator_version: VERSION,
    lineage_reference: affected && scenario === "INCOMPLETE_VALIDATION_LINEAGE" ? "" : `lineage:constitutional-validation:${subsystem.toLowerCase()}`,
    replay_reference: affected && scenario === "REPLAY_MISMATCH" ? "replay:mismatch" : `replay:constitutional-validation:${subsystem.toLowerCase()}`,
    evidence_reference: affected && scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? "" : `evidence:constitutional-validation:${subsystem.toLowerCase()}`,
    failure: affected ? failure : null,
    validation_only: true as const,
    advisory_only: true as const,
    execution_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    governance_override_authorized: false as const,
    background_monitor_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: affected && scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("continuous-constitutional-report", base) });
}

function timelineEntry(report: ConstitutionalValidationReport): ConstitutionalComplianceTimelineEntry {
  const source = { timeline_id: id("CCT", "constitutional-compliance-timeline", report.validation_id), validation_id: report.validation_id, subsystem: report.subsystem, validation_result: report.validation_result, governance_decision: report.violation_count > 0 ? "FAIL_CLOSED" as const : "ALLOW_OBSERVATION" as const, authority_evaluation: report.authority_status === "FAIL" ? "VIOLATION" as const : "WITHIN_LIMITS" as const, replay_reference: report.replay_reference };
  return Object.freeze({ ...source, integrity_hash: hashValue("constitutional-compliance-timeline", source) });
}

function alertFromReport(report: ConstitutionalValidationReport): ConstitutionalViolationAlert | null {
  if (!report.failure) return null;
  const source = { alert_id: id("CCA", "constitutional-violation-alert", report.validation_id), validation_id: report.validation_id, subsystem: report.subsystem, alert_type: report.failure, severity: "CRITICAL" as const, fail_closed: true as const, operator_visible: true as const, replay_reference: report.replay_reference };
  return Object.freeze({ ...source, integrity_hash: hashValue("constitutional-violation-alert", source) });
}

function trend(domain: ConstitutionalTrendAssessment["domain"], score: number, evidence_count: number, index: number): ConstitutionalTrendAssessment {
  const source = { trend_id: id("CCTR", "constitutional-trend", { domain, index, score }), domain, score, trend_direction: score < 1 ? "DEGRADED" as const : "STABLE" as const, evidence_count, replay_reference: `replay:constitutional-trend:${index}` };
  return Object.freeze({ ...source, integrity_hash: hashValue("constitutional-trend", source) });
}

function audit(failure: ContinuousConstitutionalFailure, scenario: ContinuousConstitutionalScenario): ContinuousConstitutionalAuditRecord {
  const source = { audit_id: id("CCAUD", "continuous-constitutional-audit", { failure, scenario }), failure, immutable: true as const, append_only: true as const, evidence_reference: `evidence:continuous-constitutional:${failure}`, replay_reference: `replay:continuous-constitutional:${failure}` };
  return Object.freeze({ ...source, integrity_hash: hashValue("continuous-constitutional-audit", source) });
}

function collectFailures(repository: Omit<ContinuousConstitutionalValidationRepository, "integrity_hash"> | ContinuousConstitutionalValidationRepository): readonly ContinuousConstitutionalFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.reports.some((r) => r.validation_result === "BLOCKED" && r.failure) ? repository.reports.map((r) => r.failure).filter((failure): failure is ContinuousConstitutionalFailure => Boolean(failure)) : []),
    ...(repository.reports.some((r) => r.governance_status === "FAIL") ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(repository.reports.some((r) => r.authority_status === "FAIL") ? ["PRIVILEGE_ESCALATION_DETECTED" as const] : []),
    ...(repository.reports.some((r) => r.determinism_status === "FAIL") ? ["NONDETERMINISTIC_EXECUTION_DETECTED" as const] : []),
    ...(repository.reports.some((r) => r.replay_status === "FAIL" || r.replay_reference.includes("mismatch")) ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(repository.reports.some((r) => r.integrity_status === "FAIL" || !r.integrity_hash) ? ["INTEGRITY_VERIFICATION_FAILURE_DETECTED" as const] : []),
    ...(repository.reports.some((r) => r.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_FAILURE_DETECTED" as const] : []),
    ...(repository.reports.some((r) => !r.evidence_reference) ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(repository.reports.some((r) => !r.lineage_reference) ? ["VALIDATION_LINEAGE_INCOMPLETE" as const] : []),
  ]);
}

export function validateContinuousConstitutionalCompliance(input: ContinuousConstitutionalInput = {}): ContinuousConstitutionalValidationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const baselineValid = validateConstitutionalBaseline(baseline).valid;
  const injected = scenarioFailure(scenario);
  const reports = freezeArray(subsystems.map((subsystem, index) => report(subsystem, index, scenario, injected)));
  const timeline = freezeArray(reports.map(timelineEntry));
  const alerts = freezeArray(reports.map(alertFromReport).filter((item): item is ConstitutionalViolationAlert => Boolean(item)));
  const rawScore = reports.length === 0 ? 0 : reports.filter((item) => item.validation_result !== "BLOCKED").length / reports.length;
  const trends = freezeArray([
    trend("CONSTITUTIONAL_STABILITY", rawScore, reports.length, 0),
    trend("GOVERNANCE_HEALTH", reports.every((item) => item.governance_status === "PASS") ? 1 : 0, reports.length, 1),
    trend("AUTHORITY_CONSISTENCY", reports.every((item) => item.authority_status === "PASS") ? 1 : 0, reports.length, 2),
    trend("REPLAY_CONSISTENCY", reports.every((item) => item.replay_status === "PASS") ? 1 : 0, reports.length, 3),
    trend("SUBSYSTEM_COMPLIANCE", rawScore, reports.length, 4),
    trend("CERTIFICATION_READINESS", baselineValid && alerts.length === 0 ? 1 : 0, reports.length, 5),
  ]);
  const source = { repository_id: id("CCV", "continuous-constitutional-validation-repository", { scenario, baseline: baseline.contract_id }), baseline_contract_id: baseline.contract_id, final_state: "CONTINUOUS_CONSTITUTIONAL_VALIDATION_COMPLETE" as const, reports, timeline, alerts, trends, audit_records: freezeArray<ContinuousConstitutionalAuditRecord>([]), failures: freezeArray(injected ? [injected] : []), validation_only: true as const, advisory_only: true as const, execution_modification_authorized: false as const, authority_grant_authorized: false as const, governance_override_authorized: false as const, background_monitor_authorized: false as const };
  const failures = unique([...collectFailures(source), ...(!baselineValid ? ["CONSTITUTIONAL_RULE_VIOLATION_DETECTED" as const] : [])]);
  const audit_records = freezeArray(failures.map((failure) => audit(failure, scenario)));
  const repository = { ...source, failures, audit_records, final_state: failures.length ? "CONTINUOUS_CONSTITUTIONAL_VALIDATION_BLOCKED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("continuous-constitutional-repository", repository) });
}

export function listConstitutionalValidationReports(input: ContinuousConstitutionalInput = {}) { return validateContinuousConstitutionalCompliance(input).reports; }
export function listConstitutionalComplianceTimeline(input: ContinuousConstitutionalInput = {}) { return validateContinuousConstitutionalCompliance(input).timeline; }
export function listConstitutionalViolationAlerts(input: ContinuousConstitutionalInput = {}) { return validateContinuousConstitutionalCompliance(input).alerts; }
export function listConstitutionalTrendAssessments(input: ContinuousConstitutionalInput = {}) { return validateContinuousConstitutionalCompliance(input).trends; }
export function listContinuousConstitutionalAuditRecords(input: ContinuousConstitutionalInput = {}) { return validateContinuousConstitutionalCompliance(input).audit_records; }

export function validateContinuousConstitutionalRepository(repository = validateContinuousConstitutionalCompliance()): ContinuousConstitutionalValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILURE_DETECTED" as const] : [])]);
  const has = (failure: ContinuousConstitutionalFailure) => failures.includes(failure);
  const valid = failures.length === 0 && repository.final_state === "CONTINUOUS_CONSTITUTIONAL_VALIDATION_COMPLETE" && repository.validation_only && repository.advisory_only && !repository.execution_modification_authorized;
  const source = { repository_id: repository.repository_id, valid, baseline_valid: !has("CONSTITUTIONAL_RULE_VIOLATION_DETECTED"), all_subsystems_validated: repository.reports.length === subsystems.length, constitutional_compliance: !has("CONSTITUTIONAL_RULE_VIOLATION_DETECTED") && !has("CONSTITUTIONAL_MUTATION_DETECTED"), governance_supremacy_preserved: !has("GOVERNANCE_BYPASS_DETECTED") && !has("POLICY_MUTATION_DETECTED"), operator_supremacy_preserved: !has("OPERATOR_AUTHORITY_OVERRIDE_DETECTED"), deterministic: !has("NONDETERMINISTIC_EXECUTION_DETECTED"), replay_compatible: !has("REPLAY_MISMATCH_DETECTED"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILURE_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_FAILURE_DETECTED"), evidence_complete: !has("CONSTITUTIONAL_EVIDENCE_MISSING"), lineage_complete: !has("VALIDATION_LINEAGE_INCOMPLETE"), fail_closed: valid || failures.length > 0 || repository.final_state !== "CONTINUOUS_CONSTITUTIONAL_VALIDATION_COMPLETE", validation_only: true as const, advisory_only: true as const, execution_modification_authorized: false as const, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("continuous-constitutional-validation-result", source) });
}

export function buildContinuousConstitutionalObservabilitySurface(repository = validateContinuousConstitutionalCompliance()): ContinuousConstitutionalObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, report_count: repository.reports.length, timeline_count: repository.timeline.length, alert_count: repository.alerts.length, trend_count: repository.trends.length, audit_count: repository.audit_records.length, failure_count: repository.failures.length, validation_only: true, advisory_only: true, background_monitor_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getContinuousConstitutionalValidationEngine(): ContinuousConstitutionalValidationBundle {
  const repository = validateContinuousConstitutionalCompliance();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONTINUOUS_CONSTITUTIONAL_VALIDATION_READY", subsystems, principles: freezeArray(["deterministic-validation-cycles", "baseline-driven", "validation-only", "advisory-only", "no-background-monitor", "no-execution-modification", "fail-closed-evidence", "operator-visible", "replay-compatible"]) }), repository, validation: validateContinuousConstitutionalRepository(repository), observability: buildContinuousConstitutionalObservabilitySurface(repository) });
}
