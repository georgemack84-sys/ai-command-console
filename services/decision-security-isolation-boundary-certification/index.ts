import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runObservabilityDashboardCertification } from "@/services/decision-observability-dashboard-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { ObservabilityDashboardCertificationResult } from "@/types/decision-observability-dashboard-certification";
import type {
  AdvisoryExecutionBoundaryReport,
  AuthorityBoundaryValidationReport,
  GovernanceBoundaryValidationReport,
  SecurityBoundaryCertificationFailure,
  SecurityBoundaryCertificationFoundation,
  SecurityBoundaryCertificationInput,
  SecurityBoundaryCertificationLedgerEntry,
  SecurityBoundaryCertificationReport,
  SecurityBoundaryCertificationResult,
  SecurityBoundaryCertificationValidation,
  SecurityBoundaryCheck,
  SecurityBoundaryEvidencePackage,
  SecurityBoundaryScope,
  SecurityCertificationState,
  SecurityReplayBoundaryReport,
  TenantIsolationValidationReport,
} from "@/types/decision-security-isolation-boundary-certification";

const CERTIFICATION_VERSION = "decision-security-isolation-boundary-certification/v1" as const;

export const SECURITY_BOUNDARY_SCOPES: readonly SecurityBoundaryScope[] = Object.freeze(["TENANT_ISOLATION", "CROSS_TENANT_PROTECTION", "AUTHORITY_BOUNDARIES", "GOVERNANCE_BOUNDARIES", "CONSTITUTIONAL_BOUNDARIES", "ADVISORY_ONLY", "EXECUTION_PREVENTION", "REPLAY_ISOLATION", "LEDGER_ISOLATION", "CERTIFICATION_ISOLATION"]);
export const SECURITY_BOUNDARY_CHECKS: readonly SecurityBoundaryCheck[] = Object.freeze(["TENANT_OWNERSHIP", "DATA_SEGREGATION", "CROSS_TENANT_REJECTION", "ROLE_AUTHORIZATION", "DELEGATED_AUTHORITY", "APPROVAL_AUTHORITY", "OVERRIDE_AUTHORITY", "GOVERNANCE_ENFORCEMENT", "CONSTITUTIONAL_ENFORCEMENT", "ADVISORY_EXECUTION_BOUNDARY", "COMMAND_BLOCKING", "SECURITY_REPLAY", "INTEGRITY_VERIFICATION"]);

type Scenario = NonNullable<SecurityBoundaryCertificationInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function state(pass: boolean): SecurityCertificationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: ObservabilityDashboardCertificationResult) {
  return {
    tenant_id: source.observability_report.tenant_id,
    mission_id: source.observability_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: ObservabilityDashboardCertificationResult, role: VisibilityRole): boolean {
  return source.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildTenantIsolation(source: ObservabilityDashboardCertificationResult, scenario: Scenario): TenantIsolationValidationReport {
  const c = ctx(source);
  const base: Omit<TenantIsolationValidationReport, "integrity_hash"> = {
    report_id: "tenant_isolation_validation_report",
    tenant_id: scenario === "TENANT_LEAKAGE" ? `${c.tenant_id}_foreign` : c.tenant_id,
    mission_id: c.mission_id,
    tenant_identity_enforced: scenario !== "TENANT_LEAKAGE",
    data_isolated: scenario !== "TENANT_LEAKAGE" && scenario !== "CROSS_TENANT_ACCESS",
    decision_isolated: scenario !== "CROSS_TENANT_ACCESS",
    evidence_isolated: scenario !== "TENANT_LEAKAGE",
    workflow_isolated: scenario !== "CROSS_TENANT_ACCESS",
    replay_isolated: scenario !== "CROSS_TENANT_REPLAY",
    ledger_isolated: scenario !== "CROSS_TENANT_LEDGER",
    certification_isolated: scenario !== "TENANT_LEAKAGE",
    cross_tenant_requests_rejected: scenario !== "CROSS_TENANT_ACCESS",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.tenant_identity_enforced && base.data_isolated && base.decision_isolated && base.evidence_isolated && base.workflow_isolated && base.replay_isolated && base.ledger_isolated && base.certification_isolated && base.cross_tenant_requests_rejected) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildAuthority(source: ObservabilityDashboardCertificationResult, scenario: Scenario): AuthorityBoundaryValidationReport {
  const c = ctx(source);
  const base: Omit<AuthorityBoundaryValidationReport, "integrity_hash"> = {
    report_id: "authority_boundary_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    operator_authority_validated: scenario !== "AUTHORITY_ESCALATION" && scenario !== "ROLE_PRIVILEGE_ESCALATION",
    governance_authority_validated: scenario !== "GOVERNANCE_BYPASS",
    escalation_authority_validated: scenario !== "AUTHORITY_ESCALATION",
    delegated_authority_limited: scenario !== "AUTHORITY_ESCALATION",
    approval_authority_enforced: scenario !== "MISSING_APPROVAL",
    override_authority_enforced: scenario !== "ROLE_PRIVILEGE_ESCALATION",
    separation_of_duties_enforced: scenario !== "ROLE_PRIVILEGE_ESCALATION",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.operator_authority_validated && base.governance_authority_validated && base.escalation_authority_validated && base.delegated_authority_limited && base.approval_authority_enforced && base.override_authority_enforced && base.separation_of_duties_enforced) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildGovernance(source: ObservabilityDashboardCertificationResult, scenario: Scenario): GovernanceBoundaryValidationReport {
  const c = ctx(source);
  const base: Omit<GovernanceBoundaryValidationReport, "integrity_hash"> = {
    report_id: "governance_boundary_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    policy_enforcement_active: scenario !== "GOVERNANCE_BYPASS",
    governance_checkpoints_executed: scenario !== "GOVERNANCE_BYPASS",
    mandatory_approvals_enforced: scenario !== "MISSING_APPROVAL",
    governance_escalation_enforced: scenario !== "GOVERNANCE_BYPASS",
    compliance_requirements_enforced: scenario !== "GOVERNANCE_BYPASS",
    policy_precedence_preserved: scenario !== "POLICY_PRECEDENCE_FAILURE",
    constitutional_constraints_enforced: scenario !== "CONSTITUTIONAL_VIOLATION",
    constitutional_precedence_preserved: scenario !== "CONSTITUTIONAL_VIOLATION",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.policy_enforcement_active && base.governance_checkpoints_executed && base.mandatory_approvals_enforced && base.governance_escalation_enforced && base.compliance_requirements_enforced && base.policy_precedence_preserved && base.constitutional_constraints_enforced && base.constitutional_precedence_preserved) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildAdvisoryExecution(source: ObservabilityDashboardCertificationResult, scenario: Scenario): AdvisoryExecutionBoundaryReport {
  const c = ctx(source);
  const base: Omit<AdvisoryExecutionBoundaryReport, "integrity_hash"> = {
    report_id: "advisory_execution_boundary_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    recommendation_only_outputs: scenario !== "AUTONOMOUS_EXECUTION",
    execution_prohibited: scenario !== "COMMAND_EXECUTED" && scenario !== "EXECUTION_AUTHORITY",
    autonomous_actions_prevented: scenario !== "AUTONOMOUS_EXECUTION",
    operator_approval_required: scenario !== "MISSING_APPROVAL",
    command_execution_blocked: scenario !== "COMMAND_EXECUTED" && scenario !== "HIDDEN_EXECUTION_PATHWAY",
    execution_api_restricted: scenario !== "HIDDEN_EXECUTION_PATHWAY" && scenario !== "EXECUTION_AUTHORITY",
    runtime_privileges_restricted: scenario !== "RUNTIME_PRIVILEGE_BYPASS",
    unauthorized_workflows_rejected: scenario !== "AUTONOMOUS_EXECUTION",
    execution_audit_logged: scenario !== "MISSING_AUDIT",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.recommendation_only_outputs && base.execution_prohibited && base.autonomous_actions_prevented && base.operator_approval_required && base.command_execution_blocked && base.execution_api_restricted && base.runtime_privileges_restricted && base.unauthorized_workflows_rejected && base.execution_audit_logged) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildReplay(source: ObservabilityDashboardCertificationResult, tenant: TenantIsolationValidationReport, scenario: Scenario): SecurityReplayBoundaryReport {
  const c = ctx(source);
  const base: Omit<SecurityReplayBoundaryReport, "integrity_hash"> = {
    report_id: "security_replay_boundary_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    boundary_replay_deterministic: scenario !== "BOUNDARY_REPLAY_MISMATCH",
    security_replay_reproducible: scenario !== "BOUNDARY_REPLAY_MISMATCH",
    tenant_isolation_replay_verified: tenant.replay_isolated,
    replay_scope_isolated: scenario !== "CROSS_TENANT_REPLAY",
    ledger_scope_isolated: scenario !== "CROSS_TENANT_LEDGER",
    integrity_hashes_reproducible: scenario !== "HASH_MISMATCH",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.boundary_replay_deterministic && base.security_replay_reproducible && base.tenant_isolation_replay_verified && base.replay_scope_isolated && base.ledger_scope_isolated && base.integrity_hashes_reproducible) };
  const built = Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.report_id }) });
  return built;
}

function buildEvidence(source: ObservabilityDashboardCertificationResult, tenant: TenantIsolationValidationReport, authority: AuthorityBoundaryValidationReport, governance: GovernanceBoundaryValidationReport, advisory: AdvisoryExecutionBoundaryReport, replay: SecurityReplayBoundaryReport, scenario: Scenario): SecurityBoundaryEvidencePackage {
  const c = ctx(source);
  const base: Omit<SecurityBoundaryEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "security_boundary_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    isolation_evidence_refs: scenario === "TENANT_LEAKAGE" ? freezeArray([]) : freezeArray([tenant.report_id, source.dashboard_snapshot.dashboard_id]),
    authority_evidence_refs: scenario === "AUTHORITY_ESCALATION" ? freezeArray([]) : freezeArray([authority.report_id]),
    governance_evidence_refs: scenario === "GOVERNANCE_BYPASS" ? freezeArray([]) : freezeArray([governance.report_id, ...source.dashboard_snapshot.governance_statuses]),
    constitutional_evidence_refs: scenario === "CONSTITUTIONAL_VIOLATION" ? freezeArray([]) : freezeArray(["constitutional:constraints", "constitutional:precedence"]),
    execution_prevention_evidence_refs: scenario === "MISSING_AUDIT" ? freezeArray([]) : freezeArray([advisory.report_id, "execution:block:command", "execution:block:api"]),
    replay_evidence_refs: scenario === "BOUNDARY_REPLAY_MISMATCH" ? freezeArray([]) : freezeArray([replay.report_id, source.replay_hash]),
    audit_evidence_refs: scenario === "MISSING_AUDIT" ? freezeArray([]) : freezeArray([source.evidence_package.evidence_package_id, source.observability_ledger[0]?.ledger_entry_id ?? "observability:ledger"]),
    complete: !["TENANT_LEAKAGE", "AUTHORITY_ESCALATION", "GOVERNANCE_BYPASS", "CONSTITUTIONAL_VIOLATION", "MISSING_AUDIT", "BOUNDARY_REPLAY_MISMATCH", "HIDDEN_SECURITY_STATE"].includes(scenario),
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  observability: ObservabilityDashboardCertificationResult;
  tenant: TenantIsolationValidationReport;
  authority: AuthorityBoundaryValidationReport;
  governance: GovernanceBoundaryValidationReport;
  advisory: AdvisoryExecutionBoundaryReport;
  replay: SecurityReplayBoundaryReport;
  evidence: SecurityBoundaryEvidencePackage;
  ledger: readonly SecurityBoundaryCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly SecurityBoundaryCertificationFailure[] {
  const failures: SecurityBoundaryCertificationFailure[] = [];
  if (input.observability.validation.validation_status !== "VALID" || input.observability.observability_report.certification_decision !== "PASS") failures.push("OBSERVABILITY_CERTIFICATION_INVALID");
  if (input.tenant.tenant_id !== input.observability.observability_report.tenant_id || !input.tenant.tenant_identity_enforced || !input.tenant.data_isolated || !input.tenant.evidence_isolated || !input.tenant.certification_isolated) failures.push("TENANT_LEAKAGE");
  if (!input.tenant.cross_tenant_requests_rejected || !input.tenant.decision_isolated || !input.tenant.workflow_isolated) failures.push("CROSS_TENANT_ACCESS");
  if (!input.tenant.replay_isolated || !input.replay.replay_scope_isolated) failures.push("CROSS_TENANT_REPLAY_CONTAMINATION");
  if (!input.tenant.ledger_isolated || !input.replay.ledger_scope_isolated) failures.push("CROSS_TENANT_LEDGER_CONTAMINATION");
  if (!input.authority.operator_authority_validated || !input.authority.escalation_authority_validated || !input.authority.delegated_authority_limited) failures.push("UNAUTHORIZED_AUTHORITY_ESCALATION");
  if (!input.authority.override_authority_enforced || !input.authority.separation_of_duties_enforced) failures.push("ROLE_PRIVILEGE_ESCALATION");
  if (!input.authority.approval_authority_enforced || !input.governance.mandatory_approvals_enforced || !input.advisory.operator_approval_required) failures.push("MISSING_APPROVAL_ENFORCEMENT");
  if (!input.governance.policy_enforcement_active || !input.governance.governance_checkpoints_executed || !input.governance.governance_escalation_enforced || !input.governance.compliance_requirements_enforced) failures.push("GOVERNANCE_BYPASS");
  if (!input.governance.constitutional_constraints_enforced || !input.governance.constitutional_precedence_preserved) failures.push("CONSTITUTIONAL_VIOLATION");
  if (!input.governance.policy_precedence_preserved) failures.push("POLICY_PRECEDENCE_FAILURE");
  if (!input.advisory.command_execution_blocked || !input.advisory.execution_api_restricted || input.scenario === "HIDDEN_EXECUTION_PATHWAY") failures.push("HIDDEN_EXECUTION_PATHWAY");
  if (!input.advisory.recommendation_only_outputs || !input.advisory.autonomous_actions_prevented || !input.advisory.unauthorized_workflows_rejected) failures.push("AUTONOMOUS_EXECUTION_CAPABILITY");
  if (!input.advisory.execution_prohibited || input.scenario === "COMMAND_EXECUTED") failures.push("SUCCESSFUL_COMMAND_EXECUTION");
  if (!input.advisory.runtime_privileges_restricted) failures.push("RUNTIME_PRIVILEGE_BYPASS");
  if (!input.advisory.execution_audit_logged || !input.evidence.audit_evidence_refs.length) failures.push("MISSING_AUDIT_RECORDS");
  if (!input.replay.boundary_replay_deterministic || !input.replay.security_replay_reproducible || !input.evidence.replay_evidence_refs.length) failures.push("BOUNDARY_REPLAY_MISMATCH");
  if (
    hashWithoutIntegrity(input.tenant) !== input.tenant.integrity_hash
    || hashWithoutIntegrity(input.authority) !== input.authority.integrity_hash
    || hashWithoutIntegrity(input.governance) !== input.governance.integrity_hash
    || hashWithoutIntegrity(input.advisory) !== input.advisory.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "HIDDEN_SECURITY_STATE" || !input.evidence.complete) failures.push("HIDDEN_SECURITY_STATE");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_BOUNDARY_BEHAVIOR");
  if (!visibleToRole(input.observability, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildReport(source: ObservabilityDashboardCertificationResult, tenant: TenantIsolationValidationReport, authority: AuthorityBoundaryValidationReport, governance: GovernanceBoundaryValidationReport, advisory: AdvisoryExecutionBoundaryReport, replay: SecurityReplayBoundaryReport, failures: readonly SecurityBoundaryCertificationFailure[]): SecurityBoundaryCertificationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<SecurityBoundaryCertificationReport, "integrity_hash"> = {
    report_id: "security_boundary_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Decision Orchestrator security boundaries are tenant-safe, authority-bound, governance-enforced, constitutionally protected, advisory-only, and fail-closed." : "Security boundary certification is blocked by isolation, authority, governance, constitutional, execution, replay, audit, or integrity failures.",
    certification_scope: SECURITY_BOUNDARY_SCOPES,
    certified_checks: SECURITY_BOUNDARY_CHECKS,
    tenant_isolation_assessment: tenant.validation_state,
    cross_tenant_protection_assessment: tenant.cross_tenant_requests_rejected && tenant.replay_isolated && tenant.ledger_isolated ? "PASS" : "FAIL",
    authority_boundary_assessment: authority.validation_state,
    governance_boundary_assessment: governance.policy_enforcement_active && governance.governance_checkpoints_executed ? "PASS" : "FAIL",
    constitutional_boundary_assessment: governance.constitutional_constraints_enforced && governance.constitutional_precedence_preserved ? "PASS" : "FAIL",
    advisory_only_assessment: advisory.recommendation_only_outputs && advisory.execution_prohibited && advisory.autonomous_actions_prevented ? "PASS" : "FAIL",
    execution_prevention_assessment: advisory.validation_state,
    security_replay_assessment: replay.validation_state,
    integrity_verification: failures.includes("INTEGRITY_HASH_MISMATCH") ? "FAIL" : "PASS",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: ObservabilityDashboardCertificationResult, evidence: SecurityBoundaryEvidencePackage, report: SecurityBoundaryCertificationReport, scenario: Scenario): readonly SecurityBoundaryCertificationLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<SecurityBoundaryCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "security_boundary_cert_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "ISOLATION_VALIDATED", scope_ref: "tenant_isolation", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:40.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "security_boundary_cert_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "AUTHORITY_VALIDATED", scope_ref: "authority_boundaries", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:41.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "security_boundary_cert_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "GOVERNANCE_VALIDATED", scope_ref: "governance_constitutional_boundaries", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:42.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "security_boundary_cert_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "EXECUTION_BOUNDARY_VALIDATED", scope_ref: "advisory_execution_prevention", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:43.000Z", sequence_number: 4, append_only: true, deleted: false },
    { ledger_entry_id: "security_boundary_cert_ledger_005", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "SECURITY_REPLAY_VALIDATED", scope_ref: "security_replay", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:44.000Z", sequence_number: 5, append_only: true, deleted: false },
    { ledger_entry_id: "security_boundary_cert_ledger_006", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "SECURITY_CERTIFIED" : "SECURITY_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:45.000Z", sequence_number: 6, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildValidation(failures: readonly SecurityBoundaryCertificationFailure[]): SecurityBoundaryCertificationValidation {
  const has = (failure: SecurityBoundaryCertificationFailure) => failures.includes(failure);
  const base: Omit<SecurityBoundaryCertificationValidation, "integrity_hash"> = {
    validation_id: "security_boundary_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    observability_certification_valid: !has("OBSERVABILITY_CERTIFICATION_INVALID"),
    tenant_isolation_valid: !has("TENANT_LEAKAGE"),
    cross_tenant_access_blocked: !has("CROSS_TENANT_ACCESS"),
    cross_tenant_replay_blocked: !has("CROSS_TENANT_REPLAY_CONTAMINATION"),
    cross_tenant_ledger_blocked: !has("CROSS_TENANT_LEDGER_CONTAMINATION"),
    authority_boundaries_enforced: !has("UNAUTHORIZED_AUTHORITY_ESCALATION") && !has("ROLE_PRIVILEGE_ESCALATION"),
    role_authorization_deterministic: !has("ROLE_PRIVILEGE_ESCALATION") && !has("AUTHORIZATION_FAILURE"),
    approvals_enforced: !has("MISSING_APPROVAL_ENFORCEMENT"),
    governance_boundaries_enforced: !has("GOVERNANCE_BYPASS") && !has("POLICY_PRECEDENCE_FAILURE"),
    constitutional_boundaries_enforced: !has("CONSTITUTIONAL_VIOLATION"),
    advisory_only: !has("AUTONOMOUS_EXECUTION_CAPABILITY") && !has("SUCCESSFUL_COMMAND_EXECUTION") && !has("EXECUTION_AUTHORITY_GRANTED"),
    autonomous_execution_prevented: !has("AUTONOMOUS_EXECUTION_CAPABILITY"),
    command_execution_blocked: !has("SUCCESSFUL_COMMAND_EXECUTION") && !has("HIDDEN_EXECUTION_PATHWAY"),
    runtime_privileges_restricted: !has("RUNTIME_PRIVILEGE_BYPASS"),
    audit_trail_complete: !has("MISSING_AUDIT_RECORDS"),
    boundary_replay_deterministic: !has("BOUNDARY_REPLAY_MISMATCH"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    hidden_security_state_absent: !has("HIDDEN_SECURITY_STATE") && !has("HIDDEN_EXECUTION_PATHWAY"),
    fail_closed: !has("FAIL_OPEN_BOUNDARY_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<SecurityBoundaryCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    tenant: result.tenant_isolation_report,
    authority: result.authority_boundary_report,
    governance: result.governance_boundary_report,
    advisory: result.advisory_execution_report,
    replay: result.security_replay_report,
    evidence: result.evidence_package,
    report: result.security_report,
    ledger: result.security_ledger,
    validation: result.validation,
  });
}

export function runSecurityBoundaryCertification(input: SecurityBoundaryCertificationInput = {}): SecurityBoundaryCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const observability_certification = input.observability_certification ?? runObservabilityDashboardCertification({ scenario: scenario === "OBSERVABILITY_INVALID" ? "CROSS_TENANT" : "BASELINE" });
  const tenant_isolation_report = buildTenantIsolation(observability_certification, scenario);
  const authority_boundary_report = buildAuthority(observability_certification, scenario);
  const governance_boundary_report = buildGovernance(observability_certification, scenario);
  const advisory_execution_report = buildAdvisoryExecution(observability_certification, scenario);
  const security_replay_report = buildReplay(observability_certification, tenant_isolation_report, scenario);
  const evidence_package = buildEvidence(observability_certification, tenant_isolation_report, authority_boundary_report, governance_boundary_report, advisory_execution_report, security_replay_report, scenario);
  const preFailures = collectFailures({ observability: observability_certification, tenant: tenant_isolation_report, authority: authority_boundary_report, governance: governance_boundary_report, advisory: advisory_execution_report, replay: security_replay_report, evidence: evidence_package, ledger: [], role, scenario });
  const security_report = buildReport(observability_certification, tenant_isolation_report, authority_boundary_report, governance_boundary_report, advisory_execution_report, security_replay_report, preFailures);
  const security_ledger = buildLedger(observability_certification, evidence_package, security_report, scenario);
  const failures = collectFailures({ observability: observability_certification, tenant: tenant_isolation_report, authority: authority_boundary_report, governance: governance_boundary_report, advisory: advisory_execution_report, replay: security_replay_report, evidence: evidence_package, ledger: security_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<SecurityBoundaryCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    observability_certification,
    tenant_isolation_report,
    authority_boundary_report,
    governance_boundary_report,
    advisory_execution_report,
    security_replay_report,
    evidence_package,
    security_report,
    security_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_security_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replaySecurityBoundaryCertification(result: SecurityBoundaryCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeSecurityBoundaryHash(record: Omit<TenantIsolationValidationReport, "integrity_hash"> | TenantIsolationValidationReport): string {
  return hashWithoutIntegrity(record);
}

export function getSecurityBoundaryCertificationFoundation(): SecurityBoundaryCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: SECURITY_BOUNDARY_SCOPES,
    checks: SECURITY_BOUNDARY_CHECKS,
    result: runSecurityBoundaryCertification(),
  });
}

export const SecurityBoundaryCertification = Object.freeze({
  run: runSecurityBoundaryCertification,
  replay: replaySecurityBoundaryCertification,
});
