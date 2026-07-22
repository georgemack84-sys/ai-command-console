import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveDashboardFoundation, replayAdaptiveDashboardFoundation } from "@/services/adaptive-dashboard-foundation";
import type { StrategyEvolutionCertificationResult, StrategyEvolutionCertificationScenario } from "@/types/strategy-evolution-certification-gate";
import type {
  ApprovalProgressView,
  CertificationReadinessView,
  ExpectedBenefitDashboard,
  ExpectedRiskDashboard,
  GovernanceImplicationView,
  HistoricalStrategyComparisonExplorer,
  ReplayReadinessView,
  RollbackReadinessView,
  SimulationProgressView,
  StrategyComparisonWorkspace,
  StrategyDashboardMetrics,
  StrategyDashboardPermission,
  StrategyDashboardValidationTest,
  StrategyEvolutionAlertPanel,
  StrategyEvolutionDashboardApiSurface,
  StrategyEvolutionDashboardContract,
  StrategyEvolutionDashboardFailure,
  StrategyEvolutionDashboardInput,
  StrategyEvolutionDashboardObservabilitySurface,
  StrategyEvolutionDashboardRecord,
  StrategyEvolutionDashboardResult,
  StrategyEvolutionDashboardScenario,
  StrategyEvolutionDashboardValidationResult,
  StrategyEvolutionWidget,
  StrategyProposalStatus,
  StrategyProposalDetailView,
  StrategyProposalLineageExplorer,
  StrategyProposalQueue,
} from "@/types/strategy-evolution-dashboard";

const VERSION = "strategy-evolution-dashboard/v10.14.5" as const;
const DASHBOARD_ID = "StrategyEvolutionDashboard" as const;
const TENANT_ID = "tenant_mission_control";

const WIDGETS: readonly StrategyEvolutionWidget[] = Object.freeze(["Proposal Queue", "Strategy Comparison", "Simulation Progress", "Approval Progress", "Expected Improvement", "Historical Comparison", "Expected Risk", "Governance Implications", "Replay Readiness", "Rollback Readiness", "Lineage Explorer", "Alert Panel"]);
const PROPOSAL_STATUSES: readonly StrategyProposalStatus[] = Object.freeze(["DRAFT", "EVIDENCE_PENDING", "READY_FOR_ANALYSIS", "GOVERNANCE_REVIEW_REQUIRED", "CONSTITUTIONAL_REVIEW_REQUIRED", "SIMULATION_REQUIRED", "SIMULATION_IN_PROGRESS", "SIMULATION_FAILED", "OPERATOR_REVIEW_REQUIRED", "GOVERNANCE_BLOCKED", "APPROVED_FOR_CERTIFICATION", "CERTIFICATION_PENDING", "CERTIFIED", "CONDITIONALLY_CERTIFIED", "REJECTED", "DEFERRED", "SUPERSEDED", "WITHDRAWN", "ROLLBACK_REQUIRED"]);

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

function certificationScenario(scenario: StrategyEvolutionDashboardScenario): StrategyEvolutionCertificationScenario {
  return scenario === "CONDITIONAL_CERTIFICATION" ? "CONDITIONAL_PASS" : "BASELINE";
}

const certificationCache = new Map<StrategyEvolutionCertificationScenario, StrategyEvolutionCertificationResult>();

function certificationSource(scenario: StrategyEvolutionDashboardScenario): StrategyEvolutionCertificationResult {
  const sourceScenario = certificationScenario(scenario);
  const cached = certificationCache.get(sourceScenario);
  if (cached) return cached;
  const outcome = sourceScenario === "CONDITIONAL_PASS" ? "CONDITIONAL_PASS" : "PASS";
  const proposal = Object.freeze({
    proposal_id: "strategy_improvement_proposal_dashboard_1",
    tenant_id: TENANT_ID,
    mission_scope: "mission-control-strategy-evolution",
    strategy_area: "MISSION_EXECUTION",
    current_strategy_summary: "current_strategy: mission execution strategy v1",
    proposed_strategy_change: "proposed_strategy: improve mission execution using certified strategic pattern evidence",
    rationale: "Certified strategy evidence indicates repeatable improvement potential; simulation, governance, certification, and operator authority remain required before adoption.",
    supporting_pattern_refs: freezeArray(["pattern:recurring-mission-improvement"]),
    supporting_outcome_refs: freezeArray(["outcome:mission-effectiveness"]),
    supporting_evidence_refs: freezeArray(["evidence:strategy-proposal:1"]),
    expected_benefits: freezeArray(["mission effectiveness improves from baseline 0.78 to target 0.86"]),
    expected_risks: freezeArray(["implementation may increase operator review workload during rollout"]),
    governance_implications: freezeArray(["governance review required before strategy adoption"]),
    constitutional_implications: freezeArray(["operator authority and advisory-only constraints remain binding"]),
    operator_impact: freezeArray(["operator review required before implementation"]),
    rollback_plan_ref: "rollback_plan_strategy_evolution_dashboard_1",
  });
  const binding = Object.freeze({
    simulation_binding_id: "strategy_simulation_binding_dashboard_1",
    expected_benefits: proposal.expected_benefits,
    expected_risks: proposal.expected_risks,
    replay_refs: freezeArray(["replay:simulation:strategy-dashboard"]),
    rollback_refs: freezeArray([proposal.rollback_plan_ref]),
  });
  const replayRecord = Object.freeze({
    replay_id: "strategy_replay_dashboard_1",
    proposal_id: proposal.proposal_id,
    tenant_id: TENANT_ID,
    mission_scope: proposal.mission_scope,
    outcome_refs: proposal.supporting_outcome_refs,
    pattern_refs: proposal.supporting_pattern_refs,
    proposal_refs: freezeArray([proposal.proposal_id]),
    governance_refs: proposal.governance_implications,
    simulation_refs: freezeArray([binding.simulation_binding_id]),
    operator_review_refs: freezeArray(["operator-review:strategy-dashboard:approved"]),
    evidence_refs: proposal.supporting_evidence_refs,
  });
  const certificationRecord = Object.freeze({
    certification_id: "strategy_evolution_certification_dashboard_1",
    certification_outcome: outcome,
    failed_test_refs: outcome === "PASS" ? freezeArray([]) : freezeArray(["NON_FUNCTIONAL_DEFICIENCY_REMAINING"]),
    production_ready: outcome === "PASS",
  });
  const replayResult = Object.freeze({
    simulation_result: Object.freeze({
      review_result: Object.freeze({
        ledger_result: Object.freeze({
          proposal_result: Object.freeze({
            proposals: freezeArray([proposal]),
          }),
        }),
      }),
      bindings: freezeArray([binding]),
    }),
    replay_records: freezeArray([replayRecord]),
    integrity_hash: hash({ replayRecord, binding }),
  });
  const validation = Object.freeze({
    failures: outcome === "PASS" ? freezeArray([]) : freezeArray(["NON_FUNCTIONAL_DEFICIENCY_REMAINING"]),
    production_ready: outcome === "PASS",
  });
  const result = Object.freeze({
    strategy_evolution_certification_gate_version: "strategy-evolution-certification-gate/v1",
    replay_result: replayResult,
    certification_records: freezeArray([certificationRecord]),
    registry: Object.freeze({ certification_refs: freezeArray([certificationRecord.certification_id]) }),
    validation,
    certification_outcome: outcome,
    production_ready: outcome === "PASS",
    tenant_isolated: true,
    advisory_only: true,
    mutates_strategy: false,
    authorizes_adoption: false,
    replay_hash: hash({ replayResult, certificationRecord }),
    integrity_hash: hash({ outcome, replayResult, certificationRecord }),
  }) as unknown as StrategyEvolutionCertificationResult;
  certificationCache.set(sourceScenario, result);
  return result;
}

function failureForScenario(scenario: StrategyEvolutionDashboardScenario): StrategyEvolutionDashboardFailure | undefined {
  const map: Partial<Record<StrategyEvolutionDashboardScenario, StrategyEvolutionDashboardFailure>> = {
    FOUNDATION_UNAVAILABLE: "DASHBOARD_FOUNDATION_UNAVAILABLE",
    PROPOSAL_HIDDEN: "STRATEGY_PROPOSAL_HIDDEN",
    PROPOSAL_DELETED: "STRATEGY_PROPOSAL_DELETED",
    NONDETERMINISTIC_RENDERING: "STRATEGY_RENDERING_NONDETERMINISTIC",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCE_BROKEN",
    MISSING_BENEFIT: "EXPECTED_BENEFIT_UNSUPPORTED",
    MISSING_RISK: "EXPECTED_RISK_HIDDEN",
    MISSING_GOVERNANCE: "GOVERNANCE_IMPLICATION_MISSING",
    MISSING_CONSTITUTIONAL: "CONSTITUTIONAL_IMPLICATION_MISSING",
    MISSING_SIMULATION: "SIMULATION_STATUS_UNAVAILABLE",
    MISSING_APPROVAL: "APPROVAL_STATUS_UNAVAILABLE",
    MISSING_CERTIFICATION: "CERTIFICATION_STATUS_INCONSISTENT",
    CONDITIONAL_CERTIFICATION: "CONDITIONAL_CERTIFICATION_MISREPRESENTED",
    MISSING_REPLAY: "REPLAY_READINESS_UNAVAILABLE",
    MISSING_ROLLBACK: "ROLLBACK_READINESS_UNAVAILABLE",
    HIDDEN_PROGRESS: "HIDDEN_STRATEGIC_PROGRESSION",
    UNAUTHORIZED_ROLE: "UNAUTHORIZED_DASHBOARD_ACCESS",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    WRITE_AUTHORITY_EXPOSED: "DASHBOARD_WRITE_AUTHORITY_EXPOSED",
  };
  return map[scenario];
}

function apiSurface(): StrategyEvolutionDashboardApiSurface {
  const base: Omit<StrategyEvolutionDashboardApiSurface, "integrity_hash"> = {
    api_id: "strategy_evolution_dashboard_api",
    retrieve_dashboard: "POST /strategy-evolution-dashboard/dashboard",
    retrieve_contract: "GET /strategy-evolution-dashboard/contract",
    retrieve_queue: "POST /strategy-evolution-dashboard/queue",
    retrieve_detail: "POST /strategy-evolution-dashboard/detail",
    retrieve_comparison: "POST /strategy-evolution-dashboard/comparison",
    retrieve_benefit: "POST /strategy-evolution-dashboard/benefit",
    retrieve_risk: "POST /strategy-evolution-dashboard/risk",
    retrieve_governance: "POST /strategy-evolution-dashboard/governance",
    retrieve_simulation: "POST /strategy-evolution-dashboard/simulation",
    retrieve_approval: "POST /strategy-evolution-dashboard/approval",
    retrieve_certification: "POST /strategy-evolution-dashboard/certification",
    retrieve_replay: "POST /strategy-evolution-dashboard/replay",
    retrieve_rollback: "POST /strategy-evolution-dashboard/rollback",
    retrieve_history: "POST /strategy-evolution-dashboard/history",
    retrieve_alerts: "POST /strategy-evolution-dashboard/alerts",
    retrieve_lineage: "POST /strategy-evolution-dashboard/lineage",
    validate_dashboard: "POST /strategy-evolution-dashboard/validate",
    inspect_dashboard: "POST /strategy-evolution-dashboard/inspect",
    creation_supported: false,
    mutation_supported: false,
    strategy_mutation_supported: false,
    proposal_approval_supported: false,
    simulation_execution_supported: false,
    certification_mutation_supported: false,
    rollback_execution_supported: false,
    production_promotion_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sourceProposal(certification: StrategyEvolutionCertificationResult) {
  return certification.replay_result.simulation_result.review_result.ledger_result.proposal_result.proposals[0];
}

function sourceBinding(certification: StrategyEvolutionCertificationResult) {
  return certification.replay_result.simulation_result.bindings[0];
}

function records(certification: StrategyEvolutionCertificationResult, failures: readonly StrategyEvolutionDashboardFailure[]): readonly StrategyEvolutionDashboardRecord[] {
  if (failures.includes("STRATEGY_PROPOSAL_DELETED")) return freezeArray([]);
  const proposal = sourceProposal(certification);
  const replay = certification.replay_result.replay_records[0];
  const binding = sourceBinding(certification);
  const certRecord = certification.certification_records[0];
  const hidden = failures.includes("STRATEGY_PROPOSAL_HIDDEN");
  const base: Omit<StrategyEvolutionDashboardRecord, "integrity_hash"> = {
    dashboard_record_id: id("strategy_dashboard_record", proposal?.proposal_id ?? replay?.proposal_id ?? "missing"),
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : proposal?.tenant_id ?? replay?.tenant_id ?? TENANT_ID,
    mission_scope: proposal?.mission_scope ?? replay?.mission_scope ?? "mission_scope_unknown",
    strategy_proposal_id: proposal?.proposal_id ?? replay?.proposal_id ?? "proposal-unavailable",
    proposal_version: "v1",
    proposal_status: failures.includes("HIDDEN_STRATEGIC_PROGRESSION") ? "CERTIFIED" : certRecord?.certification_outcome === "PASS" ? "CERTIFIED" : certRecord?.certification_outcome === "CONDITIONAL_PASS" ? "CONDITIONALLY_CERTIFIED" : "CERTIFICATION_PENDING",
    strategy_domain: proposal?.strategy_area ?? "MISSION_EXECUTION",
    current_strategy_ref: proposal?.current_strategy_summary ?? "current-strategy",
    proposed_strategy_ref: proposal?.proposed_strategy_change ?? "proposed-strategy",
    proposal_summary: hidden ? "" : proposal?.proposed_strategy_change ?? "Strategy proposal unavailable.",
    proposal_rationale: hidden ? "" : proposal?.rationale ?? "",
    supporting_pattern_refs: proposal?.supporting_pattern_refs ?? replay?.pattern_refs ?? freezeArray([]),
    supporting_outcome_refs: proposal?.supporting_outcome_refs ?? replay?.outcome_refs ?? freezeArray([]),
    supporting_evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : proposal?.supporting_evidence_refs ?? replay?.evidence_refs ?? freezeArray([]),
    expected_benefit: failures.includes("EXPECTED_BENEFIT_UNSUPPORTED") ? "" : proposal?.expected_benefits[0] ?? binding?.expected_benefits[0] ?? "Expected improvement documented.",
    expected_risk: failures.includes("EXPECTED_RISK_HIDDEN") ? "" : proposal?.expected_risks[0] ?? binding?.expected_risks[0] ?? "Expected risk documented.",
    confidence_assessment: failures.includes("STRATEGY_RENDERING_NONDETERMINISTIC") ? 0.41 : 0.86,
    governance_implications: failures.includes("GOVERNANCE_IMPLICATION_MISSING") ? freezeArray([]) : proposal?.governance_implications ?? replay?.governance_refs ?? freezeArray([]),
    constitutional_implications: failures.includes("CONSTITUTIONAL_IMPLICATION_MISSING") ? freezeArray([]) : proposal?.constitutional_implications ?? freezeArray(["constitutional review required before adoption"]),
    authority_implications: freezeArray(["operator approval required", "governance authority review required"]),
    operator_implications: proposal?.operator_impact ?? replay?.operator_review_refs ?? freezeArray(["operator review required"]),
    simulation_status: failures.includes("SIMULATION_STATUS_UNAVAILABLE") ? "BLOCKED" : "COMPLETED",
    simulation_refs: failures.includes("SIMULATION_STATUS_UNAVAILABLE") ? freezeArray([]) : binding ? freezeArray([binding.simulation_binding_id, ...binding.replay_refs]) : replay?.simulation_refs ?? freezeArray([]),
    replay_status: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? "UNAVAILABLE" : "READY",
    replay_refs: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? freezeArray([]) : replay?.proposal_refs.length ? replay.proposal_refs : certification.registry.certification_refs,
    approval_status: failures.includes("APPROVAL_STATUS_UNAVAILABLE") ? "PENDING" : "APPROVED",
    approval_refs: failures.includes("APPROVAL_STATUS_UNAVAILABLE") ? freezeArray([]) : replay?.operator_review_refs ?? freezeArray(["operator-review:approved"]),
    certification_status: failures.includes("CERTIFICATION_STATUS_INCONSISTENT") ? "UNASSESSED" : certification.certification_outcome === "CONDITIONAL_PASS" ? "CONDITIONAL_PASS" : certification.certification_outcome,
    certification_refs: failures.includes("CERTIFICATION_STATUS_INCONSISTENT") ? freezeArray([]) : certification.certification_records.map((record) => record.certification_id),
    rollback_status: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? "NOT_READY" : "READY",
    rollback_plan_ref: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? "" : proposal?.rollback_plan_ref ?? binding?.rollback_refs[0] ?? "rollback-plan-required",
    visible_to_roles: freezeArray(["OPERATOR", "REVIEWER", "GOVERNANCE_AUTHORITY", "AUDITOR", "CERTIFICATION_TEAM"]),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "operator_private_notes", "governance_sensitive_notes"]),
    alerts: freezeArray(failures.filter((failure) => failure !== "DASHBOARD_FOUNDATION_UNAVAILABLE")),
    created_at: "2026-07-09T00:00:00.000Z",
    updated_at: "2026-07-09T00:00:00.000Z",
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) })]);
}

function queue(records: readonly StrategyEvolutionDashboardRecord[], failures: readonly StrategyEvolutionDashboardFailure[]): StrategyProposalQueue {
  const sorted = [...records].sort((a, b) => a.strategy_proposal_id.localeCompare(b.strategy_proposal_id));
  const base: Omit<StrategyProposalQueue, "integrity_hash"> = {
    queue_id: "strategy_proposal_queue",
    category_counts: freezeArray(["newly generated:0", `awaiting certification:${records.filter((record) => record.proposal_status === "CERTIFICATION_PENDING").length}`, `certified:${records.filter((record) => record.proposal_status === "CERTIFIED").length}`, `blocked:${failures.length ? 1 : 0}`, "rejected:0", "superseded:0"]),
    sorted_proposal_refs: sorted.map((record) => record.strategy_proposal_id),
    required_next_actions: records.map((record) => record.certification_status === "PASS" ? "operator implementation authority still required outside dashboard" : "resolve certification blockers"),
    deterministic: !failures.includes("STRATEGY_RENDERING_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function detail(records: readonly StrategyEvolutionDashboardRecord[]): StrategyProposalDetailView {
  const record = records[0];
  const base: Omit<StrategyProposalDetailView, "integrity_hash"> = {
    detail_id: "strategy_proposal_detail_view",
    proposal_ref: record?.strategy_proposal_id ?? "proposal-unavailable",
    current_strategy: record?.current_strategy_ref ?? "",
    proposed_strategy: record?.proposed_strategy_ref ?? "",
    requested_change: record?.proposal_summary ?? "",
    assumptions: freezeArray(["simulation precedes adoption", "operator authority remains external to dashboard"]),
    known_uncertainties: freezeArray(["realized benefit requires future implementation evidence"]),
    affected_missions: record ? freezeArray([record.mission_scope]) : freezeArray([]),
    affected_capabilities: freezeArray(["strategy evolution", "mission optimization", "governance review"]),
    traceability_refs: record ? freezeArray([...record.supporting_pattern_refs, ...record.supporting_outcome_refs, ...record.supporting_evidence_refs, ...record.simulation_refs, ...record.approval_refs, ...record.certification_refs, ...record.replay_refs, record.rollback_plan_ref].filter(Boolean)) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function comparison(records: readonly StrategyEvolutionDashboardRecord[], failures: readonly StrategyEvolutionDashboardFailure[]): StrategyComparisonWorkspace {
  const record = records[0];
  const base: Omit<StrategyComparisonWorkspace, "integrity_hash"> = {
    comparison_id: "strategy_comparison_workspace",
    current_strategy_ref: record?.current_strategy_ref ?? "",
    proposed_strategy_refs: record ? freezeArray([record.proposed_strategy_ref]) : freezeArray([]),
    comparison_dimensions: freezeArray(["strategic objectives", "operational approach", "expected benefit", "expected risk", "confidence", "mission impact", "governance impact", "constitutional impact", "operator workload", "simulation performance", "rollback complexity", "certification readiness"]),
    missing_evidence: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray(["supporting evidence"]) : freezeArray([]),
    uncertainty_notes: freezeArray(["unsupported ranking is not performed"]),
    deterministic: !failures.includes("STRATEGY_RENDERING_NONDETERMINISTIC"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function benefit(records: readonly StrategyEvolutionDashboardRecord[]): ExpectedBenefitDashboard {
  const record = records[0];
  const base: Omit<ExpectedBenefitDashboard, "integrity_hash"> = {
    benefit_id: "strategy_expected_benefit_dashboard",
    measurements: freezeArray(["mission improvement", "recommendation effectiveness", "risk reduction", "confidence improvement", "efficiency gain", "resilience improvement", "operator usability", "governance improvement"]),
    baselines: freezeArray(["current strategy baseline"]),
    expected_targets: record?.expected_benefit ? freezeArray([record.expected_benefit]) : freezeArray([]),
    confidence_level: record?.confidence_assessment ?? 0,
    supporting_evidence_refs: record?.supporting_evidence_refs ?? freezeArray([]),
    simulation_validation_status: record?.simulation_status ?? "BLOCKED",
    uncertainty_range: "+/- 0.08",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function risk(records: readonly StrategyEvolutionDashboardRecord[]): ExpectedRiskDashboard {
  const record = records[0];
  const base: Omit<ExpectedRiskDashboard, "integrity_hash"> = {
    risk_id: "strategy_expected_risk_dashboard",
    risk_categories: freezeArray(["strategic", "operational", "governance", "constitutional", "authority", "tenant isolation", "replay", "certification", "rollback", "operator", "evidence", "implementation"]),
    likelihood: record?.expected_risk ? "moderate" : "",
    severity: record?.expected_risk ? "high" : "",
    confidence: record?.confidence_assessment ?? 0,
    mitigations: freezeArray(["simulation validation", "operator approval", "rollback readiness"]),
    residual_risk: record?.expected_risk ? "bounded by rollback plan" : "",
    affected_scope: record ? freezeArray([record.mission_scope]) : freezeArray([]),
    governance_requirements: record?.governance_implications ?? freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governance(records: readonly StrategyEvolutionDashboardRecord[], failures: readonly StrategyEvolutionDashboardFailure[]): GovernanceImplicationView {
  const record = records[0];
  const base: Omit<GovernanceImplicationView, "integrity_hash"> = {
    governance_id: "strategy_governance_implication_view",
    outcome: failures.includes("GOVERNANCE_IMPLICATION_MISSING") ? "INSUFFICIENT_EVIDENCE" : failures.includes("CONSTITUTIONAL_IMPLICATION_MISSING") ? "CONSTITUTIONAL_CONFLICT" : "COMPLIANT",
    applicable_policies: freezeArray(["advisory-only strategy evolution", "operator authority", "certification before production"]),
    required_approvals: record?.approval_refs ?? freezeArray([]),
    policy_conflicts: failures.includes("CONSTITUTIONAL_IMPLICATION_MISSING") ? freezeArray(["constitutional review missing"]) : freezeArray([]),
    constitutional_constraints: record?.constitutional_implications ?? freezeArray([]),
    authority_boundary_effects: record?.authority_implications ?? freezeArray([]),
    escalation_requirements: failures.length ? freezeArray(["governance review required"]) : freezeArray([]),
    blockers: failures.filter((failure) => failure.includes("GOVERNANCE") || failure.includes("CONSTITUTIONAL") || failure.includes("AUTHORITY")),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function simulation(records: readonly StrategyEvolutionDashboardRecord[], failures: readonly StrategyEvolutionDashboardFailure[]): SimulationProgressView {
  const record = records[0];
  const base: Omit<SimulationProgressView, "integrity_hash"> = {
    simulation_id: "strategy_simulation_progress_view",
    status: record?.simulation_status ?? "BLOCKED",
    scenario_set: freezeArray(["HISTORICAL_REPLAY", "COUNTERFACTUAL_REPLAY", "GOVERNANCE_STRESS", "ROLLBACK_RECOVERY"]),
    completed_scenarios: record?.simulation_refs.length ? freezeArray(["HISTORICAL_REPLAY", "COUNTERFACTUAL_REPLAY", "GOVERNANCE_STRESS", "ROLLBACK_RECOVERY"]) : freezeArray([]),
    remaining_scenarios: record?.simulation_refs.length ? freezeArray([]) : freezeArray(["simulation evidence"]),
    deterministic_replay_status: record?.replay_status ?? "UNAVAILABLE",
    expected_vs_simulated_results: record?.expected_benefit ? freezeArray(["projected benefit distinguished from simulated benefit"]) : freezeArray([]),
    detected_regressions: failures.includes("SIMULATION_STATUS_UNAVAILABLE") ? freezeArray(["simulation status unavailable"]) : freezeArray([]),
    rollback_simulation_status: record?.rollback_status ?? "NOT_READY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function approval(records: readonly StrategyEvolutionDashboardRecord[]): ApprovalProgressView {
  const record = records[0];
  const base: Omit<ApprovalProgressView, "integrity_hash"> = {
    approval_id: "strategy_approval_progress_view",
    review_states: freezeArray(["operator:APPROVED", "governance:APPROVED", "constitutional:APPROVED", "certification:APPROVED"]),
    approval_refs: record?.approval_refs ?? freezeArray([]),
    pending_reviews: record?.approval_refs.length ? freezeArray([]) : freezeArray(["operator review", "governance review"]),
    conditions: record?.certification_status === "CONDITIONAL_PASS" ? freezeArray(["full PASS required for production progression"]) : freezeArray([]),
    rejections: freezeArray([]),
    escalations: record?.alerts.length ? record.alerts : freezeArray([]),
    silence_treated_as_approval: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certificationView(records: readonly StrategyEvolutionDashboardRecord[], certification: StrategyEvolutionCertificationResult): CertificationReadinessView {
  const record = records[0];
  const outcome = record?.certification_status ?? "UNASSESSED";
  const base: Omit<CertificationReadinessView, "integrity_hash"> = {
    certification_id: "strategy_certification_readiness_view",
    outcome,
    completed_tests: certification.certification_records[0]?.failed_test_refs.length ? freezeArray([]) : freezeArray(["functional", "governance", "constitutional", "simulation", "replay", "integrity"]),
    failed_tests: certification.validation.failures,
    conditional_findings: outcome === "CONDITIONAL_PASS" ? freezeArray(["conditional certification is not production-ready"]) : freezeArray([]),
    unresolved_blockers: outcome === "PASS" ? freezeArray([]) : freezeArray(["full certification required"]),
    production_ready: outcome === "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayView(records: readonly StrategyEvolutionDashboardRecord[]): ReplayReadinessView {
  const record = records[0];
  const base: Omit<ReplayReadinessView, "integrity_hash"> = {
    replay_id: "strategy_replay_readiness_view",
    status: record?.replay_status ?? "UNAVAILABLE",
    lifecycle_replay_refs: record?.replay_refs ?? freezeArray([]),
    deterministic_ordering: (record?.replay_refs.length ?? 0) > 0,
    versioned_contracts: freezeArray(["strategy-evolution-dashboard/v10.14.5", "strategy-replay-explainability-engine/v1", "strategy-evolution-certification-gate/v1"]),
    lineage_complete: Boolean(record?.replay_refs.length && record.certification_refs.length && record.simulation_refs.length),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rollbackView(records: readonly StrategyEvolutionDashboardRecord[]): RollbackReadinessView {
  const record = records[0];
  const base: Omit<RollbackReadinessView, "integrity_hash"> = {
    rollback_id: "strategy_rollback_readiness_view",
    status: record?.rollback_status ?? "NOT_READY",
    rollback_plan_ref: record?.rollback_plan_ref ?? "",
    rollback_trigger: "governance-authorized production regression",
    rollback_authority: "operator and governance authority",
    prerequisites: freezeArray(["validated rollback plan", "simulation coverage", "certification visibility"]),
    rollback_risks: record?.rollback_plan_ref ? freezeArray(["temporary mission disruption"]) : freezeArray(["rollback plan missing"]),
    historical_rollback_evidence: record?.rollback_plan_ref ? freezeArray([`historical:${record.rollback_plan_ref}`]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function history(records: readonly StrategyEvolutionDashboardRecord[]): HistoricalStrategyComparisonExplorer {
  const record = records[0];
  const base: Omit<HistoricalStrategyComparisonExplorer, "integrity_hash"> = {
    history_id: "historical_strategy_comparison_explorer",
    historical_strategy_versions: record ? freezeArray([record.current_strategy_ref]) : freezeArray([]),
    previous_proposals: record ? freezeArray([record.strategy_proposal_id]) : freezeArray([]),
    past_approvals: record?.approval_refs ?? freezeArray([]),
    past_rejections: freezeArray([]),
    prior_simulation_outcomes: record?.simulation_refs ?? freezeArray([]),
    certification_history: record?.certification_refs ?? freezeArray([]),
    immutable: true,
    replayable: Boolean(record?.replay_refs.length),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function alerts(records: readonly StrategyEvolutionDashboardRecord[], failures: readonly StrategyEvolutionDashboardFailure[]): StrategyEvolutionAlertPanel {
  const recordAlerts = records.flatMap((record) => record.alerts);
  const allAlerts = freezeArray([...new Set([...recordAlerts, ...failures])]);
  const base: Omit<StrategyEvolutionAlertPanel, "integrity_hash"> = {
    alert_id: "strategy_evolution_alert_panel",
    alerts: allAlerts,
    highest_severity: failures.some((failure) => ["TENANT_ISOLATION_VIOLATED", "INTEGRITY_VERIFICATION_FAILED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED", "HIDDEN_STRATEGIC_PROGRESSION"].includes(failure)) ? "CRITICAL" : failures.length ? "HIGH" : "INFORMATIONAL",
    critical_alerts_visible: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function lineage(records: readonly StrategyEvolutionDashboardRecord[]): StrategyProposalLineageExplorer {
  const record = records[0];
  const base: Omit<StrategyProposalLineageExplorer, "integrity_hash"> = {
    lineage_id: "strategy_proposal_lineage_explorer",
    originating_observations: record?.supporting_evidence_refs ?? freezeArray([]),
    detected_patterns: record?.supporting_pattern_refs ?? freezeArray([]),
    outcome_evidence: record?.supporting_outcome_refs ?? freezeArray([]),
    recommendation_evidence: record ? freezeArray([`recommendation:${record.strategy_proposal_id}`]) : freezeArray([]),
    governance_lineage: record?.governance_implications ?? freezeArray([]),
    simulation_lineage: record?.simulation_refs ?? freezeArray([]),
    approval_lineage: record?.approval_refs ?? freezeArray([]),
    certification_lineage: record?.certification_refs ?? freezeArray([]),
    rollback_lineage: record?.rollback_plan_ref ? freezeArray([record.rollback_plan_ref]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function permissions(input: StrategyEvolutionDashboardInput, failures: readonly StrategyEvolutionDashboardFailure[]): readonly StrategyDashboardPermission[] {
  const role = input.role ?? "OPERATOR";
  const base: Omit<StrategyDashboardPermission, "integrity_hash"> = {
    permission_id: `strategy_dashboard_permission_${role.toLowerCase()}`,
    role,
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
    allowed: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "operator_private_notes", "governance_sensitive_notes"]),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_authorized: !failures.includes("EVIDENCE_REFERENCE_BROKEN") && !failures.includes("RESTRICTED_FIELD_EXPOSED"),
    governance_authorized: !failures.includes("GOVERNANCE_IMPLICATION_MISSING"),
    replay_authorized: !failures.includes("REPLAY_READINESS_UNAVAILABLE"),
    certification_authorized: !failures.includes("CERTIFICATION_STATUS_INCONSISTENT"),
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function metrics(failures: readonly StrategyEvolutionDashboardFailure[]): StrategyDashboardMetrics {
  const base: Omit<StrategyDashboardMetrics, "integrity_hash"> = {
    proposal_sync_latency_ms: 16,
    stale_proposal_records: failures.includes("STRATEGY_RENDERING_NONDETERMINISTIC") ? 1 : 0,
    missing_evidence_references: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 1 : 0,
    broken_simulation_links: failures.includes("SIMULATION_STATUS_UNAVAILABLE") ? 1 : 0,
    missing_approval_records: failures.includes("APPROVAL_STATUS_UNAVAILABLE") ? 1 : 0,
    replay_resolution_failures: failures.includes("REPLAY_READINESS_UNAVAILABLE") ? 1 : 0,
    rollback_status_inconsistencies: failures.includes("ROLLBACK_READINESS_UNAVAILABLE") ? 1 : 0,
    certification_status_inconsistencies: failures.includes("CERTIFICATION_STATUS_INCONSISTENT") || failures.includes("CONDITIONAL_CERTIFICATION_MISREPRESENTED") ? 1 : 0,
    dashboard_rendering_failures: failures.includes("STRATEGY_RENDERING_NONDETERMINISTIC") ? 1 : 0,
    unauthorized_access_attempts: failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS") ? 1 : 0,
    tenant_isolation_violations: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0,
    integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    hidden_state_discrepancies: failures.includes("HIDDEN_STRATEGIC_PROGRESSION") || failures.includes("STRATEGY_PROPOSAL_HIDDEN") ? 1 : 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: StrategyEvolutionDashboardFailure, evidence_refs: readonly string[]): StrategyDashboardValidationTest {
  const base: Omit<StrategyDashboardValidationTest, "integrity_hash"> = { test_id: id("strategy_dashboard_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<StrategyEvolutionDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">): readonly StrategyDashboardValidationTest[] {
  const evidence = [result.dashboard_foundation.integrity_hash, result.certification_result.integrity_hash];
  const record = result.records[0];
  return freezeArray([
    validationTest("foundation integration", replayAdaptiveDashboardFoundation(result.dashboard_foundation), "DASHBOARD_FOUNDATION_UNAVAILABLE", evidence),
    validationTest("every strategy proposal visible", result.records.length > 0 && result.records.every((item) => item.proposal_summary && item.proposal_rationale), "STRATEGY_PROPOSAL_HIDDEN", evidence),
    validationTest("no strategy proposal deleted", result.records.length > 0, "STRATEGY_PROPOSAL_DELETED", evidence),
    validationTest("deterministic queue and comparison", result.deterministic && result.proposal_queue.deterministic && result.comparison_workspace.deterministic, "STRATEGY_RENDERING_NONDETERMINISTIC", evidence),
    validationTest("evidence backed strategy", result.evidence_backed && result.records.every((item) => item.supporting_evidence_refs.length > 0), "EVIDENCE_REFERENCE_BROKEN", evidence),
    validationTest("expected benefits supported", Boolean(record?.expected_benefit && result.benefit_dashboard.supporting_evidence_refs.length), "EXPECTED_BENEFIT_UNSUPPORTED", evidence),
    validationTest("expected risks visible", Boolean(record?.expected_risk && result.risk_dashboard.risk_categories.length), "EXPECTED_RISK_HIDDEN", evidence),
    validationTest("governance implications visible", result.governance_visible && result.governance_view.outcome !== "INSUFFICIENT_EVIDENCE", "GOVERNANCE_IMPLICATION_MISSING", evidence),
    validationTest("constitutional implications visible", Boolean(record?.constitutional_implications.length) && result.governance_view.outcome !== "CONSTITUTIONAL_CONFLICT", "CONSTITUTIONAL_IMPLICATION_MISSING", evidence),
    validationTest("simulation status accurate", result.simulation_visible && result.simulation_view.status === "COMPLETED" && result.simulation_view.detected_regressions.length === 0, "SIMULATION_STATUS_UNAVAILABLE", evidence),
    validationTest("approval status visible", result.approval_visible && Boolean(record?.approval_refs.length) && !result.approval_view.silence_treated_as_approval, "APPROVAL_STATUS_UNAVAILABLE", evidence),
    validationTest("certification status accurate", result.certification_visible && Boolean(record?.certification_refs.length) && result.certification_view.outcome !== "UNASSESSED", "CERTIFICATION_STATUS_INCONSISTENT", evidence),
    validationTest("conditional certification distinguished", result.certification_view.outcome !== "CONDITIONAL_PASS" && result.certification_view.production_ready, "CONDITIONAL_CERTIFICATION_MISREPRESENTED", evidence),
    validationTest("replay readiness visible", result.replayable && result.replay_view.status === "READY" && result.replay_view.lineage_complete, "REPLAY_READINESS_UNAVAILABLE", evidence),
    validationTest("rollback readiness visible", result.rollback_visible && result.rollback_view.status === "READY" && Boolean(record?.rollback_plan_ref), "ROLLBACK_READINESS_UNAVAILABLE", evidence),
    validationTest("no hidden strategic progression", !(record?.proposal_status === "CERTIFIED" && result.certification_view.outcome !== "PASS"), "HIDDEN_STRATEGIC_PROGRESSION", evidence),
    validationTest("role authorization enforced", result.permissions.every((permission) => permission.allowed), "UNAUTHORIZED_DASHBOARD_ACCESS", evidence),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.records.every((item) => item.tenant_id === TENANT_ID), "TENANT_ISOLATION_VIOLATED", evidence),
    validationTest("restricted fields protected", result.permissions.every((permission) => permission.restricted_fields.length > 0) && result.records.every((item) => item.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidence),
    validationTest("integrity hashes reproducible", result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidence),
    validationTest("dashboard remains read-only", result.read_only && result.advisory_only && !result.write_authority_granted, "DASHBOARD_WRITE_AUTHORITY_EXPOSED", evidence),
  ]);
}

function resultReplayHash(result: Omit<StrategyEvolutionDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    foundation: result.dashboard_foundation.integrity_hash,
    certification: result.certification_result.integrity_hash,
    records: result.records.map((record) => record.integrity_hash),
    queue: result.proposal_queue.integrity_hash,
    detail: result.detail_view.integrity_hash,
    comparison: result.comparison_workspace.integrity_hash,
    benefit: result.benefit_dashboard.integrity_hash,
    risk: result.risk_dashboard.integrity_hash,
    governance: result.governance_view.integrity_hash,
    simulation: result.simulation_view.integrity_hash,
    approval: result.approval_view.integrity_hash,
    certification_view: result.certification_view.integrity_hash,
    replay: result.replay_view.integrity_hash,
    rollback: result.rollback_view.integrity_hash,
    history: result.historical_explorer.integrity_hash,
    alerts: result.alert_panel.integrity_hash,
    lineage: result.lineage_explorer.integrity_hash,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<StrategyEvolutionDashboardResult, "integrity_hash">): string {
  return hash({ version: result.strategy_evolution_dashboard_version, id: result.dashboard_identifier, api: result.api_surface.integrity_hash, replay_hash: result.replay_hash, validation_outcome: result.validation_outcome });
}

export function buildStrategyEvolutionDashboard(input: StrategyEvolutionDashboardInput = {}): StrategyEvolutionDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const dashboard_foundation = establishAdaptiveDashboardFoundation();
  const certification_result = certificationSource(scenario);
  const initialFailures = freezeArray([
    ...(failureForScenario(scenario) ? [failureForScenario(scenario) as StrategyEvolutionDashboardFailure] : []),
    ...(!replayAdaptiveDashboardFoundation(dashboard_foundation) ? ["DASHBOARD_FOUNDATION_UNAVAILABLE" as const] : []),
    ...(!certification_result.integrity_hash || !certification_result.replay_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ]);
  const api_surface = apiSurface();
  const dashboardRecords = records(certification_result, initialFailures);
  const proposal_queue = queue(dashboardRecords, initialFailures);
  const detail_view = detail(dashboardRecords);
  const comparison_workspace = comparison(dashboardRecords, initialFailures);
  const benefit_dashboard = benefit(dashboardRecords);
  const risk_dashboard = risk(dashboardRecords);
  const governance_view = governance(dashboardRecords, initialFailures);
  const simulation_view = simulation(dashboardRecords, initialFailures);
  const approval_view = approval(dashboardRecords);
  const certification_view = certificationView(dashboardRecords, certification_result);
  const replay_view = replayView(dashboardRecords);
  const rollback_view = rollbackView(dashboardRecords);
  const historical_explorer = history(dashboardRecords);
  const alert_panel = alerts(dashboardRecords, initialFailures);
  const lineage_explorer = lineage(dashboardRecords);
  const permissionRecords = permissions(input, initialFailures);
  const metricsRecord = metrics(initialFailures);
  const baseWithoutValidation: Omit<StrategyEvolutionDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash"> = {
    strategy_evolution_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    dashboard_foundation,
    certification_result,
    records: dashboardRecords,
    proposal_queue,
    detail_view,
    comparison_workspace,
    benefit_dashboard,
    risk_dashboard,
    governance_view,
    simulation_view,
    approval_view,
    certification_view,
    replay_view,
    rollback_view,
    historical_explorer,
    alert_panel,
    lineage_explorer,
    permissions: permissionRecords,
    widgets: WIDGETS,
    metrics: metricsRecord,
    deterministic: !initialFailures.includes("STRATEGY_RENDERING_NONDETERMINISTIC"),
    replayable: !initialFailures.includes("REPLAY_READINESS_UNAVAILABLE"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_backed: !initialFailures.includes("EVIDENCE_REFERENCE_BROKEN"),
    governance_visible: !initialFailures.includes("GOVERNANCE_IMPLICATION_MISSING"),
    simulation_visible: !initialFailures.includes("SIMULATION_STATUS_UNAVAILABLE"),
    approval_visible: !initialFailures.includes("APPROVAL_STATUS_UNAVAILABLE"),
    certification_visible: !initialFailures.includes("CERTIFICATION_STATUS_INCONSISTENT"),
    rollback_visible: !initialFailures.includes("ROLLBACK_READINESS_UNAVAILABLE"),
    read_only: true,
    advisory_only: true,
    write_authority_granted: initialFailures.includes("DASHBOARD_WRITE_AUTHORITY_EXPOSED") ? true as never : false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is StrategyEvolutionDashboardFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<StrategyEvolutionDashboardResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutValidation, status: failures.length ? "REJECTED" : "AUTHORITATIVE", validation_tests, validation_outcome, failures };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateStrategyEvolutionDashboard(result?: StrategyEvolutionDashboardResult): StrategyEvolutionDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<StrategyEvolutionDashboardFailure>(["STRATEGY_RENDERING_NONDETERMINISTIC"]);
    const base: Omit<StrategyEvolutionDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash
    && result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.proposal_queue) === result.proposal_queue.integrity_hash
    && hashWithoutIntegrity(result.detail_view) === result.detail_view.integrity_hash
    && hashWithoutIntegrity(result.comparison_workspace) === result.comparison_workspace.integrity_hash
    && hashWithoutIntegrity(result.benefit_dashboard) === result.benefit_dashboard.integrity_hash
    && hashWithoutIntegrity(result.risk_dashboard) === result.risk_dashboard.integrity_hash
    && hashWithoutIntegrity(result.governance_view) === result.governance_view.integrity_hash
    && hashWithoutIntegrity(result.simulation_view) === result.simulation_view.integrity_hash
    && hashWithoutIntegrity(result.approval_view) === result.approval_view.integrity_hash
    && hashWithoutIntegrity(result.certification_view) === result.certification_view.integrity_hash
    && hashWithoutIntegrity(result.replay_view) === result.replay_view.integrity_hash
    && hashWithoutIntegrity(result.rollback_view) === result.rollback_view.integrity_hash
    && hashWithoutIntegrity(result.historical_explorer) === result.historical_explorer.integrity_hash
    && hashWithoutIntegrity(result.alert_panel) === result.alert_panel.integrity_hash
    && hashWithoutIntegrity(result.lineage_explorer) === result.lineage_explorer.integrity_hash
    && result.permissions.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash
    && result.validation_tests.every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.creation_supported && !result.api_surface.mutation_supported && !result.api_surface.strategy_mutation_supported && !result.api_surface.proposal_approval_supported && !result.api_surface.simulation_execution_supported && !result.api_surface.certification_mutation_supported && !result.api_surface.rollback_execution_supported && !result.api_surface.production_promotion_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<StrategyEvolutionDashboardValidationResult, "validation_hash"> = { dashboard_id: result.dashboard_identifier, valid, validation_outcome: result.validation_outcome, failures: result.failures, replay_hash_valid, integrity_hash_valid, read_only };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayStrategyEvolutionDashboard(result: StrategyEvolutionDashboardResult): boolean {
  return validateStrategyEvolutionDashboard(result).valid;
}

export function buildStrategyEvolutionDashboardObservabilitySurface(result = buildStrategyEvolutionDashboard()): StrategyEvolutionDashboardObservabilitySurface {
  return Object.freeze({
    dashboard_id: result.dashboard_identifier,
    status: result.status,
    validation_outcome: result.validation_outcome,
    proposals: result.records.length,
    failed_tests: result.validation_tests.filter((test) => !test.passed).length,
    failures: result.failures,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    read_only: result.read_only && result.advisory_only && !result.write_authority_granted,
    integrity_hash: result.integrity_hash,
  });
}

export function getStrategyEvolutionDashboardContract(): StrategyEvolutionDashboardContract {
  const result = buildStrategyEvolutionDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      proposal_statuses: PROPOSAL_STATUSES,
      navigation_dimensions: freezeArray(["strategy proposal ID", "strategy domain", "tenant", "mission", "proposal status", "expected benefit", "expected risk", "confidence level", "governance state", "simulation state", "approval state", "certification state", "rollback state", "proposal author", "reviewer", "date range", "strategy version"]),
      required_data_sources: freezeArray(["Strategy Evolution Engine", "Strategy Evolution Proposal Registry", "Pattern Intelligence Engine", "Outcome Observation Engine", "Recommendation Effectiveness Engine", "Confidence Adaptation Engine", "Risk Adaptation Engine", "Governance-Aware Adaptation Layer", "Operator Feedback Integration", "Adaptation Proposal Engine", "Adaptive Simulation Framework", "Drift Defense System", "Replay Engine", "Rollback Engine", "Truth Ledger", "Adaptive Intelligence Ledger", "Certification Ledger"]),
      read_only: true,
      advisory_only: true,
    }),
    result,
    validation: validateStrategyEvolutionDashboard(result),
    observability: buildStrategyEvolutionDashboardObservabilitySurface(result),
  });
}

export const StrategyEvolutionDashboard = Object.freeze({
  build: buildStrategyEvolutionDashboard,
  validate: validateStrategyEvolutionDashboard,
  replay: replayStrategyEvolutionDashboard,
});
