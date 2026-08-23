import type { TaxonomyExitGateInput } from "../../types/learning-constitution";
import type { Phase1FinalAcceptanceReport } from "../../types/learning-constitution/phase1FinalAcceptance";
import { renderCanonicalTaxonomyCategoryCardsMarkdown } from "./canonicalTaxonomyDocumentation";
import { segmentSemanticUnitsConservatively } from "./conservativeSemanticSegmenter";
import { evaluateTaxonomyExitGate } from "./taxonomyReleaseReadiness";

export const PHASE_1_FINAL_ACCEPTANCE_ID = "phase-1-final-acceptance" as const;

export const evaluatePhase1FinalAcceptance = (input: TaxonomyExitGateInput): Phase1FinalAcceptanceReport => {
  const taxonomyExitGate = evaluateTaxonomyExitGate(input);
  const segmented = segmentSemanticUnitsConservatively({
    source: { observationId: "phase-1-acceptance", sourceId: "acceptance-message", sourceType: "CONVERSATION", originatingActorId: "acceptance-user", observedAt: "2026-08-21T00:00:00.000Z" },
    content: "That's wrong.", context: { conversationId: "acceptance-conversation", precedingContextReferences: ["prior-statement"], followingContextReferences: ["next-statement"] },
  });
  const cards = renderCanonicalTaxonomyCategoryCardsMarkdown();
  const checks = [
    { checkId: "taxonomy-exit-gate", passed: taxonomyExitGate.passed, detail: "Registry, corpus, reference, regression, calibration, performance, and non-effect gates pass." },
    { checkId: "context-preservation", passed: segmented.context.sourceMessageId === "acceptance-message" && segmented.context.speakerId === "acceptance-user" && segmented.context.conversationId === "acceptance-conversation" && segmented.context.precedingContextReferences.length === 1 && segmented.context.followingContextReferences.length === 1, detail: "Semantic segmentation retains source, speaker, conversation, and neighboring-context references." },
    { checkId: "uniform-category-documentation", passed: ["CONVERSATION", "FEEDBACK"].every((category) => cards.includes(`Identifier: \`${category}\``)) && cards.includes("Test cases:"), detail: "Registry-derived category cards provide uniform complete documentation." },
    { checkId: "architectural-non-promotion", passed: segmented.persistenceEffect === "NONE" && segmented.authorityEffect === "UNCHANGED" && segmented.executionPermissionGranted === false, detail: "The end-to-end architectural outcome does not persist, authorize, or execute." },
  ] as const;
  return { phase: "PHASE_1", passed: checks.every((check) => check.passed), taxonomyExitGate, checks,
    architecturalOutcome: "SEMANTIC_UNITS_TO_CLASSIFICATION_RECORD_WITHOUT_LEARNING_SIDE_EFFECTS" };
};

export const assertPhase1FinalAcceptance = (input: TaxonomyExitGateInput): Phase1FinalAcceptanceReport => {
  const report = evaluatePhase1FinalAcceptance(input);
  if (!report.passed) throw new Error(`Phase 1 final acceptance failed: ${report.checks.filter((check) => !check.passed).map((check) => check.checkId).join(", ")}`);
  return report;
};
