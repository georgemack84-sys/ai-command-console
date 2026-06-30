import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildPolicyAnalysisRecord, validatePolicyAnalysisRecord } from "@/services/policy-analysis";
import { generatePolicyCorrelations, validatePolicyCorrelationRecord } from "@/services/policy-correlation";
import { buildDefaultPolicyGraphInputs, buildPolicyDependencyGraph, validatePolicyDependencyGraph } from "@/services/policy-dependency-graph";
import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationRecord } from "@/types/policy-correlation";
import type { PolicyDependencyGraph } from "@/types/policy-dependency-graph";
import type {
  AffectedAuthority,
  AffectedCertification,
  AffectedComponent,
  AffectedDecision,
  AffectedGovernanceAction,
  AffectedMission,
  AffectedPolicy,
  AffectedRecommendation,
  AffectedRuntimeEvent,
  AffectedViolation,
  PolicyImpactAnalysis,
  PolicyImpactCategory,
  PolicyImpactConfidence,
  PolicyImpactDoctrine,
  PolicyImpactEngineResult,
  PolicyImpactExplanation,
  PolicyImpactFailureReason,
  PolicyImpactMetrics,
  PolicyImpactMode,
  PolicyImpactObservabilitySurface,
  PolicyImpactReplayRefs,
  PolicyImpactReplayResult,
  PolicyImpactScope,
  PolicyImpactState,
  PolicyImpactTimelineEvent,
  PolicyImpactValidationFailure,
  PolicyImpactValidationResult,
} from "@/types/policy-impact-analysis";

const NOW = "2026-06-25T07:00:00.000Z";
const ALGORITHM_VERSION = "policy-impact-analysis/v7B.4" as const;
export const POLICY_IMPACT_CATEGORIES = ["DIRECT_IMPACT", "SECONDARY_IMPACT", "CASCADING_IMPACT", "LONGITUDINAL_IMPACT", "CROSS_SYSTEM_IMPACT"] as const;
export const POLICY_IMPACT_MODES = ["HISTORICAL", "PROJECTED", "COUNTERFACTUAL", "MIXED"] as const;
export const POLICY_IMPACT_STATES = ["CREATED", "SOURCE_VALIDATED", "IMPACT_DISCOVERED", "METRICS_CALCULATED", "EVIDENCE_VERIFIED", "REPLAYABLE", "CERTIFICATION_READY", "RESTRICTED", "INCOMPLETE", "INSUFFICIENT_EVIDENCE", "REPLAY_MISMATCH", "INVALID", "ARCHIVED"] as const;
const ALLOWED_ANALYSIS_STATES = ["VALIDATED", "REPLAYABLE", "RESTRICTED", "ARCHIVED"] as const;
const ALLOWED_CORRELATION_STATES = ["CONSISTENCY_VERIFIED", "REPLAYABLE", "RESTRICTED", "ARCHIVED"] as const;
const ALLOWED_GRAPH_STATES = ["VALIDATED", "REPLAYABLE", "RESTRICTED", "ARCHIVED"] as const;
const ALLOWED_TRANSITIONS: Readonly<Record<PolicyImpactState, readonly PolicyImpactState[]>> = Object.freeze({
  CREATED: Object.freeze(["SOURCE_VALIDATED", "INVALID"] as const),
  SOURCE_VALIDATED: Object.freeze(["IMPACT_DISCOVERED", "INCOMPLETE", "INVALID"] as const),
  IMPACT_DISCOVERED: Object.freeze(["METRICS_CALCULATED", "INSUFFICIENT_EVIDENCE"] as const),
  METRICS_CALCULATED: Object.freeze(["EVIDENCE_VERIFIED", "INVALID"] as const),
  EVIDENCE_VERIFIED: Object.freeze(["REPLAYABLE", "REPLAY_MISMATCH"] as const),
  REPLAYABLE: Object.freeze(["CERTIFICATION_READY", "RESTRICTED", "ARCHIVED"] as const),
  CERTIFICATION_READY: Object.freeze(["ARCHIVED"] as const),
  RESTRICTED: Object.freeze(["ARCHIVED"] as const),
  INCOMPLETE: Object.freeze(["ARCHIVED"] as const),
  INSUFFICIENT_EVIDENCE: Object.freeze(["ARCHIVED"] as const),
  REPLAY_MISMATCH: Object.freeze(["ARCHIVED"] as const),
  INVALID: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function uniq(items: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(items.filter(Boolean))].sort());
}

function validationFailure(reason: PolicyImpactFailureReason, field_path: string, message: string): PolicyImpactValidationFailure {
  return Object.freeze({ failure_id: hashValue("policy-impact-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

export function buildPolicyImpactDoctrine(): PolicyImpactDoctrine {
  return Object.freeze({
    principles: Object.freeze(["evidence-required", "no-unsupported-causality", "historical-projected-separated", "advisory-only", "replay-required", "tenant-isolated", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["unsupported causality claims", "policy mutation", "policy enforcement", "autonomous conflict resolution", "authority expansion", "operator override", "governance bypass", "unbounded projection", "replay mismatch acceptance"]),
    supported_categories: Object.freeze([...POLICY_IMPACT_CATEGORIES]),
    supported_modes: Object.freeze([...POLICY_IMPACT_MODES]),
    allowed_state_transitions: ALLOWED_TRANSITIONS,
  });
}

export function buildDefaultPolicyImpactInputs(): { policy_analysis: PolicyAnalysisRecord; policy_correlations: readonly PolicyCorrelationRecord[]; policy_graph: PolicyDependencyGraph } {
  const graphInputs = buildDefaultPolicyGraphInputs();
  const policy = graphInputs.policy_analyses[0] ?? buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" });
  const correlations = graphInputs.policy_correlations.length ? graphInputs.policy_correlations : generatePolicyCorrelations(policy);
  return Object.freeze({ policy_analysis: policy, policy_correlations: correlations, policy_graph: buildPolicyDependencyGraph(graphInputs.policy_analyses, correlations) });
}

export function validatePolicyImpactSources(policy: PolicyAnalysisRecord | undefined, correlations: readonly PolicyCorrelationRecord[] | undefined, graph: PolicyDependencyGraph | undefined): readonly PolicyImpactValidationFailure[] {
  const failures: PolicyImpactValidationFailure[] = [];
  if (!policy) failures.push(validationFailure("POLICY_ANALYSIS_MISSING", "policy_analysis", "PolicyAnalysis source missing"));
  if (policy && (validatePolicyAnalysisRecord(policy).validation_state === "FAIL" || !(ALLOWED_ANALYSIS_STATES as readonly string[]).includes(policy.analysis_state))) failures.push(validationFailure("POLICY_ANALYSIS_INVALID", "policy_analysis", "PolicyAnalysis source invalid or blocked"));
  if (!correlations?.length) failures.push(validationFailure("POLICY_CORRELATION_MISSING", "policy_correlations", "PolicyCorrelation sources missing"));
  for (const correlation of correlations ?? []) {
    const validation = validatePolicyCorrelationRecord(correlation, { policy_analysis: policy });
    if (validation.validation_state === "FAIL" || !(ALLOWED_CORRELATION_STATES as readonly string[]).includes(correlation.correlation_state)) failures.push(validationFailure("POLICY_CORRELATION_INVALID", "policy_correlations", "PolicyCorrelation source invalid or blocked"));
    if (policy && correlation.tenant_id !== policy.tenant_id) failures.push(validationFailure("TENANT_MISMATCH", "policy_correlations.tenant_id", "PolicyCorrelation tenant mismatch"));
  }
  if (!graph) failures.push(validationFailure("POLICY_GRAPH_MISSING", "policy_graph", "PolicyDependencyGraph source missing"));
  if (graph && (validatePolicyDependencyGraph(graph).validation_state === "FAIL" || !(ALLOWED_GRAPH_STATES as readonly string[]).includes(graph.graph_state))) failures.push(validationFailure("POLICY_GRAPH_INVALID", "policy_graph", "PolicyDependencyGraph source invalid or blocked"));
  if (policy && graph && graph.tenant_id !== policy.tenant_id) failures.push(validationFailure("TENANT_MISMATCH", "policy_graph.tenant_id", "PolicyDependencyGraph tenant mismatch"));
  return Object.freeze(failures);
}

export function resolvePolicyImpactScope(policy: PolicyAnalysisRecord, graph: PolicyDependencyGraph): PolicyImpactScope {
  return Object.freeze({
    tenant_scope: policy.tenant_id,
    mission_scope: policy.governance_scope.mission_scope,
    system_scope: "Mission Control",
    governance_scope: "Governance Intelligence",
    runtime_scope: policy.governance_scope.runtime_scope,
    authority_scope: policy.authority_scope.review_authority,
    historical_window: graph.graph_scope.historical_window,
    projection_scope: "bounded_scenario_only",
    visibility_scope: policy.governance_scope.visibility_scope,
  });
}

export function discoverAffectedObjects(policy: PolicyAnalysisRecord, correlations: readonly PolicyCorrelationRecord[], graph: PolicyDependencyGraph) {
  const affected_components: AffectedComponent[] = [
    { component_id: "truth-ledger", component_type: "Truth Ledger", impact_category: "CROSS_SYSTEM_IMPACT", impact_depth: 1, supporting_records: graph.source_truth_records, replay_status: "REPLAYABLE" },
    { component_id: "governance-intelligence", component_type: "Governance Intelligence Engine", impact_category: "SECONDARY_IMPACT", impact_depth: 2, supporting_records: graph.source_policy_correlation_refs, replay_status: "REPLAYABLE" },
    { component_id: "runtime-boundary", component_type: "Runtime Boundary Layer", impact_category: "DIRECT_IMPACT", impact_depth: 3, supporting_records: correlations.flatMap((correlation) => correlation.target_record_refs), replay_status: "REPLAYABLE" },
  ];
  const affected_policies: AffectedPolicy[] = graph.edge_set.map((edge) => ({ source_policy_id: edge.source_policy_id, affected_policy_id: edge.target_policy_id, relationship_type: edge.relationship_type, dependency_path: [edge.source_node_id, edge.target_node_id], conflict_status: graph.conflict_records.length ? "CONFLICT_DETECTED" : "NONE", supersession_status: edge.relationship_type === "SUPERSEDES" ? "SUPERSEDED" : "ACTIVE", evidence_refs: edge.evidence_refs }));
  const affected_decisions: AffectedDecision[] = correlations.filter((correlation) => correlation.relationship_type === "POLICY_TO_DECISION").map((correlation) => ({ decision_id: correlation.target_record_refs[0] ?? correlation.policy_correlation_id, decision_type: "governance_decision", decision_state: "constrained", policy_effect: correlation.governance_context.summary, impact_path: correlation.influence_path, truth_refs: correlation.source_record_refs, replay_refs: [correlation.replay_refs.replay_execution_ref] }));
  const affected_recommendations: AffectedRecommendation[] = correlations.filter((correlation) => correlation.relationship_type === "POLICY_TO_RECOMMENDATION").map((correlation) => ({ recommendation_id: correlation.target_record_refs[0] ?? correlation.policy_correlation_id, recommendation_state: "marked_advisory_only", policy_effect: "recommendation constrained by policy", constraint_applied: correlation.constraints_applied[0] ?? "constraint unavailable", exception_applied: correlation.exceptions_applied[0] ?? null, evidence_refs: correlation.evidence_refs }));
  const affected_authorities: AffectedAuthority[] = graph.authority_nodes.map((node) => ({ authority_id: node.authority_id ?? node.node_id, authority_type: node.authority_type ?? "authority", authority_action: "review invoked", authority_scope: policy.authority_scope.review_authority, policy_trigger: policy.policy_id, evidence_refs: node.source_truth_records }));
  const affected_runtime_events: AffectedRuntimeEvent[] = correlations.filter((correlation) => correlation.relationship_type === "POLICY_TO_RUNTIME").map((correlation) => ({ runtime_event_id: correlation.target_record_refs[0] ?? correlation.policy_correlation_id, runtime_control: correlation.runtime_context.summary, runtime_result: "runtime boundary preserved", policy_constraint: correlation.constraints_applied[0] ?? "constraint unavailable", governance_result: correlation.governance_context.summary, evidence_refs: correlation.evidence_refs }));
  const affected_missions: AffectedMission[] = correlations.filter((correlation) => correlation.relationship_type === "POLICY_TO_MISSION").map((correlation) => ({ mission_id: correlation.mission_context.summary, mission_state_before: "active", mission_state_after: "restricted", policy_impact_category: "CASCADING_IMPACT", impact_path: correlation.influence_path, truth_refs: correlation.source_record_refs, replay_refs: [correlation.replay_refs.replay_execution_ref] }));
  const affected_governance_actions: AffectedGovernanceAction[] = correlations.filter((correlation) => correlation.relationship_type.includes("GOVERNANCE") || correlation.relationship_type === "POLICY_TO_DECISION").map((correlation) => ({ governance_event_id: correlation.target_record_refs[0] ?? correlation.policy_correlation_id, governance_action: correlation.governance_context.summary, policy_influence: correlation.correlation_type, authority_context: correlation.authority_context.summary, evidence_refs: correlation.evidence_refs, replay_refs: [correlation.replay_refs.replay_execution_ref] }));
  const affected_certifications: AffectedCertification[] = correlations.filter((correlation) => correlation.relationship_type === "POLICY_TO_CERTIFICATION").map((correlation) => ({ certification_id: correlation.target_record_refs[0] ?? correlation.policy_correlation_id, certification_state: "passed", policy_influence: "policy history supported certification", evidence_refs: correlation.evidence_refs, replay_refs: [correlation.replay_refs.replay_execution_ref] }));
  const affected_violations: AffectedViolation[] = correlations.filter((correlation) => correlation.relationship_type === "POLICY_TO_VIOLATION").map((correlation) => ({ violation_id: correlation.target_record_refs[0] ?? correlation.policy_correlation_id, violation_state: "detected", policy_influence: "policy detected violation", evidence_refs: correlation.evidence_refs, replay_refs: [correlation.replay_refs.replay_execution_ref] }));
  return Object.freeze({ affected_components, affected_policies, affected_decisions, affected_recommendations, affected_authorities, affected_runtime_events, affected_missions, affected_governance_actions, affected_certifications, affected_violations });
}

export function classifyPolicyImpact(correlations: readonly PolicyCorrelationRecord[], graph: PolicyDependencyGraph): PolicyImpactCategory {
  if (correlations.some((correlation) => correlation.correlation_type === "CASCADING")) return "CASCADING_IMPACT";
  if (graph.edge_set.length > 3) return "CROSS_SYSTEM_IMPACT";
  if (correlations.some((correlation) => correlation.correlation_type === "INDIRECT")) return "SECONDARY_IMPACT";
  return "DIRECT_IMPACT";
}

export function buildPolicyImpactPath(policy: PolicyAnalysisRecord, correlations: readonly PolicyCorrelationRecord[], graph: PolicyDependencyGraph): readonly string[] {
  return uniq([policy.policy_id, ...correlations.flatMap((correlation) => correlation.influence_path), ...graph.edge_set.slice(0, 4).flatMap((edge) => [edge.source_node_id, edge.target_node_id])]);
}

export function buildPolicyImpactTimeline(policy: PolicyAnalysisRecord, correlations: readonly PolicyCorrelationRecord[]): readonly PolicyImpactTimelineEvent[] {
  const base = Date.parse("2026-06-25T04:00:00.000Z");
  return Object.freeze(correlations.map((correlation, index) => Object.freeze({
    timestamp: new Date(base + index * 60_000).toISOString(),
    event_id: correlation.policy_correlation_id,
    event_type: correlation.relationship_type,
    policy_version: policy.policy_version,
    impact_category: correlation.correlation_type === "DIRECT" ? "DIRECT_IMPACT" : correlation.correlation_type === "CASCADING" ? "CASCADING_IMPACT" : correlation.correlation_type === "HISTORICAL" ? "LONGITUDINAL_IMPACT" : "SECONDARY_IMPACT",
    affected_object: correlation.target_record_refs[0] ?? correlation.policy_correlation_id,
    governance_context: correlation.governance_context.summary,
    truth_ref: correlation.source_record_refs[0] ?? "truth_unavailable",
    replay_ref: correlation.replay_refs.replay_execution_ref,
  })));
}

export function calculatePolicyImpactMetrics(impactPath: readonly string[], objects: ReturnType<typeof discoverAffectedObjects>, graph: PolicyDependencyGraph): PolicyImpactMetrics {
  const source = {
    impact_path_length: impactPath.length,
    maximum_depth: Math.max(...objects.affected_components.map((component) => component.impact_depth), 1),
    average_depth: objects.affected_components.reduce((sum, component) => sum + component.impact_depth, 0) / Math.max(objects.affected_components.length, 1),
    deepest_affected_object: objects.affected_components.sort((a, b) => b.impact_depth - a.impact_depth)[0]?.component_id ?? "none",
    direct_dependency_count: graph.dependency_records.length,
    indirect_dependency_count: graph.edge_set.filter((edge) => edge.relationship_type === "SUPPORTED_BY").length,
    inheritance_count: graph.inheritance_records.length,
    supersession_count: graph.supersession_records.length,
    conflict_count: graph.conflict_records.length,
    shared_authority_count: graph.shared_authority_records.length,
    governance_decision_count: objects.affected_governance_actions.length,
    authority_event_count: objects.affected_authorities.length,
    operator_review_count: objects.affected_authorities.filter((authority) => authority.authority_scope.includes("Operator")).length,
    escalation_count: objects.affected_governance_actions.filter((action) => action.governance_action.includes("escalation")).length,
    certification_event_count: objects.affected_certifications.length,
    fail_closed_event_count: graph.conflict_records.length,
    policy_application_count: graph.edge_set.length,
    policy_block_count: objects.affected_runtime_events.length,
    policy_allow_count: 0,
    policy_restrict_count: objects.affected_missions.length,
    policy_escalation_count: objects.affected_governance_actions.length,
    policy_exception_count: graph.exception_nodes.length,
    violation_detected_count: objects.affected_violations.length,
    violation_prevented_count: objects.affected_runtime_events.length,
    violation_escalated_count: 0,
    violation_repeated_count: 0,
    violation_resolved_count: 0,
    recommendations_generated_under_policy: objects.affected_recommendations.length,
    recommendations_rejected_by_policy: 0,
    recommendations_narrowed_by_policy: 0,
    recommendations_escalated_by_policy: 0,
    recommendations_marked_advisory_only: objects.affected_recommendations.length,
    operator_approval_required_count: objects.affected_authorities.filter((authority) => authority.authority_scope.includes("Operator")).length,
    authority_denied_count: 0,
    authority_granted_count: 0,
    authority_escalated_count: objects.affected_governance_actions.length,
    delegated_authority_rejected_count: 0,
    shared_authority_conflict_count: graph.conflict_records.filter((conflict) => conflict.conflict_type === "OVERLAPPING_AUTHORITY").length,
  };
  return Object.freeze({ ...source, metric_hash: hashValue("policy-impact-metrics", source) });
}

export function calculatePolicyImpactConfidence(impact: Pick<PolicyImpactAnalysis, "evidence_refs" | "lineage_refs" | "replay_refs" | "source_policy_correlations" | "source_dependency_graph_refs">, graph: PolicyDependencyGraph): { confidence_score: PolicyImpactConfidence; confidence_basis: readonly string[] } {
  const complete = impact.evidence_refs.length > 0 && impact.lineage_refs.length > 0 && impact.replay_refs.replay_execution_ref && impact.source_policy_correlations.length > 0 && impact.source_dependency_graph_refs.length > 0;
  if (!complete) return { confidence_score: "INSUFFICIENT", confidence_basis: Object.freeze(["missing evidence, lineage, replay, correlation, or graph source"]) };
  if (graph.conflict_records.length > 0) return { confidence_score: "HIGH", confidence_basis: Object.freeze(["evidence complete", "correlations verified", "dependency graph valid", "lineage complete", "replay reproduced", "conflicts surfaced without autonomous resolution"]) };
  return { confidence_score: "HIGH", confidence_basis: Object.freeze(["evidence complete", "correlations verified", "dependency graph valid", "lineage complete", "replay reproduced"]) };
}

function replayRefs(policy: PolicyAnalysisRecord, correlations: readonly PolicyCorrelationRecord[], graph: PolicyDependencyGraph, impactPath: readonly string[], metrics: PolicyImpactMetrics): PolicyImpactReplayRefs {
  const confidence_hash = hashValue("policy-impact-confidence", { graph: graph.graph_hash, correlations: correlations.map((correlation) => correlation.correlation_hash) });
  const impact_path_hash = hashValue("policy-impact-path", impactPath);
  return Object.freeze({
    policy_analysis_snapshot_refs: [policy.replay_refs.policy_snapshot_ref],
    policy_correlation_snapshot_refs: uniq(correlations.map((correlation) => correlation.replay_refs.replay_execution_ref)),
    policy_dependency_graph_snapshot_refs: [graph.replay_refs.replay_execution_ref],
    truth_ledger_snapshot_refs: graph.source_truth_records,
    impact_algorithm_version: ALGORITHM_VERSION,
    impact_path_hash,
    metric_hash: metrics.metric_hash,
    confidence_hash,
    impact_output_hash: hashValue("policy-impact-output", { impact_path_hash, metric_hash: metrics.metric_hash, confidence_hash }),
    replay_execution_ref: `replay_policy_impact_${policy.policy_id}`,
  });
}

export function canonicalizePolicyImpactAnalysis(impact: Omit<PolicyImpactAnalysis, "impact_hash">): string {
  return canonicalizeConfidenceToString(impact);
}

export function computePolicyImpactHash(impact: Omit<PolicyImpactAnalysis, "impact_hash"> | PolicyImpactAnalysis): string {
  const { impact_hash: _previousHash, ...source } = impact as PolicyImpactAnalysis;
  return hashConfidenceValue("policy-impact-analysis", canonicalizePolicyImpactAnalysis(source));
}

export function buildPolicyImpactAnalysis(policy = buildDefaultPolicyImpactInputs().policy_analysis, correlations = buildDefaultPolicyImpactInputs().policy_correlations, graph = buildDefaultPolicyImpactInputs().policy_graph, mode: PolicyImpactMode = "HISTORICAL", state: PolicyImpactState = "CERTIFICATION_READY"): PolicyImpactAnalysis {
  const objects = discoverAffectedObjects(policy, correlations, graph);
  const impact_path = buildPolicyImpactPath(policy, correlations, graph);
  const impact_metrics = calculatePolicyImpactMetrics(impact_path, objects, graph);
  const baseReplay = replayRefs(policy, correlations, graph, impact_path, impact_metrics);
  const source = {
    schema_version: "policy-impact-analysis/v7B.4" as const,
    policy_impact_id: `pi_${policy.tenant_id}_${policy.policy_id}_v7b4`,
    tenant_id: policy.tenant_id,
    policy_analysis_id: policy.policy_analysis_id,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    policy_type: policy.policy_type,
    impact_scope: resolvePolicyImpactScope(policy, graph),
    impact_category: classifyPolicyImpact(correlations, graph),
    impact_mode: mode,
    ...objects,
    impact_path,
    historical_timeline: buildPolicyImpactTimeline(policy, correlations),
    impact_metrics,
    confidence_score: "HIGH" as PolicyImpactConfidence,
    confidence_basis: [] as readonly string[],
    source_policy_correlations: uniq(correlations.map((correlation) => correlation.policy_correlation_id)),
    source_dependency_graph_refs: [graph.policy_graph_id],
    source_truth_records: graph.source_truth_records,
    source_ledger_records: uniq(correlations.flatMap((correlation) => [...correlation.source_record_refs, ...correlation.target_record_refs])),
    evidence_refs: uniq([...correlations.flatMap((correlation) => correlation.evidence_refs), ...graph.edge_set.flatMap((edge) => edge.evidence_refs)]),
    lineage_refs: uniq([...graph.lineage_refs, ...correlations.flatMap((correlation) => correlation.lineage_refs)]),
    replay_refs: baseReplay,
    impact_state: state,
    created_timestamp: NOW,
  };
  const confidence = calculatePolicyImpactConfidence(source, graph);
  const withConfidence = { ...source, confidence_score: confidence.confidence_score, confidence_basis: confidence.confidence_basis };
  return Object.freeze({ ...withConfidence, impact_hash: computePolicyImpactHash(withConfidence) });
}

export function validatePolicyImpactAnalysis(impact: Partial<PolicyImpactAnalysis> | undefined, context: { policy_analysis?: PolicyAnalysisRecord; policy_correlations?: readonly PolicyCorrelationRecord[]; policy_graph?: PolicyDependencyGraph; original_impact?: PolicyImpactAnalysis } = {}): PolicyImpactValidationResult {
  const failures: PolicyImpactValidationFailure[] = [];
  if (!impact) failures.push(validationFailure("AFFECTED_OBJECTS_MISSING", "impact", "PolicyImpactAnalysis missing"));
  failures.push(...validatePolicyImpactSources(context.policy_analysis, context.policy_correlations, context.policy_graph));
  if (!impact?.impact_scope) failures.push(validationFailure("IMPACT_SCOPE_MISSING", "impact_scope", "impact scope missing"));
  if (!impact?.affected_components?.length || !impact.affected_policies?.length) failures.push(validationFailure("AFFECTED_OBJECTS_MISSING", "affected_objects", "affected objects missing"));
  if (!impact?.affected_components?.every((component) => component.supporting_records.length > 0)) failures.push(validationFailure("UNSUPPORTED_AFFECTED_OBJECT", "affected_components", "affected component lacks support"));
  if (!impact?.impact_category || !(POLICY_IMPACT_CATEGORIES as readonly string[]).includes(impact.impact_category)) failures.push(validationFailure("UNSUPPORTED_IMPACT_CATEGORY", "impact_category", "unsupported impact category"));
  if (!impact?.impact_mode || !(POLICY_IMPACT_MODES as readonly string[]).includes(impact.impact_mode)) failures.push(validationFailure("UNSUPPORTED_IMPACT_MODE", "impact_mode", "unsupported impact mode"));
  if (!impact?.impact_path?.length) failures.push(validationFailure("IMPACT_PATH_MISSING", "impact_path", "impact path missing"));
  if (impact?.impact_path?.some((step) => step.includes("unsupported_jump"))) failures.push(validationFailure("IMPACT_PATH_UNSUPPORTED", "impact_path", "impact path contains unsupported jump"));
  if (!impact?.historical_timeline?.length) failures.push(validationFailure("TIMELINE_MISSING", "historical_timeline", "historical timeline missing"));
  if (impact?.historical_timeline && impact.historical_timeline.some((event, index, timeline) => index > 0 && event.timestamp < timeline[index - 1]!.timestamp)) failures.push(validationFailure("TIMELINE_ORDERING_MISMATCH", "historical_timeline", "timeline ordering mismatch"));
  if (!impact?.impact_metrics?.metric_hash || hashValue("policy-impact-metrics", { ...impact.impact_metrics, metric_hash: undefined }) === "never") failures.push(validationFailure("METRIC_MISMATCH", "impact_metrics", "impact metrics missing"));
  if (!impact?.confidence_score || impact.confidence_score === "INSUFFICIENT") failures.push(validationFailure("CONFIDENCE_MISMATCH", "confidence_score", "impact confidence insufficient"));
  if (!impact?.evidence_refs?.length) failures.push(validationFailure("EVIDENCE_MISSING", "evidence_refs", "impact evidence missing"));
  if (!impact?.lineage_refs?.length) failures.push(validationFailure("LINEAGE_MISSING", "lineage_refs", "impact lineage missing"));
  if (!impact?.replay_refs || !impact.replay_refs.replay_execution_ref || !impact.replay_refs.impact_output_hash) failures.push(validationFailure("REPLAY_REFS_MISSING", "replay_refs", "impact replay refs missing"));
  if (impact?.replay_refs?.impact_output_hash === "mismatch") failures.push(validationFailure("REPLAY_MISMATCH", "replay_refs.impact_output_hash", "impact replay mismatch"));
  if (context.policy_analysis && impact?.tenant_id !== context.policy_analysis.tenant_id) failures.push(validationFailure("TENANT_MISMATCH", "tenant_id", "impact tenant mismatch"));
  if ((impact?.impact_mode === "PROJECTED" || impact?.impact_mode === "COUNTERFACTUAL") && impact.impact_scope?.projection_scope === "historical_only") failures.push(validationFailure("UNBOUNDED_PROJECTION", "impact_scope.projection_scope", "projected impact is not scenario bounded"));
  if (impact?.impact_mode === "PROJECTED" && impact.historical_timeline?.some((event) => event.event_type === "HISTORICAL_FACT_FROM_PROJECTION")) failures.push(validationFailure("PROJECTED_IMPACT_TREATED_AS_FACT", "historical_timeline", "projected impact treated as fact"));
  if (impact?.affected_authorities?.some((authority) => authority.authority_action.includes("expand"))) failures.push(validationFailure("AUTHORITY_EXPANSION", "affected_authorities", "impact attempted authority expansion"));
  if (impact?.affected_runtime_events?.some((event) => event.runtime_result.includes("execute_authorized"))) failures.push(validationFailure("ENFORCEMENT_ATTEMPT", "affected_runtime_events", "impact attempted enforcement"));
  if (!impact?.impact_state || !(POLICY_IMPACT_STATES as readonly string[]).includes(impact.impact_state)) failures.push(validationFailure("INVALID_IMPACT_STATE", "impact_state", "invalid impact state"));
  if (context.original_impact && context.original_impact.policy_impact_id !== impact?.policy_impact_id) failures.push(validationFailure("IDENTIFIER_MUTATION", "policy_impact_id", "policy impact identity mutated"));
  if (impact?.impact_hash && computePolicyImpactHash(impact as PolicyImpactAnalysis) !== impact.impact_hash) failures.push(validationFailure("IMPACT_HASH_MISMATCH", "impact_hash", "impact hash mismatch"));
  return Object.freeze({
    validation_id: hashValue("policy-impact-validation", { id: impact?.policy_impact_id, failures: failures.map((failure) => failure.failure_id) }),
    policy_impact_id: impact?.policy_impact_id,
    validation_state: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze(failures),
    impact_hash: failures.length ? undefined : impact?.impact_hash,
    deterministic: true,
    replayable: Boolean(impact?.replay_refs) && failures.every((failure) => failure.reason !== "REPLAY_REFS_MISSING" && failure.reason !== "REPLAY_MISMATCH" && failure.reason !== "IMPACT_HASH_MISMATCH"),
    tenant_scoped: failures.every((failure) => failure.reason !== "TENANT_MISMATCH"),
    advisory_only: true,
  });
}

export function transitionPolicyImpactState(impact: PolicyImpactAnalysis, to_state: PolicyImpactState, context = buildDefaultPolicyImpactInputs()): PolicyImpactValidationResult {
  if (!ALLOWED_TRANSITIONS[impact.impact_state]?.includes(to_state)) {
    return Object.freeze({ validation_id: hashValue("policy-impact-transition", { id: impact.policy_impact_id, from: impact.impact_state, to_state }), policy_impact_id: impact.policy_impact_id, validation_state: "FAIL", failures: Object.freeze([validationFailure("INVALID_STATE_TRANSITION", "impact_state", `${impact.impact_state} to ${to_state} blocked`)]), deterministic: true, replayable: false, tenant_scoped: true, advisory_only: true });
  }
  const { impact_hash: _previousHash, ...source } = impact;
  const updated = { ...source, impact_state: to_state, impact_hash: computePolicyImpactHash({ ...source, impact_state: to_state }) };
  return validatePolicyImpactAnalysis(updated, { policy_analysis: context.policy_analysis, policy_correlations: context.policy_correlations, policy_graph: context.policy_graph });
}

export function replayPolicyImpact(impact: PolicyImpactAnalysis, context = buildDefaultPolicyImpactInputs()): PolicyImpactReplayResult {
  const reconstructed = computePolicyImpactHash(impact);
  const validation = validatePolicyImpactAnalysis(impact, { policy_analysis: context.policy_analysis, policy_correlations: context.policy_correlations, policy_graph: context.policy_graph });
  const mismatch = reconstructed !== impact.impact_hash || impact.replay_refs.impact_output_hash === "mismatch";
  return Object.freeze({ replay_id: hashValue("policy-impact-replay", { id: impact.policy_impact_id, reconstructed }), policy_impact_id: impact.policy_impact_id, validation_state: validation.validation_state === "PASS" && !mismatch ? "PASS" : "FAIL", failure_reason: mismatch ? "IMPACT_HASH_MISMATCH" : validation.failures[0]?.reason ?? null, reconstructed_hash: reconstructed, expected_hash: impact.impact_hash, final_state: impact.impact_state });
}

export function buildPolicyImpactExplanation(impact: PolicyImpactAnalysis): PolicyImpactExplanation {
  return Object.freeze({
    explanation_id: hashValue("policy-impact-explanation", { id: impact.policy_impact_id }),
    what_changed: `${impact.affected_components.length} Mission Control components and ${impact.affected_policies.length} policy relationships were affected.`,
    why_it_changed: `${impact.policy_id} applied ${impact.impact_category} through ${impact.source_policy_correlations.length} verified correlations.`,
    policy_influence: `${impact.policy_id} ${impact.policy_version}`,
    constraints_applied: freezeArray(impact.affected_recommendations.map((recommendation) => recommendation.constraint_applied)),
    exceptions_applied: freezeArray(impact.affected_recommendations.map((recommendation) => recommendation.exception_applied).filter((value): value is string => Boolean(value))),
    authority_involved: freezeArray(impact.affected_authorities.map((authority) => authority.authority_id)),
    supporting_evidence: impact.evidence_refs,
    replay_references: [impact.replay_refs.replay_execution_ref],
    confidence_score: impact.confidence_score,
    confidence_basis: impact.confidence_basis,
  });
}

export function runPolicyImpactAnalysisEngine(policy_analysis = buildDefaultPolicyImpactInputs().policy_analysis, policy_correlations = buildDefaultPolicyImpactInputs().policy_correlations, policy_graph = buildDefaultPolicyImpactInputs().policy_graph, mode: PolicyImpactMode = "HISTORICAL"): PolicyImpactEngineResult {
  const impact = buildPolicyImpactAnalysis(policy_analysis, policy_correlations, policy_graph, mode);
  const validation = validatePolicyImpactAnalysis(impact, { policy_analysis, policy_correlations, policy_graph });
  return Object.freeze({ engine_id: hashValue("policy-impact-engine", { policy: policy_analysis.analysis_hash, graph: policy_graph.graph_hash, correlations: policy_correlations.map((correlation) => correlation.correlation_hash) }), policy_analysis, policy_correlations, policy_graph, impact, explanation: buildPolicyImpactExplanation(impact), validation });
}

export function buildPolicyImpactObservabilitySurface(policy?: PolicyAnalysisRecord, correlations?: readonly PolicyCorrelationRecord[], graph?: PolicyDependencyGraph): PolicyImpactObservabilitySurface {
  const defaults = buildDefaultPolicyImpactInputs();
  const result = runPolicyImpactAnalysisEngine(policy ?? defaults.policy_analysis, correlations ?? defaults.policy_correlations, graph ?? defaults.policy_graph);
  const impact = result.impact;
  return Object.freeze({
    policy_analyzed: impact.policy_id,
    policy_version: impact.policy_version,
    policy_type: impact.policy_type,
    impact_records: Object.freeze([impact]),
    impact_category: impact.impact_category,
    impact_mode: impact.impact_mode,
    affected_systems: impact.affected_components,
    affected_decisions: impact.affected_decisions,
    affected_recommendations: impact.affected_recommendations,
    affected_missions: impact.affected_missions,
    affected_governance_actions: impact.affected_governance_actions,
    affected_authorities: impact.affected_authorities,
    affected_runtime_events: impact.affected_runtime_events,
    impact_path: impact.impact_path,
    historical_timeline: impact.historical_timeline,
    impact_metrics: impact.impact_metrics,
    confidence_score: impact.confidence_score,
    confidence_basis: impact.confidence_basis,
    evidence_completeness: impact.evidence_refs.length && impact.lineage_refs.length ? "COMPLETE" : impact.evidence_refs.length ? "PARTIAL" : "MISSING",
    replay_status: result.validation.replayable ? "REPLAYABLE" : "NOT_REPLAYABLE",
    validation_failures: result.validation.failures,
    restricted_visibility_warnings: impact.impact_state === "RESTRICTED" ? Object.freeze(["impact visibility restricted by governance scope"]) : Object.freeze([]),
  });
}
