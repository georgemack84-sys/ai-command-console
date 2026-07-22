import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  GovernanceTradeoffReport,
  MetricIntegrityReport,
  ObjectiveAlignmentReport,
  OptimizationBalanceReport,
  OptimizationBaseline,
  OptimizationIntegrityScoreReport,
  OptimizationPressureApiSurface,
  OptimizationPressureAssessment,
  OptimizationPressureFailure,
  OptimizationPressureFoundation,
  OptimizationPressureInput,
  OptimizationPressureMetrics,
  OptimizationPressureRecord,
  OptimizationPressureResult,
  OptimizationPressureScenario,
  OptimizationPressureStatus,
  OptimizationRiskSummary,
  OptimizationSuppressionDecision,
  RewardHackingAssessment,
} from "@/types/optimization-pressure-defense";

const DEFENSE_VERSION = "optimization-pressure-defense/v1" as const;
const DEFENSE_IDENTIFIER = "OptimizationPressureDefense" as const;
const DEFENSE_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<OptimizationPressureInput["scenario"]>;

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

function buildApiSurface(): OptimizationPressureApiSurface {
  const base: Omit<OptimizationPressureApiSurface, "integrity_hash"> = {
    api_id: "optimization_pressure_defense_api",
    defend_optimization_pressure: "POST /optimization-pressure-defense/defend",
    retrieve_baseline: "POST /optimization-pressure-defense/baseline",
    retrieve_objective_alignment: "POST /optimization-pressure-defense/objective-alignment",
    retrieve_reward_hacking: "POST /optimization-pressure-defense/reward-hacking",
    retrieve_metric_integrity: "POST /optimization-pressure-defense/metric-integrity",
    retrieve_governance_tradeoff: "POST /optimization-pressure-defense/governance-tradeoff",
    retrieve_balance_report: "POST /optimization-pressure-defense/balance",
    retrieve_integrity_score: "POST /optimization-pressure-defense/integrity-score",
    retrieve_assessment: "POST /optimization-pressure-defense/assessment",
    retrieve_risk_summary: "POST /optimization-pressure-defense/risk-summary",
    retrieve_suppression: "POST /optimization-pressure-defense/suppression",
    retrieve_ledger_record: "POST /optimization-pressure-defense/ledger",
    retrieve_metrics: "POST /optimization-pressure-defense/metrics",
    replay_defense: "POST /optimization-pressure-defense/replay",
    inspect_defense: "POST /optimization-pressure-defense/inspect",
    retrieve_contract: "GET /optimization-pressure-defense/contract",
    production_mutation_supported: false,
    optimization_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): OptimizationPressureFailure | undefined {
  const map: Partial<Record<OptimizationPressureScenario, OptimizationPressureFailure>> = {
    UNAUTHORIZED_OBJECTIVE_CHANGE: "UNAUTHORIZED_OBJECTIVE_CHANGE",
    REWARD_HACKING: "REWARD_HACKING_DETECTED",
    OVER_OPTIMIZATION: "OVER_OPTIMIZATION_DETECTED",
    METRIC_GAMING: "METRIC_GAMING_DETECTED",
    CONFIDENCE_MAXIMIZATION: "CONFIDENCE_MAXIMIZATION_DETECTED",
    GOVERNANCE_MINIMIZATION: "GOVERNANCE_MINIMIZATION_DETECTED",
    SHORTCUT_LEARNING: "SHORTCUT_LEARNING_DETECTED",
    OPTIMIZATION_IMBALANCE: "OPTIMIZATION_IMBALANCE_DETECTED",
    OBJECTIVE_SUBSTITUTION: "OBJECTIVE_SUBSTITUTION_DETECTED",
    OPTIMIZATION_DRIFT: "OPTIMIZATION_DRIFT_DETECTED",
    ADAPTIVE_OPTIMIZATION_BIAS: "ADAPTIVE_OPTIMIZATION_BIAS",
    OPTIMIZATION_INSTABILITY: "OPTIMIZATION_INSTABILITY_DETECTED",
    PERFORMANCE_ONLY: "PERFORMANCE_ONLY_OPTIMIZATION",
    REPLAY_REDUCTION: "REPLAY_REDUCTION_DETECTED",
    EXPLAINABILITY_DEGRADATION: "EXPLAINABILITY_DEGRADATION_DETECTED",
    AUDIT_REDUCTION: "AUDIT_REDUCTION_DETECTED",
    CERTIFICATION_AVOIDANCE: "CERTIFICATION_AVOIDANCE_DETECTED",
    CONSTITUTIONAL_TRADEOFF: "CONSTITUTIONAL_TRADEOFF_DETECTED",
    OPERATOR_AUTHORITY_WEAKENING: "OPERATOR_AUTHORITY_WEAKENING",
    NONDETERMINISTIC: "NONDETERMINISTIC_ASSESSMENT",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_OPTIMIZATION_EVIDENCE",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    UNKNOWN_BEHAVIOR: "UNKNOWN_OPTIMIZATION_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly OptimizationPressureFailure[] {
  const failures: OptimizationPressureFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly OptimizationPressureFailure[]): DriftSeverity {
  if (failures.includes("UNKNOWN_OPTIMIZATION_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED")) return "CRITICAL";
  if (failures.some((failure) => [
    "REWARD_HACKING_DETECTED",
    "METRIC_GAMING_DETECTED",
    "GOVERNANCE_MINIMIZATION_DETECTED",
    "OBJECTIVE_SUBSTITUTION_DETECTED",
    "REPLAY_REDUCTION_DETECTED",
    "EXPLAINABILITY_DEGRADATION_DETECTED",
    "CERTIFICATION_AVOIDANCE_DETECTED",
  ].includes(failure))) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly OptimizationPressureFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_OPTIMIZATION_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly OptimizationPressureFailure[]): OptimizationPressureStatus {
  if (failures.includes("UNKNOWN_OPTIMIZATION_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return "FAIL_CLOSED";
  if (failures.some((failure) => [
    "REWARD_HACKING_DETECTED",
    "METRIC_GAMING_DETECTED",
    "GOVERNANCE_MINIMIZATION_DETECTED",
    "OBJECTIVE_SUBSTITUTION_DETECTED",
    "REPLAY_REDUCTION_DETECTED",
    "EXPLAINABILITY_DEGRADATION_DETECTED",
    "CERTIFICATION_AVOIDANCE_DETECTED",
    "CONSTITUTIONAL_TRADEOFF_DETECTED",
  ].includes(failure))) return "SUPPRESSED";
  if (failures.includes("UNAUTHORIZED_OBJECTIVE_CHANGE")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "PRESSURE_DETECTED" : "PASS";
}

function integrityScore(failures: readonly OptimizationPressureFailure[]): number {
  if (!failures.length) return 0.97;
  if (failures.includes("UNKNOWN_OPTIMIZATION_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return 0.05;
  if (failures.includes("REWARD_HACKING_DETECTED") || failures.includes("GOVERNANCE_MINIMIZATION_DETECTED") || failures.includes("OBJECTIVE_SUBSTITUTION_DETECTED")) return 0.18;
  return 0.52;
}

function buildBaseline(): OptimizationBaseline {
  const base: Omit<OptimizationBaseline, "integrity_hash"> = {
    baseline_id: "optimization_pressure_baseline_v1",
    optimization_policy_version: "optimization-policy/v1",
    approved_objectives: freezeArray(["decision_quality", "mission_integrity", "evidence_alignment", "governance_compliance", "operator_trust"]),
    protected_constraints: freezeArray(["constitutional_safety", "operator_authority", "tenant_isolation", "auditability", "replayability", "explainability"]),
    optimization_boundaries: freezeArray(["no_reward_hacking", "no_metric_gaming", "no_governance_minimization", "no_objective_substitution", "no_performance_only_optimization"]),
    governance_requirements: freezeArray(["governance_review_for_objective_change", "policy_enforcement_preserved", "certification_required_for_optimization_change"]),
    constitutional_requirements: freezeArray(["constitutional_constraints_nonnegotiable", "operator_authority_preserved", "tenant_isolation_required"]),
    replay_requirements: freezeArray(["deterministic_replay_required", "optimization_trace_required", "identical_assessment_required"]),
    explainability_requirements: freezeArray(["objective_rationale_required", "tradeoff_explanation_required", "metric_lineage_required"]),
    approval_reference: "governance-approval:optimization-pressure-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildObjectiveAlignment(score: number, failures: readonly OptimizationPressureFailure[]): ObjectiveAlignmentReport {
  const base: Omit<ObjectiveAlignmentReport, "integrity_hash"> = {
    report_id: `objective_alignment_${hash({ score, failures }).slice(0, 14)}`,
    mission_alignment_score: failures.includes("OBJECTIVE_SUBSTITUTION_DETECTED") ? 0.2 : score,
    strategic_alignment_score: failures.includes("OPTIMIZATION_DRIFT_DETECTED") ? 0.34 : score,
    governance_alignment_score: failures.includes("GOVERNANCE_MINIMIZATION_DETECTED") ? 0.14 : score,
    constitutional_alignment_score: failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED") ? 0.06 : score,
    operator_alignment_score: failures.includes("OPERATOR_AUTHORITY_WEAKENING") ? 0.22 : score,
    evidence_alignment_score: Number((score - 0.01).toFixed(2)),
    certification_alignment_score: failures.includes("CERTIFICATION_AVOIDANCE_DETECTED") ? 0.18 : score,
    long_term_consistency_score: failures.includes("PERFORMANCE_ONLY_OPTIMIZATION") ? 0.36 : score,
    strategic_consistency_assessment: failures.length ? "Optimization objective alignment requires review." : "Optimization objectives remain aligned with approved mission strategy.",
    alignment_variance_summary: failures.length ? "Optimization variance detected against protected constraints." : "No alignment variance detected.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRewardHacking(failures: readonly OptimizationPressureFailure[]): RewardHackingAssessment {
  const patterns = failures.filter((failure) => ["REWARD_HACKING_DETECTED", "SHORTCUT_LEARNING_DETECTED", "OBJECTIVE_SUBSTITUTION_DETECTED"].includes(failure));
  const base: Omit<RewardHackingAssessment, "integrity_hash"> = {
    assessment_id: `reward_hacking_${hash(failures).slice(0, 14)}`,
    reward_hacking_detected: patterns.length > 0,
    incentive_integrity_report: patterns.length ? "Reward or objective exploitation detected and suppressed." : "No reward hacking detected.",
    detected_reward_patterns: patterns,
    automatic_suppression: patterns.length ? freezeArray(["suppress_reward_hacking", "block_objective_exploitation", "preserve_forensic_evidence"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetricReport(score: number, failures: readonly OptimizationPressureFailure[]): MetricIntegrityReport {
  const anomalies = failures.filter((failure) => ["METRIC_GAMING_DETECTED", "CONFIDENCE_MAXIMIZATION_DETECTED", "PERFORMANCE_ONLY_OPTIMIZATION"].includes(failure));
  const base: Omit<MetricIntegrityReport, "integrity_hash"> = {
    report_id: `metric_integrity_${hash({ score, failures }).slice(0, 14)}`,
    metric_consistency_score: anomalies.length ? 0.31 : score,
    metric_distribution_score: anomalies.length ? 0.34 : score,
    historical_comparison_score: score,
    optimization_trend_score: failures.includes("OVER_OPTIMIZATION_DETECTED") ? 0.38 : score,
    evidence_correlation_score: Number((score - 0.02).toFixed(2)),
    outcome_correlation_score: Number((score - 0.01).toFixed(2)),
    measurement_stability_score: failures.includes("OPTIMIZATION_INSTABILITY_DETECTED") ? 0.29 : score,
    metric_gaming_assessment: anomalies.length ? "Metric gaming or performance-only optimization detected." : "Metrics remain indicators rather than objectives.",
    detected_metric_anomalies: anomalies,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildGovernanceTradeoff(score: number, failures: readonly OptimizationPressureFailure[]): GovernanceTradeoffReport {
  const tradeoffs = failures.filter((failure) => ["GOVERNANCE_MINIMIZATION_DETECTED", "REPLAY_REDUCTION_DETECTED", "EXPLAINABILITY_DEGRADATION_DETECTED", "AUDIT_REDUCTION_DETECTED", "CERTIFICATION_AVOIDANCE_DETECTED", "CONSTITUTIONAL_TRADEOFF_DETECTED"].includes(failure));
  const base: Omit<GovernanceTradeoffReport, "integrity_hash"> = {
    report_id: `governance_tradeoff_${hash({ score, failures }).slice(0, 14)}`,
    governance_tradeoff_report: tradeoffs.length ? "Optimization attempted to weaken protected governance constraints." : "No governance tradeoff detected.",
    constitutional_impact_assessment: failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED") ? "Constitutional tradeoff detected and fail-closed handling required." : "Constitutional constraints preserved.",
    governance_preservation_score: failures.includes("GOVERNANCE_MINIMIZATION_DETECTED") ? 0.12 : score,
    replay_preservation_score: failures.includes("REPLAY_REDUCTION_DETECTED") ? 0.22 : score,
    explainability_preservation_score: failures.includes("EXPLAINABILITY_DEGRADATION_DETECTED") ? 0.24 : score,
    audit_preservation_score: failures.includes("AUDIT_REDUCTION_DETECTED") ? 0.26 : score,
    certification_preservation_score: failures.includes("CERTIFICATION_AVOIDANCE_DETECTED") ? 0.2 : score,
    detected_tradeoffs: tradeoffs,
    automatic_suppression: tradeoffs.length ? freezeArray(["suppress_governance_tradeoff", "restore_replay_explainability_requirements", "require_governance_review"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildBalance(score: number, failures: readonly OptimizationPressureFailure[]): OptimizationBalanceReport {
  const imbalanced = failures.includes("OPTIMIZATION_IMBALANCE_DETECTED") || failures.includes("OVER_OPTIMIZATION_DETECTED");
  const base: Omit<OptimizationBalanceReport, "integrity_hash"> = {
    report_id: `optimization_balance_${hash({ score, failures }).slice(0, 14)}`,
    performance_score: failures.includes("PERFORMANCE_ONLY_OPTIMIZATION") ? 0.99 : score,
    governance_score: failures.includes("GOVERNANCE_MINIMIZATION_DETECTED") ? 0.12 : score,
    safety_score: failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED") ? 0.08 : score,
    explainability_score: failures.includes("EXPLAINABILITY_DEGRADATION_DETECTED") ? 0.24 : score,
    replayability_score: failures.includes("REPLAY_REDUCTION_DETECTED") ? 0.22 : score,
    auditability_score: failures.includes("AUDIT_REDUCTION_DETECTED") ? 0.26 : score,
    operator_visibility_score: failures.includes("OPERATOR_AUTHORITY_WEAKENING") ? 0.25 : score,
    evidence_quality_score: Number((score - 0.01).toFixed(2)),
    certification_readiness_score: failures.includes("CERTIFICATION_AVOIDANCE_DETECTED") ? 0.2 : score,
    optimization_balance_report: imbalanced ? "Optimization imbalance or excessive specialization detected." : "Optimization remains balanced across protected dimensions.",
    balance_stability_assessment: failures.includes("OPTIMIZATION_INSTABILITY_DETECTED") ? "Optimization stability degraded." : "Optimization stability preserved.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIntegrityScore(score: number, alignment: ObjectiveAlignmentReport, tradeoff: GovernanceTradeoffReport, balance: OptimizationBalanceReport): OptimizationIntegrityScoreReport {
  const base: Omit<OptimizationIntegrityScoreReport, "integrity_hash"> = {
    score_id: `optimization_integrity_${hash({ score, alignment: alignment.integrity_hash }).slice(0, 14)}`,
    objective_alignment_score: alignment.mission_alignment_score,
    governance_preservation_score: tradeoff.governance_preservation_score,
    constitutional_compliance_score: alignment.constitutional_alignment_score,
    replay_preservation_score: tradeoff.replay_preservation_score,
    explainability_score: tradeoff.explainability_preservation_score,
    balance_score: Math.min(balance.governance_score, balance.safety_score, balance.replayability_score, score),
    optimization_integrity_score: score,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function suppressionActions(failures: readonly OptimizationPressureFailure[], response: DriftResponse): readonly string[] {
  if (!failures.length) return freezeArray(["monitor_optimization_integrity"]);
  const actions = ["suppress_unsafe_optimization", "exclude_from_adaptive_learning", "preserve_forensic_evidence", "notify_operators"];
  if (response === "FAIL_CLOSED") actions.push("fail_closed");
  if (failures.includes("GOVERNANCE_MINIMIZATION_DETECTED") || failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED")) actions.push("require_governance_review");
  return freezeArray(actions);
}

function buildAssessment(failures: readonly OptimizationPressureFailure[], severity: DriftSeverity, response: DriftResponse, actions: readonly string[]): OptimizationPressureAssessment {
  const base: Omit<OptimizationPressureAssessment, "integrity_hash"> = {
    assessment_id: `optimization_assessment_${hash(failures).slice(0, 14)}`,
    pressure_detected: failures.length > 0,
    detected_behaviors: failures,
    affected_objectives: failures.length ? freezeArray(["decision_quality", "mission_integrity", "governance_compliance"]) : freezeArray([]),
    reward_analysis: failures.includes("REWARD_HACKING_DETECTED") ? "Reward hacking detected." : "No reward exploitation detected.",
    metric_analysis: failures.includes("METRIC_GAMING_DETECTED") ? "Metric gaming detected." : "Metric integrity preserved.",
    governance_impacts: failures.length ? freezeArray(["governance_review_required"]) : freezeArray(["governance_preserved"]),
    constitutional_impacts: failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED") ? freezeArray(["constitutional_tradeoff_blocked"]) : freezeArray(["constitutional_boundary_preserved"]),
    replay_impacts: failures.includes("REPLAY_REDUCTION_DETECTED") ? freezeArray(["replay_reduction_blocked"]) : freezeArray(["replay_preserved"]),
    explainability_impacts: failures.includes("EXPLAINABILITY_DEGRADATION_DETECTED") ? freezeArray(["explainability_degradation_blocked"]) : freezeArray(["explainability_preserved"]),
    supporting_evidence: freezeArray(["evidence:optimization-objectives", "evidence:metric-lineage", "evidence:governance-policy", "evidence:replay-trace"]),
    recommended_response: response,
    containment_actions: actions,
    severity,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRiskSummary(failures: readonly OptimizationPressureFailure[]): OptimizationRiskSummary {
  const base: Omit<OptimizationRiskSummary, "integrity_hash"> = {
    summary_id: `optimization_risk_${hash(failures).slice(0, 14)}`,
    operational_risk: failures.length ? "Unsafe optimization may distort decision quality." : "Operational optimization risk remains low.",
    governance_risk: failures.includes("GOVERNANCE_MINIMIZATION_DETECTED") ? "Governance minimization detected." : "Governance risk preserved.",
    constitutional_risk: failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED") ? "Constitutional tradeoff detected." : "Constitutional risk preserved.",
    strategic_risk: failures.includes("OBJECTIVE_SUBSTITUTION_DETECTED") ? "Objective substitution threatens mission strategy." : "Strategic risk preserved.",
    production_readiness_impact: failures.length ? "Unsafe optimization is excluded until governance review completes." : "No production readiness impact detected.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSuppression(failures: readonly OptimizationPressureFailure[], actions: readonly string[], response: DriftResponse): OptimizationSuppressionDecision {
  const base: Omit<OptimizationSuppressionDecision, "integrity_hash"> = {
    suppression_id: `optimization_suppression_${hash({ failures, actions }).slice(0, 14)}`,
    suppressed_behaviors: failures.length ? failures : freezeArray([]),
    containment_actions: actions,
    governance_review_required: failures.length > 0,
    operator_notification_required: failures.length > 0,
    forensic_evidence_preserved: true,
    fail_closed: response === "FAIL_CLOSED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: OptimizationPressureInput, baseline: OptimizationBaseline, score: OptimizationIntegrityScoreReport, assessment: OptimizationPressureAssessment, suppression: OptimizationSuppressionDecision): OptimizationPressureRecord {
  const base: Omit<OptimizationPressureRecord, "integrity_hash"> = {
    optimization_event_id: `optimization_pressure_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", score: score.optimization_integrity_score, failures: assessment.detected_behaviors }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    optimization_policy_version: baseline.optimization_policy_version,
    optimization_type: "OPTIMIZATION_PRESSURE",
    optimization_integrity_score: score.optimization_integrity_score,
    objective_alignment_score: score.objective_alignment_score,
    governance_preservation_score: score.governance_preservation_score,
    severity: assessment.severity,
    affected_objectives: assessment.affected_objectives,
    affected_adaptations: freezeArray(["adaptation:proposal-generation", "adaptation:scoring"]),
    affected_recommendations: freezeArray(["recommendation:optimized", "recommendation:adaptive-proposal"]),
    supporting_evidence: assessment.integrity_hash,
    suppressed_behaviors: suppression.suppressed_behaviors,
    recommended_response: assessment.recommended_response,
    containment_required: suppression.suppressed_behaviors.length > 0 || suppression.fail_closed,
    governance_impact: suppression.governance_review_required ? "governance_review_required" : "governance_preserved",
    constitutional_impact: assessment.constitutional_impacts.join(","),
    replay_impact: assessment.replay_impacts.join(","),
    replay_refs: freezeArray(["replay:optimization-pressure-defense"]),
    timestamp: DEFENSE_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(score: OptimizationIntegrityScoreReport, suppression: OptimizationSuppressionDecision, failures: readonly OptimizationPressureFailure[]): OptimizationPressureMetrics {
  const base: Omit<OptimizationPressureMetrics, "integrity_hash"> = {
    optimization_integrity_score: score.optimization_integrity_score,
    objective_alignment_score: score.objective_alignment_score,
    governance_preservation_score: score.governance_preservation_score,
    constitutional_compliance_score: score.constitutional_compliance_score,
    replay_preservation_score: score.replay_preservation_score,
    explainability_score: score.explainability_score,
    containment_required: suppression.suppressed_behaviors.length > 0 || suppression.fail_closed,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_ASSESSMENT"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_OPTIMIZATION_EVIDENCE"),
    governance_preserved: !failures.includes("GOVERNANCE_MINIMIZATION_DETECTED") && !failures.includes("UNAUTHORIZED_OBJECTIVE_CHANGE"),
    constitutional_preserved: !failures.includes("CONSTITUTIONAL_TRADEOFF_DETECTED"),
    operator_authority_preserved: !failures.includes("OPERATOR_AUTHORITY_WEAKENING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OptimizationPressureResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    objective_hash: result.objective_alignment_report.integrity_hash,
    reward_hash: result.reward_hacking_assessment.integrity_hash,
    metric_hash: result.metric_integrity_report.integrity_hash,
    tradeoff_hash: result.governance_tradeoff_report.integrity_hash,
    balance_hash: result.balance_report.integrity_hash,
    score_hash: result.integrity_score_report.integrity_hash,
    assessment_hash: result.pressure_assessment.integrity_hash,
    risk_hash: result.risk_summary.integrity_hash,
    suppression_hash: result.suppression_decision.integrity_hash,
    record_hash: result.optimization_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<OptimizationPressureResult, "integrity_hash">): string {
  return hash({
    version: result.optimization_pressure_defense_version,
    defense_identifier: result.defense_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.optimization_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function defendOptimizationPressure(input: OptimizationPressureInput = {}): OptimizationPressureResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const integrity = integrityScore(failures);
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const actions = suppressionActions(failures, response);
  const baseline = buildBaseline();
  const objective_alignment_report = buildObjectiveAlignment(integrity, failures);
  const reward_hacking_assessment = buildRewardHacking(failures);
  const metric_integrity_report = buildMetricReport(integrity, failures);
  const governance_tradeoff_report = buildGovernanceTradeoff(integrity, failures);
  const balance_report = buildBalance(integrity, failures);
  const integrity_score_report = buildIntegrityScore(integrity, objective_alignment_report, governance_tradeoff_report, balance_report);
  const pressure_assessment = buildAssessment(failures, severity, response, actions);
  const risk_summary = buildRiskSummary(failures);
  const suppression_decision = buildSuppression(failures, actions, response);
  const optimization_record = buildRecord(input, baseline, integrity_score_report, pressure_assessment, suppression_decision);
  const metrics = buildMetrics(integrity_score_report, suppression_decision, failures);
  const base: Omit<OptimizationPressureResult, "integrity_hash" | "replay_hash"> = {
    optimization_pressure_defense_version: DEFENSE_VERSION,
    defense_identifier: DEFENSE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    objective_alignment_report,
    reward_hacking_assessment,
    metric_integrity_report,
    governance_tradeoff_report,
    balance_report,
    integrity_score_report,
    pressure_assessment,
    risk_summary,
    suppression_decision,
    optimization_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_OPTIMIZATION_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_OPTIMIZATION_EVIDENCE"),
    governance_preserved: metrics.governance_preserved,
    constitutional_preserved: metrics.constitutional_preserved,
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_behavior: false,
    authorizes_optimization: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayOptimizationPressureDefense(result: OptimizationPressureResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.objective_alignment_report) &&
    verifyHashedRecord(result.reward_hacking_assessment) &&
    verifyHashedRecord(result.metric_integrity_report) &&
    verifyHashedRecord(result.governance_tradeoff_report) &&
    verifyHashedRecord(result.balance_report) &&
    verifyHashedRecord(result.integrity_score_report) &&
    verifyHashedRecord(result.pressure_assessment) &&
    verifyHashedRecord(result.risk_summary) &&
    verifyHashedRecord(result.suppression_decision) &&
    verifyHashedRecord(result.optimization_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getOptimizationPressureFoundation(): OptimizationPressureFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    optimization_pressure_defense_version: DEFENSE_VERSION,
    api_surface,
    result: defendOptimizationPressure(),
  });
}

export const OptimizationPressureDefense = Object.freeze({
  defend: defendOptimizationPressure,
  replay: replayOptimizationPressureDefense,
});
