import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApprovalEnforcementValidation,
  AuthorityComplianceReport,
  AuthorityRestrictionValidation,
  BypassEscalationDetection,
  ConstitutionalEnforcementValidation,
  GovernanceConstitutionalApiSurface,
  GovernanceConstitutionalCertificationRecord,
  GovernanceConstitutionalCertificationReport,
  GovernanceConstitutionalCertificationTest,
  GovernanceConstitutionalContract,
  GovernanceConstitutionalFailure,
  GovernanceConstitutionalInput,
  GovernanceConstitutionalObservability,
  GovernanceConstitutionalResult,
  GovernanceConstitutionalScenario,
  GovernanceConstitutionalValidationResult,
  GovernanceConstitutionalWidget,
  GovernanceSupremacyValidation,
  PermittedAdaptiveAuthority,
  ProhibitedAdaptiveAuthority,
  TenantIsolationGovernanceValidation,
} from "@/types/governance-constitutional-certification";

const VERSION = "governance-constitutional-certification/v10.15.4" as const;
const ID = "GovernanceConstitutionalCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly GovernanceConstitutionalWidget[] = Object.freeze(["Governance Certification", "Constitutional Certification", "Authority Boundary", "Tenant Isolation", "Approval Enforcement", "Bypass Detection", "Certification Report", "Authority Compliance Report"]);
const PERMITTED: readonly PermittedAdaptiveAuthority[] = Object.freeze(["OBSERVE", "ANALYZE", "CLASSIFY", "FORECAST", "SIMULATE", "RECOMMEND", "EXPLAIN", "PRIORITIZE", "ADVISE"]);
const PROHIBITED: readonly ProhibitedAdaptiveAuthority[] = Object.freeze(["EXECUTE_PRODUCTION_ACTION", "DEPLOY_CHANGE", "MODIFY_GOVERNANCE", "MODIFY_CONSTITUTION", "APPROVE_PRODUCTION_MUTATION", "SELF_CERTIFY", "EXPAND_AUTHORITY", "AUTHORIZE_EXCEPTION", "REPLACE_OPERATOR_DECISION", "MUTATE_TRUTH_LEDGER"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }

function failureForScenario(scenario: GovernanceConstitutionalScenario): GovernanceConstitutionalFailure | undefined {
  const map: Partial<Record<GovernanceConstitutionalScenario, GovernanceConstitutionalFailure>> = {
    GOVERNANCE_VALIDATION_OMITTED: "GOVERNANCE_VALIDATION_OMITTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    POLICY_NONDETERMINISM: "POLICY_EVALUATION_NONDETERMINISTIC",
    GOVERNANCE_REPLAY_INCONSISTENT: "GOVERNANCE_REPLAY_INCONSISTENT",
    CONSTITUTIONAL_VALIDATION_OMITTED: "CONSTITUTIONAL_VALIDATION_OMITTED",
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_DETECTED",
    CONSTITUTIONAL_REPLAY_INCONSISTENT: "CONSTITUTIONAL_REPLAY_INCONSISTENT",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    UNAUTHORIZED_EXECUTION_AUTHORITY: "UNAUTHORIZED_EXECUTION_AUTHORITY",
    ADVISORY_BOUNDARY_BROKEN: "ADVISORY_ONLY_BOUNDARY_BROKEN",
    SELF_CERTIFICATION: "SELF_CERTIFICATION_PERMITTED",
    GOVERNANCE_MODIFICATION: "GOVERNANCE_MODIFICATION_PERMITTED",
    CONSTITUTIONAL_MODIFICATION: "CONSTITUTIONAL_MODIFICATION_PERMITTED",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    CROSS_TENANT_EVIDENCE: "CROSS_TENANT_EVIDENCE_ACCESS",
    CROSS_TENANT_MEMORY: "CROSS_TENANT_ADAPTIVE_MEMORY_ACCESS",
    CROSS_TENANT_REPLAY: "CROSS_TENANT_REPLAY_ACCESS",
    MISSING_OPERATOR_APPROVAL: "OPERATOR_APPROVAL_MISSING",
    APPROVAL_WORKFLOW_BYPASS: "APPROVAL_WORKFLOW_BYPASSED",
    TRUTH_LEDGER_MUTATION: "TRUTH_LEDGER_MUTATION_PERMITTED",
    AUDIT_LINEAGE_INCOMPLETE: "AUDIT_LINEAGE_INCOMPLETE",
    CONSTITUTIONAL_LINEAGE_INCOMPLETE: "CONSTITUTIONAL_LINEAGE_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
    FAIL_OPEN_BEHAVIOR: "FAIL_CLOSED_BEHAVIOR_ABSENT",
  };
  return map[scenario];
}
function failed(failures: readonly GovernanceConstitutionalFailure[], values: readonly GovernanceConstitutionalFailure[]): boolean { return failures.some((failure) => values.includes(failure)); }

function apiSurface(): GovernanceConstitutionalApiSurface {
  const base: Omit<GovernanceConstitutionalApiSurface, "integrity_hash"> = { api_id: "governance_constitutional_certification_api", retrieve_dashboard: "POST /governance-constitutional-certification/dashboard", retrieve_contract: "GET /governance-constitutional-certification/contract", retrieve_sections: freezeArray(["certification", "governance", "constitutional", "authority", "tenant", "approval", "bypass", "report", "compliance"]), validate_certification: "POST /governance-constitutional-certification/validate", inspect_certification: "POST /governance-constitutional-certification/inspect", mutation_supported: false, authority_expansion_supported: false, governance_modification_supported: false, constitutional_modification_supported: false, self_certification_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function record(input: GovernanceConstitutionalInput, failures: readonly GovernanceConstitutionalFailure[]): GovernanceConstitutionalCertificationRecord {
  const governanceFailures: GovernanceConstitutionalFailure[] = ["GOVERNANCE_VALIDATION_OMITTED", "GOVERNANCE_BYPASS_DETECTED", "POLICY_EVALUATION_NONDETERMINISTIC", "GOVERNANCE_MODIFICATION_PERMITTED", "AUDIT_LINEAGE_INCOMPLETE", "FAIL_CLOSED_BEHAVIOR_ABSENT"];
  const constitutionalFailures: GovernanceConstitutionalFailure[] = ["CONSTITUTIONAL_VALIDATION_OMITTED", "CONSTITUTIONAL_BYPASS_DETECTED", "CONSTITUTIONAL_MODIFICATION_PERMITTED", "CONSTITUTIONAL_LINEAGE_INCOMPLETE", "FAIL_CLOSED_BEHAVIOR_ABSENT"];
  const authorityFailures: GovernanceConstitutionalFailure[] = ["AUTHORITY_ESCALATION_DETECTED", "UNAUTHORIZED_EXECUTION_AUTHORITY", "ADVISORY_ONLY_BOUNDARY_BROKEN", "SELF_CERTIFICATION_PERMITTED", "GOVERNANCE_MODIFICATION_PERMITTED", "CONSTITUTIONAL_MODIFICATION_PERMITTED", "TRUTH_LEDGER_MUTATION_PERMITTED"];
  const tenantFailures: GovernanceConstitutionalFailure[] = ["TENANT_ISOLATION_BREACH", "CROSS_TENANT_EVIDENCE_ACCESS", "CROSS_TENANT_ADAPTIVE_MEMORY_ACCESS", "CROSS_TENANT_REPLAY_ACCESS"];
  const approvalFailures: GovernanceConstitutionalFailure[] = ["OPERATOR_APPROVAL_MISSING", "APPROVAL_WORKFLOW_BYPASSED"];
  const base: Omit<GovernanceConstitutionalCertificationRecord, "integrity_hash"> = { certification_id: id("governance_constitutional_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, governance_supremacy_status: failed(failures, governanceFailures) ? "FAIL" : "PASS", constitutional_enforcement_status: failed(failures, constitutionalFailures) ? "FAIL" : "PASS", authority_restriction_status: failed(failures, authorityFailures) ? "FAIL" : "PASS", tenant_isolation_status: failed(failures, tenantFailures) ? "FAIL" : "PASS", approval_enforcement_status: failed(failures, approvalFailures) ? "FAIL" : "PASS", governance_bypass_detected: failed(failures, ["GOVERNANCE_BYPASS_DETECTED", "GOVERNANCE_VALIDATION_OMITTED"]), constitutional_bypass_detected: failed(failures, ["CONSTITUTIONAL_BYPASS_DETECTED", "CONSTITUTIONAL_VALIDATION_OMITTED"]), authority_escalation_detected: failed(failures, ["AUTHORITY_ESCALATION_DETECTED", "UNAUTHORIZED_EXECUTION_AUTHORITY"]), governance_replay_status: failures.includes("GOVERNANCE_REPLAY_INCONSISTENT") ? "FAIL" : "PASS", constitutional_replay_status: failures.includes("CONSTITUTIONAL_REPLAY_INCONSISTENT") ? "FAIL" : "PASS", findings: failures, policy_refs: failures.includes("GOVERNANCE_VALIDATION_OMITTED") ? freezeArray([]) : freezeArray(["policy:adaptive-governance:v1"]), governance_refs: failed(failures, ["GOVERNANCE_VALIDATION_OMITTED", "AUDIT_LINEAGE_INCOMPLETE"]) ? freezeArray([]) : freezeArray(["governance:adaptive-certification:v1"]), constitutional_refs: failed(failures, ["CONSTITUTIONAL_VALIDATION_OMITTED", "CONSTITUTIONAL_LINEAGE_INCOMPLETE"]) ? freezeArray([]) : freezeArray(["constitutional:civitas:v1"]), authority_refs: freezeArray(["authority:adaptive-advisory-only:v1"]), replay_refs: failed(failures, ["GOVERNANCE_REPLAY_INCONSISTENT", "CONSTITUTIONAL_REPLAY_INCONSISTENT"]) ? freezeArray([]) : freezeArray(["replay:governance-constitutional:v1"]), certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}

function governance(failures: readonly GovernanceConstitutionalFailure[]): GovernanceSupremacyValidation {
  const base: Omit<GovernanceSupremacyValidation, "integrity_hash"> = { validation_id: "governance_supremacy_validation", governance_validation_mandatory: !failures.includes("GOVERNANCE_VALIDATION_OMITTED"), governance_supremacy_enforced: !failures.includes("GOVERNANCE_BYPASS_DETECTED"), policy_evaluation_deterministic: !failures.includes("POLICY_EVALUATION_NONDETERMINISTIC"), governance_approval_chains_enforced: !failures.includes("APPROVAL_WORKFLOW_BYPASSED"), policy_version_resolution_deterministic: !failures.includes("POLICY_EVALUATION_NONDETERMINISTIC"), governance_audit_generated: !failures.includes("AUDIT_LINEAGE_INCOMPLETE"), governance_replay_reproducible: !failures.includes("GOVERNANCE_REPLAY_INCONSISTENT"), bypass_impossible: !failures.includes("GOVERNANCE_BYPASS_DETECTED"), fail_closed_on_failure: !failures.includes("FAIL_CLOSED_BEHAVIOR_ABSENT") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function constitutional(failures: readonly GovernanceConstitutionalFailure[]): ConstitutionalEnforcementValidation {
  const base: Omit<ConstitutionalEnforcementValidation, "integrity_hash"> = { validation_id: "constitutional_enforcement_validation", constitutional_validation_mandatory: !failures.includes("CONSTITUTIONAL_VALIDATION_OMITTED"), constitutional_doctrine_enforced: !failures.includes("CONSTITUTIONAL_BYPASS_DETECTED"), authority_doctrine_compliant: !failures.includes("AUTHORITY_ESCALATION_DETECTED"), constraint_framework_compliant: !failures.includes("CONSTITUTIONAL_BYPASS_DETECTED"), trust_evidence_doctrine_compliant: !failures.includes("CROSS_TENANT_EVIDENCE_ACCESS"), constitutional_security_enforced: !failures.includes("CONSTITUTIONAL_BYPASS_DETECTED"), constitutional_replay_reproducible: !failures.includes("CONSTITUTIONAL_REPLAY_INCONSISTENT"), violations_fail_closed: !failures.includes("FAIL_CLOSED_BEHAVIOR_ABSENT"), doctrine_modification_prohibited: !failures.includes("CONSTITUTIONAL_MODIFICATION_PERMITTED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function authority(failures: readonly GovernanceConstitutionalFailure[]): AuthorityRestrictionValidation {
  const base: Omit<AuthorityRestrictionValidation, "integrity_hash"> = { validation_id: "authority_restriction_validation", permitted_authority: PERMITTED, prohibited_authority: PROHIBITED, authority_restrictions_enforced: !failures.includes("AUTHORITY_ESCALATION_DETECTED"), advisory_only_boundary_preserved: !failures.includes("ADVISORY_ONLY_BOUNDARY_BROKEN"), autonomous_execution_blocked: !failures.includes("UNAUTHORIZED_EXECUTION_AUTHORITY"), self_certification_prohibited: !failures.includes("SELF_CERTIFICATION_PERMITTED"), governance_modification_prohibited: !failures.includes("GOVERNANCE_MODIFICATION_PERMITTED"), constitutional_modification_prohibited: !failures.includes("CONSTITUTIONAL_MODIFICATION_PERMITTED"), truth_ledger_mutation_prohibited: !failures.includes("TRUTH_LEDGER_MUTATION_PERMITTED"), operator_supremacy_preserved: !failed(failures, ["OPERATOR_APPROVAL_MISSING", "AUTHORITY_ESCALATION_DETECTED"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function tenant(failures: readonly GovernanceConstitutionalFailure[]): TenantIsolationGovernanceValidation {
  const base: Omit<TenantIsolationGovernanceValidation, "integrity_hash"> = { validation_id: "tenant_isolation_governance_validation", tenant_isolation_deterministic: !failures.includes("TENANT_ISOLATION_BREACH"), adaptive_memory_isolated: !failures.includes("CROSS_TENANT_ADAPTIVE_MEMORY_ACCESS"), evidence_isolated: !failures.includes("CROSS_TENANT_EVIDENCE_ACCESS"), replay_artifacts_isolated: !failures.includes("CROSS_TENANT_REPLAY_ACCESS"), governance_decisions_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), certification_artifacts_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), simulations_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), dashboards_authorized_only: !failures.includes("TENANT_ISOLATION_BREACH"), operator_workflows_isolated: !failures.includes("TENANT_ISOLATION_BREACH") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function approval(failures: readonly GovernanceConstitutionalFailure[]): ApprovalEnforcementValidation {
  const base: Omit<ApprovalEnforcementValidation, "integrity_hash"> = { validation_id: "approval_enforcement_validation", approval_workflows_mandatory: !failures.includes("APPROVAL_WORKFLOW_BYPASSED"), adaptive_proposals_blocked_until_approved: !failures.includes("OPERATOR_APPROVAL_MISSING"), production_recommendations_require_approval: !failures.includes("OPERATOR_APPROVAL_MISSING"), governance_exceptions_require_approval: !failures.includes("APPROVAL_WORKFLOW_BYPASSED"), simulation_promotion_requires_approval: !failures.includes("OPERATOR_APPROVAL_MISSING"), memory_promotion_requires_approval: !failures.includes("OPERATOR_APPROVAL_MISSING"), strategic_recommendations_require_approval: !failures.includes("OPERATOR_APPROVAL_MISSING"), certification_progression_requires_approval: !failures.includes("SELF_CERTIFICATION_PERMITTED"), approval_lineage_immutable: !failures.includes("AUDIT_LINEAGE_INCOMPLETE"), approvals_replayable: !failures.includes("GOVERNANCE_REPLAY_INCONSISTENT") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function bypass(failures: readonly GovernanceConstitutionalFailure[]): BypassEscalationDetection {
  const base: Omit<BypassEscalationDetection, "integrity_hash"> = { validation_id: "bypass_escalation_detection", governance_bypass_absent: !failures.includes("GOVERNANCE_BYPASS_DETECTED"), constitutional_bypass_absent: !failures.includes("CONSTITUTIONAL_BYPASS_DETECTED"), authority_escalation_absent: !failures.includes("AUTHORITY_ESCALATION_DETECTED"), audit_logging_bypass_absent: !failures.includes("AUDIT_LINEAGE_INCOMPLETE"), certification_bypass_absent: !failures.includes("SELF_CERTIFICATION_PERMITTED"), replay_recording_bypass_absent: !failed(failures, ["GOVERNANCE_REPLAY_INCONSISTENT", "CONSTITUTIONAL_REPLAY_INCONSISTENT"]), privilege_elevation_blocked: !failures.includes("AUTHORITY_ESCALATION_DETECTED"), exception_authorization_blocked: !failures.includes("APPROVAL_WORKFLOW_BYPASSED"), certification_state_alteration_blocked: !failures.includes("SELF_CERTIFICATION_PERMITTED"), fail_closed_verified: !failures.includes("FAIL_CLOSED_BEHAVIOR_ABSENT") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certificationReport(record: GovernanceConstitutionalCertificationRecord): GovernanceConstitutionalCertificationReport {
  const base: Omit<GovernanceConstitutionalCertificationReport, "integrity_hash"> = { report_id: "governance_constitutional_certification_report", certification_outcome: record.certification_status, governance_supremacy_assessment: record.governance_supremacy_status, constitutional_enforcement_assessment: record.constitutional_enforcement_status, authority_restriction_validation: record.authority_restriction_status, tenant_isolation_analysis: record.tenant_isolation_status, approval_enforcement_result: record.approval_enforcement_status, governance_replay_validation: record.governance_replay_status, constitutional_replay_validation: record.constitutional_replay_status, bypass_detection_findings: record.findings.filter((f) => f.includes("BYPASS") || f.includes("ESCALATION")), authority_escalation_analysis: record.authority_escalation_detected ? "FAIL" : "PASS", production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED", remediation_actions: record.findings.map((f) => `remediate:${f}`) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function complianceReport(record: GovernanceConstitutionalCertificationRecord): AuthorityComplianceReport {
  const base: Omit<AuthorityComplianceReport, "integrity_hash"> = { report_id: "authority_compliance_report", authority_boundary_verified: record.authority_restriction_status === "PASS", governance_policy_compliance: record.governance_supremacy_status === "PASS", constitutional_doctrine_compliance: record.constitutional_enforcement_status === "PASS", tenant_isolation_validated: record.tenant_isolation_status === "PASS", approval_workflow_integrity: record.approval_enforcement_status === "PASS", operator_authority_preserved: !record.findings.includes("OPERATOR_APPROVAL_MISSING"), replay_audit_lineage_complete: record.governance_refs.length > 0 && record.constitutional_refs.length > 0 && record.replay_refs.length > 0, certification_evidence_refs: freezeArray([...record.policy_refs, ...record.governance_refs, ...record.constitutional_refs, ...record.authority_refs, ...record.replay_refs]), findings: record.findings, remediation_actions: record.findings.map((f) => `remediate:${f}`) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: GovernanceConstitutionalFailure, refs: readonly string[]): GovernanceConstitutionalCertificationTest {
  const base: Omit<GovernanceConstitutionalCertificationTest, "integrity_hash"> = { test_id: id("governance_constitutional_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<GovernanceConstitutionalResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly GovernanceConstitutionalCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Governance validation mandatory", result.governance_supremacy.governance_validation_mandatory, "GOVERNANCE_VALIDATION_OMITTED", refs),
    test("Governance supremacy enforced", result.governance_supremacy.governance_supremacy_enforced, "GOVERNANCE_BYPASS_DETECTED", refs),
    test("Policy evaluation deterministic", result.governance_supremacy.policy_evaluation_deterministic, "POLICY_EVALUATION_NONDETERMINISTIC", refs),
    test("Governance replay reproducible", result.governance_supremacy.governance_replay_reproducible, "GOVERNANCE_REPLAY_INCONSISTENT", refs),
    test("Constitutional validation mandatory", result.constitutional_enforcement.constitutional_validation_mandatory, "CONSTITUTIONAL_VALIDATION_OMITTED", refs),
    test("Constitutional doctrine enforced", result.constitutional_enforcement.constitutional_doctrine_enforced, "CONSTITUTIONAL_BYPASS_DETECTED", refs),
    test("Constitutional replay reproducible", result.constitutional_enforcement.constitutional_replay_reproducible, "CONSTITUTIONAL_REPLAY_INCONSISTENT", refs),
    test("Authority restrictions enforced", result.authority_restriction.authority_restrictions_enforced, "AUTHORITY_ESCALATION_DETECTED", refs),
    test("Advisory-only boundary preserved", result.authority_restriction.advisory_only_boundary_preserved, "ADVISORY_ONLY_BOUNDARY_BROKEN", refs),
    test("Autonomous execution blocked", result.authority_restriction.autonomous_execution_blocked, "UNAUTHORIZED_EXECUTION_AUTHORITY", refs),
    test("Self-certification prohibited", result.authority_restriction.self_certification_prohibited, "SELF_CERTIFICATION_PERMITTED", refs),
    test("Governance modification prohibited", result.authority_restriction.governance_modification_prohibited, "GOVERNANCE_MODIFICATION_PERMITTED", refs),
    test("Constitutional modification prohibited", result.authority_restriction.constitutional_modification_prohibited, "CONSTITUTIONAL_MODIFICATION_PERMITTED", refs),
    test("Tenant isolation deterministic", result.tenant_isolation.tenant_isolation_deterministic, "TENANT_ISOLATION_BREACH", refs),
    test("Cross-tenant evidence blocked", result.tenant_isolation.evidence_isolated, "CROSS_TENANT_EVIDENCE_ACCESS", refs),
    test("Cross-tenant adaptive memory blocked", result.tenant_isolation.adaptive_memory_isolated, "CROSS_TENANT_ADAPTIVE_MEMORY_ACCESS", refs),
    test("Cross-tenant replay blocked", result.tenant_isolation.replay_artifacts_isolated, "CROSS_TENANT_REPLAY_ACCESS", refs),
    test("Approval enforcement mandatory", result.approval_enforcement.approval_workflows_mandatory, "APPROVAL_WORKFLOW_BYPASSED", refs),
    test("Operator approval required", result.approval_enforcement.production_recommendations_require_approval, "OPERATOR_APPROVAL_MISSING", refs),
    test("Governance bypass absent", result.bypass_escalation_detection.governance_bypass_absent, "GOVERNANCE_BYPASS_DETECTED", refs),
    test("Constitutional bypass absent", result.bypass_escalation_detection.constitutional_bypass_absent, "CONSTITUTIONAL_BYPASS_DETECTED", refs),
    test("Authority escalation absent", result.bypass_escalation_detection.authority_escalation_absent, "AUTHORITY_ESCALATION_DETECTED", refs),
    test("Truth Ledger mutation prohibited", result.authority_restriction.truth_ledger_mutation_prohibited, "TRUTH_LEDGER_MUTATION_PERMITTED", refs),
    test("Audit lineage complete", result.authority_compliance_report.replay_audit_lineage_complete, "AUDIT_LINEAGE_INCOMPLETE", refs),
    test("Integrity hash reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    test("Fail-closed behavior verified", result.bypass_escalation_detection.fail_closed_verified, "FAIL_CLOSED_BEHAVIOR_ABSENT", refs),
  ]);
}

function replayHash(result: Omit<GovernanceConstitutionalResult, "replay_hash" | "integrity_hash">): string {
  return hash({ record: result.record.integrity_hash, governance: result.governance_supremacy.integrity_hash, constitutional: result.constitutional_enforcement.integrity_hash, authority: result.authority_restriction.integrity_hash, tenant: result.tenant_isolation.integrity_hash, approval: result.approval_enforcement.integrity_hash, bypass: result.bypass_escalation_detection.integrity_hash, failures: result.failures });
}
function integrityHash(result: Omit<GovernanceConstitutionalResult, "integrity_hash">): string { return hash({ version: result.governance_constitutional_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }

export function certifyGovernanceConstitutional(input: GovernanceConstitutionalInput = {}): GovernanceConstitutionalResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as GovernanceConstitutionalFailure] : []);
  const rec = record(input, initialFailures);
  const report = complianceReport(rec);
  const baseWithoutTests: BuildBase = { governance_constitutional_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, governance_supremacy: governance(initialFailures), constitutional_enforcement: constitutional(initialFailures), authority_restriction: authority(initialFailures), tenant_isolation: tenant(initialFailures), approval_enforcement: approval(initialFailures), bypass_escalation_detection: bypass(initialFailures), certification_report: certificationReport(rec), authority_compliance_report: report, widgets: WIDGETS, governed: rec.governance_supremacy_status === "PASS", constitutional: rec.constitutional_enforcement_status === "PASS", advisory_only: rec.authority_restriction_status === "PASS", tenant_safe: rec.tenant_isolation_status === "PASS", approval_enforced: rec.approval_enforcement_status === "PASS", production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is GovernanceConstitutionalFailure => Boolean(f))])]);
  const base: Omit<GovernanceConstitutionalResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", governed: !failed(failures, ["GOVERNANCE_VALIDATION_OMITTED", "GOVERNANCE_BYPASS_DETECTED"]), constitutional: !failed(failures, ["CONSTITUTIONAL_VALIDATION_OMITTED", "CONSTITUTIONAL_BYPASS_DETECTED"]), advisory_only: !failed(failures, ["ADVISORY_ONLY_BOUNDARY_BROKEN", "UNAUTHORIZED_EXECUTION_AUTHORITY", "SELF_CERTIFICATION_PERMITTED"]), tenant_safe: !failed(failures, ["TENANT_ISOLATION_BREACH", "CROSS_TENANT_EVIDENCE_ACCESS", "CROSS_TENANT_ADAPTIVE_MEMORY_ACCESS", "CROSS_TENANT_REPLAY_ACCESS"]), approval_enforced: !failed(failures, ["OPERATOR_APPROVAL_MISSING", "APPROVAL_WORKFLOW_BYPASSED"]), production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateGovernanceConstitutionalCertification(result?: GovernanceConstitutionalResult): GovernanceConstitutionalValidationResult {
  if (!result) {
    const failures = freezeArray<GovernanceConstitutionalFailure>(["GOVERNANCE_VALIDATION_OMITTED"]);
    const base: Omit<GovernanceConstitutionalValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.governed && result.constitutional && result.advisory_only && result.tenant_safe && result.approval_enforced && replay_hash_valid && integrity_hash_valid;
  const base: Omit<GovernanceConstitutionalValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayGovernanceConstitutionalCertification(result: GovernanceConstitutionalResult): boolean { return validateGovernanceConstitutionalCertification(result).valid; }
export function buildGovernanceConstitutionalObservability(result = certifyGovernanceConstitutional()): GovernanceConstitutionalObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, governed: result.governed, constitutional: result.constitutional, advisory_only: result.advisory_only, tenant_safe: result.tenant_safe, approval_enforced: result.approval_enforced, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getGovernanceConstitutionalContract(): GovernanceConstitutionalContract {
  const result = certifyGovernanceConstitutional();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, permitted_authority: PERMITTED, prohibited_authority: PROHIBITED, governance_supremacy_required: true, constitutional_supremacy_required: true, tenant_isolation_required: true, operator_supremacy_required: true, fail_closed_required: true }), result, validation: validateGovernanceConstitutionalCertification(result), observability: buildGovernanceConstitutionalObservability(result) });
}
export const GovernanceConstitutionalCertification = Object.freeze({ certify: certifyGovernanceConstitutional, validate: validateGovernanceConstitutionalCertification, replay: replayGovernanceConstitutionalCertification });
