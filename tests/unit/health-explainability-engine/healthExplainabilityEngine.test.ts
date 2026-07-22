import { describe, expect, it, vi } from "vitest";
import {
  buildHealthExplainabilityObservabilitySurface,
  explainMissionHealth,
  getHealthExplainabilityEngineContract,
  replayHealthExplanation,
  validateHealthExplanation,
} from "@/services/health-explainability-engine";
import type { HealthExplainabilityFailure, HealthExplainabilityScenario } from "@/types/health-explainability-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.6 Health Explainability Engine", () => {
  it("defines the advisory-only explainability doctrine", () => {
    const contract = getHealthExplainabilityEngineContract();

    expect(contract.doctrine.engine_version).toBe("health-explainability-engine/v8ALT.4.6");
    expect(contract.doctrine.principles).toContain("deterministic-score-decomposition");
    expect(contract.doctrine.principles).toContain("causal-chain-replayability");
    expect(contract.doctrine.principles).toContain("advisory-only-behavior");
    expect(contract.validation.valid).toBe(true);
  });

  it("explains the latest timeline health change", () => {
    const explanation = explainMissionHealth();
    const validation = validateHealthExplanation(explanation);

    expect(explanation.processing_state).toBe("PUBLISH_EXPLANATION");
    expect(explanation.prior_health_score_id).toBeTruthy();
    expect(explanation.health_score_id).toBeTruthy();
    expect(explanation.score_delta).toBe(explanation.current_health_score - explanation.previous_health_score);
    expect(validation.valid).toBe(true);
  });

  it("decomposes score movement and metric changes", () => {
    const explanation = explainMissionHealth();

    expect(explanation.score_decomposition.decomposition_hash).toBeTruthy();
    expect(explanation.changed_metrics.length).toBeGreaterThan(8);
    expect(explanation.changed_metrics.every((item) => item.metric_change_hash)).toBe(true);
    expect(explanation.contributing_subsystems.length).toBe(8);
    expect(explanation.contributing_subsystems.every((item) => item.attribution_hash)).toBe(true);
  });

  it("traces evidence, confidence, trends, graph, and causal chain", () => {
    const explanation = explainMissionHealth();

    expect(explanation.evidence_trace.evidence_items.length).toBe(8);
    expect(explanation.evidence_trace.evidence_items.every((item) => item.lineage_reference && item.replay_reference && item.integrity_hash)).toBe(true);
    expect(explanation.confidence_assessment.confidence_hash).toBeTruthy();
    expect(explanation.trend_influence.trend_influence_hash).toBeTruthy();
    expect(explanation.dependency_graph.graph_hash).toBeTruthy();
    expect(explanation.causal_chain.causal_hash).toBeTruthy();
  });

  it("produces an operator-facing audit-ready report", () => {
    const report = explainMissionHealth().operator_summary;

    expect(report.summary).toContain("Mission Health");
    expect(report.primary_reason).toBeTruthy();
    expect(report.evidence_summary).toContain("evidence");
    expect(report.no_autonomous_action_taken).toBe(true);
    expect(report.report_hash).toBeTruthy();
  });

  it("replays explanations deterministically", () => {
    const first = explainMissionHealth();
    const second = explainMissionHealth();
    const replay = replayHealthExplanation(first);

    expect(first.explanation_hash).toBe(second.explanation_hash);
    expect(first.evidence_trace.trace_hash).toBe(second.evidence_trace.trace_hash);
    expect(first.causal_chain.causal_hash).toBe(second.causal_chain.causal_hash);
    expect(replay.deterministic).toBe(true);
  });

  it("enforces advisory-only behavior", () => {
    const explanation = explainMissionHealth();
    const validation = validateHealthExplanation(explanation);

    expect(explanation.advisory_only).toBe(true);
    expect(explanation.intervention_executed).toBe(false);
    expect(explanation.mission_health_modified).toBe(false);
    expect(explanation.evidence_modified).toBe(false);
    expect(explanation.timeline_rewritten).toBe(false);
    expect(explanation.governance_bypassed).toBe(false);
    expect(explanation.recovery_approved).toBe(false);
    expect(explanation.authority_escalated).toBe(false);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["MISSING_PRIOR_STATE", "PRIOR_HEALTH_STATE_MISSING"],
    ["MISSING_CURRENT_STATE", "CURRENT_HEALTH_STATE_MISSING"],
    ["UNREPRODUCIBLE_SCORE_DELTA", "SCORE_DELTA_UNREPRODUCIBLE"],
    ["INCONSISTENT_ATTRIBUTION", "SUBSYSTEM_ATTRIBUTION_INCONSISTENT"],
    ["MISSING_EVIDENCE", "EVIDENCE_TRACE_INCOMPLETE"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["UNSUPPORTED_CAUSAL_CHAIN", "CAUSAL_CHAIN_UNSUPPORTED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_INVALID"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_INVALID"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_INVALID"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [HealthExplainabilityScenario, HealthExplainabilityFailure][])("rejects %s", (scenario, failure) => {
    const explanation = explainMissionHealth({ scenario });
    const validation = validateHealthExplanation(explanation);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(explanation.processing_state).toBe("REJECTED");
  });

  it("exposes operator-visible explainability diagnostics", () => {
    const surface = buildHealthExplainabilityObservabilitySurface(explainMissionHealth());

    expect(surface.explanation_id).toBeTruthy();
    expect(surface.primary_cause).toBeTruthy();
    expect(surface.affected_subsystem_count).toBeGreaterThan(0);
    expect(surface.evidence_item_count).toBe(8);
    expect(surface.advisory_only).toBe(true);
  });
});
