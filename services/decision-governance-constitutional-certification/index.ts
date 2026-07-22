import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runReplayReconstructionCertification } from "@/services/decision-replay-reconstruction-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { ReplayReconstructionCertificationResult } from "@/types/decision-replay-reconstruction-certification";
import type {
  AdvisoryFailClosedReport,
  AuthorityBoundaryReport,
  ConstitutionalValidationReport,
  GovernanceCertificationCheck,
  GovernanceCertificationEvidencePackage,
  GovernanceCertificationLedgerEntry,
  GovernanceCertificationReport,
  GovernanceCertificationScope,
  GovernanceConstitutionalCertificationFailure,
  GovernanceConstitutionalCertificationFoundation,
  GovernanceConstitutionalCertificationInput,
  GovernanceConstitutionalCertificationResult,
  GovernanceConstitutionalCertificationValidation,
  GovernancePolicyValidationReport,
  TenantIsolationReport,
} from "@/types/decision-governance-constitutional-certification";

const CERTIFICATION_VERSION = "decision-governance-constitutional-certification/v1" as const;

export const GOVERNANCE_CERTIFICATION_SCOPES: readonly GovernanceCertificationScope[] = Object.freeze(["INTAKE", "CONTEXT_CONSTRUCTION", "DEPENDENCY_ANALYSIS", "CONFLICT_ARBITRATION", "PRIORITIZATION", "DECISION_PACKAGING", "OPERATOR_WORKFLOW", "REPLAY", "CERTIFICATION"]);
export const GOVERNANCE_CERTIFICATION_CHECKS: readonly GovernanceCertificationCheck[] = Object.freeze(["POLICY_ENFORCEMENT", "CONSTITUTIONAL_COMPLIANCE", "AUTHORITY_BOUNDARY", "TENANT_ISOLATION", "ADVISORY_ONLY", "FAIL_CLOSED", "GOVERNANCE_REPLAY", "EVIDENCE_COMPLETENESS", "INTEGRITY_VERIFICATION"]);

type Scenario = NonNullable<GovernanceConstitutionalCertificationInput["scenario"]>;

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

function ctx(source: ReplayReconstructionCertificationResult) {
  return {
    tenant_id: source.reconstruction_report.tenant_id,
    mission_id: source.reconstruction_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: ReplayReconstructionCertificationResult, role: VisibilityRole): boolean {
  return source.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildPolicyReport(source: ReplayReconstructionCertificationResult, scenario: Scenario): GovernancePolicyValidationReport {
  const c = ctx(source);
  const conflicts = scenario === "UNDETECTED_POLICY_CONFLICT" ? freezeArray(["policy_conflict:priority_vs_constitution"]) : freezeArray([]);
  const base: Omit<GovernancePolicyValidationReport, "integrity_hash"> = {
    policy_report_id: "governance_policy_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    evaluated_policies: freezeArray(["policy:advisory_only", "policy:tenant_isolation", "policy:authority_boundary", "policy:fail_closed"]),
    policy_precedence: scenario === "POLICY_PRECEDENCE_FAILURE" ? freezeArray(["mission_policy", "constitutional_policy", "tenant_policy"]) : freezeArray(["constitutional_policy", "tenant_policy", "mission_policy"]),
    inherited_policies: freezeArray(["global_governance_baseline", "mission_control_constitution"]),
    mandatory_policies_enforced: scenario !== "GOVERNANCE_BYPASS",
    policy_conflicts_detected: conflicts,
    policy_conflicts_resolved: scenario !== "UNDETECTED_POLICY_CONFLICT",
    governance_decisions_logged: scenario !== "MISSING_GOVERNANCE_EVIDENCE",
    governance_lineage_ref: scenario === "LINEAGE_CORRUPTION" ? "" : "governance_lineage:continuous",
    replay_ref: scenario === "REPLAY_GOVERNANCE_MISMATCH" ? "replay:governance:drift" : c.replay_ref,
    validation_state: scenario === "BASELINE" ? "PASS" : "FAIL",
  };
  const normalized = {
    ...base,
    validation_state: base.mandatory_policies_enforced && base.policy_precedence[0] === "constitutional_policy" && base.policy_conflicts_resolved && base.governance_decisions_logged && Boolean(base.governance_lineage_ref) && base.replay_ref === c.replay_ref ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildConstitutionalReport(source: ReplayReconstructionCertificationResult, scenario: Scenario): ConstitutionalValidationReport {
  const c = ctx(source);
  const base: Omit<ConstitutionalValidationReport, "integrity_hash"> = {
    constitutional_report_id: "constitutional_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    evaluated_principles: freezeArray(["operator_supremacy", "tenant_isolation", "auditability", "fail_closed", "advisory_only"]),
    mandatory_constraints_enforced: scenario !== "CONSTITUTIONAL_VIOLATION",
    protected_boundaries_preserved: scenario !== "CONSTITUTIONAL_VIOLATION",
    rule_precedence_enforced: scenario !== "POLICY_PRECEDENCE_FAILURE",
    violations_detected: scenario === "CONSTITUTIONAL_VIOLATION" ? freezeArray(["constitution:operator_supremacy_violation"]) : freezeArray([]),
    violations_permitted: scenario === "CONSTITUTIONAL_VIOLATION",
    escalation_requirements_enforced: scenario !== "MISSING_APPROVAL",
    audit_trail_ref: scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? "" : "constitutional_audit:complete",
    replay_ref: c.replay_ref,
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: base.mandatory_constraints_enforced && base.protected_boundaries_preserved && base.rule_precedence_enforced && !base.violations_permitted && base.escalation_requirements_enforced && Boolean(base.audit_trail_ref) ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildAuthorityReport(source: ReplayReconstructionCertificationResult, role: VisibilityRole, scenario: Scenario): AuthorityBoundaryReport {
  const c = ctx(source);
  const approvals = freezeArray(["operator_review"]);
  const base: Omit<AuthorityBoundaryReport, "integrity_hash"> = {
    authority_report_id: "authority_boundary_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    role_authorized: visibleToRole(source, role) && scenario !== "AUTHORITY_ESCALATION",
    approvals_required: approvals,
    approvals_present: scenario === "MISSING_APPROVAL" ? freezeArray([]) : approvals,
    delegated_authority_valid: scenario !== "AUTHORITY_ESCALATION",
    escalation_authority_valid: scenario !== "AUTHORITY_ESCALATION",
    override_permissions_valid: scenario !== "AUTHORITY_ESCALATION",
    separation_of_duties_enforced: scenario !== "AUTHORITY_ESCALATION",
    restricted_actions_blocked: scenario !== "AUTONOMOUS_EXECUTION" && scenario !== "EXECUTION_AUTHORITY",
    execution_authority_granted: scenario === "EXECUTION_AUTHORITY" || scenario === "AUTONOMOUS_EXECUTION",
    replay_ref: c.replay_ref,
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: base.role_authorized && base.approvals_present.length === base.approvals_required.length && base.delegated_authority_valid && base.escalation_authority_valid && base.override_permissions_valid && base.separation_of_duties_enforced && base.restricted_actions_blocked && !base.execution_authority_granted ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildTenantReport(source: ReplayReconstructionCertificationResult, scenario: Scenario): TenantIsolationReport {
  const c = ctx(source);
  const breached = scenario === "TENANT_BREACH" || scenario === "CROSS_TENANT_EXPOSURE";
  const base: Omit<TenantIsolationReport, "integrity_hash"> = {
    tenant_report_id: "tenant_isolation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    tenant_ownership_verified: !breached,
    resource_isolation_verified: !breached,
    decision_isolation_verified: !breached,
    evidence_isolation_verified: scenario !== "CROSS_TENANT_EXPOSURE",
    replay_isolation_verified: !breached,
    ledger_isolation_verified: !breached,
    cross_tenant_access_blocked: !breached,
    validation_state: breached ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAdvisoryReport(source: ReplayReconstructionCertificationResult, scenario: Scenario): AdvisoryFailClosedReport {
  const c = ctx(source);
  const base: Omit<AdvisoryFailClosedReport, "integrity_hash"> = {
    advisory_report_id: "advisory_fail_closed_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    recommendation_only_outputs: scenario !== "ADVISORY_BOUNDARY_VIOLATION",
    operator_approval_required: scenario !== "MISSING_APPROVAL",
    no_autonomous_execution: scenario !== "AUTONOMOUS_EXECUTION",
    no_command_dispatch: scenario !== "AUTONOMOUS_EXECUTION",
    no_hidden_execution_paths: scenario !== "HIDDEN_EXECUTION_PATHWAY",
    missing_evidence_blocks_progression: scenario !== "FAIL_OPEN",
    invalid_policy_blocks_progression: scenario !== "FAIL_OPEN",
    unknown_authority_blocks_progression: scenario !== "FAIL_OPEN",
    replay_failure_blocks_progression: scenario !== "FAIL_OPEN",
    integrity_failure_blocks_progression: scenario !== "FAIL_OPEN",
    invalid_configuration_blocks_progression: scenario !== "FAIL_OPEN",
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: Object.entries(base).every(([key, value]) => key.endsWith("_id") || key === "tenant_id" || key === "mission_id" || key === "validation_state" || value === true) ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildEvidence(source: ReplayReconstructionCertificationResult, policy: GovernancePolicyValidationReport, constitutional: ConstitutionalValidationReport, authority: AuthorityBoundaryReport, tenant: TenantIsolationReport, advisory: AdvisoryFailClosedReport, scenario: Scenario): GovernanceCertificationEvidencePackage {
  const c = ctx(source);
  const base: Omit<GovernanceCertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "governance_constitutional_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    governance_evidence_refs: scenario === "MISSING_GOVERNANCE_EVIDENCE" ? freezeArray([]) : freezeArray([policy.policy_report_id, policy.governance_lineage_ref]),
    constitutional_evidence_refs: scenario === "MISSING_CONSTITUTIONAL_EVIDENCE" ? freezeArray([]) : freezeArray([constitutional.constitutional_report_id, constitutional.audit_trail_ref]),
    authority_evidence_refs: scenario === "MISSING_AUTHORITY_VALIDATION" ? freezeArray([]) : freezeArray([authority.authority_report_id]),
    isolation_evidence_refs: freezeArray([tenant.tenant_report_id]),
    advisory_evidence_refs: freezeArray([advisory.advisory_report_id]),
    fail_closed_evidence_refs: scenario === "FAIL_OPEN" ? freezeArray([]) : freezeArray([advisory.advisory_report_id, "fail_closed:blocked_invalid_states"]),
    replay_evidence_refs: freezeArray([source.replay_hash, policy.replay_ref, constitutional.replay_ref, authority.replay_ref]),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" ? freezeArray([]) : freezeArray([policy.integrity_hash, constitutional.integrity_hash, authority.integrity_hash, tenant.integrity_hash, advisory.integrity_hash]),
    complete: scenario !== "MISSING_GOVERNANCE_EVIDENCE" && scenario !== "MISSING_CONSTITUTIONAL_EVIDENCE" && scenario !== "MISSING_AUTHORITY_VALIDATION",
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(source: ReplayReconstructionCertificationResult, policy: GovernancePolicyValidationReport, constitutional: ConstitutionalValidationReport, authority: AuthorityBoundaryReport, tenant: TenantIsolationReport, advisory: AdvisoryFailClosedReport, failures: readonly GovernanceConstitutionalCertificationFailure[]): GovernanceCertificationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<GovernanceCertificationReport, "integrity_hash"> = {
    report_id: "governance_constitutional_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Governance, constitutional, authority, tenant, advisory-only, and fail-closed controls are continuously enforced." : "Governance and constitutional certification is blocked by control enforcement failures.",
    certification_scope: GOVERNANCE_CERTIFICATION_SCOPES,
    certified_checks: GOVERNANCE_CERTIFICATION_CHECKS,
    governance_policy_assessment: policy.validation_state,
    constitutional_compliance_results: constitutional.validation_state,
    authority_boundary_assessment: authority.validation_state,
    tenant_isolation_assessment: tenant.validation_state,
    advisory_only_verification: advisory.recommendation_only_outputs && advisory.no_autonomous_execution && advisory.no_command_dispatch && advisory.no_hidden_execution_paths ? "PASS" : "FAIL",
    fail_closed_validation: advisory.missing_evidence_blocks_progression && advisory.invalid_policy_blocks_progression && advisory.unknown_authority_blocks_progression && advisory.replay_failure_blocks_progression && advisory.integrity_failure_blocks_progression && advisory.invalid_configuration_blocks_progression ? "PASS" : "FAIL",
    replay_consistency_assessment: policy.replay_ref === source.replay_hash && constitutional.replay_ref === source.replay_hash && authority.replay_ref === source.replay_hash ? "PASS" : "FAIL",
    integrity_verification: failures.includes("INTEGRITY_HASH_MISMATCH") ? "FAIL" : "PASS",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: ReplayReconstructionCertificationResult, evidence: GovernanceCertificationEvidencePackage, report: GovernanceCertificationReport, scenario: Scenario): readonly GovernanceCertificationLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<GovernanceCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "governance_cert_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "GOVERNANCE_VALIDATED", scope_ref: "continuous_policy_enforcement", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:14.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "governance_cert_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "CONSTITUTION_VALIDATED", scope_ref: "constitutional_compliance", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:15.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "governance_cert_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "AUTHORITY_VALIDATED", scope_ref: "authority_boundaries", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:16.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "governance_cert_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:17.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function collectFailures(input: {
  replay: ReplayReconstructionCertificationResult;
  policy: GovernancePolicyValidationReport;
  constitutional: ConstitutionalValidationReport;
  authority: AuthorityBoundaryReport;
  tenant: TenantIsolationReport;
  advisory: AdvisoryFailClosedReport;
  evidence: GovernanceCertificationEvidencePackage;
  ledger: readonly GovernanceCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly GovernanceConstitutionalCertificationFailure[] {
  const failures: GovernanceConstitutionalCertificationFailure[] = [];
  if (input.replay.validation.validation_status !== "VALID" || input.replay.reconstruction_report.certification_decision !== "PASS") failures.push("REPLAY_RECONSTRUCTION_CERTIFICATION_INVALID");
  if (!input.policy.mandatory_policies_enforced) failures.push("GOVERNANCE_BYPASS");
  if (input.constitutional.violations_permitted || !input.constitutional.mandatory_constraints_enforced) failures.push("CONSTITUTIONAL_VIOLATION_PERMITTED");
  if (!input.authority.role_authorized || !input.authority.delegated_authority_valid || !input.authority.escalation_authority_valid || !input.authority.override_permissions_valid) failures.push("UNAUTHORIZED_AUTHORITY_ESCALATION");
  if (input.authority.approvals_present.length !== input.authority.approvals_required.length || !input.advisory.operator_approval_required) failures.push("MISSING_REQUIRED_APPROVAL");
  if (input.policy.policy_precedence[0] !== "constitutional_policy" || !input.constitutional.rule_precedence_enforced) failures.push("POLICY_PRECEDENCE_FAILURE");
  if (input.tenant.validation_state !== "PASS") failures.push("TENANT_ISOLATION_BREACH");
  if (!input.tenant.evidence_isolation_verified || !input.tenant.cross_tenant_access_blocked) failures.push("CROSS_TENANT_DATA_EXPOSURE");
  if (input.policy.replay_ref !== input.replay.replay_hash || input.constitutional.replay_ref !== input.replay.replay_hash || input.authority.replay_ref !== input.replay.replay_hash) failures.push("REPLAY_GOVERNANCE_MISMATCH");
  if (!input.evidence.governance_evidence_refs.length || !input.policy.governance_decisions_logged) failures.push("MISSING_GOVERNANCE_EVIDENCE");
  if (!input.evidence.constitutional_evidence_refs.length || !input.constitutional.audit_trail_ref) failures.push("MISSING_CONSTITUTIONAL_EVIDENCE");
  if (!input.evidence.authority_evidence_refs.length) failures.push("MISSING_AUTHORITY_VALIDATION");
  if (!input.advisory.recommendation_only_outputs) failures.push("ADVISORY_ONLY_BOUNDARY_VIOLATION");
  if (!input.advisory.no_autonomous_execution || !input.advisory.no_command_dispatch || input.authority.execution_authority_granted) failures.push("AUTONOMOUS_EXECUTION_CAPABILITY");
  if (!input.advisory.no_hidden_execution_paths) failures.push("HIDDEN_EXECUTION_PATHWAY");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted) || input.advisory.validation_state !== "PASS") failures.push("FAIL_OPEN_BEHAVIOR");
  if (
    hashWithoutIntegrity(input.policy) !== input.policy.integrity_hash
    || hashWithoutIntegrity(input.constitutional) !== input.constitutional.integrity_hash
    || hashWithoutIntegrity(input.authority) !== input.authority.integrity_hash
    || hashWithoutIntegrity(input.tenant) !== input.tenant.integrity_hash
    || hashWithoutIntegrity(input.advisory) !== input.advisory.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || !input.evidence.integrity_evidence_refs.length
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.policy.governance_lineage_ref) failures.push("GOVERNANCE_LINEAGE_CORRUPTION");
  if (input.policy.policy_conflicts_detected.length && !input.policy.policy_conflicts_resolved) failures.push("UNDETECTED_POLICY_CONFLICT");
  if (!visibleToRole(input.replay, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly GovernanceConstitutionalCertificationFailure[]): GovernanceConstitutionalCertificationValidation {
  const has = (failure: GovernanceConstitutionalCertificationFailure) => failures.includes(failure);
  const base: Omit<GovernanceConstitutionalCertificationValidation, "integrity_hash"> = {
    validation_id: "governance_constitutional_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    replay_certification_valid: !has("REPLAY_RECONSTRUCTION_CERTIFICATION_INVALID"),
    governance_continuous: !has("GOVERNANCE_BYPASS"),
    constitutional_compliant: !has("CONSTITUTIONAL_VIOLATION_PERMITTED"),
    authority_boundaries_enforced: !has("UNAUTHORIZED_AUTHORITY_ESCALATION"),
    approvals_complete: !has("MISSING_REQUIRED_APPROVAL"),
    policy_precedence_valid: !has("POLICY_PRECEDENCE_FAILURE"),
    tenant_isolated: !has("TENANT_ISOLATION_BREACH"),
    cross_tenant_data_blocked: !has("CROSS_TENANT_DATA_EXPOSURE"),
    governance_replay_consistent: !has("REPLAY_GOVERNANCE_MISMATCH"),
    governance_evidence_complete: !has("MISSING_GOVERNANCE_EVIDENCE"),
    constitutional_evidence_complete: !has("MISSING_CONSTITUTIONAL_EVIDENCE"),
    authority_validation_complete: !has("MISSING_AUTHORITY_VALIDATION"),
    advisory_only: !has("ADVISORY_ONLY_BOUNDARY_VIOLATION"),
    autonomous_execution_absent: !has("AUTONOMOUS_EXECUTION_CAPABILITY"),
    hidden_execution_paths_absent: !has("HIDDEN_EXECUTION_PATHWAY"),
    fail_closed: !has("FAIL_OPEN_BEHAVIOR"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    governance_lineage_complete: !has("GOVERNANCE_LINEAGE_CORRUPTION"),
    policy_conflicts_detected: !has("UNDETECTED_POLICY_CONFLICT"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceConstitutionalCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    policy: result.policy_report,
    constitutional: result.constitutional_report,
    authority: result.authority_report,
    tenant: result.tenant_report,
    advisory: result.advisory_fail_closed_report,
    evidence: result.evidence_package,
    report: result.governance_report,
    ledger: result.governance_ledger,
    validation: result.validation,
  });
}

export function runGovernanceConstitutionalCertification(input: GovernanceConstitutionalCertificationInput = {}): GovernanceConstitutionalCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const replay_certification = input.replay_certification ?? runReplayReconstructionCertification({ scenario: scenario === "REPLAY_INVALID" ? "GOVERNANCE_MISMATCH" : "BASELINE" });
  const policy_report = buildPolicyReport(replay_certification, scenario);
  const constitutional_report = buildConstitutionalReport(replay_certification, scenario);
  const authority_report = buildAuthorityReport(replay_certification, role, scenario);
  const tenant_report = buildTenantReport(replay_certification, scenario);
  const advisory_fail_closed_report = buildAdvisoryReport(replay_certification, scenario);
  const evidence_package = buildEvidence(replay_certification, policy_report, constitutional_report, authority_report, tenant_report, advisory_fail_closed_report, scenario);
  const preFailures = collectFailures({ replay: replay_certification, policy: policy_report, constitutional: constitutional_report, authority: authority_report, tenant: tenant_report, advisory: advisory_fail_closed_report, evidence: evidence_package, ledger: [], role, scenario });
  const governance_report = buildReport(replay_certification, policy_report, constitutional_report, authority_report, tenant_report, advisory_fail_closed_report, preFailures);
  const governance_ledger = buildLedger(replay_certification, evidence_package, governance_report, scenario);
  const failures = collectFailures({ replay: replay_certification, policy: policy_report, constitutional: constitutional_report, authority: authority_report, tenant: tenant_report, advisory: advisory_fail_closed_report, evidence: evidence_package, ledger: governance_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<GovernanceConstitutionalCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    replay_certification,
    policy_report,
    constitutional_report,
    authority_report,
    tenant_report,
    advisory_fail_closed_report,
    evidence_package,
    governance_report,
    governance_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_governance_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayGovernanceConstitutionalCertification(result: GovernanceConstitutionalCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeGovernancePolicyReportHash(record: Omit<GovernancePolicyValidationReport, "integrity_hash"> | GovernancePolicyValidationReport): string {
  return hashWithoutIntegrity(record);
}

export function getGovernanceConstitutionalCertificationFoundation(): GovernanceConstitutionalCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: GOVERNANCE_CERTIFICATION_SCOPES,
    checks: GOVERNANCE_CERTIFICATION_CHECKS,
    result: runGovernanceConstitutionalCertification(),
  });
}

export const GovernanceConstitutionalCertification = Object.freeze({
  run: runGovernanceConstitutionalCertification,
  replay: replayGovernanceConstitutionalCertification,
});
