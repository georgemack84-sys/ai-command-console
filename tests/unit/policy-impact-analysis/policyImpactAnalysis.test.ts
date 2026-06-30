import { describe, expect, it } from "vitest";
import { buildPolicyAnalysisRecord } from "@/services/policy-analysis";
import { generatePolicyCorrelations } from "@/services/policy-correlation";
import { buildPolicyDependencyGraph } from "@/services/policy-dependency-graph";
import {
  buildDefaultPolicyImpactInputs,
  buildPolicyImpactAnalysis,
  buildPolicyImpactDoctrine,
  buildPolicyImpactExplanation,
  buildPolicyImpactObservabilitySurface,
  buildPolicyImpactPath,
  buildPolicyImpactTimeline,
  calculatePolicyImpactConfidence,
  calculatePolicyImpactMetrics,
  classifyPolicyImpact,
  computePolicyImpactHash,
  discoverAffectedObjects,
  replayPolicyImpact,
  resolvePolicyImpactScope,
  runPolicyImpactAnalysisEngine,
  transitionPolicyImpactState,
  validatePolicyImpactAnalysis,
  validatePolicyImpactSources,
} from "@/services/policy-impact-analysis";
import type { PolicyImpactAnalysis } from "@/types/policy-impact-analysis";

function defaults() {
  return buildDefaultPolicyImpactInputs();
}

function impact(overrides: Partial<PolicyImpactAnalysis> = {}) {
  const source = defaults();
  return { ...buildPolicyImpactAnalysis(source.policy_analysis, source.policy_correlations, source.policy_graph), ...overrides };
}

describe("Mission Control Phase 7B.4 Policy Impact Analysis", () => {
  it("defines evidence-required impact doctrine", () => {
    const doctrine = buildPolicyImpactDoctrine();
    expect(doctrine.principles).toContain("no-unsupported-causality");
    expect(doctrine.principles).toContain("historical-projected-separated");
    expect(doctrine.prohibited_behaviors).toContain("unbounded projection");
    expect(doctrine.supported_categories).toContain("CASCADING_IMPACT");
  });

  it("accepts valid analysis, correlations, and graph sources", () => {
    const source = defaults();
    expect(validatePolicyImpactSources(source.policy_analysis, source.policy_correlations, source.policy_graph)).toEqual([]);
  });

  it("rejects invalid or missing sources", () => {
    const source = defaults();
    expect(validatePolicyImpactSources(undefined, source.policy_correlations, source.policy_graph).some((failure) => failure.reason === "POLICY_ANALYSIS_MISSING")).toBe(true);
    expect(validatePolicyImpactSources(buildPolicyAnalysisRecord({ analysis_state: "CREATED" }), source.policy_correlations, source.policy_graph).some((failure) => failure.reason === "POLICY_ANALYSIS_INVALID")).toBe(true);
    expect(validatePolicyImpactSources(source.policy_analysis, [], source.policy_graph).some((failure) => failure.reason === "POLICY_CORRELATION_MISSING")).toBe(true);
    expect(validatePolicyImpactSources(source.policy_analysis, source.policy_correlations, undefined).some((failure) => failure.reason === "POLICY_GRAPH_MISSING")).toBe(true);
  });

  it("resolves explicit impact scope", () => {
    const source = defaults();
    const scope = resolvePolicyImpactScope(source.policy_analysis, source.policy_graph);
    expect(scope.tenant_scope).toBe(source.policy_analysis.tenant_id);
    expect(scope.projection_scope).toBe("bounded_scenario_only");
  });

  it("discovers affected systems, policies, decisions, recommendations, missions, authorities, runtime, violations, and certifications", () => {
    const source = defaults();
    const objects = discoverAffectedObjects(source.policy_analysis, source.policy_correlations, source.policy_graph);
    expect(objects.affected_components.length).toBeGreaterThan(0);
    expect(objects.affected_policies.length).toBeGreaterThan(0);
    expect(objects.affected_decisions.length).toBeGreaterThan(0);
    expect(objects.affected_recommendations.length).toBeGreaterThan(0);
    expect(objects.affected_missions.length).toBeGreaterThan(0);
    expect(objects.affected_authorities.length).toBeGreaterThan(0);
    expect(objects.affected_runtime_events.length).toBeGreaterThan(0);
    expect(objects.affected_violations.length).toBeGreaterThan(0);
    expect(objects.affected_certifications.length).toBeGreaterThan(0);
  });

  it("classifies impact and builds deterministic paths", () => {
    const source = defaults();
    expect(classifyPolicyImpact(source.policy_correlations, source.policy_graph)).toBe("CASCADING_IMPACT");
    expect(buildPolicyImpactPath(source.policy_analysis, source.policy_correlations, source.policy_graph)).toEqual(buildPolicyImpactPath(source.policy_analysis, source.policy_correlations, source.policy_graph));
  });

  it("builds ordered historical timelines", () => {
    const source = defaults();
    const timeline = buildPolicyImpactTimeline(source.policy_analysis, source.policy_correlations);
    expect(timeline.length).toBe(source.policy_correlations.length);
    expect(timeline.every((event, index) => index === 0 || event.timestamp >= timeline[index - 1]!.timestamp)).toBe(true);
  });

  it("calculates deterministic metrics and confidence", () => {
    const source = defaults();
    const objects = discoverAffectedObjects(source.policy_analysis, source.policy_correlations, source.policy_graph);
    const path = buildPolicyImpactPath(source.policy_analysis, source.policy_correlations, source.policy_graph);
    const metrics = calculatePolicyImpactMetrics(path, objects, source.policy_graph);
    const record = impact();
    const confidence = calculatePolicyImpactConfidence(record, source.policy_graph);
    expect(metrics.metric_hash).toBe(calculatePolicyImpactMetrics(path, objects, source.policy_graph).metric_hash);
    expect(confidence.confidence_score).toBe("HIGH");
  });

  it("builds and validates a complete impact analysis", () => {
    const source = defaults();
    const record = impact();
    const result = validatePolicyImpactAnalysis(record, { policy_analysis: source.policy_analysis, policy_correlations: source.policy_correlations, policy_graph: source.policy_graph });
    expect(record.schema_version).toBe("policy-impact-analysis/v7B.4");
    expect(result.validation_state).toBe("PASS");
    expect(result.replayable).toBe(true);
  });

  it("fails closed for missing scope, affected objects, path, timeline, evidence, lineage, replay, and invalid state", () => {
    const source = defaults();
    const record = impact();
    const context = { policy_analysis: source.policy_analysis, policy_correlations: source.policy_correlations, policy_graph: source.policy_graph };
    expect(validatePolicyImpactAnalysis({ ...record, impact_scope: undefined }, context).failures.some((failure) => failure.reason === "IMPACT_SCOPE_MISSING")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, affected_components: [] }, context).failures.some((failure) => failure.reason === "AFFECTED_OBJECTS_MISSING")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, impact_path: [] }, context).failures.some((failure) => failure.reason === "IMPACT_PATH_MISSING")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, historical_timeline: [] }, context).failures.some((failure) => failure.reason === "TIMELINE_MISSING")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, evidence_refs: [] }, context).failures.some((failure) => failure.reason === "EVIDENCE_MISSING")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, lineage_refs: [] }, context).failures.some((failure) => failure.reason === "LINEAGE_MISSING")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, replay_refs: { ...record.replay_refs, impact_output_hash: "" } }, context).failures.some((failure) => failure.reason === "REPLAY_REFS_MISSING")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, impact_state: "UNKNOWN" as never }, context).failures.some((failure) => failure.reason === "INVALID_IMPACT_STATE")).toBe(true);
  }, 20000);

  it("rejects unsupported categories, modes, paths, timeline order, low confidence, and unsupported affected objects", () => {
    const source = defaults();
    const record = impact();
    const context = { policy_analysis: source.policy_analysis, policy_correlations: source.policy_correlations, policy_graph: source.policy_graph };
    expect(validatePolicyImpactAnalysis({ ...record, impact_category: "UNKNOWN" as never }, context).failures.some((failure) => failure.reason === "UNSUPPORTED_IMPACT_CATEGORY")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, impact_mode: "UNKNOWN" as never }, context).failures.some((failure) => failure.reason === "UNSUPPORTED_IMPACT_MODE")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, impact_path: ["policy", "unsupported_jump_1"] }, context).failures.some((failure) => failure.reason === "IMPACT_PATH_UNSUPPORTED")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, historical_timeline: [...record.historical_timeline].reverse() }, context).failures.some((failure) => failure.reason === "TIMELINE_ORDERING_MISMATCH")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, confidence_score: "INSUFFICIENT" }, context).failures.some((failure) => failure.reason === "CONFIDENCE_MISMATCH")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, affected_components: [{ ...record.affected_components[0]!, supporting_records: [] }] }, context).failures.some((failure) => failure.reason === "UNSUPPORTED_AFFECTED_OBJECT")).toBe(true);
  }, 20000);

  it("enforces tenant isolation, projection labels, authority boundaries, and advisory-only behavior", () => {
    const source = defaults();
    const record = impact();
    const context = { policy_analysis: source.policy_analysis, policy_correlations: source.policy_correlations, policy_graph: source.policy_graph };
    expect(validatePolicyImpactAnalysis({ ...record, tenant_id: "tenant_beta" }, context).failures.some((failure) => failure.reason === "TENANT_MISMATCH")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, impact_mode: "PROJECTED", impact_scope: { ...record.impact_scope, projection_scope: "historical_only" } }, context).failures.some((failure) => failure.reason === "UNBOUNDED_PROJECTION")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, impact_mode: "PROJECTED", historical_timeline: [{ ...record.historical_timeline[0]!, event_type: "HISTORICAL_FACT_FROM_PROJECTION" }] }, context).failures.some((failure) => failure.reason === "PROJECTED_IMPACT_TREATED_AS_FACT")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, affected_authorities: [{ ...record.affected_authorities[0]!, authority_action: "expand authority" }] }, context).failures.some((failure) => failure.reason === "AUTHORITY_EXPANSION")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, affected_runtime_events: [{ ...record.affected_runtime_events[0]!, runtime_result: "execute_authorized" }] }, context).failures.some((failure) => failure.reason === "ENFORCEMENT_ATTEMPT")).toBe(true);
  }, 20000);

  it("detects replay mismatch, impact hash tampering, and identifier mutation", () => {
    const source = defaults();
    const record = impact();
    const context = { policy_analysis: source.policy_analysis, policy_correlations: source.policy_correlations, policy_graph: source.policy_graph };
    expect(computePolicyImpactHash(record)).toBe(record.impact_hash);
    expect(validatePolicyImpactAnalysis({ ...record, replay_refs: { ...record.replay_refs, impact_output_hash: "mismatch" } }, context).failures.some((failure) => failure.reason === "REPLAY_MISMATCH")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, impact_hash: "tampered" }, context).failures.some((failure) => failure.reason === "IMPACT_HASH_MISMATCH")).toBe(true);
    expect(validatePolicyImpactAnalysis({ ...record, policy_impact_id: "pi_mutated" }, { ...context, original_impact: record }).failures.some((failure) => failure.reason === "IDENTIFIER_MUTATION")).toBe(true);
  });

  it("replays impact deterministically", () => {
    const source = defaults();
    const record = impact();
    const replay = replayPolicyImpact(record, source);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_hash).toBe(record.impact_hash);
  });

  it("validates state transitions and blocks invalid transitions", () => {
    const source = defaults();
    const record = impact();
    expect(transitionPolicyImpactState(record, "ARCHIVED", source).validation_state).toBe("PASS");
    expect(transitionPolicyImpactState(record, "SOURCE_VALIDATED", source).failures.some((failure) => failure.reason === "INVALID_STATE_TRANSITION")).toBe(true);
  });

  it("builds deterministic governance explanations", () => {
    const explanation = buildPolicyImpactExplanation(impact());
    expect(explanation.what_changed).toContain("Mission Control components");
    expect(explanation.confidence_score).toBe("HIGH");
    expect(explanation.supporting_evidence.length).toBeGreaterThan(0);
  });

  it("runs the impact engine and observability surface", () => {
    const result = runPolicyImpactAnalysisEngine();
    const surface = buildPolicyImpactObservabilitySurface();
    expect(result.validation.validation_state).toBe("PASS");
    expect(surface.evidence_completeness).toBe("COMPLETE");
    expect(surface.replay_status).toBe("REPLAYABLE");
  }, 20000);

  it("supports bounded projected and counterfactual impact as advisory analysis", () => {
    const source = defaults();
    expect(runPolicyImpactAnalysisEngine(source.policy_analysis, source.policy_correlations, source.policy_graph, "PROJECTED").impact.impact_mode).toBe("PROJECTED");
    expect(runPolicyImpactAnalysisEngine(source.policy_analysis, source.policy_correlations, source.policy_graph, "COUNTERFACTUAL").impact.impact_scope.projection_scope).toBe("bounded_scenario_only");
  });

  it("accepts fresh upstream 7B inputs", () => {
    const analysis = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" });
    const correlations = generatePolicyCorrelations(analysis);
    const graph = buildPolicyDependencyGraph([analysis], correlations);
    const result = runPolicyImpactAnalysisEngine(analysis, correlations, graph);
    expect(result.validation.validation_state).toBe("PASS");
    expect(result.impact.policy_analysis_id).toBe(analysis.policy_analysis_id);
  });
});
