import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { getConstitutionalBaselineContract, validateConstitutionalBaseline } from "@/services/constitutional-baseline-contract";
import { validateContinuousConstitutionalCompliance, validateContinuousConstitutionalRepository } from "@/services/continuous-constitutional-validation";
import { monitorRuntimeConstitutionalCompliance, validateRuntimeConstitutionalMonitoring } from "@/services/runtime-constitutional-monitoring";
import type {
  ConstitutionalDriftClassification,
  ConstitutionalSeverityClassification,
  ConstitutionalViolationAlert,
  ConstitutionalViolationDetectionBundle,
  ConstitutionalViolationDetectionInput,
  ConstitutionalViolationDetectionObservabilitySurface,
  ConstitutionalViolationDetectionRepository,
  ConstitutionalViolationDetectionValidationResult,
  ConstitutionalViolationDomain,
  ConstitutionalViolationEvidencePackage,
  ConstitutionalViolationFailure,
  ConstitutionalViolationLedgerRecord,
  ConstitutionalViolationRecord,
  ConstitutionalViolationScenario,
  ConstitutionalViolationSeverity,
} from "@/types/constitutional-violation-detection";

const VERSION = "constitutional-violation-detection/v8ALT.10.4" as const;
const domains = Object.freeze(["AUTHORITY_ESCALATION", "GOVERNANCE_BYPASS", "CONSTITUTIONAL_BYPASS", "HIDDEN_EXECUTION", "REPLAY_MISMATCH", "LEARNING_OUTSIDE_POLICY", "UNAUTHORIZED_OPTIMIZATION", "RUNTIME_DRIFT", "INTEGRITY_DEGRADATION", "POLICY_VIOLATION", "TENANT_LEAKAGE"] as const);
const alertTargets = Object.freeze(["CONSTITUTIONAL_GOVERNANCE_ENGINE", "RUNTIME_ASSURANCE_ENGINE", "MISSION_CONTROL_DASHBOARD", "OPERATOR_CONSOLE", "CERTIFICATION_ENGINE", "REPLAY_SYSTEM", "AUDIT_LEDGER"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioDomain(scenario: ConstitutionalViolationScenario): ConstitutionalViolationDomain | null {
  const map: Partial<Record<ConstitutionalViolationScenario, ConstitutionalViolationDomain>> = {
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION",
    OPERATOR_AUTHORITY_OVERRIDE: "AUTHORITY_ESCALATION",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    GOVERNANCE_MUTATION: "GOVERNANCE_BYPASS",
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS",
    CONSTITUTIONAL_MUTATION: "CONSTITUTIONAL_BYPASS",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION",
    MONITORING_FAILURE: "HIDDEN_EXECUTION",
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    REPLAY_NONDETERMINISM: "REPLAY_MISMATCH",
    LEARNING_OUTSIDE_POLICY: "LEARNING_OUTSIDE_POLICY",
    UNAUTHORIZED_OPTIMIZATION: "UNAUTHORIZED_OPTIMIZATION",
    UNAUTHORIZED_RECOVERY: "UNAUTHORIZED_OPTIMIZATION",
    RUNTIME_DRIFT: "RUNTIME_DRIFT",
    INTEGRITY_DEGRADATION: "INTEGRITY_DEGRADATION",
    EVIDENCE_TAMPERING: "INTEGRITY_DEGRADATION",
    MISSING_CONSTITUTIONAL_EVIDENCE: "INTEGRITY_DEGRADATION",
    POLICY_VIOLATION: "POLICY_VIOLATION",
    TENANT_LEAKAGE: "TENANT_LEAKAGE",
  };
  return map[scenario] ?? null;
}

function scenarioFailure(scenario: ConstitutionalViolationScenario): ConstitutionalViolationFailure | null {
  const map: Partial<Record<ConstitutionalViolationScenario, ConstitutionalViolationFailure>> = {
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    OPERATOR_AUTHORITY_OVERRIDE: "OPERATOR_AUTHORITY_OVERRIDE_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    GOVERNANCE_MUTATION: "GOVERNANCE_MUTATION_DETECTED",
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_DETECTED",
    CONSTITUTIONAL_MUTATION: "CONSTITUTIONAL_MUTATION_DETECTED",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
    MONITORING_FAILURE: "MONITORING_FAILURE_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    REPLAY_NONDETERMINISM: "REPLAY_NONDETERMINISM_DETECTED",
    LEARNING_OUTSIDE_POLICY: "LEARNING_OUTSIDE_POLICY_DETECTED",
    UNAUTHORIZED_OPTIMIZATION: "UNAUTHORIZED_OPTIMIZATION_DETECTED",
    UNAUTHORIZED_RECOVERY: "UNAUTHORIZED_RECOVERY_DETECTED",
    RUNTIME_DRIFT: "RUNTIME_DRIFT_DETECTED",
    INTEGRITY_DEGRADATION: "INTEGRITY_DEGRADATION_DETECTED",
    EVIDENCE_TAMPERING: "EVIDENCE_TAMPERING_DETECTED",
    MISSING_CONSTITUTIONAL_EVIDENCE: "CONSTITUTIONAL_EVIDENCE_MISSING",
    POLICY_VIOLATION: "POLICY_VIOLATION_DETECTED",
    TENANT_LEAKAGE: "TENANT_LEAKAGE_DETECTED",
  };
  return map[scenario] ?? null;
}

function severityFor(domain: ConstitutionalViolationDomain, scenario: ConstitutionalViolationScenario): ConstitutionalViolationSeverity {
  if (["CONSTITUTIONAL_MUTATION", "GOVERNANCE_MUTATION", "MONITORING_FAILURE"].includes(scenario)) return "BLOCKING";
  if (["CONSTITUTIONAL_BYPASS", "GOVERNANCE_BYPASS", "AUTHORITY_ESCALATION", "OPERATOR_AUTHORITY_OVERRIDE", "HIDDEN_EXECUTION", "REPLAY_NONDETERMINISM", "INTEGRITY_DEGRADATION", "EVIDENCE_TAMPERING", "MISSING_CONSTITUTIONAL_EVIDENCE", "TENANT_LEAKAGE"].includes(scenario)) return "CRITICAL";
  if (domain === "RUNTIME_DRIFT" || domain === "POLICY_VIOLATION" || domain === "UNAUTHORIZED_OPTIMIZATION" || domain === "LEARNING_OUTSIDE_POLICY") return "HIGH";
  if (domain === "REPLAY_MISMATCH") return "HIGH";
  return "INFO";
}

function responsePriority(severity: ConstitutionalViolationSeverity): ConstitutionalSeverityClassification["response_priority"] {
  if (severity === "BLOCKING") return "MISSION_BLOCK_REVIEW";
  if (severity === "CRITICAL") return "FAIL_CLOSED_REVIEW";
  if (severity === "HIGH") return "OPERATOR_NOTIFICATION";
  if (severity === "MEDIUM") return "GOVERNANCE_REVIEW";
  if (severity === "LOW") return "MONITOR";
  return "RECORD";
}

function driftClassification(severity: ConstitutionalViolationSeverity): ConstitutionalDriftClassification {
  if (severity === "BLOCKING" || severity === "CRITICAL") return "Critical";
  if (severity === "HIGH") return "Severe";
  if (severity === "MEDIUM") return "Moderate";
  if (severity === "LOW") return "Emerging";
  return "Stable";
}

function violation(domain: ConstitutionalViolationDomain, index: number, scenario: ConstitutionalViolationScenario, failure: ConstitutionalViolationFailure | null): ConstitutionalViolationRecord {
  const affected = Boolean(failure && domain === scenarioDomain(scenario));
  const severity = affected ? severityFor(domain, scenario) : "INFO";
  const base = {
    violation_id: id("CVD", "constitutional-violation", { domain, scenario, index }),
    mission_id: "mission:constitutional-violation-detection",
    execution_id: `execution:constitutional-violation:${index}`,
    tenant_id: affected && scenario === "TENANT_LEAKAGE" ? "tenant:foreign" : "tenant:alpha",
    constitution_version: "constitutional-baseline-contract/v8ALT.10.1" as const,
    violation_timestamp: "1970-01-01T00:00:00.000Z" as const,
    violation_category: domain,
    detected_component: `detector:${domain.toLowerCase()}`,
    affected_subsystem: `subsystem:${domain.toLowerCase()}`,
    severity,
    constitutional_rule: `constitutional-rule:${domain.toLowerCase()}`,
    policy_reference: `policy:${domain.toLowerCase()}`,
    authority_reference: `authority:${domain.toLowerCase()}`,
    governance_reference: `governance:${domain.toLowerCase()}`,
    evidence_reference: affected && ["MISSING_CONSTITUTIONAL_EVIDENCE", "EVIDENCE_TAMPERING"].includes(scenario) ? "" : `evidence:constitutional-violation:${domain.toLowerCase()}`,
    replay_reference: affected && ["REPLAY_MISMATCH", "REPLAY_NONDETERMINISM"].includes(scenario) ? "replay:constitutional-violation:mismatch" : `replay:constitutional-violation:${domain.toLowerCase()}`,
    lineage_reference: affected && scenario === "MONITORING_FAILURE" ? "" : `lineage:constitutional-violation:${domain.toLowerCase()}`,
    risk_score: affected ? (severity === "BLOCKING" ? 1 : severity === "CRITICAL" ? 0.95 : 0.8) : 0.02,
    recommended_action: affected ? "require governance review and preserve fail-closed advisory evidence" : "record compliant observation",
    validation_status: affected ? (severity === "CRITICAL" || severity === "BLOCKING" ? "FAIL_CLOSED_REQUIRED" as const : "VERIFIED_VIOLATION" as const) : "NO_VIOLATION" as const,
    failure: affected ? failure : null,
    fail_closed_required: affected && (severity === "CRITICAL" || severity === "BLOCKING"),
    advisory_only: true as const,
    detection_only: true as const,
    enforcement_authorized: false as const,
    autonomous_remediation_authorized: false as const,
    execution_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    governance_override_authorized: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: affected && scenario === "EVIDENCE_TAMPERING" ? "" : hashValue("constitutional-violation-record", base) });
}

function evidence(item: ConstitutionalViolationRecord): ConstitutionalViolationEvidencePackage {
  const base = {
    evidence_package_id: id("CVE", "constitutional-violation-evidence", item.violation_id),
    violation_id: item.violation_id,
    violation_summary: item.failure ? `${item.violation_category} produced ${item.failure}` : `${item.violation_category} observed without violation`,
    constitutional_rule_violated: item.constitutional_rule,
    triggering_event: item.failure ?? "NO_VIOLATION",
    execution_context: item.execution_id,
    mission_context: item.mission_id,
    governance_evaluation: item.governance_reference && !item.failure?.includes("GOVERNANCE") ? "PASS" as const : item.failure ? "FAIL" as const : "PASS" as const,
    authority_evaluation: item.authority_reference && !item.failure?.includes("AUTHORITY") ? "PASS" as const : item.failure ? "FAIL" as const : "PASS" as const,
    replay_snapshot: item.replay_reference,
    evidence_chain: freezeArray([item.evidence_reference, item.replay_reference, item.lineage_reference].filter(Boolean)),
    integrity_verification: item.integrity_hash && item.evidence_reference ? "VERIFIED" as const : "FAILED" as const,
    confidence_assessment: item.failure ? 0.99 : 0.97,
    forensic_references: freezeArray([`forensic:${item.violation_id}`, item.governance_reference, item.authority_reference]),
    immutable: true as const,
    tenant_isolated: item.tenant_id === "tenant:alpha",
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-violation-evidence", base) });
}

function classification(item: ConstitutionalViolationRecord): ConstitutionalSeverityClassification {
  const base = { classification_id: id("CVC", "constitutional-violation-classification", item.violation_id), violation_id: item.violation_id, violation_category: item.violation_category, severity: item.severity, drift_classification: driftClassification(item.severity), response_priority: responsePriority(item.severity), reproducible: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-violation-classification", base) });
}

function ledger(item: ConstitutionalViolationRecord): ConstitutionalViolationLedgerRecord {
  const base = { violation_record_id: id("CVL", "constitutional-violation-ledger", item.violation_id), violation_id: item.violation_id, timestamp: item.violation_timestamp, mission_id: item.mission_id, execution_id: item.execution_id, tenant_id: item.tenant_id, severity: item.severity, violation_state: item.failure ? "ESCALATED" as const : "CLOSED" as const, constitutional_reference: item.constitutional_rule, evidence_reference: item.evidence_reference, replay_reference: item.replay_reference, lineage_reference: item.lineage_reference, resolution_reference: item.failure ? "resolution:governance-review-required" : "resolution:no-violation", immutable: true as const, append_only: true as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-violation-ledger", base) });
}

function alert(item: ConstitutionalViolationRecord, evidencePackage: ConstitutionalViolationEvidencePackage): ConstitutionalViolationAlert | null {
  if (!item.failure) return null;
  const base = { alert_id: id("CVA", "constitutional-violation-alert", item.violation_id), violation_id: item.violation_id, severity: item.severity, notified_targets: alertTargets, violation_summary: `${item.violation_category} requires ${item.validation_status}`, constitutional_references: freezeArray([item.constitutional_rule, item.policy_reference]), evidence_package_id: evidencePackage.evidence_package_id, replay_reference: item.replay_reference, recommended_governance_actions: freezeArray(["preserve evidence", "notify operator", "review fail-closed requirement"]), advisory_only: true as const, autonomous_response_authorized: false as const };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-violation-alert", base) });
}

function collectFailures(repository: Omit<ConstitutionalViolationDetectionRepository, "integrity_hash"> | ConstitutionalViolationDetectionRepository): readonly ConstitutionalViolationFailure[] {
  return unique([
    ...repository.failures,
    ...repository.violations.map((item) => item.failure).filter((failure): failure is ConstitutionalViolationFailure => Boolean(failure)),
    ...(repository.violations.some((item) => !item.evidence_reference) ? ["CONSTITUTIONAL_EVIDENCE_MISSING" as const] : []),
    ...(repository.violations.some((item) => !item.lineage_reference) ? ["MONITORING_FAILURE_DETECTED" as const] : []),
    ...(repository.violations.some((item) => !item.integrity_hash) ? ["EVIDENCE_TAMPERING_DETECTED" as const] : []),
    ...(repository.violations.some((item) => item.replay_reference === "replay:constitutional-violation:mismatch") ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(repository.violations.some((item) => item.tenant_id !== "tenant:alpha") ? ["TENANT_LEAKAGE_DETECTED" as const] : []),
    ...(repository.evidence_packages.some((item) => item.integrity_verification === "FAILED") ? ["INTEGRITY_DEGRADATION_DETECTED" as const] : []),
  ]);
}

export function detectConstitutionalViolations(input: ConstitutionalViolationDetectionInput = {}): ConstitutionalViolationDetectionRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const baseline = input.baseline ?? getConstitutionalBaselineContract();
  const validationRepository = input.validationRepository ?? validateContinuousConstitutionalCompliance({ baseline });
  const runtimeRepository = input.runtimeRepository ?? monitorRuntimeConstitutionalCompliance({ baseline, validationRepository });
  const baselineValid = validateConstitutionalBaseline(baseline).valid;
  const validationValid = validateContinuousConstitutionalRepository(validationRepository).valid;
  const runtimeValid = validateRuntimeConstitutionalMonitoring(runtimeRepository).valid;
  const failure = scenarioFailure(scenario);
  const violations = freezeArray(domains.map((domain, index) => violation(domain, index, scenario, failure)));
  const evidencePackages = freezeArray(violations.map(evidence));
  const source = {
    repository_id: id("CVD", "constitutional-violation-detection", { scenario, baseline: baseline.contract_id, validation: validationRepository.repository_id, runtime: runtimeRepository.repository_id }),
    baseline_contract_id: baseline.contract_id,
    validation_repository_id: validationRepository.repository_id,
    runtime_monitoring_repository_id: runtimeRepository.repository_id,
    final_state: "CONSTITUTIONAL_VIOLATION_DETECTION_COMPLETE" as const,
    violations,
    classifications: freezeArray(violations.map(classification)),
    evidence_packages: evidencePackages,
    ledger: freezeArray(violations.map(ledger)),
    alerts: freezeArray(evidencePackages.map((pack, index) => alert(violations[index], pack)).filter((item): item is ConstitutionalViolationAlert => Boolean(item))),
    failures: freezeArray(failure ? [failure] : []),
    advisory_only: true as const,
    detection_only: true as const,
    enforcement_authorized: false as const,
    autonomous_remediation_authorized: false as const,
    execution_modification_authorized: false as const,
    authority_grant_authorized: false as const,
    governance_override_authorized: false as const,
  };
  const failures = unique([...collectFailures(source), ...(!baselineValid ? ["CONSTITUTIONAL_BYPASS_DETECTED" as const] : []), ...(!validationValid ? ["POLICY_VIOLATION_DETECTED" as const] : []), ...(!runtimeValid ? ["MONITORING_FAILURE_DETECTED" as const] : [])]);
  const repository = { ...source, failures, final_state: failures.length ? "CONSTITUTIONAL_VIOLATION_DETECTION_FAIL_CLOSED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("constitutional-violation-detection-repository", repository) });
}

export function listConstitutionalViolationRecords(input: ConstitutionalViolationDetectionInput = {}) { return detectConstitutionalViolations(input).violations; }
export function listConstitutionalSeverityClassifications(input: ConstitutionalViolationDetectionInput = {}) { return detectConstitutionalViolations(input).classifications; }
export function listConstitutionalViolationEvidence(input: ConstitutionalViolationDetectionInput = {}) { return detectConstitutionalViolations(input).evidence_packages; }
export function listConstitutionalViolationLedger(input: ConstitutionalViolationDetectionInput = {}) { return detectConstitutionalViolations(input).ledger; }
export function listConstitutionalViolationAlerts(input: ConstitutionalViolationDetectionInput = {}) { return detectConstitutionalViolations(input).alerts; }

export function validateConstitutionalViolationDetection(repository = detectConstitutionalViolations()): ConstitutionalViolationDetectionValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["EVIDENCE_TAMPERING_DETECTED" as const] : [])]);
  const valid = failures.length === 0 && repository.final_state === "CONSTITUTIONAL_VIOLATION_DETECTION_COMPLETE" && repository.advisory_only && repository.detection_only && !repository.enforcement_authorized && !repository.autonomous_remediation_authorized;
  const result = { repository_id: repository.repository_id, valid, deterministic_detection: true, evidence_complete: !failures.includes("CONSTITUTIONAL_EVIDENCE_MISSING"), replay_compatible: !failures.includes("REPLAY_MISMATCH_DETECTED") && !failures.includes("REPLAY_NONDETERMINISM_DETECTED"), lineage_complete: !failures.includes("MONITORING_FAILURE_DETECTED"), integrity_verified: !failures.includes("EVIDENCE_TAMPERING_DETECTED") && !failures.includes("INTEGRITY_DEGRADATION_DETECTED"), tenant_isolated: !failures.includes("TENANT_LEAKAGE_DETECTED"), advisory_only: true as const, detection_only: true as const, fail_closed_ready: valid || failures.length > 0 || repository.final_state !== "CONSTITUTIONAL_VIOLATION_DETECTION_COMPLETE", no_autonomous_remediation: !repository.autonomous_remediation_authorized, no_enforcement_authority: !repository.enforcement_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("constitutional-violation-detection-validation", result) });
}

export function buildConstitutionalViolationDetectionObservabilitySurface(repository = detectConstitutionalViolations()): ConstitutionalViolationDetectionObservabilitySurface {
  const critical_or_blocking_count = repository.violations.filter((item) => item.severity === "CRITICAL" || item.severity === "BLOCKING").length;
  return Object.freeze({ repository_id: repository.repository_id, final_state: repository.final_state, violation_count: repository.violations.length, classification_count: repository.classifications.length, evidence_count: repository.evidence_packages.length, ledger_count: repository.ledger.length, alert_count: repository.alerts.length, failure_count: repository.failures.length, critical_or_blocking_count, advisory_only: true, detection_only: true, enforcement_authorized: false, autonomous_remediation_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getConstitutionalViolationDetectionEngine(): ConstitutionalViolationDetectionBundle {
  const repository = detectConstitutionalViolations();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "CONSTITUTIONAL_VIOLATION_DETECTION_READY", detection_domains: domains, principles: freezeArray(["deterministic-detection", "advisory-only", "detection-only", "immutable-evidence", "append-only-ledger", "operator-visible-alerting", "tenant-isolated", "no-enforcement-authority", "no-autonomous-remediation"]) }), repository, validation: validateConstitutionalViolationDetection(repository), observability: buildConstitutionalViolationDetectionObservabilitySurface(repository) });
}
