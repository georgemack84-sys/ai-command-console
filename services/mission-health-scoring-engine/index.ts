import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { collectSubsystemHealth, validateSubsystemHealthCollection } from "@/services/subsystem-health-collection-engine";
import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type {
  DegradationSeverity,
  HealthConsistency,
  MissionHealthScore,
  MissionHealthScoreState,
  MissionHealthScoringEngineContract,
  MissionHealthScoringEvidence,
  MissionHealthScoringFailure,
  MissionHealthScoringInput,
  MissionHealthScoringObservabilitySurface,
  MissionHealthScoringReplayResult,
  MissionHealthScoringScenario,
  MissionHealthScoringValidationResult,
  OperationalReadiness,
  OverallConfidence,
  StabilityIndex,
  WeightingProfile,
} from "@/types/mission-health-scoring-engine";
import type { SubsystemHealthCollection } from "@/types/subsystem-health-collection-engine";

const NOW = "2026-07-13T03:00:00.000Z";
const VERSION = "mission-health-scoring-engine/v8ALT.4.3" as const;
const TENANT_ID = "tenant:autonomy:primary";
const weights: Readonly<Record<MissionSubsystemId, number>> = Object.freeze({ planning: 0.15, orchestration: 0.15, delegation: 0.1, runtime_supervision: 0.15, governance: 0.15, replay: 0.1, integrity: 0.1, authority: 0.1 });
const subsystemIds = Object.freeze(Object.keys(weights) as MissionSubsystemId[]);
const scoringStates = Object.freeze(["RECEIVED", "INPUT_VALIDATION", "WEIGHT_CALCULATION", "CONFIDENCE_ADJUSTMENT", "HEALTH_CONSISTENCY_ANALYSIS", "READINESS_EVALUATION", "STABILITY_ANALYSIS", "FINAL_SCORING", "VALIDATED", "PUBLISHED", "REJECTED"] as const);
const healthStates = Object.freeze(["OPTIMAL", "HEALTHY", "STABLE", "WARNING", "DEGRADED", "HIGH_RISK", "CRITICAL", "FAILED"] as const);
const consistencyLevels = Object.freeze(["CONSISTENT", "MOSTLY_CONSISTENT", "PARTIALLY_CONSISTENT", "INCONSISTENT"] as const);
const readinessLevels = Object.freeze(["FULLY_READY", "READY", "LIMITED", "DEGRADED", "NOT_READY"] as const);
const stabilityLevels = Object.freeze(["VERY_STABLE", "STABLE", "MODERATELY_STABLE", "UNSTABLE", "HIGHLY_UNSTABLE"] as const);
const degradationLevels = Object.freeze(["NONE", "MINOR", "MODERATE", "MAJOR", "SEVERE", "CRITICAL"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function scenarioFailures(scenario: MissionHealthScoringScenario): readonly MissionHealthScoringFailure[] {
  const map: Partial<Record<MissionHealthScoringScenario, MissionHealthScoringFailure>> = {
    MISSING_SUBSYSTEM: "SUBSYSTEM_COMPLETENESS_INVALID",
    DUPLICATE_SUBSYSTEM: "CERTIFIED_SUBSYSTEM_IDENTITY_INVALID",
    INVALID_WEIGHT: "WEIGHTING_INTEGRITY_INVALID",
    INVALID_CONFIDENCE: "CONFIDENCE_INVALID",
    MISSING_EVIDENCE: "EVIDENCE_INCOMPLETE",
    REPLAY_MISMATCH: "REPLAY_REFERENCE_MISSING",
    BROKEN_LINEAGE: "LINEAGE_BROKEN",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    GOVERNANCE_FAILURE: "GOVERNANCE_INVALID",
    TENANT_VIOLATION: "TENANT_ISOLATION_INVALID",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function healthState(score: number): MissionHealthScoreState {
  if (score >= 98) return "OPTIMAL";
  if (score >= 90) return "HEALTHY";
  if (score >= 80) return "STABLE";
  if (score >= 65) return "WARNING";
  if (score >= 50) return "DEGRADED";
  if (score >= 35) return "HIGH_RISK";
  if (score >= 20) return "CRITICAL";
  return "FAILED";
}

function readiness(score: number): OperationalReadiness {
  if (score >= 95) return "FULLY_READY";
  if (score >= 85) return "READY";
  if (score >= 70) return "LIMITED";
  if (score >= 50) return "DEGRADED";
  return "NOT_READY";
}

function stabilityIndex(value: number): StabilityIndex {
  if (value >= 0.9) return "VERY_STABLE";
  if (value >= 0.78) return "STABLE";
  if (value >= 0.62) return "MODERATELY_STABLE";
  if (value >= 0.42) return "UNSTABLE";
  return "HIGHLY_UNSTABLE";
}

function degradation(score: number): DegradationSeverity {
  if (score >= 95) return "NONE";
  if (score >= 85) return "MINOR";
  if (score >= 70) return "MODERATE";
  if (score >= 55) return "MAJOR";
  if (score >= 35) return "SEVERE";
  return "CRITICAL";
}

function consistencyFromVariance(variance: number): HealthConsistency {
  if (variance <= 8) return "CONSISTENT";
  if (variance <= 18) return "MOSTLY_CONSISTENT";
  if (variance <= 35) return "PARTIALLY_CONSISTENT";
  return "INCONSISTENT";
}

function profile(failures: readonly MissionHealthScoringFailure[]): WeightingProfile {
  const effectiveWeights = failures.includes("WEIGHTING_INTEGRITY_INVALID") ? { ...weights, planning: 0.2 } : weights;
  const base = { profile_id: id("MHSW", "mission-health-weighting-profile", effectiveWeights), contract_version: VERSION, weights: Object.freeze(effectiveWeights), total_weight: round(Object.values(effectiveWeights).reduce((sum, value) => sum + value, 0)), immutable: true as const, governance_approved: true as const };
  return Object.freeze({ ...base, profile_hash: hashValue("mission-health-weighting-profile", base) });
}

function confidence(values: readonly number[], evidenceQuality: number): OverallConfidence {
  const avg = round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
  const variance = round(values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / Math.max(1, values.length));
  const base = { overall_confidence: avg, confidence_score: round(avg * 100), confidence_distribution: freezeArray([...values].sort()), confidence_variance: variance, confidence_consistency: round(1 - Math.min(1, variance)), evidence_quality: evidenceQuality };
  return Object.freeze({ ...base, confidence_hash: hashValue("mission-health-scoring-confidence", base) });
}

function scoringEvidence(scoreId: string, collection: SubsystemHealthCollection, profile: WeightingProfile, failures: readonly MissionHealthScoringFailure[]): readonly MissionHealthScoringEvidence[] {
  return freezeArray(collection.subsystems.map((subsystem) => {
    const weight = profile.weights[subsystem.subsystem_id] ?? 0;
    const base = {
      evidence_id: id("MHSE", "mission-health-scoring-evidence", { scoreId, subsystem: subsystem.subsystem_id }),
      mission_health_score_id: scoreId,
      subsystem: subsystem.subsystem_id,
      metric: "weighted_health_score",
      weight,
      health_score: subsystem.health_score,
      confidence: subsystem.confidence,
      contribution: round(subsystem.health_score * weight),
      timestamp: NOW,
      lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : subsystem.lineage_reference,
      replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : subsystem.replay_reference,
      integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-health-scoring-evidence-integrity", { scoreId, subsystem: subsystem.subsystem_id, weight }),
    };
    return Object.freeze({ ...base, evidence_hash: hashValue("mission-health-scoring-evidence", base) });
  }).sort((a, b) => a.subsystem.localeCompare(b.subsystem)));
}

function computeScoreHash(score: Omit<MissionHealthScore, "score_hash"> | MissionHealthScore): string {
  const { score_hash: _hash, ...source } = score as MissionHealthScore;
  return hashValue("mission-health-score", source);
}

function removeSubsystem(collection: SubsystemHealthCollection): SubsystemHealthCollection {
  const subsystems = freezeArray(collection.subsystems.filter((item) => item.subsystem_id !== "authority"));
  const normalized_metrics = freezeArray(collection.normalized_metrics.filter((item) => item.subsystem !== "authority"));
  const evidence_references = freezeArray(collection.evidence_references.filter((item) => item.subsystem !== "authority"));
  const base = {
    ...collection,
    collection_id: id("SHC", "mission-health-scoring-missing-subsystem", collection.collection_id),
    collection_state: "VALIDATING" as const,
    overall_collection_status: "PARTIAL" as const,
    subsystems,
    normalized_metrics,
    evidence_references,
    health_event_stream: freezeArray(subsystems.map((item) => `${item.timestamp}:${item.subsystem_id}:${item.health_state}`).sort()),
  };
  return Object.freeze({ ...base, collection_hash: hashValue("subsystem-health-collection", base) });
}

export function scoreMissionHealth(input: MissionHealthScoringInput = {}): MissionHealthScore {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  let collection = input.collection ?? collectSubsystemHealth({ tenant_id: tenantId, mission_id: input.mission_id });
  if (scenario === "MISSING_SUBSYSTEM") collection = removeSubsystem(collection);
  if (scenario === "DUPLICATE_SUBSYSTEM") collection = collectSubsystemHealth({ tenant_id: tenantId, mission_id: input.mission_id, scenario: "DUPLICATE_SUBMISSION" });
  if (scenario === "INVALID_CONFIDENCE") collection = collectSubsystemHealth({ tenant_id: tenantId, mission_id: input.mission_id, scenario: "INVALID_CONFIDENCE" });
  if (scenario === "MISSING_EVIDENCE") collection = collectSubsystemHealth({ tenant_id: tenantId, mission_id: input.mission_id, scenario: "MISSING_EVIDENCE" });
  if (scenario === "TENANT_VIOLATION") collection = collectSubsystemHealth({ tenant_id: tenantId, mission_id: input.mission_id, scenario: "CROSS_TENANT_REPORT" });
  const weightProfile = profile(failures);
  const scoreId = id("MHS", "mission-health-score", { collection: collection.collection_hash, scenario });
  const evidence = scoringEvidence(scoreId, collection, weightProfile, failures);
  const weightedBase = round(evidence.reduce((sum, item) => sum + item.contribution, 0));
  const conf = confidence(collection.subsystems.map((item) => item.confidence), collection.evidence_references.length / Math.max(1, collection.subsystems.length));
  const confidenceAdjusted = round(weightedBase * (0.85 + conf.overall_confidence * 0.15));
  const scores = collection.subsystems.map((item) => item.health_score);
  const scoreAvg = scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length);
  const variance = round(scores.reduce((sum, value) => sum + Math.abs(value - scoreAvg), 0) / Math.max(1, scores.length));
  const consistency = consistencyFromVariance(variance);
  const consistencyScore = round(Math.max(0, 100 - variance));
  const stabilityAvg = round(collection.subsystems.reduce((sum, item) => sum + item.stability_score, 0) / Math.max(1, collection.subsystems.length));
  const readinessScore = round((confidenceAdjusted * 0.55) + (consistencyScore * 0.25) + (stabilityAvg * 100 * 0.2));
  const finalScore = round((confidenceAdjusted * 0.7) + (readinessScore * 0.2) + (consistencyScore * 0.1));
  const base = {
    mission_health_score_id: scoreId,
    mission_id: collection.mission_id,
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : collection.tenant_id,
    scoring_state: failures.length ? "REJECTED" as const : "PUBLISHED" as const,
    overall_health_score: finalScore,
    weighted_base_score: weightedBase,
    confidence_adjusted_score: confidenceAdjusted,
    overall_confidence: conf,
    readiness_score: readinessScore,
    readiness: readiness(readinessScore),
    stability_index: stabilityIndex(stabilityAvg),
    consistency_score: consistencyScore,
    consistency,
    degradation_severity: degradation(finalScore),
    health_state: healthState(finalScore),
    subsystem_scores: freezeArray(collection.subsystems.map((item) => `${item.subsystem_id}:${item.health_score}`).sort()),
    weighting_profile: weightProfile,
    scoring_evidence: evidence,
    calculation_timestamp: NOW,
    evidence_reference: `evidence:${scoreId}`,
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : collection.lineage_reference,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : collection.replay_reference,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-health-score-integrity", { evidence: evidence.map((item) => item.evidence_hash), profile: weightProfile.profile_hash, confidence: conf.confidence_hash }),
    contract_version: VERSION,
    source_collection: collection,
    advisory_only: true as const,
    execution_initiated: failures.includes("ADVISORY_ONLY_VIOLATION"),
    recovery_authorized: failures.includes("ADVISORY_ONLY_VIOLATION"),
    subsystem_data_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("GOVERNANCE_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    constitutional_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    operator_authority_overridden: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, score_hash: computeScoreHash(base as Omit<MissionHealthScore, "score_hash">) });
}

export function replayMissionHealthScore(score = scoreMissionHealth()): MissionHealthScoringReplayResult {
  const reconstructed_hash = computeScoreHash(score);
  const source = { replay_reference: score.replay_reference, mission_health_score_id: score.mission_health_score_id, deterministic: reconstructed_hash === score.score_hash && Boolean(score.replay_reference), reconstructed_hash, original_hash: score.score_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("mission-health-scoring-replay", source) });
}

export function validateMissionHealthScore(score?: MissionHealthScore): MissionHealthScoringValidationResult {
  if (!score) {
    const failures = freezeArray<MissionHealthScoringFailure>(["SCORING_CONTRACT_INVALID"]);
    const source = { mission_health_score_id: null, valid: false, scoring_contract_valid: false, scoring_inputs_valid: false, subsystem_completeness_valid: false, certified_subsystem_identity_valid: false, weighting_integrity_valid: false, confidence_valid: false, normalization_integrity_valid: false, evidence_complete: false, replay_references_present: false, lineage_continuity_valid: false, integrity_hashes_valid: false, governance_valid: false, constitutional_valid: false, authority_valid: false, tenant_isolated: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("mission-health-scoring-validation", source) });
  }
  const ids = score.source_collection.subsystems.map((item) => item.subsystem_id);
  const scoring_contract_valid = score.contract_version === VERSION;
  const scoring_inputs_valid = validateSubsystemHealthCollection(score.source_collection).valid;
  const subsystem_completeness_valid = score.source_collection.subsystems.length === subsystemIds.length;
  const certified_subsystem_identity_valid = ids.length === subsystemIds.length && new Set(ids).size === subsystemIds.length && subsystemIds.every((idValue) => ids.includes(idValue));
  const weighting_integrity_valid = score.weighting_profile.total_weight === 1 && Object.entries(weights).every(([key, value]) => score.weighting_profile.weights[key as MissionSubsystemId] === value);
  const confidence_valid = score.overall_confidence.overall_confidence >= 0 && score.overall_confidence.overall_confidence <= 1 && score.source_collection.subsystems.every((item) => item.confidence >= 0 && item.confidence <= 1);
  const normalization_integrity_valid = score.source_collection.normalized_metrics.length === score.source_collection.subsystems.length;
  const evidence_complete = score.scoring_evidence.length === score.source_collection.subsystems.length && score.scoring_evidence.every((item) => item.integrity_hash) && score.source_collection.evidence_references.length === score.source_collection.subsystems.length && score.source_collection.subsystems.every((item) => item.evidence_reference && item.evidence.length > 0);
  const replay_references_present = Boolean(score.replay_reference) && score.scoring_evidence.every((item) => item.replay_reference);
  const lineage_continuity_valid = Boolean(score.lineage_reference) && score.scoring_evidence.every((item) => item.lineage_reference);
  const integrity_hashes_valid = Boolean(score.integrity_hash) && computeScoreHash(score) === score.score_hash;
  const governance_valid = !score.governance_modified;
  const constitutional_valid = !score.constitutional_modified;
  const authority_valid = !score.operator_authority_overridden;
  const tenant_isolated = score.tenant_id.startsWith("tenant:") && score.tenant_id === score.source_collection.tenant_id;
  const advisory_only_behavior_enforced = score.advisory_only && !score.execution_initiated && !score.recovery_authorized && !score.subsystem_data_modified && !score.governance_modified && !score.constitutional_modified && !score.operator_authority_overridden;
  const failures = unique([
    ...(!scoring_contract_valid ? ["SCORING_CONTRACT_INVALID" as const] : []),
    ...(!scoring_inputs_valid ? ["SCORING_INPUT_INVALID" as const] : []),
    ...(!subsystem_completeness_valid ? ["SUBSYSTEM_COMPLETENESS_INVALID" as const] : []),
    ...(!certified_subsystem_identity_valid ? ["CERTIFIED_SUBSYSTEM_IDENTITY_INVALID" as const] : []),
    ...(!weighting_integrity_valid ? ["WEIGHTING_INTEGRITY_INVALID" as const] : []),
    ...(!confidence_valid ? ["CONFIDENCE_INVALID" as const] : []),
    ...(!normalization_integrity_valid ? ["NORMALIZATION_INTEGRITY_INVALID" as const] : []),
    ...(!evidence_complete ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!replay_references_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!lineage_continuity_valid ? ["LINEAGE_BROKEN" as const] : []),
    ...(!integrity_hashes_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { mission_health_score_id: score.mission_health_score_id, valid, scoring_contract_valid, scoring_inputs_valid, subsystem_completeness_valid, certified_subsystem_identity_valid, weighting_integrity_valid, confidence_valid, normalization_integrity_valid, evidence_complete, replay_references_present, lineage_continuity_valid, integrity_hashes_valid, governance_valid, constitutional_valid, authority_valid, tenant_isolated, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("mission-health-scoring-validation", source) });
}

export function buildMissionHealthScoringObservabilitySurface(score = scoreMissionHealth()): MissionHealthScoringObservabilitySurface {
  return Object.freeze({ mission_health_score_id: score.mission_health_score_id, mission_id: score.mission_id, tenant_id: score.tenant_id, health_state: score.health_state, overall_health_score: score.overall_health_score, readiness: score.readiness, stability_index: score.stability_index, degradation_severity: score.degradation_severity, advisory_only: true, score_hash: score.score_hash });
}

export function getMissionHealthScoringEngineContract(): MissionHealthScoringEngineContract {
  const score = scoreMissionHealth();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-scoring", "certified-weighting-profile", "confidence-adjusted-scoring", "health-consistency-analysis", "operational-readiness-evaluation", "stability-index-calculation", "degradation-severity-analysis", "replay-reproducibility", "governance-compliance", "advisory-only-behavior"]),
      scoring_states: scoringStates,
      health_states: healthStates,
      consistency_levels: consistencyLevels,
      readiness_levels: readinessLevels,
      stability_levels: stabilityLevels,
      degradation_levels: degradationLevels,
      advisory_only: true,
    }),
    score,
    validation: validateMissionHealthScore(score),
    replay: replayMissionHealthScore(score),
    observability: buildMissionHealthScoringObservabilitySurface(score),
  });
}
