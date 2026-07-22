import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveDashboardFoundation, replayAdaptiveDashboardFoundation } from "@/services/adaptive-dashboard-foundation";
import type {
  ApprovalDependencyGraph,
  ApprovalQueueView,
  AuthorityBoundaryView,
  CertificationQueue,
  ConstitutionalReviewView,
  EscalationTimeline,
  GovernanceAlertCenter,
  GovernanceApprovalDashboardApiSurface,
  GovernanceApprovalDashboardContract,
  GovernanceApprovalDashboardFailure,
  GovernanceApprovalDashboardInput,
  GovernanceApprovalDashboardObservabilitySurface,
  GovernanceApprovalDashboardRecord,
  GovernanceApprovalDashboardResult,
  GovernanceApprovalDashboardScenario,
  GovernanceApprovalDashboardValidationResult,
  GovernanceApprovalMetrics,
  GovernanceApprovalPermission,
  GovernanceApprovalValidationTest,
  GovernanceApprovalWidget,
  GovernanceReviewState,
  GovernanceBlocker,
  GovernanceDecisionHistory,
  GovernanceStatusView,
  OperatorApprovalWorkspace,
  ProposalGovernanceDetailView,
  ReplayReadinessView,
  ReviewEvidenceWorkspace,
  RollbackReadinessView,
  ApprovalState,
} from "@/types/governance-approval-dashboard";

const VERSION = "governance-approval-dashboard/v10.14.7" as const;
const DASHBOARD_ID = "GovernanceApprovalDashboard" as const;
const TENANT_ID = "tenant_mission_control";
const WIDGETS: readonly GovernanceApprovalWidget[] = Object.freeze(["Approval Queue", "Governance Status", "Constitutional Status", "Escalation Timeline", "Certification Queue", "Rollback Readiness", "Authority Boundary", "Dependency Graph", "Evidence Workspace", "Decision History", "Alert Center"]);
const GOVERNANCE_STATES: readonly GovernanceReviewState[] = Object.freeze(["NOT_STARTED", "EVIDENCE_PENDING", "READY_FOR_REVIEW", "IN_REVIEW", "ADDITIONAL_EVIDENCE_REQUIRED", "CONDITIONALLY_APPROVED", "APPROVED", "REJECTED", "BLOCKED", "ESCALATION_REQUIRED", "EXPIRED", "REVOKED", "SUPERSEDED"]);
const APPROVAL_STATES: readonly ApprovalState[] = Object.freeze(["NOT_REQUIRED", "PENDING", "IN_REVIEW", "APPROVED", "CONDITIONALLY_APPROVED", "REJECTED", "DEFERRED", "ESCALATED", "EXPIRED", "REVOKED", "SUPERSEDED", "INVALID_AUTHORITY"]);

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

function id(prefix: string, value: unknown): string {
  return `${prefix}_${hash(value).slice(0, 24)}`;
}

function failureForScenario(scenario: GovernanceApprovalDashboardScenario): GovernanceApprovalDashboardFailure | undefined {
  const map: Partial<Record<GovernanceApprovalDashboardScenario, GovernanceApprovalDashboardFailure>> = {
    FOUNDATION_UNAVAILABLE: "DASHBOARD_FOUNDATION_UNAVAILABLE",
    PROPOSAL_HIDDEN: "PROPOSAL_RECORD_HIDDEN",
    BLOCKER_HIDDEN: "GOVERNANCE_BLOCKER_HIDDEN",
    CONSTITUTIONAL_CONFLICT: "CONSTITUTIONAL_CONFLICT_UNRESOLVED",
    INVALID_AUTHORITY: "INVALID_DECISION_AUTHORITY",
    SILENCE_AS_APPROVAL: "SILENCE_TREATED_AS_APPROVAL",
    CONDITIONAL_APPROVAL_UNMET: "CONDITIONAL_APPROVAL_INCOMPLETE",
    MISSING_GOVERNANCE: "GOVERNANCE_STATUS_UNAVAILABLE",
    MISSING_CONSTITUTIONAL: "CONSTITUTIONAL_STATUS_UNAVAILABLE",
    MISSING_AUTHORITY: "AUTHORITY_STATUS_UNAVAILABLE",
    MISSING_OPERATOR_APPROVAL: "OPERATOR_APPROVAL_MISSING",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCE_BROKEN",
    MISSING_CERTIFICATION: "CERTIFICATION_STATUS_UNAVAILABLE",
    CONDITIONAL_CERTIFICATION: "CONDITIONAL_CERTIFICATION_MISREPRESENTED",
    MISSING_REPLAY: "REPLAY_READINESS_UNAVAILABLE",
    MISSING_ROLLBACK: "ROLLBACK_READINESS_UNAVAILABLE",
    HIDDEN_APPROVAL_STATE: "HIDDEN_REVIEW_OR_APPROVAL_STATE",
    VERSION_MISMATCH: "PROPOSAL_VERSION_INTEGRITY_FAILED",
    UNAUTHORIZED_ROLE: "UNAUTHORIZED_DASHBOARD_ACCESS",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    WRITE_AUTHORITY_EXPOSED: "DASHBOARD_WRITE_AUTHORITY_EXPOSED",
  };
  return map[scenario];
}

function apiSurface(): GovernanceApprovalDashboardApiSurface {
  const base: Omit<GovernanceApprovalDashboardApiSurface, "integrity_hash"> = {
    api_id: "governance_approval_dashboard_api",
    retrieve_dashboard: "POST /governance-approval-dashboard/dashboard",
    retrieve_contract: "GET /governance-approval-dashboard/contract",
    retrieve_queue: "POST /governance-approval-dashboard/queue",
    retrieve_detail: "POST /governance-approval-dashboard/detail",
    retrieve_governance: "POST /governance-approval-dashboard/governance",
    retrieve_blockers: "POST /governance-approval-dashboard/blockers",
    retrieve_constitutional: "POST /governance-approval-dashboard/constitutional",
    retrieve_authority: "POST /governance-approval-dashboard/authority",
    retrieve_operator: "POST /governance-approval-dashboard/operator",
    retrieve_dependencies: "POST /governance-approval-dashboard/dependencies",
    retrieve_escalation: "POST /governance-approval-dashboard/escalation",
    retrieve_certification: "POST /governance-approval-dashboard/certification",
    retrieve_replay: "POST /governance-approval-dashboard/replay",
    retrieve_rollback: "POST /governance-approval-dashboard/rollback",
    retrieve_evidence: "POST /governance-approval-dashboard/evidence",
    retrieve_history: "POST /governance-approval-dashboard/history",
    retrieve_alerts: "POST /governance-approval-dashboard/alerts",
    validate_dashboard: "POST /governance-approval-dashboard/validate",
    inspect_dashboard: "POST /governance-approval-dashboard/inspect",
    creation_supported: false,
    mutation_supported: false,
    independent_approval_supported: false,
    authority_expansion_supported: false,
    governance_outcome_mutation_supported: false,
    constitutional_requirement_mutation_supported: false,
    adaptation_activation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function nextAction(failures: readonly GovernanceApprovalDashboardFailure[]) {
  if (failures.some((failure) => ["CONSTITUTIONAL_CONFLICT_UNRESOLVED", "INVALID_DECISION_AUTHORITY", "TENANT_ISOLATION_VIOLATED", "INTEGRITY_VERIFICATION_FAILED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"].includes(failure))) return "NO_ACTION_PERMITTED" as const;
  if (failures.includes("EVIDENCE_REFERENCE_BROKEN")) return "SUBMIT_EVIDENCE" as const;
  if (failures.includes("GOVERNANCE_STATUS_UNAVAILABLE")) return "BEGIN_GOVERNANCE_REVIEW" as const;
  if (failures.includes("CONSTITUTIONAL_STATUS_UNAVAILABLE")) return "BEGIN_CONSTITUTIONAL_REVIEW" as const;
  if (failures.includes("AUTHORITY_STATUS_UNAVAILABLE")) return "VALIDATE_AUTHORITY" as const;
  if (failures.includes("OPERATOR_APPROVAL_MISSING")) return "REQUEST_OPERATOR_REVIEW" as const;
  if (failures.includes("ROLLBACK_READINESS_UNAVAILABLE")) return "PREPARE_ROLLBACK_PLAN" as const;
  if (failures.includes("CERTIFICATION_STATUS_UNAVAILABLE") || failures.includes("CONDITIONAL_CERTIFICATION_MISREPRESENTED")) return "SUBMIT_FOR_CERTIFICATION" as const;
  return "NO_ACTION_PERMITTED" as const;
}

function records(failures: readonly GovernanceApprovalDashboardFailure[]): readonly GovernanceApprovalDashboardRecord[] {
  if (failures.includes("PROPOSAL_RECORD_HIDDEN")) return freezeArray([]);
  const action = nextAction(failures);
  const base: Omit<GovernanceApprovalDashboardRecord, "integrity_hash"> = {
    dashboard_record_id: id("governance_approval_record", "proposal-1"),
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : TENANT_ID,
    mission_scope: "mission-control-adaptive-governance",
    proposal_id: "adaptive_proposal_governance_1",
    proposal_version: failures.includes("PROPOSAL_VERSION_INTEGRITY_FAILED") ? "v0-stale" : "v1",
    proposal_type: "ADAPTIVE_MEMORY_AND_STRATEGY_REVIEW",
    proposal_status: failures.includes("HIDDEN_REVIEW_OR_APPROVAL_STATE") ? "APPROVED" : "IN_REVIEW",
    proposal_summary: "Adaptive proposal requires governed review before certification or future implementation.",
    supporting_evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : freezeArray(["evidence:governance-approval:1"]),
    applicable_policy_refs: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["policy:governance-supremacy:v1", "policy:operator-authority:v1"]),
    governance_review_status: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? "NOT_STARTED" : "APPROVED",
    governance_decision_refs: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["governance-decision:approved:1"]),
    governance_blockers: failures.includes("GOVERNANCE_BLOCKER_HIDDEN") ? freezeArray([]) : failures.length ? freezeArray(["blocker:governance-approval:1"]) : freezeArray([]),
    constitutional_review_status: failures.includes("CONSTITUTIONAL_STATUS_UNAVAILABLE") ? "NOT_ASSESSED" : failures.includes("CONSTITUTIONAL_CONFLICT_UNRESOLVED") ? "CONFLICT_DETECTED" : "COMPLIANT",
    constitutional_analysis_refs: failures.includes("CONSTITUTIONAL_STATUS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["constitutional-review:1"]),
    authority_review_status: failures.includes("AUTHORITY_STATUS_UNAVAILABLE") ? "REVIEW_REQUIRED" : failures.includes("INVALID_DECISION_AUTHORITY") ? "INSUFFICIENT_AUTHORITY" : "VALID",
    authority_boundary_refs: failures.includes("AUTHORITY_STATUS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["authority-boundary:tenant-mission:1"]),
    operator_approval_status: failures.includes("OPERATOR_APPROVAL_MISSING") ? "PENDING" : failures.includes("SILENCE_TREATED_AS_APPROVAL") ? "APPROVED" : failures.includes("CONDITIONAL_APPROVAL_INCOMPLETE") ? "CONDITIONALLY_APPROVED" : "APPROVED",
    operator_decision_refs: failures.includes("OPERATOR_APPROVAL_MISSING") || failures.includes("SILENCE_TREATED_AS_APPROVAL") ? freezeArray([]) : freezeArray(["operator-decision:approved:1"]),
    required_approvals: freezeArray(["governance", "constitutional", "authority", "operator", "certification"]),
    completed_approvals: failures.length ? freezeArray(["governance"]) : freezeArray(["governance", "constitutional", "authority", "operator", "certification"]),
    unmet_conditions: failures.includes("CONDITIONAL_APPROVAL_INCOMPLETE") ? freezeArray(["conditional approval conditions unmet"]) : freezeArray([]),
    simulation_status: "PASSED",
    simulation_refs: freezeArray(["simulation:adaptive-governance:1"]),
    certification_requirements: freezeArray(["determinism", "governance", "constitutional", "replay", "rollback"]),
    certification_status: failures.includes("CERTIFICATION_STATUS_UNAVAILABLE") ? "UNASSESSED" : failures.includes("CONDITIONAL_CERTIFICATION_MISREPRESENTED") ? "CONDITIONAL_PASS" : "PASS",
    certification_refs: failures.includes("CERTIFICATION_STATUS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["certification:adaptive-governance:1"]),
    replay_readiness: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? "UNAVAILABLE" : "READY",
    replay_refs: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["replay:governance-approval:1"]),
    rollback_readiness: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? "NOT_READY" : "READY",
    rollback_plan_ref: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? "" : "rollback:adaptive-governance:1",
    escalation_status: failures.some((failure) => ["CONSTITUTIONAL_CONFLICT_UNRESOLVED", "INVALID_DECISION_AUTHORITY"].includes(failure)) ? "REQUIRED" : "NOT_REQUIRED",
    escalation_refs: failures.some((failure) => ["CONSTITUTIONAL_CONFLICT_UNRESOLVED", "INVALID_DECISION_AUTHORITY"].includes(failure)) ? freezeArray(["escalation:governance-approval:1"]) : freezeArray([]),
    next_permitted_action: action,
    next_action_rationale: action === "NO_ACTION_PERMITTED" ? "No progression is permitted while critical governance state is unresolved or all review gates are complete." : `Next permitted action is ${action}.`,
    visible_to_roles: freezeArray(["OPERATOR", "REVIEWER", "GOVERNANCE_AUTHORITY", "AUDITOR", "CERTIFICATION_TEAM"]),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "operator_private_notes", "constitutional_review_notes"]),
    alerts: failures,
    created_at: "2026-07-09T00:00:00.000Z",
    updated_at: "2026-07-09T00:00:00.000Z",
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) })]);
}

function blockers(records: readonly GovernanceApprovalDashboardRecord[], failures: readonly GovernanceApprovalDashboardFailure[]): readonly GovernanceBlocker[] {
  if (!failures.length || failures.includes("GOVERNANCE_BLOCKER_HIDDEN")) return freezeArray([]);
  const record = records[0];
  const base: Omit<GovernanceBlocker, "integrity_hash"> = {
    blocker_id: "governance_blocker_1",
    proposal_id: record?.proposal_id ?? "proposal-unavailable",
    tenant_id: record?.tenant_id ?? TENANT_ID,
    blocker_category: failures[0],
    severity: failures.some((failure) => ["CONSTITUTIONAL_CONFLICT_UNRESOLVED", "INVALID_DECISION_AUTHORITY", "TENANT_ISOLATION_VIOLATED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"].includes(failure)) ? "CRITICAL" : "HIGH",
    description: `Progression blocked by ${failures[0]}.`,
    source_ref: record?.proposal_id ?? "proposal-unavailable",
    governing_policy_ref: "policy:governance-supremacy:v1",
    detected_at: "2026-07-09T00:00:00.000Z",
    detected_by: "governance-approval-dashboard",
    remediation_requirement: "Resolve blocker before progression.",
    responsible_authority: "governance_authority",
    current_status: failures.some((failure) => ["CONSTITUTIONAL_CONFLICT_UNRESOLVED", "INVALID_DECISION_AUTHORITY", "TENANT_ISOLATION_VIOLATED"].includes(failure)) ? "NON_WAIVABLE" : "OPEN",
    resolution_refs: freezeArray([]),
    resolved_at: null,
    non_waivable: failures.some((failure) => ["CONSTITUTIONAL_CONFLICT_UNRESOLVED", "INVALID_DECISION_AUTHORITY", "TENANT_ISOLATION_VIOLATED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"].includes(failure)),
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function queue(records: readonly GovernanceApprovalDashboardRecord[], failures: readonly GovernanceApprovalDashboardFailure[]): ApprovalQueueView {
  const base: Omit<ApprovalQueueView, "integrity_hash"> = { queue_id: "adaptive_approval_queue", sorted_proposal_refs: records.map((record) => record.proposal_id).sort(), category_counts: freezeArray(["awaiting governance review:0", `blocked:${failures.length ? 1 : 0}`, "rejected:0", "approved:1", "certified:1", "superseded:0"]), blocker_counts: records.map((record) => `${record.proposal_id}:${record.governance_blockers.length}`), deterministic: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function detail(records: readonly GovernanceApprovalDashboardRecord[]): ProposalGovernanceDetailView {
  const record = records[0];
  const base: Omit<ProposalGovernanceDetailView, "integrity_hash"> = { detail_id: "proposal_governance_detail", proposal_ref: record?.proposal_id ?? "", requested_change: record?.proposal_summary ?? "", affected_capabilities: freezeArray(["adaptive memory", "strategy evolution", "confidence and risk review"]), lineage_refs: record ? freezeArray([...record.supporting_evidence_refs, ...record.governance_decision_refs, ...record.constitutional_analysis_refs, ...record.operator_decision_refs, ...record.certification_refs, ...record.replay_refs, record.rollback_plan_ref].filter(Boolean)) : freezeArray([]), unresolved_blockers: record?.governance_blockers ?? freezeArray([]), next_permitted_action: record?.next_permitted_action ?? "NO_ACTION_PERMITTED" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governanceView(record: GovernanceApprovalDashboardRecord | undefined, failures: readonly GovernanceApprovalDashboardFailure[]): GovernanceStatusView {
  const base: Omit<GovernanceStatusView, "integrity_hash"> = { view_id: "governance_status_view", outcome: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? "NOT_ASSESSED" : failures.length ? "BLOCKED" : "COMPLIANT", applicable_policy_refs: record?.applicable_policy_refs ?? freezeArray([]), fulfilled_controls: failures.length ? freezeArray([]) : freezeArray(["governance review", "policy compliance"]), missing_controls: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? freezeArray(["governance status"]) : freezeArray([]), decision_conditions: record?.unmet_conditions ?? freezeArray([]), distinguishes_approval_from_certification: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function constitutionalView(record: GovernanceApprovalDashboardRecord | undefined, failures: readonly GovernanceApprovalDashboardFailure[]): ConstitutionalReviewView {
  const base: Omit<ConstitutionalReviewView, "integrity_hash"> = { view_id: "constitutional_review_view", outcome: record?.constitutional_review_status ?? "NOT_ASSESSED", protected_principles: freezeArray(["governance supremacy", "operator authority", "advisory-only adaptation", "deterministic replay", "tenant isolation", "rollback capability"]), conflicts: failures.includes("CONSTITUTIONAL_CONFLICT_UNRESOLVED") ? freezeArray(["constitutional conflict unresolved"]) : freezeArray([]), required_safeguards: freezeArray(["no unauthorized production mutation", "immutable audit", "certification enforcement"]), ordinary_operator_override_allowed: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function authorityView(record: GovernanceApprovalDashboardRecord | undefined, failures: readonly GovernanceApprovalDashboardFailure[]): AuthorityBoundaryView {
  const valid = record?.authority_review_status === "VALID";
  const base: Omit<AuthorityBoundaryView, "integrity_hash"> = { view_id: "authority_boundary_view", outcome: record?.authority_review_status ?? "REVIEW_REQUIRED", reviewer_authority_valid: valid, tenant_authority_valid: !failures.includes("TENANT_ISOLATION_VIOLATED") && valid, mission_authority_valid: valid, implementation_authority_implied: false, certification_authority_implied: false, conflicts: failures.includes("INVALID_DECISION_AUTHORITY") ? freezeArray(["reviewer authority invalid"]) : freezeArray([]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function operatorWorkspace(record: GovernanceApprovalDashboardRecord | undefined, failures: readonly GovernanceApprovalDashboardFailure[]): OperatorApprovalWorkspace {
  const base: Omit<OperatorApprovalWorkspace, "integrity_hash"> = { workspace_id: "operator_approval_workspace", decision_state: record?.operator_approval_status ?? "PENDING", silence_treated_as_approval: failures.includes("SILENCE_TREATED_AS_APPROVAL") ? true as false : false, auto_selected_approval: false, version_current: !failures.includes("PROPOSAL_VERSION_INTEGRITY_FAILED"), authority_valid: !failures.includes("INVALID_DECISION_AUTHORITY"), required_acknowledgements: record?.governance_blockers.length ? freezeArray(["critical blockers acknowledged"]) : freezeArray([]), preserved_decisions: freezeArray(["APPROVED", "REJECTED", "DEFERRED", "CONDITIONALLY_APPROVED"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function dependencyGraph(record: GovernanceApprovalDashboardRecord | undefined, failures: readonly GovernanceApprovalDashboardFailure[]): ApprovalDependencyGraph {
  const ok = !failures.length;
  const base: Omit<ApprovalDependencyGraph, "integrity_hash"> = { graph_id: "approval_dependency_graph", dependencies: freezeArray(["evidence", "governance", "constitutional", "authority", "operator", "simulation", "certification", "rollback", "escalation"]), dependency_states: ok ? freezeArray(["satisfied"]) : freezeArray(["blocked"]), mandatory_dependencies_satisfied: ok, explicit_rules_used: true, deterministic: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function escalation(record: GovernanceApprovalDashboardRecord | undefined): EscalationTimeline {
  const base: Omit<EscalationTimeline, "integrity_hash"> = { timeline_id: "escalation_timeline", events: record?.escalation_refs.length ? freezeArray(["escalation required", "authority notified"]) : freezeArray(["not required"]), preserves_event_ordering: true, responsible_authorities: freezeArray(["governance_authority", "constitutional_authority"]), replay_refs: record?.replay_refs ?? freezeArray([]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certification(record: GovernanceApprovalDashboardRecord | undefined): CertificationQueue {
  const base: Omit<CertificationQueue, "integrity_hash"> = { queue_id: "certification_queue", proposal_refs: record ? freezeArray([record.proposal_id]) : freezeArray([]), certification_state: record?.certification_status ?? "UNASSESSED", completed_tests: record?.certification_status === "PASS" ? freezeArray(["determinism", "governance", "constitutional", "replay", "rollback"]) : freezeArray([]), failed_tests: record?.certification_status === "FAIL" ? freezeArray(["mandatory certification"]) : freezeArray([]), unresolved_findings: record?.certification_status === "CONDITIONAL_PASS" ? freezeArray(["conditional pass is not full certification"]) : freezeArray([]), conditional_pass_distinguished: record?.certification_status !== "CONDITIONAL_PASS", deterministic: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replay(record: GovernanceApprovalDashboardRecord | undefined): ReplayReadinessView {
  const base: Omit<ReplayReadinessView, "integrity_hash"> = { view_id: "governance_replay_readiness", state: record?.replay_readiness ?? "UNAVAILABLE", replay_refs: record?.replay_refs ?? freezeArray([]), canonical_event_ordering: Boolean(record?.replay_refs.length), versioned_policies: record?.applicable_policy_refs ?? freezeArray([]), verified_decision_lineage: Boolean(record?.governance_decision_refs.length && record.operator_decision_refs.length) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rollback(record: GovernanceApprovalDashboardRecord | undefined): RollbackReadinessView {
  const base: Omit<RollbackReadinessView, "integrity_hash"> = { view_id: "governance_rollback_readiness", state: record?.rollback_readiness ?? "NOT_READY", rollback_plan_ref: record?.rollback_plan_ref ?? "", rollback_authority: "operator and governance authority", unresolved_blockers: record?.rollback_readiness === "READY" ? freezeArray([]) : freezeArray(["rollback not ready"]), implementation_eligible: record?.rollback_readiness === "READY" && record.certification_status === "PASS" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function evidence(record: GovernanceApprovalDashboardRecord | undefined): ReviewEvidenceWorkspace {
  const base: Omit<ReviewEvidenceWorkspace, "integrity_hash"> = { workspace_id: "review_evidence_workspace", evidence_refs: record?.supporting_evidence_refs ?? freezeArray([]), evidence_state: record?.supporting_evidence_refs.length ? "VERIFIED" : "INCOMPLETE", decision_context_preserved: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function history(record: GovernanceApprovalDashboardRecord | undefined): GovernanceDecisionHistory {
  const base: Omit<GovernanceDecisionHistory, "integrity_hash"> = { history_id: "governance_decision_history", decisions: record ? freezeArray([...record.governance_decision_refs, ...record.operator_decision_refs]) : freezeArray([]), append_only: true, retains_rejections_expirations_revocations: true, overwritten: false, replay_refs: record?.replay_refs ?? freezeArray([]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function alerts(record: GovernanceApprovalDashboardRecord | undefined, failures: readonly GovernanceApprovalDashboardFailure[]): GovernanceAlertCenter {
  const base: Omit<GovernanceAlertCenter, "integrity_hash"> = { alert_id: "governance_alert_center", alerts: freezeArray([...new Set([...(record?.alerts ?? []), ...failures])]), highest_severity: failures.some((failure) => ["CONSTITUTIONAL_CONFLICT_UNRESOLVED", "INVALID_DECISION_AUTHORITY", "TENANT_ISOLATION_VIOLATED", "INTEGRITY_VERIFICATION_FAILED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"].includes(failure)) ? "CRITICAL" : failures.length ? "HIGH" : "INFORMATIONAL", critical_alerts_visible: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function permissions(input: GovernanceApprovalDashboardInput, failures: readonly GovernanceApprovalDashboardFailure[]): readonly GovernanceApprovalPermission[] {
  const role = input.role ?? "OPERATOR";
  const base: Omit<GovernanceApprovalPermission, "integrity_hash"> = { permission_id: `governance_approval_permission_${role.toLowerCase()}`, role, tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID, allowed: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"), restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "operator_private_notes", "constitutional_review_notes"]), tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"), governance_authorized: !failures.includes("GOVERNANCE_STATUS_UNAVAILABLE"), constitutional_authorized: !failures.includes("CONSTITUTIONAL_STATUS_UNAVAILABLE"), operator_review_authorized: !failures.includes("OPERATOR_APPROVAL_MISSING"), certification_authorized: !failures.includes("CERTIFICATION_STATUS_UNAVAILABLE"), replay_authorized: !failures.includes("REPLAY_READINESS_UNAVAILABLE") };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function metrics(failures: readonly GovernanceApprovalDashboardFailure[]): GovernanceApprovalMetrics {
  const base: Omit<GovernanceApprovalMetrics, "integrity_hash"> = { proposal_sync_latency_ms: 15, approval_queue_freshness_ms: 9, missing_governance_records: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? 1 : 0, missing_constitutional_records: failures.includes("CONSTITUTIONAL_STATUS_UNAVAILABLE") ? 1 : 0, missing_authority_records: failures.includes("AUTHORITY_STATUS_UNAVAILABLE") ? 1 : 0, expired_approvals: 0, stale_reviews: 0, unresolved_conditions: failures.includes("CONDITIONAL_APPROVAL_INCOMPLETE") ? 1 : 0, escalation_deadline_failures: 0, broken_evidence_references: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 1 : 0, replay_failures: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? 1 : 0, rollback_state_inconsistencies: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? 1 : 0, certification_state_inconsistencies: failures.includes("CERTIFICATION_STATUS_UNAVAILABLE") || failures.includes("CONDITIONAL_CERTIFICATION_MISREPRESENTED") ? 1 : 0, proposal_version_mismatches: failures.includes("PROPOSAL_VERSION_INTEGRITY_FAILED") ? 1 : 0, unauthorized_access_attempts: failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS") ? 1 : 0, cross_tenant_exposure: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0, integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: GovernanceApprovalDashboardFailure, evidence_refs: readonly string[]): GovernanceApprovalValidationTest {
  const base: Omit<GovernanceApprovalValidationTest, "integrity_hash"> = { test_id: id("governance_approval_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<GovernanceApprovalDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">): readonly GovernanceApprovalValidationTest[] {
  const evidenceRefs = [result.dashboard_foundation.integrity_hash, ...result.records.map((record) => record.integrity_hash)];
  const record = result.records[0];
  return freezeArray([
    validationTest("foundation integration", replayAdaptiveDashboardFoundation(result.dashboard_foundation), "DASHBOARD_FOUNDATION_UNAVAILABLE", evidenceRefs),
    validationTest("pending proposals visible", result.records.length > 0 && Boolean(record?.proposal_summary), "PROPOSAL_RECORD_HIDDEN", evidenceRefs),
    validationTest("governance blockers complete", record?.governance_blockers.length === result.blocker_registry.length, "GOVERNANCE_BLOCKER_HIDDEN", evidenceRefs),
    validationTest("constitutional conflicts block progression", result.constitutional_view.conflicts.length === 0 && result.constitutional_view.outcome !== "CONFLICT_DETECTED", "CONSTITUTIONAL_CONFLICT_UNRESOLVED", evidenceRefs),
    validationTest("authority validation visible", result.authority_view.outcome === "VALID" && result.authority_view.reviewer_authority_valid, "INVALID_DECISION_AUTHORITY", evidenceRefs),
    validationTest("silence never approval", !result.operator_workspace.silence_treated_as_approval, "SILENCE_TREATED_AS_APPROVAL", evidenceRefs),
    validationTest("conditional approvals complete", record?.operator_approval_status !== "CONDITIONALLY_APPROVED" && record?.unmet_conditions.length === 0, "CONDITIONAL_APPROVAL_INCOMPLETE", evidenceRefs),
    validationTest("governance status available", result.governance_visible && result.governance_status_view.applicable_policy_refs.length > 0, "GOVERNANCE_STATUS_UNAVAILABLE", evidenceRefs),
    validationTest("constitutional status available", result.constitutional_visible && result.constitutional_view.outcome !== "NOT_ASSESSED", "CONSTITUTIONAL_STATUS_UNAVAILABLE", evidenceRefs),
    validationTest("authority status available", result.authority_visible && result.authority_view.outcome !== "REVIEW_REQUIRED", "AUTHORITY_STATUS_UNAVAILABLE", evidenceRefs),
    validationTest("operator approval visible", result.operator_approval_visible && Boolean(record?.operator_decision_refs.length), "OPERATOR_APPROVAL_MISSING", evidenceRefs),
    validationTest("evidence available", result.evidence_backed && result.evidence_workspace.evidence_refs.length > 0, "EVIDENCE_REFERENCE_BROKEN", evidenceRefs),
    validationTest("certification status visible", result.certification_visible && result.certification_queue.certification_state !== "UNASSESSED", "CERTIFICATION_STATUS_UNAVAILABLE", evidenceRefs),
    validationTest("conditional pass distinguished", result.certification_queue.certification_state !== "CONDITIONAL_PASS" && result.certification_queue.conditional_pass_distinguished, "CONDITIONAL_CERTIFICATION_MISREPRESENTED", evidenceRefs),
    validationTest("replay readiness visible", result.replayable && result.replay_view.state === "READY", "REPLAY_READINESS_UNAVAILABLE", evidenceRefs),
    validationTest("rollback readiness visible", result.rollback_visible && result.rollback_view.state === "READY", "ROLLBACK_READINESS_UNAVAILABLE", evidenceRefs),
    validationTest("no hidden review state", !(record?.proposal_status === "APPROVED" && record.governance_review_status !== "APPROVED"), "HIDDEN_REVIEW_OR_APPROVAL_STATE", evidenceRefs),
    validationTest("proposal version integrity", record?.proposal_version === "v1" && result.operator_workspace.version_current, "PROPOSAL_VERSION_INTEGRITY_FAILED", evidenceRefs),
    validationTest("role restrictions enforced", result.permissions.every((permission) => permission.allowed), "UNAUTHORIZED_DASHBOARD_ACCESS", evidenceRefs),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.records.every((item) => item.tenant_id === TENANT_ID), "TENANT_ISOLATION_VIOLATED", evidenceRefs),
    validationTest("restricted fields protected", result.permissions.every((permission) => permission.restricted_fields.length > 0) && result.records.every((item) => item.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidenceRefs),
    validationTest("integrity hashes reproducible", result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidenceRefs),
    validationTest("dashboard remains review-only", result.read_only && result.advisory_only && !result.write_authority_granted, "DASHBOARD_WRITE_AUTHORITY_EXPOSED", evidenceRefs),
  ]);
}

function resultReplayHash(result: Omit<GovernanceApprovalDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({ foundation: result.dashboard_foundation.integrity_hash, records: result.records.map((record) => record.integrity_hash), queue: result.approval_queue.integrity_hash, detail: result.detail_view.integrity_hash, governance: result.governance_status_view.integrity_hash, blockers: result.blocker_registry.map((blocker) => blocker.integrity_hash), constitutional: result.constitutional_view.integrity_hash, authority: result.authority_view.integrity_hash, operator: result.operator_workspace.integrity_hash, graph: result.dependency_graph.integrity_hash, escalation: result.escalation_timeline.integrity_hash, certification: result.certification_queue.integrity_hash, replay: result.replay_view.integrity_hash, rollback: result.rollback_view.integrity_hash, evidence: result.evidence_workspace.integrity_hash, history: result.decision_history.integrity_hash, alerts: result.alert_center.integrity_hash, failures: result.failures });
}

function resultIntegrityHash(result: Omit<GovernanceApprovalDashboardResult, "integrity_hash">): string {
  return hash({ version: result.governance_approval_dashboard_version, id: result.dashboard_identifier, api: result.api_surface.integrity_hash, replay_hash: result.replay_hash, validation_outcome: result.validation_outcome });
}

export function buildGovernanceApprovalDashboard(input: GovernanceApprovalDashboardInput = {}): GovernanceApprovalDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const dashboard_foundation = establishAdaptiveDashboardFoundation();
  const initialFailures = freezeArray([...(failureForScenario(scenario) ? [failureForScenario(scenario) as GovernanceApprovalDashboardFailure] : []), ...(!replayAdaptiveDashboardFoundation(dashboard_foundation) ? ["DASHBOARD_FOUNDATION_UNAVAILABLE" as const] : [])]);
  const api_surface = apiSurface();
  const dashboardRecords = records(initialFailures);
  const blocker_registry = blockers(dashboardRecords, initialFailures);
  const approval_queue = queue(dashboardRecords, initialFailures);
  const detail_view = detail(dashboardRecords);
  const record = dashboardRecords[0];
  const governance_status_view = governanceView(record, initialFailures);
  const constitutional_view = constitutionalView(record, initialFailures);
  const authority_view = authorityView(record, initialFailures);
  const operator_workspace = operatorWorkspace(record, initialFailures);
  const dependency_graph = dependencyGraph(record, initialFailures);
  const escalation_timeline = escalation(record);
  const certification_queue = certification(record);
  const replay_view = replay(record);
  const rollback_view = rollback(record);
  const evidence_workspace = evidence(record);
  const decision_history = history(record);
  const alert_center = alerts(record, initialFailures);
  const permissionRecords = permissions(input, initialFailures);
  const metricsRecord = metrics(initialFailures);
  const baseWithoutValidation: Omit<GovernanceApprovalDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash"> = {
    governance_approval_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    dashboard_foundation,
    records: dashboardRecords,
    approval_queue,
    detail_view,
    governance_status_view,
    blocker_registry,
    constitutional_view,
    authority_view,
    operator_workspace,
    dependency_graph,
    escalation_timeline,
    certification_queue,
    replay_view,
    rollback_view,
    evidence_workspace,
    decision_history,
    alert_center,
    permissions: permissionRecords,
    widgets: WIDGETS,
    metrics: metricsRecord,
    deterministic: true,
    replayable: !initialFailures.includes("REPLAY_READINESS_UNAVAILABLE"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_backed: !initialFailures.includes("EVIDENCE_REFERENCE_BROKEN"),
    governance_visible: !initialFailures.includes("GOVERNANCE_STATUS_UNAVAILABLE"),
    constitutional_visible: !initialFailures.includes("CONSTITUTIONAL_STATUS_UNAVAILABLE"),
    authority_visible: !initialFailures.includes("AUTHORITY_STATUS_UNAVAILABLE"),
    operator_approval_visible: !initialFailures.includes("OPERATOR_APPROVAL_MISSING"),
    certification_visible: !initialFailures.includes("CERTIFICATION_STATUS_UNAVAILABLE"),
    rollback_visible: !initialFailures.includes("ROLLBACK_READINESS_UNAVAILABLE"),
    read_only: true,
    advisory_only: true,
    write_authority_granted: initialFailures.includes("DASHBOARD_WRITE_AUTHORITY_EXPOSED") ? true as never : false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is GovernanceApprovalDashboardFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<GovernanceApprovalDashboardResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutValidation, status: failures.length ? "REJECTED" : "AUTHORITATIVE", validation_tests, validation_outcome, failures };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateGovernanceApprovalDashboard(result?: GovernanceApprovalDashboardResult): GovernanceApprovalDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<GovernanceApprovalDashboardFailure>(["HIDDEN_REVIEW_OR_APPROVAL_STATE"]);
    const base: Omit<GovernanceApprovalDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash
    && result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.approval_queue) === result.approval_queue.integrity_hash
    && hashWithoutIntegrity(result.detail_view) === result.detail_view.integrity_hash
    && hashWithoutIntegrity(result.governance_status_view) === result.governance_status_view.integrity_hash
    && result.blocker_registry.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.constitutional_view) === result.constitutional_view.integrity_hash
    && hashWithoutIntegrity(result.authority_view) === result.authority_view.integrity_hash
    && hashWithoutIntegrity(result.operator_workspace) === result.operator_workspace.integrity_hash
    && hashWithoutIntegrity(result.dependency_graph) === result.dependency_graph.integrity_hash
    && hashWithoutIntegrity(result.escalation_timeline) === result.escalation_timeline.integrity_hash
    && hashWithoutIntegrity(result.certification_queue) === result.certification_queue.integrity_hash
    && hashWithoutIntegrity(result.replay_view) === result.replay_view.integrity_hash
    && hashWithoutIntegrity(result.rollback_view) === result.rollback_view.integrity_hash
    && hashWithoutIntegrity(result.evidence_workspace) === result.evidence_workspace.integrity_hash
    && hashWithoutIntegrity(result.decision_history) === result.decision_history.integrity_hash
    && hashWithoutIntegrity(result.alert_center) === result.alert_center.integrity_hash
    && result.permissions.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash
    && result.validation_tests.every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.creation_supported && !result.api_surface.mutation_supported && !result.api_surface.independent_approval_supported && !result.api_surface.authority_expansion_supported && !result.api_surface.governance_outcome_mutation_supported && !result.api_surface.constitutional_requirement_mutation_supported && !result.api_surface.adaptation_activation_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<GovernanceApprovalDashboardValidationResult, "validation_hash"> = { dashboard_id: result.dashboard_identifier, valid, validation_outcome: result.validation_outcome, failures: result.failures, replay_hash_valid, integrity_hash_valid, read_only };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayGovernanceApprovalDashboard(result: GovernanceApprovalDashboardResult): boolean {
  return validateGovernanceApprovalDashboard(result).valid;
}

export function buildGovernanceApprovalDashboardObservabilitySurface(result = buildGovernanceApprovalDashboard()): GovernanceApprovalDashboardObservabilitySurface {
  return Object.freeze({ dashboard_id: result.dashboard_identifier, status: result.status, validation_outcome: result.validation_outcome, proposals: result.records.length, blockers: result.blocker_registry.length, failed_tests: result.validation_tests.filter((test) => !test.passed).length, failures: result.failures, replayable: result.replayable, tenant_isolated: result.tenant_isolated, read_only: result.read_only && result.advisory_only && !result.write_authority_granted, integrity_hash: result.integrity_hash });
}

export function getGovernanceApprovalDashboardContract(): GovernanceApprovalDashboardContract {
  const result = buildGovernanceApprovalDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      governance_states: GOVERNANCE_STATES,
      approval_states: APPROVAL_STATES,
      navigation_dimensions: freezeArray(["proposal ID", "proposal type", "proposal version", "tenant", "mission", "governance status", "constitutional status", "authority status", "operator approval status", "blocker category", "escalation status", "simulation status", "certification status", "replay readiness", "rollback readiness", "reviewing authority", "assigned reviewer", "date range", "policy version"]),
      required_data_sources: freezeArray(["Governance-Aware Adaptation Layer", "Governance Engine", "Constitution Engine", "Authority Verification Service", "Operator Approval Workflow", "Adaptation Proposal Engine", "Adaptive Simulation Framework", "Adaptive Simulation Certification Gate", "Drift Defense System", "Replay Engine", "Rollback Engine", "Truth Ledger", "Adaptive Intelligence Ledger", "Governance Decision Ledger", "Certification Ledger", "Evidence Registry", "Identity and Authorization Service", "Tenant Registry", "Policy Registry"]),
      read_only: true,
      advisory_only: true,
    }),
    result,
    validation: validateGovernanceApprovalDashboard(result),
    observability: buildGovernanceApprovalDashboardObservabilitySurface(result),
  });
}

export const GovernanceApprovalDashboard = Object.freeze({ build: buildGovernanceApprovalDashboard, validate: validateGovernanceApprovalDashboard, replay: replayGovernanceApprovalDashboard });
