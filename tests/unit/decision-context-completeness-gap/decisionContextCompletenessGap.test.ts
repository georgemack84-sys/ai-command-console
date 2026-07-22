import { describe, expect, it } from "vitest";
import { createDecisionContext } from "@/services/decision-context-contract";
import {
  assessContextCompleteness,
  buildContextCompletenessObservability,
  createContextCompletenessGapRequest,
  getContextCompletenessGapEngine,
  replayContextCompleteness,
} from "@/services/decision-context-completeness-gap";
import { createHistoricalReplayContextRequest, resolveHistoricalReplayContext } from "@/services/decision-historical-replay-context";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.9 Context Completeness & Gap Analysis Engine", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("certifies complete contextual readiness deterministically", () => {
    const pkg = assessContextCompleteness();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.completeness.overall_completeness_score).toBe(1);
    expect(pkg.completeness.readiness_status).toBe("READY_FOR_ORCHESTRATION");
    expect(pkg.missing_context_registry.severity).toBe("LOW");
    expect(pkg.recommendations).toHaveLength(0);
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses immutable deterministic domain weights", () => {
    const engine = getContextCompletenessGapEngine();

    expect(engine.weights.evidence_context).toBe(0.15);
    expect(engine.weights.replay_context).toBe(0.025);
    expect(engine.assessment.domain_scores.mission_context).toBe(1);
    expect(engine.assessment.explainability.score_calculation).toContain("mission_context:1*0.1");
  });

  it("records documented conflicts without hiding them", () => {
    const pkg = assessContextCompleteness();

    expect(pkg.missing_context_registry.conflicting_context_items).toContain("conflicting_evidence_documented");
    expect(pkg.missing_context_registry.conflicting_context_items).toContain("policy_conflicts_documented");
    expect(pkg.validation.failure_reasons).not.toContain("CONFLICTING_CONTEXT_DETECTED");
  });

  it("fails closed when mandatory context is unavailable", () => {
    const candidate = normalizedCandidate();
    const decision_context = createDecisionContext({
      candidate,
      missing_context: ["forecast_context"],
      domain_overrides: {
        forecast_context: { status: "UNAVAILABLE", confidence: 0 },
      },
    });
    const pkg = assessContextCompleteness(createContextCompletenessGapRequest({ candidate, decision_context }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("MANDATORY_CONTEXT_UNAVAILABLE");
    expect(pkg.completeness.readiness_status).toBe("REQUIRES_CONTEXT_COMPLETION");
    expect(pkg.missing_context_registry.missing_context_items).toContain("forecast_context");
    expect(pkg.recommendations.some((item) => item.identified_gap === "forecast_context")).toBe(true);
  });

  it("fails closed when replay artifacts are unavailable", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["missing_replay_reference"] };
    const historical_replay_package = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate }));
    const pkg = assessContextCompleteness(createContextCompletenessGapRequest({ candidate, historical_replay_package }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_REPLAY");
    expect(pkg.validation.failure_reasons).toContain("REPLAY_ARTIFACTS_UNAVAILABLE");
    expect(pkg.missing_context_registry.unresolved_replay.length).toBeGreaterThan(0);
    expect(pkg.recommendations.some((item) => item.recommended_resolution.includes("Regenerate"))).toBe(true);
  });

  it("fails closed for cross-tenant context", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["replay_tenant_beta_history"] };
    const historical_replay_package = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate }));
    const pkg = assessContextCompleteness(createContextCompletenessGapRequest({ candidate, historical_replay_package }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_CONTEXT");
    expect(pkg.completeness.readiness_status).toBe("FAIL_CLOSED");
  });

  it("replays completeness assessment deterministically", () => {
    const pkg = assessContextCompleteness();
    const replay = replayContextCompleteness(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.reconstructed_score).toBe(1);
    expect(replay.failures).toEqual([]);
  });

  it("publishes completeness observability metrics", () => {
    const pass = assessContextCompleteness();
    const missing = assessContextCompleteness(createContextCompletenessGapRequest({
      candidate: normalizedCandidate(),
      decision_context: createDecisionContext({ candidate: normalizedCandidate(), missing_context: ["forecast_context"], domain_overrides: { forecast_context: { status: "UNAVAILABLE", confidence: 0 } } }),
    }));
    const replayGapCandidate = { ...normalizedCandidate(), replay_refs: ["missing_replay_reference"] };
    const replayGap = assessContextCompleteness(createContextCompletenessGapRequest({
      candidate: replayGapCandidate,
      historical_replay_package: resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate: replayGapCandidate })),
    }));

    const metrics = buildContextCompletenessObservability([pass, missing, replayGap]);

    expect(metrics.assessment_attempts).toBe(3);
    expect(metrics.successful_assessments).toBe(1);
    expect(metrics.failed_assessments).toBe(2);
    expect(metrics.average_completeness_score).toBeGreaterThan(0);
    expect(metrics.missing_context_failures).toBeGreaterThan(0);
    expect(metrics.replay_failures).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the context completeness gap engine package", () => {
    const engine = getContextCompletenessGapEngine();

    expect(engine.domain_order).toContain("replay_context");
    expect(engine.assessment.validation.validation_status).toBe("PASS");
    expect(engine.replay.replay_valid).toBe(true);
    expect(engine.observability.assessment_attempts).toBe(1);
  });
});
