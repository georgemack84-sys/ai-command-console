import { describe, expect, it } from "vitest";
import {
  detectReplayDrift,
  getReplayDriftFoundation,
  replayReplayDriftDetection,
} from "@/services/replay-drift-detection";
import type {
  ReplayDriftFailure,
  ReplayDriftScenario,
  ReplayDriftStatus,
} from "@/types/replay-drift-detection";

describe("Mission Control Phase 10.12.9 Replay Drift Detection", () => {
  it("publishes the replay drift detection contract", () => {
    const foundation = getReplayDriftFoundation();

    expect(foundation.replay_drift_detection_version).toBe("replay-drift-detection/v1");
    expect(foundation.api_surface.detect_replay_drift).toBe("POST /replay-drift-detection/detect");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /replay-drift-detection/baseline");
    expect(foundation.api_surface.retrieve_consistency).toBe("POST /replay-drift-detection/consistency");
    expect(foundation.api_surface.retrieve_behavioral).toBe("POST /replay-drift-detection/behavioral");
    expect(foundation.api_surface.retrieve_reconstruction).toBe("POST /replay-drift-detection/reconstruction");
    expect(foundation.api_surface.retrieve_determinism).toBe("POST /replay-drift-detection/determinism");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /replay-drift-detection/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.replay_change_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.detection_identifier).toBe("ReplayDriftDetection");
    expect(foundation.result.status).toBe("PASS");
  });

  it("detects deterministically with stable replay and integrity hashes", () => {
    const first = detectReplayDrift();
    const second = detectReplayDrift();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.consistency_report.integrity_hash).toBe(second.consistency_report.integrity_hash);
    expect(first.behavioral_report.integrity_hash).toBe(second.behavioral_report.integrity_hash);
    expect(first.reconstruction_report.integrity_hash).toBe(second.reconstruction_report.integrity_hash);
    expect(first.determinism_report.integrity_hash).toBe(second.determinism_report.integrity_hash);
    expect(first.stability_report.integrity_hash).toBe(second.stability_report.integrity_hash);
    expect(first.integrity_assessment.integrity_hash).toBe(second.integrity_assessment.integrity_hash);
    expect(first.timeline.integrity_hash).toBe(second.timeline.integrity_hash);
    expect(first.drift_record.integrity_hash).toBe(second.drift_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayReplayDriftDetection(first)).toBe(true);
  });

  it("maintains the authoritative replay baseline", () => {
    const baseline = detectReplayDrift().baseline;

    expect(baseline.baseline_id).toBe("replay_drift_baseline_v1");
    expect(baseline.replay_version).toBe("replay-policy/v1");
    expect(baseline.deterministic_rules).toEqual(expect.arrayContaining(["identical_inputs_identical_outputs", "stable_ordering_required"]));
    expect(baseline.reconstruction_requirements).toEqual(expect.arrayContaining(["event_reconstruction_required", "ledger_reconstruction_required"]));
    expect(baseline.validation_policies).toContain("pre_production_replay_validation");
    expect(baseline.governance_requirements).toContain("governance_review_for_replay_change");
    expect(baseline.constitutional_requirements).toContain("replayability_nonnegotiable");
    expect(baseline.certification_requirements).toContain("certification_before_replay_recovery");
    expect(baseline.approval_reference).toBe("governance-approval:replay-drift-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("produces baseline replay stability, assessment, timeline, and ledger evidence", () => {
    const result = detectReplayDrift();

    expect(result.consistency_report.replay_difference_summary).toBe("No replay differences detected.");
    expect(result.behavioral_report.decision_variance_analysis).toContain("matches");
    expect(result.reconstruction_report.reconstruction_integrity_summary).toContain("complete");
    expect(result.determinism_report.execution_stability_analysis).toContain("preserved");
    expect(result.stability_report.replay_integrity_score).toBe(0.98);
    expect(result.stability_report.replay_drift_score).toBe(0.02);
    expect(result.integrity_assessment.drift_detected).toBe(false);
    expect(result.integrity_assessment.containment_actions).toEqual(["monitor_replay_integrity"]);
    expect(result.timeline.replay_drift_events).toEqual([]);
    expect(result.drift_record.drift_id).toMatch(/^replay_drift_/);
    expect(result.drift_record.replay_version).toBe("replay-policy/v1");
    expect(result.drift_record.drift_category).toBe("NO_REPLAY_DRIFT");
    expect(result.drift_record.severity).toBe("INFORMATIONAL");
    expect(result.drift_record.recommended_response).toBe("MONITOR");
    expect(result.drift_record.containment_required).toBe(false);
    expect(result.drift_record.replay_refs).toContain("replay:replay-drift-detection");
    expect(result.drift_record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("enforces invariant guarantees without mutating production behavior", () => {
    const result = detectReplayDrift();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.certification_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_replay_change).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_REPLAY_CHANGE", "UNAUTHORIZED_REPLAY_CHANGE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED", "CONTAINED"],
    ["BEHAVIORAL_INCONSISTENCY", "BEHAVIORAL_INCONSISTENCY_DETECTED", "DRIFT_DETECTED"],
    ["REPLAY_INSTABILITY", "REPLAY_INSTABILITY_DETECTED", "DRIFT_DETECTED"],
    ["DETERMINISTIC_FAILURE", "DETERMINISTIC_FAILURE_DETECTED", "CONTAINED"],
    ["RECONSTRUCTION_MISMATCH", "RECONSTRUCTION_MISMATCH_DETECTED", "CONTAINED"],
    ["ADAPTATION_INDUCED_CHANGE", "ADAPTATION_INDUCED_REPLAY_CHANGE", "DRIFT_DETECTED"],
    ["INCONSISTENT_OUTPUTS", "INCONSISTENT_REPLAY_OUTPUTS", "DRIFT_DETECTED"],
    ["SEQUENCING_DRIFT", "REPLAY_SEQUENCING_DRIFT", "DRIFT_DETECTED"],
    ["DEPENDENCY_DRIFT", "REPLAY_DEPENDENCY_DRIFT", "DRIFT_DETECTED"],
    ["STATE_CORRUPTION", "REPLAY_STATE_CORRUPTION", "FAIL_CLOSED"],
    ["RECOMMENDATION_VARIANCE", "RECOMMENDATION_VARIANCE", "DRIFT_DETECTED"],
    ["GOVERNANCE_VARIANCE", "GOVERNANCE_VARIANCE", "DRIFT_DETECTED"],
    ["DECISION_PATH_DEVIATION", "DECISION_PATH_DEVIATION", "DRIFT_DETECTED"],
    ["EXECUTION_INCONSISTENCY", "EXECUTION_INCONSISTENCY", "DRIFT_DETECTED"],
    ["MISSING_EVENTS", "MISSING_REPLAY_EVENTS", "DRIFT_DETECTED"],
    ["INCOMPLETE_LINEAGE", "INCOMPLETE_REPLAY_LINEAGE", "CONTAINED"],
    ["RECONSTRUCTION_CORRUPTION", "RECONSTRUCTION_CORRUPTION", "CONTAINED"],
    ["TIMELINE_INCONSISTENCY", "TIMELINE_INCONSISTENCY", "DRIFT_DETECTED"],
    ["NONDETERMINISTIC_EXECUTION", "NONDETERMINISTIC_EXECUTION", "CONTAINED"],
    ["INCONSISTENT_STATE_TRANSITIONS", "INCONSISTENT_STATE_TRANSITIONS", "DRIFT_DETECTED"],
    ["DEPENDENCY_INDUCED_DRIFT", "DEPENDENCY_INDUCED_DRIFT", "DRIFT_DETECTED"],
    ["ARTIFACT_INCONSISTENCY", "REPLAY_ARTIFACT_INCONSISTENCY", "DRIFT_DETECTED"],
    ["ADAPTIVE_REPLAY_DEGRADATION", "ADAPTIVE_REPLAY_DEGRADATION", "CONTAINED"],
    ["NONREPLAYABLE_ASSESSMENT", "NONREPLAYABLE_DRIFT_ASSESSMENT", "DRIFT_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_REPLAY_BEHAVIOR", "FAIL_CLOSED"],
  ] as readonly [ReplayDriftScenario, ReplayDriftFailure, ReplayDriftStatus][])(
    "maps %s to %s with %s status",
    (scenario, failure, status) => {
      const result = detectReplayDrift({ scenario });

      expect(result.failures).toContain(failure);
      expect(result.status).toBe(status);
      expect(result.integrity_assessment.detected_behaviors).toContain(failure);
      expect(result.drift_record.drift_category).toBe(failure);
      expect(replayReplayDriftDetection(result)).toBe(true);
    },
  );

  it("automatically contains replay divergence and deterministic failures", () => {
    const divergence = detectReplayDrift({ scenario: "REPLAY_DIVERGENCE" });
    const deterministic = detectReplayDrift({ scenario: "DETERMINISTIC_FAILURE" });

    expect(divergence.consistency_report.detected_differences).toContain("REPLAY_DIVERGENCE_DETECTED");
    expect(divergence.integrity_assessment.containment_actions).toContain("suppress_replay_divergent_adaptation");
    expect(divergence.integrity_assessment.containment_actions).toContain("require_deterministic_replay_validation");
    expect(divergence.drift_record.recommended_response).toBe("SUPPRESS_ADAPTATION");
    expect(deterministic.determinism_report.deterministic_failures).toContain("DETERMINISTIC_FAILURE_DETECTED");
    expect(deterministic.drift_record.containment_required).toBe(true);
  });

  it("flags reconstruction, governance, certification, and replayability degradation", () => {
    const reconstruction = detectReplayDrift({ scenario: "RECONSTRUCTION_MISMATCH" });
    const governance = detectReplayDrift({ scenario: "GOVERNANCE_VARIANCE" });
    const adaptive = detectReplayDrift({ scenario: "ADAPTIVE_REPLAY_DEGRADATION" });
    const nonreplayable = detectReplayDrift({ scenario: "NONREPLAYABLE_ASSESSMENT" });

    expect(reconstruction.reconstruction_report.reconstruction_failures).toContain("RECONSTRUCTION_MISMATCH_DETECTED");
    expect(reconstruction.certification_preserved).toBe(false);
    expect(governance.governance_preserved).toBe(false);
    expect(adaptive.certification_preserved).toBe(false);
    expect(nonreplayable.replayable).toBe(false);
    expect(nonreplayable.evidence_backed).toBe(false);
  });

  it("fails replay when replay drift evidence is tampered", () => {
    const result = detectReplayDrift({ scenario: "REPLAY_DIVERGENCE" });
    const tampered = {
      ...result,
      integrity_assessment: {
        ...result.integrity_assessment,
        containment_actions: ["allow_replay_drift"],
      },
    };

    expect(replayReplayDriftDetection(result)).toBe(true);
    expect(replayReplayDriftDetection(tampered)).toBe(false);
  });
});
