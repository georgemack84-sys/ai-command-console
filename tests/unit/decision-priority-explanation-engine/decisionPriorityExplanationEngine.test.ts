import { describe, expect, it } from "vitest";
import {
  buildPriorityExplanationObservability,
  explainPriorities,
  getPriorityExplanationEngine,
  replayPriorityExplanations,
} from "@/services/decision-priority-explanation-engine";
import { scoreDecisionPriorities } from "@/services/decision-priority-scoring-engine";

describe("Mission Control Phase 9.5.8 Priority Explanation Engine", () => {
  it("generates deterministic priority explanations with reports and operator summaries", () => {
    const first = explainPriorities();
    const second = explainPriorities();

    expect(first).toEqual(second);
    expect(first.explanation_status).toBe("PASS");
    expect(first.explanation_records[0]?.ranking_rationale).toContain("Rank 1");
    expect(first.reports[0]?.scoring_breakdown).toHaveLength(10);
    expect(first.reports[0]?.governance_narrative).toContain("Governance score");
    expect(first.operator_summaries[0]?.operator_actions).toContain("Review priority rationale before acting");
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.advisoryOnly).toBe(true);
  });

  it("explains governance, confidence, dependency, operational, and blocked/rejected outcomes", () => {
    const scoring = scoreDecisionPriorities({
      candidates: [
        { decision_candidate_id: "critical", governance_conflict: true, scores: { governance_score: 95, confidence_score: 90, risk_score: 85, dependency_score: 80, runtime_score: 75 } },
        { decision_candidate_id: "review", low_confidence_review_required: true, scores: { confidence_score: 20 } },
        { decision_candidate_id: "blocked", dependency_missing: true },
        { decision_candidate_id: "rejected", schema_or_integrity_invalid: true },
      ],
    });
    const result = explainPriorities({ scoring_result: scoring });

    expect(result.explanation_records.find((record) => record.decision_candidate_id === "critical")?.priority_state).toBe("CRITICAL");
    expect(result.reports.find((report) => report.decision_candidate_id === "review")?.confidence_narrative).toContain("Low confidence");
    expect(result.operator_summaries.find((summary) => summary.decision_candidate_id === "blocked")?.blocked_conditions).not.toHaveLength(0);
    expect(result.explanation_records.find((record) => record.decision_candidate_id === "rejected")?.ranking_position).toBeNull();
  });

  it("fails closed for incomplete narratives, missing traces, hidden logic, tenant leakage, and replay mismatch", () => {
    const noEvidence = explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ evidence_refs: [] }] }) });
    const noGovernance = explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ governance_refs: [] }] }) });
    const noReplay = explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ replay_refs: [] }] }) });
    const incompleteRanking = explainPriorities({ ranking_rationale_complete: false });
    const missingBreakdown = explainPriorities({ scoring_breakdown_complete: false });
    const nondeterministic = explainPriorities({ explanation_ordering_deterministic: false });
    const unexplainedGovernance = explainPriorities({ governance_adjustment_explained: false });
    const hidden = explainPriorities({ hidden_scoring_refs: ["hidden"] });
    const tenantLeak = explainPriorities({ scoring_result: scoreDecisionPriorities({ candidates: [{ governance_refs: ["governance_tenant_beta_leak"] }] }) });
    const base = explainPriorities();
    const replayMismatch = explainPriorities({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(noEvidence.failures).toContain("SUPPORTING_EVIDENCE_UNTRACEABLE");
    expect(noGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(noReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(incompleteRanking.failures).toContain("RANKING_RATIONALE_INCOMPLETE");
    expect(missingBreakdown.failures).toContain("SCORING_BREAKDOWN_MISSING");
    expect(nondeterministic.failures).toContain("EXPLANATION_ORDERING_NONDETERMINISTIC");
    expect(unexplainedGovernance.failures).toContain("GOVERNANCE_ADJUSTMENT_UNEXPLAINED");
    expect(hidden.failures).toContain("HIDDEN_SCORING_LOGIC_DETECTED");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_REFERENCE_DETECTED");
    expect(replayMismatch.failures).toContain("EXPLANATION_REPLAY_MISMATCH");
  });

  it("replays explanations and reports observability", () => {
    const valid = explainPriorities();
    const invalid = explainPriorities({ scoring_breakdown_complete: false });
    const replay = replayPriorityExplanations(valid);
    const engine = getPriorityExplanationEngine();
    const metrics = buildPriorityExplanationObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("priority-explanation-engine/v1");
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.explanations_generated).toBeGreaterThan(0);
  });
});
