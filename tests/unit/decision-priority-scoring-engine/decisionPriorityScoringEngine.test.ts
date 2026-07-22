import { describe, expect, it } from "vitest";
import {
  buildPriorityScoringObservability,
  createPriorityWeightProfile,
  getPriorityScoringEngine,
  replayPriorityScoring,
  scoreDecisionPriorities,
} from "@/services/decision-priority-scoring-engine";

describe("Mission Control Phase 9.5.7 Priority Scoring Engine", () => {
  it("calculates composite priority deterministically with an approved weight profile", () => {
    const first = scoreDecisionPriorities();
    const second = scoreDecisionPriorities();

    expect(first).toEqual(second);
    expect(first.scoring_status).toBe("PASS");
    expect(first.composite_scores[0]?.overall_priority_score).toBeGreaterThan(0);
    expect(first.composite_scores[0]?.factor_contribution_breakdown.governance_score).toBeGreaterThan(0);
    expect(first.ranking_records[0]?.ranking_order).toBe(1);
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.priority_inputs[0]?.advisory_only).toBe(true);
  });

  it("ranks candidates deterministically using governance-aware tie breaks and candidate ids", () => {
    const result = scoreDecisionPriorities({
      candidates: [
        {
          decision_candidate_id: "dc-b",
          scores: { mission_score: 80, urgency_score: 80, risk_score: 80, confidence_score: 80, governance_score: 70, runtime_score: 80, recovery_score: 80, forecast_score: 80, operator_score: 80, dependency_score: 80 },
        },
        {
          decision_candidate_id: "dc-a",
          scores: { mission_score: 80, urgency_score: 80, risk_score: 80, confidence_score: 80, governance_score: 90, runtime_score: 80, recovery_score: 80, forecast_score: 80, operator_score: 80, dependency_score: 80 },
        },
        {
          decision_candidate_id: "dc-c",
          scores: { mission_score: 80, urgency_score: 80, risk_score: 80, confidence_score: 80, governance_score: 70, runtime_score: 80, recovery_score: 80, forecast_score: 80, operator_score: 80, dependency_score: 80 },
        },
      ],
    });

    expect(result.ledger_record.active_ranking_order).toEqual(["dc-a", "dc-b", "dc-c"]);
    expect(result.ranking_records.find((ranking) => ranking.decision_candidate_id === "dc-a")?.ranking_order).toBe(1);
    expect(result.ranking_records[0]?.tie_break_fields_used).toContain("governance_score");
  });

  it("applies visibility, confidence, blocked, and rejected constraints safely", () => {
    const result = scoreDecisionPriorities({
      candidates: [
        { decision_candidate_id: "critical", governance_conflict: true, scores: { confidence_score: 80 } },
        { decision_candidate_id: "review", low_confidence_review_required: true, scores: { confidence_score: 20, mission_score: 95, urgency_score: 95, risk_score: 95, governance_score: 95, runtime_score: 95, recovery_score: 95, forecast_score: 95, operator_score: 95, dependency_score: 95 } },
        { decision_candidate_id: "blocked", dependency_missing: true },
        { decision_candidate_id: "rejected", schema_or_integrity_invalid: true },
      ],
    });

    expect(result.composite_scores.find((score) => score.decision_candidate_id === "critical")?.priority_state).toBe("CRITICAL");
    expect(result.composite_scores.find((score) => score.decision_candidate_id === "review")?.applied_constraints).toContain("RESTRICT_ELEVATION");
    expect(result.composite_scores.find((score) => score.decision_candidate_id === "blocked")?.priority_state).toBe("BLOCKED");
    expect(result.composite_scores.find((score) => score.decision_candidate_id === "rejected")?.priority_state).toBe("REJECTED");
    expect(result.ledger_record.blocked_candidate_refs).toContain("blocked");
    expect(result.ledger_record.rejected_candidate_refs).toContain("rejected");
  });

  it("fails closed for missing scores, invalid weights, missing governance/replay refs, hidden logic, tenant leaks, tie-break failure, and replay mismatch", () => {
    const missingScore = scoreDecisionPriorities({ candidates: [{ scores: { mission_score: undefined } }] });
    const invalidScore = scoreDecisionPriorities({ candidates: [{ scores: { risk_score: 101 } }] });
    const badProfile = createPriorityWeightProfile({ mission_weight: 0.2 });
    const invalidProfile = scoreDecisionPriorities({ weight_profile: badProfile });
    const noGovernance = scoreDecisionPriorities({ candidates: [{ governance_refs: [] }] });
    const noReplay = scoreDecisionPriorities({ candidates: [{ replay_refs: [] }] });
    const hidden = scoreDecisionPriorities({ hidden_ranking_refs: ["hidden"] });
    const tenantLeak = scoreDecisionPriorities({ candidates: [{ governance_refs: ["governance_tenant_beta_leak"] }] });
    const tieBreak = scoreDecisionPriorities({ tie_break_reproducible: false });
    const base = scoreDecisionPriorities();
    const replayMismatch = scoreDecisionPriorities({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(missingScore.failures).toContain("REQUIRED_FACTOR_SCORE_MISSING");
    expect(invalidScore.failures).toContain("SCORE_OUT_OF_RANGE");
    expect(invalidProfile.failures).toContain("WEIGHTS_NOT_NORMALIZED");
    expect(noGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(hidden.failures).toContain("HIDDEN_RANKING_LOGIC_DETECTED");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_REFERENCE_DETECTED");
    expect(tieBreak.failures).toContain("TIE_BREAK_ORDERING_UNREPRODUCIBLE");
    expect(replayMismatch.failures).toContain("PRIORITY_SCORING_REPLAY_MISMATCH");
  });

  it("replays priority scoring and reports observability", () => {
    const valid = scoreDecisionPriorities();
    const invalid = scoreDecisionPriorities({ weight_profile: createPriorityWeightProfile({ mission_weight: 0.2 }) });
    const replay = replayPriorityScoring(valid);
    const engine = getPriorityScoringEngine();
    const metrics = buildPriorityScoringObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("priority-scoring-engine/v1");
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.weight_profile_failures).toBe(1);
    expect(metrics.average_priority_score).toBeGreaterThan(0);
  });
});
