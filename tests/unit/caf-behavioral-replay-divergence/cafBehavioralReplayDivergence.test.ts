import { describe, expect, it } from "vitest";
import {
  getBehavioralReplayDivergenceBundle,
  replayBehavioralReplayDivergence,
  runBehavioralReplayDivergence,
  validateBehavioralReplayDivergence,
} from "@/services/caf-behavioral-replay-divergence";
import type { BehavioralReplayDivergenceScenario } from "@/types/caf-behavioral-replay-divergence";

describe("Program 3 P3.11 Agent Behavioral Replay and Divergence Analysis", () => {
  it("publishes replay doctrine without implementing CCI replay infrastructure", () => {
    const bundle = getBehavioralReplayDivergenceBundle();

    expect(bundle.doctrine.version).toBe("caf-behavioral-replay-divergence/v3.11");
    expect(bundle.doctrine.owns_behavioral_replay_orchestration).toBe(true);
    expect(bundle.doctrine.owns_divergence_analysis).toBe(true);
    expect(bundle.doctrine.consumes_cci_replay).toBe(true);
    expect(bundle.doctrine.implements_replay_infrastructure).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("assembles deterministic replay context and produces replay evidence", () => {
    const first = runBehavioralReplayDivergence();
    const second = runBehavioralReplayDivergence();

    expect(first.cci_replay_ref).toBe("Program 2 - CCI Replay Infrastructure");
    expect(first.agent_identity_lifecycle_ref).toBe("caf-agent-identity-lifecycle/v3.1");
    expect(first.capability_composition_ref).toBe("caf-capability-composition/v3.2");
    expect(first.observability_telemetry_ref).toBe("caf-observability-telemetry/v3.10");
    expect(first.replay_context.consumes_cci_replay).toBe(true);
    expect(first.replay_context.duplicates_cci_replay).toBe(false);
    expect(first.reconstructed_behavior.single_interpretation).toBe(true);
    expect(first.comparison_result.valid).toBe(true);
    expect(first.divergence_analysis.divergence_types).toEqual(["NONE"]);
    expect(first.replay_evidence.complete).toBe(true);
    expect(first.replay_record.replay_status).toBe("COMPLETED");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateBehavioralReplayDivergence(first).valid).toBe(true);
    expect(replayBehavioralReplayDivergence(first)).toBe(true);
  });

  it("normalizes unknown divergence categories to unexplained", () => {
    const result = runBehavioralReplayDivergence({ scenario: "UNKNOWN_DIVERGENCE_NOT_UNEXPLAINED" });

    expect(result.divergence_analysis.divergence_types).toContain("UNEXPLAINED");
    expect(result.certification.outcome).toBe("FAIL");
  });

  it.each([
    "P3_1_AGENT_IDENTITY_INVALID",
    "P3_2_CAPABILITY_INVALID",
    "P3_3_RUNTIME_INVALID",
    "P3_4_MEMORY_INVALID",
    "P3_5_PLANNING_INVALID",
    "P3_6_COLLABORATION_INVALID",
    "P3_7_GOVERNANCE_INVALID",
    "P3_8_SAFETY_INVALID",
    "P3_9_INTERACTION_INVALID",
    "P3_10_OBSERVABILITY_INVALID",
    "CCI_REPLAY_NOT_CONSUMED",
    "CCI_REPLAY_DUPLICATED",
    "REPLAY_CONTEXT_NON_DETERMINISTIC",
    "REPLAY_CONTEXT_INCOMPLETE",
    "BEHAVIOR_RECONSTRUCTION_INCOMPLETE",
    "MULTIPLE_BEHAVIORAL_INTERPRETATIONS",
    "COMPARISON_ENGINE_INVALID",
    "DIVERGENCE_ANALYSIS_INCOMPLETE",
    "UNKNOWN_DIVERGENCE_NOT_UNEXPLAINED",
    "REPLAY_EVIDENCE_MISSING",
    "DIVERGENCE_REPORT_NON_REPRODUCIBLE",
    "REPLAY_LINEAGE_INCOMPLETE",
    "FAIL_CLOSED_NOT_ENFORCED",
  ] as const)("fails certification for %s", (scenario: BehavioralReplayDivergenceScenario) => {
    const result = runBehavioralReplayDivergence({ scenario });
    const validation = validateBehavioralReplayDivergence(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runBehavioralReplayDivergence({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
