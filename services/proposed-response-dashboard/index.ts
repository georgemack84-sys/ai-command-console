import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AffectedScopeView,
  BenefitCategory,
  CertificationReadinessState,
  CertificationReadinessView,
  EvidenceInspectionWorkspace,
  EvidenceState,
  ExpectedBenefitView,
  ExpectedRiskView,
  GovernanceOutcome,
  GovernanceReviewView,
  NextPermittedActionPanel,
  NextPermittedResponseAction,
  ProposalLineageExplorer,
  ProposedResponseAlertSeverity,
  ProposedResponseAuditRecord,
  ProposedResponseDashboardApiSurface,
  ProposedResponseDashboardContract,
  ProposedResponseDashboardFailure,
  ProposedResponseDashboardInput,
  ProposedResponseDashboardObservabilitySurface,
  ProposedResponseDashboardRecord,
  ProposedResponseDashboardResult,
  ProposedResponseDashboardScenario,
  ProposedResponseDashboardValidationResult,
  ProposedResponseMetrics,
  ProposedResponseValidationTest,
  ProposedResponseWidget,
  ReplayNavigationView,
  ReplayState,
  ResponseAlertCenter,
  ResponseComparisonWorkspace,
  ResponseDetailView,
  ResponseProposalQueue,
  ResponseRationaleView,
  ResponseStatus,
  ResponseType,
  RiskCategory,
  ScopeState,
  SimulationState,
  SimulationStatusView,
} from "@/types/proposed-response-dashboard";

const VERSION = "proposed-response-dashboard/v10.14.4.9" as const;
const DASHBOARD_ID = "ProposedResponseDashboard" as const;
const TENANT_ID = "tenant_mission_control";
const WIDGETS: readonly ProposedResponseWidget[] = Object.freeze(["Proposed Responses", "Response Rationale", "Expected Benefit", "Expected Risk", "Affected Scope", "Simulation Status", "Governance Review", "Certification Readiness", "Proposal Lineage", "Evidence Inspection", "Replay Navigation", "Response Comparison", "Response Alerts", "Next Permitted Action"]);
const RESPONSE_TYPES: readonly ResponseType[] = Object.freeze(["NO_ACTION", "OBSERVE", "COLLECT_MORE_EVIDENCE", "REQUEST_OPERATOR_REVIEW", "REQUEST_GOVERNANCE_REVIEW", "RUN_ADDITIONAL_SIMULATION", "ADJUST_RECOMMENDATION_LOGIC", "ADJUST_STRATEGY", "ADJUST_CONFIDENCE_CALIBRATION", "ADJUST_RISK_ASSESSMENT", "UPDATE_GUIDANCE", "UPDATE_OPERATOR_WORKFLOW", "ADD_GOVERNANCE_CONTROL", "ADD_MONITORING", "CONTAIN_PATTERN_EFFECT", "PREPARE_ROLLBACK", "ESCALATE", "INITIATE_CERTIFICATION_REVIEW"]);
const RESPONSE_STATUSES: readonly ResponseStatus[] = Object.freeze(["DRAFT", "EVIDENCE_PENDING", "READY_FOR_REVIEW", "IN_REVIEW", "SIMULATION_REQUIRED", "SIMULATION_IN_PROGRESS", "GOVERNANCE_REVIEW_REQUIRED", "CONSTITUTIONAL_REVIEW_REQUIRED", "OPERATOR_REVIEW_REQUIRED", "ADDITIONAL_EVIDENCE_REQUIRED", "BLOCKED", "DEFERRED", "REJECTED", "APPROVED_FOR_CERTIFICATION", "CERTIFICATION_PENDING", "CERTIFIED", "CONDITIONAL_PASS", "FAIL", "WITHDRAWN", "SUPERSEDED", "ROLLBACK_REQUIRED"]);
const BENEFIT_CATEGORIES: readonly BenefitCategory[] = Object.freeze(["MISSION_SUCCESS", "RECOMMENDATION_EFFECTIVENESS", "RISK_REDUCTION", "CONFIDENCE_CALIBRATION", "OPERATOR_USABILITY", "REVIEW_LATENCY", "WORKLOAD_BALANCE", "GOVERNANCE_COMPLIANCE", "REPLAY_RELIABILITY", "RESILIENCE", "EVIDENCE_QUALITY", "CERTIFICATION_READINESS"]);
const RISK_CATEGORIES: readonly RiskCategory[] = Object.freeze(["MISSION_RISK", "OPERATIONAL_RISK", "STRATEGIC_RISK", "GOVERNANCE_RISK", "CONSTITUTIONAL_RISK", "AUTHORITY_RISK", "TENANT_ISOLATION_RISK", "EVIDENCE_RISK", "REPLAY_RISK", "ROLLBACK_RISK", "OPERATOR_RISK", "CERTIFICATION_RISK", "IMPLEMENTATION_RISK", "UNKNOWN_RISK"]);
const SCOPE_STATES: readonly ScopeState[] = Object.freeze(["LOCAL", "MISSION_SCOPED", "ROLE_SCOPED", "TENANT_SCOPED", "CROSS_MISSION", "CROSS_CAPABILITY", "SYSTEM_WIDE", "UNDETERMINED"]);
const SIMULATION_STATES: readonly SimulationState[] = Object.freeze(["NOT_ASSESSED", "NOT_REQUIRED", "REQUIRED", "QUEUED", "PREPARING", "IN_PROGRESS", "COMPLETED", "FAILED", "DIVERGED", "BLOCKED", "ADDITIONAL_SIMULATION_REQUIRED"]);
const GOVERNANCE_OUTCOMES: readonly GovernanceOutcome[] = Object.freeze(["NOT_ASSESSED", "COMPLIANT", "CONDITIONALLY_COMPLIANT", "REVIEW_REQUIRED", "ADDITIONAL_EVIDENCE_REQUIRED", "ESCALATION_REQUIRED", "NONCOMPLIANT", "BLOCKED"]);
const CERTIFICATION_STATES: readonly CertificationReadinessState[] = Object.freeze(["NOT_ASSESSED", "NOT_READY", "EVIDENCE_PENDING", "SIMULATION_PENDING", "GOVERNANCE_PENDING", "OPERATOR_REVIEW_PENDING", "REPLAY_PENDING", "ROLLBACK_PENDING", "READY", "CONDITIONALLY_READY", "BLOCKED"]);
const REPLAY_STATES: readonly ReplayState[] = Object.freeze(["READY", "PARTIAL", "MISSING_REFERENCES", "VERSION_MISMATCH", "DIVERGED", "INTEGRITY_FAILURE", "UNAVAILABLE", "BLOCKED"]);

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

function failureForScenario(scenario: ProposedResponseDashboardScenario): ProposedResponseDashboardFailure | undefined {
  const map: Partial<Record<ProposedResponseDashboardScenario, ProposedResponseDashboardFailure>> = {
    MISSING_TENANT: "TENANT_CONTEXT_UNAVAILABLE",
    MISSION_SCOPE_UNVERIFIED: "MISSION_SCOPE_UNVERIFIED",
    SOURCE_PATTERN_MISSING: "SOURCE_PATTERN_UNRESOLVED",
    PROPOSAL_VERSION_UNVERIFIED: "PROPOSAL_VERSION_UNVERIFIED",
    EVIDENCE_INTEGRITY_FAILURE: "EVIDENCE_INTEGRITY_FAILED",
    UNSUPPORTED_BENEFIT: "EXPECTED_BENEFIT_UNSUPPORTED",
    MISSING_RISK: "EXPECTED_RISK_MISSING",
    SIMULATION_UNVERIFIED: "SIMULATION_STATUS_UNVERIFIED",
    SIMULATION_FAILED: "SIMULATION_FAILED_OR_DIVERGED",
    GOVERNANCE_UNAVAILABLE: "GOVERNANCE_STATUS_UNAVAILABLE",
    CERTIFICATION_UNAVAILABLE: "CERTIFICATION_READINESS_UNAVAILABLE",
    REPLAY_UNAVAILABLE: "REPLAY_READINESS_UNAVAILABLE",
    ROLLBACK_UNAVAILABLE: "ROLLBACK_READINESS_UNAVAILABLE",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    NONDETERMINISTIC_CALCULATION: "CALCULATION_NONDETERMINISTIC",
    HIDDEN_RESPONSE: "RESPONSE_PROPOSAL_HIDDEN",
    REJECTED_RESPONSE_HIDDEN: "REJECTED_OR_FAILED_RESPONSE_HIDDEN",
    CONDITIONAL_READY: "CONDITIONAL_READINESS_MISREPRESENTED",
    UNDETERMINED_SCOPE: "AFFECTED_SCOPE_UNDETERMINED",
    CROSS_TENANT_SCOPE: "CROSS_TENANT_SCOPE_BLOCKED",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    EXECUTION_AUTHORITY_EXPOSED: "EXECUTION_AUTHORITY_EXPOSED",
    APPROVAL_BYPASS: "APPROVAL_BYPASS_EXPOSED",
    CERTIFICATION_BYPASS: "CERTIFICATION_BYPASS_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario];
}

function apiSurface(): ProposedResponseDashboardApiSurface {
  const base: Omit<ProposedResponseDashboardApiSurface, "integrity_hash"> = {
    api_id: "proposed_response_dashboard_api",
    retrieve_dashboard: "POST /proposed-response-dashboard/dashboard",
    retrieve_contract: "GET /proposed-response-dashboard/contract",
    retrieve_sections: freezeArray(["queue", "detail", "rationale", "benefit", "risk", "scope", "simulation", "governance", "certification", "lineage", "evidence", "replay", "comparison", "alerts", "next-action", "audit"]),
    validate_dashboard: "POST /proposed-response-dashboard/validate",
    inspect_dashboard: "POST /proposed-response-dashboard/inspect",
    creation_supported: false,
    mutation_supported: false,
    execution_supported: false,
    production_modification_supported: false,
    policy_change_supported: false,
    strategy_change_supported: false,
    confidence_recalibration_supported: false,
    risk_recalibration_supported: false,
    automatic_approval_supported: false,
    governance_bypass_supported: false,
    certification_execution_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function nextAction(failures: readonly ProposedResponseDashboardFailure[]): NextPermittedResponseAction {
  if (failures.some((failure) => ["TENANT_ISOLATION_VIOLATED", "CROSS_TENANT_SCOPE_BLOCKED", "INTEGRITY_VERIFICATION_FAILED", "EXECUTION_AUTHORITY_EXPOSED", "APPROVAL_BYPASS_EXPOSED", "CERTIFICATION_BYPASS_EXPOSED"].includes(failure))) return "NO_ACTION_PERMITTED";
  if (failures.includes("EVIDENCE_INTEGRITY_FAILED") || failures.includes("EXPECTED_BENEFIT_UNSUPPORTED")) return "COLLECT_MORE_EVIDENCE";
  if (failures.includes("SIMULATION_STATUS_UNVERIFIED") || failures.includes("SIMULATION_FAILED_OR_DIVERGED")) return "RUN_SIMULATION";
  if (failures.includes("GOVERNANCE_STATUS_UNAVAILABLE")) return "REQUEST_GOVERNANCE_REVIEW";
  if (failures.includes("CERTIFICATION_READINESS_UNAVAILABLE") || failures.includes("CONDITIONAL_READINESS_MISREPRESENTED")) return "SUBMIT_FOR_CERTIFICATION";
  if (failures.includes("REPLAY_READINESS_UNAVAILABLE")) return "REMEDIATE_BLOCKER";
  if (failures.includes("ROLLBACK_READINESS_UNAVAILABLE")) return "PREPARE_ROLLBACK";
  return "SUBMIT_FOR_CERTIFICATION";
}

function records(input: ProposedResponseDashboardInput, failures: readonly ProposedResponseDashboardFailure[]): readonly ProposedResponseDashboardRecord[] {
  if (failures.includes("RESPONSE_PROPOSAL_HIDDEN")) return freezeArray([]);
  const blocked = failures.length > 0;
  const base: Omit<ProposedResponseDashboardRecord, "integrity_hash"> = {
    dashboard_record_id: id("proposed_response_record", "response-1"),
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
    mission_scope: failures.includes("MISSION_SCOPE_UNVERIFIED") ? "" : "mission-control-pattern-response",
    response_proposal_id: "response_pattern_1",
    response_version: failures.includes("PROPOSAL_VERSION_UNVERIFIED") ? "v0-stale" : "v1",
    response_type: "UPDATE_OPERATOR_WORKFLOW",
    response_status: blocked ? failures.includes("REJECTED_OR_FAILED_RESPONSE_HIDDEN") ? "REJECTED" : "BLOCKED" : "READY_FOR_REVIEW",
    response_summary: "Improve operator workflow guidance for recurring low-usability recommendation overrides.",
    response_rationale: failures.includes("EXPECTED_BENEFIT_UNSUPPORTED") ? "" : "Pattern recurrence, operator feedback, and outcome evidence suggest workflow guidance can reduce avoidable review friction.",
    source_pattern_refs: failures.includes("SOURCE_PATTERN_UNRESOLVED") ? freezeArray([]) : freezeArray(["pattern:operator-impact:1"]),
    source_observation_refs: freezeArray(["observation:override:1"]),
    source_outcome_refs: freezeArray(["outcome:review-friction:1"]),
    source_recommendation_refs: freezeArray(["recommendation:mission-risk:v3"]),
    source_feedback_refs: freezeArray(["feedback:operator-rationale:1"]),
    supporting_evidence_refs: failures.includes("EVIDENCE_INTEGRITY_FAILED") ? freezeArray([]) : freezeArray(["evidence:response:benefit-risk:1"]),
    affected_mission_refs: freezeArray(["mission:adaptive-command"]),
    affected_operator_refs: freezeArray(["operator:pseudonymized:cohort-alpha"]),
    affected_capability_refs: freezeArray(["capability:operator-review", "capability:recommendation-explanation"]),
    affected_policy_refs: freezeArray(["policy:operator-authority:v1"]),
    expected_benefit: failures.includes("EXPECTED_BENEFIT_UNSUPPORTED") ? "UNVERIFIED" : "Reduce evidence-review friction by 12 percent during validation window.",
    expected_risk: failures.includes("EXPECTED_RISK_MISSING") ? "" : "May temporarily increase review steps; residual operational risk remains moderate.",
    confidence_assessment: failures.includes("CALCULATION_NONDETERMINISTIC") ? 0.42 : 0.81,
    governance_review_status: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? "NOT_ASSESSED" : "COMPLIANT",
    constitutional_review_status: "COMPLIANT",
    authority_review_status: "COMPLIANT",
    simulation_status: failures.includes("SIMULATION_STATUS_UNVERIFIED") ? "NOT_ASSESSED" : failures.includes("SIMULATION_FAILED_OR_DIVERGED") ? "FAILED" : "COMPLETED",
    simulation_refs: failures.includes("SIMULATION_STATUS_UNVERIFIED") ? freezeArray([]) : freezeArray(["simulation:response:1"]),
    certification_readiness: failures.includes("CERTIFICATION_READINESS_UNAVAILABLE") ? "NOT_ASSESSED" : failures.includes("CONDITIONAL_READINESS_MISREPRESENTED") ? "CONDITIONALLY_READY" : "READY",
    certification_refs: failures.includes("CERTIFICATION_READINESS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["certification-readiness:response:1"]),
    replay_readiness: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? "UNAVAILABLE" : "READY",
    replay_refs: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["replay:response:1"]),
    rollback_readiness: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? "NOT_READY" : "READY",
    rollback_refs: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["rollback:response:1"]),
    approval_status: failures.includes("APPROVAL_BYPASS_EXPOSED") ? "APPROVED" : "PENDING",
    approval_refs: failures.includes("APPROVAL_BYPASS_EXPOSED") ? freezeArray([]) : freezeArray(["approval-workflow:pending:1"]),
    visible_to_roles: freezeArray(["OPERATOR", "REVIEWER", "GOVERNANCE_AUTHORITY", "AUDITOR", "CERTIFICATION_TEAM"]),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "governance_private_notes"]),
    alerts: failures,
    created_at: "2026-07-09T00:00:00.000Z",
    updated_at: "2026-07-09T00:00:00.000Z",
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) })]);
}

function queue(records: readonly ProposedResponseDashboardRecord[], failures: readonly ProposedResponseDashboardFailure[]): ResponseProposalQueue {
  const terminal: readonly ResponseStatus[] = failures.includes("REJECTED_OR_FAILED_RESPONSE_HIDDEN") ? freezeArray([]) : freezeArray(["REJECTED", "FAIL", "SUPERSEDED", "WITHDRAWN"]);
  const base: Omit<ResponseProposalQueue, "integrity_hash"> = { queue_id: "response_proposal_queue", proposal_refs: records.map((record) => record.response_proposal_id).sort(), category_counts: freezeArray(["ready:1", `blocked:${failures.length ? 1 : 0}`, `rejected-retained:${terminal.includes("REJECTED") ? 1 : 0}`, "certified:0"]), retained_terminal_states: terminal, blocker_count: failures.length, next_permitted_action: nextAction(failures), deterministic_ordering: !failures.includes("CALCULATION_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function detail(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): ResponseDetailView {
  const refs = record ? freezeArray([...record.source_pattern_refs, ...record.source_observation_refs, ...record.source_outcome_refs, ...record.source_recommendation_refs, ...record.source_feedback_refs, ...record.supporting_evidence_refs, ...record.simulation_refs, ...record.certification_refs, ...record.replay_refs, ...record.rollback_refs]) : freezeArray([]);
  const base: Omit<ResponseDetailView, "integrity_hash"> = { view_id: "response_detail_view", proposal_ref: record?.response_proposal_id ?? "", traceability_refs: refs, unresolved_blockers: failures, proposal_distinguished_from_authority: true, rejected_failed_superseded_retained: !failures.includes("REJECTED_OR_FAILED_RESPONSE_HIDDEN") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rationale(record: ProposedResponseDashboardRecord | undefined): ResponseRationaleView {
  const base: Omit<ResponseRationaleView, "integrity_hash"> = { view_id: "response_rationale_view", triggering_patterns: record?.source_pattern_refs ?? freezeArray([]), reason_codes: freezeArray(["recurring_override", "low_recommendation_usability", "evidence_review_friction"]), causal_classification: "SUSPECTED_CAUSATION", alternatives_considered: freezeArray(["NO_ACTION", "COLLECT_MORE_EVIDENCE", "ADD_MONITORING"]), no_action_considered: true, consequence_of_inaction: "Review friction may persist and continue producing avoidable overrides.", uncertainty_statement: "Pattern supports response review but does not prove causation." };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function benefit(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): ExpectedBenefitView {
  const base: Omit<ExpectedBenefitView, "integrity_hash"> = { view_id: "expected_benefit_view", category: "OPERATOR_USABILITY", baseline: 0.68, target: 0.8, expected_improvement: 0.12, unit: "usability score", confidence_range: freezeArray([0.69, 0.86]), supporting_evidence: record?.supporting_evidence_refs ?? freezeArray([]), simulation_status: record?.simulation_status ?? "NOT_ASSESSED", validation_period: "30 days", state: failures.includes("EXPECTED_BENEFIT_UNSUPPORTED") ? "UNVERIFIED" : "VERIFIED", paired_risk_ref: "expected_risk_view" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function risk(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): ExpectedRiskView {
  const base: Omit<ExpectedRiskView, "integrity_hash"> = { view_id: "expected_risk_view", category: failures.includes("EXPECTED_RISK_MISSING") ? "UNKNOWN_RISK" : "OPERATIONAL_RISK", probability: failures.includes("EXPECTED_RISK_MISSING") ? 0 : 0.27, severity: "MODERATE", confidence: record?.confidence_assessment ?? 0, mitigation: "Stage guidance rollout, monitor review latency, and preserve rollback plan.", residual_risk: failures.includes("EXPECTED_RISK_MISSING") ? "" : "Temporary workflow friction remains possible.", governance_sensitive: true, rollback_required: true, unknown_risk_visible: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scope(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): AffectedScopeView {
  const state: ScopeState = failures.includes("AFFECTED_SCOPE_UNDETERMINED") ? "UNDETERMINED" : failures.includes("CROSS_TENANT_SCOPE_BLOCKED") ? "SYSTEM_WIDE" : "MISSION_SCOPED";
  const base: Omit<AffectedScopeView, "integrity_hash"> = { view_id: "affected_scope_view", scope_state: state, affected_tenants: failures.includes("CROSS_TENANT_SCOPE_BLOCKED") ? freezeArray([TENANT_ID, "tenant-other"]) : freezeArray([record?.tenant_id ?? TENANT_ID]), affected_missions: record?.affected_mission_refs ?? freezeArray([]), affected_operators: record?.affected_operator_refs ?? freezeArray([]), affected_capabilities: record?.affected_capability_refs ?? freezeArray([]), affected_policies: record?.affected_policy_refs ?? freezeArray([]), cross_tenant_blocked: failures.includes("CROSS_TENANT_SCOPE_BLOCKED"), progresses_beyond_preliminary_review: state !== "UNDETERMINED" && !failures.includes("CROSS_TENANT_SCOPE_BLOCKED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function simulation(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): SimulationStatusView {
  const base: Omit<SimulationStatusView, "integrity_hash"> = { view_id: "simulation_status_view", state: record?.simulation_status ?? "NOT_ASSESSED", completed_scenarios: record?.simulation_status === "COMPLETED" ? freezeArray(["baseline", "evidence-delay", "rollback"]) : freezeArray([]), remaining_scenarios: record?.simulation_status === "COMPLETED" ? freezeArray([]) : freezeArray(["rollback"]), expected_benefit_distinguished: true, simulated_benefit_distinguished: true, certified_benefit_distinguished: true, regressions: failures.includes("SIMULATION_FAILED_OR_DIVERGED") ? freezeArray(["review-latency-regression"]) : freezeArray([]), progression_blocked: failures.includes("SIMULATION_STATUS_UNVERIFIED") || failures.includes("SIMULATION_FAILED_OR_DIVERGED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governance(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): GovernanceReviewView {
  const base: Omit<GovernanceReviewView, "integrity_hash"> = { view_id: "governance_review_view", governance_outcome: record?.governance_review_status ?? "NOT_ASSESSED", constitutional_outcome: record?.constitutional_review_status ?? "NOT_ASSESSED", authority_outcome: record?.authority_review_status ?? "NOT_ASSESSED", governance_blockers: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? freezeArray(["governance status unavailable"]) : freezeArray([]), completed_controls: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? freezeArray([]) : freezeArray(["policy review", "authority review", "constitutional screen"]), approval_equals_certification: false, certification_equals_implementation: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certification(record: ProposedResponseDashboardRecord | undefined): CertificationReadinessView {
  const state = record?.certification_readiness ?? "NOT_ASSESSED";
  const base: Omit<CertificationReadinessView, "integrity_hash"> = { view_id: "certification_readiness_view", state, evidence_complete: Boolean(record?.supporting_evidence_refs.length), simulation_complete: record?.simulation_status === "COMPLETED", governance_complete: record?.governance_review_status === "COMPLIANT", replay_ready: record?.replay_readiness === "READY", rollback_ready: record?.rollback_readiness === "READY", unresolved_blockers: state === "READY" ? freezeArray([]) : freezeArray(["certification readiness incomplete"]), unmet_conditions: state === "CONDITIONALLY_READY" ? freezeArray(["conditional readiness is not full readiness"]) : freezeArray([]), ready_for_formal_certification: state === "READY" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function lineage(record: ProposedResponseDashboardRecord | undefined): ProposalLineageExplorer {
  const hasRefs = Boolean(record?.source_observation_refs.length && record.source_outcome_refs.length && record.source_pattern_refs.length);
  const base: Omit<ProposalLineageExplorer, "integrity_hash"> = { explorer_id: "proposal_lineage_explorer", lineage_flow: freezeArray(["Observation", "Outcome", "Detected Pattern", "Pattern Analysis", "Proposed Response", "Risk and Benefit Analysis", "Simulation", "Governance Review", "Operator Review", "Certification"]), source_referenced: hasRefs, versioned: record?.response_version === "v1", replayable: Boolean(record?.replay_refs.length), tenant_isolated: record?.tenant_id === TENANT_ID, integrity_verified: Boolean(record) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function evidence(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): EvidenceInspectionWorkspace {
  const state: EvidenceState = failures.includes("EVIDENCE_INTEGRITY_FAILED") ? "SUSPECTED_TAMPERING" : record?.supporting_evidence_refs.length ? "VERIFIED" : "INCOMPLETE";
  const base: Omit<EvidenceInspectionWorkspace, "integrity_hash"> = { workspace_id: "evidence_inspection_workspace", evidence_refs: record?.supporting_evidence_refs ?? freezeArray([]), contradictory_evidence_refs: freezeArray(["evidence:contradictory:response:1"]), rejected_evidence_refs: freezeArray(["evidence:rejected:historical:1"]), evidence_state: state, evidence_state_at_generation_preserved: true, integrity_failure_blocks_progression: state === "SUSPECTED_TAMPERING" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replay(record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): ReplayNavigationView {
  const base: Omit<ReplayNavigationView, "integrity_hash"> = { view_id: "replay_navigation_view", state: record?.replay_readiness ?? "UNAVAILABLE", replay_steps: freezeArray(["source observations", "source outcomes", "pattern detection", "response generation", "benefit calculation", "risk calculation", "simulation", "governance review", "certification readiness", "dashboard rendering"]), event_ordering_verified: true, versions_verified: !failures.includes("PROPOSAL_VERSION_UNVERIFIED"), calculation_reproducible: !failures.includes("CALCULATION_NONDETERMINISTIC"), decision_lineage_verified: Boolean(record?.replay_refs.length), integrity_hashes_verified: !failures.includes("REPLAY_READINESS_UNAVAILABLE") && !failures.includes("INTEGRITY_VERIFICATION_FAILED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function comparison(failures: readonly ProposedResponseDashboardFailure[]): ResponseComparisonWorkspace {
  const base: Omit<ResponseComparisonWorkspace, "integrity_hash"> = { workspace_id: "response_comparison_workspace", dimensions: freezeArray(["response type", "expected benefit", "expected risk", "confidence", "evidence strength", "mission impact", "governance impact", "simulation result", "replay readiness", "rollback readiness", "certification readiness"]), sample_size: 3, missing_data_visible: true, uncertainty_preserved: true, composite_scoring_present: false, automatic_ranking_present: false, source_values_preserved: true, normalization_explained: !failures.includes("CALCULATION_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function alerts(failures: readonly ProposedResponseDashboardFailure[]): ResponseAlertCenter {
  const critical: readonly ProposedResponseDashboardFailure[] = ["EVIDENCE_INTEGRITY_FAILED", "SIMULATION_FAILED_OR_DIVERGED", "TENANT_ISOLATION_VIOLATED", "CROSS_TENANT_SCOPE_BLOCKED", "INTEGRITY_VERIFICATION_FAILED", "EXECUTION_AUTHORITY_EXPOSED"];
  const base: Omit<ResponseAlertCenter, "integrity_hash"> = { alert_id: "response_alert_center", alerts: freezeArray(failures.length ? failures : ["response ready for governed review"]), highest_severity: failures.some((failure) => critical.includes(failure)) ? "CRITICAL" : failures.length ? "HIGH" : "INFORMATIONAL", critical_alerts_visible_until_resolved: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function nextPanel(failures: readonly ProposedResponseDashboardFailure[]): NextPermittedActionPanel {
  const action = nextAction(failures);
  const base: Omit<NextPermittedActionPanel, "integrity_hash"> = { panel_id: "next_permitted_action_panel", action, rationale: action === "NO_ACTION_PERMITTED" ? "Critical response-review dependencies are unresolved." : `Next governed review action is ${action}.`, mandatory_dependencies_evaluated: true, executes_action: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function audit(input: ProposedResponseDashboardInput, record: ProposedResponseDashboardRecord | undefined, failures: readonly ProposedResponseDashboardFailure[]): readonly ProposedResponseAuditRecord[] {
  const base: Omit<ProposedResponseAuditRecord, "integrity_hash"> = { audit_id: id("proposed_response_audit", input.role ?? "AUDITOR"), actor: "codex:dashboard-reader", tenant_id: record?.tenant_id ?? TENANT_ID, role: input.role ?? "AUDITOR", mission_scope: record?.mission_scope ?? "", response_proposal_id: record?.response_proposal_id ?? "", response_version: record?.response_version ?? "", source_pattern: record?.source_pattern_refs[0] ?? "", dashboard_view: "proposed-response-dashboard", evidence_accessed: record?.supporting_evidence_refs ?? freezeArray([]), comparison_performed: true, lineage_opened: true, replay_launched: Boolean(record?.replay_refs.length), filters_applied: freezeArray(["tenant", "mission", "response-version", "policy-version"]), decision_submitted: false, authorization_result: failures.includes("RESTRICTED_FIELD_EXPOSED") ? "DENIED" : "ALLOWED", integrity_result: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAIL" : "PASS", append_only: true, tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"), replayable: !failures.includes("REPLAY_READINESS_UNAVAILABLE"), timestamp: "2026-07-09T00:00:00.000Z" };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function metrics(failures: readonly ProposedResponseDashboardFailure[]): ProposedResponseMetrics {
  const base: Omit<ProposedResponseMetrics, "integrity_hash"> = { missing_response_proposals: failures.includes("RESPONSE_PROPOSAL_HIDDEN") ? 1 : 0, orphaned_source_patterns: failures.includes("SOURCE_PATTERN_UNRESOLVED") ? 1 : 0, missing_rationale: failures.includes("EXPECTED_BENEFIT_UNSUPPORTED") ? 1 : 0, missing_evidence_references: failures.includes("EVIDENCE_INTEGRITY_FAILED") ? 1 : 0, benefit_risk_mismatches: failures.includes("EXPECTED_RISK_MISSING") ? 1 : 0, simulation_state_inconsistencies: failures.includes("SIMULATION_STATUS_UNVERIFIED") || failures.includes("SIMULATION_FAILED_OR_DIVERGED") ? 1 : 0, governance_state_inconsistencies: failures.includes("GOVERNANCE_STATUS_UNAVAILABLE") ? 1 : 0, certification_readiness_inconsistencies: failures.includes("CERTIFICATION_READINESS_UNAVAILABLE") || failures.includes("CONDITIONAL_READINESS_MISREPRESENTED") ? 1 : 0, replay_failures: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? 1 : 0, rollback_state_inconsistencies: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? 1 : 0, proposal_version_mismatches: failures.includes("PROPOSAL_VERSION_UNVERIFIED") ? 1 : 0, cross_tenant_exposures: failures.includes("TENANT_ISOLATION_VIOLATED") || failures.includes("CROSS_TENANT_SCOPE_BLOCKED") ? 1 : 0, unauthorized_access_attempts: failures.includes("RESTRICTED_FIELD_EXPOSED") ? 1 : 0, integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: ProposedResponseDashboardFailure, evidence_refs: readonly string[]): ProposedResponseValidationTest {
  const base: Omit<ProposedResponseValidationTest, "integrity_hash"> = { test_id: id("proposed_response_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type BuildBase = Omit<ProposedResponseDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">;
function buildValidationTests(result: BuildBase): readonly ProposedResponseValidationTest[] {
  const record = result.records[0];
  const evidenceRefs = result.records.map((item) => item.integrity_hash);
  return freezeArray([
    validationTest("tenant context available", Boolean(record?.tenant_id), "TENANT_CONTEXT_UNAVAILABLE", evidenceRefs),
    validationTest("mission scope verified", Boolean(record?.mission_scope), "MISSION_SCOPE_UNVERIFIED", evidenceRefs),
    validationTest("source pattern resolved", Boolean(record?.source_pattern_refs.length) && result.lineage_explorer.source_referenced, "SOURCE_PATTERN_UNRESOLVED", evidenceRefs),
    validationTest("proposal version verified", record?.response_version === "v1" && result.lineage_explorer.versioned, "PROPOSAL_VERSION_UNVERIFIED", evidenceRefs),
    validationTest("evidence integrity verified", result.evidence_workspace.evidence_state !== "SUSPECTED_TAMPERING" && result.evidence_workspace.evidence_refs.length > 0, "EVIDENCE_INTEGRITY_FAILED", evidenceRefs),
    validationTest("expected benefit supported", result.benefit_view.state === "VERIFIED" && result.benefit_view.supporting_evidence.length > 0, "EXPECTED_BENEFIT_UNSUPPORTED", evidenceRefs),
    validationTest("expected risk visible", result.risk_view.residual_risk.length > 0 && result.risk_view.unknown_risk_visible, "EXPECTED_RISK_MISSING", evidenceRefs),
    validationTest("simulation status verified", result.simulation_view.state !== "NOT_ASSESSED", "SIMULATION_STATUS_UNVERIFIED", evidenceRefs),
    validationTest("simulation progression safe", !result.simulation_view.progression_blocked, "SIMULATION_FAILED_OR_DIVERGED", evidenceRefs),
    validationTest("governance visible", result.governance_view.governance_outcome !== "NOT_ASSESSED", "GOVERNANCE_STATUS_UNAVAILABLE", evidenceRefs),
    validationTest("certification readiness calculated", result.certification_view.state !== "NOT_ASSESSED", "CERTIFICATION_READINESS_UNAVAILABLE", evidenceRefs),
    validationTest("conditional readiness not pass", result.certification_view.state !== "CONDITIONALLY_READY" && result.certification_view.ready_for_formal_certification, "CONDITIONAL_READINESS_MISREPRESENTED", evidenceRefs),
    validationTest("replay readiness visible", result.replay_view.state === "READY" && result.replay_view.integrity_hashes_verified, "REPLAY_READINESS_UNAVAILABLE", evidenceRefs),
    validationTest("rollback readiness visible", result.certification_view.rollback_ready, "ROLLBACK_READINESS_UNAVAILABLE", evidenceRefs),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.lineage_explorer.tenant_isolated, "TENANT_ISOLATION_VIOLATED", evidenceRefs),
    validationTest("affected scope determined", result.affected_scope_view.scope_state !== "UNDETERMINED" && result.affected_scope_view.progresses_beyond_preliminary_review, "AFFECTED_SCOPE_UNDETERMINED", evidenceRefs),
    validationTest("cross tenant scope blocked", !result.affected_scope_view.cross_tenant_blocked, "CROSS_TENANT_SCOPE_BLOCKED", evidenceRefs),
    validationTest("calculations deterministic", result.deterministic && result.proposal_queue.deterministic_ordering && result.comparison_workspace.normalization_explained, "CALCULATION_NONDETERMINISTIC", evidenceRefs),
    validationTest("response proposal visible", result.records.length > 0, "RESPONSE_PROPOSAL_HIDDEN", evidenceRefs),
    validationTest("rejected failed states retained", result.detail_view.rejected_failed_superseded_retained && result.proposal_queue.retained_terminal_states.includes("REJECTED"), "REJECTED_OR_FAILED_RESPONSE_HIDDEN", evidenceRefs),
    validationTest("restricted fields protected", result.records.every((item) => item.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidenceRefs),
    validationTest("no execution authority", !result.api_surface.execution_supported && !result.write_authority_granted, "EXECUTION_AUTHORITY_EXPOSED", evidenceRefs),
    validationTest("no approval bypass", !result.api_surface.automatic_approval_supported && record?.approval_refs.length !== 0, "APPROVAL_BYPASS_EXPOSED", evidenceRefs),
    validationTest("no certification bypass", !result.api_surface.certification_execution_supported, "CERTIFICATION_BYPASS_EXPOSED", evidenceRefs),
    validationTest("integrity hashes reproducible", result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidenceRefs),
  ]);
}

function resultReplayHash(result: Omit<ProposedResponseDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({ records: result.records.map((r) => r.integrity_hash), queue: result.proposal_queue.integrity_hash, detail: result.detail_view.integrity_hash, benefit: result.benefit_view.integrity_hash, risk: result.risk_view.integrity_hash, simulation: result.simulation_view.integrity_hash, governance: result.governance_view.integrity_hash, certification: result.certification_view.integrity_hash, replay: result.replay_view.integrity_hash, failures: result.failures });
}
function resultIntegrityHash(result: Omit<ProposedResponseDashboardResult, "integrity_hash">): string {
  return hash({ version: result.proposed_response_dashboard_version, id: result.dashboard_identifier, api: result.api_surface.integrity_hash, replay_hash: result.replay_hash, validation_outcome: result.validation_outcome });
}

export function buildProposedResponseDashboard(input: ProposedResponseDashboardInput = {}): ProposedResponseDashboardResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as ProposedResponseDashboardFailure] : []);
  const api_surface = apiSurface();
  const dashboardRecords = records(input, initialFailures);
  const record = dashboardRecords[0];
  const proposal_queue = queue(dashboardRecords, initialFailures);
  const detail_view = detail(record, initialFailures);
  const rationale_view = rationale(record);
  const benefit_view = benefit(record, initialFailures);
  const risk_view = risk(record, initialFailures);
  const affected_scope_view = scope(record, initialFailures);
  const simulation_view = simulation(record, initialFailures);
  const governance_view = governance(record, initialFailures);
  const certification_view = certification(record);
  const lineage_explorer = lineage(record);
  const evidence_workspace = evidence(record, initialFailures);
  const replay_view = replay(record, initialFailures);
  const comparison_workspace = comparison(initialFailures);
  const alert_center = alerts(initialFailures);
  const next_action_panel = nextPanel(initialFailures);
  const audit_records = audit(input, record, initialFailures);
  const baseWithoutValidation: BuildBase = {
    proposed_response_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    records: dashboardRecords,
    proposal_queue,
    detail_view,
    rationale_view,
    benefit_view,
    risk_view,
    affected_scope_view,
    simulation_view,
    governance_view,
    certification_view,
    lineage_explorer,
    evidence_workspace,
    replay_view,
    comparison_workspace,
    alert_center,
    next_action_panel,
    audit_records,
    widgets: WIDGETS,
    metrics: metrics(initialFailures),
    deterministic: !initialFailures.includes("CALCULATION_NONDETERMINISTIC"),
    replayable: !initialFailures.includes("REPLAY_READINESS_UNAVAILABLE"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED") && !initialFailures.includes("CROSS_TENANT_SCOPE_BLOCKED"),
    evidence_backed: !initialFailures.includes("EVIDENCE_INTEGRITY_FAILED") && !initialFailures.includes("EXPECTED_BENEFIT_UNSUPPORTED"),
    read_only: true,
    advisory_only: true,
    write_authority_granted: false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is ProposedResponseDashboardFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<ProposedResponseDashboardResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutValidation, status: failures.length ? "REJECTED" : "AUTHORITATIVE", validation_tests, validation_outcome, failures };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProposedResponseDashboard(result?: ProposedResponseDashboardResult): ProposedResponseDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<ProposedResponseDashboardFailure>(["RESPONSE_PROPOSAL_HIDDEN"]);
    const base: Omit<ProposedResponseDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = result.records.every((i) => hashWithoutIntegrity(i) === i.integrity_hash)
    && hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash
    && hashWithoutIntegrity(result.proposal_queue) === result.proposal_queue.integrity_hash
    && hashWithoutIntegrity(result.detail_view) === result.detail_view.integrity_hash
    && hashWithoutIntegrity(result.rationale_view) === result.rationale_view.integrity_hash
    && hashWithoutIntegrity(result.benefit_view) === result.benefit_view.integrity_hash
    && hashWithoutIntegrity(result.risk_view) === result.risk_view.integrity_hash
    && hashWithoutIntegrity(result.affected_scope_view) === result.affected_scope_view.integrity_hash
    && hashWithoutIntegrity(result.simulation_view) === result.simulation_view.integrity_hash
    && hashWithoutIntegrity(result.governance_view) === result.governance_view.integrity_hash
    && hashWithoutIntegrity(result.certification_view) === result.certification_view.integrity_hash
    && hashWithoutIntegrity(result.lineage_explorer) === result.lineage_explorer.integrity_hash
    && hashWithoutIntegrity(result.evidence_workspace) === result.evidence_workspace.integrity_hash
    && hashWithoutIntegrity(result.replay_view) === result.replay_view.integrity_hash
    && hashWithoutIntegrity(result.comparison_workspace) === result.comparison_workspace.integrity_hash
    && hashWithoutIntegrity(result.alert_center) === result.alert_center.integrity_hash
    && hashWithoutIntegrity(result.next_action_panel) === result.next_action_panel.integrity_hash
    && result.audit_records.every((i) => hashWithoutIntegrity(i) === i.integrity_hash)
    && hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash
    && result.validation_tests.every((i) => hashWithoutIntegrity(i) === i.integrity_hash);
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.mutation_supported && !result.api_surface.execution_supported && !result.api_surface.production_modification_supported && !result.api_surface.automatic_approval_supported && !result.api_surface.governance_bypass_supported && !result.api_surface.certification_execution_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<ProposedResponseDashboardValidationResult, "validation_hash"> = { dashboard_id: result.dashboard_identifier, valid, validation_outcome: result.validation_outcome, failures: result.failures, replay_hash_valid, integrity_hash_valid, read_only };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayProposedResponseDashboard(result: ProposedResponseDashboardResult): boolean {
  return validateProposedResponseDashboard(result).valid;
}

export function buildProposedResponseDashboardObservabilitySurface(result = buildProposedResponseDashboard()): ProposedResponseDashboardObservabilitySurface {
  return Object.freeze({ dashboard_id: result.dashboard_identifier, status: result.status, validation_outcome: result.validation_outcome, records: result.records.length, failed_tests: result.validation_tests.filter((test) => !test.passed).length, failures: result.failures, replayable: result.replayable, tenant_isolated: result.tenant_isolated, read_only: result.read_only && result.advisory_only && !result.write_authority_granted, integrity_hash: result.integrity_hash });
}

export function getProposedResponseDashboardContract(): ProposedResponseDashboardContract {
  const result = buildProposedResponseDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      response_types: RESPONSE_TYPES,
      response_statuses: RESPONSE_STATUSES,
      benefit_categories: BENEFIT_CATEGORIES,
      risk_categories: RISK_CATEGORIES,
      scope_states: SCOPE_STATES,
      simulation_states: SIMULATION_STATES,
      governance_outcomes: GOVERNANCE_OUTCOMES,
      certification_readiness_states: CERTIFICATION_STATES,
      replay_states: REPLAY_STATES,
      required_data_sources: freezeArray(["Pattern Intelligence Engine", "Pattern Registry", "Outcome Observation Engine", "Recommendation Effectiveness Engine", "Strategy Evolution Engine", "Confidence Adaptation Engine", "Risk Adaptation Engine", "Governance-Aware Adaptation Layer", "Operator Feedback Integration", "Adaptation Proposal Engine", "Adaptive Simulation Framework", "Drift Defense System", "Replay Engine", "Rollback Engine", "Truth Ledger", "Adaptive Intelligence Ledger", "Governance Decision Ledger", "Certification Ledger", "Evidence Registry", "Tenant Registry", "Mission Registry", "Policy Registry"]),
      advisory_only: true,
      read_only: true,
    }),
    result,
    validation: validateProposedResponseDashboard(result),
    observability: buildProposedResponseDashboardObservabilitySurface(result),
  });
}

export const ProposedResponseDashboard = Object.freeze({ build: buildProposedResponseDashboard, validate: validateProposedResponseDashboard, replay: replayProposedResponseDashboard });
