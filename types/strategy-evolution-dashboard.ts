import type { AdaptiveDashboardResult, DashboardRole } from "@/types/adaptive-dashboard-foundation";
import type { StrategyEvolutionCertificationResult } from "@/types/strategy-evolution-certification-gate";

export type StrategyDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type StrategyDashboardValidationOutcome = "VALID" | "INVALID";
export type StrategyProposalStatus = "DRAFT" | "EVIDENCE_PENDING" | "READY_FOR_ANALYSIS" | "GOVERNANCE_REVIEW_REQUIRED" | "CONSTITUTIONAL_REVIEW_REQUIRED" | "SIMULATION_REQUIRED" | "SIMULATION_IN_PROGRESS" | "SIMULATION_FAILED" | "OPERATOR_REVIEW_REQUIRED" | "GOVERNANCE_BLOCKED" | "APPROVED_FOR_CERTIFICATION" | "CERTIFICATION_PENDING" | "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "REJECTED" | "DEFERRED" | "SUPERSEDED" | "WITHDRAWN" | "ROLLBACK_REQUIRED";
export type StrategySimulationState = "NOT_REQUIRED" | "REQUIRED" | "QUEUED" | "PREPARING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "FAILED" | "DIVERGED" | "BLOCKED" | "REQUIRES_MORE_EVIDENCE";
export type StrategyApprovalState = "NOT_REQUIRED" | "PENDING" | "IN_REVIEW" | "APPROVED" | "CONDITIONALLY_APPROVED" | "REJECTED" | "ESCALATED" | "EXPIRED" | "SUPERSEDED";
export type StrategyCertificationOutcome = "UNASSESSED" | "EVIDENCE_PENDING" | "IN_PROGRESS" | "PASS" | "CONDITIONAL_PASS" | "FAIL" | "EXPIRED" | "REVOKED" | "SUPERSEDED";
export type StrategyReplayReadiness = "READY" | "PARTIAL" | "MISSING_REFERENCES" | "DIVERGED" | "INTEGRITY_FAILURE" | "UNAVAILABLE" | "BLOCKED";
export type StrategyRollbackStatus = "NOT_ASSESSED" | "PLAN_REQUIRED" | "PLAN_AVAILABLE" | "SIMULATION_REQUIRED" | "SIMULATION_IN_PROGRESS" | "READY" | "CONDITIONALLY_READY" | "NOT_READY" | "FAILED";
export type StrategyGovernanceOutcome = "COMPLIANT" | "CONDITIONALLY_COMPLIANT" | "REVIEW_REQUIRED" | "ESCALATION_REQUIRED" | "BLOCKED" | "CONSTITUTIONAL_CONFLICT" | "AUTHORITY_CONFLICT" | "INSUFFICIENT_EVIDENCE";
export type StrategyAlertSeverity = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type StrategyEvolutionWidget = "Proposal Queue" | "Strategy Comparison" | "Simulation Progress" | "Approval Progress" | "Expected Improvement" | "Historical Comparison" | "Expected Risk" | "Governance Implications" | "Replay Readiness" | "Rollback Readiness" | "Lineage Explorer" | "Alert Panel";

export type StrategyEvolutionDashboardScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "PROPOSAL_HIDDEN"
  | "PROPOSAL_DELETED"
  | "NONDETERMINISTIC_RENDERING"
  | "MISSING_EVIDENCE"
  | "MISSING_BENEFIT"
  | "MISSING_RISK"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_SIMULATION"
  | "MISSING_APPROVAL"
  | "MISSING_CERTIFICATION"
  | "CONDITIONAL_CERTIFICATION"
  | "MISSING_REPLAY"
  | "MISSING_ROLLBACK"
  | "HIDDEN_PROGRESS"
  | "UNAUTHORIZED_ROLE"
  | "TENANT_LEAK"
  | "RESTRICTED_FIELD_LEAK"
  | "INTEGRITY_FAILURE"
  | "WRITE_AUTHORITY_EXPOSED";

export type StrategyEvolutionDashboardFailure =
  | "DASHBOARD_FOUNDATION_UNAVAILABLE"
  | "STRATEGY_PROPOSAL_HIDDEN"
  | "STRATEGY_PROPOSAL_DELETED"
  | "STRATEGY_RENDERING_NONDETERMINISTIC"
  | "EVIDENCE_REFERENCE_BROKEN"
  | "EXPECTED_BENEFIT_UNSUPPORTED"
  | "EXPECTED_RISK_HIDDEN"
  | "GOVERNANCE_IMPLICATION_MISSING"
  | "CONSTITUTIONAL_IMPLICATION_MISSING"
  | "SIMULATION_STATUS_UNAVAILABLE"
  | "APPROVAL_STATUS_UNAVAILABLE"
  | "CERTIFICATION_STATUS_INCONSISTENT"
  | "CONDITIONAL_CERTIFICATION_MISREPRESENTED"
  | "REPLAY_READINESS_UNAVAILABLE"
  | "ROLLBACK_READINESS_UNAVAILABLE"
  | "HIDDEN_STRATEGIC_PROGRESSION"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "TENANT_ISOLATION_VIOLATED"
  | "RESTRICTED_FIELD_EXPOSED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DASHBOARD_WRITE_AUTHORITY_EXPOSED";

export type StrategyEvolutionDashboardRecord = Readonly<{
  dashboard_record_id: string;
  tenant_id: string;
  mission_scope: string;
  strategy_proposal_id: string;
  proposal_version: string;
  proposal_status: StrategyProposalStatus;
  strategy_domain: string;
  current_strategy_ref: string;
  proposed_strategy_ref: string;
  proposal_summary: string;
  proposal_rationale: string;
  supporting_pattern_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  expected_benefit: string;
  expected_risk: string;
  confidence_assessment: number;
  governance_implications: readonly string[];
  constitutional_implications: readonly string[];
  authority_implications: readonly string[];
  operator_implications: readonly string[];
  simulation_status: StrategySimulationState;
  simulation_refs: readonly string[];
  replay_status: StrategyReplayReadiness;
  replay_refs: readonly string[];
  approval_status: StrategyApprovalState;
  approval_refs: readonly string[];
  certification_status: StrategyCertificationOutcome;
  certification_refs: readonly string[];
  rollback_status: StrategyRollbackStatus;
  rollback_plan_ref: string;
  visible_to_roles: readonly DashboardRole[];
  restricted_fields: readonly string[];
  alerts: readonly string[];
  created_at: string;
  updated_at: string;
  integrity_hash: string;
}>;

export type StrategyProposalQueue = Readonly<{ queue_id: string; category_counts: readonly string[]; sorted_proposal_refs: readonly string[]; required_next_actions: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type StrategyProposalDetailView = Readonly<{ detail_id: string; proposal_ref: string; current_strategy: string; proposed_strategy: string; requested_change: string; assumptions: readonly string[]; known_uncertainties: readonly string[]; affected_missions: readonly string[]; affected_capabilities: readonly string[]; traceability_refs: readonly string[]; integrity_hash: string }>;
export type StrategyComparisonWorkspace = Readonly<{ comparison_id: string; current_strategy_ref: string; proposed_strategy_refs: readonly string[]; comparison_dimensions: readonly string[]; missing_evidence: readonly string[]; uncertainty_notes: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type ExpectedBenefitDashboard = Readonly<{ benefit_id: string; measurements: readonly string[]; baselines: readonly string[]; expected_targets: readonly string[]; confidence_level: number; supporting_evidence_refs: readonly string[]; simulation_validation_status: StrategySimulationState; uncertainty_range: string; integrity_hash: string }>;
export type ExpectedRiskDashboard = Readonly<{ risk_id: string; risk_categories: readonly string[]; likelihood: string; severity: string; confidence: number; mitigations: readonly string[]; residual_risk: string; affected_scope: readonly string[]; governance_requirements: readonly string[]; integrity_hash: string }>;
export type GovernanceImplicationView = Readonly<{ governance_id: string; outcome: StrategyGovernanceOutcome; applicable_policies: readonly string[]; required_approvals: readonly string[]; policy_conflicts: readonly string[]; constitutional_constraints: readonly string[]; authority_boundary_effects: readonly string[]; escalation_requirements: readonly string[]; blockers: readonly string[]; integrity_hash: string }>;
export type SimulationProgressView = Readonly<{ simulation_id: string; status: StrategySimulationState; scenario_set: readonly string[]; completed_scenarios: readonly string[]; remaining_scenarios: readonly string[]; deterministic_replay_status: StrategyReplayReadiness; expected_vs_simulated_results: readonly string[]; detected_regressions: readonly string[]; rollback_simulation_status: StrategyRollbackStatus; integrity_hash: string }>;
export type ApprovalProgressView = Readonly<{ approval_id: string; review_states: readonly string[]; approval_refs: readonly string[]; pending_reviews: readonly string[]; conditions: readonly string[]; rejections: readonly string[]; escalations: readonly string[]; silence_treated_as_approval: false; integrity_hash: string }>;
export type CertificationReadinessView = Readonly<{ certification_id: string; outcome: StrategyCertificationOutcome; completed_tests: readonly string[]; failed_tests: readonly string[]; conditional_findings: readonly string[]; unresolved_blockers: readonly string[]; production_ready: boolean; integrity_hash: string }>;
export type ReplayReadinessView = Readonly<{ replay_id: string; status: StrategyReplayReadiness; lifecycle_replay_refs: readonly string[]; deterministic_ordering: boolean; versioned_contracts: readonly string[]; lineage_complete: boolean; integrity_hash: string }>;
export type RollbackReadinessView = Readonly<{ rollback_id: string; status: StrategyRollbackStatus; rollback_plan_ref: string; rollback_trigger: string; rollback_authority: string; prerequisites: readonly string[]; rollback_risks: readonly string[]; historical_rollback_evidence: readonly string[]; integrity_hash: string }>;
export type HistoricalStrategyComparisonExplorer = Readonly<{ history_id: string; historical_strategy_versions: readonly string[]; previous_proposals: readonly string[]; past_approvals: readonly string[]; past_rejections: readonly string[]; prior_simulation_outcomes: readonly string[]; certification_history: readonly string[]; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type StrategyEvolutionAlertPanel = Readonly<{ alert_id: string; alerts: readonly string[]; highest_severity: StrategyAlertSeverity; critical_alerts_visible: boolean; integrity_hash: string }>;
export type StrategyProposalLineageExplorer = Readonly<{ lineage_id: string; originating_observations: readonly string[]; detected_patterns: readonly string[]; outcome_evidence: readonly string[]; recommendation_evidence: readonly string[]; governance_lineage: readonly string[]; simulation_lineage: readonly string[]; approval_lineage: readonly string[]; certification_lineage: readonly string[]; rollback_lineage: readonly string[]; integrity_hash: string }>;

export type StrategyDashboardPermission = Readonly<{ permission_id: string; role: DashboardRole; tenant_id: string; allowed: boolean; restricted_fields: readonly string[]; tenant_isolated: boolean; evidence_authorized: boolean; governance_authorized: boolean; replay_authorized: boolean; certification_authorized: boolean; integrity_hash: string }>;
export type StrategyDashboardMetrics = Readonly<{ proposal_sync_latency_ms: number; stale_proposal_records: number; missing_evidence_references: number; broken_simulation_links: number; missing_approval_records: number; replay_resolution_failures: number; rollback_status_inconsistencies: number; certification_status_inconsistencies: number; dashboard_rendering_failures: number; unauthorized_access_attempts: number; tenant_isolation_violations: number; integrity_verification_failures: number; hidden_state_discrepancies: number; integrity_hash: string }>;
export type StrategyDashboardValidationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: StrategyEvolutionDashboardFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type StrategyEvolutionDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /strategy-evolution-dashboard/dashboard";
  retrieve_contract: "GET /strategy-evolution-dashboard/contract";
  retrieve_queue: "POST /strategy-evolution-dashboard/queue";
  retrieve_detail: "POST /strategy-evolution-dashboard/detail";
  retrieve_comparison: "POST /strategy-evolution-dashboard/comparison";
  retrieve_benefit: "POST /strategy-evolution-dashboard/benefit";
  retrieve_risk: "POST /strategy-evolution-dashboard/risk";
  retrieve_governance: "POST /strategy-evolution-dashboard/governance";
  retrieve_simulation: "POST /strategy-evolution-dashboard/simulation";
  retrieve_approval: "POST /strategy-evolution-dashboard/approval";
  retrieve_certification: "POST /strategy-evolution-dashboard/certification";
  retrieve_replay: "POST /strategy-evolution-dashboard/replay";
  retrieve_rollback: "POST /strategy-evolution-dashboard/rollback";
  retrieve_history: "POST /strategy-evolution-dashboard/history";
  retrieve_alerts: "POST /strategy-evolution-dashboard/alerts";
  retrieve_lineage: "POST /strategy-evolution-dashboard/lineage";
  validate_dashboard: "POST /strategy-evolution-dashboard/validate";
  inspect_dashboard: "POST /strategy-evolution-dashboard/inspect";
  creation_supported: false;
  mutation_supported: false;
  strategy_mutation_supported: false;
  proposal_approval_supported: false;
  simulation_execution_supported: false;
  certification_mutation_supported: false;
  rollback_execution_supported: false;
  production_promotion_supported: false;
  integrity_hash: string;
}>;

export type StrategyEvolutionDashboardInput = Readonly<{ scenario?: StrategyEvolutionDashboardScenario; role?: DashboardRole; tenant_id?: string }>;

export type StrategyEvolutionDashboardResult = Readonly<{
  strategy_evolution_dashboard_version: "strategy-evolution-dashboard/v10.14.5";
  dashboard_identifier: "StrategyEvolutionDashboard";
  status: StrategyDashboardStatus;
  api_surface: StrategyEvolutionDashboardApiSurface;
  dashboard_foundation: AdaptiveDashboardResult;
  certification_result: StrategyEvolutionCertificationResult;
  records: readonly StrategyEvolutionDashboardRecord[];
  proposal_queue: StrategyProposalQueue;
  detail_view: StrategyProposalDetailView;
  comparison_workspace: StrategyComparisonWorkspace;
  benefit_dashboard: ExpectedBenefitDashboard;
  risk_dashboard: ExpectedRiskDashboard;
  governance_view: GovernanceImplicationView;
  simulation_view: SimulationProgressView;
  approval_view: ApprovalProgressView;
  certification_view: CertificationReadinessView;
  replay_view: ReplayReadinessView;
  rollback_view: RollbackReadinessView;
  historical_explorer: HistoricalStrategyComparisonExplorer;
  alert_panel: StrategyEvolutionAlertPanel;
  lineage_explorer: StrategyProposalLineageExplorer;
  permissions: readonly StrategyDashboardPermission[];
  widgets: readonly StrategyEvolutionWidget[];
  metrics: StrategyDashboardMetrics;
  validation_tests: readonly StrategyDashboardValidationTest[];
  validation_outcome: StrategyDashboardValidationOutcome;
  failures: readonly StrategyEvolutionDashboardFailure[];
  deterministic: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  simulation_visible: boolean;
  approval_visible: boolean;
  certification_visible: boolean;
  rollback_visible: boolean;
  read_only: true;
  advisory_only: true;
  write_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategyEvolutionDashboardValidationResult = Readonly<{ dashboard_id: string | null; valid: boolean; validation_outcome: StrategyDashboardValidationOutcome; failures: readonly StrategyEvolutionDashboardFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; read_only: boolean; validation_hash: string }>;
export type StrategyEvolutionDashboardObservabilitySurface = Readonly<{ dashboard_id: string; status: StrategyDashboardStatus; validation_outcome: StrategyDashboardValidationOutcome; proposals: number; failed_tests: number; failures: readonly StrategyEvolutionDashboardFailure[]; replayable: boolean; tenant_isolated: boolean; read_only: boolean; integrity_hash: string }>;
export type StrategyEvolutionDashboardContract = Readonly<{ doctrine: Readonly<{ version: "strategy-evolution-dashboard/v10.14.5"; widgets: readonly StrategyEvolutionWidget[]; proposal_statuses: readonly StrategyProposalStatus[]; navigation_dimensions: readonly string[]; required_data_sources: readonly string[]; read_only: true; advisory_only: true }>; result: StrategyEvolutionDashboardResult; validation: StrategyEvolutionDashboardValidationResult; observability: StrategyEvolutionDashboardObservabilitySurface }>;
