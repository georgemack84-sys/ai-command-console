import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateRecoveryRecommendations, validateRecoveryRecommendationPackage } from "@/services/recovery-recommendation-engine";
import type { RecoveryRecommendationPackage, RecoveryRecommendationScenario } from "@/types/recovery-recommendation-engine";
import type {
  RecoveryReplayEngineContract,
  RecoveryReplayFailure,
  RecoveryReplayInput,
  RecoveryReplayObservabilitySurface,
  RecoveryReplayReconstruction,
  RecoveryReplayResultObject,
  RecoveryReplayScenario,
  RecoveryReplayState,
  RecoveryReplayValidationResult,
} from "@/types/recovery-replay-engine";

const NOW = "2026-07-07T12:00:00.000Z";
const VERSION = "recovery-replay-engine/v8ALT.2.6" as const;
const TENANT_ID = "tenant:autonomy:primary";
const replayStates = Object.freeze(["REPRODUCED", "MISMATCH", "INCOMPLETE", "INVALID"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function toRecommendationScenario(scenario: RecoveryReplayScenario): RecoveryRecommendationScenario {
  const map: Partial<Record<RecoveryReplayScenario, RecoveryRecommendationScenario>> = {
    BASELINE: "BASELINE",
    CONFIDENCE_MISMATCH: "BASELINE",
    RECOMMENDATION_MISMATCH: "BASELINE",
    DEPENDENCY_GRAPH_MISMATCH: "BASELINE",
    GOVERNANCE_VALIDATION_MISMATCH: "BASELINE",
    RANKING_MISMATCH: "BASELINE",
    INTEGRITY_MISMATCH: "BASELINE",
    MISSING_FAILURE_EVIDENCE: "BASELINE",
    MISSING_RECOVERY_PLAN: "BASELINE",
    MISSING_DEPENDENCY_GRAPH: "BASELINE",
    MISSING_GOVERNANCE_EVIDENCE: "BASELINE",
    MISSING_REPLAY_REFERENCE: "BASELINE",
    INCOMPLETE_LINEAGE: "BASELINE",
    CORRUPTED_EVIDENCE: "CONFIDENCE_FABRICATION",
    UNAUTHORIZED_RECORD_MUTATION: "PLAN_MUTATION_ATTEMPT",
    TENANT_BOUNDARY_VIOLATION: "TENANT_ISOLATION_FAILURE",
    INVALID_REPLAY_REQUEST: "VALIDATION_REJECTED",
    SCHEMA_VIOLATION: "VALIDATION_REJECTED",
    EXECUTION_ATTEMPT: "EXECUTION_ATTEMPT",
    HISTORY_REWRITE_ATTEMPT: "BASELINE",
    FABRICATE_EVIDENCE_ATTEMPT: "CONFIDENCE_FABRICATION",
    SUPPRESS_MISMATCH_ATTEMPT: "BASELINE",
    APPROVAL_ATTEMPT: "APPROVAL_BYPASS",
  };
  return map[scenario] ?? scenario as RecoveryRecommendationScenario;
}

function scenarioFailures(scenario: RecoveryReplayScenario): readonly RecoveryReplayFailure[] {
  const map: Partial<Record<RecoveryReplayScenario, RecoveryReplayFailure>> = {
    CONFIDENCE_MISMATCH: "CONFIDENCE_MISMATCH",
    RECOMMENDATION_MISMATCH: "RECOMMENDATION_MISMATCH",
    DEPENDENCY_GRAPH_MISMATCH: "DEPENDENCY_GRAPH_MISMATCH",
    GOVERNANCE_VALIDATION_MISMATCH: "GOVERNANCE_VALIDATION_MISMATCH",
    RANKING_MISMATCH: "RANKING_MISMATCH",
    INTEGRITY_MISMATCH: "INTEGRITY_MISMATCH",
    MISSING_FAILURE_EVIDENCE: "MISSING_FAILURE_EVIDENCE",
    MISSING_RECOVERY_PLAN: "MISSING_RECOVERY_PLAN",
    MISSING_DEPENDENCY_GRAPH: "MISSING_DEPENDENCY_GRAPH",
    MISSING_GOVERNANCE_EVIDENCE: "MISSING_GOVERNANCE_EVIDENCE",
    MISSING_REPLAY_REFERENCE: "MISSING_REPLAY_REFERENCE",
    INCOMPLETE_LINEAGE: "INCOMPLETE_LINEAGE",
    CORRUPTED_EVIDENCE: "CORRUPTED_EVIDENCE",
    UNAUTHORIZED_RECORD_MUTATION: "UNAUTHORIZED_RECORD_MUTATION",
    TENANT_BOUNDARY_VIOLATION: "TENANT_BOUNDARY_VIOLATION",
    INVALID_REPLAY_REQUEST: "INVALID_REPLAY_REQUEST",
    SCHEMA_VIOLATION: "SCHEMA_VIOLATION",
    EXECUTION_ATTEMPT: "EXECUTION_DETECTED",
    HISTORY_REWRITE_ATTEMPT: "HISTORY_REWRITE_DETECTED",
    FABRICATE_EVIDENCE_ATTEMPT: "EVIDENCE_FABRICATION_DETECTED",
    SUPPRESS_MISMATCH_ATTEMPT: "MISMATCH_SUPPRESSION_DETECTED",
    APPROVAL_ATTEMPT: "APPROVAL_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

const mismatchSet = new Set<RecoveryReplayFailure>(["CONFIDENCE_MISMATCH", "RECOMMENDATION_MISMATCH", "DEPENDENCY_GRAPH_MISMATCH", "GOVERNANCE_VALIDATION_MISMATCH", "RANKING_MISMATCH", "INTEGRITY_MISMATCH"]);
const incompleteSet = new Set<RecoveryReplayFailure>(["MISSING_FAILURE_EVIDENCE", "MISSING_RECOVERY_PLAN", "MISSING_DEPENDENCY_GRAPH", "MISSING_GOVERNANCE_EVIDENCE", "MISSING_REPLAY_REFERENCE", "INCOMPLETE_LINEAGE"]);
const invalidSet = new Set<RecoveryReplayFailure>(["CORRUPTED_EVIDENCE", "UNAUTHORIZED_RECORD_MUTATION", "TENANT_BOUNDARY_VIOLATION", "INVALID_REPLAY_REQUEST", "SCHEMA_VIOLATION", "EXECUTION_DETECTED", "RECORD_MODIFICATION_DETECTED", "HISTORY_REWRITE_DETECTED", "EVIDENCE_FABRICATION_DETECTED", "MISMATCH_SUPPRESSION_DETECTED", "APPROVAL_DETECTED"]);

function stateFor(failures: readonly RecoveryReplayFailure[]): RecoveryReplayState {
  if (failures.some((failure) => invalidSet.has(failure))) return "INVALID";
  if (failures.some((failure) => incompleteSet.has(failure))) return "INCOMPLETE";
  if (failures.some((failure) => mismatchSet.has(failure))) return "MISMATCH";
  return "REPRODUCED";
}

function reconstruction(kind: string, source: string, original: unknown, scenarioFailures: readonly RecoveryReplayFailure[], affectedFailure: RecoveryReplayFailure): RecoveryReplayReconstruction {
  const original_hash = hashValue(`recovery-replay-original-${kind}`, original);
  const reconstructed_hash = scenarioFailures.includes(affectedFailure) ? hashValue(`recovery-replay-mutated-${kind}`, { original, affectedFailure }) : original_hash;
  const matched = original_hash === reconstructed_hash;
  const base = {
    reconstruction_id: id("RRR", `recovery-replay-reconstruction-${kind}`, { source, original_hash }),
    source_reference: source,
    reconstructed_hash,
    original_hash,
    matched,
    details: freezeArray(matched ? [`${kind} replay reproduced`] : [`${kind} replay mismatch detected`]),
  };
  return Object.freeze({ ...base, integrity_hash: hashValue(`recovery-replay-reconstruction-${kind}`, base) });
}

export function computeRecoveryReplayResultHash(result: Omit<RecoveryReplayResultObject, "result_hash"> | RecoveryReplayResultObject): string {
  const { result_hash: _hash, ...source } = result as RecoveryReplayResultObject;
  return hashValue("recovery-replay-result-object", source);
}

export function runRecoveryReplay(input: RecoveryReplayInput = {}): RecoveryReplayResultObject {
  const scenario = input.scenario ?? "BASELINE";
  const recommendationPackage = input.recommendation_package ?? generateRecoveryRecommendations({ scenario: toRecommendationScenario(scenario) });
  const recommendationValidation = validateRecoveryRecommendationPackage(recommendationPackage);
  const injectedFailures = scenarioFailures(scenario);
  const packageFailures: RecoveryReplayFailure[] = [
    ...(!recommendationValidation.valid && scenario === "BASELINE" ? ["INVALID_REPLAY_REQUEST" as const] : []),
    ...(!recommendationValidation.replay_valid ? ["CONFIDENCE_MISMATCH" as const] : []),
    ...(!recommendationValidation.tenant_isolated ? ["TENANT_BOUNDARY_VIOLATION" as const] : []),
    ...(!recommendationValidation.integrity_valid ? ["INTEGRITY_MISMATCH" as const] : []),
    ...(recommendationPackage.recovery_executed ? ["EXECUTION_DETECTED" as const] : []),
  ];
  const failures = unique([...injectedFailures, ...packageFailures]);
  const state = stateFor(failures);
  const selected = recommendationPackage.operator_package.recommended_recovery;
  const planning = recommendationPackage.validation_package.validation.source_planning_package;
  const analysis = planning.source_failure_analysis;
  const replay_result_id = id("RREP", "recovery-replay-result", { scenario, package: recommendationPackage.package_hash });
  const reconstructed_failures = reconstruction("failures", analysis.analysis_id, { category: analysis.failure_category, root: analysis.root_cause, lineage: analysis.failure_lineage }, failures, "RECOMMENDATION_MISMATCH");
  const reconstructed_planning = reconstruction("planning", planning.planning_id, { plans: planning.plans.map((plan) => plan.plan_hash), selected: planning.selected_plan.plan_hash }, failures, "RANKING_MISMATCH");
  const reconstructed_dependencies = reconstruction("dependencies", analysis.dependency_graph.graph_hash, analysis.dependency_graph, failures, "DEPENDENCY_GRAPH_MISMATCH");
  const reconstructed_alternatives = reconstruction("alternatives", recommendationPackage.package_id, recommendationPackage.recommendations.map((item) => item.recommendation_hash), failures, "RECOMMENDATION_MISMATCH");
  const reconstructed_confidence = reconstruction("confidence", selected.recommendation_id, recommendationPackage.recommendations.map((item) => item.confidence_score), failures, "CONFIDENCE_MISMATCH");
  const reconstructed_recommendations = reconstruction("recommendations", selected.recommendation_id, { selected: selected.recommendation_hash, level: selected.recommendation_level }, failures, "RECOMMENDATION_MISMATCH");
  const reconstructed_governance = reconstruction("governance", recommendationPackage.validation_package.validation.validation_id, { validation: recommendationPackage.validation_package.validation.validation_hash, evidence: recommendationPackage.operator_package.governance_evidence }, failures, "GOVERNANCE_VALIDATION_MISMATCH");
  const missing_evidence = freezeArray(failures.filter((failure) => incompleteSet.has(failure)));
  const mismatch_reasons = freezeArray(failures.filter((failure) => mismatchSet.has(failure) || invalidSet.has(failure)));
  const integrity_status = state === "INVALID" || failures.includes("INTEGRITY_MISMATCH") ? "FAILED" as const : state === "INCOMPLETE" ? "UNVERIFIED" as const : "VERIFIED" as const;
  const base = {
    replay_result_id,
    recovery_id: selected.recovery_id,
    recommendation_id: selected.recommendation_id,
    mission_id: selected.mission_id,
    execution_id: selected.execution_id,
    tenant_id: scenario === "TENANT_BOUNDARY_VIOLATION" ? "external-tenant" : selected.tenant_id,
    replay_state: state,
    reconstructed_failures,
    reconstructed_planning,
    reconstructed_dependencies,
    reconstructed_alternatives,
    reconstructed_confidence,
    reconstructed_recommendations,
    reconstructed_governance,
    mismatch_reasons,
    missing_evidence,
    integrity_status,
    replay_reference: `replay:${replay_result_id}`,
    lineage_reference: scenario === "INCOMPLETE_LINEAGE" ? "" : `lineage:${replay_result_id}`,
    integrity_hash: integrity_status === "FAILED" ? "" : hashValue("recovery-replay-integrity", { replay_result_id, reconstructions: [reconstructed_failures.integrity_hash, reconstructed_planning.integrity_hash, reconstructed_dependencies.integrity_hash, reconstructed_alternatives.integrity_hash, reconstructed_confidence.integrity_hash, reconstructed_recommendations.integrity_hash, reconstructed_governance.integrity_hash] }),
    timestamp: NOW,
    source_recommendation_package: recommendationPackage,
    advisory_only: true as const,
    recovery_executed: scenario === "EXECUTION_ATTEMPT" || recommendationPackage.recovery_executed,
    records_modified: scenario === "UNAUTHORIZED_RECORD_MUTATION",
    replay_history_rewritten: scenario === "HISTORY_REWRITE_ATTEMPT",
    evidence_fabricated: scenario === "FABRICATE_EVIDENCE_ATTEMPT",
    mismatches_suppressed: scenario === "SUPPRESS_MISMATCH_ATTEMPT",
    approval_granted: scenario === "APPROVAL_ATTEMPT",
  };
  return Object.freeze({ ...base, result_hash: computeRecoveryReplayResultHash(base as Omit<RecoveryReplayResultObject, "result_hash">) });
}

export function validateRecoveryReplay(result?: RecoveryReplayResultObject): RecoveryReplayValidationResult {
  if (!result) {
    const failures = freezeArray<RecoveryReplayFailure>(["INVALID_REPLAY_REQUEST"]);
    const source = { replay_result_id: null, valid: false, state_valid: false, failure_replay_valid: false, planning_replay_valid: false, dependency_replay_valid: false, alternative_replay_valid: false, confidence_replay_valid: false, recommendation_replay_valid: false, governance_replay_valid: false, evidence_complete: false, tenant_isolated: false, integrity_valid: false, advisory_only: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("recovery-replay-validation", source) });
  }
  const state_valid = replayStates.includes(result.replay_state);
  const failure_replay_valid = result.reconstructed_failures.matched;
  const planning_replay_valid = result.reconstructed_planning.matched;
  const dependency_replay_valid = result.reconstructed_dependencies.matched;
  const alternative_replay_valid = result.reconstructed_alternatives.matched;
  const confidence_replay_valid = result.reconstructed_confidence.matched;
  const recommendation_replay_valid = result.reconstructed_recommendations.matched;
  const governance_replay_valid = result.reconstructed_governance.matched;
  const evidence_complete = result.missing_evidence.length === 0 && Boolean(result.replay_reference && result.lineage_reference);
  const tenant_isolated = result.tenant_id === TENANT_ID || result.tenant_id.startsWith("tenant:");
  const integrity_valid = result.integrity_status === "VERIFIED" && Boolean(result.integrity_hash);
  const advisory_only = result.advisory_only && !result.recovery_executed && !result.records_modified && !result.replay_history_rewritten && !result.evidence_fabricated && !result.mismatches_suppressed && !result.approval_granted;
  const immutable_hash_valid = computeRecoveryReplayResultHash(result) === result.result_hash;
  const failures = unique([
    ...(!failure_replay_valid ? ["RECOMMENDATION_MISMATCH" as const] : []),
    ...(!planning_replay_valid ? ["RANKING_MISMATCH" as const] : []),
    ...(!dependency_replay_valid ? ["DEPENDENCY_GRAPH_MISMATCH" as const] : []),
    ...(!alternative_replay_valid ? ["RECOMMENDATION_MISMATCH" as const] : []),
    ...(!confidence_replay_valid ? ["CONFIDENCE_MISMATCH" as const] : []),
    ...(!recommendation_replay_valid ? ["RECOMMENDATION_MISMATCH" as const] : []),
    ...(!governance_replay_valid ? ["GOVERNANCE_VALIDATION_MISMATCH" as const] : []),
    ...result.missing_evidence,
    ...result.mismatch_reasons,
    ...(!state_valid ? ["SCHEMA_VIOLATION" as const] : []),
    ...(!tenant_isolated ? ["TENANT_BOUNDARY_VIOLATION" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_MISMATCH" as const] : []),
    ...(result.recovery_executed ? ["EXECUTION_DETECTED" as const] : []),
    ...(result.records_modified ? ["RECORD_MODIFICATION_DETECTED" as const] : []),
    ...(result.replay_history_rewritten ? ["HISTORY_REWRITE_DETECTED" as const] : []),
    ...(result.evidence_fabricated ? ["EVIDENCE_FABRICATION_DETECTED" as const] : []),
    ...(result.mismatches_suppressed ? ["MISMATCH_SUPPRESSION_DETECTED" as const] : []),
    ...(result.approval_granted ? ["APPROVAL_DETECTED" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_MISMATCH" as const] : []),
  ]);
  const valid = failures.length === 0 && result.replay_state === "REPRODUCED";
  const source = { replay_result_id: result.replay_result_id, valid, state_valid, failure_replay_valid, planning_replay_valid, dependency_replay_valid, alternative_replay_valid, confidence_replay_valid, recommendation_replay_valid, governance_replay_valid, evidence_complete, tenant_isolated, integrity_valid, advisory_only, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("recovery-replay-validation", source) });
}

export function buildRecoveryReplayObservabilitySurface(result = runRecoveryReplay()): RecoveryReplayObservabilitySurface {
  return Object.freeze({
    replay_result_id: result.replay_result_id,
    recovery_id: result.recovery_id,
    recommendation_id: result.recommendation_id,
    replay_state: result.replay_state,
    mismatch_count: result.mismatch_reasons.length,
    missing_evidence_count: result.missing_evidence.length,
    integrity_status: result.integrity_status,
    tenant_id: result.tenant_id,
    advisory_only: true,
    result_hash: result.result_hash,
  });
}

export function getRecoveryReplayEngineContract(): RecoveryReplayEngineContract {
  const replay_result = runRecoveryReplay();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-replay", "immutable-evidence", "replay-fidelity", "governance-preservation", "constitutional-compliance", "operator-visibility", "tenant-isolated", "integrity-verification", "fail-closed"]),
      replay_states: replayStates,
      advisory_only: true,
    }),
    replay_result,
    validation: validateRecoveryReplay(replay_result),
    observability: buildRecoveryReplayObservabilitySurface(replay_result),
  });
}
