import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runDeterministicOptimizationValidation, validateDeterministicOptimizationValidation } from "@/services/deterministic-optimization-validation";
import type { DeterministicOptimizationValidationLedger, ValidationRecord } from "@/types/deterministic-optimization-validation";
import type {
  OptimizationExplainabilityReport,
  OptimizationImplementationPlan,
  OptimizationRecommendationEngineBundle,
  OptimizationRecommendationFailure,
  OptimizationRecommendationInput,
  OptimizationRecommendationLedger,
  OptimizationRecommendationLedgerEntry,
  OptimizationRecommendationObservabilitySurface,
  OptimizationRecommendationPriority,
  OptimizationRecommendationRecord,
  OptimizationRecommendationScenario,
  OptimizationRecommendationValidationResult,
  OptimizationRollbackStrategy,
  OptimizationScoreRecord,
} from "@/types/optimization-recommendation-engine";

const VERSION = "optimization-recommendation-engine/v8ALT.8.4" as const;
const NOW = "2026-07-15T16:00:00.000Z";
const statuses = Object.freeze(["GENERATED", "SCORED", "EXPLAINED", "IMPLEMENTATION_READY", "OPERATOR_REVIEW", "APPROVED", "IMPLEMENTED", "REJECTED", "VERIFIED"] as const);
const decisions = Object.freeze(["RECOMMEND", "REVIEW", "DEFER", "REJECT"] as const);
const priorities = Object.freeze(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: OptimizationRecommendationScenario): OptimizationRecommendationFailure | null {
  const map: Partial<Record<OptimizationRecommendationScenario, OptimizationRecommendationFailure>> = {
    MISSING_VALIDATION_LEDGER: "VALIDATION_LEDGER_MISSING",
    VALIDATION_LEDGER_REJECTED: "VALIDATION_LEDGER_REJECTED",
    UNVALIDATED_OPPORTUNITY: "UNVALIDATED_OPPORTUNITY_DETECTED",
    HIDDEN_RECOMMENDATION: "HIDDEN_RECOMMENDATION_DETECTED",
    SCORE_MANIPULATION: "SCORE_MANIPULATION_DETECTED",
    MISSING_EXPLAINABILITY: "EXPLAINABILITY_MISSING",
    MISSING_IMPLEMENTATION_PLAN: "IMPLEMENTATION_PLAN_MISSING",
    MISSING_ROLLBACK_STRATEGY: "ROLLBACK_STRATEGY_MISSING",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_DETECTED",
    TENANT_LEAKAGE: "TENANT_LEAKAGE_DETECTED",
    AUTOMATIC_IMPLEMENTATION_ATTEMPT: "AUTOMATIC_IMPLEMENTATION_ATTEMPTED",
    APPROVAL_BYPASS_ATTEMPT: "APPROVAL_BYPASS_ATTEMPTED",
    MUTABLE_LEDGER_HISTORY: "MUTABLE_LEDGER_HISTORY_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ?? null;
}

function priorityFor(index: number): OptimizationRecommendationPriority {
  return index === 0 ? "CRITICAL" : index === 1 ? "HIGH" : index === 2 ? "MEDIUM" : "LOW";
}

function buildRecommendation(record: ValidationRecord, index: number, scenario: OptimizationRecommendationScenario): OptimizationRecommendationRecord {
  const base = {
    recommendation_id: id("OREC", "optimization-recommendation", { validation: record.validation_id, scenario }),
    opportunity_id: scenario === "UNVALIDATED_OPPORTUNITY" && index === 0 ? "opportunity:unvalidated" : record.opportunity_id,
    mission_id: record.mission_id,
    execution_id: "execution:recommendation:8alt-8-4",
    tenant_id: scenario === "TENANT_LEAKAGE" && index === 0 ? "tenant:foreign" : record.tenant_id,
    subsystem: `subsystem:${index + 1}`,
    recommendation_title: `Review optimization candidate ${index + 1}`,
    recommendation_summary: "Operator-ready advisory recommendation generated from deterministic validation evidence.",
    optimization_category: index === 2 ? "REPLAY" as const : index === 1 ? "ORCHESTRATION" as const : "PLANNING" as const,
    priority_level: priorityFor(index),
    recommendation_status: "OPERATOR_REVIEW" as const,
    decision_state: scenario === "SCORE_MANIPULATION" ? "REVIEW" as const : "RECOMMEND" as const,
    operator_required: true as const,
    advisory_only: true as const,
    implementation_authority: false as const,
    approval_authority: false as const,
    automatic_implementation: scenario === "AUTOMATIC_IMPLEMENTATION_ATTEMPT" && index === 0,
    operator_approval_required: true as const,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-recommendation-record", base) });
}

function buildScore(recommendation: OptimizationRecommendationRecord, scenario: OptimizationRecommendationScenario): OptimizationScoreRecord {
  const manipulated = scenario === "SCORE_MANIPULATION";
  const base = { score_id: id("ORS", "optimization-score", recommendation.recommendation_id), recommendation_id: recommendation.recommendation_id, efficiency_score: manipulated ? 1.5 : 0.92, latency_score: 0.9, resource_score: 0.88, scalability_score: 0.86, implementation_score: 0.84, deterministic_score: 1, replay_score: 1, governance_score: scenario === "GOVERNANCE_BYPASS" ? 0 : 1, constitutional_score: scenario === "CONSTITUTIONAL_BYPASS" ? 0 : 1, authority_score: scenario === "AUTHORITY_ESCALATION" ? 0 : 1, confidence_score: manipulated ? 1.4 : 0.96, overall_score: manipulated ? 1.6 : 0.91, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-score-record", base) });
}

function buildExplainability(recommendation: OptimizationRecommendationRecord, scenario: OptimizationRecommendationScenario): OptimizationExplainabilityReport {
  const pass = scenario !== "MISSING_EXPLAINABILITY";
  const base = { report_id: id("ORE", "optimization-explainability", recommendation.recommendation_id), recommendation_id: recommendation.recommendation_id, optimization_reason: pass ? "Validated opportunity has measurable benefit and preserved guarantees." : "", evidence_summary: pass ? "Discovery, impact, and validation evidence are linked." : "", validation_summary: pass ? "Deterministic optimization validation passed." : "", projected_benefits: pass ? "Projected latency and resource improvements are advisory estimates." : "", implementation_rationale: pass ? "Implementation guidance requires explicit operator approval." : "", deterministic_validation: "PASS" as const, replay_validation: "PASS" as const, governance_validation: scenario === "GOVERNANCE_BYPASS" ? "FAIL" as const : "PASS" as const, constitutional_validation: scenario === "CONSTITUTIONAL_BYPASS" ? "FAIL" as const : "PASS" as const, authority_validation: scenario === "AUTHORITY_ESCALATION" ? "FAIL" as const : "PASS" as const, confidence_score: pass ? 0.96 : 0, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-explainability-report", base) });
}

function buildPlan(recommendation: OptimizationRecommendationRecord, scenario: OptimizationRecommendationScenario): OptimizationImplementationPlan | null {
  if (scenario === "MISSING_IMPLEMENTATION_PLAN") return null;
  const base = { implementation_plan_id: id("ORP", "optimization-plan", recommendation.recommendation_id), recommendation_id: recommendation.recommendation_id, implementation_steps: freezeArray(["operator approval", "staged configuration proposal", "preflight deterministic validation", "post-change certification"]), subsystem_dependencies: freezeArray([recommendation.subsystem]), deployment_sequence: freezeArray(["prepare change request", "operator review", "certification gate"]), validation_checkpoints: freezeArray(["determinism", "replay", "governance", "rollback"]), expected_duration: "operator-scheduled", implementation_risk: 0.22, operator_actions: freezeArray(["approve or reject recommendation", "schedule implementation outside this engine"]), verification_requirements: freezeArray(["8ALT.8.5 certification", "operator signoff"]), implementation_action_executed: false as const, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-implementation-plan", base) });
}

function buildRollback(recommendation: OptimizationRecommendationRecord, scenario: OptimizationRecommendationScenario): OptimizationRollbackStrategy | null {
  if (scenario === "MISSING_ROLLBACK_STRATEGY") return null;
  const base = { rollback_strategy_id: id("ORR", "optimization-rollback", recommendation.recommendation_id), recommendation_id: recommendation.recommendation_id, rollback_conditions: freezeArray(["validation regression", "operator cancellation", "certification failure"]), rollback_steps: freezeArray(["restore baseline configuration", "replay verification", "integrity check"]), recovery_plan: freezeArray(["return to pre-optimization baseline", "notify operator"]), verification_steps: freezeArray(["replay match", "hash match", "governance check"]), replay_validation: "REQUIRED" as const, integrity_validation: "REQUIRED" as const, operator_notification: "REQUIRED" as const, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-rollback-strategy", base) });
}

function buildEntry(recommendation: OptimizationRecommendationRecord, scenario: OptimizationRecommendationScenario): OptimizationRecommendationLedgerEntry {
  const base = { ledger_entry_id: id("ORL", "optimization-recommendation-ledger-entry", recommendation.recommendation_id), recommendation_id: recommendation.recommendation_id, recommendation_version: "1.0.0", approval_status: scenario === "APPROVAL_BYPASS_ATTEMPT" ? "BYPASSED" as const : "PENDING_OPERATOR_REVIEW" as const, implementation_status: scenario === "AUTOMATIC_IMPLEMENTATION_ATTEMPT" ? "IMPLEMENTED" as const : "NOT_IMPLEMENTED" as const, replay_reference: `replay:recommendation:${recommendation.recommendation_id}`, lineage_reference: `lineage:recommendation:${recommendation.recommendation_id}`, immutable: scenario !== "MUTABLE_LEDGER_HISTORY", created_timestamp: NOW, updated_timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("optimization-recommendation-ledger-entry", base) });
}

function collectFailures(ledger: Omit<OptimizationRecommendationLedger, "integrity_hash"> | OptimizationRecommendationLedger, validationLedger: DeterministicOptimizationValidationLedger | null): readonly OptimizationRecommendationFailure[] {
  return unique([
    ...ledger.failures,
    ...(!validationLedger ? ["VALIDATION_LEDGER_MISSING" as const] : []),
    ...(validationLedger && !validateDeterministicOptimizationValidation(validationLedger).ready_for_recommendation_engine ? ["VALIDATION_LEDGER_REJECTED" as const] : []),
    ...(ledger.recommendations.some((r) => r.opportunity_id.includes("unvalidated")) ? ["UNVALIDATED_OPPORTUNITY_DETECTED" as const] : []),
    ...(validationLedger && ledger.recommendations.length < validationLedger.validations.length ? ["HIDDEN_RECOMMENDATION_DETECTED" as const] : []),
    ...(ledger.scores.some((s) => s.overall_score > 1 || s.confidence_score > 1 || s.efficiency_score > 1) ? ["SCORE_MANIPULATION_DETECTED" as const] : []),
    ...(ledger.explainability_reports.length < ledger.recommendations.length || ledger.explainability_reports.some((r) => !r.optimization_reason || r.confidence_score <= 0) ? ["EXPLAINABILITY_MISSING" as const] : []),
    ...(ledger.implementation_plans.length < ledger.recommendations.length ? ["IMPLEMENTATION_PLAN_MISSING" as const] : []),
    ...(ledger.rollback_strategies.length < ledger.recommendations.length ? ["ROLLBACK_STRATEGY_MISSING" as const] : []),
    ...(ledger.scores.some((s) => s.authority_score <= 0) || ledger.explainability_reports.some((r) => r.authority_validation === "FAIL") ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(ledger.scores.some((s) => s.governance_score <= 0) || ledger.explainability_reports.some((r) => r.governance_validation === "FAIL") ? ["GOVERNANCE_BYPASS_DETECTED" as const] : []),
    ...(ledger.scores.some((s) => s.constitutional_score <= 0) || ledger.explainability_reports.some((r) => r.constitutional_validation === "FAIL") ? ["CONSTITUTIONAL_BYPASS_DETECTED" as const] : []),
    ...(ledger.recommendations.some((r) => r.tenant_id !== "tenant:alpha") ? ["TENANT_LEAKAGE_DETECTED" as const] : []),
    ...(ledger.recommendations.some((r) => r.automatic_implementation) || ledger.ledger_entries.some((e) => e.implementation_status === "IMPLEMENTED") ? ["AUTOMATIC_IMPLEMENTATION_ATTEMPTED" as const] : []),
    ...(ledger.ledger_entries.some((e) => e.approval_status === "BYPASSED") ? ["APPROVAL_BYPASS_ATTEMPTED" as const] : []),
    ...(ledger.ledger_entries.some((e) => !e.immutable) ? ["MUTABLE_LEDGER_HISTORY_DETECTED" as const] : []),
  ]);
}

export function runOptimizationRecommendationEngine(input: OptimizationRecommendationInput = {}): OptimizationRecommendationLedger {
  if (input.ledger) return input.ledger;
  const scenario = input.scenario ?? "BASELINE";
  const injected = scenarioFailure(scenario);
  const validationLedger = scenario === "MISSING_VALIDATION_LEDGER" ? null : input.validation_ledger ?? runDeterministicOptimizationValidation(scenario === "VALIDATION_LEDGER_REJECTED" ? { scenario: "REPLAY_MISMATCH" } : {});
  const sourceValidations = freezeArray(validationLedger?.validations ?? []);
  const visibleValidations = scenario === "HIDDEN_RECOMMENDATION" ? sourceValidations.slice(1) : sourceValidations;
  const recommendations = freezeArray(visibleValidations.map((record, index) => buildRecommendation(record, index, scenario)));
  const scores = freezeArray(recommendations.map((recommendation) => buildScore(recommendation, scenario)));
  const explainability_reports = freezeArray(recommendations.map((recommendation) => buildExplainability(recommendation, scenario)));
  const implementation_plans = freezeArray(recommendations.map((recommendation) => buildPlan(recommendation, scenario)).filter((plan): plan is OptimizationImplementationPlan => Boolean(plan)));
  const rollback_strategies = freezeArray(recommendations.map((recommendation) => buildRollback(recommendation, scenario)).filter((rollback): rollback is OptimizationRollbackStrategy => Boolean(rollback)));
  const ledger_entries = freezeArray(recommendations.map((recommendation) => buildEntry(recommendation, scenario)));
  const initialFailures = unique([...(injected ? [injected] : [])]);
  const source = { ledger_id: id("ORLEDGER", "optimization-recommendation-ledger", { validation: validationLedger?.ledger_id ?? "missing", scenario }), final_state: initialFailures.length ? "OPTIMIZATION_RECOMMENDATIONS_BLOCKED" as const : "OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW" as const, source_validation_ledger_id: validationLedger?.ledger_id ?? null, recommendations, scores, explainability_reports, implementation_plans, rollback_strategies, ledger_entries, failures: initialFailures, advisory_only: true as const, implementation_authority: false as const, approval_authority: false as const, automatic_implementation: false as const, operator_approval_required: true as const };
  const failures = collectFailures(source, validationLedger);
  const ledger = { ...source, failures, final_state: failures.length ? "OPTIMIZATION_RECOMMENDATIONS_BLOCKED" as const : source.final_state };
  return Object.freeze({ ...ledger, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("optimization-recommendation-ledger", ledger) });
}

export function listOptimizationScores(input: OptimizationRecommendationInput = {}) { return runOptimizationRecommendationEngine(input).scores; }
export function listOptimizationExplainabilityReports(input: OptimizationRecommendationInput = {}) { return runOptimizationRecommendationEngine(input).explainability_reports; }
export function listOptimizationImplementationPlans(input: OptimizationRecommendationInput = {}) { return runOptimizationRecommendationEngine(input).implementation_plans; }
export function listOptimizationRollbackStrategies(input: OptimizationRecommendationInput = {}) { return runOptimizationRecommendationEngine(input).rollback_strategies; }

export function validateOptimizationRecommendationEngine(ledger = runOptimizationRecommendationEngine(), validationLedger: DeterministicOptimizationValidationLedger | null = runDeterministicOptimizationValidation()): OptimizationRecommendationValidationResult {
  const failures = unique([...collectFailures(ledger, validationLedger), ...(!ledger.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: OptimizationRecommendationFailure) => failures.includes(failure);
  const expected = validationLedger?.validations.length ?? 0;
  const every_validated_opportunity_recommended = Boolean(validationLedger) && ledger.recommendations.length === expected;
  const valid = failures.length === 0 && every_validated_opportunity_recommended && ledger.final_state === "OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW" && ledger.advisory_only && !ledger.implementation_authority && !ledger.approval_authority && !ledger.automatic_implementation && ledger.operator_approval_required;
  const source = { ledger_id: ledger.ledger_id, valid, validation_ledger_ready: validationLedger ? validateDeterministicOptimizationValidation(validationLedger).ready_for_recommendation_engine : false, every_validated_opportunity_recommended, scores_reproducible: !has("SCORE_MANIPULATION_DETECTED"), explainability_complete: !has("EXPLAINABILITY_MISSING"), implementation_plans_complete: !has("IMPLEMENTATION_PLAN_MISSING"), rollback_strategies_complete: !has("ROLLBACK_STRATEGY_MISSING"), governance_preserved: !has("GOVERNANCE_BYPASS_DETECTED"), constitutional_preserved: !has("CONSTITUTIONAL_BYPASS_DETECTED"), authority_preserved: !has("AUTHORITY_ESCALATION_DETECTED"), tenant_isolated: !has("TENANT_LEAKAGE_DETECTED"), immutable_history: !has("MUTABLE_LEDGER_HISTORY_DETECTED"), advisory_only: true as const, implementation_authority_absent: !ledger.implementation_authority && ledger.recommendations.every((r) => !r.implementation_authority), approval_authority_absent: !ledger.approval_authority && ledger.recommendations.every((r) => !r.approval_authority), automatic_implementation_absent: !ledger.automatic_implementation && ledger.recommendations.every((r) => !r.automatic_implementation) && ledger.ledger_entries.every((e) => e.implementation_status === "NOT_IMPLEMENTED"), operator_approval_required: true as const, ready_for_certification_gate: valid, fail_closed: valid || failures.length > 0 || ledger.final_state !== "OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW", failures };
  return Object.freeze({ ...source, validation_hash: hashValue("optimization-recommendation-validation", source) });
}

export function buildOptimizationRecommendationObservabilitySurface(ledger = runOptimizationRecommendationEngine()): OptimizationRecommendationObservabilitySurface {
  return Object.freeze({ ledger_id: ledger.ledger_id, final_state: ledger.final_state, recommendation_count: ledger.recommendations.length, recommend_count: ledger.recommendations.filter((r) => r.decision_state === "RECOMMEND").length, review_count: ledger.recommendations.filter((r) => r.decision_state === "REVIEW").length, defer_count: ledger.recommendations.filter((r) => r.decision_state === "DEFER").length, reject_count: ledger.recommendations.filter((r) => r.decision_state === "REJECT").length, failure_count: ledger.failures.length, advisory_only: true, implementation_authority: false, approval_authority: false, integrity_hash: ledger.integrity_hash });
}

export function getOptimizationRecommendationEngine(): OptimizationRecommendationEngineBundle {
  const validation = runDeterministicOptimizationValidation();
  const ledger = runOptimizationRecommendationEngine({ validation_ledger: validation });
  return Object.freeze({ doctrine: Object.freeze({ contract_version: VERSION, final_state: "OPTIMIZATION_RECOMMENDATIONS_READY_FOR_OPERATOR_REVIEW", statuses, decisions, priorities, principles: freezeArray(["validated-opportunities-only", "operator-review-only", "advisory-recommendations", "deterministic-scoring", "complete-explainability", "implementation-guidance-not-action", "rollback-required", "immutable-ledger", "explicit-operator-approval-required", "no-automatic-implementation"]) }), ledger, validation: validateOptimizationRecommendationEngine(ledger, validation), observability: buildOptimizationRecommendationObservabilitySurface(ledger) });
}
