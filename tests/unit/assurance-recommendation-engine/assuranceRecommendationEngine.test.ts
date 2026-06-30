import { describe, expect, it, vi } from "vitest";
import {
  certifyAssuranceRecommendation,
  computeAssuranceRecommendationHash,
  generateAssuranceRecommendation,
  getAssuranceRecommendationEngineContract,
  publishAssuranceRecommendation,
  replayAssuranceRecommendation,
  validateAssuranceRecommendation,
} from "@/services/assurance-recommendation-engine";
import type { AssuranceRecommendationScenario, AssuranceRecommendationType } from "@/types/assurance-recommendation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1E Assurance Recommendation Engine", () => {
  it("defines recommendation doctrine, lifecycle, types, severities, and restrictions", () => {
    const contract = getAssuranceRecommendationEngineContract();

    expect(contract.doctrine.engine_version).toBe("assurance-recommendation-engine/v8ALT.1E");
    expect(contract.doctrine.principles).toContain("deterministic");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.lifecycle).toEqual(["COLLECT_ASSURANCE_SIGNALS", "VALIDATE_INPUTS", "CLASSIFY_RECOMMENDATION", "EVALUATE_RISK_AND_SEVERITY", "MAP_GOVERNANCE_JUSTIFICATION", "MAP_CONSTITUTIONAL_REFERENCES", "GENERATE_ALTERNATIVES", "GENERATE_EXPLANATION", "VALIDATE_REPLAY", "PUBLISH_RECOMMENDATION"]);
    expect(contract.doctrine.recommendation_types).toContain("TERMINATE_RECOMMENDATION");
    expect(contract.doctrine.severity_levels).toEqual(["INFO", "LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]);
    expect(contract.doctrine.restrictions).toContain("cannot execute recommendations");
    expect(contract.doctrine.restrictions).toContain("cannot override the operator");
  });

  it.each([
    ["BASELINE", "CONTINUE"],
    ["EARLY_DEGRADATION", "MONITOR_CLOSELY"],
    ["HUMAN_JUDGMENT_REQUIRED", "OPERATOR_REVIEW"],
    ["MONITORING_INSUFFICIENT", "INCREASE_SUPERVISION"],
    ["PRESERVE_STATE", "CREATE_CHECKPOINT"],
    ["UNSAFE_CONTINUATION", "PAUSE"],
    ["KNOWN_GOOD_STATE_PREFERRED", "ROLLBACK"],
    ["GOVERNANCE_CONCERN", "GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_CONCERN", "CONSTITUTIONAL_REVIEW"],
    ["CRITICAL_FAILURE", "TERMINATE_RECOMMENDATION"],
  ] as readonly [AssuranceRecommendationScenario, AssuranceRecommendationType][])(
    "classifies %s as %s",
    (scenario, type) => {
      const record = generateAssuranceRecommendation({ scenario });
      const validation = validateAssuranceRecommendation(record);

      expect(record.recommendation_type).toBe(type);
      expect(record.reasoning.length).toBeGreaterThan(0);
      expect(record.evidence.length).toBeGreaterThan(0);
      expect(record.alternatives.some((item) => item.accepted && item.recommendation_type === type)).toBe(true);
      expect(record.governance_justification.length).toBeGreaterThan(0);
      expect(record.constitutional_references).toContain("operator supremacy preserved");
      expect(validation.valid).toBe(true);
    },
  );

  it("creates a fully explainable baseline recommendation and certification", () => {
    const record = generateAssuranceRecommendation();
    const validation = validateAssuranceRecommendation(record);
    const certification = certifyAssuranceRecommendation(record);

    expect(record.recommendation_type).toBe("CONTINUE");
    expect(record.recommendation_severity).toBe("INFO");
    expect(record.recommendation_state).toBe("CERTIFIED_ADVISORY");
    expect(record.operator_required).toBe(false);
    expect(record.explanation.summary).toContain("CONTINUE");
    expect(record.explanation.supporting_signals.length).toBe(3);
    expect(validation.valid).toBe(true);
    expect(certification.certified).toBe(true);
    expect(certification.ready_for_assurance_state_manager).toBe(true);
  });

  it("fails closed when evidence is missing", () => {
    const record = generateAssuranceRecommendation({ scenario: "MISSING_EVIDENCE" });
    const validation = validateAssuranceRecommendation(record);

    expect(record.recommendation_type).toBe("OPERATOR_REVIEW");
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain("MISSING_EVIDENCE");
  });

  it("fails closed on attempted execution authority", () => {
    const record = generateAssuranceRecommendation({ scenario: "EXECUTION_AUTHORITY_ATTEMPT" });
    const validation = validateAssuranceRecommendation(record);

    expect(record.execution_authorized).toBe(true);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain("UNAUTHORIZED_EXECUTION_CAPABILITY");
  });

  it("replays recommendations with identical type, severity, explanation, and integrity", () => {
    const first = generateAssuranceRecommendation({ scenario: "GOVERNANCE_CONCERN" });
    const second = generateAssuranceRecommendation({ scenario: "GOVERNANCE_CONCERN" });
    const replay = replayAssuranceRecommendation(first);

    expect(second.record_hash).toBe(first.record_hash);
    expect(first.record_hash).toBe(computeAssuranceRecommendationHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_type).toBe(first.recommendation_type);
    expect(replay.reconstructed_severity).toBe(first.recommendation_severity);
    expect(replay.reconstructed_explanation_hash).toBe(first.explanation.explanation_hash);
    expect(replay.reconstructed_integrity_hash).toBe(first.integrity_hash);
  });

  it("publishes advisory-only operator visible recommendations", () => {
    const surface = publishAssuranceRecommendation(generateAssuranceRecommendation({ scenario: "CRITICAL_FAILURE" }));

    expect(surface.recommendation_type).toBe("TERMINATE_RECOMMENDATION");
    expect(surface.recommendation_severity).toBe("CRITICAL");
    expect(surface.operator_required).toBe(true);
    expect(surface.summary).toContain("TERMINATE_RECOMMENDATION");
    expect(surface.advisory_only).toBe(true);
  });

  it("never mutates execution, governance, or operator authority in normal operation", () => {
    const record = generateAssuranceRecommendation({ scenario: "UNSAFE_CONTINUATION" });

    expect(record.advisory_only).toBe(true);
    expect(record.execution_authorized).toBe(false);
    expect(record.execution_modified).toBe(false);
    expect(record.governance_modified).toBe(false);
    expect(record.operator_overridden).toBe(false);
    expect(validateAssuranceRecommendation(record).advisory_only).toBe(true);
  });
});
