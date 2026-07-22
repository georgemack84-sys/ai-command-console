import { describe, expect, it } from "vitest";
import {
  buildRiskConfidenceObservability,
  createRiskConfidenceContextRequest,
  getRiskConfidenceContextResolver,
  replayRiskConfidenceContext,
  resolveRiskConfidenceContext,
} from "@/services/decision-risk-confidence-context";
import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.5 Risk & Confidence Context Resolver", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("resolves deterministic risk and confidence context", () => {
    const pkg = resolveRiskConfidenceContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.risk_context.active_risks.length).toBeGreaterThan(0);
    expect(pkg.risk_context.residual_risks.length).toBe(pkg.risk_context.active_risks.length);
    expect(pkg.risk_context.mitigation_status.length).toBe(pkg.risk_context.active_risks.length);
    expect(pkg.risk_context.risk_severity).toBe("Moderate");
    expect(pkg.risk_context.risk_exposure).toBeGreaterThan(0);
    expect(pkg.confidence_context.confidence_level).toBe("High");
    expect(pkg.confidence_context.confidence_calibration.calibration_model).toBe("decision-confidence-calibration/v1");
    expect(pkg.risk_domain.domain_name).toBe("risk_context");
    expect(pkg.confidence_domain.domain_name).toBe("confidence_context");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical packages for identical inputs", () => {
    const request = createRiskConfidenceContextRequest();
    const first = resolveRiskConfidenceContext(request);
    const second = resolveRiskConfidenceContext(request);

    expect(second.risk_context).toEqual(first.risk_context);
    expect(second.confidence_context).toEqual(first.confidence_context);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("applies deterministic confidence calibration without hidden adjustment", () => {
    const pkg = resolveRiskConfidenceContext();

    expect(pkg.confidence_context.confidence_calibration.baseline_confidence).toBe(0.94);
    expect(pkg.confidence_context.confidence_calibration.adjustments).toEqual(["risk_exposure_adjustment_-0.08", "dependency_waiting_adjustment_-0.05"]);
    expect(pkg.confidence_context.confidence_calibration.calibrated_confidence).toBe(0.81);
    expect(pkg.confidence_context.explainability.calibration_adjustments).toEqual(pkg.confidence_context.confidence_calibration.adjustments);
  });

  it("documents uncertainty factors", () => {
    const pkg = resolveRiskConfidenceContext();

    expect(pkg.confidence_context.uncertainty_analysis.dependency_uncertainty).toContain("prerequisite_pending");
    expect(pkg.confidence_context.uncertainty_analysis.operational_variability).toContain("runtime_watch_variability");
    expect(pkg.confidence_context.uncertainty_analysis.model_limitations).toContain("calibration_model_v1_static_thresholds");
    expect(pkg.confidence_context.uncertainty_analysis.uncertainty_score).toBeGreaterThan(0);
  });

  it("can patch the 9.3.1 risk and confidence domains", () => {
    const candidate = normalizedCandidate();
    const pkg = resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate }));
    const context = createDecisionContext({
      candidate,
      domain_overrides: {
        risk_context: pkg.risk_domain,
        confidence_context: pkg.confidence_domain,
      },
    });

    expect(context.risk_context.originating_record).toBe(pkg.risk_domain.originating_record);
    expect(context.confidence_context.originating_record).toBe(pkg.confidence_domain.originating_record);
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it("fails closed when no active risks can be resolved", () => {
    const candidate = { ...normalizedCandidate(), mission_id: "mission_without_risks" };
    const pkg = resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("ACTIVE_RISKS_UNRESOLVED");
    expect(pkg.validation.checks.active_risks_identified).toBe(false);
  });

  it("fails closed for cross-tenant risk references", () => {
    const candidate = { ...normalizedCandidate(), risk_refs: ["risk_tenant_beta_mission_phase_9_external"] };
    const pkg = resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_RISK_REFERENCE");
    expect(pkg.validation.checks.tenant_isolated).toBe(false);
  });

  it("fails closed when upstream evidence replay is incompatible", () => {
    const candidate = { ...normalizedCandidate(), evidence_refs: ["missing"] };
    const pkg = resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("REPLAY_INCOMPATIBLE");
    expect(pkg.validation.checks.replay_compatible).toBe(false);
  });

  it("replays risk and confidence context deterministically", () => {
    const pkg = resolveRiskConfidenceContext();
    const replay = replayRiskConfidenceContext(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes resolver observability metrics", () => {
    const pass = resolveRiskConfidenceContext();
    const noRisks = resolveRiskConfidenceContext(createRiskConfidenceContextRequest({
      candidate: { ...normalizedCandidate(), mission_id: "mission_without_risks" },
    }));
    const crossTenant = resolveRiskConfidenceContext(createRiskConfidenceContextRequest({
      candidate: { ...normalizedCandidate(), risk_refs: ["risk_tenant_beta_mission_phase_9_external"] },
    }));

    const metrics = buildRiskConfidenceObservability([pass, noRisks, crossTenant]);

    expect(metrics.resolution_attempts).toBe(3);
    expect(metrics.successful_resolutions).toBe(1);
    expect(metrics.failed_resolutions).toBe(2);
    expect(metrics.risk_failures).toBeGreaterThan(0);
    expect(metrics.isolation_failures).toBeGreaterThan(0);
    expect(metrics.average_risk_exposure).toBeGreaterThan(0);
    expect(metrics.average_calibrated_confidence).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the risk confidence resolver package", () => {
    const resolver = getRiskConfidenceContextResolver();

    expect(resolver.resolution_order).toContain("CALIBRATION_APPLIED");
    expect(resolver.context_package.validation.validation_status).toBe("PASS");
    expect(resolver.replay.replay_valid).toBe(true);
    expect(resolver.observability.resolution_attempts).toBe(1);
  });
});
