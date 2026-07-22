import { describe, expect, it } from "vitest";
import {
  buildRiskConfidenceObservability,
  getRiskConfidencePrioritizationEngine,
  prioritizeRiskAndConfidence,
  replayRiskConfidencePrioritization,
} from "@/services/decision-risk-confidence-prioritization";

describe("Mission Control Phase 9.5.3 Risk & Confidence Prioritization", () => {
  it("prioritizes risk and confidence deterministically with replayable evidence", () => {
    const first = prioritizeRiskAndConfidence();
    const second = prioritizeRiskAndConfidence();

    expect(first).toEqual(second);
    expect(first.prioritization_status).toBe("PASS");
    expect(first.risk_assessment.composite_risk_score).toBeGreaterThan(0);
    expect(first.confidence_assessment.confidence_score).toBeGreaterThan(0);
    expect(first.explanation.risk_rationale).toContain(first.risk_assessment.risk_level);
    expect(first.ledger_record.risk_assessment_ref).toBe(first.risk_assessment.assessment_id);
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.priority_input.risk_score).toBe(first.risk_assessment.composite_risk_score);
    expect(first.priority_input.confidence_score).toBe(first.confidence_assessment.confidence_score);
  });

  it("elevates high-risk high-confidence decisions and escalates high-risk low-confidence decisions", () => {
    const highConfidence = prioritizeRiskAndConfidence({
      operational_risk: 95,
      mission_risk: 92,
      governance_risk: 80,
      constitutional_risk: 95,
      execution_risk: 90,
      recovery_risk: 85,
      dependency_risk: 90,
      cascading_failure_potential: 95,
      probability_inputs: [90, 92],
      impact_inputs: [95, 90],
      confidence_inputs: [95, 94],
      reliability_inputs: [96, 94],
      uncertainty_inputs: [5],
      degradation_inputs: [5],
      evidence_refs: ["evidence-a", "evidence-b", "evidence-c"],
    });
    const lowConfidence = prioritizeRiskAndConfidence({
      operational_risk: 95,
      mission_risk: 92,
      execution_risk: 90,
      probability_inputs: [90],
      impact_inputs: [95],
      confidence_inputs: [35],
      reliability_inputs: [30],
      uncertainty_inputs: [80],
      degradation_inputs: [80],
    });

    expect(highConfidence.risk_assessment.risk_level).toBe("CRITICAL");
    expect(highConfidence.confidence_assessment.confidence_level).toBe("HIGH");
    expect(highConfidence.ledger_record.priority_adjustment).toBe(15);
    expect(lowConfidence.risk_assessment.escalation_status).toBe("OPERATOR_REVIEW");
    expect(lowConfidence.confidence_assessment.restriction_status).toBe("BLOCKED");
  });

  it("requires immediate governance review for constitutional risk", () => {
    const result = prioritizeRiskAndConfidence({
      constitutional_risk: 95,
      governance_risk: 90,
      operational_risk: 90,
      mission_risk: 90,
      probability_inputs: [90],
      impact_inputs: [95],
    });

    expect(result.risk_assessment.escalation_required).toBe(true);
    expect(result.risk_assessment.escalation_status).toBe("IMMEDIATE_GOVERNANCE_REVIEW");
  });

  it("fails closed for incomplete risk data, missing evidence/governance/replay, invalid confidence inputs, tenant leakage, hidden logic, and replay mismatch", () => {
    const noRisk = prioritizeRiskAndConfidence({ risk_refs: [], operational_risk: undefined, mission_risk: undefined });
    const noEvidence = prioritizeRiskAndConfidence({ evidence_refs: [] });
    const noGovernance = prioritizeRiskAndConfidence({ governance_refs: [] });
    const noReplay = prioritizeRiskAndConfidence({ replay_refs: [] });
    const invalidConfidence = prioritizeRiskAndConfidence({ confidence_inputs: [101] });
    const tenantLeak = prioritizeRiskAndConfidence({ evidence_refs: ["evidence_tenant_beta_leak"] });
    const hidden = prioritizeRiskAndConfidence({ hidden_prioritization_refs: ["hidden"] });
    const base = prioritizeRiskAndConfidence();
    const replayMismatch = prioritizeRiskAndConfidence({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(noRisk.failures).toContain("RISK_DATA_INCOMPLETE");
    expect(noEvidence.failures).toContain("EVIDENCE_REFERENCES_MISSING");
    expect(noGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(invalidConfidence.failures).toContain("CONFIDENCE_INPUTS_INVALID");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_REFERENCE_DETECTED");
    expect(hidden.failures).toContain("HIDDEN_PRIORITIZATION_DETECTED");
    expect(replayMismatch.failures).toContain("ASSESSMENT_REPLAY_MISMATCH");
  });

  it("replays prioritization artifacts and reports observability", () => {
    const valid = prioritizeRiskAndConfidence();
    const invalid = prioritizeRiskAndConfidence({ governance_refs: [] });
    const replay = replayRiskConfidencePrioritization(valid);
    const engine = getRiskConfidencePrioritizationEngine();
    const metrics = buildRiskConfidenceObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("risk-confidence-prioritization-engine/v1");
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.governance_failures).toBe(1);
    expect(metrics.average_risk_score).toBeGreaterThan(0);
    expect(metrics.average_confidence_score).toBeGreaterThan(0);
  });
});
