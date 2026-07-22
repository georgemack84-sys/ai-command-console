import { describe, expect, it } from "vitest";

import { getReplayEngineBundle, replayReplayEngine, runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import type { ReplayEngineFailure } from "@/types/replay-engine";

const conditionalFailures = ["RUNTIME_REPLAY_MISSING", "DECISION_REPLAY_MISSING", "EXECUTION_CONTROL_REPLAY_MISSING", "DIVERGENCE_DETECTION_MISSING", "REPLAY_SERVICE_MISSING", "REPLAY_API_MISSING", "TIMELINE_API_MISSING", "DIVERGENCE_API_MISSING", "REPLAY_EXPLORER_MISSING", "REPLAY_REPORTS_MISSING", "REPLAY_EVIDENCE_MISSING"] as const satisfies readonly ReplayEngineFailure[];
const failClosedFailures = ["W2_9_MEMORY_ENGINE_INVALID", "W2_10_RUNTIME_ORCHESTRATOR_INVALID", "W2_11_DELEGATION_ENGINE_INVALID", "W2_12_COLLABORATION_ENGINE_INVALID", "W2_13_EVIDENCE_ENGINE_INVALID", "RUNTIME_REPLAY_NON_DETERMINISTIC", "RUNTIME_STATE_RECONSTRUCTION_FAILED", "TIMELINE_RECONSTRUCTION_FAILED", "DECISION_REPLAY_INACCURATE", "AUTHORITY_POLICY_SAFETY_REPLAY_FAILED", "CHECKPOINT_REPLAY_FAILED", "RECOVERY_REPLAY_FAILED", "LIFECYCLE_REPLAY_FAILED", "DIVERGENCE_UNDETECTED", "ROOT_CAUSE_ATTRIBUTION_MISSING", "REPLAY_CONFIDENCE_MISSING", "REPLAY_REPORT_NOT_SIGNED", "REPLAY_REPORT_NOT_IMMUTABLE", "TENANT_ISOLATION_FAILED", "REPLAY_AUTHORIZATION_MISSING", "EVIDENCE_INTEGRITY_BYPASSED", "REPLAY_AUDIT_LOGGING_MISSING", "REPLAY_EVIDENCE_NOT_PUBLISHED", "REPLAY_EVIDENCE_NOT_IMMUTABLE"] as const satisfies readonly ReplayEngineFailure[];

describe("Replay Engine W2.14", () => {
  it("publishes the W2.14 replay doctrine and qualification bundle", () => {
    const bundle = getReplayEngineBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "replay-engine/w2.14",
      owns_runtime_replay: true,
      owns_decision_replay: true,
      owns_execution_control_replay: true,
      owns_divergence_detection: true,
      owns_replay_apis: true,
      owns_replay_explorer: true,
      owns_replay_reports: true,
      owns_replay_security: true,
      owns_replay_evidence: true,
      verification_not_execution: true,
      qualification_gate: "Replay Engine Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("REPLAY_ENGINE_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic replay to W2.9 through W2.13", () => {
    const first = runReplayEngine();
    const second = runReplayEngine();

    expect(first.evidence_engine_ref).toBe("evidence-engine/w2.13");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateReplayEngine(first).valid).toBe(true);
    expect(replayReplayEngine(first)).toBe(true);
  });

  it("reconstructs runtime, decisions, and execution control deterministically", () => {
    const result = runReplayEngine();

    expect(result.runtime_replay).toMatchObject({ snapshot_loader: true, timeline_builder: true, context_restoration: true, state_reconstruction: true, event_replay_engine: true, runtime_validation: true, time_navigation: true, complete_execution_reconstruction: true, deterministic_restoration: true });
    expect(result.decision_replay).toMatchObject({ planning_replay: true, memory_retrieval_replay: true, tool_invocation_replay: true, policy_decision_replay: true, safety_decision_replay: true, authority_decision_replay: true, delegation_replay: true, collaboration_replay: true, accurate_reconstruction: true });
    expect(result.execution_control).toMatchObject({ task_replay: true, workflow_replay: true, checkpoint_replay: true, recovery_replay: true, suspension_replay: true, resume_replay: true, failure_replay: true, retry_replay: true, lifecycle_reconstruction: true, orchestration_replay: true });
  });

  it("detects divergence and exposes secure replay artifacts", () => {
    const result = runReplayEngine();

    expect(result.divergence_detection).toMatchObject({ timeline_comparison: true, decision_comparison: true, memory_comparison: true, tool_output_comparison: true, runtime_state_comparison: true, event_comparison: true, evidence_comparison: true, drift_identification: true, replay_confidence: true, deterministic_validation: true, root_cause_attribution: true });
    expect(result.apis.start_replay).toBe(true);
    expect(result.explorer.divergence_visualization).toBe(true);
    expect(result.reports).toMatchObject({ replay_reports: true, divergence_reports: true, deterministic_verification_reports: true, signed: true, immutable: true, certification_reports: true });
    expect(result.security).toMatchObject({ tenant_isolation: true, authority_validation: true, evidence_integrity: true, replay_authorization: true, audit_logging: true });
    expect(result.evidence.published_to_evidence_service).toBe(true);
    expect(result.readiness.no_unexplained_divergence).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runReplayEngine({ scenario: failure });
    const validation = validateReplayEngine(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runReplayEngine({ scenario: failure });
    const validation = validateReplayEngine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit qualification failure as not qualified", () => {
    const result = runReplayEngine({ scenario: "REPLAY_ENGINE_QUALIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateReplayEngine(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runReplayEngine({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runReplayEngine({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
