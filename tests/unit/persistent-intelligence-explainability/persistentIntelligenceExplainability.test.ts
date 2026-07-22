import { describe, expect, it } from "vitest";

import {
  getPersistentIntelligenceExplainabilityContract,
  replayPersistentIntelligenceExplainability,
  runPersistentIntelligenceExplainability,
  validatePersistentIntelligenceExplainability,
} from "../../../services/persistent-intelligence-explainability";

describe("persistent intelligence explainability", () => {
  it("runs deterministic certified explainability", () => {
    const first = runPersistentIntelligenceExplainability();
    const second = runPersistentIntelligenceExplainability();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validatePersistentIntelligenceExplainability(first).valid).toBe(true);
    expect(replayPersistentIntelligenceExplainability(first)).toBe(true);
  });

  it("preserves explainability doctrine", () => {
    const bundle = getPersistentIntelligenceExplainabilityContract();

    expect(bundle.doctrine.black_box_intelligence_supported).toBe(false);
    expect(bundle.doctrine.every_artifact_explained).toBe(true);
    expect(bundle.doctrine.evidence_required).toBe(true);
    expect(bundle.doctrine.governance_history_required).toBe(true);
    expect(bundle.doctrine.replay_required).toBe(true);
    expect(bundle.doctrine.usage_attribution_required).toBe(true);
  });

  it("explains artifact rationale, graph, evidence, and qualification", () => {
    const result = runPersistentIntelligenceExplainability();

    expect(result.explanation.human_readable).toContain("exists");
    expect(result.explanation.persistence_rationale.length).toBeGreaterThan(0);
    expect(result.graph.complete).toBe(true);
    expect(result.graph.navigable_forward).toBe(true);
    expect(result.evidence_trace.complete).toBe(true);
    expect(result.qualification_history.certification_status).toBe("CERTIFIED");
  });

  it("explains confidence, governance, replay lineage, and usage", () => {
    const result = runPersistentIntelligenceExplainability();

    expect(result.confidence_evolution.evidence_backed_changes).toBe(true);
    expect(result.governance_history.constitutional_validations).toHaveLength(1);
    expect(result.replay_lineage.deterministic).toBe(true);
    expect(result.replay_lineage.version_tree).toEqual(["1.0", "1.1"]);
    expect(result.usage.attributable).toBe(true);
    expect(result.usage.organizational_impact_score).toBeGreaterThan(0);
  });

  it("maintains append-only ledger and observability", () => {
    const result = runPersistentIntelligenceExplainability();

    expect(result.ledger).toHaveLength(9);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.tenant_isolated && entry.sequence === index + 1)).toBe(true);
    expect(result.observability.explainability_coverage).toBe(1);
    expect(result.observability.dashboard_available).toBe(true);
  });

  it("runs the explainability certification suite", () => {
    const result = runPersistentIntelligenceExplainability();

    expect(result.certification.tests).toHaveLength(36);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for missing explanation, evidence, governance, replay, lineage, usage, and ledger integrity", () => {
    for (const scenario of ["ARTIFACT_UNEXPLAINED", "EVIDENCE_CHAIN_INCOMPLETE", "GOVERNANCE_HISTORY_MISSING", "REPLAY_HISTORY_NONDETERMINISTIC", "LINEAGE_GRAPH_BROKEN", "USAGE_ATTRIBUTION_MISSING", "LEDGER_MUTATION"] as const) {
      const result = runPersistentIntelligenceExplainability({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.production_ready).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validatePersistentIntelligenceExplainability(result).valid).toBe(false);
    }
  });
});
