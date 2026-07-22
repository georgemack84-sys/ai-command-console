import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { explainMissionHealth } from "@/services/health-explainability-engine";
import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { HealthExplanation, HealthExplanationConfidenceState } from "@/types/health-explainability-engine";
import type {
  GovernanceValidation,
  MissionHealthRecommendation,
  MissionHealthRecommendationEngineContract,
  MissionHealthRecommendationFailure,
  MissionHealthRecommendationInput,
  MissionHealthRecommendationObservabilitySurface,
  MissionHealthRecommendationReplayResult,
  MissionHealthRecommendationScenario,
  MissionHealthRecommendationSet,
  MissionHealthRecommendationType,
  MissionHealthRecommendationValidationResult,
  RecommendationEvidence,
  RecommendationPriority,
  RecommendationSeverity,
} from "@/types/mission-health-recommendation-engine";

const NOW = "2026-07-13T07:00:00.000Z";
const VERSION = "mission-health-recommendation-engine/v8ALT.4.7" as const;
const TENANT_ID = "tenant:autonomy:primary";
const recommendationTypes = Object.freeze(["NO_ACTION", "MONITOR", "OPERATOR_REVIEW", "SUBSYSTEM_INSPECTION", "GOVERNANCE_REVIEW", "REPLAY_VALIDATION", "INTEGRITY_VERIFICATION", "EXECUTION_PAUSE_RECOMMENDATION", "RECOVERY_RECOMMENDATION", "PREDICTIVE_MONITORING", "CERTIFICATION_REVIEW"] as const);
const priorities = Object.freeze(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"] as const);
const states = Object.freeze(["GENERATED", "VALIDATED", "GOVERNANCE_APPROVED", "OPERATOR_REVIEW", "ACKNOWLEDGED", "SUPERSEDED", "ARCHIVED", "REJECTED"] as const);
const severities = Object.freeze(["INFO", "NOTICE", "WARNING", "HIGH_RISK", "CRITICAL"] as const);
const priorityRank: Record<RecommendationPriority, number> = { LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4, CRITICAL: 5 };

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }

function failuresFor(scenario: MissionHealthRecommendationScenario): readonly MissionHealthRecommendationFailure[] {
  const map: Partial<Record<MissionHealthRecommendationScenario, MissionHealthRecommendationFailure>> = {
    MISSING_HEALTH_EXPLANATION: "HEALTH_EXPLANATION_MISSING",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    UNSUPPORTED_RECOMMENDATION: "UNSUPPORTED_RECOMMENDATION",
    GOVERNANCE_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    INSUFFICIENT_CONFIDENCE: "CONFIDENCE_INSUFFICIENT",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    BROKEN_LINEAGE: "LINEAGE_BROKEN",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    TENANT_VIOLATION: "TENANT_ISOLATION_INVALID",
    AUTHORITY_VIOLATION: "AUTHORITY_INVALID",
    OPERATOR_APPROVAL_BYPASS_ATTEMPT: "OPERATOR_APPROVAL_BYPASSED",
    AUTONOMOUS_EXECUTION_ATTEMPT: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function explanationFor(input: MissionHealthRecommendationInput, failures: readonly MissionHealthRecommendationFailure[]): HealthExplanation | null {
  if (failures.includes("HEALTH_EXPLANATION_MISSING")) return null;
  if (input.explanation) return input.explanation;
  const scenario = failures.includes("TENANT_ISOLATION_INVALID") ? "TENANT_VIOLATION" : failures.includes("EVIDENCE_MISSING") ? "MISSING_EVIDENCE" : failures.includes("REPLAY_REFERENCE_MISSING") ? "MISSING_REPLAY_REFERENCE" : failures.includes("LINEAGE_BROKEN") ? "BROKEN_LINEAGE" : failures.includes("INTEGRITY_INVALID") ? "INTEGRITY_FAILURE" : failures.includes("GOVERNANCE_VALIDATION_FAILED") ? "GOVERNANCE_VIOLATION" : failures.includes("AUTHORITY_INVALID") ? "AUTHORITY_VIOLATION" : "BASELINE";
  return explainMissionHealth({ mission_id: input.mission_id, tenant_id: input.tenant_id, scenario });
}

function confidenceScore(confidence: HealthExplanationConfidenceState, failures: readonly MissionHealthRecommendationFailure[]): number {
  if (failures.includes("CONFIDENCE_INSUFFICIENT")) return 0.1;
  const scores: Record<HealthExplanationConfidenceState, number> = { VERY_HIGH: 0.96, HIGH: 0.88, MEDIUM: 0.72, LOW: 0.48, VERY_LOW: 0.28, INSUFFICIENT: 0.1 };
  return scores[confidence];
}

function priorityFor(type: MissionHealthRecommendationType, risk: number): RecommendationPriority {
  if (type === "EXECUTION_PAUSE_RECOMMENDATION" || risk >= 0.85) return "CRITICAL";
  if (type === "RECOVERY_RECOMMENDATION" || risk >= 0.7) return "URGENT";
  if (type === "GOVERNANCE_REVIEW" || type === "INTEGRITY_VERIFICATION" || risk >= 0.5) return "HIGH";
  if (type === "OPERATOR_REVIEW" || type === "SUBSYSTEM_INSPECTION") return "NORMAL";
  return "LOW";
}

function severityFor(priority: RecommendationPriority): RecommendationSeverity {
  return priority === "CRITICAL" ? "CRITICAL" : priority === "URGENT" ? "HIGH_RISK" : priority === "HIGH" ? "WARNING" : priority === "NORMAL" ? "NOTICE" : "INFO";
}

function governance(recommendationId: string, failures: readonly MissionHealthRecommendationFailure[]): GovernanceValidation {
  const base = {
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_FAILED"),
    constitutional_compliance: !failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_boundary_valid: !failures.includes("AUTHORITY_INVALID"),
    operator_approval_required: true as const,
    operator_approval_bypassed: failures.includes("OPERATOR_APPROVAL_BYPASSED"),
    execution_authority_granted: false as const,
    recovery_authority_granted: false as const,
  };
  return Object.freeze({ ...base, validation_hash: hashValue("mission-health-recommendation-governance", { recommendationId, ...base }) });
}

function evidence(recommendationId: string, type: MissionHealthRecommendationType, explanation: HealthExplanation | null, subsystem: MissionSubsystemId | "mission", failures: readonly MissionHealthRecommendationFailure[]): readonly RecommendationEvidence[] {
  if (!explanation) return freezeArray([]);
  const source = explanation.evidence_trace.evidence_items.filter((item) => subsystem === "mission" || item.subsystem === subsystem).slice(0, 2);
  return freezeArray((source.length ? source : explanation.evidence_trace.evidence_items.slice(0, 1)).map((item, index) => {
    const base = {
      evidence_id: id("MHRE", "mission-health-recommendation-evidence", { recommendationId, index, type }),
      recommendation_id: recommendationId,
      mission_health_reference: explanation.health_score_id,
      health_explanation_reference: explanation.explanation_id,
      subsystem_reference: item.subsystem,
      trend_reference: explanation.trend_influence.current_trend,
      confidence_reference: explanation.confidence_assessment.confidence_state,
      lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : item.lineage_reference,
      replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : item.replay_reference,
      integrity_hash: failures.includes("INTEGRITY_INVALID") || failures.includes("EVIDENCE_MISSING") ? "" : item.integrity_hash,
    };
    return Object.freeze({ ...base, evidence_hash: hashValue("mission-health-recommendation-evidence", base) });
  }));
}

function makeRecommendation(type: MissionHealthRecommendationType, explanation: HealthExplanation | null, failures: readonly MissionHealthRecommendationFailure[], index: number, affected: readonly MissionSubsystemId[]): MissionHealthRecommendation {
  const unsupported = failures.includes("UNSUPPORTED_RECOMMENDATION") && index === 0;
  const recommendation_type = unsupported ? "NO_ACTION" : type;
  const health = explanation?.current_health_score ?? 0;
  const risk = round(Math.max(0, Math.min(1, (100 - health) / 100 + Math.abs(explanation?.score_delta ?? 0) / 100)));
  const confidence = failures.includes("CONFIDENCE_INSUFFICIENT") ? "INSUFFICIENT" : explanation?.confidence_assessment.confidence_state ?? "INSUFFICIENT";
  const priority = priorityFor(recommendation_type, risk);
  const recommendation_id = id("MHR", "mission-health-recommendation", { type: recommendation_type, explanation: explanation?.explanation_id, index });
  const ev = evidence(recommendation_id, recommendation_type, explanation, affected[0] ?? "mission", failures);
  const gov = governance(recommendation_id, failures);
  const base = {
    recommendation_id,
    mission_id: explanation?.mission_id ?? "mission:health:primary",
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : explanation?.tenant_id ?? TENANT_ID,
    mission_health_score_id: explanation?.health_score_id ?? "",
    recommendation_type,
    priority,
    severity: severityFor(priority),
    recommendation_state: failures.length ? "REJECTED" as const : "OPERATOR_REVIEW" as const,
    confidence,
    confidence_score: confidenceScore(confidence, failures),
    risk_score: risk,
    recommended_action: `${recommendation_type.replaceAll("_", " ").toLowerCase()} for operator review`,
    justification: explanation ? `${recommendation_type} derived from ${explanation.explanation_type} with primary cause ${explanation.primary_cause}.` : "No health explanation was available.",
    affected_subsystems: freezeArray(affected),
    supporting_evidence: ev,
    health_score: health,
    readiness_score: explanation?.source_timeline.entries.at(-1)?.readiness_score ?? 0,
    stability_index: explanation?.source_timeline.entries.at(-1)?.stability_index ?? "UNKNOWN",
    trend_state: explanation?.trend_influence.current_trend ?? "UNKNOWN" as const,
    predicted_outcome: `Operator review may reduce ${recommendation_type.toLowerCase()} risk without autonomous execution.`,
    operator_required: true as const,
    governance_validation: gov,
    alternatives_considered: freezeArray(recommendationTypes.filter((candidate) => candidate !== recommendation_type).slice(0, 3)),
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-health-recommendation:${recommendation_id}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health-recommendation:${recommendation_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-health-recommendation-integrity", { ev: ev.map((item) => item.evidence_hash), gov: gov.validation_hash }),
    timestamp: NOW,
    contract_version: VERSION,
    advisory_only: true as const,
    action_executed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    execution_controlled: failures.includes("ADVISORY_ONLY_VIOLATION"),
    autonomous_intervention_performed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("GOVERNANCE_VALIDATION_FAILED") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("AUTHORITY_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    constitutional_rules_changed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    subsystem_state_altered: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, recommendation_hash: hashValue("mission-health-recommendation", base) });
}

function selectTypes(explanation: HealthExplanation | null): readonly MissionHealthRecommendationType[] {
  if (!explanation) return freezeArray(["CERTIFICATION_REVIEW"]);
  const types: MissionHealthRecommendationType[] = ["OPERATOR_REVIEW", "SUBSYSTEM_INSPECTION", "REPLAY_VALIDATION", "INTEGRITY_VERIFICATION", "PREDICTIVE_MONITORING"];
  if (explanation.trend_influence.current_trend === "DEGRADING" || explanation.score_delta < 0) types.push("EXECUTION_PAUSE_RECOMMENDATION", "RECOVERY_RECOMMENDATION");
  if (explanation.governance_bypassed || explanation.causal_chain.affected_subsystems.includes("governance")) types.push("GOVERNANCE_REVIEW");
  return freezeArray([...new Set(types)]);
}

function computeSetHash(set: Omit<MissionHealthRecommendationSet, "recommendation_set_hash"> | MissionHealthRecommendationSet): string {
  const { recommendation_set_hash: _hash, ...source } = set as MissionHealthRecommendationSet;
  return hashValue("mission-health-recommendation-set", source);
}

export function recommendMissionHealth(input: MissionHealthRecommendationInput = {}): MissionHealthRecommendationSet {
  const scenario = input.scenario ?? "BASELINE";
  const failures = failuresFor(scenario);
  const explanation = explanationFor(input, failures);
  const affected = explanation?.causal_chain.affected_subsystems ?? [];
  const recommendations = freezeArray(selectTypes(explanation).map((type, index) => makeRecommendation(type, explanation, failures, index, affected)).sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || a.recommendation_type.localeCompare(b.recommendation_type)));
  const setId = id("MHRS", "mission-health-recommendation-set", { explanation: explanation?.explanation_id, scenario });
  const base = {
    recommendation_set_id: setId,
    mission_id: explanation?.mission_id ?? input.mission_id ?? "mission:health:primary",
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : explanation?.tenant_id ?? input.tenant_id ?? TENANT_ID,
    recommendations,
    source_explanation: explanation,
    operator_advisory_report: `${recommendations.length} advisory recommendations generated. Operator approval is required before any downstream action.`,
    set_state: failures.length ? "REJECTED" as const : "OPERATOR_REVIEW" as const,
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:mission-health-recommendation-set:${setId}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:mission-health-recommendation-set:${setId}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("mission-health-recommendation-set-integrity", recommendations.map((item) => item.recommendation_hash)),
    contract_version: VERSION,
  };
  return Object.freeze({ ...base, recommendation_set_hash: computeSetHash(base as Omit<MissionHealthRecommendationSet, "recommendation_set_hash">) });
}

export function replayMissionHealthRecommendations(set = recommendMissionHealth()): MissionHealthRecommendationReplayResult {
  const reconstructed_hash = computeSetHash(set);
  const source = { replay_reference: set.replay_reference, recommendation_set_id: set.recommendation_set_id, deterministic: reconstructed_hash === set.recommendation_set_hash && Boolean(set.replay_reference), reconstructed_hash, original_hash: set.recommendation_set_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("mission-health-recommendation-replay", source) });
}

export function validateMissionHealthRecommendations(set?: MissionHealthRecommendationSet): MissionHealthRecommendationValidationResult {
  if (!set) {
    const failures = freezeArray<MissionHealthRecommendationFailure>(["RECOMMENDATION_CONTRACT_INVALID"]);
    const source = { recommendation_set_id: null, valid: false, recommendation_contract_valid: false, health_explanation_exists: false, evidence_complete: false, recommendation_supported: false, governance_validation_valid: false, confidence_sufficient: false, replay_references_present: false, lineage_continuity_valid: false, integrity_hashes_valid: false, tenant_isolated: false, authority_valid: false, operator_approval_required: false, operator_approval_not_bypassed: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("mission-health-recommendation-validation", source) });
  }
  const recommendation_contract_valid = set.contract_version === VERSION && set.recommendations.every((item) => item.contract_version === VERSION);
  const health_explanation_exists = Boolean(set.source_explanation);
  const evidence_complete = set.recommendations.every((item) => item.supporting_evidence.length > 0 && item.supporting_evidence.every((ev) => ev.integrity_hash));
  const recommendation_supported = set.recommendations.every((item) => item.recommendation_type !== "NO_ACTION" || item.risk_score === 0);
  const governance_validation_valid = set.recommendations.every((item) => item.governance_validation.governance_validated && item.governance_validation.constitutional_compliance && item.governance_validation.authority_boundary_valid);
  const confidence_sufficient = set.recommendations.every((item) => item.confidence !== "INSUFFICIENT" && item.confidence_score >= 0.25);
  const replay_references_present = Boolean(set.replay_reference) && set.recommendations.every((item) => item.replay_reference && item.supporting_evidence.every((ev) => ev.replay_reference));
  const lineage_continuity_valid = Boolean(set.lineage_reference) && set.recommendations.every((item) => item.lineage_reference && item.supporting_evidence.every((ev) => ev.lineage_reference));
  const integrity_hashes_valid = Boolean(set.integrity_hash) && set.recommendations.every((item) => item.integrity_hash) && computeSetHash(set) === set.recommendation_set_hash;
  const tenant_isolated = set.tenant_id.startsWith("tenant:") && set.recommendations.every((item) => item.tenant_id === set.tenant_id);
  const authority_valid = set.recommendations.every((item) => !item.authority_escalated && !item.governance_validation.execution_authority_granted && !item.governance_validation.recovery_authority_granted);
  const operator_approval_required = set.recommendations.every((item) => item.operator_required && item.governance_validation.operator_approval_required);
  const operator_approval_not_bypassed = set.recommendations.every((item) => !item.governance_validation.operator_approval_bypassed);
  const advisory_only_behavior_enforced = set.recommendations.every((item) => item.advisory_only && !item.action_executed && !item.execution_controlled && !item.autonomous_intervention_performed && !item.governance_modified && !item.authority_escalated && !item.constitutional_rules_changed && !item.subsystem_state_altered);
  const failures = unique([
    ...(!recommendation_contract_valid ? ["RECOMMENDATION_CONTRACT_INVALID" as const] : []),
    ...(!health_explanation_exists ? ["HEALTH_EXPLANATION_MISSING" as const] : []),
    ...(!evidence_complete ? ["EVIDENCE_MISSING" as const] : []),
    ...(!recommendation_supported ? ["UNSUPPORTED_RECOMMENDATION" as const] : []),
    ...(!governance_validation_valid ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(!confidence_sufficient ? ["CONFIDENCE_INSUFFICIENT" as const] : []),
    ...(!replay_references_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!lineage_continuity_valid ? ["LINEAGE_BROKEN" as const] : []),
    ...(!integrity_hashes_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!operator_approval_required ? ["OPERATOR_APPROVAL_REQUIRED" as const] : []),
    ...(!operator_approval_not_bypassed ? ["OPERATOR_APPROVAL_BYPASSED" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { recommendation_set_id: set.recommendation_set_id, valid, recommendation_contract_valid, health_explanation_exists, evidence_complete, recommendation_supported, governance_validation_valid, confidence_sufficient, replay_references_present, lineage_continuity_valid, integrity_hashes_valid, tenant_isolated, authority_valid, operator_approval_required, operator_approval_not_bypassed, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("mission-health-recommendation-validation", source) });
}

export function buildMissionHealthRecommendationObservabilitySurface(set = recommendMissionHealth()): MissionHealthRecommendationObservabilitySurface {
  const highest = set.recommendations[0]?.priority ?? "LOW";
  return Object.freeze({ recommendation_set_id: set.recommendation_set_id, mission_id: set.mission_id, tenant_id: set.tenant_id, recommendation_count: set.recommendations.length, highest_priority: highest, operator_required: true, advisory_only: true, recommendation_set_hash: set.recommendation_set_hash });
}

export function getMissionHealthRecommendationEngineContract(): MissionHealthRecommendationEngineContract {
  const recommendation_set = recommendMissionHealth();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-recommendation-selection", "deterministic-prioritization", "confidence-scored-advisories", "evidence-backed-recommendations", "governance-validation", "operator-approval-required", "no-execution-authority", "replay-reproducibility", "tenant-isolation", "advisory-only-behavior"]),
      recommendation_types: recommendationTypes,
      priorities,
      states,
      severities,
      advisory_only: true,
    }),
    recommendation_set,
    validation: validateMissionHealthRecommendations(recommendation_set),
    replay: replayMissionHealthRecommendations(recommendation_set),
    observability: buildMissionHealthRecommendationObservabilitySurface(recommendation_set),
  });
}
