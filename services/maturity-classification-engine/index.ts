import { scoreMaturityDeterministically } from "@/services/deterministic-maturity-scoring-engine";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type {
  MaturityClassificationBundle,
  MaturityClassificationFailure,
  MaturityClassificationInput,
  MaturityClassificationLedgerEntry,
  MaturityClassificationObservabilitySurface,
  MaturityClassificationRecord,
  MaturityClassificationRepository,
  MaturityClassificationRule,
  MaturityClassificationScenario,
  MaturityClassificationState,
  MaturityClassificationValidationResult,
  MaturityTransitionDecision,
  MaturityTransitionEvaluation,
} from "@/types/maturity-classification-engine";

const VERSION = "maturity-classification-engine/v8ALT.11.4" as const;
const RULE_VERSION = "maturity-classification-rules/v1" as const;
const levels = ["LEVEL_1_ASSISTED_EXECUTION", "LEVEL_2_GUIDED_AUTONOMY", "LEVEL_3_CONTROLLED_AUTONOMY", "LEVEL_4_RESILIENT_AUTONOMY", "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY"] as const;
const states = ["ASSISTED_EXECUTION", "GUIDED_AUTONOMY", "CONTROLLED_AUTONOMY", "RESILIENT_AUTONOMY", "CERTIFIED_CONSTITUTIONAL_AUTONOMY"] as const;

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: MaturityClassificationScenario): MaturityClassificationFailure | null {
  const map: Partial<Record<MaturityClassificationScenario, MaturityClassificationFailure>> = {
    UNDEFINED_THRESHOLDS: "MATURITY_THRESHOLDS_UNDEFINED",
    INCONSISTENT_CLASSIFICATION_RULES: "CLASSIFICATION_RULES_INCONSISTENT",
    UNAUTHORIZED_PROMOTION: "PROMOTION_WITHOUT_PREREQUISITES",
    MISSED_REGRESSION_TRIGGER: "REGRESSION_TRIGGER_MISSED",
    GOVERNANCE_VALIDATION_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CONSTITUTIONAL_VALIDATION_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    AUTHORITY_ENFORCEMENT_FAILURE: "AUTHORITY_ENFORCEMENT_FAILED",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCHED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HIDDEN_CLASSIFICATION_LOGIC: "HIDDEN_CLASSIFICATION_LOGIC_DETECTED",
    NONDETERMINISTIC_LEVEL_ASSIGNMENT: "NONDETERMINISTIC_LEVEL_ASSIGNMENT_DETECTED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_BEHAVIOR_COMPROMISED",
  };
  return map[scenario] ?? null;
}

function buildRules(scenario: MaturityClassificationScenario): readonly MaturityClassificationRule[] {
  const mins = scenario === "UNDEFINED_THRESHOLDS" ? [0, 0, 0, 0, 0] : [0, 21, 41, 61, 81];
  return freezeArray(levels.map((level, index) => {
    const base = { rule_id: id("MCE-R", "maturity-classification-rule", level), level, state: states[index], min_score: scenario === "INCONSISTENT_CLASSIFICATION_RULES" && index === 4 ? 60 : mins[index], min_confidence: index === 4 ? 90 : 50, min_readiness: index === 4 ? 90 : 50, required_conditions: freezeArray(["governance validated", "constitutional validated", "authority enforced", "replay verified", "integrity verified"]), prohibited_conditions: freezeArray(["governance violation", "constitutional violation", "authority violation", "replay mismatch", "integrity failure"]), approved: true };
    return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" && index === 4 ? "" : hashValue("maturity-classification-rule", base) });
  }));
}

function selectRule(rules: readonly MaturityClassificationRule[], score: number): MaturityClassificationRule {
  return [...rules].filter((rule) => score >= rule.min_score).sort((a, b) => b.min_score - a.min_score)[0] ?? rules[0]!;
}

function transitionFor(rule: MaturityClassificationRule, scenario: MaturityClassificationScenario): MaturityTransitionEvaluation {
  const promotionEligible = rule.level === "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY" && scenario !== "UNAUTHORIZED_PROMOTION";
  const regressionAdvised = scenario === "MISSED_REGRESSION_TRIGGER";
  const decision: MaturityTransitionDecision = regressionAdvised ? "REGRESSION_ADVISED" : promotionEligible ? "PROMOTION_ELIGIBLE" : scenario === "UNAUTHORIZED_PROMOTION" ? "BLOCKED" : "NO_CHANGE";
  const base = { transition_id: id("MCE-T", "maturity-transition", `${rule.level}:${scenario}`), from_level: "LEVEL_4_RESILIENT_AUTONOMY" as AutonomyMaturityLevel, to_level: rule.level, decision, promotion_eligible: promotionEligible, regression_advised: regressionAdvised, prerequisites_satisfied: scenario !== "UNAUTHORIZED_PROMOTION", governance_validated: scenario !== "GOVERNANCE_VALIDATION_FAILURE", constitutional_validated: scenario !== "CONSTITUTIONAL_VALIDATION_FAILURE", authority_enforced: scenario !== "AUTHORITY_ENFORCEMENT_FAILURE", replay_verified: scenario !== "REPLAY_RECONSTRUCTION_MISMATCH", certification_ready: rule.level === "LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY", rationale: freezeArray(["classification is deterministic", "promotion and regression outputs are advisory decisions only", "historical classifications remain immutable"]), advisory_only: true as const, promotion_authorized: false as const, regression_authorized: false as const };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-transition-evaluation", base) });
}

function recordFor(rule: MaturityClassificationRule, transition: MaturityTransitionEvaluation, scenario: MaturityClassificationScenario, scoring = scoreMaturityDeterministically()): MaturityClassificationRecord {
  const state: MaturityClassificationState = scenario === "MISSED_REGRESSION_TRIGGER" ? "REGRESSION_PENDING" : scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "RECERTIFICATION_REQUIRED" : rule.state;
  const base = { classification_id: id("MCE", "maturity-classification-record", scenario), assessment_id: "autonomy-maturity-assessment", classification_version: VERSION, rule_set_version: RULE_VERSION, maturity_level: scenario === "NONDETERMINISTIC_LEVEL_ASSIGNMENT" ? "LEVEL_4_RESILIENT_AUTONOMY" as AutonomyMaturityLevel : rule.level, classification_state: state, classification_confidence: scoring.result.confidence_score, readiness_status: scoring.result.readiness_classification, applied_rules: freezeArray([rule.rule_id]), domain_summaries: freezeArray(scoring.contributions.map((entry) => `${entry.domain}:${entry.weighted_contribution}`)), explanation: freezeArray(["classification uses deterministic score thresholds", "transition result is advisory-only", "runtime assurance remains represented by execution, resilience, and visibility scoring"]), replay_reference: scenario === "REPLAY_RECONSTRUCTION_MISMATCH" ? "" : "replay:maturity-classification", lineage_reference: "lineage:maturity-classification", governance_validated: scenario !== "GOVERNANCE_VALIDATION_FAILURE", constitutional_validated: scenario !== "CONSTITUTIONAL_VALIDATION_FAILURE", authority_enforced: scenario !== "AUTHORITY_ENFORCEMENT_FAILURE" };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-classification-record", base) });
}

function ledgerFor(record: MaturityClassificationRecord, transition: MaturityTransitionEvaluation, scenario: MaturityClassificationScenario): readonly MaturityClassificationLedgerEntry[] {
  const base = { ledger_id: id("MCE-L", "maturity-classification-ledger", record.classification_id), classification_id: record.classification_id, assessment_id: record.assessment_id, maturity_level: record.maturity_level, classification_version: VERSION, rule_set_version: RULE_VERSION, transition_id: transition.transition_id, transition_decision: transition.decision, evidence_references: freezeArray(["evidence:maturity-score", "evidence:domain-contributions", "evidence:classification-rules"]), governance_reference: "governance:maturity-classification", constitutional_reference: "constitutional:maturity-classification", replay_reference: record.replay_reference, lineage_reference: record.lineage_reference, timestamp: "1970-01-01T00:00:00.000Z" as const, append_only: true as const };
  return freezeArray([Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_VERIFICATION_FAILURE" ? "" : hashValue("maturity-classification-ledger", base) })]);
}

function collectFailures(repository: Omit<MaturityClassificationRepository, "integrity_hash"> | MaturityClassificationRepository): readonly MaturityClassificationFailure[] {
  return unique([
    ...repository.failures,
    ...(repository.rules.some((rule) => rule.min_score === undefined) || repository.rules.every((rule) => rule.min_score === 0) ? ["MATURITY_THRESHOLDS_UNDEFINED" as const] : []),
    ...(repository.rules.some((rule, index) => index > 0 && rule.min_score <= repository.rules[index - 1]!.min_score) ? ["CLASSIFICATION_RULES_INCONSISTENT" as const] : []),
    ...(repository.transition.decision === "BLOCKED" ? ["PROMOTION_WITHOUT_PREREQUISITES" as const] : []),
    ...(repository.transition.regression_advised ? ["REGRESSION_TRIGGER_MISSED" as const] : []),
    ...(!repository.record.governance_validated || !repository.transition.governance_validated ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(!repository.record.constitutional_validated || !repository.transition.constitutional_validated ? ["CONSTITUTIONAL_VALIDATION_FAILED" as const] : []),
    ...(!repository.record.authority_enforced || !repository.transition.authority_enforced ? ["AUTHORITY_ENFORCEMENT_FAILED" as const] : []),
    ...(!repository.record.replay_reference || !repository.transition.replay_verified ? ["REPLAY_RECONSTRUCTION_MISMATCHED" as const] : []),
    ...(!repository.record.integrity_hash || !repository.transition.integrity_hash || repository.rules.some((rule) => !rule.integrity_hash) || repository.ledger.some((entry) => !entry.integrity_hash) ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(repository.record.explanation.some((entry) => entry.includes("hidden")) ? ["HIDDEN_CLASSIFICATION_LOGIC_DETECTED" as const] : []),
    ...(repository.record.maturity_level !== selectRule(repository.rules, repository.scoring.result.overall_maturity_score).level ? ["NONDETERMINISTIC_LEVEL_ASSIGNMENT_DETECTED" as const] : []),
    ...(repository.scoring.evaluation.reports.some((report) => report.evidence.tenant_id !== "tenant:alpha") ? ["TENANT_ISOLATION_VIOLATED" as const] : []),
    ...(!repository.advisory_only || repository.promotion_authorized || repository.regression_authorized || repository.maturity_advancement_authorized || repository.execution_behavior_change_authorized ? ["ADVISORY_ONLY_BEHAVIOR_COMPROMISED" as const] : []),
  ]);
}

export function classifyMaturity(input: MaturityClassificationInput = {}): MaturityClassificationRepository {
  if (input.repository) return input.repository;
  const scenario = input.scenario ?? "BASELINE";
  const scoring = input.scoring ?? scoreMaturityDeterministically(scenario === "TENANT_ISOLATION_VIOLATION" ? { scenario: "TENANT_ISOLATION_VIOLATION" } : {});
  const rules = buildRules(scenario);
  const selected = selectRule(rules, scoring.result.overall_maturity_score);
  const transition = transitionFor(selected, scenario);
  const recordBase = recordFor(selected, transition, scenario, scoring);
  const record = scenario === "HIDDEN_CLASSIFICATION_LOGIC" ? Object.freeze({ ...recordBase, explanation: freezeArray([...recordBase.explanation, "hidden classification logic"]) }) : recordBase;
  const ledger = ledgerFor(record, transition, scenario);
  const directFailure = scenarioFailure(scenario);
  const source = { classification_id: record.classification_id, final_state: "MATURITY_CLASSIFICATION_COMPLETE" as const, scoring, rules, record, transition, ledger, failures: freezeArray(directFailure ? [directFailure] : []), advisory_only: true as const, promotion_authorized: false as const, regression_authorized: false as const, maturity_advancement_authorized: false as const, production_certification_authorized: false as const, governance_modification_authorized: false as const, authority_change_authorized: false as const, execution_behavior_change_authorized: false as const };
  const failures = collectFailures(source);
  const repository = { ...source, failures, final_state: failures.length ? "MATURITY_CLASSIFICATION_FAILED" as const : source.final_state };
  return Object.freeze({ ...repository, integrity_hash: hashValue("maturity-classification-repository", repository) });
}

export function listMaturityClassificationRules(input: MaturityClassificationInput = {}) { return classifyMaturity(input).rules; }
export function getMaturityTransitionEvaluation(input: MaturityClassificationInput = {}) { return classifyMaturity(input).transition; }
export function listMaturityClassificationLedger(input: MaturityClassificationInput = {}) { return classifyMaturity(input).ledger; }

export function validateMaturityClassification(repository = classifyMaturity()): MaturityClassificationValidationResult {
  const failures = unique([...collectFailures(repository), ...(!repository.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: MaturityClassificationFailure) => failures.includes(failure);
  const result = { classification_id: repository.classification_id, valid: failures.length === 0 && repository.final_state === "MATURITY_CLASSIFICATION_COMPLETE", thresholds_defined: !has("MATURITY_THRESHOLDS_UNDEFINED"), rules_consistent: !has("CLASSIFICATION_RULES_INCONSISTENT"), no_unauthorized_promotion: !has("PROMOTION_WITHOUT_PREREQUISITES"), regression_detection_valid: !has("REGRESSION_TRIGGER_MISSED"), governance_validated: !has("GOVERNANCE_VALIDATION_FAILED"), constitutional_validated: !has("CONSTITUTIONAL_VALIDATION_FAILED"), authority_enforced: !has("AUTHORITY_ENFORCEMENT_FAILED"), replay_verified: !has("REPLAY_RECONSTRUCTION_MISMATCHED"), integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"), no_hidden_logic: !has("HIDDEN_CLASSIFICATION_LOGIC_DETECTED"), deterministic_level_assignment: !has("NONDETERMINISTIC_LEVEL_ASSIGNMENT_DETECTED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATED"), advisory_only: true as const, no_execution_authority: !repository.maturity_advancement_authorized && !repository.production_certification_authorized && !repository.authority_change_authorized && !repository.execution_behavior_change_authorized, failures };
  return Object.freeze({ ...result, validation_hash: hashValue("maturity-classification-validation", result) });
}

export function buildMaturityClassificationObservabilitySurface(repository = classifyMaturity()): MaturityClassificationObservabilitySurface {
  return Object.freeze({ classification_id: repository.classification_id, final_state: repository.final_state, maturity_level: repository.record.maturity_level, classification_state: repository.record.classification_state, transition_decision: repository.transition.decision, rule_count: repository.rules.length, ledger_count: repository.ledger.length, failure_count: repository.failures.length, advisory_only: true, promotion_authorized: false, execution_behavior_change_authorized: false, integrity_hash: repository.integrity_hash });
}

export function getMaturityClassificationEngineBundle(): MaturityClassificationBundle {
  const repository = classifyMaturity();
  return Object.freeze({ doctrine: Object.freeze({ engine_version: VERSION, final_state: "MATURITY_CLASSIFICATION_ENGINE_READY", level_count: 5, principles: freezeArray(["scoring-derived-classification", "immutable-thresholds", "deterministic-transition-evaluation", "promotion-advisory-only", "regression-advisory-only", "governance-validated", "constitutional-validated", "replay-compatible"]) }), repository, validation: validateMaturityClassification(repository), observability: buildMaturityClassificationObservabilitySurface(repository) });
}
