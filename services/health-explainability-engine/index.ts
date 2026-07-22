import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildMissionHealthTimeline } from "@/services/mission-health-timeline-engine";
import type { MissionSubsystemId } from "@/types/mission-health-contract";
import type { MissionHealthTimeline, MissionHealthTimelineEntry } from "@/types/mission-health-timeline-engine";
import type {
  CausalCategory,
  CausalExplanation,
  ConfidenceAssessment,
  DependencyGraph,
  EvidenceTrace,
  EvidenceTraceItem,
  HealthExplainabilityEngineContract,
  HealthExplainabilityFailure,
  HealthExplainabilityInput,
  HealthExplainabilityObservabilitySurface,
  HealthExplainabilityScenario,
  HealthExplanation,
  HealthExplanationReplayResult,
  HealthExplanationType,
  HealthExplanationValidationResult,
  MetricChange,
  OperatorHealthExplanation,
  ScoreDecomposition,
  SubsystemAttribution,
  SubsystemAttributionCategory,
  TrendInfluence,
} from "@/types/health-explainability-engine";

const NOW = "2026-07-13T06:00:00.000Z";
const VERSION = "health-explainability-engine/v8ALT.4.6" as const;
const TENANT_ID = "tenant:autonomy:primary";
const subsystemIds = Object.freeze(["planning", "orchestration", "delegation", "runtime_supervision", "governance", "replay", "integrity", "authority"] as const);
const processingStates = Object.freeze(["RECEIVED_HEALTH_CHANGE", "LOAD_PRIOR_HEALTH_STATE", "LOAD_CURRENT_HEALTH_STATE", "CALCULATE_SCORE_DELTA", "IDENTIFY_CONTRIBUTING_SUBSYSTEMS", "TRACE_METRIC_CHANGES", "LINK_SUPPORTING_EVIDENCE", "ANALYZE_CONFIDENCE", "ANALYZE_TRENDS", "BUILD_CAUSAL_CHAIN", "PUBLISH_EXPLANATION", "REJECTED"] as const);
const explanationTypes = Object.freeze(["HEALTH_INCREASE", "HEALTH_DECREASE", "CONFIDENCE_CHANGE", "STABILITY_CHANGE", "READINESS_CHANGE", "DEGRADATION_EVENT", "RECOVERY_EVENT", "SYSTEMIC_RISK", "ANOMALY_DETECTED", "CERTIFICATION_EXPLANATION"] as const);
const attributionCategories = Object.freeze(["PRIMARY_CAUSE", "SECONDARY_CAUSE", "CONTRIBUTING_FACTOR", "CORRELATED_SIGNAL", "NO_MATERIAL_IMPACT"] as const);
const causalCategories = Object.freeze(["DIRECT_CAUSE", "INDIRECT_CAUSE", "SYSTEMIC_CAUSE", "CORRELATED_CAUSE", "INSUFFICIENT_CAUSAL_EVIDENCE"] as const);
const confidenceStates = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW", "INSUFFICIENT"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Number(value.toFixed(4)); }
function avg(values: readonly number[]): number { return round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)); }

function failuresFor(scenario: HealthExplainabilityScenario): readonly HealthExplainabilityFailure[] {
  const map: Partial<Record<HealthExplainabilityScenario, HealthExplainabilityFailure>> = {
    MISSING_PRIOR_STATE: "PRIOR_HEALTH_STATE_MISSING",
    MISSING_CURRENT_STATE: "CURRENT_HEALTH_STATE_MISSING",
    UNREPRODUCIBLE_SCORE_DELTA: "SCORE_DELTA_UNREPRODUCIBLE",
    INCONSISTENT_ATTRIBUTION: "SUBSYSTEM_ATTRIBUTION_INCONSISTENT",
    MISSING_EVIDENCE: "EVIDENCE_TRACE_INCOMPLETE",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    BROKEN_LINEAGE: "LINEAGE_BROKEN",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    UNSUPPORTED_CAUSAL_CHAIN: "CAUSAL_CHAIN_UNSUPPORTED",
    TENANT_VIOLATION: "TENANT_ISOLATION_INVALID",
    GOVERNANCE_VIOLATION: "GOVERNANCE_INVALID",
    AUTHORITY_VIOLATION: "AUTHORITY_INVALID",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function timelineFor(input: HealthExplainabilityInput, failures: readonly HealthExplainabilityFailure[]): MissionHealthTimeline {
  if (input.timeline) return input.timeline;
  const tenant_id = failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  return buildMissionHealthTimeline({ mission_id: input.mission_id, tenant_id });
}

function pair(timeline: MissionHealthTimeline, scenario: HealthExplainabilityScenario): { prior: MissionHealthTimelineEntry | undefined; current: MissionHealthTimelineEntry | undefined } {
  if (scenario === "MISSING_PRIOR_STATE") return { prior: undefined, current: timeline.entries[timeline.entries.length - 1] };
  if (scenario === "MISSING_CURRENT_STATE") return { prior: timeline.entries[timeline.entries.length - 2], current: undefined };
  return { prior: timeline.entries[timeline.entries.length - 2], current: timeline.entries[timeline.entries.length - 1] };
}

function explanationType(delta: number, prior?: MissionHealthTimelineEntry, current?: MissionHealthTimelineEntry): HealthExplanationType {
  if (!prior || !current) return "CERTIFICATION_EXPLANATION";
  if (current.degradation_event) return "DEGRADATION_EVENT";
  if (delta > 0) return "HEALTH_INCREASE";
  if (delta < 0) return "HEALTH_DECREASE";
  if (current.overall_confidence !== prior.overall_confidence) return "CONFIDENCE_CHANGE";
  return "CERTIFICATION_EXPLANATION";
}

function decompose(prior: MissionHealthTimelineEntry | undefined, current: MissionHealthTimelineEntry | undefined, failures: readonly HealthExplainabilityFailure[]): ScoreDecomposition {
  const previous = prior?.overall_health_score ?? 0;
  const now = current?.overall_health_score ?? 0;
  const delta = failures.includes("SCORE_DELTA_UNREPRODUCIBLE") ? round(now - previous + 2.5) : round(now - previous);
  const base = { prior_score: previous, current_score: now, score_delta: delta, weighted_subsystem_impact: round(delta * 0.55), confidence_adjustment: round((current?.overall_confidence ?? 0) - (prior?.overall_confidence ?? 0)), readiness_adjustment: round((current?.readiness_score ?? 0) - (prior?.readiness_score ?? 0)), stability_influence: current?.stability_index === prior?.stability_index ? 0 : round(delta * 0.1), trend_influence: current?.trend_state === "DEGRADING" ? -1 : current?.trend_state === "RECOVERING" ? 1 : 0, degradation_severity_impact: current?.degradation_state === prior?.degradation_state ? 0 : round(delta * 0.15) };
  return Object.freeze({ ...base, decomposition_hash: hashValue("health-explainability-score-decomposition", base) });
}

function attribution(prior: MissionHealthTimelineEntry | undefined, current: MissionHealthTimelineEntry | undefined, failures: readonly HealthExplainabilityFailure[]): readonly SubsystemAttribution[] {
  return freezeArray(subsystemIds.map((subsystem) => {
    const previous = prior?.subsystem_snapshot[subsystem]?.health_score ?? 0;
    const now = current?.subsystem_snapshot[subsystem]?.health_score ?? 0;
    const delta = round(now - previous);
    const abs = Math.abs(delta);
    const category: SubsystemAttributionCategory = failures.includes("SUBSYSTEM_ATTRIBUTION_INCONSISTENT") && subsystem === "planning" ? "PRIMARY_CAUSE" : abs >= 8 ? "PRIMARY_CAUSE" : abs >= 4 ? "SECONDARY_CAUSE" : abs >= 1 ? "CONTRIBUTING_FACTOR" : "NO_MATERIAL_IMPACT";
    const base = { subsystem, previous_score: previous, current_score: now, delta, weighted_impact: round(delta * (subsystem === "planning" || subsystem === "orchestration" || subsystem === "runtime_supervision" || subsystem === "governance" ? 0.15 : 0.1)), category, evidence_reference: failures.includes("EVIDENCE_TRACE_INCOMPLETE") ? "" : current?.subsystem_snapshot[subsystem]?.evidence_reference ?? "" };
    return Object.freeze({ ...base, attribution_hash: hashValue("health-explainability-subsystem-attribution", base) });
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.subsystem.localeCompare(b.subsystem)));
}

function metricChanges(prior: MissionHealthTimelineEntry | undefined, current: MissionHealthTimelineEntry | undefined, failures: readonly HealthExplainabilityFailure[]): readonly MetricChange[] {
  const baseItems: Omit<MetricChange, "metric_change_hash">[] = [
    { metric_name: "overall_health_score", previous_value: prior?.overall_health_score ?? 0, current_value: current?.overall_health_score ?? 0, delta: round((current?.overall_health_score ?? 0) - (prior?.overall_health_score ?? 0)), subsystem: "mission", severity: "MISSION", evidence_reference: current?.evidence_reference ?? "", confidence: current?.overall_confidence ?? 0 },
    { metric_name: "overall_confidence", previous_value: prior?.overall_confidence ?? 0, current_value: current?.overall_confidence ?? 0, delta: round((current?.overall_confidence ?? 0) - (prior?.overall_confidence ?? 0)), subsystem: "mission", severity: "CONFIDENCE", evidence_reference: current?.evidence_reference ?? "", confidence: current?.overall_confidence ?? 0 },
    { metric_name: "readiness_score", previous_value: prior?.readiness_score ?? 0, current_value: current?.readiness_score ?? 0, delta: round((current?.readiness_score ?? 0) - (prior?.readiness_score ?? 0)), subsystem: "mission", severity: "READINESS", evidence_reference: current?.evidence_reference ?? "", confidence: current?.overall_confidence ?? 0 },
    ...subsystemIds.map((subsystem) => ({ metric_name: "subsystem_health_score", previous_value: prior?.subsystem_snapshot[subsystem]?.health_score ?? 0, current_value: current?.subsystem_snapshot[subsystem]?.health_score ?? 0, delta: round((current?.subsystem_snapshot[subsystem]?.health_score ?? 0) - (prior?.subsystem_snapshot[subsystem]?.health_score ?? 0)), subsystem, severity: "SUBSYSTEM", evidence_reference: current?.subsystem_snapshot[subsystem]?.evidence_reference ?? "", confidence: current?.subsystem_snapshot[subsystem]?.confidence ?? 0 })),
  ];
  return freezeArray(baseItems.map((item) => {
    const clean = failures.includes("EVIDENCE_TRACE_INCOMPLETE") ? { ...item, evidence_reference: "" } : item;
    return Object.freeze({ ...clean, metric_change_hash: hashValue("health-explainability-metric-change", clean) });
  }));
}

function confidenceAssessment(prior: MissionHealthTimelineEntry | undefined, current: MissionHealthTimelineEntry | undefined, timeline: MissionHealthTimeline): ConfidenceAssessment {
  const confidence = current?.overall_confidence ?? 0;
  const state = confidence >= 0.95 ? "VERY_HIGH" : confidence >= 0.85 ? "HIGH" : confidence >= 0.7 ? "MEDIUM" : confidence >= 0.5 ? "LOW" : confidence > 0 ? "VERY_LOW" : "INSUFFICIENT";
  const values = current ? subsystemIds.map((subsystem) => current.subsystem_snapshot[subsystem].confidence) : [];
  const base = { confidence_state: state as ConfidenceAssessment["confidence_state"], evidence_quality: current ? 1 : 0, subsystem_confidence: avg(values), replay_certainty: timeline.replay_reference ? 1 : 0, integrity_verification: timeline.integrity_hash ? 1 : 0, trend_stability: current?.trend_state === "STABLE" ? 1 : 0.72, historical_consistency: timeline.entries.length >= 2 ? 1 : 0, incomplete_signal_count: values.filter((value) => value <= 0).length };
  return Object.freeze({ ...base, confidence_hash: hashValue("health-explainability-confidence", base) });
}

function trendInfluence(prior: MissionHealthTimelineEntry | undefined, current: MissionHealthTimelineEntry | undefined): TrendInfluence {
  const delta = round((current?.overall_health_score ?? 0) - (prior?.overall_health_score ?? 0));
  const base = { previous_trend: prior?.trend_state ?? "UNKNOWN" as const, current_trend: current?.trend_state ?? "UNKNOWN" as const, trend_direction: delta > 0 ? "UP" : delta < 0 ? "DOWN" : "FLAT", trend_duration: "PT1H", degradation_velocity: Math.min(0, delta), recovery_velocity: Math.max(0, delta), confidence_movement: round((current?.overall_confidence ?? 0) - (prior?.overall_confidence ?? 0)), subsystem_volatility: avg(subsystemIds.map((subsystem) => Math.abs((current?.subsystem_snapshot[subsystem]?.health_score ?? 0) - (prior?.subsystem_snapshot[subsystem]?.health_score ?? 0)))), recurring_degradation: current?.trend_state === "DEGRADING" && prior?.trend_state === "DEGRADING" };
  return Object.freeze({ ...base, trend_influence_hash: hashValue("health-explainability-trend-influence", base) });
}

function evidenceTrace(explanationId: string, current: MissionHealthTimelineEntry | undefined, failures: readonly HealthExplainabilityFailure[]): EvidenceTrace {
  const items: EvidenceTraceItem[] = current ? subsystemIds.map((subsystem) => ({
    evidence_id: current.subsystem_snapshot[subsystem].evidence_reference || `missing:${subsystem}`,
    subsystem,
    metric: "subsystem_health_score",
    value: current.subsystem_snapshot[subsystem].health_score,
    source: `timeline-entry:${current.entry_id}`,
    timestamp: current.timestamp,
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : current.lineage_reference,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : current.replay_reference,
    integrity_hash: failures.includes("INTEGRITY_INVALID") || failures.includes("EVIDENCE_TRACE_INCOMPLETE") ? "" : current.integrity_hash,
  })) : [];
  const trace_id = id("HET", "health-explainability-evidence-trace", { explanationId, count: items.length });
  const base = { trace_id, explanation_id: explanationId, evidence_items: freezeArray(items) };
  return Object.freeze({ ...base, trace_hash: hashValue("health-explainability-evidence-trace", base) });
}

function dependencyGraph(explanationId: string, attrs: readonly SubsystemAttribution[], failures: readonly HealthExplainabilityFailure[]): DependencyGraph {
  const nodes = freezeArray(["mission-health-score", "confidence-adjustment", "trend-signal", ...attrs.map((item) => `subsystem:${item.subsystem}`)].sort());
  const edges = freezeArray(attrs.map((item) => `subsystem:${item.subsystem}->mission-health-score:${item.category}`).sort());
  const base = { graph_id: id("HEG", "health-explainability-dependency-graph", explanationId), nodes, edges };
  return Object.freeze({ ...base, graph_hash: failures.includes("SUBSYSTEM_ATTRIBUTION_INCONSISTENT") ? "" : hashValue("health-explainability-dependency-graph", base) });
}

function causalChain(explanationId: string, attrs: readonly SubsystemAttribution[], trace: EvidenceTrace, failures: readonly HealthExplainabilityFailure[]): CausalExplanation {
  const primary = attrs.find((item) => item.category === "PRIMARY_CAUSE") ?? attrs[0];
  const category: CausalCategory = failures.includes("CAUSAL_CHAIN_UNSUPPORTED") ? "INSUFFICIENT_CAUSAL_EVIDENCE" : primary?.category === "PRIMARY_CAUSE" ? "DIRECT_CAUSE" : "CORRELATED_CAUSE";
  const affected = attrs.filter((item) => item.category !== "NO_MATERIAL_IMPACT").map((item) => item.subsystem);
  const base = { causal_chain_id: id("HEC", "health-explainability-causal-chain", explanationId), causal_category: category, root_cause: primary ? `${primary.subsystem}:${primary.delta}` : "insufficient-history", intermediate_causes: freezeArray(attrs.filter((item) => item.category === "SECONDARY_CAUSE").map((item) => `${item.subsystem}:${item.delta}`)), affected_subsystems: freezeArray(affected.length ? affected : primary ? [primary.subsystem] : []), affected_metrics: freezeArray(["overall_health_score", "subsystem_health_score", "confidence", "trend_state"]), causal_confidence: category === "INSUFFICIENT_CAUSAL_EVIDENCE" ? 0.2 : 0.88, supporting_evidence: freezeArray(trace.evidence_items.map((item) => item.evidence_id)), alternative_explanations: freezeArray(["confidence adjustment", "trend volatility"]), rejected_explanations: freezeArray(["autonomous intervention", "governance bypass"]), replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:health-explainability-causal:${explanationId}` };
  return Object.freeze({ ...base, causal_hash: failures.includes("CAUSAL_CHAIN_UNSUPPORTED") ? "" : hashValue("health-explainability-causal-chain", base) });
}

function operatorReport(type: HealthExplanationType, attrs: readonly SubsystemAttribution[], confidence: ConfidenceAssessment, trend: TrendInfluence): OperatorHealthExplanation {
  const affected = freezeArray(attrs.filter((item) => item.category !== "NO_MATERIAL_IMPACT").map((item) => item.subsystem));
  const primary = attrs[0];
  const direction = type === "HEALTH_INCREASE" || type === "RECOVERY_EVENT" ? "increased" : "changed";
  const base = { summary: `Mission Health ${direction} because ${primary?.subsystem ?? "mission evidence"} changed by ${primary?.delta ?? 0}.`, primary_reason: primary ? `${primary.subsystem} ${primary.category}` : "insufficient prior/current state", affected_subsystems: affected, severity: type, confidence: confidence.confidence_state, evidence_summary: `${affected.length} subsystem evidence traces linked.`, trend_summary: `Trend moved from ${trend.previous_trend} to ${trend.current_trend}.`, recommended_review: "Operator review recommended; no autonomous action taken.", no_autonomous_action_taken: true as const };
  return Object.freeze({ ...base, report_hash: hashValue("health-explainability-operator-report", base) });
}

function computeExplanationHash(explanation: Omit<HealthExplanation, "explanation_hash"> | HealthExplanation): string {
  const { explanation_hash: _hash, ...source } = explanation as HealthExplanation;
  return hashValue("health-explanation", source);
}

export function explainMissionHealth(input: HealthExplainabilityInput = {}): HealthExplanation {
  const scenario = input.scenario ?? "BASELINE";
  const failures = failuresFor(scenario);
  const timeline = timelineFor(input, failures);
  const { prior, current } = pair(timeline, scenario);
  const decomposition = decompose(prior, current, failures);
  const explanation_id = id("HE", "health-explanation", { timeline: timeline.timeline_hash, prior: prior?.entry_id, current: current?.entry_id, scenario });
  const attrs = attribution(prior, current, failures);
  const metrics = metricChanges(prior, current, failures);
  const confidence = confidenceAssessment(prior, current, timeline);
  const trend = trendInfluence(prior, current);
  const trace = evidenceTrace(explanation_id, current, failures);
  const graph = dependencyGraph(explanation_id, attrs, failures);
  const causal = causalChain(explanation_id, attrs, trace, failures);
  const type = scenario === "HEALTH_INCREASE" ? "HEALTH_INCREASE" : explanationType(decomposition.score_delta, prior, current);
  const report = operatorReport(type, attrs, confidence, trend);
  const base = {
    explanation_id,
    mission_id: timeline.mission_id,
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : timeline.tenant_id,
    health_score_id: current?.mission_health_score_id ?? "",
    prior_health_score_id: prior?.mission_health_score_id ?? "",
    current_health_score: current?.overall_health_score ?? 0,
    previous_health_score: prior?.overall_health_score ?? 0,
    score_delta: decomposition.score_delta,
    explanation_type: type,
    processing_state: failures.length ? "REJECTED" as const : "PUBLISH_EXPLANATION" as const,
    primary_cause: attrs[0] ? `${attrs[0].subsystem}:${attrs[0].category}` : "insufficient-history",
    contributing_subsystems: attrs,
    changed_metrics: metrics,
    confidence_assessment: confidence,
    trend_influence: trend,
    evidence_trace: trace,
    dependency_graph_reference: graph.graph_id,
    dependency_graph: graph,
    causal_chain: causal,
    score_decomposition: decomposition,
    operator_summary: report,
    governance_reference: failures.includes("GOVERNANCE_INVALID") ? "" : `governance:health-explainability:${explanation_id}`,
    lineage_reference: failures.includes("LINEAGE_BROKEN") ? "" : `lineage:health-explainability:${explanation_id}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_MISSING") ? "" : `replay:health-explainability:${explanation_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("health-explanation-integrity", { trace: trace.trace_hash, graph: graph.graph_hash, causal: causal.causal_hash }),
    timestamp: NOW,
    contract_version: VERSION,
    source_timeline: timeline,
    advisory_only: true as const,
    intervention_executed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    mission_health_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    evidence_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    timeline_rewritten: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_bypassed: failures.includes("GOVERNANCE_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
    recovery_approved: failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("AUTHORITY_INVALID") || failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, explanation_hash: computeExplanationHash(base as Omit<HealthExplanation, "explanation_hash">) });
}

export function replayHealthExplanation(explanation = explainMissionHealth()): HealthExplanationReplayResult {
  const reconstructed_hash = computeExplanationHash(explanation);
  const source = { replay_reference: explanation.replay_reference, explanation_id: explanation.explanation_id, deterministic: reconstructed_hash === explanation.explanation_hash && Boolean(explanation.replay_reference), reconstructed_hash, original_hash: explanation.explanation_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("health-explainability-replay", source) });
}

export function validateHealthExplanation(explanation?: HealthExplanation): HealthExplanationValidationResult {
  if (!explanation) {
    const failures = freezeArray<HealthExplainabilityFailure>(["EXPLANATION_CONTRACT_INVALID"]);
    const source = { explanation_id: null, valid: false, explanation_contract_valid: false, prior_state_exists: false, current_state_exists: false, score_delta_reproducible: false, subsystem_attribution_deterministic: false, evidence_trace_complete: false, confidence_explanation_valid: false, trend_influence_reproducible: false, dependency_graph_deterministic: false, causal_explanation_replayable: false, lineage_preserved: false, replay_references_present: false, integrity_hashes_valid: false, governance_valid: false, constitutional_valid: false, authority_valid: false, tenant_isolated: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("health-explainability-validation", source) });
  }
  const prior_state_exists = Boolean(explanation.prior_health_score_id);
  const current_state_exists = Boolean(explanation.health_score_id);
  const score_delta_reproducible = explanation.score_delta === round(explanation.current_health_score - explanation.previous_health_score);
  const subsystem_attribution_deterministic = explanation.contributing_subsystems.every((item) => item.attribution_hash) && Boolean(explanation.dependency_graph.graph_hash);
  const evidence_trace_complete = explanation.evidence_trace.evidence_items.length > 0 && explanation.evidence_trace.evidence_items.every((item) => item.evidence_id && item.integrity_hash);
  const confidence_explanation_valid = explanation.confidence_assessment.confidence_state !== "INSUFFICIENT" && Boolean(explanation.confidence_assessment.confidence_hash) && explanation.confidence_assessment.evidence_quality > 0;
  const trend_influence_reproducible = Boolean(explanation.trend_influence.trend_influence_hash);
  const dependency_graph_deterministic = Boolean(explanation.dependency_graph.graph_hash) && explanation.dependency_graph.nodes.length > 0 && explanation.dependency_graph.edges.length > 0;
  const causal_explanation_replayable = Boolean(explanation.causal_chain.causal_hash) && explanation.causal_chain.causal_category !== "INSUFFICIENT_CAUSAL_EVIDENCE" && Boolean(explanation.causal_chain.replay_reference);
  const lineage_preserved = Boolean(explanation.lineage_reference) && explanation.evidence_trace.evidence_items.every((item) => item.lineage_reference);
  const replay_references_present = Boolean(explanation.replay_reference) && explanation.evidence_trace.evidence_items.every((item) => item.replay_reference);
  const integrity_hashes_valid = Boolean(explanation.integrity_hash) && computeExplanationHash(explanation) === explanation.explanation_hash;
  const governance_valid = Boolean(explanation.governance_reference) && !explanation.governance_bypassed;
  const constitutional_valid = !explanation.intervention_executed && !explanation.recovery_approved;
  const authority_valid = !explanation.authority_escalated;
  const tenant_isolated = explanation.tenant_id.startsWith("tenant:") && explanation.tenant_id === explanation.source_timeline.tenant_id;
  const advisory_only_behavior_enforced = explanation.advisory_only && !explanation.intervention_executed && !explanation.mission_health_modified && !explanation.evidence_modified && !explanation.timeline_rewritten && !explanation.governance_bypassed && !explanation.recovery_approved && !explanation.authority_escalated;
  const explanation_contract_valid = explanation.contract_version === VERSION;
  const failures = unique([
    ...(!explanation_contract_valid ? ["EXPLANATION_CONTRACT_INVALID" as const] : []),
    ...(!prior_state_exists ? ["PRIOR_HEALTH_STATE_MISSING" as const] : []),
    ...(!current_state_exists ? ["CURRENT_HEALTH_STATE_MISSING" as const] : []),
    ...(!score_delta_reproducible ? ["SCORE_DELTA_UNREPRODUCIBLE" as const] : []),
    ...(!subsystem_attribution_deterministic ? ["SUBSYSTEM_ATTRIBUTION_INCONSISTENT" as const] : []),
    ...(!evidence_trace_complete ? ["EVIDENCE_TRACE_INCOMPLETE" as const] : []),
    ...(!confidence_explanation_valid ? ["CONFIDENCE_EXPLANATION_INVALID" as const] : []),
    ...(!trend_influence_reproducible ? ["TREND_INFLUENCE_UNREPRODUCIBLE" as const] : []),
    ...(!dependency_graph_deterministic ? ["DEPENDENCY_GRAPH_NONDETERMINISTIC" as const] : []),
    ...(!causal_explanation_replayable ? ["CAUSAL_CHAIN_UNSUPPORTED" as const] : []),
    ...(!lineage_preserved ? ["LINEAGE_BROKEN" as const] : []),
    ...(!replay_references_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!integrity_hashes_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { explanation_id: explanation.explanation_id, valid, explanation_contract_valid, prior_state_exists, current_state_exists, score_delta_reproducible, subsystem_attribution_deterministic, evidence_trace_complete, confidence_explanation_valid, trend_influence_reproducible, dependency_graph_deterministic, causal_explanation_replayable, lineage_preserved, replay_references_present, integrity_hashes_valid, governance_valid, constitutional_valid, authority_valid, tenant_isolated, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("health-explainability-validation", source) });
}

export function buildHealthExplainabilityObservabilitySurface(explanation = explainMissionHealth()): HealthExplainabilityObservabilitySurface {
  return Object.freeze({ explanation_id: explanation.explanation_id, mission_id: explanation.mission_id, tenant_id: explanation.tenant_id, explanation_type: explanation.explanation_type, score_delta: explanation.score_delta, primary_cause: explanation.primary_cause, affected_subsystem_count: explanation.causal_chain.affected_subsystems.length, evidence_item_count: explanation.evidence_trace.evidence_items.length, advisory_only: true, explanation_hash: explanation.explanation_hash });
}

export function getHealthExplainabilityEngineContract(): HealthExplainabilityEngineContract {
  const explanation = explainMissionHealth();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-score-decomposition", "subsystem-attribution", "metric-change-tracing", "evidence-traceability", "confidence-explanation", "trend-influence-analysis", "dependency-graph-determinism", "causal-chain-replayability", "operator-visible-reporting", "advisory-only-behavior"]),
      processing_states: processingStates,
      explanation_types: explanationTypes,
      attribution_categories: attributionCategories,
      causal_categories: causalCategories,
      confidence_states: confidenceStates,
      advisory_only: true,
    }),
    explanation,
    validation: validateHealthExplanation(explanation),
    replay: replayHealthExplanation(explanation),
    observability: buildHealthExplainabilityObservabilitySurface(explanation),
  });
}
