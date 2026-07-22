import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPriorityRiskDashboard } from "@/services/decision-priority-risk-dashboard";
import type { PriorityRiskDashboardResult } from "@/types/decision-priority-risk-dashboard";
import type { DecisionStateRecord } from "@/types/decision-state-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  ApprovalWorkflow,
  ApprovalWorkflowStage,
  AuthorityDashboard,
  AuthorityVisibilityLevel,
  ConstitutionalDashboard,
  ConstitutionalVisibilityState,
  GovernanceAuthorityVisibilityFailure,
  GovernanceAuthorityVisibilityFoundation,
  GovernanceAuthorityVisibilityInput,
  GovernanceAuthorityVisibilityResult,
  GovernanceAuthorityVisibilityValidation,
  GovernanceDashboard,
  GovernanceStatusRecord,
  GovernanceVisibilityLedgerEntry,
  GovernanceVisibilityRecord,
  GovernanceVisibilityState,
  RestrictionSeverity,
  RestrictionType,
  RestrictionView,
} from "@/types/decision-governance-authority-visibility";

const VISIBILITY_VERSION = "decision-governance-authority-visibility/v1" as const;

export const GOVERNANCE_VISIBILITY_STATES: readonly GovernanceVisibilityState[] = Object.freeze(["NOT_EVALUATED", "UNDER_REVIEW", "COMPLIANT", "CONDITIONALLY_COMPLIANT", "NON_COMPLIANT", "ESCALATED", "RESOLVED"]);
export const CONSTITUTIONAL_VISIBILITY_STATES: readonly ConstitutionalVisibilityState[] = Object.freeze(["FULLY_COMPLIANT", "CONDITIONAL_REVIEW", "OPERATOR_APPROVAL_REQUIRED", "GOVERNANCE_APPROVAL_REQUIRED", "CONSTITUTIONAL_VIOLATION", "REJECTED"]);
export const AUTHORITY_VISIBILITY_LEVELS: readonly AuthorityVisibilityLevel[] = Object.freeze(["INFORMATIONAL", "OPERATOR", "MISSION_LEAD", "GOVERNANCE_BOARD", "CONSTITUTIONAL_AUTHORITY", "EXECUTIVE_AUTHORITY"]);
export const APPROVAL_WORKFLOW_STAGES: readonly ApprovalWorkflowStage[] = Object.freeze(["APPROVAL_REQUESTED", "AUTHORITY_VERIFIED", "GOVERNANCE_REVIEW", "OPERATOR_REVIEW", "DECISION", "APPROVED", "REJECTED", "ARCHIVED"]);
export const RESTRICTION_TYPES: readonly RestrictionType[] = Object.freeze(["GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "OPERATOR", "CERTIFICATION", "REPLAY", "EVIDENCE", "DEPENDENCY"]);

type Scenario = NonNullable<GovernanceAuthorityVisibilityInput["scenario"]>;

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

function ctx(source: PriorityRiskDashboardResult) {
  const conflict = source.conflict_visualization;
  const timeline = conflict.timeline_result;
  const dashboard = timeline.dashboard_result;
  const certification = dashboard.observability_result.certification_result;
  return {
    conflict,
    dashboard,
    registry: dashboard.registry,
    certification,
    tenant_id: source.dashboard_record.tenant_id,
    mission_id: source.dashboard_record.mission_id,
    replay_ref: source.replay_hash,
    certification_ref: source.dashboard_record.certification_ref,
  };
}

function governanceState(record: DecisionStateRecord): GovernanceVisibilityState {
  if (record.governance_state === "BLOCKED") return "NON_COMPLIANT";
  if (record.governance_state === "RESTRICTED") return "CONDITIONALLY_COMPLIANT";
  if (record.governance_state === "REVIEW_REQUIRED") return "UNDER_REVIEW";
  if (record.escalation_state === "ACTIVE") return "ESCALATED";
  return "COMPLIANT";
}

function constitutionalState(record: DecisionStateRecord): ConstitutionalVisibilityState {
  if (record.constitutional_state === "VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (record.authority_state === "APPROVAL_REQUIRED") return "OPERATOR_APPROVAL_REQUIRED";
  if (record.governance_state === "REVIEW_REQUIRED") return "GOVERNANCE_APPROVAL_REQUIRED";
  if (record.constitutional_state === "REVIEW_REQUIRED") return "CONDITIONAL_REVIEW";
  return "FULLY_COMPLIANT";
}

function authorityLevel(record: DecisionStateRecord): AuthorityVisibilityLevel {
  if (record.authority_state === "ESCALATION_REQUIRED") return "GOVERNANCE_BOARD";
  if (record.constitutional_state === "VIOLATION") return "CONSTITUTIONAL_AUTHORITY";
  if (record.authority_state === "UNAUTHORIZED") return "EXECUTIVE_AUTHORITY";
  if (record.priority === "CRITICAL") return "MISSION_LEAD";
  if (record.assigned_operator) return "OPERATOR";
  return "INFORMATIONAL";
}

function restrictionType(record: DecisionStateRecord): RestrictionType {
  if (record.constitutional_state === "VIOLATION") return "CONSTITUTIONAL";
  if (record.authority_state === "APPROVAL_REQUIRED" || record.authority_state === "ESCALATION_REQUIRED") return "AUTHORITY";
  if (record.certification_state === "FAIL" || record.certification_state === "PENDING") return "CERTIFICATION";
  if (record.replay_state === "FAILED" || record.replay_state === "DIVERGED") return "REPLAY";
  if (record.blocker_reason?.toLowerCase().includes("evidence")) return "EVIDENCE";
  if (record.dependency_chain.length) return "DEPENDENCY";
  return "GOVERNANCE";
}

function restrictionSeverity(record: DecisionStateRecord): RestrictionSeverity {
  if (record.risk_level === "CRITICAL" || record.constitutional_state === "VIOLATION") return "CRITICAL";
  if (record.risk_level === "HIGH" || record.governance_state === "RESTRICTED") return "HIGH";
  if (record.risk_level === "MODERATE") return "MODERATE";
  return "LOW";
}

function policyRefs(source: PriorityRiskDashboardResult): readonly string[] {
  return freezeArray([...new Set(source.conflict_visualization.conflicts.flatMap((conflict) => conflict.governance_refs).concat(source.risk_dashboard.decision_refs.map((decision) => `policy_visibility_${decision}`)))]);
}

function buildStatusRecords(source: PriorityRiskDashboardResult, scenario: Scenario): readonly GovernanceStatusRecord[] {
  const c = ctx(source);
  const records = c.registry.map((record) => {
    const base: Omit<GovernanceStatusRecord, "integrity_hash"> = {
      governance_status_id: `governance_status_${record.decision_id}`,
      decision_id: record.decision_id,
      tenant_id: scenario === "CROSS_TENANT" && record.decision_id === "decision_active_priority" ? "tenant_other" : record.tenant_id,
      mission_id: record.mission_id,
      governance_state: scenario === "HIDE_GOVERNANCE_STATUS" ? "NOT_EVALUATED" : governanceState(record),
      constitutional_state: scenario === "OMIT_CONSTITUTIONAL_VIOLATIONS" && record.constitutional_state === "VIOLATION" ? "FULLY_COMPLIANT" : constitutionalState(record),
      authority_state: scenario === "BAD_AUTHORITY_ASSIGNMENTS" && record.authority_state === "ESCALATION_REQUIRED" ? "OPERATOR" : authorityLevel(record),
      approval_state: record.authority_state === "AUTHORIZED" ? "APPROVED" : record.authority_state === "UNAUTHORIZED" ? "REJECTED" : "GOVERNANCE_REVIEW",
      restriction_state: record.lifecycle_state === "BLOCKED" ? "ACTIVE" : record.lifecycle_state === "ESCALATED" ? "ESCALATED" : "PENDING_REVIEW",
      policy_refs: scenario === "BAD_GOVERNANCE_LINEAGE" ? freezeArray([]) : freezeArray([`policy_${record.governance_state.toLowerCase()}`, `authority_${record.authority_state.toLowerCase()}`]),
      replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([record.replay_ref, c.replay_ref]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  });
  if (scenario === "NONDETERMINISTIC_RENDERING") return freezeArray(records.reverse());
  const sorted = records.sort((a, b) => a.governance_state.localeCompare(b.governance_state) || a.constitutional_state.localeCompare(b.constitutional_state) || a.decision_id.localeCompare(b.decision_id));
  if (scenario !== "HASH_MISMATCH") return freezeArray(sorted);
  return freezeArray(sorted.map((record, index) => index === 0 ? Object.freeze({ ...record, integrity_hash: hash({ tampered: record.governance_status_id }) }) : record));
}

function buildGovernanceDashboard(source: PriorityRiskDashboardResult, records: readonly GovernanceStatusRecord[], scenario: Scenario): GovernanceDashboard {
  const c = ctx(source);
  const policies = scenario === "BAD_GOVERNANCE_LINEAGE" ? freezeArray([]) : policyRefs(source);
  const restricted = records.filter((record) => record.governance_state === "CONDITIONALLY_COMPLIANT" || record.governance_state === "NON_COMPLIANT").length;
  const base: Omit<GovernanceDashboard, "integrity_hash"> = {
    governance_dashboard_id: "governance_visibility_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    governance_state: scenario === "HIDE_GOVERNANCE_STATUS" ? "NOT_EVALUATED" : restricted ? "CONDITIONALLY_COMPLIANT" : "COMPLIANT",
    policy_results: policies,
    compliance_summary: Object.freeze({ compliance_score: scenario === "HIDE_GOVERNANCE_STATUS" ? 100 : 82, non_compliant_decisions: records.filter((record) => record.governance_state === "NON_COMPLIANT").length, restricted_decisions: restricted }),
    governance_reviews: scenario === "HIDE_GOVERNANCE_STATUS" ? freezeArray([]) : freezeArray(records.filter((record) => record.governance_state === "UNDER_REVIEW" || record.governance_state === "CONDITIONALLY_COMPLIANT").map((record) => record.decision_id)),
    escalation_refs: freezeArray(source.conflict_visualization.blocker_views.flatMap((blocker) => blocker.escalation_path)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref, source.conflict_visualization.replay_hash]),
    certification_refs: scenario === "MISSING_CERTIFICATION_DEPENDENCIES" ? freezeArray([]) : freezeArray([c.certification_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildConstitutionalDashboard(source: PriorityRiskDashboardResult, records: readonly GovernanceStatusRecord[], scenario: Scenario): ConstitutionalDashboard {
  const c = ctx(source);
  const violations = records.filter((record) => record.constitutional_state === "CONSTITUTIONAL_VIOLATION");
  const base: Omit<ConstitutionalDashboard, "integrity_hash"> = {
    constitutional_dashboard_id: "constitutional_visibility_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    constitutional_state: scenario === "OMIT_CONSTITUTIONAL_VIOLATIONS" ? "FULLY_COMPLIANT" : violations.length ? "CONSTITUTIONAL_VIOLATION" : "CONDITIONAL_REVIEW",
    constitutional_rules: scenario === "OMIT_CONSTITUTIONAL_VIOLATIONS" ? freezeArray([]) : freezeArray(["operator_supremacy", "tenant_isolation", "fail_closed_governance", "immutable_lineage"]),
    violation_refs: scenario === "OMIT_CONSTITUTIONAL_VIOLATIONS" ? freezeArray([]) : freezeArray(violations.map((record) => `constitutional_violation_${record.decision_id}`)),
    operator_requirements: freezeArray(records.filter((record) => record.constitutional_state === "OPERATOR_APPROVAL_REQUIRED").map((record) => record.decision_id)),
    governance_requirements: freezeArray(records.filter((record) => record.constitutional_state === "GOVERNANCE_APPROVAL_REQUIRED" || record.constitutional_state === "CONSTITUTIONAL_VIOLATION").map((record) => record.decision_id)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAuthorityDashboard(source: PriorityRiskDashboardResult, records: readonly GovernanceStatusRecord[], scenario: Scenario): AuthorityDashboard {
  const c = ctx(source);
  const conflicts = source.conflict_visualization.conflicts.filter((conflict) => conflict.conflict_type === "AUTHORITY_CONFLICT");
  const base: Omit<AuthorityDashboard, "integrity_hash"> = {
    authority_dashboard_id: "authority_visibility_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    authority_level: scenario === "BAD_AUTHORITY_ASSIGNMENTS" ? "OPERATOR" : "GOVERNANCE_BOARD",
    assigned_authority: scenario === "BAD_AUTHORITY_ASSIGNMENTS" ? freezeArray(["operator_only"]) : freezeArray(["operator_owner", "mission_lead", "governance_board"]),
    delegation_chain: scenario === "BAD_AUTHORITY_ASSIGNMENTS" ? freezeArray([]) : freezeArray(["operator_owner", "mission_lead", "governance_board", "constitutional_authority"]),
    approval_requirements: freezeArray(records.filter((record) => record.approval_state !== "APPROVED").map((record) => `approval_required_${record.decision_id}`)),
    authority_conflicts: scenario === "BAD_AUTHORITY_ASSIGNMENTS" ? freezeArray([]) : freezeArray(conflicts.map((conflict) => conflict.conflict_id)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildApprovalWorkflow(source: PriorityRiskDashboardResult, records: readonly GovernanceStatusRecord[], scenario: Scenario): ApprovalWorkflow {
  const c = ctx(source);
  const pending = records.filter((record) => record.approval_state === "GOVERNANCE_REVIEW").map((record) => `pending_${record.decision_id}`);
  const base: Omit<ApprovalWorkflow, "integrity_hash"> = {
    workflow_id: "governance_authority_approval_workflow",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    approval_stage: scenario === "INCOMPLETE_APPROVAL_WORKFLOW" ? "APPROVAL_REQUESTED" : "GOVERNANCE_REVIEW",
    approval_chain: scenario === "INCOMPLETE_APPROVAL_WORKFLOW" ? freezeArray(["operator_owner"]) : freezeArray(["operator_owner", "authority_verified", "governance_review", "operator_review", "decision_archival"]),
    pending_approvals: scenario === "INCOMPLETE_APPROVAL_WORKFLOW" ? freezeArray([]) : freezeArray(pending),
    completed_approvals: freezeArray(records.filter((record) => record.approval_state === "APPROVED").map((record) => `completed_${record.decision_id}`)),
    rejected_approvals: freezeArray(records.filter((record) => record.approval_state === "REJECTED").map((record) => `rejected_${record.decision_id}`)),
    delegated_approvals: freezeArray(["delegated_governance_board_review"]),
    expired_approvals: freezeArray([]),
    escalation_refs: scenario === "INCOMPLETE_APPROVAL_WORKFLOW" ? freezeArray([]) : freezeArray(source.conflict_visualization.blocker_views.flatMap((blocker) => blocker.escalation_path)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRestrictions(source: PriorityRiskDashboardResult, scenario: Scenario): readonly RestrictionView[] {
  const c = ctx(source);
  if (scenario === "HIDE_RESTRICTIONS") return freezeArray([]);
  const restricted = c.registry.filter((record) => record.governance_state !== "COMPLIANT" || record.authority_state !== "AUTHORIZED" || record.constitutional_state !== "COMPLIANT" || record.certification_state !== "PASS" || record.dependency_chain.length);
  return freezeArray(restricted.map((record) => {
    const type = restrictionType(record);
    const base: Omit<RestrictionView, "integrity_hash"> = {
      restriction_view_id: `restriction_${record.decision_id}_${type.toLowerCase()}`,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      restriction_type: type,
      restriction_state: record.lifecycle_state === "ESCALATED" ? "ESCALATED" : record.lifecycle_state === "BLOCKED" ? "ACTIVE" : "PENDING_REVIEW",
      severity: restrictionSeverity(record),
      policy_refs: scenario === "BAD_GOVERNANCE_LINEAGE" ? freezeArray([]) : freezeArray([`policy_${type.toLowerCase()}`, `governance_${record.governance_state.toLowerCase()}`]),
      decision_refs: freezeArray([record.decision_id]),
      resolution_requirements: freezeArray([record.recovery_recommendation ?? "operator review required"]),
      escalation_path: freezeArray(source.conflict_visualization.blocker_views.find((blocker) => blocker.blocked_decision_ref === record.decision_id)?.escalation_path ?? ["operator_owner", "governance_board"]),
      approval_requirements: freezeArray(record.authority_state === "AUTHORIZED" ? [] : [`approval_${record.authority_state.toLowerCase()}`]),
      replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([record.replay_ref, c.replay_ref]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }).sort((a, b) => b.severity.localeCompare(a.severity) || a.restriction_type.localeCompare(b.restriction_type) || a.restriction_view_id.localeCompare(b.restriction_view_id)));
}

function buildLedger(source: PriorityRiskDashboardResult, records: readonly GovernanceStatusRecord[], restrictions: readonly RestrictionView[], scenario: Scenario): readonly GovernanceVisibilityLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<GovernanceVisibilityLedgerEntry, "integrity_hash">[] = [
    {
      governance_ledger_id: "governance_visibility_ledger_001",
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      event_type: "GOVERNANCE_REVIEW_INITIATED",
      governance_state: "UNDER_REVIEW",
      constitutional_state: "CONDITIONAL_REVIEW",
      authority_state: "MISSION_LEAD",
      approval_state: "APPROVAL_REQUESTED",
      restriction_state: "PENDING_REVIEW",
      replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
      certification_refs: scenario === "MISSING_CERTIFICATION_DEPENDENCIES" ? freezeArray([]) : freezeArray([c.certification_ref]),
      event_timestamp: "2026-07-05T09:11:06.000Z",
      sequence_number: 1,
      append_only: true,
      deleted: false,
    },
    {
      governance_ledger_id: "governance_visibility_ledger_002",
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      event_type: records.some((record) => record.constitutional_state === "CONSTITUTIONAL_VIOLATION") ? "CONSTITUTIONAL_ESCALATION" : "CONSTITUTIONAL_VALIDATION",
      governance_state: "CONDITIONALLY_COMPLIANT",
      constitutional_state: records.some((record) => record.constitutional_state === "CONSTITUTIONAL_VIOLATION") ? "CONSTITUTIONAL_VIOLATION" : "CONDITIONAL_REVIEW",
      authority_state: "GOVERNANCE_BOARD",
      approval_state: "GOVERNANCE_REVIEW",
      restriction_state: restrictions.some((restriction) => restriction.restriction_state === "ACTIVE") ? "ACTIVE" : "PENDING_REVIEW",
      replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref, source.conflict_visualization.replay_hash]),
      certification_refs: scenario === "MISSING_CERTIFICATION_DEPENDENCIES" ? freezeArray([]) : freezeArray([c.certification_ref]),
      event_timestamp: "2026-07-05T09:11:07.000Z",
      sequence_number: 2,
      append_only: true,
      deleted: false,
    },
    {
      governance_ledger_id: "governance_visibility_ledger_003",
      tenant_id: c.tenant_id,
      mission_id: c.mission_id,
      event_type: "RESTRICTION_APPLIED",
      governance_state: "CONDITIONALLY_COMPLIANT",
      constitutional_state: "CONDITIONAL_REVIEW",
      authority_state: "GOVERNANCE_BOARD",
      approval_state: "GOVERNANCE_REVIEW",
      restriction_state: restrictions.length ? "ACTIVE" : "RESOLVED",
      replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
      certification_refs: scenario === "MISSING_CERTIFICATION_DEPENDENCIES" ? freezeArray([]) : freezeArray([c.certification_ref]),
      event_timestamp: "2026-07-05T09:11:08.000Z",
      sequence_number: 3,
      append_only: true,
      deleted: false,
    },
  ];
  if (scenario === "BAD_GOVERNANCE_LINEAGE") events.pop();
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildVisibilityRecord(source: PriorityRiskDashboardResult, governance: GovernanceDashboard, constitutional: ConstitutionalDashboard, authority: AuthorityDashboard, workflow: ApprovalWorkflow, restrictions: readonly RestrictionView[], ledger: readonly GovernanceVisibilityLedgerEntry[], records: readonly GovernanceStatusRecord[], scenario: Scenario): GovernanceVisibilityRecord {
  const c = ctx(source);
  const base: Omit<GovernanceVisibilityRecord, "integrity_hash"> = {
    visibility_id: "governance_authority_visibility_record",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    governance_dashboard_ref: governance.governance_dashboard_id,
    constitutional_dashboard_ref: constitutional.constitutional_dashboard_id,
    authority_dashboard_ref: authority.authority_dashboard_id,
    approval_workflow_ref: workflow.workflow_id,
    restriction_view_refs: freezeArray(restrictions.map((restriction) => restriction.restriction_view_id)),
    governance_ledger_refs: freezeArray(ledger.map((entry) => entry.governance_ledger_id)),
    status_record_refs: freezeArray(records.map((record) => record.governance_status_id)),
    replay_ref: scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref,
    certification_ref: scenario === "MISSING_CERTIFICATION_DEPENDENCIES" ? "" : c.certification_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: PriorityRiskDashboardResult;
  records: readonly GovernanceStatusRecord[];
  governance: GovernanceDashboard;
  constitutional: ConstitutionalDashboard;
  authority: AuthorityDashboard;
  workflow: ApprovalWorkflow;
  restrictions: readonly RestrictionView[];
  ledger: readonly GovernanceVisibilityLedgerEntry[];
  visibility: GovernanceVisibilityRecord;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly GovernanceAuthorityVisibilityFailure[] {
  const failures: GovernanceAuthorityVisibilityFailure[] = [];
  const c = ctx(input.source);
  const expectedOrder = buildStatusRecords(input.source, "BASELINE").map((record) => record.decision_id).join("|");
  if (input.governance.governance_state === "NOT_EVALUATED" || !input.governance.governance_reviews.length) failures.push("GOVERNANCE_STATUS_HIDDEN");
  if (!input.constitutional.constitutional_rules.length || (!input.constitutional.operator_requirements.length && !input.constitutional.governance_requirements.length) || (input.scenario === "OMIT_CONSTITUTIONAL_VIOLATIONS" && !input.constitutional.violation_refs.length)) failures.push("CONSTITUTIONAL_VIOLATIONS_OMITTED");
  if (input.authority.authority_level !== "GOVERNANCE_BOARD" || !input.authority.delegation_chain.length || !input.authority.authority_conflicts.length) failures.push("AUTHORITY_ASSIGNMENTS_INACCURATE");
  if (input.workflow.approval_chain.length < 5 || !input.workflow.pending_approvals.length || !input.workflow.escalation_refs.length) failures.push("APPROVAL_WORKFLOWS_INCOMPLETE");
  if (!input.restrictions.length) failures.push("OPERATIONAL_RESTRICTIONS_HIDDEN");
  if (!input.governance.policy_results.length || input.records.some((record) => !record.policy_refs.length) || input.ledger.length < 3 || input.restrictions.some((restriction) => !restriction.policy_refs.length)) failures.push("GOVERNANCE_LINEAGE_INCONSISTENT");
  if (!input.visibility.replay_ref || !input.governance.replay_refs.length || !input.constitutional.replay_refs.length || !input.authority.replay_refs.length || !input.workflow.replay_refs.length || input.records.some((record) => !record.replay_refs.length) || input.restrictions.some((restriction) => !restriction.replay_refs.length) || input.ledger.some((entry) => !entry.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.visibility.certification_ref || !input.governance.certification_refs.length || input.ledger.some((entry) => !entry.certification_refs.length)) failures.push("CERTIFICATION_DEPENDENCIES_ABSENT");
  if (input.scenario === "NONDETERMINISTIC_RENDERING" || input.records.map((record) => record.decision_id).join("|") !== expectedOrder) failures.push("DASHBOARD_RENDERING_NONDETERMINISTIC");
  if (input.records.some((record) => record.tenant_id !== c.tenant_id) || input.restrictions.some((restriction) => restriction.tenant_id !== c.tenant_id)) failures.push("CROSS_TENANT_GOVERNANCE_VISIBLE");
  if (
    input.records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
    || hashWithoutIntegrity(input.governance) !== input.governance.integrity_hash
    || hashWithoutIntegrity(input.constitutional) !== input.constitutional.integrity_hash
    || hashWithoutIntegrity(input.authority) !== input.authority.integrity_hash
    || hashWithoutIntegrity(input.workflow) !== input.workflow.integrity_hash
    || input.restrictions.some((restriction) => hashWithoutIntegrity(restriction) !== restriction.integrity_hash)
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || hashWithoutIntegrity(input.visibility) !== input.visibility.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("GOVERNANCE_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.source.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly GovernanceAuthorityVisibilityFailure[]): GovernanceAuthorityVisibilityValidation {
  const has = (failure: GovernanceAuthorityVisibilityFailure) => failures.includes(failure);
  const base: Omit<GovernanceAuthorityVisibilityValidation, "integrity_hash"> = {
    validation_id: "governance_authority_visibility_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    governance_status_visible: !has("GOVERNANCE_STATUS_HIDDEN"),
    constitutional_violations_visible: !has("CONSTITUTIONAL_VIOLATIONS_OMITTED"),
    authority_assignments_accurate: !has("AUTHORITY_ASSIGNMENTS_INACCURATE"),
    approval_workflows_complete: !has("APPROVAL_WORKFLOWS_INCOMPLETE"),
    operational_restrictions_visible: !has("OPERATIONAL_RESTRICTIONS_HIDDEN"),
    governance_lineage_consistent: !has("GOVERNANCE_LINEAGE_INCONSISTENT"),
    replay_refs_present: !has("REPLAY_REFERENCES_MISSING") && !has("GOVERNANCE_REPLAY_RECONSTRUCTION_FAILED"),
    certification_dependencies_present: !has("CERTIFICATION_DEPENDENCIES_ABSENT"),
    deterministic_rendering: !has("DASHBOARD_RENDERING_NONDETERMINISTIC"),
    tenant_isolated: !has("CROSS_TENANT_GOVERNANCE_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceAuthorityVisibilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance: result.governance_dashboard,
    constitutional: result.constitutional_dashboard,
    authority: result.authority_dashboard,
    workflow: result.approval_workflow,
    restrictions: result.restriction_views,
    ledger: result.governance_ledger,
    records: result.status_records,
    visibility: result.visibility_record,
    validation: result.validation,
  });
}

export function runGovernanceAuthorityVisibility(input: GovernanceAuthorityVisibilityInput = {}): GovernanceAuthorityVisibilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const priority_dashboard = input.priority_dashboard ?? runPriorityRiskDashboard();
  const status_records = buildStatusRecords(priority_dashboard, scenario);
  const governance_dashboard = buildGovernanceDashboard(priority_dashboard, status_records, scenario);
  const constitutional_dashboard = buildConstitutionalDashboard(priority_dashboard, status_records, scenario);
  const authority_dashboard = buildAuthorityDashboard(priority_dashboard, status_records, scenario);
  const approval_workflow = buildApprovalWorkflow(priority_dashboard, status_records, scenario);
  const restriction_views = buildRestrictions(priority_dashboard, scenario);
  const governance_ledger = buildLedger(priority_dashboard, status_records, restriction_views, scenario);
  const visibility_record = buildVisibilityRecord(priority_dashboard, governance_dashboard, constitutional_dashboard, authority_dashboard, approval_workflow, restriction_views, governance_ledger, status_records, scenario);
  const failures = collectFailures({ source: priority_dashboard, records: status_records, governance: governance_dashboard, constitutional: constitutional_dashboard, authority: authority_dashboard, workflow: approval_workflow, restrictions: restriction_views, ledger: governance_ledger, visibility: visibility_record, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<GovernanceAuthorityVisibilityResult, "integrity_hash" | "replay_hash"> = {
    visibility_version: VISIBILITY_VERSION,
    priority_dashboard,
    governance_dashboard,
    constitutional_dashboard,
    authority_dashboard,
    approval_workflow,
    restriction_views,
    governance_ledger,
    status_records,
    visibility_record,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_governance_or_authority: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayGovernanceAuthorityVisibility(result: GovernanceAuthorityVisibilityResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeGovernanceStatusRecordHash(record: Omit<GovernanceStatusRecord, "integrity_hash"> | GovernanceStatusRecord): string {
  return hashWithoutIntegrity(record);
}

export function getGovernanceAuthorityVisibilityFoundation(): GovernanceAuthorityVisibilityFoundation {
  return Object.freeze({
    visibility_version: VISIBILITY_VERSION,
    governance_states: GOVERNANCE_VISIBILITY_STATES,
    constitutional_states: CONSTITUTIONAL_VISIBILITY_STATES,
    authority_levels: AUTHORITY_VISIBILITY_LEVELS,
    approval_stages: APPROVAL_WORKFLOW_STAGES,
    restriction_types: RESTRICTION_TYPES,
    result: runGovernanceAuthorityVisibility(),
  });
}

export const GovernanceAuthorityVisibility = Object.freeze({
  run: runGovernanceAuthorityVisibility,
  replay: replayGovernanceAuthorityVisibility,
});
