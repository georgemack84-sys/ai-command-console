import { describe, expect, it } from "vitest";
import {
  buildAssessmentReplayObservabilitySurface,
  getAssessmentReplayExplainabilityBundle,
  getReplayAuditReport,
  getReplayCertificationPackage,
  getReplayExplanations,
  replayAssessmentWithExplainability,
  validateAssessmentReplayExplainability,
} from "@/services/assessment-replay-explainability";
import type { AssessmentReplayFailure, AssessmentReplayScenario } from "@/types/assessment-replay-explainability";

describe("assessment replay explainability", () => {
  it("publishes deterministic read-only replay bundle", () => {
    const bundle = getAssessmentReplayExplainabilityBundle();

    expect(bundle.doctrine.engine_version).toBe("assessment-replay-explainability/v8ALT.11.10");
    expect(bundle.doctrine.final_state).toBe("ASSESSMENT_REPLAY_EXPLAINABILITY_READY");
    expect(bundle.repository.final_state).toBe("ASSESSMENT_REPLAY_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.read_only).toBe(true);
    expect(bundle.repository.record_modification_authorized).toBe(false);
    expect(bundle.repository.replay_mutation_authorized).toBe(false);
  });

  it("replays assessment outputs and produces complete explanations", () => {
    const repository = replayAssessmentWithExplainability();

    expect(repository.replay.replay_state).toBe("MATCHED");
    expect(repository.replay.original_score).toBe(repository.replay.replayed_score);
    expect(repository.replay.original_maturity_level).toBe(repository.replay.replayed_maturity_level);
    expect(repository.divergences.every((finding) => !finding.detected)).toBe(true);
    expect(repository.explanations).toHaveLength(10);
    expect(repository.explanations.every((entry) => entry.complete && entry.evidence_references.length > 0)).toBe(true);
    expect(repository.audit_report.evidence_reconstruction_status).toBe("PASS");
    expect(repository.certification_package.certification_ready).toBe(true);
  });

  it("keeps replay deterministic and exposes slices", () => {
    const first = replayAssessmentWithExplainability();
    const second = replayAssessmentWithExplainability();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.audit_report.integrity_hash).toBe(first.audit_report.integrity_hash);
    expect(getReplayExplanations()).toHaveLength(10);
    expect(getReplayAuditReport().replay_status).toBe("MATCHED");
    expect(getReplayCertificationPackage().divergence_count).toBe(0);
  });

  it.each([
    ["REPLAY_OUTPUT_DIVERGENCE", "REPLAY_OUTPUT_DIVERGED"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["EVIDENCE_INTEGRITY_FAILURE", "EVIDENCE_INTEGRITY_FAILED"],
    ["SCORING_VERSION_UNAVAILABLE", "SCORING_VERSION_UNAVAILABLE"],
    ["CLASSIFICATION_RULES_UNAVAILABLE", "CLASSIFICATION_RULES_UNAVAILABLE"],
    ["RECOMMENDATION_RULES_UNAVAILABLE", "RECOMMENDATION_RULES_UNAVAILABLE"],
    ["MISSING_GOVERNANCE_EVIDENCE", "GOVERNANCE_EVIDENCE_MISSING"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "CONSTITUTIONAL_EVIDENCE_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["HIDDEN_ASSESSMENT_LOGIC", "HIDDEN_ASSESSMENT_LOGIC_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_MODIFICATION_ATTEMPT", "REPLAY_MODIFICATION_ATTEMPTED"],
  ] satisfies [AssessmentReplayScenario, AssessmentReplayFailure][])("invalidates %s", (scenario, failure) => {
    const repository = replayAssessmentWithExplainability({ scenario });
    const validation = validateAssessmentReplayExplainability(repository);

    expect(repository.final_state).toBe("ASSESSMENT_REPLAY_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.record_modification_authorized).toBe(false);
    expect(repository.replay_mutation_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateAssessmentReplayExplainability(replayAssessmentWithExplainability({ scenario: "REPLAY_OUTPUT_DIVERGENCE" })).replay_output_matched).toBe(false);
    expect(validateAssessmentReplayExplainability(replayAssessmentWithExplainability({ scenario: "MISSING_EVIDENCE" })).evidence_present).toBe(false);
    expect(validateAssessmentReplayExplainability(replayAssessmentWithExplainability({ scenario: "SCORING_VERSION_UNAVAILABLE" })).scoring_version_available).toBe(false);
    expect(validateAssessmentReplayExplainability(replayAssessmentWithExplainability({ scenario: "CLASSIFICATION_RULES_UNAVAILABLE" })).classification_rules_available).toBe(false);
    expect(validateAssessmentReplayExplainability(replayAssessmentWithExplainability({ scenario: "RECOMMENDATION_RULES_UNAVAILABLE" })).recommendation_rules_available).toBe(false);
    expect(validateAssessmentReplayExplainability(replayAssessmentWithExplainability({ scenario: "BROKEN_LINEAGE" })).lineage_intact).toBe(false);
    expect(validateAssessmentReplayExplainability(replayAssessmentWithExplainability({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes replay observability without record mutation authority", () => {
    const surface = buildAssessmentReplayObservabilitySurface(replayAssessmentWithExplainability({ scenario: "REPLAY_OUTPUT_DIVERGENCE" }));

    expect(surface.final_state).toBe("ASSESSMENT_REPLAY_FAILED");
    expect(surface.replay_state).toBe("DIVERGED");
    expect(surface.divergence_count).toBeGreaterThan(0);
    expect(surface.explanation_count).toBe(10);
    expect(surface.read_only).toBe(true);
    expect(surface.record_modification_authorized).toBe(false);
  });
});
