import { describe, expect, it } from "vitest";
import {
  assessOperationalImpact,
  buildOperationalImpactObservability,
  getOperationalImpactAssessmentEngine,
  replayOperationalImpactAssessment,
} from "@/services/decision-operational-impact-assessment";

describe("Mission Control Phase 9.5.5 Operational Impact Assessment", () => {
  it("assesses operational impact deterministically with replayable evidence", () => {
    const first = assessOperationalImpact();
    const second = assessOperationalImpact();

    expect(first).toEqual(second);
    expect(first.assessment_status).toBe("PASS");
    expect(first.operational_assessment.composite_operational_score).toBeGreaterThan(0);
    expect(first.runtime_assessment.runtime_impact_score).toBeGreaterThan(0);
    expect(first.explanation.runtime_rationale).toContain(first.runtime_assessment.runtime_classification);
    expect(first.ledger_record.operational_assessment_ref).toBe(first.operational_assessment.assessment_id);
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.priority_input.runtime_score).toBe(first.operational_assessment.runtime_score);
    expect(first.priority_input.recovery_score).toBe(first.operational_assessment.recovery_score);
    expect(first.priority_input.forecast_score).toBe(first.operational_assessment.forecast_score);
  });

  it("elevates strong operational benefit and tracks affected downstream components", () => {
    const result = assessOperationalImpact({
      runtime_health_score: 95,
      execution_latency_score: 92,
      runtime_degradation_score: 5,
      recovery_readiness_score: 94,
      rollback_availability_score: 96,
      recovery_complexity_score: 10,
      forecast_success_score: 96,
      future_risk_score: 10,
      future_confidence_score: 95,
      execution_stability_score: 93,
      continuity_score: 94,
      resilience_score: 95,
      affected_components: ["workflow-a", "workflow-b", "workflow-c", "workflow-d", "workflow-e"],
    });

    expect(result.operational_assessment.operational_classification).toBe("CRITICAL");
    expect(result.operational_assessment.forecast_category).toBe("VERY_POSITIVE");
    expect(result.operational_assessment.resilience_level).toBe("VERY_HIGH");
    expect(result.ledger_record.priority_adjustment).toBe(20);
    expect(result.ledger_record.affected_components).toHaveLength(5);
  });

  it("classifies critical negative forecasts while remaining advisory-only", () => {
    const result = assessOperationalImpact({
      runtime_health_score: 25,
      execution_latency_score: 20,
      runtime_degradation_score: 90,
      recovery_readiness_score: 20,
      rollback_availability_score: 15,
      recovery_complexity_score: 95,
      forecast_success_score: 10,
      future_risk_score: 95,
      future_confidence_score: 10,
      execution_stability_score: 20,
      continuity_score: 15,
      resilience_score: 10,
      downstream_consequence_score: 90,
    });

    expect(result.operational_assessment.forecast_category).toBe("CRITICAL_NEGATIVE");
    expect(result.operational_assessment.resilience_level).toBe("CRITICAL");
    expect(result.ledger_record.priority_adjustment).toBe(20);
    expect(result.priority_input.advisory_only).toBe(true);
  });

  it("fails closed for missing contexts, tenant leakage, hidden weighting, nondeterminism, invalid inputs, and replay mismatch", () => {
    const noRuntime = assessOperationalImpact({ runtime_refs: [] });
    const noRecovery = assessOperationalImpact({ recovery_refs: [] });
    const noForecast = assessOperationalImpact({ forecast_refs: [] });
    const noContinuity = assessOperationalImpact({ continuity_refs: [] });
    const noGovernance = assessOperationalImpact({ governance_refs: [] });
    const noReplay = assessOperationalImpact({ replay_refs: [] });
    const invalidInput = assessOperationalImpact({ runtime_health_score: 101 });
    const tenantLeak = assessOperationalImpact({ runtime_refs: ["runtime_tenant_beta_leak"] });
    const hidden = assessOperationalImpact({ hidden_weighting_refs: ["hidden"] });
    const nondeterministic = assessOperationalImpact({ nondeterministic_forecast_refs: ["randomized_forecast"] });
    const base = assessOperationalImpact();
    const replayMismatch = assessOperationalImpact({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(noRuntime.failures).toContain("RUNTIME_CONTEXT_INCOMPLETE");
    expect(noRecovery.failures).toContain("RECOVERY_INFORMATION_UNAVAILABLE");
    expect(noForecast.failures).toContain("FORECAST_REFERENCES_MISSING");
    expect(noContinuity.failures).toContain("CONTINUITY_ANALYSIS_INCOMPLETE");
    expect(noGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(invalidInput.failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_OPERATIONAL_DATA_DETECTED");
    expect(hidden.failures).toContain("HIDDEN_OPERATIONAL_WEIGHTING_DETECTED");
    expect(nondeterministic.failures).toContain("FORECAST_NONDETERMINISM_DETECTED");
    expect(replayMismatch.failures).toContain("OPERATIONAL_REPLAY_MISMATCH");
  });

  it("replays operational artifacts and reports observability", () => {
    const valid = assessOperationalImpact();
    const invalid = assessOperationalImpact({ runtime_refs: [], forecast_refs: [] });
    const replay = replayOperationalImpactAssessment(valid);
    const engine = getOperationalImpactAssessmentEngine();
    const metrics = buildOperationalImpactObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("operational-impact-assessment-engine/v1");
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.runtime_failures).toBe(1);
    expect(metrics.forecast_failures).toBe(1);
    expect(metrics.average_operational_score).toBeGreaterThan(0);
  });
});
