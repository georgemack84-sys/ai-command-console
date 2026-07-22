import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionIntelligenceCertification } from "@/services/decision-intelligence-certification";
import type { DecisionIntelligenceCertificationResult } from "@/types/decision-intelligence-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  ApprovalValidationReport,
  OperatorHistoryReport,
  OperatorWorkflowCertificationFailure,
  OperatorWorkflowCertificationFoundation,
  OperatorWorkflowCertificationInput,
  OperatorWorkflowCertificationReport,
  OperatorWorkflowCertificationResult,
  OperatorWorkflowCertificationState,
  OperatorWorkflowCertificationValidation,
  OperatorWorkflowCheck,
  OperatorWorkflowEvidencePackage,
  OperatorWorkflowLedgerEntry,
  OperatorWorkflowScope,
  OverrideAuditReport,
  WorkflowReplayReport,
  WorkflowValidationReport,
} from "@/types/decision-operator-workflow-certification";

const CERTIFICATION_VERSION = "decision-operator-workflow-certification/v1" as const;

export const OPERATOR_WORKFLOW_SCOPES: readonly OperatorWorkflowScope[] = Object.freeze(["APPROVAL_WORKFLOW", "REJECTION_WORKFLOW", "OVERRIDE_WORKFLOW", "DEFERRAL_WORKFLOW", "ESCALATION_WORKFLOW", "OPERATOR_HISTORY", "WORKFLOW_REPLAY"]);
export const OPERATOR_WORKFLOW_CHECKS: readonly OperatorWorkflowCheck[] = Object.freeze(["OPERATOR_SUPREMACY", "APPROVAL_INTEGRITY", "REJECTION_INTEGRITY", "OVERRIDE_AUDITABILITY", "DEFERRAL_CONTINUITY", "ESCALATION_VALIDITY", "HISTORY_COMPLETENESS", "REPLAY_DETERMINISM", "AUTHORITY_ENFORCEMENT", "INTEGRITY_VERIFICATION"]);

type Scenario = NonNullable<OperatorWorkflowCertificationInput["scenario"]>;

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

function ctx(source: DecisionIntelligenceCertificationResult) {
  return {
    tenant_id: source.explainability_report.tenant_id,
    mission_id: source.explainability_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: DecisionIntelligenceCertificationResult, role: VisibilityRole): boolean {
  return source.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function state(pass: boolean): OperatorWorkflowCertificationState {
  return pass ? "PASS" : "FAIL";
}

function buildWorkflow(source: DecisionIntelligenceCertificationResult, scenario: Scenario): WorkflowValidationReport {
  const c = ctx(source);
  const invalidTransition = scenario === "INVALID_STATE_TRANSITION";
  const base: Omit<WorkflowValidationReport, "integrity_hash"> = {
    workflow_report_id: "operator_workflow_validation_report",
    tenant_id: scenario === "CROSS_TENANT" ? `${c.tenant_id}_foreign` : c.tenant_id,
    mission_id: c.mission_id,
    workflow_states: invalidTransition ? freezeArray(["PENDING", "APPROVED", "PENDING"]) : freezeArray(["PENDING", "UNDER_REVIEW", "APPROVED", "RECORDED"]),
    state_transitions: invalidTransition ? freezeArray(["PENDING->APPROVED", "APPROVED->PENDING"]) : freezeArray(["PENDING->UNDER_REVIEW", "UNDER_REVIEW->APPROVED", "APPROVED->RECORDED"]),
    final_workflow_state: scenario === "INCOMPLETE_RECONSTRUCTION" ? "UNKNOWN" : "RECORDED",
    approval_workflow_valid: scenario !== "MISSING_APPROVAL" && scenario !== "UNAUTHORIZED_APPROVAL",
    rejection_workflow_valid: scenario !== "UNAUTHORIZED_REJECTION",
    override_workflow_valid: scenario !== "UNAUTHORIZED_OVERRIDE" && scenario !== "MISSING_OVERRIDE_JUSTIFICATION" && scenario !== "ORIGINAL_RECOMMENDATION_LOST",
    deferral_workflow_valid: scenario !== "UNAUTHORIZED_DEFERRAL",
    escalation_workflow_valid: scenario !== "UNAUTHORIZED_ESCALATION" && scenario !== "INCORRECT_ESCALATION_ROUTING",
    governance_compliant: scenario !== "GOVERNANCE_BYPASS",
    constitutional_compliant: scenario !== "CONSTITUTIONAL_VIOLATION",
    authority_bound: scenario !== "AUTHORITY_BOUNDARY_VIOLATION",
    validation_state: "PASS",
  };
  const valid = base.approval_workflow_valid && base.rejection_workflow_valid && base.override_workflow_valid && base.deferral_workflow_valid && base.escalation_workflow_valid && base.governance_compliant && base.constitutional_compliant && base.authority_bound && !invalidTransition && base.final_workflow_state === "RECORDED";
  const normalized = { ...base, validation_state: state(valid) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildApproval(source: DecisionIntelligenceCertificationResult, scenario: Scenario): ApprovalValidationReport {
  const c = ctx(source);
  const required = freezeArray(["operator:primary", "operator:mission-owner"]);
  const base: Omit<ApprovalValidationReport, "integrity_hash"> = {
    approval_report_id: "operator_approval_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    approval_requirements: freezeArray(["approval:operator", "approval:mission-owner"]),
    approval_routing: freezeArray(["route:operator:primary", "route:operator:mission-owner"]),
    required_approvers: required,
    approvals_present: scenario === "MISSING_APPROVAL" ? freezeArray(["operator:primary"]) : required,
    approval_timestamps: freezeArray(["2026-07-05T09:12:22.000Z", "2026-07-05T09:12:23.000Z"]),
    approval_lineage_ref: "approval_lineage:complete",
    approval_replay_ref: scenario === "REPLAY_MISMATCH" ? "approval_replay:mismatch" : c.replay_ref,
    approval_authority_valid: scenario !== "UNAUTHORIZED_APPROVAL",
    multi_stage_approvals_reproduced: scenario !== "REPLAY_MISMATCH",
    validation_state: "PASS",
  };
  const valid = base.approvals_present.length === base.required_approvers.length && base.approval_authority_valid && base.multi_stage_approvals_reproduced && base.approval_replay_ref === c.replay_ref;
  const normalized = { ...base, validation_state: state(valid) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildOverride(source: DecisionIntelligenceCertificationResult, scenario: Scenario): OverrideAuditReport {
  const c = ctx(source);
  const base: Omit<OverrideAuditReport, "integrity_hash"> = {
    override_report_id: "operator_override_audit_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    override_authorized: scenario !== "UNAUTHORIZED_OVERRIDE",
    override_justification_ref: scenario === "MISSING_OVERRIDE_JUSTIFICATION" ? "" : "override_justification:mission-risk",
    original_recommendation_ref: scenario === "ORIGINAL_RECOMMENDATION_LOST" ? "" : source.alternative_explainability_report.recommendation_ref,
    final_recommendation_ref: "operator_final:approved-alpha",
    override_history_refs: scenario === "MISSING_OPERATOR_HISTORY" ? freezeArray([]) : freezeArray(["override_history:none-required", "override_history:audit-ready"]),
    governance_review_ref: scenario === "GOVERNANCE_BYPASS" ? "" : "governance_review:pass",
    constitutional_review_ref: scenario === "CONSTITUTIONAL_VIOLATION" ? "" : "constitutional_review:pass",
    override_lineage_ref: scenario === "MUTABLE_AUDIT_HISTORY" ? "" : "override_lineage:immutable",
    replay_consistent: scenario !== "REPLAY_MISMATCH",
    validation_state: "PASS",
  };
  const valid = base.override_authorized && Boolean(base.override_justification_ref) && Boolean(base.original_recommendation_ref) && base.override_history_refs.length > 0 && Boolean(base.governance_review_ref) && Boolean(base.constitutional_review_ref) && Boolean(base.override_lineage_ref) && base.replay_consistent;
  const normalized = { ...base, validation_state: state(valid) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildHistory(source: DecisionIntelligenceCertificationResult, scenario: Scenario): OperatorHistoryReport {
  const c = ctx(source);
  const missing = scenario === "MISSING_OPERATOR_HISTORY";
  const base: Omit<OperatorHistoryReport, "integrity_hash"> = {
    history_report_id: "operator_history_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    operator_identity_refs: missing ? freezeArray([]) : freezeArray(["operator:primary", "operator:mission-owner"]),
    action_chronology: scenario === "HIDDEN_OPERATOR_ACTION" ? freezeArray(["action:approval", "action:hidden"]) : freezeArray(["action:review", "action:approval", "action:record"]),
    approval_history_refs: missing ? freezeArray([]) : freezeArray(["approval:primary", "approval:mission-owner"]),
    rejection_history_refs: scenario === "UNAUTHORIZED_REJECTION" ? freezeArray(["rejection:unauthorized"]) : freezeArray(["rejection:none"]),
    override_history_refs: missing ? freezeArray([]) : freezeArray(["override:none-required"]),
    deferral_history_refs: scenario === "UNAUTHORIZED_DEFERRAL" ? freezeArray(["deferral:unauthorized"]) : freezeArray(["deferral:none"]),
    escalation_history_refs: scenario === "UNAUTHORIZED_ESCALATION" ? freezeArray(["escalation:unauthorized"]) : freezeArray(["escalation:operator-visible"]),
    audit_lineage_ref: scenario === "MUTABLE_AUDIT_HISTORY" ? "" : "operator_audit_lineage:immutable",
    immutable: scenario !== "MUTABLE_AUDIT_HISTORY",
    validation_state: "PASS",
  };
  const valid = base.operator_identity_refs.length > 0 && base.approval_history_refs.length > 0 && base.override_history_refs.length > 0 && Boolean(base.audit_lineage_ref) && base.immutable && scenario !== "HIDDEN_OPERATOR_ACTION" && scenario !== "UNAUTHORIZED_REJECTION" && scenario !== "UNAUTHORIZED_DEFERRAL" && scenario !== "UNAUTHORIZED_ESCALATION";
  const normalized = { ...base, validation_state: state(valid) };
  const built = Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.history_report_id }) });
  return built;
}

function buildReplay(source: DecisionIntelligenceCertificationResult, scenario: Scenario): WorkflowReplayReport {
  const c = ctx(source);
  const base: Omit<WorkflowReplayReport, "integrity_hash"> = {
    replay_report_id: "operator_workflow_replay_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    workflow_reconstruction_complete: scenario !== "INCOMPLETE_RECONSTRUCTION",
    state_transitions_reproduced: scenario !== "INVALID_STATE_TRANSITION" && scenario !== "REPLAY_MISMATCH",
    approval_replay_valid: scenario !== "REPLAY_MISMATCH",
    override_replay_valid: scenario !== "REPLAY_MISMATCH",
    escalation_replay_valid: scenario !== "REPLAY_MISMATCH" && scenario !== "INCORRECT_ESCALATION_ROUTING",
    deferral_replay_valid: scenario !== "REPLAY_MISMATCH",
    final_state_reproduced: scenario !== "INCOMPLETE_RECONSTRUCTION" && scenario !== "REPLAY_MISMATCH",
    replay_lineage_ref: scenario === "INCOMPLETE_RECONSTRUCTION" ? "" : "workflow_replay_lineage:complete",
    validation_state: "PASS",
  };
  const valid = base.workflow_reconstruction_complete && base.state_transitions_reproduced && base.approval_replay_valid && base.override_replay_valid && base.escalation_replay_valid && base.deferral_replay_valid && base.final_state_reproduced && Boolean(base.replay_lineage_ref);
  const normalized = { ...base, validation_state: state(valid) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildEvidence(source: DecisionIntelligenceCertificationResult, approval: ApprovalValidationReport, override: OverrideAuditReport, history: OperatorHistoryReport, replay: WorkflowReplayReport, scenario: Scenario): OperatorWorkflowEvidencePackage {
  const c = ctx(source);
  const base: Omit<OperatorWorkflowEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "operator_workflow_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    approval_evidence_refs: scenario === "MISSING_APPROVAL" ? freezeArray([]) : freezeArray([approval.approval_report_id, ...approval.approvals_present]),
    rejection_evidence_refs: scenario === "UNAUTHORIZED_REJECTION" ? freezeArray([]) : freezeArray(["rejection:evidence:none-required", "rejection:governance-reviewed"]),
    override_evidence_refs: scenario === "MISSING_OVERRIDE_JUSTIFICATION" ? freezeArray([]) : freezeArray([override.override_report_id, override.override_justification_ref, override.original_recommendation_ref]),
    deferral_evidence_refs: scenario === "UNAUTHORIZED_DEFERRAL" ? freezeArray([]) : freezeArray(["deferral:none", "deferral:state-continuity"]),
    escalation_evidence_refs: scenario === "UNAUTHORIZED_ESCALATION" || scenario === "INCORRECT_ESCALATION_ROUTING" ? freezeArray([]) : freezeArray(["escalation:operator-visible", "escalation:routing-valid"]),
    replay_evidence_refs: scenario === "REPLAY_MISMATCH" ? freezeArray([]) : freezeArray([source.replay_hash, replay.replay_report_id]),
    history_evidence_refs: scenario === "MISSING_OPERATOR_HISTORY" ? freezeArray([]) : freezeArray([history.history_report_id, history.audit_lineage_ref]),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" ? freezeArray([]) : freezeArray([approval.integrity_hash, override.integrity_hash, history.integrity_hash, replay.integrity_hash]),
    complete: scenario !== "MISSING_APPROVAL" && scenario !== "MISSING_OPERATOR_HISTORY" && scenario !== "INCOMPLETE_RECONSTRUCTION",
    immutable: scenario !== "FAIL_OPEN" && scenario !== "MUTABLE_AUDIT_HISTORY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  intelligence: DecisionIntelligenceCertificationResult;
  workflow: WorkflowValidationReport;
  approval: ApprovalValidationReport;
  override: OverrideAuditReport;
  history: OperatorHistoryReport;
  replay: WorkflowReplayReport;
  evidence: OperatorWorkflowEvidencePackage;
  ledger: readonly OperatorWorkflowLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OperatorWorkflowCertificationFailure[] {
  const failures: OperatorWorkflowCertificationFailure[] = [];
  if (input.intelligence.validation.validation_status !== "VALID" || input.intelligence.explainability_report.certification_decision !== "PASS") failures.push("DECISION_INTELLIGENCE_CERTIFICATION_INVALID");
  if (input.approval.approvals_present.length !== input.approval.required_approvers.length) failures.push("MISSING_REQUIRED_APPROVAL");
  if (!input.approval.approval_authority_valid) failures.push("UNAUTHORIZED_APPROVAL");
  if (input.scenario === "UNAUTHORIZED_REJECTION") failures.push("UNAUTHORIZED_REJECTION");
  if (!input.override.override_authorized) failures.push("UNAUTHORIZED_OVERRIDE");
  if (!input.override.override_justification_ref) failures.push("MISSING_OVERRIDE_JUSTIFICATION");
  if (!input.override.original_recommendation_ref) failures.push("ORIGINAL_RECOMMENDATION_MODIFIED_OR_LOST");
  if (input.scenario === "UNAUTHORIZED_DEFERRAL") failures.push("UNAUTHORIZED_DEFERRAL");
  if (input.scenario === "UNAUTHORIZED_ESCALATION") failures.push("UNAUTHORIZED_ESCALATION");
  if (input.scenario === "INCORRECT_ESCALATION_ROUTING") failures.push("INCORRECT_ESCALATION_ROUTING");
  if (input.history.validation_state !== "PASS") failures.push("MISSING_OPERATOR_HISTORY");
  if (!input.replay.workflow_reconstruction_complete) failures.push("INCOMPLETE_WORKFLOW_RECONSTRUCTION");
  if (input.approval.approval_replay_ref !== input.intelligence.replay_hash || !input.override.replay_consistent || input.scenario === "REPLAY_MISMATCH") failures.push("WORKFLOW_REPLAY_MISMATCH");
  if (!input.replay.state_transitions_reproduced || input.scenario === "INVALID_STATE_TRANSITION") failures.push("INVALID_STATE_TRANSITION");
  if (!input.workflow.governance_compliant) failures.push("GOVERNANCE_BYPASS");
  if (!input.workflow.constitutional_compliant) failures.push("CONSTITUTIONAL_VIOLATION");
  if (!input.workflow.authority_bound) failures.push("AUTHORITY_BOUNDARY_VIOLATION");
  if (input.workflow.tenant_id !== input.intelligence.explainability_report.tenant_id) failures.push("CROSS_TENANT_WORKFLOW_CONTAMINATION");
  if (input.scenario === "HIDDEN_OPERATOR_ACTION") failures.push("HIDDEN_OPERATOR_ACTION");
  if (!input.history.immutable || !input.evidence.immutable) failures.push("MUTABLE_AUDIT_HISTORY");
  if (
    hashWithoutIntegrity(input.workflow) !== input.workflow.integrity_hash
    || hashWithoutIntegrity(input.approval) !== input.approval.integrity_hash
    || hashWithoutIntegrity(input.override) !== input.override.integrity_hash
    || hashWithoutIntegrity(input.history) !== input.history.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || !input.evidence.integrity_evidence_refs.length
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_WORKFLOW_BEHAVIOR");
  if (!visibleToRole(input.intelligence, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildCertificationReport(source: DecisionIntelligenceCertificationResult, workflow: WorkflowValidationReport, approval: ApprovalValidationReport, override: OverrideAuditReport, history: OperatorHistoryReport, replay: WorkflowReplayReport, failures: readonly OperatorWorkflowCertificationFailure[]): OperatorWorkflowCertificationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<OperatorWorkflowCertificationReport, "integrity_hash"> = {
    report_id: "operator_workflow_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Operator workflows preserve human authority, auditability, replayability, and advisory-only boundaries." : "Operator workflow certification is blocked by authority, audit, replay, or workflow failures.",
    certification_scope: OPERATOR_WORKFLOW_SCOPES,
    certified_checks: OPERATOR_WORKFLOW_CHECKS,
    workflow_validation_results: workflow.validation_state,
    approval_assessment: approval.validation_state,
    rejection_assessment: workflow.rejection_workflow_valid ? "PASS" : "FAIL",
    override_assessment: override.validation_state,
    deferral_assessment: workflow.deferral_workflow_valid ? "PASS" : "FAIL",
    escalation_assessment: workflow.escalation_workflow_valid ? "PASS" : "FAIL",
    operator_history_assessment: history.validation_state,
    workflow_replay_assessment: replay.validation_state,
    governance_compliance: workflow.governance_compliant && workflow.constitutional_compliant ? "PASS" : "FAIL",
    authority_boundary_assessment: workflow.authority_bound ? "PASS" : "FAIL",
    integrity_verification: failures.includes("INTEGRITY_HASH_MISMATCH") ? "FAIL" : "PASS",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: DecisionIntelligenceCertificationResult, evidence: OperatorWorkflowEvidencePackage, report: OperatorWorkflowCertificationReport, scenario: Scenario): readonly OperatorWorkflowLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<OperatorWorkflowLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "operator_workflow_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "WORKFLOW_VALIDATED", scope_ref: "operator_workflow_lifecycle", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:22.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "operator_workflow_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "APPROVAL_VALIDATED", scope_ref: "approval_workflow", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:23.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "operator_workflow_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "OVERRIDE_AUDITED", scope_ref: "override_history", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:24.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "operator_workflow_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "OPERATOR_WORKFLOW_CERTIFIED" : "OPERATOR_WORKFLOW_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:25.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildValidation(failures: readonly OperatorWorkflowCertificationFailure[]): OperatorWorkflowCertificationValidation {
  const has = (failure: OperatorWorkflowCertificationFailure) => failures.includes(failure);
  const base: Omit<OperatorWorkflowCertificationValidation, "integrity_hash"> = {
    validation_id: "operator_workflow_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    intelligence_certification_valid: !has("DECISION_INTELLIGENCE_CERTIFICATION_INVALID"),
    required_approvals_present: !has("MISSING_REQUIRED_APPROVAL"),
    approvals_authorized: !has("UNAUTHORIZED_APPROVAL"),
    rejections_authorized: !has("UNAUTHORIZED_REJECTION"),
    overrides_authorized: !has("UNAUTHORIZED_OVERRIDE"),
    override_justification_present: !has("MISSING_OVERRIDE_JUSTIFICATION"),
    original_recommendation_preserved: !has("ORIGINAL_RECOMMENDATION_MODIFIED_OR_LOST"),
    deferrals_authorized: !has("UNAUTHORIZED_DEFERRAL"),
    escalations_authorized: !has("UNAUTHORIZED_ESCALATION"),
    escalation_routing_correct: !has("INCORRECT_ESCALATION_ROUTING"),
    operator_history_complete: !has("MISSING_OPERATOR_HISTORY"),
    workflow_reconstruction_complete: !has("INCOMPLETE_WORKFLOW_RECONSTRUCTION"),
    workflow_replay_consistent: !has("WORKFLOW_REPLAY_MISMATCH"),
    state_transitions_valid: !has("INVALID_STATE_TRANSITION"),
    governance_compliant: !has("GOVERNANCE_BYPASS"),
    constitutional_compliant: !has("CONSTITUTIONAL_VIOLATION"),
    authority_boundaries_enforced: !has("AUTHORITY_BOUNDARY_VIOLATION"),
    tenant_isolated: !has("CROSS_TENANT_WORKFLOW_CONTAMINATION"),
    hidden_actions_absent: !has("HIDDEN_OPERATOR_ACTION"),
    audit_history_immutable: !has("MUTABLE_AUDIT_HISTORY"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    fail_closed: !has("FAIL_OPEN_WORKFLOW_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OperatorWorkflowCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    workflow: result.workflow_report,
    approval: result.approval_report,
    override: result.override_report,
    history: result.history_report,
    replay: result.replay_report,
    evidence: result.evidence_package,
    report: result.workflow_certification_report,
    ledger: result.workflow_ledger,
    validation: result.validation,
  });
}

export function runOperatorWorkflowCertification(input: OperatorWorkflowCertificationInput = {}): OperatorWorkflowCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const intelligence_certification = input.intelligence_certification ?? runDecisionIntelligenceCertification({ scenario: scenario === "INTELLIGENCE_INVALID" ? "HIDDEN_REASONING" : "BASELINE" });
  const workflow_report = buildWorkflow(intelligence_certification, scenario);
  const approval_report = buildApproval(intelligence_certification, scenario);
  const override_report = buildOverride(intelligence_certification, scenario);
  const history_report = buildHistory(intelligence_certification, scenario);
  const replay_report = buildReplay(intelligence_certification, scenario);
  const evidence_package = buildEvidence(intelligence_certification, approval_report, override_report, history_report, replay_report, scenario);
  const preFailures = collectFailures({ intelligence: intelligence_certification, workflow: workflow_report, approval: approval_report, override: override_report, history: history_report, replay: replay_report, evidence: evidence_package, ledger: [], role, scenario });
  const workflow_certification_report = buildCertificationReport(intelligence_certification, workflow_report, approval_report, override_report, history_report, replay_report, preFailures);
  const workflow_ledger = buildLedger(intelligence_certification, evidence_package, workflow_certification_report, scenario);
  const failures = collectFailures({ intelligence: intelligence_certification, workflow: workflow_report, approval: approval_report, override: override_report, history: history_report, replay: replay_report, evidence: evidence_package, ledger: workflow_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<OperatorWorkflowCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    intelligence_certification,
    workflow_report,
    approval_report,
    override_report,
    history_report,
    replay_report,
    evidence_package,
    workflow_certification_report,
    workflow_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_workflow_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOperatorWorkflowCertification(result: OperatorWorkflowCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeWorkflowValidationReportHash(record: Omit<WorkflowValidationReport, "integrity_hash"> | WorkflowValidationReport): string {
  return hashWithoutIntegrity(record);
}

export function getOperatorWorkflowCertificationFoundation(): OperatorWorkflowCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: OPERATOR_WORKFLOW_SCOPES,
    checks: OPERATOR_WORKFLOW_CHECKS,
    result: runOperatorWorkflowCertification(),
  });
}

export const OperatorWorkflowCertification = Object.freeze({
  run: runOperatorWorkflowCertification,
  replay: replayOperatorWorkflowCertification,
});
