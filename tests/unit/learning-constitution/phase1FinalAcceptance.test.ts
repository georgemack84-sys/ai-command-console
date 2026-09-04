import { describe, expect, it } from "vitest";
import {
  ConservativeCanonicalSemanticUnitClassifier,
  assertPhase1FinalAcceptance,
  canonicalTaxonomyV1ExitGateInput,
  evaluateCanonicalClassifier,
  evaluatePhase1FinalAcceptance,
  measureCanonicalClassifierPerformance,
} from "../../../services/learning-constitution";

const classifier = new ConservativeCanonicalSemanticUnitClassifier();
const input = canonicalTaxonomyV1ExitGateInput(evaluateCanonicalClassifier(classifier), measureCanonicalClassifierPerformance(classifier));

describe("Phase 1 final acceptance", () => {
  it("proves the complete taxonomy boundary and architectural outcome", () => {
    const report = assertPhase1FinalAcceptance(input);
    expect(report).toMatchObject({ phase: "PHASE_1", passed: true, architecturalOutcome: "SEMANTIC_UNITS_TO_CLASSIFICATION_RECORD_WITHOUT_LEARNING_SIDE_EFFECTS" });
    expect(report.checks.every((check) => check.passed)).toBe(true);
  });

  it("fails closed when the underlying taxonomy exit gate regresses", () => {
    expect(evaluatePhase1FinalAcceptance({ ...input, renderedReference: "drift" }).passed).toBe(false);
  });
});
