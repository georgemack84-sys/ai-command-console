import { describe, expect, it } from "vitest";
import {
  buildConflictDetectionEngineObservability,
  compareCandidatePair,
  createConflictDetectionCandidate,
  detectDecisionCandidateConflicts,
  generateCandidateComparisonPairs,
  getConflictDetectionEngineFoundation,
  replayConflictDetectionEngine,
  scanConflictCandidates,
} from "@/services/decision-conflict-detection-engine";

describe("Mission Control Phase 9.6.2 Conflict Detection Engine", () => {
  it("scans candidates deterministically and generates stable same-tenant mission pairs", () => {
    const candidates = [
      createConflictDetectionCandidate({ candidate_id: "c_low", decision_priority: 10 }),
      createConflictDetectionCandidate({ candidate_id: "c_high", decision_priority: 90 }),
      createConflictDetectionCandidate({ candidate_id: "c_archived", status: "ARCHIVED" }),
      createConflictDetectionCandidate({ candidate_id: "c_other_tenant", tenant_id: "tenant_beta" }),
    ];
    const scanned = scanConflictCandidates({ candidates, tenant_id: "tenant_alpha", mission_id: "mission_conflict_detection" });
    const pairs = generateCandidateComparisonPairs(scanned);

    expect(scanned.map((candidate) => candidate.candidate_id)).toEqual(["c_high", "c_low"]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].left_candidate_id).toBe("c_high");
    expect(pairs[0].right_candidate_id).toBe("c_low");
  });

  it("detects duplicate recommendations and prevents duplicate conflict generation", () => {
    const first = createConflictDetectionCandidate({ candidate_id: "a", proposed_action: "reroute workload", evidence_refs: ["evidence_same"], governance_refs: ["governance_same"] });
    const second = createConflictDetectionCandidate({ candidate_id: "b", proposed_action: "reroute workload", evidence_refs: ["evidence_same"], governance_refs: ["governance_same"] });
    const result = detectDecisionCandidateConflicts({ candidates: [first, second] });

    expect(result.detection_status).toBe("PASS");
    expect(result.conflicts.map((conflict) => conflict.detection_rule_id)).toContain("duplicate_recommendation_rule");
    expect(new Set(result.conflicts.map((conflict) => conflict.conflict_id)).size).toBe(result.conflicts.length);
    expect(result.ledger_records).toHaveLength(result.conflicts.length);
  });

  it("detects action, policy, authority, evidence, recovery, timing, forecast, mission, and certification conflicts", () => {
    const left = createConflictDetectionCandidate({
      candidate_id: "left",
      decision_priority: 100,
      proposed_action: "shutdown subsystem",
      execution_path: "path_required",
      policy_refs: ["policy_allow_shutdown"],
      authority_refs: ["authority_ops"],
      evidence_assertions: ["cooling_true"],
      recovery_strategy: "rollback_required",
      timing_window: "window_same",
      forecast_outcome: "forecast_success_true",
      mission_objective: "objective_latency_required",
      certification_refs: ["certification_required"],
    });
    const right = createConflictDetectionCandidate({
      candidate_id: "right",
      decision_priority: 90,
      proposed_action: "continue subsystem",
      execution_path: "path_prohibited",
      policy_refs: ["policy_deny_shutdown"],
      authority_refs: ["authority_ops"],
      evidence_assertions: ["cooling_false"],
      recovery_strategy: "rollback_prohibited",
      timing_window: "window_same",
      forecast_outcome: "forecast_success_false",
      mission_objective: "objective_latency_prohibited",
      certification_refs: ["certification_prohibited"],
      certification_blockers: ["cert_blocked_dependency"],
    });

    const result = detectDecisionCandidateConflicts({ candidates: [left, right] });
    const rules = result.conflicts.map((conflict) => conflict.detection_rule_id);

    expect(result.detection_status).toBe("PASS");
    expect(rules).toContain("incompatible_action_rule");
    expect(rules).toContain("policy_contradiction_rule");
    expect(rules).toContain("authority_overlap_rule");
    expect(rules).toContain("conflicting_evidence_rule");
    expect(rules).toContain("recovery_conflict_rule");
    expect(rules).toContain("timing_collision_rule");
    expect(rules).toContain("forecast_divergence_rule");
    expect(rules).toContain("mission_objective_rule");
    expect(rules).toContain("certification_blocker_rule");
  });

  it("validates every detected conflict before writing immutable detection ledger records", () => {
    const result = detectDecisionCandidateConflicts();

    expect(result.detection_status).toBe("PASS");
    expect(result.validations.every((validation) => validation.validation_state === "VALID")).toBe(true);
    expect(result.ledger_records.every((record) => record.integrity_hash.match(/^[a-f0-9]{64}$/))).toBe(true);
    expect(result.ledger_records.every((record) => record.replay_ref.length > 0)).toBe(true);
  });

  it("replays candidate ordering, comparison pairs, signals, conflicts, and ledger records", () => {
    const result = detectDecisionCandidateConflicts();
    const replay = replayConflictDetectionEngine(result);
    const tampered = replayConflictDetectionEngine({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.candidate_order).toEqual(result.candidates_scanned.map((candidate) => candidate.candidate_id));
    expect(replay.conflict_refs).toEqual(result.conflicts.map((conflict) => conflict.conflict_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("ENGINE_REPLAY_MISMATCH");
  });

  it("fails closed for empty candidates, duplicate candidate ids, unauthorized components, and replay mismatches", () => {
    const empty = detectDecisionCandidateConflicts({ candidates: [] });
    const duplicate = detectDecisionCandidateConflicts({ candidates: [
      createConflictDetectionCandidate({ candidate_id: "same" }),
      createConflictDetectionCandidate({ candidate_id: "same" }),
    ] });
    const unauthorized = detectDecisionCandidateConflicts({ authorized_component: "unknown-component" });
    const valid = detectDecisionCandidateConflicts();
    const replayMismatch = detectDecisionCandidateConflicts({ replay_expected_hash: `${valid.replay_hash}_wrong` });

    expect(empty.detection_status).toBe("FAIL");
    expect(empty.failures).toContain("NO_CANDIDATES");
    expect(duplicate.failures).toContain("DUPLICATE_CANDIDATE_IDENTIFIER");
    expect(unauthorized.failures).toContain("UNAUTHORIZED_COMPONENT");
    expect(replayMismatch.failures).toContain("ENGINE_REPLAY_MISMATCH");
    expect(replayMismatch.fail_closed).toBe(true);
  });

  it("keeps pairwise comparison pure and deterministic for repeated inputs", () => {
    const candidates = [
      createConflictDetectionCandidate({ candidate_id: "a", proposed_action: "approve route", evidence_assertions: ["signal_true"] }),
      createConflictDetectionCandidate({ candidate_id: "b", proposed_action: "reject route", evidence_assertions: ["signal_false"] }),
    ];
    const pair = generateCandidateComparisonPairs(scanConflictCandidates({ candidates }))[0];
    const first = compareCandidatePair(pair, candidates);
    const second = compareCandidatePair(pair, candidates);

    expect(first).toEqual(second);
    expect(first.map((signal) => signal.rule_id)).toContain("incompatible_action_rule");
    expect(first.map((signal) => signal.rule_id)).toContain("conflicting_evidence_rule");
  });

  it("publishes engine foundation and observability metrics", () => {
    const foundation = getConflictDetectionEngineFoundation();
    const metrics = buildConflictDetectionEngineObservability(foundation.result);

    expect(foundation.engine_version).toBe("conflict-detection-engine/v1");
    expect(foundation.rules).toHaveLength(10);
    expect(foundation.result.detection_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
    expect(metrics.candidates_scanned).toBeGreaterThan(0);
    expect(metrics.conflicts_detected).toBe(foundation.result.conflicts.length);
    expect(metrics.replay_success_rate).toBe(1);
  });
});
