import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runDeterministicValidation } from "@/services/deterministic-validation-engine";
import type {
  SecurityGovernanceDomain,
  SecurityGovernanceDomainResult,
  SecurityGovernanceEvidence,
  SecurityGovernanceObservabilitySurface,
  SecurityGovernanceScenario,
  SecurityGovernanceValidationInput,
  SecurityGovernanceValidationReport,
  SecurityGovernanceValidationResult,
  SecurityGovernanceViolation,
  SecurityRiskLevel,
} from "@/types/security-governance-validation-engine";

const NOW = "2026-07-01T09:00:00.000Z";
const ENGINE_VERSION = "security-governance-validation-engine/v8K.3" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:security-governance-validation:8k3:primary";
const LINEAGE_REFERENCE = "lineage:security-governance-validation:8k3:primary";
const domains: readonly SecurityGovernanceDomain[] = ["GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "POLICY", "SECURITY", "BOUNDARY", "TENANT", "VISIBILITY", "FAIL_CLOSED"];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const violationByScenario: Partial<Record<SecurityGovernanceScenario, SecurityGovernanceViolation>> = Object.freeze({
  GOVERNANCE_VALIDATION_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
  CONSTITUTIONAL_VALIDATION_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
  AUTHORITY_VALIDATION_FAILURE: "AUTHORITY_VALIDATION_FAILED",
  POLICY_VALIDATION_FAILURE: "POLICY_VALIDATION_FAILED",
  SECURITY_BOUNDARY_VIOLATION: "SECURITY_BOUNDARY_VIOLATION_DETECTED",
  PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_DETECTED",
  UNAUTHORIZED_EXECUTION: "UNAUTHORIZED_EXECUTION_DETECTED",
  GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
  CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_DETECTED",
  HIDDEN_EXECUTION_DETECTED: "HIDDEN_EXECUTION_DETECTED",
  HIDDEN_GOVERNANCE_STATE_DETECTED: "HIDDEN_GOVERNANCE_STATE_DETECTED",
  TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
  CROSS_TENANT_ACCESS_DETECTED: "CROSS_TENANT_ACCESS_DETECTED",
  REPLAY_EVIDENCE_MODIFIED: "REPLAY_EVIDENCE_MODIFIED",
  INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  FAIL_OPEN_BEHAVIOR_DETECTED: "FAIL_OPEN_BEHAVIOR_DETECTED",
  INCOMPLETE_CERTIFICATION_EVIDENCE: "CERTIFICATION_EVIDENCE_INCOMPLETE",
});

function domainForViolation(violation: SecurityGovernanceViolation | null): SecurityGovernanceDomain | null {
  if (!violation) return null;
  if (["GOVERNANCE_VALIDATION_FAILED", "GOVERNANCE_BYPASS_DETECTED", "HIDDEN_GOVERNANCE_STATE_DETECTED"].includes(violation)) return "GOVERNANCE";
  if (["CONSTITUTIONAL_VALIDATION_FAILED", "CONSTITUTIONAL_BYPASS_DETECTED"].includes(violation)) return "CONSTITUTIONAL";
  if (["AUTHORITY_VALIDATION_FAILED", "PRIVILEGE_ESCALATION_DETECTED", "UNAUTHORIZED_EXECUTION_DETECTED"].includes(violation)) return "AUTHORITY";
  if (violation === "POLICY_VALIDATION_FAILED") return "POLICY";
  if (["SECURITY_BOUNDARY_VIOLATION_DETECTED", "HIDDEN_EXECUTION_DETECTED", "REPLAY_EVIDENCE_MODIFIED", "INTEGRITY_VERIFICATION_FAILED"].includes(violation)) return "SECURITY";
  if (["TENANT_ISOLATION_FAILURE_DETECTED", "CROSS_TENANT_ACCESS_DETECTED"].includes(violation)) return "TENANT";
  if (violation === "FAIL_OPEN_BEHAVIOR_DETECTED" || violation === "CERTIFICATION_EVIDENCE_INCOMPLETE") return "FAIL_CLOSED";
  return "BOUNDARY";
}

function riskFor(violation: SecurityGovernanceViolation | null): SecurityRiskLevel {
  if (!violation) return "NONE";
  if (["CROSS_TENANT_ACCESS_DETECTED", "FAIL_OPEN_BEHAVIOR_DETECTED", "PRIVILEGE_ESCALATION_DETECTED", "UNAUTHORIZED_EXECUTION_DETECTED"].includes(violation)) return "CRITICAL";
  if (["GOVERNANCE_BYPASS_DETECTED", "CONSTITUTIONAL_BYPASS_DETECTED", "INTEGRITY_VERIFICATION_FAILED", "REPLAY_EVIDENCE_MODIFIED"].includes(violation)) return "HIGH";
  return "MEDIUM";
}

function evidence(domain: SecurityGovernanceDomain, scenario: SecurityGovernanceScenario): SecurityGovernanceEvidence {
  const incomplete = scenario === "INCOMPLETE_CERTIFICATION_EVIDENCE" && domain === "FAIL_CLOSED";
  const source = {
    evidence_id: id("SGE", "security-governance-evidence-id", domain),
    domain,
    tenant_id: scenario === "CROSS_TENANT_ACCESS_DETECTED" && domain === "TENANT" ? "tenant:other" : TENANT_ID,
    mission_id: MISSION_ID,
    governance_reference: incomplete ? "" : `governance:8k3:${domain.toLowerCase()}`,
    constitutional_reference: incomplete ? "" : `constitutional:8k3:${domain.toLowerCase()}`,
    authority_reference: incomplete ? "" : `authority:8k3:${domain.toLowerCase()}`,
    policy_reference: incomplete ? "" : `policy:8k3:${domain.toLowerCase()}`,
    replay_reference: incomplete || scenario === "REPLAY_EVIDENCE_MODIFIED" && domain === "SECURITY" ? "" : `${REPLAY_REFERENCE}:${domain.toLowerCase()}`,
    lineage_reference: incomplete ? "" : `${LINEAGE_REFERENCE}:${domain.toLowerCase()}`,
    integrity_hash: incomplete || scenario === "INTEGRITY_VERIFICATION_FAILURE" && domain === "SECURITY" ? "" : hashValue("security-governance-evidence-integrity", domain),
    immutable_reference: incomplete ? "" : `immutable:security-governance:${domain.toLowerCase()}:8k3`,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("security-governance-evidence", source) });
}

function result(domain: SecurityGovernanceDomain, scenario: SecurityGovernanceScenario, evidenceRefs: readonly string[]): SecurityGovernanceDomainResult {
  const violation = violationByScenario[scenario] ?? null;
  const hit = domainForViolation(violation) === domain || (domain === "BOUNDARY" && violation === "SECURITY_BOUNDARY_VIOLATION_DETECTED") || (domain === "VISIBILITY" && ["HIDDEN_EXECUTION_DETECTED", "HIDDEN_GOVERNANCE_STATE_DETECTED"].includes(violation ?? ""));
  const source = {
    result_id: id("SGR", "security-governance-result-id", domain),
    domain,
    status: hit ? "FAIL" as const : "PASS" as const,
    score: hit ? 0 : 1,
    detected_violation: hit ? violation : null,
    risk_level: riskFor(hit ? violation : null),
    explanation: hit ? `${domain} validation detected ${violation}.` : `${domain} validation passed with enforced controls.`,
    evidence_refs: freezeArray(evidenceRefs),
  };
  return Object.freeze({ ...source, result_hash: hashValue("security-governance-domain-result", source) });
}

export function computeSecurityGovernanceValidationReportHash(report: Omit<SecurityGovernanceValidationReport, "report_hash"> | SecurityGovernanceValidationReport): string {
  const { report_hash: _hash, ...source } = report as SecurityGovernanceValidationReport;
  return hashValue("security-governance-validation-report", source);
}

export function runSecurityGovernanceValidation(input: SecurityGovernanceValidationInput = {}): SecurityGovernanceValidationReport {
  const scenario = input.scenario ?? "BASELINE";
  const component = input.component ?? "CONTROLLED_AUTONOMY";
  const deterministic = runDeterministicValidation({ component });
  const evidenceRecords = freezeArray(domains.map((domain) => evidence(domain, scenario)));
  const evidenceRefs = evidenceRecords.map((item) => item.evidence_hash);
  const results = Object.fromEntries(domains.map((domain) => [domain, result(domain, scenario, evidenceRefs)])) as Record<SecurityGovernanceDomain, SecurityGovernanceDomainResult>;
  const violations = uniq(Object.values(results).map((item) => item.detected_violation).filter((item): item is SecurityGovernanceViolation => Boolean(item)));
  const evidenceIncomplete = evidenceRecords.some((item) => !item.governance_reference || !item.constitutional_reference || !item.authority_reference || !item.policy_reference || !item.replay_reference || !item.lineage_reference || !item.integrity_hash || !item.immutable_reference);
  const tenantViolation = evidenceRecords.some((item) => item.tenant_id !== TENANT_ID);
  const detected = uniq([...violations, ...(evidenceIncomplete ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []), ...(tenantViolation ? ["CROSS_TENANT_ACCESS_DETECTED" as const] : [])]);
  const score = Number((Object.values(results).filter((item) => item.status === "PASS").length / domains.length).toFixed(4));
  const integrity_hash = hashValue("security-governance-validation-integrity", { evidence: evidenceRecords.map((item) => item.evidence_hash), results: Object.values(results).map((item) => item.result_hash), deterministic: deterministic.report_hash });
  const base = {
    validation_id: id("SGV", "security-governance-validation-id", { scenario, component }),
    engine_version: ENGINE_VERSION,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    component,
    validation_scope: freezeArray(domains),
    governance_validation: results.GOVERNANCE,
    constitutional_validation: results.CONSTITUTIONAL,
    authority_validation: results.AUTHORITY,
    policy_validation: results.POLICY,
    security_validation: results.SECURITY,
    boundary_validation: results.BOUNDARY,
    tenant_validation: results.TENANT,
    visibility_validation: results.VISIBILITY,
    fail_closed_validation: results.FAIL_CLOSED,
    validation_state: "COMPLETE" as const,
    overall_security_score: score,
    detected_violations: detected,
    detected_risks: freezeArray(detected.map((violation) => `${riskFor(violation)}:${violation}`)),
    recommendations: detected.length === 0 ? freezeArray(["Security and governance validation passed."]) : freezeArray(detected.map((violation) => `Resolve ${violation} before certification.`)),
    operator_required: detected.length > 0,
    lineage_reference: LINEAGE_REFERENCE,
    replay_reference: REPLAY_REFERENCE,
    integrity_hash,
    evidence: evidenceRecords,
    deterministic_validation: deterministic,
    validation_timestamp: NOW,
    metadata: Object.freeze({ zero_trust: "true", fail_closed: "true", governance_supremacy: "true", constitutional_supremacy: "true" }),
  };
  return Object.freeze({ ...base, report_hash: computeSecurityGovernanceValidationReportHash(base as Omit<SecurityGovernanceValidationReport, "report_hash">) });
}

export function validateSecurityGovernanceValidationReport(report?: SecurityGovernanceValidationReport): SecurityGovernanceValidationResult {
  if (!report) {
    const violations = freezeArray<SecurityGovernanceViolation>(["CERTIFICATION_EVIDENCE_INCOMPLETE"]);
    const source = { validation_id: null, valid: false, report_hash_valid: false, evidence_complete: false, violations };
    return Object.freeze({ ...source, validation_hash: hashValue("security-governance-validation-validation", source) });
  }
  const report_hash_valid = computeSecurityGovernanceValidationReportHash(report) === report.report_hash;
  const evidence_complete = report.evidence.every((item) => item.evidence_hash && item.replay_reference && item.lineage_reference && item.integrity_hash && item.tenant_id === TENANT_ID);
  const valid = report.detected_violations.length === 0 && report.overall_security_score === 1 && report_hash_valid && evidence_complete;
  const source = { validation_id: report.validation_id, valid, report_hash_valid, evidence_complete, violations: report.detected_violations };
  return Object.freeze({ ...source, validation_hash: hashValue("security-governance-validation-validation", source) });
}

export function buildSecurityGovernanceObservabilitySurface(report = runSecurityGovernanceValidation()): SecurityGovernanceObservabilitySurface {
  return Object.freeze({
    validation_id: report.validation_id,
    validation_state: report.validation_state,
    overall_security_score: report.overall_security_score,
    violations: report.detected_violations,
    risks: report.detected_risks,
    operator_required: report.operator_required,
    evidence_records: report.evidence.length,
    report_hash: report.report_hash,
  });
}

export function getSecurityGovernanceValidationContract() {
  const report = runSecurityGovernanceValidation();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["governance-supremacy", "constitutional-supremacy", "operator-supremacy", "least-privilege", "zero-trust", "defense-in-depth", "tenant-isolation", "fail-closed"]),
      engine_version: ENGINE_VERSION,
      validation_states: freezeArray(["REGISTERED", "IDENTITY_VALIDATION", "GOVERNANCE_VALIDATION", "CONSTITUTIONAL_VALIDATION", "AUTHORITY_VALIDATION", "POLICY_VALIDATION", "BOUNDARY_VALIDATION", "TENANT_VALIDATION", "VISIBILITY_VALIDATION", "FAIL_CLOSED_VALIDATION", "ASSESSMENT", "COMPLETE"] as const),
      validation_scope: freezeArray(domains),
    }),
    report,
    validation: validateSecurityGovernanceValidationReport(report),
    observability: buildSecurityGovernanceObservabilitySurface(report),
  });
}
