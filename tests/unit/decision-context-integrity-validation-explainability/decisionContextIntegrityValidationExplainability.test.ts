import { describe, expect, it } from "vitest";
import { createDecisionContext } from "@/services/decision-context-contract";
import {
  buildContextIntegrityValidationObservability,
  createContextIntegrityValidationRequest,
  getContextIntegrityValidationExplainabilityFramework,
  replayContextIntegrityValidation,
  validateContextIntegrityExplainability,
} from "@/services/decision-context-integrity-validation-explainability";
import { assessContextCompleteness, createContextCompletenessGapRequest } from "@/services/decision-context-completeness-gap";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.10 Context Integrity, Validation & Explainability", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("certifies context integrity, validation, and explainability deterministically", () => {
    const report = validateContextIntegrityExplainability();

    expect(report.context_validation.validation_state).toBe("CERTIFIED");
    expect(report.failure_reasons).toEqual([]);
    expect(report.context_validation.schema_validation).toBe("PASS");
    expect(report.context_validation.integrity_validation).toBe("PASS");
    expect(report.context_validation.resolver_validation).toBe("PASS");
    expect(report.context_validation.attribution_validation).toBe("PASS");
    expect(report.context_validation.explainability_validation).toBe("PASS");
    expect(report.context_validation.replay_validation).toBe("PASS");
    expect(report.validation_evidence.certification_ready).toBe(true);
    expect(report.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical reports for identical inputs", () => {
    const request = createContextIntegrityValidationRequest();
    const first = validateContextIntegrityExplainability(request);
    const second = validateContextIntegrityExplainability(request);

    expect(second.context_integrity).toEqual(first.context_integrity);
    expect(second.context_explanation).toEqual(first.context_explanation);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("generates structured explanations from context metadata only", () => {
    const report = validateContextIntegrityExplainability();

    expect(report.context_explanation.mission_explanation).toContain("mission_context resolved by");
    expect(report.context_explanation.evidence_explanation).toContain("evidence=");
    expect(report.context_explanation.governance_explanation).toContain("governance=");
    expect(report.context_explanation.replay_explanation).toContain("replay=");
    expect(report.context_explanation.validation_summary).toContain("CERTIFIED");
  });

  it("fails when source attribution is incomplete", () => {
    const candidate = normalizedCandidate();
    const decision_context = createDecisionContext({
      candidate,
      domain_overrides: {
        evidence_context: { source_subsystem: "" },
      },
    });
    const report = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({ candidate, decision_context }));

    expect(report.context_validation.validation_state).toBe("REJECTED");
    expect(report.failure_reasons).toContain("SCHEMA_VALIDATION_FAILED");
    expect(report.failure_reasons).toContain("SOURCE_ATTRIBUTION_INCOMPLETE");
    expect(report.checks.source_attribution_complete).toBe(false);
  });

  it("fails closed when the context integrity hash is tampered", () => {
    const request = createContextIntegrityValidationRequest();
    const decision_context = { ...request.decision_context!, integrity_hash: "tampered" };
    const report = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({
      candidate: request.candidate,
      decision_context,
      completeness_package: request.completeness_package,
    }));

    expect(report.context_validation.validation_state).toBe("FAIL_CLOSED");
    expect(report.failure_reasons).toContain("INTEGRITY_HASH_MISMATCH");
    expect(report.checks.integrity_reproducible).toBe(false);
    expect(report.validation_evidence.certification_ready).toBe(false);
  });

  it("detects inconsistent resolver outputs from the completeness gate", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["missing_replay_reference"] };
    const completeness_package = assessContextCompleteness(createContextCompletenessGapRequest({ candidate }));
    const report = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({ candidate, completeness_package }));

    expect(report.context_validation.validation_state).toBe("REJECTED");
    expect(report.failure_reasons).toContain("RESOLVER_INCONSISTENCY_DETECTED");
    expect(report.checks.resolvers_consistent).toBe(false);
  });

  it("replays validation evidence deterministically", () => {
    const report = validateContextIntegrityExplainability();
    const replay = replayContextIntegrityValidation(report);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("CERTIFIED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes validation observability metrics", () => {
    const certified = validateContextIntegrityExplainability();
    const tamperedRequest = createContextIntegrityValidationRequest();
    const tampered = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({
      candidate: tamperedRequest.candidate,
      decision_context: { ...tamperedRequest.decision_context!, integrity_hash: "tampered" },
      completeness_package: tamperedRequest.completeness_package,
    }));
    const incompleteAttribution = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({
      candidate: normalizedCandidate(),
      decision_context: createDecisionContext({ candidate: normalizedCandidate(), domain_overrides: { evidence_context: { source_subsystem: "" } } }),
    }));

    const metrics = buildContextIntegrityValidationObservability([certified, tampered, incompleteAttribution]);

    expect(metrics.validation_attempts).toBe(3);
    expect(metrics.certified_contexts).toBe(1);
    expect(metrics.failed_contexts).toBe(2);
    expect(metrics.integrity_failures).toBeGreaterThan(0);
    expect(metrics.attribution_failures).toBeGreaterThan(0);
    expect(metrics.schema_failures).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the context integrity validation explainability framework", () => {
    const framework = getContextIntegrityValidationExplainabilityFramework();

    expect(framework.domain_order).toContain("replay_context");
    expect(framework.report.context_validation.validation_state).toBe("CERTIFIED");
    expect(framework.replay.replay_valid).toBe(true);
    expect(framework.observability.validation_attempts).toBe(1);
  });
});
