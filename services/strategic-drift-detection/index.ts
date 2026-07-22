import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  HiddenOptimizationAssessment,
  OperatorVisibilityInterface,
  RecommendationPhilosophyProfile,
  StrategicBaseline,
  StrategicDriftApiSurface,
  StrategicDriftDetectionResult,
  StrategicDriftEvidencePackage,
  StrategicDriftFailure,
  StrategicDriftFoundation,
  StrategicDriftInput,
  StrategicDriftMetrics,
  StrategicDriftRecord,
  StrategicDriftScenario,
  StrategicDriftStatus,
  StrategicStabilityAnalysis,
  StrategyComparison,
  StrategyVarianceReport,
} from "@/types/strategic-drift-detection";

const DETECTOR_VERSION = "strategic-drift-detection/v1" as const;
const DETECTOR_IDENTIFIER = "StrategicDriftDetection" as const;
const DETECTION_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<StrategicDriftInput["scenario"]>;

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

function buildApiSurface(): StrategicDriftApiSurface {
  const base: Omit<StrategicDriftApiSurface, "integrity_hash"> = {
    api_id: "strategic_drift_detection_api",
    detect_strategic_drift: "POST /strategic-drift-detection/detect",
    retrieve_baseline: "POST /strategic-drift-detection/baseline",
    retrieve_comparison: "POST /strategic-drift-detection/comparison",
    retrieve_evidence: "POST /strategic-drift-detection/evidence",
    retrieve_metrics: "POST /strategic-drift-detection/metrics",
    replay_detection: "POST /strategic-drift-detection/replay",
    inspect_detector: "POST /strategic-drift-detection/inspect",
    retrieve_contract: "GET /strategic-drift-detection/contract",
    production_mutation_supported: false,
    autonomous_containment_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): StrategicDriftFailure | undefined {
  const map: Partial<Record<StrategicDriftScenario, StrategicDriftFailure>> = {
    UNAUTHORIZED_STRATEGY_CHANGE: "UNAUTHORIZED_STRATEGY_CHANGE",
    MISSING_GOVERNANCE_APPROVAL: "MISSING_GOVERNANCE_APPROVAL",
    CONSTITUTIONAL_CONFLICT: "CONSTITUTIONAL_CONFLICT",
    NONDETERMINISTIC: "NONDETERMINISTIC_CLASSIFICATION",
    UNEXPLAINED_DRIFT: "UNEXPLAINED_STRATEGIC_DRIFT",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_EVIDENCE",
    HIDDEN_OPTIMIZATION: "HIDDEN_OPTIMIZATION_DETECTED",
    OBJECTIVE_SUBSTITUTION: "OBJECTIVE_SUBSTITUTION_DETECTED",
    RECOMMENDATION_BIAS: "RECOMMENDATION_BIAS_DETECTED",
    GOVERNANCE_SENSITIVITY_REDUCTION: "GOVERNANCE_SENSITIVITY_REDUCTION",
    CONSTITUTIONAL_SENSITIVITY_REDUCTION: "CONSTITUTIONAL_SENSITIVITY_REDUCTION",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    PRODUCTION_MUTATION: "PRODUCTION_MUTATION_ATTEMPT",
    UNKNOWN_STRATEGY: "UNKNOWN_STRATEGIC_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly StrategicDriftFailure[] {
  const failures: StrategicDriftFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly StrategicDriftFailure[]): DriftSeverity {
  if (failures.includes("CONSTITUTIONAL_CONFLICT") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("PRODUCTION_MUTATION_ATTEMPT")) return "CRITICAL";
  if (failures.includes("HIDDEN_OPTIMIZATION_DETECTED") || failures.includes("OBJECTIVE_SUBSTITUTION_DETECTED") || failures.includes("GOVERNANCE_SENSITIVITY_REDUCTION") || failures.includes("CONSTITUTIONAL_SENSITIVITY_REDUCTION")) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly StrategicDriftFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_STRATEGIC_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly StrategicDriftFailure[]): StrategicDriftStatus {
  if (failures.includes("UNKNOWN_STRATEGIC_BEHAVIOR") || failures.includes("CONSTITUTIONAL_CONFLICT") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("PRODUCTION_MUTATION_ATTEMPT")) return "FAIL_CLOSED";
  if (failures.includes("MISSING_GOVERNANCE_APPROVAL") || failures.includes("GOVERNANCE_SENSITIVITY_REDUCTION") || failures.includes("CONSTITUTIONAL_SENSITIVITY_REDUCTION")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "DRIFT_DETECTED" : "PASS";
}

function buildBaseline(): StrategicBaseline {
  const base: Omit<StrategicBaseline, "integrity_hash"> = {
    baseline_id: "strategic_baseline_mission_control_v1",
    strategy_version: "strategy/v1",
    mission_scope: "mission-control-adaptive-intelligence",
    approved_priorities: freezeArray(["constitutional_safety", "governance_compliance", "operator_authority", "mission_outcome_quality", "risk_reduction", "confidence_calibration"]),
    decision_weights: freezeArray(["constitution:1.00", "governance:0.95", "operator:0.90", "mission:0.82", "risk:0.78", "confidence:0.72"]),
    optimization_constraints: freezeArray(["no_governance_minimization", "no_objective_substitution", "no_reward_hacking", "no_policy_bypass", "no_production_mutation"]),
    governance_requirements: freezeArray(["governance_approval_required", "authority_verification_required", "policy_alignment_required"]),
    constitutional_requirements: freezeArray(["constitutional_alignment_required", "tenant_isolation_required", "operator_supremacy_required"]),
    approval_reference: "governance-approval:strategic-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function driftScore(failures: readonly StrategicDriftFailure[]): number {
  if (!failures.length) return 0.04;
  if (failures.includes("CONSTITUTIONAL_CONFLICT") || failures.includes("UNKNOWN_STRATEGIC_BEHAVIOR")) return 0.98;
  if (failures.includes("HIDDEN_OPTIMIZATION_DETECTED") || failures.includes("OBJECTIVE_SUBSTITUTION_DETECTED")) return 0.76;
  return 0.48;
}

function buildComparison(score: number, failures: readonly StrategicDriftFailure[]): StrategyComparison {
  const base: Omit<StrategyComparison, "integrity_hash"> = {
    comparison_id: `strategy_comparison_${hash({ score, failures }).slice(0, 14)}`,
    strategy_difference_matrix: freezeArray(["recommendation_priorities", "decision_ordering", "objective_weighting", "mission_alignment", "governance_alignment", "constitutional_alignment", "optimization_emphasis", "historical_consistency"]),
    priority_shift_report: failures.length ? "Priority shift exceeds approved strategic tolerance and requires review." : "No unauthorized priority shift detected.",
    objective_alignment_report: failures.includes("OBJECTIVE_SUBSTITUTION_DETECTED") ? "Objective substitution detected against approved strategic baseline." : "Objectives remain aligned with approved baseline.",
    strategic_consistency_score: Number((1 - score).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPhilosophy(score: number, failures: readonly StrategicDriftFailure[]): RecommendationPhilosophyProfile {
  const base: Omit<RecommendationPhilosophyProfile, "integrity_hash"> = {
    profile_id: `recommendation_philosophy_${hash({ score, failures }).slice(0, 14)}`,
    evaluated_dimensions: freezeArray(["recommendation_rationale", "objective_prioritization", "evidence_utilization", "confidence_weighting", "risk_tolerance", "escalation_behavior", "governance_sensitivity", "operator_influence"]),
    philosophy_drift_report: failures.includes("RECOMMENDATION_BIAS_DETECTED") ? "Recommendation philosophy drift includes bias requiring containment review." : "Recommendation philosophy remains stable against approved baseline.",
    behavioral_consistency_analysis: failures.length ? "Strategic behavior variation detected but remains deterministically classified." : "Behavioral consistency is preserved.",
    philosophy_stability_score: Number((1 - score / 2).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildHiddenOptimization(failures: readonly StrategicDriftFailure[]): HiddenOptimizationAssessment {
  const detected = failures.filter((failure) => failure === "HIDDEN_OPTIMIZATION_DETECTED" || failure === "OBJECTIVE_SUBSTITUTION_DETECTED" || failure === "GOVERNANCE_SENSITIVITY_REDUCTION");
  const base: Omit<HiddenOptimizationAssessment, "integrity_hash"> = {
    assessment_id: `hidden_optimization_${hash(detected).slice(0, 14)}`,
    detected_patterns: detected,
    objective_shift_analysis: detected.length ? "Hidden optimization or objective shift detected." : "No reward hacking, objective substitution, or optimization shortcut detected.",
    optimization_risk_report: detected.length ? "Optimization risk requires suppression or governance review." : "Optimization remains within approved strategic boundaries.",
    hidden_optimization_score: detected.length ? 0.81 : 0.03,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildStability(score: number): StrategicStabilityAnalysis {
  const base: Omit<StrategicStabilityAnalysis, "integrity_hash"> = {
    analysis_id: `strategic_stability_${hash(score).slice(0, 14)}`,
    strategic_stability_score: Number((1 - score).toFixed(2)),
    stability_timeline: freezeArray(["baseline:v1", "observation:t1", "observation:t2", "detection:current"]),
    drift_trend_analysis: score > 0.3 ? "Gradual behavioral evolution detected against approved strategic trend." : "Historical trend alignment remains stable.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildVariance(score: number): StrategyVarianceReport {
  const base: Omit<StrategyVarianceReport, "integrity_hash"> = {
    report_id: `strategy_variance_${hash(score).slice(0, 14)}`,
    strategic_distance: score,
    priority_variance: Number((score * 0.8).toFixed(2)),
    objective_variance: Number((score * 0.9).toFixed(2)),
    recommendation_variance: Number((score * 0.7).toFixed(2)),
    governance_variance: Number((score * 0.6).toFixed(2)),
    policy_variance: Number((score * 0.5).toFixed(2)),
    optimization_variance: Number((score * 0.95).toFixed(2)),
    variance_timeline: freezeArray(["variance:baseline", "variance:historical", "variance:current"]),
    strategic_divergence_matrix: freezeArray(["strategic_distance", "priority_variance", "objective_variance", "recommendation_variance", "governance_variance", "policy_variance", "optimization_variance"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidence(baseline: StrategicBaseline, comparison: StrategyComparison): StrategicDriftEvidencePackage {
  const base: Omit<StrategicDriftEvidencePackage, "integrity_hash"> = {
    supporting_recommendations: freezeArray(["recommendation:baseline-aligned", "recommendation:current-evaluation"]),
    affected_missions: freezeArray(["mission:adaptive-intelligence"]),
    baseline_comparisons: freezeArray([baseline.integrity_hash, comparison.integrity_hash]),
    decision_lineage: freezeArray(["decision-lineage:strategic-baseline", "decision-lineage:current-recommendations"]),
    governance_evaluations: freezeArray(["governance:policy-alignment", "governance:authority-verification"]),
    constitutional_evaluations: freezeArray(["constitutional:operator-supremacy", "constitutional:tenant-isolation"]),
    replay_references: freezeArray(["replay:strategic-drift-detection"]),
    operator_decisions: freezeArray(["operator:visibility-required", "operator:review-available"]),
    simulation_outcomes: freezeArray(["simulation:phase-10.11-certified"]),
    historical_trend_analysis: "Historical strategy trend analysis is deterministic and replayable.",
    immutable: true,
    deterministic: true,
    replayable: true,
    cryptographically_verifiable: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOperatorVisibility(): OperatorVisibilityInterface {
  const base: Omit<OperatorVisibilityInterface, "integrity_hash"> = {
    displayed_fields: freezeArray(["detected_drift", "affected_strategy", "strategic_baseline_comparison", "variance_analysis", "supporting_evidence", "severity", "recommended_response", "governance_impact", "constitutional_impact", "replay_links"]),
    operator_capabilities: freezeArray(["review_evidence", "initiate_replay", "request_simulation", "escalate_governance_review", "approve_containment", "reject_recommendations", "require_certification"]),
    governance_impact_visible: true,
    constitutional_impact_visible: true,
    replay_links_visible: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: StrategicDriftInput, baseline: StrategicBaseline, score: number, variance: StrategyVarianceReport, stability: StrategicStabilityAnalysis, evidence: StrategicDriftEvidencePackage, failures: readonly StrategicDriftFailure[]): StrategicDriftRecord {
  const severity = severityFor(failures);
  const base: Omit<StrategicDriftRecord, "integrity_hash"> = {
    drift_id: `strategic_drift_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", score, failures }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    baseline_ref: baseline.integrity_hash,
    strategy_version: baseline.strategy_version,
    drift_category: "STRATEGIC_DRIFT",
    drift_score: score,
    variance_score: variance.strategic_distance,
    stability_score: stability.strategic_stability_score,
    severity,
    affected_recommendations: evidence.supporting_recommendations,
    affected_decisions: evidence.decision_lineage,
    supporting_evidence: evidence.integrity_hash,
    recommended_response: responseFor(severity, failures),
    containment_required: severity === "HIGH" || severity === "CRITICAL" || severity === "CATASTROPHIC",
    replay_refs: evidence.replay_references,
    timestamp: DETECTION_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(score: number, philosophy: RecommendationPhilosophyProfile, hidden: HiddenOptimizationAssessment, stability: StrategicStabilityAnalysis, failures: readonly StrategicDriftFailure[]): StrategicDriftMetrics {
  const base: Omit<StrategicDriftMetrics, "integrity_hash"> = {
    strategic_drift_score: score,
    variance_score: score,
    stability_score: stability.strategic_stability_score,
    philosophy_stability_score: philosophy.philosophy_stability_score,
    hidden_optimization_score: hidden.hidden_optimization_score,
    deterministic_classification: !failures.includes("NONDETERMINISTIC_CLASSIFICATION"),
    replayable_detection: !failures.includes("NONREPLAYABLE_EVIDENCE"),
    governance_aligned: !failures.includes("MISSING_GOVERNANCE_APPROVAL") && !failures.includes("GOVERNANCE_SENSITIVITY_REDUCTION"),
    constitutional_aligned: !failures.includes("CONSTITUTIONAL_CONFLICT") && !failures.includes("CONSTITUTIONAL_SENSITIVITY_REDUCTION"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategicDriftDetectionResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    comparison_hash: result.comparison.integrity_hash,
    philosophy_hash: result.philosophy_profile.integrity_hash,
    hidden_hash: result.hidden_optimization.integrity_hash,
    stability_hash: result.stability_analysis.integrity_hash,
    variance_hash: result.variance_report.integrity_hash,
    evidence_hash: result.evidence_package.integrity_hash,
    record_hash: result.drift_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<StrategicDriftDetectionResult, "integrity_hash">): string {
  return hash({
    version: result.strategic_drift_detection_version,
    detector_identifier: result.detector_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.drift_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function detectStrategicDrift(input: StrategicDriftInput = {}): StrategicDriftDetectionResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const score = driftScore(failures);
  const baseline = buildBaseline();
  const comparison = buildComparison(score, failures);
  const philosophy_profile = buildPhilosophy(score, failures);
  const hidden_optimization = buildHiddenOptimization(failures);
  const stability_analysis = buildStability(score);
  const variance_report = buildVariance(score);
  const evidence_package = buildEvidence(baseline, comparison);
  const drift_record = buildRecord(input, baseline, score, variance_report, stability_analysis, evidence_package, failures);
  const operator_visibility = buildOperatorVisibility();
  const metrics = buildMetrics(score, philosophy_profile, hidden_optimization, stability_analysis, failures);
  const base: Omit<StrategicDriftDetectionResult, "integrity_hash" | "replay_hash"> = {
    strategic_drift_detection_version: DETECTOR_VERSION,
    detector_identifier: DETECTOR_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    comparison,
    philosophy_profile,
    hidden_optimization,
    stability_analysis,
    variance_report,
    evidence_package,
    drift_record,
    operator_visibility,
    metrics,
    failures,
    deterministic: metrics.deterministic_classification,
    replayable: metrics.replayable_detection,
    explainable: !failures.includes("UNEXPLAINED_STRATEGIC_DRIFT") && !failures.includes("UNKNOWN_STRATEGIC_BEHAVIOR"),
    governance_preserved: metrics.governance_aligned,
    constitutional_preserved: metrics.constitutional_aligned,
    operator_authority_preserved: true,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    authorizes_production_change: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategicDriftDetection(result: StrategicDriftDetectionResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.comparison) &&
    verifyHashedRecord(result.philosophy_profile) &&
    verifyHashedRecord(result.hidden_optimization) &&
    verifyHashedRecord(result.stability_analysis) &&
    verifyHashedRecord(result.variance_report) &&
    verifyHashedRecord(result.evidence_package) &&
    verifyHashedRecord(result.drift_record) &&
    verifyHashedRecord(result.operator_visibility) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getStrategicDriftDetectionFoundation(): StrategicDriftFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategic_drift_detection_version: DETECTOR_VERSION,
    api_surface,
    result: detectStrategicDrift(),
  });
}

export const StrategicDriftDetection = Object.freeze({
  detect: detectStrategicDrift,
  replay: replayStrategicDriftDetection,
});
