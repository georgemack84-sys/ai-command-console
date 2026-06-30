import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runRecoveryValidation, assessRecoveryValidation } from "@/services/recovery-validation-engine";
import type { RecoveryValidationPackage, RecoveryValidationScenario } from "@/types/recovery-validation-engine";
import type {
  OperatorRecommendationPackage,
  RecommendationExpectedOutcome,
  RecommendationRiskAssessment,
  RecoveryRecommendationEngineContract,
  RecoveryRecommendationFailure,
  RecoveryRecommendationInput,
  RecoveryRecommendationLevel,
  RecoveryRecommendationObservabilitySurface,
  RecoveryRecommendationPackage,
  RecoveryRecommendationRecord,
  RecoveryRecommendationReplayResult,
  RecoveryRecommendationScenario,
  RecoveryRecommendationType,
  RecoveryRecommendationValidationResult,
} from "@/types/recovery-recommendation-engine";
import type { RecoveryPlanningRiskLevel, RecoveryStrategyType } from "@/types/recovery-planning-engine";
import type { RecoveryValidationStatus } from "@/types/recovery-contract";

const NOW = "2026-07-06T12:00:00.000Z";
const VERSION = "recovery-recommendation-engine/v8ALT.2.5" as const;
const REPLAY_VERSION = "recovery-recommendation-replay/v8ALT.2.5" as const;
const TENANT_ID = "tenant:autonomy:primary";
const recommendationTypes = Object.freeze(["RECOMMENDED_RECOVERY", "RECOMMENDED_ROLLBACK", "RECOMMENDED_RESTART", "ALTERNATIVE_RECOVERY", "OPERATOR_INTERVENTION_GUIDANCE"] as const);
const recommendationLevels = Object.freeze(["MONITOR", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const);
const confidenceLevels = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT"] as const);
const riskLevels = Object.freeze(["MINIMAL", "LOW", "MODERATE", "HIGH", "CRITICAL"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function toValidationScenario(scenario: RecoveryRecommendationScenario): RecoveryValidationScenario {
  const map: Partial<Record<RecoveryRecommendationScenario, RecoveryValidationScenario>> = {
    BASELINE: "BASELINE",
    MONITOR_LEVEL: "BASELINE",
    LOW_LEVEL: "BASELINE",
    MEDIUM_LEVEL: "BASELINE",
    HIGH_LEVEL: "BASELINE",
    CRITICAL_LEVEL: "AUTHORITY_VIOLATION",
    VALIDATION_REJECTED: "GOVERNANCE_BYPASS",
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    EXECUTION_ATTEMPT: "AUTONOMOUS_EXECUTION_ATTEMPT",
    RESTART_ATTEMPT: "AUTOMATIC_RESTART_ATTEMPT",
    ROLLBACK_ATTEMPT: "AUTOMATIC_ROLLBACK_ATTEMPT",
    PLAN_MUTATION_ATTEMPT: "BASELINE",
    GOVERNANCE_MUTATION_ATTEMPT: "POLICY_MUTATION_ATTEMPT",
    CONSTITUTIONAL_MUTATION_ATTEMPT: "CONSTITUTIONAL_MUTATION_ATTEMPT",
    AUTHORITY_ESCALATION_ATTEMPT: "AUTHORITY_ESCALATION_ATTEMPT",
    APPROVAL_BYPASS: "MISSING_OPERATOR_APPROVAL",
    RISK_CONCEALMENT: "BASELINE",
    CONFIDENCE_FABRICATION: "BASELINE",
    ALTERNATIVE_SUPPRESSION: "BASELINE",
  };
  return map[scenario] ?? scenario as RecoveryValidationScenario;
}

function scenarioFailures(scenario: RecoveryRecommendationScenario): readonly RecoveryRecommendationFailure[] {
  const map: Partial<Record<RecoveryRecommendationScenario, RecoveryRecommendationFailure>> = {
    VALIDATION_REJECTED: "VALIDATION_NOT_PASSED",
    REPLAY_MISMATCH: "REPLAY_INVALID",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_INVALID",
    EXECUTION_ATTEMPT: "EXECUTION_DETECTED",
    RESTART_ATTEMPT: "RESTART_DETECTED",
    ROLLBACK_ATTEMPT: "ROLLBACK_DETECTED",
    PLAN_MUTATION_ATTEMPT: "PLAN_MUTATION_DETECTED",
    GOVERNANCE_MUTATION_ATTEMPT: "GOVERNANCE_MUTATION_DETECTED",
    CONSTITUTIONAL_MUTATION_ATTEMPT: "CONSTITUTIONAL_MUTATION_DETECTED",
    AUTHORITY_ESCALATION_ATTEMPT: "AUTHORITY_ESCALATION_DETECTED",
    APPROVAL_BYPASS: "OPERATOR_APPROVAL_INVALID",
    RISK_CONCEALMENT: "RISK_CONCEALMENT_DETECTED",
    CONFIDENCE_FABRICATION: "CONFIDENCE_FABRICATION_DETECTED",
    ALTERNATIVE_SUPPRESSION: "ALTERNATIVE_SUPPRESSION_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function levelFor(score: number, risk: RecoveryPlanningRiskLevel, scenario: RecoveryRecommendationScenario): RecoveryRecommendationLevel {
  if (scenario === "MONITOR_LEVEL") return "MONITOR";
  if (scenario === "LOW_LEVEL") return "LOW";
  if (scenario === "MEDIUM_LEVEL") return "MEDIUM";
  if (scenario === "HIGH_LEVEL") return "HIGH";
  if (scenario === "CRITICAL_LEVEL") return "CRITICAL";
  if (risk === "CRITICAL") return "CRITICAL";
  if (risk === "HIGH") return "HIGH";
  if (score < 0.7) return "MEDIUM";
  if (risk === "MODERATE") return "MEDIUM";
  if (risk === "LOW") return "LOW";
  return "MONITOR";
}

function outcome(packageId: string, score: number, risk: RecoveryPlanningRiskLevel, duration: string): RecommendationExpectedOutcome {
  const base = {
    mission_recovery_likelihood: Number(Math.min(0.99, score).toFixed(4)),
    execution_continuity: score >= 0.8 ? "continuity likely after operator-approved recovery" : "continuity uncertain without operator review",
    dependency_restoration: "dependency restoration follows validated recovery planning sequence",
    governance_impact: risk,
    operational_disruption: risk,
    estimated_recovery_duration: duration,
    residual_risks: freezeArray(risk === "MINIMAL" || risk === "LOW" ? ["operator approval still required"] : ["mission disruption", "governance review required"]),
    replay_consistency: 0.94,
  };
  return Object.freeze({ ...base, outcome_hash: hashValue("recovery-recommendation-outcome", { packageId, ...base }) });
}

function riskAssessment(packageId: string, risk: RecoveryPlanningRiskLevel): RecommendationRiskAssessment {
  const base = {
    mission_risk: risk,
    operational_disruption: risk,
    governance_risk: risk === "CRITICAL" ? "CRITICAL" as const : "LOW" as const,
    authority_risk: risk === "CRITICAL" ? "HIGH" as const : "LOW" as const,
    dependency_risk: risk,
    integrity_risk: risk === "CRITICAL" ? "HIGH" as const : "LOW" as const,
    recurrence_probability: risk === "CRITICAL" ? 0.62 : risk === "HIGH" ? 0.42 : 0.18,
    recovery_complexity: risk,
  };
  return Object.freeze({ ...base, risk_hash: hashValue("recovery-recommendation-risk", { packageId, ...base }) });
}

function actionFor(type: RecoveryRecommendationType, strategy: RecoveryStrategyType): string {
  const map: Record<RecoveryRecommendationType, string> = {
    RECOMMENDED_RECOVERY: `Review and approve ${strategy.toLowerCase().replace(/_/g, " ")} recovery package if operational context remains valid.`,
    RECOMMENDED_ROLLBACK: "Review rollback prerequisites and approve rollback only after checkpoint integrity is confirmed.",
    RECOMMENDED_RESTART: "Review restart point, sequence, and dependencies before explicit restart approval.",
    ALTERNATIVE_RECOVERY: "Compare alternative approved recovery paths before selecting operator action.",
    OPERATOR_INTERVENTION_GUIDANCE: "Perform manual governance and authority review before any recovery action.",
  };
  return map[type];
}

function recommendation(type: RecoveryRecommendationType, validation: RecoveryValidationPackage, scenario: RecoveryRecommendationScenario, rank: number, failures: readonly RecoveryRecommendationFailure[]): RecoveryRecommendationRecord {
  const plan = type === "RECOMMENDED_ROLLBACK"
    ? validation.validation.source_planning_package.plans.find((item) => item.strategy_type === "ROLLBACK") ?? validation.validation.source_planning_package.selected_plan
    : type === "RECOMMENDED_RESTART"
      ? validation.validation.source_planning_package.plans.find((item) => item.strategy_type === "RESTART") ?? validation.validation.source_planning_package.selected_plan
      : type === "ALTERNATIVE_RECOVERY"
        ? validation.validation.source_planning_package.plans.find((item) => item.rank === 2) ?? validation.validation.source_planning_package.selected_plan
        : validation.validation.source_planning_package.selected_plan;
  const recommendation_id = id("RREC", "recovery-recommendation-id", { type, validation: validation.validation.validation_id, plan: plan.recovery_plan_id });
  const confidence_score = failures.includes("CONFIDENCE_FABRICATION_DETECTED") ? 1 : plan.confidence_score;
  const risk = failures.includes("RISK_CONCEALMENT_DETECTED") ? "MINIMAL" : plan.operational_risk;
  const expected_outcome = outcome(recommendation_id, confidence_score, risk, plan.estimated_duration);
  const risk_assessment = riskAssessment(recommendation_id, risk);
  const level = levelFor(confidence_score, risk, scenario);
  const governance_status: RecoveryValidationStatus = validation.validation.validation_result === "PASS" && !failures.includes("GOVERNANCE_MUTATION_DETECTED") ? "VALID" : "INVALID";
  const authority_status: RecoveryValidationStatus = validation.validation.validation_result === "PASS" && !failures.includes("AUTHORITY_ESCALATION_DETECTED") ? "VALID" : "INVALID";
  const base = {
    recommendation_id,
    recovery_plan_id: plan.recovery_plan_id,
    recovery_id: validation.validation.recovery_id,
    mission_id: validation.validation.mission_id,
    execution_id: validation.validation.execution_id,
    tenant_id: validation.validation.tenant_id,
    recommendation_type: type,
    recommendation_level: level,
    recommended_action: actionFor(type, plan.strategy_type),
    explanation: `Recommendation ${type.toLowerCase().replace(/_/g, " ")} is based on validated plan ${plan.strategy_type}, root cause ${validation.validation.source_planning_package.source_failure_analysis.root_cause.cause}, governance evidence, authority validation, replay consistency, and operational risk ${risk}.`,
    expected_outcome,
    confidence_score,
    confidence_level: plan.confidence_level,
    recovery_risk: risk,
    risk_assessment,
    governance_status,
    authority_status,
    operator_approval_required: true as const,
    replay_reference: `replay:${recommendation_id}`,
    lineage_reference: `lineage:${recommendation_id}`,
    integrity_hash: failures.includes("CONFIDENCE_FABRICATION_DETECTED") ? "" : hashValue("recovery-recommendation-integrity", { recommendation_id, plan: plan.plan_hash, outcome: expected_outcome.outcome_hash, risk: risk_assessment.risk_hash }),
    timestamp: NOW,
    rank,
  };
  return Object.freeze({ ...base, recommendation_hash: hashValue("recovery-recommendation-record", base) });
}

function rankRecommendations(recs: readonly RecoveryRecommendationRecord[]): readonly RecoveryRecommendationRecord[] {
  const ranked = [...recs].sort((a, b) => {
    const gov = Number(b.governance_status === "VALID") - Number(a.governance_status === "VALID");
    if (gov) return gov;
    const auth = Number(b.authority_status === "VALID") - Number(a.authority_status === "VALID");
    if (auth) return auth;
    const confidence = b.confidence_score - a.confidence_score;
    if (confidence) return confidence;
    const riskOrder = (level: RecoveryPlanningRiskLevel) => riskLevels.indexOf(level);
    const risk = riskOrder(a.recovery_risk) - riskOrder(b.recovery_risk);
    if (risk) return risk;
    return a.recommendation_type.localeCompare(b.recommendation_type);
  });
  return freezeArray(ranked.map((rec, index) => {
    const source = { ...rec, rank: index + 1, recommendation_hash: undefined };
    return Object.freeze({ ...rec, rank: index + 1, recommendation_hash: hashValue("recovery-recommendation-record", source) });
  }));
}

export function computeRecoveryRecommendationPackageHash(pkg: Omit<RecoveryRecommendationPackage, "package_hash"> | RecoveryRecommendationPackage): string {
  const { package_hash: _hash, ...source } = pkg as RecoveryRecommendationPackage;
  return hashValue("recovery-recommendation-package", source);
}

export function generateRecoveryRecommendations(input: RecoveryRecommendationInput = {}): RecoveryRecommendationPackage {
  const scenario = input.scenario ?? "BASELINE";
  const validation = input.validation_package ?? runRecoveryValidation({ scenario: toValidationScenario(scenario) });
  const injectedFailures = scenarioFailures(scenario);
  const validationAssessment = assessRecoveryValidation(validation);
  const failures = unique([
    ...injectedFailures,
    ...(!validationAssessment.valid ? ["VALIDATION_NOT_PASSED" as const] : []),
    ...(!validationAssessment.replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!validationAssessment.tenant_valid ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!validationAssessment.integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
  ]);
  const package_id = id("RRPK", "recovery-recommendation-package", { scenario, validation: validation.package_hash });
  const types: readonly RecoveryRecommendationType[] = failures.includes("ALTERNATIVE_SUPPRESSION_DETECTED") ? ["RECOMMENDED_RECOVERY", "RECOMMENDED_ROLLBACK", "RECOMMENDED_RESTART", "OPERATOR_INTERVENTION_GUIDANCE"] : recommendationTypes;
  const recommendations = rankRecommendations(types.map((type, index) => recommendation(type, validation, scenario, index + 1, failures)));
  const selected = recommendations[0];
  const alternatives = freezeArray(recommendations.filter((item) => item.recommendation_type === "ALTERNATIVE_RECOVERY" || item.recommendation_id !== selected.recommendation_id).slice(0, 3));
  const governanceEvidence = freezeArray(validation.validation.governance_evidence.map((item) => item.evidence_id));
  const authorityEvidence = freezeArray(validation.validation.governance_evidence.filter((item) => item.category === "AUTHORITY").map((item) => item.evidence_id));
  const operatorBase: Omit<OperatorRecommendationPackage, "package_hash"> = {
    executive_summary: `${selected.recommendation_level} recovery recommendation prepared for operator review.`,
    detected_failures: validation.validation.source_planning_package.source_failure_analysis.evidence.map((item) => item.signal),
    root_cause_analysis: validation.validation.source_planning_package.source_failure_analysis.root_cause.cause,
    recommended_recovery: selected,
    alternative_recoveries: alternatives,
    rollback_recommendation: recommendations.find((item) => item.recommendation_type === "RECOMMENDED_ROLLBACK") ?? selected,
    restart_recommendation: recommendations.find((item) => item.recommendation_type === "RECOMMENDED_RESTART") ?? selected,
    operator_guidance: recommendations.find((item) => item.recommendation_type === "OPERATOR_INTERVENTION_GUIDANCE") ?? selected,
    governance_evidence: governanceEvidence,
    authority_evidence: authorityEvidence,
    confidence_score: selected.confidence_score,
    risk_assessment: selected.risk_assessment,
    expected_outcome: selected.expected_outcome,
    replay_reference: `replay:${package_id}`,
    lineage_reference: `lineage:${package_id}`,
    integrity_verification: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("recovery-recommendation-package-integrity", recommendations.map((item) => item.recommendation_hash)),
  };
  const operator_package = Object.freeze({ ...operatorBase, package_hash: hashValue("operator-recommendation-package", operatorBase) });
  const replayChecksum = failures.includes("REPLAY_INVALID") ? "mismatch" : hashValue("recovery-recommendation-replay-checksum", { package_id, recommendations: recommendations.map((item) => item.recommendation_hash), selected: selected.recommendation_id });
  const replayBase = {
    replay_reference: operator_package.replay_reference,
    replay_version: REPLAY_VERSION,
    recommendation_inputs: hashValue("recovery-recommendation-inputs", { scenario, validation: validation.package_hash }),
    recovery_plans_evaluated: hashValue("recovery-recommendation-plans", validation.validation.source_planning_package.plans.map((item) => item.plan_hash)),
    ranking_decisions: hashValue("recovery-recommendation-ranking", recommendations.map((item) => item.recommendation_hash)),
    confidence_calculations: hashValue("recovery-recommendation-confidence", recommendations.map((item) => item.confidence_score)),
    explanation_generation: hashValue("recovery-recommendation-explanations", recommendations.map((item) => item.explanation)),
    governance_evidence: hashValue("recovery-recommendation-governance", governanceEvidence),
    authority_evidence: hashValue("recovery-recommendation-authority", authorityEvidence),
    predicted_outcomes: hashValue("recovery-recommendation-outcomes", recommendations.map((item) => item.expected_outcome.outcome_hash)),
    risk_calculations: hashValue("recovery-recommendation-risks", recommendations.map((item) => item.risk_assessment.risk_hash)),
    replay_checksum: replayChecksum,
  };
  const ledgerBase = {
    ledger_id: id("RRL", "recovery-recommendation-ledger", package_id),
    package_id,
    validation_id: validation.validation.validation_id,
    tenant_id: validation.validation.tenant_id,
    recommendation_ids: freezeArray(recommendations.map((item) => item.recommendation_id)),
    selected_recommendation_id: selected.recommendation_id,
    operator_approval_status: scenario === "APPROVAL_BYPASS" ? "BYPASSED" as const : "REQUIRED" as const,
    append_only: true as const,
  };
  const base = {
    package_id,
    validation_package: validation,
    recommendations,
    operator_package,
    replay: Object.freeze({ ...replayBase, replay_hash: hashValue("recovery-recommendation-replay", replayBase) }),
    ledger_entry: Object.freeze({ ...ledgerBase, ledger_hash: hashValue("recovery-recommendation-ledger", ledgerBase) }),
    ready_for_recovery_replay_engine: failures.length === 0 && validation.validation.validation_result === "PASS",
    advisory_only: true as const,
    recovery_executed: scenario === "EXECUTION_ATTEMPT",
    restart_performed: scenario === "RESTART_ATTEMPT",
    rollback_performed: scenario === "ROLLBACK_ATTEMPT",
    recovery_plan_modified: scenario === "PLAN_MUTATION_ATTEMPT",
    governance_modified: scenario === "GOVERNANCE_MUTATION_ATTEMPT",
    constitutional_modified: scenario === "CONSTITUTIONAL_MUTATION_ATTEMPT",
    authority_escalated: scenario === "AUTHORITY_ESCALATION_ATTEMPT",
    approval_bypassed: scenario === "APPROVAL_BYPASS",
    risks_concealed: scenario === "RISK_CONCEALMENT",
    confidence_fabricated: scenario === "CONFIDENCE_FABRICATION",
    alternatives_suppressed: scenario === "ALTERNATIVE_SUPPRESSION",
    cross_tenant_exposed: scenario === "TENANT_ISOLATION_FAILURE" || !(validation.validation.tenant_id === TENANT_ID || validation.validation.tenant_id.startsWith("tenant:")),
  };
  return Object.freeze({ ...base, package_hash: computeRecoveryRecommendationPackageHash(base as Omit<RecoveryRecommendationPackage, "package_hash">) });
}

export function validateRecoveryRecommendationPackage(pkg?: RecoveryRecommendationPackage): RecoveryRecommendationValidationResult {
  if (!pkg) {
    const failures = freezeArray<RecoveryRecommendationFailure>(["RECOMMENDATION_SCHEMA_INVALID"]);
    const source = { package_id: null, valid: false, validation_passed: false, recommendations_valid: false, ranking_valid: false, confidence_valid: false, risk_valid: false, explanations_valid: false, outcomes_valid: false, governance_valid: false, authority_valid: false, replay_valid: false, lineage_valid: false, integrity_valid: false, tenant_isolated: false, operator_approval_required: false, advisory_only: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("recovery-recommendation-validation", source) });
  }
  const validation_passed = pkg.validation_package.validation.validation_result === "PASS" && pkg.validation_package.ready_for_recommendation_engine;
  const recommendations_valid = pkg.recommendations.length >= 5 && pkg.recommendations.every((item) => item.recommendation_id && item.recommended_action && item.operator_approval_required);
  const ranking_valid = pkg.recommendations.every((item, index) => item.rank === index + 1) && pkg.operator_package.recommended_recovery.rank === 1;
  const confidence_valid = !pkg.confidence_fabricated && pkg.recommendations.every((item) => item.confidence_score >= 0 && item.confidence_score <= 1);
  const risk_valid = !pkg.risks_concealed && pkg.recommendations.every((item) => riskLevels.includes(item.recovery_risk));
  const explanations_valid = pkg.recommendations.every((item) => item.explanation.includes("governance") && item.explanation.includes("authority"));
  const outcomes_valid = pkg.recommendations.every((item) => item.expected_outcome.outcome_hash && item.risk_assessment.risk_hash);
  const governance_valid = pkg.recommendations.every((item) => item.governance_status === "VALID") && !pkg.governance_modified && !pkg.constitutional_modified;
  const authority_valid = pkg.recommendations.every((item) => item.authority_status === "VALID") && !pkg.authority_escalated;
  const replay_valid = pkg.replay.replay_checksum !== "mismatch";
  const lineage_valid = Boolean(pkg.operator_package.lineage_reference && pkg.recommendations.every((item) => item.lineage_reference));
  const integrity_valid = Boolean(pkg.operator_package.integrity_verification && pkg.ledger_entry.ledger_hash) && pkg.recommendations.every((item) => item.integrity_hash);
  const tenant_isolated = !pkg.cross_tenant_exposed && (pkg.ledger_entry.tenant_id === TENANT_ID || pkg.ledger_entry.tenant_id.startsWith("tenant:"));
  const operator_approval_required = pkg.ledger_entry.operator_approval_status === "REQUIRED" && pkg.recommendations.every((item) => item.operator_approval_required);
  const advisory_only = pkg.advisory_only && !pkg.recovery_executed && !pkg.restart_performed && !pkg.rollback_performed;
  const immutable_hash_valid = computeRecoveryRecommendationPackageHash(pkg) === pkg.package_hash;
  const failures = unique([
    ...(!validation_passed ? ["VALIDATION_NOT_PASSED" as const] : []),
    ...(!recommendations_valid ? ["RECOMMENDATION_SCHEMA_INVALID" as const] : []),
    ...(!ranking_valid ? ["RANKING_INVALID" as const] : []),
    ...(!confidence_valid ? ["CONFIDENCE_INVALID" as const] : []),
    ...(!risk_valid ? ["RISK_INVALID" as const] : []),
    ...(!explanations_valid ? ["EXPLANATION_INVALID" as const] : []),
    ...(!outcomes_valid ? ["OUTCOME_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!lineage_valid ? ["LINEAGE_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!operator_approval_required ? ["OPERATOR_APPROVAL_INVALID" as const] : []),
    ...(pkg.recovery_executed ? ["EXECUTION_DETECTED" as const] : []),
    ...(pkg.restart_performed ? ["RESTART_DETECTED" as const] : []),
    ...(pkg.rollback_performed ? ["ROLLBACK_DETECTED" as const] : []),
    ...(pkg.recovery_plan_modified ? ["PLAN_MUTATION_DETECTED" as const] : []),
    ...(pkg.governance_modified ? ["GOVERNANCE_MUTATION_DETECTED" as const] : []),
    ...(pkg.constitutional_modified ? ["CONSTITUTIONAL_MUTATION_DETECTED" as const] : []),
    ...(pkg.authority_escalated ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(pkg.risks_concealed ? ["RISK_CONCEALMENT_DETECTED" as const] : []),
    ...(pkg.confidence_fabricated ? ["CONFIDENCE_FABRICATION_DETECTED" as const] : []),
    ...(pkg.alternatives_suppressed ? ["ALTERNATIVE_SUPPRESSION_DETECTED" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0 && pkg.ready_for_recovery_replay_engine;
  const source = { package_id: pkg.package_id, valid, validation_passed, recommendations_valid, ranking_valid, confidence_valid, risk_valid, explanations_valid, outcomes_valid, governance_valid, authority_valid, replay_valid, lineage_valid, integrity_valid, tenant_isolated, operator_approval_required, advisory_only, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("recovery-recommendation-validation", source) });
}

export function replayRecoveryRecommendations(pkg = generateRecoveryRecommendations()): RecoveryRecommendationReplayResult {
  const reconstructed_hash = computeRecoveryRecommendationPackageHash(pkg);
  const deterministic = reconstructed_hash === pkg.package_hash && pkg.replay.replay_checksum !== "mismatch";
  const source = { replay_reference: pkg.replay.replay_reference, package_id: pkg.package_id, deterministic, reconstructed_hash, original_hash: pkg.package_hash, replay_checksum: pkg.replay.replay_checksum };
  return Object.freeze({ ...source, replay_result_hash: hashValue("recovery-recommendation-replay-result", source) });
}

export function buildRecoveryRecommendationObservabilitySurface(pkg = generateRecoveryRecommendations()): RecoveryRecommendationObservabilitySurface {
  const validation = validateRecoveryRecommendationPackage(pkg);
  return Object.freeze({
    package_id: pkg.package_id,
    selected_recommendation_id: pkg.operator_package.recommended_recovery.recommendation_id,
    recommendation_level: pkg.operator_package.recommended_recovery.recommendation_level,
    recommendation_count: pkg.recommendations.length,
    confidence_score: pkg.operator_package.confidence_score,
    recovery_risk: pkg.operator_package.recommended_recovery.recovery_risk,
    ready_for_recovery_replay_engine: pkg.ready_for_recovery_replay_engine,
    replay_valid: validation.replay_valid,
    tenant_id: pkg.ledger_entry.tenant_id,
    advisory_only: true,
    package_hash: pkg.package_hash,
  });
}

export function getRecoveryRecommendationEngineContract(): RecoveryRecommendationEngineContract {
  const recommendation_package = generateRecoveryRecommendations();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["advisory-only-recommendations", "operator-supremacy", "governance-first-decision-support", "constitutional-compliance", "deterministic-recommendation-generation", "replay-reproducibility", "explainable-intelligence", "immutable-audit-history", "tenant-isolated", "fail-closed"]),
      recommendation_types: recommendationTypes,
      recommendation_levels: recommendationLevels,
      confidence_levels: confidenceLevels,
      risk_levels: riskLevels,
      advisory_only: true,
      operator_approval_required: true,
    }),
    recommendation_package,
    validation: validateRecoveryRecommendationPackage(recommendation_package),
    replay_result: replayRecoveryRecommendations(recommendation_package),
    observability: buildRecoveryRecommendationObservabilitySurface(recommendation_package),
  });
}
