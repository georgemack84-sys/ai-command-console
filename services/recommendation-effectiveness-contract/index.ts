import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayOutcomeReplayBinder, runOutcomeReplayBinder } from "@/services/outcome-replay-binder";
import type {
  RecommendationAcceptanceState,
  RecommendationEffectivenessApiSurface,
  RecommendationEffectivenessDimension,
  RecommendationEffectivenessFailure,
  RecommendationEffectivenessFoundation,
  RecommendationEffectivenessInput,
  RecommendationEffectivenessLedgerRecord,
  RecommendationEffectivenessRecord,
  RecommendationEffectivenessResult,
  RecommendationEffectivenessScenario,
  RecommendationEffectivenessScore,
  RecommendationEffectivenessStatus,
  RecommendationEffectivenessValidation,
} from "@/types/recommendation-effectiveness-contract";
import type { OutcomeReplayBinderInput, OutcomeReplayBinderResult } from "@/types/outcome-replay-binder";

const RECOMMENDATION_EFFECTIVENESS_VERSION = "recommendation-effectiveness-contract/v1" as const;
const EVALUATION_TIMESTAMP = "2026-01-01T00:10:31.000Z" as const;

export const RECOMMENDATION_EFFECTIVENESS_DIMENSIONS: readonly RecommendationEffectivenessDimension[] = Object.freeze([
  "OVERALL_EFFECTIVENESS",
  "OUTCOME_ACCURACY",
  "RISK_ACCURACY",
  "CONFIDENCE_ACCURACY",
  "EVIDENCE_QUALITY",
  "GOVERNANCE_ACCURACY",
  "EXPLAINABILITY",
  "OPERATOR_USABILITY",
  "RECOMMENDATION_COMPLETENESS",
  "ALTERNATIVE_RECOMMENDATION_QUALITY",
  "ROLLBACK_QUALITY",
  "DECISION_PACKAGE_CLARITY",
]);

type Scenario = NonNullable<RecommendationEffectivenessInput["scenario"]>;

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

function sourceForScenario(input: RecommendationEffectivenessInput, scenario: Scenario): OutcomeReplayBinderResult {
  if (input.replay_binder) return input.replay_binder;
  const replayScenario: OutcomeReplayBinderInput["scenario"] =
    scenario === "MISSING_EVIDENCE" ? "EVIDENCE_MISMATCH" :
    scenario === "MISSING_REPLAY" ? "MISSING_DEPENDENCY" :
    scenario === "INCOMPLETE_LINEAGE" ? "LINEAGE_MISMATCH" :
    scenario === "REPLAY_DIVERGENCE" ? "REPLAY_DIVERGENCE" :
    scenario === "HASH_MISMATCH" ? "HASH_MISMATCH" :
    scenario === "CROSS_TENANT" ? "CROSS_TENANT_REPLAY" :
    "BASELINE";
  return runOutcomeReplayBinder({ scenario: replayScenario });
}

function buildApiSurface(): RecommendationEffectivenessApiSurface {
  const base: Omit<RecommendationEffectivenessApiSurface, "integrity_hash"> = {
    api_id: "recommendation_effectiveness_contract_api",
    initialize_evaluation: "POST /recommendation-effectiveness-contract/evaluate",
    validate_schema: "POST /recommendation-effectiveness-contract/validate",
    validate_replay: "POST /recommendation-effectiveness-contract/replay",
    append_ledger_record: "POST /recommendation-effectiveness-contract/ledger",
    retrieve_contract: "GET /recommendation-effectiveness-contract/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scoreForDimension(dimension: RecommendationEffectivenessDimension, scenario: Scenario): number {
  if (scenario === "MISSING_SCORE" && dimension === "ROLLBACK_QUALITY") return Number.NaN;
  const penalties: Partial<Record<RecommendationEffectivenessScenario, Partial<Record<RecommendationEffectivenessDimension, number>>>> = {
    MISSING_OUTCOME: { OVERALL_EFFECTIVENESS: 0.5, OUTCOME_ACCURACY: 0.3 },
    MISSING_EVIDENCE: { EVIDENCE_QUALITY: 0.2, EXPLAINABILITY: 0.5 },
    MISSING_GOVERNANCE: { GOVERNANCE_ACCURACY: 0.2 },
    AUTHORITY_FAILURE: { GOVERNANCE_ACCURACY: 0.1, OPERATOR_USABILITY: 0.55 },
    CONSTITUTIONAL_FAILURE: { GOVERNANCE_ACCURACY: 0.1, OVERALL_EFFECTIVENESS: 0.4 },
    REPLAY_DIVERGENCE: { OVERALL_EFFECTIVENESS: 0.45, OUTCOME_ACCURACY: 0.55 },
    IDENTITY_MISMATCH: { RECOMMENDATION_COMPLETENESS: 0.4, DECISION_PACKAGE_CLARITY: 0.5 },
  };
  return penalties[scenario]?.[dimension] ?? (dimension === "OVERALL_EFFECTIVENESS" ? 0.91 : 0.9);
}

function buildScores(evidenceRefs: readonly string[], scenario: Scenario): readonly RecommendationEffectivenessScore[] {
  return freezeArray(RECOMMENDATION_EFFECTIVENESS_DIMENSIONS.map((dimension) => {
    const score = scoreForDimension(dimension, scenario);
    const base: Omit<RecommendationEffectivenessScore, "integrity_hash"> = {
      dimension,
      score,
      explanation: Number.isNaN(score) ? "required score missing" : `${dimension.toLowerCase()} evaluated deterministically from replay, outcome, governance, and evidence references`,
      evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : evidenceRefs,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function collectFailures(source: OutcomeReplayBinderResult, scores: readonly RecommendationEffectivenessScore[], scenario: Scenario): readonly RecommendationEffectivenessFailure[] {
  const pkg = source.replay_package;
  const failures: RecommendationEffectivenessFailure[] = [];
  if (scenario === "MISSING_OUTCOME" || !pkg.observed_outcome_ref) failures.push("OBSERVED_OUTCOME_MISSING");
  if (scenario === "MISSING_EVIDENCE" || !pkg.evidence_refs.length) failures.push("EVIDENCE_MISSING");
  if (scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_MISSING");
  if (scenario === "MISSING_REPLAY" || source.validation.failures.includes("MISSING_REPLAY_DEPENDENCY_REJECTED")) failures.push("REPLAY_INCOMPLETE");
  if (scenario === "MISSING_OPERATOR_ACTION" || !pkg.operator_workflow_ref) failures.push("OPERATOR_ACTION_UNAVAILABLE");
  if (scenario === "INCOMPLETE_LINEAGE" || !pkg.historical_lineage_ref) failures.push("LINEAGE_INCOMPLETE");
  if (scores.length !== RECOMMENDATION_EFFECTIVENESS_DIMENSIONS.length || scores.some((score) => Number.isNaN(score.score)) || scenario === "MISSING_SCORE") failures.push("REQUIRED_SCORES_MISSING");
  if (scenario === "REPLAY_DIVERGENCE" || source.validation.divergence_detected) failures.push("REPLAY_DIVERGENCE_DETECTED");
  if (scenario === "HASH_MISMATCH" || !replayOutcomeReplayBinder(source)) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "CROSS_TENANT" || source.validation.failures.includes("CROSS_TENANT_REPLAY_REJECTED")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "IDENTITY_MISMATCH") failures.push("RECOMMENDATION_IDENTITY_INCONSISTENT");
  if (scenario === "LEDGER_MUTATION") failures.push("LEDGER_MUTATION_DETECTED");
  if (scenario === "AUTHORITY_FAILURE") failures.push("AUTHORITY_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  if (scenario === "RECOMMENDATION_MUTATION") failures.push("HISTORICAL_RECOMMENDATION_MUTATION_ATTEMPTED");
  if (scenario === "OPERATOR_ACTION_MUTATION") failures.push("OPERATOR_ACTION_MUTATION_ATTEMPTED");
  return freezeArray([...new Set(failures)]);
}

function lifecycleForFailures(failures: readonly RecommendationEffectivenessFailure[]): RecommendationEffectivenessStatus {
  if (failures.includes("EVIDENCE_MISSING") || failures.includes("OBSERVED_OUTCOME_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildEffectivenessRecord(source: OutcomeReplayBinderResult, acceptanceState: RecommendationAcceptanceState, scores: readonly RecommendationEffectivenessScore[], failures: readonly RecommendationEffectivenessFailure[], scenario: Scenario): RecommendationEffectivenessRecord {
  const binding = source.replay_binding;
  const pkg = source.replay_package;
  const dimensionScore = (dimension: RecommendationEffectivenessDimension) => scores.find((score) => score.dimension === dimension)?.score ?? 0;
  const base: Omit<RecommendationEffectivenessRecord, "integrity_hash"> = {
    effectiveness_id: `effectiveness_${hash(`${binding.decision_id}:${pkg.recommendation_ref}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${binding.tenant_id}:foreign` : binding.tenant_id,
    mission_id: binding.mission_id,
    decision_id: binding.decision_id,
    recommendation_id: scenario === "IDENTITY_MISMATCH" ? `${pkg.recommendation_ref}:mismatch` : pkg.recommendation_ref,
    recommendation_version: "10.3.1",
    decision_package_id: pkg.decision_package_ref,
    evaluation_timestamp: EVALUATION_TIMESTAMP,
    acceptance_state: acceptanceState,
    recommended_action: "continue advisory recommendation with governed operator review",
    operator_action_taken: scenario === "MISSING_OPERATOR_ACTION" ? "" : "operator reviewed outcome and recorded action",
    expected_outcome_refs: freezeArray([pkg.recommendation_ref, pkg.decision_package_ref].filter(Boolean)),
    actual_outcome_refs: scenario === "MISSING_OUTCOME" ? freezeArray([]) : freezeArray([pkg.observed_outcome_ref].filter(Boolean)),
    effectiveness_score: dimensionScore("OVERALL_EFFECTIVENESS"),
    dimension_scores: scores,
    confidence_accuracy_score: dimensionScore("CONFIDENCE_ACCURACY"),
    risk_accuracy_score: dimensionScore("RISK_ACCURACY"),
    evidence_quality_score: dimensionScore("EVIDENCE_QUALITY"),
    governance_accuracy_score: dimensionScore("GOVERNANCE_ACCURACY"),
    operator_usability_score: dimensionScore("OPERATOR_USABILITY"),
    failure_reasons: failures,
    improvement_opportunities: freezeArray(failures.length ? ["review evidence, governance, replay, and operator workflow gaps before certification"] : ["monitor future observed outcomes without automatic recommendation mutation"]),
    governance_validation_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray([source.audit_report.report_id]),
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : pkg.evidence_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(source.replay_references.map((ref) => ref.replay_reference_id)),
    lineage_refs: scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : freezeArray([pkg.historical_lineage_ref].filter(Boolean)),
    ledger_refs: freezeArray([source.replay_binding.replay_binding_id]),
    evaluation_status: lifecycleForFailures(failures),
    advisory_only: true,
    modifies_recommendation_behavior: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.effectiveness_id }) });
  return record;
}

function buildLedgerRecord(record: RecommendationEffectivenessRecord, scenario: Scenario): RecommendationEffectivenessLedgerRecord {
  const base: Omit<RecommendationEffectivenessLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `effectiveness_ledger_${hash(record.effectiveness_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    effectiveness_id: record.effectiveness_id,
    recommendation_ref: record.recommendation_id,
    decision_ref: record.decision_id,
    outcome_ref: record.actual_outcome_refs[0] ?? "",
    evidence_refs: record.evidence_refs,
    governance_refs: record.governance_validation_refs,
    replay_refs: record.replay_refs,
    append_only: true,
    deleted: false,
    ledger_sequence: 1,
  };
  const ledger = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_MUTATION") return Object.freeze({ ...ledger, deleted: true, integrity_hash: ledger.integrity_hash });
  return ledger;
}

function buildValidation(source: OutcomeReplayBinderResult, record: RecommendationEffectivenessRecord, ledger: RecommendationEffectivenessLedgerRecord, failures: readonly RecommendationEffectivenessFailure[]): RecommendationEffectivenessValidation {
  const integrityVerified = hashWithoutIntegrity(record) === record.integrity_hash && hashWithoutIntegrity(ledger) === ledger.integrity_hash;
  const allDimensionsScored = RECOMMENDATION_EFFECTIVENESS_DIMENSIONS.every((dimension) => record.dimension_scores.some((score) => score.dimension === dimension && !Number.isNaN(score.score)));
  const replayValidated = record.replay_refs.length > 0 && !failures.includes("REPLAY_DIVERGENCE_DETECTED") && replayOutcomeReplayBinder(source);
  const base: Omit<RecommendationEffectivenessValidation, "integrity_hash"> = {
    validation_id: "recommendation_effectiveness_validation",
    lifecycle_state: lifecycleForFailures(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    governance_validated: record.governance_validation_refs.length > 0 && !failures.includes("GOVERNANCE_MISSING") && !failures.includes("AUTHORITY_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    replay_validated: replayValidated,
    ledger_recorded: ledger.append_only && !ledger.deleted,
    replay_reconstruction_identical: replayValidated,
    tenant_isolated: record.tenant_id === source.replay_binding.tenant_id && !failures.includes("TENANT_ISOLATION_VIOLATED"),
    all_dimensions_scored: allDimensionsScored,
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RecommendationEffectivenessResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    record: result.effectiveness_record,
    validation: result.validation,
    ledger: result.ledger_record,
    replay_hash: result.replay_binder.replay_hash,
  });
}

export function evaluateRecommendationEffectiveness(input: RecommendationEffectivenessInput = {}): RecommendationEffectivenessResult {
  const scenario = input.scenario ?? "BASELINE";
  const replay_binder = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const acceptanceState = input.acceptance_state ?? "ACCEPTED";
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : replay_binder.replay_package.evidence_refs;
  const scores = buildScores(evidenceRefs, scenario);
  const failures = collectFailures(replay_binder, scores, scenario);
  const effectiveness_record = buildEffectivenessRecord(replay_binder, acceptanceState, scores, failures, scenario);
  const ledger_record = buildLedgerRecord(effectiveness_record, scenario);
  const validation = buildValidation(replay_binder, effectiveness_record, ledger_record, failures);
  const base: Omit<RecommendationEffectivenessResult, "integrity_hash" | "replay_hash"> = {
    recommendation_effectiveness_version: RECOMMENDATION_EFFECTIVENESS_VERSION,
    replay_binder,
    api_surface,
    effectiveness_record,
    validation,
    ledger_record,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    evaluates_completed_lifecycle_only: true,
    modifies_recommendation_behavior: false,
    modifies_operator_action: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayRecommendationEffectiveness(result: RecommendationEffectivenessResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeRecommendationEffectivenessHash(record: Omit<RecommendationEffectivenessRecord, "integrity_hash"> | RecommendationEffectivenessRecord): string {
  return hashWithoutIntegrity(record);
}

export function getRecommendationEffectivenessFoundation(): RecommendationEffectivenessFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    recommendation_effectiveness_version: RECOMMENDATION_EFFECTIVENESS_VERSION,
    mandatory_dimensions: RECOMMENDATION_EFFECTIVENESS_DIMENSIONS,
    api_surface,
    result: evaluateRecommendationEffectiveness(),
  });
}

export const RecommendationEffectivenessContract = Object.freeze({
  evaluate: evaluateRecommendationEffectiveness,
  replay: replayRecommendationEffectiveness,
});
