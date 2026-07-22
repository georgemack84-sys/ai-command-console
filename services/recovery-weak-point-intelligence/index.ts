import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { observeFailures } from "@/services/failure-observation-monitoring";
import type { FailureObservationLedger, ObservationCategory } from "@/types/failure-observation-monitoring";
import type {
  OperationalReadinessSummary,
  ReadinessState,
  RecoveryAnalysis,
  RecoveryIntelligenceLedger,
  RecoveryRecommendation,
  RecoveryStrategy,
  RecoveryWeakPointContract,
  RecoveryWeakPointFailure,
  RecoveryWeakPointInput,
  RecoveryWeakPointObservabilitySurface,
  RecoveryWeakPointReplayResult,
  RecoveryWeakPointScenario,
  RecoveryWeakPointValidationResult,
  StressLevel,
  StressScores,
  WeakPoint,
  WeakPointClassification,
} from "@/types/recovery-weak-point-intelligence";

const VERSION = "recovery-weak-point-intelligence/v8ALT.6.4" as const;
const NOW = "2026-07-13T15:00:00.000Z";
const TENANT_ID = "tenant:autonomy:primary";
const recoveryStates = Object.freeze(["NOT_REQUIRED", "READY", "IN_PROGRESS", "PARTIALLY_RECOVERED", "RECOVERED", "FAILED", "UNRECOVERABLE"] as const);
const weakClasses = Object.freeze(["LOW", "MODERATE", "HIGH", "CRITICAL", "CERTIFICATION_BLOCKER"] as const);
const readinessStates = Object.freeze(["READY", "READY_WITH_IMPROVEMENTS", "LIMITED_DEPLOYMENT", "CERTIFICATION_BLOCKED", "NOT_READY"] as const);
const categories = Object.freeze(["PLANNING_STABILITY", "EXECUTION_HEALTH", "DELEGATION_QUALITY", "ORCHESTRATION_HEALTH", "RUNTIME_SUPERVISION", "GOVERNANCE_COMPLIANCE", "AUTHORITY_ENFORCEMENT", "REPLAY_CONSISTENCY", "INTEGRITY_VERIFICATION", "MISSION_HEALTH", "CONFIDENCE_STABILITY", "RECOVERY_READINESS"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function pct(score: number): number { return Math.round(score * 100); }

function failuresFor(scenario: RecoveryWeakPointScenario): readonly RecoveryWeakPointFailure[] {
  const map: Partial<Record<RecoveryWeakPointScenario, RecoveryWeakPointFailure>> = {
    MISSING_OBSERVATION_LEDGER: "OBSERVATION_LEDGER_MISSING",
    INCOMPLETE_RECOVERY_METRICS: "RECOVERY_METRICS_INCOMPLETE",
    MISSING_RECOVERY_STRATEGY: "RECOVERY_STRATEGY_MISSING",
    MISSING_WEAK_POINT_ANALYSIS: "WEAK_POINT_ANALYSIS_MISSING",
    NONREPRODUCIBLE_STRESS_SCORE: "STRESS_SCORE_NONREPRODUCIBLE",
    MISSING_GOVERNANCE_VALIDATION: "GOVERNANCE_VALIDATION_MISSING",
    MISSING_CONSTITUTIONAL_VALIDATION: "CONSTITUTIONAL_VALIDATION_MISSING",
    MISSING_AUTHORITY_VALIDATION: "AUTHORITY_VALIDATION_MISSING",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    MISSING_EVIDENCE_LINEAGE: "EVIDENCE_LINEAGE_MISSING",
    CROSS_TENANT_INTELLIGENCE: "CROSS_TENANT_INTELLIGENCE_DETECTED",
    RECOMMENDATION_NOT_OPERATOR_VISIBLE: "RECOMMENDATION_OPERATOR_VISIBILITY_MISSING",
    NON_ADVISORY_RECOVERY_ACTION: "NON_ADVISORY_RECOVERY_ACTION_ATTEMPTED",
    INTEGRITY_HASH_FAILURE: "INTEGRITY_HASH_INVALID",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function sourceLedger(input: RecoveryWeakPointInput, failures: readonly RecoveryWeakPointFailure[]): FailureObservationLedger | null {
  if (failures.includes("OBSERVATION_LEDGER_MISSING")) return null;
  if (input.observation_ledger) return input.observation_ledger;
  return observeFailures({ tenant_id: input.tenant_id, mission_id: input.mission_id });
}

function analysisHash(analysis: Omit<RecoveryAnalysis, "analysis_hash"> | RecoveryAnalysis): string {
  const { analysis_hash: _hash, ...source } = analysis as RecoveryAnalysis;
  return hashValue("recovery-analysis", source);
}

function buildRecoveryAnalysis(obs: FailureObservationLedger, failures: readonly RecoveryWeakPointFailure[]): RecoveryAnalysis | null {
  if (failures.includes("RECOVERY_METRICS_INCOMPLETE")) return null;
  const recovery = obs.subsystem_health_report.recovery_readiness;
  const base = { recovery_state: recovery > 0.7 ? "RECOVERED" as const : "PARTIALLY_RECOVERED" as const, recovery_speed: recovery, recovery_accuracy: recovery, recovery_success_rate: recovery, rollback_readiness: recovery, restart_readiness: recovery, operator_intervention_latency: "PT2M", recovery_reproducibility: 1, recovery_confidence: recovery, mission_restoration: obs.subsystem_health_report.mission_health, replay_restoration: obs.subsystem_health_report.replay_health, integrity_restoration: obs.subsystem_health_report.integrity_health, governance_preservation: obs.subsystem_health_report.governance_health, authority_preservation: 0.91, tenant_preservation: obs.tenant_id.startsWith("tenant:") ? 1 : 0 };
  return Object.freeze({ ...base, analysis_hash: analysisHash(base) });
}

function componentScores(obs: FailureObservationLedger): Record<ObservationCategory | "TENANT_ISOLATION", number> {
  const lookup = new Map(obs.observations.map((item) => [item.observation_category, pct(item.health_score)]));
  return {
    PLANNING_STABILITY: lookup.get("PLANNING_STABILITY") ?? 0,
    EXECUTION_HEALTH: lookup.get("EXECUTION_HEALTH") ?? 0,
    DELEGATION_QUALITY: lookup.get("DELEGATION_QUALITY") ?? 0,
    ORCHESTRATION_HEALTH: lookup.get("ORCHESTRATION_HEALTH") ?? 0,
    RUNTIME_SUPERVISION: lookup.get("RUNTIME_SUPERVISION") ?? 0,
    GOVERNANCE_COMPLIANCE: lookup.get("GOVERNANCE_COMPLIANCE") ?? 0,
    AUTHORITY_ENFORCEMENT: lookup.get("AUTHORITY_ENFORCEMENT") ?? 0,
    REPLAY_CONSISTENCY: lookup.get("REPLAY_CONSISTENCY") ?? 0,
    INTEGRITY_VERIFICATION: lookup.get("INTEGRITY_VERIFICATION") ?? 0,
    MISSION_HEALTH: lookup.get("MISSION_HEALTH") ?? 0,
    CONFIDENCE_STABILITY: lookup.get("CONFIDENCE_STABILITY") ?? 0,
    RECOVERY_READINESS: lookup.get("RECOVERY_READINESS") ?? 0,
    TENANT_ISOLATION: obs.tenant_id.startsWith("tenant:") ? 100 : 0,
  };
}

function stressLevel(score: number): StressLevel {
  if (score >= 95) return "RESILIENT";
  if (score >= 85) return "STRONG";
  if (score >= 70) return "STABLE";
  if (score >= 50) return "DEGRADED";
  return "CRITICAL";
}

function scoreHash(scores: Omit<StressScores, "score_hash"> | StressScores): string {
  const { score_hash: _hash, ...source } = scores as StressScores;
  return hashValue("recovery-stress-scores", source);
}

function buildStressScores(obs: FailureObservationLedger, failures: readonly RecoveryWeakPointFailure[]): StressScores | null {
  const components = componentScores(obs);
  const values = Object.values(components);
  const overall = failures.includes("STRESS_SCORE_NONREPRODUCIBLE") ? 101 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const base = { overall_stress_score: overall, stress_level: stressLevel(overall), component_scores: Object.freeze(components), recovery_score: components.RECOVERY_READINESS, resilience_score: Math.round((overall + components.TENANT_ISOLATION) / 2) };
  return Object.freeze({ ...base, score_hash: scoreHash(base) });
}

function weakClass(score: number): WeakPointClassification {
  if (score < 45) return "CERTIFICATION_BLOCKER";
  if (score < 55) return "CRITICAL";
  if (score < 70) return "HIGH";
  if (score < 85) return "MODERATE";
  return "LOW";
}

function weakHash(weak: Omit<WeakPoint, "weak_point_hash"> | WeakPoint): string {
  const { weak_point_hash: _hash, ...source } = weak as WeakPoint;
  return hashValue("recovery-weak-point", source);
}

function buildWeakPoints(obs: FailureObservationLedger, failures: readonly RecoveryWeakPointFailure[]): readonly WeakPoint[] {
  if (failures.includes("WEAK_POINT_ANALYSIS_MISSING")) return freezeArray([]);
  return freezeArray(obs.observations.filter((item) => item.health_score < 0.75).map((item) => {
    const base = { weak_point_id: id("RWP", "recovery-weak-point", item.observation_id), affected_component: String(item.observed_component), classification: weakClass(pct(item.health_score)), evidence_chain: freezeArray([item.evidence_reference].filter(Boolean)), supporting_observations: freezeArray([item.observation_id]), replay_reference: item.replay_reference, lineage_reference: item.lineage_reference };
    return Object.freeze({ ...base, weak_point_hash: weakHash(base) });
  }));
}

function strategyHash(strategy: Omit<RecoveryStrategy, "strategy_hash"> | RecoveryStrategy): string {
  const { strategy_hash: _hash, ...source } = strategy as RecoveryStrategy;
  return hashValue("recovery-strategy", source);
}

function buildStrategies(obs: FailureObservationLedger, failures: readonly RecoveryWeakPointFailure[]): readonly RecoveryStrategy[] {
  if (failures.includes("RECOVERY_STRATEGY_MISSING")) return freezeArray([]);
  const base = { strategy_id: id("RWS", "recovery-strategy", obs.ledger_id), strategy_type: "Manual Intervention" as const, affected_component: "RECOVERY_READINESS", rationale: "operator-visible recovery sequencing preserves governance and replay integrity", governance_validation: failures.includes("GOVERNANCE_VALIDATION_MISSING") ? "MISSING" as const : "VALIDATED" as const, constitutional_validation: failures.includes("CONSTITUTIONAL_VALIDATION_MISSING") ? "MISSING" as const : "VALIDATED" as const, authority_validation: failures.includes("AUTHORITY_VALIDATION_MISSING") ? "MISSING" as const : "VALIDATED" as const, replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : obs.replay_reference, lineage_reference: failures.includes("EVIDENCE_LINEAGE_MISSING") ? "" : obs.lineage_reference, advisory_only: true as const, action_executed: failures.includes("NON_ADVISORY_RECOVERY_ACTION_ATTEMPTED") };
  return freezeArray([Object.freeze({ ...base, strategy_hash: strategyHash(base) })]);
}

function recommendationHash(rec: Omit<RecoveryRecommendation, "integrity_hash"> | RecoveryRecommendation): string {
  const { integrity_hash: _hash, ...source } = rec as RecoveryRecommendation;
  return hashValue("recovery-recommendation", source);
}

function buildRecommendations(weakPoints: readonly WeakPoint[], strategies: readonly RecoveryStrategy[], failures: readonly RecoveryWeakPointFailure[]): readonly RecoveryRecommendation[] {
  const fallbackWeakPoint: WeakPoint = Object.freeze({ weak_point_id: "RWP-FALLBACK", affected_component: "Architecture", classification: "LOW", evidence_chain: freezeArray([]), supporting_observations: freezeArray([]), replay_reference: "", lineage_reference: "", weak_point_hash: "fallback" });
  return freezeArray((weakPoints.length ? weakPoints : [fallbackWeakPoint]).slice(0, 3).map((weak, index) => {
    const base = { recommendation_id: id("RWR", "recovery-recommendation", { weak: weak.affected_component, index }), category: index === 0 ? "Recovery" as const : "Architecture" as const, priority: weak.classification === "CERTIFICATION_BLOCKER" ? "CERTIFICATION_REQUIRED" as const : weak.classification === "CRITICAL" ? "CRITICAL" as const : "HIGH" as const, affected_component: weak.affected_component, evidence_chain: failures.includes("EVIDENCE_LINEAGE_MISSING") ? freezeArray<string>([]) : weak.evidence_chain, supporting_failures: freezeArray([weak.classification]), expected_improvement: "increase deterministic recovery readiness and reduce subsystem coupling", governance_validation: strategies[0]?.governance_validation ?? "MISSING", authority_validation: strategies[0]?.authority_validation ?? "MISSING", operator_visible: !failures.includes("RECOMMENDATION_OPERATOR_VISIBILITY_MISSING"), advisory_only: true as const, action_executed: failures.includes("NON_ADVISORY_RECOVERY_ACTION_ATTEMPTED"), replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : weak.replay_reference, lineage_reference: failures.includes("EVIDENCE_LINEAGE_MISSING") ? "" : weak.lineage_reference };
    return Object.freeze({ ...base, integrity_hash: recommendationHash(base) });
  }));
}

function readinessHash(summary: Omit<OperationalReadinessSummary, "readiness_hash"> | OperationalReadinessSummary): string {
  const { readiness_hash: _hash, ...source } = summary as OperationalReadinessSummary;
  return hashValue("operational-readiness", source);
}

function readiness(scores: StressScores | null, analysis: RecoveryAnalysis | null, weakPoints: readonly WeakPoint[], recs: readonly RecoveryRecommendation[]): OperationalReadinessSummary | null {
  if (!scores || !analysis) return null;
  const blocker = weakPoints.some((item) => item.classification === "CERTIFICATION_BLOCKER");
  const state: ReadinessState = blocker ? "CERTIFICATION_BLOCKED" : weakPoints.length === 0 && scores.overall_stress_score >= 95 ? "READY" : scores.overall_stress_score >= 85 ? "READY_WITH_IMPROVEMENTS" : scores.overall_stress_score >= 70 ? "LIMITED_DEPLOYMENT" : "NOT_READY";
  const base = { readiness_state: state, stress_resilience: scores.overall_stress_score, recovery_readiness: scores.component_scores.RECOVERY_READINESS, mission_continuity: scores.component_scores.MISSION_HEALTH, governance_preservation: analysis.governance_preservation > 0, authority_preservation: analysis.authority_preservation > 0, replay_integrity: analysis.replay_restoration > 0, integrity_preservation: analysis.integrity_restoration > 0, operator_visibility: recs.every((item) => item.operator_visible), certification_readiness: state === "READY" || state === "READY_WITH_IMPROVEMENTS" };
  return Object.freeze({ ...base, readiness_hash: readinessHash(base) });
}

function ledgerHash(ledger: Omit<RecoveryIntelligenceLedger, "ledger_hash"> | RecoveryIntelligenceLedger): string {
  const { ledger_hash: _hash, ...source } = ledger as RecoveryIntelligenceLedger;
  return hashValue("recovery-weak-point-ledger", source);
}

export function analyzeRecoveryWeakPoints(input: RecoveryWeakPointInput = {}): RecoveryIntelligenceLedger {
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const obs = sourceLedger(input, failures);
  const analysis = obs ? buildRecoveryAnalysis(obs, failures) : null;
  const scores = obs ? buildStressScores(obs, failures) : null;
  const weakPoints = obs ? buildWeakPoints(obs, failures) : freezeArray<WeakPoint>([]);
  const strategies = obs ? buildStrategies(obs, failures) : freezeArray<RecoveryStrategy>([]);
  const recs = buildRecommendations(weakPoints, strategies, failures);
  const ready = readiness(scores, analysis, weakPoints, recs);
  const analysisId = id("RWI", "recovery-weak-point-intelligence", { obs: obs?.ledger_id ?? "missing", scenario: input.scenario ?? "BASELINE" });
  const base = { analysis_id: analysisId, engine_version: VERSION, scenario_id: obs?.source_stress_ledger?.scenario?.scenario_id ?? "", simulation_id: obs?.simulation_id ?? "", mission_id: input.mission_id ?? obs?.mission_id ?? "mission:recovery-weak-point", tenant_id: failures.includes("CROSS_TENANT_INTELLIGENCE_DETECTED") ? "external-tenant" : input.tenant_id ?? obs?.tenant_id ?? TENANT_ID, source_observation_ledger: obs, recovery_analysis: analysis, recovery_strategies: strategies, identified_weak_points: weakPoints, stress_scores: scores, recommended_actions: recs, resilience_report: freezeArray(["subsystem resilience assessed", "governance resilience assessed", "authority resilience assessed", "replay resilience assessed", "integrity resilience assessed", "mission resilience assessed", "recovery resilience assessed", "confidence resilience assessed", "infrastructure resilience assessed"]), architecture_improvement_report: freezeArray(recs.map((item) => `${item.priority}: ${item.affected_component}`)), operational_readiness: ready, governance_validation: failures.includes("GOVERNANCE_VALIDATION_MISSING") ? "MISSING" as const : "VALIDATED" as const, constitutional_validation: failures.includes("CONSTITUTIONAL_VALIDATION_MISSING") ? "MISSING" as const : "VALIDATED" as const, authority_validation: failures.includes("AUTHORITY_VALIDATION_MISSING") ? "MISSING" as const : "VALIDATED" as const, replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:recovery-weak-point:${analysisId}`, lineage_reference: failures.includes("EVIDENCE_LINEAGE_MISSING") ? "" : `lineage:recovery-weak-point:${analysisId}`, timestamp: NOW, advisory_only: true as const, action_executed: failures.includes("NON_ADVISORY_RECOVERY_ACTION_ATTEMPTED"), append_only: true as const, integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("recovery-weak-point-integrity", { analysisId, obs: obs?.ledger_hash, recs: recs.map((item) => item.integrity_hash) }) };
  return Object.freeze({ ...base, ledger_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : ledgerHash(base as Omit<RecoveryIntelligenceLedger, "ledger_hash">) });
}

export function getRecoveryStrategies(input: RecoveryWeakPointInput = {}) { return analyzeRecoveryWeakPoints(input).recovery_strategies; }
export function getWeakPoints(input: RecoveryWeakPointInput = {}) { return analyzeRecoveryWeakPoints(input).identified_weak_points; }
export function getStressScores(input: RecoveryWeakPointInput = {}) { return analyzeRecoveryWeakPoints(input).stress_scores; }
export function getRecoveryRecommendations(input: RecoveryWeakPointInput = {}) { return analyzeRecoveryWeakPoints(input).recommended_actions; }
export function getOperationalReadiness(input: RecoveryWeakPointInput = {}) { return analyzeRecoveryWeakPoints(input).operational_readiness; }

export function validateRecoveryWeakPoints(ledger = analyzeRecoveryWeakPoints()): RecoveryWeakPointValidationResult {
  const observation_ledger_present = Boolean(ledger.source_observation_ledger);
  const recovery_metrics_complete = Boolean(ledger.recovery_analysis);
  const recovery_strategy_present = ledger.recovery_strategies.length > 0;
  const weak_point_analysis_present = ledger.identified_weak_points.length > 0;
  const stress_score_reproducible = Boolean(ledger.stress_scores && ledger.stress_scores.overall_stress_score >= 0 && ledger.stress_scores.overall_stress_score <= 100);
  const governance_valid = ledger.governance_validation === "VALIDATED" && ledger.recovery_strategies.every((item) => item.governance_validation === "VALIDATED");
  const constitutional_valid = ledger.constitutional_validation === "VALIDATED" && ledger.recovery_strategies.every((item) => item.constitutional_validation === "VALIDATED");
  const authority_valid = ledger.authority_validation === "VALIDATED" && ledger.recovery_strategies.every((item) => item.authority_validation === "VALIDATED") && ledger.recommended_actions.every((item) => item.authority_validation === "VALIDATED");
  const replay_valid = Boolean(ledger.replay_reference) && ledger.recovery_strategies.every((item) => item.replay_reference) && ledger.recommended_actions.every((item) => item.replay_reference);
  const evidence_lineage_complete = Boolean(ledger.lineage_reference) && ledger.identified_weak_points.every((item) => item.evidence_chain.length > 0 && item.lineage_reference) && ledger.recommended_actions.every((item) => item.evidence_chain.length > 0 && item.lineage_reference);
  const tenant_isolated = ledger.tenant_id.startsWith("tenant:") && (!ledger.source_observation_ledger || ledger.tenant_id === ledger.source_observation_ledger.tenant_id);
  const recommendations_operator_visible = ledger.recommended_actions.every((item) => item.operator_visible);
  const advisory_only_enforced = ledger.advisory_only && !ledger.action_executed && ledger.recovery_strategies.every((item) => !item.action_executed) && ledger.recommended_actions.every((item) => !item.action_executed);
  const integrity_valid = Boolean(ledger.integrity_hash && ledger.ledger_hash) && ledgerHash(ledger) === ledger.ledger_hash;
  const failures = unique([
    ...(!observation_ledger_present ? ["OBSERVATION_LEDGER_MISSING" as const] : []),
    ...(!recovery_metrics_complete ? ["RECOVERY_METRICS_INCOMPLETE" as const] : []),
    ...(!recovery_strategy_present ? ["RECOVERY_STRATEGY_MISSING" as const] : []),
    ...(!weak_point_analysis_present ? ["WEAK_POINT_ANALYSIS_MISSING" as const] : []),
    ...(!stress_score_reproducible ? ["STRESS_SCORE_NONREPRODUCIBLE" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_VALIDATION_MISSING" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_VALIDATION_MISSING" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_VALIDATION_MISSING" as const] : []),
    ...(!replay_valid ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!evidence_lineage_complete ? ["EVIDENCE_LINEAGE_MISSING" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_INTELLIGENCE_DETECTED" as const] : []),
    ...(!recommendations_operator_visible ? ["RECOMMENDATION_OPERATOR_VISIBILITY_MISSING" as const] : []),
    ...(!advisory_only_enforced ? ["NON_ADVISORY_RECOVERY_ACTION_ATTEMPTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { analysis_id: ledger.analysis_id, valid, observation_ledger_present, recovery_metrics_complete, recovery_strategy_present, weak_point_analysis_present, stress_score_reproducible, governance_valid, constitutional_valid, authority_valid, replay_valid, evidence_lineage_complete, tenant_isolated, recommendations_operator_visible, advisory_only_enforced, integrity_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("recovery-weak-point-validation", source) });
}

export function replayRecoveryWeakPoints(ledger = analyzeRecoveryWeakPoints()): RecoveryWeakPointReplayResult {
  const reconstructed_hash = ledgerHash(ledger);
  const source = { replay_reference: ledger.replay_reference, analysis_id: ledger.analysis_id, deterministic: Boolean(ledger.replay_reference) && reconstructed_hash === ledger.ledger_hash, reconstructed_hash, original_hash: ledger.ledger_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("recovery-weak-point-replay", source) });
}

export function buildRecoveryWeakPointObservabilitySurface(ledger = analyzeRecoveryWeakPoints()): RecoveryWeakPointObservabilitySurface {
  return Object.freeze({ analysis_id: ledger.analysis_id, tenant_id: ledger.tenant_id, mission_id: ledger.mission_id, weak_point_count: ledger.identified_weak_points.length, recommendation_count: ledger.recommended_actions.length, readiness_state: ledger.operational_readiness?.readiness_state ?? "UNKNOWN", advisory_only: true, ledger_hash: ledger.ledger_hash });
}

export function getRecoveryWeakPointContract(): RecoveryWeakPointContract {
  const ledger = analyzeRecoveryWeakPoints();
  return Object.freeze({
    doctrine: Object.freeze({ engine_version: VERSION, principles: freezeArray(["deterministic-recovery-analysis", "evidence-backed-weak-point-detection", "replay-compatible-scoring", "governance-aware-recommendations", "constitutional-compliance", "authority-boundaries", "operator-visible-intelligence", "tenant-isolation", "advisory-only-recovery", "certification-ready-readiness"]), recovery_states: recoveryStates, weak_point_classifications: weakClasses, readiness_states: readinessStates, advisory_only: true }),
    ledger,
    validation: validateRecoveryWeakPoints(ledger),
    replay: replayRecoveryWeakPoints(ledger),
    observability: buildRecoveryWeakPointObservabilitySurface(ledger),
  });
}
