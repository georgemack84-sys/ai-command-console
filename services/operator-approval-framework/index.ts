import { runAdaptiveReplayTraceabilityContract } from "@/services/adaptive-replay-traceability-contract";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { AdaptiveReplayTraceabilityResult } from "@/types/adaptive-replay-traceability-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  OperatorApprovalCertificationReport,
  OperatorApprovalCheck,
  OperatorApprovalContract,
  OperatorApprovalDecision,
  OperatorApprovalDecisionType,
  OperatorApprovalFailure,
  OperatorApprovalFrameworkFoundation,
  OperatorApprovalFrameworkInput,
  OperatorApprovalFrameworkResult,
  OperatorApprovalLedgerRecord,
  OperatorApprovalLevel,
  OperatorApprovalPolicy,
  OperatorApprovalRecord,
  OperatorApprovalReplay,
  OperatorApprovalStatus,
  OperatorApprovalValidation,
  OperatorApprovalValidationState,
  OperatorAuthorityValidation,
  OperatorApprovalWorkflow,
  OperatorApprovalDashboard,
} from "@/types/operator-approval-framework";

const APPROVAL_FRAMEWORK_VERSION = "operator-approval-framework/v1" as const;

export const OPERATOR_APPROVAL_CHECKS: readonly OperatorApprovalCheck[] = Object.freeze(["ADVISORY_ONLY", "GOVERNANCE_DEPENDENCY", "APPROVAL_POLICY", "OPERATOR_AUTHORITY", "SEPARATION_OF_DUTIES", "WORKFLOW_STATE", "REPLAY_DEPENDENCY", "AUDIT_TRAIL", "CERTIFICATION_DEPENDENCY", "TENANT_ISOLATION", "INTEGRITY", "LEDGER_IMMUTABILITY"]);
export const OPERATOR_APPROVAL_LEVELS: readonly OperatorApprovalLevel[] = Object.freeze(["LEVEL_1_OPERATIONAL", "LEVEL_2_MISSION", "LEVEL_3_GOVERNANCE", "LEVEL_4_EXECUTIVE"]);
export const OPERATOR_APPROVAL_STATUSES: readonly OperatorApprovalStatus[] = Object.freeze(["PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED", "ESCALATED", "DEFERRED", "SUPERSEDED"]);
export const OPERATOR_APPROVAL_DECISION_TYPES: readonly OperatorApprovalDecisionType[] = Object.freeze(["APPROVE", "REJECT", "REQUEST_REVISION", "ESCALATE", "DEFER"]);

type Scenario = NonNullable<OperatorApprovalFrameworkInput["scenario"]>;

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

function state(pass: boolean): OperatorApprovalValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: AdaptiveReplayTraceabilityResult) {
  return {
    tenant_id: source.replay_record.tenant_id,
    mission_scope: source.replay_record.mission_scope,
    adaptation_id: source.replay_record.adaptation_id,
    proposal_id: source.replay_record.proposal_id,
  };
}

function visibleToRole(source: AdaptiveReplayTraceabilityResult, role: VisibilityRole): boolean {
  return source.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function replaySourceForScenario(input: OperatorApprovalFrameworkInput, scenario: Scenario): AdaptiveReplayTraceabilityResult {
  if (input.replay_traceability) return input.replay_traceability;
  if (scenario === "GOVERNANCE_INCOMPLETE" || scenario === "GOVERNANCE_BYPASS") return runAdaptiveReplayTraceabilityContract({ scenario: "MISSING_GOVERNANCE" });
  if (scenario === "CONSTITUTIONAL_FAILURE" || scenario === "AUTHORITY_INVALID" || scenario === "AUTHORITY_SCOPE_EXCEEDED") return runAdaptiveReplayTraceabilityContract({ scenario: "AUTHORITY_INVALID" });
  if (scenario === "REPLAY_INCOMPLETE" || scenario === "APPROVAL_REPLAY_OMITTED") return runAdaptiveReplayTraceabilityContract({ scenario: "MISSING_REPLAY_STEPS" });
  if (scenario === "MISSING_REPLAY_REFS") return runAdaptiveReplayTraceabilityContract({ scenario: "MISSING_REPLAY_STEPS" });
  if (scenario === "MISSING_CERTIFICATION_REFS" || scenario === "CERTIFICATION_BYPASS") return runAdaptiveReplayTraceabilityContract({ scenario: "MISSING_CERTIFICATION" });
  if (scenario === "HASH_MISMATCH") return runAdaptiveReplayTraceabilityContract({ scenario: "HASH_MISMATCH" });
  return runAdaptiveReplayTraceabilityContract();
}

function approvalLevel(input: OperatorApprovalFrameworkInput, scenario: Scenario): OperatorApprovalLevel {
  if (input.approval_level) return input.approval_level;
  if (scenario === "INVALID_APPROVAL_LEVEL") return "LEVEL_1_OPERATIONAL";
  if (scenario === "AUTHORITY_SCOPE_EXCEEDED") return "LEVEL_4_EXECUTIVE";
  return "LEVEL_2_MISSION";
}

function decisionType(input: OperatorApprovalFrameworkInput, scenario: Scenario): OperatorApprovalDecisionType {
  if (input.decision_type) return input.decision_type;
  if (scenario === "POLICY_VIOLATION" || scenario === "UNAUTHORIZED_OPERATOR") return "REJECT";
  if (scenario === "INVALID_APPROVAL_LEVEL" || scenario === "AUTHORITY_SCOPE_EXCEEDED") return "ESCALATE";
  if (scenario === "REPLAY_INCOMPLETE") return "REQUEST_REVISION";
  return "APPROVE";
}

function buildContract(source: AdaptiveReplayTraceabilityResult, input: OperatorApprovalFrameworkInput, scenario: Scenario): OperatorApprovalContract {
  const c = ctx(source);
  const base: Omit<OperatorApprovalContract, "integrity_hash"> = {
    contract_id: "operator_approval_contract",
    proposal_id: c.proposal_id,
    adaptation_id: c.adaptation_id,
    tenant_id: scenario === "TENANT_MISMATCH" ? `${c.tenant_id}:foreign` : c.tenant_id,
    mission_scope: c.mission_scope,
    approval_required: scenario !== "APPROVAL_NOT_REQUIRED",
    required_approval_level: approvalLevel(input, scenario),
    authorized_approvers: scenario === "UNAUTHORIZED_OPERATOR" || scenario === "OPERATOR_IMPERSONATION" ? freezeArray([]) : freezeArray(["operator:adaptive-review", "operator:mission-owner", "operator:governance-authority"]),
    governance_dependency: scenario === "GOVERNANCE_INCOMPLETE" || scenario === "GOVERNANCE_BYPASS" ? "" : source.replay_record.governance_refs[0] ?? "",
    replay_requirement: scenario === "MISSING_REPLAY_REFS" || scenario === "APPROVAL_REPLAY_OMITTED" ? "" : source.replay_record.replay_id,
    certification_dependency: scenario === "MISSING_CERTIFICATION_REFS" || scenario === "CERTIFICATION_BYPASS" ? "" : source.replay_record.certification_refs[0] ?? "",
    audit_requirement: scenario === "MISSING_AUDIT_REFS" || scenario === "AUDIT_DELETION" ? "" : "audit:operator-approval",
    immutable_after_review_entry: scenario !== "AUDIT_DELETION",
    advisory_only_until_approved: scenario !== "AUTOMATIC_ADOPTION" && scenario !== "EXECUTION_AUTHORITY",
    created_at: "2026-07-05T10:01:10.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.contract_id }) });
  return built;
}

function buildPolicy(source: AdaptiveReplayTraceabilityResult, contract: OperatorApprovalContract, scenario: Scenario): OperatorApprovalPolicy {
  const base: Omit<OperatorApprovalPolicy, "integrity_hash"> = {
    policy_id: "operator_approval_policy",
    approval_required: contract.approval_required,
    required_approval_level: contract.required_approval_level,
    governance_dependencies: contract.governance_dependency ? freezeArray([contract.governance_dependency]) : freezeArray([]),
    certification_dependencies: contract.certification_dependency ? freezeArray([contract.certification_dependency]) : freezeArray([]),
    escalation_required: contract.required_approval_level === "LEVEL_4_EXECUTIVE" || scenario === "INVALID_APPROVAL_LEVEL",
    separation_of_duties_required: true,
    eligible_operator_roles: scenario === "UNAUTHORIZED_OPERATOR" ? freezeArray([]) : freezeArray(["OPERATOR"]),
    policy_source_refs: scenario === "POLICY_VIOLATION" ? freezeArray([]) : source.replay_record.governance_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAuthority(source: AdaptiveReplayTraceabilityResult, contract: OperatorApprovalContract, policy: OperatorApprovalPolicy, role: VisibilityRole, scenario: Scenario): OperatorAuthorityValidation {
  const base: Omit<OperatorAuthorityValidation, "integrity_hash"> = {
    validation_id: "operator_authority_validation",
    operator_id: scenario === "OPERATOR_IMPERSONATION" ? "operator:unknown" : "operator:adaptive-review",
    operator_role: role,
    tenant_membership_verified: contract.tenant_id === source.replay_record.tenant_id && scenario !== "TENANT_MISMATCH",
    mission_authorization_verified: scenario !== "AUTHORITY_SCOPE_EXCEEDED",
    governance_permissions_verified: source.replay_record.governance_refs.length > 0 && scenario !== "GOVERNANCE_BYPASS",
    certification_eligibility_verified: source.replay_record.certification_refs.length > 0 && scenario !== "CERTIFICATION_BYPASS",
    operator_identity_verified: scenario !== "OPERATOR_IMPERSONATION",
    operator_authorized: policy.eligible_operator_roles.includes(role) && contract.authorized_approvers.includes("operator:adaptive-review") && scenario !== "UNAUTHORIZED_OPERATOR",
    separation_of_duties_verified: !["SEPARATION_OF_DUTIES", "SELF_APPROVAL"].includes(scenario),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function workflowStatus(scenario: Scenario, decision: OperatorApprovalDecisionType): OperatorApprovalStatus {
  if (scenario === "WORKFLOW_BYPASS" || scenario === "HIDDEN_APPROVAL") return "APPROVED";
  if (decision === "REJECT") return "REJECTED";
  if (decision === "REQUEST_REVISION") return "REVISION_REQUESTED";
  if (decision === "ESCALATE") return "ESCALATED";
  if (decision === "DEFER") return "DEFERRED";
  return "APPROVED";
}

function buildWorkflow(contract: OperatorApprovalContract, scenario: Scenario, decision: OperatorApprovalDecisionType): OperatorApprovalWorkflow {
  const transitions = scenario === "WORKFLOW_BYPASS" || scenario === "HIDDEN_APPROVAL"
    ? freezeArray(["PENDING_ASSIGNMENT", "APPROVED"])
    : freezeArray(["PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", workflowStatus(scenario, decision)]);
  const base: Omit<OperatorApprovalWorkflow, "integrity_hash"> = {
    workflow_id: "operator_approval_workflow",
    approval_id: scenario === "MISSING_APPROVAL_ID" ? "" : "operator_approval_001",
    states: OPERATOR_APPROVAL_STATUSES,
    current_status: workflowStatus(scenario, decision),
    transition_history: transitions,
    governance_completed_before_review: Boolean(contract.governance_dependency) && !["GOVERNANCE_INCOMPLETE", "GOVERNANCE_BYPASS"].includes(scenario),
    deterministic_transitions: scenario !== "WORKFLOW_BYPASS" && scenario !== "HIDDEN_APPROVAL",
    bypass_detected: scenario === "WORKFLOW_BYPASS" || scenario === "HIDDEN_APPROVAL",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(source: AdaptiveReplayTraceabilityResult, contract: OperatorApprovalContract, authority: OperatorAuthorityValidation, workflow: OperatorApprovalWorkflow, scenario: Scenario, decision: OperatorApprovalDecisionType): OperatorApprovalRecord {
  const c = ctx(source);
  const base: Omit<OperatorApprovalRecord, "integrity_hash"> = {
    approval_id: workflow.approval_id,
    proposal_id: c.proposal_id,
    adaptation_id: c.adaptation_id,
    tenant_id: contract.tenant_id,
    mission_scope: c.mission_scope,
    approval_level: contract.required_approval_level,
    assigned_operator: authority.operator_id,
    operator_role: authority.operator_role,
    approval_status: workflow.current_status,
    approval_reason: decision === "APPROVE" ? "Authorized operator approved the advisory recommendation after governance and replay validation." : "Operator did not approve the recommendation for implementation.",
    governance_dependency: contract.governance_dependency,
    replay_reference: contract.replay_requirement,
    audit_reference: contract.audit_requirement,
    certification_reference: contract.certification_dependency,
    approval_timestamp: "2026-07-05T10:01:11.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.approval_id }) });
  return built;
}

function buildDecision(record: OperatorApprovalRecord, decision: OperatorApprovalDecisionType, scenario: Scenario): OperatorApprovalDecision {
  const base: Omit<OperatorApprovalDecision, "integrity_hash"> = {
    decision_id: "operator_approval_decision",
    approval_id: record.approval_id,
    proposal_id: record.proposal_id,
    assigned_operator: record.assigned_operator,
    operator_role: record.operator_role,
    decision_type: decision,
    decision_rationale: record.approval_reason,
    governance_refs: record.governance_dependency ? freezeArray([record.governance_dependency]) : freezeArray([]),
    replay_refs: record.replay_reference ? freezeArray([record.replay_reference]) : freezeArray([]),
    audit_refs: record.audit_reference ? freezeArray([record.audit_reference]) : freezeArray([]),
    certification_refs: record.certification_reference ? freezeArray([record.certification_reference]) : freezeArray([]),
    deterministic_replay_verified: scenario !== "REPLAY_INCOMPLETE" && scenario !== "APPROVAL_REPLAY_OMITTED",
    decision_outcome: "PASS",
  };
  const normalized = { ...base, decision_outcome: state(base.governance_refs.length > 0 && base.replay_refs.length > 0 && base.audit_refs.length > 0 && base.certification_refs.length > 0 && base.deterministic_replay_verified) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildReplay(record: OperatorApprovalRecord, decision: OperatorApprovalDecision, scenario: Scenario): OperatorApprovalReplay {
  const base: Omit<OperatorApprovalReplay, "integrity_hash"> = {
    replay_id: "operator_approval_replay",
    approval_id: record.approval_id,
    proposal_id: record.proposal_id,
    assigned_operator: record.assigned_operator,
    operator_role: record.operator_role,
    decision_type: decision.decision_type,
    governance_refs: decision.governance_refs,
    replay_refs: scenario === "APPROVAL_REPLAY_OMITTED" ? freezeArray([]) : decision.replay_refs,
    audit_refs: decision.audit_refs,
    certification_refs: decision.certification_refs,
    identical_workflow: scenario !== "WORKFLOW_BYPASS" && scenario !== "HIDDEN_APPROVAL",
    identical_decision: scenario !== "HIDDEN_APPROVAL",
    identical_integrity_hashes: scenario !== "HASH_MISMATCH",
    replay_result: "PASS",
  };
  const normalized = { ...base, replay_result: state(base.governance_refs.length > 0 && base.replay_refs.length > 0 && base.audit_refs.length > 0 && base.certification_refs.length > 0 && base.identical_workflow && base.identical_decision && base.identical_integrity_hashes) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildLedger(record: OperatorApprovalRecord, decision: OperatorApprovalDecision, scenario: Scenario): readonly OperatorApprovalLedgerRecord[] {
  const event: Omit<OperatorApprovalLedgerRecord, "integrity_hash"> = {
    record_id: "operator_approval_ledger_001",
    approval_id: record.approval_id,
    proposal_id: record.proposal_id,
    adaptation_id: record.adaptation_id,
    tenant_id: record.tenant_id,
    mission_scope: record.mission_scope,
    approval_level: record.approval_level,
    operator_id: record.assigned_operator,
    approval_decision: decision.decision_type,
    governance_refs: decision.governance_refs,
    replay_refs: decision.replay_refs,
    audit_refs: scenario === "AUDIT_DELETION" ? freezeArray([]) : decision.audit_refs,
    certification_refs: decision.certification_refs,
    timestamp: record.approval_timestamp,
    sequence_number: 1,
    append_only: (scenario === "AUDIT_DELETION" || scenario === "FAIL_OPEN" ? false : true) as true,
    deleted: (scenario === "AUDIT_DELETION" ? true : false) as false,
  };
  return freezeArray([Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })]);
}

function collectFailures(input: {
  source: AdaptiveReplayTraceabilityResult;
  contract: OperatorApprovalContract;
  policy: OperatorApprovalPolicy;
  authority: OperatorAuthorityValidation;
  workflow: OperatorApprovalWorkflow;
  record: OperatorApprovalRecord;
  decision: OperatorApprovalDecision;
  replay: OperatorApprovalReplay;
  ledger: readonly OperatorApprovalLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OperatorApprovalFailure[] {
  const failures: OperatorApprovalFailure[] = [];
  if (input.source.validation.validation_status !== "VALID" || !input.contract.governance_dependency) failures.push("GOVERNANCE_VALIDATION_INCOMPLETE");
  if (input.scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (input.source.authority_binding.validation.validation_status !== "VALID") failures.push("AUTHORITY_VALIDATION_FAILED");
  if (input.source.validation.validation_status !== "VALID" || input.source.verification.verification_result !== "PASS") failures.push("REPLAY_VALIDATION_INCOMPLETE");
  if (!input.record.approval_id) failures.push("APPROVAL_IDENTIFIER_MISSING");
  if (!input.policy.policy_source_refs.length || input.scenario === "POLICY_VIOLATION") failures.push("APPROVAL_POLICY_VIOLATED");
  if (!input.contract.approval_required) failures.push("APPROVAL_REQUIREMENT_MISSING");
  if (input.scenario === "INVALID_APPROVAL_LEVEL") failures.push("APPROVAL_LEVEL_INVALID");
  if (!input.authority.operator_authorized || input.scenario === "UNAUTHORIZED_OPERATOR") failures.push("OPERATOR_NOT_AUTHORIZED");
  if (!input.authority.operator_identity_verified || input.scenario === "OPERATOR_IMPERSONATION") failures.push("OPERATOR_IMPERSONATION");
  if (!input.authority.separation_of_duties_verified || input.scenario === "SEPARATION_OF_DUTIES" || input.scenario === "SELF_APPROVAL") failures.push("SEPARATION_OF_DUTIES_VIOLATED");
  if (!input.authority.tenant_membership_verified || input.contract.tenant_id !== input.source.replay_record.tenant_id) failures.push("TENANT_SCOPE_MISMATCH");
  if (!input.authority.mission_authorization_verified || input.scenario === "AUTHORITY_SCOPE_EXCEEDED") failures.push("AUTHORITY_SCOPE_EXCEEDED");
  if (input.workflow.bypass_detected || !input.workflow.deterministic_transitions || input.scenario === "WORKFLOW_BYPASS") failures.push("WORKFLOW_BYPASS");
  if (!input.contract.advisory_only_until_approved || input.scenario === "AUTOMATIC_ADOPTION") failures.push("AUTOMATIC_ADOPTION_ATTEMPTED");
  if (input.scenario === "SELF_APPROVAL") failures.push("SELF_APPROVAL_ATTEMPTED");
  if (input.scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
  if (!input.decision.replay_refs.length || !input.replay.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.decision.audit_refs.length || input.ledger.some((entry) => !entry.audit_refs.length)) failures.push("AUDIT_REFERENCES_MISSING");
  if (!input.decision.certification_refs.length) failures.push("CERTIFICATION_REFERENCES_MISSING");
  if (input.scenario === "APPROVAL_REPLAY_OMITTED" || input.replay.replay_result !== "PASS") failures.push("APPROVAL_REPLAY_OMITTED");
  if (input.ledger.some((entry) => entry.deleted || !entry.append_only) || input.scenario === "AUDIT_DELETION") failures.push("AUDIT_TRAIL_DELETION");
  if (input.scenario === "CERTIFICATION_BYPASS") failures.push("CERTIFICATION_BYPASS");
  if (input.scenario === "HIDDEN_APPROVAL") failures.push("HIDDEN_APPROVAL");
  if (
    hashWithoutIntegrity(input.contract) !== input.contract.integrity_hash
    || hashWithoutIntegrity(input.policy) !== input.policy.integrity_hash
    || hashWithoutIntegrity(input.authority) !== input.authority.integrity_hash
    || hashWithoutIntegrity(input.workflow) !== input.workflow.integrity_hash
    || hashWithoutIntegrity(input.record) !== input.record.integrity_hash
    || hashWithoutIntegrity(input.decision) !== input.decision.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "FAIL_OPEN" || (input.decision.decision_outcome === "PASS" && failures.length > 0)) failures.push("FAIL_OPEN_APPROVAL_BEHAVIOR");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildReport(contract: OperatorApprovalContract, replay: OperatorApprovalReplay, ledger: readonly OperatorApprovalLedgerRecord[], failures: readonly OperatorApprovalFailure[]): OperatorApprovalCertificationReport {
  const has = (failure: OperatorApprovalFailure) => failures.includes(failure);
  const base: Omit<OperatorApprovalCertificationReport, "integrity_hash"> = {
    report_id: "operator_approval_certification_report",
    tenant_id: contract.tenant_id,
    checks: OPERATOR_APPROVAL_CHECKS,
    human_approval_required: !has("APPROVAL_REQUIREMENT_MISSING"),
    advisory_only_enforced: !has("AUTOMATIC_ADOPTION_ATTEMPTED") && !has("EXECUTION_AUTHORITY_GRANTED"),
    governance_completed_first: !has("GOVERNANCE_VALIDATION_INCOMPLETE") && !has("GOVERNANCE_BYPASS"),
    operator_authority_verified: !has("OPERATOR_NOT_AUTHORIZED") && !has("OPERATOR_IMPERSONATION"),
    separation_of_duties_verified: !has("SEPARATION_OF_DUTIES_VIOLATED") && !has("SELF_APPROVAL_ATTEMPTED"),
    replay_verified: replay.replay_result === "PASS" && !has("APPROVAL_REPLAY_OMITTED"),
    audit_complete: !has("AUDIT_REFERENCES_MISSING") && !has("AUDIT_TRAIL_DELETION"),
    certification_bound: !has("CERTIFICATION_REFERENCES_MISSING") && !has("CERTIFICATION_BYPASS"),
    tenant_isolation_preserved: !has("TENANT_SCOPE_MISMATCH"),
    ledger_immutable: ledger.every((entry) => entry.append_only && !entry.deleted),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    failure_analysis: failures,
    certification_decision: state(failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(failures: readonly OperatorApprovalFailure[]): OperatorApprovalValidation {
  const has = (failure: OperatorApprovalFailure) => failures.includes(failure);
  const base: Omit<OperatorApprovalValidation, "integrity_hash"> = {
    validation_id: "operator_approval_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    governance_complete: !has("GOVERNANCE_VALIDATION_INCOMPLETE") && !has("GOVERNANCE_BYPASS"),
    constitutional_valid: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    authority_valid: !has("AUTHORITY_VALIDATION_FAILED"),
    replay_valid: !has("REPLAY_VALIDATION_INCOMPLETE") && !has("APPROVAL_REPLAY_OMITTED"),
    approval_identifier_present: !has("APPROVAL_IDENTIFIER_MISSING"),
    approval_policy_valid: !has("APPROVAL_POLICY_VIOLATED"),
    approval_required: !has("APPROVAL_REQUIREMENT_MISSING"),
    approval_level_valid: !has("APPROVAL_LEVEL_INVALID"),
    operator_authorized: !has("OPERATOR_NOT_AUTHORIZED") && !has("OPERATOR_IMPERSONATION"),
    separation_of_duties_verified: !has("SEPARATION_OF_DUTIES_VIOLATED") && !has("SELF_APPROVAL_ATTEMPTED"),
    tenant_isolated: !has("TENANT_SCOPE_MISMATCH"),
    authority_within_scope: !has("AUTHORITY_SCOPE_EXCEEDED"),
    workflow_enforced: !has("WORKFLOW_BYPASS") && !has("HIDDEN_APPROVAL"),
    advisory_only_until_approved: !has("AUTOMATIC_ADOPTION_ATTEMPTED") && !has("EXECUTION_AUTHORITY_GRANTED"),
    replay_references_present: !has("REPLAY_REFERENCES_MISSING"),
    audit_references_present: !has("AUDIT_REFERENCES_MISSING") && !has("AUDIT_TRAIL_DELETION"),
    certification_references_present: !has("CERTIFICATION_REFERENCES_MISSING") && !has("CERTIFICATION_BYPASS"),
    ledger_immutable: !has("AUDIT_TRAIL_DELETION") && !has("FAIL_OPEN_APPROVAL_BEHAVIOR"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDashboard(record: OperatorApprovalRecord, decision: OperatorApprovalDecision, failures: readonly OperatorApprovalFailure[]): OperatorApprovalDashboard {
  const base: Omit<OperatorApprovalDashboard, "integrity_hash"> = {
    dashboard_id: "operator_approval_dashboard",
    pending_approvals: record.approval_status === "PENDING_ASSIGNMENT" || record.approval_status === "ASSIGNED" || record.approval_status === "UNDER_REVIEW" ? 1 : 0,
    assigned_reviewers: record.assigned_operator ? freezeArray([record.assigned_operator]) : freezeArray([]),
    approval_statuses: freezeArray([record.approval_status]),
    rejection_reasons: decision.decision_type === "REJECT" ? freezeArray([decision.decision_rationale]) : freezeArray([]),
    revision_requests: decision.decision_type === "REQUEST_REVISION" ? freezeArray([decision.decision_rationale]) : freezeArray([]),
    governance_dependencies: decision.governance_refs,
    replay_verification: failures.includes("APPROVAL_REPLAY_OMITTED") ? "FAIL" : "PASS",
    audit_history_refs: decision.audit_refs,
    approval_metrics: Object.freeze({
      total_approvals: 1,
      unauthorized_approvals: failures.includes("OPERATOR_NOT_AUTHORIZED") ? 1 : 0,
      automatic_adoptions: failures.includes("AUTOMATIC_ADOPTION_ATTEMPTED") ? 1 : 0,
      governance_bypasses: failures.includes("GOVERNANCE_BYPASS") ? 1 : 0,
      separation_of_duties_violations: failures.includes("SEPARATION_OF_DUTIES_VIOLATED") ? 1 : 0,
    }),
    bottlenecks: failures.length ? failures : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OperatorApprovalFrameworkResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    contract: result.approval_contract,
    policy: result.approval_policy,
    authority: result.authority_validation,
    workflow: result.approval_workflow,
    record: result.approval_record,
    decision: result.approval_decision,
    replay: result.approval_replay,
    ledger: result.approval_ledger,
    report: result.certification_report,
    validation: result.validation,
  });
}

export function runOperatorApprovalFramework(input: OperatorApprovalFrameworkInput = {}): OperatorApprovalFrameworkResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const replay_traceability = replaySourceForScenario(input, scenario);
  const approval_contract = buildContract(replay_traceability, input, scenario);
  const approval_policy = buildPolicy(replay_traceability, approval_contract, scenario);
  const authority_validation = buildAuthority(replay_traceability, approval_contract, approval_policy, role, scenario);
  const decision_kind = decisionType(input, scenario);
  const approval_workflow = buildWorkflow(approval_contract, scenario, decision_kind);
  const approval_record = buildRecord(replay_traceability, approval_contract, authority_validation, approval_workflow, scenario, decision_kind);
  const approval_decision = buildDecision(approval_record, decision_kind, scenario);
  const approval_replay = buildReplay(approval_record, approval_decision, scenario);
  const approval_ledger = buildLedger(approval_record, approval_decision, scenario);
  const failures = collectFailures({ source: replay_traceability, contract: approval_contract, policy: approval_policy, authority: authority_validation, workflow: approval_workflow, record: approval_record, decision: approval_decision, replay: approval_replay, ledger: approval_ledger, role, scenario });
  const certification_report = buildReport(approval_contract, approval_replay, approval_ledger, failures);
  const validation = buildValidation(failures);
  const dashboard = buildDashboard(approval_record, approval_decision, failures);
  const base: Omit<OperatorApprovalFrameworkResult, "integrity_hash" | "replay_hash"> = {
    approval_framework_version: APPROVAL_FRAMEWORK_VERSION,
    replay_traceability,
    approval_contract,
    approval_policy,
    authority_validation,
    approval_workflow,
    approval_record,
    approval_decision,
    approval_replay,
    approval_ledger,
    dashboard,
    certification_report,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    human_approval_required: true,
    recommendation_available_for_implementation: validation.validation_status === "VALID" && approval_decision.decision_type === "APPROVE",
    permits_automatic_adoption: false,
    permits_execution: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOperatorApprovalFramework(result: OperatorApprovalFrameworkResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOperatorApprovalHash(record: Omit<OperatorApprovalRecord, "integrity_hash"> | OperatorApprovalRecord): string {
  return hashWithoutIntegrity(record);
}

export function getOperatorApprovalFrameworkFoundation(): OperatorApprovalFrameworkFoundation {
  return Object.freeze({
    approval_framework_version: APPROVAL_FRAMEWORK_VERSION,
    checks: OPERATOR_APPROVAL_CHECKS,
    approval_levels: OPERATOR_APPROVAL_LEVELS,
    approval_statuses: OPERATOR_APPROVAL_STATUSES,
    decision_types: OPERATOR_APPROVAL_DECISION_TYPES,
    result: runOperatorApprovalFramework(),
  });
}

export const OperatorApprovalFramework = Object.freeze({
  run: runOperatorApprovalFramework,
  replay: replayOperatorApprovalFramework,
});
