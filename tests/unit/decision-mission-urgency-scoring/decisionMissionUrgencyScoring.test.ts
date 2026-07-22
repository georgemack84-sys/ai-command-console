import { describe, expect, it } from "vitest";
import {
  buildMissionUrgencyObservability,
  getMissionUrgencyScoringEngine,
  replayMissionUrgencyScoring,
  scoreMissionAndUrgency,
} from "@/services/decision-mission-urgency-scoring";

describe("Mission Control Phase 9.5.2 Mission & Urgency Scoring Engine", () => {
  it("scores mission criticality and urgency deterministically with replayable evidence", () => {
    const first = scoreMissionAndUrgency();
    const second = scoreMissionAndUrgency();

    expect(first).toEqual(second);
    expect(first.scoring_status).toBe("PASS");
    expect(first.mission_assessment.mission_score).toBeGreaterThan(0);
    expect(first.urgency_assessment.urgency_score).toBeGreaterThan(0);
    expect(first.explanation.mission_rationale).toContain(first.mission_assessment.criticality_level);
    expect(first.ledger_record.mission_assessment_ref).toBe(first.mission_assessment.assessment_id);
    expect(first.replay_record.replay_valid).toBe(true);
    expect(first.priority_input.mission_score).toBe(first.mission_assessment.mission_score);
    expect(first.priority_input.urgency_score).toBe(first.urgency_assessment.urgency_score);
  });

  it("elevates mission and urgency for critical path, emergency events, closing windows, and deadline pressure", () => {
    const routine = scoreMissionAndUrgency({
      strategic_priority: 35,
      business_impact: 30,
      safety_impact: 25,
      continuity_impact: 30,
      mission_objective_refs: ["objective-routine"],
      critical_path_refs: [],
      downstream_blocking_count: 0,
      minutes_until_deadline: 1440,
      delay_tolerance_minutes: 1440,
      execution_window_state: "OPEN",
    });
    const elevated = scoreMissionAndUrgency({
      strategic_priority: 95,
      business_impact: 90,
      safety_impact: 90,
      continuity_impact: 90,
      mission_objective_refs: ["objective-alpha", "objective-beta", "objective-gamma"],
      critical_path_refs: ["critical-path-alpha", "critical-path-beta"],
      downstream_blocking_count: 5,
      minutes_until_deadline: 20,
      delay_tolerance_minutes: 120,
      execution_window_state: "CLOSING",
      event_refs: ["sla-deadline"],
      emergency_event_detected: true,
    });

    expect(elevated.mission_assessment.mission_score).toBeGreaterThan(routine.mission_assessment.mission_score);
    expect(elevated.urgency_assessment.urgency_score).toBeGreaterThan(routine.urgency_assessment.urgency_score);
    expect(elevated.mission_assessment.criticality_level).toBe("CRITICAL");
    expect(elevated.urgency_assessment.urgency_classification).toBe("IMMEDIATE");
  });

  it("fails closed for missing objectives, invalid deadlines, incomplete critical paths, missing governance/replay, tenant leakage, hidden scoring, and replay mismatch", () => {
    const missingObjectives = scoreMissionAndUrgency({ mission_objective_refs: [] });
    const invalidDeadline = scoreMissionAndUrgency({ minutes_until_deadline: Number.NaN });
    const badCriticalPath = scoreMissionAndUrgency({ critical_path_refs: [], downstream_blocking_count: 3 });
    const missingGovernance = scoreMissionAndUrgency({ governance_refs: [] });
    const missingReplay = scoreMissionAndUrgency({ replay_refs: [] });
    const tenantLeak = scoreMissionAndUrgency({ evidence_refs: ["evidence_tenant_beta_leak"] });
    const hidden = scoreMissionAndUrgency({ hidden_scoring_refs: ["hidden"] });
    const base = scoreMissionAndUrgency();
    const replayMismatch = scoreMissionAndUrgency({ expected_replay_hash: `${base.replay_hash}-wrong` });

    expect(missingObjectives.failures).toContain("MISSION_OBJECTIVES_MISSING");
    expect(invalidDeadline.failures).toContain("INVALID_DEADLINE");
    expect(badCriticalPath.failures).toContain("CRITICAL_PATH_REFERENCES_INCOMPLETE");
    expect(missingGovernance.failures).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(missingReplay.failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(tenantLeak.failures).toContain("CROSS_TENANT_REFERENCE_DETECTED");
    expect(hidden.failures).toContain("HIDDEN_SCORING_DETECTED");
    expect(replayMismatch.failures).toContain("INTEGRITY_VERIFICATION_FAILED");
  });

  it("replays scoring artifacts and reports observability", () => {
    const valid = scoreMissionAndUrgency();
    const invalid = scoreMissionAndUrgency({ governance_refs: [] });
    const replay = replayMissionUrgencyScoring(valid);
    const engine = getMissionUrgencyScoringEngine();
    const metrics = buildMissionUrgencyObservability([valid, invalid]);

    expect(replay.replay_valid).toBe(true);
    expect(replay.expected_hash).toBe(valid.replay_hash);
    expect(engine.engine_version).toBe("mission-urgency-scoring-engine/v1");
    expect(metrics.evaluations).toBe(2);
    expect(metrics.pass_count).toBe(1);
    expect(metrics.fail_count).toBe(1);
    expect(metrics.governance_failures).toBe(1);
    expect(metrics.average_mission_score).toBeGreaterThan(0);
    expect(metrics.average_urgency_score).toBeGreaterThan(0);
  });
});
